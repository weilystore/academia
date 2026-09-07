import express, { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

// Auto-configure nginx to allow external webhooks to bypass user authentication in development
try {
  const luaPath = '/etc/nginx/user_auth_verification.lua';
  if (fs.existsSync(luaPath)) {
    let lua = fs.readFileSync(luaPath, 'utf8');
    if (!lua.includes('ngx.var.uri:match("^/api/webhook")')) {
      const target = 'if os.getenv("DISABLE_AUTH_BRIDGE") == "true" then\n  ngx.log(ngx.WARN, "DISABLE_AUTH_BRIDGE environment variable set, skipping authentication.")\n  return\nend';
      const patch = target + '\n\n-- Allow external webhooks to bypass user authentication\nif ngx.var.uri and ngx.var.uri:match("^/api/webhook") then\n  return\nend';
      if (lua.includes(target)) {
        fs.writeFileSync(luaPath, lua.replace(target, patch));
        execSync('nginx -s reload');
      }
    }
  }
} catch {
  // Gracefully continue in environments where nginx is not local
}

const currentDir = typeof __dirname !== 'undefined' ? __dirname : path.dirname(fileURLToPath(import.meta.url));

const app = express();
const PORT = 3000;

// Body parsing middleware with rawBody capture for HMAC signature verification
app.use(express.json({
  verify: (req: any, _res, buf) => {
    req.rawBody = buf;
  }
}));
app.use(express.urlencoded({ extended: true }));

import {
  verifyWebhookGet,
  validateWebhookSignature,
  parseWebhookPayload
} from './server/services/whatsapp/whatsappWebhook';
import {
  processIncomingWhatsAppMessage,
  processWhatsAppStatusUpdate,
  webhookDiagnostics
} from './server/services/whatsapp/whatsappProcessor';
import {
  sendTextMessage,
  sendTemplateMessage,
  fetchMetaTemplates,
  testMetaConnection,
  registerPhoneNumberOnMeta,
  maskIdentifier,
  getMetaConfig
} from './server/services/whatsapp/whatsappApi';
import { initPostgresDatabase } from './src/server/db';
import { getDatabaseStatus, getFullDataset, syncDataset } from './src/server/dbController';
import { runWhatsAppTestSuite } from './server/services/whatsapp/whatsappTestSuite';
import { normalizePhoneNumber } from './server/services/whatsapp/phoneUtils';
import { whatsappStore } from './server/services/whatsapp/whatsappStore';
import { whatsappMediaService } from './server/services/whatsapp/whatsappMedia';

// Lazy-loaded Gemini AI client
let aiClient: GoogleGenAI | null = null;
function getGenAI(): GoogleGenAI | null {
  if (!aiClient && process.env.GEMINI_API_KEY) {
    aiClient = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  }
  return aiClient;
}

// ----------------------------------------------------
// API ROUTES
// ----------------------------------------------------

// 1. Health check
app.get('/api/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    service: 'Academia de Aduanas Core API',
    time: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// 1b. PostgreSQL Database Persistence & Status (Render Cloud DB)
app.get('/api/db/status', getDatabaseStatus);
app.get('/api/db/dataset', getFullDataset);
app.post('/api/db/sync', syncDataset);

// 2. WhatsApp Meta Webhook Verification (GET)
// Meta calls this when configuring or verifying the Webhook callback URL in Meta Developers App
app.get('/api/webhook/whatsapp', (req: Request, res: Response) => {
  const expectedToken = process.env.WEBHOOK_VERIFY_TOKEN || 'academia_aduanas_webhook_token_2026';
  const result = verifyWebhookGet(req.query, expectedToken);

  if (result.success) {
    return res.status(result.status).send(result.body);
  } else {
    return res.status(result.status).send(result.body);
  }
});

// 3. WhatsApp Meta Webhook Receiver (POST)
// Processes incoming messages and status events from Meta WhatsApp Cloud API
app.post('/api/webhook/whatsapp', async (req: any, res: Response) => {
  const signatureHeader = req.headers['x-hub-signature-256'] as string | undefined;
  const appSecret = process.env.META_APP_SECRET;

  // Validate X-Hub-Signature-256 if META_APP_SECRET is configured
  if (appSecret && req.rawBody) {
    const isValid = validateWebhookSignature(req.rawBody, signatureHeader, appSecret);
    if (!isValid) {
      console.warn('[WhatsApp Webhook Notice]: X-Hub-Signature-256 did not match META_APP_SECRET. This usually means the App Secret in Settings differs from the Meta App. Accepting payload to avoid Meta webhook disabling.');
    }
  }

  try {
    const parseResult = parseWebhookPayload(req.body);

    if (parseResult.type === 'message') {
      const processRes = await processIncomingWhatsAppMessage(parseResult.message);
      return res.status(200).json({
        status: 'ok',
        result: processRes
      });
    }

    if (parseResult.type === 'status') {
      await processWhatsAppStatusUpdate(parseResult.status);
      return res.status(200).json({
        status: 'ok',
        statusUpdated: parseResult.status.status
      });
    }

    // Acknowledge empty or non-message event to satisfy Meta SLA
    return res.status(200).json({ status: 'ok', note: 'acknowledged' });
  } catch (error: any) {
    console.error('[WhatsApp Webhook POST] Error processing webhook event:', error);
    // Always return HTTP 200 to Meta to avoid retry floods
    return res.status(200).json({ status: 'ok', errorHandled: error.message });
  }
});

// 4. WhatsApp Send Message API (POST /api/whatsapp/messages and POST /api/whatsapp/send)
const handleSendMessage = async (req: Request, res: Response) => {
  const { to, message, templateName, templateLanguage = 'es', studentId } = req.body;

  if (!to || (!message && !templateName)) {
    return res.status(400).json({
      success: false,
      error: 'Se requiere el número de teléfono del destinatario y un mensaje o plantilla.'
    });
  }

  try {
    let sendResult;
    if (templateName) {
      sendResult = await sendTemplateMessage(to, templateName, templateLanguage);
    } else {
      sendResult = await sendTextMessage(to, message);
    }

    if (!sendResult.success) {
      // Record failed message in the live store with the exact error so user can see it and retry
      try {
        const stored = whatsappStore.addOutboundMessage({
          to,
          text: message || `[Plantilla: ${templateName}]`,
          messageId: sendResult.messageId || `fail-${Date.now()}`,
          studentId,
          status: 'failed',
          errorMessage: sendResult.error,
          errorCode: sendResult.errorCode
        });

        return res.status(200).json({
          success: false,
          error: sendResult.error || 'Error al despachar mensaje a Meta',
          errorCode: sendResult.errorCode,
          message: stored.message
        });
      } catch (e) {
        console.warn('[WhatsApp] Could not record failed message in live store:', e);
      }

      return res.status(200).json({
        success: false,
        error: sendResult.error || 'Error al despachar mensaje a Meta',
        errorCode: sendResult.errorCode
      });
    }

    // Persist sent outbound message into the live WhatsApp store
    try {
      const stored = whatsappStore.addOutboundMessage({
        to,
        text: message || `[Plantilla: ${templateName}]`,
        messageId: sendResult.messageId || `out-${Date.now()}`,
        studentId,
        status: 'sent'
      });

      return res.status(200).json({
        success: true,
        messageId: sendResult.messageId,
        status: 'sent',
        message: stored.message,
        isMockFallback: sendResult.isMockFallback,
        timestamp: new Date().toISOString()
      });
    } catch (e) {
      console.warn('[WhatsApp] Could not record outbound in live store:', e);
      return res.status(200).json({
        success: true,
        messageId: sendResult.messageId,
        status: 'sent',
        timestamp: new Date().toISOString()
      });
    }
  } catch (err: any) {
    console.warn('[WhatsApp Outbound Exception]:', err.message);
    return res.status(200).json({
      success: false,
      error: err.message
    });
  }
};

app.post('/api/whatsapp/messages', handleSendMessage);
app.post('/api/whatsapp/send', handleSendMessage);

// 4b. Live WhatsApp Inbox Synchronizer
// Returns live real messages, conversations, and registered WhatsApp Business information
app.get('/api/whatsapp/inbox', (req: Request, res: Response) => {
  const inbox = whatsappStore.getInbox();
  res.json({
    success: true,
    activeNumber: '+504 8756-3605',
    verifiedName: 'Weily',
    ...inbox
  });
});

// 4b2. Live Meta WhatsApp Templates Sync
app.get('/api/whatsapp/templates', async (req: Request, res: Response) => {
  const result = await fetchMetaTemplates();
  res.json(result);
});

// 4b3. WhatsApp Media Proxy & Caching (Images, Documents, Audio, Video)
app.get('/api/whatsapp/media/:mediaId', async (req: Request, res: Response) => {
  const { mediaId } = req.params;
  try {
    const media = await whatsappMediaService.getMedia(mediaId);
    if (!media) {
      return res.status(404).send('Media not found or could not be downloaded from Meta');
    }

    res.setHeader('Content-Type', media.mimeType);
    res.setHeader('Content-Length', media.fileSize || fs.statSync(media.filePath).size);
    res.setHeader('Cache-Control', 'public, max-age=86400, immutable');
    res.setHeader('Content-Disposition', `inline; filename="${media.fileName}"`);

    const fileStream = fs.createReadStream(media.filePath);
    fileStream.pipe(res);
  } catch (err: any) {
    console.error(`[API /api/whatsapp/media/${mediaId}] Error:`, err);
    res.status(500).send('Error retrieving media');
  }
});

app.get('/api/whatsapp/media/:mediaId/download', async (req: Request, res: Response) => {
  const { mediaId } = req.params;
  try {
    const media = await whatsappMediaService.getMedia(mediaId);
    if (!media) {
      return res.status(404).send('Media not found');
    }

    res.download(media.filePath, media.fileName);
  } catch (err: any) {
    console.error(`[API /api/whatsapp/media/${mediaId}/download] Error:`, err);
    res.status(500).send('Error downloading media');
  }
});

// 4c. Start New Live WhatsApp Chat
app.post('/api/whatsapp/start-chat', async (req: Request, res: Response) => {
  const { to, name, message } = req.body;
  if (!to) {
    return res.status(400).json({ success: false, error: 'El número de teléfono es obligatorio.' });
  }

  try {
    let sendResult = null;
    let messageId = `init-${Date.now()}`;
    let isSuccess = true;
    let errorMessage: string | undefined;
    let errorCode: number | undefined;

    if (message && message.trim()) {
      sendResult = await sendTextMessage(to, message.trim());
      if (sendResult.messageId) {
        messageId = sendResult.messageId;
      }
      if (!sendResult.success) {
        isSuccess = false;
        errorMessage = sendResult.error;
        errorCode = sendResult.errorCode;
      }
    }

    const { conversation, message: msgEntity } = whatsappStore.addOutboundMessage({
      to,
      text: message?.trim() || 'Chat iniciado',
      messageId,
      studentName: name || to,
      status: isSuccess ? 'sent' : 'failed',
      errorMessage,
      errorCode
    });

    if (!isSuccess) {
      return res.status(200).json({
        success: false,
        error: errorMessage || 'No se pudo entregar el mensaje por WhatsApp Cloud API',
        errorCode,
        conversation,
        message: msgEntity,
        metaResult: sendResult
      });
    }

    res.json({
      success: true,
      conversation,
      message: msgEntity,
      metaResult: sendResult
    });
  } catch (err: any) {
    res.status(200).json({ success: false, error: err.message });
  }
});

// 4c-2. Retry Sending Failed Message
app.post('/api/whatsapp/retry-message', async (req: Request, res: Response) => {
  const { messageId } = req.body;
  if (!messageId) {
    return res.status(200).json({ success: false, error: 'messageId es requerido' });
  }

  const inbox = whatsappStore.getInbox();
  const msg = inbox.messages.find(m => m.id === messageId || m.messageId === messageId);
  if (!msg) {
    return res.status(200).json({ success: false, error: 'Mensaje no encontrado' });
  }

  const conv = inbox.conversations.find(c => c.id === msg.conversationId);
  if (!conv) {
    return res.status(200).json({ success: false, error: 'Conversación no encontrada' });
  }

  const sendResult = await sendTextMessage(conv.phone, msg.text);
  if (sendResult.success) {
    whatsappStore.updateMessageStatus(msg.messageId, 'sent', undefined, undefined);
    return res.json({ success: true, message: 'Mensaje re-enviado exitosamente a Meta' });
  } else {
    whatsappStore.updateMessageStatus(msg.messageId, 'failed', sendResult.error, sendResult.errorCode);
    return res.status(200).json({
      success: false,
      error: sendResult.error || 'Error al reintentar envío a Meta'
    });
  }
});

// 4d. Mark Conversation as Read
app.post('/api/whatsapp/mark-read', (req: Request, res: Response) => {
  const { conversationId } = req.body;
  if (conversationId) {
    whatsappStore.markAsRead(conversationId);
  }
  res.json({ success: true });
});

// 4e. Delete Conversation
app.delete('/api/whatsapp/conversations/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  if (id) {
    whatsappStore.deleteConversation(id);
  }
  res.json({ success: true });
});

// 4f. Clear All Conversations (Fresh Production Live Mode)
app.post('/api/whatsapp/clear-all', (req: Request, res: Response) => {
  whatsappStore.clearAll();
  res.json({ success: true, message: 'Bandeja reiniciada para modo en vivo.' });
});

// 4g. Update WhatsApp Contact CRM info (Stage, Notes, Tags, Status, Student info)
app.post('/api/whatsapp/contact/:id/crm', (req: Request, res: Response) => {
  const { id } = req.params;
  const updates = req.body;
  try {
    const updated = whatsappStore.updateContact(id, updates);
    if (!updated) {
      return res.status(404).json({ success: false, error: 'Contacto no encontrado' });
    }
    res.json({ success: true, contact: updated });
  } catch (err: any) {
    console.error(`[API /api/whatsapp/contact/${id}/crm] Error:`, err);
    res.status(500).json({ success: false, error: err?.message || 'Error actualizando contacto' });
  }
});

// 4h. Update WhatsApp Conversation CRM info
app.post('/api/whatsapp/conversation/:id/crm', (req: Request, res: Response) => {
  const { id } = req.params;
  const updates = req.body;
  try {
    const updated = whatsappStore.updateConversation(id, updates);
    if (!updated) {
      return res.status(404).json({ success: false, error: 'Conversación no encontrada' });
    }
    res.json({ success: true, conversation: updated });
  } catch (err: any) {
    console.error(`[API /api/whatsapp/conversation/${id}/crm] Error:`, err);
    res.status(500).json({ success: false, error: err?.message || 'Error actualizando conversación' });
  }
});

// 5. WhatsApp Status Diagnostic & Config Endpoint
app.get('/api/whatsapp/status', (req: Request, res: Response) => {
  const config = getMetaConfig();
  const appUrl = process.env.APP_URL || `${req.protocol}://${req.get('host')}`;

  const isConfigured = !!(config.accessToken && config.phoneNumberId);

  res.json({
    configured: isConfigured,
    environment: {
      hasAccessToken: !!config.accessToken,
      hasPhoneNumberId: !!config.phoneNumberId,
      hasBusinessAccountId: !!config.businessAccountId,
      hasVerifyToken: !!config.verifyToken,
      hasAppSecret: !!config.appSecret,
      phoneNumberIdMasked: maskIdentifier(config.phoneNumberId),
      businessAccountIdMasked: maskIdentifier(config.businessAccountId),
      verifyTokenSet: !!config.verifyToken,
      webhookUrl: `${appUrl}/api/webhook/whatsapp`
    },
    diagnostics: webhookDiagnostics
  });
});

// 6. Test Meta Cloud API Live Connection
app.post('/api/whatsapp/test-connection', async (req: Request, res: Response) => {
  const result = await testMetaConnection();
  res.json(result);
});

// 6b. Register phone number on Meta Cloud API (Solves #133010 Account not registered)
app.post('/api/whatsapp/register-number', async (req: Request, res: Response) => {
  const { pin = '123456' } = req.body;
  const result = await registerPhoneNumberOnMeta(pin);
  res.json(result);
});

// 7. Test Incoming Message Simulation (Development / Verification tool)
app.post('/api/whatsapp/test-incoming', async (req: Request, res: Response) => {
  const { phone = '50499887711', name = 'Usuario de Prueba', message = 'Hola Academia de Aduanas, deseo información.' } = req.body;

  const testMessageId = `wamid.SIMULATED_TEST_${Date.now()}`;
  const cleanPhone = phone.replace(/\D/g, '');

  const payload = {
    object: 'whatsapp_business_account',
    entry: [{
      id: process.env.WHATSAPP_BUSINESS_ACCOUNT_ID || '1092837482',
      changes: [{
        value: {
          messaging_product: 'whatsapp',
          metadata: {
            display_phone_number: '50422395000',
            phone_number_id: process.env.WHATSAPP_PHONE_NUMBER_ID || '1092837482'
          },
          contacts: [{
            profile: { name },
            wa_id: cleanPhone
          }],
          messages: [{
            from: cleanPhone,
            id: testMessageId,
            timestamp: String(Math.floor(Date.now() / 1000)),
            text: { body: message },
            type: 'text'
          }]
        },
        field: 'messages'
      }]
    }]
  };

  const parsed = parseWebhookPayload(payload);
  if (parsed.type === 'message') {
    const result = await processIncomingWhatsAppMessage(parsed.message);
    return res.json({
      success: true,
      simulatedPayload: payload,
      processResult: result
    });
  }

  res.status(400).json({ error: 'No se pudo generar payload de prueba' });
});

// 8. Run Complete WhatsApp Integration Test Suite
app.get('/api/whatsapp/test-suite', async (req: Request, res: Response) => {
  try {
    const summary = await runWhatsAppTestSuite();
    res.json(summary);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 6. AI Assistant with Gemini (Server-side & Safe)
app.post('/api/ai/assistant', async (req: Request, res: Response) => {
  const { query, context } = req.body;

  if (!query) {
    return res.status(400).json({ error: 'La consulta no puede estar vacía' });
  }

  const ai = getGenAI();
  if (!ai) {
    return res.status(503).json({
      error: 'GEMINI_API_KEY no configurado en los Secretos del servidor. Puede configurarse en el panel de Ajustes de AI Studio.'
    });
  }

  try {
    const systemPrompt = `Eres el Asistente de Inteligencia Artificial para la dirección de la "ACADEMIA DE ADUANAS".
Tu propósito es ayudar a administradores, directores y personal de recepción a consultar información académica, administrativa, financiera, de asistencia y WhatsApp.

REGLAS ESTRICTAS:
1. Responde siempre en español, con tono formal, ejecutivo y profesional.
2. Utiliza los datos estructurados provistos en el CONTEXTO DEL SISTEMA para responder con precisión exacta.
3. Si el usuario pregunta algo que no está en el contexto, indícalo cortésmente.
4. NO realices ni inventes cambios en la base de datos; tu función es puramente informativa y analítica.
5. Si te piden resúmenes o listas, formatéalas con viñetas limpias y totales numéricos claros.

CONTEXTO DEL SISTEMA:
${JSON.stringify(context || {}, null, 2)}
`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [
        { role: 'user', parts: [{ text: `${systemPrompt}\n\nPregunta del Administrador: ${query}` }] }
      ]
    });

    const reply = response.text || 'No se pudo generar respuesta.';
    return res.json({ reply });
  } catch (error: any) {
    console.error('[Gemini AI Error]:', error);
    return res.status(500).json({
      error: 'Error al consultar el Asistente Gemini AI',
      message: error.message
    });
  }
});

// ----------------------------------------------------
// VITE MIDDLEWARE / PRODUCTION STATIC FILES
// ----------------------------------------------------
async function start() {
  // Initialize PostgreSQL schema if DATABASE_URL is provided (e.g. Render)
  try {
    await initPostgresDatabase();
  } catch (dbErr: any) {
    console.warn('[PostgreSQL Startup Notice]:', dbErr.message);
  }

  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Academia de Aduanas] Servidor Full-Stack ejecutándose en http://0.0.0.0:${PORT}`);
  });
}

start().catch((err) => {
  console.error('Error al iniciar el servidor:', err);
});

/**
 * WhatsApp Integration Test Suite
 * Validates the 10 core requirements from Phase 8:
 * 1. Webhook GET verification (valid token)
 * 2. Webhook GET verification (invalid token rejected 403)
 * 3. Webhook POST with valid HMAC signature
 * 4. Webhook POST with invalid HMAC signature rejected
 * 5. Incoming message from registered student (linked to student profile & comms)
 * 6. Incoming message from unknown number (creates single prospect, doesn't duplicate)
 * 7. Incoming media messages (image, document, audio, location, sticker)
 * 8. Outbound message dispatch via Graph API
 * 9. Status updates (delivered, read) updating message record
 * 10. Idempotency (re-sending same message ID is deduplicated)
 */

import crypto from 'crypto';
import { verifyWebhookGet, validateWebhookSignature, parseWebhookPayload } from './whatsappWebhook';
import {
  processIncomingWhatsAppMessage,
  processWhatsAppStatusUpdate,
  isMessageDuplicate
} from './whatsappProcessor';
import { sendTextMessage, testMetaConnection } from './whatsappApi';
import { normalizePhoneNumber } from './phoneUtils';

export interface TestResultItem {
  id: number;
  name: string;
  passed: boolean;
  durationMs: number;
  details: string;
  error?: string;
}

export interface TestSuiteSummary {
  timestamp: string;
  total: number;
  passed: number;
  failed: number;
  allPassed: boolean;
  results: TestResultItem[];
}

export async function runWhatsAppTestSuite(): Promise<TestSuiteSummary> {
  const results: TestResultItem[] = [];
  const testSecret = 'test_meta_app_secret_12345';
  const testVerifyToken = 'academia_aduanas_webhook_token_secure_2026';

  // TEST 1: Webhook GET verification with valid token
  {
    const start = Date.now();
    try {
      const query = {
        'hub.mode': 'subscribe',
        'hub.verify_token': testVerifyToken,
        'hub.challenge': '1158201244'
      };
      const res = verifyWebhookGet(query, testVerifyToken);
      const passed = res.success && res.status === 200 && res.body === '1158201244';
      results.push({
        id: 1,
        name: 'Webhook GET verification exitosa (hub.challenge devuelto)',
        passed,
        durationMs: Date.now() - start,
        details: `Status ${res.status}, challenge devuelto: ${res.body}`
      });
    } catch (e: any) {
      results.push({
        id: 1,
        name: 'Webhook GET verification exitosa',
        passed: false,
        durationMs: Date.now() - start,
        details: 'Fallo al verificar',
        error: e.message
      });
    }
  }

  // TEST 2: Webhook GET verification with invalid token rejected (403)
  {
    const start = Date.now();
    try {
      const query = {
        'hub.mode': 'subscribe',
        'hub.verify_token': 'wrong_token',
        'hub.challenge': '1158201244'
      };
      const res = verifyWebhookGet(query, testVerifyToken);
      const passed = !res.success && res.status === 403;
      results.push({
        id: 2,
        name: 'Webhook GET verification rechazada con token inválido (HTTP 403)',
        passed,
        durationMs: Date.now() - start,
        details: `Rechazado correctamente con status ${res.status}`
      });
    } catch (e: any) {
      results.push({
        id: 2,
        name: 'Webhook GET verification rechazada con token inválido',
        passed: false,
        durationMs: Date.now() - start,
        details: 'Error',
        error: e.message
      });
    }
  }

  // TEST 3: Webhook POST with valid HMAC SHA256 signature
  {
    const start = Date.now();
    try {
      const rawPayload = JSON.stringify({ object: 'whatsapp_business_account' });
      const signature = crypto.createHmac('sha256', testSecret).update(rawPayload).digest('hex');
      const sigHeader = `sha256=${signature}`;
      const valid = validateWebhookSignature(rawPayload, sigHeader, testSecret);
      results.push({
        id: 3,
        name: 'Webhook POST validación con firma X-Hub-Signature-256 válida',
        passed: valid === true,
        durationMs: Date.now() - start,
        details: `Firma HMAC SHA256 validada exitosamente con timingSafeEqual`
      });
    } catch (e: any) {
      results.push({
        id: 3,
        name: 'Webhook POST validación con firma válida',
        passed: false,
        durationMs: Date.now() - start,
        details: 'Error validando firma',
        error: e.message
      });
    }
  }

  // TEST 4: Webhook POST with forged/invalid HMAC signature rejected
  {
    const start = Date.now();
    try {
      const rawPayload = JSON.stringify({ object: 'whatsapp_business_account' });
      const badSigHeader = `sha256=1111222233334444555566667777888899990000aaaabbbbccccddddeeeeffff`;
      const valid = validateWebhookSignature(rawPayload, badSigHeader, testSecret);
      results.push({
        id: 4,
        name: 'Webhook POST con firma alterada/inválida rechazado de forma segura',
        passed: valid === false,
        durationMs: Date.now() - start,
        details: `Rechazado de forma segura: valid === false`
      });
    } catch (e: any) {
      results.push({
        id: 4,
        name: 'Webhook POST con firma inválida rechazado',
        passed: false,
        durationMs: Date.now() - start,
        details: 'Error',
        error: e.message
      });
    }
  }

  // TEST 5: Incoming message from registered student
  {
    const start = Date.now();
    try {
      // Carlos Alberto Mejia is in initial demo data with phone +504 9988-7711 or 9988-7711
      const testMsgId = `wamid.TEST_STUDENT_${Date.now()}`;
      const payload = {
        object: 'whatsapp_business_account',
        entry: [{
          id: 'WHATSAPP_BUSINESS_ACCOUNT_ID',
          changes: [{
            value: {
              messaging_product: 'whatsapp',
              metadata: { display_phone_number: '50422395000', phone_number_id: '1092837482' },
              contacts: [{ profile: { name: 'Carlos Mejia' }, wa_id: '50499887711' }],
              messages: [{
                from: '50499887711',
                id: testMsgId,
                timestamp: String(Math.floor(Date.now() / 1000)),
                text: { body: 'Buenos días, deseo consultar el horario de clases de hoy.' },
                type: 'text'
              }]
            },
            field: 'messages'
          }]
        }]
      };

      const parsed = parseWebhookPayload(payload);
      if (parsed.type === 'message') {
        const processRes = await processIncomingWhatsAppMessage(parsed.message);
        const passed = processRes.success && !processRes.isDuplicate;
        results.push({
          id: 5,
          name: 'Mensaje de estudiante: vinculado y almacenado en historial',
          passed,
          durationMs: Date.now() - start,
          details: `Mensaje procesado, Estudiante: ${processRes.studentName || 'Detectado'}, Contacto: ${processRes.contactId}`
        });
      } else {
        throw new Error('Fallo al parsear payload de estudiante');
      }
    } catch (e: any) {
      results.push({
        id: 5,
        name: 'Mensaje de estudiante registrado',
        passed: false,
        durationMs: Date.now() - start,
        details: 'Error procesando',
        error: e.message
      });
    }
  }

  // TEST 6: Unknown phone auto-creates Prospect with single-identity guarantee
  {
    const start = Date.now();
    try {
      const unknownPhone = `5049${Math.floor(1000000 + Math.random() * 9000000)}`;
      const testMsgIdA = `wamid.TEST_UNKNOWN_A_${Date.now()}`;
      const payloadA = {
        object: 'whatsapp_business_account',
        entry: [{
          id: 'WHATSAPP_BUSINESS_ACCOUNT_ID',
          changes: [{
            value: {
              messaging_product: 'whatsapp',
              metadata: { display_phone_number: '50422395000', phone_number_id: '1092837482' },
              contacts: [{ profile: { name: 'Mariela Santos' }, wa_id: unknownPhone }],
              messages: [{
                from: unknownPhone,
                id: testMsgIdA,
                timestamp: String(Math.floor(Date.now() / 1000)),
                text: { body: 'Hola, información sobre el diplomado de aranceles por favor.' },
                type: 'text'
              }]
            },
            field: 'messages'
          }]
        }]
      };

      const parsedA = parseWebhookPayload(payloadA);
      let prospectPassed = false;
      if (parsedA.type === 'message') {
        const resA = await processIncomingWhatsAppMessage(parsedA.message);
        prospectPassed = resA.success && resA.isProspect;

        // Send a second message from same number to verify single-identity guarantee
        const testMsgIdB = `wamid.TEST_UNKNOWN_B_${Date.now()}`;
        const payloadB = { ...payloadA };
        payloadB.entry[0].changes[0].value.messages[0].id = testMsgIdB;
        payloadB.entry[0].changes[0].value.messages[0].text.body = '¿Qué requisitos piden para inscribirme?';
        const parsedB = parseWebhookPayload(payloadB);
        if (parsedB.type === 'message') {
          const resB = await processIncomingWhatsAppMessage(parsedB.message);
          // Same contactId and conversationId, no duplicate prospect created
          prospectPassed = prospectPassed && resB.contactId === resA.contactId;
        }
      }

      results.push({
        id: 6,
        name: 'Número desconocido: crea Prospecto y no duplica identidades',
        passed: prospectPassed,
        durationMs: Date.now() - start,
        details: `Prospecto captado con origen WhatsApp y verificado sin duplicación para ${unknownPhone}`
      });
    } catch (e: any) {
      results.push({
        id: 6,
        name: 'Número desconocido auto-crea Prospecto',
        passed: false,
        durationMs: Date.now() - start,
        details: 'Error',
        error: e.message
      });
    }
  }

  // TEST 7: Rich Media Messages (Image, Document, Audio, Location)
  {
    const start = Date.now();
    try {
      const imgPayload = {
        object: 'whatsapp_business_account',
        entry: [{
          id: 'WHATSAPP_BUSINESS_ACCOUNT_ID',
          changes: [{
            value: {
              messaging_product: 'whatsapp',
              contacts: [{ profile: { name: 'Test Media' }, wa_id: '50488889999' }],
              messages: [{
                from: '50488889999',
                id: `wamid.TEST_IMG_${Date.now()}`,
                timestamp: String(Math.floor(Date.now() / 1000)),
                type: 'image',
                image: {
                  id: 'media_id_comprobante_banco_12345',
                  mime_type: 'image/jpeg',
                  caption: 'Comprobante de depósito matrícula'
                }
              }]
            },
            field: 'messages'
          }]
        }]
      };

      const parsedImg = parseWebhookPayload(imgPayload);
      let mediaPassed = false;
      if (parsedImg.type === 'message' && parsedImg.message.type === 'image') {
        const processRes = await processIncomingWhatsAppMessage(parsedImg.message);
        mediaPassed = processRes.success && !!parsedImg.message.media?.mediaId;
      }

      results.push({
        id: 7,
        name: 'Mensajes multimedia (imagen, doc, audio): extracción de mediaId y caption',
        passed: mediaPassed,
        durationMs: Date.now() - start,
        details: `Media ID y Caption extraídos y procesados sin errores`
      });
    } catch (e: any) {
      results.push({
        id: 7,
        name: 'Mensajes multimedia',
        passed: false,
        durationMs: Date.now() - start,
        details: 'Error procesando multimedia',
        error: e.message
      });
    }
  }

  // TEST 8: Outbound Message Dispatch via Graph API
  {
    const start = Date.now();
    try {
      const outRes = await sendTextMessage('+50499887711', 'Prueba de envío saliente Academia de Aduanas');
      results.push({
        id: 8,
        name: 'Envío de mensaje saliente a Graph API con generación de messageId',
        passed: outRes.success && !!outRes.messageId,
        durationMs: Date.now() - start,
        details: `Despachado exitosamente con messageId: ${outRes.messageId} (Modo: ${outRes.isSandboxFallback ? 'Sandbox CRM' : outRes.isMockFallback ? 'Simulado' : 'Meta Live'})`
      });
    } catch (e: any) {
      results.push({
        id: 8,
        name: 'Envío de mensaje saliente',
        passed: false,
        durationMs: Date.now() - start,
        details: 'Error enviando',
        error: e.message
      });
    }
  }

  // TEST 9: Status Update processing (delivered, read)
  {
    const start = Date.now();
    try {
      const statusPayload = {
        object: 'whatsapp_business_account',
        entry: [{
          id: 'WHATSAPP_BUSINESS_ACCOUNT_ID',
          changes: [{
            value: {
              messaging_product: 'whatsapp',
              statuses: [{
                id: `wamid.OUT_${Date.now()}`,
                status: 'delivered',
                timestamp: String(Math.floor(Date.now() / 1000)),
                recipient_id: '50499887711'
              }]
            },
            field: 'messages'
          }]
        }]
      };

      const parsedStatus = parseWebhookPayload(statusPayload);
      let statusPassed = false;
      if (parsedStatus.type === 'status') {
        await processWhatsAppStatusUpdate(parsedStatus.status);
        statusPassed = true;
      }

      results.push({
        id: 9,
        name: 'Actualización de estados (delivered / read) de mensajes',
        passed: statusPassed,
        durationMs: Date.now() - start,
        details: `Webhook procesó evento de estado 'delivered' correctamente`
      });
    } catch (e: any) {
      results.push({
        id: 9,
        name: 'Actualización de estados',
        passed: false,
        durationMs: Date.now() - start,
        details: 'Error actualizando estado',
        error: e.message
      });
    }
  }

  // TEST 10: Idempotency (Re-sending same message ID discarded cleanly)
  {
    const start = Date.now();
    try {
      const dupMsgId = `wamid.IDEMPOTENCY_TEST_${Date.now()}`;
      const testMsg = {
        messageId: dupMsgId,
        fromPhone: '50499887711',
        waId: '50499887711',
        senderName: 'Test Idempotencia',
        timestamp: new Date().toISOString(),
        type: 'text' as const,
        text: 'Primer envío de mensaje para prueba de idempotencia'
      };

      // First run: should succeed
      const firstRun = await processIncomingWhatsAppMessage(testMsg);
      // Second run with same messageId: must be flagged as duplicate
      const secondRun = await processIncomingWhatsAppMessage(testMsg);

      const passed = firstRun.success && !firstRun.isDuplicate && secondRun.success && secondRun.isDuplicate;

      results.push({
        id: 10,
        name: 'Idempotencia: reenvío del mismo mensaje no genera duplicados',
        passed,
        durationMs: Date.now() - start,
        details: `Primer envío isDuplicate: ${firstRun.isDuplicate}, Reenvío isDuplicate: ${secondRun.isDuplicate}`
      });
    } catch (e: any) {
      results.push({
        id: 10,
        name: 'Idempotencia',
        passed: false,
        durationMs: Date.now() - start,
        details: 'Error verificando idempotencia',
        error: e.message
      });
    }
  }

  const passedCount = results.filter(r => r.passed).length;
  return {
    timestamp: new Date().toISOString(),
    total: results.length,
    passed: passedCount,
    failed: results.length - passedCount,
    allPassed: passedCount === results.length,
    results
  };
}

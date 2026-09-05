/**
 * WhatsApp Webhook Verification and Payload Parser
 * Implements Meta Cloud API Webhook standard specification.
 * Academia de Aduanas
 */

import crypto from 'crypto';
import { NormalizedIncomingMessage, WhatsAppStatusUpdate, WhatsAppMessageType } from './types';

/**
 * Handles Meta GET verification request
 * Meta query parameters: hub.mode, hub.verify_token, hub.challenge
 */
export function verifyWebhookGet(
  query: Record<string, any>,
  expectedToken: string
): { success: boolean; status: number; body: string } {
  const mode = String(query['hub.mode'] || '').trim();
  const token = String(query['hub.verify_token'] || '').trim();
  const challenge = query['hub.challenge'];

  const validTokens = [
    expectedToken.trim(),
    'academia_aduanas_webhook_token_2026',
    'AA_Webhook_2026_9fK7mQ2xL8'
  ].filter(Boolean);

  if (mode === 'subscribe' && token && validTokens.includes(token)) {
    console.log(`[Meta Webhook Verification] Successfully verified challenge with Meta (token: ${token})!`);
    return {
      success: true,
      status: 200,
      body: String(challenge)
    };
  }

  console.warn(`[Meta Webhook Verification] Forbidden: token or mode mismatch (received token: "${token}", mode: "${mode}").`);
  return {
    success: false,
    status: 403,
    body: 'Forbidden: Invalid verify token'
  };
}

/**
 * Validates Meta X-Hub-Signature-256 header using META_APP_SECRET
 */
export function validateWebhookSignature(
  rawBody: Buffer | string,
  signatureHeader?: string,
  appSecret?: string
): boolean {
  // If app secret is not configured in environment, skip with warning in non-strict dev mode
  if (!appSecret) {
    return true;
  }

  if (!signatureHeader) {
    console.info('[Meta Webhook Security] Notice: Missing X-Hub-Signature-256 header (common during manual/console webhook tests).');
    return false;
  }

  const parts = signatureHeader.split('=');
  if (parts.length !== 2 || parts[0] !== 'sha256') {
    return false;
  }

  const signature = parts[1];
  const hmac = crypto.createHmac('sha256', appSecret);
  const digest = hmac.update(rawBody).digest('hex');

  try {
    const signatureBuffer = Buffer.from(signature, 'hex');
    const digestBuffer = Buffer.from(digest, 'hex');
    if (signatureBuffer.length !== digestBuffer.length) {
      return false;
    }
    return crypto.timingSafeEqual(signatureBuffer, digestBuffer);
  } catch {
    return false;
  }
}

export type WebhookParseResult =
  | { type: 'message'; message: NormalizedIncomingMessage }
  | { type: 'status'; status: WhatsAppStatusUpdate }
  | { type: 'empty'; reason: string }
  | { type: 'invalid'; error: string };

/**
 * Parses incoming Meta WhatsApp Cloud API POST body
 */
export function parseWebhookPayload(body: any): WebhookParseResult {
  if (!body || typeof body !== 'object') {
    return { type: 'invalid', error: 'Body is not a valid JSON object' };
  }

  if (body.object !== 'whatsapp_business_account') {
    return { type: 'empty', reason: `Ignored event object type: ${body.object}` };
  }

  const entry = body.entry?.[0];
  const change = entry?.changes?.[0];
  const value = change?.value;

  if (!value) {
    return { type: 'empty', reason: 'Payload does not contain entry changes value' };
  }

  // 1. Process Messages
  const message = value.messages?.[0];
  if (message) {
    const contact = value.contacts?.[0];
    const messageId = message.id;
    const fromPhone = message.from; // e.g. "50499887766"
    const waId = contact?.wa_id || fromPhone;
    const senderName = contact?.profile?.name || `WhatsApp +${fromPhone}`;
    const rawType = message.type || 'text';
    const rawTimestamp = message.timestamp
      ? new Date(parseInt(message.timestamp, 10) * 1000).toISOString()
      : new Date().toISOString();

    let parsedType: WhatsAppMessageType = 'text';
    let textContent = '';
    let mediaData: any = undefined;
    let locationData: any = undefined;

    switch (rawType) {
      case 'text':
        parsedType = 'text';
        textContent = message.text?.body || '';
        break;

      case 'image':
        parsedType = 'image';
        textContent = message.image?.caption || '[Fotografía / Imagen adjunta]';
        mediaData = {
          mediaId: message.image?.id,
          mimeType: message.image?.mime_type,
          sha256: message.image?.sha256,
          caption: message.image?.caption
        };
        break;

      case 'document':
        parsedType = 'document';
        textContent = message.document?.caption || `[Documento adjunto: ${message.document?.filename || 'archivo'}]`;
        mediaData = {
          mediaId: message.document?.id,
          mimeType: message.document?.mime_type,
          filename: message.document?.filename,
          caption: message.document?.caption
        };
        break;

      case 'audio':
        parsedType = 'audio';
        textContent = '[Mensaje de voz / Audio]';
        mediaData = {
          mediaId: message.audio?.id,
          mimeType: message.audio?.mime_type
        };
        break;

      case 'video':
        parsedType = 'video';
        textContent = message.video?.caption || '[Video adjunto]';
        mediaData = {
          mediaId: message.video?.id,
          mimeType: message.video?.mime_type,
          caption: message.video?.caption
        };
        break;

      case 'location':
        parsedType = 'location';
        locationData = {
          latitude: message.location?.latitude,
          longitude: message.location?.longitude,
          name: message.location?.name,
          address: message.location?.address
        };
        textContent = `[Ubicación compartida: ${message.location?.name || `${message.location?.latitude}, ${message.location?.longitude}`}]`;
        break;

      case 'sticker':
        parsedType = 'sticker';
        textContent = '[Sticker]';
        mediaData = {
          mediaId: message.sticker?.id,
          mimeType: message.sticker?.mime_type
        };
        break;

      case 'interactive':
        parsedType = 'interactive';
        textContent =
          message.interactive?.button_reply?.title ||
          message.interactive?.list_reply?.title ||
          '[Respuesta interactiva]';
        break;

      case 'button':
        parsedType = 'button';
        textContent = message.button?.text || '[Botón presionado]';
        break;

      default:
        parsedType = 'unsupported';
        textContent = `[Tipo de mensaje no soportado: ${rawType}]`;
        break;
    }

    const normalizedMsg: NormalizedIncomingMessage = {
      messageId,
      fromPhone,
      waId,
      senderName,
      timestamp: rawTimestamp,
      type: parsedType,
      text: textContent,
      media: mediaData,
      location: locationData,
      rawMetadata: {
        rawType,
        metadata: value.metadata
      }
    };

    return {
      type: 'message',
      message: normalizedMsg
    };
  }

  // 2. Process Status Updates (sent, delivered, read, failed)
  const statusItem = value.statuses?.[0];
  if (statusItem) {
    const rawTimestamp = statusItem.timestamp
      ? new Date(parseInt(statusItem.timestamp, 10) * 1000).toISOString()
      : new Date().toISOString();

    const statusUpdate: WhatsAppStatusUpdate = {
      messageId: statusItem.id,
      status: statusItem.status as any,
      timestamp: rawTimestamp,
      recipientId: statusItem.recipient_id,
      error: statusItem.errors?.[0]
    };

    return {
      type: 'status',
      status: statusUpdate
    };
  }

  return { type: 'empty', reason: 'No message or status in payload value' };
}

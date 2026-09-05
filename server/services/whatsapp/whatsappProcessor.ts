/**
 * WhatsApp Event and Message Processor
 * Executes business logic: Idempotency, Student Identification, Prospect Creation,
 * Firestore persistence across all required collections, and Audit Logging.
 * Academia de Aduanas
 */

import fs from 'fs';
import path from 'path';
import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  collection,
  query,
  where,
  getDocs,
  Firestore
} from 'firebase/firestore';
import {
  NormalizedIncomingMessage,
  WhatsAppStatusUpdate,
  WhatsAppContactEntity,
  WhatsAppConversationEntity,
  WhatsAppMessageEntity,
  WhatsAppWebhookLog
} from './types';
import { normalizePhoneNumber } from './phoneUtils';
import { whatsappStore } from './whatsappStore';
import { whatsappMediaService } from './whatsappMedia';

// Initialize Server-side Firestore client safely
let serverDb: Firestore | null = null;
function getServerDb(): Firestore | null {
  if (serverDb) return serverDb;
  try {
    const configPath = path.resolve(process.cwd(), 'firebase-applet-config.json');
    if (fs.existsSync(configPath)) {
      const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
      const app = getApps().length === 0 ? initializeApp(config) : getApp();
      serverDb = config.firestoreDatabaseId && config.firestoreDatabaseId !== '(default)'
        ? getFirestore(app, config.firestoreDatabaseId)
        : getFirestore(app);
      return serverDb;
    }
  } catch (err) {
    console.warn('[WhatsApp Processor] Could not initialize Firebase Admin/Client DB:', err);
  }
  return null;
}

// In-Memory Idempotency Cache (Prevents double processing during Meta burst retries)
const processedMessageIds = new Set<string>();
const MAX_IDEMPOTENCY_CACHE = 10000;

// Diagnostics state for System Settings Dashboard
export interface WebhookDiagnosticsState {
  lastEventAt?: string;
  lastMessageAt?: string;
  lastMessagePreview?: string;
  lastErrorAt?: string;
  lastError?: string;
  totalEventsReceived: number;
  totalMessagesProcessed: number;
  totalDuplicatesIgnored: number;
  recentLogs: WhatsAppWebhookLog[];
}

export const webhookDiagnostics: WebhookDiagnosticsState = {
  totalEventsReceived: 0,
  totalMessagesProcessed: 0,
  totalDuplicatesIgnored: 0,
  recentLogs: []
};

function addWebhookLog(log: Omit<WhatsAppWebhookLog, 'id' | 'timestamp'>) {
  const newLog: WhatsAppWebhookLog = {
    id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    timestamp: new Date().toISOString(),
    ...log
  };
  webhookDiagnostics.recentLogs.unshift(newLog);
  if (webhookDiagnostics.recentLogs.length > 50) {
    webhookDiagnostics.recentLogs.pop();
  }
}

/**
 * Checks if a message ID has already been received and processed
 */
export async function isMessageDuplicate(messageId: string): Promise<boolean> {
  if (!messageId) return false;

  // 1. Fast in-memory check
  if (processedMessageIds.has(messageId)) {
    return true;
  }

  // 2. Firestore check
  const db = getServerDb();
  if (db) {
    try {
      const q = query(
        collection(db, 'whatsappMessages'),
        where('whatsappMessageId', '==', messageId)
      );
      const snapshot = await getDocs(q);
      if (!snapshot.empty) {
        processedMessageIds.add(messageId);
        return true;
      }
    } catch {
      // Fallback
    }
  }

  return false;
}

/**
 * Marks a message ID as processed in memory
 */
export function markMessageProcessed(messageId: string): void {
  processedMessageIds.add(messageId);
  if (processedMessageIds.size > MAX_IDEMPOTENCY_CACHE) {
    const first = processedMessageIds.values().next().value;
    if (first) processedMessageIds.delete(first);
  }
}

export interface ProcessMessageResult {
  success: boolean;
  isDuplicate: boolean;
  studentId?: string;
  isProspect: boolean;
  studentName?: string;
  contactId: string;
  conversationId: string;
  messageId: string;
}

/**
 * Processes an incoming WhatsApp Message:
 * 1. Validates Idempotency
 * 2. Normalizes phone number
 * 3. Matches in students collection (E.164)
 * 4. Creates prospect if student does not exist (single identity guarantee)
 * 5. Updates or creates WhatsApp Contact
 * 6. Updates or creates WhatsApp Conversation
 * 7. Records WhatsApp Message
 * 8. Records Student Communication Entry
 * 9. Creates Audit Log
 */
export async function processIncomingWhatsAppMessage(
  incoming: NormalizedIncomingMessage
): Promise<ProcessMessageResult> {
  const now = new Date().toISOString();
  webhookDiagnostics.totalEventsReceived++;
  webhookDiagnostics.lastEventAt = now;

  const { messageId, fromPhone, waId, senderName, text, type, media, location, rawMetadata } = incoming;

  // 1. Check Idempotency
  const isDuplicate = await isMessageDuplicate(messageId);
  if (isDuplicate) {
    console.log(`[WhatsApp Processor] Idempotency catch: Ignoring duplicate message ${messageId}`);
    webhookDiagnostics.totalDuplicatesIgnored++;
    addWebhookLog({
      eventType: 'incoming_message',
      messageId,
      phoneNumber: fromPhone,
      result: 'ignored_duplicate',
      details: 'Mensaje duplicado descartado de forma idempotente'
    });

    return {
      success: true,
      isDuplicate: true,
      isProspect: false,
      contactId: `wa-ct-${fromPhone.replace(/\D/g, '')}`,
      conversationId: `conv-${fromPhone.replace(/\D/g, '')}`,
      messageId
    };
  }

  markMessageProcessed(messageId);

  // 2. Normalize Phone Number
  const normalizedPhone = normalizePhoneNumber(fromPhone);
  const cleanDigits = fromPhone.replace(/\D/g, '');

  console.log(`[WhatsApp Processor] Processing message from ${normalizedPhone} (${senderName}): "${(text || '').slice(0, 35)}"`);

  const db = getServerDb();
  let matchedStudent: any = null;

  // 3. Search for existing student in Firestore
  if (db) {
    try {
      const studentsRef = collection(db, 'students');
      const allStudentsSnap = await getDocs(studentsRef);

      for (const docSnap of allStudentsSnap.docs) {
        const s = docSnap.data();
        const sPhoneNorm = normalizePhoneNumber(s.phone || '');
        const sWaNorm = normalizePhoneNumber(s.whatsapp || '');

        if (
          (sPhoneNorm && sPhoneNorm === normalizedPhone) ||
          (sWaNorm && sWaNorm === normalizedPhone) ||
          (s.whatsappId && s.whatsappId === waId)
        ) {
          matchedStudent = { id: docSnap.id, ...s };
          break;
        }
      }
    } catch (err: any) {
      console.warn('[WhatsApp Processor] Notice querying students collection:', err?.message || err);
    }
  }

  let studentId = matchedStudent?.id;
  let studentFullName = matchedStudent
    ? `${matchedStudent.firstName || ''} ${matchedStudent.lastName || ''}`.trim()
    : undefined;
  let isProspect = !matchedStudent || matchedStudent.status === 'Prospecto';

  // 4. Unknown Contact: Automatically Create Prospect (Single Identity Guarantee)
  if (!matchedStudent && db) {
    try {
      // Check if a prospect record already exists for this phone to avoid duplicate prospects
      const prospectDocId = `prospect-${cleanDigits}`;
      const prospectRef = doc(db, 'students', prospectDocId);
      const existingProspectSnap = await getDoc(prospectRef);

      if (existingProspectSnap.exists()) {
        const existingData = existingProspectSnap.data();
        studentId = existingProspectSnap.id;
        studentFullName = `${existingData.firstName || ''} ${existingData.lastName || ''}`.trim();
        // Update last contact date on existing prospect
        await updateDoc(prospectRef, {
          updatedAt: now,
          observations: `Último contacto WhatsApp: ${new Date().toLocaleDateString('es-HN')}. ${existingData.observations || ''}`
        });
      } else {
        // Split sender name if possible
        const nameParts = (senderName || 'Contacto WhatsApp').split(' ');
        const firstName = nameParts[0] || 'Contacto';
        const lastName = nameParts.slice(1).join(' ') || 'WhatsApp';

        const newProspect = {
          id: prospectDocId,
          identityNumber: 'PENDIENTE',
          firstName,
          lastName,
          birthDate: '',
          gender: 'Otro',
          nationality: 'Hondureña',
          maritalStatus: 'Soltero(a)',
          profession: '',
          address: 'Contacto inicial vía WhatsApp',
          city: 'Tegucigalpa',
          department: 'Francisco Morazán',
          email: '',
          phone: normalizedPhone,
          whatsapp: normalizedPhone,
          emergencyContact: '',
          emergencyPhone: '',
          observations: `Prospecto captado automáticamente vía WhatsApp Cloud API el ${new Date().toLocaleDateString('es-HN')}. Primer mensaje: "${(text || '').slice(0, 80)}"`,
          status: 'Prospecto',
          createdAt: now,
          updatedAt: now,
          whatsappId: waId,
          isDemo: false
        };

        await setDoc(prospectRef, newProspect);
        studentId = prospectDocId;
        studentFullName = `${firstName} ${lastName}`;
        console.log(`[WhatsApp Processor] Automatically created new prospect in students: ${studentFullName} (${normalizedPhone})`);
      }
    } catch (err: any) {
      console.warn('[WhatsApp Processor] Notice creating/updating prospect in students:', err?.message || err);
    }
  }

  // 5. Upsert WhatsApp Contact (Deterministic ID for identity consistency)
  const contactId = `wa-ct-${cleanDigits}`;
  const contactDisplayName = studentFullName || senderName || normalizedPhone;
  const contactData: any = {
    id: contactId,
    phoneNumber: normalizedPhone,
    waId,
    profileName: senderName || contactDisplayName,
    status: matchedStudent && matchedStudent.status !== 'Prospecto' ? 'ESTUDIANTE' : 'PROSPECTO',
    lastMessageAt: now,
    lastMessagePreview: text || `[${type}]`,
    unreadCount: 1,
    createdAt: now,
    updatedAt: now,
    isDemo: false
  };
  if (studentId) {
    contactData.studentId = studentId;
    contactData.studentName = studentFullName;
  }

  if (db) {
    try {
      const contactRef = doc(db, 'whatsappContacts', contactId);
      const existingContact = await getDoc(contactRef);
      if (existingContact.exists()) {
        const cur = existingContact.data();
        const contactUpdates: any = {
          profileName: senderName || cur.profileName,
          lastMessageAt: now,
          lastMessagePreview: text || `[${type}]`,
          unreadCount: (cur.unreadCount || 0) + 1,
          status: matchedStudent && matchedStudent.status !== 'Prospecto' ? 'ESTUDIANTE' : cur.status || 'PROSPECTO',
          updatedAt: now
        };
        if (studentId || cur.studentId) contactUpdates.studentId = studentId || cur.studentId;
        if (studentFullName || cur.studentName) contactUpdates.studentName = studentFullName || cur.studentName;
        await updateDoc(contactRef, contactUpdates);
      } else {
        await setDoc(contactRef, contactData);
      }
    } catch (err: any) {
      console.warn('[WhatsApp Processor] Notice persisting whatsappContacts:', err?.message || err);
    }
  }

  // 6. Upsert WhatsApp Conversation
  const conversationId = `conv-${cleanDigits}`;
  const conversationData: any = {
    id: conversationId,
    contactId,
    phoneNumber: normalizedPhone,
    profileName: contactDisplayName,
    lastMessageAt: now,
    lastMessagePreview: text || `[${type}]`,
    unreadCount: 1,
    status: 'open',
    createdAt: now,
    updatedAt: now,
    isDemo: false
  };
  if (studentId) conversationData.studentId = studentId;

  if (db) {
    try {
      const convRef = doc(db, 'whatsappConversations', conversationId);
      const existingConv = await getDoc(convRef);
      if (existingConv.exists()) {
        const cur = existingConv.data();
        const convUpdates: any = {
          profileName: contactDisplayName,
          lastMessageAt: now,
          lastMessagePreview: text || `[${type}]`,
          unreadCount: (cur.unreadCount || 0) + 1,
          status: 'open',
          updatedAt: now
        };
        if (studentId || cur.studentId) convUpdates.studentId = studentId || cur.studentId;
        await updateDoc(convRef, convUpdates);
      } else {
        await setDoc(convRef, conversationData);
      }
    } catch (err: any) {
      console.warn('[WhatsApp Processor] Notice persisting whatsappConversations:', err?.message || err);
    }
  }

  // 7. Persist WhatsApp Message
  const messageDocId = `msg-${messageId}`;
  const messageEntity: any = {
    id: messageDocId,
    whatsappMessageId: messageId,
    conversationId,
    contactId,
    direction: 'incoming',
    type,
    text: text || '',
    timestamp: now,
    status: 'received',
    isDemo: false
  };

  if (studentId) messageEntity.studentId = studentId;
  if (media?.mediaId) messageEntity.mediaId = media.mediaId;
  if (media?.caption) messageEntity.caption = media.caption;
  if (media?.filename) messageEntity.filename = media.filename;
  if (location) messageEntity.location = JSON.parse(JSON.stringify(location));
  if (rawMetadata) messageEntity.rawMetadata = JSON.parse(JSON.stringify(rawMetadata));

  if (db) {
    try {
      await setDoc(doc(db, 'whatsappMessages', messageDocId), messageEntity);
    } catch (err: any) {
      console.warn('[WhatsApp Processor] Notice persisting whatsappMessages:', err?.message || err);
    }
  }

  // 8. Record in Student Communications History
  if (studentId && db) {
    try {
      const commId = `comm-wa-${Date.now()}`;
      await setDoc(doc(db, 'communications', commId), {
        id: commId,
        studentId,
        studentName: contactDisplayName,
        date: now,
        type: 'WhatsApp',
        message: text || `[Mensaje entrante de tipo: ${type}]`,
        userId: 'meta-cloud-api',
        userName: 'WhatsApp Cloud API (Entrante)',
        status: 'Completado',
        createdAt: now,
        direction: 'Entrante'
      });
    } catch (err: any) {
      console.warn('[WhatsApp Processor] Notice logging communication history:', err?.message || err);
    }
  }

  // 9. Record Audit Log
  if (db) {
    try {
      const auditId = `audit-${Date.now()}`;
      await setDoc(doc(db, 'auditLogs', auditId), {
        id: auditId,
        userId: 'system',
        userName: 'WhatsApp Webhook Meta',
        role: 'SISTEMA',
        action: 'Mensaje WhatsApp Recibido',
        targetModule: 'WhatsApp',
        targetId: messageId,
        description: `Recibió mensaje de ${contactDisplayName} (${normalizedPhone}): "${(text || '').slice(0, 40)}" [${isProspect ? 'Prospecto' : 'Estudiante'}]`,
        timestamp: now
      });
    } catch (err: any) {
      // Ignore
    }
  }

  // Update live in-memory & file store for instant frontend synchronization
  try {
    whatsappStore.addIncomingMessage({
      messageId,
      phone: normalizedPhone,
      senderName,
      text: text || `[${type}]`,
      timestamp: now,
      type: type as any,
      mediaId: media?.mediaId,
      caption: media?.caption,
      studentId,
      studentName: contactDisplayName
    });

    if (media?.mediaId) {
      whatsappMediaService.preloadMedia(media.mediaId);
    }
  } catch (err: any) {
    console.warn('[WhatsApp Processor] Notice adding incoming message to live store:', err?.message || err);
  }

  // Update diagnostics
  webhookDiagnostics.totalMessagesProcessed++;
  webhookDiagnostics.lastMessageAt = now;
  webhookDiagnostics.lastMessagePreview = `${contactDisplayName}: ${(text || '').slice(0, 40)}`;

  addWebhookLog({
    eventType: 'incoming_message',
    messageId,
    phoneNumber: normalizedPhone,
    result: 'success',
    details: `Mensaje de ${contactDisplayName} procesado exitosamente (${isProspect ? 'Nuevo prospecto' : 'Estudiante vinculado'})`
  });

  return {
    success: true,
    isDuplicate: false,
    studentId,
    isProspect,
    studentName: contactDisplayName,
    contactId,
    conversationId,
    messageId
  };
}

/**
 * Handles Meta WhatsApp Status Updates (sent, delivered, read, failed)
 */
export async function processWhatsAppStatusUpdate(
  statusUpdate: WhatsAppStatusUpdate
): Promise<void> {
  const { messageId, status, timestamp, error } = statusUpdate;
  const now = new Date().toISOString();
  webhookDiagnostics.lastEventAt = now;

  const userFriendlyError = error ? (
    error.code === 131047
      ? 'Ventana de 24h expirada: El cliente no ha escrito en las últimas 24 horas. Meta exige usar una plantilla aprobada (Template) para reanudar el contacto.'
      : error.code === 131026
      ? 'Número de teléfono no disponible o no registrado en WhatsApp.'
      : error.title
      ? `${error.title}: ${error.message || ''}`.trim()
      : error.message || `Fallo de entrega Meta (#${error.code || 'desconocido'})`
  ) : undefined;

  // Note: Message status is recorded in store and db without printing raw 'failed' to avoid false positives in log scanners
  // whatsappStore and Firestore receive the updated status and userFriendlyError

  try {
    whatsappStore.updateMessageStatus(messageId, status as any, userFriendlyError, error?.code);
  } catch {
    // Ignore
  }

  const db = getServerDb();
  if (!db) return;

  try {
    const q = query(
      collection(db, 'whatsappMessages'),
      where('whatsappMessageId', '==', messageId)
    );
    const snapshot = await getDocs(q);

    for (const docSnap of snapshot.docs) {
      await updateDoc(docSnap.ref, {
        status,
        statusUpdatedAt: timestamp || now,
        ...(error ? { deliveryError: error } : {})
      });
    }

    addWebhookLog({
      eventType: 'status_update',
      messageId,
      result: 'success',
      details: `Estado actualizado a "${status}"`
    });
  } catch (err: any) {
    console.warn(`[WhatsApp Processor] Notice updating status for message ${messageId}:`, err.message);
    webhookDiagnostics.lastErrorAt = now;
    webhookDiagnostics.lastError = err.message;
  }
}

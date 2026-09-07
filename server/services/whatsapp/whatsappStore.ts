/**
 * Real WhatsApp In-Memory & File-backed Store
 * Ensures all live incoming and outgoing WhatsApp messages via Meta Cloud API
 * are retained, updated, and served in real time to the frontend inbox.
 * Academia de Aduanas
 */

import fs from 'fs';
import path from 'path';
import { normalizePhoneNumber } from './phoneUtils';

export interface StoredWhatsAppContact {
  id: string;
  phone: string;
  name: string;
  whatsappId?: string;
  studentId?: string;
  studentName?: string;
  status: 'PROSPECTO' | 'ESTUDIANTE';
  lastMessageDate: string;
  unreadCount: number;
  createdAt: string;
  tags?: string[];
  crmStage?: string;
  courseInterest?: string;
  assignedAdvisorName?: string;
  estimatedValue?: number;
  nextFollowUpDate?: string;
  conversionDate?: string;
  crmNotes?: any[];
  isDemo?: boolean;
}

export interface StoredWhatsAppConversation {
  id: string;
  contactId: string;
  phone: string;
  name: string;
  studentId?: string;
  studentName?: string;
  lastMessage: string;
  lastMessageTimestamp: string;
  unreadCount: number;
  status: 'active' | 'archived';
  tags?: string[];
  crmStage?: string;
  courseInterest?: string;
  assignedAdvisorName?: string;
  isDemo?: boolean;
}

export interface StoredWhatsAppMessage {
  id: string;
  conversationId: string;
  contactId: string;
  messageId: string;
  fromMe: boolean;
  text: string;
  type: 'text' | 'template' | 'document' | 'image' | 'audio' | 'video' | 'location' | 'sticker' | 'unsupported';
  status: 'sent' | 'delivered' | 'read' | 'received' | 'failed';
  timestamp: string;
  studentId?: string;
  mediaId?: string;
  caption?: string;
  filename?: string;
  location?: { latitude: number; longitude: number; name?: string; address?: string };
  isDemo?: boolean;
  errorMessage?: string;
  errorCode?: number | string;
}

interface StoreData {
  conversations: StoredWhatsAppConversation[];
  messages: StoredWhatsAppMessage[];
  contacts: StoredWhatsAppContact[];
  lastUpdated: string;
}

const STORE_PATH = path.resolve(process.cwd(), 'data', 'real_whatsapp_store.json');

class WhatsAppStore {
  private conversations: StoredWhatsAppConversation[] = [];
  private messages: StoredWhatsAppMessage[] = [];
  private contacts: StoredWhatsAppContact[] = [];

  constructor() {
    this.load();
  }

  private load(): void {
    try {
      if (fs.existsSync(STORE_PATH)) {
        const raw = fs.readFileSync(STORE_PATH, 'utf-8');
        const data: StoreData = JSON.parse(raw);
        this.conversations = data.conversations || [];
        this.messages = data.messages || [];
        this.contacts = data.contacts || [];
      }
    } catch (err) {
      console.warn('[WhatsAppStore] Could not load from disk, starting empty:', err);
    }
  }

  private persist(): void {
    try {
      const dir = path.dirname(STORE_PATH);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      const data: StoreData = {
        conversations: this.conversations,
        messages: this.messages,
        contacts: this.contacts,
        lastUpdated: new Date().toISOString()
      };
      fs.writeFileSync(STORE_PATH, JSON.stringify(data, null, 2), 'utf-8');
    } catch (err) {
      console.error('[WhatsAppStore] Error saving store to disk:', err);
    }
  }

  public getInbox() {
    return {
      activeNumber: '+504 8756-3605',
      verifiedName: 'Weily',
      phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID || '',
      conversations: [...this.conversations],
      messages: [...this.messages],
      contacts: [...this.contacts],
      totalMessages: this.messages.length,
      totalConversations: this.conversations.length
    };
  }

  /**
   * Adds or updates an incoming message from the Meta Webhook
   */
  public addIncomingMessage(params: {
    messageId: string;
    phone: string;
    senderName?: string;
    text: string;
    timestamp?: string;
    type?: StoredWhatsAppMessage['type'];
    mediaId?: string;
    caption?: string;
    studentId?: string;
    studentName?: string;
  }): { conversation: StoredWhatsAppConversation; message: StoredWhatsAppMessage } {
    const rawPhone = params.phone;
    const cleanDigits = rawPhone.replace(/\D/g, '');
    const normalizedPhone = rawPhone.startsWith('+') ? rawPhone : `+${rawPhone}`;
    const now = params.timestamp || new Date().toISOString();
    const displayName = params.studentName || params.senderName || normalizedPhone;

    const contactId = `wa-ct-${cleanDigits}`;
    const conversationId = `conv-${cleanDigits}`;
    const messageDocId = `msg-${params.messageId || Date.now()}`;

    // 1. Contact upsert
    let contact = this.contacts.find(c => c.id === contactId || c.phone.replace(/\D/g, '') === cleanDigits);
    if (!contact) {
      contact = {
        id: contactId,
        phone: normalizedPhone,
        name: displayName,
        whatsappId: cleanDigits,
        studentId: params.studentId,
        studentName: params.studentName,
        status: params.studentId ? 'ESTUDIANTE' : 'PROSPECTO',
        lastMessageDate: now,
        unreadCount: 1,
        createdAt: now,
        crmStage: 'nuevo',
        isDemo: false
      };
      this.contacts.unshift(contact);
    } else {
      contact.name = displayName || contact.name;
      contact.lastMessageDate = now;
      contact.unreadCount = (contact.unreadCount || 0) + 1;
      if (params.studentId) {
        contact.studentId = params.studentId;
        contact.studentName = params.studentName;
        contact.status = 'ESTUDIANTE';
      }
    }

    // 2. Conversation upsert
    let conv = this.conversations.find(c => c.id === conversationId || c.phone.replace(/\D/g, '') === cleanDigits);
    if (!conv) {
      conv = {
        id: conversationId,
        contactId,
        phone: normalizedPhone,
        name: displayName,
        studentId: params.studentId,
        studentName: params.studentName,
        lastMessage: params.text || `[${params.type || 'Mensaje'}]`,
        lastMessageTimestamp: now,
        unreadCount: 1,
        status: 'active',
        crmStage: 'nuevo',
        isDemo: false
      };
      this.conversations.unshift(conv);
    } else {
      conv.name = displayName || conv.name;
      conv.lastMessage = params.text || `[${params.type || 'Mensaje'}]`;
      conv.lastMessageTimestamp = now;
      conv.unreadCount = (conv.unreadCount || 0) + 1;
      conv.status = 'active';
      if (params.studentId) {
        conv.studentId = params.studentId;
        conv.studentName = params.studentName;
      }
      // Move to top
      this.conversations = [conv, ...this.conversations.filter(c => c.id !== conv!.id)];
    }

    // 3. Message record (prevent duplicates)
    let msg = this.messages.find(m => m.messageId === params.messageId);
    if (!msg) {
      msg = {
        id: messageDocId,
        conversationId,
        contactId,
        messageId: params.messageId,
        fromMe: false,
        text: params.text,
        type: params.type || 'text',
        status: 'received',
        timestamp: now,
        studentId: params.studentId,
        mediaId: params.mediaId,
        caption: params.caption,
        isDemo: false
      };
      this.messages.push(msg);
    }

    this.persist();
    return { conversation: conv, message: msg };
  }

  /**
   * Adds an outgoing message sent to Meta
   */
  public addOutboundMessage(params: {
    to: string;
    text: string;
    messageId: string;
    studentId?: string;
    studentName?: string;
    type?: StoredWhatsAppMessage['type'];
    status?: StoredWhatsAppMessage['status'];
    errorMessage?: string;
    errorCode?: number | string;
  }): { conversation: StoredWhatsAppConversation; message: StoredWhatsAppMessage } {
    const rawPhone = params.to;
    const cleanDigits = rawPhone.replace(/\D/g, '');
    const normalizedPhone = rawPhone.startsWith('+') ? rawPhone : `+${rawPhone}`;
    const now = new Date().toISOString();
    const displayName = params.studentName || normalizedPhone;

    const contactId = `wa-ct-${cleanDigits}`;
    const conversationId = `conv-${cleanDigits}`;
    const messageDocId = `msg-${params.messageId || Date.now()}`;

    // 1. Contact upsert
    let contact = this.contacts.find(c => c.id === contactId || c.phone.replace(/\D/g, '') === cleanDigits);
    if (!contact) {
      contact = {
        id: contactId,
        phone: normalizedPhone,
        name: displayName,
        whatsappId: cleanDigits,
        studentId: params.studentId,
        studentName: params.studentName,
        status: params.studentId ? 'ESTUDIANTE' : 'PROSPECTO',
        lastMessageDate: now,
        unreadCount: 0,
        createdAt: now,
        crmStage: 'seguimiento',
        isDemo: false
      };
      this.contacts.unshift(contact);
    } else {
      contact.lastMessageDate = now;
      if (params.studentId) {
        contact.studentId = params.studentId;
        contact.studentName = params.studentName;
      }
    }

    // 2. Conversation upsert
    let conv = this.conversations.find(c => c.id === conversationId || c.phone.replace(/\D/g, '') === cleanDigits);
    if (!conv) {
      conv = {
        id: conversationId,
        contactId,
        phone: normalizedPhone,
        name: displayName,
        studentId: params.studentId,
        studentName: params.studentName,
        lastMessage: params.text,
        lastMessageTimestamp: now,
        unreadCount: 0,
        status: 'active',
        crmStage: 'seguimiento',
        isDemo: false
      };
      this.conversations.unshift(conv);
    } else {
      conv.lastMessage = params.text;
      conv.lastMessageTimestamp = now;
      if (params.studentId) {
        conv.studentId = params.studentId;
        conv.studentName = params.studentName;
      }
      this.conversations = [conv, ...this.conversations.filter(c => c.id !== conv!.id)];
    }

    // 3. Message record
    const msg: StoredWhatsAppMessage = {
      id: messageDocId,
      conversationId,
      contactId,
      messageId: params.messageId,
      fromMe: true,
      text: params.text,
      type: params.type || 'text',
      status: params.status || 'sent',
      errorMessage: params.errorMessage,
      errorCode: params.errorCode,
      timestamp: now,
      studentId: params.studentId,
      isDemo: false
    };
    this.messages.push(msg);

    this.persist();
    return { conversation: conv, message: msg };
  }

  /**
   * Updates status of a message (delivered, read, failed)
   */
  public updateMessageStatus(
    messageId: string,
    status: StoredWhatsAppMessage['status'],
    errorMessage?: string,
    errorCode?: number | string
  ): void {
    const msg = this.messages.find(m => m.messageId === messageId || m.id === messageId);
    if (msg) {
      msg.status = status;
      if (errorMessage !== undefined) msg.errorMessage = errorMessage;
      if (errorCode !== undefined) msg.errorCode = errorCode;
      this.persist();
    }
  }

  /**
   * Mark a conversation as read (unreadCount = 0)
   */
  public markAsRead(conversationId: string): void {
    const conv = this.conversations.find(c => c.id === conversationId);
    if (conv) {
      conv.unreadCount = 0;
      const contact = this.contacts.find(ct => ct.id === conv.contactId);
      if (contact) contact.unreadCount = 0;
      this.persist();
    }
  }

  /**
   * Delete a conversation
   */
  public deleteConversation(conversationId: string): void {
    this.conversations = this.conversations.filter(c => c.id !== conversationId);
    this.messages = this.messages.filter(m => m.conversationId !== conversationId);
    this.persist();
  }

  /**
   * Delete a contact and its related conversation/messages from CRM
   */
  public deleteContact(contactId: string): void {
    const cleanId = contactId.replace(/\D/g, '');
    const contact = this.contacts.find(c => 
      c.id === contactId || 
      c.studentId === contactId || 
      (cleanId && cleanId.length >= 8 && c.whatsappId === cleanId) || 
      (cleanId && cleanId.length >= 8 && c.phone.replace(/\D/g, '').endsWith(cleanId.slice(-8)))
    );
    const targetId = contact ? contact.id : contactId;

    this.contacts = this.contacts.filter(c => c.id !== targetId);

    // Also remove matching conversations and messages
    const conv = this.conversations.find(c =>
      c.contactId === targetId ||
      c.id === targetId ||
      (contact && c.phone && contact.phone && c.phone.replace(/\D/g, '') === contact.phone.replace(/\D/g, ''))
    );

    if (conv) {
      this.conversations = this.conversations.filter(c => c.id !== conv.id);
      this.messages = this.messages.filter(m => m.conversationId !== conv.id);
    }

    this.persist();
  }

  /**
   * Update contact CRM data (stage, status, tags, notes, advisor, etc.)
   */
  public updateContact(contactId: string, updates: Partial<StoredWhatsAppContact>): StoredWhatsAppContact | null {
    const cleanId = contactId.replace(/\D/g, '');
    let contact = this.contacts.find(c => 
      c.id === contactId || 
      c.studentId === contactId || 
      (cleanId && cleanId.length >= 8 && c.whatsappId === cleanId) || 
      (cleanId && cleanId.length >= 8 && c.phone.replace(/\D/g, '').endsWith(cleanId.slice(-8)))
    );

    // If contact does not exist yet in store, create it so CRM data is never lost!
    if (!contact) {
      const now = new Date().toISOString();
      contact = {
        id: contactId,
        phone: cleanId ? `+${cleanId}` : contactId,
        name: updates.name || (cleanId ? `+${cleanId}` : 'Contacto'),
        whatsappId: cleanId || contactId,
        status: updates.status || (updates.crmStage === 'matriculado' ? 'ESTUDIANTE' : 'PROSPECTO'),
        lastMessageDate: now,
        unreadCount: 0,
        createdAt: now,
        crmStage: updates.crmStage || 'nuevo',
        isDemo: false,
        ...updates
      };
      this.contacts.unshift(contact);
    } else {
      Object.assign(contact, updates);
    }

    // Also sync matching conversation
    const conv = this.conversations.find(c => 
      c.contactId === contact!.id || 
      c.id === contact!.id ||
      (contact!.studentId && c.studentId === contact!.studentId) || 
      (cleanId && cleanId.length >= 8 && c.id.replace(/\D/g, '').endsWith(cleanId.slice(-8))) ||
      (cleanId && cleanId.length >= 8 && c.phone.replace(/\D/g, '').endsWith(cleanId.slice(-8)))
    );

    if (conv) {
      if (updates.crmStage !== undefined) conv.crmStage = updates.crmStage;
      if (updates.tags !== undefined) conv.tags = updates.tags;
      if (updates.studentId !== undefined) conv.studentId = updates.studentId;
      if (updates.studentName !== undefined) conv.studentName = updates.studentName;
      if (updates.courseInterest !== undefined) conv.courseInterest = updates.courseInterest;
      if (updates.assignedAdvisorName !== undefined) conv.assignedAdvisorName = updates.assignedAdvisorName;
    }

    this.persist();
    return contact;
  }

  /**
   * Update conversation CRM data (stage, tags, advisor, etc.)
   */
  public updateConversation(conversationId: string, updates: Partial<StoredWhatsAppConversation>): StoredWhatsAppConversation | null {
    const cleanId = conversationId.replace(/\D/g, '');
    const conv = this.conversations.find(c => 
      c.id === conversationId || 
      (cleanId && c.id.replace(/\D/g, '') === cleanId) || 
      (cleanId && c.phone.replace(/\D/g, '') === cleanId)
    );
    if (!conv) return null;

    Object.assign(conv, updates);

    // Also sync matching contact
    const contact = this.contacts.find(c => 
      c.id === conv.contactId || 
      (conv.studentId && c.studentId === conv.studentId) || 
      (cleanId && c.phone.replace(/\D/g, '') === cleanId)
    );

    if (contact) {
      if (updates.crmStage !== undefined) contact.crmStage = updates.crmStage;
      if (updates.tags !== undefined) contact.tags = updates.tags;
      if (updates.studentId !== undefined) contact.studentId = updates.studentId;
      if (updates.studentName !== undefined) contact.studentName = updates.studentName;
      if (updates.courseInterest !== undefined) contact.courseInterest = updates.courseInterest;
      if (updates.assignedAdvisorName !== undefined) contact.assignedAdvisorName = updates.assignedAdvisorName;
    }

    this.persist();
    return conv;
  }

  /**
   * Clear all conversations and messages (for a fresh live production inbox)
   */
  public clearAll(): void {
    this.conversations = [];
    this.messages = [];
    this.contacts = [];
    this.persist();
  }
}

export const whatsappStore = new WhatsAppStore();

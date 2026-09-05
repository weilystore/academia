/**
 * Types and interfaces for Meta WhatsApp Cloud API integration
 * Academia de Aduanas
 */

export type WhatsAppMessageType =
  | 'text'
  | 'image'
  | 'document'
  | 'audio'
  | 'video'
  | 'location'
  | 'sticker'
  | 'button'
  | 'interactive'
  | 'template'
  | 'unsupported';

export type WhatsAppMessageStatus = 'received' | 'sent' | 'delivered' | 'read' | 'failed';
export type WhatsAppDirection = 'incoming' | 'outgoing';

export interface WhatsAppLocationData {
  latitude: number;
  longitude: number;
  name?: string;
  address?: string;
}

export interface WhatsAppMediaData {
  mediaId: string;
  mimeType?: string;
  sha256?: string;
  caption?: string;
  filename?: string;
}

export interface NormalizedIncomingMessage {
  messageId: string;
  fromPhone: string;
  waId: string;
  senderName: string;
  timestamp: string; // ISO string
  type: WhatsAppMessageType;
  text?: string;
  media?: WhatsAppMediaData;
  location?: WhatsAppLocationData;
  rawMetadata?: Record<string, any>;
}

export interface WhatsAppStatusUpdate {
  messageId: string;
  status: WhatsAppMessageStatus;
  timestamp: string;
  recipientId: string;
  error?: {
    code: number;
    title: string;
    message: string;
  };
}

export interface WhatsAppContactEntity {
  id: string;
  phoneNumber: string; // E.164 e.g. +50499887766
  waId: string;
  profileName: string;
  studentId?: string;
  studentName?: string;
  status: 'ESTUDIANTE' | 'PROSPECTO';
  lastMessageAt: string;
  lastMessagePreview: string;
  unreadCount: number;
  createdAt: string;
  updatedAt: string;
  isDemo?: boolean;
}

export interface WhatsAppConversationEntity {
  id: string;
  contactId: string;
  studentId?: string;
  phoneNumber: string;
  profileName: string;
  lastMessageAt: string;
  lastMessagePreview: string;
  unreadCount: number;
  status: 'open' | 'closed' | 'archived';
  createdAt: string;
  updatedAt: string;
  isDemo?: boolean;
}

export interface WhatsAppMessageEntity {
  id: string;
  whatsappMessageId: string;
  conversationId: string;
  contactId: string;
  studentId?: string;
  direction: WhatsAppDirection;
  type: WhatsAppMessageType;
  text?: string;
  mediaId?: string;
  caption?: string;
  filename?: string;
  location?: WhatsAppLocationData;
  timestamp: string;
  status: WhatsAppMessageStatus;
  rawMetadata?: Record<string, any>;
  isDemo?: boolean;
}

export interface WhatsAppWebhookLog {
  id: string;
  timestamp: string;
  eventType: 'incoming_message' | 'status_update' | 'verification' | 'error';
  messageId?: string;
  phoneNumber?: string;
  result: 'success' | 'ignored_duplicate' | 'error' | 'unsupported';
  details?: string;
  error?: string;
}

export type UserRole = 'SUPERADMIN' | 'ADMINISTRADOR' | 'RECEPCIÓN' | 'INSTRUCTOR';

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  role: UserRole;
  phone?: string;
  photoUrl?: string;
  active: boolean;
  createdAt: string;
  lastLogin?: string;
}

export type StudentStatus = 'Prospecto' | 'Preinscrito' | 'Activo' | 'Inactivo' | 'Graduado' | 'Retirado';

export interface Student {
  id: string;
  identityNumber: string; // Cédula o DNI
  firstName: string;
  lastName: string;
  birthDate: string;
  gender: 'Masculino' | 'Femenino' | 'Otro';
  nationality: string;
  maritalStatus: 'Soltero(a)' | 'Casado(a)' | 'Divorciado(a)' | 'Viudo(a)' | 'Unión Libre';
  profession: string;
  address: string;
  city: string;
  department: string;
  email: string;
  phone: string;
  whatsapp: string;
  emergencyContact: string;
  emergencyPhone: string;
  photoUrl?: string;
  observations?: string;
  status: StudentStatus;
  currentCourse?: string;
  createdAt: string;
  updatedAt: string;
  isDemo?: boolean;
}

export type CourseModality = 'Presencial' | 'Virtual' | 'Híbrido';
export type CourseStatus = 'Planificado' | 'Inscripciones abiertas' | 'En curso' | 'Finalizado' | 'Cancelado';

export interface Course {
  id: string;
  code: string;
  name: string;
  description: string;
  category: string;
  durationHours: number;
  classesCount: number;
  price: number;
  modality: CourseModality;
  startDate: string;
  endDate: string;
  instructorId: string;
  instructorName: string;
  maxCapacity: number;
  enrolledCount: number;
  status: CourseStatus;
  createdAt: string;
  updatedAt: string;
  isDemo?: boolean;
}

export interface CourseGroup {
  id: string;
  courseId: string;
  courseName: string;
  name: string; // ej: Grupo A
  instructorId: string;
  instructorName: string;
  classroom: string;
  schedule: string; // ej: Sábados 8:00 AM - 12:00 PM
  capacity: number;
  enrolledCount: number;
  startDate: string;
  endDate: string;
  status: 'Activo' | 'Finalizado' | 'Cancelado';
  createdAt: string;
  isDemo?: boolean;
}

export type EnrollmentStatus = 'Pendiente' | 'Activa' | 'Finalizada' | 'Cancelada' | 'Retirada';

export interface Enrollment {
  id: string;
  enrollmentNumber: string; // MAT-2026-00001
  studentId: string;
  studentName: string;
  studentIdentity: string;
  courseId: string;
  courseName: string;
  groupId: string;
  groupName: string;
  enrollmentDate: string;
  price: number;
  discount: number;
  total: number;
  paymentMethod: string;
  status: EnrollmentStatus;
  createdAt: string;
  updatedAt: string;
  isDemo?: boolean;
}

export type PaymentMethod = 'Efectivo' | 'Transferencia' | 'Depósito' | 'Tarjeta' | 'Otro';

export interface Payment {
  id: string;
  receiptNumber: string; // REC-2026-00001
  studentId: string;
  studentName: string;
  studentIdentity: string;
  enrollmentId: string;
  courseId: string;
  courseName: string;
  concept: string;
  amount: number;
  discount: number;
  total: number;
  date: string;
  method: PaymentMethod;
  userId: string;
  userName: string;
  observations?: string;
  createdAt: string;
  isDemo?: boolean;
}

export type AttendanceStatus = 'Presente' | 'Ausente' | 'Tardanza' | 'Justificado';

export interface AttendanceRecord {
  id: string;
  courseId: string;
  courseName: string;
  groupId: string;
  groupName: string;
  date: string; // YYYY-MM-DD
  studentId: string;
  studentName: string;
  status: AttendanceStatus;
  observations?: string;
  recordedBy: string;
  createdAt: string;
  isDemo?: boolean;
}

export interface GradeRecord {
  id: string;
  courseId: string;
  courseName: string;
  groupId: string;
  groupName: string;
  studentId: string;
  studentName: string;
  evaluationName: string; // ej: Examen Módulo I, Taller Práctico DUA
  grade: number; // 0 - 100
  maxGrade: number;
  date: string;
  observation?: string;
  instructorId: string;
  instructorName: string;
  status?: 'APROBADO' | 'REPROBADO' | 'PENDIENTE';
  createdAt: string;
  isDemo?: boolean;
}

export interface AcademicHistoryEntry {
  courseId: string;
  courseName: string;
  year: number;
  period: string;
  finalGrade: number;
  status: 'Aprobado' | 'Reprobado' | 'Retirado' | 'En curso';
  instructorName: string;
  completedDate?: string;
}

export interface StudentDocument {
  id: string;
  studentId: string;
  studentName: string;
  title: string;
  type: 'Documento académico' | 'Certificado' | 'Comprobante' | 'Fotografía' | 'Otros';
  fileName: string;
  fileSizeBytes: number;
  fileUrl: string;
  uploadedBy: string;
  createdAt: string;
  isDemo?: boolean;
}

export interface CommunicationRecord {
  id: string;
  studentId: string;
  studentName: string;
  date: string;
  type: 'WhatsApp' | 'Llamada' | 'Correo' | 'Nota administrativa';
  message: string;
  userId: string;
  userName: string;
  status: 'Completado' | 'Pendiente' | 'Enviado';
  createdAt: string;
  isDemo?: boolean;
}

export type CRMStage = 'nuevo' | 'interesado' | 'seguimiento' | 'pago_pendiente' | 'matriculado' | 'descartado';

export interface CRMTag {
  id: string;
  name: string;
  color: string;
  bgClass: string;
  textClass: string;
  borderClass: string;
}

export interface CRMNote {
  id: string;
  contactId: string;
  authorId: string;
  authorName: string;
  text: string;
  createdAt: string;
}

export interface WhatsAppQuickReply {
  id: string;
  shortcut: string; // e.g. '/requisitos', '/precios'
  title: string;
  category: 'Admisiones' | 'Pagos' | 'Cursos' | 'Ubicación y Horarios' | 'General';
  content: string;
  tags?: string[];
}

export interface WhatsAppTemplate {
  id: string;
  name: string;
  displayName: string;
  category: 'MARKETING' | 'UTILITY';
  language: string;
  status: 'APPROVED' | 'PENDING' | 'REJECTED';
  headerText?: string;
  bodyText: string;
  footerText?: string;
  sampleVariables: Record<string, string>;
  buttons?: {
    type: 'QUICK_REPLY' | 'URL' | 'PHONE_NUMBER';
    text: string;
    url?: string;
    phoneNumber?: string;
  }[];
}

export interface WhatsAppContact {
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
  // CRM Attributes
  tags?: string[];
  crmStage?: CRMStage;
  courseInterest?: string;
  assignedAdvisorId?: string;
  assignedAdvisorName?: string;
  estimatedValue?: number;
  nextFollowUpDate?: string;
  crmNotes?: CRMNote[];
  convertedStudentId?: string;
  convertedEnrollmentId?: string;
  conversionDate?: string;
  isDemo?: boolean;
}

export interface WhatsAppConversation {
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
  // CRM Attributes
  tags?: string[];
  crmStage?: CRMStage;
  courseInterest?: string;
  assignedAdvisorName?: string;
  isDemo?: boolean;
}

export interface WhatsAppMessage {
  id: string;
  conversationId: string;
  contactId: string;
  messageId: string; // Meta message ID
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

export interface AuditLog {
  id: string;
  userId: string;
  userName: string;
  role: string;
  action: string;
  targetModule: string;
  targetId?: string;
  description: string;
  timestamp: string;
  metadata?: Record<string, any>;
}

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'success' | 'alert';
  read: boolean;
  timestamp: string;
  linkModule?: string;
  linkId?: string;
}

export interface SystemSettings {
  id: string;
  academyName: string;
  institutionName?: string;
  legalName: string;
  taxId?: string;
  phone: string;
  email: string;
  address: string;
  city?: string;
  currency?: string;
  currencySymbol: string;
  whatsappNumber: string;
  autoReplyEnabled: boolean;
  updatedAt: string;
}

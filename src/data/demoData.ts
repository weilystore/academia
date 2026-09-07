import {
  Student,
  Course,
  CourseGroup,
  Enrollment,
  Payment,
  AttendanceRecord,
  GradeRecord,
  StudentDocument,
  CommunicationRecord,
  WhatsAppContact,
  WhatsAppConversation,
  WhatsAppMessage,
  AuditLog,
  NotificationItem,
  UserProfile
} from '../types';

export const DEMO_USERS: UserProfile[] = [
  {
    uid: 'user-superadmin-owner',
    email: 'wilmerosales13@gmail.com',
    displayName: 'Wilmer Rosales',
    role: 'SUPERADMIN',
    phone: '+504 9988-0001',
    active: true,
    createdAt: '2025-01-01T08:00:00Z',
    photoUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80'
  }
];

// Clean state: 0 filler data. All modules ready for real records of the academy.
export const INITIAL_STUDENTS: Student[] = [];

export const INITIAL_COURSES: Course[] = [];

export const INITIAL_GROUPS: CourseGroup[] = [];

export const INITIAL_ENROLLMENTS: Enrollment[] = [];

export const INITIAL_PAYMENTS: Payment[] = [];

export const INITIAL_ATTENDANCE: AttendanceRecord[] = [];

export const INITIAL_GRADES: GradeRecord[] = [];

export const INITIAL_DOCUMENTS: StudentDocument[] = [];

export const INITIAL_COMMUNICATIONS: CommunicationRecord[] = [];

export const INITIAL_WHATSAPP_CONTACTS: WhatsAppContact[] = [];

export const INITIAL_WHATSAPP_CONVERSATIONS: WhatsAppConversation[] = [];

export const INITIAL_WHATSAPP_MESSAGES: WhatsAppMessage[] = [];

export const INITIAL_AUDIT_LOGS: AuditLog[] = [
  {
    id: 'audit-init-clean-01',
    userId: 'user-superadmin-owner',
    userName: 'Wilmer Rosales',
    role: 'SUPERADMIN',
    action: 'Sistema en Producción',
    targetModule: 'Sistema',
    description: 'Sistema configurado en limpio sin datos de relleno. Listo para registrar la información real de Millennium Academy.',
    timestamp: new Date().toISOString()
  }
];

export const INITIAL_NOTIFICATIONS: NotificationItem[] = [
  {
    id: 'notif-ready-01',
    title: 'Sistema Listo para Operación Real',
    message: 'La base de datos se encuentra limpia y lista para registrar los cursos, grupos y estudiantes reales de la academia.',
    type: 'info',
    read: false,
    timestamp: new Date().toISOString()
  }
];

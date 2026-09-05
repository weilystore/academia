import React, { createContext, useContext, useState, useEffect } from 'react';
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
  SystemSettings,
  CRMStage,
  CRMTag,
  CRMNote,
  WhatsAppQuickReply,
  WhatsAppTemplate
} from '../types';
import {
  INITIAL_STUDENTS,
  INITIAL_COURSES,
  INITIAL_GROUPS,
  INITIAL_ENROLLMENTS,
  INITIAL_PAYMENTS,
  INITIAL_ATTENDANCE,
  INITIAL_GRADES,
  INITIAL_DOCUMENTS,
  INITIAL_COMMUNICATIONS,
  INITIAL_WHATSAPP_CONTACTS,
  INITIAL_WHATSAPP_CONVERSATIONS,
  INITIAL_WHATSAPP_MESSAGES,
  INITIAL_AUDIT_LOGS,
  INITIAL_NOTIFICATIONS
} from '../data/demoData';
import {
  DEFAULT_CRM_TAGS,
  DEFAULT_QUICK_REPLIES,
  DEFAULT_WHATSAPP_TEMPLATES,
  ENRICHED_CRM_CONTACTS,
  ENRICHED_CRM_CONVERSATIONS
} from '../data/crmData';
import { db } from '../firebase/config';
import {
  collection,
  getDocs,
  setDoc,
  doc,
  deleteDoc
} from 'firebase/firestore';
import { useAuth } from './AuthContext';

interface DataContextType {
  students: Student[];
  courses: Course[];
  groups: CourseGroup[];
  enrollments: Enrollment[];
  payments: Payment[];
  attendance: AttendanceRecord[];
  grades: GradeRecord[];
  documents: StudentDocument[];
  communications: CommunicationRecord[];
  whatsappContacts: WhatsAppContact[];
  whatsappConversations: WhatsAppConversation[];
  whatsappMessages: WhatsAppMessage[];
  auditLogs: AuditLog[];
  notifications: NotificationItem[];
  settings: SystemSettings;
  loading: boolean;
  
  // Student operations
  findDuplicateStudent: (data: { identityNumber?: string; phone?: string; whatsapp?: string; email?: string }, excludeId?: string) => Student | null;
  addStudent: (student: Omit<Student, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Student>;
  updateStudent: (id: string, updates: Partial<Student>) => Promise<void>;
  deleteStudent: (id: string) => Promise<void>;

  // Course operations
  addCourse: (course: Omit<Course, 'id' | 'createdAt' | 'updatedAt' | 'enrolledCount'>) => Promise<Course>;
  updateCourse: (id: string, updates: Partial<Course>) => Promise<void>;
  addGroup: (group: Omit<CourseGroup, 'id' | 'createdAt' | 'enrolledCount'>) => Promise<CourseGroup>;

  // Enrollment operations
  createEnrollment: (enrollmentData: Omit<Enrollment, 'id' | 'enrollmentNumber' | 'createdAt' | 'updatedAt'>) => Promise<Enrollment>;
  updateEnrollmentStatus: (id: string, status: Enrollment['status']) => Promise<void>;

  // Payment operations
  addPayment: (paymentData: Omit<Payment, 'id' | 'receiptNumber' | 'createdAt'>) => Promise<Payment>;

  // Attendance operations
  saveAttendanceBatch: (records: Omit<AttendanceRecord, 'id' | 'createdAt'>[]) => Promise<void>;

  // Grade operations
  saveGrade: (grade: Omit<GradeRecord, 'id' | 'createdAt'>) => Promise<GradeRecord>;

  // Document & Communication
  addDocument: (doc: Omit<StudentDocument, 'id' | 'createdAt'>) => Promise<StudentDocument>;
  addCommunication: (comm: Omit<CommunicationRecord, 'id' | 'createdAt'>) => Promise<CommunicationRecord>;

  // WhatsApp operations & CRM
  registeredWhatsAppInfo: { activeNumber: string; verifiedName: string; phoneNumberId: string } | null;
  syncRealWhatsAppInbox: () => Promise<void>;
  startNewWhatsAppChat: (phone: string, name: string, initialMessage?: string) => Promise<{ success: boolean; conversationId?: string; error?: string }>;
  clearAllDemoChats: () => Promise<void>;
  deleteConversation: (conversationId: string) => Promise<void>;
  sendWhatsAppMessage: (toPhone: string, text: string, studentId?: string, templateName?: string) => Promise<{ success: boolean; error?: string }>;
  receiveIncomingWhatsApp: (incoming: { fromPhone: string; senderName: string; textContent: string; messageId?: string }) => Promise<void>;
  convertProspectToStudent: (prospectId: string, updates: Partial<Student>) => Promise<Student>;
  crmTags: CRMTag[];
  quickReplies: WhatsAppQuickReply[];
  whatsappTemplates: WhatsAppTemplate[];
  updateContactCRM: (contactId: string, updates: Partial<WhatsAppContact>) => Promise<void>;
  updateContactStage: (contactId: string, newStage: CRMStage) => Promise<void>;
  addCRMNote: (contactId: string, text: string) => Promise<CRMNote>;
  addQuickReply: (qr: Omit<WhatsAppQuickReply, 'id'>) => Promise<WhatsAppQuickReply>;
  updateQuickReply: (id: string, updates: Partial<WhatsAppQuickReply>) => Promise<void>;
  deleteQuickReply: (id: string) => Promise<void>;
  addCRMTag: (tag: Omit<CRMTag, 'id'>) => Promise<CRMTag>;
  deleteCRMTag: (id: string) => Promise<void>;

  // Notifications & Audit
  markNotificationAsRead: (id: string) => void;
  addAuditLog: (action: string, targetModule: string, targetId: string, description: string) => void;
  resetDemoData: () => void;
  clearAllDataToCleanProduction: () => void;
  restoreDefaultData: () => void;
  updateSettings: (newSettings: Partial<SystemSettings>) => void;
}

const DEFAULT_SETTINGS: SystemSettings = {
  id: 'general',
  academyName: 'Academia de Aduanas',
  institutionName: 'Academia de Aduanas',
  legalName: 'Academia de Formación y Especialización Aduanera S. de R.L.',
  phone: '+504 2239-5000',
  email: 'info@academiadeaduanas.hn',
  address: 'Bulevar Morazán, Edificio Torre Alianza, Piso 6',
  city: 'Tegucigalpa, Honduras',
  currency: 'HNL',
  currencySymbol: 'L',
  taxId: '08011990123456',
  whatsappNumber: '+504 8756-3605',
  autoReplyEnabled: true,
  updatedAt: new Date().toISOString()
};

const DataContext = createContext<DataContextType | undefined>(undefined);

// Ensure complete clean slate for production: purge mock and demo data from localStorage once
if (typeof window !== 'undefined') {
  const PRODUCTION_CLEAN_SLATE_KEY = 'aduanas_clean_production_v10';
  if (!localStorage.getItem(PRODUCTION_CLEAN_SLATE_KEY)) {
    localStorage.removeItem('aduanas_students');
    localStorage.removeItem('aduanas_courses');
    localStorage.removeItem('aduanas_groups');
    localStorage.removeItem('aduanas_enrollments');
    localStorage.removeItem('aduanas_payments');
    localStorage.removeItem('aduanas_attendance');
    localStorage.removeItem('aduanas_grades');
    localStorage.removeItem('aduanas_documents');
    localStorage.removeItem('aduanas_communications');
    localStorage.removeItem('aduanas_wa_contacts');
    localStorage.removeItem('aduanas_wa_conversations');
    localStorage.removeItem('aduanas_wa_messages');
    localStorage.removeItem('aduanas_audit_logs');
    localStorage.removeItem('aduanas_notifications');
    localStorage.setItem(PRODUCTION_CLEAN_SLATE_KEY, 'true');
  }
}

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser } = useAuth();

  const [students, setStudents] = useState<Student[]>(() => {
    const local = localStorage.getItem('aduanas_students');
    return local ? JSON.parse(local) : INITIAL_STUDENTS;
  });

  const [courses, setCourses] = useState<Course[]>(() => {
    const local = localStorage.getItem('aduanas_courses');
    return local ? JSON.parse(local) : INITIAL_COURSES;
  });

  const [groups, setGroups] = useState<CourseGroup[]>(() => {
    const local = localStorage.getItem('aduanas_groups');
    return local ? JSON.parse(local) : INITIAL_GROUPS;
  });

  const [enrollments, setEnrollments] = useState<Enrollment[]>(() => {
    const local = localStorage.getItem('aduanas_enrollments');
    return local ? JSON.parse(local) : INITIAL_ENROLLMENTS;
  });

  const [payments, setPayments] = useState<Payment[]>(() => {
    const local = localStorage.getItem('aduanas_payments');
    return local ? JSON.parse(local) : INITIAL_PAYMENTS;
  });

  const [attendance, setAttendance] = useState<AttendanceRecord[]>(() => {
    const local = localStorage.getItem('aduanas_attendance');
    return local ? JSON.parse(local) : INITIAL_ATTENDANCE;
  });

  const [grades, setGrades] = useState<GradeRecord[]>(() => {
    const local = localStorage.getItem('aduanas_grades');
    return local ? JSON.parse(local) : INITIAL_GRADES;
  });

  const [documents, setDocuments] = useState<StudentDocument[]>(() => {
    const local = localStorage.getItem('aduanas_documents');
    return local ? JSON.parse(local) : INITIAL_DOCUMENTS;
  });

  const [communications, setCommunications] = useState<CommunicationRecord[]>(() => {
    const local = localStorage.getItem('aduanas_communications');
    return local ? JSON.parse(local) : INITIAL_COMMUNICATIONS;
  });

  const [whatsappContacts, setWhatsappContacts] = useState<WhatsAppContact[]>(() => {
    const local = localStorage.getItem('aduanas_wa_contacts');
    if (local) {
      try {
        const parsed: WhatsAppContact[] = JSON.parse(local);
        return parsed.map(c => ({
          ...c,
          tags: c.tags || (c.status === 'ESTUDIANTE' ? ['Matriculado'] : ['Nuevo Prospecto']),
          crmStage: c.crmStage || (c.status === 'ESTUDIANTE' ? 'matriculado' : 'nuevo'),
          crmNotes: c.crmNotes || []
        }));
      } catch (e) {
        console.error(e);
      }
    }
    return ENRICHED_CRM_CONTACTS;
  });

  const [whatsappConversations, setWhatsappConversations] = useState<WhatsAppConversation[]>(() => {
    const local = localStorage.getItem('aduanas_wa_conversations');
    if (local) {
      try {
        const parsed: WhatsAppConversation[] = JSON.parse(local);
        return parsed.map(conv => ({
          ...conv,
          tags: conv.tags || (conv.studentId ? ['Matriculado'] : ['Nuevo Prospecto']),
          crmStage: conv.crmStage || (conv.studentId ? 'matriculado' : 'nuevo')
        }));
      } catch (e) {
        console.error(e);
      }
    }
    return ENRICHED_CRM_CONVERSATIONS;
  });

  const [whatsappMessages, setWhatsappMessages] = useState<WhatsAppMessage[]>(() => {
    const local = localStorage.getItem('aduanas_wa_messages');
    return local ? JSON.parse(local) : INITIAL_WHATSAPP_MESSAGES;
  });

  const [crmTags, setCrmTags] = useState<CRMTag[]>(() => {
    const local = localStorage.getItem('aduanas_crm_tags');
    return local ? JSON.parse(local) : DEFAULT_CRM_TAGS;
  });

  const [quickReplies, setQuickReplies] = useState<WhatsAppQuickReply[]>(() => {
    const local = localStorage.getItem('aduanas_quick_replies');
    return local ? JSON.parse(local) : DEFAULT_QUICK_REPLIES;
  });

  const [whatsappTemplates, setWhatsappTemplates] = useState<WhatsAppTemplate[]>(() => {
    const local = localStorage.getItem('aduanas_wa_templates');
    return local ? JSON.parse(local) : DEFAULT_WHATSAPP_TEMPLATES;
  });

  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(() => {
    const local = localStorage.getItem('aduanas_audit_logs');
    return local ? JSON.parse(local) : INITIAL_AUDIT_LOGS;
  });

  const [notifications, setNotifications] = useState<NotificationItem[]>(() => {
    const local = localStorage.getItem('aduanas_notifications');
    return local ? JSON.parse(local) : INITIAL_NOTIFICATIONS;
  });

  const [settings, setSettings] = useState<SystemSettings>(() => {
    const local = localStorage.getItem('aduanas_settings');
    return local ? JSON.parse(local) : DEFAULT_SETTINGS;
  });

  const [registeredWhatsAppInfo, setRegisteredWhatsAppInfo] = useState<{ activeNumber: string; verifiedName: string; phoneNumberId: string } | null>({
    activeNumber: '+504 8756-3605',
    verifiedName: 'Weily',
    phoneNumberId: '1167765849761918'
  });

  const [loading, setLoading] = useState<boolean>(false);

  // Sync to localStorage
  useEffect(() => {
    localStorage.setItem('aduanas_students', JSON.stringify(students));
  }, [students]);

  useEffect(() => {
    localStorage.setItem('aduanas_courses', JSON.stringify(courses));
  }, [courses]);

  useEffect(() => {
    localStorage.setItem('aduanas_groups', JSON.stringify(groups));
  }, [groups]);

  useEffect(() => {
    localStorage.setItem('aduanas_enrollments', JSON.stringify(enrollments));
  }, [enrollments]);

  useEffect(() => {
    localStorage.setItem('aduanas_payments', JSON.stringify(payments));
  }, [payments]);

  useEffect(() => {
    localStorage.setItem('aduanas_attendance', JSON.stringify(attendance));
  }, [attendance]);

  useEffect(() => {
    localStorage.setItem('aduanas_grades', JSON.stringify(grades));
  }, [grades]);

  useEffect(() => {
    localStorage.setItem('aduanas_documents', JSON.stringify(documents));
  }, [documents]);

  useEffect(() => {
    localStorage.setItem('aduanas_communications', JSON.stringify(communications));
  }, [communications]);

  useEffect(() => {
    localStorage.setItem('aduanas_wa_contacts', JSON.stringify(whatsappContacts));
  }, [whatsappContacts]);

  useEffect(() => {
    localStorage.setItem('aduanas_wa_conversations', JSON.stringify(whatsappConversations));
  }, [whatsappConversations]);

  useEffect(() => {
    localStorage.setItem('aduanas_wa_messages', JSON.stringify(whatsappMessages));
  }, [whatsappMessages]);

  useEffect(() => {
    localStorage.setItem('aduanas_audit_logs', JSON.stringify(auditLogs));
  }, [auditLogs]);

  useEffect(() => {
    localStorage.setItem('aduanas_notifications', JSON.stringify(notifications));
  }, [notifications]);

  useEffect(() => {
    localStorage.setItem('aduanas_settings', JSON.stringify(settings));
  }, [settings]);

  useEffect(() => {
    localStorage.setItem('aduanas_crm_tags', JSON.stringify(crmTags));
  }, [crmTags]);

  useEffect(() => {
    localStorage.setItem('aduanas_quick_replies', JSON.stringify(quickReplies));
  }, [quickReplies]);

  useEffect(() => {
    localStorage.setItem('aduanas_wa_templates', JSON.stringify(whatsappTemplates));
  }, [whatsappTemplates]);

  // Live WhatsApp Inbox Synchronizer from Server
  const syncRealWhatsAppInbox = async () => {
    try {
      const res = await fetch('/api/whatsapp/inbox');
      if (!res.ok) return;
      const data = await res.json();
      if (data.success) {
        if (data.activeNumber) {
          setRegisteredWhatsAppInfo({
            activeNumber: data.activeNumber,
            verifiedName: data.verifiedName || 'Weily',
            phoneNumberId: data.phoneNumberId || ''
          });
        }

        // Merge real conversations from server
        if (Array.isArray(data.conversations) && data.conversations.length > 0) {
          setWhatsappConversations(prev => {
            const map = new Map<string, WhatsAppConversation>(prev.map(c => [c.id, c]));
            data.conversations.forEach((c: WhatsAppConversation) => {
              const existing = map.get(c.id);
              if (existing) {
                // If contact was converted locally to matriculado, prevent stale server polling from reverting it
                const isLocallyMatriculado = existing.crmStage === 'matriculado' && c.crmStage !== 'matriculado';
                map.set(c.id, {
                  ...existing,
                  ...c,
                  crmStage: isLocallyMatriculado ? existing.crmStage : (c.crmStage || existing.crmStage),
                  courseInterest: (c.courseInterest && c.courseInterest.trim()) ? c.courseInterest : existing.courseInterest,
                  assignedAdvisorName: (c.assignedAdvisorName && c.assignedAdvisorName.trim()) ? c.assignedAdvisorName : existing.assignedAdvisorName,
                  studentId: existing.studentId || c.studentId,
                  studentName: existing.studentName || c.studentName,
                  tags: Array.from(new Set([...(existing.tags || []), ...(c.tags || [])]))
                });
              } else {
                map.set(c.id, c);
              }
            });
            return Array.from(map.values()).sort((a, b) =>
              new Date(b.lastMessageTimestamp).getTime() - new Date(a.lastMessageTimestamp).getTime()
            );
          });
        }

        // Merge real messages from server
        if (Array.isArray(data.messages) && data.messages.length > 0) {
          setWhatsappMessages(prev => {
            const map = new Map<string, WhatsAppMessage>(prev.map(m => [m.id, m]));
            data.messages.forEach((m: WhatsAppMessage) => {
              map.set(m.id, m);
            });
            return Array.from(map.values());
          });
        }

        // Merge real contacts from server
        if (Array.isArray(data.contacts) && data.contacts.length > 0) {
          setWhatsappContacts(prev => {
            const map = new Map<string, WhatsAppContact>(prev.map(ct => [ct.id, ct]));
            data.contacts.forEach((ct: WhatsAppContact) => {
              const existing = map.get(ct.id);
              if (existing) {
                // Protect locally converted matriculado stage and ESTUDIANTE status
                const isLocallyMatriculado = existing.crmStage === 'matriculado' && ct.crmStage !== 'matriculado';
                const isLocallyEstudiante = existing.status === 'ESTUDIANTE' && ct.status !== 'ESTUDIANTE';
                map.set(ct.id, {
                  ...existing,
                  ...ct,
                  crmStage: isLocallyMatriculado ? existing.crmStage : (ct.crmStage || existing.crmStage),
                  status: isLocallyEstudiante ? existing.status : (ct.status || existing.status),
                  studentId: existing.studentId || ct.studentId,
                  studentName: existing.studentName || ct.studentName,
                  courseInterest: (ct.courseInterest && ct.courseInterest.trim()) ? ct.courseInterest : existing.courseInterest,
                  assignedAdvisorName: (ct.assignedAdvisorName && ct.assignedAdvisorName.trim()) ? ct.assignedAdvisorName : existing.assignedAdvisorName,
                  estimatedValue: (ct.estimatedValue !== undefined && ct.estimatedValue !== null && ct.estimatedValue > 0) ? ct.estimatedValue : (existing.estimatedValue || 5000),
                  nextFollowUpDate: ct.nextFollowUpDate || existing.nextFollowUpDate,
                  tags: Array.from(new Set([...(existing.tags || []), ...(ct.tags || [])])),
                  crmNotes: (ct.crmNotes && ct.crmNotes.length > 0) ? ct.crmNotes : (existing.crmNotes || [])
                });
              } else {
                map.set(ct.id, ct);
              }
            });
            return Array.from(map.values());
          });
        }
      }
    } catch {
      // Ignore background sync errors
    }
  };

  // Poll server every 5 seconds for real incoming WhatsApp messages
  useEffect(() => {
    syncRealWhatsAppInbox();
    const timer = setInterval(() => {
      syncRealWhatsAppInbox();
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const startNewWhatsAppChat = async (phone: string, name: string, initialMessage?: string) => {
    try {
      const res = await fetch('/api/whatsapp/start-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to: phone, name, message: initialMessage })
      });
      const data = await res.json();
      if (data.conversation) {
        setWhatsappConversations(prev => [data.conversation, ...prev.filter(c => c.id !== data.conversation.id)]);
      }
      if (data.message) {
        setWhatsappMessages(prev => [...prev.filter(m => m.id !== data.message.id), data.message]);
      }
      if (!res.ok || !data.success) {
        return {
          success: false,
          error: data.error || 'No se pudo enviar el mensaje por Meta WhatsApp Cloud API',
          conversationId: data.conversation?.id
        };
      }
      return { success: true, conversationId: data.conversation?.id };
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  };

  const clearAllDemoChats = async () => {
    await fetch('/api/whatsapp/clear-all', { method: 'POST' });
    setWhatsappConversations([]);
    setWhatsappMessages([]);
    setWhatsappContacts([]);
    localStorage.removeItem('aduanas_wa_conversations');
    localStorage.removeItem('aduanas_wa_messages');
    localStorage.removeItem('aduanas_wa_contacts');
  };

  const deleteConversation = async (conversationId: string) => {
    await fetch(`/api/whatsapp/conversations/${conversationId}`, { method: 'DELETE' });
    setWhatsappConversations(prev => prev.filter(c => c.id !== conversationId));
    setWhatsappMessages(prev => prev.filter(m => m.conversationId !== conversationId));
  };

  // Firestore background bootstrap check
  useEffect(() => {
    const syncFirestore = async () => {
      try {
        const studentSnap = await getDocs(collection(db, 'students'));
        if (studentSnap.empty && students.length > 0) {
          console.log('[Firestore] Bootstrapping initial students collection...');
          // Seed the initial students to Firestore
          for (const st of students.slice(0, 3)) {
            await setDoc(doc(db, 'students', st.id), st);
          }
        }
      } catch (e) {
        // Firestore may be in offline or rule check mode, gracefully handled
        console.info('[Firestore] Using reliable reactive state layer:', e);
      }
    };
    syncFirestore();
  }, []);

  // Helper to add audit logs
  const addAuditLog = (action: string, targetModule: string, targetId: string, description: string) => {
    const newLog: AuditLog = {
      id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      userId: currentUser?.uid || 'system',
      userName: currentUser?.displayName || 'Sistema',
      role: currentUser?.role || 'SISTEMA',
      action,
      targetModule,
      targetId,
      description,
      timestamp: new Date().toISOString()
    };
    setAuditLogs(prev => [newLog, ...prev]);

    // Optional firestore write
    try {
      setDoc(doc(db, 'auditLogs', newLog.id), newLog).catch(() => {});
    } catch (e) {}
  };

  // Duplicate student detection
  const findDuplicateStudent = (
    data: { identityNumber?: string; phone?: string; whatsapp?: string; email?: string },
    excludeId?: string
  ): Student | null => {
    const cleanPhone = (p?: string) => (p || '').replace(/[^\d]/g, '');

    return students.find(s => {
      if (excludeId && s.id === excludeId) return false;

      // 1. Check identity (DNI)
      if (data.identityNumber && s.identityNumber) {
        const idA = s.identityNumber.replace(/[^\d]/g, '');
        const idB = data.identityNumber.replace(/[^\d]/g, '');
        if (idA.length > 5 && idA === idB) return true;
      }

      // 2. Check Email
      if (data.email && s.email) {
        if (s.email.trim().toLowerCase() === data.email.trim().toLowerCase()) return true;
      }

      // 3. Check Phone
      if (data.phone && s.phone) {
        const pA = cleanPhone(s.phone);
        const pB = cleanPhone(data.phone);
        if (pA.length >= 8 && pA === pB) return true;
      }

      // 4. Check WhatsApp
      if (data.whatsapp && s.whatsapp) {
        const wA = cleanPhone(s.whatsapp);
        const wB = cleanPhone(data.whatsapp);
        if (wA.length >= 8 && wA === wB) return true;
      }

      return false;
    }) || null;
  };

  // Add Student
  const addStudent = async (studentData: Omit<Student, 'id' | 'createdAt' | 'updatedAt'>): Promise<Student> => {
    const newId = `std-${Date.now().toString().slice(-6)}`;
    const newStudent: Student = {
      ...studentData,
      id: newId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    setStudents(prev => [newStudent, ...prev]);
    addAuditLog('Registro de Estudiante', 'Estudiantes', newStudent.id, `Registró a ${newStudent.firstName} ${newStudent.lastName} (DNI: ${newStudent.identityNumber})`);

    // Sync to Firestore
    try {
      await setDoc(doc(db, 'students', newStudent.id), newStudent);
    } catch (e) {
      console.warn('Firestore write fallback:', e);
    }

    return newStudent;
  };

  // Update Student
  const updateStudent = async (id: string, updates: Partial<Student>): Promise<void> => {
    setStudents(prev =>
      prev.map(s => (s.id === id ? { ...s, ...updates, updatedAt: new Date().toISOString() } : s))
    );

    const student = students.find(s => s.id === id);
    const name = student ? `${student.firstName} ${student.lastName}` : id;
    addAuditLog('Modificación de Estudiante', 'Estudiantes', id, `Actualizó datos del estudiante ${name}`);

    try {
      await setDoc(doc(db, 'students', id), { ...updates, updatedAt: new Date().toISOString() }, { merge: true });
    } catch (e) {}
  };

  // Delete Student
  const deleteStudent = async (id: string): Promise<void> => {
    const target = students.find(s => s.id === id);
    setStudents(prev => prev.filter(s => s.id !== id));
    addAuditLog('Eliminación de Estudiante', 'Estudiantes', id, `Eliminó registro de ${target ? target.firstName : id}`);

    try {
      await deleteDoc(doc(db, 'students', id));
    } catch (e) {}
  };

  // Add Course
  const addCourse = async (courseData: Omit<Course, 'id' | 'createdAt' | 'updatedAt' | 'enrolledCount'>): Promise<Course> => {
    const newId = `crs-${Date.now().toString().slice(-5)}`;
    const newCourse: Course = {
      ...courseData,
      id: newId,
      enrolledCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    setCourses(prev => [newCourse, ...prev]);
    addAuditLog('Creación de Curso', 'Cursos', newCourse.id, `Creó el curso "${newCourse.name}" (${newCourse.code})`);

    try {
      await setDoc(doc(db, 'courses', newCourse.id), newCourse);
    } catch (e) {}

    return newCourse;
  };

  // Update Course
  const updateCourse = async (id: string, updates: Partial<Course>): Promise<void> => {
    setCourses(prev =>
      prev.map(c => (c.id === id ? { ...c, ...updates, updatedAt: new Date().toISOString() } : c))
    );

    addAuditLog('Actualización de Curso', 'Cursos', id, `Modificó información del curso`);

    try {
      await setDoc(doc(db, 'courses', id), { ...updates, updatedAt: new Date().toISOString() }, { merge: true });
    } catch (e) {}
  };

  // Add Group
  const addGroup = async (groupData: Omit<CourseGroup, 'id' | 'createdAt' | 'enrolledCount'>): Promise<CourseGroup> => {
    const newId = `grp-${Date.now().toString().slice(-5)}`;
    const newGroup: CourseGroup = {
      ...groupData,
      id: newId,
      enrolledCount: 0,
      createdAt: new Date().toISOString()
    };

    setGroups(prev => [newGroup, ...prev]);
    addAuditLog('Creación de Grupo', 'Grupos', newGroup.id, `Creó ${newGroup.name} para ${newGroup.courseName}`);

    try {
      await setDoc(doc(db, 'courseGroups', newGroup.id), newGroup);
    } catch (e) {}

    return newGroup;
  };

  // Create Enrollment with MAT-2026-XXXXX format
  const createEnrollment = async (
    enrollmentData: Omit<Enrollment, 'id' | 'enrollmentNumber' | 'createdAt' | 'updatedAt'>
  ): Promise<Enrollment> => {
    const year = new Date().getFullYear();
    const count = enrollments.length + 1;
    const formattedNum = `MAT-${year}-${String(count).padStart(5, '0')}`;
    const newId = `enr-${Date.now().toString().slice(-6)}`;

    const newEnrollment: Enrollment = {
      ...enrollmentData,
      id: newId,
      enrollmentNumber: formattedNum,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    setEnrollments(prev => [newEnrollment, ...prev]);

    // Update course and group enrolled counts
    setCourses(prev =>
      prev.map(c => (c.id === enrollmentData.courseId ? { ...c, enrolledCount: c.enrolledCount + 1 } : c))
    );
    setGroups(prev =>
      prev.map(g => (g.id === enrollmentData.groupId ? { ...g, enrolledCount: g.enrolledCount + 1 } : g))
    );

    // Update student status to 'Activo' if not already
    setStudents(prev =>
      prev.map(s =>
        s.id === enrollmentData.studentId
          ? { ...s, status: 'Activo', currentCourse: enrollmentData.courseName, updatedAt: new Date().toISOString() }
          : s
      )
    );

    addAuditLog(
      'Nueva Matrícula',
      'Matrículas',
      newEnrollment.id,
      `Generó matrícula ${formattedNum} para ${enrollmentData.studentName} en ${enrollmentData.courseName}`
    );

    // Add internal communication record
    const newComm: CommunicationRecord = {
      id: `comm-${Date.now()}`,
      studentId: enrollmentData.studentId,
      studentName: enrollmentData.studentName,
      date: new Date().toISOString(),
      type: 'Nota administrativa',
      message: `Matrícula formalizada en ${enrollmentData.courseName} (${enrollmentData.groupName}). Código: ${formattedNum}.`,
      userId: currentUser?.uid || 'user-recepcion',
      userName: currentUser?.displayName || 'Recepción',
      status: 'Completado',
      createdAt: new Date().toISOString()
    };
    setCommunications(prev => [newComm, ...prev]);

    try {
      await setDoc(doc(db, 'enrollments', newEnrollment.id), newEnrollment);
    } catch (e) {}

    return newEnrollment;
  };

  const updateEnrollmentStatus = async (id: string, status: Enrollment['status']): Promise<void> => {
    setEnrollments(prev =>
      prev.map(e => (e.id === id ? { ...e, status, updatedAt: new Date().toISOString() } : e))
    );
    addAuditLog('Estado de Matrícula', 'Matrículas', id, `Cambió estado a "${status}"`);
  };

  // Add Payment with REC-2026-XXXXX format
  const addPayment = async (paymentData: Omit<Payment, 'id' | 'receiptNumber' | 'createdAt'>): Promise<Payment> => {
    const year = new Date().getFullYear();
    const count = payments.length + 1;
    const formattedReceipt = `REC-${year}-${String(count).padStart(5, '0')}`;
    const newId = `pay-${Date.now().toString().slice(-6)}`;

    const newPayment: Payment = {
      ...paymentData,
      id: newId,
      receiptNumber: formattedReceipt,
      createdAt: new Date().toISOString()
    };

    setPayments(prev => [newPayment, ...prev]);

    addAuditLog(
      'Registro de Pago',
      'Pagos',
      newPayment.id,
      `Registró cobro ${formattedReceipt} por ${settings.currencySymbol} ${newPayment.total.toLocaleString()} (${paymentData.concept}) de ${paymentData.studentName}`
    );

    // Auto add communication note
    const newComm: CommunicationRecord = {
      id: `comm-${Date.now()}`,
      studentId: paymentData.studentId,
      studentName: paymentData.studentName,
      date: new Date().toISOString(),
      type: 'Nota administrativa',
      message: `Pago recibido: ${formattedReceipt} - ${paymentData.concept}. Monto: ${settings.currencySymbol} ${newPayment.total.toLocaleString()} vía ${paymentData.method}.`,
      userId: currentUser?.uid || 'user-recepcion',
      userName: currentUser?.displayName || 'Caja / Recepción',
      status: 'Completado',
      createdAt: new Date().toISOString()
    };
    setCommunications(prev => [newComm, ...prev]);

    try {
      await setDoc(doc(db, 'payments', newPayment.id), newPayment);
    } catch (e) {}

    return newPayment;
  };

  // Save Attendance Batch
  const saveAttendanceBatch = async (records: Omit<AttendanceRecord, 'id' | 'createdAt'>[]): Promise<void> => {
    const newRecords: AttendanceRecord[] = records.map((r, i) => ({
      ...r,
      id: `att-${Date.now()}-${i}`,
      createdAt: new Date().toISOString()
    }));

    // Replace existing records for that course, group, date and student if any
    setAttendance(prev => {
      const keys = new Set(newRecords.map(nr => `${nr.courseId}_${nr.groupId}_${nr.date}_${nr.studentId}`));
      const filtered = prev.filter(p => !keys.has(`${p.courseId}_${p.groupId}_${p.date}_${p.studentId}`));
      return [...newRecords, ...filtered];
    });

    if (records.length > 0) {
      addAuditLog(
        'Toma de Asistencia',
        'Asistencia',
        records[0].groupId,
        `Registró asistencia para ${records.length} estudiantes en ${records[0].courseName} (${records[0].date})`
      );
    }
  };

  // Save Grade
  const saveGrade = async (gradeData: Omit<GradeRecord, 'id' | 'createdAt'>): Promise<GradeRecord> => {
    const status: 'APROBADO' | 'REPROBADO' | 'PENDIENTE' =
      gradeData.grade >= 70 ? 'APROBADO' : 'REPROBADO';

    const newGrade: GradeRecord = {
      ...gradeData,
      id: `grd-${Date.now()}`,
      status,
      createdAt: new Date().toISOString()
    };

    setGrades(prev => [newGrade, ...prev]);

    addAuditLog(
      'Calificación Ingresada',
      'Calificaciones',
      newGrade.id,
      `Registró nota ${newGrade.grade}/${newGrade.maxGrade} para ${newGrade.studentName} en "${newGrade.evaluationName}"`
    );

    try {
      await setDoc(doc(db, 'grades', newGrade.id), newGrade);
    } catch (e) {}

    return newGrade;
  };

  // Add Document
  const addDocument = async (docData: Omit<StudentDocument, 'id' | 'createdAt'>): Promise<StudentDocument> => {
    const newDoc: StudentDocument = {
      ...docData,
      id: `doc-${Date.now()}`,
      createdAt: new Date().toISOString()
    };

    setDocuments(prev => [newDoc, ...prev]);
    addAuditLog('Documento Adjuntado', 'Documentos', newDoc.id, `Subió "${newDoc.title}" para ${newDoc.studentName}`);

    return newDoc;
  };

  // Add Communication
  const addCommunication = async (commData: Omit<CommunicationRecord, 'id' | 'createdAt'>): Promise<CommunicationRecord> => {
    const newComm: CommunicationRecord = {
      ...commData,
      id: `comm-${Date.now()}`,
      createdAt: new Date().toISOString()
    };

    setCommunications(prev => [newComm, ...prev]);
    addAuditLog('Comunicación Registrada', 'Comunicaciones', newComm.id, `${newComm.type} con ${newComm.studentName}`);

    return newComm;
  };

  // Send WhatsApp Message
  const sendWhatsAppMessage = async (
    toPhone: string,
    text: string,
    studentId?: string,
    templateName?: string
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      // Call backend API
      const response = await fetch('/api/whatsapp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: toPhone,
          message: text,
          templateName
        })
      });

      const resData = await response.json();
      const isFailed = !response.ok || !resData.success;

      // Find or create conversation
      const cleanPhone = toPhone.replace(/[^\d]/g, '');
      let conv = whatsappConversations.find(c => c.phone.replace(/[^\d]/g, '') === cleanPhone);

      const msgId = `msg-${Date.now()}`;
      const now = new Date().toISOString();

      if (!conv) {
        // Create conversation and contact
        const student = studentId ? students.find(s => s.id === studentId) : null;
        const contactName = student ? `${student.firstName} ${student.lastName}` : toPhone;
        const newContact: WhatsAppContact = {
          id: `wa-ct-${Date.now()}`,
          phone: toPhone,
          name: contactName,
          whatsappId: cleanPhone,
          studentId: student?.id,
          studentName: contactName,
          status: student ? 'ESTUDIANTE' : 'PROSPECTO',
          lastMessageDate: now,
          unreadCount: 0,
          createdAt: now
        };
        const newConv: WhatsAppConversation = {
          id: `conv-${Date.now()}`,
          contactId: newContact.id,
          phone: toPhone,
          name: contactName,
          studentId: student?.id,
          studentName: contactName,
          lastMessage: text,
          lastMessageTimestamp: now,
          unreadCount: 0,
          status: 'active'
        };

        conv = newConv;
        setWhatsappContacts(prev => [newContact, ...prev]);
        setWhatsappConversations(prev => [newConv, ...prev]);
      } else {
        // Update conversation last message
        setWhatsappConversations(prev =>
          prev.map(c => (c.id === conv!.id ? { ...c, lastMessage: text, lastMessageTimestamp: now } : c))
        );
      }

      // Add message (using server message if returned, otherwise constructed)
      const newMsg: WhatsAppMessage = resData.message || {
        id: msgId,
        conversationId: conv.id,
        contactId: conv.contactId,
        messageId: resData.messageId || `out-${Date.now()}`,
        fromMe: true,
        text,
        type: templateName ? 'template' : 'text',
        status: isFailed ? 'failed' : 'sent',
        errorMessage: isFailed ? (resData.error || 'Fallo de entrega en Meta Cloud API') : undefined,
        errorCode: isFailed ? resData.errorCode : undefined,
        timestamp: now,
        studentId
      };

      setWhatsappMessages(prev => [...prev.filter(m => m.id !== newMsg.id), newMsg]);

      if (isFailed) {
        return { success: false, error: resData.error || 'Error al enviar mensaje a Meta' };
      }

      // Add to student communication record if associated
      if (studentId) {
        const st = students.find(s => s.id === studentId);
        if (st) {
          const commRecord: CommunicationRecord = {
            id: `comm-${Date.now()}`,
            studentId,
            studentName: `${st.firstName} ${st.lastName}`,
            date: now,
            type: 'WhatsApp',
            message: text,
            userId: currentUser?.uid || 'system',
            userName: currentUser?.displayName || 'Academia de Aduanas',
            status: 'Enviado',
            createdAt: now
          };
          setCommunications(prev => [commRecord, ...prev]);
        }
      }

      addAuditLog('Envío WhatsApp', 'WhatsApp', toPhone, `Envió mensaje WhatsApp a ${toPhone}: "${text.slice(0, 40)}..."`);

      return { success: true };
    } catch (err: any) {
      console.error('Error sending WhatsApp message:', err);
      return { success: false, error: err.message };
    }
  };

  // Receive Incoming WhatsApp (Automatic Identification & Prospect Creation)
  const receiveIncomingWhatsApp = async (incoming: {
    fromPhone: string;
    senderName: string;
    textContent: string;
    messageId?: string;
  }): Promise<void> => {
    const cleanPhone = incoming.fromPhone.replace(/[^\d]/g, '');
    const now = new Date().toISOString();

    // Step 1: Automatic search in students by phone or whatsapp
    const matchedStudent = students.find(s => {
      const sPhone = (s.phone || '').replace(/[^\d]/g, '');
      const sWa = (s.whatsapp || '').replace(/[^\d]/g, '');
      return (sPhone.length >= 8 && sPhone === cleanPhone) || (sWa.length >= 8 && sWa === cleanPhone);
    });

    let studentId = matchedStudent?.id;
    let studentFullName = matchedStudent ? `${matchedStudent.firstName} ${matchedStudent.lastName}` : undefined;

    if (!matchedStudent) {
      // Check if this prospect already exists in students
      const existingProspect = students.find(s => {
        const pPhone = (s.phone || '').replace(/[^\d]/g, '');
        const pWa = (s.whatsapp || '').replace(/[^\d]/g, '');
        return (pPhone.length >= 8 && pPhone === cleanPhone) || (pWa.length >= 8 && pWa === cleanPhone);
      });

      if (existingProspect) {
        studentId = existingProspect.id;
        studentFullName = `${existingProspect.firstName} ${existingProspect.lastName}`;
      } else {
        // Auto-create prospect in students list
        const newProspect: Student = {
          id: `prospect-${Date.now()}`,
          identityNumber: `PROSP-${Date.now().toString().slice(-6)}`,
          firstName: incoming.senderName || 'Prospecto',
          lastName: 'WhatsApp',
          gender: 'Otro',
          nationality: 'Hondureña',
          maritalStatus: 'Soltero(a)',
          profession: '',
          emergencyContact: '',
          emergencyPhone: '',
          birthDate: '2000-01-01',
          phone: incoming.fromPhone,
          whatsapp: incoming.fromPhone,
          email: '',
          department: 'Francisco Morazán',
          city: 'Tegucigalpa',
          address: 'Ingresado por WhatsApp Oficial',
          status: 'Prospecto',
          observations: 'Origen: WhatsApp Cloud API Oficial. Prospecto auto-registrado.',
          createdAt: now,
          updatedAt: now
        };
        setStudents(prev => [newProspect, ...prev]);
        studentId = newProspect.id;
        studentFullName = `${newProspect.firstName} ${newProspect.lastName}`;
      }
    }

    let contact = whatsappContacts.find(c => c.phone.replace(/[^\d]/g, '') === cleanPhone);

    if (!contact) {
      // Step 2: If student exists, associate automatically. If not, create as PROSPECTO
      const contactId = `wa-ct-${Date.now()}`;
      contact = {
        id: contactId,
        phone: incoming.fromPhone,
        name: studentFullName || incoming.senderName,
        whatsappId: cleanPhone,
        studentId,
        studentName: studentFullName,
        status: matchedStudent && matchedStudent.status !== 'Prospecto' ? 'ESTUDIANTE' : 'PROSPECTO',
        lastMessageDate: now,
        unreadCount: 1,
        createdAt: now
      };
      setWhatsappContacts(prev => [contact!, ...prev]);
    } else {
      setWhatsappContacts(prev =>
        prev.map(c =>
          c.id === contact!.id
            ? {
                ...c,
                unreadCount: c.unreadCount + 1,
                lastMessageDate: now,
                studentId: studentId || c.studentId,
                studentName: studentFullName || c.studentName,
                status: matchedStudent && matchedStudent.status !== 'Prospecto' ? 'ESTUDIANTE' : c.status
              }
            : c
        )
      );
    }

    // Step 3: Upsert conversation
    let conv = whatsappConversations.find(c => c.contactId === contact!.id);
    if (!conv) {
      conv = {
        id: `conv-${Date.now()}`,
        contactId: contact.id,
        phone: incoming.fromPhone,
        name: contact.name,
        studentId,
        studentName: studentFullName,
        lastMessage: incoming.textContent,
        lastMessageTimestamp: now,
        unreadCount: 1,
        status: 'active'
      };
      setWhatsappConversations(prev => [conv!, ...prev]);
    } else {
      setWhatsappConversations(prev =>
        prev.map(c =>
          c.id === conv!.id
            ? {
                ...c,
                lastMessage: incoming.textContent,
                lastMessageTimestamp: now,
                unreadCount: c.unreadCount + 1,
                studentId: studentId || c.studentId,
                studentName: studentFullName || c.studentName
              }
            : c
        )
      );
    }

    // Step 4: Add message
    const newMsg: WhatsAppMessage = {
      id: `msg-${Date.now()}`,
      conversationId: conv.id,
      contactId: contact.id,
      messageId: incoming.messageId || `wamid.SIM_${Date.now()}`,
      fromMe: false,
      text: incoming.textContent,
      type: 'text',
      status: 'received',
      timestamp: now,
      studentId
    };

    setWhatsappMessages(prev => [...prev, newMsg]);

    // Step 5: Create internal notification
    const newNotif: NotificationItem = {
      id: `notif-${Date.now()}`,
      title: matchedStudent ? `WhatsApp de Estudiante: ${contact.name}` : `Nuevo Prospecto WhatsApp: ${contact.name}`,
      message: incoming.textContent.slice(0, 80),
      type: 'info',
      read: false,
      timestamp: now,
      linkModule: 'whatsapp',
      linkId: conv.id
    };
    setNotifications(prev => [newNotif, ...prev]);

    // Step 6: Log audit
    addAuditLog(
      'WhatsApp Recibido',
      'WhatsApp',
      contact.phone,
      `Mensaje entrante de ${contact.name} (${contact.status})`
    );
  };

  const convertProspectToStudent = async (prospectId: string, updates: Partial<Student>): Promise<Student> => {
    let updated: Student;
    const now = new Date().toISOString();

    // Find the contact associated with this prospect
    const contact = whatsappContacts.find(c => c.studentId === prospectId || c.id === prospectId);
    
    // Check if a student already exists by ID or by phone number
    const existingStudent = students.find(s => 
      s.id === prospectId || 
      (contact && s.phone && s.phone.replace(/\D/g, '') === contact.phone.replace(/\D/g, '')) ||
      (updates.phone && s.phone && s.phone.replace(/\D/g, '') === updates.phone.replace(/\D/g, ''))
    );

    if (existingStudent) {
      updated = {
        ...existingStudent,
        ...updates,
        status: (updates.status && updates.status !== 'Prospecto') ? updates.status : 'Activo',
        updatedAt: now
      };
      setStudents(prev => prev.map(s => (s.id === existingStudent.id ? updated : s)));
    } else {
      // Build a new complete Student record
      const rawName = (contact?.name || updates.firstName || 'Estudiante').trim();
      const nameParts = rawName.split(/\s+/);
      const firstName = updates.firstName || (nameParts.length > 2 ? `${nameParts[0]} ${nameParts[1]}` : nameParts[0] || 'Estudiante');
      const lastName = updates.lastName || (nameParts.length > 2 ? nameParts.slice(2).join(' ') : nameParts.slice(1).join(' ') || 'WhatsApp');

      const contactPhone = contact?.phone || updates.phone || '';

      updated = {
        id: prospectId,
        identityNumber: updates.identityNumber || '',
        firstName,
        lastName,
        gender: updates.gender || 'Otro',
        nationality: updates.nationality || 'Hondureña',
        maritalStatus: updates.maritalStatus || 'Soltero(a)',
        profession: updates.profession || '',
        emergencyContact: updates.emergencyContact || '',
        emergencyPhone: updates.emergencyPhone || '',
        birthDate: updates.birthDate || '1995-01-01',
        phone: contactPhone,
        whatsapp: contactPhone,
        email: updates.email || '',
        department: updates.department || 'Cortés',
        city: updates.city || 'Puerto Cortés',
        address: updates.address || 'Contacto captado vía WhatsApp Oficial',
        status: 'Activo',
        observations: updates.observations || 'Aprobado y convertido a Estudiante Activo directamente desde el Inbox de WhatsApp.',
        createdAt: now,
        updatedAt: now,
        ...updates
      };

      setStudents(prev => [updated, ...prev.filter(s => s.id !== updated.id)]);
    }

    // Persist student to Firestore
    try {
      await setDoc(doc(db, 'students', updated.id), updated, { merge: true });
    } catch (e) {
      console.warn('[Firestore] Error saving converted student:', e);
    }

    const studentFullName = `${updated.firstName} ${updated.lastName}`.trim();

    // Update corresponding WhatsApp contact to ESTUDIANTE and stage to matriculado
    setWhatsappContacts(prev =>
      prev.map(c =>
        c.studentId === prospectId || c.id === prospectId || (contact && c.id === contact.id)
          ? {
              ...c,
              status: 'ESTUDIANTE',
              crmStage: 'matriculado',
              studentId: updated.id,
              studentName: studentFullName,
              tags: Array.from(new Set([...(c.tags || []), 'Matriculado'])),
              conversionDate: now
            }
          : c
      )
    );

    // Update conversation
    setWhatsappConversations(prev =>
      prev.map(conv =>
        conv.studentId === prospectId || (contact && conv.contactId === contact.id)
          ? {
              ...conv,
              crmStage: 'matriculado',
              studentId: updated.id,
              studentName: studentFullName,
              tags: Array.from(new Set([...(conv.tags || []), 'Matriculado']))
            }
          : conv
      )
    );

    // Persist immediately to backend store so background polling never reverts to 'seguimiento'
    const targetContactId = contact ? contact.id : prospectId;
    try {
      await fetch(`/api/whatsapp/contact/${encodeURIComponent(targetContactId)}/crm`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'ESTUDIANTE',
          crmStage: 'matriculado',
          studentId: updated.id,
          studentName: studentFullName,
          tags: Array.from(new Set([...(contact?.tags || []), 'Matriculado'])),
          conversionDate: now
        })
      });
    } catch (err) {
      console.warn('[convertProspectToStudent] Error persisting to server:', err);
    }

    addAuditLog(
      'Conversión de Prospecto',
      'Estudiantes',
      updated.id,
      `Convirtió el prospecto ${updated.firstName} ${updated.lastName} a estudiante regular con estado ${updated.status}`
    );

    return updated;
  };

  const updateContactCRM = async (contactId: string, updates: Partial<WhatsAppContact>): Promise<void> => {
    const cleanId = contactId.replace(/\D/g, '');

    setWhatsappContacts(prev =>
      prev.map(c => {
        const matches =
          c.id === contactId ||
          c.studentId === contactId ||
          (cleanId && cleanId.length >= 8 && c.phone.replace(/\D/g, '').endsWith(cleanId.slice(-8))) ||
          (cleanId && c.whatsappId === cleanId);
        return matches ? { ...c, ...updates } : c;
      })
    );

    if (updates.crmStage || updates.tags || updates.courseInterest || updates.assignedAdvisorName) {
      setWhatsappConversations(prev =>
        prev.map(conv => {
          const matches =
            conv.contactId === contactId ||
            conv.id === contactId ||
            conv.studentId === contactId ||
            (cleanId && cleanId.length >= 8 && conv.phone.replace(/\D/g, '').endsWith(cleanId.slice(-8)));
          if (!matches) return conv;
          return {
            ...conv,
            crmStage: updates.crmStage ?? conv.crmStage,
            tags: updates.tags ?? conv.tags,
            courseInterest: updates.courseInterest ?? conv.courseInterest,
            assignedAdvisorName: updates.assignedAdvisorName ?? conv.assignedAdvisorName
          };
        })
      );
    }

    // If contact is linked to student, sync courseInterest and student status
    if (updates.courseInterest || updates.crmStage === 'matriculado') {
      setStudents(prev =>
        prev.map(s => {
          const matches =
            s.id === contactId ||
            (cleanId && cleanId.length >= 8 && s.phone && s.phone.replace(/\D/g, '').endsWith(cleanId.slice(-8)));
          if (!matches) return s;
          return {
            ...s,
            currentCourse: updates.courseInterest || s.currentCourse,
            status: updates.crmStage === 'matriculado' ? 'Activo' : s.status
          };
        })
      );
    }

    // Persist to backend server real_whatsapp_store
    try {
      const res = await fetch(`/api/whatsapp/contact/${encodeURIComponent(contactId)}/crm`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });
      const data = await res.json();
      if (data?.success && data?.contact) {
        setWhatsappContacts(prev =>
          prev.map(c => (c.id === data.contact.id || (cleanId && c.whatsappId === cleanId) ? { ...c, ...data.contact } : c))
        );
      }
    } catch (err) {
      console.warn('[updateContactCRM] Error persisting to server:', err);
    }

    addAuditLog(
      'Información CRM Actualizada',
      'WhatsApp CRM',
      contactId,
      `Actualizados datos comerciales: etapa=${updates.crmStage || 'sin cambios'}, curso=${updates.courseInterest || 'sin cambios'}`
    );
  };

  const updateContactStage = async (contactId: string, newStage: CRMStage): Promise<void> => {
    await updateContactCRM(contactId, { crmStage: newStage });
    addAuditLog('CRM Etapa Actualizada', 'WhatsApp CRM', contactId, `Cambió de etapa a: ${newStage}`);
  };

  const addCRMNote = async (contactId: string, text: string): Promise<CRMNote> => {
    const cleanId = contactId.replace(/\D/g, '');
    const newNote: CRMNote = {
      id: `note-${Date.now()}`,
      contactId,
      authorId: currentUser?.id || 'user-admin',
      authorName: currentUser?.name || currentUser?.displayName || 'Asesor de Admisiones',
      text,
      createdAt: new Date().toISOString()
    };

    let updatedNotes: CRMNote[] = [];

    setWhatsappContacts(prev =>
      prev.map(c => {
        const matches =
          c.id === contactId ||
          c.studentId === contactId ||
          (cleanId && cleanId.length >= 8 && c.phone.replace(/\D/g, '').endsWith(cleanId.slice(-8))) ||
          (cleanId && c.whatsappId === cleanId);
        if (matches) {
          updatedNotes = [newNote, ...(c.crmNotes || [])];
          return {
            ...c,
            crmNotes: updatedNotes
          };
        }
        return c;
      })
    );

    // Persist note to server backend
    try {
      await fetch(`/api/whatsapp/contact/${encodeURIComponent(contactId)}/crm`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ crmNotes: updatedNotes })
      });
    } catch (err) {
      console.warn('[addCRMNote] Error persisting to server:', err);
    }

    addAuditLog('Nota CRM Agregada', 'WhatsApp CRM', contactId, `Nueva nota interna registrada`);
    return newNote;
  };

  const addQuickReply = async (qr: Omit<WhatsAppQuickReply, 'id'>): Promise<WhatsAppQuickReply> => {
    const newQR: WhatsAppQuickReply = {
      ...qr,
      id: `qr-${Date.now()}`
    };
    setQuickReplies(prev => [newQR, ...prev]);
    addAuditLog('Respuesta Rápida Creada', 'WhatsApp CRM', newQR.shortcut, `Creado atajo ${newQR.shortcut}`);
    return newQR;
  };

  const updateQuickReply = async (id: string, updates: Partial<WhatsAppQuickReply>): Promise<void> => {
    setQuickReplies(prev => prev.map(q => (q.id === id ? { ...q, ...updates } : q)));
  };

  const deleteQuickReply = async (id: string): Promise<void> => {
    setQuickReplies(prev => prev.filter(q => q.id !== id));
  };

  const addCRMTag = async (tag: Omit<CRMTag, 'id'>): Promise<CRMTag> => {
    const newTag: CRMTag = {
      ...tag,
      id: `tag-${Date.now()}`
    };
    setCrmTags(prev => [...prev, newTag]);
    return newTag;
  };

  const deleteCRMTag = async (id: string): Promise<void> => {
    setCrmTags(prev => prev.filter(t => t.id !== id));
  };

  const markNotificationAsRead = (id: string) => {
    setNotifications(prev => prev.map(n => (n.id === id ? { ...n, read: true } : n)));
  };

  const clearAllDataToCleanProduction = () => {
    setStudents([]);
    setCourses([]);
    setGroups([]);
    setEnrollments([]);
    setPayments([]);
    setAttendance([]);
    setGrades([]);
    setDocuments([]);
    setCommunications([]);
    setWhatsappContacts([]);
    setWhatsappConversations([]);
    setWhatsappMessages([]);
    setAuditLogs([
      {
        id: `audit-clean-${Date.now()}`,
        userId: currentUser?.uid || 'user-superadmin-owner',
        userName: currentUser?.displayName || 'Wilmer Rosales',
        role: currentUser?.role || 'SUPERADMIN',
        action: 'Limpieza de Base de Datos',
        targetModule: 'Sistema',
        description: 'Vaciado completo de información para comenzar la operación real de la academia.',
        timestamp: new Date().toISOString()
      }
    ]);
    setNotifications(INITIAL_NOTIFICATIONS);

    // Clear localStorage
    localStorage.removeItem('aduanas_students');
    localStorage.removeItem('aduanas_courses');
    localStorage.removeItem('aduanas_groups');
    localStorage.removeItem('aduanas_enrollments');
    localStorage.removeItem('aduanas_payments');
    localStorage.removeItem('aduanas_attendance');
    localStorage.removeItem('aduanas_grades');
    localStorage.removeItem('aduanas_documents');
    localStorage.removeItem('aduanas_communications');
    localStorage.removeItem('aduanas_wa_contacts');
    localStorage.removeItem('aduanas_wa_conversations');
    localStorage.removeItem('aduanas_wa_messages');
  };

  const resetDemoData = () => {
    clearAllDataToCleanProduction();
  };

  const restoreDefaultData = () => {
    clearAllDataToCleanProduction();
  };

  const updateSettings = (newSettings: Partial<SystemSettings>) => {
    setSettings(prev => ({
      ...prev,
      ...newSettings,
      academyName: newSettings.academyName || newSettings.institutionName || prev.academyName,
      institutionName: newSettings.institutionName || newSettings.academyName || prev.institutionName,
      updatedAt: new Date().toISOString()
    }));
    addAuditLog('Ajustes del Sistema', 'Configuración', 'general', 'Se actualizaron los parámetros institucionales de la academia.');
  };

  return (
    <DataContext.Provider
      value={{
        students,
        courses,
        groups,
        enrollments,
        payments,
        attendance,
        grades,
        documents,
        communications,
        whatsappContacts,
        whatsappConversations,
        whatsappMessages,
        crmTags,
        quickReplies,
        whatsappTemplates,
        auditLogs,
        notifications,
        settings,
        loading,
        findDuplicateStudent,
        addStudent,
        updateStudent,
        deleteStudent,
        addCourse,
        updateCourse,
        addGroup,
        createEnrollment,
        updateEnrollmentStatus,
        addPayment,
        saveAttendanceBatch,
        saveGrade,
        addDocument,
        addCommunication,
        registeredWhatsAppInfo,
        syncRealWhatsAppInbox,
        startNewWhatsAppChat,
        clearAllDemoChats,
        deleteConversation,
        sendWhatsAppMessage,
        receiveIncomingWhatsApp,
        convertProspectToStudent,
        updateContactCRM,
        updateContactStage,
        addCRMNote,
        addQuickReply,
        updateQuickReply,
        deleteQuickReply,
        addCRMTag,
        deleteCRMTag,
        markNotificationAsRead,
        addAuditLog,
        resetDemoData,
        clearAllDataToCleanProduction,
        restoreDefaultData,
        updateSettings
      }}
    >
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData debe utilizarse dentro de un DataProvider');
  }
  return context;
};

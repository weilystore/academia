import React, { useState, useEffect, useMemo } from 'react';
import {
  MessageSquare,
  Send,
  Search,
  Check,
  CheckCheck,
  User,
  GraduationCap,
  CreditCard,
  Plus,
  Phone,
  Sparkles,
  Bot,
  UserPlus,
  ChevronRight,
  Settings,
  Activity,
  Copy,
  ExternalLink,
  ShieldCheck,
  AlertCircle,
  FileText,
  Image as ImageIcon,
  Headphones,
  Video,
  MapPin,
  Smile,
  RefreshCw,
  Zap,
  BarChart3,
  TrendingUp,
  Tag,
  Trash2,
  PlusCircle,
  CheckCircle2,
  PhoneCall,
  AlertTriangle,
  RotateCw,
  Key,
  Info,
  Download
} from 'lucide-react';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { WhatsAppConversation, Student, WhatsAppMessage, CRMStage } from '../../types';
import { StudentFormModal } from '../students/StudentFormModal';
import { CRM_STAGE_CONFIG } from '../../data/crmData';
import { CRMProspectsKanban } from './CRMProspectsKanban';
import { WhatsAppQuickRepliesManager } from './WhatsAppQuickRepliesManager';
import { WhatsAppTemplatesManager } from './WhatsAppTemplatesManager';
import { CRMConversionStats } from './CRMConversionStats';
import { CRMProspectDetailsModal } from './CRMProspectDetailsModal';
import { WhatsAppImageAttachment } from './WhatsAppImageAttachment';
import { WhatsAppLightboxModal } from './WhatsAppLightboxModal';

interface WhatsAppInboxViewProps {
  onOpenQuickEnrollmentForStudent?: (student: Student) => void;
  onOpenQuickPaymentForStudent?: (student: Student) => void;
}

export const WhatsAppInboxView: React.FC<WhatsAppInboxViewProps> = ({
  onOpenQuickEnrollmentForStudent,
  onOpenQuickPaymentForStudent
}) => {
  const {
    whatsappConversations,
    whatsappMessages,
    whatsappContacts,
    students,
    courses,
    enrollments,
    payments,
    sendWhatsAppMessage,
    receiveIncomingWhatsApp,
    convertProspectToStudent,
    updateContactStage,
    quickReplies,
    registeredWhatsAppInfo,
    syncRealWhatsAppInbox,
    startNewWhatsAppChat,
    clearAllDemoChats,
    deleteConversation
  } = useData();
  const { hasPermission } = useAuth();

  // Tab navigation: 'inbox' | 'kanban' | 'quick_replies' | 'templates' | 'stats'
  const [activeTab, setActiveTab] = useState<'inbox' | 'kanban' | 'quick_replies' | 'templates' | 'stats'>('inbox');

  const [activeConvId, setActiveConvId] = useState<string>(whatsappConversations[0]?.id || '');
  const [filterType, setFilterType] = useState<'all' | 'ESTUDIANTE' | 'PROSPECTO'>('all');
  const [search, setSearch] = useState('');
  const [messageText, setMessageText] = useState('');
  const [isSending, setIsSending] = useState(false);

  // CRM Modals & Quick Replies
  const [isCRMModalOpen, setIsCRMModalOpen] = useState(false);
  const [isQuickReplyPopoverOpen, setIsQuickReplyPopoverOpen] = useState(false);

  // Simulator modal/drawer state
  const [isSimulatingOpen, setIsSimulatingOpen] = useState(false);
  const [simPhone, setSimPhone] = useState('+504 9922-3344');
  const [simName, setSimName] = useState('Lic. Francisco Ramos');
  const [simText, setSimText] = useState('Hola, quisiera saber los requisitos y precios para el curso de Clasificación Arancelaria.');

  // Diagnostics modal state
  const [isDiagnosticsOpen, setIsDiagnosticsOpen] = useState(false);
  const [metaStatus, setMetaStatus] = useState<any>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [isTestingConn, setIsTestingConn] = useState(false);
  const [testConnResult, setTestConnResult] = useState<any>(null);
  const [isRunningSuite, setIsRunningSuite] = useState(false);
  const [testSuiteResults, setTestSuiteResults] = useState<any>(null);
  const [isRegisteringNumber, setIsRegisteringNumber] = useState(false);
  const [registerResult, setRegisterResult] = useState<any>(null);

  // Convert prospect to student modal state
  const [isConvertModalOpen, setIsConvertModalOpen] = useState(false);
  const [prospectToConvert, setProspectToConvert] = useState<Student | null>(null);
  const [conversionSuccessMsg, setConversionSuccessMsg] = useState<string | null>(null);
  const [isConvertingQuick, setIsConvertingQuick] = useState(false);

  // Real WhatsApp Chat Initiation Modal
  const [isNewChatModalOpen, setIsNewChatModalOpen] = useState(false);
  const [newChatPhone, setNewChatPhone] = useState('+504 ');
  const [newChatName, setNewChatName] = useState('');
  const [newChatMessage, setNewChatMessage] = useState('');
  const [isStartingChat, setIsStartingChat] = useState(false);
  const [newChatError, setNewChatError] = useState<string | null>(null);
  const [lastCreatedConvId, setLastCreatedConvId] = useState<string | null>(null);
  const [retryingMsgId, setRetryingMsgId] = useState<string | null>(null);
  const [metaConnIssue, setMetaConnIssue] = useState<{ isExpired?: boolean; isNotVerified?: boolean; message: string } | null>(null);

  // Clear demo confirmation
  const [isClearDemoConfirmOpen, setIsClearDemoConfirmOpen] = useState(false);
  const [isClearingDemo, setIsClearingDemo] = useState(false);

  // Manual sync feedback
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncNotice, setSyncNotice] = useState<string | null>(null);

  // Filter for real-only vs all
  const [onlyRealFilter, setOnlyRealFilter] = useState(false);

  // Media Lightbox State
  const [lightboxState, setLightboxState] = useState<{
    isOpen: boolean;
    imageUrl: string;
    title: string;
    downloadUrl: string;
  }>({
    isOpen: false,
    imageUrl: '',
    title: '',
    downloadUrl: ''
  });

  // Fetch Meta status on load or modal open
  const fetchMetaStatus = async () => {
    try {
      const [statusRes, testRes] = await Promise.all([
        fetch('/api/whatsapp/status'),
        fetch('/api/whatsapp/test-connection', { method: 'POST' })
      ]);
      if (statusRes.ok) {
        const data = await statusRes.json();
        setMetaStatus(data);
      }
      if (testRes.ok) {
        const testData = await testRes.json();
        setTestConnResult(testData);
        if (!testData.success) {
          setMetaConnIssue({
            isExpired: testData.isTokenExpired,
            isNotVerified: testData.isNotVerified,
            message: testData.message || 'Error de conexión con Meta'
          });
        } else if (testData.status === 'warning') {
          setMetaConnIssue({
            isNotVerified: true,
            message: testData.message
          });
        } else {
          setMetaConnIssue(null);
        }
      }
    } catch (e) {
      console.warn('Could not fetch whatsapp status', e);
    }
  };

  useEffect(() => {
    fetchMetaStatus();
  }, []);

  const handleTestConnection = async () => {
    setIsTestingConn(true);
    setTestConnResult(null);
    try {
      const res = await fetch('/api/whatsapp/test-connection', { method: 'POST' });
      const data = await res.json();
      setTestConnResult(data);
      if (!data.success) {
        setMetaConnIssue({
          isExpired: data.isTokenExpired,
          isNotVerified: data.isNotVerified,
          message: data.message || 'Error de conexión con Meta'
        });
      } else if (data.status === 'warning') {
        setMetaConnIssue({
          isNotVerified: true,
          message: data.message
        });
      } else {
        setMetaConnIssue(null);
      }
    } catch (e: any) {
      setTestConnResult({ success: false, error: e.message });
    } finally {
      setIsTestingConn(false);
    }
  };

  const handleRetryMessage = async (msgId: string) => {
    setRetryingMsgId(msgId);
    try {
      const res = await fetch('/api/whatsapp/retry-message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messageId: msgId })
      });
      const data = await res.json();
      if (data.success) {
        await syncRealWhatsAppInbox();
      } else {
        alert(data.error || 'No se pudo reenviar el mensaje a Meta');
      }
    } catch (err: any) {
      alert(`Error al reintentar: ${err.message}`);
    } finally {
      setRetryingMsgId(null);
    }
  };

  const handleRunTestSuite = async () => {
    setIsRunningSuite(true);
    setTestSuiteResults(null);
    try {
      const res = await fetch('/api/whatsapp/test-suite');
      const data = await res.json();
      setTestSuiteResults(data);
    } catch (e: any) {
      setTestSuiteResults({ allPassed: false, error: e.message });
    } finally {
      setIsRunningSuite(false);
    }
  };

  const handleRegisterNumber = async () => {
    setIsRegisteringNumber(true);
    setRegisterResult(null);
    try {
      const res = await fetch('/api/whatsapp/register-number', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin: '123456' })
      });
      const data = await res.json();
      setRegisterResult(data);
      if (data.success) {
        handleTestConnection();
      }
    } catch (e: any) {
      setRegisterResult({ success: false, message: e.message });
    } finally {
      setIsRegisteringNumber(false);
    }
  };

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleManualSync = async () => {
    setIsSyncing(true);
    setSyncNotice(null);
    try {
      await syncRealWhatsAppInbox();
      setSyncNotice('Bandeja sincronizada con Meta Cloud API');
      setTimeout(() => setSyncNotice(null), 3000);
    } catch {
      setSyncNotice('Error al sincronizar');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleStartRealChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newChatPhone.trim() || newChatPhone.trim() === '+504') {
      setNewChatError('Por favor ingresa un número de teléfono válido.');
      return;
    }
    setIsStartingChat(true);
    setNewChatError(null);
    try {
      const res = await startNewWhatsAppChat(newChatPhone.trim(), newChatName.trim(), newChatMessage.trim());
      if (res.conversationId) {
        setLastCreatedConvId(res.conversationId);
      }
      if (!res.success) {
        setNewChatError(res.error || 'No se pudo entregar el mensaje por WhatsApp Cloud API.');
      } else {
        setIsNewChatModalOpen(false);
        setNewChatPhone('+504 ');
        setNewChatName('');
        setNewChatMessage('');
        if (res.conversationId) {
          setActiveConvId(res.conversationId);
        }
      }
    } catch (err: any) {
      setNewChatError(err.message || 'Error inesperado al iniciar conversación.');
    } finally {
      setIsStartingChat(false);
    }
  };

  const handleConfirmClearDemo = async () => {
    setIsClearingDemo(true);
    try {
      await clearAllDemoChats();
      setIsClearDemoConfirmOpen(false);
      setActiveConvId('');
    } finally {
      setIsClearingDemo(false);
    }
  };

  const handleDeleteConversation = async (convId: string) => {
    if (confirm('¿Deseas remover esta conversación de la bandeja?')) {
      await deleteConversation(convId);
      if (activeConvId === convId) {
        const remaining = whatsappConversations.filter(c => c.id !== convId);
        setActiveConvId(remaining[0]?.id || '');
      }
    }
  };

  // Active conversation object
  const activeConv = whatsappConversations.find(c => c.id === activeConvId) || whatsappConversations[0];
  const activeContact = useMemo(() => {
    if (!activeConv) return whatsappContacts[0] || null;
    const cleanConvPhone = (activeConv.phone || '').replace(/\D/g, '');
    const found = whatsappContacts.find(ct => {
      if (activeConv.contactId && ct.id === activeConv.contactId) return true;
      if (ct.id === activeConv.id) return true;
      if (cleanConvPhone && cleanConvPhone.length >= 8) {
        const ctPhone = (ct.phone || '').replace(/\D/g, '');
        if (ctPhone.endsWith(cleanConvPhone.slice(-8)) || cleanConvPhone.endsWith(ctPhone.slice(-8))) {
          return true;
        }
      }
      if (activeConv.whatsappId && (ct.whatsappId === activeConv.whatsappId || ct.id === activeConv.whatsappId)) {
        return true;
      }
      return false;
    });

    if (found) return found;

    return {
      id: activeConv.contactId || activeConv.id,
      name: activeConv.name,
      phone: activeConv.phone,
      whatsappId: activeConv.phone?.replace(/\D/g, '') || activeConv.id,
      status: (activeConv.crmStage === 'matriculado' ? 'ESTUDIANTE' : 'PROSPECTO') as 'PROSPECTO' | 'ESTUDIANTE',
      crmStage: activeConv.crmStage || 'nuevo',
      courseInterest: activeConv.courseInterest || '',
      assignedAdvisorName: activeConv.assignedAdvisorName || 'Carlos M. (Admisiones WhatsApp)',
      estimatedValue: 5000,
      tags: activeConv.tags || ['WhatsApp Real'],
      crmNotes: [],
      createdAt: activeConv.lastMessageTimestamp,
      lastInteraction: activeConv.lastMessageTimestamp
    };
  }, [whatsappContacts, activeConv]);
  const activeStudent = useMemo(() => {
    if (activeConv?.studentId) {
      const found = students.find(s => s.id === activeConv.studentId);
      if (found) return found;
    }
    if (activeContact?.studentId) {
      const found = students.find(s => s.id === activeContact.studentId);
      if (found) return found;
    }
    if (activeContact?.phone) {
      const cleanContactPhone = activeContact.phone.replace(/\D/g, '');
      if (cleanContactPhone.length >= 8) {
        const found = students.find(s => s.phone && s.phone.replace(/\D/g, '').endsWith(cleanContactPhone.slice(-8)));
        if (found) return found;
      }
    }
    return null;
  }, [activeConv?.studentId, activeContact?.studentId, activeContact?.phone, students]);

  // Messages of active conversation
  const currentMessages = whatsappMessages.filter(m => m.conversationId === activeConv?.id);

  // Student details if linked
  const studentEnrollments = activeStudent ? enrollments.filter(e => e.studentId === activeStudent.id) : [];
  const studentPayments = activeStudent ? payments.filter(p => p.studentId === activeStudent.id) : [];
  const totalCost = studentEnrollments.reduce((acc, curr) => acc + curr.total, 0);
  const totalPaid = studentPayments.reduce((acc, curr) => acc + curr.total, 0);
  const pendingBalance = Math.max(0, totalCost - totalPaid);

  // Filter conversations
  const filteredConversations = whatsappConversations.filter(conv => {
    if (onlyRealFilter && conv.isDemo) return false;
    const contact = whatsappContacts.find(ct => ct.id === conv.contactId);
    if (filterType !== 'all' && contact?.status !== filterType) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        conv.name.toLowerCase().includes(q) ||
        conv.phone.includes(q) ||
        conv.lastMessage.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageText.trim() || !activeConv) return;

    setIsSending(true);
    await sendWhatsAppMessage(
      activeConv.phone,
      messageText,
      activeConv.studentId
    );
    setMessageText('');
    setIsSending(false);
  };

  const handleApplyTemplate = (templateName: string) => {
    const studentName = activeStudent ? activeStudent.firstName : activeConv?.name.split(' ')[0] || 'Estimado(a)';
    let text = '';

    if (templateName === 'Recordatorio de Pago') {
      text = `Estimado(a) ${studentName}, le saludamos cordialmente de la Academia de Aduanas para recordarle que su cuota mensual está próxima a vencer. Su saldo pendiente es de L ${pendingBalance.toLocaleString()}. Puede realizar su transferencia a nuestras cuentas oficiales. ¡Saludos!`;
    } else if (templateName === 'Bienvenida a Curso') {
      text = `¡Bienvenido(a) a la Academia de Aduanas, ${studentName}! Su matrícula ha sido confirmada con éxito. Las clases inician en los horarios asignados. Cualquier consulta estamos a su entera disposición.`;
    } else if (templateName === 'Aviso de Asistencia') {
      text = `Estimado(a) ${studentName}, de la Dirección Académica le informamos que registramos una inasistencia a su clase de aduanas. Recuerde que el porcentaje mínimo de asistencia para aprobación es del 80%.`;
    } else if (templateName === 'Envío de Calificaciones') {
      text = `Estimado(a) ${studentName}, sus calificaciones del módulo aduanero han sido procesadas en el sistema. Puede consultar su expediente o solicitar su constancia oficial en recepción.`;
    }

    setMessageText(text);
  };

  const handleTriggerSimulation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!simText.trim() || !simPhone.trim()) return;

    await receiveIncomingWhatsApp({
      fromPhone: simPhone,
      senderName: simName,
      textContent: simText
    });

    setIsSimulatingOpen(false);
  };

  // Smart extraction of student details from messages in conversation
  const extractProspectDataFromChat = () => {
    if (!activeContact) return {};
    const convMessages = activeConv ? whatsappMessages.filter(m => m.conversationId === activeConv.id) : [];
    const allText = convMessages.map(m => m.text || '').join('\n');

    const extracted: Partial<Student> = {};

    // 1. Email extraction
    const emailMatch = allText.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/i);
    if (emailMatch) {
      extracted.email = emailMatch[0].trim();
    }

    // 2. Marital Status
    if (/casad[oa]/i.test(allText)) {
      extracted.maritalStatus = 'Casado(a)';
    } else if (/solter[oa]/i.test(allText)) {
      extracted.maritalStatus = 'Soltero(a)';
    } else if (/uni[oó]n libre/i.test(allText)) {
      extracted.maritalStatus = 'Unión Libre';
    }

    // 3. Profession
    const lines = allText.split('\n');
    for (const line of lines) {
      const trimmed = line.trim();
      if (/(?:lcda?\.?|licenciad[oa]|ing(?:enier[oa])?\.?|abogad[oa]|perito|bachiller|doctor[oa]|t[eé]cnic[oa]|administrador|aduaner)/i.test(trimmed)) {
        extracted.profession = trimmed.replace(/\.$/, '');
        break;
      }
    }

    // 4. City and Department
    if (/puerto cort[eé]s/i.test(allText)) {
      extracted.city = 'Puerto Cortés';
      extracted.department = 'Cortés';
    } else if (/san pedro sula/i.test(allText)) {
      extracted.city = 'San Pedro Sula';
      extracted.department = 'Cortés';
    } else if (/choloma/i.test(allText)) {
      extracted.city = 'Choloma';
      extracted.department = 'Cortés';
    } else if (/la ceiba/i.test(allText)) {
      extracted.city = 'La Ceiba';
      extracted.department = 'Atlántida';
    } else if (/tegucigalpa/i.test(allText)) {
      extracted.city = 'Tegucigalpa';
      extracted.department = 'Francisco Morazán';
    }

    // 5. DNI (13 digits or standard hyphenated format)
    const dniMatch = allText.match(/\b\d{4}[-\s]?\d{4}[-\s]?\d{5}\b/);
    if (dniMatch) {
      const clean = dniMatch[0].replace(/\D/g, '');
      if (clean.length === 13) {
        extracted.identityNumber = `${clean.slice(0, 4)}-${clean.slice(4, 8)}-${clean.slice(8)}`;
      }
    }

    return extracted;
  };

  const handleOpenConvertModal = () => {
    if (!activeContact) return;
    const nameParts = activeContact.name.trim().split(/\s+/);
    const fName = nameParts.length > 2 ? `${nameParts[0]} ${nameParts[1]}` : nameParts[0] || 'Prospecto';
    const lName = nameParts.length > 2 ? nameParts.slice(2).join(' ') : nameParts.slice(1).join(' ') || 'WhatsApp';

    const smartExtracted = extractProspectDataFromChat();

    const draft: Student = {
      id: activeContact.studentId || `student-${Date.now()}`,
      identityNumber: smartExtracted.identityNumber || '',
      firstName: fName,
      lastName: lName,
      gender: smartExtracted.gender || 'Otro',
      nationality: 'Hondureña',
      maritalStatus: smartExtracted.maritalStatus || 'Soltero(a)',
      profession: smartExtracted.profession || '',
      emergencyContact: '',
      emergencyPhone: '',
      birthDate: '1995-01-01',
      phone: activeContact.phone,
      whatsapp: activeContact.phone,
      email: smartExtracted.email || '',
      department: smartExtracted.department || 'Cortés',
      city: smartExtracted.city || 'Puerto Cortés',
      address: 'Contacto captado vía WhatsApp Oficial',
      status: 'Activo',
      observations: 'Convertido desde Prospecto WhatsApp Oficial',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...smartExtracted
    };

    setProspectToConvert(draft);
    setIsConvertModalOpen(true);
  };

  const handleQuickConvertToActive = async () => {
    if (!activeContact || isConvertingQuick) return;
    setIsConvertingQuick(true);
    try {
      const smartExtracted = extractProspectDataFromChat();
      const studentIdToUse = activeContact.studentId || `student-${Date.now()}`;
      
      await convertProspectToStudent(studentIdToUse, {
        status: 'Activo',
        observations: 'Aprobado y convertido a Estudiante Activo directamente desde el Inbox de WhatsApp.',
        ...smartExtracted
      });

      setConversionSuccessMsg(`¡${activeContact.name} aprobado exitosamente como Estudiante Activo!`);
      setTimeout(() => setConversionSuccessMsg(null), 5000);
    } catch (err) {
      console.error('[handleQuickConvertToActive] Error:', err);
    } finally {
      setIsConvertingQuick(false);
    }
  };

  const handleOpenChatForContact = (contactId: string) => {
    const conv = whatsappConversations.find(c => c.contactId === contactId);
    if (conv) {
      setActiveConvId(conv.id);
    }
    setActiveTab('inbox');
  };

  const handleInsertQuickReply = (content: string) => {
    setMessageText(content);
    setIsQuickReplyPopoverOpen(false);
    setActiveTab('inbox');
  };

  const handleUpdateActiveContactStage = async (newStage: CRMStage) => {
    if (!activeContact) return;
    await updateContactStage(activeContact.id, newStage);
  };

  // Quick reply autocomplete logic
  const isTypingShortcut = messageText.startsWith('/');
  const matchingQuickReplies = isTypingShortcut
    ? quickReplies.filter(qr => qr.shortcut.toLowerCase().includes(messageText.toLowerCase()) || qr.title.toLowerCase().includes(messageText.slice(1).toLowerCase()))
    : [];

  // Helper to render message content by type
  const renderMessageContent = (msg: WhatsAppMessage) => {
    switch (msg.type) {
      case 'image':
        return (
          <WhatsAppImageAttachment
            msg={msg}
            onOpenLightbox={(imageUrl, title, downloadUrl) => {
              setLightboxState({
                isOpen: true,
                imageUrl,
                title: title || (activeConv ? `Foto enviada por ${activeConv.name}` : 'Fotografía adjunta'),
                downloadUrl
              });
            }}
          />
        );
      case 'document': {
        const docDownloadUrl = msg.mediaId ? `/api/whatsapp/media/${msg.mediaId}/download` : undefined;
        const docViewUrl = msg.mediaId ? `/api/whatsapp/media/${msg.mediaId}` : undefined;
        return (
          <div className="space-y-1.5 max-w-sm">
            <div className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-slate-50 border border-slate-200">
              <div className="flex items-center gap-2.5 min-w-0">
                <FileText className="w-6 h-6 text-rose-500 shrink-0" />
                <div className="min-w-0">
                  <p className="font-semibold text-xs text-slate-800 truncate">{msg.filename || 'Documento / Archivo adjunto'}</p>
                  <p className="text-[10px] text-slate-400">Documento oficial de WhatsApp</p>
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                {docViewUrl && (
                  <a
                    href={docViewUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 transition-colors shadow-2xs"
                    title="Ver documento en pestaña nueva"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}
                {docDownloadUrl && (
                  <a
                    href={docDownloadUrl}
                    download
                    className="p-1.5 rounded-lg bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 text-emerald-700 transition-colors shadow-2xs"
                    title="Descargar documento"
                  >
                    <Download className="w-3.5 h-3.5" />
                  </a>
                )}
              </div>
            </div>
            {msg.caption && <p className="text-xs text-slate-700">{msg.caption}</p>}
          </div>
        );
      }
      case 'audio':
        return (
          <div className="space-y-1.5 py-1 max-w-xs">
            <div className="flex items-center gap-2">
              <Headphones className="w-4 h-4 text-emerald-600 shrink-0" />
              <span className="text-xs font-medium text-slate-800">Nota de voz / Audio WhatsApp</span>
            </div>
            {msg.mediaId && (
              <audio
                controls
                src={`/api/whatsapp/media/${msg.mediaId}`}
                className="w-full h-8 mt-1 rounded-lg"
              />
            )}
          </div>
        );
      case 'video':
        return (
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs font-medium text-slate-700">
              <Video className="w-4 h-4 text-indigo-500" />
              <span>Clip de video adjunto</span>
            </div>
            {msg.caption && <p className="text-xs">{msg.caption}</p>}
          </div>
        );
      case 'location':
        return (
          <div className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg border border-slate-200 text-xs">
            <MapPin className="w-4 h-4 text-rose-500 shrink-0" />
            <div>
              <p className="font-semibold text-slate-800">Ubicación GPS compartida</p>
              {msg.location && (
                <p className="text-[10px] font-mono text-slate-500">
                  Lat: {msg.location.latitude?.toFixed(4)}, Lng: {msg.location.longitude?.toFixed(4)}
                </p>
              )}
            </div>
          </div>
        );
      case 'sticker':
        return (
          <div className="flex items-center gap-1.5 text-xs text-slate-600">
            <Smile className="w-4 h-4 text-amber-500" />
            <span>Sticker de WhatsApp</span>
          </div>
        );
      default:
        return <p className="leading-relaxed whitespace-pre-wrap">{msg.text}</p>;
    }
  };

  return (
    <div className="space-y-4 pb-12">
      {/* Header Banner */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              WHATSAPP BUSINESS EN VIVO
            </span>
            <span className="text-slate-400 text-xs font-mono">&bull; Meta Graph API v21.0</span>
            {syncNotice && (
              <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full animate-fade-in">
                ✓ {syncNotice}
              </span>
            )}
          </div>
          <h2 className="text-xl font-black tracking-tight text-slate-900">
            Bandeja de Mensajería WhatsApp Business
          </h2>
          <div className="flex flex-wrap items-center gap-2.5 mt-1.5">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-medium">
              <PhoneCall className="w-3.5 h-3.5 text-emerald-600" />
              <span>Número Conectado: <strong className="font-mono text-emerald-950 font-bold">{registeredWhatsAppInfo?.activeNumber || '+504 8756-3605'}</strong></span>
              <span className="text-emerald-700 font-semibold">({registeredWhatsAppInfo?.verifiedName || 'Weily'})</span>
            </div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 border border-slate-200 text-slate-600 text-[11px]">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              <span>Webhook Activo &bull; Auto-sync cada 5s</span>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Start Real Chat Button */}
          <button
            onClick={() => {
              setNewChatError(null);
              setIsNewChatModalOpen(true);
            }}
            className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs cursor-pointer transition-colors"
            title="Enviar mensaje WhatsApp real a cualquier número de teléfono"
          >
            <PlusCircle className="w-4 h-4" />
            <span>+ Iniciar Chat Real</span>
          </button>

          {/* Manual Sync Button */}
          <button
            onClick={handleManualSync}
            disabled={isSyncing}
            className="px-3 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs flex items-center gap-1.5 border border-slate-300 shadow-2xs cursor-pointer transition-colors disabled:opacity-50"
            title="Sincronizar mensajes entrantes y salientes ahora"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-emerald-600 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>{isSyncing ? 'Sincronizando...' : 'Sincronizar'}</span>
          </button>

          {/* Diagnostics / Meta Config Trigger */}
          <button
            onClick={() => {
              fetchMetaStatus();
              setIsDiagnosticsOpen(true);
            }}
            className="px-3 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs flex items-center gap-1.5 border border-slate-300 shadow-2xs cursor-pointer transition-colors"
            title="Ver estado de conexión con Meta y diagnóstico de Webhook"
          >
            <Activity className="w-3.5 h-3.5 text-emerald-600" />
            <span>Diagnóstico Meta</span>
          </button>

          {/* Clear Demo Data Button */}
          <button
            onClick={() => setIsClearDemoConfirmOpen(true)}
            className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-rose-700 font-medium text-xs flex items-center gap-1.5 border border-slate-200 cursor-pointer transition-colors"
            title="Limpiar chats de prueba para mantener únicamente mensajes 100% reales"
          >
            <Trash2 className="w-3.5 h-3.5 text-slate-400" />
            <span>Limpiar Demo</span>
          </button>
        </div>
      </div>

      {/* Live Meta Connection Alert Banner */}
      {metaConnIssue && (
        <div className="bg-amber-50 border-2 border-amber-300/80 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-100 border border-amber-300 text-amber-700 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="font-extrabold text-xs text-amber-950">
                  {metaConnIssue.isExpired
                    ? 'Token de Acceso de Meta Expirado (Error #190)'
                    : metaConnIssue.isNotVerified
                    ? 'Número Pendiente de Verificación en Meta (Error #133010)'
                    : 'Atención con Meta WhatsApp Cloud API'}
                </h4>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-200 text-amber-900">
                  Acción requerida
                </span>
              </div>
              <p className="text-[11px] text-amber-800 mt-1 leading-relaxed max-w-3xl">
                {metaConnIssue.message}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
            <button
              type="button"
              onClick={() => {
                fetchMetaStatus();
                setIsDiagnosticsOpen(true);
              }}
              className="px-3.5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer transition-colors flex items-center gap-1.5"
            >
              <Key className="w-3.5 h-3.5" />
              <span>Ver Instrucciones y Solución</span>
            </button>
          </div>
        </div>
      )}

      {/* WhatsApp & CRM Top Module Navigation Tabs */}
      <div className="flex items-center gap-1.5 p-1.5 bg-slate-100/90 rounded-2xl border border-slate-200 overflow-x-auto shadow-2xs">
        <button
          type="button"
          onClick={() => setActiveTab('inbox')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'inbox'
              ? 'bg-white text-slate-900 shadow-xs border border-slate-200/80'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
          }`}
        >
          <MessageSquare className={`w-4 h-4 ${activeTab === 'inbox' ? 'text-emerald-600' : 'text-slate-400'}`} />
          <span>Bandeja de Chats</span>
          <span className="px-1.5 py-0.2 rounded-full bg-slate-100 text-slate-600 text-[10px] font-mono font-bold">
            {whatsappConversations.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('kanban')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'kanban'
              ? 'bg-white text-slate-900 shadow-xs border border-slate-200/80'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
          }`}
        >
          <BarChart3 className={`w-4 h-4 ${activeTab === 'kanban' ? 'text-blue-600' : 'text-slate-400'}`} />
          <span>Embudo CRM (Pipeline)</span>
          <span className="px-1.5 py-0.2 rounded-full bg-blue-50 text-blue-700 text-[10px] font-mono font-bold">
            {whatsappContacts.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('quick_replies')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'quick_replies'
              ? 'bg-white text-slate-900 shadow-xs border border-slate-200/80'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
          }`}
        >
          <Zap className={`w-4 h-4 ${activeTab === 'quick_replies' ? 'text-amber-500' : 'text-slate-400'}`} />
          <span>Respuestas Rápidas</span>
          <span className="px-1.5 py-0.2 rounded-full bg-amber-50 text-amber-700 text-[10px] font-mono font-bold">
            {quickReplies.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('templates')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'templates'
              ? 'bg-white text-slate-900 shadow-xs border border-slate-200/80'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
          }`}
        >
          <FileText className={`w-4 h-4 ${activeTab === 'templates' ? 'text-emerald-600' : 'text-slate-400'}`} />
          <span>Plantillas Oficiales Meta</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('stats')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'stats'
              ? 'bg-white text-slate-900 shadow-xs border border-slate-200/80'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
          }`}
        >
          <TrendingUp className={`w-4 h-4 ${activeTab === 'stats' ? 'text-purple-600' : 'text-slate-400'}`} />
          <span>Estadísticas de Conversión</span>
        </button>
      </div>

      {/* Tab 1: Embudo CRM (Kanban) */}
      {activeTab === 'kanban' && (
        <CRMProspectsKanban
          onOpenChat={handleOpenChatForContact}
          onOpenQuickEnrollment={onOpenQuickEnrollmentForStudent}
          onOpenQuickPayment={onOpenQuickPaymentForStudent}
        />
      )}

      {/* Tab 2: Respuestas Rápidas */}
      {activeTab === 'quick_replies' && (
        <WhatsAppQuickRepliesManager
          onSelectInsert={handleInsertQuickReply}
          activeContactName={activeConv?.name}
        />
      )}

      {/* Tab 3: Plantillas Oficiales */}
      {activeTab === 'templates' && (
        <WhatsAppTemplatesManager
          onOpenChatWithContact={handleOpenChatForContact}
        />
      )}

      {/* Tab 4: Estadísticas de Conversión */}
      {activeTab === 'stats' && (
        <CRMConversionStats />
      )}

      {/* Tab 0: Bandeja de Chats (Default 3-Column Interface) */}
      {activeTab === 'inbox' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden flex flex-col lg:flex-row h-[750px]">
        {/* Left Column: Conversations List */}
        <div className="w-full lg:w-80 border-r border-slate-200 flex flex-col shrink-0 bg-slate-50/50">
          {/* Quick Chat Bar & Filter Options */}
          <div className="p-3 border-b border-slate-200 space-y-2">
            <button
              onClick={() => {
                setNewChatError(null);
                setIsNewChatModalOpen(true);
              }}
              className="w-full py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs transition-colors cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              <span>+ Nuevo Chat Real</span>
            </button>

            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Buscar conversación..."
                className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-white border border-slate-200 text-xs focus:ring-1 focus:ring-emerald-500 focus:outline-hidden"
              />
            </div>

            <div className="flex items-center gap-1">
              {(['all', 'ESTUDIANTE', 'PROSPECTO'] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => setFilterType(tab)}
                  className={`flex-1 py-1 rounded-md text-[11px] font-semibold transition-colors cursor-pointer ${
                    filterType === tab
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                  }`}
                >
                  {tab === 'all' ? 'Todos' : tab === 'ESTUDIANTE' ? 'Estudiantes' : 'Prospectos'}
                </button>
              ))}
            </div>

            <div className="flex items-center justify-between pt-1 px-1 text-[11px] text-slate-500">
              <label className="flex items-center gap-1.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={onlyRealFilter}
                  onChange={e => setOnlyRealFilter(e.target.checked)}
                  className="w-3.5 h-3.5 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500 cursor-pointer"
                />
                <span className="font-semibold text-slate-700">Solo Mensajes Reales</span>
              </label>
              <span className="text-[10px] text-slate-400">
                {filteredConversations.length} {filteredConversations.length === 1 ? 'chat' : 'chats'}
              </span>
            </div>
          </div>

          {/* Conversations Scrollable List */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
            {filteredConversations.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-400 space-y-3">
                <MessageSquare className="w-8 h-8 mx-auto text-slate-300" />
                <p className="font-semibold text-slate-700">No hay conversaciones</p>
                <p className="text-[11px] text-slate-400">
                  {onlyRealFilter
                    ? 'No hay mensajes reales aún. Envía uno desde WhatsApp al +504 8756-3605 o haz clic en "+ Nuevo Chat Real".'
                    : 'La bandeja está vacía. Inicia un nuevo chat con cualquier estudiante o prospecto.'}
                </p>
                <button
                  onClick={() => {
                    setNewChatError(null);
                    setIsNewChatModalOpen(true);
                  }}
                  className="px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 font-bold border border-emerald-200 text-xs hover:bg-emerald-100 cursor-pointer"
                >
                  + Iniciar Chat
                </button>
              </div>
            ) : (
              filteredConversations.map(conv => {
                const contact = whatsappContacts.find(c => c.id === conv.contactId);
                const isSelected = conv.id === activeConv?.id;
                const isStudent = contact?.status === 'ESTUDIANTE';
                const stage = contact?.crmStage || (isStudent ? 'matriculado' : 'nuevo');
                const stageCfg = CRM_STAGE_CONFIG[stage] || CRM_STAGE_CONFIG.nuevo;

                return (
                  <div
                    key={conv.id}
                    onClick={() => setActiveConvId(conv.id)}
                    className={`p-3 flex items-start gap-2.5 cursor-pointer transition-colors group relative ${
                      isSelected ? 'bg-amber-50/80 border-l-4 border-amber-500' : 'hover:bg-slate-100/70'
                    }`}
                  >
                    <div className="w-9 h-9 rounded-full bg-slate-200 flex items-center justify-center text-slate-700 font-bold shrink-0 text-xs border border-slate-300">
                      {conv.name.charAt(0)}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 truncate">
                          <p className={`font-bold text-xs truncate ${isSelected ? 'text-slate-900' : 'text-slate-800'}`}>
                            {conv.name}
                          </p>
                          {conv.isDemo ? (
                            <span className="text-[8px] font-bold px-1 py-0.2 rounded bg-slate-100 text-slate-500 border border-slate-200 shrink-0">
                              DEMO
                            </span>
                          ) : (
                            <span className="text-[8px] font-extrabold px-1 py-0.2 rounded bg-emerald-100 text-emerald-800 border border-emerald-200 shrink-0">
                              REAL
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-slate-400 shrink-0 ml-1">
                          {new Date(conv.lastMessageTimestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>

                      <p className="text-[11px] text-slate-500 truncate mt-0.5">
                        {conv.lastMessage}
                      </p>

                      <div className="flex items-center justify-between mt-1.5 gap-1 flex-wrap">
                        <div className="flex items-center gap-1 flex-wrap">
                          <span className={`px-1.5 py-0.2 rounded text-[9px] font-bold ${stageCfg.bg} ${stageCfg.text} border ${stageCfg.border}`}>
                            {stageCfg.label}
                          </span>
                          {contact?.tags && contact.tags.length > 0 && (
                            <span className="text-[9px] px-1.5 py-0.2 rounded bg-slate-200/70 text-slate-600 font-medium">
                              #{contact.tags[0]}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-1">
                          {conv.unreadCount > 0 && (
                            <span className="w-4 h-4 rounded-full bg-emerald-500 text-white text-[10px] font-bold flex items-center justify-center">
                              {conv.unreadCount}
                            </span>
                          )}

                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteConversation(conv.id);
                            }}
                            className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-rose-600 rounded hover:bg-rose-50 transition-all cursor-pointer"
                            title="Eliminar conversación de la lista"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Middle Column: Active Chat Thread */}
        <div className="flex-1 flex flex-col border-r border-slate-200 bg-[#f8fafc]">
          {!activeConv ? (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-slate-50/50">
              <div className="w-16 h-16 rounded-2xl bg-emerald-100 border border-emerald-200 text-emerald-600 flex items-center justify-center mb-4 shadow-xs">
                <PhoneCall className="w-8 h-8" />
              </div>
              <h3 className="text-base font-extrabold text-slate-800 mb-1">
                WhatsApp Business Conectado y en Espera
              </h3>
              <p className="text-xs text-slate-500 max-w-sm mb-5">
                El número oficial registrado <strong className="text-emerald-950 font-mono font-bold">{registeredWhatsAppInfo?.activeNumber || '+504 8756-3605'}</strong> está activo y sincronizando cada 5 segundos.
              </p>
              <div className="bg-white p-4 rounded-xl border border-slate-200 text-left text-xs max-w-md space-y-3 mb-6 shadow-2xs">
                <div className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[11px] font-bold shrink-0 mt-0.5">1</span>
                  <div>
                    <p className="font-bold text-slate-800">Recibir Mensajes:</p>
                    <p className="text-slate-500 text-[11px]">
                      Cualquier persona que escriba un mensaje al número oficial aparecerá en esta bandeja automáticamente en tiempo real.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[11px] font-bold shrink-0 mt-0.5">2</span>
                  <div>
                    <p className="font-bold text-slate-800">Iniciar Nueva Conversación:</p>
                    <p className="text-slate-500 text-[11px]">
                      Presiona el botón de abajo para enviar un mensaje a cualquier número de teléfono desde tu WhatsApp Business oficial.
                    </p>
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setNewChatError(null);
                  setIsNewChatModalOpen(true);
                }}
                className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-2 shadow-xs cursor-pointer transition-colors"
              >
                <PlusCircle className="w-4 h-4" />
                <span>+ Iniciar Primer Chat Real</span>
              </button>
            </div>
          ) : (
            <>
              {/* Chat Header */}
              <div className="p-3.5 bg-white border-b border-slate-200 flex items-center justify-between shadow-2xs">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-xs">
                    {activeConv.name.charAt(0)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-xs text-slate-900">{activeConv.name}</h3>
                      <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded">
                        {activeContact?.status || 'PROSPECTO'}
                      </span>
                      {activeConv.isDemo ? (
                        <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-slate-100 text-slate-500 border border-slate-200">
                          DEMO
                        </span>
                      ) : (
                        <span className="text-[9px] font-extrabold px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                          WHATSAPP REAL
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] text-slate-400 font-mono">{activeConv.phone}</p>
                  </div>
                </div>

                {/* CRM Controls & Templates in Chat Header */}
                <div className="flex items-center gap-2">
                  {/* Stage Dropdown Selector */}
                  <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 rounded-lg px-2 py-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase hidden sm:inline">Etapa:</span>
                    <select
                      value={activeContact?.crmStage || (activeContact?.status === 'ESTUDIANTE' ? 'matriculado' : 'nuevo')}
                      onChange={e => handleUpdateActiveContactStage(e.target.value as CRMStage)}
                      className="text-[11px] font-bold bg-transparent border-0 cursor-pointer text-slate-800 focus:outline-hidden"
                    >
                      <option value="nuevo">Nuevo Prospecto</option>
                      <option value="interesado">Interesado</option>
                      <option value="seguimiento">En Seguimiento</option>
                      <option value="pago_pendiente">Pago Pendiente</option>
                      <option value="matriculado">Matriculado</option>
                      <option value="descartado">Descartado</option>
                    </select>
                  </div>

                  {/* Ficha CRM Modal Button */}
                  <button
                    type="button"
                    onClick={() => setIsCRMModalOpen(true)}
                    className="px-2.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-[11px] font-semibold flex items-center gap-1.5 shadow-xs cursor-pointer transition-colors"
                    title="Abrir Ficha Comercial Completa del Prospecto"
                  >
                    <FileText className="w-3.5 h-3.5 text-amber-400" />
                    <span>Ficha CRM</span>
                  </button>

                  {/* Quick Template Picker */}
                  <div className="hidden xl:flex items-center gap-1 text-[11px] pl-2 border-l border-slate-200">
                    <button
                      type="button"
                      onClick={() => handleApplyTemplate('Recordatorio de Pago')}
                      className="px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-medium cursor-pointer"
                    >
                      Cobro
                    </button>
                    <button
                      type="button"
                      onClick={() => handleApplyTemplate('Bienvenida a Curso')}
                      className="px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-medium cursor-pointer"
                    >
                      Bienvenida
                    </button>
                  </div>

                  {/* Delete Conversation Button */}
                  <button
                    type="button"
                    onClick={() => handleDeleteConversation(activeConv.id)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer"
                    title="Eliminar esta conversación de la bandeja"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

          {/* Messages Timeline */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3">
            {currentMessages.length === 0 ? (
              <div className="py-16 text-center text-slate-400 text-xs">
                <MessageSquare className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                <p>Inicia la conversación enviando un mensaje directo o una plantilla oficial.</p>
              </div>
            ) : (
              currentMessages.map(msg => {
                const isFailed = msg.fromMe && msg.status === 'failed';

                return (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${msg.fromMe ? 'items-end' : 'items-start'}`}
                  >
                    <div
                      className={`max-w-[85%] sm:max-w-[75%] p-3 rounded-2xl text-xs shadow-2xs ${
                        isFailed
                          ? 'bg-rose-50 border border-rose-300 text-rose-950 rounded-tr-none'
                          : msg.fromMe
                          ? 'bg-emerald-600 text-white rounded-tr-none'
                          : 'bg-white text-slate-800 rounded-tl-none border border-slate-200/80'
                      }`}
                    >
                      {isFailed && (
                        <div className="flex items-center gap-1.5 text-[10px] font-bold text-rose-700 pb-1.5 mb-1.5 border-b border-rose-200">
                          <AlertCircle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                          <span>No entregado al destinatario</span>
                        </div>
                      )}

                      {renderMessageContent(msg)}

                      {isFailed && msg.errorMessage && (
                        <div className="mt-2 p-2 rounded-lg bg-rose-100/90 border border-rose-200 text-rose-900 text-[11px] leading-relaxed">
                          <p className="font-semibold">{msg.errorMessage}</p>
                        </div>
                      )}

                      <div className={`flex items-center justify-between gap-2 mt-2 pt-1 border-t ${isFailed ? 'border-rose-200' : 'border-black/5'}`}>
                        {isFailed ? (
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <button
                              type="button"
                              onClick={() => handleRetryMessage(msg.id)}
                              disabled={retryingMsgId === msg.id}
                              className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-800 bg-rose-200/80 hover:bg-rose-300 px-2 py-1 rounded cursor-pointer transition-colors disabled:opacity-50"
                              title="Intentar reenviar el mensaje a través de Meta"
                            >
                              <RotateCw className={`w-3 h-3 ${retryingMsgId === msg.id ? 'animate-spin' : ''}`} />
                              <span>{retryingMsgId === msg.id ? 'Reintentando...' : 'Reintentar'}</span>
                            </button>

                            {(msg.errorCode === 131047 || msg.errorMessage?.toLowerCase().includes('24h') || msg.errorMessage?.toLowerCase().includes('plantilla')) && (
                              <button
                                type="button"
                                onClick={() => setActiveTab('templates')}
                                className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-900 bg-amber-100 hover:bg-amber-200 border border-amber-300 px-2 py-1 rounded cursor-pointer transition-colors shadow-2xs"
                                title="Ir a Plantillas Oficiales de Meta para iniciar o reanudar el chat"
                              >
                                <FileText className="w-3 h-3 text-amber-700" />
                                <span>Usar Plantilla Oficial Meta</span>
                              </button>
                            )}
                          </div>
                        ) : <span />}

                        <div className="flex items-center gap-1">
                          <span className={`text-[9px] ${isFailed ? 'text-rose-600 font-mono' : msg.fromMe ? 'text-emerald-200' : 'text-slate-400'}`}>
                            {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                          {msg.fromMe && (
                            isFailed ? (
                              <AlertTriangle className="w-3.5 h-3.5 text-rose-600" title="Error de entrega en Meta" />
                            ) : msg.status === 'read' ? (
                              <CheckCheck className="w-3.5 h-3.5 text-cyan-300" title="Leído" />
                            ) : msg.status === 'delivered' ? (
                              <CheckCheck className="w-3.5 h-3.5 text-emerald-200" title="Entregado" />
                            ) : (
                              <Check className="w-3.5 h-3.5 text-emerald-300" title="Enviado a Meta" />
                            )
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Autocomplete Floating Bar when typing "/" */}
          {isTypingShortcut && matchingQuickReplies.length > 0 && (
            <div className="bg-white border border-amber-300 rounded-xl shadow-lg p-2 max-h-48 overflow-y-auto mb-1 mx-3 animate-in fade-in slide-in-from-bottom-2">
              <div className="text-[10px] uppercase font-bold text-amber-700 px-2 py-1 flex items-center gap-1">
                <Zap className="w-3 h-3 text-amber-500" /> Respuestas Rápidas Coincidentes (haz clic para insertar):
              </div>
              {matchingQuickReplies.map(qr => (
                <button
                  key={qr.id}
                  type="button"
                  onClick={() => {
                    const studentName = activeConv?.name || 'Estudiante';
                    const courseName = activeStudent?.currentCourse || activeContact?.courseInterest || 'Capacitación Aduanera';
                    const expanded = qr.content
                      .replace(/\{\{nombre\}\}/gi, studentName)
                      .replace(/\{\{curso\}\}/gi, courseName);
                    setMessageText(expanded);
                  }}
                  className="w-full text-left px-2.5 py-1.5 hover:bg-amber-50 rounded-lg text-xs flex items-center justify-between group transition-colors cursor-pointer"
                >
                  <div>
                    <span className="font-mono font-bold text-amber-700 group-hover:underline">{qr.shortcut}</span>
                    <span className="text-slate-700 font-medium ml-2">{qr.title}</span>
                  </div>
                  <span className="text-[10px] text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">{qr.category}</span>
                </button>
              ))}
            </div>
          )}

          {/* Message Composer */}
          <form onSubmit={handleSend} className="p-3 bg-white border-t border-slate-200 flex items-center gap-2 relative">
            {/* Quick Reply Popover Button */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsQuickReplyPopoverOpen(!isQuickReplyPopoverOpen)}
                className={`p-2 rounded-xl text-xs font-semibold flex items-center gap-1 border transition-colors cursor-pointer ${
                  isQuickReplyPopoverOpen
                    ? 'bg-amber-500 text-slate-950 border-amber-600 shadow-xs'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
                }`}
                title="Insertar Respuesta Rápida (/)"
              >
                <Zap className="w-4 h-4 text-amber-500" />
              </button>

              {/* Quick Reply Popover Menu */}
              {isQuickReplyPopoverOpen && (
                <div className="absolute bottom-12 left-0 w-80 bg-white rounded-2xl shadow-xl border border-slate-200 p-3 z-30 space-y-2 animate-in fade-in slide-in-from-bottom-2">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <div className="flex items-center gap-1.5">
                      <Zap className="w-3.5 h-3.5 text-amber-500" />
                      <span className="text-xs font-bold text-slate-800">Respuestas Rápidas</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsQuickReplyPopoverOpen(false)}
                      className="text-slate-400 hover:text-slate-600 text-xs cursor-pointer"
                    >
                      ✕
                    </button>
                  </div>

                  <div className="max-h-60 overflow-y-auto space-y-1 pr-1">
                    {quickReplies.map(qr => (
                      <button
                        key={qr.id}
                        type="button"
                        onClick={() => {
                          const studentName = activeConv?.name || 'Estudiante';
                          const courseName = activeStudent?.currentCourse || activeContact?.courseInterest || 'Capacitación Aduanera';
                          const expanded = qr.content
                            .replace(/\{\{nombre\}\}/gi, studentName)
                            .replace(/\{\{curso\}\}/gi, courseName);
                          handleInsertQuickReply(expanded);
                        }}
                        className="w-full text-left p-2 rounded-xl hover:bg-slate-50 border border-transparent hover:border-slate-200 transition-colors cursor-pointer"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-800 text-[11px]">{qr.title}</span>
                          <span className="font-mono text-[10px] text-amber-700 font-bold bg-amber-50 px-1.5 py-0.5 rounded">
                            {qr.shortcut}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-500 line-clamp-2 mt-0.5">{qr.content}</p>
                      </button>
                    ))}
                  </div>

                  <div className="border-t border-slate-100 pt-2 text-center">
                    <button
                      type="button"
                      onClick={() => {
                        setIsQuickReplyPopoverOpen(false);
                        setActiveTab('quick_replies');
                      }}
                      className="text-[11px] font-bold text-amber-600 hover:text-amber-700 cursor-pointer"
                    >
                      Gestionar todas las plantillas &rarr;
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Plantillas Oficiales Meta Button */}
            <button
              type="button"
              onClick={() => setActiveTab('templates')}
              className="p-2 rounded-xl text-xs font-semibold flex items-center gap-1 border bg-slate-100 hover:bg-emerald-50 hover:border-emerald-300 text-slate-700 hover:text-emerald-800 border-slate-200 transition-colors cursor-pointer"
              title="Ver y Enviar Plantillas Oficiales de Meta (Permite iniciar chats sin restricción de 24h)"
            >
              <FileText className="w-4 h-4 text-emerald-600" />
            </button>

            <input
              type="text"
              value={messageText}
              onChange={e => setMessageText(e.target.value)}
              placeholder={`Escribir a ${activeConv?.name || 'contacto'} (escribe '/' para respuestas rápidas)...`}
              className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 focus:outline-hidden"
            />
            <button
              type="submit"
              disabled={isSending || !messageText.trim()}
              className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer transition-colors shadow-xs"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{isSending ? 'Enviando...' : 'Enviar'}</span>
            </button>
          </form>
          </>
          )}
        </div>

        {/* Right Column: Contact & Student Profile Overview */}
        <div className="w-full lg:w-72 border-l border-slate-200 bg-white p-4 overflow-y-auto space-y-4 shrink-0 text-xs">
          <div className="text-center pb-3 border-b border-slate-100">
            <div className="w-16 h-16 rounded-full bg-slate-900 text-amber-400 text-lg font-bold flex items-center justify-center mx-auto mb-2 border-2 border-amber-400 shadow-xs">
              {activeConv?.name.charAt(0)}
            </div>
            <h4 className="font-bold text-sm text-slate-900">{activeConv?.name}</h4>
            <p className="text-[11px] text-slate-500 font-mono mt-0.5">{activeConv?.phone}</p>
            <span className={`inline-block mt-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
              activeContact?.status === 'ESTUDIANTE' ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-100 text-blue-800'
            }`}>
              {activeContact?.status || 'PROSPECTO'}
            </span>
          </div>

          {/* CRM Lead Commercial Summary Card */}
          <div className="p-3 bg-amber-50/60 rounded-xl border border-amber-200/80 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800">Ficha Comercial CRM</span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                CRM_STAGE_CONFIG[activeContact?.crmStage || (activeContact?.status === 'ESTUDIANTE' ? 'matriculado' : 'nuevo')]?.bg
              } ${
                CRM_STAGE_CONFIG[activeContact?.crmStage || (activeContact?.status === 'ESTUDIANTE' ? 'matriculado' : 'nuevo')]?.text
              }`}>
                {CRM_STAGE_CONFIG[activeContact?.crmStage || (activeContact?.status === 'ESTUDIANTE' ? 'matriculado' : 'nuevo')]?.label}
              </span>
            </div>

            <div className="space-y-1.5 text-[11px]">
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Curso de Interés:</span>
                <span className="font-semibold text-slate-800 text-right truncate max-w-[130px]">
                  {activeContact?.courseInterest || activeStudent?.currentCourse || 'No especificado'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Valor Estimado:</span>
                <span className="font-extrabold text-amber-700">
                  L {(activeContact?.estimatedValue || 5000).toLocaleString()}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Asesor Asignado:</span>
                <span className="font-medium text-slate-700">
                  {activeContact?.assignedAdvisorName || 'Academia Aduanas'}
                </span>
              </div>
            </div>

            {/* Tags Chips */}
            {activeContact?.tags && activeContact.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 pt-1 border-t border-amber-200/50">
                {activeContact.tags.map(t => (
                  <span key={t} className="px-1.5 py-0.5 rounded bg-white text-slate-700 text-[9px] font-medium border border-amber-200">
                    #{t}
                  </span>
                ))}
              </div>
            )}

            <button
              type="button"
              onClick={() => setIsCRMModalOpen(true)}
              className="w-full py-1.5 rounded-lg bg-white hover:bg-amber-100/50 text-amber-900 border border-amber-300 font-bold text-[11px] flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs transition-colors"
            >
              <FileText className="w-3.5 h-3.5 text-amber-600" />
              <span>Gestionar Ficha y Notas CRM</span>
            </button>
          </div>

          {/* Success Banner if just converted */}
          {conversionSuccessMsg && (
            <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-xl text-emerald-900 text-xs flex items-start gap-2 shadow-xs animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="font-bold text-[11px] text-emerald-950">¡Convertido a Estudiante!</p>
                <p className="text-[11px] text-emerald-800 leading-tight mt-0.5">{conversionSuccessMsg}</p>
              </div>
            </div>
          )}

          {/* Conditional: If Student Exists */}
          {activeStudent ? (
            <div className="space-y-3">
              <div className="p-3 bg-emerald-50/60 rounded-xl border border-emerald-200 space-y-2">
                <div className="flex items-center justify-between pb-1.5 border-b border-emerald-100">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-800 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                    Estudiante Activo
                  </span>
                  <button
                    onClick={() => {
                      setProspectToConvert(activeStudent);
                      setIsConvertModalOpen(true);
                    }}
                    className="text-[10px] font-bold text-amber-800 hover:text-amber-900 underline cursor-pointer"
                  >
                    Editar Ficha
                  </button>
                </div>
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-500">DNI:</span>
                  <span className="font-mono font-bold text-slate-800">{activeStudent.identityNumber || 'Por registrar'}</span>
                </div>
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-500">Curso:</span>
                  <span className="font-semibold text-amber-700 truncate max-w-[140px]">{activeStudent.currentCourse || 'Sin curso asignado'}</span>
                </div>
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-500">Saldo Pendiente:</span>
                  <span className={`font-extrabold ${pendingBalance > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                    L {pendingBalance.toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Quick Actions for this student */}
              <div className="space-y-1.5">
                {onOpenQuickEnrollmentForStudent && (
                  <button
                    onClick={() => onOpenQuickEnrollmentForStudent(activeStudent)}
                    className="w-full py-2 px-3 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer transition-colors shadow-2xs"
                  >
                    <GraduationCap className="w-3.5 h-3.5" />
                    <span>Nueva Matrícula</span>
                  </button>
                )}

                {onOpenQuickPaymentForStudent && (
                  <button
                    onClick={() => onOpenQuickPaymentForStudent(activeStudent)}
                    className="w-full py-2 px-3 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer transition-colors shadow-2xs"
                  >
                    <CreditCard className="w-3.5 h-3.5 text-amber-400" />
                    <span>Cobrar Saldo</span>
                  </button>
                )}
              </div>
            </div>
          ) : (
            /* Conditional: If PROSPECTO -> Direct button to convert to student */
            <div className="p-4 bg-amber-50 rounded-xl border border-amber-200 text-center space-y-3">
              <UserPlus className="w-6 h-6 mx-auto text-amber-600" />
              <div>
                <p className="font-bold text-amber-900 text-xs">Contacto Prospecto</p>
                <p className="text-[11px] text-amber-800 mt-0.5">
                  Identificado automáticamente como prospecto en la base de datos de Academia de Aduanas.
                </p>
              </div>

              <div className="space-y-2">
                <button
                  onClick={handleOpenConvertModal}
                  className="w-full py-2 px-3 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-xs transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Completar Ficha de Estudiante</span>
                </button>

                <button
                  onClick={handleQuickConvertToActive}
                  disabled={isConvertingQuick}
                  className="w-full py-1.5 px-3 rounded-lg bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 font-semibold text-[11px] flex items-center justify-center gap-1.5 cursor-pointer transition-colors disabled:opacity-50"
                >
                  {isConvertingQuick ? (
                    <>
                      <RotateCw className="w-3.5 h-3.5 text-emerald-600 animate-spin" />
                      <span>Aprobando como Estudiante...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Aprobar como Estudiante Activo</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
      )}

      {/* Meta WhatsApp Cloud API Diagnostics Modal */}
      {isDiagnosticsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 p-6 space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-600" />
                <h3 className="font-bold text-base text-slate-900">Diagnóstico Meta WhatsApp Cloud API</h3>
              </div>
              <button onClick={() => setIsDiagnosticsOpen(false)} className="text-slate-400 hover:text-slate-600 text-sm cursor-pointer">
                ✕
              </button>
            </div>

            {/* URL Webhook & Verify Token for Meta Developers Console */}
            <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs">
              <h4 className="font-bold text-slate-800 flex items-center gap-1.5">
                <span>Configuración para Meta for Developers</span>
                <span className="text-[10px] font-normal text-slate-500">(Panel de WhatsApp &gt; Configuration)</span>
              </h4>

              <div>
                <label className="block text-slate-500 font-medium mb-1">Callback URL (Webhook URL de Meta):</label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={metaStatus?.environment?.webhookUrl || `${window.location.origin}/api/webhook/whatsapp`}
                    className="flex-1 px-3 py-1.5 rounded-lg bg-white border border-slate-300 font-mono text-[11px] select-all"
                  />
                  <button
                    onClick={() => copyToClipboard(metaStatus?.environment?.webhookUrl || `${window.location.origin}/api/webhook/whatsapp`, 'webhookUrl')}
                    className="px-2.5 py-1.5 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold flex items-center gap-1 cursor-pointer"
                  >
                    {copiedKey === 'webhookUrl' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedKey === 'webhookUrl' ? 'Copiado' : 'Copiar'}</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-slate-500 font-medium mb-1">Verify Token:</label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value="academia_aduanas_webhook_token_2026"
                    className="flex-1 px-3 py-1.5 rounded-lg bg-white border border-slate-300 font-mono text-[11px]"
                  />
                  <button
                    onClick={() => copyToClipboard('academia_aduanas_webhook_token_2026', 'verifyToken')}
                    className="px-2.5 py-1.5 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold flex items-center gap-1 cursor-pointer"
                  >
                    {copiedKey === 'verifyToken' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedKey === 'verifyToken' ? 'Copiado' : 'Copiar'}</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Environment Variables Checklist */}
            <div className="space-y-2 text-xs">
              <h4 className="font-bold text-slate-800">Variables de Entorno Detectadas:</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 font-mono text-[11px]">
                <div className="p-2 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between">
                  <span>META_ACCESS_TOKEN</span>
                  <span className={`px-2 py-0.5 rounded font-bold ${metaStatus?.environment?.hasAccessToken ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'}`}>
                    {metaStatus?.environment?.hasAccessToken ? 'Configurado' : 'Pendiente'}
                  </span>
                </div>
                <div className="p-2 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between">
                  <span>WHATSAPP_PHONE_NUMBER_ID</span>
                  <span className={`px-2 py-0.5 rounded font-bold ${metaStatus?.environment?.hasPhoneNumberId ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'}`}>
                    {metaStatus?.environment?.phoneNumberIdMasked || 'Pendiente'}
                  </span>
                </div>
                <div className="p-2 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between">
                  <span>WHATSAPP_BUSINESS_ACCOUNT_ID</span>
                  <span className={`px-2 py-0.5 rounded font-bold ${metaStatus?.environment?.hasBusinessAccountId ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'}`}>
                    {metaStatus?.environment?.businessAccountIdMasked || 'Pendiente'}
                  </span>
                </div>
                <div className="p-2 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between">
                  <span>META_APP_SECRET (HMAC SHA-256)</span>
                  <span className={`px-2 py-0.5 rounded font-bold ${metaStatus?.environment?.hasAppSecret ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'}`}>
                    {metaStatus?.environment?.hasAppSecret ? 'Activo' : 'Opcional'}
                  </span>
                </div>
              </div>
              <p className="text-[11px] text-slate-500 bg-sky-50 border border-sky-200 text-sky-900 p-2.5 rounded-lg flex items-center gap-1.5">
                <span>💡</span>
                <span>
                  <strong>¿Cómo cambiar o actualizar estos valores?</strong> Abre el menú <strong>Settings</strong> (⚙️ Ajustes) en la esquina superior de Google AI Studio, ingresa a <em>Secrets / Environment Variables</em> y edita los valores correspondientes.
                </span>
              </p>

              {/* Step-by-step resolution card */}
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                <h5 className="font-extrabold text-xs text-slate-900 flex items-center gap-1.5">
                  <Key className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Guía para Renovación de Token Permanente (Meta System User Token)</span>
                </h5>
                <ol className="list-decimal list-inside space-y-1 text-[11px] text-slate-700 leading-relaxed">
                  <li>
                    Ingresa a <a href="https://business.facebook.com/settings" target="_blank" rel="noopener noreferrer" className="text-emerald-700 font-bold underline inline-flex items-center gap-0.5">Meta Business Suite &gt; Configuración del Negocio <ExternalLink className="w-2.5 h-2.5" /></a>.
                  </li>
                  <li>
                    Ve a <strong>Usuarios del Sistema</strong> (System Users) y haz clic en <strong>Agregar</strong> (Rol: Empleado o Administrador).
                  </li>
                  <li>
                    Asigna tu cuenta de WhatsApp con control total y haz clic en <strong>Generar nuevo token</strong>.
                  </li>
                  <li>
                    Selecciona tu App de WhatsApp, marca expiración <strong>&quot;Nunca&quot; (Never)</strong> y activa los permisos <code>whatsapp_business_messaging</code> y <code>whatsapp_business_management</code>.
                  </li>
                  <li>
                    Copia el token generado y actualízalo en <strong>Settings &gt; Secrets &gt; META_ACCESS_TOKEN</strong> en Google AI Studio.
                  </li>
                </ol>
              </div>
            </div>

            {/* Test Action Buttons */}
            <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-200">
              <button
                onClick={handleTestConnection}
                disabled={isTestingConn}
                className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Activity className="w-3.5 h-3.5" />
                <span>{isTestingConn ? 'Comprobando...' : 'Probar Conexión con Meta'}</span>
              </button>

              <button
                onClick={handleRunTestSuite}
                disabled={isRunningSuite}
                className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-amber-400 font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isRunningSuite ? 'animate-spin' : ''}`} />
                <span>{isRunningSuite ? 'Ejecutando...' : 'Ejecutar Suite de 10 Pruebas'}</span>
              </button>

              <button
                onClick={handleRegisterNumber}
                disabled={isRegisteringNumber}
                className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-xs"
                title="Registra y activa el número en Meta con PIN 2FA (resuelve error 133010)"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>{isRegisteringNumber ? 'Activando...' : 'Activar Número con Meta (PIN)'}</span>
              </button>
            </div>

            {/* Registration Result */}
            {registerResult && (
              <div className={`p-3 rounded-xl border text-xs ${registerResult.success ? 'bg-emerald-50 border-emerald-200 text-emerald-900' : 'bg-amber-50 border-amber-200 text-amber-900'}`}>
                <div className="flex items-center gap-2 font-bold mb-1">
                  {registerResult.success ? <Check className="w-4 h-4 text-emerald-600" /> : <AlertCircle className="w-4 h-4 text-amber-600" />}
                  <span>{registerResult.success ? 'Registro en Meta Exitoso' : 'Aviso de Registro en Meta'}</span>
                </div>
                <p>{registerResult.message}</p>
              </div>
            )}

            {/* Connection Test Result */}
            {testConnResult && (
              <div className={`p-3 rounded-xl border text-xs ${testConnResult.success ? 'bg-emerald-50 border-emerald-200 text-emerald-900' : 'bg-amber-50 border-amber-200 text-amber-900'}`}>
                <div className="flex items-center gap-2 font-bold mb-1">
                  {testConnResult.success ? <Check className="w-4 h-4 text-emerald-600" /> : <AlertCircle className="w-4 h-4 text-amber-600" />}
                  <span>{testConnResult.success ? 'Conexión Exitosa con Meta' : 'Aviso de Configuración'}</span>
                </div>
                <p>{testConnResult.error || 'Meta Cloud API respondió correctamente y el número está verificado para envíos.'}</p>
              </div>
            )}

            {/* Test Suite Results Display */}
            {testSuiteResults && (
              <div className="p-3 bg-slate-900 rounded-xl text-white space-y-2 text-xs">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <span className="font-bold text-amber-400">Resultados de Integración ({testSuiteResults.passed}/{testSuiteResults.total})</span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${testSuiteResults.allPassed ? 'bg-emerald-500 text-slate-950' : 'bg-rose-500 text-white'}`}>
                    {testSuiteResults.allPassed ? '10/10 EXITOSO' : 'FALLOS'}
                  </span>
                </div>
                <div className="space-y-1.5 max-h-48 overflow-y-auto">
                  {testSuiteResults.results?.map((r: any) => (
                    <div key={r.id} className="flex items-start gap-2 text-[11px]">
                      <span>{r.passed ? '✅' : '❌'}</span>
                      <div className="flex-1">
                        <span className="font-semibold text-slate-200">{r.name}</span>
                        <p className="text-[10px] text-slate-400">{r.details}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Simulator Modal */}
      {isSimulatingOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2">
                <Bot className="w-5 h-5 text-emerald-600" />
                <h3 className="font-bold text-sm text-slate-900">Simulador de WhatsApp Entrante</h3>
              </div>
              <button onClick={() => setIsSimulatingOpen(false)} className="text-slate-400 hover:text-slate-600">
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-500">
              Prueba la recepción en vivo: El sistema identificará si el número coincide con un estudiante o creará un nuevo prospecto automáticamente.
            </p>

            <form onSubmit={handleTriggerSimulation} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Nombre del Remitente</label>
                <input
                  type="text"
                  required
                  value={simName}
                  onChange={e => setSimName(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-300"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Teléfono Remitente</label>
                <input
                  type="text"
                  required
                  value={simPhone}
                  onChange={e => setSimPhone(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-300 font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Mensaje de Texto</label>
                <textarea
                  rows={3}
                  required
                  value={simText}
                  onChange={e => setSimText(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-300"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsSimulatingOpen(false)}
                  className="px-4 py-2 rounded-lg border border-slate-300 hover:bg-slate-100 font-medium cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold flex items-center gap-1.5 cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Disparar Mensaje</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Convert to Student Form Modal */}
      {isConvertModalOpen && (
        <StudentFormModal
          isOpen={isConvertModalOpen}
          onClose={() => setIsConvertModalOpen(false)}
          studentToEdit={prospectToConvert}
        />
      )}

      {/* CRM Prospect Details Modal */}
      {isCRMModalOpen && (
        <CRMProspectDetailsModal
          isOpen={isCRMModalOpen}
          onClose={() => setIsCRMModalOpen(false)}
          contact={activeContact || null}
          onOpenChat={handleOpenChatForContact}
          onOpenQuickEnrollment={onOpenQuickEnrollmentForStudent}
          onOpenQuickPayment={onOpenQuickPaymentForStudent}
          onUpdated={(updatedContact) => {
            // Keep active conversation fields in sync immediately
            if (activeConv) {
              activeConv.crmStage = updatedContact.crmStage;
              activeConv.courseInterest = updatedContact.courseInterest;
              activeConv.assignedAdvisorName = updatedContact.assignedAdvisorName;
            }
          }}
        />
      )}

      {/* New Real WhatsApp Chat Modal */}
      {isNewChatModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                  <PhoneCall className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-slate-900">Iniciar Chat WhatsApp Real</h3>
                  <p className="text-[11px] text-slate-500">
                    Enviado desde tu número oficial: <strong className="font-mono text-emerald-900">{registeredWhatsAppInfo?.activeNumber || '+504 8756-3605'}</strong>
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsNewChatModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-sm p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            {newChatError && (
              <div className="mb-4 p-3.5 rounded-xl bg-rose-50 border border-rose-300 text-rose-900 text-xs space-y-2">
                <div className="flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="font-bold text-rose-950">No se pudo entregar el mensaje por WhatsApp Cloud API</p>
                    <p className="text-[11px] text-rose-800 mt-1 leading-relaxed">{newChatError}</p>
                  </div>
                </div>
                <div className="pt-2 border-t border-rose-200 flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIsNewChatModalOpen(false);
                      fetchMetaStatus();
                      setIsDiagnosticsOpen(true);
                    }}
                    className="px-2.5 py-1 bg-rose-700 hover:bg-rose-800 text-white rounded-lg text-[11px] font-bold cursor-pointer transition-colors flex items-center gap-1"
                  >
                    <Key className="w-3 h-3" />
                    <span>Abrir Diagnóstico y Solución</span>
                  </button>
                  {lastCreatedConvId && (
                    <button
                      type="button"
                      onClick={() => {
                        setActiveConvId(lastCreatedConvId);
                        setIsNewChatModalOpen(false);
                        setNewChatError(null);
                      }}
                      className="px-2.5 py-1 bg-white hover:bg-rose-100/60 border border-rose-300 text-rose-900 rounded-lg text-[11px] font-semibold cursor-pointer"
                    >
                      Abrir conversación en CRM de todos modos
                    </button>
                  )}
                </div>
              </div>
            )}

            <form onSubmit={handleStartRealChat} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Número de WhatsApp del Destinatario <span className="text-rose-500">*</span>
                </label>
                <input
                  type="tel"
                  required
                  placeholder="+504 9988-7766"
                  value={newChatPhone}
                  onChange={e => setNewChatPhone(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 font-mono text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                />
                <p className="text-[10px] text-slate-400 mt-1">
                  Incluye el código de país (ej. +504 para Honduras).
                </p>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Nombre del Contacto / Alumno (Opcional)
                </label>
                <input
                  type="text"
                  placeholder="Ej. Ing. Carlos Mendoza"
                  value={newChatName}
                  onChange={e => setNewChatName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Mensaje Inicial <span className="text-rose-500">*</span>
                </label>
                <textarea
                  required
                  rows={3}
                  placeholder="Hola, le saludamos desde Academia de Aduanas. ¿En qué podemos servirle hoy?"
                  value={newChatMessage}
                  onChange={e => setNewChatMessage(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                />
              </div>

              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-amber-900 text-[11px] flex items-start gap-2 leading-relaxed">
                <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold">Política de Mensajería de Meta (24 Horas):</span> Si el destinatario nunca ha escrito a su número o pasaron más de 24 horas desde su última respuesta, Meta requiere iniciar con una <strong>Plantilla Oficial (Template)</strong> aprobada o que el cliente le envíe primero un mensaje a su WhatsApp (+504 8756-3605) para abrir la ventana de chat libre.
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  disabled={isStartingChat}
                  onClick={() => setIsNewChatModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 font-semibold hover:bg-slate-50 cursor-pointer disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isStartingChat}
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold flex items-center gap-1.5 cursor-pointer shadow-xs disabled:opacity-50 transition-colors"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{isStartingChat ? 'Despachando...' : 'Iniciar y Enviar'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Clear Demo Confirmation Modal */}
      {isClearDemoConfirmOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-extrabold text-base text-slate-900">Limpiar Chats de Prueba</h3>
                <p className="text-xs text-slate-500">Mantener únicamente mensajes reales</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed mb-5">
              Esta acción removerá las conversaciones de ejemplo/simuladas y dejará la bandeja limpia para recibir y gestionar exclusivamente mensajes 100% reales recibidos en tu número <strong>{registeredWhatsAppInfo?.activeNumber || '+504 8756-3605'}</strong>.
            </p>

            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                disabled={isClearingDemo}
                onClick={() => setIsClearDemoConfirmOpen(false)}
                className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 font-semibold hover:bg-slate-50 cursor-pointer disabled:opacity-50 text-xs"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={isClearingDemo}
                onClick={handleConfirmClearDemo}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold cursor-pointer shadow-xs disabled:opacity-50 transition-colors text-xs"
              >
                {isClearingDemo ? 'Limpiando...' : 'Sí, Limpiar Chats Demo'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* WhatsApp Media Lightbox Modal */}
      <WhatsAppLightboxModal
        isOpen={lightboxState.isOpen}
        onClose={() => setLightboxState(prev => ({ ...prev, isOpen: false }))}
        imageUrl={lightboxState.imageUrl}
        title={lightboxState.title}
        subtitle={activeConv ? `${activeConv.name} (${activeConv.phone})` : undefined}
        downloadUrl={lightboxState.downloadUrl}
      />
    </div>
  );
};

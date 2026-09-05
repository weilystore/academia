import React, { useState } from 'react';
import {
  X,
  User,
  GraduationCap,
  BookOpen,
  History,
  CreditCard,
  CalendarCheck,
  MessageSquare,
  FileText,
  StickyNote,
  Send,
  Plus,
  Phone,
  Mail,
  MapPin,
  CheckCircle,
  AlertCircle,
  Clock,
  Download,
  DollarSign
} from 'lucide-react';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { Student } from '../../types';

interface StudentProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: Student | null;
  onEditStudent: (student: Student) => void;
  onOpenQuickEnrollmentForStudent?: (student: Student) => void;
  onOpenQuickPaymentForStudent?: (student: Student) => void;
}

export const StudentProfileModal: React.FC<StudentProfileModalProps> = ({
  isOpen,
  onClose,
  student,
  onEditStudent,
  onOpenQuickEnrollmentForStudent,
  onOpenQuickPaymentForStudent
}) => {
  const {
    enrollments,
    courses,
    payments,
    attendance,
    grades,
    documents,
    communications,
    whatsappMessages,
    sendWhatsAppMessage,
    addDocument,
    addCommunication,
    settings
  } = useData();
  const { hasPermission, currentUser } = useAuth();

  const [activeTab, setActiveTab] = useState<
    'info' | 'enrollments' | 'courses' | 'history' | 'payments' | 'attendance' | 'whatsapp' | 'documents' | 'notes'
  >('info');

  // WhatsApp quick text state
  const [quickWaText, setQuickWaText] = useState('');
  const [isSendingWa, setIsSendingWa] = useState(false);

  // New Note state
  const [newNoteText, setNewNoteText] = useState('');

  // New Doc state
  const [newDocTitle, setNewDocTitle] = useState('');
  const [newDocType, setNewDocType] = useState('DNI / Cédula');

  if (!isOpen || !student) return null;

  // Filter student-specific records
  const studentEnrollments = enrollments.filter(e => e.studentId === student.id);
  const studentPayments = payments.filter(p => p.studentId === student.id);
  const studentAttendance = attendance.filter(a => a.studentId === student.id);
  const studentGrades = grades.filter(g => g.studentId === student.id);
  const studentDocs = documents.filter(d => d.studentId === student.id);
  const studentNotes = communications.filter(c => c.studentId === student.id);
  const studentWaMessages = whatsappMessages.filter(m => m.studentId === student.id || m.conversationId?.includes(student.id));

  // Attendance stats
  const totalAttSessions = studentAttendance.length;
  const presents = studentAttendance.filter(a => a.status === 'Presente').length;
  const attendancePct = totalAttSessions > 0 ? Math.round((presents / totalAttSessions) * 100) : 100;

  // Financial calculations
  const totalCost = studentEnrollments.reduce((acc, curr) => acc + (curr.total || 0), 0);
  const totalPaid = studentPayments.reduce((acc, curr) => acc + (curr.total || 0), 0);
  const pendingBalance = Math.max(0, totalCost - totalPaid);

  const handleSendWa = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickWaText.trim()) return;
    setIsSendingWa(true);
    await sendWhatsAppMessage(student.whatsapp || student.phone, quickWaText, student.id);
    setQuickWaText('');
    setIsSendingWa(false);
  };

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNoteText.trim()) return;
    await addCommunication({
      studentId: student.id,
      studentName: `${student.firstName} ${student.lastName}`,
      date: new Date().toISOString(),
      type: 'Nota administrativa',
      message: newNoteText,
      userId: currentUser?.uid || 'user',
      userName: currentUser?.displayName || 'Personal',
      status: 'Completado'
    });
    setNewNoteText('');
  };

  const handleAddDoc = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDocTitle.trim()) return;
    await addDocument({
      studentId: student.id,
      studentName: `${student.firstName} ${student.lastName}`,
      title: newDocTitle,
      type: newDocType,
      fileUrl: '#',
      fileSize: '1.2 MB',
      uploadDate: new Date().toISOString(),
      verified: true
    });
    setNewDocTitle('');
  };

  const tabs = [
    { id: 'info', label: '1. Información', icon: User },
    { id: 'enrollments', label: `2. Matrículas (${studentEnrollments.length})`, icon: GraduationCap },
    { id: 'courses', label: '3. Cursos', icon: BookOpen },
    { id: 'history', label: '4. Historial Académico', icon: History },
    { id: 'payments', label: `5. Pagos (L ${totalPaid.toLocaleString()})`, icon: CreditCard },
    { id: 'attendance', label: `6. Asistencia (${attendancePct}%)`, icon: CalendarCheck },
    { id: 'whatsapp', label: '7. WhatsApp', icon: MessageSquare },
    { id: 'documents', label: `8. Documentos (${studentDocs.length})`, icon: FileText },
    { id: 'notes', label: `9. Notas (${studentNotes.length})`, icon: StickyNote },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="w-full max-w-5xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-4 sm:my-6 animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[92vh]">
        {/* Header with Student Photo & Quick Actions */}
        <div className="px-6 py-5 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-950 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-4">
            <img
              src={student.photoUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120'}
              alt={student.firstName}
              className="w-16 h-16 rounded-full object-cover border-2 border-amber-400 shadow-md shrink-0"
            />
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="font-extrabold text-lg sm:text-xl text-white">
                  {student.firstName} {student.lastName}
                </h2>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                  student.status === 'Activo' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' :
                  student.status === 'Prospecto' ? 'bg-blue-500/20 text-blue-300 border border-blue-500/40' :
                  student.status === 'Graduado' ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40' :
                  'bg-slate-700 text-slate-300'
                }`}>
                  {student.status}
                </span>
              </div>
              <div className="flex items-center gap-3 text-xs text-slate-300 mt-1 flex-wrap">
                <span>DNI: <strong className="text-amber-400 font-mono">{student.identityNumber}</strong></span>
                <span>&bull;</span>
                <span className="flex items-center gap-1">
                  <Phone className="w-3 h-3 text-slate-400" /> {student.phone}
                </span>
                <span>&bull;</span>
                <span className="flex items-center gap-1">
                  <Mail className="w-3 h-3 text-slate-400" /> {student.email}
                </span>
              </div>
            </div>
          </div>

          {/* Quick actions in top header */}
          <div className="flex items-center gap-2 shrink-0 flex-wrap">
            <button
              onClick={() => setActiveTab('whatsapp')}
              className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Enviar WhatsApp</span>
            </button>

            {hasPermission('enrollments', 'write') && onOpenQuickEnrollmentForStudent && (
              <button
                onClick={() => onOpenQuickEnrollmentForStudent(student)}
                className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Matricular</span>
              </button>
            )}

            {hasPermission('payments', 'write') && onOpenQuickPaymentForStudent && (
              <button
                onClick={() => onOpenQuickPaymentForStudent(student)}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-300 border border-slate-700 font-semibold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <DollarSign className="w-3.5 h-3.5" />
                <span>Registrar Pago</span>
              </button>
            )}

            <button
              onClick={() => onEditStudent(student)}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold transition-colors cursor-pointer"
            >
              Editar
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Navigation Strip */}
        <div className="border-b border-slate-200 bg-slate-50 px-6 flex items-center gap-2 overflow-x-auto shrink-0 scrollbar-none py-1">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 py-2.5 px-3 border-b-2 font-semibold text-xs whitespace-nowrap transition-colors cursor-pointer ${
                  isActive
                    ? 'border-amber-500 text-slate-950 font-bold bg-white rounded-t-lg shadow-2xs'
                    : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-amber-600' : 'text-slate-400'}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab Content Container */}
        <div className="p-6 overflow-y-auto flex-1 text-xs space-y-6">
          {/* TAB 1: INFORMACIÓN */}
          {activeTab === 'info' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Personal data */}
                <div className="bg-slate-50/70 p-4 rounded-xl border border-slate-200">
                  <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider mb-3 flex items-center gap-2 text-amber-600">
                    <User className="w-3.5 h-3.5" />
                    <span>Datos Personales</span>
                  </h4>
                  <dl className="space-y-2 text-xs">
                    <div>
                      <dt className="text-slate-500 font-medium">Nombre Completo:</dt>
                      <dd className="font-semibold text-slate-800">{student.firstName} {student.lastName}</dd>
                    </div>
                    <div>
                      <dt className="text-slate-500 font-medium">DNI / Cédula:</dt>
                      <dd className="font-semibold font-mono text-slate-800">{student.identityNumber}</dd>
                    </div>
                    <div>
                      <dt className="text-slate-500 font-medium">Fecha de Nacimiento:</dt>
                      <dd className="font-semibold text-slate-800">{student.birthDate || 'No especificada'}</dd>
                    </div>
                    <div>
                      <dt className="text-slate-500 font-medium">Género / Estado Civil:</dt>
                      <dd className="font-semibold text-slate-800">{student.gender || 'N/A'} &bull; {student.maritalStatus || 'N/A'}</dd>
                    </div>
                    <div>
                      <dt className="text-slate-500 font-medium">Nacionalidad:</dt>
                      <dd className="font-semibold text-slate-800">{student.nationality || 'Hondureña'}</dd>
                    </div>
                    <div>
                      <dt className="text-slate-500 font-medium">Profesión:</dt>
                      <dd className="font-semibold text-slate-800">{student.profession || 'No indicada'}</dd>
                    </div>
                  </dl>
                </div>

                {/* Contact & Location */}
                <div className="bg-slate-50/70 p-4 rounded-xl border border-slate-200">
                  <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider mb-3 flex items-center gap-2 text-blue-600">
                    <MapPin className="w-3.5 h-3.5" />
                    <span>Contacto y Residencia</span>
                  </h4>
                  <dl className="space-y-2 text-xs">
                    <div>
                      <dt className="text-slate-500 font-medium">Correo Electrónico:</dt>
                      <dd className="font-semibold text-slate-800">{student.email}</dd>
                    </div>
                    <div>
                      <dt className="text-slate-500 font-medium">Teléfono Celular:</dt>
                      <dd className="font-semibold text-slate-800">{student.phone}</dd>
                    </div>
                    <div>
                      <dt className="text-slate-500 font-medium">WhatsApp:</dt>
                      <dd className="font-semibold text-emerald-700">{student.whatsapp}</dd>
                    </div>
                    <div>
                      <dt className="text-slate-500 font-medium">Dirección Residencial:</dt>
                      <dd className="font-semibold text-slate-800">{student.address || 'No registrada'}</dd>
                    </div>
                    <div>
                      <dt className="text-slate-500 font-medium">Ciudad / Departamento:</dt>
                      <dd className="font-semibold text-slate-800">{student.city}, {student.department}</dd>
                    </div>
                  </dl>
                </div>

                {/* Emergency & Academy Status */}
                <div className="bg-slate-50/70 p-4 rounded-xl border border-slate-200">
                  <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider mb-3 flex items-center gap-2 text-rose-600">
                    <AlertCircle className="w-3.5 h-3.5" />
                    <span>Emergencia y Admisión</span>
                  </h4>
                  <dl className="space-y-2 text-xs">
                    <div>
                      <dt className="text-slate-500 font-medium">Contacto de Emergencia:</dt>
                      <dd className="font-semibold text-slate-800">{student.emergencyContact || 'No especificado'}</dd>
                    </div>
                    <div>
                      <dt className="text-slate-500 font-medium">Teléfono de Emergencia:</dt>
                      <dd className="font-semibold text-slate-800">{student.emergencyPhone || 'No especificado'}</dd>
                    </div>
                    <div>
                      <dt className="text-slate-500 font-medium">Fecha de Registro:</dt>
                      <dd className="font-semibold text-slate-800">
                        {new Date(student.createdAt).toLocaleDateString()}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-slate-500 font-medium">Curso Actual:</dt>
                      <dd className="font-semibold text-amber-700">{student.currentCourse || 'Sin curso activo'}</dd>
                    </div>
                    <div>
                      <dt className="text-slate-500 font-medium">Observaciones:</dt>
                      <dd className="text-slate-600 italic">{student.observations || 'Sin observaciones adicionales.'}</dd>
                    </div>
                  </dl>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: MATRÍCULAS */}
          {activeTab === 'enrollments' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-slate-800 text-sm">Historial de Matrículas Formalizadas</h4>
                  <p className="text-[11px] text-slate-500">Códigos oficiales MAT-2026-XXXXX</p>
                </div>
                {onOpenQuickEnrollmentForStudent && (
                  <button
                    onClick={() => onOpenQuickEnrollmentForStudent(student)}
                    className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs flex items-center gap-1.5 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Nueva Matrícula</span>
                  </button>
                )}
              </div>

              {studentEnrollments.length === 0 ? (
                <div className="p-8 text-center bg-slate-50 rounded-xl border border-slate-200 text-slate-500">
                  <GraduationCap className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                  <p className="font-medium">No tiene matrículas registradas aún.</p>
                </div>
              ) : (
                <div className="overflow-x-auto rounded-xl border border-slate-200">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-900 text-white text-[11px] uppercase tracking-wider font-semibold">
                      <tr>
                        <th className="p-3">Código Matrícula</th>
                        <th className="p-3">Programa / Curso</th>
                        <th className="p-3">Grupo y Horario</th>
                        <th className="p-3">Fecha</th>
                        <th className="p-3">Costo</th>
                        <th className="p-3">Estado</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {studentEnrollments.map(enr => (
                        <tr key={enr.id} className="hover:bg-slate-50">
                          <td className="p-3 font-mono font-bold text-amber-700">{enr.enrollmentNumber}</td>
                          <td className="p-3 font-semibold text-slate-900">{enr.courseName}</td>
                          <td className="p-3 text-slate-600">{enr.groupName}</td>
                          <td className="p-3 text-slate-500">{enr.startDate}</td>
                          <td className="p-3 font-bold text-slate-800">
                            {settings.currencySymbol} {enr.total.toLocaleString()}
                          </td>
                          <td className="p-3">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                              {enr.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: CURSOS */}
          {activeTab === 'courses' && (
            <div className="space-y-4">
              <h4 className="font-bold text-slate-800 text-sm">Cursos Asignados y Plan de Estudios</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {studentEnrollments.map(enr => {
                  const courseDetail = courses.find(c => c.id === enr.courseId);
                  return (
                    <div key={enr.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 hover:border-amber-400 transition-colors">
                      <div className="flex items-start justify-between">
                        <div>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-800">
                            {courseDetail?.category || 'Aduanas'}
                          </span>
                          <h5 className="font-bold text-slate-900 text-sm mt-1">{enr.courseName}</h5>
                          <p className="text-[11px] text-slate-500">Grupo: {enr.groupName}</p>
                        </div>
                        <span className="font-bold text-amber-600 text-xs">
                          {courseDetail?.modality || 'Presencial'}
                        </span>
                      </div>
                      <div className="mt-4 pt-3 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-600">
                        <span>Duración: {courseDetail?.durationWeeks || 8} semanas</span>
                        <span className="font-semibold text-emerald-700">Estado: {enr.status}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 4: HISTORIAL ACADÉMICO */}
          {activeTab === 'history' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-slate-800 text-sm">Historial y Evaluaciones Calificadas</h4>
                  <p className="text-[11px] text-slate-500">Registro oficial de notas y aprobaciones</p>
                </div>
              </div>

              {studentGrades.length === 0 ? (
                <div className="p-8 text-center bg-slate-50 rounded-xl border border-slate-200 text-slate-500">
                  <History className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                  <p className="font-medium">No hay registros de calificaciones para este estudiante.</p>
                </div>
              ) : (
                <div className="overflow-x-auto rounded-xl border border-slate-200">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-900 text-white text-[11px] uppercase tracking-wider font-semibold">
                      <tr>
                        <th className="p-3">Curso</th>
                        <th className="p-3">Evaluación</th>
                        <th className="p-3">Fecha</th>
                        <th className="p-3">Nota Obtenida</th>
                        <th className="p-3">Resultado</th>
                        <th className="p-3">Comentarios</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {studentGrades.map(g => (
                        <tr key={g.id} className="hover:bg-slate-50">
                          <td className="p-3 font-semibold text-slate-900">{g.courseName}</td>
                          <td className="p-3 text-slate-700">{g.evaluationName}</td>
                          <td className="p-3 text-slate-500">{g.date}</td>
                          <td className="p-3 font-extrabold text-slate-900">
                            {g.grade} / {g.maxGrade}
                          </td>
                          <td className="p-3">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              g.status === 'APROBADO' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                            }`}>
                              {g.status}
                            </span>
                          </td>
                          <td className="p-3 text-slate-600 italic">{g.comments || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TAB 5: PAGOS & SALDO PENDIENTE */}
          {activeTab === 'payments' && (
            <div className="space-y-4">
              {/* Financial Balance Summary Card */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div>
                  <span className="text-[11px] text-slate-500 font-medium uppercase">Costo Total Cursos:</span>
                  <p className="text-lg font-bold text-slate-900">
                    {settings.currencySymbol} {totalCost.toLocaleString()}
                  </p>
                </div>
                <div>
                  <span className="text-[11px] text-slate-500 font-medium uppercase">Total Pagado:</span>
                  <p className="text-lg font-bold text-emerald-700">
                    {settings.currencySymbol} {totalPaid.toLocaleString()}
                  </p>
                </div>
                <div>
                  <span className="text-[11px] text-slate-500 font-medium uppercase">Saldo Pendiente:</span>
                  <p className={`text-lg font-extrabold ${pendingBalance > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                    {settings.currencySymbol} {pendingBalance.toLocaleString()}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2">
                <h4 className="font-bold text-slate-800 text-sm">Historial de Recibos de Caja (REC-2026-XXXXX)</h4>
                {onOpenQuickPaymentForStudent && (
                  <button
                    onClick={() => onOpenQuickPaymentForStudent(student)}
                    className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Registrar Cobro</span>
                  </button>
                )}
              </div>

              {studentPayments.length === 0 ? (
                <div className="p-8 text-center bg-slate-50 rounded-xl border border-slate-200 text-slate-500">
                  <CreditCard className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                  <p className="font-medium">No se han registrado pagos para este estudiante.</p>
                </div>
              ) : (
                <div className="overflow-x-auto rounded-xl border border-slate-200">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-900 text-white text-[11px] uppercase tracking-wider font-semibold">
                      <tr>
                        <th className="p-3">Recibo</th>
                        <th className="p-3">Concepto</th>
                        <th className="p-3">Fecha</th>
                        <th className="p-3">Método</th>
                        <th className="p-3">Monto</th>
                        <th className="p-3">Estado</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {studentPayments.map(p => (
                        <tr key={p.id} className="hover:bg-slate-50">
                          <td className="p-3 font-mono font-bold text-blue-700">{p.receiptNumber}</td>
                          <td className="p-3 font-semibold text-slate-900">{p.concept}</td>
                          <td className="p-3 text-slate-500">{p.date}</td>
                          <td className="p-3 text-slate-600">{p.method}</td>
                          <td className="p-3 font-extrabold text-emerald-700">
                            {settings.currencySymbol} {p.total.toLocaleString()}
                          </td>
                          <td className="p-3">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                              {p.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TAB 6: ASISTENCIA */}
          {activeTab === 'attendance' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-slate-800 text-sm">Control de Asistencia a Clases</h4>
                  <p className="text-[11px] text-slate-500">
                    Porcentaje global: <strong className="text-emerald-700">{attendancePct}%</strong> ({presents} de {totalAttSessions} sesiones)
                  </p>
                </div>
              </div>

              {studentAttendance.length === 0 ? (
                <div className="p-8 text-center bg-slate-50 rounded-xl border border-slate-200 text-slate-500">
                  <CalendarCheck className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                  <p className="font-medium">No hay registros de asistencia para este estudiante.</p>
                </div>
              ) : (
                <div className="overflow-x-auto rounded-xl border border-slate-200">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-900 text-white text-[11px] uppercase tracking-wider font-semibold">
                      <tr>
                        <th className="p-3">Fecha</th>
                        <th className="p-3">Curso</th>
                        <th className="p-3">Grupo</th>
                        <th className="p-3">Asistencia</th>
                        <th className="p-3">Notas</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {studentAttendance.map(att => (
                        <tr key={att.id} className="hover:bg-slate-50">
                          <td className="p-3 font-semibold text-slate-800">{att.date}</td>
                          <td className="p-3 text-slate-700">{att.courseName}</td>
                          <td className="p-3 text-slate-600">{att.groupName}</td>
                          <td className="p-3">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              att.status === 'Presente' ? 'bg-emerald-100 text-emerald-800' :
                              att.status === 'Tardanza' ? 'bg-amber-100 text-amber-800' :
                              att.status === 'Justificado' ? 'bg-blue-100 text-blue-800' :
                              'bg-rose-100 text-rose-800'
                            }`}>
                              {att.status}
                            </span>
                          </td>
                          <td className="p-3 text-slate-500">{att.observations || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TAB 7: WHATSAPP */}
          {activeTab === 'whatsapp' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-slate-800 text-sm">Canal Directo de WhatsApp</h4>
                  <p className="text-[11px] text-slate-500">Destino: {student.whatsapp || student.phone}</p>
                </div>
              </div>

              {/* Chat timeline */}
              <div className="bg-slate-100/70 p-4 rounded-xl border border-slate-200 max-h-72 overflow-y-auto space-y-2.5">
                {studentWaMessages.length === 0 ? (
                  <p className="text-center text-slate-400 py-6">No hay mensajes previos con este estudiante.</p>
                ) : (
                  studentWaMessages.map(msg => (
                    <div
                      key={msg.id}
                      className={`flex flex-col ${msg.fromMe ? 'items-end' : 'items-start'}`}
                    >
                      <div className={`p-3 rounded-xl max-w-[80%] text-xs shadow-2xs ${
                        msg.fromMe ? 'bg-emerald-600 text-white rounded-tr-none' : 'bg-white text-slate-800 rounded-tl-none border border-slate-200'
                      }`}>
                        <p>{msg.text}</p>
                        <span className={`text-[9px] block text-right mt-1 ${msg.fromMe ? 'text-emerald-200' : 'text-slate-400'}`}>
                          {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Input for sending WhatsApp message */}
              <form onSubmit={handleSendWa} className="flex gap-2">
                <input
                  type="text"
                  value={quickWaText}
                  onChange={(e) => setQuickWaText(e.target.value)}
                  placeholder={`Escribir mensaje de WhatsApp para ${student.firstName}...`}
                  className="flex-1 px-3 py-2 rounded-lg border border-slate-300 text-xs focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500"
                />
                <button
                  type="submit"
                  disabled={isSendingWa}
                  className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{isSendingWa ? 'Enviando...' : 'Enviar'}</span>
                </button>
              </form>
            </div>
          )}

          {/* TAB 8: DOCUMENTOS */}
          {activeTab === 'documents' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-slate-800 text-sm">Expediente de Documentos</h4>
                  <p className="text-[11px] text-slate-500">Cédula, títulos y comprobantes digitales</p>
                </div>
              </div>

              {/* Add document form */}
              <form onSubmit={handleAddDoc} className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex flex-wrap gap-2 items-center">
                <input
                  type="text"
                  placeholder="Nombre del documento (ej: Copia de Título)"
                  value={newDocTitle}
                  onChange={(e) => setNewDocTitle(e.target.value)}
                  className="px-3 py-1.5 rounded-lg border border-slate-300 text-xs flex-1 min-w-[200px]"
                />
                <select
                  value={newDocType}
                  onChange={(e) => setNewDocType(e.target.value)}
                  className="px-3 py-1.5 rounded-lg border border-slate-300 text-xs bg-white"
                >
                  <option value="DNI / Cédula">DNI / Cédula</option>
                  <option value="Título Secundario / Universitario">Título Académico</option>
                  <option value="Comprobante de Pago">Comprobante de Pago</option>
                  <option value="Fotografía">Fotografía</option>
                  <option value="Otro">Otro</option>
                </select>
                <button
                  type="submit"
                  className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs cursor-pointer"
                >
                  Adjuntar Documento
                </button>
              </form>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {studentDocs.map(doc => (
                  <div key={doc.id} className="p-3 rounded-xl border border-slate-200 bg-white flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-amber-50 text-amber-600">
                        <FileText className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="font-semibold text-slate-800">{doc.title}</p>
                        <p className="text-[10px] text-slate-400">{doc.type} &bull; {doc.fileSize}</p>
                      </div>
                    </div>
                    <button className="p-1.5 rounded-lg text-slate-400 hover:text-slate-800 hover:bg-slate-100">
                      <Download className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 9: NOTAS ADMINISTRATIVAS */}
          {activeTab === 'notes' && (
            <div className="space-y-4">
              <h4 className="font-bold text-slate-800 text-sm">Bitácora de Notas y Comunicaciones</h4>

              <form onSubmit={handleAddNote} className="space-y-2">
                <textarea
                  rows={2}
                  value={newNoteText}
                  onChange={(e) => setNewNoteText(e.target.value)}
                  placeholder="Escribir una nota administrativa interna sobre el estudiante..."
                  className="w-full p-3 rounded-xl border border-slate-300 text-xs focus:ring-1 focus:ring-amber-500 focus:border-amber-500"
                />
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs cursor-pointer"
                >
                  Guardar Nota
                </button>
              </form>

              <div className="space-y-2.5">
                {studentNotes.map(n => (
                  <div key={n.id} className="p-3 rounded-xl border border-slate-200 bg-slate-50 text-xs">
                    <div className="flex items-center justify-between text-slate-500 text-[10px] mb-1">
                      <span className="font-semibold text-slate-700">{n.userName} ({n.type})</span>
                      <span>{new Date(n.date).toLocaleDateString()} {new Date(n.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    <p className="text-slate-800">{n.message}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

import React, { useState, useMemo } from 'react';
import {
  Users,
  Search,
  Plus,
  MessageSquare,
  FileText,
  DollarSign,
  Calendar,
  UserCheck,
  ChevronRight,
  GraduationCap,
  CreditCard,
  Phone,
  Tag,
  ArrowRight,
  CheckCircle2,
  TrendingUp,
  Filter,
  AlertTriangle,
  Trash2
} from 'lucide-react';
import { WhatsAppContact, CRMStage, Student } from '../../types';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { CRM_STAGE_CONFIG } from '../../data/crmData';
import { CRMProspectDetailsModal } from './CRMProspectDetailsModal';

interface CRMProspectsKanbanProps {
  onOpenChat: (contactId: string) => void;
  onOpenQuickEnrollment?: (student: Student) => void;
  onOpenQuickPayment?: (student: Student) => void;
}

export const CRMProspectsKanban: React.FC<CRMProspectsKanbanProps> = ({
  onOpenChat,
  onOpenQuickEnrollment,
  onOpenQuickPayment
}) => {
  const { currentUser } = useAuth();
  const canDelete = currentUser?.role === 'SUPERADMIN' || currentUser?.role === 'ADMINISTRADOR';

  const {
    whatsappContacts,
    courses,
    students,
    updateContactStage,
    deleteCRMContact
  } = useData();

  const [search, setSearch] = useState('');
  const [courseFilter, setCourseFilter] = useState('all');
  const [advisorFilter, setAdvisorFilter] = useState('all');

  // Selected contact for detail modal
  const [selectedContact, setSelectedContact] = useState<WhatsAppContact | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  // Deletion modal state (Restricted to SUPERADMIN & ADMINISTRADOR)
  const [prospectToDelete, setProspectToDelete] = useState<WhatsAppContact | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteSuccessMessage, setDeleteSuccessMessage] = useState<string | null>(null);

  const activeSelectedContact = useMemo(() => {
    if (!selectedContact) return null;
    return whatsappContacts.find(c => c.id === selectedContact.id) || selectedContact;
  }, [whatsappContacts, selectedContact]);

  const columns: CRMStage[] = [
    'nuevo',
    'interesado',
    'seguimiento',
    'pago_pendiente',
    'matriculado',
    'descartado'
  ];

  // Filter contacts
  const filteredContacts = whatsappContacts.filter(c => {
    const q = search.toLowerCase();
    const matchSearch =
      c.name.toLowerCase().includes(q) ||
      c.phone.includes(q) ||
      (c.courseInterest && c.courseInterest.toLowerCase().includes(q)) ||
      (c.tags && c.tags.some(t => t.toLowerCase().includes(q)));

    const matchCourse = courseFilter === 'all' || c.courseInterest === courseFilter;
    const matchAdvisor = advisorFilter === 'all' || c.assignedAdvisorName === advisorFilter;

    return matchSearch && matchCourse && matchAdvisor;
  });

  // Calculate high-level pipeline stats
  const totalContacts = whatsappContacts.length;
  const wonContacts = whatsappContacts.filter(c => (c.crmStage || (c.status === 'ESTUDIANTE' ? 'matriculado' : 'nuevo')) === 'matriculado');
  const inPipelineContacts = whatsappContacts.filter(c => {
    const st = c.crmStage || (c.status === 'ESTUDIANTE' ? 'matriculado' : 'nuevo');
    return st !== 'matriculado' && st !== 'descartado';
  });

  const totalPipelineValue = inPipelineContacts.reduce((acc, c) => acc + (c.estimatedValue || 5000), 0);
  const totalWonValue = wonContacts.reduce((acc, c) => acc + (c.estimatedValue || 5500), 0);
  const conversionRate = totalContacts > 0 ? Math.round((wonContacts.length / totalContacts) * 100) : 0;

  const handleOpenDetails = (contact: WhatsAppContact) => {
    setSelectedContact(contact);
    setIsDetailModalOpen(true);
  };

  const handleMoveStage = async (contactId: string, newStage: CRMStage, e: React.MouseEvent) => {
    e.stopPropagation();
    await updateContactStage(contactId, newStage);
  };

  return (
    <div className="space-y-5">
      {/* Feedback banner */}
      {deleteSuccessMessage && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-semibold text-emerald-800 flex items-center gap-2 animate-in fade-in duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{deleteSuccessMessage}</span>
        </div>
      )}

      {/* Top Commercial Pipeline KPI Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Prospectos Activos</p>
            <p className="text-xl font-bold text-slate-900">{inPipelineContacts.length}</p>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600">
            <DollarSign className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Pipeline Valor Estimado</p>
            <p className="text-xl font-bold text-slate-900">L. {totalPipelineValue.toLocaleString()}</p>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Matrículas Cerradas</p>
            <p className="text-xl font-bold text-emerald-600">{wonContacts.length} (L. {totalWonValue.toLocaleString()})</p>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-purple-50 border border-purple-200 flex items-center justify-center text-purple-600">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Conversión WA → Matrícula</p>
            <p className="text-xl font-bold text-purple-600">{conversionRate}%</p>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2.5 flex-1 min-w-[280px]">
          {/* Search */}
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Buscar prospecto, teléfono, curso o etiqueta..."
              className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Filter Course */}
          <div className="w-48">
            <select
              value={courseFilter}
              onChange={e => setCourseFilter(e.target.value)}
              className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Todos los cursos</option>
              {courses.map(c => (
                <option key={c.id} value={c.name}>
                  {c.code} - {c.name.slice(0, 25)}...
                </option>
              ))}
            </select>
          </div>

          {/* Filter Advisor */}
          <div className="w-44">
            <select
              value={advisorFilter}
              onChange={e => setAdvisorFilter(e.target.value)}
              className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Todos los asesores</option>
              <option value="Lic. Claudia Moncada">Lic. Claudia Moncada</option>
              <option value="Carlos M. (Admisiones)">Carlos M. (Admisiones)</option>
              <option value="Ing. Carlos Alvarado">Ing. Carlos Alvarado</option>
            </select>
          </div>
        </div>

        <div className="text-xs text-slate-500">
          Mostrando <span className="font-bold text-slate-800">{filteredContacts.length}</span> prospectos
        </div>
      </div>

      {/* Kanban Board Columns Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-3.5 items-start overflow-x-auto pb-4">
        {columns.map(stage => {
          const cfg = CRM_STAGE_CONFIG[stage];
          const stageContacts = filteredContacts.filter(
            c => (c.crmStage || (c.status === 'ESTUDIANTE' ? 'matriculado' : 'nuevo')) === stage
          );
          const stageValue = stageContacts.reduce((sum, c) => sum + (c.estimatedValue || 5000), 0);

          return (
            <div
              key={stage}
              className="bg-slate-50/80 border border-slate-200 rounded-xl p-3 flex flex-col min-h-[520px] max-h-[750px] shadow-2xs"
            >
              {/* Column Header */}
              <div className="flex items-center justify-between pb-2 border-b border-slate-200 mb-3">
                <div className="flex items-center gap-1.5">
                  <span className={`w-2.5 h-2.5 rounded-full ${
                    stage === 'nuevo' ? 'bg-sky-500' :
                    stage === 'interesado' ? 'bg-indigo-500' :
                    stage === 'seguimiento' ? 'bg-purple-500' :
                    stage === 'pago_pendiente' ? 'bg-amber-500' :
                    stage === 'matriculado' ? 'bg-emerald-500' : 'bg-slate-400'
                  }`} />
                  <h4 className="text-xs font-bold text-slate-800 truncate">{cfg.label}</h4>
                </div>
                <span className="text-xs font-bold px-1.5 py-0.5 rounded-full bg-white border border-slate-200 text-slate-600">
                  {stageContacts.length}
                </span>
              </div>

              {/* Column Value Subtitle */}
              <div className="text-[11px] text-slate-500 mb-2.5 font-medium flex items-center justify-between">
                <span>Subtotal:</span>
                <span className="font-semibold text-slate-700">L. {stageValue.toLocaleString()}</span>
              </div>

              {/* Cards Container */}
              <div className="flex-1 overflow-y-auto space-y-2.5 pr-0.5">
                {stageContacts.length === 0 ? (
                  <div className="text-center py-8 px-2 border border-dashed border-slate-200 rounded-lg text-slate-400 text-[11px]">
                    Sin prospectos en esta etapa
                  </div>
                ) : (
                  stageContacts.map(contact => {
                    const matchedSt = students.find(
                      s => s.id === contact.studentId || s.phone?.replace(/[^\d]/g, '') === contact.phone.replace(/[^\d]/g, '')
                    );

                    // Check if follow up date is today or passed
                    const isFollowUpDue = contact.nextFollowUpDate && new Date(contact.nextFollowUpDate) <= new Date();

                    return (
                      <div
                        key={contact.id}
                        onClick={() => handleOpenDetails(contact)}
                        className="bg-white border border-slate-200 hover:border-blue-400 hover:shadow-md rounded-lg p-3 cursor-pointer transition-all space-y-2.5 group relative"
                      >
                        {/* Card Top: Name & Phone */}
                        <div>
                          <div className="flex items-start justify-between gap-1">
                            <h5 className="text-xs font-bold text-slate-900 group-hover:text-blue-600 line-clamp-1">
                              {contact.name}
                            </h5>
                            {contact.unreadCount > 0 && (
                              <span className="w-4 h-4 rounded-full bg-emerald-500 text-white text-[10px] flex items-center justify-center font-bold">
                                {contact.unreadCount}
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                            <Phone className="w-2.5 h-2.5 text-emerald-500" />
                            {contact.phone}
                          </p>
                        </div>

                        {/* Course of interest */}
                        {contact.courseInterest && (
                          <div className="bg-slate-50 border border-slate-100 rounded px-2 py-1 text-[11px] font-medium text-slate-700 line-clamp-2">
                            🎓 {contact.courseInterest}
                          </div>
                        )}

                        {/* Deal Value & Advisor */}
                        <div className="flex items-center justify-between text-[11px] text-slate-600 pt-1 border-t border-slate-100">
                          <span className="font-bold text-slate-900">
                            L. {(contact.estimatedValue || 5000).toLocaleString()}
                          </span>
                          <span className="text-[10px] text-slate-400 truncate max-w-[100px]" title={contact.assignedAdvisorName}>
                            {contact.assignedAdvisorName?.split(' ')[0] || 'Asesor'}
                          </span>
                        </div>

                        {/* Next follow up reminder if set */}
                        {contact.nextFollowUpDate && (
                          <div className={`text-[10px] px-1.5 py-0.5 rounded flex items-center gap-1 font-medium ${
                            isFollowUpDue ? 'bg-rose-50 text-rose-700 border border-rose-200' : 'bg-slate-100 text-slate-600'
                          }`}>
                            <Calendar className="w-2.5 h-2.5" />
                            {isFollowUpDue ? 'Seguimiento vencido/hoy' : `Llamar: ${contact.nextFollowUpDate}`}
                          </div>
                        )}

                        {/* Tags preview */}
                        {contact.tags && contact.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {contact.tags.slice(0, 2).map((t, idx) => (
                              <span
                                key={idx}
                                className="text-[9px] px-1.5 py-0.2 bg-blue-50 text-blue-700 rounded-sm font-medium"
                              >
                                {t}
                              </span>
                            ))}
                            {contact.tags.length > 2 && (
                              <span className="text-[9px] text-slate-400">+{contact.tags.length - 2}</span>
                            )}
                          </div>
                        )}

                        {/* Quick Action Footer inside card */}
                        <div className="flex items-center justify-between pt-1.5 border-t border-slate-100 text-[11px]">
                          {/* Chat and Delete actions */}
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={e => {
                                e.stopPropagation();
                                onOpenChat(contact.id);
                              }}
                              className="p-1 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 rounded transition-colors cursor-pointer"
                              title="Abrir Chat de WhatsApp"
                            >
                              <MessageSquare className="w-3.5 h-3.5" />
                            </button>

                            {/* Delete Prospect - Restricted to SUPERADMIN and ADMINISTRADOR */}
                            {canDelete && (
                              <button
                                type="button"
                                onClick={e => {
                                  e.stopPropagation();
                                  setProspectToDelete(contact);
                                }}
                                className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors cursor-pointer"
                                title="Eliminar prospecto del embudo CRM (Admin)"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>

                          {/* Quick stage advance selector */}
                          <div className="flex items-center gap-1">
                            <select
                              value={stage}
                              onClick={e => e.stopPropagation()}
                              onChange={e => handleMoveStage(contact.id, e.target.value as CRMStage, e as any)}
                              className="text-[10px] bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded px-1.5 py-0.5 text-slate-700 cursor-pointer focus:outline-hidden"
                            >
                              <option value="nuevo">Nuevo</option>
                              <option value="interesado">Interesado</option>
                              <option value="seguimiento">Seguimiento</option>
                              <option value="pago_pendiente">Pago pend.</option>
                              <option value="matriculado">Matriculado</option>
                              <option value="descartado">Descartado</option>
                            </select>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* CRM Contact Details & Commercial Actions Modal */}
      <CRMProspectDetailsModal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        contact={activeSelectedContact}
        onOpenQuickEnrollment={onOpenQuickEnrollment}
        onOpenQuickPayment={onOpenQuickPayment}
        onOpenChat={onOpenChat}
        onUpdated={(updatedContact) => setSelectedContact(updatedContact)}
        onDelete={(contact) => {
          setIsDetailModalOpen(false);
          setProspectToDelete(contact);
        }}
      />

      {/* Modal de Confirmación de Eliminación - Exclusivo SUPERADMIN y ADMINISTRADOR */}
      {prospectToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-start gap-3.5">
              <div className="p-3 bg-rose-100 text-rose-600 rounded-xl shrink-0">
                <Trash2 className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <h3 className="text-base font-bold text-slate-900">
                  ¿Eliminar prospecto del embudo CRM?
                </h3>
                <p className="text-xs text-slate-600 mt-1">
                  Estás a punto de eliminar a <strong className="text-slate-900">{prospectToDelete.name}</strong> ({prospectToDelete.phone}).
                </p>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 space-y-1.5">
              <div className="flex items-center gap-1.5 font-bold text-amber-800">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>Permiso restringido a Superadmin y Administrador</span>
              </div>
              <p className="text-[11px] text-amber-800/90 leading-relaxed">
                Esta acción removerá definitivamente la tarjeta del embudo comercial, sus notas internas y el historial de seguimiento comercial asignado.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setProspectToDelete(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={async () => {
                  setIsDeleting(true);
                  try {
                    await deleteCRMContact(prospectToDelete.id);
                    setDeleteSuccessMessage(`Prospecto "${prospectToDelete.name}" eliminado correctamente.`);
                    setTimeout(() => setDeleteSuccessMessage(null), 3500);
                  } finally {
                    setIsDeleting(false);
                    setProspectToDelete(null);
                  }
                }}
                className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 transition-colors flex items-center gap-2 cursor-pointer shadow-sm disabled:opacity-50"
              >
                <Trash2 className="w-4 h-4" />
                <span>{isDeleting ? 'Eliminando...' : 'Sí, Eliminar del Embudo'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

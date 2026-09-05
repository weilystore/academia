import React, { useState } from 'react';
import {
  X,
  User,
  Phone,
  Tag,
  BookOpen,
  Calendar,
  DollarSign,
  UserCheck,
  FileText,
  Plus,
  CheckCircle2,
  GraduationCap,
  CreditCard,
  MessageSquare,
  Clock,
  Send,
  AlertCircle
} from 'lucide-react';
import { WhatsAppContact, CRMStage, Student } from '../../types';
import { useData } from '../../context/DataContext';
import { CRM_STAGE_CONFIG } from '../../data/crmData';

interface CRMProspectDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  contact: WhatsAppContact | null;
  onOpenQuickEnrollment?: (student: Student) => void;
  onOpenQuickPayment?: (student: Student) => void;
  onOpenChat?: (contactId: string) => void;
  onUpdated?: (updatedContact: WhatsAppContact) => void;
}

export const CRMProspectDetailsModal: React.FC<CRMProspectDetailsModalProps> = ({
  isOpen,
  onClose,
  contact,
  onOpenQuickEnrollment,
  onOpenQuickPayment,
  onOpenChat,
  onUpdated
}) => {
  const {
    courses,
    crmTags,
    updateContactCRM,
    addCRMNote,
    students
  } = useData();

  const prevContactIdRef = React.useRef<string | null>(null);

  const [selectedStage, setSelectedStage] = useState<CRMStage>(contact?.crmStage || 'nuevo');
  const [selectedCourse, setSelectedCourse] = useState<string>(contact?.courseInterest || '');
  const [isCustomCourse, setIsCustomCourse] = useState(false);
  const [customCourseInput, setCustomCourseInput] = useState('');
  const [advisorName, setAdvisorName] = useState<string>(contact?.assignedAdvisorName || 'Carlos M. (Admisiones WhatsApp)');
  const [estimatedValue, setEstimatedValue] = useState<number>(contact?.estimatedValue || 5000);
  const [followUpDate, setFollowUpDate] = useState<string>(contact?.nextFollowUpDate || '');
  const [selectedTags, setSelectedTags] = useState<string[]>(contact?.tags || []);
  const [newTagInput, setNewTagInput] = useState('');
  const [noteText, setNoteText] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Sync state ONLY when switching to a DIFFERENT contact ID
  React.useEffect(() => {
    if (contact && contact.id !== prevContactIdRef.current) {
      prevContactIdRef.current = contact.id;
      setSelectedStage(contact.crmStage || (contact.status === 'ESTUDIANTE' ? 'matriculado' : 'nuevo'));
      const initialCourse = contact.courseInterest || '';
      setSelectedCourse(initialCourse);
      setIsCustomCourse(false);
      setCustomCourseInput('');
      setAdvisorName(contact.assignedAdvisorName || 'Carlos M. (Admisiones WhatsApp)');
      setEstimatedValue(contact.estimatedValue || 5000);
      setFollowUpDate(contact.nextFollowUpDate || '');
      setSelectedTags(contact.tags || []);
      setNoteText('');
      setSavedSuccess(false);
    }
  }, [contact?.id]);

  if (!isOpen || !contact) return null;

  const currentStageConfig = CRM_STAGE_CONFIG[selectedStage] || CRM_STAGE_CONFIG.nuevo;

  // Standard Academia de Aduanas courses & catalog
  const standardPrograms = [
    { name: 'Diplomado en Legislación Aduanera y Comercio Exterior', label: 'Diplomado en Legislación Aduanera y Comercio Exterior (L. 6,500)' },
    { name: 'Diplomado en Legislación Aduanera', label: 'Diplomado en Legislación Aduanera (L. 6,500)' },
    { name: 'Taller de Clasificación Arancelaria y Merceología', label: 'Taller de Clasificación Arancelaria y Merceología (L. 5,200)' },
    { name: 'Despacho y Declaración Única Aduanera (DUCA)', label: 'Despacho y Declaración Única Aduanera (DUCA) (L. 4,500)' },
    { name: 'Valoración Aduanera y Reglas de Origen', label: 'Valoración Aduanera y Reglas de Origen (L. 5,000)' },
    { name: 'Gestión de Agencias Aduaneras y Logística Internacional', label: 'Gestión de Agencias Aduaneras y Logística (L. 5,800)' },
    { name: 'Técnicas de Auditoría y Fiscalización Aduanera', label: 'Técnicas de Auditoría y Fiscalización Aduanera (L. 6,000)' }
  ];

  // Combine database courses and standard programs
  const availableCourses = (() => {
    const list: { name: string; label: string }[] = [];

    courses.forEach(c => {
      if (c.name && !list.some(item => item.name.toLowerCase() === c.name.toLowerCase())) {
        list.push({
          name: c.name,
          label: `${c.name} (${c.code || 'ADU'}) - L. ${(c.price || 0).toLocaleString()}`
        });
      }
    });

    standardPrograms.forEach(p => {
      if (!list.some(item => item.name.toLowerCase() === p.name.toLowerCase())) {
        list.push(p);
      }
    });

    if (contact?.courseInterest && !list.some(item => item.name.toLowerCase() === contact.courseInterest.toLowerCase())) {
      list.unshift({
        name: contact.courseInterest,
        label: `${contact.courseInterest} (Interés registrado)`
      });
    }

    if (selectedCourse && !list.some(item => item.name.toLowerCase() === selectedCourse.toLowerCase())) {
      list.push({
        name: selectedCourse,
        label: `${selectedCourse} (Personalizado)`
      });
    }

    return list;
  })();

  const availableAdvisors = (() => {
    const defaultList = [
      'Carlos M. (Admisiones WhatsApp)',
      'Lic. Claudia Moncada (Admisiones Sede)',
      'Ing. Carlos Alvarado (Dirección Académica)',
      'Lic. Roberto Meza (Coordinación Comercial)',
      'Sin asignar'
    ];
    if (contact.assignedAdvisorName && !defaultList.includes(contact.assignedAdvisorName)) {
      defaultList.unshift(contact.assignedAdvisorName);
    }
    return defaultList;
  })();

  // Find linked student if any
  const matchedStudent = students.find(
    s => s.id === contact.studentId || s.phone?.replace(/[^\d]/g, '') === contact.phone?.replace(/[^\d]/g, '')
  );

  const handleToggleTag = (tagName: string) => {
    if (selectedTags.includes(tagName)) {
      setSelectedTags(selectedTags.filter(t => t !== tagName));
    } else {
      setSelectedTags([...selectedTags, tagName]);
    }
  };

  const handleAddCustomTag = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTagInput.trim()) return;
    const trimmed = newTagInput.trim();
    if (!selectedTags.includes(trimmed)) {
      setSelectedTags([...selectedTags, trimmed]);
    }
    setNewTagInput('');
  };

  const handleSaveCRM = async () => {
    if (!contact) return;
    setIsSaving(true);
    const finalCourse = isCustomCourse ? (customCourseInput.trim() || selectedCourse) : selectedCourse;
    try {
      const updates: Partial<WhatsAppContact> = {
        crmStage: selectedStage,
        courseInterest: finalCourse,
        assignedAdvisorName: advisorName,
        estimatedValue: Number(estimatedValue) || 0,
        nextFollowUpDate: followUpDate || undefined,
        tags: selectedTags
      };

      await updateContactCRM(contact.id, updates);

      // Keep local object updated immediately
      contact.crmStage = selectedStage;
      contact.courseInterest = finalCourse;
      contact.assignedAdvisorName = advisorName;
      contact.estimatedValue = Number(estimatedValue) || 0;
      contact.nextFollowUpDate = followUpDate || undefined;
      contact.tags = selectedTags;

      if (onUpdated) {
        onUpdated({ ...contact, ...updates });
      }

      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 4000);
    } catch (err) {
      console.error('Error saving CRM info:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteText.trim()) return;
    await addCRMNote(contact.id, noteText.trim());
    setNoteText('');
  };

  const stages: CRMStage[] = ['nuevo', 'interesado', 'seguimiento', 'pago_pendiente', 'matriculado', 'descartado'];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-3xl overflow-hidden my-6">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-400 font-bold text-lg">
              {contact.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white">{contact.name}</h3>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                  contact.status === 'ESTUDIANTE' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' : 'bg-sky-500/20 text-sky-300 border border-sky-500/40'
                }`}>
                  {contact.status}
                </span>
              </div>
              <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                <Phone className="w-3 h-3 text-emerald-400" />
                {contact.phone}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onOpenChat && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenChat(contact.id);
                }}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                Ver Chat
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Body Content */}
        <div className="p-6 max-h-[75vh] overflow-y-auto space-y-6">
          {/* Top Quick Actions Bar for Matrícula & Pago */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Acciones Comerciales</p>
              <p className="text-sm font-medium text-slate-800">
                {matchedStudent
                  ? `Estudiante registrado: ${matchedStudent.firstName} ${matchedStudent.lastName}`
                  : 'Prospecto comercial pendiente de formalización'}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {onOpenQuickEnrollment && matchedStudent && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenQuickEnrollment(matchedStudent);
                  }}
                  className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors"
                >
                  <GraduationCap className="w-3.5 h-3.5" />
                  Nueva Matrícula
                </button>
              )}

              {onOpenQuickPayment && matchedStudent && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenQuickPayment(matchedStudent);
                  }}
                  className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors"
                >
                  <CreditCard className="w-3.5 h-3.5" />
                  Registrar Pago
                </button>
              )}
            </div>
          </div>

          {/* Pipeline Stage Selector */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Etapa del Embudo Comercial (Pipeline)
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {stages.map(st => {
                const cfg = CRM_STAGE_CONFIG[st];
                const isSelected = selectedStage === st;
                return (
                  <button
                    key={st}
                    type="button"
                    onClick={() => setSelectedStage(st)}
                    className={`p-2.5 rounded-lg border text-left transition-all text-xs font-semibold flex flex-col justify-between ${
                      isSelected
                        ? `${cfg.bg} ${cfg.text} ${cfg.border} ring-2 ring-offset-1 ring-blue-500 shadow-xs`
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span>{cfg.label}</span>
                      {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />}
                    </div>
                    <span className="text-[10px] text-slate-400 font-normal mt-1 leading-tight line-clamp-1">
                      {cfg.desc}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Form Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Course of Interest */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                  <BookOpen className="w-3.5 h-3.5 text-slate-500" />
                  Programa o Curso de Interés
                </label>
                <button
                  type="button"
                  onClick={() => {
                    const nextMode = !isCustomCourse;
                    setIsCustomCourse(nextMode);
                    if (nextMode) {
                      setCustomCourseInput(selectedCourse || '');
                    }
                  }}
                  className="text-[11px] text-blue-600 hover:text-blue-800 font-medium cursor-pointer"
                >
                  {isCustomCourse ? '← Seleccionar de lista' : '+ Escribir otro'}
                </button>
              </div>

              {isCustomCourse ? (
                <input
                  type="text"
                  value={customCourseInput}
                  onChange={e => {
                    setCustomCourseInput(e.target.value);
                    setSelectedCourse(e.target.value);
                  }}
                  placeholder="Ej. Diplomado en Legislación Aduanera"
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                />
              ) : (
                <select
                  value={selectedCourse}
                  onChange={e => {
                    if (e.target.value === '__custom__') {
                      setIsCustomCourse(true);
                      setCustomCourseInput('');
                    } else {
                      setSelectedCourse(e.target.value);
                    }
                  }}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">-- Seleccionar programa aduanero --</option>
                  {availableCourses.map(c => (
                    <option key={c.name} value={c.name}>
                      {c.label}
                    </option>
                  ))}
                  <option value="__custom__">✏️ Escribir otro curso personalizado...</option>
                </select>
              )}
            </div>

            {/* Estimated Value */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
                <DollarSign className="w-3.5 h-3.5 text-slate-500" />
                Valor Estimado de Matrícula (Lempiras L.)
              </label>
              <input
                type="number"
                min="0"
                step="100"
                value={estimatedValue || ''}
                onChange={e => setEstimatedValue(Number(e.target.value))}
                placeholder="Ej. 6500"
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Assigned Advisor */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
                <UserCheck className="w-3.5 h-3.5 text-slate-500" />
                Asesor de Admisiones Asignado
              </label>
              <select
                value={advisorName}
                onChange={e => setAdvisorName(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              >
                {availableAdvisors.map(adv => (
                  <option key={adv} value={adv}>
                    {adv}
                  </option>
                ))}
              </select>
            </div>

            {/* Next Follow Up Date */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-slate-500" />
                Fecha de Próximo Seguimiento / Llamada
              </label>
              <input
                type="date"
                value={followUpDate}
                onChange={e => setFollowUpDate(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* CRM Tags Section */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5 text-slate-500" />
              Etiquetas del Contacto
            </label>
            <div className="flex flex-wrap gap-1.5 mb-2.5">
              {crmTags.map(tag => {
                const isSelected = selectedTags.includes(tag.name);
                return (
                  <button
                    key={tag.id}
                    type="button"
                    onClick={() => handleToggleTag(tag.name)}
                    className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-all ${
                      isSelected
                        ? tag.bgClass + ' ring-1 ring-blue-500 shadow-xs'
                        : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    {isSelected ? '✓ ' : '+ '}
                    {tag.name}
                  </button>
                );
              })}
            </div>

            {/* Custom Tag input */}
            <form onSubmit={handleAddCustomTag} className="flex gap-2">
              <input
                type="text"
                placeholder="Crear nueva etiqueta personalizada..."
                value={newTagInput}
                onChange={e => setNewTagInput(e.target.value)}
                className="flex-1 px-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="submit"
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-medium transition-colors"
              >
                Agregar
              </button>
            </form>
          </div>

          {/* Save Changes Button & Feedback */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-3 border-t border-slate-200">
            {savedSuccess ? (
              <div className="flex items-center gap-2 px-3 py-2 bg-emerald-50 border border-emerald-300 rounded-lg text-emerald-900 text-xs font-semibold shadow-xs animate-in fade-in">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>¡Información CRM guardada y sincronizada exitosamente!</span>
              </div>
            ) : (
              <span className="text-xs text-slate-500">Actualiza los datos del prospecto para el embudo de ventas</span>
            )}

            <button
              type="button"
              onClick={handleSaveCRM}
              disabled={isSaving}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold shadow-xs flex items-center justify-center gap-2 transition-all disabled:opacity-50 cursor-pointer active:scale-98"
            >
              {isSaving ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Guardando cambios...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Guardar Información CRM</span>
                </>
              )}
            </button>
          </div>

          {/* CRM Notes Feed (Bitácora de seguimiento comercial) */}
          <div className="pt-4 border-t border-slate-200">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-slate-500" />
              Bitácora de Seguimiento Comercial (Notas Internas)
            </h4>

            {/* Add note form */}
            <form onSubmit={handleAddNote} className="flex gap-2 mb-3">
              <input
                type="text"
                value={noteText}
                onChange={e => setNoteText(e.target.value)}
                placeholder="Escribe una nota interna (ej. 'Llamó solicitando pago en 2 cuotas')..."
                className="flex-1 px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="submit"
                disabled={!noteText.trim()}
                className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold flex items-center gap-1 disabled:opacity-50 transition-colors"
              >
                <Send className="w-3 h-3" />
                Registrar Nota
              </button>
            </form>

            {/* Notes List */}
            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {contact.crmNotes && contact.crmNotes.length > 0 ? (
                contact.crmNotes.map(note => (
                  <div key={note.id} className="bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs">
                    <div className="flex items-center justify-between text-[11px] text-slate-500 mb-1">
                      <span className="font-semibold text-slate-700">{note.authorName}</span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(note.createdAt).toLocaleString('es-HN', {
                          day: '2-digit',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                    </div>
                    <p className="text-slate-800">{note.text}</p>
                  </div>
                ))
              ) : (
                <div className="text-center py-4 bg-slate-50 border border-dashed border-slate-200 rounded-lg">
                  <p className="text-xs text-slate-400">No hay notas de seguimiento registradas para este contacto.</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-100 border-t border-slate-200 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-semibold transition-colors"
          >
            Cerrar Ficha
          </button>
        </div>
      </div>
    </div>
  );
};

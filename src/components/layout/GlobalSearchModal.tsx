import React, { useState, useEffect, useRef } from 'react';
import {
  Search,
  X,
  User,
  GraduationCap,
  BookOpen,
  CreditCard,
  MessageSquare,
  ArrowRight
} from 'lucide-react';
import { useData } from '../../context/DataContext';
import { Student, Enrollment, Course, Payment, WhatsAppConversation } from '../../types';

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectStudent: (student: Student) => void;
  onNavigate: (view: string) => void;
}

export const GlobalSearchModal: React.FC<GlobalSearchModalProps> = ({
  isOpen,
  onClose,
  onSelectStudent,
  onNavigate
}) => {
  const { students, enrollments, courses, payments, whatsappConversations } = useData();
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery('');
    }
  }, [isOpen]);

  // Global hotkey Ctrl+K / Cmd+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
      } else if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const q = query.trim().toLowerCase();

  // Filter items
  const matchedStudents = q
    ? students.filter(s =>
        `${s.firstName} ${s.lastName}`.toLowerCase().includes(q) ||
        s.identityNumber.toLowerCase().includes(q) ||
        s.email.toLowerCase().includes(q) ||
        s.phone.includes(q) ||
        s.whatsapp.includes(q)
      ).slice(0, 5)
    : [];

  const matchedEnrollments = q
    ? enrollments.filter(e =>
        e.enrollmentNumber.toLowerCase().includes(q) ||
        e.studentName.toLowerCase().includes(q) ||
        e.courseName.toLowerCase().includes(q)
      ).slice(0, 4)
    : [];

  const matchedCourses = q
    ? courses.filter(c =>
        c.code.toLowerCase().includes(q) ||
        c.name.toLowerCase().includes(q) ||
        c.category.toLowerCase().includes(q)
      ).slice(0, 3)
    : [];

  const matchedPayments = q
    ? payments.filter(p =>
        p.receiptNumber.toLowerCase().includes(q) ||
        p.studentName.toLowerCase().includes(q) ||
        p.concept.toLowerCase().includes(q)
      ).slice(0, 3)
    : [];

  const matchedChats = q
    ? whatsappConversations.filter(c =>
        c.name.toLowerCase().includes(q) ||
        c.phone.includes(q) ||
        c.lastMessage.toLowerCase().includes(q)
      ).slice(0, 3)
    : [];

  const totalResults =
    matchedStudents.length +
    matchedEnrollments.length +
    matchedCourses.length +
    matchedPayments.length +
    matchedChats.length;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 px-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Search Input Bar */}
        <div className="flex items-center px-4 py-3.5 border-b border-slate-200 bg-slate-50/50">
          <Search className="w-5 h-5 text-amber-500 shrink-0 mr-3" />
          <input
            ref={inputRef}
            type="text"
            id="input-global-search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar por nombre, identidad, teléfono, curso, matrícula o recibo..."
            className="w-full bg-transparent text-sm text-slate-800 placeholder-slate-400 focus:outline-hidden"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="p-1 text-slate-400 hover:text-slate-600 rounded-md mr-1"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <kbd className="hidden sm:inline-block px-2 py-0.5 text-[10px] font-semibold bg-white border border-slate-300 rounded text-slate-500">
            ESC
          </kbd>
        </div>

        {/* Search Results Area */}
        <div className="max-h-[65vh] overflow-y-auto p-4 space-y-4 text-xs">
          {!query ? (
            <div className="py-8 text-center text-slate-400">
              <Search className="w-8 h-8 mx-auto mb-2 text-slate-300" />
              <p className="font-medium text-slate-600">Búsqueda Global en Tiempo Real</p>
              <p className="text-xs mt-1">Escribe para encontrar estudiantes, matrículas, cursos, pagos y conversaciones de WhatsApp.</p>
            </div>
          ) : totalResults === 0 ? (
            <div className="py-8 text-center text-slate-500">
              <p className="font-medium">No se encontraron resultados para "{query}"</p>
              <p className="text-[11px] text-slate-400 mt-1">Intenta con número de identidad, código de curso o nombre.</p>
            </div>
          ) : (
            <>
              {/* Estudiantes */}
              {matchedStudents.length > 0 && (
                <div>
                  <div className="flex items-center gap-1.5 text-slate-400 font-bold uppercase text-[10px] tracking-wider mb-2">
                    <User className="w-3.5 h-3.5 text-blue-500" />
                    <span>Estudiantes ({matchedStudents.length})</span>
                  </div>
                  <div className="space-y-1">
                    {matchedStudents.map(st => (
                      <div
                        key={st.id}
                        id={`search-result-student-${st.id}`}
                        onClick={() => {
                          onSelectStudent(st);
                          onClose();
                        }}
                        className="p-2.5 rounded-lg border border-slate-100 hover:border-amber-300 hover:bg-amber-50/50 flex items-center justify-between cursor-pointer transition-colors"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <img
                            src={st.photoUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=80'}
                            alt={st.firstName}
                            className="w-8 h-8 rounded-full object-cover border border-slate-200"
                          />
                          <div className="min-w-0">
                            <p className="font-semibold text-slate-800 truncate">
                              {st.firstName} {st.lastName}
                            </p>
                            <p className="text-[11px] text-slate-500">
                              DNI: {st.identityNumber} &bull; Tel: {st.phone}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                            st.status === 'Activo' ? 'bg-emerald-100 text-emerald-800' :
                            st.status === 'Prospecto' ? 'bg-blue-100 text-blue-800' : 'bg-slate-100 text-slate-700'
                          }`}>
                            {st.status}
                          </span>
                          <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Matrículas */}
              {matchedEnrollments.length > 0 && (
                <div>
                  <div className="flex items-center gap-1.5 text-slate-400 font-bold uppercase text-[10px] tracking-wider mb-2">
                    <GraduationCap className="w-3.5 h-3.5 text-purple-500" />
                    <span>Matrículas ({matchedEnrollments.length})</span>
                  </div>
                  <div className="space-y-1">
                    {matchedEnrollments.map(enr => (
                      <div
                        key={enr.id}
                        onClick={() => {
                          onNavigate('enrollments');
                          onClose();
                        }}
                        className="p-2.5 rounded-lg border border-slate-100 hover:border-purple-300 hover:bg-purple-50/40 flex items-center justify-between cursor-pointer transition-colors"
                      >
                        <div>
                          <p className="font-semibold text-slate-800">{enr.enrollmentNumber} &bull; {enr.studentName}</p>
                          <p className="text-[11px] text-slate-500">{enr.courseName} ({enr.groupName})</p>
                        </div>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-purple-100 text-purple-800">
                          {enr.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Cursos */}
              {matchedCourses.length > 0 && (
                <div>
                  <div className="flex items-center gap-1.5 text-slate-400 font-bold uppercase text-[10px] tracking-wider mb-2">
                    <BookOpen className="w-3.5 h-3.5 text-emerald-500" />
                    <span>Cursos ({matchedCourses.length})</span>
                  </div>
                  <div className="space-y-1">
                    {matchedCourses.map(crs => (
                      <div
                        key={crs.id}
                        onClick={() => {
                          onNavigate('courses');
                          onClose();
                        }}
                        className="p-2.5 rounded-lg border border-slate-100 hover:border-emerald-300 hover:bg-emerald-50/40 flex items-center justify-between cursor-pointer transition-colors"
                      >
                        <div>
                          <p className="font-semibold text-slate-800">{crs.code} - {crs.name}</p>
                          <p className="text-[11px] text-slate-500">{crs.category} &bull; Modalidad: {crs.modality}</p>
                        </div>
                        <span className="text-slate-600 font-semibold text-xs">
                          L {crs.price.toLocaleString()}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Pagos */}
              {matchedPayments.length > 0 && (
                <div>
                  <div className="flex items-center gap-1.5 text-slate-400 font-bold uppercase text-[10px] tracking-wider mb-2">
                    <CreditCard className="w-3.5 h-3.5 text-amber-500" />
                    <span>Pagos ({matchedPayments.length})</span>
                  </div>
                  <div className="space-y-1">
                    {matchedPayments.map(pay => (
                      <div
                        key={pay.id}
                        onClick={() => {
                          onNavigate('payments');
                          onClose();
                        }}
                        className="p-2.5 rounded-lg border border-slate-100 hover:border-amber-300 hover:bg-amber-50/40 flex items-center justify-between cursor-pointer transition-colors"
                      >
                        <div>
                          <p className="font-semibold text-slate-800">{pay.receiptNumber} &bull; {pay.concept}</p>
                          <p className="text-[11px] text-slate-500">{pay.studentName} &bull; {pay.date}</p>
                        </div>
                        <span className="font-bold text-emerald-700 text-xs">
                          L {pay.total.toLocaleString()}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* WhatsApp Chats */}
              {matchedChats.length > 0 && (
                <div>
                  <div className="flex items-center gap-1.5 text-slate-400 font-bold uppercase text-[10px] tracking-wider mb-2">
                    <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
                    <span>WhatsApp ({matchedChats.length})</span>
                  </div>
                  <div className="space-y-1">
                    {matchedChats.map(ch => (
                      <div
                        key={ch.id}
                        onClick={() => {
                          onNavigate('whatsapp');
                          onClose();
                        }}
                        className="p-2.5 rounded-lg border border-slate-100 hover:border-emerald-300 hover:bg-emerald-50/40 flex items-center justify-between cursor-pointer transition-colors"
                      >
                        <div className="min-w-0">
                          <p className="font-semibold text-slate-800 truncate">{ch.name} ({ch.phone})</p>
                          <p className="text-[11px] text-slate-500 truncate">{ch.lastMessage}</p>
                        </div>
                        <ArrowRight className="w-3.5 h-3.5 text-slate-400 shrink-0 ml-2" />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

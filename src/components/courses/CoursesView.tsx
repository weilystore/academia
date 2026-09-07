import React, { useState } from 'react';
import {
  BookOpen,
  Plus,
  Search,
  Clock,
  Calendar,
  Users,
  Edit2,
  CheckCircle,
  Tag,
  ArrowUpRight,
  Trash2,
  AlertTriangle,
  AlertCircle,
  Loader2,
  CheckCircle2
} from 'lucide-react';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { Course } from '../../types';
import { CourseFormModal } from './CourseFormModal';

interface CoursesViewProps {
  onOpenGroupsForCourse?: (courseId: string) => void;
  onOpenQuickEnrollment?: () => void;
}

export const CoursesView: React.FC<CoursesViewProps> = ({
  onOpenGroupsForCourse,
  onOpenQuickEnrollment
}) => {
  const { courses, groups, settings, deleteCourse } = useData();
  const { currentUser, hasPermission } = useAuth();

  // Deletion is strictly reserved for Superadmin and Administradores
  const canDeleteCourse =
    (currentUser?.role === 'SUPERADMIN' || currentUser?.role === 'ADMINISTRADOR') &&
    hasPermission('courses', 'delete');

  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Deletion state
  const [courseToDelete, setCourseToDelete] = useState<Course | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const categories = ['all', ...Array.from(new Set(courses.map(c => c.category)))];

  const filteredCourses = courses.filter(c => {
    if (categoryFilter !== 'all' && c.category !== categoryFilter) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        c.name.toLowerCase().includes(q) ||
        c.code.toLowerCase().includes(q) ||
        c.description.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const handleConfirmDelete = async () => {
    if (!courseToDelete) return;
    setIsDeleting(true);
    try {
      const res = await deleteCourse(courseToDelete.id);
      if (res.success) {
        setFeedback({
          type: 'success',
          message: `El curso "${courseToDelete.name}" (${courseToDelete.code}) ha sido eliminado correctamente.`
        });
        setCourseToDelete(null);
        setTimeout(() => setFeedback(null), 4500);
      } else {
        setFeedback({
          type: 'error',
          message: res.error || 'No se pudo eliminar el curso seleccionado.'
        });
      }
    } catch (err: any) {
      setFeedback({
        type: 'error',
        message: err?.message || 'Ocurrió un error inesperado al eliminar el curso.'
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Action feedback toast */}
      {feedback && (
        <div
          className={`p-4 rounded-xl border flex items-center justify-between gap-3 text-xs font-semibold shadow-sm transition-all ${
            feedback.type === 'success'
              ? 'bg-emerald-50 text-emerald-900 border-emerald-200'
              : 'bg-red-50 text-red-900 border-red-200'
          }`}
        >
          <div className="flex items-center gap-2">
            {feedback.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            )}
            <span>{feedback.message}</span>
          </div>
          <button
            onClick={() => setFeedback(null)}
            className="text-slate-400 hover:text-slate-700 font-bold px-2 py-0.5"
          >
            ✕
          </button>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-200">
              OFERTA ACADÉMICA
            </span>
            <span className="text-slate-400 text-xs">&bull; Especialización Aduanera</span>
          </div>
          <h2 className="text-xl font-black tracking-tight text-slate-900">
            Catálogo de Cursos y Programas
          </h2>
          <p className="text-slate-500 text-xs mt-0.5">
            Administración de materias, precios arancelarios, temarios y horarios vigentes.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {hasPermission('courses', 'write') && (
            <button
              onClick={() => {
                setSelectedCourse(null);
                setIsModalOpen(true);
              }}
              className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-2 shadow-md shadow-amber-500/20 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Nuevo Curso</span>
            </button>
          )}
        </div>
      </div>

      {/* Search & Category Filter */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar por código, nombre o temario..."
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-amber-500"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto scrollbar-none pb-1 sm:pb-0">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                categoryFilter === cat
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {cat === 'all' ? 'Todas las Categorías' : cat}
            </button>
          ))}
        </div>
      </div>

      {/* Courses Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredCourses.map(course => {
          const courseGroups = groups.filter(g => g.courseId === course.id);

          return (
            <div
              key={course.id}
              className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden hover:border-amber-400 hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div className="p-5 space-y-3">
                <div className="flex items-start justify-between">
                  <span className="font-mono text-xs font-extrabold px-2.5 py-1 rounded-lg bg-amber-50 text-amber-900 border border-amber-200">
                    {course.code}
                  </span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    course.status === 'Inscripciones abiertas' ? 'bg-emerald-100 text-emerald-800' :
                    course.status === 'En curso' ? 'bg-blue-100 text-blue-800' : 'bg-slate-100 text-slate-700'
                  }`}>
                    {course.status}
                  </span>
                </div>

                <div>
                  <h3 className="font-bold text-slate-900 text-sm leading-snug">
                    {course.name}
                  </h3>
                  <p className="text-slate-500 text-xs mt-1 line-clamp-2 leading-relaxed">
                    {course.description}
                  </p>
                </div>

                <div className="pt-2 border-t border-slate-100 grid grid-cols-2 gap-2 text-xs">
                  <div className="flex items-center gap-1.5 text-slate-600">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <span>{course.durationWeeks} sem ({course.durationHours}h)</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-600">
                    <Tag className="w-3.5 h-3.5 text-slate-400" />
                    <span>{course.modality}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-600">
                    <Users className="w-3.5 h-3.5 text-slate-400" />
                    <span>{course.enrolledCount} Matriculados</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-600">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    <span>{courseGroups.length} Grupos activos</span>
                  </div>
                </div>

                {/* Price pill */}
                <div className="p-3 bg-amber-50/50 rounded-xl border border-amber-200/60 flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-amber-900">Inversión del Programa:</span>
                  <span className="font-extrabold text-slate-900 text-sm">
                    {settings.currencySymbol} {course.price.toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Card Footer Actions */}
              <div className="p-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs">
                <div className="flex items-center gap-1">
                  {hasPermission('courses', 'write') && (
                    <button
                      onClick={() => {
                        setSelectedCourse(course);
                        setIsModalOpen(true);
                      }}
                      className="p-1.5 rounded-lg text-slate-600 hover:text-blue-600 hover:bg-white flex items-center gap-1 cursor-pointer transition-colors"
                      title="Editar curso"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      <span>Editar</span>
                    </button>
                  )}

                  {canDeleteCourse && (
                    <button
                      onClick={() => setCourseToDelete(course)}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-red-600 hover:bg-red-50 flex items-center gap-1 cursor-pointer transition-colors"
                      title="Eliminar curso (Solo Superadmin y Administradores)"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Eliminar</span>
                    </button>
                  )}
                </div>

                {hasPermission('enrollments', 'write') && onOpenQuickEnrollment && (
                  <button
                    onClick={onOpenQuickEnrollment}
                    className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-bold text-[11px] flex items-center gap-1 cursor-pointer"
                  >
                    <span>Matricular</span>
                    <ArrowUpRight className="w-3 h-3 text-amber-400" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Delete Course Confirmation Modal */}
      {courseToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-red-50 border border-red-200 flex items-center justify-center text-red-600 shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-800">
                    ACCESO ADMINISTRATIVO
                  </span>
                  <span className="text-slate-400 text-xs">Superadmin / Admin</span>
                </div>
                <h3 className="text-base font-bold text-slate-900 leading-tight">
                  ¿Eliminar este curso del catálogo?
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Esta acción removerá el programa educativo y sus grupos activos de la plataforma.
                </p>
              </div>
            </div>

            {/* Course Summary Box */}
            <div className="mt-4 p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-mono font-bold text-amber-900 bg-amber-100/70 px-2 py-0.5 rounded text-[11px]">
                  {courseToDelete.code}
                </span>
                <span className="font-semibold text-slate-700">
                  {settings.currencySymbol} {courseToDelete.price.toLocaleString()}
                </span>
              </div>
              <p className="font-bold text-slate-900 text-sm">{courseToDelete.name}</p>
              
              {(() => {
                const linkedGroups = groups.filter(g => g.courseId === courseToDelete.id);
                return (
                  <div className="pt-2 border-t border-slate-200/80 flex items-center justify-between text-[11px] text-slate-600">
                    <span>Grupos vinculados: <strong className="text-slate-900">{linkedGroups.length}</strong></span>
                    <span>Matriculados: <strong className="text-slate-900">{courseToDelete.enrolledCount || 0}</strong></span>
                  </div>
                );
              })()}
            </div>

            {(() => {
              const linkedGroups = groups.filter(g => g.courseId === courseToDelete.id);
              if (linkedGroups.length > 0 || (courseToDelete.enrolledCount && courseToDelete.enrolledCount > 0)) {
                return (
                  <div className="mt-3 p-2.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 text-[11px] flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <span>
                      Atención: Existen {linkedGroups.length} grupo(s) asociados a este curso que también serán removidos del sistema.
                    </span>
                  </div>
                );
              }
              return null;
            })()}

            <div className="mt-6 flex items-center justify-end gap-2.5">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setCourseToDelete(null)}
                className="px-4 py-2 rounded-xl border border-slate-300 hover:bg-slate-100 font-medium text-slate-700 text-xs cursor-pointer transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleConfirmDelete}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm shadow-red-500/20 cursor-pointer transition-all disabled:opacity-50"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Eliminando...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Sí, eliminar curso</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Course Modal */}
      <CourseFormModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedCourse(null);
        }}
        courseToEdit={selectedCourse}
      />
    </div>
  );
};

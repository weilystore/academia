import React, { useState, useMemo } from 'react';
import {
  Users,
  UserPlus,
  Search,
  Filter,
  Download,
  Eye,
  Edit2,
  Trash2,
  MessageSquare,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  GraduationCap
} from 'lucide-react';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { Student, StudentStatus } from '../../types';
import { StudentFormModal } from './StudentFormModal';
import { StudentProfileModal } from './StudentProfileModal';

interface StudentsViewProps {
  initialFilter?: string;
  onOpenQuickEnrollmentForStudent?: (student: Student) => void;
  onOpenQuickPaymentForStudent?: (student: Student) => void;
}

export const StudentsView: React.FC<StudentsViewProps> = ({
  initialFilter = 'all',
  onOpenQuickEnrollmentForStudent,
  onOpenQuickPaymentForStudent
}) => {
  const { students, deleteStudent } = useData();
  const { hasPermission } = useAuth();

  // Search, filter, sorting, pagination state
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>(initialFilter);
  const [sortField, setSortField] = useState<'name' | 'date' | 'identity'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Modal states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [studentToEdit, setStudentToEdit] = useState<Student | null>(null);
  const [selectedStudentForProfile, setSelectedStudentForProfile] = useState<Student | null>(null);

  // Filtered and sorted students
  const filteredStudents = useMemo(() => {
    return students.filter(s => {
      // 1. Status Filter
      if (statusFilter !== 'all' && s.status !== statusFilter) {
        return false;
      }

      // 2. Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const fullName = `${s.firstName} ${s.lastName}`.toLowerCase();
        const idNum = (s.identityNumber || '').toLowerCase();
        const email = (s.email || '').toLowerCase();
        const phone = (s.phone || '');
        const course = (s.currentCourse || '').toLowerCase();

        return (
          fullName.includes(q) ||
          idNum.includes(q) ||
          email.includes(q) ||
          phone.includes(q) ||
          course.includes(q)
        );
      }

      return true;
    }).sort((a, b) => {
      if (sortField === 'name') {
        const nameA = `${a.firstName} ${a.lastName}`.toLowerCase();
        const nameB = `${b.firstName} ${b.lastName}`.toLowerCase();
        return sortOrder === 'asc' ? nameA.localeCompare(nameB) : nameB.localeCompare(nameA);
      }
      if (sortField === 'identity') {
        return sortOrder === 'asc'
          ? a.identityNumber.localeCompare(b.identityNumber)
          : b.identityNumber.localeCompare(a.identityNumber);
      }
      // date
      const dateA = new Date(a.createdAt).getTime();
      const dateB = new Date(b.createdAt).getTime();
      return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
    });
  }, [students, statusFilter, searchQuery, sortField, sortOrder]);

  // Pagination slice
  const totalPages = Math.max(1, Math.ceil(filteredStudents.length / itemsPerPage));
  const paginatedStudents = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredStudents.slice(start, start + itemsPerPage);
  }, [filteredStudents, currentPage]);

  // Export to CSV
  const handleExportCSV = () => {
    const headers = ['ID', 'DNI', 'Nombres', 'Apellidos', 'Email', 'Teléfono', 'WhatsApp', 'Ciudad', 'Estado', 'Curso Actual'];
    const rows = filteredStudents.map(s => [
      s.id,
      `"${s.identityNumber}"`,
      `"${s.firstName}"`,
      `"${s.lastName}"`,
      `"${s.email}"`,
      `"${s.phone}"`,
      `"${s.whatsapp}"`,
      `"${s.city}"`,
      `"${s.status}"`,
      `"${s.currentCourse || ''}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Estudiantes_Academia_Aduanas_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleEdit = (student: Student) => {
    setStudentToEdit(student);
    setIsFormOpen(true);
  };

  const handleDelete = async (id: string, name: string) => {
    if (window.confirm(`¿Está seguro de eliminar el registro del estudiante "${name}"? Esta acción se registrará en la auditoría.`)) {
      await deleteStudent(id);
    }
  };

  const toggleSort = (field: 'name' | 'date' | 'identity') => {
    if (sortField === field) {
      setSortOrder(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const filterTabs = [
    { id: 'all', label: 'Todos', count: students.length },
    { id: 'Activo', label: 'Activos', count: students.filter(s => s.status === 'Activo').length },
    { id: 'Prospecto', label: 'Prospectos', count: students.filter(s => s.status === 'Prospecto').length },
    { id: 'Preinscrito', label: 'Preinscritos', count: students.filter(s => s.status === 'Preinscrito').length },
    { id: 'Graduado', label: 'Graduados', count: students.filter(s => s.status === 'Graduado').length },
    { id: 'Inactivo', label: 'Inactivos', count: students.filter(s => s.status === 'Inactivo' || s.status === 'Retirado').length },
  ];

  return (
    <div className="space-y-6 pb-12">
      {/* Header Banner */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-200">
              EXPEDIENTES ACADÉMICOS
            </span>
            <span className="text-slate-400 text-xs">&bull; {students.length} Registros totales</span>
          </div>
          <h2 className="text-xl font-black tracking-tight text-slate-900">
            Padrón General de Estudiantes
          </h2>
          <p className="text-slate-500 text-xs mt-0.5">
            Administración completa de fichas personales, detección de duplicados, matrículas y comunicaciones.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={handleExportCSV}
            className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200/80 text-slate-700 font-semibold text-xs flex items-center gap-2 border border-slate-200 transition-colors cursor-pointer"
            title="Exportar a CSV / Excel"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Exportar CSV</span>
          </button>

          {hasPermission('students', 'write') && (
            <button
              id="btn-new-student"
              onClick={() => {
                setStudentToEdit(null);
                setIsFormOpen(true);
              }}
              className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-2 shadow-md shadow-amber-500/20 transition-all cursor-pointer"
            >
              <UserPlus className="w-4 h-4" />
              <span>Nuevo Estudiante</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter Tabs & Search Controls */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
        {/* Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 border-b border-slate-100 scrollbar-none">
          {filterTabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => {
                setStatusFilter(tab.id);
                setCurrentPage(1);
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                statusFilter === tab.id
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <span>{tab.label}</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                statusFilter === tab.id ? 'bg-amber-400 text-slate-950 font-bold' : 'bg-slate-200 text-slate-700'
              }`}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Search Input and Sort bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-96">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              id="input-search-students"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Buscar por nombre, DNI, teléfono, email o curso..."
              className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-amber-500 focus:border-amber-500"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end text-xs text-slate-500">
            <span>Ordenar por:</span>
            <button
              onClick={() => toggleSort('name')}
              className={`px-2.5 py-1 rounded-lg border text-xs flex items-center gap-1 font-medium transition-colors ${
                sortField === 'name' ? 'bg-amber-50 border-amber-300 text-amber-900 font-bold' : 'border-slate-200 hover:bg-slate-50'
              }`}
            >
              <span>Nombre</span>
              <ArrowUpDown className="w-3 h-3" />
            </button>
            <button
              onClick={() => toggleSort('date')}
              className={`px-2.5 py-1 rounded-lg border text-xs flex items-center gap-1 font-medium transition-colors ${
                sortField === 'date' ? 'bg-amber-50 border-amber-300 text-amber-900 font-bold' : 'border-slate-200 hover:bg-slate-50'
              }`}
            >
              <span>Fecha</span>
              <ArrowUpDown className="w-3 h-3" />
            </button>
            <button
              onClick={() => toggleSort('identity')}
              className={`px-2.5 py-1 rounded-lg border text-xs flex items-center gap-1 font-medium transition-colors ${
                sortField === 'identity' ? 'bg-amber-50 border-amber-300 text-amber-900 font-bold' : 'border-slate-200 hover:bg-slate-50'
              }`}
            >
              <span>DNI</span>
              <ArrowUpDown className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Students Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        {paginatedStudents.length === 0 ? (
          <div className="py-16 text-center text-slate-500">
            <Users className="w-10 h-10 mx-auto text-slate-300 mb-2" />
            <p className="font-bold text-slate-800 text-sm">No se encontraron estudiantes</p>
            <p className="text-xs text-slate-400 mt-1">
              {searchQuery ? `No hay resultados para "${searchQuery}"` : 'No hay registros en esta categoría.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900 text-white text-[11px] uppercase tracking-wider font-semibold">
                <tr>
                  <th className="p-3.5">Estudiante</th>
                  <th className="p-3.5">DNI / Cédula</th>
                  <th className="p-3.5">Contacto</th>
                  <th className="p-3.5">Ciudad</th>
                  <th className="p-3.5">Curso Actual</th>
                  <th className="p-3.5">Estado</th>
                  <th className="p-3.5 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paginatedStudents.map(student => (
                  <tr
                    key={student.id}
                    className="hover:bg-amber-50/30 transition-colors group cursor-pointer"
                    onClick={() => setSelectedStudentForProfile(student)}
                  >
                    {/* Student Name & Avatar */}
                    <td className="p-3.5">
                      <div className="flex items-center gap-3">
                        <img
                          src={student.photoUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=80'}
                          alt=""
                          className="w-9 h-9 rounded-full object-cover border border-slate-200"
                        />
                        <div>
                          <p className="font-bold text-slate-900 leading-tight">
                            {student.firstName} {student.lastName}
                          </p>
                          <p className="text-[11px] text-slate-400 mt-0.5">
                            {student.profession || 'Estudiante Aduanero'}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* DNI */}
                    <td className="p-3.5 font-mono text-slate-700 font-semibold">
                      {student.identityNumber}
                    </td>

                    {/* Contact */}
                    <td className="p-3.5">
                      <p className="text-slate-800 font-medium">{student.phone}</p>
                      <p className="text-[11px] text-slate-400 truncate max-w-[160px]">{student.email}</p>
                    </td>

                    {/* City */}
                    <td className="p-3.5 text-slate-600">
                      {student.city}
                    </td>

                    {/* Current Course */}
                    <td className="p-3.5">
                      {student.currentCourse ? (
                        <span className="font-semibold text-amber-700 flex items-center gap-1 truncate max-w-[180px]">
                          <GraduationCap className="w-3.5 h-3.5 shrink-0 text-amber-500" />
                          <span className="truncate">{student.currentCourse}</span>
                        </span>
                      ) : (
                        <span className="text-slate-400 italic text-[11px]">Sin curso activo</span>
                      )}
                    </td>

                    {/* Status Badge */}
                    <td className="p-3.5">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        student.status === 'Activo' ? 'bg-emerald-100 text-emerald-800' :
                        student.status === 'Prospecto' ? 'bg-blue-100 text-blue-800' :
                        student.status === 'Preinscrito' ? 'bg-amber-100 text-amber-800' :
                        student.status === 'Graduado' ? 'bg-purple-100 text-purple-800' :
                        'bg-slate-100 text-slate-600'
                      }`}>
                        {student.status}
                      </span>
                    </td>

                    {/* Action buttons */}
                    <td className="p-3.5 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => setSelectedStudentForProfile(student)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-amber-600 hover:bg-amber-50 transition-colors"
                          title="Ver Perfil Completo"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        {hasPermission('students', 'write') && (
                          <button
                            onClick={() => handleEdit(student)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                            title="Editar Datos"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                        )}

                        {hasPermission('students', 'delete') && (
                          <button
                            onClick={() => handleDelete(student.id, `${student.firstName} ${student.lastName}`)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                            title="Eliminar Estudiante"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination controls */}
        {filteredStudents.length > itemsPerPage && (
          <div className="px-4 py-3 border-t border-slate-100 bg-slate-50 flex items-center justify-between text-xs text-slate-600">
            <span>
              Mostrando {Math.min(filteredStudents.length, (currentPage - 1) * itemsPerPage + 1)} a {Math.min(filteredStudents.length, currentPage * itemsPerPage)} de {filteredStudents.length} estudiantes
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-1.5 rounded-lg border border-slate-200 hover:bg-white disabled:opacity-40 cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="px-3 py-1 font-semibold text-slate-800">
                {currentPage} / {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-1.5 rounded-lg border border-slate-200 hover:bg-white disabled:opacity-40 cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Student Form Modal (Registration / Edit) */}
      <StudentFormModal
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setStudentToEdit(null);
        }}
        studentToEdit={studentToEdit}
        onOpenExistingProfile={(existing) => {
          setSelectedStudentForProfile(existing);
        }}
      />

      {/* Student Profile Modal (With 9 Tabs) */}
      <StudentProfileModal
        isOpen={!!selectedStudentForProfile}
        onClose={() => setSelectedStudentForProfile(null)}
        student={selectedStudentForProfile}
        onEditStudent={(s) => {
          setSelectedStudentForProfile(null);
          handleEdit(s);
        }}
        onOpenQuickEnrollmentForStudent={onOpenQuickEnrollmentForStudent}
        onOpenQuickPaymentForStudent={onOpenQuickPaymentForStudent}
      />
    </div>
  );
};

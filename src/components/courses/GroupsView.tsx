import React, { useState } from 'react';
import {
  Layers,
  Plus,
  Calendar,
  Clock,
  MapPin,
  User,
  Users,
  X,
  Save
} from 'lucide-react';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { CourseGroup } from '../../types';

export const GroupsView: React.FC = () => {
  const { groups, courses, addGroup } = useData();
  const { hasPermission } = useAuth();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [courseId, setCourseId] = useState(courses[0]?.id || '');
  const [name, setName] = useState('');
  const [schedule, setSchedule] = useState('Sábados 8:00 AM - 1:00 PM');
  const [instructorName, setInstructorName] = useState('Lic. Roberto Méndez');
  const [classroom, setClassroom] = useState('Aula Magna 2 - Torre Alianza');
  const [maxCapacity, setMaxCapacity] = useState(25);
  const [startDate, setStartDate] = useState('2026-03-21');
  const [endDate, setEndDate] = useState('2026-05-16');

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const course = courses.find(c => c.id === courseId);
    if (!course) return;

    await addGroup({
      courseId,
      courseName: course.name,
      name,
      schedule,
      instructorName,
      classroom,
      maxCapacity,
      startDate,
      endDate,
      status: 'Abierto'
    });

    setIsModalOpen(false);
    setName('');
  };

  return (
    <div className="space-y-6 pb-12">
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-purple-800 border border-purple-200">
              PLANIFICACIÓN DOCENTE
            </span>
            <span className="text-slate-400 text-xs">&bull; {groups.length} Grupos asignados</span>
          </div>
          <h2 className="text-xl font-black tracking-tight text-slate-900">
            Grupos, Horarios y Aulas
          </h2>
          <p className="text-slate-500 text-xs mt-0.5">
            Gestión de turnos sabatinos, vespertinos e instructores aduaneros asignados.
          </p>
        </div>

        {hasPermission('courses', 'write') && (
          <button
            onClick={() => setIsModalOpen(true)}
            className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-2 shadow-md shadow-amber-500/20 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Crear Nuevo Grupo</span>
          </button>
        )}
      </div>

      {/* Groups Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {groups.map(grp => {
          const capPct = Math.round((grp.enrolledCount / grp.maxCapacity) * 100);

          return (
            <div key={grp.id} className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-4 hover:border-amber-400 transition-colors">
              <div className="flex items-start justify-between">
                <div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-800 border border-blue-200">
                    {grp.courseName}
                  </span>
                  <h3 className="font-bold text-slate-900 text-sm mt-1.5">{grp.name}</h3>
                </div>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                  grp.status === 'Abierto' ? 'bg-emerald-100 text-emerald-800' :
                  grp.status === 'En curso' ? 'bg-blue-100 text-blue-800' : 'bg-slate-100 text-slate-700'
                }`}>
                  {grp.status}
                </span>
              </div>

              <div className="space-y-2 text-xs text-slate-600">
                <div className="flex items-center gap-2">
                  <Clock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                  <span className="font-medium">{grp.schedule}</span>
                </div>
                <div className="flex items-center gap-2">
                  <User className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                  <span>Instructor: <strong>{grp.instructorName}</strong></span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                  <span>{grp.classroom}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span>{grp.startDate} al {grp.endDate}</span>
                </div>
              </div>

              {/* Capacity Progress Bar */}
              <div className="pt-3 border-t border-slate-100">
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="text-slate-500 font-medium">Cupo disponible:</span>
                  <span className="font-bold text-slate-800">
                    {grp.enrolledCount} / {grp.maxCapacity} ({capPct}%)
                  </span>
                </div>
                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      capPct >= 90 ? 'bg-rose-500' : capPct >= 70 ? 'bg-amber-500' : 'bg-emerald-500'
                    }`}
                    style={{ width: `${Math.min(100, capPct)}%` }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Create Group Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95">
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-amber-400" />
                <h3 className="font-bold text-sm text-white">Crear Nuevo Grupo / Horario</h3>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateGroup} className="p-6 space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Curso Asignado *</label>
                <select
                  value={courseId}
                  onChange={e => setCourseId(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white"
                >
                  {courses.map(c => (
                    <option key={c.id} value={c.id}>{c.code} - {c.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Nombre del Grupo *</label>
                <input
                  type="text"
                  required
                  placeholder="ej: Grupo A - Sabatino Presencial"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Horario de Clases *</label>
                  <input
                    type="text"
                    required
                    placeholder="Sábados 8:00 AM - 1:00 PM"
                    value={schedule}
                    onChange={e => setSchedule(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Capacidad Máxima (Alumnos)</label>
                  <input
                    type="number"
                    min={5}
                    value={maxCapacity}
                    onChange={e => setMaxCapacity(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Instructor Asignado</label>
                <input
                  type="text"
                  placeholder="Lic. Roberto Méndez"
                  value={instructorName}
                  onChange={e => setInstructorName(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Aula / Salón o Enlace Virtual</label>
                <input
                  type="text"
                  placeholder="Aula 102 - Torre Alianza o Google Meet"
                  value={classroom}
                  onChange={e => setClassroom(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Fecha de Inicio</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={e => setStartDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Fecha de Fin</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={e => setEndDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-lg border border-slate-300 hover:bg-slate-100 font-medium"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold flex items-center gap-1.5 cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>Guardar Grupo</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

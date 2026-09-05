import React, { useState, useEffect } from 'react';
import {
  CalendarCheck,
  Users,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  Save,
  Calendar
} from 'lucide-react';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { AttendanceStatus } from '../../types';

export const AttendanceView: React.FC = () => {
  const { courses, groups, enrollments, attendance, saveAttendanceBatch } = useData();
  const { hasPermission } = useAuth();

  const [selectedCourseId, setSelectedCourseId] = useState(courses[0]?.id || '');
  const [selectedGroupId, setSelectedGroupId] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().slice(0, 10));

  // Course groups
  const filteredGroups = groups.filter(g => g.courseId === selectedCourseId);

  useEffect(() => {
    if (filteredGroups.length > 0 && !filteredGroups.some(g => g.id === selectedGroupId)) {
      setSelectedGroupId(filteredGroups[0].id);
    }
  }, [selectedCourseId, filteredGroups]);

  // Students enrolled in this course/group
  const enrolledStudents = enrollments.filter(e =>
    e.courseId === selectedCourseId && (!selectedGroupId || e.groupId === selectedGroupId)
  );

  // Local state for the session attendance
  const [sessionAttendance, setSessionAttendance] = useState<Record<string, { status: AttendanceStatus; notes: string }>>({});
  const [isSaved, setIsSaved] = useState(false);

  // Load existing records for this date if any, or default to Presente
  useEffect(() => {
    const existing = attendance.filter(a =>
      a.courseId === selectedCourseId &&
      a.groupId === selectedGroupId &&
      a.date === selectedDate
    );

    const initialMap: Record<string, { status: AttendanceStatus; notes: string }> = {};

    enrolledStudents.forEach(e => {
      const found = existing.find(ex => ex.studentId === e.studentId);
      if (found) {
        initialMap[e.studentId] = { status: found.status, notes: found.observations || '' };
      } else {
        initialMap[e.studentId] = { status: 'Presente', notes: '' };
      }
    });

    setSessionAttendance(initialMap);
    setIsSaved(false);
  }, [selectedCourseId, selectedGroupId, selectedDate, enrollments]);

  const handleStatusChange = (studentId: string, status: AttendanceStatus) => {
    setSessionAttendance(prev => ({
      ...prev,
      [studentId]: { ...prev[studentId], status }
    }));
    setIsSaved(false);
  };

  const handleNotesChange = (studentId: string, notes: string) => {
    setSessionAttendance(prev => ({
      ...prev,
      [studentId]: { ...prev[studentId], notes }
    }));
    setIsSaved(false);
  };

  const markAll = (status: AttendanceStatus) => {
    const updated: Record<string, { status: AttendanceStatus; notes: string }> = {};
    enrolledStudents.forEach(e => {
      updated[e.studentId] = {
        status,
        notes: sessionAttendance[e.studentId]?.notes || ''
      };
    });
    setSessionAttendance(updated);
    setIsSaved(false);
  };

  const handleSave = async () => {
    const course = courses.find(c => c.id === selectedCourseId);
    const group = groups.find(g => g.id === selectedGroupId);

    const records = enrolledStudents.map(e => ({
      studentId: e.studentId,
      studentName: e.studentName,
      courseId: selectedCourseId,
      courseName: course?.name || 'Curso Aduanero',
      groupId: selectedGroupId || 'grp-general',
      groupName: group?.name || 'Grupo General',
      date: selectedDate,
      status: sessionAttendance[e.studentId]?.status || 'Presente',
      observations: sessionAttendance[e.studentId]?.notes || ''
    }));

    await saveAttendanceBatch(records);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  // Stats for this session
  const totalInSession = enrolledStudents.length;
  const sessionList = Object.values(sessionAttendance) as Array<{ status: AttendanceStatus; notes: string }>;
  const presentCount = sessionList.filter(v => v.status === 'Presente').length;
  const absentCount = sessionList.filter(v => v.status === 'Ausente').length;
  const lateCount = sessionList.filter(v => v.status === 'Tardanza').length;
  const justifiedCount = sessionList.filter(v => v.status === 'Justificado').length;

  return (
    <div className="space-y-6 pb-12">
      {/* Header Banner */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-200">
              REGISTRO DE CLASES
            </span>
            <span className="text-slate-400 text-xs">&bull; Asistencia por Sesión</span>
          </div>
          <h2 className="text-xl font-black tracking-tight text-slate-900">
            Toma de Asistencia y Asistencia Diaria
          </h2>
          <p className="text-slate-500 text-xs mt-0.5">
            Control puntual por curso y grupo con cálculo automático de porcentajes de presencialidad.
          </p>
        </div>

        {hasPermission('attendance', 'write') && enrolledStudents.length > 0 && (
          <button
            onClick={handleSave}
            className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-2 shadow-md shadow-amber-500/20 transition-all cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>{isSaved ? '¡Asistencia Guardada!' : 'Guardar Asistencia'}</span>
          </button>
        )}
      </div>

      {/* Selectors Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label className="block text-slate-700 font-semibold text-xs mb-1">Curso / Programa:</label>
          <select
            value={selectedCourseId}
            onChange={e => setSelectedCourseId(e.target.value)}
            className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-slate-50 font-medium"
          >
            {courses.map(c => (
              <option key={c.id} value={c.id}>{c.code} - {c.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-slate-700 font-semibold text-xs mb-1">Grupo y Horario:</label>
          <select
            value={selectedGroupId}
            onChange={e => setSelectedGroupId(e.target.value)}
            className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-slate-50 font-medium"
          >
            {filteredGroups.length === 0 ? (
              <option value="">Sin grupos específicos</option>
            ) : (
              filteredGroups.map(g => (
                <option key={g.id} value={g.id}>{g.name} ({g.schedule})</option>
              ))
            )}
          </select>
        </div>

        <div>
          <label className="block text-slate-700 font-semibold text-xs mb-1">Fecha de la Sesión:</label>
          <input
            type="date"
            value={selectedDate}
            onChange={e => setSelectedDate(e.target.value)}
            className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-slate-50 font-medium"
          />
        </div>
      </div>

      {/* Quick Session Stats & Bulk Buttons */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3 text-xs flex-wrap">
          <span className="font-bold text-slate-700">Resumen sesión:</span>
          <span className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 font-semibold flex items-center gap-1">
            <CheckCircle className="w-3.5 h-3.5" /> {presentCount} Presentes
          </span>
          <span className="px-2.5 py-1 rounded-lg bg-rose-50 text-rose-700 font-semibold flex items-center gap-1">
            <XCircle className="w-3.5 h-3.5" /> {absentCount} Ausentes
          </span>
          <span className="px-2.5 py-1 rounded-lg bg-amber-50 text-amber-700 font-semibold flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" /> {lateCount} Tardanzas
          </span>
          <span className="px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 font-semibold flex items-center gap-1">
            <AlertCircle className="w-3.5 h-3.5" /> {justifiedCount} Justificados
          </span>
        </div>

        {hasPermission('attendance', 'write') && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => markAll('Presente')}
              className="px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-emerald-50 hover:text-emerald-800 text-slate-700 text-xs font-semibold transition-colors cursor-pointer"
            >
              Todos Presentes
            </button>
            <button
              onClick={() => markAll('Justificado')}
              className="px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-blue-50 hover:text-blue-800 text-slate-700 text-xs font-semibold transition-colors cursor-pointer"
            >
              Todos Justificados
            </button>
          </div>
        )}
      </div>

      {/* Enrolled Students Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        {enrolledStudents.length === 0 ? (
          <div className="py-12 text-center text-slate-500">
            <Users className="w-10 h-10 mx-auto text-slate-300 mb-2" />
            <p className="font-bold text-slate-800 text-sm">No hay estudiantes matriculados en este grupo</p>
            <p className="text-xs text-slate-400 mt-1">Selecciona otro curso o formaliza matrículas para comenzar.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900 text-white text-[11px] uppercase tracking-wider font-semibold">
                <tr>
                  <th className="p-3.5">No.</th>
                  <th className="p-3.5">Estudiante</th>
                  <th className="p-3.5">Matrícula No.</th>
                  <th className="p-3.5 text-center">Estado de Asistencia</th>
                  <th className="p-3.5">Observaciones de la Sesión</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {enrolledStudents.map((enr, idx) => {
                  const studentStatus = sessionAttendance[enr.studentId]?.status || 'Presente';
                  const studentNotes = sessionAttendance[enr.studentId]?.notes || '';

                  return (
                    <tr key={enr.id} className="hover:bg-slate-50 transition-colors">
                      <td className="p-3.5 font-bold text-slate-400">
                        {idx + 1}
                      </td>
                      <td className="p-3.5 font-bold text-slate-900">
                        {enr.studentName}
                      </td>
                      <td className="p-3.5 font-mono text-slate-500">
                        {enr.enrollmentNumber}
                      </td>
                      <td className="p-3.5">
                        <div className="flex items-center justify-center gap-1">
                          {(['Presente', 'Ausente', 'Tardanza', 'Justificado'] as AttendanceStatus[]).map(st => (
                            <button
                              key={st}
                              type="button"
                              onClick={() => handleStatusChange(enr.studentId, st)}
                              className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-colors cursor-pointer ${
                                studentStatus === st
                                  ? st === 'Presente' ? 'bg-emerald-600 text-white shadow-xs' :
                                    st === 'Ausente' ? 'bg-rose-600 text-white shadow-xs' :
                                    st === 'Tardanza' ? 'bg-amber-500 text-slate-950 shadow-xs' :
                                    'bg-blue-600 text-white shadow-xs'
                                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                              }`}
                            >
                              {st}
                            </button>
                          ))}
                        </div>
                      </td>
                      <td className="p-3.5">
                        <input
                          type="text"
                          placeholder="ej: Llegó con 15min de retraso / Con permiso de aduana"
                          value={studentNotes}
                          onChange={e => handleNotesChange(enr.studentId, e.target.value)}
                          className="w-full px-2.5 py-1 rounded-lg border border-slate-200 text-xs bg-slate-50 focus:bg-white focus:outline-hidden"
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

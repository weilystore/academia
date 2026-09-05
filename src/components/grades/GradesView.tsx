import React, { useState } from 'react';
import {
  Award,
  Users,
  Save,
  CheckCircle,
  AlertTriangle,
  FileCheck,
  TrendingUp
} from 'lucide-react';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';

export const GradesView: React.FC = () => {
  const { courses, groups, enrollments, grades, saveGrade } = useData();
  const { hasPermission } = useAuth();

  const [selectedCourseId, setSelectedCourseId] = useState(courses[0]?.id || '');
  const [selectedGroupId, setSelectedGroupId] = useState('');
  const [evaluationName, setEvaluationName] = useState('Examen Parcial I - Clasificación Arancelaria');
  const [maxGrade, setMaxGrade] = useState(100);

  const filteredGroups = groups.filter(g => g.courseId === selectedCourseId);
  const enrolledStudents = enrollments.filter(e =>
    e.courseId === selectedCourseId && (!selectedGroupId || e.groupId === selectedGroupId)
  );

  // Map of student grades in input
  const [gradesInput, setGradesInput] = useState<Record<string, { grade: number; comments: string }>>({});
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleGradeChange = (studentId: string, val: number) => {
    setGradesInput(prev => ({
      ...prev,
      [studentId]: {
        grade: Math.max(0, Math.min(maxGrade, val)),
        comments: prev[studentId]?.comments || ''
      }
    }));
    setSavedSuccess(false);
  };

  const handleCommentsChange = (studentId: string, comments: string) => {
    setGradesInput(prev => ({
      ...prev,
      [studentId]: {
        grade: prev[studentId]?.grade || 85,
        comments
      }
    }));
    setSavedSuccess(false);
  };

  const handleSaveGrades = async () => {
    const course = courses.find(c => c.id === selectedCourseId);
    const group = groups.find(g => g.id === selectedGroupId);

    for (const enr of enrolledStudents) {
      const gVal = gradesInput[enr.studentId]?.grade ?? 85;
      const cVal = gradesInput[enr.studentId]?.comments || '';

      await saveGrade({
        studentId: enr.studentId,
        studentName: enr.studentName,
        courseId: selectedCourseId,
        courseName: course?.name || 'Curso Aduanero',
        groupId: selectedGroupId || 'grp-general',
        evaluationName,
        grade: gVal,
        maxGrade,
        date: new Date().toISOString().slice(0, 10),
        comments: cVal
      });
    }

    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3500);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header Banner */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-200">
              EVALUACIONES ACADÉMICAS
            </span>
            <span className="text-slate-400 text-xs">&bull; Escala 0 a 100 puntos (Aprobación: 70%)</span>
          </div>
          <h2 className="text-xl font-black tracking-tight text-slate-900">
            Control de Notas y Calificaciones
          </h2>
          <p className="text-slate-500 text-xs mt-0.5">
            Registro de evaluaciones, exámenes aduaneros y actas de aprobación.
          </p>
        </div>

        {hasPermission('grades', 'write') && enrolledStudents.length > 0 && (
          <button
            onClick={handleSaveGrades}
            className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-2 shadow-md shadow-amber-500/20 transition-all cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>{savedSuccess ? '¡Notas Guardadas con Éxito!' : 'Guardar Calificaciones'}</span>
          </button>
        )}
      </div>

      {/* Selectors Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label className="block text-slate-700 font-semibold text-xs mb-1">Curso / Asignatura:</label>
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
          <label className="block text-slate-700 font-semibold text-xs mb-1">Grupo:</label>
          <select
            value={selectedGroupId}
            onChange={e => setSelectedGroupId(e.target.value)}
            className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-slate-50 font-medium"
          >
            <option value="">Todos los grupos de este curso</option>
            {filteredGroups.map(g => (
              <option key={g.id} value={g.id}>{g.name} ({g.schedule})</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-slate-700 font-semibold text-xs mb-1">Nombre de la Evaluación:</label>
          <input
            type="text"
            value={evaluationName}
            onChange={e => setEvaluationName(e.target.value)}
            className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-slate-50 font-semibold text-slate-800"
          />
        </div>
      </div>

      {/* Grades Input Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        {enrolledStudents.length === 0 ? (
          <div className="py-12 text-center text-slate-500">
            <Award className="w-10 h-10 mx-auto text-slate-300 mb-2" />
            <p className="font-bold text-slate-800 text-sm">No hay estudiantes matriculados en este curso</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900 text-white text-[11px] uppercase tracking-wider font-semibold">
                <tr>
                  <th className="p-3.5">No.</th>
                  <th className="p-3.5">Estudiante</th>
                  <th className="p-3.5">Matrícula</th>
                  <th className="p-3.5">Calificación (0 - {maxGrade})</th>
                  <th className="p-3.5">Estado</th>
                  <th className="p-3.5">Observaciones / Retroalimentación</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {enrolledStudents.map((enr, i) => {
                  const currentGrade = gradesInput[enr.studentId]?.grade ?? 85;
                  const currentComments = gradesInput[enr.studentId]?.comments || '';
                  const isPassed = currentGrade >= 70;

                  return (
                    <tr key={enr.id} className="hover:bg-slate-50 transition-colors">
                      <td className="p-3.5 font-bold text-slate-400">{i + 1}</td>
                      <td className="p-3.5 font-bold text-slate-900">{enr.studentName}</td>
                      <td className="p-3.5 font-mono text-slate-500">{enr.enrollmentNumber}</td>
                      <td className="p-3.5">
                        <input
                          type="number"
                          min={0}
                          max={maxGrade}
                          value={currentGrade}
                          onChange={e => handleGradeChange(enr.studentId, Number(e.target.value))}
                          className="w-24 px-3 py-1 rounded-lg border border-slate-300 font-extrabold text-sm text-center text-slate-900 focus:ring-1 focus:ring-amber-500"
                        />
                      </td>
                      <td className="p-3.5">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold ${
                          isPassed ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                        }`}>
                          {isPassed ? 'APROBADO' : 'REPROBADO'}
                        </span>
                      </td>
                      <td className="p-3.5">
                        <input
                          type="text"
                          placeholder="ej: Excelente dominio en partida arancelaria 8471"
                          value={currentComments}
                          onChange={e => handleCommentsChange(enr.studentId, e.target.value)}
                          className="w-full px-3 py-1 rounded-lg border border-slate-200 text-xs bg-slate-50"
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

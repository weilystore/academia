import React, { useState } from 'react';
import {
  GraduationCap,
  Plus,
  Search,
  Download,
  Calendar,
  User,
  CheckCircle,
  XCircle,
  FileText,
  Printer,
  X
} from 'lucide-react';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { Enrollment } from '../../types';
import { EnrollmentFormModal } from './EnrollmentFormModal';

export const EnrollmentsView: React.FC = () => {
  const { enrollments, updateEnrollmentStatus, settings } = useData();
  const { hasPermission } = useAuth();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedEnrollmentForReceipt, setSelectedEnrollmentForReceipt] = useState<Enrollment | null>(null);

  const filtered = enrollments.filter(e => {
    if (statusFilter !== 'all' && e.status !== statusFilter) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        e.enrollmentNumber.toLowerCase().includes(q) ||
        e.studentName.toLowerCase().includes(q) ||
        e.courseName.toLowerCase().includes(q) ||
        e.groupName.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="space-y-6 pb-12">
      {/* Header Banner */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-200">
              REGISTRO ACADÉMICO
            </span>
            <span className="text-slate-400 text-xs">&bull; Códigos MAT-2026</span>
          </div>
          <h2 className="text-xl font-black tracking-tight text-slate-900">
            Control General de Matrículas
          </h2>
          <p className="text-slate-500 text-xs mt-0.5">
            Emisión de constancias de matrícula oficial, asignación de cursos y seguimiento de estados.
          </p>
        </div>

        {hasPermission('enrollments', 'write') && (
          <button
            id="btn-new-enrollment"
            onClick={() => setIsModalOpen(true)}
            className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-2 shadow-md shadow-amber-500/20 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Nueva Matrícula</span>
          </button>
        )}
      </div>

      {/* Filter and Search */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar por código MAT, estudiante o curso..."
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-amber-500"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto">
          {['all', 'Activa', 'Completada', 'Cancelada'].map(st => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                statusFilter === st
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {st === 'all' ? 'Todas' : st}
            </button>
          ))}
        </div>
      </div>

      {/* Enrollments Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        {filtered.length === 0 ? (
          <div className="py-12 text-center text-slate-500">
            <GraduationCap className="w-10 h-10 mx-auto text-slate-300 mb-2" />
            <p className="font-bold text-slate-800 text-sm">No se encontraron matrículas</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900 text-white text-[11px] uppercase tracking-wider font-semibold">
                <tr>
                  <th className="p-3.5">Código Matrícula</th>
                  <th className="p-3.5">Estudiante</th>
                  <th className="p-3.5">Curso / Programa</th>
                  <th className="p-3.5">Grupo</th>
                  <th className="p-3.5">Fecha Inicio</th>
                  <th className="p-3.5">Total</th>
                  <th className="p-3.5">Estado</th>
                  <th className="p-3.5 text-right">Comprobante</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map(enr => (
                  <tr key={enr.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-3.5 font-mono font-bold text-amber-700">
                      {enr.enrollmentNumber}
                    </td>
                    <td className="p-3.5 font-semibold text-slate-900">
                      {enr.studentName}
                    </td>
                    <td className="p-3.5 text-slate-800">
                      {enr.courseName}
                    </td>
                    <td className="p-3.5 text-slate-600">
                      {enr.groupName}
                    </td>
                    <td className="p-3.5 text-slate-500">
                      {enr.startDate}
                    </td>
                    <td className="p-3.5 font-extrabold text-slate-900">
                      {settings.currencySymbol} {enr.total.toLocaleString()}
                    </td>
                    <td className="p-3.5">
                      <select
                        value={enr.status}
                        onChange={e => updateEnrollmentStatus(enr.id, e.target.value as any)}
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full border-0 cursor-pointer ${
                          enr.status === 'Activa' ? 'bg-emerald-100 text-emerald-800' :
                          enr.status === 'Completada' ? 'bg-blue-100 text-blue-800' : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        <option value="Activa">Activa</option>
                        <option value="Completada">Completada</option>
                        <option value="Cancelada">Cancelada</option>
                      </select>
                    </td>
                    <td className="p-3.5 text-right">
                      <button
                        onClick={() => setSelectedEnrollmentForReceipt(enr)}
                        className="px-2.5 py-1 rounded-lg border border-slate-200 hover:bg-amber-50 hover:border-amber-300 text-slate-700 text-[11px] font-medium inline-flex items-center gap-1 cursor-pointer"
                      >
                        <FileText className="w-3.5 h-3.5 text-amber-600" />
                        <span>Ficha</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Enrollment Creation Modal */}
      <EnrollmentFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />

      {/* Official Enrollment Sheet Modal (Constancia Oficial) */}
      {selectedEnrollmentForReceipt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2">
                <span className="text-xl">⚓</span>
                <div>
                  <h3 className="font-bold text-sm text-slate-900">ACADEMIA DE ADUANAS</h3>
                  <p className="text-[10px] text-slate-500">Constancia Oficial de Matrícula</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedEnrollmentForReceipt(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Official Card Details */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3 text-xs">
              <div className="flex justify-between items-center border-b border-slate-200 pb-2">
                <span className="text-slate-500 font-semibold">Número de Matrícula:</span>
                <span className="font-mono font-bold text-amber-700 text-sm">
                  {selectedEnrollmentForReceipt.enrollmentNumber}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Estudiante:</span>
                <span className="font-bold text-slate-800">{selectedEnrollmentForReceipt.studentName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Curso:</span>
                <span className="font-semibold text-slate-800">{selectedEnrollmentForReceipt.courseName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Grupo / Horario:</span>
                <span className="text-slate-700">{selectedEnrollmentForReceipt.groupName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Fecha de Inicio:</span>
                <span className="text-slate-700">{selectedEnrollmentForReceipt.startDate}</span>
              </div>
              <div className="flex justify-between pt-2 border-t border-slate-200">
                <span className="font-bold text-slate-700">Inversión Total:</span>
                <span className="font-extrabold text-slate-900 text-sm">
                  {settings.currencySymbol} {selectedEnrollmentForReceipt.total.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Estado de Matrícula:</span>
                <span className="font-bold text-emerald-700">{selectedEnrollmentForReceipt.status}</span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => window.print()}
                className="px-4 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center gap-2 cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>Imprimir Constancia</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

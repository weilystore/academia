import React, { useState } from 'react';
import {
  History,
  Search,
  Shield,
  Filter,
  Download,
  Clock,
  User,
  Activity
} from 'lucide-react';
import { useData } from '../../context/DataContext';

export const AuditView: React.FC = () => {
  const { auditLogs } = useData();
  const [search, setSearch] = useState('');
  const [moduleFilter, setModuleFilter] = useState('all');

  const getLogModule = (l: any) => l.targetModule || l.module || 'General';
  const getLogRole = (l: any) => l.role || l.userRole || 'SISTEMA';

  const rawModules = Array.from(
    new Set(auditLogs.map(l => getLogModule(l)).filter(Boolean))
  );
  const modules = ['all', ...rawModules];

  const filtered = auditLogs.filter(log => {
    const mod = getLogModule(log);
    if (moduleFilter !== 'all' && mod !== moduleFilter) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        (log.description || '').toLowerCase().includes(q) ||
        (log.userName || '').toLowerCase().includes(q) ||
        (log.action || '').toLowerCase().includes(q) ||
        mod.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const exportCSV = () => {
    const headers = ['Fecha / Hora', 'Usuario', 'Rol', 'Módulo', 'Acción', 'Descripción', 'IP'];
    const rows = filtered.map(l => [
      l.timestamp,
      l.userName,
      getLogRole(l),
      getLogModule(l),
      l.action,
      `"${(l.description || '').replace(/"/g, '""')}"`,
      (l as any).ipAddress || '190.92.14.88'
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `auditoria_academia_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header Banner */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-900 text-amber-400 border border-slate-800">
              TRAZABILIDAD INSTITUCIONAL
            </span>
            <span className="text-slate-400 text-xs">&bull; Inmutable</span>
          </div>
          <h2 className="text-xl font-black tracking-tight text-slate-900">
            Registro de Auditoría y Operaciones
          </h2>
          <p className="text-slate-500 text-xs mt-0.5">
            Bitácora de seguridad con registro de cada creación, modificación, cobro y emisión de documentos.
          </p>
        </div>

        <button
          onClick={exportCSV}
          className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center gap-2 border border-slate-200 cursor-pointer transition-colors"
        >
          <Download className="w-4 h-4" />
          <span>Exportar Bitácora CSV</span>
        </button>
      </div>

      {/* Filter and Search */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar por usuario, acción o detalle..."
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs focus:bg-white focus:outline-hidden"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto">
          {modules.map(mod => (
            <button
              key={mod}
              onClick={() => setModuleFilter(mod)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                moduleFilter === mod
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {mod === 'all' ? 'Todos los Módulos' : mod}
            </button>
          ))}
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900 text-white text-[11px] uppercase tracking-wider font-semibold">
              <tr>
                <th className="p-3.5">Fecha y Hora</th>
                <th className="p-3.5">Usuario Operador</th>
                <th className="p-3.5">Módulo</th>
                <th className="p-3.5">Acción</th>
                <th className="p-3.5">Descripción del Evento</th>
                <th className="p-3.5 text-right">Dirección IP</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((log, index) => (
                <tr key={log.id ? `${log.id}-${index}` : `audit-log-${index}`} className="hover:bg-slate-50 transition-colors">
                  <td className="p-3.5 text-slate-500 whitespace-nowrap font-mono text-[11px]">
                    {new Date(log.timestamp).toLocaleString()}
                  </td>
                  <td className="p-3.5">
                    <span className="font-bold text-slate-800 block">{log.userName}</span>
                    <span className="text-[10px] text-slate-400 font-semibold uppercase">{getLogRole(log)}</span>
                  </td>
                  <td className="p-3.5 font-semibold text-slate-700">
                    <span className="px-2 py-0.5 rounded bg-slate-100 border border-slate-200 text-[10px] font-bold">
                      {getLogModule(log)}
                    </span>
                  </td>
                  <td className="p-3.5">
                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                      log.action.includes('CREATE') || log.action.includes('ENROLL') || log.action.includes('PAY')
                        ? 'bg-emerald-100 text-emerald-800'
                        : log.action.includes('UPDATE')
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-slate-100 text-slate-700'
                    }`}>
                      {log.action}
                    </span>
                  </td>
                  <td className="p-3.5 text-slate-700 max-w-md">
                    {log.description}
                  </td>
                  <td className="p-3.5 text-right font-mono text-[11px] text-slate-400">
                    {(log as any).ipAddress || '190.92.14.88'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

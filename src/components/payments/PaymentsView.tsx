import React, { useState } from 'react';
import {
  CreditCard,
  Plus,
  Search,
  Download,
  Printer,
  X,
  FileText,
  DollarSign,
  TrendingUp,
  Calendar,
  CheckCircle
} from 'lucide-react';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { Payment } from '../../types';
import { PaymentFormModal } from './PaymentFormModal';

export const PaymentsView: React.FC = () => {
  const { payments, settings } = useData();
  const { hasPermission } = useAuth();

  const [search, setSearch] = useState('');
  const [methodFilter, setMethodFilter] = useState('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedReceipt, setSelectedReceipt] = useState<Payment | null>(null);

  // Financial calculations
  const totalRevenue = payments.reduce((sum, p) => sum + (p.total || 0), 0);
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  const monthRevenue = payments
    .filter(p => {
      const d = new Date(p.date || p.createdAt);
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    })
    .reduce((sum, p) => sum + (p.total || 0), 0);

  const filtered = payments.filter(p => {
    if (methodFilter !== 'all' && p.method !== methodFilter) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        p.receiptNumber.toLowerCase().includes(q) ||
        p.studentName.toLowerCase().includes(q) ||
        p.concept.toLowerCase().includes(q) ||
        (p.notes && p.notes.toLowerCase().includes(q))
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
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
              GESTIÓN DE CAJA Y ARANCELES
            </span>
            <span className="text-slate-400 text-xs">&bull; Recibos REC-2026</span>
          </div>
          <h2 className="text-xl font-black tracking-tight text-slate-900">
            Control Financiero y Pagos
          </h2>
          <p className="text-slate-500 text-xs mt-0.5">
            Emisión de recibos de cobro por concepto de matrículas, mensualidades y derechos aduaneros.
          </p>
        </div>

        {hasPermission('payments', 'write') && (
          <button
            onClick={() => setIsModalOpen(true)}
            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-2 shadow-md shadow-emerald-600/20 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Registrar Cobro</span>
          </button>
        )}
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-1 text-slate-500 text-xs font-semibold uppercase">
            <span>Total Recaudado</span>
            <DollarSign className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-extrabold text-slate-900">
            {settings.currencySymbol} {totalRevenue.toLocaleString()}
          </p>
          <p className="text-[11px] text-slate-400 mt-1">{payments.length} transacciones registradas</p>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-1 text-slate-500 text-xs font-semibold uppercase">
            <span>Cobranza del Mes</span>
            <TrendingUp className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-2xl font-extrabold text-emerald-700">
            {settings.currencySymbol} {monthRevenue.toLocaleString()}
          </p>
          <p className="text-[11px] text-emerald-600 mt-1">Marzo 2026 en curso</p>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-1 text-slate-500 text-xs font-semibold uppercase">
            <span>Promedio por Recibo</span>
            <CreditCard className="w-4 h-4 text-blue-600" />
          </div>
          <p className="text-2xl font-extrabold text-slate-900">
            {settings.currencySymbol} {Math.round(totalRevenue / (payments.length || 1)).toLocaleString()}
          </p>
          <p className="text-[11px] text-slate-400 mt-1">Ticket promedio institucional</p>
        </div>
      </div>

      {/* Filter and Search */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar por recibo, estudiante o concepto..."
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-amber-500"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto">
          {['all', 'Transferencia Bancaria', 'Efectivo', 'Tarjeta de Crédito / Débito', 'Depósito Bancario'].map(m => (
            <button
              key={m}
              onClick={() => setMethodFilter(m)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                methodFilter === m
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {m === 'all' ? 'Todos los Métodos' : m}
            </button>
          ))}
        </div>
      </div>

      {/* Payments Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        {filtered.length === 0 ? (
          <div className="py-12 text-center text-slate-500">
            <CreditCard className="w-10 h-10 mx-auto text-slate-300 mb-2" />
            <p className="font-bold text-slate-800 text-sm">No se encontraron pagos</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900 text-white text-[11px] uppercase tracking-wider font-semibold">
                <tr>
                  <th className="p-3.5">Recibo No.</th>
                  <th className="p-3.5">Estudiante</th>
                  <th className="p-3.5">Concepto</th>
                  <th className="p-3.5">Fecha</th>
                  <th className="p-3.5">Método de Pago</th>
                  <th className="p-3.5">Monto Cobrado</th>
                  <th className="p-3.5">Estado</th>
                  <th className="p-3.5 text-right">Recibo Oficial</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map(pay => (
                  <tr key={pay.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-3.5 font-mono font-bold text-blue-700">
                      {pay.receiptNumber}
                    </td>
                    <td className="p-3.5 font-semibold text-slate-900">
                      {pay.studentName}
                    </td>
                    <td className="p-3.5 text-slate-800">
                      {pay.concept}
                    </td>
                    <td className="p-3.5 text-slate-500">
                      {pay.date}
                    </td>
                    <td className="p-3.5 text-slate-600">
                      {pay.method}
                    </td>
                    <td className="p-3.5 font-extrabold text-emerald-700 text-sm">
                      {settings.currencySymbol} {pay.total.toLocaleString()}
                    </td>
                    <td className="p-3.5">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                        {pay.status}
                      </span>
                    </td>
                    <td className="p-3.5 text-right">
                      <button
                        onClick={() => setSelectedReceipt(pay)}
                        className="px-2.5 py-1 rounded-lg border border-slate-200 hover:bg-emerald-50 hover:border-emerald-300 text-emerald-800 text-[11px] font-medium inline-flex items-center gap-1 cursor-pointer"
                      >
                        <Printer className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Ver Recibo</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Payment Form Modal */}
      <PaymentFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />

      {/* Official Receipt Sheet Modal */}
      {selectedReceipt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2">
                <span className="text-xl">⚓</span>
                <div>
                  <h3 className="font-black text-sm text-slate-900 uppercase">ACADEMIA DE ADUANAS</h3>
                  <p className="text-[10px] text-slate-500">{settings.legalName}</p>
                </div>
              </div>
              <button onClick={() => setSelectedReceipt(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3 text-xs">
              <div className="flex justify-between items-center border-b border-slate-200 pb-2">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold">Comprobante de Caja</span>
                  <p className="font-mono font-black text-blue-800 text-base">{selectedReceipt.receiptNumber}</p>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-400 uppercase font-bold">Fecha de Emisión</span>
                  <p className="font-semibold text-slate-700">{selectedReceipt.date}</p>
                </div>
              </div>

              <div className="flex justify-between">
                <span className="text-slate-500">Recibido de:</span>
                <span className="font-bold text-slate-900">{selectedReceipt.studentName}</span>
              </div>

              <div className="flex justify-between">
                <span className="text-slate-500">Por Concepto de:</span>
                <span className="font-semibold text-slate-800">{selectedReceipt.concept}</span>
              </div>

              <div className="flex justify-between">
                <span className="text-slate-500">Forma de Pago:</span>
                <span className="text-slate-700">{selectedReceipt.method}</span>
              </div>

              {selectedReceipt.notes && (
                <div className="flex justify-between text-[11px]">
                  <span className="text-slate-500">Referencia:</span>
                  <span className="text-slate-600 italic">{selectedReceipt.notes}</span>
                </div>
              )}

              <div className="flex justify-between pt-3 border-t-2 border-dashed border-slate-300 items-baseline">
                <span className="font-bold text-slate-800 text-sm">TOTAL CANCELADO:</span>
                <span className="font-black text-emerald-700 text-xl">
                  {settings.currencySymbol} {selectedReceipt.total.toLocaleString()}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => window.print()}
                className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-2 cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>Imprimir Recibo Oficial</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

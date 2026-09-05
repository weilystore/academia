import React, { useState, useEffect } from 'react';
import { X, CreditCard, Save } from 'lucide-react';
import { useData } from '../../context/DataContext';
import { Student } from '../../types';

interface PaymentFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  preselectedStudent?: Student | null;
}

export const PaymentFormModal: React.FC<PaymentFormModalProps> = ({
  isOpen,
  onClose,
  preselectedStudent
}) => {
  const { students, enrollments, addPayment, settings } = useData();

  const [studentId, setStudentId] = useState('');
  const [enrollmentId, setEnrollmentId] = useState('');
  const [concept, setConcept] = useState('Cuota Mensual del Curso');
  const [method, setPaymentMethod] = useState<'Efectivo' | 'Transferencia Bancaria' | 'Tarjeta de Crédito / Débito' | 'Depósito Bancario'>('Transferencia Bancaria');
  const [amount, setAmount] = useState(3250);
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (preselectedStudent) {
      setStudentId(preselectedStudent.id);
    } else if (students.length > 0 && !studentId) {
      setStudentId(students[0].id);
    }
  }, [preselectedStudent, students, isOpen]);

  // When student changes, find their active enrollments
  const studentEnrollments = enrollments.filter(e => e.studentId === studentId);
  useEffect(() => {
    if (studentEnrollments.length > 0) {
      setEnrollmentId(studentEnrollments[0].id);
    } else {
      setEnrollmentId('');
    }
  }, [studentId, enrollments]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentId || amount <= 0) return;

    const student = students.find(s => s.id === studentId);
    if (!student) return;

    setIsSubmitting(true);
    await addPayment({
      enrollmentId: enrollmentId || undefined,
      studentId: student.id,
      studentName: `${student.firstName} ${student.lastName}`,
      date: new Date().toISOString().slice(0, 10),
      concept,
      method,
      subtotal: amount,
      tax: 0,
      total: amount,
      status: 'Pagado',
      notes
    });

    setIsSubmitting(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95">
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-emerald-400" />
            <div>
              <h3 className="font-bold text-sm text-white">Registrar Cobro / Recibo Oficial</h3>
              <p className="text-[11px] text-emerald-300">Emisión de recibo correlativo REC-2026-XXXXX</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Estudiante *</label>
            <select
              value={studentId}
              onChange={e => setStudentId(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white"
              required
            >
              {students.map(s => (
                <option key={s.id} value={s.id}>
                  {s.firstName} {s.lastName} &bull; DNI: {s.identityNumber}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Matrícula Asociada (Opcional)</label>
            <select
              value={enrollmentId}
              onChange={e => setEnrollmentId(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white"
            >
              <option value="">Cobro General / Sin matrícula específica</option>
              {studentEnrollments.map(enr => (
                <option key={enr.id} value={enr.id}>
                  {enr.enrollmentNumber} - {enr.courseName} (L {enr.total.toLocaleString()})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Concepto *</label>
              <select
                value={concept}
                onChange={e => setConcept(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white"
              >
                <option value="Matrícula y 1ra Cuota">Matrícula y 1ra Cuota</option>
                <option value="Cuota Mensual del Curso">Cuota Mensual del Curso</option>
                <option value="Pago Total de Curso">Pago Total de Curso</option>
                <option value="Derecho a Certificación Aduanera">Derecho a Certificación Aduanera</option>
                <option value="Examen Extraordinario / Suficiencia">Examen Extraordinario</option>
                <option value="Emisión de Título y Diploma">Emisión de Título y Diploma</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Forma de Pago *</label>
              <select
                value={method}
                onChange={e => setPaymentMethod(e.target.value as any)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white"
              >
                <option value="Transferencia Bancaria">Transferencia Bancaria</option>
                <option value="Efectivo">Efectivo en Caja</option>
                <option value="Tarjeta de Crédito / Débito">Tarjeta de Crédito / Débito</option>
                <option value="Depósito Bancario">Depósito Bancario</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Monto Pagado ({settings.currencySymbol}) *</label>
            <input
              type="number"
              required
              min={1}
              value={amount}
              onChange={e => setAmount(Number(e.target.value))}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 font-extrabold text-base text-emerald-700"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Número de Referencia / Notas</label>
            <input
              type="text"
              placeholder="ej: Transf. BAC #88992211 o Caja Chica"
              value={notes}
              onChange={e => setNotes(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-300"
            />
          </div>

          <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-slate-300 hover:bg-slate-100 font-medium"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold flex items-center gap-1.5 cursor-pointer shadow-sm"
            >
              <Save className="w-4 h-4" />
              <span>{isSubmitting ? 'Guardando...' : 'Generar Recibo de Caja'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

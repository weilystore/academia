import React, { useState, useEffect } from 'react';
import {
  X,
  GraduationCap,
  Save,
  CheckCircle,
  CreditCard,
  AlertCircle
} from 'lucide-react';
import { useData } from '../../context/DataContext';
import { Student } from '../../types';

interface EnrollmentFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  preselectedStudent?: Student | null;
}

export const EnrollmentFormModal: React.FC<EnrollmentFormModalProps> = ({
  isOpen,
  onClose,
  preselectedStudent
}) => {
  const { students, courses, groups, createEnrollment, addPayment, settings } = useData();

  const [studentId, setStudentId] = useState('');
  const [courseId, setCourseId] = useState('');
  const [groupId, setGroupId] = useState('');
  const [discount, setDiscount] = useState(0);
  const [notes, setNotes] = useState('');

  // Initial Payment Option
  const [registerInitialPayment, setRegisterInitialPayment] = useState(true);
  const [initialPaymentAmount, setInitialPaymentAmount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState<'Efectivo' | 'Transferencia Bancaria' | 'Tarjeta de Crédito / Débito' | 'Depósito Bancario'>('Transferencia Bancaria');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (preselectedStudent) {
      setStudentId(preselectedStudent.id);
    } else if (students.length > 0 && !studentId) {
      setStudentId(students[0].id);
    }
  }, [preselectedStudent, students, isOpen]);

  useEffect(() => {
    if (courses.length > 0 && !courseId) {
      setCourseId(courses[0].id);
    }
  }, [courses, isOpen]);

  // Update groups when course changes
  const courseGroups = groups.filter(g => g.courseId === courseId);
  useEffect(() => {
    if (courseGroups.length > 0) {
      setGroupId(courseGroups[0].id);
    } else {
      setGroupId('');
    }
  }, [courseId, groups]);

  // Selected entities & math
  const selectedCourse = courses.find(c => c.id === courseId);
  const selectedGroup = groups.find(g => g.id === groupId);
  const basePrice = selectedCourse?.price || 0;
  const finalPrice = Math.max(0, basePrice - discount);

  useEffect(() => {
    // Set default initial payment to 50% or full
    setInitialPaymentAmount(Math.round(finalPrice / 2));
  }, [finalPrice]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentId || !courseId) return;

    const student = students.find(s => s.id === studentId);
    if (!student || !selectedCourse) return;

    setIsSubmitting(true);
    try {
      const newEnrollment = await createEnrollment({
        studentId: student.id,
        studentName: `${student.firstName} ${student.lastName}`,
        courseId: selectedCourse.id,
        courseName: selectedCourse.name,
        groupId: selectedGroup?.id || 'grp-general',
        groupName: selectedGroup?.name || 'Grupo General',
        startDate: selectedGroup?.startDate || new Date().toISOString().slice(0, 10),
        status: 'Activa',
        subtotal: basePrice,
        discount: discount,
        total: finalPrice,
        notes: notes || 'Matrícula formalizada en oficina'
      });

      // Optionally register initial receipt
      if (registerInitialPayment && initialPaymentAmount > 0) {
        await addPayment({
          enrollmentId: newEnrollment.id,
          studentId: student.id,
          studentName: `${student.firstName} ${student.lastName}`,
          date: new Date().toISOString().slice(0, 10),
          concept: `Matrícula y 1ra Cuota - ${selectedCourse.name}`,
          method: paymentMethod,
          total: initialPaymentAmount,
          subtotal: initialPaymentAmount,
          tax: 0,
          status: 'Pagado',
          notes: `Pago inicial registrado en formalización de matrícula ${newEnrollment.enrollmentNumber}`
        });
      }

      setIsSubmitting(false);
      onClose();
    } catch (err) {
      console.error(err);
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-8 animate-in fade-in zoom-in-95">
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <GraduationCap className="w-5 h-5 text-amber-400" />
            <div>
              <h3 className="font-bold text-base text-white">Formalizar Nueva Matrícula</h3>
              <p className="text-[11px] text-amber-300">Emisión de código oficial MAT-2026-XXXXX</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto text-xs">
          {/* Step 1: Select Student */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Seleccionar Estudiante *</label>
            <select
              value={studentId}
              onChange={e => setStudentId(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white font-medium"
              required
            >
              {students.map(st => (
                <option key={st.id} value={st.id}>
                  {st.firstName} {st.lastName} &bull; DNI: {st.identityNumber} ({st.status})
                </option>
              ))}
            </select>
          </div>

          {/* Step 2: Select Course & Group */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Curso / Programa Aduanero *</label>
              <select
                value={courseId}
                onChange={e => setCourseId(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white font-medium"
                required
              >
                {courses.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.code} - {c.name} (L {c.price.toLocaleString()})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Grupo y Horario *</label>
              <select
                value={groupId}
                onChange={e => setGroupId(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white font-medium"
                required
              >
                {courseGroups.length === 0 ? (
                  <option value="">Sin grupos específicos (Asignación General)</option>
                ) : (
                  courseGroups.map(g => (
                    <option key={g.id} value={g.id}>
                      {g.name} - {g.schedule} ({g.enrolledCount}/{g.maxCapacity})
                    </option>
                  ))
                )}
              </select>
            </div>
          </div>

          {/* Financial summary of enrollment */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 grid grid-cols-3 gap-3 text-center">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-500">Costo Base</span>
              <p className="font-extrabold text-slate-800 text-sm">
                {settings.currencySymbol} {basePrice.toLocaleString()}
              </p>
            </div>
            <div>
              <label className="text-[10px] uppercase font-bold text-slate-500 block">Descuento ({settings.currencySymbol})</label>
              <input
                type="number"
                min={0}
                max={basePrice}
                value={discount}
                onChange={e => setDiscount(Number(e.target.value))}
                className="w-24 px-2 py-0.5 rounded border border-slate-300 text-center font-bold text-xs"
              />
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-500">Total a Pagar</span>
              <p className="font-extrabold text-amber-700 text-sm">
                {settings.currencySymbol} {finalPrice.toLocaleString()}
              </p>
            </div>
          </div>

          {/* Step 3: Optional Immediate Payment */}
          <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/50 space-y-3">
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer font-bold text-emerald-900 text-xs">
                <input
                  type="checkbox"
                  checked={registerInitialPayment}
                  onChange={e => setRegisterInitialPayment(e.target.checked)}
                  className="rounded border-emerald-400 text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                />
                <span>Registrar Pago Inicial / Cuota 1 en este momento</span>
              </label>
              <CreditCard className="w-4 h-4 text-emerald-600" />
            </div>

            {registerInitialPayment && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-emerald-200/60">
                <div>
                  <label className="block font-semibold text-emerald-900 mb-1">Monto a Cobrar ({settings.currencySymbol}) *</label>
                  <input
                    type="number"
                    required
                    min={1}
                    max={finalPrice}
                    value={initialPaymentAmount}
                    onChange={e => setInitialPaymentAmount(Number(e.target.value))}
                    className="w-full px-3 py-1.5 rounded-lg border border-emerald-300 bg-white font-bold text-emerald-900"
                  />
                  <span className="text-[10px] text-emerald-700 mt-0.5 block">
                    Saldo restante posterior: {settings.currencySymbol} {(finalPrice - initialPaymentAmount).toLocaleString()}
                  </span>
                </div>

                <div>
                  <label className="block font-semibold text-emerald-900 mb-1">Forma de Pago *</label>
                  <select
                    value={paymentMethod}
                    onChange={e => setPaymentMethod(e.target.value as any)}
                    className="w-full px-3 py-1.5 rounded-lg border border-emerald-300 bg-white"
                  >
                    <option value="Transferencia Bancaria">Transferencia Bancaria</option>
                    <option value="Efectivo">Efectivo (Caja)</option>
                    <option value="Tarjeta de Crédito / Débito">Tarjeta de Crédito / Débito</option>
                    <option value="Depósito Bancario">Depósito Bancario</option>
                  </select>
                </div>
              </div>
            )}
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Notas / Condiciones Especiales</label>
            <textarea
              rows={2}
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Indicar si tiene beca institucional, convenio de empresa o plan diferido..."
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
              className="px-5 py-2 rounded-lg bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold flex items-center gap-1.5 cursor-pointer shadow-sm"
            >
              <Save className="w-4 h-4" />
              <span>{isSubmitting ? 'Procesando...' : 'Formalizar y Emitir Matrícula'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

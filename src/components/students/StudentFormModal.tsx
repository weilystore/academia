import React, { useState, useEffect } from 'react';
import {
  X,
  AlertTriangle,
  UserCheck,
  CheckCircle,
  Save,
  ArrowRight
} from 'lucide-react';
import { useData } from '../../context/DataContext';
import { Student, StudentStatus } from '../../types';

interface StudentFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  studentToEdit?: Student | null;
  onOpenExistingProfile?: (student: Student) => void;
}

export const StudentFormModal: React.FC<StudentFormModalProps> = ({
  isOpen,
  onClose,
  studentToEdit,
  onOpenExistingProfile
}) => {
  const { addStudent, updateStudent, findDuplicateStudent } = useData();

  const [formData, setFormData] = useState({
    identityNumber: '',
    firstName: '',
    lastName: '',
    birthDate: '',
    gender: 'Masculino' as 'Masculino' | 'Femenino' | 'Otro',
    nationality: 'Hondureña',
    maritalStatus: 'Soltero(a)' as 'Soltero(a)' | 'Casado(a)' | 'Divorciado(a)' | 'Viudo(a)' | 'Unión Libre',
    profession: '',
    address: '',
    city: 'Tegucigalpa',
    department: 'Francisco Morazán',
    email: '',
    phone: '',
    whatsapp: '',
    emergencyContact: '',
    emergencyPhone: '',
    photoUrl: '',
    observations: '',
    status: 'Activo' as StudentStatus,
    currentCourse: ''
  });

  const [duplicateFound, setDuplicateFound] = useState<Student | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (studentToEdit) {
      setFormData({
        identityNumber: studentToEdit.identityNumber || '',
        firstName: studentToEdit.firstName || '',
        lastName: studentToEdit.lastName || '',
        birthDate: studentToEdit.birthDate || '',
        gender: studentToEdit.gender || 'Masculino',
        nationality: studentToEdit.nationality || 'Hondureña',
        maritalStatus: studentToEdit.maritalStatus || 'Soltero(a)',
        profession: studentToEdit.profession || '',
        address: studentToEdit.address || '',
        city: studentToEdit.city || 'Tegucigalpa',
        department: studentToEdit.department || 'Francisco Morazán',
        email: studentToEdit.email || '',
        phone: studentToEdit.phone || '',
        whatsapp: studentToEdit.whatsapp || '',
        emergencyContact: studentToEdit.emergencyContact || '',
        emergencyPhone: studentToEdit.emergencyPhone || '',
        photoUrl: studentToEdit.photoUrl || '',
        observations: studentToEdit.observations || '',
        status: studentToEdit.status || 'Activo',
        currentCourse: studentToEdit.currentCourse || ''
      });
    } else {
      setFormData({
        identityNumber: '',
        firstName: '',
        lastName: '',
        birthDate: '1995-01-01',
        gender: 'Masculino',
        nationality: 'Hondureña',
        maritalStatus: 'Soltero(a)',
        profession: '',
        address: '',
        city: 'Tegucigalpa',
        department: 'Francisco Morazán',
        email: '',
        phone: '+504 ',
        whatsapp: '+504 ',
        emergencyContact: '',
        emergencyPhone: '+504 ',
        photoUrl: '',
        observations: '',
        status: 'Activo',
        currentCourse: ''
      });
    }
    setDuplicateFound(null);
    setErrorMsg('');
  }, [studentToEdit, isOpen]);

  // Live duplicate checking on blur or change of identity/phone/whatsapp/email
  const checkDuplicates = () => {
    if (studentToEdit) return; // Skip if editing existing
    const match = findDuplicateStudent({
      identityNumber: formData.identityNumber,
      email: formData.email,
      phone: formData.phone,
      whatsapp: formData.whatsapp
    });
    setDuplicateFound(match);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!formData.identityNumber.trim()) {
      setErrorMsg('El número de identidad (DNI) es obligatorio.');
      return;
    }
    if (!formData.firstName.trim() || !formData.lastName.trim()) {
      setErrorMsg('Nombres y apellidos son requeridos.');
      return;
    }

    // Check duplicate strictly before creating
    if (!studentToEdit) {
      const match = findDuplicateStudent({
        identityNumber: formData.identityNumber,
        email: formData.email,
        phone: formData.phone,
        whatsapp: formData.whatsapp
      });

      if (match) {
        setDuplicateFound(match);
        setErrorMsg('Posible estudiante duplicado encontrado. Verifique la coincidencia a continuación.');
        return;
      }
    }

    setIsSubmitting(true);
    try {
      if (studentToEdit) {
        await updateStudent(studentToEdit.id, formData);
      } else {
        await addStudent(formData);
      }
      setIsSubmitting(false);
      onClose();
    } catch (err: any) {
      setErrorMsg('Error al guardar el estudiante: ' + err.message);
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="w-full max-w-3xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div>
            <h3 className="font-bold text-base text-white">
              {studentToEdit ? 'Editar Datos del Estudiante' : 'Registrar Nuevo Estudiante'}
            </h3>
            <p className="text-xs text-amber-400 font-medium mt-0.5">
              Academia de Aduanas &bull; Ficha de Admisión
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Possible Duplicate Alert Banner */}
        {duplicateFound && (
          <div className="mx-6 mt-4 p-4 rounded-xl bg-amber-50 border-2 border-amber-400 text-amber-900 animate-in fade-in duration-200">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-bold text-sm text-amber-900">
                  ¡Posible estudiante duplicado!
                </p>
                <p className="text-xs text-amber-800 mt-0.5">
                  Ya existe un registro con coincidencia de identidad, teléfono o correo electrónico.
                </p>

                {/* Match Details Card */}
                <div className="mt-3 p-3 bg-white rounded-lg border border-amber-200 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <img
                      src={duplicateFound.photoUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=80'}
                      alt=""
                      className="w-10 h-10 rounded-full object-cover border border-amber-300"
                    />
                    <div>
                      <p className="font-bold text-slate-900 text-xs">
                        {duplicateFound.firstName} {duplicateFound.lastName}
                      </p>
                      <p className="text-[11px] text-slate-600">
                        Identidad: <span className="font-mono">{duplicateFound.identityNumber}</span> &bull; Estado: <span className="font-semibold">{duplicateFound.status}</span>
                      </p>
                      <p className="text-[11px] text-slate-500">
                        Tel: {duplicateFound.phone} &bull; Email: {duplicateFound.email}
                      </p>
                    </div>
                  </div>

                  {onOpenExistingProfile && (
                    <button
                      type="button"
                      onClick={() => {
                        onOpenExistingProfile(duplicateFound);
                        onClose();
                      }}
                      className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition-colors"
                    >
                      <span>Abrir Perfil</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Error Message */}
        {errorMsg && !duplicateFound && (
          <div className="mx-6 mt-4 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs">
            {errorMsg}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[75vh] overflow-y-auto text-xs">
          {/* Section 1: Identificación y Nombres */}
          <div>
            <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider mb-3 text-amber-600">
              1. Datos de Identidad y Personales
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Número de Identidad (DNI/Cédula) *
                </label>
                <input
                  type="text"
                  required
                  id="input-identity-number"
                  placeholder="ej: 0801-1995-12345"
                  value={formData.identityNumber}
                  onChange={(e) => setFormData({ ...formData, identityNumber: e.target.value })}
                  onBlur={checkDuplicates}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Nombres *</label>
                <input
                  type="text"
                  required
                  id="input-first-name"
                  placeholder="ej: Carlos Alberto"
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Apellidos *</label>
                <input
                  type="text"
                  required
                  id="input-last-name"
                  placeholder="ej: Gómez Rodríguez"
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Fecha de Nacimiento</label>
                <input
                  type="date"
                  value={formData.birthDate}
                  onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Género</label>
                <select
                  value={formData.gender}
                  onChange={(e) => setFormData({ ...formData, gender: e.target.value as any })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 bg-white"
                >
                  <option value="Masculino">Masculino</option>
                  <option value="Femenino">Femenino</option>
                  <option value="Otro">Otro</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Estado Civil</label>
                <select
                  value={formData.maritalStatus}
                  onChange={(e) => setFormData({ ...formData, maritalStatus: e.target.value as any })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 bg-white"
                >
                  <option value="Soltero(a)">Soltero(a)</option>
                  <option value="Casado(a)">Casado(a)</option>
                  <option value="Divorciado(a)">Divorciado(a)</option>
                  <option value="Viudo(a)">Viudo(a)</option>
                  <option value="Unión Libre">Unión Libre</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Nacionalidad</label>
                <input
                  type="text"
                  value={formData.nationality}
                  onChange={(e) => setFormData({ ...formData, nationality: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block font-semibold text-slate-700 mb-1">Profesión u Oficio</label>
                <input
                  type="text"
                  placeholder="ej: Licenciado en Comercio Internacional / Agente Aduanero"
                  value={formData.profession}
                  onChange={(e) => setFormData({ ...formData, profession: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Contacto y Ubicación */}
          <div>
            <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider mb-3 text-amber-600">
              2. Datos de Contacto y Ubicación
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Correo Electrónico *</label>
                <input
                  type="email"
                  required
                  placeholder="estudiante@correo.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  onBlur={checkDuplicates}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Teléfono Principal *</label>
                <input
                  type="text"
                  required
                  placeholder="+504 9988-7711"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  onBlur={checkDuplicates}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Número de WhatsApp *</label>
                <input
                  type="text"
                  required
                  placeholder="+504 9988-7711"
                  value={formData.whatsapp}
                  onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
                  onBlur={checkDuplicates}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                />
              </div>

              <div className="sm:col-span-3">
                <label className="block font-semibold text-slate-700 mb-1">Dirección Residencial</label>
                <input
                  type="text"
                  placeholder="Colonia, Calle, Número de Casa o Referencia"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Ciudad</label>
                <input
                  type="text"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Departamento</label>
                <input
                  type="text"
                  value={formData.department}
                  onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Estado en la Academia</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as StudentStatus })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 bg-white font-semibold"
                >
                  <option value="Prospecto">Prospecto</option>
                  <option value="Preinscrito">Preinscrito</option>
                  <option value="Activo">Activo</option>
                  <option value="Inactivo">Inactivo</option>
                  <option value="Graduado">Graduado</option>
                  <option value="Retirado">Retirado</option>
                </select>
              </div>
            </div>
          </div>

          {/* Section 3: Contacto de Emergencia & Observaciones */}
          <div>
            <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider mb-3 text-amber-600">
              3. Contacto de Emergencia y Fotografía
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Nombre de Contacto de Emergencia</label>
                <input
                  type="text"
                  placeholder="ej: María López (Madre)"
                  value={formData.emergencyContact}
                  onChange={(e) => setFormData({ ...formData, emergencyContact: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Teléfono de Emergencia</label>
                <input
                  type="text"
                  placeholder="+504 9911-2233"
                  value={formData.emergencyPhone}
                  onChange={(e) => setFormData({ ...formData, emergencyPhone: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block font-semibold text-slate-700 mb-1">URL de Fotografía de Perfil (Opcional)</label>
                <input
                  type="url"
                  placeholder="https://images.unsplash.com/..."
                  value={formData.photoUrl}
                  onChange={(e) => setFormData({ ...formData, photoUrl: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block font-semibold text-slate-700 mb-1">Observaciones / Notas de Admisión</label>
                <textarea
                  rows={2}
                  placeholder="Comentarios adicionales sobre experiencia aduanera, disponibilidad o requerimientos..."
                  value={formData.observations}
                  onChange={(e) => setFormData({ ...formData, observations: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                />
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-slate-300 hover:bg-slate-100 font-medium text-slate-700 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              id="btn-submit-student"
              className="px-5 py-2 rounded-lg bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold flex items-center gap-2 shadow-sm transition-colors cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>{isSubmitting ? 'Guardando...' : studentToEdit ? 'Actualizar Estudiante' : 'Guardar Estudiante'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

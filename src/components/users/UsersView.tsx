import React, { useState } from 'react';
import {
  ShieldCheck,
  UserPlus,
  UserCheck,
  Mail,
  Shield,
  Key,
  CheckCircle2,
  X,
  Phone,
  Power,
  UserX,
  AlertCircle
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { UserRole, UserProfile } from '../../types';

export const UsersView: React.FC = () => {
  const {
    systemUsers,
    currentUser,
    createSystemUser,
    toggleUserStatus,
    hasPermission
  } = useAuth();

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    displayName: '',
    email: '',
    role: 'ADMINISTRADOR' as UserRole,
    phone: '',
    password: ''
  });
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const canManage = currentUser?.role === 'SUPERADMIN' || currentUser?.role === 'ADMINISTRADOR';

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.displayName.trim() || !formData.email.trim()) {
      setError('Nombre y correo son campos obligatorios.');
      return;
    }

    // Check duplicate
    if (systemUsers.some(u => u.email.toLowerCase() === formData.email.trim().toLowerCase())) {
      setError('Ya existe un usuario con este correo electrónico.');
      return;
    }

    try {
      await createSystemUser({
        displayName: formData.displayName.trim(),
        email: formData.email.trim().toLowerCase(),
        role: formData.role,
        phone: formData.phone.trim() || '+504 9900-0000',
        active: true
      });

      setSuccessMsg(`Usuario ${formData.displayName} creado exitosamente.`);
      setIsAddModalOpen(false);
      setFormData({
        displayName: '',
        email: '',
        role: 'ADMINISTRADOR',
        phone: '',
        password: ''
      });
      setError(null);
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      setError(err.message || 'Error al registrar el usuario.');
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header Banner */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-900 border border-blue-200">
              SEGURIDAD &amp; RBAC
            </span>
            <span className="text-slate-400 text-xs">&bull; Gestión Institucional de Personal</span>
          </div>
          <h2 className="text-xl font-black tracking-tight text-slate-900">
            Control de Usuarios y Accesos
          </h2>
          <p className="text-slate-500 text-xs mt-0.5">
            Administración de cuentas con control de acceso basado en roles: Superadmin, Administrador, Recepción y Docente.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {canManage && (
            <button
              onClick={() => {
                setError(null);
                setIsAddModalOpen(true);
              }}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-2 shadow-xs transition-colors cursor-pointer"
            >
              <UserPlus className="w-4 h-4" />
              <span>Nuevo Usuario Institucional</span>
            </button>
          )}
        </div>
      </div>

      {successMsg && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs flex items-center gap-2 font-medium">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Users Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {systemUsers.map(u => {
          const isMe = u.uid === currentUser?.uid || u.email.toLowerCase() === currentUser?.email?.toLowerCase();

          return (
            <div
              key={u.uid}
              className={`bg-white rounded-2xl border p-5 space-y-3 transition-all flex flex-col justify-between ${
                isMe ? 'border-amber-400 ring-2 ring-amber-400/20 shadow-md' : 'border-slate-200 shadow-xs hover:border-slate-300'
              }`}
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <div className="w-12 h-12 rounded-xl bg-slate-900 text-amber-400 flex items-center justify-center font-black text-sm border border-slate-800 shadow-xs">
                    {(u.displayName || u.email).charAt(0).toUpperCase()}
                  </div>
                  <span className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase tracking-wide ${
                    u.role === 'SUPERADMIN' ? 'bg-purple-100 text-purple-800 border border-purple-200' :
                    u.role === 'ADMINISTRADOR' ? 'bg-blue-100 text-blue-800 border border-blue-200' :
                    u.role === 'RECEPCIÓN' ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' :
                    'bg-amber-100 text-amber-800 border border-amber-200'
                  }`}>
                    {u.role}
                  </span>
                </div>

                <div>
                  <h4 className="font-bold text-sm text-slate-900 flex items-center gap-1.5">
                    <span className="truncate">{u.displayName || 'Usuario'}</span>
                    {isMe && (
                      <span className="shrink-0 px-1.5 py-0.5 rounded bg-amber-100 text-amber-900 text-[9px] font-extrabold">
                        Tú
                      </span>
                    )}
                  </h4>
                  <p className="text-slate-500 text-xs flex items-center gap-1.5 mt-1">
                    <Mail className="w-3 h-3 text-slate-400 shrink-0" />
                    <span className="truncate">{u.email}</span>
                  </p>
                  {u.phone && (
                    <p className="text-slate-400 text-[11px] flex items-center gap-1.5 mt-0.5">
                      <Phone className="w-3 h-3 text-slate-400 shrink-0" />
                      <span>{u.phone}</span>
                    </p>
                  )}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs mt-2">
                <span className={`inline-flex items-center gap-1 font-semibold text-[11px] ${u.active ? 'text-emerald-600' : 'text-slate-400'}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${u.active ? 'bg-emerald-500' : 'bg-slate-300'}`}></span>
                  <span>{u.active ? 'Activo' : 'Desactivado'}</span>
                </span>

                {canManage && !isMe && (
                  <button
                    onClick={() => toggleUserStatus(u.uid)}
                    className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition-colors cursor-pointer flex items-center gap-1 ${
                      u.active
                        ? 'bg-slate-100 hover:bg-rose-50 hover:text-rose-700 text-slate-600'
                        : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700'
                    }`}
                    title={u.active ? 'Desactivar acceso' : 'Habilitar acceso'}
                  >
                    <Power className="w-3 h-3" />
                    <span>{u.active ? 'Desactivar' : 'Activar'}</span>
                  </button>
                )}

                {isMe && (
                  <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 text-[10px] font-bold">
                    Sesión Actual
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Role Matrix Overview */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 space-y-4">
        <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-amber-500" />
          <span>Matriz de Permisos Institucionales (RBAC)</span>
        </h3>

        <div className="overflow-x-auto text-xs">
          <table className="w-full text-left">
            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
              <tr>
                <th className="p-2.5">Módulo</th>
                <th className="p-2.5 text-center">SUPERADMIN</th>
                <th className="p-2.5 text-center">ADMINISTRADOR</th>
                <th className="p-2.5 text-center">RECEPCIÓN</th>
                <th className="p-2.5 text-center">DOCENTE</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              <tr>
                <td className="p-2.5 font-medium">Estudiantes (Alta / Edición / Padrón)</td>
                <td className="p-2.5 text-center text-emerald-600 font-bold">Total</td>
                <td className="p-2.5 text-center text-emerald-600 font-bold">Total</td>
                <td className="p-2.5 text-center text-emerald-600 font-bold">Alta / Edición</td>
                <td className="p-2.5 text-center text-slate-400">Solo Lectura</td>
              </tr>
              <tr>
                <td className="p-2.5 font-medium">Cursos y Grupos</td>
                <td className="p-2.5 text-center text-emerald-600 font-bold">Total</td>
                <td className="p-2.5 text-center text-emerald-600 font-bold">Total</td>
                <td className="p-2.5 text-center text-slate-400">Solo Lectura</td>
                <td className="p-2.5 text-center text-slate-400">Grupos Asignados</td>
              </tr>
              <tr>
                <td className="p-2.5 font-medium">Matrículas (MAT-2026)</td>
                <td className="p-2.5 text-center text-emerald-600 font-bold">Total</td>
                <td className="p-2.5 text-center text-emerald-600 font-bold">Total</td>
                <td className="p-2.5 text-center text-emerald-600 font-bold">Emisión</td>
                <td className="p-2.5 text-center text-slate-400">Sin acceso</td>
              </tr>
              <tr>
                <td className="p-2.5 font-medium">Caja y Cobros (REC-2026)</td>
                <td className="p-2.5 text-center text-emerald-600 font-bold">Total</td>
                <td className="p-2.5 text-center text-emerald-600 font-bold">Total</td>
                <td className="p-2.5 text-center text-emerald-600 font-bold">Cobro / Recibos</td>
                <td className="p-2.5 text-center text-rose-500 font-semibold">Bloqueado</td>
              </tr>
              <tr>
                <td className="p-2.5 font-medium">Asistencia y Calificaciones</td>
                <td className="p-2.5 text-center text-emerald-600 font-bold">Total</td>
                <td className="p-2.5 text-center text-emerald-600 font-bold">Total</td>
                <td className="p-2.5 text-center text-slate-400">Consulta</td>
                <td className="p-2.5 text-center text-emerald-600 font-bold">Registro de Notas</td>
              </tr>
              <tr>
                <td className="p-2.5 font-medium">WhatsApp Cloud API &amp; Plantillas</td>
                <td className="p-2.5 text-center text-emerald-600 font-bold">Total</td>
                <td className="p-2.5 text-center text-emerald-600 font-bold">Total</td>
                <td className="p-2.5 text-center text-emerald-600 font-bold">Envío / Chat</td>
                <td className="p-2.5 text-center text-slate-400">Sin acceso</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal to Add New User */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-blue-100 text-blue-800">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">Nuevo Usuario Institucional</h3>
                  <p className="text-slate-400 text-[11px]">Asignar credenciales de acceso institucional</p>
                </div>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleCreateUser} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Nombre Completo *</label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Lic. Mario Estrada"
                  value={formData.displayName}
                  onChange={e => setFormData({ ...formData, displayName: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Correo Electrónico Institucional *</label>
                <input
                  type="email"
                  required
                  placeholder="usuario@academiadeaduanas.hn"
                  value={formData.email}
                  onChange={e => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Rol y Nivel de Acceso *</label>
                <select
                  value={formData.role}
                  onChange={e => setFormData({ ...formData, role: e.target.value as UserRole })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-slate-900 font-medium focus:outline-hidden focus:ring-2 focus:ring-blue-500 cursor-pointer"
                >
                  <option value="ADMINISTRADOR">ADMINISTRADOR (Gestión Completa)</option>
                  <option value="RECEPCIÓN">RECEPCIÓN (Atención, Matrículas y Caja)</option>
                  <option value="INSTRUCTOR">INSTRUCTOR (Asistencia y Notas)</option>
                  <option value="SUPERADMIN">SUPERADMIN (Acceso Total + Auditoría)</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Teléfono Móvil (WhatsApp)</label>
                <input
                  type="text"
                  placeholder="+504 9900-0000"
                  value={formData.phone}
                  onChange={e => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-semibold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold cursor-pointer transition-colors"
                >
                  Guardar Usuario
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

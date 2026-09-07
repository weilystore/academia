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
  AlertCircle,
  Edit2,
  Trash2,
  Lock,
  Search,
  Filter,
  Camera,
  AlertTriangle,
  Eye,
  EyeOff,
  Sparkles
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { UserRole, UserProfile } from '../../types';
import { UserProfilePhotoUpload } from './UserProfilePhotoUpload';
import { ChangePasswordModal } from './ChangePasswordModal';

export const UsersView: React.FC = () => {
  const {
    systemUsers,
    currentUser,
    createSystemUser,
    updateSystemUser,
    deleteSystemUser,
    toggleUserStatus,
    changeUserPassword
  } = useAuth();
  const { addAuditLog } = useData();

  // Strict check: Only SUPERADMIN can create, edit, change roles or delete users
  const isSuperAdmin = currentUser?.role === 'SUPERADMIN';

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRoleFilter, setSelectedRoleFilter] = useState<string>('ALL');

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [addFormData, setAddFormData] = useState({
    displayName: '',
    email: '',
    role: 'ADMINISTRADOR' as UserRole,
    phone: '',
    photoUrl: '',
    initialPassword: 'admin123'
  });
  const [showAddPassword, setShowAddPassword] = useState(false);

  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
  const [editFormData, setEditFormData] = useState({
    displayName: '',
    email: '',
    role: 'ADMINISTRADOR' as UserRole,
    phone: '',
    photoUrl: '',
    active: true
  });
  const [editChangePasswordOpen, setEditChangePasswordOpen] = useState(false);
  const [editNewPassword, setEditNewPassword] = useState('');
  const [editConfirmPassword, setEditConfirmPassword] = useState('');
  const [showEditNewPassword, setShowEditNewPassword] = useState(false);

  const [deletingUser, setDeletingUser] = useState<UserProfile | null>(null);
  const [passwordChangeUser, setPasswordChangeUser] = useState<UserProfile | null>(null);

  const [error, setError] = useState<string | null>(null);
  const [modalError, setModalError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Filtered users
  const filteredUsers = systemUsers.filter((u) => {
    const matchesSearch =
      u.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (u.phone && u.phone.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesRole = selectedRoleFilter === 'ALL' || u.role === selectedRoleFilter;

    return matchesSearch && matchesRole;
  });

  // Handle Create User
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isSuperAdmin) {
      setModalError('Acción restringida: Solo el SUPERADMIN puede registrar nuevos usuarios.');
      return;
    }

    if (!addFormData.displayName.trim() || !addFormData.email.trim()) {
      setModalError('Nombre y correo son campos obligatorios.');
      return;
    }

    // Check duplicate
    if (systemUsers.some((u) => u.email.toLowerCase() === addFormData.email.trim().toLowerCase())) {
      setModalError('Ya existe un usuario con este correo electrónico.');
      return;
    }

    try {
      const res = await createSystemUser({
        displayName: addFormData.displayName.trim(),
        email: addFormData.email.trim().toLowerCase(),
        role: addFormData.role,
        phone: addFormData.phone.trim() || '+504 9900-0000',
        photoUrl: addFormData.photoUrl.trim() || undefined,
        active: true,
        password: addFormData.initialPassword.trim() || 'admin123',
        passwordUpdatedAt: new Date().toISOString()
      });

      if (!res.success) {
        setModalError(res.error || 'Error al registrar el usuario.');
        return;
      }

      addAuditLog(
        'Creación de Usuario',
        'Usuarios',
        addFormData.email.trim(),
        `Registró a ${addFormData.displayName} con rol ${addFormData.role}`
      );

      setSuccessMsg(`Usuario ${addFormData.displayName} creado exitosamente con rol ${addFormData.role}.`);
      setIsAddModalOpen(false);
      setAddFormData({
        displayName: '',
        email: '',
        role: 'ADMINISTRADOR',
        phone: '',
        photoUrl: '',
        initialPassword: 'admin123'
      });
      setShowAddPassword(false);
      setModalError(null);
      setTimeout(() => setSuccessMsg(null), 4500);
    } catch (err: any) {
      setModalError(err.message || 'Error al registrar el usuario.');
    }
  };

  // Handle Open Edit Modal
  const handleStartEdit = (user: UserProfile) => {
    if (!isSuperAdmin) return;
    setEditingUser(user);
    setEditFormData({
      displayName: user.displayName,
      email: user.email,
      role: user.role,
      phone: user.phone || '',
      photoUrl: user.photoUrl || '',
      active: user.active
    });
    setEditChangePasswordOpen(false);
    setEditNewPassword('');
    setEditConfirmPassword('');
    setShowEditNewPassword(false);
    setModalError(null);
  };

  // Handle Save Edit
  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isSuperAdmin || !editingUser) {
      setModalError('Acción restringida: Solo el SUPERADMIN puede modificar usuarios o roles.');
      return;
    }

    if (!editFormData.displayName.trim() || !editFormData.email.trim()) {
      setModalError('Nombre y correo son obligatorios.');
      return;
    }

    // Duplicate email check (excluding current user)
    const duplicate = systemUsers.some(
      (u) => u.uid !== editingUser.uid && u.email.toLowerCase() === editFormData.email.trim().toLowerCase()
    );
    if (duplicate) {
      setModalError('Ya existe otro usuario registrado con este correo electrónico.');
      return;
    }

    if (editChangePasswordOpen && editNewPassword) {
      if (editNewPassword.length < 6) {
        setModalError('La nueva contraseña debe tener al menos 6 caracteres.');
        return;
      }
      if (editNewPassword !== editConfirmPassword) {
        setModalError('Las contraseñas no coinciden. Verifique la confirmación.');
        return;
      }
    }

    try {
      const updates: Partial<UserProfile> = {
        displayName: editFormData.displayName.trim(),
        email: editFormData.email.trim().toLowerCase(),
        role: editFormData.role,
        phone: editFormData.phone.trim(),
        photoUrl: editFormData.photoUrl.trim() || undefined,
        active: editFormData.active
      };

      if (editChangePasswordOpen && editNewPassword) {
        updates.password = editNewPassword;
        updates.passwordUpdatedAt = new Date().toISOString();
      }

      const res = await updateSystemUser(editingUser.uid, updates);

      if (!res.success) {
        setModalError(res.error || 'Error al actualizar el usuario.');
        return;
      }

      if (editChangePasswordOpen && editNewPassword) {
        await changeUserPassword(editingUser.uid, editNewPassword);
        addAuditLog(
          'Cambio de Contraseña',
          'Usuarios',
          editingUser.uid,
          `SUPERADMIN cambió la contraseña de acceso de ${editFormData.displayName}`
        );
      }

      setSuccessMsg(`Usuario "${editFormData.displayName}" actualizado correctamente${editChangePasswordOpen && editNewPassword ? ' con nueva contraseña' : ''}.`);
      setEditingUser(null);
      setModalError(null);
      setTimeout(() => setSuccessMsg(null), 4500);
    } catch (err: any) {
      setModalError(err.message || 'Error al guardar los cambios.');
    }
  };

  // Handle Open Delete Modal
  const handleStartDelete = (user: UserProfile) => {
    if (!isSuperAdmin) return;
    if (user.uid === currentUser?.uid) {
      setError('No puedes eliminar tu propia cuenta en sesión activa.');
      setTimeout(() => setError(null), 4000);
      return;
    }
    setDeletingUser(user);
    setModalError(null);
  };

  // Handle Confirm Delete
  const handleConfirmDelete = async () => {
    if (!isSuperAdmin || !deletingUser) return;

    try {
      const res = await deleteSystemUser(deletingUser.uid);
      if (!res.success) {
        setModalError(res.error || 'Error al eliminar el usuario.');
        return;
      }

      setSuccessMsg(`Usuario "${deletingUser.displayName}" eliminado exitosamente del sistema.`);
      setDeletingUser(null);
      setModalError(null);
      setTimeout(() => setSuccessMsg(null), 4500);
    } catch (err: any) {
      setModalError(err.message || 'Error al eliminar el usuario.');
    }
  };

  // Handle Toggle Active Status
  const handleToggleUser = async (user: UserProfile) => {
    if (!isSuperAdmin) return;
    if (user.uid === currentUser?.uid) {
      setError('No puedes desactivar tu propia cuenta en sesión activa.');
      setTimeout(() => setError(null), 4000);
      return;
    }

    try {
      const res = await toggleUserStatus(user.uid);
      if (!res.success) {
        setError(res.error || 'Error al cambiar estado.');
        setTimeout(() => setError(null), 4000);
        return;
      }
      setSuccessMsg(`Acceso de "${user.displayName}" ${user.active ? 'desactivado' : 'activado'}.`);
      setTimeout(() => setSuccessMsg(null), 3500);
    } catch (err: any) {
      setError(err.message || 'Error al cambiar estado.');
      setTimeout(() => setError(null), 4000);
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
            Administración de cuentas y asignación de roles. Solo el rol <strong className="text-purple-700">SUPERADMIN</strong> puede editar o eliminar usuarios y roles.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {isSuperAdmin ? (
            <button
              onClick={() => {
                setModalError(null);
                setIsAddModalOpen(true);
              }}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-2 shadow-xs transition-colors cursor-pointer"
            >
              <UserPlus className="w-4 h-4" />
              <span>Nuevo Usuario Institucional</span>
            </button>
          ) : (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 text-slate-600 text-xs font-semibold border border-slate-200">
              <Lock className="w-3.5 h-3.5 text-slate-500" />
              <span>Modo Consulta (Solo SUPERADMIN edita)</span>
            </div>
          )}
        </div>
      </div>

      {/* Security & Access State Indicator */}
      {isSuperAdmin ? (
        <div className="p-4 rounded-2xl bg-gradient-to-r from-purple-50 via-indigo-50 to-blue-50 border border-purple-200/80 text-purple-950 flex items-start gap-3 shadow-2xs">
          <div className="p-2 rounded-xl bg-purple-600 text-white shrink-0 mt-0.5 shadow-xs">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div className="text-xs flex-1">
            <h4 className="font-extrabold text-purple-900 flex items-center gap-2">
              <span>Modo SUPERADMIN Habilitado</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] bg-purple-200 text-purple-800 font-black">
                CONTROL TOTAL
              </span>
            </h4>
            <p className="text-purple-800/90 mt-0.5 leading-relaxed">
              Tienes la autorización exclusiva para <strong>crear nuevos usuarios</strong>, <strong>modificar roles</strong>, <strong>cargar o cambiar fotos de perfil</strong>, alternar accesos y <strong>eliminar cuentas</strong> del sistema.
            </p>
          </div>
        </div>
      ) : (
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-950 flex items-start gap-3 shadow-2xs">
          <div className="p-2 rounded-xl bg-amber-500 text-white shrink-0 mt-0.5 shadow-xs">
            <Lock className="w-4 h-4" />
          </div>
          <div className="text-xs flex-1">
            <h4 className="font-bold text-amber-900">Modo de Solo Lectura Institucional</h4>
            <p className="text-amber-800 mt-0.5 leading-relaxed">
              Tu rol actual es <strong>{currentUser?.role || 'USUARIO'}</strong>. Por directiva de seguridad, las opciones de <strong>creación, edición de datos/roles y eliminación de usuarios</strong> están reservadas exclusivamente al usuario con rol <strong>SUPERADMIN</strong>.
            </p>
          </div>
        </div>
      )}

      {/* Feedback Messages */}
      {successMsg && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs flex items-center gap-2 font-semibold animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {error && (
        <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2 font-semibold animate-in fade-in">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Search and Role Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por nombre, correo o teléfono..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs text-slate-800 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500 transition-all"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
          <span className="text-xs text-slate-400 font-semibold mr-1 flex items-center gap-1">
            <Filter className="w-3.5 h-3.5" />
            Rol:
          </span>
          {['ALL', 'SUPERADMIN', 'ADMINISTRADOR', 'RECEPCIÓN', 'INSTRUCTOR'].map((role) => (
            <button
              key={role}
              onClick={() => setSelectedRoleFilter(role)}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer shrink-0 ${
                selectedRoleFilter === role
                  ? 'bg-slate-900 text-white shadow-2xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {role === 'ALL' ? 'Todos' : role}
            </button>
          ))}
        </div>
      </div>

      {/* Users Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredUsers.map((u) => {
          const isMe = u.uid === currentUser?.uid || u.email.toLowerCase() === currentUser?.email?.toLowerCase();

          return (
            <div
              key={u.uid}
              className={`bg-white rounded-2xl border p-5 space-y-4 transition-all flex flex-col justify-between ${
                isMe
                  ? 'border-amber-400 ring-2 ring-amber-400/20 shadow-md'
                  : 'border-slate-200 shadow-xs hover:border-slate-300 hover:shadow-sm'
              }`}
            >
              <div className="space-y-3.5">
                {/* Avatar and Role header */}
                <div className="flex items-start justify-between gap-2">
                  <div className="relative">
                    <div className="w-14 h-14 rounded-2xl bg-slate-100 border-2 border-slate-200/90 overflow-hidden flex items-center justify-center shadow-xs">
                      {u.photoUrl ? (
                        <img
                          src={u.photoUrl}
                          alt={u.displayName}
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-slate-900 to-slate-800 text-amber-400 flex items-center justify-center font-black text-base">
                          {(u.displayName || u.email).slice(0, 2).toUpperCase()}
                        </div>
                      )}
                    </div>

                    {/* Camera indicator */}
                    {u.photoUrl ? (
                      <span
                        className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center border-2 border-white shadow-2xs"
                        title="Foto de perfil configurada"
                      >
                        <Camera className="w-2.5 h-2.5" />
                      </span>
                    ) : (
                      <span
                        className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-slate-300 text-slate-600 flex items-center justify-center border-2 border-white text-[9px] font-bold"
                        title="Sin foto personalizada"
                      >
                        -
                      </span>
                    )}
                  </div>

                  <div className="text-right">
                    <span
                      className={`inline-block px-2.5 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-wide border ${
                        u.role === 'SUPERADMIN'
                          ? 'bg-purple-100 text-purple-900 border-purple-200'
                          : u.role === 'ADMINISTRADOR'
                          ? 'bg-blue-100 text-blue-900 border-blue-200'
                          : u.role === 'RECEPCIÓN'
                          ? 'bg-emerald-100 text-emerald-900 border-emerald-200'
                          : 'bg-amber-100 text-amber-900 border-amber-200'
                      }`}
                    >
                      {u.role}
                    </span>
                    <p className="text-[10px] text-slate-400 mt-1">
                      ID: {u.uid.replace('user-', '')}
                    </p>
                  </div>
                </div>

                {/* User Details */}
                <div>
                  <h4 className="font-bold text-sm text-slate-900 flex items-center gap-1.5">
                    <span className="truncate">{u.displayName || 'Usuario'}</span>
                    {isMe && (
                      <span className="shrink-0 px-1.5 py-0.5 rounded bg-amber-100 text-amber-900 text-[9px] font-black">
                        Tú (En sesión)
                      </span>
                    )}
                  </h4>

                  <p className="text-slate-500 text-xs flex items-center gap-1.5 mt-1.5">
                    <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate" title={u.email}>
                      {u.email}
                    </span>
                  </p>

                  {u.phone && (
                    <p className="text-slate-500 text-[11px] flex items-center gap-1.5 mt-1">
                      <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>{u.phone}</span>
                    </p>
                  )}
                </div>
              </div>

              {/* Status & Actions Footer */}
              <div className="pt-3 border-t border-slate-100 space-y-2.5">
                <div className="flex items-center justify-between text-xs">
                  <span
                    className={`inline-flex items-center gap-1.5 font-bold text-[11px] ${
                      u.active ? 'text-emerald-700' : 'text-slate-400'
                    }`}
                  >
                    <span
                      className={`w-2 h-2 rounded-full ${u.active ? 'bg-emerald-500' : 'bg-slate-300'}`}
                    ></span>
                    <span>{u.active ? 'Cuenta Activa' : 'Desactivado'}</span>
                  </span>

                  <span className="text-[10px] text-slate-400">
                    {new Date(u.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                  </span>
                </div>

                {/* Actions */}
                {isSuperAdmin ? (
                  <div className="flex items-center gap-1.5 pt-1">
                    <button
                      onClick={() => handleStartEdit(u)}
                      className="flex-1 py-1.5 px-2 rounded-lg bg-slate-100 hover:bg-blue-50 hover:text-blue-700 text-slate-700 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                      title="Editar datos, rol, foto y contraseña"
                    >
                      <Edit2 className="w-3.5 h-3.5 text-blue-600" />
                      <span>Editar</span>
                    </button>

                    <button
                      onClick={() => setPasswordChangeUser(u)}
                      className="p-1.5 rounded-lg border border-slate-200 hover:border-amber-300 hover:bg-amber-50 text-slate-600 hover:text-amber-700 transition-colors cursor-pointer"
                      title={isMe ? 'Cambiar mi contraseña' : `Cambiar contraseña de ${u.displayName}`}
                    >
                      <Key className="w-3.5 h-3.5 text-amber-600" />
                    </button>

                    {!isMe && (
                      <button
                        onClick={() => handleToggleUser(u)}
                        className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                          u.active
                            ? 'border-slate-200 text-slate-500 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-200'
                            : 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                        }`}
                        title={u.active ? 'Desactivar usuario' : 'Activar usuario'}
                      >
                        <Power className="w-3.5 h-3.5" />
                      </button>
                    )}

                    {!isMe && (
                      <button
                        onClick={() => handleStartDelete(u)}
                        className="p-1.5 rounded-lg border border-slate-200 hover:border-rose-200 hover:bg-rose-50 text-slate-400 hover:text-rose-700 transition-colors cursor-pointer"
                        title="Eliminar usuario permanentemente"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                ) : isMe ? (
                  <div className="pt-1">
                    <button
                      onClick={() => setPasswordChangeUser(u)}
                      className="w-full py-1.5 px-3 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Key className="w-3.5 h-3.5 text-amber-600" />
                      <span>Cambiar mi Contraseña</span>
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-1.5 py-1 px-2 rounded-lg bg-slate-50 text-slate-400 text-[11px] font-medium border border-slate-100">
                    <Lock className="w-3 h-3" />
                    <span>Edición y eliminación: Solo SUPERADMIN</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {filteredUsers.length === 0 && (
        <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center space-y-3">
          <UserX className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="font-bold text-slate-800 text-base">No se encontraron usuarios</h3>
          <p className="text-slate-400 text-xs max-w-sm mx-auto">
            Ningún usuario coincide con los criterios de búsqueda o el filtro de rol seleccionado.
          </p>
        </div>
      )}

      {/* Role Matrix Overview */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-purple-600" />
            <span>Matriz de Permisos Institucionales (RBAC)</span>
          </h3>
          <span className="text-[11px] text-slate-500 font-semibold">
            Millennium Academy Security Rules
          </span>
        </div>

        <div className="overflow-x-auto text-xs">
          <table className="w-full text-left">
            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
              <tr>
                <th className="p-2.5">Módulo Institucional</th>
                <th className="p-2.5 text-center bg-purple-50/60 text-purple-900 font-black">SUPERADMIN</th>
                <th className="p-2.5 text-center">ADMINISTRADOR</th>
                <th className="p-2.5 text-center">RECEPCIÓN</th>
                <th className="p-2.5 text-center">DOCENTE</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              <tr className="bg-amber-50/40 font-semibold">
                <td className="p-2.5 text-slate-900 flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5 text-purple-600" />
                  <span>Gestión de Usuarios, Roles y Fotos (Alta / Edición / Baja)</span>
                </td>
                <td className="p-2.5 text-center text-purple-700 font-black bg-purple-50/60">
                  Exclusivo Total
                </td>
                <td className="p-2.5 text-center text-rose-500 font-semibold">Solo Lectura</td>
                <td className="p-2.5 text-center text-slate-400">Sin acceso</td>
                <td className="p-2.5 text-center text-slate-400">Sin acceso</td>
              </tr>
              <tr>
                <td className="p-2.5 font-medium">Estudiantes (Alta / Edición / Padrón)</td>
                <td className="p-2.5 text-center text-emerald-600 font-bold bg-purple-50/60">Total</td>
                <td className="p-2.5 text-center text-emerald-600 font-bold">Total</td>
                <td className="p-2.5 text-center text-emerald-600 font-bold">Alta / Edición</td>
                <td className="p-2.5 text-center text-slate-400">Solo Lectura</td>
              </tr>
              <tr>
                <td className="p-2.5 font-medium">Cursos y Grupos</td>
                <td className="p-2.5 text-center text-emerald-600 font-bold bg-purple-50/60">Total</td>
                <td className="p-2.5 text-center text-emerald-600 font-bold">Total</td>
                <td className="p-2.5 text-center text-slate-400">Solo Lectura</td>
                <td className="p-2.5 text-center text-slate-400">Grupos Asignados</td>
              </tr>
              <tr>
                <td className="p-2.5 font-medium">Matrículas Oficiales</td>
                <td className="p-2.5 text-center text-emerald-600 font-bold bg-purple-50/60">Total</td>
                <td className="p-2.5 text-center text-emerald-600 font-bold">Total</td>
                <td className="p-2.5 text-center text-emerald-600 font-bold">Emisión</td>
                <td className="p-2.5 text-center text-slate-400">Sin acceso</td>
              </tr>
              <tr>
                <td className="p-2.5 font-medium">Caja y Recibos de Cobro</td>
                <td className="p-2.5 text-center text-emerald-600 font-bold bg-purple-50/60">Total</td>
                <td className="p-2.5 text-center text-emerald-600 font-bold">Total</td>
                <td className="p-2.5 text-center text-emerald-600 font-bold">Cobro / Recibos</td>
                <td className="p-2.5 text-center text-rose-500 font-semibold">Bloqueado</td>
              </tr>
              <tr>
                <td className="p-2.5 font-medium">Asistencia y Calificaciones</td>
                <td className="p-2.5 text-center text-emerald-600 font-bold bg-purple-50/60">Total</td>
                <td className="p-2.5 text-center text-emerald-600 font-bold">Total</td>
                <td className="p-2.5 text-center text-slate-400">Consulta</td>
                <td className="p-2.5 text-center text-emerald-600 font-bold">Registro de Notas</td>
              </tr>
              <tr>
                <td className="p-2.5 font-medium">WhatsApp Cloud API &amp; Plantillas</td>
                <td className="p-2.5 text-center text-emerald-600 font-bold bg-purple-50/60">Total</td>
                <td className="p-2.5 text-center text-emerald-600 font-bold">Total</td>
                <td className="p-2.5 text-center text-emerald-600 font-bold">Envío / Chat</td>
                <td className="p-2.5 text-center text-slate-400">Sin acceso</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL 1: Nuevo Usuario Institucional (Exclusivo SUPERADMIN) */}
      {isAddModalOpen && isSuperAdmin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs">
          <form
            onSubmit={handleCreateUser}
            className="bg-white rounded-2xl sm:rounded-3xl max-w-lg w-full shadow-2xl border border-slate-200 flex flex-col max-h-[92vh] sm:max-h-[88vh] overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-150"
          >
            {/* Modal Header (Fixed) */}
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3.5 sm:px-6 sm:py-4 shrink-0 bg-white">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 rounded-2xl bg-blue-100 text-blue-800 shadow-2xs shrink-0">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-base leading-snug">Nuevo Usuario Institucional</h3>
                  <p className="text-slate-400 text-[11px]">Asignar credenciales de acceso y rol institucional</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                title="Cerrar ventana"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body (Scrollable) */}
            <div className="overflow-y-auto px-5 py-4 sm:px-6 sm:py-5 space-y-4 text-xs flex-1 overscroll-contain">
              {modalError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                  <span>{modalError}</span>
                </div>
              )}

              {/* Profile Photo Upload */}
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200">
                <UserProfilePhotoUpload
                  currentPhotoUrl={addFormData.photoUrl}
                  displayName={addFormData.displayName || 'Nuevo Usuario'}
                  onPhotoChange={(newPhoto) => setAddFormData({ ...addFormData, photoUrl: newPhoto })}
                  onRemovePhoto={() => setAddFormData({ ...addFormData, photoUrl: '' })}
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Nombre Completo *</label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Lic. Mario Estrada"
                  value={addFormData.displayName}
                  onChange={(e) => setAddFormData({ ...addFormData, displayName: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-medium"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Correo Electrónico Institucional *</label>
                <input
                  type="email"
                  required
                  placeholder="usuario@millenniumacademy.hn"
                  value={addFormData.email}
                  onChange={(e) => setAddFormData({ ...addFormData, email: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-medium"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Rol y Nivel de Acceso *</label>
                <select
                  value={addFormData.role}
                  onChange={(e) => setAddFormData({ ...addFormData, role: e.target.value as UserRole })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-slate-900 font-bold focus:outline-hidden focus:ring-2 focus:ring-blue-500 cursor-pointer"
                >
                  <option value="ADMINISTRADOR">ADMINISTRADOR (Gestión Completa)</option>
                  <option value="RECEPCIÓN">RECEPCIÓN (Atención, Matrículas y Caja)</option>
                  <option value="INSTRUCTOR">INSTRUCTOR (Asistencia y Notas)</option>
                  <option value="SUPERADMIN">SUPERADMIN (Acceso Total, Gestión de Roles y Auditoría)</option>
                </select>
                <p className="text-[10px] text-slate-500 mt-1">
                  Solo el SUPERADMIN puede otorgar este u otros roles en el sistema.
                </p>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Teléfono Móvil (WhatsApp)</label>
                <input
                  type="text"
                  placeholder="+504 9900-0000"
                  value={addFormData.phone}
                  onChange={(e) => setAddFormData({ ...addFormData, phone: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-medium"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block font-bold text-slate-700">Contraseña Inicial de Acceso</label>
                  <button
                    type="button"
                    onClick={() => {
                      const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%&*';
                      let gen = '';
                      for (let i = 0; i < 10; i++) gen += chars.charAt(Math.floor(Math.random() * chars.length));
                      setAddFormData({ ...addFormData, initialPassword: gen });
                      setShowAddPassword(true);
                    }}
                    className="text-[10px] font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 cursor-pointer"
                  >
                    <Sparkles className="w-3 h-3" />
                    <span>Generar Segura</span>
                  </button>
                </div>
                <div className="relative">
                  <input
                    type={showAddPassword ? 'text' : 'password'}
                    placeholder="admin123"
                    value={addFormData.initialPassword}
                    onChange={(e) => setAddFormData({ ...addFormData, initialPassword: e.target.value })}
                    className="w-full pl-3.5 pr-10 py-2.5 rounded-xl border border-slate-300 text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-medium"
                  />
                  <button
                    type="button"
                    onClick={() => setShowAddPassword(!showAddPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                    tabIndex={-1}
                  >
                    {showAddPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-[10px] text-slate-500 mt-1">
                  Por defecto se asigna <code className="bg-slate-100 px-1 py-0.5 rounded font-mono font-bold">admin123</code>. El usuario podrá cambiarla luego.
                </p>
              </div>
            </div>

            {/* Modal Footer (Fixed) */}
            <div className="px-5 py-3.5 sm:px-6 sm:py-4 border-t border-slate-100 flex items-center justify-end gap-2.5 shrink-0 bg-slate-50/80 rounded-b-2xl sm:rounded-b-3xl">
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 font-bold cursor-pointer transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold cursor-pointer transition-colors shadow-xs"
              >
                Guardar y Registrar Usuario
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL 2: Editar Usuario y Rol (Exclusivo SUPERADMIN) */}
      {editingUser && isSuperAdmin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs">
          <form
            onSubmit={handleSaveEdit}
            className="bg-white rounded-2xl sm:rounded-3xl max-w-lg w-full shadow-2xl border border-slate-200 flex flex-col max-h-[92vh] sm:max-h-[88vh] overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-150"
          >
            {/* Modal Header (Fixed) */}
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3.5 sm:px-6 sm:py-4 shrink-0 bg-white">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 rounded-2xl bg-amber-100 text-amber-900 shadow-2xs shrink-0">
                  <Edit2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-base leading-snug">Editar Usuario y Rol</h3>
                  <p className="text-slate-400 text-[11px]">Modificar datos de perfil, permisos y fotografía</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingUser(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                title="Cerrar ventana"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body (Scrollable) */}
            <div className="overflow-y-auto px-5 py-4 sm:px-6 sm:py-5 space-y-4 text-xs flex-1 overscroll-contain">
              {modalError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                  <span>{modalError}</span>
                </div>
              )}

              {/* Profile Photo Upload */}
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200">
                <UserProfilePhotoUpload
                  currentPhotoUrl={editFormData.photoUrl}
                  displayName={editFormData.displayName || 'Usuario'}
                  onPhotoChange={(newPhoto) => setEditFormData({ ...editFormData, photoUrl: newPhoto })}
                  onRemovePhoto={() => setEditFormData({ ...editFormData, photoUrl: '' })}
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Nombre Completo *</label>
                <input
                  type="text"
                  required
                  value={editFormData.displayName}
                  onChange={(e) => setEditFormData({ ...editFormData, displayName: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-medium"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Correo Electrónico *</label>
                <input
                  type="email"
                  required
                  value={editFormData.email}
                  onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-medium"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1 flex items-center justify-between">
                  <span>Rol y Nivel de Acceso *</span>
                  <span className="text-[10px] font-bold text-purple-700">MODIFICABLE POR SUPERADMIN</span>
                </label>
                <select
                  value={editFormData.role}
                  onChange={(e) => setEditFormData({ ...editFormData, role: e.target.value as UserRole })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-purple-200 bg-purple-50/30 text-purple-950 font-black focus:outline-hidden focus:ring-2 focus:ring-purple-500 cursor-pointer"
                >
                  <option value="SUPERADMIN">SUPERADMIN (Acceso Total + Gestión de Personal)</option>
                  <option value="ADMINISTRADOR">ADMINISTRADOR (Gestión Completa)</option>
                  <option value="RECEPCIÓN">RECEPCIÓN (Atención, Matrículas y Caja)</option>
                  <option value="INSTRUCTOR">INSTRUCTOR (Asistencia y Notas)</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Teléfono Móvil</label>
                <input
                  type="text"
                  placeholder="+504 9900-0000"
                  value={editFormData.phone}
                  onChange={(e) => setEditFormData({ ...editFormData, phone: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-medium"
                />
              </div>

              <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200">
                <input
                  type="checkbox"
                  id="editUserActiveToggle"
                  checked={editFormData.active}
                  onChange={(e) => setEditFormData({ ...editFormData, active: e.target.checked })}
                  className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                />
                <label htmlFor="editUserActiveToggle" className="cursor-pointer">
                  <span className="font-bold text-slate-800 block text-xs">Cuenta Habilitada (Activa)</span>
                  <span className="text-slate-500 text-[11px]">Si se deshabilita, el usuario no podrá iniciar sesión en la academia.</span>
                </label>
              </div>

              {/* Sección de Seguridad y Cambio de Contraseña */}
              <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200/80 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-amber-100 text-amber-800">
                      <Key className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 text-xs">
                        Seguridad y Contraseña de Acceso
                      </h4>
                      <p className="text-[11px] text-slate-500">
                        {editingUser.passwordUpdatedAt
                          ? 'Este usuario tiene contraseña personalizada configurada.'
                          : 'Este usuario utiliza la contraseña por defecto (admin123).'}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setEditChangePasswordOpen(!editChangePasswordOpen);
                      if (!editChangePasswordOpen) {
                        setEditNewPassword('');
                        setEditConfirmPassword('');
                      }
                    }}
                    className="text-xs font-bold text-blue-700 hover:text-blue-800 bg-white hover:bg-blue-50 px-3 py-1.5 rounded-lg border border-slate-200 cursor-pointer transition-colors shadow-2xs shrink-0"
                  >
                    {editChangePasswordOpen ? 'Cancelar Cambio' : 'Cambiar Contraseña'}
                  </button>
                </div>

                {editChangePasswordOpen && (
                  <div className="pt-2 border-t border-amber-200/60 space-y-3">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="font-bold text-slate-700 text-xs">Nueva Contraseña</label>
                        <button
                          type="button"
                          onClick={() => {
                            const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%&*';
                            let gen = '';
                            for (let i = 0; i < 10; i++) gen += chars.charAt(Math.floor(Math.random() * chars.length));
                            setEditNewPassword(gen);
                            setEditConfirmPassword(gen);
                            setShowEditNewPassword(true);
                          }}
                          className="text-[10px] font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 cursor-pointer"
                        >
                          <Sparkles className="w-3 h-3" />
                          <span>Generar Segura</span>
                        </button>
                      </div>
                      <div className="relative">
                        <input
                          type={showEditNewPassword ? 'text' : 'password'}
                          placeholder="Mínimo 6 caracteres"
                          value={editNewPassword}
                          onChange={(e) => setEditNewPassword(e.target.value)}
                          className="w-full pl-3.5 pr-10 py-2 rounded-xl border border-slate-300 bg-white text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500 text-xs font-medium"
                        />
                        <button
                          type="button"
                          onClick={() => setShowEditNewPassword(!showEditNewPassword)}
                          className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                          tabIndex={-1}
                        >
                          {showEditNewPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 text-xs mb-1">Confirmar Nueva Contraseña</label>
                      <input
                        type={showEditNewPassword ? 'text' : 'password'}
                        placeholder="Repite la nueva contraseña"
                        value={editConfirmPassword}
                        onChange={(e) => setEditConfirmPassword(e.target.value)}
                        className={`w-full px-3.5 py-2 rounded-xl border bg-white text-slate-900 focus:outline-hidden focus:ring-2 text-xs font-medium ${
                          editConfirmPassword && editConfirmPassword !== editNewPassword
                            ? 'border-rose-300 focus:ring-rose-500'
                            : 'border-slate-300 focus:ring-blue-500'
                        }`}
                      />
                      {editConfirmPassword && editConfirmPassword !== editNewPassword && (
                        <p className="text-rose-600 text-[10px] mt-0.5 font-medium">Las contraseñas no coinciden.</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer (Fixed) */}
            <div className="px-5 py-3.5 sm:px-6 sm:py-4 border-t border-slate-100 flex items-center justify-end gap-2.5 shrink-0 bg-slate-50/80 rounded-b-2xl sm:rounded-b-3xl">
              <button
                type="button"
                onClick={() => setEditingUser(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 font-bold cursor-pointer transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold cursor-pointer transition-colors shadow-xs"
              >
                Guardar Cambios
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL 3: Eliminar Usuario (Exclusivo SUPERADMIN) */}
      {deletingUser && isSuperAdmin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl sm:rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-5 my-auto animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-rose-100 text-rose-700 shadow-2xs">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-black text-slate-900 text-base">¿Eliminar este Usuario?</h3>
                <p className="text-slate-400 text-xs">Acción reservada al rol SUPERADMIN</p>
              </div>
            </div>

            {modalError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{modalError}</span>
              </div>
            )}

            {/* Target user card */}
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-slate-200 overflow-hidden flex items-center justify-center shrink-0 border border-slate-300">
                {deletingUser.photoUrl ? (
                  <img
                    src={deletingUser.photoUrl}
                    alt={deletingUser.displayName}
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <span className="font-extrabold text-slate-700 text-sm">
                    {(deletingUser.displayName || 'U').slice(0, 2).toUpperCase()}
                  </span>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <h4 className="font-bold text-sm text-slate-900 truncate">{deletingUser.displayName}</h4>
                <p className="text-slate-500 text-xs truncate">{deletingUser.email}</p>
                <span className="inline-block mt-1 px-2 py-0.5 rounded text-[9px] font-extrabold bg-purple-100 text-purple-900 border border-purple-200">
                  {deletingUser.role}
                </span>
              </div>
            </div>

            <p className="text-slate-600 text-xs leading-relaxed">
              Esta acción eliminará de forma permanente el usuario y revocará todos sus accesos al sistema de Millennium Academy.
            </p>

            <div className="pt-2 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setDeletingUser(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 font-bold text-xs cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs cursor-pointer transition-colors shadow-xs flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Sí, Eliminar Definitivamente</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: Cambio de Contraseña de Usuario */}
      {passwordChangeUser && (
        <ChangePasswordModal
          isOpen={!!passwordChangeUser}
          onClose={() => setPasswordChangeUser(null)}
          targetUser={passwordChangeUser}
          onSuccess={() => {
            setSuccessMsg(`Contraseña de "${passwordChangeUser.displayName}" actualizada exitosamente.`);
            setTimeout(() => setSuccessMsg(null), 4000);
          }}
        />
      )}
    </div>
  );
};

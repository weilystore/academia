import React, { useState } from 'react';
import {
  Key,
  Lock,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  RefreshCw,
  X,
  Sparkles
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { UserProfile } from '../../types';

interface ChangePasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetUser: UserProfile | null;
  onSuccess?: () => void;
}

export const ChangePasswordModal: React.FC<ChangePasswordModalProps> = ({
  isOpen,
  onClose,
  targetUser,
  onSuccess
}) => {
  const { currentUser, changeUserPassword } = useAuth();
  const { addAuditLog } = useData();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen || !targetUser) return null;

  const isSelf = currentUser?.uid === targetUser.uid;
  const isSuperAdmin = currentUser?.role === 'SUPERADMIN';
  const canDirectReset = isSuperAdmin && !isSelf;

  // Password strength calculation
  const getPasswordStrength = (pass: string) => {
    if (!pass) return { score: 0, label: 'Vacía', color: 'bg-slate-200' };
    let score = 0;
    if (pass.length >= 6) score += 1;
    if (pass.length >= 8) score += 1;
    if (/[A-Z]/.test(pass) && /[a-z]/.test(pass)) score += 1;
    if (/\d/.test(pass)) score += 1;
    if (/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(pass)) score += 1;

    if (score <= 1) return { score: 1, label: 'Débil', color: 'bg-rose-500' };
    if (score <= 3) return { score: 2, label: 'Media', color: 'bg-amber-500' };
    return { score: 3, label: 'Fuerte y Segura', color: 'bg-emerald-500' };
  };

  const strength = getPasswordStrength(newPassword);

  const handleGeneratePassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%&*';
    let generated = '';
    for (let i = 0; i < 10; i++) {
      generated += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setNewPassword(generated);
    setConfirmPassword(generated);
    setShowNew(true);
    setShowConfirm(true);
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!newPassword) {
      setError('Por favor ingrese la nueva contraseña.');
      return;
    }

    if (newPassword.length < 6) {
      setError('La nueva contraseña debe tener como mínimo 6 caracteres.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Las contraseñas no coinciden. Verifique los campos.');
      return;
    }

    // If changing own password and not superadmin direct override, require current pass
    if (isSelf && !isSuperAdmin && !currentPassword) {
      setError('Debe ingresar su contraseña actual para confirmar el cambio.');
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await changeUserPassword(targetUser.uid, newPassword, currentPassword);

      if (!res.success) {
        setError(res.error || 'Error al actualizar la contraseña.');
        setIsSubmitting(false);
        return;
      }

      // Add audit log
      addAuditLog(
        'Cambio de Contraseña',
        'Seguridad / Usuarios',
        targetUser.uid,
        canDirectReset
          ? `SUPERADMIN restableció la contraseña del usuario ${targetUser.displayName} (${targetUser.email})`
          : `El usuario ${targetUser.displayName} actualizó su contraseña de acceso personal`
      );

      setSuccess('¡Contraseña actualizada exitosamente!');
      setTimeout(() => {
        onSuccess?.();
        handleClose();
      }, 1400);
    } catch (err: any) {
      setError(err.message || 'Ocurrió un error al cambiar la contraseña.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setError(null);
    setSuccess(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs">
      <div className="bg-white rounded-2xl sm:rounded-3xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 bg-slate-50/80">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-2xl bg-amber-100 text-amber-800 shadow-2xs shrink-0">
              <Key className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 text-base leading-tight">
                {isSelf ? 'Cambiar mi Contraseña' : 'Restablecer Contraseña'}
              </h3>
              <p className="text-slate-400 text-[11px]">
                {isSelf
                  ? 'Actualiza tu clave de acceso a la academia'
                  : `Gestión de credenciales para ${targetUser.displayName}`}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors cursor-pointer"
            title="Cerrar ventana"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* User Badge Info */}
        <div className="px-5 pt-4">
          <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200/80 text-xs">
            <div className="w-10 h-10 rounded-full bg-slate-800 text-white font-bold flex items-center justify-center overflow-hidden shrink-0 border border-white shadow-2xs">
              {targetUser.photoUrl ? (
                <img
                  src={targetUser.photoUrl}
                  alt={targetUser.displayName}
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              ) : (
                (targetUser.displayName || 'US').slice(0, 2).toUpperCase()
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-1">
                <span className="font-bold text-slate-900 truncate block">
                  {targetUser.displayName}
                </span>
                <span className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase bg-purple-100 text-purple-800 shrink-0">
                  {targetUser.role}
                </span>
              </div>
              <span className="text-slate-500 text-[11px] truncate block">{targetUser.email}</span>
            </div>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
          {canDirectReset && (
            <div className="p-2.5 rounded-xl bg-purple-50 border border-purple-200 text-purple-900 text-[11px] flex items-start gap-2">
              <ShieldCheck className="w-4 h-4 text-purple-700 shrink-0 mt-0.5" />
              <span>
                Como <strong>SUPERADMIN</strong>, puedes asignar directamente una nueva contraseña
                a este usuario sin requerir su clave anterior.
              </span>
            </div>
          )}

          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 flex items-center gap-2 animate-in fade-in">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span className="font-medium">{error}</span>
            </div>
          )}

          {success && (
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-center gap-2 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span className="font-bold">{success}</span>
            </div>
          )}

          {/* Current Password (only if changing own password and not superadmin) */}
          {isSelf && !isSuperAdmin && (
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Contraseña Actual <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showCurrent ? 'text' : 'password'}
                  required
                  placeholder="Introduce tu contraseña actual"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full pl-9 pr-10 py-2.5 rounded-xl border border-slate-300 text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-medium"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrent(!showCurrent)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                  tabIndex={-1}
                >
                  {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          )}

          {/* New Password */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="font-bold text-slate-700">
                Nueva Contraseña <span className="text-rose-500">*</span>
              </label>
              <button
                type="button"
                onClick={handleGeneratePassword}
                className="text-[11px] font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 cursor-pointer transition-colors"
                title="Generar una contraseña aleatoria y segura"
              >
                <Sparkles className="w-3 h-3" />
                <span>Generar Segura</span>
              </button>
            </div>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <Key className="w-4 h-4" />
              </div>
              <input
                type={showNew ? 'text' : 'password'}
                required
                minLength={6}
                placeholder="Mínimo 6 caracteres"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full pl-9 pr-10 py-2.5 rounded-xl border border-slate-300 text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-medium"
              />
              <button
                type="button"
                onClick={() => setShowNew(!showNew)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                tabIndex={-1}
              >
                {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            {/* Strength Meter */}
            {newPassword && (
              <div className="mt-1.5 space-y-1">
                <div className="flex items-center justify-between text-[10px]">
                  <span className="text-slate-500">Nivel de seguridad:</span>
                  <span className="font-bold text-slate-700">{strength.label}</span>
                </div>
                <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden flex gap-1">
                  <div
                    className={`h-full transition-all duration-300 rounded-full ${
                      strength.score >= 1 ? strength.color : 'bg-transparent'
                    }`}
                    style={{ width: '33%' }}
                  />
                  <div
                    className={`h-full transition-all duration-300 rounded-full ${
                      strength.score >= 2 ? strength.color : 'bg-transparent'
                    }`}
                    style={{ width: '33%' }}
                  />
                  <div
                    className={`h-full transition-all duration-300 rounded-full ${
                      strength.score >= 3 ? strength.color : 'bg-transparent'
                    }`}
                    style={{ width: '34%' }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Confirm Password */}
          <div>
            <label className="block font-bold text-slate-700 mb-1">
              Confirmar Nueva Contraseña <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <input
                type={showConfirm ? 'text' : 'password'}
                required
                minLength={6}
                placeholder="Repite la nueva contraseña"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className={`w-full pl-9 pr-10 py-2.5 rounded-xl border text-slate-900 focus:outline-hidden focus:ring-2 font-medium ${
                  confirmPassword && confirmPassword !== newPassword
                    ? 'border-rose-400 focus:ring-rose-500 bg-rose-50/20'
                    : 'border-slate-300 focus:ring-blue-500'
                }`}
              />
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                tabIndex={-1}
              >
                {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {confirmPassword && confirmPassword !== newPassword && (
              <p className="text-rose-600 text-[10px] mt-1 font-medium">
                Las contraseñas no coinciden todavía.
              </p>
            )}
          </div>

          {/* Footer Actions */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 font-bold cursor-pointer transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting || (!!newPassword && newPassword !== confirmPassword)}
              className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold cursor-pointer transition-colors shadow-xs flex items-center gap-1.5"
            >
              {isSubmitting ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Guardando...</span>
                </>
              ) : (
                <>
                  <Key className="w-3.5 h-3.5" />
                  <span>Actualizar Contraseña</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

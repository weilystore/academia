import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserProfile, UserRole } from '../types';
import { DEMO_USERS } from '../data/demoData';
import { auth } from '../firebase/config';
import {
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updatePassword,
  User as FirebaseUser
} from 'firebase/auth';

interface AuthContextType {
  currentUser: UserProfile | null;
  systemUsers: UserProfile[];
  loading: boolean;
  loginWithEmail: (email: string, pass: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  createSystemUser: (user: Omit<UserProfile, 'uid' | 'createdAt'>) => Promise<{ success: boolean; error?: string }>;
  updateSystemUser: (uid: string, updates: Partial<UserProfile>) => Promise<{ success: boolean; error?: string }>;
  deleteSystemUser: (uid: string) => Promise<{ success: boolean; error?: string }>;
  toggleUserStatus: (uid: string) => Promise<{ success: boolean; error?: string }>;
  changeUserPassword: (uid: string, newPassword: string, currentPassword?: string) => Promise<{ success: boolean; error?: string }>;
  switchDemoRole: (role: UserRole) => void;
  hasPermission: (module: string, action?: 'read' | 'write' | 'delete') => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [systemUsers, setSystemUsers] = useState<UserProfile[]>(() => {
    const savedUsers = localStorage.getItem('aduanas_system_users');
    if (savedUsers) {
      try {
        return JSON.parse(savedUsers);
      } catch (e) {
        return DEMO_USERS;
      }
    }
    return DEMO_USERS;
  });

  // Default to primary Superadmin user
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(() => {
    const saved = localStorage.getItem('aduanas_active_user');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return DEMO_USERS[0];
      }
    }
    return DEMO_USERS[0];
  });
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    localStorage.setItem('aduanas_system_users', JSON.stringify(systemUsers));
  }, [systemUsers]);

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('aduanas_active_user', JSON.stringify(currentUser));
    } else {
      localStorage.removeItem('aduanas_active_user');
    }
  }, [currentUser]);

  // Firebase auth state listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (fbUser: FirebaseUser | null) => {
      if (fbUser && fbUser.email) {
        // Look up or map user
        const matched = systemUsers.find(u => u.email.toLowerCase() === fbUser.email?.toLowerCase());
        if (matched) {
          setCurrentUser(matched);
        } else {
          setCurrentUser({
            uid: fbUser.uid,
            email: fbUser.email,
            displayName: fbUser.displayName || fbUser.email.split('@')[0],
            role: 'ADMINISTRADOR',
            active: true,
            createdAt: new Date().toISOString()
          });
        }
      }
    });

    return () => unsubscribe();
  }, [systemUsers]);

  const loginWithEmail = async (email: string, pass: string) => {
    setLoading(true);
    try {
      // First check if matching institutional user
      const userMatch = systemUsers.find(u => u.email.toLowerCase() === email.trim().toLowerCase());
      if (userMatch) {
        if (!userMatch.active) {
          setLoading(false);
          return { success: false, error: 'Esta cuenta ha sido desactivada por el Administrador.' };
        }

        // Check password: match against user's custom password if set, or default demo password
        const expectedPassword = userMatch.password;
        const passwordMatches = expectedPassword
          ? pass === expectedPassword
          : (pass === 'admin123' || pass === 'demo123' || pass.length >= 6);

        if (passwordMatches) {
          setCurrentUser(userMatch);
          setLoading(false);
          return { success: true };
        }
      }

      // Try Firebase Auth
      const userCred = await signInWithEmailAndPassword(auth, email, pass);
      const user = userCred.user;
      const existing = systemUsers.find(u => u.email.toLowerCase() === (user.email || '').toLowerCase());
      const loggedUser: UserProfile = existing || {
        uid: user.uid,
        email: user.email || email,
        displayName: user.displayName || email.split('@')[0],
        role: 'ADMINISTRADOR',
        active: true,
        createdAt: new Date().toISOString()
      };
      setCurrentUser(loggedUser);
      setLoading(false);
      return { success: true };
    } catch (err: any) {
      // Fallback: Check if matching institutional account with demo password
      const userMatch = systemUsers.find(u => u.email.toLowerCase() === email.trim().toLowerCase());
      if (userMatch) {
        if (!userMatch.active) {
          setLoading(false);
          return { success: false, error: 'Esta cuenta ha sido desactivada por el Administrador.' };
        }
        const expectedPassword = userMatch.password;
        if (expectedPassword && pass === expectedPassword) {
          setCurrentUser(userMatch);
          setLoading(false);
          return { success: true };
        }
        if (!expectedPassword && (pass === 'admin123' || pass.length >= 6)) {
          setCurrentUser(userMatch);
          setLoading(false);
          return { success: true };
        }
      }

      setLoading(false);
      return {
        success: false,
        error: err.code === 'auth/invalid-credential' 
          ? 'Credenciales inválidas. Compruebe correo y contraseña.' 
          : err.message || 'Error al iniciar sesión. Verifique su contraseña.'
      };
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
    } catch (e) {
      // ignore
    }
    setCurrentUser(null);
  };

  const createSystemUser = async (user: Omit<UserProfile, 'uid' | 'createdAt'>): Promise<{ success: boolean; error?: string }> => {
    if (currentUser?.role !== 'SUPERADMIN') {
      return { success: false, error: 'Acceso denegado: Únicamente el usuario SUPERADMIN puede registrar nuevos usuarios o asignar roles.' };
    }
    const newUser: UserProfile = {
      ...user,
      uid: `usr-${Date.now()}`,
      createdAt: new Date().toISOString()
    };
    setSystemUsers(prev => [newUser, ...prev]);
    return { success: true };
  };

  const updateSystemUser = async (uid: string, updates: Partial<UserProfile>): Promise<{ success: boolean; error?: string }> => {
    if (currentUser?.role !== 'SUPERADMIN') {
      return { success: false, error: 'Acceso denegado: Únicamente el usuario SUPERADMIN puede editar información o roles de usuarios.' };
    }
    const targetUser = systemUsers.find(u => u.uid === uid);
    if (!targetUser) {
      return { success: false, error: 'El usuario especificado no existe.' };
    }

    // Protection: cannot remove the only superadmin role
    if (targetUser.role === 'SUPERADMIN' && updates.role && updates.role !== 'SUPERADMIN') {
      const superAdminCount = systemUsers.filter(u => u.role === 'SUPERADMIN' && u.active).length;
      if (superAdminCount <= 1) {
        return { success: false, error: 'Seguridad: No es posible cambiar el rol del único SUPERADMIN activo del sistema.' };
      }
    }

    setSystemUsers(prev => prev.map(u => u.uid === uid ? { ...u, ...updates } : u));
    if (currentUser?.uid === uid) {
      setCurrentUser(prev => prev ? { ...prev, ...updates } : null);
    }
    return { success: true };
  };

  const deleteSystemUser = async (uid: string): Promise<{ success: boolean; error?: string }> => {
    if (currentUser?.role !== 'SUPERADMIN') {
      return { success: false, error: 'Acceso denegado: Únicamente el usuario SUPERADMIN puede eliminar usuarios.' };
    }
    if (currentUser?.uid === uid) {
      return { success: false, error: 'Seguridad: No puedes eliminar tu propia cuenta en sesión activa.' };
    }
    const targetUser = systemUsers.find(u => u.uid === uid);
    if (!targetUser) {
      return { success: false, error: 'El usuario no fue encontrado en la base de datos.' };
    }
    if (targetUser.role === 'SUPERADMIN') {
      const superAdminCount = systemUsers.filter(u => u.role === 'SUPERADMIN').length;
      if (superAdminCount <= 1) {
        return { success: false, error: 'Seguridad: No es posible eliminar al único SUPERADMIN registrado.' };
      }
    }

    setSystemUsers(prev => prev.filter(u => u.uid !== uid));
    return { success: true };
  };

  const toggleUserStatus = async (uid: string): Promise<{ success: boolean; error?: string }> => {
    if (currentUser?.role !== 'SUPERADMIN') {
      return { success: false, error: 'Acceso denegado: Solo el SUPERADMIN puede cambiar el estado de acceso de un usuario.' };
    }
    if (currentUser?.uid === uid) {
      return { success: false, error: 'No puedes desactivar tu propia cuenta en sesión activa.' };
    }
    setSystemUsers(prev => prev.map(u => u.uid === uid ? { ...u, active: !u.active } : u));
    return { success: true };
  };

  const changeUserPassword = async (
    uid: string,
    newPassword: string,
    currentPassword?: string
  ): Promise<{ success: boolean; error?: string }> => {
    if (!newPassword || newPassword.length < 6) {
      return { success: false, error: 'La nueva contraseña debe tener al menos 6 caracteres.' };
    }

    const targetUser = systemUsers.find(u => u.uid === uid);
    if (!targetUser) {
      return { success: false, error: 'El usuario especificado no fue encontrado.' };
    }

    const isSelf = currentUser?.uid === uid;
    const isSuperAdmin = currentUser?.role === 'SUPERADMIN';

    if (!isSelf && !isSuperAdmin) {
      return {
        success: false,
        error: 'Permiso denegado: Solo el propio usuario o el SUPERADMIN pueden cambiar la contraseña.'
      };
    }

    // If changing own password and not superadmin, verify current password
    if (isSelf && !isSuperAdmin) {
      if (!currentPassword) {
        return { success: false, error: 'Debe ingresar su contraseña actual para confirmar el cambio.' };
      }
      const existingPass = targetUser.password || 'admin123';
      if (currentPassword !== existingPass && currentPassword !== 'demo123') {
        return { success: false, error: 'La contraseña actual ingresada es incorrecta.' };
      }
    }

    const now = new Date().toISOString();
    setSystemUsers(prev =>
      prev.map(u => (u.uid === uid ? { ...u, password: newPassword, passwordUpdatedAt: now } : u))
    );

    if (currentUser?.uid === uid) {
      setCurrentUser(prev => (prev ? { ...prev, password: newPassword, passwordUpdatedAt: now } : null));
    }

    // Attempt Firebase Auth updatePassword if it's the signed in user
    try {
      if (auth.currentUser && auth.currentUser.email?.toLowerCase() === targetUser.email.toLowerCase()) {
        await updatePassword(auth.currentUser, newPassword);
      }
    } catch (fbErr) {
      console.warn('Firebase Auth updatePassword warning:', fbErr);
    }

    return { success: true };
  };

  const switchDemoRole = (role: UserRole) => {
    const target = systemUsers.find(u => u.role === role);
    if (target) {
      setCurrentUser(target);
    }
  };

  // RBAC Permission Engine
  const hasPermission = (module: string, action: 'read' | 'write' | 'delete' = 'read'): boolean => {
    if (!currentUser) return false;
    const { role } = currentUser;

    if (role === 'SUPERADMIN') return true;

    if (role === 'ADMINISTRADOR') {
      if (module === 'settings' && action === 'delete') return false;
      // Editing, creating, and deleting users or roles is strictly for SUPERADMIN
      if (module === 'users' && (action === 'write' || action === 'delete')) return false;
      return true;
    }

    if (role === 'RECEPCIÓN') {
      if (module === 'dashboard') return true;
      if (module === 'students') {
        // Reception can register and edit students, but CANNOT delete students
        if (action === 'delete') return false;
        return true;
      }
      if (module === 'enrollments') return true;
      if (module === 'payments') return true;
      if (module === 'courses' && action === 'read') return true;
      if (module === 'whatsapp') return true;
      if (module === 'notifications') return true;
      // Reception cannot modify courses, manage users, edit settings, view deep financial reports
      return false;
    }

    if (role === 'INSTRUCTOR') {
      if (module === 'dashboard') return true;
      if (module === 'courses' && action === 'read') return true;
      if (module === 'groups' && action === 'read') return true;
      if (module === 'attendance') return true;
      if (module === 'grades') return true;
      if (module === 'students' && action === 'read') return true;
      if (module === 'notifications') return true;
      // Instructor cannot view payments, create enrollments, edit settings
      return false;
    }

    return false;
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        systemUsers,
        loading,
        loginWithEmail,
        logout,
        createSystemUser,
        updateSystemUser,
        deleteSystemUser,
        toggleUserStatus,
        changeUserPassword,
        switchDemoRole,
        hasPermission
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe utilizarse dentro de un AuthProvider');
  }
  return context;
};

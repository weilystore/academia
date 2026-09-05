import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserProfile, UserRole } from '../types';
import { DEMO_USERS } from '../data/demoData';
import { auth } from '../firebase/config';
import {
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User as FirebaseUser
} from 'firebase/auth';

interface AuthContextType {
  currentUser: UserProfile | null;
  systemUsers: UserProfile[];
  loading: boolean;
  loginWithEmail: (email: string, pass: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  createSystemUser: (user: Omit<UserProfile, 'uid' | 'createdAt'>) => Promise<boolean>;
  updateSystemUser: (uid: string, updates: Partial<UserProfile>) => Promise<boolean>;
  toggleUserStatus: (uid: string) => Promise<boolean>;
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
      if (userMatch && (pass === 'admin123' || pass === 'demo123' || pass.length >= 6)) {
        if (!userMatch.active) {
          setLoading(false);
          return { success: false, error: 'Esta cuenta ha sido desactivada por el Administrador.' };
        }
        setCurrentUser(userMatch);
        setLoading(false);
        return { success: true };
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
      // Fallback: Check if matching institutional account
      const userMatch = systemUsers.find(u => u.email.toLowerCase() === email.trim().toLowerCase());
      if (userMatch && (pass === 'admin123' || pass.length >= 6)) {
        if (!userMatch.active) {
          setLoading(false);
          return { success: false, error: 'Esta cuenta ha sido desactivada por el Administrador.' };
        }
        setCurrentUser(userMatch);
        setLoading(false);
        return { success: true };
      }

      setLoading(false);
      return {
        success: false,
        error: err.code === 'auth/invalid-credential' 
          ? 'Credenciales inválidas. Compruebe correo y contraseña.' 
          : err.message || 'Error al iniciar sesión'
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

  const createSystemUser = async (user: Omit<UserProfile, 'uid' | 'createdAt'>): Promise<boolean> => {
    const newUser: UserProfile = {
      ...user,
      uid: `usr-${Date.now()}`,
      createdAt: new Date().toISOString()
    };
    setSystemUsers(prev => [newUser, ...prev]);
    return true;
  };

  const updateSystemUser = async (uid: string, updates: Partial<UserProfile>): Promise<boolean> => {
    setSystemUsers(prev => prev.map(u => u.uid === uid ? { ...u, ...updates } : u));
    if (currentUser?.uid === uid) {
      setCurrentUser(prev => prev ? { ...prev, ...updates } : null);
    }
    return true;
  };

  const toggleUserStatus = async (uid: string): Promise<boolean> => {
    setSystemUsers(prev => prev.map(u => u.uid === uid ? { ...u, active: !u.active } : u));
    return true;
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
      return true;
    }

    if (role === 'RECEPCIÓN') {
      if (module === 'dashboard') return true;
      if (module === 'students') return true;
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
        toggleUserStatus,
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

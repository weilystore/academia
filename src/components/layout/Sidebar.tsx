import React from 'react';
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  BookOpen,
  CalendarCheck,
  Award,
  CreditCard,
  MessageSquare,
  FileText,
  FolderLock,
  UserCheck,
  ShieldAlert,
  Sparkles,
  Settings,
  ChevronDown,
  LogOut,
  X,
  Layers
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { UserRole } from '../../types';

interface SidebarProps {
  currentView: string;
  setCurrentView?: (view: string) => void;
  onSelectView?: (view: string) => void;
  isOpen?: boolean;
  setIsOpen?: (open: boolean) => void;
  isOpenMobile?: boolean;
  onCloseMobile?: () => void;
  onOpenQuickEnrollment?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentView,
  setCurrentView,
  onSelectView,
  isOpen,
  setIsOpen,
  isOpenMobile,
  onCloseMobile,
  onOpenQuickEnrollment
}) => {
  const { currentUser, logout, hasPermission } = useAuth();
  const { whatsappConversations, notifications } = useData();

  const totalUnreadWa = whatsappConversations.reduce((acc, c) => acc + (c.unreadCount || 0), 0);

  const isSidebarVisible = isOpen ?? isOpenMobile ?? false;
  const closeSidebar = () => {
    if (setIsOpen) setIsOpen(false);
    if (onCloseMobile) onCloseMobile();
  };

  const handleNav = (view: string) => {
    if (onSelectView) {
      onSelectView(view);
    } else if (setCurrentView) {
      setCurrentView(view);
    }
    closeSidebar();
  };

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, permission: 'dashboard' },
    {
      id: 'students',
      label: 'Estudiantes',
      icon: Users,
      permission: 'students',
      subItems: [
        { id: 'students-all', label: 'Todos los Estudiantes', filter: 'all' },
        { id: 'students-activos', label: 'Estudiantes Activos', filter: 'Activo' },
        { id: 'students-prospectos', label: 'Prospectos', filter: 'Prospecto' },
        { id: 'students-graduados', label: 'Graduados', filter: 'Graduado' },
      ]
    },
    { id: 'enrollments', label: 'Matrículas', icon: GraduationCap, permission: 'enrollments' },
    { id: 'courses', label: 'Cursos', icon: BookOpen, permission: 'courses' },
    { id: 'groups', label: 'Grupos', icon: Layers, permission: 'courses' },
    { id: 'attendance', label: 'Asistencia', icon: CalendarCheck, permission: 'attendance' },
    { id: 'grades', label: 'Calificaciones', icon: Award, permission: 'grades' },
    { id: 'payments', label: 'Pagos y Finanzas', icon: CreditCard, permission: 'payments' },
    {
      id: 'whatsapp',
      label: 'WhatsApp Inbox',
      icon: MessageSquare,
      badge: totalUnreadWa > 0 ? totalUnreadWa : null,
      badgeColor: 'bg-emerald-500',
      permission: 'whatsapp'
    },
    { id: 'reports', label: 'Reportes', icon: FileText, permission: 'dashboard' },
    { id: 'documents', label: 'Documentos', icon: FolderLock, permission: 'students' },
    { id: 'users', label: 'Usuarios y Roles', icon: UserCheck, permission: 'users' },
    { id: 'audit', label: 'Auditoría', icon: ShieldAlert, permission: 'audit' },
    { id: 'ai-assistant', label: 'Asistente IA (Gemini)', icon: Sparkles, badge: 'IA', badgeColor: 'bg-indigo-600', permission: 'dashboard' },
    { id: 'settings', label: 'Configuración', icon: Settings, permission: 'settings' }
  ];

  return (
    <>
      {/* Mobile overlay */}
      {isSidebarVisible && (
        <div
          className="fixed inset-0 bg-slate-900/60 z-40 lg:hidden backdrop-blur-xs transition-opacity"
          onClick={closeSidebar}
        />
      )}

      <aside
        id="app-sidebar"
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-[#1E293B] text-slate-100 flex flex-col border-r border-slate-800/80 transition-transform duration-200 ease-in-out shrink-0 lg:static lg:inset-auto lg:translate-x-0 lg:h-screen ${
          isSidebarVisible ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="p-5 flex items-center justify-between border-b border-slate-800/80">
          <div className="flex items-center gap-3 text-white">
            <div className="w-8 h-8 bg-blue-500 rounded flex items-center justify-center text-white shadow-xs">
              <svg viewBox="0 0 24 24" className="w-4 h-4 fill-white">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"></path>
              </svg>
            </div>
            <div className="min-w-0">
              <span className="font-bold tracking-tight text-sm uppercase block truncate text-white">
                Academia de Aduanas
              </span>
              <span className="text-[10px] text-slate-400 font-medium tracking-wide uppercase block">
                Gestión Académica
              </span>
            </div>
          </div>
          <button
            id="btn-close-sidebar-mobile"
            onClick={closeSidebar}
            className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* User Role Card & Quick Switcher */}
        <div className="px-4 py-3 border-b border-slate-800/80 bg-slate-900/40">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center font-bold text-white text-xs shrink-0 overflow-hidden border border-slate-600">
              {currentUser?.photoUrl ? (
                <img src={currentUser.photoUrl} alt={currentUser.displayName} className="w-full h-full object-cover" />
              ) : (
                (currentUser?.displayName || 'AD').slice(0, 2).toUpperCase()
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-white uppercase truncate">
                {currentUser?.displayName}
              </p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="text-[10px] text-slate-400 uppercase tracking-widest font-medium">
                  {currentUser?.role}
                </span>
              </div>
            </div>
          </div>

          {/* Operational status and security level */}
          <div className="mt-2 pt-2 border-t border-slate-800/60 flex items-center justify-between text-[11px]">
            <span className="text-slate-400 font-medium text-[10px]">Estado:</span>
            <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-emerald-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>En línea (Producción)</span>
            </span>
          </div>
        </div>

        {/* Navigation items list */}
        <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-1 text-sm">
          {navItems.map((item) => {
            const allowed = hasPermission(item.permission);
            if (!allowed && currentUser?.role !== 'SUPERADMIN') return null;

            const isActive = currentView === item.id || currentView.startsWith(`${item.id}-`);
            const Icon = item.icon;

            return (
              <div key={item.id}>
                <button
                  id={`nav-item-${item.id}`}
                  onClick={() => handleNav(item.id)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                    isActive
                      ? 'bg-blue-600/10 text-blue-400'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`w-4 h-4 ${isActive ? 'text-blue-400' : 'text-slate-400'}`} />
                    <span className="text-xs font-medium">{item.label}</span>
                  </div>

                  {item.badge !== null && item.badge !== undefined && (
                    <span
                      className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                        isActive
                          ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                          : 'bg-slate-800 text-slate-300 border border-slate-700'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>

                {/* Sub-items for Estudiantes */}
                {item.subItems && isActive && (
                  <div className="ml-6 pl-2 my-1 border-l border-slate-700/60 space-y-0.5">
                    {item.subItems.map((sub) => (
                      <button
                        key={sub.id}
                        id={`nav-sub-${sub.id}`}
                        onClick={() => handleNav(sub.id)}
                        className={`block w-full text-left py-1 px-2 rounded text-xs transition-colors cursor-pointer ${
                          currentView === sub.id
                            ? 'text-blue-400 font-semibold bg-blue-900/20'
                            : 'text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        {sub.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        {/* Quick Matricula Action Button & Logout */}
        <div className="p-3 border-t border-slate-700/50 mt-auto bg-[#1a2332]/40 space-y-2">
          {hasPermission('enrollments', 'write') && onOpenQuickEnrollment && (
            <button
              id="btn-sidebar-quick-matricula"
              onClick={onOpenQuickEnrollment}
              className="w-full py-2 px-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer"
            >
              <span>+</span>
              <span>Nueva Matrícula</span>
            </button>
          )}

          <button
            id="btn-sidebar-logout"
            onClick={logout}
            className="w-full flex items-center justify-center gap-2 py-1.5 px-3 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800/60 text-xs font-medium transition-colors cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Cerrar Sesión</span>
          </button>
        </div>
      </aside>
    </>
  );
};

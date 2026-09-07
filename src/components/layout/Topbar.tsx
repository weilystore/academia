import React, { useState } from 'react';
import {
  Menu,
  Search,
  Bell,
  CheckCircle,
  AlertTriangle,
  Info,
  Shield,
  LogOut,
  Sparkles,
  Check,
  Key,
  ChevronDown
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { ChangePasswordModal } from '../users/ChangePasswordModal';

interface TopbarProps {
  onToggleSidebar?: () => void;
  onOpenMobileSidebar?: () => void;
  onOpenSearch?: () => void;
  onOpenGlobalSearch?: () => void;
  currentView?: string;
  setCurrentView?: (view: string) => void;
  onOpenQuickEnrollment?: () => void;
}

export const Topbar: React.FC<TopbarProps> = ({
  onToggleSidebar,
  onOpenMobileSidebar,
  onOpenSearch,
  onOpenGlobalSearch,
  currentView = 'dashboard',
  setCurrentView,
  onOpenQuickEnrollment
}) => {
  const { currentUser, logout } = useAuth();
  const { notifications, markNotificationAsRead } = useData();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);

  const toggleSidebarHandler = onOpenMobileSidebar || onToggleSidebar;
  const searchHandler = onOpenGlobalSearch || onOpenSearch;

  const unreadCount = notifications.filter(n => !n.read).length;

  const viewTitles: Record<string, string> = {
    dashboard: 'Resumen General',
    students: 'Gestión de Estudiantes',
    'students-all': 'Todos los Estudiantes',
    'students-activos': 'Estudiantes Activos',
    'students-prospectos': 'Estudiantes Prospectos',
    'students-graduados': 'Estudiantes Graduados',
    enrollments: 'Matrículas y Admisiones',
    courses: 'Catálogo de Cursos',
    groups: 'Grupos y Horarios',
    attendance: 'Control de Asistencia',
    grades: 'Registro de Calificaciones',
    payments: 'Gestión Financiera y Pagos',
    whatsapp: 'Bandeja WhatsApp Cloud API',
    reports: 'Reportes y Estadísticas',
    documents: 'Repositorio de Documentos',
    users: 'Control de Usuarios y Roles',
    audit: 'Bitácora de Auditoría del Sistema',
    'ai-assistant': 'Asistente IA (Gemini)',
    settings: 'Configuración de la Academia'
  };

  const currentTitle = viewTitles[currentView] || 'Millennium Academy';

  return (
    <header className="sticky top-0 z-30 h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 sm:px-6 lg:px-8">
      {/* Left section: Hamburger & Title */}
      <div className="flex items-center gap-3">
        {toggleSidebarHandler && (
          <button
            id="btn-topbar-toggle-sidebar"
            onClick={toggleSidebarHandler}
            className="lg:hidden p-2 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
            aria-label="Abrir menú de navegación"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}

        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-white p-0.5 border border-slate-200 shadow-2xs flex items-center justify-center overflow-hidden shrink-0 lg:hidden">
            <img
              src="/millennium-academy-logo.jpg"
              alt="Millennium Academy"
              className="w-full h-full object-contain"
              referrerPolicy="no-referrer"
            />
          </div>
          <div>
            <h2 className="font-bold text-slate-900 text-base sm:text-lg leading-tight">
              {currentTitle}
            </h2>
            <p className="text-xs text-slate-400 hidden sm:block">
              Millennium Academy &bull; Ciclo 2026
            </p>
          </div>
        </div>
      </div>

      {/* Middle & Right section: Search & Actions */}
      <div className="flex items-center gap-3 sm:gap-5">
        {/* Global Search box */}
        <div
          id="btn-topbar-global-search"
          onClick={searchHandler}
          className="flex items-center bg-slate-100 rounded-lg px-3 py-1.5 w-44 sm:w-72 lg:w-96 border border-transparent focus-within:border-blue-300 focus-within:bg-white transition-all cursor-pointer"
        >
          <Search className="w-4 h-4 text-slate-400 mr-2 shrink-0" />
          <input
            type="text"
            readOnly
            placeholder="Buscar estudiantes, matrículas o cursos..."
            className="bg-transparent border-none text-xs sm:text-sm outline-hidden w-full text-slate-600 placeholder:text-slate-400 cursor-pointer"
          />
          <kbd className="hidden md:inline-block px-1.5 py-0.5 text-[10px] font-semibold bg-white border border-slate-200 rounded text-slate-400 shadow-2xs shrink-0">
            Ctrl K
          </kbd>
        </div>

        {/* Action icons & CTA */}
        <div className="flex items-center gap-3">
          {/* WhatsApp Quick Link */}
          {setCurrentView && (
            <button
              id="btn-topbar-wa-status"
              onClick={() => setCurrentView('whatsapp')}
              className="hidden md:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 text-xs font-medium transition-colors cursor-pointer"
              title="Bandeja WhatsApp Cloud"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              <span>WhatsApp</span>
            </button>
          )}

          {/* Notifications Dropdown */}
          <div className="relative">
            <div
              id="btn-topbar-notifications"
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 cursor-pointer transition-colors"
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full"></span>
              )}
            </div>

            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-xl border border-slate-200 z-50 overflow-hidden">
                <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                  <h3 className="font-bold text-xs uppercase tracking-wider text-slate-500">
                    Notificaciones
                  </h3>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700">
                    {unreadCount} nuevas
                  </span>
                </div>

                <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                  {notifications.length === 0 ? (
                    <p className="p-4 text-center text-xs text-slate-400">No hay notificaciones</p>
                  ) : (
                    notifications.map(n => (
                      <div
                        key={n.id}
                        onClick={() => {
                          markNotificationAsRead(n.id);
                          if (n.linkModule && setCurrentView) setCurrentView(n.linkModule);
                          setShowNotifications(false);
                        }}
                        className={`p-3 text-xs flex gap-3 hover:bg-slate-50 cursor-pointer transition-colors ${
                          !n.read ? 'bg-blue-50/30' : ''
                        }`}
                      >
                        <div className="mt-0.5">
                          {n.type === 'warning' && <AlertTriangle className="w-4 h-4 text-amber-500" />}
                          {n.type === 'info' && <Info className="w-4 h-4 text-blue-500" />}
                          {n.type === 'success' && <CheckCircle className="w-4 h-4 text-emerald-500" />}
                          {n.type === 'alert' && <Shield className="w-4 h-4 text-rose-500" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <p className={`font-semibold ${!n.read ? 'text-slate-900' : 'text-slate-700'}`}>
                              {n.title}
                            </p>
                            <span className="text-[10px] text-slate-400">
                              {new Date(n.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          <p className="text-slate-500 mt-0.5 line-clamp-2 text-[11px]">
                            {n.message}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <div className="p-2.5 border-t border-slate-100 bg-slate-50 text-center">
                  <button
                    onClick={() => setShowNotifications(false)}
                    className="text-xs text-slate-500 hover:text-slate-800 font-semibold cursor-pointer"
                  >
                    Cerrar
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* User Profile Pill & Dropdown */}
          {currentUser && (
            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-2 pl-1 pr-2.5 py-1 rounded-full bg-slate-100 hover:bg-slate-200/80 transition-colors cursor-pointer border border-slate-200/60"
                title={`Perfil: ${currentUser.displayName} (${currentUser.role})`}
              >
                <div className="w-7 h-7 rounded-full bg-slate-800 text-white font-bold text-[10px] flex items-center justify-center overflow-hidden border border-white shadow-2xs shrink-0">
                  {currentUser.photoUrl ? (
                    <img
                      src={currentUser.photoUrl}
                      alt={currentUser.displayName}
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    (currentUser.displayName || 'US').slice(0, 2).toUpperCase()
                  )}
                </div>
                <div className="hidden md:block text-left">
                  <span className="text-xs font-bold text-slate-800 block leading-tight truncate max-w-[100px]">
                    {currentUser.displayName}
                  </span>
                  <span className="text-[9px] font-black text-purple-700 block uppercase leading-none">
                    {currentUser.role}
                  </span>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden sm:block" />
              </button>

              {/* User Dropdown Menu */}
              {showUserMenu && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setShowUserMenu(false)}
                  ></div>
                  <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-slate-200/80 py-2 z-50 animate-in fade-in zoom-in-95">
                    <div className="px-4 py-2 border-b border-slate-100">
                      <p className="text-xs font-bold text-slate-900 truncate">{currentUser.displayName}</p>
                      <p className="text-[11px] text-slate-500 truncate">{currentUser.email}</p>
                      <span className="inline-block mt-1 px-2 py-0.5 rounded bg-purple-100 text-purple-900 text-[10px] font-extrabold uppercase">
                        Rol: {currentUser.role}
                      </span>
                    </div>

                    <div className="py-1">
                      <button
                        onClick={() => {
                          setShowUserMenu(false);
                          setIsChangePasswordOpen(true);
                        }}
                        className="w-full px-4 py-2 text-left text-xs font-semibold text-slate-700 hover:bg-amber-50 hover:text-amber-800 flex items-center gap-2 cursor-pointer transition-colors"
                      >
                        <Key className="w-4 h-4 text-amber-600" />
                        <span>Cambiar mi Contraseña</span>
                      </button>

                      {currentUser.role === 'SUPERADMIN' && setCurrentView && (
                        <button
                          onClick={() => {
                            setShowUserMenu(false);
                            setCurrentView('users');
                          }}
                          className="w-full px-4 py-2 text-left text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-2 cursor-pointer transition-colors"
                        >
                          <Shield className="w-4 h-4 text-purple-600" />
                          <span>Gestión de Usuarios y Roles</span>
                        </button>
                      )}
                    </div>

                    <div className="pt-1 border-t border-slate-100">
                      <button
                        onClick={() => {
                          setShowUserMenu(false);
                          logout();
                        }}
                        className="w-full px-4 py-2 text-left text-xs font-semibold text-rose-600 hover:bg-rose-50 flex items-center gap-2 cursor-pointer transition-colors"
                      >
                        <LogOut className="w-4 h-4 text-rose-600" />
                        <span>Cerrar Sesión</span>
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Primary Action Button: + Nueva Matrícula */}
          {onOpenQuickEnrollment && (
            <button
              id="btn-topbar-quick-matricula"
              onClick={onOpenQuickEnrollment}
              className="bg-blue-600 text-white px-3.5 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold hover:bg-blue-700 transition-colors shadow-xs flex items-center gap-1.5 cursor-pointer"
            >
              <span>+</span>
              <span>Nueva Matrícula</span>
            </button>
          )}
        </div>
      </div>

      {/* Change Password Modal accessible globally */}
      {currentUser && (
        <ChangePasswordModal
          isOpen={isChangePasswordOpen}
          onClose={() => setIsChangePasswordOpen(false)}
          targetUser={currentUser}
        />
      )}
    </header>
  );
};

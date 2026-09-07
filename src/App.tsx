/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { DataProvider, useData } from './context/DataContext';
import { Sidebar } from './components/layout/Sidebar';
import { Topbar } from './components/layout/Topbar';
import { GlobalSearchModal } from './components/layout/GlobalSearchModal';
import { LoginView } from './components/auth/LoginView';

// Views
import { DashboardView } from './components/dashboard/DashboardView';
import { StudentsView } from './components/students/StudentsView';
import { CoursesView } from './components/courses/CoursesView';
import { GroupsView } from './components/courses/GroupsView';
import { EnrollmentsView } from './components/enrollments/EnrollmentsView';
import { PaymentsView } from './components/payments/PaymentsView';
import { AttendanceView } from './components/attendance/AttendanceView';
import { GradesView } from './components/grades/GradesView';
import { WhatsAppInboxView } from './components/whatsapp/WhatsAppInboxView';
import { AIAssistantView } from './components/ai/AIAssistantView';
import { UsersView } from './components/users/UsersView';
import { AuditView } from './components/audit/AuditView';
import { ReportsView } from './components/reports/ReportsView';
import { DocumentsView } from './components/documents/DocumentsView';
import { SettingsView } from './components/settings/SettingsView';

// Quick Modals
import { EnrollmentFormModal } from './components/enrollments/EnrollmentFormModal';
import { PaymentFormModal } from './components/payments/PaymentFormModal';
import { Student } from './types';

const MainAppLayout: React.FC = () => {
  const { currentUser, loading } = useAuth();
  const [currentView, setCurrentView] = useState('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  // Global quick action modals
  const [isQuickEnrollmentOpen, setIsQuickEnrollmentOpen] = useState(false);
  const [quickEnrollmentStudent, setQuickEnrollmentStudent] = useState<Student | null>(null);

  const [isQuickPaymentOpen, setIsQuickPaymentOpen] = useState(false);
  const [quickPaymentStudent, setQuickPaymentStudent] = useState<Student | null>(null);

  // Keyboard shortcut Ctrl+K or Cmd+K for global search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-400"></div>
      </div>
    );
  }

  if (!currentUser) {
    return <LoginView />;
  }

  const handleOpenQuickEnrollment = (student?: Student) => {
    setQuickEnrollmentStudent(student || null);
    setIsQuickEnrollmentOpen(true);
  };

  const handleOpenQuickPayment = (student?: Student) => {
    setQuickPaymentStudent(student || null);
    setIsQuickPaymentOpen(true);
  };

  return (
    <div className="flex h-screen bg-[#F8FAFC] text-slate-900 font-sans antialiased overflow-hidden">
      {/* Responsive Left Navigation Sidebar */}
      <Sidebar
        currentView={currentView}
        onSelectView={view => {
          setCurrentView(view);
          setIsSidebarOpen(false);
        }}
        isOpenMobile={isSidebarOpen}
        onCloseMobile={() => setIsSidebarOpen(false)}
        onOpenQuickEnrollment={() => handleOpenQuickEnrollment()}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        {/* Topbar */}
        <Topbar
          onOpenMobileSidebar={() => setIsSidebarOpen(true)}
          onOpenGlobalSearch={() => setIsSearchOpen(true)}
          currentView={currentView}
          setCurrentView={setCurrentView}
          onOpenQuickEnrollment={() => handleOpenQuickEnrollment()}
        />

        {/* Dynamic Viewport */}
        <main className={`flex-1 overflow-y-auto ${currentView === 'whatsapp' ? 'p-2 sm:p-4 lg:p-5' : 'p-4 sm:p-6 lg:p-8'}`}>
          <div className={currentView === 'whatsapp' ? 'w-full max-w-[1700px] mx-auto' : 'max-w-7xl mx-auto'}>
            {currentView === 'dashboard' && (
              <DashboardView
                onNavigateTo={setCurrentView}
                onOpenQuickEnrollment={handleOpenQuickEnrollment}
                onOpenQuickPayment={handleOpenQuickPayment}
              />
            )}

            {currentView === 'students' && (
              <StudentsView
                onOpenEnrollmentForStudent={handleOpenQuickEnrollment}
                onOpenPaymentForStudent={handleOpenQuickPayment}
              />
            )}

            {currentView === 'courses' && (
              <CoursesView
                onOpenGroupsForCourse={() => setCurrentView('groups')}
                onOpenQuickEnrollment={() => handleOpenQuickEnrollment()}
              />
            )}

            {currentView === 'groups' && <GroupsView />}

            {currentView === 'enrollments' && <EnrollmentsView />}

            {currentView === 'payments' && <PaymentsView />}

            {currentView === 'attendance' && <AttendanceView />}

            {currentView === 'grades' && <GradesView />}

            {currentView === 'whatsapp' && (
              <WhatsAppInboxView
                onOpenQuickEnrollmentForStudent={handleOpenQuickEnrollment}
                onOpenQuickPaymentForStudent={handleOpenQuickPayment}
              />
            )}

            {currentView === 'ai' && <AIAssistantView />}

            {currentView === 'users' && <UsersView />}

            {currentView === 'audit' && <AuditView />}

            {currentView === 'reports' && <ReportsView />}

            {currentView === 'documents' && <DocumentsView />}

            {currentView === 'settings' && <SettingsView />}
          </div>
        </main>
      </div>

      {/* Global Search Modal (Ctrl + K) */}
      <GlobalSearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onNavigate={view => {
          setCurrentView(view);
          setIsSearchOpen(false);
        }}
      />

      {/* Quick Enrollment Modal */}
      <EnrollmentFormModal
        isOpen={isQuickEnrollmentOpen}
        onClose={() => {
          setIsQuickEnrollmentOpen(false);
          setQuickEnrollmentStudent(null);
        }}
        preselectedStudent={quickEnrollmentStudent}
      />

      {/* Quick Payment Modal */}
      <PaymentFormModal
        isOpen={isQuickPaymentOpen}
        onClose={() => {
          setIsQuickPaymentOpen(false);
          setQuickPaymentStudent(null);
        }}
        preselectedStudent={quickPaymentStudent}
      />
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <DataProvider>
        <MainAppLayout />
      </DataProvider>
    </AuthProvider>
  );
}

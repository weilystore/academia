import React from 'react';
import {
  Users,
  UserCheck,
  UserPlus,
  GraduationCap,
  BookOpen,
  Calendar,
  AlertCircle,
  TrendingUp,
  MessageSquare,
  ArrowUpRight,
  ShieldAlert,
  Clock,
  ChevronRight
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  CartesianGrid
} from 'recharts';
import { useData } from '../../context/DataContext';

interface DashboardViewProps {
  onNavigate?: (view: string) => void;
  onNavigateTo?: (view: string) => void;
  onOpenQuickEnrollment?: () => void;
  onOpenQuickPayment?: (student?: any) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  onNavigate,
  onNavigateTo,
  onOpenQuickEnrollment,
  onOpenQuickPayment: _onOpenQuickPayment
}) => {
  const nav = onNavigateTo || onNavigate || (() => {});
  const {
    students,
    courses,
    enrollments,
    payments,
    auditLogs,
    settings,
    whatsappConversations
  } = useData();

  // Metrics Calculations
  const totalStudents = students.length;
  const activeStudents = students.filter(s => s.status === 'Activo').length;
  
  // New students (e.g. within current/last 30 days)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const newStudents = students.filter(s => new Date(s.createdAt) >= thirtyDaysAgo).length;

  const activeEnrollments = enrollments.filter(e => e.status === 'Activa').length;
  const activeCourses = courses.filter(c => c.status === 'En curso').length;
  const upcomingCourses = courses.filter(c => c.status === 'Inscripciones abiertas' || c.status === 'Planificado').length;

  // Calculate pending balances: total course cost for active enrollments minus payments made for them
  const totalEnrollmentsCost = enrollments
    .filter(e => e.status === 'Activa')
    .reduce((sum, e) => sum + (e.total || 0), 0);
  const totalPaymentsReceived = payments.reduce((sum, p) => sum + (p.total || 0), 0);
  const pendingPaymentsBalance = Math.max(0, totalEnrollmentsCost - totalPaymentsReceived);

  // Monthly income (payments made in current month)
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  const monthlyIncome = payments
    .filter(p => {
      const pDate = new Date(p.date || p.createdAt);
      return pDate.getMonth() === currentMonth && pDate.getFullYear() === currentYear;
    })
    .reduce((sum, p) => sum + (p.total || 0), 0);

  // Unread WhatsApp messages
  const totalUnreadWa = whatsappConversations.reduce((acc, c) => acc + (c.unreadCount || 0), 0);

  // Formatted date string in Spanish (e.g. "Lunes, 24 de Mayo, 2026")
  const rawDateStr = new Intl.DateTimeFormat('es-ES', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(new Date());
  const todayDateString = rawDateStr.charAt(0).toUpperCase() + rawDateStr.slice(1);

  // Helper for relative time in Spanish
  const formatTimeAgo = (dateStr: string) => {
    const diffMs = Date.now() - new Date(dateStr).getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return 'Justo ahora';
    if (diffMins < 60) return `Hace ${diffMins} min`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `Hace ${diffHours} h`;
    return new Date(dateStr).toLocaleDateString([], { day: 'numeric', month: 'short' });
  };

  // Recent activity from real audit logs
  const displayActivities = auditLogs.map(l => ({
    id: l.id,
    studentName: l.userName || 'Usuario',
    action: l.action,
    type: l.targetModule,
    detail: l.description,
    amount: l.targetModule === 'Pagos' ? `${settings.currencySymbol} ${l.description.match(/\d+(\.\d+)?/)?.[0] || '0.00'}` : '-',
    date: l.timestamp
  })).slice(0, 5);

  // 1. Dynamic Chart: Matrículas por Mes (Últimos 6 meses reales)
  const monthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
  const now = new Date();
  const last6Months = Array.from({ length: 6 }).map((_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
    return {
      monthIdx: d.getMonth(),
      year: d.getFullYear(),
      name: monthNames[d.getMonth()]
    };
  });

  const enrollmentsByMonth = last6Months.map(m => {
    const count = enrollments.filter(e => {
      const d = new Date(e.createdAt || e.enrollmentDate || '');
      return d.getMonth() === m.monthIdx && d.getFullYear() === m.year;
    }).length;
    return { mes: m.name, matriculas: count };
  });

  // 2. Dynamic Chart: Estudiantes por Curso
  const studentsByCourseData = courses.slice(0, 5).map(c => ({
    nombre: c.code,
    estudiantes: enrollments.filter(e => e.courseId === c.id).length || c.enrolledCount || 0,
    nombreCompleto: c.name
  }));

  // 3. Dynamic Chart: Ingresos por Mes
  const incomeByMonthData = last6Months.map(m => {
    const total = payments.filter(p => {
      const d = new Date(p.date || p.createdAt || '');
      return d.getMonth() === m.monthIdx && d.getFullYear() === m.year;
    }).reduce((sum, p) => sum + (p.total || 0), 0);
    return { mes: m.name, ingresos: total };
  });

  // 4. Dynamic Chart: Distribución por Estado
  const statusCounts = {
    Activo: students.filter(s => s.status === 'Activo').length,
    Prospecto: students.filter(s => s.status === 'Prospecto').length,
    Preinscrito: students.filter(s => s.status === 'Preinscrito').length,
    Graduado: students.filter(s => s.status === 'Graduado').length,
    Inactivo: students.filter(s => s.status === 'Inactivo' || s.status === 'Retirado').length,
  };

  const statusPieData = [
    { name: 'Activos', value: statusCounts.Activo, color: '#2563eb' },
    { name: 'Prospectos', value: statusCounts.Prospecto, color: '#38bdf8' },
    { name: 'Preinscritos', value: statusCounts.Preinscrito, color: '#f59e0b' },
    { name: 'Graduados', value: statusCounts.Graduado, color: '#10b981' },
    { name: 'Inactivos', value: statusCounts.Inactivo, color: '#94a3b8' }
  ];

  return (
    <div className="space-y-6 pb-12">
      {/* Header Area matching Clean Minimalism */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Resumen General</h1>
          <p className="text-slate-500 text-sm mt-0.5">Bienvenido de nuevo. Aquí está lo que está pasando hoy.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-widest bg-white px-3 py-2 rounded-lg border border-slate-200 shadow-2xs">
            {todayDateString}
          </div>
          {onOpenQuickEnrollment && (
            <button
              id="btn-dashboard-new-matricula-cta"
              onClick={onOpenQuickEnrollment}
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs px-3.5 py-2 rounded-lg shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <span>+</span>
              <span>Nueva Matrícula</span>
            </button>
          )}
        </div>
      </div>

      {/* KPI Cards (4 Column Grid matching Clean Minimalism) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Card 1: Estudiantes Totales */}
        <div
          onClick={() => nav('students')}
          className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:border-slate-300 transition-all cursor-pointer"
        >
          <p className="text-xs font-bold text-slate-400 uppercase mb-1">Estudiantes Totales</p>
          <p className="text-3xl font-bold text-slate-900">{totalStudents.toLocaleString()}</p>
          <div className="mt-2 text-xs font-medium text-slate-500">{activeStudents} activos actualmente</div>
        </div>

        {/* Card 2: Matrículas Activas */}
        <div
          onClick={() => nav('enrollments')}
          className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:border-slate-300 transition-all cursor-pointer"
        >
          <p className="text-xs font-bold text-slate-400 uppercase mb-1">Matrículas Activas</p>
          <p className="text-3xl font-bold text-blue-600">{activeEnrollments}</p>
          <div className="mt-2 text-xs font-medium text-slate-500">{activeCourses} {activeCourses === 1 ? 'curso en progreso' : 'cursos en progreso'}</div>
        </div>

        {/* Card 3: Ingresos del Mes */}
        <div
          onClick={() => nav('payments')}
          className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:border-slate-300 transition-all cursor-pointer"
        >
          <p className="text-xs font-bold text-slate-400 uppercase mb-1">Ingresos del Mes</p>
          <div className="flex items-baseline gap-1">
            <span className="text-lg font-bold text-slate-500">{settings.currencySymbol}</span>
            <p className="text-3xl font-bold text-slate-900">{monthlyIncome.toLocaleString()}</p>
          </div>
          <div className="mt-2 text-xs font-medium text-slate-500">{payments.length} {payments.length === 1 ? 'pago registrado' : 'pagos registrados'}</div>
        </div>

        {/* Card 4: Pagos Pendientes */}
        <div
          onClick={() => nav('payments')}
          className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:border-slate-300 transition-all cursor-pointer"
        >
          <p className="text-xs font-bold text-slate-400 uppercase mb-1">Pagos Pendientes</p>
          <p className="text-3xl font-bold text-amber-500">
            {pendingPaymentsBalance > 0 ? enrollments.filter(e => e.status === 'Activa' && (e.total || 0) > (payments.filter(p => p.studentId === e.studentId).reduce((s, p) => s + (p.total || 0), 0))).length : 0}
          </p>
          <div className="mt-2 text-xs font-medium text-amber-600">
            {pendingPaymentsBalance > 0 ? `${settings.currencySymbol} ${pendingPaymentsBalance.toLocaleString()} por cobrar` : 'Al día con pagos'}
          </div>
        </div>
      </div>

      {/* Split Section: Recent Activity Table + WhatsApp Inbox Widget */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activity Table (2 Cols) */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-xs flex flex-col min-h-[340px]">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-bold text-sm uppercase tracking-wider text-slate-500">Actividad Reciente</h3>
            <button
              onClick={() => nav('audit')}
              className="text-xs font-bold text-blue-600 hover:underline cursor-pointer"
            >
              Ver todo
            </button>
          </div>
          <div className="flex-1 overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr>
                  <th className="px-5 py-3 text-[10px] font-bold text-slate-400 uppercase">Estudiante / Usuario</th>
                  <th className="px-5 py-3 text-[10px] font-bold text-slate-400 uppercase">Acción</th>
                  <th className="px-5 py-3 text-[10px] font-bold text-slate-400 uppercase">Detalle / Monto</th>
                  <th className="px-5 py-3 text-[10px] font-bold text-slate-400 uppercase">Fecha</th>
                </tr>
              </thead>
              <tbody className="text-sm divide-y divide-slate-100">
                {displayActivities.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-5 py-12 text-center text-slate-400 text-xs">
                      No hay actividades recientes registradas en el sistema.
                    </td>
                  </tr>
                ) : (
                  displayActivities.map(act => (
                    <tr key={act.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-5 py-3 font-medium text-slate-800">{act.studentName}</td>
                      <td className="px-5 py-3">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                          act.type === 'Pagos' ? 'bg-emerald-100 text-emerald-800' :
                          act.type === 'Matrículas' ? 'bg-blue-100 text-blue-800' :
                          'bg-slate-100 text-slate-800'
                        }`}>
                          {act.action}
                        </span>
                      </td>
                      <td className="px-5 py-3 font-mono text-slate-600 text-xs">
                        {act.amount !== '-' ? act.amount : act.detail}
                      </td>
                      <td className="px-5 py-3 text-slate-400 text-xs">
                        {formatTimeAgo(act.date)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* WhatsApp Inbox Widget (1 Col) */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs flex flex-col min-h-[340px] overflow-hidden">
          <div className="p-5 bg-emerald-600 text-white flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-white" />
              <h3 className="font-bold text-sm uppercase tracking-wider text-white">WhatsApp Inbox</h3>
            </div>
            <span className="bg-white text-emerald-600 px-2 py-0.5 rounded text-[10px] font-black">
              {totalUnreadWa > 0 ? `${totalUnreadWa} NUEVOS` : 'AL DÍA'}
            </span>
          </div>

          <div className="divide-y divide-slate-100 flex-1 overflow-y-auto">
            {whatsappConversations.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs flex flex-col items-center justify-center h-48">
                <MessageSquare className="w-8 h-8 text-slate-300 mb-2" />
                <p className="font-semibold text-slate-700">Bandeja al día</p>
                <p className="text-[11px] text-slate-400 mt-1">Los nuevos mensajes recibidos aparecerán aquí en tiempo real.</p>
              </div>
            ) : (
              whatsappConversations.slice(0, 3).map((conv: any) => (
                <div
                  key={conv.id}
                  onClick={() => nav('whatsapp')}
                  className="p-4 hover:bg-slate-50 transition-colors cursor-pointer flex items-center gap-3"
                >
                  <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-600 text-xs shrink-0">
                    {conv.name?.slice(0, 2).toUpperCase() || 'WA'}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-bold text-slate-800 truncate">{conv.name}</p>
                      <span className="text-[10px] text-slate-400">
                        {formatTimeAgo(conv.lastMessageTimestamp)}
                      </span>
                    </div>
                    <p className="text-slate-500 text-xs truncate mt-0.5">{conv.lastMessage}</p>
                  </div>
                  {conv.unreadCount > 0 && (
                    <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0"></span>
                  )}
                </div>
              ))
            )}
          </div>

          <div className="mt-auto p-3 text-center border-t border-slate-100 bg-slate-50/50">
            <button
              onClick={() => nav('whatsapp')}
              className="text-xs font-bold text-slate-500 hover:text-emerald-600 uppercase tracking-widest transition-colors cursor-pointer"
            >
              Ir al Centro de Mensajes
            </button>
          </div>
        </div>
      </div>

      {/* Secondary Metrics Row (Cursos, Saldos, etc.) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div onClick={() => nav('courses')} className="p-4 rounded-xl bg-white border border-slate-200 shadow-2xs cursor-pointer hover:border-slate-300 transition-colors">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">Cursos Activos</span>
          <span className="text-xl font-bold text-slate-900">{activeCourses}</span>
          <p className="text-[11px] text-slate-400 mt-0.5">En impartición</p>
        </div>
        <div onClick={() => nav('courses')} className="p-4 rounded-xl bg-white border border-slate-200 shadow-2xs cursor-pointer hover:border-slate-300 transition-colors">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">Próximos Cursos</span>
          <span className="text-xl font-bold text-slate-900">{upcomingCourses}</span>
          <p className="text-[11px] text-slate-400 mt-0.5">Inscripción abierta</p>
        </div>
        <div onClick={() => nav('students-activos')} className="p-4 rounded-xl bg-white border border-slate-200 shadow-2xs cursor-pointer hover:border-slate-300 transition-colors">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">Estudiantes Activos</span>
          <span className="text-xl font-bold text-blue-600">{activeStudents}</span>
          <p className="text-[11px] text-slate-400 mt-0.5">Cursando programas</p>
        </div>
        <div onClick={() => nav('payments')} className="p-4 rounded-xl bg-white border border-slate-200 shadow-2xs cursor-pointer hover:border-slate-300 transition-colors">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">Saldos por Cobrar</span>
          <span className="text-xl font-bold text-slate-900">{settings.currencySymbol} {pendingPaymentsBalance.toLocaleString()}</span>
          <p className="text-[11px] text-slate-400 mt-0.5">Cuotas diferidas</p>
        </div>
      </div>

      {/* Main Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart 1: Matrículas por Mes */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-slate-800 text-sm">Matrículas por Mes</h3>
              <p className="text-xs text-slate-400">Evolución de admisiones ciclo 2025 - 2026</p>
            </div>
            <span className="text-xs font-bold px-2 py-1 bg-blue-50 text-blue-700 rounded-lg">
              Tendencia +
            </span>
          </div>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={enrollmentsByMonth}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="mes" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <Tooltip
                  formatter={(val: any) => [`${val} alumnos`, 'Matrículas']}
                  contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '10px', color: '#0f172a', fontSize: '12px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Bar dataKey="matriculas" fill="#2563eb" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Estudiantes por Curso */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-slate-800 text-sm">Estudiantes por Curso</h3>
              <p className="text-xs text-slate-400">Distribución de alumnos inscritos</p>
            </div>
            <span className="text-xs font-bold px-2 py-1 bg-slate-100 text-slate-700 rounded-lg">
              {courses.length} Cursos
            </span>
          </div>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={studentsByCourseData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                <XAxis type="number" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <YAxis dataKey="nombre" type="category" width={80} tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <Tooltip
                  formatter={(val: any, _name: any, item: any) => [`${val} estudiantes`, item.payload.nombreCompleto]}
                  contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '10px', color: '#0f172a', fontSize: '12px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Bar dataKey="estudiantes" fill="#3b82f6" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 3: Distribución por Estado */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h3 className="font-bold text-slate-800 text-sm">Distribución de Estudiantes</h3>
              <p className="text-xs text-slate-400">Por estado académico y prospectos</p>
            </div>
          </div>
          <div className="h-44">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusPieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={45}
                  outerRadius={70}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {statusPieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(val: any) => [`${val} estudiantes`, 'Total']}
                  contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '10px', color: '#0f172a', fontSize: '12px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-2 gap-1.5 pt-2 border-t border-slate-100 text-[11px]">
            {statusPieData.map(item => (
              <div key={item.name} className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                <span className="text-slate-600 truncate">{item.name}:</span>
                <span className="font-bold text-slate-800">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Area Chart: Ingresos por Mes */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-bold text-slate-800 text-sm">Ingresos Financieros por Mes ({settings.currencySymbol})</h3>
            <p className="text-xs text-slate-400">Cobranza acumulada por matrículas y cuotas</p>
          </div>
          <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-lg">
            Total 6 meses: L 1,020,000+
          </span>
        </div>
        <div className="h-60">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={incomeByMonthData}>
              <defs>
                <linearGradient id="incomeGradClean" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="mes" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
              <YAxis
                tick={{ fontSize: 11, fill: '#64748b' }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(val) => `L ${val / 1000}k`}
              />
              <Tooltip
                formatter={(val: any) => [`L ${val.toLocaleString()}`, 'Ingresos']}
                contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '10px', color: '#0f172a', fontSize: '12px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
              />
              <Area
                type="monotone"
                dataKey="ingresos"
                stroke="#10b981"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#incomeGradClean)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

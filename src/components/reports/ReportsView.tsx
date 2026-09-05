import React, { useState } from 'react';
import {
  BarChart3,
  Download,
  Calendar,
  FileSpreadsheet,
  TrendingUp,
  DollarSign,
  Users,
  GraduationCap
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { useData } from '../../context/DataContext';

export const ReportsView: React.FC = () => {
  const { students, courses, enrollments, payments, settings } = useData();
  const [reportPeriod, setReportPeriod] = useState('2026');

  // Revenue by course calculation
  const courseRevenueMap: Record<string, number> = {};
  courses.forEach(c => {
    courseRevenueMap[c.name] = 0;
  });

  enrollments.forEach(e => {
    if (courseRevenueMap[e.courseName] !== undefined) {
      courseRevenueMap[e.courseName] += e.total;
    } else {
      courseRevenueMap[e.courseName] = e.total;
    }
  });

  const revenueByCourseData = Object.entries(courseRevenueMap).map(([name, total]) => ({
    name: name.length > 20 ? name.slice(0, 18) + '...' : name,
    total
  }));

  // Student status distribution
  const statusCounts = {
    Activo: students.filter(s => s.status === 'Activo').length,
    Inactivo: students.filter(s => s.status === 'Inactivo').length,
    Graduado: students.filter(s => s.status === 'Graduado').length,
    Retirado: students.filter(s => s.status === 'Retirado').length
  };

  const statusPieData = [
    { name: 'Activos', value: statusCounts.Activo, color: '#10b981' },
    { name: 'Inactivos', value: statusCounts.Inactivo, color: '#64748b' },
    { name: 'Graduados', value: statusCounts.Graduado, color: '#3b82f6' },
    { name: 'Retirados', value: statusCounts.Retirado, color: '#ef4444' }
  ];

  const exportStudentsReport = () => {
    const headers = ['DNI', 'Nombres', 'Apellidos', 'Teléfono', 'Email', 'Estado', 'Curso Actual', 'Saldo Pendiente'];
    const rows = students.map(s => {
      const studentEnr = enrollments.filter(e => e.studentId === s.id);
      const studentPay = payments.filter(p => p.studentId === s.id);
      const totalEnr = studentEnr.reduce((acc, curr) => acc + curr.total, 0);
      const totalPay = studentPay.reduce((acc, curr) => acc + curr.total, 0);
      const bal = Math.max(0, totalEnr - totalPay);

      return [
        s.identityNumber,
        `"${s.firstName}"`,
        `"${s.lastName}"`,
        s.phone,
        s.email,
        s.status,
        `"${s.currentCourse || 'Ninguno'}"`,
        bal
      ];
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `reporte_alumnos_academia_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportFinancialReport = () => {
    const headers = ['Recibo', 'Fecha', 'Estudiante', 'Concepto', 'Método', 'Total'];
    const rows = payments.map(p => [
      p.receiptNumber,
      p.date,
      `"${p.studentName}"`,
      `"${p.concept}"`,
      `"${p.method}"`,
      p.total
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `reporte_caja_aranceles_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header Banner */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-200">
              INTELIGENCIA DE GESTIÓN
            </span>
            <span className="text-slate-400 text-xs">&bull; Reportes e Indicadores Clave</span>
          </div>
          <h2 className="text-xl font-black tracking-tight text-slate-900">
            Reportes Estadísticos y Financieros
          </h2>
          <p className="text-slate-500 text-xs mt-0.5">
            Generación y descarga de informes de matrículas, recaudación, estados de cuenta y retención.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={exportStudentsReport}
            className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center gap-1.5 border border-slate-200 cursor-pointer transition-colors"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>Exportar Alumnos CSV</span>
          </button>
          <button
            onClick={exportFinancialReport}
            className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-amber-400 font-bold text-xs flex items-center gap-1.5 cursor-pointer transition-colors shadow-xs"
          >
            <Download className="w-4 h-4" />
            <span>Exportar Cobranza CSV</span>
          </button>
        </div>
      </div>

      {/* Visual Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue by Course */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Ingresos Facturados por Programa</h3>
              <p className="text-slate-500 text-xs">Total de matrículas por curso en {settings.currencySymbol}</p>
            </div>
            <BarChart3 className="w-4 h-4 text-amber-500" />
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={revenueByCourseData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip
                  formatter={(val: any) => [`${settings.currencySymbol} ${Number(val).toLocaleString()}`, 'Total Facturado']}
                />
                <Bar dataKey="total" fill="#f59e0b" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Status Distribution */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Distribución del Padrón Estudiantil</h3>
              <p className="text-slate-500 text-xs">Desglose por estado académico actual</p>
            </div>
            <Users className="w-4 h-4 text-blue-500" />
          </div>

          <div className="h-64 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusPieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={85}
                  paddingAngle={5}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {statusPieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

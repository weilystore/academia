import React, { useState } from 'react';
import {
  TrendingUp,
  Users,
  CheckCircle2,
  DollarSign,
  PieChart,
  BarChart3,
  Calendar,
  Download,
  ArrowDown,
  Percent,
  Award,
  BookOpen,
  UserCheck,
  AlertCircle
} from 'lucide-react';
import { useData } from '../../context/DataContext';
import { CRM_STAGE_CONFIG } from '../../data/crmData';

export const CRMConversionStats: React.FC = () => {
  const {
    whatsappContacts,
    courses,
    enrollments,
    payments
  } = useData();

  const [dateRange, setDateRange] = useState('month');

  // Stage calculations
  const totalContacts = whatsappContacts.length;
  const stageNuevo = whatsappContacts.filter(c => (c.crmStage || (c.status === 'ESTUDIANTE' ? 'matriculado' : 'nuevo')) === 'nuevo').length;
  const stageInteresado = whatsappContacts.filter(c => c.crmStage === 'interesado').length;
  const stageSeguimiento = whatsappContacts.filter(c => c.crmStage === 'seguimiento').length;
  const stagePagoPendiente = whatsappContacts.filter(c => c.crmStage === 'pago_pendiente').length;
  const stageMatriculado = whatsappContacts.filter(c => (c.crmStage || (c.status === 'ESTUDIANTE' ? 'matriculado' : 'nuevo')) === 'matriculado').length;
  const stageDescartado = whatsappContacts.filter(c => c.crmStage === 'descartado').length;

  // Funnel steps
  const funnelSteps = [
    {
      label: '1. Chats WhatsApp Entrantes',
      count: totalContacts,
      percentage: 100,
      color: 'bg-sky-500',
      textColor: 'text-sky-700',
      bgColor: 'bg-sky-50',
      borderColor: 'border-sky-200'
    },
    {
      label: '2. Prospectos Calificados / Interesados',
      count: totalContacts - stageDescartado,
      percentage: totalContacts > 0 ? Math.round(((totalContacts - stageDescartado) / totalContacts) * 100) : 0,
      color: 'bg-indigo-500',
      textColor: 'text-indigo-700',
      bgColor: 'bg-indigo-50',
      borderColor: 'border-indigo-200'
    },
    {
      label: '3. En Seguimiento Activo / Asignados',
      count: stageSeguimiento + stagePagoPendiente + stageMatriculado,
      percentage: totalContacts > 0 ? Math.round(((stageSeguimiento + stagePagoPendiente + stageMatriculado) / totalContacts) * 100) : 0,
      color: 'bg-purple-500',
      textColor: 'text-purple-700',
      bgColor: 'bg-purple-50',
      borderColor: 'border-purple-200'
    },
    {
      label: '4. Pagos y Reserva Pendiente',
      count: stagePagoPendiente + stageMatriculado,
      percentage: totalContacts > 0 ? Math.round(((stagePagoPendiente + stageMatriculado) / totalContacts) * 100) : 0,
      color: 'bg-amber-500',
      textColor: 'text-amber-700',
      bgColor: 'bg-amber-50',
      borderColor: 'border-amber-200'
    },
    {
      label: '5. Matrículas Formalizadas (Ganados)',
      count: stageMatriculado,
      percentage: totalContacts > 0 ? Math.round((stageMatriculado / totalContacts) * 100) : 0,
      color: 'bg-emerald-500',
      textColor: 'text-emerald-700',
      bgColor: 'bg-emerald-50',
      borderColor: 'border-emerald-200'
    }
  ];

  // Financial values
  const wonContacts = whatsappContacts.filter(c => (c.crmStage || (c.status === 'ESTUDIANTE' ? 'matriculado' : 'nuevo')) === 'matriculado');
  const totalRevenueGenerated = wonContacts.reduce((sum, c) => sum + (c.estimatedValue || 5500), 0);
  const avgTicket = wonContacts.length > 0 ? Math.round(totalRevenueGenerated / wonContacts.length) : 0;
  const globalConversionRate = totalContacts > 0 ? Math.round((stageMatriculado / totalContacts) * 100) : 0;

  // Breakdown by course
  const courseBreakdown = courses.map(course => {
    const contactsForCourse = whatsappContacts.filter(c => c.courseInterest === course.name);
    const matriculadosForCourse = contactsForCourse.filter(c => (c.crmStage || (c.status === 'ESTUDIANTE' ? 'matriculado' : 'nuevo')) === 'matriculado');
    const convRate = contactsForCourse.length > 0 ? Math.round((matriculadosForCourse.length / contactsForCourse.length) * 100) : 0;
    const valueGenerated = matriculadosForCourse.length * course.price;

    return {
      course,
      totalLeads: contactsForCourse.length,
      matriculados: matriculadosForCourse.length,
      convRate,
      valueGenerated
    };
  }).sort((a, b) => b.matriculados - a.matriculados);

  // Advisor performance
  const advisors = [
    'Lic. Claudia Moncada',
    'Carlos M. (Admisiones)',
    'Ing. Carlos Alvarado'
  ];

  const advisorPerformance = advisors.map(adv => {
    const contacts = whatsappContacts.filter(c => c.assignedAdvisorName === adv);
    const matriculados = contacts.filter(c => (c.crmStage || (c.status === 'ESTUDIANTE' ? 'matriculado' : 'nuevo')) === 'matriculado');
    const rate = contacts.length > 0 ? Math.round((matriculados.length / contacts.length) * 100) : 0;
    const revenue = matriculados.reduce((sum, c) => sum + (c.estimatedValue || 5000), 0);

    return {
      name: adv,
      totalContacts: contacts.length,
      matriculados: matriculados.length,
      rate,
      revenue
    };
  });

  const handleExportReport = () => {
    const rows = [
      ['Etapa', 'Contactos', 'Porcentaje'],
      ...funnelSteps.map(s => [s.label, s.count, `${s.percentage}%`]),
      [],
      ['Total Ingresos WhatsApp', `L. ${totalRevenueGenerated.toLocaleString()}`],
      ['Ticket Promedio', `L. ${avgTicket.toLocaleString()}`],
      ['Tasa Global de Conversión', `${globalConversionRate}%`]
    ];

    const csvContent = 'data:text/csv;charset=utf-8,' + rows.map(e => e.join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `reporte_crm_whatsapp_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner with KPIs */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-600">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Estadísticas Comerciales de WhatsApp</h3>
              <p className="text-xs text-slate-500">Métricas de conversión: WhatsApp → Prospecto → Matrícula Formalizada</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleExportReport}
            className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs"
          >
            <Download className="w-3.5 h-3.5" />
            Exportar Reporte Comercial (CSV)
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Tasa de Conversión</span>
            <span className="p-2 rounded-lg bg-purple-50 text-purple-600">
              <Percent className="w-4 h-4" />
            </span>
          </div>
          <p className="text-2xl font-bold text-purple-600 mt-2">{globalConversionRate}%</p>
          <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
            <span className="text-emerald-600 font-semibold font-mono">+{globalConversionRate > 20 ? 'Excelente' : 'Regular'}</span>
            de cada 100 consultas
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Ingresos WhatsApp</span>
            <span className="p-2 rounded-lg bg-emerald-50 text-emerald-600">
              <DollarSign className="w-4 h-4" />
            </span>
          </div>
          <p className="text-2xl font-bold text-slate-900 mt-2">L. {totalRevenueGenerated.toLocaleString()}</p>
          <p className="text-xs text-slate-500 mt-1">Por {stageMatriculado} matrículas cerradas</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Ticket Promedio</span>
            <span className="p-2 rounded-lg bg-blue-50 text-blue-600">
              <Award className="w-4 h-4" />
            </span>
          </div>
          <p className="text-2xl font-bold text-slate-900 mt-2">L. {avgTicket.toLocaleString()}</p>
          <p className="text-xs text-slate-500 mt-1">Por estudiante captado vía WA</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Prospectos en Curso</span>
            <span className="p-2 rounded-lg bg-amber-50 text-amber-600">
              <Users className="w-4 h-4" />
            </span>
          </div>
          <p className="text-2xl font-bold text-amber-600 mt-2">{totalContacts - stageMatriculado - stageDescartado}</p>
          <p className="text-xs text-slate-500 mt-1">En seguimiento o pago pendiente</p>
        </div>
      </div>

      {/* Visual Conversion Funnel */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs">
        <h4 className="text-sm font-bold text-slate-900 mb-1 flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-purple-600" />
          Embudo de Conversión Comercial (WhatsApp Sales Funnel)
        </h4>
        <p className="text-xs text-slate-500 mb-6">
          Flujo de conversión desde el primer mensaje de WhatsApp hasta la formalización de la matrícula y pago.
        </p>

        <div className="space-y-4 max-w-2xl mx-auto">
          {funnelSteps.map((step, idx) => (
            <div key={idx} className="relative">
              <div className={`p-4 rounded-xl border ${step.borderColor} ${step.bgColor} transition-all`}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className={`w-2.5 h-2.5 rounded-full ${step.color}`} />
                    <span className="text-xs font-bold text-slate-900">{step.label}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-slate-900">{step.count} contactos</span>
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-md ${step.color} text-white`}>
                      {step.percentage}%
                    </span>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="w-full h-3 bg-white/80 rounded-full overflow-hidden border border-slate-200">
                  <div
                    className={`h-full ${step.color} transition-all duration-500`}
                    style={{ width: `${step.percentage}%` }}
                  />
                </div>
              </div>

              {/* Connecting arrow down */}
              {idx < funnelSteps.length - 1 && (
                <div className="flex justify-center -my-1.5 relative z-10">
                  <div className="w-6 h-6 rounded-full bg-white border border-slate-300 flex items-center justify-center text-slate-400 shadow-2xs">
                    <ArrowDown className="w-3.5 h-3.5" />
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Grid: Program Breakdown & Advisor Leaderboard */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Breakdown by Course of Interest */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
          <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-4 flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-blue-600" />
            Demanda y Conversión por Programa Aduanero
          </h4>

          <div className="space-y-3.5">
            {courseBreakdown.map((item, idx) => (
              <div key={item.course.id} className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                <div className="flex items-start justify-between gap-2 mb-1">
                  <div>
                    <h5 className="text-xs font-bold text-slate-900">{item.course.name}</h5>
                    <p className="text-[11px] text-slate-500">{item.course.code} • Precio: L. {item.course.price.toLocaleString()}</p>
                  </div>
                  <span className="text-xs font-bold text-emerald-600 px-2 py-0.5 bg-emerald-50 border border-emerald-200 rounded-md">
                    {item.convRate}% conv.
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs text-slate-600 pt-2 mt-2 border-t border-slate-200">
                  <span>Prospectos: <strong className="text-slate-900">{item.totalLeads}</strong></span>
                  <span>Matrículas: <strong className="text-emerald-600">{item.matriculados}</strong></span>
                  <span>Ingresos: <strong className="text-slate-900">L. {item.valueGenerated.toLocaleString()}</strong></span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Advisor Performance Leaderboard */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
          <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-4 flex items-center gap-2">
            <UserCheck className="w-4 h-4 text-emerald-600" />
            Rendimiento por Asesor de Admisiones (WhatsApp)
          </h4>

          <div className="space-y-3">
            {advisorPerformance.map((adv, idx) => (
              <div key={adv.name} className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-slate-200 border border-slate-300 flex items-center justify-center text-xs font-bold text-slate-700">
                    {adv.name.charAt(0)}
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-slate-900">{adv.name}</h5>
                    <p className="text-[11px] text-slate-500">
                      {adv.totalContacts} contactos asignados • {adv.matriculados} ganados
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-xs font-bold text-purple-700 px-2 py-0.5 bg-purple-50 border border-purple-200 rounded-md">
                    {adv.rate}% efectividad
                  </span>
                  <p className="text-[11px] font-semibold text-slate-700 mt-1">
                    L. {adv.revenue.toLocaleString()}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-5 p-3 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-800 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
            <p>
              Los asesores pueden acelerar la conversión utilizando plantillas oficiales de bienvenida y respuestas rápidas para cotizaciones inmediatas.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

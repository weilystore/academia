import { CRMTag, CRMStage, WhatsAppQuickReply, WhatsAppTemplate, WhatsAppContact, WhatsAppConversation } from '../types';

export const DEFAULT_CRM_TAGS: CRMTag[] = [
  {
    id: 'tag-nuevo',
    name: 'Nuevo Prospecto',
    color: 'sky',
    bgClass: 'bg-sky-50 text-sky-700 border-sky-200',
    textClass: 'text-sky-700',
    borderClass: 'border-sky-300'
  },
  {
    id: 'tag-interesado',
    name: 'Interesado',
    color: 'indigo',
    bgClass: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    textClass: 'text-indigo-700',
    borderClass: 'border-indigo-300'
  },
  {
    id: 'tag-seguimiento',
    name: 'En Seguimiento',
    color: 'purple',
    bgClass: 'bg-purple-50 text-purple-700 border-purple-200',
    textClass: 'text-purple-700',
    borderClass: 'border-purple-300'
  },
  {
    id: 'tag-plan-enviado',
    name: 'Plan de Estudio Enviado',
    color: 'blue',
    bgClass: 'bg-blue-50 text-blue-700 border-blue-200',
    textClass: 'text-blue-700',
    borderClass: 'border-blue-300'
  },
  {
    id: 'tag-pago-pendiente',
    name: 'Pago Pendiente',
    color: 'amber',
    bgClass: 'bg-amber-50 text-amber-700 border-amber-200',
    textClass: 'text-amber-700',
    borderClass: 'border-amber-300'
  },
  {
    id: 'tag-matriculado',
    name: 'Matriculado',
    color: 'emerald',
    bgClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    textClass: 'text-emerald-700',
    borderClass: 'border-emerald-300'
  },
  {
    id: 'tag-descartado',
    name: 'Descartado',
    color: 'rose',
    bgClass: 'bg-rose-50 text-rose-700 border-rose-200',
    textClass: 'text-rose-700',
    borderClass: 'border-rose-300'
  }
];

export const CRM_STAGE_CONFIG: Record<CRMStage, { label: string; bg: string; text: string; border: string; desc: string }> = {
  nuevo: {
    label: 'Nuevo Prospecto',
    bg: 'bg-sky-50',
    text: 'text-sky-800',
    border: 'border-sky-300',
    desc: 'Primer contacto recibido vía WhatsApp'
  },
  interesado: {
    label: 'Interesado',
    bg: 'bg-indigo-50',
    text: 'text-indigo-800',
    border: 'border-indigo-300',
    desc: 'Ha solicitado información de plan o precios'
  },
  seguimiento: {
    label: 'En Seguimiento',
    bg: 'bg-purple-50',
    text: 'text-purple-800',
    border: 'border-purple-300',
    desc: 'En conversación activa con asesor'
  },
  pago_pendiente: {
    label: 'Pago Pendiente',
    bg: 'bg-amber-50',
    text: 'text-amber-800',
    border: 'border-amber-300',
    desc: 'Reservó cupo y está por depositar matrícula'
  },
  matriculado: {
    label: 'Matriculado (Ganado)',
    bg: 'bg-emerald-50',
    text: 'text-emerald-800',
    border: 'border-emerald-300',
    desc: 'Pago verificado y ficha formalizada'
  },
  descartado: {
    label: 'Descartado / Perdido',
    bg: 'bg-slate-100',
    text: 'text-slate-600',
    border: 'border-slate-300',
    desc: 'No califica o decidió no continuar'
  }
};

export const DEFAULT_QUICK_REPLIES: WhatsAppQuickReply[] = [
  {
    id: 'qr-saludo',
    shortcut: '/saludo',
    title: 'Saludo Institucional y Presentación',
    category: 'General',
    content: '¡Hola! Es un gusto saludarte. Te atiende el equipo de Admisiones de la Academia de Aduanas de Honduras. ¿En qué programa aduanero o de comercio exterior estás interesado en capacitarte?',
    tags: ['General', 'Saludo']
  },
  {
    id: 'qr-requisitos',
    shortcut: '/requisitos',
    title: 'Requisitos de Inscripción',
    category: 'Admisiones',
    content: '📋 Los requisitos para matricularte en nuestros programas aduaneros son:\n1. Fotocopia o fotografía legible de DNI (identidad).\n2. Fotografía reciente para carnet institucional.\n3. Copia de título universitario o de secundaria.\n4. Comprobante de depósito o transferencia bancaria de la matrícula inicial.',
    tags: ['Admisiones', 'Requisitos']
  },
  {
    id: 'qr-precios',
    shortcut: '/precios',
    title: 'Facilidades y Modalidad de Pago',
    category: 'Pagos',
    content: '💰 Planes de inversión académica:\n- Diplomado en Legislación Aduanera: L. 6,500 (o 3 cuotas mensuales de L. 2,200).\n- Taller de Clasificación Arancelaria: L. 5,200 (o 2 cuotas de L. 2,650).\n- Despacho y Declaración DUCA: L. 4,500 al contado.\nTodos los aranceles incluyen diploma avalado, acceso al aula virtual y material oficial del SAC.',
    tags: ['Pagos', 'Precios']
  },
  {
    id: 'qr-cuentas',
    shortcut: '/cuentas',
    title: 'Cuentas Bancarias Oficiales',
    category: 'Pagos',
    content: '🏦 Cuentas autorizadas a nombre de "Academia de Aduanas S. de R.L.":\n- Banco Atlántida: Cuenta de Cheques #1100-24958-3\n- BAC Credomatic: Cuenta de Ahorro #7401-9281-0\n- Ficohsa: Cuenta de Cheques #2000-8819-4\nFavor enviar la fotografía del comprobante de depósito por este mismo chat para registrar tu matrícula de inmediato.',
    tags: ['Pagos', 'Bancos']
  },
  {
    id: 'qr-horarios',
    shortcut: '/horarios',
    title: 'Horarios y Sedes de Clases',
    category: 'Ubicación y Horarios',
    content: '⏰ Opciones de horario disponibles para este período:\n- Sede Tegucigalpa (Torre Alianza): Sábados 8:00 AM - 12:00 PM o Sábados 1:00 PM - 5:00 PM.\n- Modalidad 100% Virtual: Clases sincrónicas en vivo por Zoom los domingos de 9:00 AM a 1:00 PM (todas las sesiones quedan grabadas para repaso 24/7).',
    tags: ['Horarios', 'Sedes']
  },
  {
    id: 'qr-diplomado',
    shortcut: '/diplomado',
    title: 'Folleto Diplomado Legislación Aduanera',
    category: 'Cursos',
    content: '🎓 Diplomado en Legislación Aduanera y Comercio Exterior:\n- Duración: 60 horas académicas.\n- Enfoque: Dominio del CAUCA IV, RECAUCA, Ley de Aduanas de Honduras, fiscalización y régimen sancionador.\n- Impartido por: Ex-administradores de aduanas y agentes aduaneros certificados.\n¿Deseas que te reservemos cupo para la sección matutina o vespertina?',
    tags: ['Cursos', 'Diplomado']
  },
  {
    id: 'qr-aranceles',
    shortcut: '/aranceles',
    title: 'Taller de Clasificación Arancelaria (SAC)',
    category: 'Cursos',
    content: '📦 Taller Práctico de Clasificación Arancelaria:\n- Duración: 40 horas prácticas.\n- Contenido: Dominio de las 6 Reglas Generales de Interpretación (RGI), notas explicativas de sección y resolución de casos reales de aforo aduanero con el SAC a 10 dígitos.',
    tags: ['Cursos', 'Aranceles']
  },
  {
    id: 'qr-despedida',
    shortcut: '/cierre',
    title: 'Agradecimiento y Cierre de Consulta',
    category: 'General',
    content: '¡Ha sido un placer asistirte! Si tienes alguna duda adicional sobre tus trámites o financiamiento, estamos a tu entera disposición. ¡Esperamos darte la bienvenida muy pronto a nuestra comunidad aduanera!',
    tags: ['General', 'Cierre']
  }
];

export const DEFAULT_WHATSAPP_TEMPLATES: WhatsAppTemplate[] = [
  {
    id: 'tpl-bienvenida',
    name: 'bienvenida_academia_aduanas',
    displayName: 'Bienvenida y Prospecto Calificado',
    category: 'MARKETING',
    language: 'es',
    status: 'APPROVED',
    headerText: 'ACADEMIA DE ADUANAS DE HONDURAS',
    bodyText: 'Estimado(a) {{nombre}}, bienvenido a la Academia de Formación Aduanera. Hemos recibido tu interés en el programa {{curso}}. Te adjuntamos la información del plan de estudios y facilidades de pago.',
    footerText: 'Formación profesional avalada en comercio exterior',
    sampleVariables: {
      nombre: 'Lic. Francisco Ramos',
      curso: 'Diplomado en Legislación Aduanera y Comercio Exterior'
    },
    buttons: [
      { type: 'QUICK_REPLY', text: 'Descargar Pensum PDF' },
      { type: 'QUICK_REPLY', text: 'Hablar con Asesor' }
    ]
  },
  {
    id: 'tpl-reserva-pago',
    name: 'recordatorio_pago_reserva',
    displayName: 'Recordatorio de Reserva de Cupo',
    category: 'UTILITY',
    language: 'es',
    status: 'APPROVED',
    headerText: 'RESERVA DE CUPO PENDIENTE',
    bodyText: 'Hola {{nombre}}, tenemos reservado tu cupo para el curso {{curso}}. Te recordamos que la fecha límite para completar tu matrícula con arancel promocional de {{monto}} es el {{fecha_limite}}.',
    footerText: 'Cupos limitados por aula',
    sampleVariables: {
      nombre: 'Gabriela Sánchez',
      curso: 'Taller de Clasificación Arancelaria',
      monto: 'L. 5,200',
      fecha_limite: 'Viernes 13 de Febrero'
    },
    buttons: [
      { type: 'QUICK_REPLY', text: 'Enviar Comprobante' },
      { type: 'URL', text: 'Ver Cuentas Bancarias', url: 'https://academiadeaduanas.hn/pagos' }
    ]
  },
  {
    id: 'tpl-confirmacion-matricula',
    name: 'confirmacion_matricula_oficial',
    displayName: 'Confirmación Oficial de Matrícula',
    category: 'UTILITY',
    language: 'es',
    status: 'APPROVED',
    headerText: 'MATRÍCULA FORMALIZADA CON ÉXITO',
    bodyText: '¡Felicidades {{nombre}}! Tu matrícula en {{curso}} ha sido formalizada con el código {{codigo_matricula}}. Tu grupo asignado es {{grupo}}. Nos vemos en clase el {{fecha_inicio}}.',
    footerText: 'Academia de Aduanas • Sede Oficial',
    sampleVariables: {
      nombre: 'Juan Carlos Pérez',
      curso: 'Diplomado en Legislación Aduanera',
      codigo_matricula: 'MAT-2026-00001',
      grupo: 'Grupo A (Sábados 8:00 AM)',
      fecha_inicio: 'Sábado 7 de Febrero'
    },
    buttons: [
      { type: 'URL', text: 'Acceder a Aula Virtual', url: 'https://campus.academiadeaduanas.hn' }
    ]
  },
  {
    id: 'tpl-promo-temprana',
    name: 'promocion_matricula_temprana',
    displayName: 'Promoción Descuento por Matrícula Temprana',
    category: 'MARKETING',
    language: 'es',
    status: 'APPROVED',
    headerText: 'BENEFICIO DE PRONTO PAGO ADUANERO',
    bodyText: 'Hola {{nombre}}, aprovecha un 15% de descuento especial en el arancel del {{curso}} matriculándote antes de este fin de semana. ¡Asegura tu acreditación profesional con expertos del sector!',
    footerText: 'Válido para las primeras 10 inscripciones',
    sampleVariables: {
      nombre: 'Ing. Mauricio Portillo',
      curso: 'Taller Práctico de Despacho y Declaración DUCA'
    },
    buttons: [
      { type: 'QUICK_REPLY', text: 'Solicitar Descuento' }
    ]
  }
];

// Clean state: Ready for real academy WhatsApp contacts and live conversations
export const ENRICHED_CRM_CONTACTS: WhatsAppContact[] = [];
export const ENRICHED_CRM_CONVERSATIONS: WhatsAppConversation[] = [];

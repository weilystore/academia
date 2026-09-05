import React, { useState, useEffect } from 'react';
import {
  FileText,
  CheckCircle2,
  Send,
  Sparkles,
  Smartphone,
  Info,
  ExternalLink,
  ShieldCheck,
  User,
  BookOpen,
  Calendar,
  X,
  RefreshCw,
  Copy,
  Check,
  AlertCircle
} from 'lucide-react';
import { WhatsAppTemplate, WhatsAppContact } from '../../types';
import { useData } from '../../context/DataContext';

interface WhatsAppTemplatesManagerProps {
  onOpenChatWithContact?: (contactId: string) => void;
}

export const WhatsAppTemplatesManager: React.FC<WhatsAppTemplatesManagerProps> = ({
  onOpenChatWithContact
}) => {
  const {
    whatsappTemplates,
    whatsappContacts,
    sendWhatsAppMessage
  } = useData();

  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [testModalTemplate, setTestModalTemplate] = useState<WhatsAppTemplate | null>(null);
  const [selectedContactPhone, setSelectedContactPhone] = useState<string>('');
  const [variableValues, setVariableValues] = useState<Record<string, string>>({});
  const [isSending, setIsSending] = useState(false);
  const [sendResult, setSendResult] = useState<{ success: boolean; msg: string } | null>(null);
  const [metaTemplates, setMetaTemplates] = useState<any[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [copiedTemplateId, setCopiedTemplateId] = useState<string | null>(null);

  const fetchLiveTemplates = async () => {
    setIsSyncing(true);
    try {
      const res = await fetch('/api/whatsapp/templates');
      const data = await res.json();
      if (data.success && Array.isArray(data.templates)) {
        setMetaTemplates(data.templates);
      }
    } catch {
      // Graceful fallback
    } finally {
      setIsSyncing(false);
    }
  };

  useEffect(() => {
    fetchLiveTemplates();
  }, []);

  // Merge any real templates from Meta that might not be in the default list
  const combinedTemplates: (WhatsAppTemplate & { isRegisteredInMeta: boolean })[] = [
    ...whatsappTemplates.map(tpl => ({
      ...tpl,
      isRegisteredInMeta: metaTemplates.some(mt => mt.name?.toLowerCase() === tpl.name.toLowerCase())
    }))
  ];

  // Add templates from Meta that aren't in local list
  metaTemplates.forEach(mt => {
    if (!combinedTemplates.some(ct => ct.name.toLowerCase() === mt.name?.toLowerCase())) {
      const bodyComponent = mt.components?.find((c: any) => c.type === 'BODY');
      const headerComponent = mt.components?.find((c: any) => c.type === 'HEADER');
      const footerComponent = mt.components?.find((c: any) => c.type === 'FOOTER');
      combinedTemplates.push({
        id: `meta-${mt.id || mt.name}`,
        name: mt.name,
        displayName: mt.name,
        category: mt.category || 'UTILITY',
        language: mt.language || 'es',
        status: mt.status || 'APPROVED',
        headerText: headerComponent?.text,
        bodyText: bodyComponent?.text || '',
        footerText: footerComponent?.text,
        sampleVariables: {},
        isRegisteredInMeta: true
      });
    }
  });

  const filteredTemplates = combinedTemplates.filter(tpl => {
    if (selectedCategory === 'all') return true;
    return tpl.category === selectedCategory;
  });

  const handleOpenTestModal = (template: WhatsAppTemplate & { isRegisteredInMeta: boolean }) => {
    setTestModalTemplate(template);
    setSendResult(null);

    // Pick first contact phone if available
    const firstPhone = whatsappContacts[0]?.phone || '';
    setSelectedContactPhone(firstPhone);

    // Initial variable values from template samples
    const initVars: Record<string, string> = { ...template.sampleVariables };
    setVariableValues(initVars);
  };

  const handleCopyTemplateText = (tpl: WhatsAppTemplate) => {
    let text = tpl.bodyText;
    if (tpl.headerText) text = `${tpl.headerText}\n\n${text}`;
    if (tpl.footerText) text = `${text}\n\n${tpl.footerText}`;
    navigator.clipboard.writeText(text);
    setCopiedTemplateId(tpl.id);
    setTimeout(() => setCopiedTemplateId(null), 2000);
  };

  const handleSendTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!testModalTemplate || !selectedContactPhone) return;

    setIsSending(true);
    setSendResult(null);

    try {
      let renderedText = testModalTemplate.bodyText || `[Plantilla Meta HSM: ${testModalTemplate.name}]`;

      Object.entries(variableValues).forEach(([k, v]) => {
        renderedText = renderedText.replace(new RegExp(`\\{\\{${k}\\}\\}`, 'g'), v);
      });

      const res = await sendWhatsAppMessage(
        selectedContactPhone,
        renderedText,
        undefined,
        testModalTemplate.name
      );

      if (res.success) {
        setSendResult({
          success: true,
          msg: `Plantilla "${testModalTemplate.name}" enviada exitosamente vía Meta Cloud API.`
        });
        setTimeout(() => {
          setTestModalTemplate(null);
        }, 2500);
      } else {
        setSendResult({
          success: false,
          msg: res.error || 'Error al enviar plantilla por Meta'
        });
      }
    } catch (err: any) {
      setSendResult({
        success: false,
        msg: err.message || 'Error en comunicación con Meta'
      });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* Header Info Banner */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-600">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-slate-900">Plantillas Oficiales de WhatsApp (Meta HSM)</h3>
              <span className="bg-emerald-100 text-emerald-800 text-[11px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                {metaTemplates.length} en Meta
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Plantillas requeridas por Meta para iniciar conversaciones fuera de la ventana de 24 horas.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={fetchLiveTemplates}
            disabled={isSyncing}
            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
            title="Consultar plantillas existentes en Meta Business Account"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-slate-600 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>{isSyncing ? 'Sincronizando...' : 'Sincronizar con Meta'}</span>
          </button>

          <a
            href="https://business.facebook.com/wa/manage/message-templates"
            target="_blank"
            rel="noopener noreferrer"
            className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Crear o administrar plantillas oficiales en Meta Business Manager"
          >
            <ExternalLink className="w-3.5 h-3.5 text-blue-600" />
            <span>Meta WhatsApp Manager</span>
          </a>

          {/* Category switcher */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg ml-2">
            <button
              type="button"
              onClick={() => setSelectedCategory('all')}
              className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-all ${
                selectedCategory === 'all' ? 'bg-white text-slate-800 shadow-xs' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Todas
            </button>
            <button
              type="button"
              onClick={() => setSelectedCategory('MARKETING')}
              className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-all ${
                selectedCategory === 'MARKETING' ? 'bg-white text-slate-800 shadow-xs' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Marketing
            </button>
            <button
              type="button"
              onClick={() => setSelectedCategory('UTILITY')}
              className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-all ${
                selectedCategory === 'UTILITY' ? 'bg-white text-slate-800 shadow-xs' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Utilidad
            </button>
          </div>
        </div>
      </div>

      {/* Templates Gallery Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredTemplates.map(template => {
          return (
            <div
              key={template.id}
              className={`bg-white border rounded-xl overflow-hidden shadow-xs transition-all flex flex-col justify-between ${
                template.isRegisteredInMeta ? 'border-emerald-300' : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              {/* Template Meta Info */}
              <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-mono font-bold text-slate-800">{template.name}</h4>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="text-[10px] uppercase font-bold text-slate-500">{template.category}</span>
                    <span className="text-[10px] text-slate-400">• Idioma: {template.language}</span>
                  </div>
                </div>
                {template.isRegisteredInMeta ? (
                  <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                    <CheckCircle2 className="w-2.5 h-2.5" />
                    En Meta
                  </span>
                ) : (
                  <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-amber-100 text-amber-800 border border-amber-200 flex items-center gap-1" title="Propuesta para la Academia. Regístrala en Meta para enviarla por la API.">
                    <Info className="w-2.5 h-2.5" />
                    Borrador Sugerido
                  </span>
                )}
              </div>

              {/* Realistic WhatsApp Bubble Mockup */}
              <div className="p-4 bg-slate-100/70 flex-1 flex flex-col justify-center">
                <div className="bg-white rounded-lg p-3.5 shadow-sm border border-emerald-500/20 max-w-full space-y-2 relative">
                  {/* Bubble Header */}
                  {template.headerText && (
                    <div className="text-xs font-bold text-slate-900 border-b border-slate-100 pb-1">
                      {template.headerText}
                    </div>
                  )}

                  {/* Bubble Body */}
                  <div className="text-xs text-slate-700 whitespace-pre-line leading-relaxed">
                    {template.bodyText}
                  </div>

                  {/* Bubble Footer */}
                  {template.footerText && (
                    <div className="text-[10px] text-slate-400 pt-1">
                      {template.footerText}
                    </div>
                  )}

                  {/* Interactive Action Buttons */}
                  {template.buttons && template.buttons.length > 0 && (
                    <div className="pt-2 border-t border-slate-100 space-y-1.5">
                      {template.buttons.map((btn, idx) => (
                        <div
                          key={idx}
                          className="w-full py-1.5 px-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded text-center text-xs font-semibold text-sky-600 flex items-center justify-center gap-1"
                        >
                          <ExternalLink className="w-3 h-3" />
                          {btn.text}
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="text-[9px] text-slate-400 text-right">
                    10:30 a.m. ✓✓
                  </div>
                </div>
              </div>

              {/* Action Bar */}
              <div className="px-4 py-3 bg-white border-t border-slate-100 flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => handleCopyTemplateText(template)}
                  className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                  title="Copiar texto para pegar al crear la plantilla en Meta Business Suite"
                >
                  {copiedTemplateId === template.id ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-600" />
                      <span className="text-emerald-700">Copiado</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3 text-slate-500" />
                      <span>Copiar Texto</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => handleOpenTestModal(template)}
                  className={`px-3 py-1.5 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-2xs cursor-pointer ${
                    template.isRegisteredInMeta
                      ? 'bg-emerald-600 hover:bg-emerald-700'
                      : 'bg-slate-700 hover:bg-slate-800'
                  }`}
                >
                  <Send className="w-3 h-3" />
                  <span>Probar Envío</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal for Testing Template Dispatch */}
      {testModalTemplate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden">
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Send className="w-4 h-4 text-emerald-400" />
                <h3 className="text-sm font-bold text-white">
                  Envío Oficial de Plantilla: <span className="text-emerald-300 font-mono">{testModalTemplate.name}</span>
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setTestModalTemplate(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSendTemplate} className="p-6 space-y-4">
              {/* If template is not registered in Meta, show friendly guidance banner */}
              {!metaTemplates.some(mt => mt.name?.toLowerCase() === testModalTemplate.name.toLowerCase()) && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-xs flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <span className="font-bold">Plantilla pendiente de alta en Meta Business Manager:</span>
                    <p className="text-[11px] text-amber-800 leading-relaxed">
                      Esta plantilla aún no ha sido registrada en tu cuenta de Meta. Si la despachas ahora, Meta responderá con el aviso <strong>(#132001: Template not found)</strong>.
                    </p>
                    <div className="pt-1 flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleCopyTemplateText(testModalTemplate)}
                        className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-900 bg-amber-200/80 hover:bg-amber-300 px-2 py-0.5 rounded cursor-pointer transition-colors"
                      >
                        <Copy className="w-3 h-3" />
                        <span>Copiar texto para Meta</span>
                      </button>
                      <a
                        href="https://business.facebook.com/wa/manage/message-templates"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-700 hover:underline"
                      >
                        <ExternalLink className="w-3 h-3" />
                        <span>Abrir Meta Templates</span>
                      </a>
                    </div>
                  </div>
                </div>
              )}

              {/* Recipient Selection */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Destinatario (Teléfono WhatsApp)
                </label>
                <select
                  value={selectedContactPhone}
                  onChange={e => setSelectedContactPhone(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                >
                  {whatsappContacts.map(c => (
                    <option key={c.id} value={c.phone}>
                      {c.name} ({c.phone}) - {c.status}
                    </option>
                  ))}
                </select>
              </div>

              {/* Dynamic Variables Input Fields */}
              {Object.keys(variableValues).length > 0 && (
                <div className="space-y-2.5 pt-2 border-t border-slate-200">
                  <p className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                    Variables Dinámicas de la Plantilla
                  </p>
                  {Object.entries(variableValues).map(([varKey, varVal]) => (
                    <div key={varKey}>
                      <label className="block text-[11px] font-medium text-slate-600 mb-1">
                        Variable <code className="text-emerald-700 font-mono">{`{{${varKey}}}`}</code>
                      </label>
                      <input
                        type="text"
                        value={varVal}
                        onChange={e => setVariableValues({ ...variableValues, [varKey]: e.target.value })}
                        className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                  ))}
                </div>
              )}

              {/* Feedback status */}
              {sendResult && (
                <div className={`p-3 rounded-lg text-xs flex items-start gap-2 ${
                  sendResult.success ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-rose-50 text-rose-800 border border-rose-200'
                }`}>
                  {sendResult.success ? <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" /> : <Info className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />}
                  <span className="leading-relaxed">{sendResult.msg}</span>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setTestModalTemplate(null)}
                  className="px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded-lg text-xs font-semibold hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSending || !selectedContactPhone}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors disabled:opacity-50 shadow-xs cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  {isSending ? 'Enviando vía Meta...' : 'Enviar Plantilla'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import {
  Settings as SettingsIcon,
  Building,
  Save,
  MessageSquare,
  Database,
  RefreshCw,
  CheckCircle,
  Key,
  ShieldAlert,
  Download,
  Upload,
  Server,
  HardDrive
} from 'lucide-react';
import { useData } from '../../context/DataContext';

export const SettingsView: React.FC = () => {
  const { settings, updateSettings, restoreDefaultData } = useData();

  const [institutionName, setInstitutionName] = useState(settings.institutionName);
  const [legalName, setLegalName] = useState(settings.legalName);
  const [taxId, setTaxId] = useState(settings.taxId);
  const [currencySymbol, setCurrencySymbol] = useState(settings.currencySymbol);
  const [phone, setPhone] = useState(settings.phone);
  const [email, setEmail] = useState(settings.email);
  const [address, setAddress] = useState(settings.address);
  const [whatsappApiStatus, setWhatsappApiStatus] = useState('Conectado (Cloud API v20.0)');
  const [saveSuccess, setSaveSuccess] = useState(false);

  // PostgreSQL Status on Render
  const [dbStatus, setDbStatus] = useState<{
    connected: boolean;
    provider?: string;
    databaseName?: string;
    stats?: { students: number; enrollments: number; payments: number };
    message?: string;
  } | null>(null);

  useEffect(() => {
    fetch('/api/db/status')
      .then(res => res.json())
      .then(data => setDbStatus(data))
      .catch(() => setDbStatus({ connected: false, message: 'Modo local sin servidor' }));
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings({
      institutionName,
      legalName,
      taxId,
      currencySymbol,
      phone,
      email,
      address
    });
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const handleExportBackup = () => {
    const backup = {
      timestamp: new Date().toISOString(),
      institution: settings.institutionName,
      localStorageData: { ...localStorage }
    };
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(backup, null, 2));
    const dlAnchorElem = document.createElement('a');
    dlAnchorElem.setAttribute('href', dataStr);
    dlAnchorElem.setAttribute('download', `academia_aduanas_backup_${new Date().toISOString().slice(0, 10)}.json`);
    dlAnchorElem.click();
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header Banner */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-900 text-amber-400 border border-slate-800">
              CONFIGURACIÓN DEL SISTEMA
            </span>
            <span className="text-slate-400 text-xs">&bull; Parámetros Generales</span>
          </div>
          <h2 className="text-xl font-black tracking-tight text-slate-900">
            Ajustes Institucionales y Conexiones
          </h2>
          <p className="text-slate-500 text-xs mt-0.5">
            Configuración de razón social, moneda de cobro, credenciales de WhatsApp Cloud API y respaldos.
          </p>
        </div>

        {saveSuccess && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-100 text-emerald-800 text-xs font-bold animate-in fade-in">
            <CheckCircle className="w-4 h-4" />
            <span>Configuración Guardada</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Settings Form */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6">
          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100 font-bold text-slate-900 text-sm">
              <Building className="w-4 h-4 text-amber-500" />
              <span>Identidad Institucional de la Academia</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Nombre Comercial de la Academia</label>
                <input
                  type="text"
                  required
                  value={institutionName}
                  onChange={e => setInstitutionName(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 font-bold text-slate-900"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Razón Social Legal</label>
                <input
                  type="text"
                  required
                  value={legalName}
                  onChange={e => setLegalName(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">RTN / Identificación Tributaria</label>
                <input
                  type="text"
                  required
                  value={taxId}
                  onChange={e => setTaxId(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Símbolo de Moneda de Cobro</label>
                <input
                  type="text"
                  required
                  value={currencySymbol}
                  onChange={e => setCurrencySymbol(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 font-bold"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Teléfono Principal de Contacto</label>
                <input
                  type="text"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Correo Institucional</label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block font-semibold text-slate-700 mb-1">Dirección de la Sede Principal</label>
                <input
                  type="text"
                  value={address}
                  onChange={e => setAddress(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300"
                />
              </div>
            </div>

            <div className="pt-4 flex justify-end">
              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-2 cursor-pointer shadow-xs transition-colors"
              >
                <Save className="w-4 h-4" />
                <span>Guardar Cambios Institucionales</span>
              </button>
            </div>
          </form>
        </div>

        {/* Integration and Backup Panels */}
        <div className="space-y-6 text-xs">
          {/* PostgreSQL Cloud Database Card (Render) */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 font-bold text-slate-900 text-sm">
                <Server className="w-4 h-4 text-indigo-600" />
                <span>Base de Datos PostgreSQL (Render)</span>
              </div>
              {dbStatus?.connected ? (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  Conectada
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                  Local / Pendiente
                </span>
              )}
            </div>

            <div className={`p-3 rounded-xl border space-y-1.5 ${dbStatus?.connected ? 'bg-indigo-50/70 border-indigo-200 text-indigo-900' : 'bg-slate-50 border-slate-200 text-slate-600'}`}>
              <div className="flex items-center justify-between">
                <span className="font-semibold">Servidor BD:</span>
                <span className="font-mono font-bold text-[11px]">{dbStatus?.provider || 'Modo Local'}</span>
              </div>
              {dbStatus?.connected && dbStatus.stats && (
                <div className="pt-2 border-t border-indigo-200/60 grid grid-cols-3 gap-1 text-center">
                  <div className="bg-white/80 p-1.5 rounded-lg border border-indigo-100">
                    <div className="font-bold text-slate-900 text-xs">{dbStatus.stats.students}</div>
                    <div className="text-[9px] text-slate-500">Estudiantes</div>
                  </div>
                  <div className="bg-white/80 p-1.5 rounded-lg border border-indigo-100">
                    <div className="font-bold text-slate-900 text-xs">{dbStatus.stats.enrollments}</div>
                    <div className="text-[9px] text-slate-500">Matrículas</div>
                  </div>
                  <div className="bg-white/80 p-1.5 rounded-lg border border-indigo-100">
                    <div className="font-bold text-slate-900 text-xs">{dbStatus.stats.payments}</div>
                    <div className="text-[9px] text-slate-500">Pagos</div>
                  </div>
                </div>
              )}
              {!dbStatus?.connected && (
                <p className="text-[11px] text-slate-500 leading-relaxed pt-1">
                  Configura la variable <code>DATABASE_URL</code> en Render para activar la base de datos relacional permanente y compartida en la nube.
                </p>
              )}
            </div>
          </div>

          {/* WhatsApp Cloud API Box */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 space-y-3">
            <div className="flex items-center gap-2 font-bold text-slate-900 text-sm">
              <MessageSquare className="w-4 h-4 text-emerald-600" />
              <span>Conexión WhatsApp Cloud API</span>
            </div>

            <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-emerald-900">Estado del Webhook:</span>
                <span className="font-bold text-emerald-700 flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  Activo
                </span>
              </div>
              <p className="text-[11px] text-emerald-800">
                Endpoint: <code>/api/whatsapp/webhook</code>
              </p>
              <p className="text-[10px] text-emerald-600">
                Token de verificación y webhook listos para Meta Developers.
              </p>
            </div>
          </div>

          {/* Backup & Restore Data */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 space-y-3">
            <div className="flex items-center gap-2 font-bold text-slate-900 text-sm">
              <Database className="w-4 h-4 text-blue-600" />
              <span>Copia de Seguridad y Restauración</span>
            </div>

            <p className="text-slate-500 text-xs">
              Exporta un respaldo íntegro de la base de datos institucional en formato JSON o restaura los datos a partir de una copia previa.
            </p>

            <div className="space-y-2 pt-1">
              <button
                onClick={handleExportBackup}
                className="w-full py-2.5 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center justify-center gap-2 cursor-pointer transition-colors shadow-xs"
              >
                <Download className="w-3.5 h-3.5 text-amber-400" />
                <span>Descargar Copia de Seguridad JSON</span>
              </button>

              <label className="w-full py-2.5 px-3 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold text-xs flex items-center justify-center gap-2 cursor-pointer transition-colors">
                <Upload className="w-3.5 h-3.5 text-blue-600" />
                <span>Restaurar Copia desde Archivo</span>
                <input
                  type="file"
                  accept=".json"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    const reader = new FileReader();
                    reader.onload = (event) => {
                      try {
                        const parsed = JSON.parse(event.target?.result as string);
                        if (parsed.localStorageData) {
                          Object.entries(parsed.localStorageData).forEach(([k, v]) => {
                            localStorage.setItem(k, v as string);
                          });
                          alert('Copia de seguridad restaurada exitosamente. La página se recargará.');
                          window.location.reload();
                        } else {
                          alert('El archivo de respaldo no tiene el formato requerido.');
                        }
                      } catch (err) {
                        alert('Error al leer el archivo JSON de respaldo.');
                      }
                    };
                    reader.readAsText(file);
                  }}
                />
              </label>

              <button
                onClick={() => {
                  if (confirm('¿Desea restablecer la base de datos a los valores institucionales estándar? Los cambios no respaldados se reiniciarán.')) {
                    restoreDefaultData();
                  }
                }}
                className="w-full py-2 px-3 rounded-xl border border-slate-200 hover:bg-rose-50 hover:border-rose-300 text-slate-500 hover:text-rose-700 font-semibold text-[11px] flex items-center justify-center gap-2 cursor-pointer transition-colors"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Reiniciar a Datos Institucionales Base</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

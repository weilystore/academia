import React, { useState } from 'react';
import {
  FileText,
  Download,
  Printer,
  Search,
  BookOpen,
  Award,
  FileCheck,
  Building2
} from 'lucide-react';
import { useData } from '../../context/DataContext';

interface DocumentTemplate {
  id: string;
  title: string;
  category: 'Institucional' | 'Aduanas & Aranceles' | 'Certificaciones' | 'Reglamentos';
  description: string;
  code: string;
  updatedAt: string;
}

export const DocumentsView: React.FC = () => {
  const { settings } = useData();
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');

  const templates: DocumentTemplate[] = [
    {
      id: 'doc-1',
      title: 'Formato Oficial DUCA (Declaración Única Centroamericana)',
      category: 'Aduanas & Aranceles',
      description: 'Guía práctica y formato oficial de llenado aduanero para importaciones y tránsitos.',
      code: 'FOR-ADU-01',
      updatedAt: '2026-02-15'
    },
    {
      id: 'doc-2',
      title: 'Constancia de Estudios y Matrícula Vigente',
      category: 'Institucional',
      description: 'Plantilla membretada para emisión de constancias a embajadas, bancos o empleadores.',
      code: 'CONST-MAT-04',
      updatedAt: '2026-01-20'
    },
    {
      id: 'doc-3',
      title: 'Plantilla de Liquidación y Declaración Aduanera (DAU)',
      category: 'Aduanas & Aranceles',
      description: 'Hoja de trabajo para cálculo de DAI, ISV, Selectivo al Consumo y Tasas Aduaneras.',
      code: 'LIQ-ADU-09',
      updatedAt: '2026-02-10'
    },
    {
      id: 'doc-4',
      title: 'Reglamento Académico y de Permanencia Estudiantil',
      category: 'Reglamentos',
      description: 'Normativa institucional sobre asistencia mínima (80%), evaluaciones y conducta.',
      code: 'REG-ACA-2026',
      updatedAt: '2026-01-05'
    },
    {
      id: 'doc-5',
      title: 'Diploma y Certificación de Especialista Aduanero',
      category: 'Certificaciones',
      description: 'Diseño oficial de diploma de graduación con sellos y firmas de la dirección.',
      code: 'CERT-GRAD-2026',
      updatedAt: '2026-02-28'
    },
    {
      id: 'doc-6',
      title: 'Convenio de Prácticas y Pasantías Aduaneras',
      category: 'Institucional',
      description: 'Convenio marco con agencias aduaneras de Puerto Cortés, Tegucigalpa y SPS.',
      code: 'CONV-PAS-02',
      updatedAt: '2026-01-18'
    }
  ];

  const filtered = templates.filter(t => {
    if (categoryFilter !== 'all' && t.category !== categoryFilter) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return t.title.toLowerCase().includes(q) || t.code.toLowerCase().includes(q) || t.description.toLowerCase().includes(q);
    }
    return true;
  });

  return (
    <div className="space-y-6 pb-12">
      {/* Header Banner */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-900 text-amber-400 border border-slate-800">
              ACERVO INSTITUCIONAL
            </span>
            <span className="text-slate-400 text-xs">&bull; Formatos y Normativas</span>
          </div>
          <h2 className="text-xl font-black tracking-tight text-slate-900">
            Repositorio de Documentos y Formatos Oficiales
          </h2>
          <p className="text-slate-500 text-xs mt-0.5">
            Modelos de constancias membretadas, reglamentos académicos y formularios arancelarios.
          </p>
        </div>
      </div>

      {/* Filter and Search */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar por código, título o categoría..."
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs focus:bg-white focus:outline-hidden"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto">
          {['all', 'Aduanas & Aranceles', 'Institucional', 'Certificaciones', 'Reglamentos'].map(cat => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                categoryFilter === cat
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {cat === 'all' ? 'Todos los Documentos' : cat}
            </button>
          ))}
        </div>
      </div>

      {/* Templates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filtered.map(doc => (
          <div
            key={doc.id}
            className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 flex flex-col justify-between hover:border-amber-400 hover:shadow-md transition-all space-y-4"
          >
            <div className="space-y-3">
              <div className="flex items-start justify-between">
                <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                  {doc.code}
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-900 border border-amber-200">
                  {doc.category}
                </span>
              </div>

              <div>
                <h3 className="font-bold text-slate-900 text-sm">{doc.title}</h3>
                <p className="text-slate-500 text-xs mt-1 leading-relaxed">{doc.description}</p>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="text-slate-400 text-[11px]">Actualizado: {doc.updatedAt}</span>
              <button
                onClick={() => window.print()}
                className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-amber-400 font-bold text-xs flex items-center gap-1.5 cursor-pointer transition-colors"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Emitir Documento</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

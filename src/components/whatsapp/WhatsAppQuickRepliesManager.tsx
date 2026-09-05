import React, { useState } from 'react';
import {
  Zap,
  Search,
  Plus,
  Copy,
  Check,
  Edit2,
  Trash2,
  Tag,
  BookOpen,
  CreditCard,
  Building,
  Clock,
  MessageSquare,
  Sparkles,
  X
} from 'lucide-react';
import { WhatsAppQuickReply } from '../../types';
import { useData } from '../../context/DataContext';

interface WhatsAppQuickRepliesManagerProps {
  onSelectInsert?: (content: string) => void;
  activeContactName?: string;
}

export const WhatsAppQuickRepliesManager: React.FC<WhatsAppQuickRepliesManagerProps> = ({
  onSelectInsert,
  activeContactName
}) => {
  const {
    quickReplies,
    addQuickReply,
    updateQuickReply,
    deleteQuickReply
  } = useData();

  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Create / Edit modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingReply, setEditingReply] = useState<WhatsAppQuickReply | null>(null);
  const [shortcut, setShortcut] = useState('');
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<WhatsAppQuickReply['category']>('Admisiones');
  const [content, setContent] = useState('');
  const [tagInput, setTagInput] = useState('');

  const categories = ['all', 'Admisiones', 'Pagos', 'Cursos', 'Ubicación y Horarios', 'General'];

  const filteredReplies = quickReplies.filter(qr => {
    const q = search.toLowerCase();
    const matchSearch =
      qr.title.toLowerCase().includes(q) ||
      qr.shortcut.toLowerCase().includes(q) ||
      qr.content.toLowerCase().includes(q) ||
      (qr.tags && qr.tags.some(t => t.toLowerCase().includes(q)));

    const matchCat = selectedCategory === 'all' || qr.category === selectedCategory;
    return matchSearch && matchCat;
  });

  const handleCopy = (qr: WhatsAppQuickReply) => {
    navigator.clipboard.writeText(qr.content);
    setCopiedId(qr.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleOpenCreate = () => {
    setEditingReply(null);
    setShortcut('/');
    setTitle('');
    setCategory('Admisiones');
    setContent('');
    setTagInput('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (qr: WhatsAppQuickReply) => {
    setEditingReply(qr);
    setShortcut(qr.shortcut);
    setTitle(qr.title);
    setCategory(qr.category);
    setContent(qr.content);
    setTagInput(qr.tags ? qr.tags.join(', ') : '');
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('¿Eliminar esta respuesta rápida de forma permanente?')) {
      await deleteQuickReply(id);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!shortcut.trim() || !title.trim() || !content.trim()) return;

    let formattedShortcut = shortcut.trim();
    if (!formattedShortcut.startsWith('/')) {
      formattedShortcut = '/' + formattedShortcut;
    }

    const tagsArray = tagInput
      .split(',')
      .map(t => t.trim())
      .filter(t => t.length > 0);

    if (editingReply) {
      await updateQuickReply(editingReply.id, {
        shortcut: formattedShortcut,
        title: title.trim(),
        category,
        content: content.trim(),
        tags: tagsArray
      });
    } else {
      await addQuickReply({
        shortcut: formattedShortcut,
        title: title.trim(),
        category,
        content: content.trim(),
        tags: tagsArray
      });
    }

    setIsModalOpen(false);
  };

  return (
    <div className="space-y-5">
      {/* Header and Action Bar */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-600">
              <Zap className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Respuestas Rápidas (Atajos de WhatsApp)</h3>
              <p className="text-xs text-slate-500">
                Escribe un atajo como <code className="bg-slate-100 px-1 py-0.5 rounded text-amber-700 font-semibold font-mono">/requisitos</code> en el chat para autocompletar respuestas instantáneas
              </p>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={handleOpenCreate}
          className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Nueva Respuesta Rápida
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar por atajo (/precios), título o contenido..."
            className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Category Pills */}
        <div className="flex flex-wrap gap-1.5">
          {categories.map(cat => (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                selectedCategory === cat
                  ? 'bg-amber-500 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {cat === 'all' ? 'Todas' : cat}
            </button>
          ))}
        </div>
      </div>

      {/* Quick Replies Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredReplies.length === 0 ? (
          <div className="col-span-full text-center py-12 bg-white border border-dashed border-slate-200 rounded-xl">
            <Zap className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="text-sm font-semibold text-slate-700">No se encontraron respuestas rápidas</p>
            <p className="text-xs text-slate-400 mt-1">Crea una nueva respuesta con el botón superior</p>
          </div>
        ) : (
          filteredReplies.map(qr => (
            <div
              key={qr.id}
              className="bg-white border border-slate-200 hover:border-amber-400 rounded-xl p-4 shadow-xs transition-all flex flex-col justify-between space-y-3 group"
            >
              {/* Card Header */}
              <div>
                <div className="flex items-start justify-between gap-2">
                  <span className="font-mono text-xs font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md">
                    {qr.shortcut}
                  </span>
                  <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                    {qr.category}
                  </span>
                </div>
                <h4 className="text-sm font-bold text-slate-900 mt-2 line-clamp-1">{qr.title}</h4>
              </div>

              {/* Message Content Preview */}
              <div className="bg-slate-50 border border-slate-100 rounded-lg p-3 text-xs text-slate-700 whitespace-pre-line leading-relaxed max-h-36 overflow-y-auto font-sans">
                {qr.content}
              </div>

              {/* Card Footer Actions */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleCopy(qr)}
                    className="p-1.5 rounded-md text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors flex items-center gap-1"
                    title="Copiar texto"
                  >
                    {copiedId === qr.id ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="text-[10px] text-emerald-600 font-semibold">Copiado</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span className="text-[10px]">Copiar</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => handleOpenEdit(qr)}
                    className="p-1.5 rounded-md text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                    title="Editar respuesta"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDelete(qr.id)}
                    className="p-1.5 rounded-md text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                    title="Eliminar"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                {onSelectInsert && (
                  <button
                    type="button"
                    onClick={() => onSelectInsert(qr.content)}
                    className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md text-[11px] font-semibold transition-colors flex items-center gap-1 shadow-2xs"
                  >
                    <MessageSquare className="w-3 h-3" />
                    Insertar
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal Create/Edit Quick Reply */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden">
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-400" />
                <h3 className="text-sm font-bold text-white">
                  {editingReply ? 'Editar Respuesta Rápida' : 'Nueva Respuesta Rápida'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                {/* Shortcut */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Atajo de teclado (inicia con /)
                  </label>
                  <input
                    type="text"
                    required
                    value={shortcut}
                    onChange={e => setShortcut(e.target.value)}
                    placeholder="/requisitos"
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-mono font-bold text-amber-800 focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                {/* Category */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Categoría</label>
                  <select
                    value={category}
                    onChange={e => setCategory(e.target.value as any)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                  >
                    <option value="Admisiones">Admisiones</option>
                    <option value="Pagos">Pagos</option>
                    <option value="Cursos">Cursos</option>
                    <option value="Ubicación y Horarios">Ubicación y Horarios</option>
                    <option value="General">General</option>
                  </select>
                </div>
              </div>

              {/* Title */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Título Descriptivo</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="Ej. Requisitos para Matrícula de Diplomado"
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                />
              </div>

              {/* Content */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Contenido del Mensaje
                </label>
                <textarea
                  rows={6}
                  required
                  value={content}
                  onChange={e => setContent(e.target.value)}
                  placeholder="Escribe el texto completo con saltos de línea, viñetas y emojis institucionales..."
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-amber-500 leading-relaxed font-sans"
                />
              </div>

              {/* Tags */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Etiquetas (separadas por coma)
                </label>
                <input
                  type="text"
                  value={tagInput}
                  onChange={e => setTagInput(e.target.value)}
                  placeholder="Requisitos, Matrícula, Documentos"
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                />
              </div>

              {/* Footer */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded-lg text-xs font-semibold hover:bg-slate-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-semibold transition-colors shadow-xs"
                >
                  Guardar Respuesta Rápida
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

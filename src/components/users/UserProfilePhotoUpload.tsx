import React, { useState, useRef } from 'react';
import { Camera, Upload, Trash2, Link as LinkIcon, Check, Image as ImageIcon, AlertCircle } from 'lucide-react';

interface UserProfilePhotoUploadProps {
  currentPhotoUrl?: string;
  displayName: string;
  onPhotoChange: (photoUrl: string) => void;
  onRemovePhoto: () => void;
}

const PRESET_AVATARS = [
  { id: 'p1', label: 'Ejecutivo 1', url: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80' },
  { id: 'p2', label: 'Directora', url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80' },
  { id: 'p3', label: 'Académico', url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80' },
  { id: 'p4', label: 'Coordinadora', url: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80' },
  { id: 'p5', label: 'Docente', url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80' },
  { id: 'p6', label: 'Especialista', url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80' }
];

export const UserProfilePhotoUpload: React.FC<UserProfilePhotoUploadProps> = ({
  currentPhotoUrl,
  displayName,
  onPhotoChange,
  onRemovePhoto
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [urlInput, setUrlInput] = useState('');
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Resize and optimize image file to base64
  const processImageFile = (file: File) => {
    setUploadError(null);
    if (!file.type.startsWith('image/')) {
      setUploadError('El archivo seleccionado no es una imagen válida (debe ser JPG, PNG o WebP).');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setUploadError('La imagen es demasiado pesada. El tamaño máximo recomendado es 5 MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        // Create canvas for square thumbnail resizing
        const canvas = document.createElement('canvas');
        const MAX_SIZE = 350;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_SIZE) {
            height = Math.round((height * MAX_SIZE) / width);
            width = MAX_SIZE;
          }
        } else {
          if (height > MAX_SIZE) {
            width = Math.round((width * MAX_SIZE) / height);
            height = MAX_SIZE;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.85);
          onPhotoChange(compressedDataUrl);
        }
      };
      img.onerror = () => {
        setUploadError('No se pudo procesar la imagen seleccionada.');
      };
      img.src = e.target?.result as string;
    };
    reader.onerror = () => {
      setUploadError('Error al leer el archivo de imagen.');
    };
    reader.readAsDataURL(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processImageFile(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processImageFile(file);
    }
  };

  const handleApplyUrl = (e: React.FormEvent) => {
    e.preventDefault();
    if (!urlInput.trim()) return;
    onPhotoChange(urlInput.trim());
    setUrlInput('');
    setShowUrlInput(false);
    setUploadError(null);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="block font-bold text-slate-700 text-xs">
          Foto de Perfil Institucional
        </label>
        <span className="text-[11px] text-slate-400">JPG, PNG o WebP</span>
      </div>

      {uploadError && (
        <div className="p-2 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-[11px] flex items-center gap-1.5">
          <AlertCircle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
          <span>{uploadError}</span>
        </div>
      )}

      <div className="flex items-center gap-4">
        {/* Avatar Display */}
        <div className="relative group shrink-0">
          <div className="w-16 h-16 rounded-2xl bg-slate-100 border-2 border-slate-200 overflow-hidden flex items-center justify-center shadow-xs">
            {currentPhotoUrl ? (
              <img
                src={currentPhotoUrl}
                alt={displayName || 'Usuario'}
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-slate-900 to-slate-800 text-amber-400 font-extrabold text-lg flex items-center justify-center">
                {(displayName || 'U').slice(0, 2).toUpperCase()}
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="absolute -bottom-1 -right-1 p-1.5 rounded-full bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition-colors cursor-pointer"
            title="Cargar foto desde dispositivo"
          >
            <Camera className="w-3 h-3" />
          </button>
        </div>

        {/* Action Buttons & Dropzone */}
        <div className="flex-1 min-w-0">
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            className={`border border-dashed rounded-xl p-2.5 text-center transition-all ${
              isDragging
                ? 'border-blue-500 bg-blue-50/50'
                : 'border-slate-300 hover:border-slate-400 bg-slate-50/50'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
            />

            <div className="flex items-center justify-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-2.5 py-1.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 text-slate-800 font-bold text-[11px] flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
              >
                <Upload className="w-3 h-3 text-blue-600" />
                <span>{currentPhotoUrl ? 'Cambiar Foto' : 'Cargar Archivo'}</span>
              </button>

              <button
                type="button"
                onClick={() => setShowUrlInput(!showUrlInput)}
                className="px-2.5 py-1.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold text-[11px] flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
              >
                <LinkIcon className="w-3 h-3 text-slate-500" />
                <span>Enlace URL</span>
              </button>

              {currentPhotoUrl && (
                <button
                  type="button"
                  onClick={onRemovePhoto}
                  className="px-2.5 py-1.5 rounded-lg bg-rose-50 border border-rose-200 hover:bg-rose-100 text-rose-700 font-semibold text-[11px] flex items-center gap-1.5 transition-colors cursor-pointer"
                  title="Eliminar foto actual"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>Quitar</span>
                </button>
              )}
            </div>
            <p className="text-[10px] text-slate-400 mt-1">
              O arrastra y suelta tu fotografía directamente aquí
            </p>
          </div>
        </div>
      </div>

      {/* URL Input Form */}
      {showUrlInput && (
        <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center gap-2 animate-in fade-in">
          <input
            type="url"
            placeholder="https://ejemplo.com/foto-perfil.jpg"
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            className="flex-1 px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs bg-white text-slate-800 focus:outline-hidden focus:ring-1 focus:ring-blue-500"
          />
          <button
            type="button"
            onClick={handleApplyUrl}
            className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs cursor-pointer"
          >
            Aplicar
          </button>
          <button
            type="button"
            onClick={() => setShowUrlInput(false)}
            className="px-2 py-1.5 rounded-lg text-slate-500 hover:text-slate-700 text-xs cursor-pointer"
          >
            Cancelar
          </button>
        </div>
      )}

      {/* Preset Avatars Row */}
      <div className="pt-1">
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
          Avatares Predeterminados de Prueba:
        </span>
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          {PRESET_AVATARS.map((preset) => {
            const isSelected = currentPhotoUrl === preset.url;
            return (
              <button
                key={preset.id}
                type="button"
                onClick={() => onPhotoChange(preset.url)}
                className={`w-7 h-7 rounded-lg overflow-hidden border transition-all shrink-0 cursor-pointer ${
                  isSelected
                    ? 'ring-2 ring-blue-600 border-transparent shadow-xs scale-105'
                    : 'border-slate-200 hover:border-blue-400 opacity-80 hover:opacity-100'
                }`}
                title={preset.label}
              >
                <img
                  src={preset.url}
                  alt={preset.label}
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import {
  Image as ImageIcon,
  Download,
  Maximize2,
  RefreshCw,
  AlertCircle,
  ExternalLink
} from 'lucide-react';
import { WhatsAppMessage } from '../../types';

interface WhatsAppImageAttachmentProps {
  msg: WhatsAppMessage;
  onOpenLightbox: (imageUrl: string, title: string, downloadUrl: string) => void;
}

export const WhatsAppImageAttachment: React.FC<WhatsAppImageAttachmentProps> = ({
  msg,
  onOpenLightbox
}) => {
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [hasError, setHasError] = useState<boolean>(false);
  const [retryKey, setRetryKey] = useState<number>(0);

  const mediaId = msg.mediaId;
  const imageUrl = mediaId ? `/api/whatsapp/media/${mediaId}${retryKey > 0 ? `?retry=${retryKey}` : ''}` : '';
  const downloadUrl = mediaId ? `/api/whatsapp/media/${mediaId}/download` : '';

  const handleRetry = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsLoading(true);
    setHasError(false);
    setRetryKey(k => k + 1);
  };

  const handleDownload = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!downloadUrl) return;
    const a = document.createElement('a');
    a.href = downloadUrl;
    a.download = `whatsapp-adjunto-${mediaId || 'foto'}.jpg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  if (!mediaId) {
    return (
      <div className="space-y-1.5">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-800 bg-emerald-50 px-2.5 py-1.5 rounded-lg border border-emerald-200/60">
          <ImageIcon className="w-4 h-4 text-emerald-600" />
          <span>Fotografía adjunta</span>
        </div>
        {msg.caption && <p className="text-xs leading-relaxed">{msg.caption}</p>}
        {msg.text && msg.text !== msg.caption && <p className="text-xs leading-relaxed">{msg.text}</p>}
      </div>
    );
  }

  return (
    <div className="space-y-2 max-w-sm sm:max-w-md">
      {/* Image Thumbnail Container */}
      <div
        className="relative group rounded-xl overflow-hidden border border-slate-200/90 bg-slate-900/5 shadow-xs cursor-pointer select-none"
        onClick={() => {
          if (!hasError && !isLoading) {
            onOpenLightbox(
              imageUrl,
              msg.caption || 'Fotografía adjunta - WhatsApp',
              downloadUrl
            );
          }
        }}
      >
        {/* Loading Spinner */}
        {isLoading && (
          <div className="h-48 sm:h-56 w-full flex flex-col items-center justify-center bg-slate-100/80 text-slate-500 gap-2">
            <RefreshCw className="w-5 h-5 animate-spin text-emerald-600" />
            <span className="text-[11px] font-medium">Cargando imagen de WhatsApp...</span>
          </div>
        )}

        {/* Error State */}
        {hasError && (
          <div className="p-4 bg-amber-50/90 border border-amber-200 rounded-xl text-xs text-amber-900 space-y-2.5">
            <div className="flex items-center gap-2 font-semibold">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>No se pudo previsualizar la fotografía</span>
            </div>
            <p className="text-[11px] text-amber-700 leading-relaxed">
              Es posible que la imagen aún se esté descargando desde los servidores de Meta o haya expirado.
            </p>
            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={handleRetry}
                className="px-2.5 py-1 rounded-md bg-amber-200/80 hover:bg-amber-300 text-amber-900 font-bold text-[11px] flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Reintentar</span>
              </button>
              {downloadUrl && (
                <a
                  href={downloadUrl}
                  download
                  onClick={e => e.stopPropagation()}
                  className="px-2.5 py-1 rounded-md bg-white border border-amber-300 hover:bg-amber-100/50 text-amber-800 text-[11px] font-medium flex items-center gap-1.5 transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Descargar</span>
                </a>
              )}
            </div>
          </div>
        )}

        {/* The Actual Image */}
        <img
          key={retryKey}
          src={imageUrl}
          alt={msg.caption || 'Fotografía de WhatsApp'}
          onLoad={() => {
            setIsLoading(false);
            setHasError(false);
          }}
          onError={() => {
            setIsLoading(false);
            setHasError(true);
          }}
          className={`w-full max-h-72 object-cover sm:object-contain rounded-xl transition-all duration-200 ${
            isLoading || hasError ? 'hidden' : 'block group-hover:scale-[1.01]'
          }`}
        />

        {/* Hover Quick Action Overlay */}
        {!isLoading && !hasError && (
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex flex-col justify-between p-2.5 pointer-events-none">
            <div className="flex items-center justify-between pointer-events-auto">
              <span className="px-2 py-0.5 rounded-full bg-slate-900/70 text-white text-[10px] font-bold backdrop-blur-xs flex items-center gap-1">
                <ImageIcon className="w-3 h-3 text-emerald-400" />
                <span>Foto WhatsApp</span>
              </span>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={handleDownload}
                  className="p-1.5 rounded-lg bg-slate-900/80 hover:bg-slate-900 text-white transition-colors cursor-pointer backdrop-blur-xs"
                  title="Descargar fotografía"
                >
                  <Download className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => onOpenLightbox(imageUrl, msg.caption || 'Fotografía adjunta', downloadUrl)}
                  className="p-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white transition-colors cursor-pointer shadow-xs"
                  title="Ampliar a pantalla completa"
                >
                  <Maximize2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <div className="pointer-events-auto">
              <p className="text-white text-[11px] font-medium drop-shadow-sm flex items-center gap-1">
                <Maximize2 className="w-3 h-3 text-emerald-300" />
                <span>Clic para ver en tamaño completo</span>
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Caption or description if present */}
      {msg.caption && msg.caption !== '[Fotografía / Imagen adjunta]' && (
        <p className="text-xs leading-relaxed text-slate-800 font-medium px-0.5">{msg.caption}</p>
      )}
      {msg.text &&
        msg.text !== msg.caption &&
        msg.text !== '[Fotografía / Imagen adjunta]' && (
          <p className="text-xs leading-relaxed text-slate-700 px-0.5">{msg.text}</p>
        )}
    </div>
  );
};

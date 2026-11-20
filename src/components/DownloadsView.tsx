import React, { useRef, useState } from 'react';
import {
  Download,
  File,
  FileSpreadsheet,
  FileText,
  Image as ImageIcon,
  Info,
  Search,
  Trash2,
  Upload,
} from 'lucide-react';
import { ModuleConfig } from '../types/records';
import {
  formatFileSize,
  triggerVaultFileDownload,
  UploadedVaultFile,
} from '../utils/fileVault';
import { InfoTopicId } from './InfoModal';

interface DownloadsViewProps {
  module: ModuleConfig;
  isAdmin: boolean;
  files: UploadedVaultFile[];
  onUploadFiles: (files: FileList, note?: string) => Promise<void>;
  onDeleteFile: (id: string) => Promise<void>;
  onOpenInfo: (topic: InfoTopicId) => void;
}

export const DownloadsView: React.FC<DownloadsViewProps> = ({
  module,
  isAdmin,
  files,
  onUploadFiles,
  onDeleteFile,
  onOpenInfo,
}) => {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [fileQuery, setFileQuery] = useState('');
  const [noteInput, setNoteInput] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  const filteredFiles = files.filter((f) => {
    if (!fileQuery.trim()) return true;
    const q = fileQuery.toLowerCase();
    return (
      f.name.toLowerCase().includes(q) ||
      (f.note || '').toLowerCase().includes(q)
    );
  });

  const handleFilesSelected = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    if (!isAdmin) return;
    const selected = e.target.files;
    if (!selected || selected.length === 0) return;
    setIsUploading(true);
    try {
      await onUploadFiles(selected, noteInput.trim() || undefined);
      setNoteInput('');
    } finally {
      setIsUploading(false);
      e.target.value = '';
    }
  };

  const getFileIcon = (mime: string, name: string) => {
    const lower = name.toLowerCase();
    if (
      lower.endsWith('.xlsx') ||
      lower.endsWith('.xls') ||
      lower.endsWith('.csv')
    ) {
      return <FileSpreadsheet className="w-5 h-5 text-emerald-700" />;
    }
    if (mime.startsWith('image/')) {
      return <ImageIcon className="w-5 h-5 text-blue-700" />;
    }
    if (lower.endsWith('.pdf') || mime === 'application/pdf') {
      return <FileText className="w-5 h-5 text-red-700" />;
    }
    return <File className="w-5 h-5 text-slate-600" />;
  };

  const formatDate = (iso: string) => {
    try {
      return new Intl.DateTimeFormat('es-ES', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }).format(new Date(iso));
    } catch {
      return iso;
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-4 space-y-4">
      {isAdmin && (
        <input
          ref={inputRef}
          type="file"
          multiple
          onChange={handleFilesSelected}
          className="hidden"
          aria-hidden="true"
        />
      )}

      {/* Header */}
      <div className="flex items-center justify-between gap-2">
        <div>
          <div className="flex items-center gap-1.5">
            <h2 className="text-lg font-bold text-slate-900">
              Archivos para Descarga
            </h2>
            <button
              type="button"
              onClick={() => onOpenInfo('navigation')}
              aria-label="Información sobre descargas"
              className="w-6 h-6 rounded-full flex items-center justify-center text-slate-400 hover:text-blue-700 hover:bg-blue-50 transition-colors"
            >
              <Info className="w-3.5 h-3.5" />
            </button>
          </div>
          <p className="text-xs text-slate-500">
            Módulo «{module.name}» ·{' '}
            {isAdmin
              ? 'Sube y administra los documentos visibles para el cliente'
              : 'Documentos publicados por el administrador para descargar'}
          </p>
        </div>
      </div>

      {/* Upload Box (Admin Only) + Search Bar (when files exist) */}
      {(isAdmin || files.length > 0) && (
        <section className="bg-white rounded-2xl shadow-[0_2px_12px_-3px_rgba(15,23,42,0.08)] p-4 space-y-3">
          {isAdmin && (
            <div className="flex flex-col sm:flex-row gap-2.5">
              <input
                type="text"
                value={noteInput}
                onChange={(e) => setNoteInput(e.target.value)}
                placeholder="Nota o etiqueta opcional antes de subir (ej. Resolución firmada)"
                className="flex-1 min-h-[44px] px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white focus:border-transparent"
              />
              <button
                type="button"
                disabled={isUploading}
                onClick={() => inputRef.current?.click()}
                className="min-h-[44px] px-5 py-2.5 bg-blue-700 hover:bg-blue-800 disabled:bg-slate-300 text-white rounded-xl text-sm font-semibold transition-colors flex items-center justify-center gap-2 shrink-0"
              >
                <Upload className="w-4 h-4" />
                <span>{isUploading ? 'Subiendo...' : 'Subir archivo'}</span>
              </button>
            </div>
          )}

          {files.length > 0 && (
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="search"
                value={fileQuery}
                onChange={(e) => setFileQuery(e.target.value)}
                placeholder="Buscar entre los documentos disponibles..."
                className="w-full min-h-[42px] pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white focus:border-transparent"
              />
            </div>
          )}
        </section>
      )}

      {/* Uploaded Files List */}
      {files.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-[0_2px_12px_-3px_rgba(15,23,42,0.08)] p-8 text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-700 flex items-center justify-center mx-auto">
            <Download className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <p className="text-sm font-bold text-slate-900">
              {isAdmin
                ? `No has subido archivos en «${module.name}»`
                : `Sin archivos disponibles en «${module.name}»`}
            </p>
            <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
              {isAdmin
                ? 'Sube documentos (PDF, Excel, Word, imágenes u otros) para publicarlos y que el cliente pueda descargarlos.'
                : 'Los documentos que publique el administrador aparecerán listados aquí para que puedas descargarlos.'}
            </p>
          </div>
        </div>
      ) : filteredFiles.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-[0_2px_12px_-3px_rgba(15,23,42,0.08)] p-6 text-center text-xs text-slate-500">
          Ningún archivo coincide con «{fileQuery}».
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {filteredFiles.map((item) => (
            <article
              key={item.id}
              className="bg-white rounded-2xl shadow-[0_2px_12px_-3px_rgba(15,23,42,0.08)] p-4 flex items-start justify-between gap-3"
            >
              <div className="flex items-start gap-3 min-w-0 flex-1">
                <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center shrink-0">
                  {getFileIcon(item.mimeType, item.name)}
                </div>
                <div className="min-w-0 space-y-0.5">
                  <p className="text-sm font-semibold text-slate-900 truncate">
                    {item.name}
                  </p>
                  {item.note && (
                    <p className="text-xs text-slate-700 line-clamp-2">
                      {item.note}
                    </p>
                  )}
                  <p className="text-[11px] text-slate-400 tabular-nums">
                    {formatFileSize(item.size)} · {formatDate(item.uploadedAt)}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1 shrink-0">
                <button
                  type="button"
                  onClick={() => triggerVaultFileDownload(item)}
                  aria-label={`Descargar ${item.name}`}
                  className="min-h-[40px] px-3 py-2 bg-blue-700 hover:bg-blue-800 text-white rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Descargar</span>
                </button>
                {isAdmin && (
                  <button
                    type="button"
                    onClick={() => onDeleteFile(item.id)}
                    aria-label={`Eliminar ${item.name}`}
                    className="min-h-[40px] min-w-[40px] flex items-center justify-center rounded-xl text-slate-400 hover:text-red-700 hover:bg-red-50 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
};

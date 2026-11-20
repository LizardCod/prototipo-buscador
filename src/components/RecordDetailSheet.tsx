import React, { useState } from 'react';
import {
  Bookmark,
  Check,
  Copy,
  Download,
  X,
} from 'lucide-react';
import { DataRecord, ModuleConfig } from '../types/records';

interface RecordDetailSheetProps {
  record: DataRecord;
  module: ModuleConfig;
  onClose: () => void;
  onToggleBookmark: (recordId: string) => void;
  onExportSingle: (record: DataRecord, format: 'xlsx' | 'csv') => void;
}

export const RecordDetailSheet: React.FC<RecordDetailSheetProps> = ({
  record,
  module,
  onClose,
  onToggleBookmark,
  onExportSingle,
}) => {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const handleCopy = (key: string, val: string) => {
    if (!val) return;
    navigator.clipboard?.writeText(val);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 1500);
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-end sm:items-center justify-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Detalle del registro"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white w-full sm:max-w-lg max-h-[88vh] rounded-t-3xl sm:rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-slate-200"
      >
        {/* Mobile drag handle */}
        <div className="sm:hidden pt-2.5 pb-1 flex justify-center">
          <div className="w-10 h-1.5 bg-slate-300 rounded-full" />
        </div>

        {/* Header */}
        <div className="px-5 py-3.5 border-b border-slate-200 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <h3 className="text-base font-bold text-slate-900 truncate">
              Detalle del registro
            </h3>
            <p className="text-xs text-slate-500 tabular-nums">
              {module.name} · Fila Excel #{record.sourceRow}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar detalle"
            className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Fields */}
        <div className="flex-1 overflow-y-auto p-5 space-y-3.5">
          {module.columns.map((col) => {
            const val = record.values[col.key] || '';
            const isCopied = copiedKey === col.key;
            return (
              <div
                key={col.key}
                className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-xl space-y-1"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-semibold text-slate-500">
                    {col.label}
                  </span>
                  {val && (
                    <button
                      type="button"
                      onClick={() => handleCopy(col.key, val)}
                      className="text-xs font-medium text-blue-700 hover:text-blue-800 flex items-center gap-1 py-0.5 px-1.5 rounded"
                    >
                      {isCopied ? (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          <span>Copiado</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copiar</span>
                        </>
                      )}
                    </button>
                  )}
                </div>
                <p
                  className={`text-sm text-slate-900 break-words ${
                    col.type === 'code' || col.type === 'date'
                      ? 'font-mono tabular-nums font-semibold'
                      : 'leading-relaxed'
                  }`}
                >
                  {val || '—'}
                </p>
              </div>
            );
          })}
        </div>

        {/* Bottom Actions */}
        <div className="px-5 py-3.5 border-t border-slate-200 bg-white flex flex-wrap items-center gap-2 pb-safe">
          <button
            type="button"
            onClick={() => onToggleBookmark(record.id)}
            className={`flex-1 min-h-[44px] px-4 py-2 rounded-xl border text-xs font-semibold transition-colors flex items-center justify-center gap-2 ${
              record.bookmarked
                ? 'bg-amber-50 border-amber-300 text-amber-900'
                : 'bg-slate-50 border-slate-300 text-slate-800 hover:bg-slate-100'
            }`}
          >
            <Bookmark
              className={`w-4 h-4 ${record.bookmarked ? 'fill-current' : ''}`}
            />
            <span>
              {record.bookmarked ? 'En antecedentes' : 'Guardar en antecedentes'}
            </span>
          </button>

          <button
            type="button"
            onClick={() => onExportSingle(record, 'xlsx')}
            className="min-h-[44px] px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white rounded-xl text-xs font-semibold transition-colors flex items-center justify-center gap-2"
          >
            <Download className="w-4 h-4" />
            <span>Exportar (.xlsx)</span>
          </button>
        </div>
      </div>
    </div>
  );
};

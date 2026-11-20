import React, { useState } from 'react';
import {
  ArrowRight,
  Bookmark,
  Clock,
  FileSpreadsheet,
  History,
  Search,
  Trash2,
} from 'lucide-react';
import {
  DataRecord,
  ImportBatch,
  ModuleConfig,
  SearchHistoryItem,
} from '../types/records';
import { formatMonthLabel } from '../utils/searchEngine';

interface HistoryViewProps {
  module: ModuleConfig;
  isAdmin: boolean;
  batches: ImportBatch[];
  searchHistory: SearchHistoryItem[];
  bookmarkedRecords: DataRecord[];
  onApplySearchFromHistory: (item: SearchHistoryItem) => void;
  onFilterByBatch: (batchId: string) => void;
  onDeleteBatch: (batchId: string) => void;
  onOpenRecord: (record: DataRecord) => void;
  onClearSearchHistory: () => void;
}

export const HistoryView: React.FC<HistoryViewProps> = ({
  module,
  isAdmin,
  batches,
  searchHistory,
  bookmarkedRecords,
  onApplySearchFromHistory,
  onFilterByBatch,
  onDeleteBatch,
  onOpenRecord,
  onClearSearchHistory,
}) => {
  const [subTab, setSubTab] = useState<'consultas' | 'lotes'>('consultas');

  const formatDateTime = (iso: string) => {
    try {
      return new Intl.DateTimeFormat('es-ES', {
        day: '2-digit',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
      }).format(new Date(iso));
    } catch {
      return iso;
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-4 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-900">
            Documentos y Antecedentes
          </h2>
          <p className="text-xs text-slate-500">
            Módulo activo: {module.name} · Registros guardados, búsquedas y lotes Excel
          </p>
        </div>

        {/* Segmented Control */}
        <div className="flex items-center p-1 bg-slate-200/70 rounded-xl self-start">
          <button
            type="button"
            onClick={() => setSubTab('consultas')}
            className={`min-h-[38px] px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap ${
              subTab === 'consultas'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Antecedentes ({bookmarkedRecords.length + searchHistory.length})
          </button>
          <button
            type="button"
            onClick={() => setSubTab('lotes')}
            className={`min-h-[38px] px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap ${
              subTab === 'lotes'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Lotes importados ({batches.length})
          </button>
        </div>
      </div>

      {subTab === 'consultas' ? (
        <div className="space-y-5">
          {/* Bookmarked / Saved Records */}
          <section className="space-y-2.5">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
              <Bookmark className="w-3.5 h-3.5 text-amber-600" />
              <span>Registros guardados en antecedentes ({bookmarkedRecords.length})</span>
            </div>

            {bookmarkedRecords.length === 0 ? (
              <div className="bg-white border border-slate-200 rounded-2xl p-6 text-center text-xs text-slate-500">
                Aún no has guardado registros como antecedente. Toca cualquier registro
                en el buscador y pulsa «Guardar en antecedentes».
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                {bookmarkedRecords.map((rec) => {
                  const firstCol = module.columns[0];
                  const secondCol = module.columns[1];
                  const descCol =
                    module.columns.find((c) => c.type === 'text') ||
                    module.columns[module.columns.length - 1];
                  return (
                    <button
                      key={rec.id}
                      type="button"
                      onClick={() => onOpenRecord(rec)}
                      className="text-left bg-white border border-slate-200 hover:border-blue-300 rounded-2xl p-4 transition-colors space-y-1.5"
                    >
                      <div className="flex items-center justify-between gap-2 text-xs text-slate-500 font-mono tabular-nums">
                        <span className="font-semibold text-blue-700">
                          {rec.values[firstCol?.key] || '—'}
                        </span>
                        {secondCol && (
                          <span>{rec.values[secondCol.key] || ''}</span>
                        )}
                      </div>
                      {descCol && (
                        <p className="text-sm font-medium text-slate-900 line-clamp-2">
                          {rec.values[descCol.key] || 'Sin descripción'}
                        </p>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </section>

          {/* Search History */}
          <section className="space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
                <History className="w-3.5 h-3.5 text-slate-500" />
                <span>Historial de búsquedas (%LIKE%)</span>
              </div>
              {searchHistory.length > 0 && (
                <button
                  type="button"
                  onClick={onClearSearchHistory}
                  className="text-xs font-medium text-slate-500 hover:text-red-700"
                >
                  Limpiar historial
                </button>
              )}
            </div>

            {searchHistory.length === 0 ? (
              <div className="bg-white border border-slate-200 rounded-2xl p-6 text-center text-xs text-slate-500">
                Tus búsquedas recientes en este módulo aparecerán aquí para consultarlas
                con un toque.
              </div>
            ) : (
              <div className="bg-white border border-slate-200 rounded-2xl divide-y divide-slate-100 overflow-hidden">
                {searchHistory.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => onApplySearchFromHistory(item)}
                    className="w-full min-h-[56px] px-4 py-3 text-left hover:bg-slate-50 transition-colors flex items-center justify-between gap-3"
                  >
                    <div className="min-w-0 flex-1 space-y-0.5">
                      <div className="flex items-center gap-2">
                        <Search className="w-3.5 h-3.5 text-blue-700 shrink-0" />
                        <span className="text-sm font-semibold text-slate-900 truncate">
                          {item.query ? `«${item.query}»` : 'Filtro sin texto'}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 tabular-nums pl-5">
                        {item.resultCount} resultados
                        {item.prefixFilter ? ` · Prefijo ${item.prefixFilter}` : ''}
                        {item.monthFilter
                          ? ` · ${formatMonthLabel(item.monthFilter)}`
                          : ''}
                        {' · '}
                        {formatDateTime(item.timestamp)}
                      </p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-400 shrink-0" />
                  </button>
                ))}
              </div>
            )}
          </section>
        </div>
      ) : (
        /* Imported Batches List */
        <div className="space-y-3">
          {batches.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center space-y-2">
              <FileSpreadsheet className="w-8 h-8 text-slate-300 mx-auto" />
              <p className="text-sm font-semibold text-slate-900">
                Sin importaciones registradas en {module.name}
              </p>
              <p className="text-xs text-slate-500">
                Cada archivo Excel que importes quedará registrado aquí con su fecha,
                fila de inicio y conteo.
              </p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {batches.map((batch) => (
                <div
                  key={batch.id}
                  className="bg-white border border-slate-200 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center shrink-0">
                      <FileSpreadsheet className="w-5 h-5" />
                    </div>
                    <div className="min-w-0 space-y-0.5">
                      <p className="text-sm font-bold text-slate-900 truncate">
                        {batch.fileName}
                      </p>
                      <p className="text-xs text-slate-500 tabular-nums">
                        Hoja «{batch.sheetName}» · Fila inicio {batch.startRow} ·{' '}
                        <strong className="text-slate-800">
                          {batch.importedCount}
                        </strong>{' '}
                        de {batch.totalRowsInFile} importados ·{' '}
                        {batch.mode === 'replace' ? 'Reemplazo' : 'Anexo'}
                      </p>
                      <p className="text-[11px] text-slate-400 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        <span>{formatDateTime(batch.importedAt)}</span>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                    <button
                      type="button"
                      onClick={() => onFilterByBatch(batch.id)}
                      className="min-h-[40px] px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-900 rounded-xl text-xs font-semibold transition-colors"
                    >
                      Consultar registros
                    </button>
                    {isAdmin && (
                      <button
                        type="button"
                        onClick={() => onDeleteBatch(batch.id)}
                        aria-label="Eliminar lote importado"
                        className="min-h-[40px] min-w-[40px] flex items-center justify-center rounded-xl text-slate-400 hover:text-red-700 hover:bg-red-50 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

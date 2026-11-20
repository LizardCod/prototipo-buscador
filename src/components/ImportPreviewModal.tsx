import React, { useMemo, useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  FileSpreadsheet,
  Info,
  SlidersHorizontal,
  Table2,
  X,
} from 'lucide-react';
import {
  ImportLimitOption,
  ModuleConfig,
  ParsedExcelPreview,
} from '../types/records';
import { InfoTopicId } from './InfoModal';

interface ImportPreviewModalProps {
  preview: ParsedExcelPreview;
  module: ModuleConfig;
  modules: ModuleConfig[];
  onChangeTargetModule: (moduleId: string) => void;
  onChangeSheet: (sheetName: string) => void;
  onChangeStartRow: (startRow: number, hasHeaderRow: boolean) => void;
  onChangeMapping: (mapping: Record<string, number>) => void;
  onConfirmImport: (
    limit: ImportLimitOption,
    mode: 'replace' | 'append'
  ) => void;
  onCancel: () => void;
  onOpenInfo: (topic: InfoTopicId) => void;
}

const LIMIT_OPTIONS: Array<{ value: ImportLimitOption; label: string }> = [
  { value: 10, label: '10' },
  { value: 20, label: '20' },
  { value: 50, label: '50' },
  { value: 100, label: '100' },
  { value: 200, label: '200' },
  { value: 'all', label: 'Todos' },
];

export const ImportPreviewModal: React.FC<ImportPreviewModalProps> = ({
  preview,
  module,
  modules,
  onChangeTargetModule,
  onChangeSheet,
  onChangeStartRow,
  onChangeMapping,
  onConfirmImport,
  onCancel,
  onOpenInfo,
}) => {
  const [selectedLimit, setSelectedLimit] = useState<ImportLimitOption>('all');
  const [importMode, setImportMode] = useState<'replace' | 'append'>('replace');
  const [showMappingEditor, setShowMappingEditor] = useState(false);
  const [showSkippedRows, setShowSkippedRows] = useState(false);
  const [previewRenderCap, setPreviewRenderCap] = useState(60);

  const totalDetected = preview.parsedRows.length;

  const rowsToImport = useMemo(() => {
    if (selectedLimit === 'all') return preview.parsedRows;
    return preview.parsedRows.slice(0, selectedLimit);
  }, [preview.parsedRows, selectedLimit]);

  const visiblePreviewRows = useMemo(() => {
    return rowsToImport.slice(0, previewRenderCap);
  }, [rowsToImport, previewRenderCap]);

  const skippedRawRows = useMemo(() => {
    if (preview.startRow <= 1) return [];
    return preview.rawMatrix.slice(0, preview.startRow - 1);
  }, [preview.rawMatrix, preview.startRow]);

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex flex-col justify-end sm:items-center sm:justify-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Vista previa antes de importar"
    >
      <div className="bg-white w-full sm:max-w-5xl h-[94vh] sm:h-[90vh] rounded-t-3xl sm:rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        {/* Top Modal Header */}
        <div className="px-4 sm:px-6 py-3.5 border-b border-slate-100 flex items-center justify-between gap-3 bg-white shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center shrink-0">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <h2 className="text-base sm:text-lg font-bold text-slate-900 truncate">
                  Vista previa antes de importar
                </h2>
                <button
                  type="button"
                  onClick={() => onOpenInfo('preview')}
                  aria-label="Información sobre vista previa"
                  className="w-6 h-6 rounded-full flex items-center justify-center text-slate-400 hover:text-blue-700 hover:bg-blue-50 shrink-0"
                >
                  <Info className="w-3.5 h-3.5" />
                </button>
              </div>
              <p className="text-xs text-slate-500 truncate tabular-nums">
                {preview.fileName} · {totalDetected} registros listos desde fila{' '}
                {preview.startRow}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onCancel}
            aria-label="Cerrar vista previa"
            className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Config + Preview Body */}
        <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 space-y-5 bg-slate-50">
          {/* Import Configuration Grid */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Target module confirm */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                  Módulo destino
                </label>
                <select
                  value={module.id}
                  onChange={(e) => onChangeTargetModule(e.target.value)}
                  className="w-full min-h-[44px] px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                >
                  {modules.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Sheet selector */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                  Hoja del libro Excel
                </label>
                <select
                  value={preview.selectedSheet}
                  onChange={(e) => onChangeSheet(e.target.value)}
                  className="w-full min-h-[44px] px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                >
                  {preview.sheetNames.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>

              {/* Start Row selector */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                  Fila de inicio (por defecto: {module.startRow})
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={1}
                    max={Math.max(1, preview.rawMatrix.length)}
                    value={preview.startRow}
                    onChange={(e) => {
                      const val = Math.max(1, Number(e.target.value) || 1);
                      onChangeStartRow(val, preview.hasHeaderRow);
                    }}
                    className="w-24 min-h-[44px] px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm font-mono tabular-nums text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                  <button
                    type="button"
                    onClick={() =>
                      onChangeStartRow(preview.startRow, !preview.hasHeaderRow)
                    }
                    className={`flex-1 min-h-[44px] px-3 py-2 rounded-xl border text-xs font-medium transition-colors text-left ${
                      preview.hasHeaderRow
                        ? 'bg-blue-50 border-blue-200 text-blue-900'
                        : 'bg-slate-50 border-slate-300 text-slate-700'
                    }`}
                  >
                    {preview.hasHeaderRow
                      ? `Fila ${preview.startRow} = Encabezados`
                      : `Fila ${preview.startRow} = Primer dato`}
                  </button>
                </div>
              </div>
            </div>

            {/* Skipped rows notice + expandable */}
            {preview.startRow > 1 && (
              <div className="pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowSkippedRows(!showSkippedRows)}
                  className="text-xs font-medium text-slate-600 hover:text-slate-900 flex items-center gap-1.5 py-1"
                >
                  {showSkippedRows ? (
                    <ChevronUp className="w-4 h-4" />
                  ) : (
                    <ChevronDown className="w-4 h-4" />
                  )}
                  <span>
                    Filas 1 a {preview.startRow - 1} omitidas automáticamente (ver
                    contenido ignorado)
                  </span>
                </button>
                {showSkippedRows && (
                  <div className="mt-2 p-2.5 bg-slate-50 rounded-xl border border-slate-200 text-xs font-mono text-slate-600 space-y-1 max-h-32 overflow-y-auto">
                    {skippedRawRows.map((row, idx) => (
                      <div key={idx} className="truncate">
                        <span className="text-slate-400 mr-2">F{idx + 1}:</span>
                        {row.filter(Boolean).join(' | ') || '(fila vacía)'}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Column mapping toggle */}
            <div className="pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowMappingEditor(!showMappingEditor)}
                className="min-h-[40px] text-xs font-semibold text-blue-700 hover:text-blue-800 flex items-center gap-1.5"
              >
                <SlidersHorizontal className="w-4 h-4" />
                <span>
                  {showMappingEditor
                    ? 'Ocultar mapeo de columnas'
                    : 'Revisar o ajustar mapeo de columnas'}
                </span>
              </button>

              {showMappingEditor && (
                <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                  {module.columns.map((col) => (
                    <div
                      key={col.key}
                      className="p-2.5 bg-slate-50 rounded-xl border border-slate-200"
                    >
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        {col.label}
                      </label>
                      <select
                        value={preview.columnMapping[col.key] ?? -1}
                        onChange={(e) => {
                          const next = {
                            ...preview.columnMapping,
                            [col.key]: Number(e.target.value),
                          };
                          onChangeMapping(next);
                        }}
                        className="w-full min-h-[40px] px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs text-slate-900"
                      >
                        <option value={-1}>— No asignar —</option>
                        {preview.detectedHeaders.map((hdr, idx) => (
                          <option key={idx} value={idx}>
                            Col {idx + 1}: {hdr}
                          </option>
                        ))}
                      </select>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Quick Quantity Selector (10, 20, 50, 100, 200, Todos) & Import Mode */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Cantidad de registros a importar
                </h3>
                <p className="text-xs text-slate-500 tabular-nums">
                  Detectados <strong className="text-slate-900">{totalDetected}</strong>{' '}
                  registros válidos · Se importarán{' '}
                  <strong className="text-blue-700">{rowsToImport.length}</strong>
                </p>
              </div>

              {/* Replace vs Append */}
              <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl self-start">
                <button
                  type="button"
                  onClick={() => setImportMode('replace')}
                  className={`min-h-[36px] px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap ${
                    importMode === 'replace'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Reemplazar módulo
                </button>
                <button
                  type="button"
                  onClick={() => setImportMode('append')}
                  className={`min-h-[36px] px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap ${
                    importMode === 'append'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Agregar a existentes
                </button>
              </div>
            </div>

            {/* Quick quantity buttons: 10, 20, 50, 100, 200, Todos */}
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
              {LIMIT_OPTIONS.map((opt) => {
                const isActive = selectedLimit === opt.value;
                const countValue =
                  opt.value === 'all'
                    ? totalDetected
                    : Math.min(opt.value, totalDetected);
                return (
                  <button
                    key={String(opt.value)}
                    type="button"
                    onClick={() => setSelectedLimit(opt.value)}
                    className={`min-h-[44px] px-3 py-2 rounded-xl border text-sm font-semibold tabular-nums transition-colors flex flex-col items-center justify-center ${
                      isActive
                        ? 'bg-blue-700 border-blue-700 text-white'
                        : 'bg-white border-slate-200 text-slate-800 hover:border-slate-400 hover:bg-slate-50'
                    }`}
                  >
                    <span>{opt.label}</span>
                    {opt.value === 'all' && (
                      <span
                        className={`text-[10px] font-normal ${
                          isActive ? 'text-blue-100' : 'text-slate-500'
                        }`}
                      >
                        ({countValue})
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Data Preview List / Table */}
          <div className="space-y-2.5">
            <div className="px-1 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Table2 className="w-4 h-4 text-slate-500" />
                <h3 className="text-sm font-bold text-slate-900">
                  Datos previsualizados ({rowsToImport.length})
                </h3>
              </div>
              <span className="text-xs text-slate-500 tabular-nums">
                Mostrando {visiblePreviewRows.length} de {rowsToImport.length}
              </span>
            </div>

            {rowsToImport.length === 0 ? (
              <div className="bg-white rounded-2xl shadow-[0_2px_12px_-3px_rgba(15,23,42,0.08)] p-8 text-center space-y-2">
                <AlertCircle className="w-8 h-8 text-amber-600 mx-auto" />
                <p className="text-sm font-semibold text-slate-900">
                  No se detectaron registros desde la fila {preview.startRow}
                </p>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  Ajusta el número de fila de inicio o verifica la hoja seleccionada del
                  archivo Excel.
                </p>
              </div>
            ) : (
              <>
                {/* Mobile Preview Borderless Shadowed Cards */}
                <div className="space-y-2.5 sm:hidden">
                  {visiblePreviewRows.map((row, idx) => (
                    <div
                      key={idx}
                      className="bg-white rounded-2xl p-3.5 shadow-[0_2px_10px_-3px_rgba(15,23,42,0.08)] space-y-1.5"
                    >
                      <div className="flex items-center justify-between text-xs text-slate-500 tabular-nums pb-1">
                        <span className="font-semibold text-slate-700">
                          Registro #{idx + 1}
                        </span>
                        <span>Fila Excel {row.sourceRow}</span>
                      </div>
                      {module.columns.map((col) => (
                        <div
                          key={col.key}
                          className="flex items-baseline justify-between gap-3 text-xs"
                        >
                          <span className="text-slate-500 shrink-0">{col.label}:</span>
                          <span
                            className={`text-right text-slate-900 break-words ${
                              col.type === 'code' || col.type === 'date'
                                ? 'font-mono tabular-nums font-medium'
                                : ''
                            }`}
                          >
                            {row.values[col.key] || '—'}
                          </span>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>

                {/* Desktop/Tablet Preview Table */}
                <div className="hidden sm:block bg-white rounded-2xl shadow-[0_2px_12px_-3px_rgba(15,23,42,0.08)] overflow-hidden">
                  <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-600">
                        <th className="py-2.5 px-3 whitespace-nowrap w-16 tabular-nums">
                          Fila
                        </th>
                        {module.columns.map((col) => (
                          <th key={col.key} className="py-2.5 px-3 whitespace-nowrap">
                            {col.label}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-xs">
                      {visiblePreviewRows.map((row, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/80">
                          <td className="py-2.5 px-3 font-mono tabular-nums text-slate-400">
                            {row.sourceRow}
                          </td>
                          {module.columns.map((col) => (
                            <td
                              key={col.key}
                              className={`py-2.5 px-3 text-slate-800 max-w-xs ${
                                col.type === 'code' || col.type === 'date'
                                  ? 'font-mono tabular-nums whitespace-nowrap'
                                  : ''
                              }`}
                            >
                              {row.values[col.key] || (
                                <span className="text-slate-300">—</span>
                              )}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  </div>
                </div>

                {visiblePreviewRows.length < rowsToImport.length && (
                  <div className="p-3 border-t border-slate-100 bg-slate-50/70 flex items-center justify-center gap-3">
                    <button
                      type="button"
                      onClick={() =>
                        setPreviewRenderCap((prev) =>
                          Math.min(rowsToImport.length, prev + 100)
                        )
                      }
                      className="min-h-[40px] px-4 py-1.5 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 hover:bg-slate-50"
                    >
                      Mostrar 100 más en vista previa
                    </button>
                    <button
                      type="button"
                      onClick={() => setPreviewRenderCap(rowsToImport.length)}
                      className="min-h-[40px] px-4 py-1.5 text-xs font-semibold text-blue-700 hover:underline"
                    >
                      Ver todos ({rowsToImport.length})
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Sticky Bottom Action Bar */}
        <div className="px-4 sm:px-6 py-3.5 border-t border-slate-200 bg-white flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 shrink-0 pb-safe">
          <button
            type="button"
            onClick={onCancel}
            className="min-h-[44px] px-4 py-2.5 border border-slate-300 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors order-2 sm:order-1"
          >
            Cancelar
          </button>
          <button
            type="button"
            disabled={rowsToImport.length === 0}
            onClick={() => onConfirmImport(selectedLimit, importMode)}
            className="min-h-[48px] px-6 py-2.5 bg-blue-700 hover:bg-blue-800 disabled:bg-slate-300 disabled:cursor-not-allowed text-white rounded-xl text-sm font-semibold transition-colors flex items-center justify-center gap-2 order-1 sm:order-2"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span className="tabular-nums">
              Confirmar e importar ({rowsToImport.length} registros)
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};

import React, { useMemo, useState } from 'react';
import {
  Bookmark,
  Calendar,
  Check,
  CheckSquare,
  ChevronDown,
  ChevronUp,
  Copy,
  FileSpreadsheet,
  Filter,
  Info,
  LayoutGrid,
  PanelLeftOpen,
  Search,
  Square,
  Table,
  Tag,
  X,
} from 'lucide-react';
import { DataRecord, ModuleConfig } from '../types/records';
import {
  ConstantPrefixItem,
  extractHiddenMatchSnippets,
  MonthFilterItem,
} from '../utils/searchEngine';
import { HighlightedText } from './HighlightedText';
import { InfoTopicId } from './InfoModal';

interface SearchViewProps {
  module: ModuleConfig;
  isAdmin: boolean;
  allModuleRecords: DataRecord[];
  filteredRecords: DataRecord[];
  query: string;
  onChangeQuery: (q: string) => void;
  onCommitSearchHistory: () => void;
  prefixFilter: string | null;
  onChangePrefixFilter: (prefix: string | null) => void;
  monthFilter: string | null;
  onChangeMonthFilter: (monthKey: string | null) => void;
  batchFilterId: string | null;
  onClearBatchFilter: () => void;
  detectedPrefixes: ConstantPrefixItem[];
  availableMonths: MonthFilterItem[];
  selectedRecordIds: Set<string>;
  onToggleSelectRecord: (id: string) => void;
  onSelectAllFiltered: () => void;
  onClearSelection: () => void;
  onToggleBookmark: (recordId: string) => void;
  onOpenSidebar: () => void;
  onOpenInfo: (topic: InfoTopicId) => void;
}

export const SearchView: React.FC<SearchViewProps> = ({
  module,
  isAdmin,
  allModuleRecords,
  filteredRecords,
  query,
  onChangeQuery,
  onCommitSearchHistory,
  prefixFilter,
  onChangePrefixFilter,
  monthFilter,
  onChangeMonthFilter,
  batchFilterId,
  onClearBatchFilter,
  detectedPrefixes,
  availableMonths,
  selectedRecordIds,
  onToggleSelectRecord,
  onSelectAllFiltered,
  onClearSelection,
  onToggleBookmark,
  onOpenSidebar,
  onOpenInfo,
}) => {
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');
  // Filters accordion starts collapsed so the search view stays clean & uncluttered
  const [filtersAccordionOpen, setFiltersAccordionOpen] = useState(false);
  const [customPrefixInput, setCustomPrefixInput] = useState('');
  const [renderLimit, setRenderLimit] = useState(50);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const visibleRecords = useMemo(
    () => filteredRecords.slice(0, renderLimit),
    [filteredRecords, renderLimit]
  );

  const activeFilterCount = (prefixFilter ? 1 : 0) + (monthFilter ? 1 : 0);
  const hasActiveFilters = Boolean(
    query.trim() || prefixFilter || monthFilter || batchFilterId
  );

  const primaryCol = module.columns[0];
  const dateCol = module.columns.find((c) => c.type === 'date');
  const secondarySummaryCol =
    module.columns.find((c) => c.type === 'text') || module.columns[1];

  const visibleCollapsedKeys = useMemo(() => {
    const keys = new Set<string>();
    if (primaryCol) keys.add(primaryCol.key);
    if (dateCol) keys.add(dateCol.key);
    if (secondarySummaryCol) keys.add(secondarySummaryCol.key);
    return keys;
  }, [primaryCol, dateCol, secondarySummaryCol]);

  const toggleExpandCard = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleCopyValue = (fieldId: string, val: string) => {
    if (!val) return;
    navigator.clipboard?.writeText(val);
    setCopiedField(fieldId);
    setTimeout(() => setCopiedField(null), 1500);
  };

  const handleApplyCustomPrefix = (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned = customPrefixInput.trim();
    if (!cleaned) return;
    onChangePrefixFilter(cleaned);
    setCustomPrefixInput('');
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-4 space-y-4">
      {/* Always-visible Search Bar Card + Collapsed Filters Accordion */}
      <div className="bg-white rounded-2xl shadow-[0_2px_12px_-3px_rgba(15,23,42,0.08)] p-3.5 sm:p-4 space-y-2.5">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            <h1 className="text-xs font-semibold text-slate-500">
              Buscador
            </h1>
            <button
              type="button"
              onClick={() => onOpenInfo('search')}
              aria-label="Información sobre el buscador"
              className="w-6 h-6 rounded-full flex items-center justify-center text-slate-400 hover:text-blue-700 hover:bg-blue-50 transition-colors"
            >
              <Info className="w-3.5 h-3.5" />
            </button>
          </div>

          {allModuleRecords.length > 0 && (
            <span className="text-xs text-slate-400 tabular-nums">
              {allModuleRecords.length} registros
            </span>
          )}
        </div>

        {/* Clean full-width search input */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="search"
            value={query}
            onChange={(e) => {
              onChangeQuery(e.target.value);
              setRenderLimit(50);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') onCommitSearchHistory();
            }}
            onBlur={() => {
              if (query.trim()) onCommitSearchHistory();
            }}
            placeholder="Escribe trámite, oficio, mercancía, código..."
            aria-label="Buscador general con coincidencia parcial"
            className="w-full min-h-[46px] pl-10 pr-10 py-2.5 bg-slate-50/90 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white focus:border-transparent transition-all"
          />
          {query && (
            <button
              type="button"
              onClick={() => onChangeQuery('')}
              aria-label="Limpiar búsqueda"
              className="min-h-[40px] min-w-[40px] flex items-center justify-center absolute right-1 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 rounded-lg"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Accordion for Smart Filters (Prefijos constantes + Meses) */}
        {allModuleRecords.length > 0 && (
          <div className="pt-1">
            <div className="flex items-center justify-between">
              <button
                type="button"
                aria-expanded={filtersAccordionOpen}
                onClick={() => setFiltersAccordionOpen(!filtersAccordionOpen)}
                className="w-full min-h-[40px] px-3 py-2 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors flex items-center justify-between gap-2 text-xs font-semibold text-slate-700"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <Filter className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                  <span className="truncate">
                    Filtros por constantes y meses
                  </span>
                  {activeFilterCount > 0 && (
                    <span className="font-mono tabular-nums text-blue-700">
                      ({activeFilterCount} activo{activeFilterCount > 1 ? 's' : ''})
                    </span>
                  )}
                </div>
                {filtersAccordionOpen ? (
                  <ChevronUp className="w-4 h-4 text-slate-500 shrink-0" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-slate-500 shrink-0" />
                )}
              </button>
            </div>

            {filtersAccordionOpen && (
              <div className="mt-3 pt-3 border-t border-slate-100 space-y-3">
                {/* Constant / Prefix Filter */}
                <div className="space-y-2">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
                      <Tag className="w-3.5 h-3.5 text-slate-500" />
                      <span>Constantes y prefijos detectados</span>
                      <button
                        type="button"
                        onClick={() => onOpenInfo('filters')}
                        aria-label="Información sobre filtros de constantes y meses"
                        className="w-6 h-6 rounded-full flex items-center justify-center text-slate-400 hover:text-blue-700 hover:bg-blue-50 transition-colors"
                      >
                        <Info className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <form
                      onSubmit={handleApplyCustomPrefix}
                      className="flex items-center gap-1.5"
                    >
                      <input
                        type="text"
                        value={customPrefixInput}
                        onChange={(e) => setCustomPrefixInput(e.target.value)}
                        placeholder="Prefijo manual (ej. CO116)"
                        className="min-h-[36px] w-44 px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                      />
                      <button
                        type="submit"
                        className="min-h-[36px] px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-semibold transition-colors"
                      >
                        Aplicar
                      </button>
                    </form>
                  </div>

                  <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
                    <button
                      type="button"
                      onClick={() => onChangePrefixFilter(null)}
                      className={`min-h-[36px] px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap shrink-0 transition-colors ${
                        prefixFilter === null
                          ? 'bg-blue-700 text-white'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      Todos los prefijos
                    </button>
                    {prefixFilter &&
                      !detectedPrefixes.some(
                        (d) =>
                          d.prefix.toLowerCase() === prefixFilter.toLowerCase()
                      ) && (
                        <button
                          type="button"
                          onClick={() => onChangePrefixFilter(null)}
                          className="min-h-[36px] px-3 py-1.5 rounded-lg bg-blue-700 text-white text-xs font-mono font-medium whitespace-nowrap shrink-0 flex items-center gap-1.5"
                        >
                          <span>{prefixFilter}</span>
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    {detectedPrefixes.map((item) => {
                      const active =
                        prefixFilter?.toLowerCase() ===
                        item.prefix.toLowerCase();
                      return (
                        <button
                          key={`${item.columnKey}-${item.prefix}`}
                          type="button"
                          onClick={() =>
                            onChangePrefixFilter(active ? null : item.prefix)
                          }
                          className={`min-h-[36px] px-3 py-1.5 rounded-lg text-xs font-mono tabular-nums whitespace-nowrap shrink-0 transition-colors ${
                            active
                              ? 'bg-blue-700 text-white font-semibold'
                              : 'bg-slate-100 text-slate-800 hover:bg-slate-200'
                          }`}
                        >
                          {item.prefix}{' '}
                          <span
                            className={
                              active ? 'text-blue-100' : 'text-slate-500'
                            }
                          >
                            ({item.count})
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Month Filter */}
                {availableMonths.length > 0 && (
                  <div className="space-y-2 pt-2 border-t border-slate-100">
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
                      <Calendar className="w-3.5 h-3.5 text-slate-500" />
                      <span>Filtrar por mes</span>
                    </div>
                    <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
                      <button
                        type="button"
                        onClick={() => onChangeMonthFilter(null)}
                        className={`min-h-[36px] px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap shrink-0 transition-colors ${
                          monthFilter === null
                            ? 'bg-slate-900 text-white'
                            : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                        }`}
                      >
                        Todos los meses
                      </button>
                      {availableMonths.map((m) => {
                        const active = monthFilter === m.monthKey;
                        return (
                          <button
                            key={m.monthKey}
                            type="button"
                            onClick={() =>
                              onChangeMonthFilter(active ? null : m.monthKey)
                            }
                            className={`min-h-[36px] px-3 py-1.5 rounded-lg text-xs tabular-nums whitespace-nowrap shrink-0 transition-colors ${
                              active
                                ? 'bg-slate-900 text-white font-semibold'
                                : 'bg-slate-100 text-slate-800 hover:bg-slate-200'
                            }`}
                          >
                            {m.label}{' '}
                            <span
                              className={
                                active ? 'text-slate-300' : 'text-slate-500'
                              }
                            >
                              ({m.count})
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Empty module state below search bar when no records imported yet */}
      {allModuleRecords.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-[0_2px_14px_-3px_rgba(15,23,42,0.08)] p-6 sm:p-8 text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-700 flex items-center justify-center mx-auto">
            <FileSpreadsheet className="w-6 h-6" />
          </div>
          <div className="space-y-1.5">
            <h2 className="text-base sm:text-lg font-bold text-slate-900 text-balance">
              {query.trim()
                ? `Sin registros cargados para buscar «${query}»`
                : `Módulo «${module.name}» sin registros`}
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 max-w-md mx-auto leading-relaxed">
              {isAdmin ? (
                <>
                  Usa los controles del{' '}
                  <strong className="text-slate-900">
                    menú lateral (sidebar)
                  </strong>{' '}
                  para subir tu archivo Excel desde la fila {module.startRow} o
                  cargar datos de ejemplo.
                </>
              ) : (
                'El administrador aún no ha publicado registros en este módulo. Cuando se importen, aparecerán aquí para que puedas buscarlos y consultarlos.'
              )}
            </p>
          </div>

          <div className="bg-slate-50 rounded-xl p-3.5 text-left max-w-lg mx-auto">
            <p className="text-xs font-semibold text-slate-600 mb-1">
              Campos del módulo ({module.columns.length})
            </p>
            <p className="text-xs text-slate-700 leading-relaxed">
              {module.columns.map((c) => c.label).join(' · ')}
            </p>
          </div>

          {/* Mobile-only button to open sidebar drawer for Admin */}
          {isAdmin && (
            <div className="lg:hidden pt-1">
              <button
                type="button"
                onClick={onOpenSidebar}
                className="min-h-[44px] px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold transition-colors inline-flex items-center justify-center gap-2"
              >
                <PanelLeftOpen className="w-4 h-4" />
                <span>Abrir menú lateral para importar</span>
              </button>
            </div>
          )}
        </div>
      ) : (
        <>
          {/* Results Toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-2 px-1">
            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600 tabular-nums">
              <span>
                <strong className="text-slate-900">
                  {filteredRecords.length}
                </strong>{' '}
                de {allModuleRecords.length} registros
              </span>
              {batchFilterId && (
                <>
                  <span aria-hidden="true">·</span>
                  <button
                    type="button"
                    onClick={onClearBatchFilter}
                    className="text-blue-700 font-semibold hover:underline flex items-center gap-1"
                  >
                    <span>Lote específico</span>
                    <X className="w-3.5 h-3.5" />
                  </button>
                </>
              )}
              {hasActiveFilters && (
                <>
                  <span aria-hidden="true">·</span>
                  <button
                    type="button"
                    onClick={() => {
                      onChangeQuery('');
                      onChangePrefixFilter(null);
                      onChangeMonthFilter(null);
                      onClearBatchFilter();
                    }}
                    className="text-blue-700 font-semibold hover:underline"
                  >
                    Limpiar filtros
                  </button>
                </>
              )}
            </div>

            <div className="flex items-center gap-2">
              {selectedRecordIds.size > 0 ? (
                <button
                  type="button"
                  onClick={onClearSelection}
                  className="min-h-[36px] px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 tabular-nums"
                >
                  Deseleccionar ({selectedRecordIds.size})
                </button>
              ) : (
                filteredRecords.length > 0 && (
                  <button
                    type="button"
                    onClick={onSelectAllFiltered}
                    className="min-h-[36px] px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900"
                  >
                    Seleccionar todos
                  </button>
                )
              )}

              {/* View mode switcher */}
              <div className="hidden md:flex items-center p-0.5 bg-slate-200/70 rounded-lg">
                <button
                  type="button"
                  onClick={() => setViewMode('cards')}
                  aria-label="Vista en tarjetas"
                  className={`min-h-[32px] px-2.5 py-1 rounded-md text-xs font-medium flex items-center gap-1 ${
                    viewMode === 'cards'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600'
                  }`}
                >
                  <LayoutGrid className="w-3.5 h-3.5" />
                  <span>Tarjetas</span>
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('table')}
                  aria-label="Vista en tabla"
                  className={`min-h-[32px] px-2.5 py-1 rounded-md text-xs font-medium flex items-center gap-1 ${
                    viewMode === 'table'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600'
                  }`}
                >
                  <Table className="w-3.5 h-3.5" />
                  <span>Tabla</span>
                </button>
              </div>
            </div>
          </div>

          {/* Results List */}
          {filteredRecords.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-[0_2px_12px_-3px_rgba(15,23,42,0.08)] p-8 text-center space-y-3">
              <Search className="w-8 h-8 text-slate-300 mx-auto" />
              <p className="text-sm font-semibold text-slate-900">
                No hay coincidencias para los filtros actuales
              </p>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Prueba con una subcadena más corta (búsqueda parcial LIKE) o
                quita el filtro de prefijo/mes.
              </p>
              <button
                type="button"
                onClick={() => {
                  onChangeQuery('');
                  onChangePrefixFilter(null);
                  onChangeMonthFilter(null);
                  onClearBatchFilter();
                }}
                className="min-h-[44px] px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-semibold"
              >
                Restablecer búsqueda
              </button>
            </div>
          ) : viewMode === 'table' ? (
            <div className="bg-white rounded-2xl shadow-[0_2px_12px_-3px_rgba(15,23,42,0.08)] overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100 text-xs font-semibold text-slate-600">
                      <th className="py-3 px-3 w-10"></th>
                      {module.columns.map((col) => (
                        <th key={col.key} className="py-3 px-3 whitespace-nowrap">
                          {col.label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs">
                    {visibleRecords.map((rec) => {
                      const selected = selectedRecordIds.has(rec.id);
                      const isExpanded = expandedIds.has(rec.id);
                      return (
                        <React.Fragment key={rec.id}>
                          <tr
                            onClick={() => toggleExpandCard(rec.id)}
                            className={`cursor-pointer transition-colors ${
                              selected ? 'bg-blue-50/50' : 'hover:bg-slate-50'
                            }`}
                          >
                            <td
                              className="py-2.5 px-3"
                              onClick={(e) => {
                                e.stopPropagation();
                                onToggleSelectRecord(rec.id);
                              }}
                            >
                              <button
                                type="button"
                                aria-label="Seleccionar registro"
                                className="p-1 text-slate-500 hover:text-blue-700"
                              >
                                {selected ? (
                                  <CheckSquare className="w-4 h-4 text-blue-700" />
                                ) : (
                                  <Square className="w-4 h-4" />
                                )}
                              </button>
                            </td>
                            {module.columns.map((col) => (
                              <td
                                key={col.key}
                                className={`py-2.5 px-3 text-slate-800 ${
                                  col.type === 'code' || col.type === 'date'
                                    ? 'font-mono tabular-nums whitespace-nowrap'
                                    : 'max-w-md'
                                }`}
                              >
                                <HighlightedText
                                  text={rec.values[col.key] || ''}
                                  query={query}
                                />
                              </td>
                            ))}
                          </tr>
                          {isExpanded && (
                            <tr className="bg-slate-50/70">
                              <td
                                colSpan={module.columns.length + 1}
                                className="p-4"
                              >
                                <div className="flex flex-wrap items-center justify-between gap-2 pb-2 mb-2 border-b border-slate-200/70 text-xs text-slate-500">
                                  <span className="font-semibold text-slate-700">
                                    Datos completos · Fila Excel #{rec.sourceRow}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => onToggleBookmark(rec.id)}
                                    className="px-2.5 py-1 rounded-lg bg-white shadow-xs text-xs font-medium text-slate-700 hover:text-amber-700"
                                  >
                                    {rec.bookmarked
                                      ? 'Guardado en antecedentes'
                                      : 'Guardar en antecedentes'}
                                  </button>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                  {module.columns.map((col) => (
                                    <div key={col.key} className="space-y-0.5">
                                      <p className="text-[11px] font-semibold text-slate-500">
                                        {col.label}
                                      </p>
                                      <p className="text-xs text-slate-900 break-words">
                                        {rec.values[col.key] || '—'}
                                      </p>
                                    </div>
                                  ))}
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            /* Minimalist Borderless Cards with Soft Shadow & In-Place Expansion */
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3.5 items-start">
              {visibleRecords.map((rec) => {
                const selected = selectedRecordIds.has(rec.id);
                const isExpanded = expandedIds.has(rec.id);
                const hiddenMatches =
                  !isExpanded && query.trim()
                    ? extractHiddenMatchSnippets(
                        rec,
                        query,
                        module.columns,
                        visibleCollapsedKeys
                      )
                    : [];

                return (
                  <div key={rec.id} className="flex flex-col items-start">
                    {/* Minimalist bubble right above the card when match is inside hidden data */}
                    {hiddenMatches.length > 0 && (
                      <button
                        type="button"
                        onClick={() => toggleExpandCard(rec.id)}
                        title={`Coincidencia interna en ${hiddenMatches[0].columnLabel}`}
                        className="mb-1.5 ml-1 max-w-full inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white text-slate-700 shadow-[0_2px_8px_-2px_rgba(29,78,216,0.18)] hover:shadow-[0_4px_12px_-2px_rgba(29,78,216,0.24)] transition-shadow text-[11px]"
                      >
                        <span className="text-slate-400 font-medium shrink-0">
                          {hiddenMatches[0].columnLabel}:
                        </span>
                        <span className="truncate font-mono text-slate-900">
                          <HighlightedText
                            text={hiddenMatches[0].snippet}
                            query={query}
                          />
                        </span>
                        {hiddenMatches.length > 1 && (
                          <span className="text-blue-700 font-semibold shrink-0 tabular-nums">
                            +{hiddenMatches.length - 1}
                          </span>
                        )}
                      </button>
                    )}

                    <article
                      onClick={() => toggleExpandCard(rec.id)}
                      className={`w-full bg-white rounded-2xl p-4 transition-all cursor-pointer flex flex-col justify-between gap-2.5 ${
                        selected
                          ? 'ring-2 ring-blue-600 shadow-[0_6px_20px_-4px_rgba(29,78,216,0.18)]'
                          : isExpanded
                          ? 'shadow-[0_10px_28px_-6px_rgba(15,23,42,0.14)]'
                          : 'shadow-[0_2px_12px_-3px_rgba(15,23,42,0.08)] hover:shadow-[0_6px_20px_-4px_rgba(15,23,42,0.12)]'
                      }`}
                    >
                    {/* Minimalist Collapsed Header */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1 space-y-1">
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-slate-500 tabular-nums">
                          {primaryCol && (
                            <span className="font-mono font-semibold text-blue-700">
                              <HighlightedText
                                text={rec.values[primaryCol.key] || ''}
                                query={query}
                              />
                            </span>
                          )}
                          {dateCol && rec.values[dateCol.key] && (
                            <>
                              <span aria-hidden="true">·</span>
                              <span className="font-mono">
                                <HighlightedText
                                  text={rec.values[dateCol.key]}
                                  query={query}
                                />
                              </span>
                            </>
                          )}
                          {rec.bookmarked && (
                            <>
                              <span aria-hidden="true">·</span>
                              <span className="inline-flex items-center gap-0.5 text-amber-700 font-medium">
                                <Bookmark className="w-3 h-3 fill-current" />
                                <span>Guardado</span>
                              </span>
                            </>
                          )}
                        </div>

                        {/* Compact summary line when collapsed */}
                        {!isExpanded && secondarySummaryCol && (
                          <p className="text-sm font-medium text-slate-900 leading-snug line-clamp-2">
                            <HighlightedText
                              text={rec.values[secondarySummaryCol.key] || ''}
                              query={query}
                            />
                          </p>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onToggleSelectRecord(rec.id);
                        }}
                        aria-label={
                          selected
                            ? 'Deseleccionar registro'
                            : 'Seleccionar registro'
                        }
                        className="min-h-[36px] min-w-[36px] -mr-1.5 -mt-1 flex items-center justify-center rounded-lg text-slate-400 hover:text-blue-700 hover:bg-slate-50 shrink-0"
                      >
                        {selected ? (
                          <CheckSquare className="w-4 h-4 text-blue-700" />
                        ) : (
                          <Square className="w-4 h-4" />
                        )}
                      </button>
                    </div>

                    {/* Expanded View: Complete Data of the Record In-Place */}
                    {isExpanded && (
                      <div
                        className="pt-2.5 mt-0.5 border-t border-slate-100 space-y-2.5"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {module.columns.map((col) => {
                          const val = rec.values[col.key] || '';
                          const fieldKey = `${rec.id}-${col.key}`;
                          const isCopied = copiedField === fieldKey;
                          return (
                            <div
                              key={col.key}
                              className="bg-slate-50/80 rounded-xl px-3 py-2 space-y-0.5"
                            >
                              <div className="flex items-center justify-between gap-2">
                                <span className="text-[11px] font-semibold text-slate-500">
                                  {col.label}
                                </span>
                                {val && (
                                  <button
                                    type="button"
                                    onClick={() => handleCopyValue(fieldKey, val)}
                                    className="text-[11px] font-medium text-blue-700 hover:text-blue-800 flex items-center gap-1 py-0.5 px-1.5 rounded"
                                  >
                                    {isCopied ? (
                                      <>
                                        <Check className="w-3 h-3" />
                                        <span>Copiado</span>
                                      </>
                                    ) : (
                                      <>
                                        <Copy className="w-3 h-3" />
                                        <span>Copiar</span>
                                      </>
                                    )}
                                  </button>
                                )}
                              </div>
                              <p
                                className={`text-xs sm:text-sm text-slate-900 break-words ${
                                  col.type === 'code' || col.type === 'date'
                                    ? 'font-mono tabular-nums font-medium'
                                    : 'leading-relaxed'
                                }`}
                              >
                                <HighlightedText text={val} query={query} />
                              </p>
                            </div>
                          );
                        })}

                        <div className="pt-1">
                          <button
                            type="button"
                            onClick={() => onToggleBookmark(rec.id)}
                            className={`w-full min-h-[40px] px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 ${
                              rec.bookmarked
                                ? 'bg-amber-50 text-amber-900'
                                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                            }`}
                          >
                            <Bookmark
                              className={`w-3.5 h-3.5 ${
                                rec.bookmarked ? 'fill-current' : ''
                              }`}
                            />
                            <span>
                              {rec.bookmarked
                                ? 'Guardado en antecedentes'
                                : 'Guardar en antecedentes'}
                            </span>
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Minimalist Expand / Collapse Footer */}
                    <div className="pt-1 flex items-center justify-between text-[11px] text-slate-400 tabular-nums">
                      <span>Fila #{rec.sourceRow}</span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleExpandCard(rec.id);
                        }}
                        className="text-blue-700 font-semibold flex items-center gap-1 py-0.5"
                      >
                        <span>
                          {isExpanded ? 'Contraer' : 'Expandir datos'}
                        </span>
                        {isExpanded ? (
                          <ChevronUp className="w-3.5 h-3.5" />
                        ) : (
                          <ChevronDown className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                    </article>
                  </div>
                );
              })}
            </div>
          )}

          {/* Load more results if needed */}
          {visibleRecords.length < filteredRecords.length && (
            <div className="flex justify-center pt-2">
              <button
                type="button"
                onClick={() => setRenderLimit((prev) => prev + 60)}
                className="min-h-[44px] px-5 py-2.5 bg-white rounded-xl shadow-[0_2px_10px_-3px_rgba(15,23,42,0.08)] text-xs font-semibold text-slate-800 hover:bg-slate-50 tabular-nums"
              >
                Mostrar más resultados ({visibleRecords.length} de{' '}
                {filteredRecords.length})
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

import React, { useEffect, useMemo, useRef, useState } from 'react';
import * as XLSX from 'xlsx';
import {
  AlertTriangle,
  Download,
  FileText,
  Info,
  Loader2,
  Menu,
  Search,
  ShieldCheck,
  User,
} from 'lucide-react';
import {
  BottomNavTab,
  DataRecord,
  ImportBatch,
  ImportLimitOption,
  ModuleConfig,
  ParsedExcelPreview,
  SearchHistoryItem,
} from './types/records';
import { AppUser } from './utils/auth';
import {
  deleteVaultFile,
  getAllVaultFiles,
  saveVaultFile,
  UploadedVaultFile,
} from './utils/fileVault';
import {
  createSampleExcelBuffer,
  DEFAULT_MODULES,
} from './data/defaultModules';
import {
  buildPreviewFromMatrix,
  exportRecordsToFile,
  getRawMatrixFromSheet,
  readWorkbookFromBuffer,
} from './utils/excelParser';
import {
  extractAvailableMonths,
  extractConstantPrefixes,
  matchesLikeQuery,
  matchesMonthFilter,
  matchesPrefixFilter,
} from './utils/searchEngine';
import { LoginView } from './components/LoginView';
import { SidebarDrawer } from './components/SidebarDrawer';
import { ImportPreviewModal } from './components/ImportPreviewModal';
import { ModuleCreatorModal } from './components/ModuleCreatorModal';
import { SearchView } from './components/SearchView';
import { HistoryView } from './components/HistoryView';
import { DownloadsView } from './components/DownloadsView';
import { RecordDetailSheet } from './components/RecordDetailSheet';
import { InfoModal, InfoTopicId } from './components/InfoModal';

const STORAGE_KEYS = {
  modules: 'regis_excel_v1_modules',
  records: 'regis_excel_v1_records',
  batches: 'regis_excel_v1_batches',
  searchHistory: 'regis_excel_v1_search_history',
  downloads: 'regis_excel_v1_downloads',
  activeModuleId: 'regis_excel_v1_active_module',
  currentUser: 'regis_excel_v1_current_user',
};

function loadFromStorage<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function saveToStorage<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Ignore quota exceeded errors gracefully
  }
}

export default function App() {
  const [currentUser, setCurrentUser] = useState<AppUser | null>(() =>
    loadFromStorage<AppUser | null>(STORAGE_KEYS.currentUser, null)
  );
  const [modules, setModules] = useState<ModuleConfig[]>(() =>
    loadFromStorage(STORAGE_KEYS.modules, DEFAULT_MODULES)
  );
  const [activeModuleId, setActiveModuleId] = useState<string>(() =>
    loadFromStorage(STORAGE_KEYS.activeModuleId, DEFAULT_MODULES[0].id)
  );
  const [records, setRecords] = useState<DataRecord[]>(() =>
    loadFromStorage(STORAGE_KEYS.records, [])
  );
  const [batches, setBatches] = useState<ImportBatch[]>(() =>
    loadFromStorage(STORAGE_KEYS.batches, [])
  );
  const [searchHistory, setSearchHistory] = useState<SearchHistoryItem[]>(() =>
    loadFromStorage(STORAGE_KEYS.searchHistory, [])
  );
  const [vaultFiles, setVaultFiles] = useState<UploadedVaultFile[]>([]);

  const isAdmin = currentUser?.role === 'admin';

  // Navigation & UI state
  const [activeTab, setActiveTab] = useState<BottomNavTab>('search');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showNewModuleModal, setShowNewModuleModal] = useState(false);
  const [detailRecordId, setDetailRecordId] = useState<string | null>(null);
  const [infoOpen, setInfoOpen] = useState(false);
  const [infoTopic, setInfoTopic] = useState<InfoTopicId>('all');

  const handleOpenInfo = (topic: InfoTopicId = 'all') => {
    setInfoTopic(topic);
    setInfoOpen(true);
  };

  // Search & Filter state (per session)
  const [query, setQuery] = useState('');
  const [prefixFilter, setPrefixFilter] = useState<string | null>(null);
  const [monthFilter, setMonthFilter] = useState<string | null>(null);
  const [batchFilterId, setBatchFilterId] = useState<string | null>(null);
  const [selectedRecordIds, setSelectedRecordIds] = useState<Set<string>>(
    new Set()
  );

  // Excel Reading & Preview state
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isReadingExcel, setIsReadingExcel] = useState(false);
  const [excelError, setExcelError] = useState<string | null>(null);
  const [activeWorkbook, setActiveWorkbook] = useState<XLSX.WorkBook | null>(
    null
  );
  const [previewData, setPreviewData] = useState<ParsedExcelPreview | null>(
    null
  );
  const [previewTargetModuleId, setPreviewTargetModuleId] = useState<string>(
    activeModuleId
  );

  // Persist to localStorage
  useEffect(() => {
    try {
      if (currentUser) {
        localStorage.setItem(
          STORAGE_KEYS.currentUser,
          JSON.stringify(currentUser)
        );
      } else {
        localStorage.removeItem(STORAGE_KEYS.currentUser);
      }
    } catch {
      // Ignore storage errors
    }
  }, [currentUser]);
  useEffect(() => saveToStorage(STORAGE_KEYS.modules, modules), [modules]);
  useEffect(
    () => saveToStorage(STORAGE_KEYS.activeModuleId, activeModuleId),
    [activeModuleId]
  );
  useEffect(() => saveToStorage(STORAGE_KEYS.records, records), [records]);
  useEffect(() => saveToStorage(STORAGE_KEYS.batches, batches), [batches]);
  useEffect(
    () => saveToStorage(STORAGE_KEYS.searchHistory, searchHistory),
    [searchHistory]
  );
  useEffect(() => {
    getAllVaultFiles().then(setVaultFiles);
  }, []);

  const activeModule = useMemo(
    () => modules.find((m) => m.id === activeModuleId) || modules[0],
    [modules, activeModuleId]
  );

  const previewTargetModule = useMemo(
    () => modules.find((m) => m.id === previewTargetModuleId) || activeModule,
    [modules, previewTargetModuleId, activeModule]
  );

  // Record counts per module
  const recordCountByModule = useMemo(() => {
    const map: Record<string, number> = {};
    for (const r of records) {
      map[r.moduleId] = (map[r.moduleId] || 0) + 1;
    }
    return map;
  }, [records]);

  // Records belonging to the active module
  const activeModuleRecords = useMemo(
    () => records.filter((r) => r.moduleId === activeModule.id),
    [records, activeModule.id]
  );

  const activeModuleBatches = useMemo(
    () => batches.filter((b) => b.moduleId === activeModule.id),
    [batches, activeModule.id]
  );

  const activeModuleSearchHistory = useMemo(
    () => searchHistory.filter((h) => h.moduleId === activeModule.id),
    [searchHistory, activeModule.id]
  );

  const bookmarkedRecords = useMemo(
    () => activeModuleRecords.filter((r) => r.bookmarked),
    [activeModuleRecords]
  );

  // Smart filters derived from active module records
  const detectedPrefixes = useMemo(
    () => extractConstantPrefixes(activeModuleRecords, activeModule.columns),
    [activeModuleRecords, activeModule.columns]
  );

  const availableMonths = useMemo(
    () => extractAvailableMonths(activeModuleRecords),
    [activeModuleRecords]
  );

  // Filtered records (%LIKE% + constant prefix + month + optional batch)
  const filteredRecords = useMemo(() => {
    return activeModuleRecords.filter((rec) => {
      if (batchFilterId && rec.batchId !== batchFilterId) return false;
      if (!matchesPrefixFilter(rec, prefixFilter, activeModule.columns)) {
        return false;
      }
      if (!matchesMonthFilter(rec, monthFilter)) return false;
      if (!matchesLikeQuery(rec, query, activeModule.columns)) return false;
      return true;
    });
  }, [
    activeModuleRecords,
    activeModule.columns,
    batchFilterId,
    prefixFilter,
    monthFilter,
    query,
  ]);

  const activeModuleVaultFiles = useMemo(
    () => vaultFiles.filter((f) => f.moduleId === activeModule.id),
    [vaultFiles, activeModule.id]
  );

  const detailRecord = useMemo(
    () => records.find((r) => r.id === detailRecordId) || null,
    [records, detailRecordId]
  );

  // Switch active module cleanly
  const handleSelectModule = (moduleId: string) => {
    setActiveModuleId(moduleId);
    setQuery('');
    setPrefixFilter(null);
    setMonthFilter(null);
    setBatchFilterId(null);
    setSelectedRecordIds(new Set());
  };

  // Trigger file input
  const handleTriggerUpload = () => {
    setExcelError(null);
    fileInputRef.current?.click();
  };

  // Parse an ArrayBuffer into Preview Modal
  const openBufferInPreview = (buffer: ArrayBuffer, fileName: string) => {
    try {
      const wb = readWorkbookFromBuffer(buffer);
      if (!wb.SheetNames || wb.SheetNames.length === 0) {
        throw new Error('El archivo no contiene hojas válidas.');
      }
      const firstSheet = wb.SheetNames[0];
      const matrix = getRawMatrixFromSheet(wb, firstSheet);

      setActiveWorkbook(wb);
      setPreviewTargetModuleId(activeModule.id);
      const preview = buildPreviewFromMatrix({
        fileName,
        sheetNames: wb.SheetNames,
        selectedSheet: firstSheet,
        rawMatrix: matrix,
        module: activeModule,
        startRow: activeModule.startRow,
        hasHeaderRow: activeModule.hasHeaderRow,
      });
      setPreviewData(preview);
    } catch (err) {
      setExcelError(
        err instanceof Error
          ? err.message
          : 'No se pudo leer el archivo Excel. Verifica que sea .xlsx, .xls o .csv.'
      );
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    setIsReadingExcel(true);
    setExcelError(null);

    try {
      const buffer = await file.arrayBuffer();
      // Small yield so loading indicator paints reliably on mobile
      await new Promise((r) => setTimeout(r, 120));
      openBufferInPreview(buffer, file.name);
    } catch {
      setExcelError('Error al leer el archivo seleccionado.');
    } finally {
      setIsReadingExcel(false);
    }
  };

  const handleLoadSampleExcel = async () => {
    setIsReadingExcel(true);
    setExcelError(null);
    try {
      await new Promise((r) => setTimeout(r, 150));
      const { buffer, fileName } = createSampleExcelBuffer(activeModule);
      openBufferInPreview(buffer, fileName);
    } catch {
      setExcelError('No se pudo generar el Excel de ejemplo.');
    } finally {
      setIsReadingExcel(false);
    }
  };

  // Preview Modal reconfiguration handlers
  const handlePreviewChangeTargetModule = (nextModuleId: string) => {
    const nextMod = modules.find((m) => m.id === nextModuleId);
    if (!nextMod || !previewData) return;
    setPreviewTargetModuleId(nextModuleId);
    setPreviewData(
      buildPreviewFromMatrix({
        fileName: previewData.fileName,
        sheetNames: previewData.sheetNames,
        selectedSheet: previewData.selectedSheet,
        rawMatrix: previewData.rawMatrix,
        module: nextMod,
        startRow: nextMod.startRow,
        hasHeaderRow: nextMod.hasHeaderRow,
      })
    );
  };

  const handlePreviewChangeSheet = (sheetName: string) => {
    if (!activeWorkbook || !previewData) return;
    const matrix = getRawMatrixFromSheet(activeWorkbook, sheetName);
    setPreviewData(
      buildPreviewFromMatrix({
        fileName: previewData.fileName,
        sheetNames: previewData.sheetNames,
        selectedSheet: sheetName,
        rawMatrix: matrix,
        module: previewTargetModule,
        startRow: previewData.startRow,
        hasHeaderRow: previewData.hasHeaderRow,
      })
    );
  };

  const handlePreviewChangeStartRow = (
    startRow: number,
    hasHeaderRow: boolean
  ) => {
    if (!previewData) return;
    setPreviewData(
      buildPreviewFromMatrix({
        fileName: previewData.fileName,
        sheetNames: previewData.sheetNames,
        selectedSheet: previewData.selectedSheet,
        rawMatrix: previewData.rawMatrix,
        module: previewTargetModule,
        startRow,
        hasHeaderRow,
      })
    );
  };

  const handlePreviewChangeMapping = (mapping: Record<string, number>) => {
    if (!previewData) return;
    setPreviewData(
      buildPreviewFromMatrix({
        fileName: previewData.fileName,
        sheetNames: previewData.sheetNames,
        selectedSheet: previewData.selectedSheet,
        rawMatrix: previewData.rawMatrix,
        module: previewTargetModule,
        startRow: previewData.startRow,
        hasHeaderRow: previewData.hasHeaderRow,
        customMapping: mapping,
      })
    );
  };

  const handleConfirmImport = (
    limit: ImportLimitOption,
    mode: 'replace' | 'append'
  ) => {
    if (!previewData) return;

    const slice =
      limit === 'all'
        ? previewData.parsedRows
        : previewData.parsedRows.slice(0, limit);

    const nowIso = new Date().toISOString();
    const batchId = `batch-${Date.now()}`;

    const newRecords: DataRecord[] = slice.map((row, idx) => ({
      id: `${batchId}-${idx}`,
      moduleId: previewTargetModule.id,
      values: row.values,
      monthKeys: row.monthKeys,
      importedAt: nowIso,
      batchId,
      sourceRow: row.sourceRow,
      bookmarked: false,
    }));

    const newBatch: ImportBatch = {
      id: batchId,
      moduleId: previewTargetModule.id,
      fileName: previewData.fileName,
      sheetName: previewData.selectedSheet,
      totalRowsInFile: previewData.parsedRows.length,
      importedCount: newRecords.length,
      startRow: previewData.startRow,
      importedAt: nowIso,
      mode,
    };

    if (mode === 'replace') {
      setRecords((prev) => [
        ...prev.filter((r) => r.moduleId !== previewTargetModule.id),
        ...newRecords,
      ]);
      setBatches((prev) => [
        newBatch,
        ...prev.filter((b) => b.moduleId !== previewTargetModule.id),
      ]);
    } else {
      setRecords((prev) => [...newRecords, ...prev]);
      setBatches((prev) => [newBatch, ...prev]);
    }

    // Switch to target module if changed inside preview
    if (previewTargetModule.id !== activeModuleId) {
      setActiveModuleId(previewTargetModule.id);
    }

    setQuery('');
    setPrefixFilter(null);
    setMonthFilter(null);
    setBatchFilterId(null);
    setSelectedRecordIds(new Set());
    setPreviewData(null);
    setActiveWorkbook(null);
    setActiveTab('search');
  };

  // Commit search query to Antecedentes history
  const handleCommitSearchHistory = () => {
    const trimmed = query.trim();
    if (!trimmed && !prefixFilter && !monthFilter) return;

    setSearchHistory((prev) => {
      const duplicate = prev[0];
      if (
        duplicate &&
        duplicate.moduleId === activeModule.id &&
        duplicate.query === trimmed &&
        duplicate.prefixFilter === prefixFilter &&
        duplicate.monthFilter === monthFilter
      ) {
        return prev;
      }

      const item: SearchHistoryItem = {
        id: `sh-${Date.now()}`,
        moduleId: activeModule.id,
        query: trimmed,
        prefixFilter,
        monthFilter,
        resultCount: filteredRecords.length,
        timestamp: new Date().toISOString(),
      };
      return [item, ...prev].slice(0, 40);
    });
  };

  const handleToggleBookmark = (recordId: string) => {
    setRecords((prev) =>
      prev.map((r) =>
        r.id === recordId ? { ...r, bookmarked: !r.bookmarked } : r
      )
    );
  };

  const handleToggleSelectRecord = (id: string) => {
    setSelectedRecordIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleExportSingleRecord = (
    dataset: DataRecord[],
    format: 'xlsx' | 'csv' | 'json',
    scopeLabel: string
  ) => {
    if (dataset.length === 0) return;
    const slug = activeModule.name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '_');
    const dateTag = new Date().toISOString().slice(0, 10);
    exportRecordsToFile(
      dataset,
      activeModule,
      format,
      `${slug}_${scopeLabel}_${dateTag}`
    );
  };

  const handleUploadVaultFiles = async (fileList: FileList, note?: string) => {
    if (!isAdmin) return;
    const uploaded: UploadedVaultFile[] = [];
    for (let i = 0; i < fileList.length; i++) {
      const f = fileList[i];
      const item: UploadedVaultFile = {
        id: `vault-${Date.now()}-${i}-${Math.random().toString(36).slice(2, 6)}`,
        moduleId: activeModule.id,
        name: f.name,
        size: f.size,
        mimeType: f.type || 'application/octet-stream',
        note,
        uploadedAt: new Date().toISOString(),
        blob: f,
      };
      await saveVaultFile(item);
      uploaded.push(item);
    }
    setVaultFiles((prev) => [...uploaded, ...prev]);
  };

  const handleDeleteVaultFile = async (id: string) => {
    if (!isAdmin) return;
    await deleteVaultFile(id);
    setVaultFiles((prev) => prev.filter((f) => f.id !== id));
  };

  const handleDeleteBatch = (batchId: string) => {
    if (!isAdmin) return;
    setBatches((prev) => prev.filter((b) => b.id !== batchId));
    setRecords((prev) => prev.filter((r) => r.batchId !== batchId));
    if (batchFilterId === batchId) setBatchFilterId(null);
  };

  const handleClearModuleData = (moduleId: string) => {
    if (!isAdmin) return;
    setRecords((prev) => prev.filter((r) => r.moduleId !== moduleId));
    setBatches((prev) => prev.filter((b) => b.moduleId !== moduleId));
    setSelectedRecordIds(new Set());
    setBatchFilterId(null);
  };

  const handleLogin = (user: AppUser) => {
    setCurrentUser(user);
    setSidebarOpen(false);
    setActiveTab('search');
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setPreviewData(null);
    setActiveWorkbook(null);
    setShowNewModuleModal(false);
    setSidebarOpen(false);
  };

  if (!currentUser) {
    return <LoginView onLogin={handleLogin} />;
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      {/* Hidden Excel File Input (Admin only) */}
      {isAdmin && (
        <input
          ref={fileInputRef}
          type="file"
          accept=".xlsx,.xls,.csv"
          onChange={handleFileChange}
          className="hidden"
          aria-hidden="true"
        />
      )}

      {/* Sticky Top App Bar (compact 56px) */}
      <header className="sticky top-0 z-30 h-14 bg-white/95 backdrop-blur-md border-b border-slate-200 px-3 sm:px-5 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <button
            type="button"
            onClick={() => setSidebarOpen(true)}
            aria-label="Abrir selector de módulos"
            className="lg:hidden min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-slate-700 hover:bg-slate-100 transition-colors shrink-0"
          >
            <Menu className="w-5 h-5" />
          </button>

          <span className="text-base sm:text-lg font-bold tracking-tight text-slate-900 whitespace-nowrap shrink-0">
            Prototipo
          </span>
        </div>

        {/* Primary Actions: Current Role + Info button */}
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={() => setSidebarOpen(true)}
            className="min-h-[36px] px-2.5 py-1 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors"
            title="Usuario actual y cambio de rol"
          >
            {isAdmin ? (
              <ShieldCheck className="w-3.5 h-3.5 text-blue-700 shrink-0" />
            ) : (
              <User className="w-3.5 h-3.5 text-slate-600 shrink-0" />
            )}
            <span>{isAdmin ? 'Admin' : 'Cliente'}</span>
          </button>

          <button
            type="button"
            onClick={() => handleOpenInfo('all')}
            aria-label="Información y guía de uso"
            className="min-h-[40px] px-3 py-1.5 flex items-center justify-center gap-1.5 rounded-xl text-slate-600 hover:text-blue-700 hover:bg-blue-50 transition-colors text-xs font-semibold"
          >
            <Info className="w-4 h-4" />
            <span className="hidden sm:inline">Info</span>
          </button>
        </div>
      </header>

      {/* Main Layout: Sidebar + Content Viewport */}
      <div className="flex-1 flex">
        <SidebarDrawer
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          currentUser={currentUser}
          onLogout={handleLogout}
          onSwitchUser={handleLogin}
          modules={modules}
          activeModuleId={activeModule.id}
          onSelectModule={handleSelectModule}
          recordCountByModule={recordCountByModule}
          onTriggerUpload={handleTriggerUpload}
          onLoadSampleExcel={handleLoadSampleExcel}
          onOpenNewModule={() => {
            if (isAdmin) setShowNewModuleModal(true);
          }}
          onClearModuleData={handleClearModuleData}
          onOpenInfo={handleOpenInfo}
        />

        <main className="flex-1 min-w-0 pb-24">
          {/* Loading / Error Notices */}
          {isReadingExcel && (
            <div className="max-w-4xl mx-auto px-4 pt-4">
              <div className="bg-blue-50 border border-blue-200 text-blue-900 rounded-xl px-4 py-3 text-xs font-semibold flex items-center gap-2.5">
                <Loader2 className="w-4 h-4 animate-spin text-blue-700 shrink-0" />
                <span>
                  Leyendo archivo Excel y preparando vista previa desde la fila{' '}
                  {activeModule.startRow}...
                </span>
              </div>
            </div>
          )}

          {excelError && (
            <div className="max-w-4xl mx-auto px-4 pt-4">
              <div
                role="alert"
                className="bg-red-50 border border-red-200 text-red-900 rounded-xl px-4 py-3 text-xs font-medium flex items-center justify-between gap-2"
              >
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-red-700 shrink-0" />
                  <span>{excelError}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setExcelError(null)}
                  className="text-red-700 font-semibold underline shrink-0"
                >
                  Cerrar
                </button>
              </div>
            </div>
          )}

          {/* Active Tab View */}
          {activeTab === 'search' && (
            <SearchView
              module={activeModule}
              isAdmin={isAdmin}
              allModuleRecords={activeModuleRecords}
              filteredRecords={filteredRecords}
              query={query}
              onChangeQuery={setQuery}
              onCommitSearchHistory={handleCommitSearchHistory}
              prefixFilter={prefixFilter}
              onChangePrefixFilter={setPrefixFilter}
              monthFilter={monthFilter}
              onChangeMonthFilter={setMonthFilter}
              batchFilterId={batchFilterId}
              onClearBatchFilter={() => setBatchFilterId(null)}
              detectedPrefixes={detectedPrefixes}
              availableMonths={availableMonths}
              selectedRecordIds={selectedRecordIds}
              onToggleSelectRecord={handleToggleSelectRecord}
              onSelectAllFiltered={() =>
                setSelectedRecordIds(new Set(filteredRecords.map((r) => r.id)))
              }
              onClearSelection={() => setSelectedRecordIds(new Set())}
              onToggleBookmark={handleToggleBookmark}
              onOpenSidebar={() => setSidebarOpen(true)}
              onOpenInfo={handleOpenInfo}
            />
          )}

          {activeTab === 'history' && (
            <HistoryView
              module={activeModule}
              isAdmin={isAdmin}
              batches={activeModuleBatches}
              searchHistory={activeModuleSearchHistory}
              bookmarkedRecords={bookmarkedRecords}
              onApplySearchFromHistory={(item) => {
                setQuery(item.query);
                setPrefixFilter(item.prefixFilter);
                setMonthFilter(item.monthFilter);
                setBatchFilterId(null);
                setActiveTab('search');
              }}
              onFilterByBatch={(batchId) => {
                setBatchFilterId(batchId);
                setActiveTab('search');
              }}
              onDeleteBatch={handleDeleteBatch}
              onOpenRecord={(rec) => setDetailRecordId(rec.id)}
              onClearSearchHistory={() =>
                setSearchHistory((prev) =>
                  prev.filter((h) => h.moduleId !== activeModule.id)
                )
              }
            />
          )}

          {activeTab === 'downloads' && (
            <DownloadsView
              module={activeModule}
              isAdmin={isAdmin}
              files={activeModuleVaultFiles}
              onUploadFiles={handleUploadVaultFiles}
              onDeleteFile={handleDeleteVaultFile}
              onOpenInfo={handleOpenInfo}
            />
          )}
        </main>
      </div>

      {/* Fixed Bottom Navigation (Exactly 3 Options - Mobile-First) */}
      <nav
        aria-label="Navegación principal inferior"
        className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 pb-safe"
      >
        <div className="max-w-lg mx-auto grid grid-cols-3 h-15">
          <button
            type="button"
            onClick={() => setActiveTab('search')}
            aria-current={activeTab === 'search' ? 'page' : undefined}
            className={`min-h-[44px] flex flex-col items-center justify-center gap-0.5 transition-colors ${
              activeTab === 'search'
                ? 'text-blue-700'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <Search
              className="w-5 h-5"
              strokeWidth={activeTab === 'search' ? 2.4 : 1.9}
            />
            <span className="text-[11px] font-semibold tracking-tight whitespace-nowrap">
              Buscador
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('history')}
            aria-current={activeTab === 'history' ? 'page' : undefined}
            className={`min-h-[44px] flex flex-col items-center justify-center gap-0.5 transition-colors ${
              activeTab === 'history'
                ? 'text-blue-700'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <FileText
              className="w-5 h-5"
              strokeWidth={activeTab === 'history' ? 2.4 : 1.9}
            />
            <span className="text-[11px] font-semibold tracking-tight whitespace-nowrap">
              Antecedentes
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('downloads')}
            aria-current={activeTab === 'downloads' ? 'page' : undefined}
            className={`min-h-[44px] flex flex-col items-center justify-center gap-0.5 transition-colors ${
              activeTab === 'downloads'
                ? 'text-blue-700'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <Download
              className="w-5 h-5"
              strokeWidth={activeTab === 'downloads' ? 2.4 : 1.9}
            />
            <span className="text-[11px] font-semibold tracking-tight whitespace-nowrap">
              Descargas
            </span>
          </button>
        </div>
      </nav>

      {/* Modals & Sheets */}
      {isAdmin && previewData && (
        <ImportPreviewModal
          preview={previewData}
          module={previewTargetModule}
          modules={modules}
          onChangeTargetModule={handlePreviewChangeTargetModule}
          onChangeSheet={handlePreviewChangeSheet}
          onChangeStartRow={handlePreviewChangeStartRow}
          onChangeMapping={handlePreviewChangeMapping}
          onConfirmImport={handleConfirmImport}
          onCancel={() => {
            setPreviewData(null);
            setActiveWorkbook(null);
          }}
          onOpenInfo={handleOpenInfo}
        />
      )}

      {isAdmin && showNewModuleModal && (
        <ModuleCreatorModal
          onClose={() => setShowNewModuleModal(false)}
          onCreateModule={(newMod) => {
            setModules((prev) => [...prev, newMod]);
            handleSelectModule(newMod.id);
          }}
        />
      )}

      {detailRecord && (
        <RecordDetailSheet
          record={detailRecord}
          module={
            modules.find((m) => m.id === detailRecord.moduleId) || activeModule
          }
          onClose={() => setDetailRecordId(null)}
          onToggleBookmark={handleToggleBookmark}
          onExportSingle={(rec, format) =>
            handleExportSingleRecord([rec], format, 'ficha')
          }
        />
      )}

      <InfoModal
        isOpen={infoOpen}
        topic={infoTopic}
        onClose={() => setInfoOpen(false)}
      />
    </div>
  );
}

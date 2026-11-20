export type ColumnType = 'text' | 'code' | 'date';

export interface ColumnDef {
  key: string;
  label: string;
  type: ColumnType;
  aliases?: string[];
  primary?: boolean;
}

export interface ModuleConfig {
  id: string;
  name: string;
  description: string;
  startRow: number; // 1-indexed Excel row where headers (or first data row) begin
  hasHeaderRow: boolean;
  columns: ColumnDef[];
  isDefault?: boolean;
}

export interface DataRecord {
  id: string;
  moduleId: string;
  values: Record<string, string>;
  monthKeys: string[]; // e.g. ["2026-10"] extracted from date columns
  importedAt: string;
  batchId: string;
  sourceRow: number;
  bookmarked?: boolean;
}

export interface ImportBatch {
  id: string;
  moduleId: string;
  fileName: string;
  sheetName: string;
  totalRowsInFile: number;
  importedCount: number;
  startRow: number;
  importedAt: string;
  mode: 'replace' | 'append';
}

export interface SearchHistoryItem {
  id: string;
  moduleId: string;
  query: string;
  prefixFilter: string | null;
  monthFilter: string | null;
  resultCount: number;
  timestamp: string;
}

export interface GeneratedDownload {
  id: string;
  moduleId: string;
  fileName: string;
  format: 'xlsx' | 'csv' | 'json';
  recordCount: number;
  createdAt: string;
  recordsSnapshot: DataRecord[];
}

export interface ParsedExcelPreview {
  fileName: string;
  sheetNames: string[];
  selectedSheet: string;
  rawMatrix: unknown[][];
  startRow: number;
  hasHeaderRow: boolean;
  detectedHeaders: string[];
  columnMapping: Record<string, number>; // columnKey -> Excel column index
  parsedRows: Array<{
    sourceRow: number;
    values: Record<string, string>;
    monthKeys: string[];
  }>;
}

export type BottomNavTab = 'search' | 'history' | 'downloads';
export type ImportLimitOption = 10 | 20 | 50 | 100 | 200 | 'all';

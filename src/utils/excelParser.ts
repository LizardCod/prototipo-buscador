import * as XLSX from 'xlsx';
import {
  ColumnDef,
  DataRecord,
  ModuleConfig,
  ParsedExcelPreview,
} from '../types/records';

export function normalizeText(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export function parseCellDate(raw: unknown): {
  display: string;
  monthKey: string | null;
} {
  if (raw === null || raw === undefined || raw === '') {
    return { display: '', monthKey: null };
  }

  // Handle JS Date
  if (raw instanceof Date && !isNaN(raw.getTime())) {
    const y = raw.getFullYear();
    const m = raw.getMonth() + 1;
    const d = raw.getDate();
    return {
      display: `${String(d).padStart(2, '0')}/${String(m).padStart(2, '0')}/${y}`,
      monthKey: `${y}-${String(m).padStart(2, '0')}`,
    };
  }

  // Handle Excel serial date number (typical range 25000..70000)
  if (typeof raw === 'number' && raw > 20000 && raw < 90000) {
    const parsed = XLSX.SSF.parse_date_code(raw);
    if (parsed && parsed.y && parsed.m && parsed.d) {
      return {
        display: `${String(parsed.d).padStart(2, '0')}/${String(parsed.m).padStart(2, '0')}/${parsed.y}`,
        monthKey: `${parsed.y}-${String(parsed.m).padStart(2, '0')}`,
      };
    }
  }

  const str = String(raw).trim();
  if (!str) return { display: '', monthKey: null };

  // DD/MM/YYYY or DD-MM-YYYY
  const dmy = str.match(/^(\d{1,2})[/\-.](\d{1,2})[/\-.](\d{2,4})$/);
  if (dmy) {
    const day = Number(dmy[1]);
    const month = Number(dmy[2]);
    let year = Number(dmy[3]);
    if (year < 100) year += 2000;
    if (month >= 1 && month <= 12 && day >= 1 && day <= 31) {
      return {
        display: `${String(day).padStart(2, '0')}/${String(month).padStart(2, '0')}/${year}`,
        monthKey: `${year}-${String(month).padStart(2, '0')}`,
      };
    }
  }

  // YYYY-MM-DD or YYYY/MM/DD
  const ymd = str.match(/^(\d{4})[/\-.](\d{1,2})[/\-.](\d{1,2})(?:[T\s].*)?$/);
  if (ymd) {
    const year = Number(ymd[1]);
    const month = Number(ymd[2]);
    const day = Number(ymd[3]);
    if (month >= 1 && month <= 12 && day >= 1 && day <= 31) {
      return {
        display: `${String(day).padStart(2, '0')}/${String(month).padStart(2, '0')}/${year}`,
        monthKey: `${year}-${String(month).padStart(2, '0')}`,
      };
    }
  }

  return { display: str, monthKey: null };
}

function formatCellValue(raw: unknown, col: ColumnDef): {
  text: string;
  monthKey: string | null;
} {
  if (raw === null || raw === undefined) return { text: '', monthKey: null };
  if (col.type === 'date') {
    const parsed = parseCellDate(raw);
    return { text: parsed.display, monthKey: parsed.monthKey };
  }
  if (raw instanceof Date) {
    const parsed = parseCellDate(raw);
    return { text: parsed.display, monthKey: parsed.monthKey };
  }
  return { text: String(raw).trim(), monthKey: null };
}

export function readWorkbookFromBuffer(buffer: ArrayBuffer): XLSX.WorkBook {
  return XLSX.read(buffer, {
    type: 'array',
    cellDates: true,
    raw: true,
  });
}

export function getRawMatrixFromSheet(
  wb: XLSX.WorkBook,
  sheetName: string
): unknown[][] {
  const ws = wb.Sheets[sheetName];
  if (!ws) return [];
  return XLSX.utils.sheet_to_json(ws, {
    header: 1,
    raw: true,
    defval: '',
  }) as unknown[][];
}

export function autoMapColumns(
  headers: string[],
  columns: ColumnDef[]
): Record<string, number> {
  const normalizedHeaders = headers.map((h) => normalizeText(String(h || '')));
  const mapping: Record<string, number> = {};
  const usedIndices = new Set<number>();

  // Pass 1: exact / alias matches
  for (const col of columns) {
    const candidates = [
      normalizeText(col.key.replace(/_/g, ' ')),
      normalizeText(col.label),
      ...(col.aliases || []).map(normalizeText),
    ];

    const exactIdx = normalizedHeaders.findIndex(
      (h, idx) => !usedIndices.has(idx) && h !== '' && candidates.includes(h)
    );
    if (exactIdx !== -1) {
      mapping[col.key] = exactIdx;
      usedIndices.add(exactIdx);
    }
  }

  // Pass 2: partial substring matches
  for (const col of columns) {
    if (mapping[col.key] !== undefined) continue;
    const candidates = [
      normalizeText(col.key.replace(/_/g, ' ')),
      normalizeText(col.label),
      ...(col.aliases || []).map(normalizeText),
    ];

    const partialIdx = normalizedHeaders.findIndex(
      (h, idx) =>
        !usedIndices.has(idx) &&
        h !== '' &&
        candidates.some((c) => h.includes(c) || c.includes(h))
    );
    if (partialIdx !== -1) {
      mapping[col.key] = partialIdx;
      usedIndices.add(partialIdx);
    }
  }

  // Pass 3: positional fallback for any remaining columns
  columns.forEach((col, colPos) => {
    if (mapping[col.key] !== undefined) return;
    if (!usedIndices.has(colPos)) {
      mapping[col.key] = colPos;
      usedIndices.add(colPos);
    } else {
      const nextFree = headers.findIndex((_, idx) => !usedIndices.has(idx));
      mapping[col.key] = nextFree !== -1 ? nextFree : colPos;
      if (nextFree !== -1) usedIndices.add(nextFree);
    }
  });

  return mapping;
}

export function buildPreviewFromMatrix(params: {
  fileName: string;
  sheetNames: string[];
  selectedSheet: string;
  rawMatrix: unknown[][];
  module: ModuleConfig;
  startRow: number;
  hasHeaderRow: boolean;
  customMapping?: Record<string, number>;
}): ParsedExcelPreview {
  const {
    fileName,
    sheetNames,
    selectedSheet,
    rawMatrix,
    module,
    startRow,
    hasHeaderRow,
    customMapping,
  } = params;

  const safeStartIndex = Math.max(0, startRow - 1);
  const startSlice = rawMatrix[safeStartIndex] || [];

  // Determine widest row near startRow for clean header/column listing
  let maxCols = Math.max(module.columns.length, startSlice.length);
  for (let i = safeStartIndex; i < Math.min(rawMatrix.length, safeStartIndex + 15); i++) {
    if (rawMatrix[i] && rawMatrix[i].length > maxCols) {
      maxCols = rawMatrix[i].length;
    }
  }

  const detectedHeaders: string[] = Array.from({ length: maxCols }, (_, idx) => {
    if (hasHeaderRow) {
      const val = String(startSlice[idx] ?? '').trim();
      return val || `Columna ${idx + 1}`;
    }
    return `Columna ${idx + 1}`;
  });

  const columnMapping =
    customMapping ||
    (hasHeaderRow
      ? autoMapColumns(detectedHeaders, module.columns)
      : Object.fromEntries(module.columns.map((c, idx) => [c.key, idx])));

  const dataStartIndex = hasHeaderRow ? safeStartIndex + 1 : safeStartIndex;
  const parsedRows: ParsedExcelPreview['parsedRows'] = [];

  for (let r = dataStartIndex; r < rawMatrix.length; r++) {
    const rawRow = rawMatrix[r] || [];
    const values: Record<string, string> = {};
    const monthKeysSet = new Set<string>();
    let hasNonEmpty = false;

    for (const col of module.columns) {
      const colIdx = columnMapping[col.key];
      const cell = colIdx !== undefined && colIdx >= 0 ? rawRow[colIdx] : '';
      const formatted = formatCellValue(cell, col);
      values[col.key] = formatted.text;
      if (formatted.text !== '') hasNonEmpty = true;
      if (formatted.monthKey) monthKeysSet.add(formatted.monthKey);
    }

    // Fallback: check any date-looking field if monthKeys still empty
    if (monthKeysSet.size === 0) {
      for (const col of module.columns) {
        if (col.type === 'date' && values[col.key]) {
          const recheck = parseCellDate(values[col.key]);
          if (recheck.monthKey) monthKeysSet.add(recheck.monthKey);
        }
      }
    }

    if (hasNonEmpty) {
      parsedRows.push({
        sourceRow: r + 1,
        values,
        monthKeys: Array.from(monthKeysSet),
      });
    }
  }

  return {
    fileName,
    sheetNames,
    selectedSheet,
    rawMatrix,
    startRow,
    hasHeaderRow,
    detectedHeaders,
    columnMapping,
    parsedRows,
  };
}

export function exportRecordsToFile(
  records: DataRecord[],
  module: ModuleConfig,
  format: 'xlsx' | 'csv' | 'json',
  baseFileName: string
): string {
  const safeBase = baseFileName.replace(/\.(xlsx|csv|json)$/i, '');
  const fullName = `${safeBase}.${format}`;

  if (format === 'json') {
    const payload = records.map((r) => {
      const obj: Record<string, string> = {};
      module.columns.forEach((col) => {
        obj[col.label] = r.values[col.key] || '';
      });
      return obj;
    });
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: 'application/json;charset=utf-8',
    });
    triggerDownload(blob, fullName);
    return fullName;
  }

  const headers = module.columns.map((c) => c.label);
  const rows = records.map((r) =>
    module.columns.map((c) => r.values[c.key] || '')
  );

  if (format === 'csv') {
    const escapeCsv = (val: string) => {
      const needsQuotes = /[",\n\r;]/.test(val);
      const escaped = val.replace(/"/g, '""');
      return needsQuotes ? `"${escaped}"` : escaped;
    };
    const csvLines = [headers, ...rows]
      .map((line) => line.map(escapeCsv).join(','))
      .join('\r\n');
    const blob = new Blob(['\uFEFF' + csvLines], {
      type: 'text/csv;charset=utf-8',
    });
    triggerDownload(blob, fullName);
    return fullName;
  }

  // XLSX
  const aoa = [headers, ...rows];
  const ws = XLSX.utils.aoa_to_sheet(aoa);
  ws['!cols'] = module.columns.map((col) => ({
    wch: col.type === 'text' ? 42 : 20,
  }));
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, module.name.slice(0, 31) || 'Datos');
  const out = XLSX.write(wb, { type: 'array', bookType: 'xlsx' }) as ArrayBuffer;
  const blob = new Blob([out], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  triggerDownload(blob, fullName);
  return fullName;
}

export function triggerBufferDownload(buffer: ArrayBuffer, fileName: string) {
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  triggerDownload(blob, fileName);
}

function triggerDownload(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1500);
}

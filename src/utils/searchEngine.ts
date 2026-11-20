import { ColumnDef, DataRecord } from '../types/records';
import { normalizeText } from './excelParser';

export interface ConstantPrefixItem {
  prefix: string;
  columnKey: string;
  columnLabel: string;
  count: number;
}

export interface MonthFilterItem {
  monthKey: string; // YYYY-MM
  label: string;    // e.g. "Nov 2026"
  count: number;
}

const MONTH_NAMES_ES = [
  'Ene',
  'Feb',
  'Mar',
  'Abr',
  'May',
  'Jun',
  'Jul',
  'Ago',
  'Sep',
  'Oct',
  'Nov',
  'Dic',
];

export function formatMonthLabel(monthKey: string): string {
  const [y, m] = monthKey.split('-');
  const mIdx = Number(m) - 1;
  if (mIdx >= 0 && mIdx < 12 && y) {
    return `${MONTH_NAMES_ES[mIdx]} ${y}`;
  }
  return monthKey;
}

/**
 * Partial %LIKE% search across ALL fields of a record.
 * Case-insensitive & accent-insensitive.
 */
export function matchesLikeQuery(
  record: DataRecord,
  query: string,
  columns: ColumnDef[]
): boolean {
  const cleanQuery = normalizeText(query);
  if (!cleanQuery) return true;

  const allValues = columns
    .map((c) => normalizeText(record.values[c.key] || ''))
    .join(' ');

  // Direct substring match first
  if (allValues.includes(cleanQuery)) return true;

  // Multi-word partial match (every token must match somewhere in the record)
  const tokens = cleanQuery.split(' ').filter(Boolean);
  if (tokens.length > 1) {
    return tokens.every((token) => allValues.includes(token));
  }

  return false;
}

/**
 * Constant / prefix match across code or all fields.
 */
export function matchesPrefixFilter(
  record: DataRecord,
  prefix: string | null,
  columns: ColumnDef[]
): boolean {
  if (!prefix) return true;
  const target = normalizeText(prefix);
  if (!target) return true;

  return columns.some((col) => {
    const val = normalizeText(record.values[col.key] || '');
    return val.startsWith(target) || val.includes(target);
  });
}

/**
 * Month filter match based on extracted monthKeys (YYYY-MM).
 */
export function matchesMonthFilter(
  record: DataRecord,
  monthKey: string | null
): boolean {
  if (!monthKey) return true;
  return record.monthKeys.includes(monthKey);
}

/**
 * Automatically detects recurring constant prefixes (like CO116, OF-2026, 8481)
 * from code fields across the active module's records.
 */
export function extractConstantPrefixes(
  records: DataRecord[],
  columns: ColumnDef[]
): ConstantPrefixItem[] {
  if (records.length === 0) return [];

  const codeColumns = columns.filter((c) => c.type === 'code');
  const targetCols = codeColumns.length > 0 ? codeColumns : columns.slice(0, 2);

  const counts = new Map<
    string,
    { prefix: string; columnKey: string; columnLabel: string; count: number }
  >();

  for (const col of targetCols) {
    for (const rec of records) {
      const rawVal = (rec.values[col.key] || '').trim();
      if (!rawVal || rawVal.length < 4) continue;

      const candidates = new Set<string>();

      // Pattern 1: Alphanumeric prefix before digits or hyphenated block e.g. CO1160048 -> CO116, OF-2026-0310 -> OF-2026
      const hyphenMatch = rawVal.match(/^([A-Za-z]{1,6}[-_/]\d{2,4})/);
      if (hyphenMatch) {
        candidates.add(hyphenMatch[1].toUpperCase());
      }

      // Pattern 2: Letters + leading digits e.g. CO116001420 -> CO116 (first 5 chars if letters+digits)
      const alphaNumMatch = rawVal.match(/^([A-Za-z]{2,4}\d{2,3})/);
      if (alphaNumMatch) {
        candidates.add(alphaNumMatch[1].toUpperCase());
      }

      // Pattern 3: HS Tariff chapter/heading e.g. 8481.80.10 -> 8481
      const hsMatch = rawVal.match(/^(\d{4})[.\-]/);
      if (hsMatch) {
        candidates.add(hsMatch[1]);
      }

      for (const prefix of candidates) {
        const mapKey = `${col.key}::${prefix}`;
        const existing = counts.get(mapKey);
        if (existing) {
          existing.count += 1;
        } else {
          counts.set(mapKey, {
            prefix,
            columnKey: col.key,
            columnLabel: col.label,
            count: 1,
          });
        }
      }
    }
  }

  return Array.from(counts.values())
    .filter((item) => item.count >= 2)
    .sort((a, b) => b.count - a.count || a.prefix.localeCompare(b.prefix))
    .slice(0, 12);
}

/**
 * Extracts available months from records sorted descending (newest first).
 */
export function extractAvailableMonths(records: DataRecord[]): MonthFilterItem[] {
  const monthCounts = new Map<string, number>();

  for (const rec of records) {
    for (const mk of rec.monthKeys) {
      monthCounts.set(mk, (monthCounts.get(mk) || 0) + 1);
    }
  }

  return Array.from(monthCounts.entries())
    .sort((a, b) => b[0].localeCompare(a[0]))
    .map(([monthKey, count]) => ({
      monthKey,
      label: formatMonthLabel(monthKey),
      count,
    }));
}

/**
 * Returns text segments indicating which parts match the partial %LIKE% query
 * (accent-insensitive matching mapped back to original character indices).
 */
export function splitHighlightSegments(
  text: string,
  query: string
): Array<{ text: string; match: boolean }> {
  if (!text || !query.trim()) return [{ text, match: false }];

  const cleanTokens = normalizeText(query)
    .split(' ')
    .filter((t) => t.length >= 2);
  if (cleanTokens.length === 0) {
    const single = normalizeText(query);
    if (!single) return [{ text, match: false }];
    cleanTokens.push(single);
  }

  // Build normalized string with index map back to original string
  const origChars = Array.from(text);
  let normStr = '';
  const normToOrigStart: number[] = [];
  const normToOrigEnd: number[] = [];

  origChars.forEach((ch, origIdx) => {
    const stripped = ch
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');
    for (let i = 0; i < stripped.length; i++) {
      normStr += stripped[i];
      normToOrigStart.push(origIdx);
      normToOrigEnd.push(origIdx + 1);
    }
  });

  const ranges: Array<[number, number]> = [];
  for (const token of cleanTokens) {
    let searchFrom = 0;
    while (searchFrom < normStr.length) {
      const found = normStr.indexOf(token, searchFrom);
      if (found === -1) break;
      const origStart = normToOrigStart[found];
      const origEnd = normToOrigEnd[found + token.length - 1];
      ranges.push([origStart, origEnd]);
      searchFrom = found + token.length;
    }
  }

  if (ranges.length === 0) return [{ text, match: false }];

  // Merge overlapping ranges
  ranges.sort((a, b) => a[0] - b[0]);
  const merged: Array<[number, number]> = [ranges[0]];
  for (let i = 1; i < ranges.length; i++) {
    const prev = merged[merged.length - 1];
    const curr = ranges[i];
    if (curr[0] <= prev[1]) {
      prev[1] = Math.max(prev[1], curr[1]);
    } else {
      merged.push(curr);
    }
  }

  const segments: Array<{ text: string; match: boolean }> = [];
  let cursor = 0;
  for (const [start, end] of merged) {
    if (start > cursor) {
      segments.push({ text: origChars.slice(cursor, start).join(''), match: false });
    }
    segments.push({ text: origChars.slice(start, end).join(''), match: true });
    cursor = end;
  }
  if (cursor < origChars.length) {
    segments.push({ text: origChars.slice(cursor).join(''), match: false });
  }

  return segments;
}

export interface HiddenMatchSnippet {
  columnKey: string;
  columnLabel: string;
  snippet: string;
}

/**
 * Finds partial %LIKE% matches inside fields that are hidden (or clamped)
 * when a record card is collapsed, returning concise `...TEXT...` snippets.
 */
export function extractHiddenMatchSnippets(
  record: DataRecord,
  query: string,
  columns: ColumnDef[],
  visibleColumnKeys: Set<string>
): HiddenMatchSnippet[] {
  const cleanQuery = normalizeText(query);
  if (!cleanQuery) return [];

  const tokens = cleanQuery.split(' ').filter(Boolean);
  if (tokens.length === 0) return [];

  const snippets: HiddenMatchSnippet[] = [];

  for (const col of columns) {
    const rawVal = (record.values[col.key] || '').trim();
    if (!rawVal) continue;

    const isVisibleCol = visibleColumnKeys.has(col.key);

    // Build normalized character mapping back to original indices
    const origChars = Array.from(rawVal);
    let normStr = '';
    const normToOrigStart: number[] = [];
    const normToOrigEnd: number[] = [];

    origChars.forEach((ch, origIdx) => {
      const stripped = ch
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '');
      for (let i = 0; i < stripped.length; i++) {
        normStr += stripped[i];
        normToOrigStart.push(origIdx);
        normToOrigEnd.push(origIdx + 1);
      }
    });

    let firstMatchRange: [number, number] | null = null;
    for (const token of tokens) {
      const idx = normStr.indexOf(token);
      if (idx !== -1) {
        const start = normToOrigStart[idx];
        const end = normToOrigEnd[idx + token.length - 1];
        if (!firstMatchRange || start < firstMatchRange[0]) {
          firstMatchRange = [start, end];
        }
      }
    }

    if (!firstMatchRange) continue;

    // If column is visible in collapsed view, only show hidden hint if match is truncated past line-clamp (~75 chars)
    if (isVisibleCol && firstMatchRange[0] < 75) {
      continue;
    }

    const [matchStart, matchEnd] = firstMatchRange;
    const sliceStart = Math.max(0, matchStart - 5);
    const sliceEnd = Math.min(origChars.length, matchEnd + 6);
    const core = origChars.slice(sliceStart, sliceEnd).join('').trim();

    snippets.push({
      columnKey: col.key,
      columnLabel: col.label,
      snippet: `...${core}...`,
    });
  }

  return snippets;
}


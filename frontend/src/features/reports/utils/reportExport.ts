/**
 * CSV export shared by every report. Numbers are written raw (not ₹-formatted) so Excel can sum them;
 * files are UTF-8 with a BOM so Excel shows ₹ and Tamil text correctly.
 */

export type CsvCell = string | number | null | undefined;

export const csvCell = (v: CsvCell): string => {
    if (v === null || v === undefined) return '';
    const text = typeof v === 'number' ? (Number.isFinite(v) ? String(Math.round(v * 1000) / 1000) : '') : String(v);
    return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
};

export const toCsv = (rows: CsvCell[][]): string => rows.map(r => r.map(csvCell).join(',')).join('\r\n');

/** Saves CSV text as a download. */
export function saveCsv(filename: string, csv: string): void {
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename.endsWith('.csv') ? filename : `${filename}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** Downloads rows as CSV (headers + rows). */
export function downloadCsv(filename: string, headers: string[], rows: CsvCell[][]): void {
    saveCsv(filename, toCsv([headers, ...rows]));
}

/**
 * A report CSV with an audit header block ("Report", "Period", "Data source", …), a blank line, then the
 * table. The header block is what makes an exported file traceable back to what was on screen.
 */
export const buildReportCsv = (meta: [string, string][], headers: string[], rows: CsvCell[][]): string =>
    toCsv([...meta.map(([k, v]) => [k, v]), [], headers, ...rows]);

/** "sales-report_2026-04-01_2026-09-23.csv" */
export const reportFileName = (reportId: string, from?: string, to?: string): string => {
    const today = new Date();
    const stamp = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    const range = from && to ? `${from}_${to}` : stamp;
    return `${reportId}_${range}.csv`;
};

/** "Label: value" lines for the CSV header's Filters row; empty values are skipped. */
export const filterSummary = (pairs: [string, string | null | undefined][]): string[] =>
    pairs.filter(([, v]) => Boolean(v)).map(([k, v]) => `${k}: ${v}`);

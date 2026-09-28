/**
 * Plain functions used by the report components. Kept out of the .tsx files so those export only
 * components (React fast refresh).
 */
import {
    formatCurrency, formatDateTime, formatNumber, formatPercentage, formatQuantity, formatReportDate, MISSING,
} from '@/utils/formatters';
import type { ReportDataSource } from '../config/reportRegistry';
import type { CellValue, ReportColumn, ReportColumnType } from './ReportTable';

/** What the report API said answered the request (`source` in the response). */
export type ResolvedSource = 'sql' | 'mongo';

const SOURCE_LABEL: Record<ResolvedSource, string> = { sql: 'Textilesoft SQL', mongo: 'ERP MongoDB' };

/**
 * Data-source label for the footer and CSV header. The API's own answer wins over the registry's
 * declaration, because it is what actually produced the numbers on screen.
 */
export function dataSourceLabel(declared: ReportDataSource | null, resolved?: ResolvedSource | null): string {
    // A combined report only has the SQL half when the server is in SQL mode; in Mongo mode it's Mongo only.
    if (resolved) return declared === 'combined' && resolved === 'sql' ? `${SOURCE_LABEL.sql} + ${SOURCE_LABEL.mongo}` : SOURCE_LABEL[resolved];
    switch (declared) {
        case 'textilesoft-sql': return SOURCE_LABEL.sql;
        case 'erp-mongo': return SOURCE_LABEL.mongo;
        case 'combined': return `${SOURCE_LABEL.sql} + ${SOURCE_LABEL.mongo}`;
        case 'item-data-source': return 'Not reported by the server';
        default: return 'Not connected';
    }
}

/** Page numbers to show: first, last, current ±1, with gaps as 'gap'. */
export function pageWindow(page: number, pages: number): (number | 'gap')[] {
    if (pages <= 7) return Array.from({ length: pages }, (_, i) => i + 1);
    const keep = new Set([1, pages, page - 1, page, page + 1].filter(p => p >= 1 && p <= pages));
    if (page <= 3) [2, 3, 4].forEach(p => keep.add(p));
    if (page >= pages - 2) [pages - 3, pages - 2, pages - 1].forEach(p => keep.add(p));
    const sorted = [...keep].sort((a, b) => a - b);
    const out: (number | 'gap')[] = [];
    sorted.forEach((p, i) => {
        if (i > 0 && p - sorted[i - 1] > 1) out.push('gap');
        out.push(p);
    });
    return out;
}

const NUMERIC: ReportColumnType[] = ['currency', 'number', 'quantity', 'percent'];
export const isNumericColumn = (c: { type?: ReportColumnType }) => NUMERIC.includes(c.type ?? 'text');

/** Display text for a raw value, using the shared formatters. */
export function formatCell<Row>(column: ReportColumn<Row>, raw: CellValue): string {
    if (raw === null || raw === undefined || raw === '') return MISSING;
    switch (column.type ?? 'text') {
        case 'currency': return formatCurrency(Number(raw), { fractionDigits: column.fractionDigits ?? 2 });
        case 'number': return formatNumber(Number(raw));
        case 'quantity': return formatQuantity(Number(raw));
        case 'percent': return formatPercentage(Number(raw));
        case 'date': return formatReportDate(raw);
        case 'datetime': return formatDateTime(raw);
        default: return String(raw);
    }
}

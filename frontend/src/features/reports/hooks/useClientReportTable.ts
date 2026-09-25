import { useCallback, useMemo, useState } from 'react';
import type { CellValue, ReportColumn, ReportTableProps, SortDir } from '../components/ReportTable';
import { isNumericColumn } from '../components/reportHelpers';

/**
 * Search, sort and pagination done in the browser, for complete lists the API returns in one go
 * (groups, top-N, a single day's bills). Large transaction lists should page on the server instead.
 *
 * Returns the props ReportTable expects, plus `filteredRows` (every match, all pages) for export.
 */
export function useClientReportTable<Row>(rows: Row[], columns: ReportColumn<Row>[], options: { pageSize?: number; searchPlaceholder?: string } = {}) {
    const pageSize = options.pageSize ?? 25;
    const [query, setQuery] = useState('');
    const [sortKey, setSortKey] = useState<string | null>(null);
    const [dir, setDir] = useState<SortDir>('desc');
    const [page, setPage] = useState(1);

    const onSearch = useCallback((value: string) => {
        setQuery(value);
        setPage(1);
    }, []);

    // Numbers start biggest-first, text A→Z; the second click reverses, the third restores the default order.
    const onSort = useCallback((key: string) => {
        const col = columns.find(c => c.key === key);
        const first: SortDir = col && isNumericColumn(col) ? 'desc' : 'asc';
        setPage(1);
        if (sortKey !== key) {
            setSortKey(key);
            setDir(first);
        } else if (dir === first) {
            setDir(first === 'asc' ? 'desc' : 'asc');
        } else {
            setSortKey(null);
        }
    }, [columns, sortKey, dir]);

    const filteredRows = useMemo(() => {
        const q = query.trim().toLowerCase();
        let out = q
            ? rows.filter(row => columns.some(c => {
                const v = c.value(row);
                return v !== null && v !== undefined && String(v).toLowerCase().includes(q);
            }))
            : rows;
        const col = sortKey ? columns.find(c => c.key === sortKey) : undefined;
        if (col) {
            const sign = dir === 'asc' ? 1 : -1;
            out = [...out].sort((a, b) => compareCells(col.value(a), col.value(b)) * sign);
        }
        return out;
    }, [rows, columns, query, sortKey, dir]);

    const pages = Math.max(1, Math.ceil(filteredRows.length / pageSize));
    const current = Math.min(page, pages);
    const pageRows = filteredRows.slice((current - 1) * pageSize, current * pageSize);

    const tableProps: Pick<ReportTableProps<Row>, 'rows' | 'search' | 'sort' | 'pagination'> = {
        rows: pageRows,
        search: { value: query, onChange: onSearch, placeholder: options.searchPlaceholder },
        sort: { key: sortKey, dir, onSort },
        pagination: { page: current, pageSize, total: filteredRows.length, onPage: setPage },
    };

    return { tableProps, filteredRows };
}

/** Empty values sort last; numbers numerically; text naturally ("Rack 2" before "Rack 10"). */
export function compareCells(a: CellValue, b: CellValue): number {
    const emptyA = a === null || a === undefined || a === '';
    const emptyB = b === null || b === undefined || b === '';
    if (emptyA || emptyB) return emptyA === emptyB ? 0 : emptyA ? 1 : -1;
    if (typeof a === 'number' && typeof b === 'number') return a - b;
    return String(a).localeCompare(String(b), 'en-IN', { numeric: true, sensitivity: 'base' });
}

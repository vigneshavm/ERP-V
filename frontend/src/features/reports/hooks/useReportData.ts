import { useCallback, useEffect, useMemo, useState } from 'react';
import api from '@/services/api';
import type { ReportTableProps, SortDir } from '../components/ReportTable';

/**
 * Data hooks shared by the report pages.
 * They fetch from the report APIs; they never fall back to sample data.
 */

export interface PageInfo {
    page: number;
    limit: number;
    total: number;
    pages: number;
}

export type ReportParams = Record<string, string | undefined>;

const cleanParams = (params: ReportParams): Record<string, string> => {
    const out: Record<string, string> = {};
    for (const [k, v] of Object.entries(params)) if (v) out[k] = v;
    return out;
};

const errorMessage = (err: unknown): string => {
    const e = err as { response?: { data?: { message?: string } }; message?: string };
    return e?.response?.data?.message || e?.message || 'Failed to load report';
};

/**
 * Fetches a report; re-runs when `params` change. `reload(true)` bypasses the server's 60s snapshot cache.
 * `enabled: false` holds the request until a required param (e.g. an account) is known; data stays null.
 */
export function useReportData<T>(url: string, params: ReportParams, options: { enabled?: boolean } = {}) {
    const enabled = options.enabled ?? true;
    const [data, setData] = useState<T | null>(null);
    const [loading, setLoading] = useState(enabled);
    const [error, setError] = useState('');
    const key = JSON.stringify(cleanParams(params));

    const load = useCallback(async (refresh = false) => {
        if (!enabled) {
            setData(null);
            setLoading(false);
            return;
        }
        setLoading(true);
        setError('');
        try {
            const query = JSON.parse(key) as Record<string, string>;
            if (refresh) query.refresh = '1';
            const res = await api.get<T>(url, { params: query });
            setData(res.data);
        } catch (err) {
            setError(errorMessage(err));
        } finally {
            setLoading(false);
        }
    }, [url, key, enabled]);

    useEffect(() => {
        load();
    }, [load]);

    return { data, loading, error, reload: load };
}

/**
 * Every row of a paginated report for the given filters, not just the visible page. Pages through the API at its
 * maximum page size (200) with the same params the screen uses.
 */
export async function fetchAllPages<R>(url: string, params: ReportParams): Promise<R[]> {
    const clean = cleanParams(params);
    delete clean.page;
    delete clean.limit;
    const out: R[] = [];
    for (let page = 1; page <= 1000; page++) {
        const res = await api.get<{ items: R[]; pagination?: PageInfo }>(url, { params: { ...clean, page: String(page), limit: '200' } });
        out.push(...(res.data.items || []));
        if (page >= (res.data.pagination?.pages ?? 1)) break;
    }
    return out;
}

/** Debounced (and trimmed) text value, 300 ms. */
export function useDebounced(value: string, ms = 300): string {
    const [v, setV] = useState(value.trim());
    useEffect(() => {
        const t = setTimeout(() => setV(value.trim()), ms);
        return () => clearTimeout(t);
    }, [value, ms]);
    return v;
}

/**
 * Sort state sent to the server as `sort`/`dir`. Numeric columns start biggest-first, text A→Z; the second
 * click reverses, the third returns to the report's default order.
 */
export function useServerSort(numeric: readonly string[] = []) {
    const [key, setKey] = useState<string | null>(null);
    const [dir, setDir] = useState<SortDir>('desc');
    const numericKey = numeric.join(',');

    const onSort = useCallback((col: string) => {
        const first: SortDir = numericKey.split(',').includes(col) ? 'desc' : 'asc';
        if (key !== col) {
            setKey(col);
            setDir(first);
        } else if (dir === first) {
            setDir(first === 'asc' ? 'desc' : 'asc');
        } else {
            setKey(null);
        }
    }, [key, dir, numericKey]);

    const params = useMemo(() => ({ sort: key ?? '', dir: key ? dir : '' }), [key, dir]);
    return { sort: { key, dir, onSort }, params };
}

/** useServerSort in the flat shape SortTh takes ({ sort, dir, onSort, params }), for hand-built tables. */
export function useSort(numeric: readonly string[] = []) {
    const { sort, params } = useServerSort(numeric);
    return { sort: sort.key, dir: sort.dir, onSort: sort.onSort, params };
}

interface PagedResponse<R> {
    items: R[];
    pagination?: PageInfo;
}

/**
 * Everything a server-paged report needs: fetch, search box (debounced, sent as `search`), sortable headers,
 * pagination that resets to page 1 when filters change, and export of every matching row.
 *
 * `filters` are the report's own params (dates, type, group, …).
 */
export function useServerReport<T extends PagedResponse<R>, R>(url: string, filters: ReportParams, options: {
    numericSort?: readonly string[];
    searchPlaceholder?: string;
    noun?: string;
    /** false when the report's filters already carry `search` (stock reports keep it in the Filters panel). */
    tableSearch?: boolean;
} = {}) {
    const tableSearch = options.tableSearch ?? true;
    const [searchInput, setSearchInput] = useState('');
    const search = useDebounced(searchInput);
    const { sort, params: sortParams } = useServerSort(options.numericSort);

    const params = useMemo<ReportParams>(
        () => (tableSearch ? { ...filters, search, ...sortParams } : { ...filters, ...sortParams }),
        [filters, search, sortParams, tableSearch],
    );
    const paramsKey = JSON.stringify(params);

    // Back to page 1 whenever the filters, search or sort change (adjusted during render, not in an effect).
    const [page, setPage] = useState(1);
    const [pageFor, setPageFor] = useState(paramsKey);
    if (pageFor !== paramsKey) {
        setPageFor(paramsKey);
        setPage(1);
    }

    const { data, loading, error, reload } = useReportData<T>(url, { ...params, page: String(page) });

    const pagination = data?.pagination;
    const tableProps: Pick<ReportTableProps<R>, 'rows' | 'search' | 'sort' | 'pagination' | 'loading'> = {
        rows: data?.items ?? [],
        loading,
        search: tableSearch ? { value: searchInput, onChange: setSearchInput, placeholder: options.searchPlaceholder } : undefined,
        sort,
        pagination: pagination
            ? { page: pagination.page, pageSize: pagination.limit, total: pagination.total, onPage: setPage, noun: options.noun }
            : undefined,
    };

    return {
        data,
        loading,
        error,
        reload,
        tableProps,
        searchInput,
        setSearchInput,
        /** Params without paging, for export and for "is anything filtered?". */
        params,
        fetchAllRows: () => fetchAllPages<R>(url, params),
    };
}

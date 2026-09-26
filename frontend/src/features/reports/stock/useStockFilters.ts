import { useCallback, useEffect, useMemo, useState } from 'react';
import api from '@/services/api';
import { useDebounced } from '../hooks/useReportData';
import { filterSummary } from '../utils/reportExport';

/**
 * Filter state shared by every stock report (Stock Status, Low Stock, Dead Stock, City-wise, Rack-wise). The
 * server applies these before any totals, so KPIs, tables and exports all follow them.
 */

export interface StockFilters {
    category: string;
    brand: string;
    supplier: string;
    /** Purchase date, 'yyyy-mm-dd'. */
    from: string;
    to: string;
    search: string;
}

const EMPTY: StockFilters = { category: '', brand: '', supplier: '', from: '', to: '', search: '' };

export function useStockFilters() {
    const [filters, setFilters] = useState<StockFilters>(EMPTY);
    const search = useDebounced(filters.search);
    const params = useMemo(
        () => ({ category: filters.category, brand: filters.brand, supplier: filters.supplier, from: filters.from, to: filters.to, search }),
        [filters.category, filters.brand, filters.supplier, filters.from, filters.to, search],
    );
    const set = useCallback((key: keyof StockFilters, value: string) => setFilters(f => ({ ...f, [key]: value })), []);
    const clear = useCallback(() => setFilters(EMPTY), []);
    const active = Object.values(filters).filter(Boolean).length;
    const summary = filterSummary([
        ['Search', search], ['Category', filters.category], ['Brand', filters.brand], ['Supplier', filters.supplier],
        ['Purchased from', filters.from], ['Purchased to', filters.to],
    ]);
    return { filters, params, set, clear, active, summary };
}

export interface StockFilterOption {
    value: string;
    lots: number;
}

export interface StockFilterOptions {
    categories: StockFilterOption[];
    brands: StockFilterOption[];
    suppliers: StockFilterOption[];
    purchaseDates: { min: string | null; max: string | null };
}

let optionsCache: { at: number; value: Promise<StockFilterOptions> } | undefined;

function loadFilterOptions(): Promise<StockFilterOptions> {
    if (optionsCache && Date.now() - optionsCache.at < 60_000) return optionsCache.value;
    const value = api.get<StockFilterOptions>('/api/inventory/reports/stock-filters').then(r => r.data);
    optionsCache = { at: Date.now(), value };
    value.catch(() => { optionsCache = undefined; });
    return value;
}

/** Category / brand / supplier suggestions (cached for a minute). Filters still work without them. */
export function useStockFilterOptions(): StockFilterOptions | null {
    const [options, setOptions] = useState<StockFilterOptions | null>(null);
    useEffect(() => {
        let cancelled = false;
        loadFilterOptions().then(o => { if (!cancelled) setOptions(o); }).catch(() => { /* suggestions are optional */ });
        return () => { cancelled = true; };
    }, []);
    return options;
}

import React from 'react';
import { Search } from 'lucide-react';
import { formatNumber } from '@/utils/formatters';
import { FilterDateRange, FilterSearchList, FilterSelect } from '../components';
import type { StockFilters } from './useStockFilters';
import { useStockFilterOptions } from './useStockFilters';

/**
 * The filter fields every stock report shows in the shell's Filters panel: search, category, brand, supplier and
 * purchase-date range. Report-specific controls (low-stock limit, idle days) come first via `children`.
 */
export const StockFilterFields: React.FC<{
    filters: StockFilters;
    set: (key: keyof StockFilters, value: string) => void;
    children?: React.ReactNode;
}> = ({ filters, set, children }) => {
    const options = useStockFilterOptions();
    const min = options?.purchaseDates.min ?? undefined;
    const max = options?.purchaseDates.max ?? undefined;
    type Opt = { value: string; lots: number };
    // Dropdown shows "Sarees (1,204 lots)"; type-ahead suggestions show the lot count beside the name.
    const selectOptions = (list: Opt[] | undefined) => (list ?? []).map(o => ({ value: o.value, label: `${o.value} (${formatNumber(o.lots)} lots)` }));
    const suggestOptions = (list: Opt[] | undefined) => (list ?? []).map(o => ({ value: o.value, label: `${formatNumber(o.lots)} lots` }));

    return (
        <>
            {children}
            <label className="flex flex-col gap-1 min-w-[14rem] flex-[2]">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Search</span>
                <span className="relative">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" aria-hidden />
                    <input
                        value={filters.search}
                        onChange={e => set('search', e.target.value)}
                        placeholder="Product, barcode, brand, supplier…"
                        className="w-full pl-8 pr-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm outline-none focus:ring-2 focus:ring-[rgb(var(--color-primary)/0.2)]"
                    />
                </span>
            </label>
            <FilterSelect label="Category" value={filters.category} onChange={v => set('category', v)} options={selectOptions(options?.categories)} allLabel="All categories" />
            <FilterSearchList id="stock-filter-brands" label="Brand" value={filters.brand} onChange={v => set('brand', v)} options={suggestOptions(options?.brands)} />
            <FilterSearchList id="stock-filter-suppliers" label="Supplier" value={filters.supplier} onChange={v => set('supplier', v)} options={suggestOptions(options?.suppliers)} />
            <FilterDateRange label="Purchased" from={filters.from} to={filters.to} min={min} max={max} onChange={(f, t) => { set('from', f); set('to', t); }} />
        </>
    );
};

import { useReportData } from '../hooks/useReportData';
import type { ResolvedSource } from '../components';

/**
 * Data for the Detailed Analytics reports: GET /api/reports/shop-sales computes every breakdown on the server,
 * from the shop database in SQL mode, else from all of the ERP's POS invoices for the period. (It used to answer
 * `rows: null` outside SQL mode and leave the page to add up whatever sales this browser had loaded.)
 */

export type ShopSalesDim = 'brand' | 'category' | 'counter' | 'salesCounter' | 'hour' | 'day' | 'product';

interface ShopSalesResponse<T> {
    rows: T[];
    range?: { from: string; to: string };
    asOf?: string | null;
    source?: ResolvedSource;
    /** How an ERP breakdown differs from the shop-database one, if it does. */
    basis?: string;
}

/** Stable empty rows while loading, so table and chart memos don't see a new array on every render. */
const NO_ROWS: never[] = [];

export function useShopSales<T>(dim: ShopSalesDim, from: string, to: string) {
    const { data, loading, error, reload } = useReportData<ShopSalesResponse<T>>('/api/reports/shop-sales', { dim, range: 'CUSTOM', from, to });
    return {
        rows: (data?.rows ?? NO_ROWS) as T[],
        asOf: data?.asOf ?? null,
        source: data ? data.source ?? 'sql' : undefined,
        /** Extra note for the ERP source, e.g. that it groups by item name. */
        basis: data?.basis ?? '',
        loaded: Boolean(data),
        loading,
        error,
        reload,
    };
}

/** A sales breakdown row: one brand / category / counter / product. */
export interface DimensionRow {
    name: string;
    revenue: number;
    /** Sale lines (brand/category/product/sales counter) or bills (billing counter). */
    count: number;
    /** Pieces sold. Absent for billing counters. */
    items?: number;
}

/** Joins a report's note with the source-specific basis line. */
export const withBasis = (note: string, basis: string): string => (basis ? `${note} ${basis}` : note);

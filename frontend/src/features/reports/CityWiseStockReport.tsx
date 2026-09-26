import React from 'react';
import { Boxes, IndianRupee, MapPin, Package } from 'lucide-react';
import { formatCurrency, formatNumber, formatQuantity } from '@/utils/formatters';
import { ReportAnalysisCard, ReportKpiGrid, ReportPageShell, ReportRankList, useReportData } from './components';
import type { ReportColumn, ResolvedSource } from './components';
import { StockFilterFields } from './stock/StockFilterFields';
import { StockGroupTable } from './stock/StockGroupTable';
import { useStockFilters } from './stock/useStockFilters';

interface CityStockRow {
    city: string;
    totalQty: number;
    totalValue: number;
    itemCount: number;
    storeCount: number;
}

/** SQL mode: { asOf, source, rows, singleStore } from the shared stock snapshot. Multi-store / Mongo mode: rows only. */
type CityStockResponse = CityStockRow[] | { asOf: string | null; source?: ResolvedSource; rows: CityStockRow[]; singleStore?: boolean };

const rupees0 = (v: number) => formatCurrency(v, { fractionDigits: 0 });

const EXPORT_COLUMNS: ReportColumn<CityStockRow>[] = [
    { key: 'city', header: 'City', value: r => r.city },
    { key: 'storeCount', header: 'Stores', value: r => r.storeCount },
    { key: 'itemCount', header: 'Lots', value: r => r.itemCount },
    { key: 'totalQty', header: 'Pieces', value: r => r.totalQty },
    { key: 'totalValue', header: 'Value (cost)', value: r => r.totalValue },
];

/**
 * City-Wise Stock. Single-store shop: all stock (shop + ERP movements, same as the other stock reports) is in the
 * store's city. Several stores: the ERP's per-store stock levels, grouped by store city.
 */
const CityWiseStockReport: React.FC = () => {
    const f = useStockFilters();
    const { data, loading, error, reload } = useReportData<CityStockResponse>('/api/inventory/reports/stock-by-city', f.params);

    const rows = !data ? [] : Array.isArray(data) ? data : data.rows;
    const asOf = data && !Array.isArray(data) ? data.asOf : null;
    // The array shape only comes from the ERP's per-store (MongoDB) stock levels.
    const source: ResolvedSource | undefined = !data ? undefined : Array.isArray(data) ? 'mongo' : data.source ?? 'sql';
    const singleStore = Boolean(data && !Array.isArray(data) && data.singleStore);
    const totalValue = rows.reduce((a, r) => a + r.totalValue, 0);
    const totalQty = rows.reduce((a, r) => a + r.totalQty, 0);
    const totalLots = rows.reduce((a, r) => a + r.itemCount, 0);

    return (
        <ReportPageShell<CityStockRow>
            reportId="city-wise-stock"
            filters={{ activeCount: f.active, onClear: f.clear, content: <StockFilterFields filters={f.filters} set={f.set} /> }}
            note={data ? (singleStore
                ? 'Single store: all shop stock (shop + ERP movements) is counted under the store city.'
                : 'Per-store stock levels recorded in the ERP, grouped by store city. Filters apply in single-store mode.') : undefined}
            onRefresh={() => reload(true)}
            loading={loading}
            error={error}
            isEmpty={Boolean(data && rows.length === 0 && f.active === 0)}
            meta={{ resolvedSource: source, asOf, recordCount: rows.length }}
            export={{ columns: EXPORT_COLUMNS, fetchRows: () => rows, filterSummary: f.summary }}
        >
            {data && (
                <>
                    <ReportKpiGrid items={[
                        { label: 'Cities', value: formatNumber(rows.length), icon: <MapPin className="w-4 h-4" /> },
                        { label: 'Lots in stock', value: formatNumber(totalLots), icon: <Package className="w-4 h-4" /> },
                        { label: 'Pieces in stock', value: formatQuantity(totalQty), icon: <Boxes className="w-4 h-4" /> },
                        { label: 'Value at cost', value: rupees0(totalValue), icon: <IndianRupee className="w-4 h-4" /> },
                    ]} />
                    {rows.length > 1 && (
                        <ReportAnalysisCard title="Stock distribution" subtitle="Value at cost by city" autoHeight>
                            <ReportRankList items={rows.slice().sort((a, b) => b.totalValue - a.totalValue).map(r => ({ label: r.city, value: r.totalValue, display: rupees0(r.totalValue) }))} />
                        </ReportAnalysisCard>
                    )}
                    <StockGroupTable
                        title="Stock by city"
                        label="City"
                        groups={rows.map(r => ({ key: r.city, lots: r.itemCount, qty: r.totalQty, costValue: r.totalValue, mrpValue: 0 }))}
                    />
                    {rows.length === 0 && !singleStore && f.active === 0 && (
                        <p className="text-xs text-slate-500">No store stock found. Add a store with a city under Settings, or record stock per store.</p>
                    )}
                </>
            )}
        </ReportPageShell>
    );
};

export default CityWiseStockReport;

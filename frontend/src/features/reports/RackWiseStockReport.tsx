import React from 'react';
import { Boxes, IndianRupee, LayoutGrid, Package } from 'lucide-react';
import { formatCurrency, formatNumber, formatQuantity } from '@/utils/formatters';
import { ReportAnalysisCard, ReportKpiGrid, ReportPageShell, ReportRankList, useReportData } from './components';
import type { ReportColumn, ResolvedSource } from './components';
import { StockFilterFields } from './stock/StockFilterFields';
import { StockGroupTable } from './stock/StockGroupTable';
import { useStockFilters } from './stock/useStockFilters';

interface RackStockRow {
    rack: string;
    totalQty: number;
    totalValue: number;
    itemCount: number;
}

interface RackCoverage {
    racks: number;
    lots: number;
    lotsWithRack: number;
    valueWithRackPct: number;
}

/** SQL mode: { asOf, source, rows, coverage } from the shared stock snapshot (rack = Textilesoft stockdetails.rackno). Mongo mode: rows only. */
type RackStockResponse = RackStockRow[] | { asOf: string | null; source?: ResolvedSource; rows: RackStockRow[]; coverage?: RackCoverage };

const rupees0 = (v: number) => formatCurrency(v, { fractionDigits: 0 });

const EXPORT_COLUMNS: ReportColumn<RackStockRow>[] = [
    { key: 'rack', header: 'Rack', value: r => r.rack },
    { key: 'itemCount', header: 'Lots', value: r => r.itemCount },
    { key: 'totalQty', header: 'Pieces', value: r => r.totalQty },
    { key: 'totalValue', header: 'Value (cost)', value: r => r.totalValue },
];

/** Floor/Rack-Wise Stock: current stock (shop + ERP movements, same as the other stock reports) grouped by rack. */
const RackWiseStockReport: React.FC = () => {
    const f = useStockFilters();
    const { data, loading, error, reload } = useReportData<RackStockResponse>('/api/inventory/reports/stock-by-rack', f.params);

    const rows = !data ? [] : Array.isArray(data) ? data : data.rows;
    const asOf = data && !Array.isArray(data) ? data.asOf : null;
    const coverage = data && !Array.isArray(data) ? data.coverage : undefined;
    const source: ResolvedSource | undefined = !data ? undefined : Array.isArray(data) ? 'mongo' : data.source ?? 'sql';
    const totalValue = rows.reduce((a, r) => a + r.totalValue, 0);
    const totalQty = rows.reduce((a, r) => a + r.totalQty, 0);
    const racks = coverage?.racks ?? rows.filter(r => r.rack !== 'Unassigned').length;
    const ranked = rows.filter(r => r.rack !== 'Unassigned').slice().sort((a, b) => b.totalValue - a.totalValue).slice(0, 15);
    const note = !data ? undefined : coverage
        ? coverage.lotsWithRack === 0
            ? 'No rack is recorded for any barcode in the shop data (Textilesoft stockdetails.rackno is empty), so all stock is under Unassigned. Enter rack numbers in Textilesoft to use this report.'
            : `${formatNumber(coverage.lotsWithRack)} of ${formatNumber(coverage.lots)} lots (${coverage.valueWithRackPct}% of stock value) have a rack recorded. The rest is under Unassigned.`
        : 'Rack = shelf code / bin location on the ERP item.';

    return (
        <ReportPageShell<RackStockRow>
            reportId="rack-wise-stock"
            filters={{ activeCount: f.active, onClear: f.clear, content: <StockFilterFields filters={f.filters} set={f.set} /> }}
            note={note}
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
                        { label: 'Racks', value: formatNumber(racks), sub: coverage ? `${formatNumber(coverage.lotsWithRack)} lots with a rack` : undefined, icon: <LayoutGrid className="w-4 h-4" /> },
                        { label: 'Lots in stock', value: formatNumber(coverage?.lots ?? rows.reduce((a, r) => a + r.itemCount, 0)), icon: <Package className="w-4 h-4" /> },
                        { label: 'Pieces in stock', value: formatQuantity(totalQty), icon: <Boxes className="w-4 h-4" /> },
                        { label: 'Value at cost', value: rupees0(totalValue), icon: <IndianRupee className="w-4 h-4" /> },
                    ]} />
                    {ranked.length > 0 && (
                        <ReportAnalysisCard title="Stock distribution" subtitle={`Value at cost, top ${ranked.length} racks (Unassigned excluded)`} autoHeight>
                            <ReportRankList items={ranked.map(r => ({ label: r.rack, value: r.totalValue, display: rupees0(r.totalValue) }))} />
                        </ReportAnalysisCard>
                    )}
                    <StockGroupTable
                        title="Stock by rack"
                        label="Rack"
                        groups={rows.map(r => ({ key: r.rack, lots: r.itemCount, qty: r.totalQty, costValue: r.totalValue, mrpValue: 0 }))}
                    />
                </>
            )}
        </ReportPageShell>
    );
};

export default RackWiseStockReport;

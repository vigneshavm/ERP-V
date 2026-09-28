import React from 'react';
import { Boxes, IndianRupee, Package, Tag } from 'lucide-react';
import { formatCurrency, formatNumber, formatQuantity } from '@/utils/formatters';
import { ReportAnalysisCard, ReportAnalysisGrid, ReportKpiGrid, ReportPageShell, ReportRankList, useReportData } from './components';
import type { ReportColumn, ResolvedSource } from './components';
import { StockFilterFields } from './stock/StockFilterFields';
import { StockGroup, StockGroupTable } from './stock/StockGroupTable';
import { useStockFilters } from './stock/useStockFilters';
import { stockNote } from './stock/stockNotes';

interface StockStatusData {
    asOf: string | null;
    source?: ResolvedSource;
    approximate?: boolean;
    totals: { lots: number; qty: number; costValue: number; mrpValue: number; potentialMargin: number; categories: number };
    byCategory: StockGroup[];
    byBrand: StockGroup[];
    byQtyLeft: StockGroup[];
}

interface ExportRow extends StockGroup { section: string }

const rupees0 = (v: number) => formatCurrency(v, { fractionDigits: 0 });

const EXPORT_COLUMNS: ReportColumn<ExportRow>[] = [
    { key: 'section', header: 'Group by', value: r => r.section },
    { key: 'key', header: 'Group', value: r => r.key },
    { key: 'lots', header: 'Lots', value: r => r.lots },
    { key: 'qty', header: 'Pieces', value: r => r.qty },
    { key: 'costValue', header: 'Value (cost)', value: r => r.costValue },
    { key: 'mrpValue', header: 'Value (MRP)', value: r => r.mrpValue },
];

/** Stock Status: current stock and valuation (cost + MRP), by category, brand and pieces left per lot. */
const StockStatusReport: React.FC = () => {
    const f = useStockFilters();
    const { data, loading, error, reload } = useReportData<StockStatusData>('/api/inventory/reports/stock-status', f.params);
    const t = data?.totals;
    const topCategories = (data?.byCategory ?? []).filter(g => !g.key.startsWith('Others (')).slice().sort((a, b) => b.costValue - a.costValue).slice(0, 10);

    return (
        <ReportPageShell<ExportRow>
            reportId="inventory"
            filters={{ activeCount: f.active, onClear: f.clear, content: <StockFilterFields filters={f.filters} set={f.set} /> }}
            note={data ? stockNote(data) : undefined}
            onRefresh={() => reload(true)}
            loading={loading}
            error={error}
            isEmpty={Boolean(data && t?.lots === 0 && f.active === 0)}
            meta={{ resolvedSource: data?.source, asOf: data?.asOf, recordCount: t?.lots }}
            export={data && t ? {
                columns: EXPORT_COLUMNS,
                fetchRows: () => [
                    ...data.byCategory.map(g => ({ ...g, section: 'Category' })),
                    ...data.byBrand.map(g => ({ ...g, section: 'Brand' })),
                    ...data.byQtyLeft.map(g => ({ ...g, section: 'Pieces left per lot' })),
                    { section: 'Total', key: 'All stock', lots: t.lots, qty: t.qty, costValue: t.costValue, mrpValue: t.mrpValue },
                ],
                filterSummary: f.summary,
            } : undefined}
        >
            {data && t && (
                <>
                    <ReportKpiGrid items={[
                        { label: 'Lots in stock', value: formatNumber(t.lots), sub: `${formatNumber(t.categories)} categories`, icon: <Package className="w-4 h-4" /> },
                        { label: 'Pieces in stock', value: formatQuantity(t.qty), icon: <Boxes className="w-4 h-4" /> },
                        { label: 'Value at cost', value: rupees0(t.costValue), icon: <IndianRupee className="w-4 h-4" /> },
                        { label: 'Value at MRP', value: rupees0(t.mrpValue), sub: `${rupees0(t.potentialMargin)} over cost`, icon: <Tag className="w-4 h-4" /> },
                    ]} />
                    {topCategories.length > 0 && (
                        <ReportAnalysisCard title="Stock distribution" subtitle={`Value at cost, top ${topCategories.length} categories`} autoHeight>
                            <ReportRankList items={topCategories.map(g => ({ label: g.key, value: g.costValue, display: rupees0(g.costValue) }))} />
                        </ReportAnalysisCard>
                    )}
                    <StockGroupTable title="Stock by category" label="Category" groups={data.byCategory} showMrp onPick={v => f.set('category', v)} picked={f.filters.category} />
                    <ReportAnalysisGrid>
                        <StockGroupTable title="Stock by brand" subtitle="Top 15 brands" label="Brand" groups={data.byBrand} showMrp />
                        <StockGroupTable title="Lots by pieces left" label="Pieces left per lot" groups={data.byQtyLeft} />
                    </ReportAnalysisGrid>
                </>
            )}
        </ReportPageShell>
    );
};

export default StockStatusReport;

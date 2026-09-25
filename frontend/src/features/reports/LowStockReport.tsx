import React, { useState } from 'react';
import { AlertTriangle, Boxes, IndianRupee } from 'lucide-react';
import { formatCurrency, formatNumber, formatQuantity } from '@/utils/formatters';
import { FilterSelect, ReportColumn, ReportKpiGrid, ReportPageShell, ReportTable, useServerReport } from './components';
import type { PageInfo, ResolvedSource } from './components';
import { StockFilterFields } from './stock/StockFilterFields';
import { StockGroup, StockGroupTable } from './stock/StockGroupTable';
import { useStockFilters } from './stock/useStockFilters';
import { stockNote } from './stock/stockNotes';

const REPORT_URL = '/api/inventory/reports/low-stock';

interface LowStockRow {
    barcode: string;
    name: string;
    category?: string | null;
    brand?: string | null;
    supplier: string;
    purchaseDate: string | null;
    remainingQty: number;
    costPrice: number;
    value: number;
}

interface LowStockData {
    asOf: string | null;
    source?: ResolvedSource;
    approximate?: boolean;
    threshold: number;
    totals: { lots: number; qty: number; costValue: number; mrpValue: number };
    totalLots: number;
    byCategory: StockGroup[];
    items: LowStockRow[];
    pagination: PageInfo;
}

const THRESHOLDS = ['1', '2', '3', '5', '10'];
const rupees0 = (v: number) => formatCurrency(v, { fractionDigits: 0 });

const COLUMNS: ReportColumn<LowStockRow>[] = [
    { key: 'name', header: 'Product', value: r => r.name, subtext: r => r.barcode, sortable: true },
    { key: 'category', header: 'Category / Brand', value: r => [r.category, r.brand].filter(Boolean).join(' · ') || null },
    { key: 'supplier', header: 'Supplier', value: r => r.supplier },
    { key: 'purchaseDate', header: 'Purchased on', type: 'date', value: r => r.purchaseDate },
    { key: 'remainingQty', header: 'Pcs left', type: 'quantity', value: r => r.remainingQty, cellClassName: () => 'font-bold text-amber-600!' },
    { key: 'costPrice', header: 'Cost', type: 'currency', fractionDigits: 0, value: r => r.costPrice },
    { key: 'value', header: 'Value', type: 'currency', fractionDigits: 0, value: r => r.value, cellClassName: () => 'font-bold' },
];

const EXPORT_COLUMNS: ReportColumn<LowStockRow>[] = [
    { key: 'barcode', header: 'Barcode', value: r => r.barcode },
    { key: 'name', header: 'Product', value: r => r.name },
    { key: 'category', header: 'Category', value: r => r.category },
    { key: 'brand', header: 'Brand', value: r => r.brand },
    { key: 'supplier', header: 'Supplier', value: r => r.supplier },
    { key: 'purchaseDate', header: 'Purchase date', value: r => r.purchaseDate },
    { key: 'remainingQty', header: 'Pieces left', value: r => r.remainingQty },
    { key: 'costPrice', header: 'Cost price', value: r => r.costPrice },
    { key: 'value', header: 'Value (cost)', value: r => r.value },
];

/** Low Stock: lots with only a few pieces left (at or below the threshold). */
const LowStockReport: React.FC = () => {
    const [threshold, setThreshold] = useState(''); // '' = server default (the shop's low-stock limit)
    const f = useStockFilters();
    const report = useServerReport<LowStockData, LowStockRow>(REPORT_URL, { ...f.params, threshold }, {
        numericSort: ['purchaseDate', 'remainingQty', 'costPrice', 'value'],
        tableSearch: false,
        noun: 'lots',
    });
    const { data, loading, error, reload } = report;
    const t = data?.totals;
    const limit = threshold || (data ? String(data.threshold) : '');
    const limitOptions = Array.from(new Set([...THRESHOLDS, ...(data ? [String(data.threshold)] : [])]))
        .sort((a, b) => Number(a) - Number(b))
        .map(v => ({ value: v, label: `${v} ${v === '1' ? 'piece' : 'pieces'} or fewer left` }));

    return (
        <ReportPageShell<LowStockRow>
            reportId="low-stock"
            filters={{
                activeCount: f.active + (threshold ? 1 : 0),
                onClear: () => { f.clear(); setThreshold(''); },
                content: (
                    <StockFilterFields filters={f.filters} set={f.set}>
                        <FilterSelect label="Low stock means" value={limit} onChange={setThreshold} options={limitOptions} />
                    </StockFilterFields>
                ),
            }}
            note={data ? stockNote(data, `Low stock = ${data.threshold} ${data.threshold === 1 ? 'piece' : 'pieces'} or fewer left in a lot${threshold ? '' : ' (the shop’s low-stock limit)'}.`) : undefined}
            onRefresh={() => reload(true)}
            loading={loading}
            error={error}
            isEmpty={Boolean(data && t?.lots === 0 && f.active === 0)}
            meta={{ resolvedSource: data?.source, asOf: data?.asOf, recordCount: data?.pagination.total }}
            export={{
                columns: EXPORT_COLUMNS,
                fetchRows: report.fetchAllRows,
                filterSummary: [...(data ? [`Low stock: ${data.threshold} or fewer pieces`] : []), ...f.summary],
            }}
        >
            {data && t && (
                <>
                    <ReportKpiGrid items={[
                        { label: 'Low-stock lots', value: formatNumber(t.lots), sub: `of ${formatNumber(data.totalLots)} lots in stock`, tone: 'warning', icon: <AlertTriangle className="w-4 h-4" /> },
                        { label: 'Pieces left', value: formatQuantity(t.qty), icon: <Boxes className="w-4 h-4" /> },
                        { label: 'Value (cost)', value: rupees0(t.costValue), icon: <IndianRupee className="w-4 h-4" /> },
                        { label: 'Value at MRP', value: rupees0(t.mrpValue), icon: <IndianRupee className="w-4 h-4" /> },
                    ]} />
                    <StockGroupTable title="Low stock by category" label="Category" groups={data.byCategory} onPick={v => f.set('category', v)} picked={f.filters.category} />
                    <ReportTable
                        title="Low-stock lots"
                        subtitle="One row per barcode (purchase lot)"
                        columns={COLUMNS}
                        rowKey={r => r.barcode}
                        {...report.tableProps}
                        emptyMessage="No low-stock lots for these filters."
                    />
                </>
            )}
        </ReportPageShell>
    );
};

export default LowStockReport;

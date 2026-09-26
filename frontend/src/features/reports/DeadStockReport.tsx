import React, { useState } from 'react';
import { Ban, Boxes, IndianRupee, Snowflake } from 'lucide-react';
import { formatCurrency, formatNumber, formatQuantity } from '@/utils/formatters';
import { FilterSelect, ReportAnalysisCard, ReportAnalysisGrid, ReportColumn, ReportKpiGrid, ReportPageShell, ReportRankList, ReportTable, useServerReport } from './components';
import type { PageInfo, ResolvedSource } from './components';
import { StockFilterFields } from './stock/StockFilterFields';
import { StockGroup, StockGroupTable } from './stock/StockGroupTable';
import { useStockFilters } from './stock/useStockFilters';
import { stockNote } from './stock/stockNotes';

const REPORT_URL = '/api/inventory/reports/dead-stock';

interface DeadStockRow {
    barcode: string;
    name: string;
    category?: string | null;
    supplier: string;
    purchaseDate: string | null;
    lastMovement: string;
    idleDays: number;
    neverSold: boolean;
    remainingQty: number;
    value: number;
}

interface DeadStockData {
    asOf: string | null;
    source?: ResolvedSource;
    approximate?: boolean;
    days: number;
    totals: { lots: number; qty: number; costValue: number; mrpValue: number; neverSold: number; shareOfValuePct: number; undatedLots: number };
    byIdle: StockGroup[];
    byCategory: StockGroup[];
    items: DeadStockRow[];
    pagination: PageInfo;
}

const DAY_OPTIONS = [60, 90, 180, 365, 730].map(d => ({
    value: String(d),
    label: d >= 365 ? `${d / 365} year${d === 365 ? '' : 's'}` : `${d} days`,
}));
const idleText = (d: number): string => (d >= 365 ? `${(d / 365).toFixed(1)} yrs` : `${formatNumber(d)} days`);
const rupees0 = (v: number) => formatCurrency(v, { fractionDigits: 0 });

const COLUMNS: ReportColumn<DeadStockRow>[] = [
    { key: 'name', header: 'Product', value: r => r.name, subtext: r => r.barcode, sortable: true },
    { key: 'category', header: 'Category', value: r => r.category ?? null },
    { key: 'supplier', header: 'Supplier', value: r => r.supplier },
    {
        key: 'lastMovement', header: 'Last movement', type: 'date', value: r => r.lastMovement,
        subtext: r => (r.neverSold ? 'Never sold · purchase date' : 'Last sale'),
    },
    { key: 'idleDays', header: 'Idle', type: 'number', value: r => r.idleDays, render: r => idleText(r.idleDays), cellClassName: () => 'font-bold text-danger!' },
    { key: 'remainingQty', header: 'Pcs', type: 'quantity', value: r => r.remainingQty },
    { key: 'value', header: 'Value (cost)', type: 'currency', fractionDigits: 0, value: r => r.value, cellClassName: () => 'font-bold' },
];

const EXPORT_COLUMNS: ReportColumn<DeadStockRow>[] = [
    { key: 'barcode', header: 'Barcode', value: r => r.barcode },
    { key: 'name', header: 'Product', value: r => r.name },
    { key: 'category', header: 'Category', value: r => r.category },
    { key: 'supplier', header: 'Supplier', value: r => r.supplier },
    { key: 'purchaseDate', header: 'Purchase date', value: r => r.purchaseDate },
    { key: 'lastMovement', header: 'Last movement', value: r => r.lastMovement },
    { key: 'idleDays', header: 'Idle days', value: r => r.idleDays },
    { key: 'neverSold', header: 'Never sold', value: r => (r.neverSold ? 'Yes' : 'No') },
    { key: 'remainingQty', header: 'Pieces left', value: r => r.remainingQty },
    { key: 'value', header: 'Value (cost)', value: r => r.value },
];

/** Dead Stock: lots with stock left and no sale for N days (last sale, or purchase date if never sold). */
const DeadStockReport: React.FC = () => {
    const [days, setDays] = useState('90');
    const f = useStockFilters();
    const report = useServerReport<DeadStockData, DeadStockRow>(REPORT_URL, { ...f.params, days }, {
        numericSort: ['purchaseDate', 'lastMovement', 'idleDays', 'remainingQty', 'value'],
        tableSearch: false,
        noun: 'lots',
    });
    const { data, loading, error, reload } = report;
    const t = data?.totals;
    const daysLabel = DAY_OPTIONS.find(o => o.value === days)?.label ?? `${days} days`;

    return (
        <ReportPageShell<DeadStockRow>
            reportId="dead-stock"
            filters={{
                activeCount: f.active + (days !== '90' ? 1 : 0),
                onClear: () => { f.clear(); setDays('90'); },
                content: (
                    <StockFilterFields filters={f.filters} set={f.set}>
                        <FilterSelect label="No sale for at least" value={days} onChange={setDays} options={DAY_OPTIONS} />
                    </StockFilterFields>
                ),
            }}
            note={data && t ? stockNote(data, `Dead stock = no sale for at least ${daysLabel}. Idle days = days since the lot's last sale, or since purchase if it never sold.${t.undatedLots > 0 ? ` ${formatNumber(t.undatedLots)} lot${t.undatedLots === 1 ? '' : 's'} with no purchase or sale date can't be aged and are not counted.` : ''}`) : undefined}
            onRefresh={() => reload(true)}
            loading={loading}
            error={error}
            isEmpty={Boolean(data && t?.lots === 0 && f.active === 0)}
            meta={{ resolvedSource: data?.source, asOf: data?.asOf, recordCount: data?.pagination.total }}
            export={{ columns: EXPORT_COLUMNS, fetchRows: report.fetchAllRows, filterSummary: [`No sale for at least ${daysLabel}`, ...f.summary] }}
        >
            {data && t && (
                <>
                    <ReportKpiGrid items={[
                        { label: 'Non-moving lots', value: formatNumber(t.lots), icon: <Snowflake className="w-4 h-4" /> },
                        { label: 'Pieces', value: formatQuantity(t.qty), icon: <Boxes className="w-4 h-4" /> },
                        { label: 'Value (cost)', value: rupees0(t.costValue), sub: `${t.shareOfValuePct}% of all stock value`, tone: 'negative', icon: <IndianRupee className="w-4 h-4" /> },
                        { label: 'Never sold a piece', value: formatNumber(t.neverSold), sub: 'lots', icon: <Ban className="w-4 h-4" /> },
                    ]} />
                    <ReportAnalysisGrid>
                        <ReportAnalysisCard title="Ageing distribution" subtitle="Value at cost by time without a sale" autoHeight empty={data.byIdle.length === 0}>
                            <ReportRankList items={data.byIdle.map(b => ({ label: `${b.key} · ${formatNumber(b.lots)} lots`, value: b.costValue, display: rupees0(b.costValue) }))} />
                        </ReportAnalysisCard>
                        <StockGroupTable title="Dead stock by category" label="Category" groups={data.byCategory} onPick={v => f.set('category', v)} picked={f.filters.category} />
                    </ReportAnalysisGrid>
                    <ReportTable
                        title="Non-moving lots"
                        subtitle="Longest idle first"
                        columns={COLUMNS}
                        rowKey={r => r.barcode}
                        {...report.tableProps}
                        emptyMessage="No non-moving stock for these filters."
                    />
                </>
            )}
        </ReportPageShell>
    );
};

export default DeadStockReport;

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Ban, Boxes, IndianRupee, ShoppingCart, Snowflake } from 'lucide-react';
import { formatCurrency, formatNumber, formatQuantity, formatReportDate } from '@/utils/formatters';
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
    grnNo?: string | null;
    lastSoldDate?: string | null;
    lastMovement: string;
    idleDays: number;
    neverSold: boolean;
    purchasedQty: number;
    soldQty: number;
    returnedQty?: number;
    remainingQty: number;
    costPrice?: number;
    value: number;
}

interface DeadStockData {
    asOf: string | null;
    source?: ResolvedSource;
    approximate?: boolean;
    days: number;
    totals: {
        lots: number; qty: number; costValue: number; mrpValue: number; neverSold: number;
        purchasedQty?: number; purchasedValue?: number; soldQty?: number; soldValue?: number; returnedQty?: number; returnedValue?: number;
        shareOfValuePct: number; undatedLots: number };
    byIdle: StockGroup[];
    byCategory: StockGroup[];
    items: DeadStockRow[];
    pagination: PageInfo;
}

const DAY_OPTIONS = [0, 30, 60, 90, 180, 365, 730].map(d => ({
    value: String(d),
    label: d === 0 ? 'No minimum' : d >= 365 ? `${d / 365} year${d === 365 ? '' : 's'}` : `${d} days`,
}));
const SALE_HISTORY_OPTIONS = [{ value: '1', label: 'Never sold a piece' }];
const idleText = (d: number): string => (d >= 365 ? `${(d / 365).toFixed(1)} yrs` : `${formatNumber(d)} days`);
const rupees0 = (v: number) => formatCurrency(v, { fractionDigits: 0 });

const COLUMNS: ReportColumn<DeadStockRow>[] = [
    { key: 'name', header: 'Product', value: r => r.name, subtext: r => r.barcode, sortable: true },
    { key: 'category', header: 'Category', value: r => r.category ?? null },
    { key: 'supplier', header: 'Supplier', value: r => r.supplier },
    { key: 'purchaseDate', header: 'Purchase date', type: 'date', value: r => r.purchaseDate },
    {
        key: 'grnNo', header: 'GRN no.', value: r => r.grnNo ?? null,
        render: r => (r.grnNo ? (
            <Link
                to={`/purchase/orders/${encodeURIComponent(`sql:${r.grnNo}`)}`}
                onClick={e => e.stopPropagation()}
                className="font-mono font-bold text-primary hover:underline"
                title="Open this purchase (GRN)"
            >
                {r.grnNo}
            </Link>
        ) : '—'),
    },
    {
        key: 'lastSoldDate', header: 'Last sale date', type: 'date', value: r => r.lastSoldDate ?? null,
        render: r => (r.lastSoldDate ? formatReportDate(r.lastSoldDate) : 'Never sold'),
        cellClassName: r => (r.lastSoldDate ? undefined : 'font-bold text-danger!'),
    },
    { key: 'idleDays', header: 'Idle', type: 'number', value: r => r.idleDays, render: r => idleText(r.idleDays), cellClassName: () => 'font-bold text-danger!' },
    {
        // purchasedQty is 0 only when the source has no per-lot purchase history (MongoDB fallback): show — not a false 0.
        key: 'purchasedQty', header: 'Purchased', type: 'quantity', value: r => (r.purchasedQty ? r.purchasedQty : null),
        subtext: r => (r.returnedQty ? `${formatQuantity(r.returnedQty)} returned` : undefined),
    },
    { key: 'soldQty', header: 'Sold', type: 'quantity', value: r => (r.purchasedQty ? r.soldQty : null), cellClassName: r => (r.purchasedQty && !r.soldQty ? 'text-danger!' : undefined) },
    { key: 'remainingQty', header: 'Unsold', type: 'quantity', value: r => r.remainingQty, cellClassName: () => 'font-bold' },
    { key: 'purchasedValue', header: 'Purchase value', type: 'currency', fractionDigits: 0, value: r => (r.purchasedQty ? r.purchasedQty * (r.costPrice ?? 0) : null) },
    { key: 'soldValue', header: 'Sold value', type: 'currency', fractionDigits: 0, value: r => (r.purchasedQty ? r.soldQty * (r.costPrice ?? 0) : null) },
    { key: 'value', header: 'Unsold value', type: 'currency', fractionDigits: 0, value: r => r.value, cellClassName: () => 'font-bold' },
];

const EXPORT_COLUMNS: ReportColumn<DeadStockRow>[] = [
    { key: 'barcode', header: 'Barcode', value: r => r.barcode },
    { key: 'name', header: 'Product', value: r => r.name },
    { key: 'category', header: 'Category', value: r => r.category },
    { key: 'supplier', header: 'Supplier', value: r => r.supplier },
    { key: 'purchaseDate', header: 'Purchase date', value: r => r.purchaseDate },
    { key: 'grnNo', header: 'GRN no.', value: r => r.grnNo ?? null },
    { key: 'lastSoldDate', header: 'Last sale date', value: r => r.lastSoldDate ?? 'Never sold' },
    { key: 'idleDays', header: 'Idle days', value: r => r.idleDays },
    { key: 'neverSold', header: 'Never sold', value: r => (r.neverSold ? 'Yes' : 'No') },
    { key: 'purchasedQty', header: 'Purchased qty', value: r => r.purchasedQty },
    { key: 'soldQty', header: 'Sold qty', value: r => r.soldQty },
    { key: 'returnedQty', header: 'Returned qty', value: r => r.returnedQty ?? 0 },
    { key: 'remainingQty', header: 'Unsold qty', value: r => r.remainingQty },
    { key: 'costPrice', header: 'Cost price', value: r => r.costPrice ?? null },
    { key: 'purchasedValue', header: 'Purchase value (cost)', value: r => (r.purchasedQty ? r.purchasedQty * (r.costPrice ?? 0) : null) },
    { key: 'soldValue', header: 'Sold value (cost)', value: r => (r.purchasedQty ? r.soldQty * (r.costPrice ?? 0) : null) },
    { key: 'value', header: 'Unsold value (cost)', value: r => r.value },
];

/** Dead Stock: lots with stock left and no sale for N days (last sale, or purchase date if never sold). */
const DeadStockReport: React.FC = () => {
    const [days, setDays] = useState('90');
    const [neverSold, setNeverSold] = useState('');
    const f = useStockFilters();
    const report = useServerReport<DeadStockData, DeadStockRow>(REPORT_URL, { ...f.params, days, ...(neverSold ? { neverSold } : {}) }, {
        numericSort: ['grnNo', 'purchaseDate', 'lastSoldDate', 'lastMovement', 'idleDays', 'purchasedQty', 'soldQty', 'remainingQty', 'purchasedValue', 'soldValue', 'value'],
        tableSearch: false,
        noun: 'lots',
    });
    const { data, loading, error, reload } = report;
    const t = data?.totals;
    // Purchase/sold figures need per-lot purchase history (shop database); the MongoDB fallback has none.
    const hasFlow = Boolean(t && (t.purchasedQty ?? 0) > 0);
    const daysLabel = DAY_OPTIONS.find(o => o.value === days)?.label ?? `${days} days`;
    const rule = days === '0' ? 'every lot with stock left' : `no sale for at least ${daysLabel}`;
    const scope = neverSold ? ` Showing only lots that have never sold a piece.` : '';

    return (
        <ReportPageShell<DeadStockRow>
            reportId="dead-stock"
            filters={{
                activeCount: f.active + (days !== '90' ? 1 : 0) + (neverSold ? 1 : 0),
                onClear: () => { f.clear(); setDays('90'); setNeverSold(''); },
                content: (
                    <StockFilterFields filters={f.filters} set={f.set}>
                        <FilterSelect label="No sale for at least" value={days} onChange={setDays} options={DAY_OPTIONS} />
                        <FilterSelect label="Sale history" value={neverSold} onChange={setNeverSold} options={SALE_HISTORY_OPTIONS} allLabel="All lots" />
                    </StockFilterFields>
                ),
            }}
            note={data && t ? stockNote(data, `Dead stock = ${rule}.${scope} Idle days = days since the lot's last sale, or since purchase if it never sold.${t.undatedLots > 0 ? ` ${formatNumber(t.undatedLots)} lot${t.undatedLots === 1 ? '' : 's'} with no purchase or sale date can't be aged and are not counted.` : ''}`) : undefined}
            onRefresh={() => reload(true)}
            loading={loading}
            error={error}
            isEmpty={Boolean(data && t?.lots === 0 && f.active === 0)}
            meta={{ resolvedSource: data?.source, asOf: data?.asOf, recordCount: data?.pagination.total }}
            export={{ columns: EXPORT_COLUMNS, fetchRows: report.fetchAllRows, filterSummary: [days === '0' ? 'No minimum idle time' : `No sale for at least ${daysLabel}`, ...(neverSold ? ['Never sold a piece'] : []), ...f.summary] }}
        >
            {data && t && (
                <>
                    <ReportKpiGrid items={[
                        { label: 'Non-moving lots', value: formatNumber(t.lots), icon: <Snowflake className="w-4 h-4" /> },
                        {
                            label: 'Total purchase', value: hasFlow ? rupees0(t.purchasedValue ?? 0) : '—',
                            sub: hasFlow ? `${formatQuantity(t.purchasedQty ?? 0)} pcs at cost${t.returnedQty ? ` · ${formatQuantity(t.returnedQty)} pcs returned (${rupees0(t.returnedValue ?? 0)})` : ''}` : 'Not available for this data source',
                            icon: <ShoppingCart className="w-4 h-4" />,
                        },
                        {
                            label: 'Total sold', value: hasFlow ? rupees0(t.soldValue ?? 0) : '—',
                            sub: hasFlow ? `${formatQuantity(t.soldQty ?? 0)} pcs, valued at cost` : 'Not available for this data source',
                            icon: <Boxes className="w-4 h-4" />,
                        },
                        { label: 'Stock pending', value: rupees0(t.costValue), sub: `${formatQuantity(t.qty)} pcs at cost · ${t.shareOfValuePct}% of all stock value`, tone: 'negative', icon: <IndianRupee className="w-4 h-4" /> },
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

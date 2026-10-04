import React, { useEffect, useMemo, useState } from 'react';
import { Download } from 'lucide-react';
import { formatCurrency, formatNumber, formatQuantity, formatReportDate } from '@/utils/formatters';
import { FilterSelect, ReportColumn, ReportError, ReportKpiGrid, ReportTable, useReportData } from './components';
import type { ReportKpi } from './components';
import { buildReportCsv, filterSummary, reportFileName, saveCsv } from './utils/reportExport';

/**
 * Inventory / Stock Aging & Sales Analysis. Every number comes from GET /api/inventory/stock-analysis
 * (SQL-side aggregation). Nothing is aggregated or invented here.
 */
const URL = '/api/inventory/stock-analysis';
const rupees = (v: number | null | undefined) => (v == null ? '—' : formatCurrency(v, { fractionDigits: 0 }));
const pctText = (v: number | null | undefined) => (v == null ? '—' : `${v}%`);

interface Metrics {
    key: string; lots: number; stockQty: number; stockCostValue: number; stockMrpValue: number;
    periodSoldQty: number; periodSalesValue: number; grossProfit: number; grossMarginPct: number | null;
    sellThroughPct: number | null; avgSellingPrice: number | null; avgAgeDays: number | null;
    value90: number; value180: number; value365: number; deadStockPct: number | null; neverSoldValue: number;
    avgDailySales: number | null; avgWeeklySales: number | null; daysOfCover: number | null; turnover: number | null;
    fastLots?: number; slowLots?: number; dimension?: string;
}
interface Lot {
    barcode: string; name: string; category: string | null; subCategory: string | null; brand: string | null; size: string | null;
    color: string | null; supplier: string | null; grnNo: string | null; firstPurchase: string | null; lastPurchase: string | null;
    firstSale: string | null; lastSale: string | null; daysSinceLastSale: number | null; purchasedQty: number; purchaseReturnQty: number;
    netReceivedQty: number; soldQty: number; stockQty: number; costPrice: number; stockCostValue: number; mrp: number; periodSoldQty: number;
    periodSalesValue: number; grossProfit: number; unitPrice: number | null; sellThroughPct: number | null; ageDays: number | null;
    ageMonths: number | null; bucket: string; mgmtClass: string; clearance: string | null;
}
interface Bucket { key: string; label?: string; range?: string; lots: number; qty: number; costValue: number; mrpValue?: number }
interface ReorderRow {
    product: string; category: string | null; stockQty: number; periodSoldQty: number; avgDailySales: number | null;
    avgWeeklySales: number | null; daysOfStock: number | null; reorderPoint: number | null; recommendedQty: number | null; status: string;
}
interface Analysis {
    asOf: string | null; message?: string; period: { from: string; to: string; days: number }; filters: Record<string, string>;
    kpis: {
        stockQty: number; stockCostValue: number; stockMrpValue: number; periodSalesValue: number; grossProfit: number; grossMarginPct: number | null;
        sellThroughPct: number | null; value90: number; value180: number; value365: number; deadStockValue: number;
        fastMoving: { lots: number; qty: number; value: number }; slowMoving: { lots: number; qty: number; value: number };
        neverSold: { lots: number; qty: number; value: number }; itemsRequiringReorder: number | null; turnover: number | null;
    };
    ageBuckets: Bucket[]; mgmtClasses: Bucket[]; sellThroughBands: Bucket[];
    categories: Metrics[]; suppliers: Metrics[];
    kids: { categoriesUsed: string[]; segments: Metrics[]; byProduct: Metrics[]; bySize: Metrics[]; byPriceBand: Metrics[]; bySupplier: Metrics[] };
    priceBands: { basis: string; cuts: [number, number] | null; rows: Metrics[] };
    neverSold: { totals: { lots: number; qty: number; costValue: number }; items: Lot[] };
    clearance: { counts: Bucket[]; items: Lot[] };
    reorder: { configMissing: boolean; note: string; rows: ReorderRow[] };
    filterOptions: Record<'categories' | 'subCategories' | 'brands' | 'suppliers' | 'sizes' | 'colors', string[]>;
    unavailable: { field: string; reason: string }[];
    dataQuality: Record<string, number | string>;
    reconciliation: null | { thisReportQty: number; stockReportsQty: number; qtyDifference: number; thisReportCostValue: number; stockReportsCostValue: number; valueDifference: number; note: string };
}
interface DrillData { items: Metrics[] | Lot[]; by: string }

const PERIODS = [7, 30, 60, 90, 180, 365].map(d => ({ value: String(d), label: `Last ${d} days` }));
const opts = (xs: string[] | undefined) => (xs ?? []).map(v => ({ value: v }));
const TABS = ['Aging', 'Categories', 'Drill-down', 'Never sold', 'Reorder', 'Clearance', 'Kids', 'Price bands', 'Suppliers', 'Checks'] as const;
type Tab = (typeof TABS)[number];

const metricCols = (first: string): ReportColumn<Metrics>[] => [
    { key: 'key', header: first, value: r => r.key },
    { key: 'stockQty', header: 'Stock qty', type: 'quantity', value: r => r.stockQty },
    { key: 'cost', header: 'Stock cost', type: 'currency', fractionDigits: 0, value: r => r.stockCostValue },
    { key: 'mrp', header: 'Stock MRP', type: 'currency', fractionDigits: 0, value: r => r.stockMrpValue },
    { key: 'sold', header: 'Sold qty', type: 'quantity', value: r => r.periodSoldQty },
    { key: 'sales', header: 'Sales', type: 'currency', fractionDigits: 0, value: r => r.periodSalesValue },
    { key: 'gp', header: 'Gross profit', type: 'currency', fractionDigits: 0, value: r => r.grossProfit },
    { key: 'gm', header: 'Margin %', type: 'percent', value: r => r.grossMarginPct },
    { key: 'st', header: 'Sell-through %', type: 'percent', value: r => r.sellThroughPct },
    { key: 'asp', header: 'Avg price', type: 'currency', fractionDigits: 0, value: r => r.avgSellingPrice },
    { key: 'age', header: 'Avg age (days)', type: 'number', value: r => r.avgAgeDays },
    { key: 'v90', header: '90+ d value', type: 'currency', fractionDigits: 0, value: r => r.value90 },
    { key: 'v180', header: '180+ d value', type: 'currency', fractionDigits: 0, value: r => r.value180 },
    { key: 'v365', header: '365+ d value', type: 'currency', fractionDigits: 0, value: r => r.value365 },
    { key: 'dead', header: 'Dead %', type: 'percent', value: r => r.deadStockPct },
    { key: 'cover', header: 'Days of cover', type: 'number', value: r => r.daysOfCover, render: r => (r.daysOfCover == null ? 'No recent sales' : formatNumber(r.daysOfCover)) },
    { key: 'turn', header: 'Turnover (yr)', type: 'number', value: r => r.turnover },
];

const lotCols: ReportColumn<Lot>[] = [
    { key: 'name', header: 'Product', value: r => r.name, subtext: r => r.barcode },
    { key: 'category', header: 'Category', value: r => r.category },
    { key: 'sub', header: 'Sub-category', value: r => r.subCategory, defaultHidden: true },
    { key: 'brand', header: 'Brand', value: r => r.brand, defaultHidden: true },
    { key: 'size', header: 'Size', value: r => r.size },
    { key: 'color', header: 'Colour', value: r => r.color, defaultHidden: true },
    { key: 'supplier', header: 'Supplier', value: r => r.supplier },
    { key: 'grn', header: 'Purchase ref (GRN)', value: r => r.grnNo, defaultHidden: true },
    { key: 'pd', header: 'Purchase date', type: 'date', value: r => r.firstPurchase },
    { key: 'lpd', header: 'Last purchase', type: 'date', value: r => r.lastPurchase, defaultHidden: true },
    { key: 'fsd', header: 'First sale', type: 'date', value: r => r.firstSale, defaultHidden: true },
    { key: 'lsd', header: 'Last sale', type: 'date', value: r => r.lastSale, render: r => (r.lastSale ? formatReportDate(r.lastSale) : 'Never sold') },
    { key: 'dsl', header: 'Days since last sale', type: 'number', value: r => r.daysSinceLastSale, defaultHidden: true },
    { key: 'pq', header: 'Purchased', type: 'quantity', value: r => r.purchasedQty },
    { key: 'prq', header: 'Purchase return', type: 'quantity', value: r => r.purchaseReturnQty, defaultHidden: true },
    { key: 'nrq', header: 'Net received', type: 'quantity', value: r => r.netReceivedQty, defaultHidden: true },
    { key: 'sq', header: 'Sold', type: 'quantity', value: r => r.soldQty },
    { key: 'stock', header: 'Stock', type: 'quantity', value: r => r.stockQty },
    { key: 'cost', header: 'Cost rate', type: 'currency', value: r => r.costPrice, defaultHidden: true },
    { key: 'value', header: 'Stock cost value', type: 'currency', fractionDigits: 0, value: r => r.stockCostValue },
    { key: 'mrp', header: 'MRP', type: 'currency', value: r => r.mrp, defaultHidden: true },
    { key: 'psales', header: 'Period sales', type: 'currency', fractionDigits: 0, value: r => r.periodSalesValue, defaultHidden: true },
    { key: 'gp', header: 'Period gross profit', type: 'currency', fractionDigits: 0, value: r => r.grossProfit, defaultHidden: true },
    { key: 'st', header: 'Sell-through %', type: 'percent', value: r => r.sellThroughPct },
    { key: 'ad', header: 'Age (days)', type: 'number', value: r => r.ageDays },
    { key: 'am', header: 'Age (months)', type: 'number', value: r => r.ageMonths, defaultHidden: true },
    { key: 'bucket', header: 'Month bucket', value: r => r.bucket },
    { key: 'class', header: 'Management class', value: r => r.mgmtClass },
    { key: 'clr', header: 'Clearance review', value: r => r.clearance },
];

const exportRows = <R,>(cols: ReportColumn<R>[], rows: R[]) => ({ headers: cols.map(c => c.header), rows: rows.map(r => cols.map(c => c.value(r) as string | number | null)) });

const StockAnalysisReport: React.FC = () => {
    const [asOf, setAsOf] = useState('');
    const [days, setDays] = useState('90');
    const [f, setF] = useState<Record<string, string>>({});
    const [tab, setTab] = useState<Tab>('Aging');
    const [cfg, setCfg] = useState<Record<string, string>>({});
    const [reconcile, setReconcile] = useState(false);
    const [drill, setDrill] = useState<{ category?: string; product?: string; variant?: string }>({});

    const setFilter = (k: string) => (v: string) => setF(p => ({ ...p, [k]: v }));
    const params = useMemo(() => ({ asOf, days, ...f, ...cfg, ...(reconcile ? { reconcile: '1' } : {}) }), [asOf, days, f, cfg, reconcile]);
    const { data, loading, error, reload } = useReportData<Analysis>(URL, params);
    const stillLoading = !!(data as { loading?: boolean } | null)?.loading;
    useEffect(() => {
        if (!stillLoading) return undefined;
        const t = setTimeout(() => reload(), 3000);
        return () => clearTimeout(t);
    }, [stillLoading, reload, data]);

    const level = drill.variant !== undefined ? 'barcode' : drill.product ? 'variant' : drill.category ? 'product' : 'category';
    const [size, color] = (drill.variant ?? '').split(' · ');
    const drillParams = useMemo(() => ({
        ...params, by: level, limit: '500',
        ...(drill.category ? { category: drill.category } : {}),
        ...(drill.product ? { product: drill.product } : {}),
        ...(drill.variant !== undefined ? { size: size === '—' ? undefined : size, color: color === '—' ? undefined : color } : {}),
    }), [params, level, drill, size, color]);
    const drillData = useReportData<DrillData>(URL, drillParams, { enabled: tab === 'Drill-down' });

    const exportCsv = (name: string, headers: string[], rows: (string | number | null)[][]) => {
        if (!data) return;
        const meta: [string, string][] = [
            ['Report', `Inventory / Stock Aging & Sales Analysis — ${name}`],
            ['As-of date', data.asOf ?? ''],
            ['Sales period', `${data.period.from} to ${data.period.to} (${data.period.days} days)`],
            ['Filters', filterSummary(Object.entries(data.filters).map(([k, v]) => [k, v])).join('; ') || 'None'],
            ['Data source', 'SQL (Textilesoft SSS_copy), read-only'],
        ];
        saveCsv(reportFileName(`stock-analysis-${name.toLowerCase().replace(/\W+/g, '-')}`, data.asOf ?? undefined, data.asOf ?? undefined), buildReportCsv(meta, headers, rows));
    };
    const exportBtn = (name: string, cols: ReportColumn<never>[], rows: never[]) => {
        const e = exportRows(cols as ReportColumn<unknown>[], rows as unknown[]);
        return (
            <button type="button" onClick={() => exportCsv(name, e.headers, e.rows)} className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800">
                <Download size={14} /> CSV
            </button>
        );
    };

    const k = stillLoading ? undefined : data?.kpis;
    const kpis: ReportKpi[] = k ? [
        { label: 'Current stock qty', value: formatQuantity(k.stockQty) },
        { label: 'Inventory cost value', value: rupees(k.stockCostValue) },
        { label: 'Retail / MRP value', value: rupees(k.stockMrpValue) },
        { label: 'Sales (period)', value: rupees(k.periodSalesValue), sub: `${data?.period.from} → ${data?.period.to}` },
        { label: 'Gross profit', value: rupees(k.grossProfit), sub: 'sales − pieces sold × current cost rate' },
        { label: 'Gross margin', value: pctText(k.grossMarginPct) },
        { label: 'Sell-through', value: pctText(k.sellThroughPct) },
        { label: 'Turnover (annualised)', value: k.turnover == null ? '—' : `${k.turnover}×` },
        { label: '90+ day stock', value: rupees(k.value90), tone: 'warning' },
        { label: '180+ day stock', value: rupees(k.value180), tone: 'warning' },
        { label: '365+ day stock', value: rupees(k.value365), tone: 'negative' },
        { label: 'Dead stock', value: rupees(k.deadStockValue), sub: '365+ days and no sale in period', tone: 'negative' },
        { label: 'Fast-moving stock', value: rupees(k.fastMoving.value), sub: `${formatNumber(k.fastMoving.lots)} barcodes, sell-through 76%+`, tone: 'positive' },
        { label: 'Slow-moving stock', value: rupees(k.slowMoving.value), sub: `${formatNumber(k.slowMoving.lots)} barcodes, 91+ days`, tone: 'warning' },
        { label: 'Never-sold stock', value: rupees(k.neverSold.value), sub: `${formatNumber(k.neverSold.lots)} barcodes`, tone: 'negative' },
        { label: 'Items requiring reorder', value: k.itemsRequiringReorder == null ? 'Config needed' : formatNumber(k.itemsRequiringReorder) },
    ] : [];

    const bucketCols: ReportColumn<Bucket>[] = [
        { key: 'key', header: 'Bucket', value: r => r.label ?? r.key, subtext: r => r.range },
        { key: 'lots', header: 'Barcodes', type: 'number', value: r => r.lots },
        { key: 'qty', header: 'Qty', type: 'quantity', value: r => r.qty },
        { key: 'cost', header: 'Cost value', type: 'currency', fractionDigits: 0, value: r => r.costValue },
        { key: 'mrp', header: 'MRP value', type: 'currency', fractionDigits: 0, value: r => r.mrpValue ?? null },
    ];
    const reorderCols: ReportColumn<ReorderRow>[] = [
        { key: 'product', header: 'Product', value: r => r.product },
        { key: 'category', header: 'Category', value: r => r.category },
        { key: 'stock', header: 'Stock', type: 'quantity', value: r => r.stockQty },
        { key: 'sold', header: 'Sold (period)', type: 'quantity', value: r => r.periodSoldQty },
        { key: 'daily', header: 'Avg daily', type: 'number', value: r => r.avgDailySales },
        { key: 'weekly', header: 'Avg weekly', type: 'number', value: r => r.avgWeeklySales },
        { key: 'dos', header: 'Days of stock', type: 'number', value: r => r.daysOfStock },
        { key: 'rp', header: 'Reorder point', type: 'number', value: r => r.reorderPoint },
        { key: 'rq', header: 'Suggested order qty', type: 'number', value: r => r.recommendedQty },
        { key: 'status', header: 'Status', type: 'status', value: r => r.status, statusTones: { 'REORDER NOW': 'danger', 'REORDER SOON': 'warning', HEALTHY: 'success', OVERSTOCKED: 'info', 'CONFIG NEEDED': 'neutral' } },
    ];

    const crumbs = (
        <div className="flex flex-wrap items-center gap-2 text-sm">
            <button type="button" className="font-bold text-primary hover:underline" onClick={() => setDrill({})}>Overall</button>
            {drill.category && <><span>›</span><button type="button" className="font-bold text-primary hover:underline" onClick={() => setDrill({ category: drill.category })}>{drill.category}</button></>}
            {drill.product && <><span>›</span><button type="button" className="font-bold text-primary hover:underline" onClick={() => setDrill({ category: drill.category, product: drill.product })}>{drill.product}</button></>}
            {drill.variant !== undefined && <><span>›</span><span className="font-bold">{drill.variant}</span></>}
        </div>
    );

    const cfgField = (key: string, label: string) => (
        <label className="flex flex-col gap-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{label}</span>
            <input type="number" min={0} value={cfg[key] ?? ''} onChange={e => setCfg(p => ({ ...p, [key]: e.target.value }))}
                className="w-28 px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm" />
        </label>
    );

    return (
        <div className="space-y-5">
            <div className="flex flex-wrap items-end gap-3">
                <label className="flex flex-col gap-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">As-of date</span>
                    <input type="date" value={asOf} max={data?.asOf ?? undefined} onChange={e => setAsOf(e.target.value)}
                        className="px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm" />
                </label>
                <FilterSelect label="Sales period" value={days} onChange={setDays} options={PERIODS} />
                <FilterSelect label="Category" value={f.category ?? ''} onChange={setFilter('category')} options={opts(data?.filterOptions.categories)} allLabel="All" />
                <FilterSelect label="Sub-category" value={f.subCategory ?? ''} onChange={setFilter('subCategory')} options={opts(data?.filterOptions.subCategories)} allLabel="All" />
                <FilterSelect label="Supplier" value={f.supplier ?? ''} onChange={setFilter('supplier')} options={opts(data?.filterOptions.suppliers)} allLabel="All" />
                <FilterSelect label="Brand" value={f.brand ?? ''} onChange={setFilter('brand')} options={opts(data?.filterOptions.brands)} allLabel="All" />
                <FilterSelect label="Size" value={f.size ?? ''} onChange={setFilter('size')} options={opts(data?.filterOptions.sizes)} allLabel="All" />
                <FilterSelect label="Colour" value={f.color ?? ''} onChange={setFilter('color')} options={opts(data?.filterOptions.colors)} allLabel="All" />
                <FilterSelect label="Stock status" value={f.stockStatus ?? ''} onChange={setFilter('stockStatus')} allLabel="All" options={[{ value: 'in-stock', label: 'In stock' }, { value: 'never-sold', label: 'Never sold' }, { value: 'sold-out', label: 'Sold out (sold in period)' }]} />
                <FilterSelect label="Month bucket" value={f.bucket ?? ''} onChange={setFilter('bucket')} allLabel="All" options={data?.ageBuckets.map(b => ({ value: b.key, label: b.label })) ?? []} />
                <FilterSelect label="Management class" value={f.mgmtClass ?? ''} onChange={setFilter('mgmtClass')} allLabel="All" options={data?.mgmtClasses.map(b => ({ value: b.key, label: `${b.key} (${b.range})` })) ?? []} />
                <label className="flex flex-col gap-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Barcode</span>
                    <input value={f.barcode ?? ''} onChange={e => setFilter('barcode')(e.target.value)} className="w-36 px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm" />
                </label>
            </div>
            <p className="text-xs text-slate-500">Gender, age group and branch filters are not available: the shop database has no such columns (see Checks).</p>

            {error && <ReportError message={error} />}
            {stillLoading && <p className="text-sm text-slate-500">Reading the shop database — this can take a minute on the first run. The page will fill in by itself.</p>}
            {data?.message && <p className="text-sm text-slate-500">{data.message}</p>}
            <ReportKpiGrid items={kpis} loading={loading && !data} />

            <div className="flex flex-wrap gap-2 border-b border-slate-200 dark:border-slate-800">
                {TABS.map(t => (
                    <button key={t} type="button" aria-pressed={tab === t} onClick={() => setTab(t)}
                        className={`px-3 py-2 text-sm font-semibold border-b-2 ${tab === t ? 'border-primary text-primary' : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'}`}>{t}</button>
                ))}
            </div>

            {data && !stillLoading && tab === 'Aging' && (
                <div className="space-y-5">
                    <ReportTable title="Stock age by calendar month" subtitle="Months from the barcode's purchase date to the as-of date (same buckets as Aged Stock)" columns={bucketCols} rows={data.ageBuckets} rowKey={r => r.key} actions={exportBtn('Month buckets', bucketCols as never, data.ageBuckets as never)} />
                    <ReportTable title="Management classification" subtitle="Days of age; a separate view of the same stock, not additional stock" columns={bucketCols} rows={data.mgmtClasses} rowKey={r => r.key} actions={exportBtn('Management classes', bucketCols as never, data.mgmtClasses as never)} />
                    <ReportTable title="Sell-through bands" subtitle="Net sold ÷ net received, per barcode with stock" columns={bucketCols} rows={data.sellThroughBands} rowKey={r => r.key} />
                </div>
            )}
            {data && !stillLoading && tab === 'Categories' && (
                <ReportTable title="Category analysis" columns={metricCols('Category')} rows={data.categories} rowKey={r => r.key} actions={exportBtn('Categories', metricCols('Category') as never, data.categories as never)} />
            )}
            {tab === 'Drill-down' && (
                <div className="space-y-3">
                    {crumbs}
                    {drillData.error && <ReportError message={drillData.error} />}
                    {level === 'barcode' ? (
                        <ReportTable title="Barcodes (purchase batches)" columns={lotCols} rows={(drillData.data?.items ?? []) as Lot[]} rowKey={r => r.barcode} loading={drillData.loading} actions={exportBtn('Barcodes', lotCols as never, (drillData.data?.items ?? []) as never)} />
                    ) : (
                        <ReportTable
                            title={level === 'category' ? 'Categories' : level === 'product' ? 'Products' : 'Variants (size · colour)'}
                            subtitle="Click a row to go one level deeper"
                            columns={metricCols(level === 'category' ? 'Category' : level === 'product' ? 'Product' : 'Variant')}
                            rows={(drillData.data?.items ?? []) as Metrics[]} rowKey={r => r.key} loading={drillData.loading}
                            onRowClick={r => setDrill(level === 'category' ? { category: r.key } : level === 'product' ? { ...drill, product: r.key } : { ...drill, variant: r.key })}
                            actions={exportBtn('Drill-down', metricCols('Group') as never, (drillData.data?.items ?? []) as never)} />
                    )}
                </div>
            )}
            {data && !stillLoading && tab === 'Never sold' && (
                <ReportTable title={`Never-sold stock — ${formatNumber(data.neverSold.totals.lots)} barcodes, ${rupees(data.neverSold.totals.costValue)}`} subtitle="Stock > 0 and no sale ever recorded for the barcode (largest 300 by value)" columns={lotCols} rows={data.neverSold.items} rowKey={r => r.barcode} actions={exportBtn('Never sold', lotCols as never, data.neverSold.items as never)} />
            )}
            {data && !stillLoading && tab === 'Reorder' && (
                <div className="space-y-3">
                    <div className="flex flex-wrap items-end gap-3 p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-sm">
                        {cfgField('leadDays', 'Lead time (days)')}{cfgField('safetyDays', 'Safety (days of sales)')}{cfgField('coverDays', 'Target cover (days)')}{cfgField('soonDays', '"Soon" window (days)')}{cfgField('overstockDays', 'Overstock above (days)')}
                        <p className="text-xs text-slate-500 max-w-md">{data.reorder.note}</p>
                    </div>
                    <ReportTable title="Reorder analysis (by product)" columns={reorderCols} rows={data.reorder.rows} rowKey={r => r.product} actions={exportBtn('Reorder', reorderCols as never, data.reorder.rows as never)} />
                </div>
            )}
            {data && !stillLoading && tab === 'Clearance' && (
                <div className="space-y-5">
                    <ReportTable title="Clearance candidates by class" subtitle="Review list only. Prices are never changed automatically." columns={bucketCols} rows={data.clearance.counts} rowKey={r => r.key} />
                    <ReportTable title="Ranked candidates (stock value × age)" columns={lotCols} rows={data.clearance.items} rowKey={r => r.barcode} actions={exportBtn('Clearance', lotCols as never, data.clearance.items as never)} />
                </div>
            )}
            {data && !stillLoading && tab === 'Kids' && (
                <div className="space-y-5">
                    <p className="text-xs text-slate-500">Segments come from the real category names ({data.kids.categoriesUsed.join(', ') || 'none matched'}). No allocation percentages are suggested.</p>
                    <ReportTable title="Kids segments" columns={metricCols('Segment')} rows={data.kids.segments} rowKey={r => r.key} actions={exportBtn('Kids segments', metricCols('Segment') as never, data.kids.segments as never)} />
                    <ReportTable title="By product" columns={metricCols('Segment · Product')} rows={data.kids.byProduct} rowKey={r => r.key} />
                    <ReportTable title="By size (age-group proxy)" columns={metricCols('Segment · Size')} rows={data.kids.bySize} rowKey={r => r.key} />
                    <ReportTable title="By price band" columns={metricCols('Segment · Band')} rows={data.kids.byPriceBand} rowKey={r => r.key} />
                    <ReportTable title="By supplier" columns={metricCols('Segment · Supplier')} rows={data.kids.bySupplier} rowKey={r => r.key} />
                </div>
            )}
            {data && !stillLoading && tab === 'Price bands' && (
                <div className="space-y-3">
                    <p className="text-xs text-slate-500">{data.priceBands.cuts ? `Bands are derived from the data (${data.priceBands.basis}): cut points ₹${Math.round(data.priceBands.cuts[0])} and ₹${Math.round(data.priceBands.cuts[1])} split the pieces into thirds.` : 'Not enough priced sales to derive bands.'}</p>
                    <ReportTable title="Price-band analysis" columns={metricCols('Price band')} rows={data.priceBands.rows} rowKey={r => r.key} actions={exportBtn('Price bands', metricCols('Price band') as never, data.priceBands.rows as never)} />
                </div>
            )}
            {data && !stillLoading && tab === 'Suppliers' && (() => {
                const cols: ReportColumn<Metrics>[] = [...metricCols('Supplier'), { key: 'fast', header: 'Fast barcodes', type: 'number', value: r => r.fastLots ?? null }, { key: 'slow', header: 'Slow barcodes', type: 'number', value: r => r.slowLots ?? null }];
                return <ReportTable title="Supplier analysis" columns={cols} rows={data.suppliers} rowKey={r => r.key} actions={exportBtn('Suppliers', cols as never, data.suppliers as never)} />;
            })()}
            {data && !stillLoading && tab === 'Checks' && (
                <div className="space-y-4 text-sm">
                    {!data.reconciliation && <button type="button" onClick={() => setReconcile(true)} className="px-3 py-1.5 text-xs font-bold border border-slate-200 dark:border-slate-700 rounded-lg">Compare with the existing stock reports (runs a second scan)</button>}
                    {data.reconciliation && (
                        <div className="p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-sm">
                            <h3 className="font-bold mb-2">Reconciliation with the existing stock reports</h3>
                            <p>Qty: {formatQuantity(data.reconciliation.thisReportQty)} here vs {formatQuantity(data.reconciliation.stockReportsQty)} there (difference {formatQuantity(data.reconciliation.qtyDifference)}).</p>
                            <p>Cost value: {rupees(data.reconciliation.thisReportCostValue)} vs {rupees(data.reconciliation.stockReportsCostValue)} (difference {rupees(data.reconciliation.valueDifference)}).</p>
                            <p className="text-xs text-slate-500 mt-1">{data.reconciliation.note}</p>
                        </div>
                    )}
                    <div className="p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-sm">
                        <h3 className="font-bold mb-2">Data quality</h3>
                        <ul className="list-disc pl-5 space-y-1">{Object.entries(data.dataQuality).map(([k2, v]) => <li key={k2}><span className="font-semibold">{k2}:</span> {String(v)}</li>)}</ul>
                    </div>
                    <div className="p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-sm">
                        <h3 className="font-bold mb-2">Not available from the shop database</h3>
                        <ul className="list-disc pl-5 space-y-1">{data.unavailable.map(u => <li key={u.field}><span className="font-semibold">{u.field}:</span> {u.reason}</li>)}</ul>
                    </div>
                </div>
            )}
        </div>
    );
};

export default StockAnalysisReport;

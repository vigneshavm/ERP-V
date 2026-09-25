import React, { useCallback, useEffect, useState } from 'react';
import api from "../../services/api";
import Layout from "../../components/shared/Layout/index";
import { SortTh } from "../reports/components/SortTh";
import { useSort } from "../reports/hooks/useReportData";
import { AlertCircle, CalendarDays, ChevronLeft, ChevronRight, Clock, Info, Package, RefreshCw, Search, Truck, X } from 'lucide-react';

/**
 * Aged Stock -- "purchased but not sold", grouped by calendar month of purchase.
 * One barcode = one purchase lot; remaining stock on the barcode is the unsold part of that purchase.
 * Data: GET /api/inventory/stock-age (bucket totals over ALL lots + one page of the selected bucket).
 */

type BucketKey = '0' | '1' | '2' | '3' | '4' | '5' | '6-11' | '12+' | 'unknown';

interface BucketSummary {
    key: BucketKey;
    label: string;
    range: string;
    lots: number;
    qty: number;
    value: number;
}

interface StockAgeRow {
    _id: string;
    barcode: string;
    name: string;
    category: string | null;
    supplier: string;
    purchaseDate: string | null;
    purchaseMonth: string;
    ageMonths: number | null;
    bucket: BucketKey;
    purchasedQty: number;
    soldQty: number;
    returnedQty: number;
    remainingQty: number;
    costPrice: number;
    value: number;
    inMirror: boolean;
}

interface MonthSummary {
    key: string; // "2025-06"
    label: string; // "Jun 2025"
    ageMonths: number;
    bucket: BucketKey;
    lots: number;
    qty: number;
    value: number;
}

interface SelectionDetail {
    lots: number;
    unsoldQty: number;
    value: number;
    purchasedQty: number;
    soldQty: number;
    returnedQty: number;
    sellThroughPct: number | null;
    suppliers: { name: string; lots: number; qty: number; value: number }[];
}

interface StockAgeResponse {
    asOf: string | null;
    buckets: BucketSummary[];
    totals: { lots: number; qty: number; value: number };
    bucket: BucketKey | 'all';
    selection?: { kind: 'all' | 'bucket' | 'month'; key: string };
    detail?: SelectionDetail;
    months?: MonthSummary[];
    items: StockAgeRow[];
    pagination: { page: number; limit: number; total: number; pages: number };
    range?: { from: string | null; to: string | null };
    checks?: { multiPurchaseBarcodes: number };
    source: 'sql' | 'mongo';
    approximate?: boolean;
}

const OLD_BUCKETS: BucketKey[] = ['6-11', '12+'];

const rupees = (n: number): string => `₹${Math.round(n || 0).toLocaleString('en-IN')}`;
const qtyText = (n: number): string => (Number.isInteger(n) ? n.toLocaleString('en-IN') : n.toLocaleString('en-IN', { maximumFractionDigits: 3 }));
const ageText = (r: StockAgeRow): string =>
    r.ageMonths === null ? 'No purchase record' : `${r.purchaseMonth} · ${r.ageMonths === 0 ? 'this month' : `${r.ageMonths} month${r.ageMonths === 1 ? '' : 's'}`}`;

const bucketTone = (key: BucketKey | 'all'): string =>
    key === '12+' ? 'text-error' : key === '6-11' ? 'text-warning' : key === 'unknown' ? 'text-neutral-400' : 'text-neutral-900 dark:text-white';

const AgedStockManager: React.FC = () => {
    // 'all' | a bucket key ('3', '6-11', ...) | 'm:YYYY-MM' for one purchase month
    const [selection, setSelection] = useState<string>('all');
    const [searchInput, setSearchInput] = useState('');
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [fromDate, setFromDate] = useState('');
    const [toDate, setToDate] = useState('');
    const srt = useSort(['purchaseDate', 'purchasedQty', 'soldQty', 'returnedQty', 'remainingQty', 'value']);
    useEffect(() => setPage(1), [srt.sort, srt.dir]); // new sort -> back to page 1
    const [data, setData] = useState<StockAgeResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Debounce the search box so every keystroke doesn't hit the server.
    useEffect(() => {
        const t = setTimeout(() => {
            setSearch(searchInput.trim());
            setPage(1);
        }, 300);
        return () => clearTimeout(t);
    }, [searchInput]);

    const load = useCallback(async (refresh = false) => {
        setLoading(true);
        setError(null);
        try {
            const params: Record<string, string> = { page: String(page), limit: '50' };
            if (selection.startsWith('m:')) params.month = selection.slice(2);
            else if (selection !== 'all') params.bucket = selection;
            if (search) params.search = search;
            if (srt.sort) {
                params.sort = srt.sort;
                params.dir = srt.dir;
            }
            if (fromDate) params.from = fromDate;
            if (toDate) params.to = toDate;
            if (refresh) params.refresh = '1';
            const res = await api.get<StockAgeResponse>('/api/inventory/stock-age', { params });
            setData(res.data);
        } catch (err: any) {
            setError(err?.response?.data?.message || err?.message || 'Could not load aged stock');
        } finally {
            setLoading(false);
        }
    }, [selection, search, page, fromDate, toDate, srt.sort, srt.dir]);

    useEffect(() => {
        load();
    }, [load]);

    const select = (key: string) => {
        setSelection(key);
        setPage(1);
    };

    const setRange = (from: string, to: string) => {
        setFromDate(from);
        setToDate(to);
        // A month outside the new range would show nothing -- go back to all months.
        if (selection.startsWith('m:')) setSelection('all');
        setPage(1);
    };
    const hasRange = !!(fromDate || toDate);

    const totals = data?.totals ?? { lots: 0, qty: 0, value: 0 };
    const oldValue = (data?.buckets ?? []).filter(b => OLD_BUCKETS.includes(b.key)).reduce((acc, b) => acc + b.value, 0);
    const oldQty = (data?.buckets ?? []).filter(b => OLD_BUCKETS.includes(b.key)).reduce((acc, b) => acc + b.qty, 0);
    const multi = data?.checks?.multiPurchaseBarcodes ?? 0;
    const pagination = data?.pagination;
    const months = data?.months ?? [];
    const selectedMonth = selection.startsWith('m:') ? months.find(m => m.key === selection.slice(2)) : undefined;
    const selectedBucket = !selection.startsWith('m:') && selection !== 'all' ? data?.buckets.find(b => b.key === selection) : undefined;
    const detailTitle = selectedMonth
        ? `${selectedMonth.label} · ${selectedMonth.ageMonths === 0 ? 'this month' : `${selectedMonth.ageMonths} month${selectedMonth.ageMonths === 1 ? '' : 's'} old`}`
        : selectedBucket
            ? `${selectedBucket.label} · ${selectedBucket.range}`
            : 'All months';

    return (
        <Layout>
            <div className="space-y-6 animate-fade-in text-neutral-900 dark:text-neutral-100 pb-16">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h2 className="text-2xl font-black flex items-center gap-2 tracking-tight">
                            <Clock className="w-6 h-6 text-primary" />
                            Aged Stock
                        </h2>
                        <p className="text-sm text-neutral-500 mt-0.5 font-medium">
                            Purchased but not yet sold, grouped by purchase month
                            {hasRange && <> · bought <span className="font-bold text-neutral-700 dark:text-neutral-300">{fromDate || 'start'} to {toDate || 'latest'}</span></>}
                            {data?.asOf && <> · as of <span className="font-bold text-neutral-700 dark:text-neutral-300">{data.asOf}</span> (latest sale in shop data)</>}
                        </p>
                    </div>
                    <button
                        onClick={() => load(true)}
                        disabled={loading}
                        className="px-4 py-2 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-sm text-sm font-bold flex items-center gap-2 hover:bg-neutral-50 dark:hover:bg-neutral-700 shadow-sm transition disabled:opacity-50"
                    >
                        <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
                    </button>
                </div>

                {/* Data-quality notes */}
                {data?.approximate && (
                    <div className="flex items-start gap-2 p-3 rounded-sm border border-warning/30 bg-warning/5 text-xs font-medium text-neutral-700 dark:text-neutral-300">
                        <Info className="w-4 h-4 text-warning shrink-0 mt-0.5" />
                        MongoDB mode: each item's whole stock uses the date of its oldest purchase still in stock, so ages are approximate.
                    </div>
                )}
                {multi > 0 && (
                    <div className="flex items-start gap-2 p-3 rounded-sm border border-warning/30 bg-warning/5 text-xs font-medium text-neutral-700 dark:text-neutral-300">
                        <Info className="w-4 h-4 text-warning shrink-0 mt-0.5" />
                        {multi.toLocaleString('en-IN')} barcode{multi === 1 ? ' has' : 's have'} more than one purchase entry. Their age uses the earliest entry.
                    </div>
                )}
                {error && (
                    <div className="flex items-start gap-2 p-3 rounded-sm border border-error/30 bg-error/5 text-sm font-medium text-error">
                        <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" /> {error}
                    </div>
                )}

                {/* Totals */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <Kpi label="Unsold value (cost)" value={rupees(totals.value)} />
                    <Kpi label="Unsold quantity" value={qtyText(totals.qty)} sub={`${totals.lots.toLocaleString('en-IN')} lots`} />
                    <Kpi label="6+ months value" value={rupees(oldValue)} tone="text-error" sub={totals.value > 0 ? `${((oldValue / totals.value) * 100).toFixed(1)}% of unsold value` : undefined} />
                    <Kpi label="6+ months quantity" value={qtyText(oldQty)} tone="text-warning" />
                </div>

                {/* Month / age-group picker */}
                <div className="flex flex-col md:flex-row md:items-center gap-3">
                    <label htmlFor="stock-age-month" className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider shrink-0">Show</label>
                    <select
                        id="stock-age-month"
                        value={selection}
                        onChange={(e) => select(e.target.value)}
                        className="w-full md:w-96 px-3 py-2.5 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-sm text-sm font-medium outline-none focus:ring-2 focus:ring-primary/20 shadow-sm"
                    >
                        <option value="all">All months — {qtyText(totals.qty)} pcs · {rupees(totals.value)}</option>
                        <optgroup label="Age groups">
                            {(data?.buckets ?? []).filter(b => b.lots > 0).map(b => (
                                <option key={b.key} value={b.key}>{b.label} ({b.range}) — {qtyText(b.qty)} pcs · {rupees(b.value)}</option>
                            ))}
                        </optgroup>
                        <optgroup label="Purchase month">
                            {months.map(m => (
                                <option key={m.key} value={`m:${m.key}`}>
                                    {m.label} · {m.ageMonths === 0 ? 'this month' : `${m.ageMonths} mo`} — {qtyText(m.qty)} pcs · {rupees(m.value)}
                                </option>
                            ))}
                        </optgroup>
                    </select>
                    {selection !== 'all' && (
                        <button onClick={() => select('all')} className="text-xs font-bold text-primary hover:underline self-start md:self-auto">Show all months</button>
                    )}
                </div>

                {/* Details for the selected month / age group */}
                {data?.detail && (
                    <div className="bg-white dark:bg-neutral-800 rounded-sm border border-neutral-200 dark:border-neutral-700 shadow-sm p-4 space-y-4">
                        <div className="flex items-baseline justify-between gap-2 flex-wrap">
                            <h3 className="text-base font-black">{detailTitle}</h3>
                            <span className="text-[11px] text-neutral-400 font-medium">Purchased / sold / returned are for the lots that still have stock</span>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
                            <Stat label="Lots" value={data.detail.lots.toLocaleString('en-IN')} />
                            <Stat label="Unsold pcs" value={qtyText(data.detail.unsoldQty)} strong />
                            <Stat label="Unsold value" value={rupees(data.detail.value)} strong />
                            <Stat label="Purchased pcs" value={qtyText(data.detail.purchasedQty)} />
                            <Stat label="Sold pcs" value={qtyText(data.detail.soldQty)} />
                            <Stat label="Returned pcs" value={qtyText(data.detail.returnedQty)} />
                            <Stat label="Sell-through" value={data.detail.sellThroughPct === null ? '—' : `${data.detail.sellThroughPct}%`} />
                        </div>
                        {data.detail.suppliers.length > 0 && (
                            <div>
                                <div className="flex items-center gap-1.5 text-[10px] font-bold text-neutral-400 uppercase tracking-wider mb-2">
                                    <Truck className="w-3.5 h-3.5" /> Top suppliers by unsold value
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2">
                                    {data.detail.suppliers.map(sup => (
                                        <button
                                            key={sup.name}
                                            onClick={() => setSearchInput(sup.name === 'Unknown supplier' ? '' : sup.name)}
                                            title="Filter the table by this supplier"
                                            className="text-left p-2.5 rounded-sm border border-neutral-100 dark:border-neutral-700 hover:border-primary/40 transition"
                                        >
                                            <div className="text-xs font-bold truncate">{sup.name}</div>
                                            <div className="text-[11px] text-neutral-500 font-medium">{rupees(sup.value)} · {qtyText(sup.qty)} pcs · {sup.lots.toLocaleString('en-IN')} lots</div>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Search + purchase date range */}
                <div className="flex flex-col lg:flex-row gap-3">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                        <input
                            type="text"
                            placeholder="Search product, barcode or supplier..."
                            className="w-full pl-10 pr-4 py-3 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-sm text-sm outline-none focus:ring-2 focus:ring-primary/20 transition shadow-sm font-medium"
                            value={searchInput}
                            onChange={(e) => setSearchInput(e.target.value)}
                        />
                    </div>
                    <div className="flex flex-wrap items-center gap-2 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-sm px-3 py-2 shadow-sm">
                        <CalendarDays className="w-4 h-4 text-neutral-400" />
                        <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Purchased</span>
                        <label className="flex items-center gap-1 text-xs font-medium text-neutral-500">
                            From
                            <input
                                type="date"
                                value={fromDate}
                                max={toDate || data?.asOf || undefined}
                                onChange={(e) => setRange(e.target.value, toDate)}
                                className="px-2 py-1.5 bg-transparent border border-neutral-200 dark:border-neutral-700 rounded-sm text-sm text-neutral-900 dark:text-white outline-none focus:ring-2 focus:ring-primary/20"
                            />
                        </label>
                        <label className="flex items-center gap-1 text-xs font-medium text-neutral-500">
                            To
                            <input
                                type="date"
                                value={toDate}
                                min={fromDate || undefined}
                                max={data?.asOf || undefined}
                                onChange={(e) => setRange(fromDate, e.target.value)}
                                className="px-2 py-1.5 bg-transparent border border-neutral-200 dark:border-neutral-700 rounded-sm text-sm text-neutral-900 dark:text-white outline-none focus:ring-2 focus:ring-primary/20"
                            />
                        </label>
                        {hasRange && (
                            <button onClick={() => setRange('', '')} className="p-1.5 rounded-sm text-neutral-400 hover:text-error hover:bg-error/5 transition" aria-label="Clear purchase date range" title="Clear dates">
                                <X className="w-4 h-4" />
                            </button>
                        )}
                    </div>
                </div>

                {/* Lots */}
                <div className="bg-white dark:bg-neutral-800 rounded-sm border border-neutral-200 dark:border-neutral-700 overflow-hidden shadow-sm">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm tabular-nums">
                            <thead className="bg-neutral-50 dark:bg-neutral-900 border-b border-neutral-100 dark:border-neutral-800 text-neutral-500 font-bold uppercase tracking-wider text-[10px]">
                                <tr>
                                    <SortTh label="Product" col="name" sort={srt.sort} dir={srt.dir} onSort={srt.onSort} />
                                    <SortTh label="Supplier" col="supplier" sort={srt.sort} dir={srt.dir} onSort={srt.onSort} />
                                    <SortTh label="Purchased on" col="purchaseDate" sort={srt.sort} dir={srt.dir} onSort={srt.onSort} />
                                    <SortTh label="Purchased" col="purchasedQty" sort={srt.sort} dir={srt.dir} onSort={srt.onSort} align="right" />
                                    <SortTh label="Sold" col="soldQty" sort={srt.sort} dir={srt.dir} onSort={srt.onSort} align="right" />
                                    <SortTh label="Returned" col="returnedQty" sort={srt.sort} dir={srt.dir} onSort={srt.onSort} align="right" />
                                    <SortTh label="Unsold" col="remainingQty" sort={srt.sort} dir={srt.dir} onSort={srt.onSort} align="right" />
                                    <SortTh label="Value (cost)" col="value" sort={srt.sort} dir={srt.dir} onSort={srt.onSort} align="right" />
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                                {(data?.items ?? []).map(r => (
                                    <tr key={`${r.barcode}-${r._id}`} className="hover:bg-neutral-50 dark:hover:bg-neutral-700/30 transition-colors">
                                        <td className="p-4">
                                            <div className="flex items-start gap-3">
                                                <Package className={`w-4 h-4 mt-0.5 shrink-0 ${bucketTone(r.bucket)}`} />
                                                <div>
                                                    <div className="font-bold text-neutral-900 dark:text-white">{r.name}</div>
                                                    <div className="text-[11px] text-neutral-400 font-medium">
                                                        {r.barcode}{r.category ? ` · ${r.category}` : ''}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-4 text-neutral-600 dark:text-neutral-300">{r.supplier || '—'}</td>
                                        <td className="p-4">
                                            <div className="font-medium">{r.purchaseDate ?? '—'}</div>
                                            <div className={`text-[11px] font-bold ${bucketTone(r.bucket)}`}>{ageText(r)}</div>
                                        </td>
                                        <td className="p-4 text-right">{qtyText(r.purchasedQty)}</td>
                                        <td className="p-4 text-right">{qtyText(r.soldQty)}</td>
                                        <td className="p-4 text-right">{r.returnedQty ? qtyText(r.returnedQty) : '—'}</td>
                                        <td className="p-4 text-right font-bold">{qtyText(r.remainingQty)}</td>
                                        <td className="p-4 text-right">{rupees(r.value)}</td>
                                    </tr>
                                ))}
                                {!loading && (data?.items ?? []).length === 0 && (
                                    <tr>
                                        <td colSpan={8} className="p-10 text-center text-sm text-neutral-400 font-medium">
                                            {data?.asOf === null ? 'No shop sales data found yet.' : hasRange ? 'No unsold stock bought in this date range.' : 'No unsold stock in this group.'}
                                        </td>
                                    </tr>
                                )}
                                {loading && !data && (
                                    <tr>
                                        <td colSpan={8} className="p-10 text-center text-sm text-neutral-400 font-medium">Loading aged stock…</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {pagination && pagination.total > 0 && (
                        <div className="flex items-center justify-between px-4 py-3 border-t border-neutral-100 dark:border-neutral-800 text-xs text-neutral-500 font-medium">
                            <span>
                                {((pagination.page - 1) * pagination.limit + 1).toLocaleString('en-IN')}–
                                {Math.min(pagination.page * pagination.limit, pagination.total).toLocaleString('en-IN')} of {pagination.total.toLocaleString('en-IN')} lots
                            </span>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => setPage(p => Math.max(1, p - 1))}
                                    disabled={loading || pagination.page <= 1}
                                    className="p-1.5 rounded-sm border border-neutral-200 dark:border-neutral-700 disabled:opacity-40"
                                    aria-label="Previous page"
                                >
                                    <ChevronLeft className="w-4 h-4" />
                                </button>
                                <span>Page {pagination.page} of {pagination.pages}</span>
                                <button
                                    onClick={() => setPage(p => Math.min(pagination.pages, p + 1))}
                                    disabled={loading || pagination.page >= pagination.pages}
                                    className="p-1.5 rounded-sm border border-neutral-200 dark:border-neutral-700 disabled:opacity-40"
                                    aria-label="Next page"
                                >
                                    <ChevronRight className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </Layout>
    );
};

const Kpi: React.FC<{ label: string; value: string; sub?: string; tone?: string }> = ({ label, value, sub, tone }) => (
    <div className="bg-white dark:bg-neutral-800 p-4 rounded-sm border border-neutral-200 dark:border-neutral-700 shadow-sm">
        <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider mb-1">{label}</p>
        <h3 className={`text-2xl font-black ${tone ?? ''}`}>{value}</h3>
        {sub && <p className="text-[11px] text-neutral-500 mt-1 font-medium">{sub}</p>}
    </div>
);

const Stat: React.FC<{ label: string; value: string; strong?: boolean }> = ({ label, value, strong }) => (
    <div>
        <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">{label}</p>
        <p className={`text-lg ${strong ? 'font-black' : 'font-bold text-neutral-700 dark:text-neutral-200'}`}>{value}</p>
    </div>
);

export default AgedStockManager;

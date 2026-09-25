import React, { useEffect, useState } from 'react';
import { Search, Download } from 'lucide-react';
import api from '@/services/api';
import PageHeader from '@/components/shared/Layout/PageHeader';

interface StockRow {
    _id: string;
    sku?: string;
    barcode?: string;
    name: string;
    category?: string;
    unit?: string;
    stockQty: number;
    costPrice?: number;
    lowStockLimit?: number;
}

interface Stats {
    totalItems: number;
    totalStockQuantity: number;
    totalValuation: number;
    lowStockCount: number;
}

const PAGE_SIZE = 25;

// Live stock position from the same inventory endpoints the Items page uses (shop database in SQL mode,
// ERP items otherwise) -- this screen previously rendered a hardcoded 5-row array with no API call.
const StockSummary: React.FC = () => {
    const [search, setSearch] = useState('');
    const [query, setQuery] = useState('');
    const [page, setPage] = useState(1);
    const [rows, setRows] = useState<StockRow[]>([]);
    const [pages, setPages] = useState(1);
    const [stats, setStats] = useState<Stats | null>(null);
    const [loadedKey, setLoadedKey] = useState('');
    const [error, setError] = useState('');

    useEffect(() => {
        const t = setTimeout(() => { setQuery(search.trim()); setPage(1); }, 350);
        return () => clearTimeout(t);
    }, [search]);

    useEffect(() => {
        api.get('/api/inventory/inventory-stats').then(r => setStats(r.data)).catch(() => setStats(null));
    }, []);

    useEffect(() => {
        let cancelled = false;
        const key = `${page}|${query}`;
        api.get('/api/inventory', { params: { page, limit: PAGE_SIZE, search: query || undefined } })
            .then(res => {
                if (cancelled) return;
                setRows(res.data?.items || []);
                setPages(res.data?.pagination?.pages || 1);
                setError('');
            })
            .catch(err => { if (!cancelled) setError(err?.response?.data?.message || 'Failed to load stock'); })
            .finally(() => { if (!cancelled) setLoadedKey(key); });
        return () => { cancelled = true; };
    }, [page, query]);

    const exportCsv = () => {
        const head = ['SKU', 'Item', 'Category', 'Unit', 'Stock', 'Cost', 'Value'];
        const lines = rows.map(r => [r.sku || r.barcode || '', r.name, r.category || '', r.unit || '', r.stockQty, r.costPrice || 0, (r.stockQty || 0) * (r.costPrice || 0)]
            .map(v => `"${String(v).replace(/"/g, '""')}"`).join(','));
        const blob = new Blob([[head.join(','), ...lines].join('\n')], { type: 'text/csv' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = 'stock-summary.csv';
        a.click();
        URL.revokeObjectURL(a.href);
    };

    const loading = loadedKey !== `${page}|${query}`;
    const valueLakh = stats ? `₹${(stats.totalValuation / 100000).toFixed(2)}L` : '—';

    return (
        <div className="space-y-6 pb-12 animate-in fade-in duration-300">
            <PageHeader
                title="Stock Summary"
                description="Current inventory position across all items"
                actions={<button onClick={exportCsv} disabled={rows.length === 0} className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold hover:bg-slate-50 transition-all disabled:opacity-50">
                    <Download className="w-4 h-4" /> Export page
                </button>}
            />

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                    { label: 'Stock Value (at cost)', value: valueLakh, border: 'border-l-blue-500' },
                    { label: 'Total Units', value: stats ? Math.round(stats.totalStockQuantity).toLocaleString('en-IN') : '—', border: 'border-l-emerald-500' },
                    { label: 'Items in Stock', value: stats ? stats.totalItems.toLocaleString('en-IN') : '—', border: 'border-l-indigo-500' },
                    { label: 'Low Stock Items', value: stats ? `${stats.lowStockCount.toLocaleString('en-IN')} items` : '—', border: 'border-l-red-500' },
                ].map((k, i) => (
                    <div key={i} className={`bg-white dark:bg-slate-800 rounded-sm border border-slate-200 dark:border-slate-700 border-l-4 ${k.border} p-5`}>
                        <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">{k.label}</p>
                        <p className="text-2xl font-black text-slate-900 dark:text-white">{k.value}</p>
                    </div>
                ))}
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
                <div className="p-4 border-b border-slate-100 dark:border-slate-700">
                    <div className="relative max-w-sm">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search item, SKU or barcode..."
                            className="w-full pl-9 pr-4 py-2 text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>
                </div>
                {error && <div className="p-4 text-sm font-bold text-red-600">{error}</div>}
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50 dark:bg-slate-900/50">
                            <tr>{['SKU / Barcode', 'Item', 'Category', 'Unit', 'Stock', 'Cost', 'Value', 'Status'].map(h => (
                                <th key={h} className={`px-4 py-3 text-xs font-black uppercase tracking-wider text-slate-400 ${['Stock', 'Cost', 'Value'].includes(h) ? 'text-right' : ''}`}>{h}</th>
                            ))}</tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                            {loading && <tr><td colSpan={8} className="px-4 py-10 text-center text-sm font-bold text-slate-400">Loading stock…</td></tr>}
                            {!loading && rows.length === 0 && <tr><td colSpan={8} className="px-4 py-10 text-center text-sm font-bold text-slate-400">No items found</td></tr>}
                            {!loading && rows.map(item => {
                                const qty = item.stockQty || 0;
                                const isLow = qty <= (item.lowStockLimit ?? 0);
                                return (
                                    <tr key={item._id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                                        <td className="px-4 py-3 text-xs font-black text-blue-600">{item.sku || item.barcode}</td>
                                        <td className="px-4 py-3"><p className="text-sm font-bold text-slate-900 dark:text-white">{item.name}</p></td>
                                        <td className="px-4 py-3 text-xs text-slate-500">{item.category || '—'}</td>
                                        <td className="px-4 py-3 text-xs text-slate-500">{item.unit || '—'}</td>
                                        <td className="px-4 py-3 text-right text-sm font-black text-slate-900 dark:text-white">{qty}</td>
                                        <td className="px-4 py-3 text-right text-xs text-slate-500">₹{(item.costPrice || 0).toLocaleString('en-IN')}</td>
                                        <td className="px-4 py-3 text-right text-sm font-bold text-slate-700 dark:text-slate-300">₹{(qty * (item.costPrice || 0)).toLocaleString('en-IN')}</td>
                                        <td className="px-4 py-3">
                                            <span className={`px-2 py-1 rounded-lg text-xs font-bold ${isLow ? 'text-red-600 bg-red-50 dark:bg-red-900/20' : 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20'}`}>
                                                {isLow ? 'Low Stock' : 'OK'}
                                            </span>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
                <div className="flex items-center justify-between p-4 border-t border-slate-100 dark:border-slate-700 text-xs font-bold text-slate-500">
                    <span>Page {page} of {pages}</span>
                    <div className="flex gap-2">
                        <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 disabled:opacity-40">Previous</button>
                        <button disabled={page >= pages} onClick={() => setPage(p => p + 1)} className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 disabled:opacity-40">Next</button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default StockSummary;

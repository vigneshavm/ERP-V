import React, { useEffect, useState } from 'react';
import { ArrowUpDown, Search, TrendingUp, TrendingDown, Download } from 'lucide-react';
import api from '@/services/api';

interface Movement {
    id: string;
    date: string;
    item: string;
    sku: string;
    type: 'IN' | 'OUT';
    qty: number;
    ref: string;
    party: string;
    reason: string;
}

interface Totals { transactions: number; inQty: number; outQty: number }

const PAGE_SIZE = 50;

// Live in/out log: Textilesoft purchases, sales and purchase returns in SQL mode, ERP stock logs otherwise.
// This screen previously rendered six hardcoded rows with no API call.
const StockMovement: React.FC = () => {
    const [search, setSearch] = useState('');
    const [query, setQuery] = useState('');
    const [type, setType] = useState('All');
    const [from, setFrom] = useState('');
    const [to, setTo] = useState('');
    const [page, setPage] = useState(1);
    const [rows, setRows] = useState<Movement[]>([]);
    const [pages, setPages] = useState(1);
    const [totals, setTotals] = useState<Totals | null>(null);
    const [range, setRange] = useState<{ from: string; to: string } | null>(null);
    const [loadedKey, setLoadedKey] = useState('');
    const [error, setError] = useState('');

    useEffect(() => {
        const t = setTimeout(() => { setQuery(search.trim()); setPage(1); }, 350);
        return () => clearTimeout(t);
    }, [search]);

    useEffect(() => {
        let cancelled = false;
        const key = `${page}|${query}|${type}|${from}|${to}`;
        api.get('/api/inventory/stock-movements', { params: { page, limit: PAGE_SIZE, type: type === 'All' ? undefined : type, search: query || undefined, from: from || undefined, to: to || undefined } })
            .then(res => {
                if (cancelled) return;
                setRows(res.data?.items || []);
                setPages(res.data?.pagination?.pages || 1);
                setTotals(res.data?.totals || null);
                setRange(res.data?.range || null);
                setError('');
            })
            .catch(err => { if (!cancelled) setError(err?.response?.data?.message || 'Failed to load stock movements'); })
            .finally(() => { if (!cancelled) setLoadedKey(key); });
        return () => { cancelled = true; };
    }, [page, query, type, from, to]);

    const loading = loadedKey !== `${page}|${query}|${type}|${from}|${to}`;

    const exportCsv = () => {
        const head = ['Date', 'Item', 'SKU', 'Type', 'Qty', 'Reference', 'Party', 'Reason'];
        const lines = rows.map(m => [m.date, m.item, m.sku, m.type, m.qty, m.ref, m.party, m.reason].map(v => `"${String(v).replace(/"/g, '""')}"`).join(','));
        const blob = new Blob([[head.join(','), ...lines].join('\n')], { type: 'text/csv' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = 'stock-movements.csv';
        a.click();
        URL.revokeObjectURL(a.href);
    };

    const inputCls = 'px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500';

    return (
        <div className="space-y-6 pb-12 animate-in fade-in duration-300">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-sm bg-indigo-600 flex items-center justify-center"><ArrowUpDown className="w-5 h-5 text-white" /></div>
                    <div>
                        <h1 className="text-2xl font-black text-slate-900 dark:text-white">Stock Movement</h1>
                        <p className="text-xs text-slate-500">All stock in/out transaction log{range ? ` · ${range.from} to ${range.to}` : ''}</p>
                    </div>
                </div>
                <button onClick={exportCsv} disabled={rows.length === 0} className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold hover:bg-slate-50 transition-all disabled:opacity-50">
                    <Download className="w-4 h-4" /> Export page
                </button>
            </div>

            <div className="grid grid-cols-3 gap-4">
                {[
                    { label: 'Total Transactions', value: totals ? totals.transactions.toLocaleString('en-IN') : '—', border: 'border-l-indigo-500' },
                    { label: 'Stock In (Units)', value: totals ? Math.round(totals.inQty).toLocaleString('en-IN') : '—', border: 'border-l-emerald-500' },
                    { label: 'Stock Out (Units)', value: totals ? Math.round(totals.outQty).toLocaleString('en-IN') : '—', border: 'border-l-red-500' },
                ].map((k, i) => (
                    <div key={i} className={`bg-white dark:bg-slate-800 rounded-sm border border-slate-200 dark:border-slate-700 border-l-4 ${k.border} p-5`}>
                        <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">{k.label}</p>
                        <p className="text-2xl font-black text-slate-900 dark:text-white">{k.value}</p>
                    </div>
                ))}
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
                <div className="p-4 border-b border-slate-100 dark:border-slate-700 flex flex-wrap gap-3 items-center">
                    <div className="relative flex-1 min-w-[220px] max-w-sm">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search item, barcode or reference..."
                            className="w-full pl-9 pr-4 py-2 text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500" />
                    </div>
                    <input type="date" value={from} onChange={e => { setFrom(e.target.value); setPage(1); }} className={inputCls} aria-label="From date" />
                    <input type="date" value={to} onChange={e => { setTo(e.target.value); setPage(1); }} className={inputCls} aria-label="To date" />
                    <div className="flex gap-1">
                        {['All', 'IN', 'OUT'].map(t => (
                            <button key={t} onClick={() => { setType(t); setPage(1); }}
                                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${type === t ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700'}`}>
                                {t}
                            </button>
                        ))}
                    </div>
                </div>
                {error && <div className="p-4 text-sm font-bold text-red-600">{error}</div>}
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50 dark:bg-slate-900/50">
                            <tr>{['Date', 'Item', 'SKU', 'Type', 'Qty', 'Reference', 'Party', 'Reason'].map(h => (
                                <th key={h} className="px-4 py-3 text-xs font-black uppercase tracking-wider text-slate-400">{h}</th>
                            ))}</tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                            {loading && <tr><td colSpan={8} className="px-4 py-10 text-center text-sm font-bold text-slate-400">Loading movements…</td></tr>}
                            {!loading && rows.length === 0 && <tr><td colSpan={8} className="px-4 py-10 text-center text-sm font-bold text-slate-400">No movements in this period</td></tr>}
                            {!loading && rows.map(m => (
                                <tr key={m.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                                    <td className="px-4 py-3 text-xs text-slate-500">{m.date}</td>
                                    <td className="px-4 py-3 text-sm font-bold text-slate-900 dark:text-white">{m.item}</td>
                                    <td className="px-4 py-3 text-xs text-slate-400">{m.sku}</td>
                                    <td className="px-4 py-3">
                                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-black ${m.type === 'IN' ? 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20' : 'text-red-600 bg-red-50 dark:bg-red-900/20'}`}>
                                            {m.type === 'IN' ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />} {m.type}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-sm font-black text-slate-900 dark:text-white">{m.qty}</td>
                                    <td className="px-4 py-3 text-xs font-bold text-blue-600">{m.ref}</td>
                                    <td className="px-4 py-3 text-xs text-slate-500">{m.party}</td>
                                    <td className="px-4 py-3 text-xs text-slate-500">{m.reason}</td>
                                </tr>
                            ))}
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

export default StockMovement;

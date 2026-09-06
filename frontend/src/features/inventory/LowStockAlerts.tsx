import React, { useEffect, useState } from 'react';
import { AlertTriangle, ShoppingCart, Bell, Download } from 'lucide-react';
import api from '@/services/api';

interface LowStockItem {
    _id: string;
    sku?: string;
    name: string;
    category?: string;
    stockQty: number;
    reservedStock?: number;
    lowStockLimit: number;
}

const STATUS: Record<string, string> = {
    Critical: 'text-red-600 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800',
    Warning: 'text-amber-600 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800',
};

// Backed by GET /api/inventory/low-stock -> InventoryService.getLowStockItems, the same
// "available <= lowStockLimit" definition used by the Items page filter and the aging/alerts
// logic elsewhere -- this page previously rendered a hardcoded ALERTS array with no API call at all.
const LowStockAlerts: React.FC = () => {
    const [items, setItems] = useState<LowStockItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        let cancelled = false;
        (async () => {
            try {
                const res = await api.get('/api/inventory/low-stock');
                if (!cancelled) setItems(res.data || []);
            } catch (err: any) {
                if (!cancelled) setError(err?.response?.data?.message || 'Failed to load low stock alerts');
            } finally {
                if (!cancelled) setLoading(false);
            }
        })();
        return () => { cancelled = true; };
    }, []);

    const rows = items.map(item => {
        const available = Math.max((item.stockQty || 0) - (item.reservedStock || 0), 0);
        const reorder = item.lowStockLimit || 0;
        // Below half the reorder limit (or zero stock) reads as Critical, otherwise Warning --
        // both bands are already "at/under reorder level" per the backend query, this just
        // separates them visually the same way the previous mock UI did.
        const status = available <= reorder / 2 ? 'Critical' : 'Warning';
        return { ...item, available, reorder, status };
    });

    const critical = rows.filter(r => r.status === 'Critical').length;
    const warning = rows.filter(r => r.status === 'Warning').length;

    if (loading) {
        return <div className="py-20 text-center text-slate-400 text-sm font-bold">Loading low stock alerts…</div>;
    }

    if (error) {
        return <div className="p-6 bg-rose-50 dark:bg-rose-900/10 border border-rose-200 dark:border-rose-900/20 rounded-lg text-rose-700 dark:text-danger">{error}</div>;
    }

    return (
        <div className="space-y-6 pb-12 animate-in fade-in duration-300">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-sm bg-red-600 flex items-center justify-center"><Bell className="w-5 h-5 text-white" /></div>
                    <div>
                        <h1 className="text-2xl font-black text-slate-900 dark:text-white">Low Stock Alerts</h1>
                        <p className="text-xs text-slate-500">Items below reorder level — action needed</p>
                    </div>
                </div>
                <button className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold hover:bg-slate-50 transition-all">
                    <Download className="w-4 h-4" /> Export
                </button>
            </div>

            <div className="grid grid-cols-3 gap-4">
                {[
                    { label: 'Critical Items', value: critical, sub: 'Below critical level', border: 'border-l-red-500' },
                    { label: 'Warning Items', value: warning, sub: 'Below reorder level', border: 'border-l-amber-500' },
                    { label: 'Total Alerts', value: rows.length, sub: 'Require reorder', border: 'border-l-blue-500' },
                ].map((k, i) => (
                    <div key={i} className={`bg-white dark:bg-slate-800 rounded-sm border border-slate-200 dark:border-slate-700 border-l-4 ${k.border} p-5`}>
                        <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">{k.label}</p>
                        <p className="text-2xl font-black text-slate-900 dark:text-white">{k.value}</p>
                        <p className="text-xs text-slate-500 mt-1">{k.sub}</p>
                    </div>
                ))}
            </div>

            <div className="space-y-3">
                {rows.length === 0 ? (
                    <div className="bg-white dark:bg-slate-800 rounded-sm border border-slate-200 dark:border-slate-700 p-10 text-center text-sm text-slate-400">
                        No items are currently below their reorder level.
                    </div>
                ) : rows.map(item => {
                    const pct = item.reorder > 0 ? Math.round((item.available / item.reorder) * 100) : 0;
                    return (
                        <div key={item._id} className={`bg-white dark:bg-slate-800 rounded-sm p-5 ${STATUS[item.status]}`}>
                            <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-3">
                                    <AlertTriangle className={`w-5 h-5 ${item.status === 'Critical' ? 'text-red-500' : 'text-warning'}`} />
                                    <div>
                                        <p className="font-black text-slate-900 dark:text-white">{item.name}</p>
                                        <p className="text-xs text-slate-400">{item.sku || '—'} · {item.category || 'Uncategorized'}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="text-right">
                                        <p className="text-xs text-slate-400">Stock Left</p>
                                        <p className="font-black text-lg text-slate-900 dark:text-white">{item.available} units</p>
                                    </div>
                                    <button className="flex items-center gap-2 px-3 py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl text-xs font-bold hover:scale-105 transition-all">
                                        <ShoppingCart className="w-3 h-3" /> Reorder
                                    </button>
                                </div>
                            </div>
                            <div className="space-y-1">
                                <div className="flex justify-between text-xs font-bold text-slate-500">
                                    <span>Current: {item.available} / Reorder at: {item.reorder}</span>
                                </div>
                                <div className="h-2 bg-slate-100 dark:bg-slate-900 rounded-full overflow-hidden">
                                    <div className={`h-full rounded-full transition-all ${item.status === 'Critical' ? 'bg-red-500' : 'bg-amber-500'}`} style={{ width: `${Math.min(pct, 100)}%` }} />
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default LowStockAlerts;

import React, { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { MapPin, Warehouse, Download } from 'lucide-react';
import api from '@/services/api';

interface CityStockRow {
    city: string;
    totalQty: number;
    totalValue: number;
    itemCount: number;
    storeCount: number;
}

// Stock-position report sliced by store city (Store.city -> Item.storeLevels), covering the
// Textilesoft "CityWiseStockReport" gap -- unlike BrandWiseSalesReport (which slices already-loaded
// POS sales history in redux), this needs a fresh aggregation from the backend, since per-city
// stock isn't part of any state already held on the client.
const CityWiseStockReport: React.FC = () => {
    const [rows, setRows] = useState<CityStockRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        let cancelled = false;
        (async () => {
            try {
                const res = await api.get('/api/inventory/reports/stock-by-city');
                if (!cancelled) setRows(res.data || []);
            } catch (err: any) {
                if (!cancelled) setError(err?.response?.data?.message || 'Failed to load city-wise stock report');
            } finally {
                if (!cancelled) setLoading(false);
            }
        })();
        return () => { cancelled = true; };
    }, []);

    const totalValue = rows.reduce((acc, r) => acc + r.totalValue, 0);
    const totalQty = rows.reduce((acc, r) => acc + r.totalQty, 0);

    if (loading) {
        return <div className="py-20 text-center text-slate-400 text-sm font-bold">Loading city-wise stock…</div>;
    }

    if (error) {
        return <div className="p-6 bg-rose-50 dark:bg-rose-900/10 border border-rose-200 dark:border-rose-900/20 rounded-lg text-rose-700 dark:text-danger">{error}</div>;
    }

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white dark:bg-slate-800 p-5 rounded-sm border border-slate-200 dark:border-slate-700 shadow-sm">
                    <div className="p-2 bg-indigo-50 dark:bg-primary/10 rounded-lg text-primary w-fit mb-2">
                        <MapPin className="w-5 h-5" />
                    </div>
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Cities Stocked</p>
                    <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{rows.length}</h3>
                </div>
                <div className="bg-white dark:bg-slate-800 p-5 rounded-sm border border-slate-200 dark:border-slate-700 shadow-sm">
                    <div className="p-2 bg-emerald-50 dark:bg-success/10 rounded-lg text-emerald-600 dark:text-success w-fit mb-2">
                        <Warehouse className="w-5 h-5" />
                    </div>
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Units in Stock</p>
                    <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{totalQty.toLocaleString()}</h3>
                </div>
                <div className="bg-white dark:bg-slate-800 p-5 rounded-sm border border-slate-200 dark:border-slate-700 shadow-sm">
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Stock Value</p>
                    <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">₹{totalValue.toLocaleString()}</h3>
                </div>
            </div>

            <div className="bg-white dark:bg-slate-800 p-6 rounded-sm border border-slate-200 dark:border-slate-700 shadow-sm">
                <h4 className="font-bold text-slate-900 dark:text-white mb-6">Stock Value by City</h4>
                <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={rows} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                            <XAxis dataKey="city" axisLine={false} tickLine={false} tick={{ fill: '#475569', fontSize: 10, fontWeight: 600 }} />
                            <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10 }} tickFormatter={(val) => `₹${val / 1000}k`} />
                            <Tooltip cursor={{ fill: '#f1f5f9' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                            <Bar dataKey="totalValue" fill="#6366f1" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-sm border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm">
                <div className="p-4 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/20">
                    <h4 className="font-bold text-slate-900 dark:text-white text-sm">Stock Position by City</h4>
                    <button className="flex items-center gap-2 px-3 py-1.5 text-xs font-bold text-primary bg-indigo-50 dark:bg-primary/10 rounded-lg hover:bg-indigo-100 dark:hover:bg-primary/20 transition-all">
                        <Download className="w-3.5 h-3.5" /> Export Data
                    </button>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50 dark:bg-slate-900/50 text-slate-500 uppercase text-[10px] font-bold tracking-wider">
                            <tr>
                                <th className="px-6 py-3">City</th>
                                <th className="px-6 py-3 text-center">Stores</th>
                                <th className="px-6 py-3 text-center">Items</th>
                                <th className="px-6 py-3 text-center">Units in Stock</th>
                                <th className="px-6 py-3 text-right">Stock Value</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                            {rows.length === 0 ? (
                                <tr><td colSpan={5} className="px-6 py-8 text-center text-slate-400">No store stock data found</td></tr>
                            ) : rows.map((r) => (
                                <tr key={r.city} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                                    <td className="px-6 py-4 font-bold text-slate-900 dark:text-white">{r.city}</td>
                                    <td className="px-6 py-4 text-center font-mono text-slate-600 dark:text-slate-400">{r.storeCount}</td>
                                    <td className="px-6 py-4 text-center font-mono text-slate-600 dark:text-slate-400">{r.itemCount}</td>
                                    <td className="px-6 py-4 text-center font-mono text-slate-600 dark:text-slate-400">{r.totalQty.toLocaleString()}</td>
                                    <td className="px-6 py-4 text-right font-bold text-slate-900 dark:text-white font-mono">₹{r.totalValue.toLocaleString()}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default CityWiseStockReport;

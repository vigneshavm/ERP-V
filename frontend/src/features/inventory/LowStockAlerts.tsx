import React from 'react';
import { AlertTriangle, ShoppingCart, Bell, Download } from 'lucide-react';

const ALERTS = [
    { sku: 'SKU-002', name: 'Polyester Saree 6m', category: 'Sarees', current: 60, reorder: 40, critical: 20, status: 'Warning', avgSales: 15 },
    { sku: 'SKU-005', name: 'Woolen Shawl', category: 'Woolens', current: 5, reorder: 20, critical: 10, status: 'Critical', avgSales: 8 },
    { sku: 'SKU-003', name: 'Denim Jeans 32', category: 'Bottoms', current: 47, reorder: 30, critical: 15, status: 'Warning', avgSales: 12 },
    { sku: 'SKU-007', name: 'Georgette Kurti S', category: 'Kurtis', current: 8, reorder: 25, critical: 10, status: 'Critical', avgSales: 10 },
    { sku: 'SKU-010', name: 'Linen Trouser 34', category: 'Bottoms', current: 12, reorder: 15, critical: 5, status: 'Warning', avgSales: 6 },
];

const STATUS: Record<string, string> = {
    Critical: 'text-red-600 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800',
    Warning: 'text-amber-600 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800',
};

const LowStockAlerts: React.FC = () => {
    const critical = ALERTS.filter(a => a.status === 'Critical').length;
    const warning = ALERTS.filter(a => a.status === 'Warning').length;

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
                    { label: 'Total Alerts', value: ALERTS.length, sub: 'Require reorder', border: 'border-l-blue-500' },
                ].map((k, i) => (
                    <div key={i} className={`bg-white dark:bg-slate-800 rounded-sm border border-slate-200 dark:border-slate-700 border-l-4 ${k.border} p-5`}>
                        <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">{k.label}</p>
                        <p className="text-2xl font-black text-slate-900 dark:text-white">{k.value}</p>
                        <p className="text-xs text-slate-500 mt-1">{k.sub}</p>
                    </div>
                ))}
            </div>

            <div className="space-y-3">
                {ALERTS.map(item => {
                    const pct = Math.round((item.current / item.reorder) * 100);
                    const daysLeft = Math.round(item.current / item.avgSales);
                    return (
                        <div key={item.sku} className={`bg-white dark:bg-slate-800 rounded-sm p-5 ${STATUS[item.status]}`}>
                            <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-3">
                                    <AlertTriangle className={`w-5 h-5 ${item.status === 'Critical' ? 'text-red-500' : 'text-warning'}`} />
                                    <div>
                                        <p className="font-black text-slate-900 dark:text-white">{item.name}</p>
                                        <p className="text-xs text-slate-400">{item.sku} · {item.category}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="text-right">
                                        <p className="text-xs text-slate-400">Stock Left</p>
                                        <p className="font-black text-lg text-slate-900 dark:text-white">{item.current} units</p>
                                    </div>
                                    <button className="flex items-center gap-2 px-3 py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl text-xs font-bold hover:scale-105 transition-all">
                                        <ShoppingCart className="w-3 h-3" /> Reorder
                                    </button>
                                </div>
                            </div>
                            <div className="space-y-1">
                                <div className="flex justify-between text-xs font-bold text-slate-500">
                                    <span>Current: {item.current} / Reorder at: {item.reorder}</span>
                                    <span>{daysLeft} days of stock remaining</span>
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

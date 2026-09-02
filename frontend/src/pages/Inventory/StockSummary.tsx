import React, { useState } from 'react';
import { BarChart3, Search, Download, TrendingUp } from 'lucide-react';

const STOCK = [
    { sku: 'SKU-001', name: 'Cotton Shirt XL', category: 'Shirts', unit: 'PCS', opening: 120, in: 200, out: 185, closing: 135, value: 189000, reorder: 50 },
    { sku: 'SKU-002', name: 'Polyester Saree 6m', category: 'Sarees', unit: 'PCS', opening: 80, in: 150, out: 170, closing: 60, value: 90000, reorder: 40 },
    { sku: 'SKU-003', name: 'Denim Jeans 32', category: 'Bottoms', unit: 'PCS', opening: 45, in: 100, out: 98, closing: 47, value: 94000, reorder: 30 },
    { sku: 'SKU-004', name: 'Silk Dupatta', category: 'Accessories', unit: 'PCS', opening: 200, in: 50, out: 30, closing: 220, value: 132000, reorder: 60 },
    { sku: 'SKU-005', name: 'Woolen Shawl', category: 'Woolens', unit: 'PCS', opening: 30, in: 0, out: 25, closing: 5, value: 12500, reorder: 20 },
];

const StockSummary: React.FC = () => {
    const [search, setSearch] = useState('');
    const totalValue = STOCK.reduce((s, i) => s + i.value, 0);
    const totalItems = STOCK.reduce((s, i) => s + i.closing, 0);
    const lowStock = STOCK.filter(i => i.closing < i.reorder).length;

    const filtered = STOCK.filter(i => i.name.toLowerCase().includes(search.toLowerCase()) || i.sku.toLowerCase().includes(search.toLowerCase()));

    return (
        <div className="space-y-6 pb-12 animate-in fade-in duration-300">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-sm bg-blue-600 flex items-center justify-center"><BarChart3 className="w-5 h-5 text-white" /></div>
                    <div>
                        <h1 className="text-2xl font-black text-slate-900 dark:text-white">Stock Summary</h1>
                        <p className="text-xs text-slate-500">Current inventory position across all items</p>
                    </div>
                </div>
                <button className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold hover:bg-slate-50 transition-all">
                    <Download className="w-4 h-4" /> Export
                </button>
            </div>

            <div className="grid grid-cols-3 gap-4">
                {[
                    { label: 'Total Stock Value', value: `₹${(totalValue / 100000).toFixed(2)}L`, border: 'border-l-blue-500' },
                    { label: 'Total Closing Units', value: totalItems.toLocaleString(), border: 'border-l-emerald-500' },
                    { label: 'Low Stock Items', value: `${lowStock} items`, border: 'border-l-red-500' },
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
                        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search item or SKU..."
                            className="w-full pl-9 pr-4 py-2 text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50 dark:bg-slate-900/50">
                            <tr>{['SKU', 'Item', 'Category', 'Unit', 'Opening', 'Stock In', 'Stock Out', 'Closing', 'Value', 'Status'].map(h => (
                                <th key={h} className="px-4 py-3 text-xs font-black uppercase tracking-wider text-slate-400">{h}</th>
                            ))}</tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                            {filtered.map(item => {
                                const isLow = item.closing < item.reorder;
                                return (
                                    <tr key={item.sku} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                                        <td className="px-4 py-3 text-xs font-black text-blue-600">{item.sku}</td>
                                        <td className="px-4 py-3">
                                            <p className="text-sm font-bold text-slate-900 dark:text-white">{item.name}</p>
                                        </td>
                                        <td className="px-4 py-3 text-xs text-slate-500">{item.category}</td>
                                        <td className="px-4 py-3 text-xs text-slate-500">{item.unit}</td>
                                        <td className="px-4 py-3 text-xs text-slate-500">{item.opening}</td>
                                        <td className="px-4 py-3 text-xs text-emerald-600 font-bold flex items-center gap-1"><TrendingUp className="w-3 h-3" />{item.in}</td>
                                        <td className="px-4 py-3 text-xs text-red-500 font-bold">{item.out}</td>
                                        <td className="px-4 py-3 text-sm font-black text-slate-900 dark:text-white">{item.closing}</td>
                                        <td className="px-4 py-3 text-sm font-bold text-slate-700 dark:text-slate-300">₹{item.value.toLocaleString()}</td>
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
            </div>
        </div>
    );
};

export default StockSummary;

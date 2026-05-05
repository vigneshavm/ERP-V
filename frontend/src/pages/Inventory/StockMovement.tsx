import React, { useState } from 'react';
import { ArrowUpDown, Search, TrendingUp, TrendingDown, Download } from 'lucide-react';

const MOVEMENTS = [
    { id: 'SM-001', date: '2026-04-26', item: 'Cotton Shirt XL', sku: 'SKU-001', type: 'IN', qty: 50, ref: 'GRN-2024', party: 'ABC Textiles', balance: 135 },
    { id: 'SM-002', date: '2026-04-26', item: 'Polyester Saree 6m', sku: 'SKU-002', type: 'OUT', qty: 12, ref: 'INV-4521', party: 'Rajesh Textiles', balance: 60 },
    { id: 'SM-003', date: '2026-04-25', item: 'Denim Jeans 32', sku: 'SKU-003', type: 'OUT', qty: 8, ref: 'INV-4520', party: 'Priya Fashions', balance: 47 },
    { id: 'SM-004', date: '2026-04-25', item: 'Silk Dupatta', sku: 'SKU-004', type: 'IN', qty: 30, ref: 'GRN-2023', party: 'Sri Silks', balance: 220 },
    { id: 'SM-005', date: '2026-04-24', item: 'Woolen Shawl', sku: 'SKU-005', type: 'OUT', qty: 5, ref: 'INV-4519', party: 'Kavitha Silks', balance: 5 },
    { id: 'SM-006', date: '2026-04-24', item: 'Cotton Shirt XL', sku: 'SKU-001', type: 'OUT', qty: 20, ref: 'INV-4518', party: 'Anbu Traders', balance: 85 },
];

const StockMovement: React.FC = () => {
    const [search, setSearch] = useState('');
    const [type, setType] = useState('All');

    const totalIn = MOVEMENTS.filter(m => m.type === 'IN').reduce((s, m) => s + m.qty, 0);
    const totalOut = MOVEMENTS.filter(m => m.type === 'OUT').reduce((s, m) => s + m.qty, 0);

    const filtered = MOVEMENTS.filter(m =>
        (m.item.toLowerCase().includes(search.toLowerCase()) || m.ref.toLowerCase().includes(search.toLowerCase())) &&
        (type === 'All' || m.type === type)
    );

    return (
        <div className="space-y-6 pb-12 animate-in fade-in duration-300">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-indigo-600 flex items-center justify-center"><ArrowUpDown className="w-5 h-5 text-white" /></div>
                    <div>
                        <h1 className="text-2xl font-black text-slate-900 dark:text-white">Stock Movement</h1>
                        <p className="text-xs text-slate-500">All stock in/out transaction log</p>
                    </div>
                </div>
                <button className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold hover:bg-slate-50 transition-all">
                    <Download className="w-4 h-4" /> Export
                </button>
            </div>

            <div className="grid grid-cols-3 gap-4">
                {[
                    { label: 'Total Transactions', value: MOVEMENTS.length, border: 'border-l-indigo-500' },
                    { label: 'Stock In (Units)', value: totalIn, border: 'border-l-emerald-500' },
                    { label: 'Stock Out (Units)', value: totalOut, border: 'border-l-red-500' },
                ].map((k, i) => (
                    <div key={i} className={`bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 border-l-4 ${k.border} p-5`}>
                        <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">{k.label}</p>
                        <p className="text-2xl font-black text-slate-900 dark:text-white">{k.value}</p>
                    </div>
                ))}
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
                <div className="p-4 border-b border-slate-100 dark:border-slate-700 flex gap-3 items-center">
                    <div className="relative flex-1 max-w-sm">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search item or reference..."
                            className="w-full pl-9 pr-4 py-2 text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500" />
                    </div>
                    <div className="flex gap-1">
                        {['All', 'IN', 'OUT'].map(t => (
                            <button key={t} onClick={() => setType(t)}
                                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${type === t ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700'}`}>
                                {t}
                            </button>
                        ))}
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50 dark:bg-slate-900/50">
                            <tr>{['ID', 'Date', 'Item', 'SKU', 'Type', 'Qty', 'Reference', 'Party', 'Balance'].map(h => (
                                <th key={h} className="px-4 py-3 text-xs font-black uppercase tracking-wider text-slate-400">{h}</th>
                            ))}</tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                            {filtered.map(m => (
                                <tr key={m.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                                    <td className="px-4 py-3 text-xs font-black text-indigo-600">{m.id}</td>
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
                                    <td className="px-4 py-3 text-sm font-bold text-slate-700 dark:text-slate-300">{m.balance}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default StockMovement;

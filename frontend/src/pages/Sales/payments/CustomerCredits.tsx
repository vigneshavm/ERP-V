import React, { useState } from 'react';
import { CreditCard, Search, Plus, Download, CheckCircle, Clock, XCircle, ChevronRight } from 'lucide-react';

const CREDITS = [
    { id: 'CN-001', customer: 'Rajesh Textiles', phone: '9876543210', amount: 45000, used: 15000, date: '2026-01-15', expiry: '2026-04-15', status: 'Active' },
    { id: 'CN-002', customer: 'Priya Fashions', phone: '9845001122', amount: 12500, used: 12500, date: '2026-01-10', expiry: '2026-04-10', status: 'Exhausted' },
    { id: 'CN-003', customer: 'Sri Murugan Stores', phone: '9700111222', amount: 8000, used: 0, date: '2026-02-01', expiry: '2026-05-01', status: 'Active' },
    { id: 'CN-004', customer: 'Kavitha Silks', phone: '9865432100', amount: 30000, used: 10000, date: '2025-12-20', expiry: '2026-03-20', status: 'Expired' },
    { id: 'CN-005', customer: 'Anbu Traders', phone: '9944332211', amount: 5000, used: 2500, date: '2026-02-10', expiry: '2026-05-10', status: 'Active' },
];

const STATUS: Record<string, { color: string; icon: React.ReactNode }> = {
    Active: { color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20', icon: <CheckCircle className="w-3 h-3" /> },
    Exhausted: { color: 'text-slate-500 bg-slate-100 dark:bg-slate-800', icon: <XCircle className="w-3 h-3" /> },
    Expired: { color: 'text-red-500 bg-red-50 dark:bg-red-900/20', icon: <Clock className="w-3 h-3" /> },
};

const CustomerCredits: React.FC = () => {
    const [search, setSearch] = useState('');
    const [filter, setFilter] = useState('All');

    const totalActive = CREDITS.filter(c => c.status === 'Active').reduce((s, c) => s + (c.amount - c.used), 0);
    const totalIssued = CREDITS.reduce((s, c) => s + c.amount, 0);
    const totalUsed = CREDITS.reduce((s, c) => s + c.used, 0);

    const filtered = CREDITS.filter(c =>
        (c.customer.toLowerCase().includes(search.toLowerCase()) || c.id.toLowerCase().includes(search.toLowerCase())) &&
        (filter === 'All' || c.status === filter)
    );

    return (
        <div className="space-y-6 pb-12 animate-in fade-in duration-300">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-sm bg-violet-600 flex items-center justify-center">
                        <CreditCard className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">Customer Credits</h1>
                        <p className="text-xs text-slate-500">Credit notes issued to customers</p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <button className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold hover:bg-slate-50 transition-all">
                        <Download className="w-4 h-4" /> Export
                    </button>
                    <button className="flex items-center gap-2 px-4 py-2 bg-violet-600 text-white rounded-xl text-xs font-bold hover:bg-violet-700 transition-all shadow-lg shadow-violet-600/20">
                        <Plus className="w-4 h-4" /> Issue Credit
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
                {[
                    { label: 'Available Credits', value: `₹${totalActive.toLocaleString()}`, sub: 'Across active notes', border: 'border-l-emerald-500' },
                    { label: 'Total Issued', value: `₹${totalIssued.toLocaleString()}`, sub: `${CREDITS.length} credit notes`, border: 'border-l-violet-500' },
                    { label: 'Total Utilized', value: `₹${totalUsed.toLocaleString()}`, sub: `${Math.round((totalUsed / totalIssued) * 100)}% utilization`, border: 'border-l-amber-500' },
                ].map((kpi, i) => (
                    <div key={i} className={`bg-white dark:bg-slate-800 rounded-sm border border-slate-200 dark:border-slate-700 border-l-4 ${kpi.border} p-5`}>
                        <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">{kpi.label}</p>
                        <p className="text-2xl font-black text-slate-900 dark:text-white">{kpi.value}</p>
                        <p className="text-xs text-slate-500 mt-1">{kpi.sub}</p>
                    </div>
                ))}
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
                <div className="p-4 border-b border-slate-100 dark:border-slate-700 flex flex-wrap gap-3 items-center">
                    <div className="relative flex-1 min-w-48">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search customer or CN ID..."
                            className="w-full pl-9 pr-4 py-2 text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-violet-500" />
                    </div>
                    <div className="flex gap-1">
                        {['All', 'Active', 'Exhausted', 'Expired'].map(f => (
                            <button key={f} onClick={() => setFilter(f)}
                                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${filter === f ? 'bg-violet-600 text-white' : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700'}`}>
                                {f}
                            </button>
                        ))}
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50 dark:bg-slate-900/50">
                            <tr>{['Credit Note', 'Customer', 'Issued', 'Expiry', 'Amount', 'Used', 'Remaining', 'Status', ''].map(h => (
                                <th key={h} className="px-4 py-3 text-xs font-black uppercase tracking-wider text-slate-400">{h}</th>
                            ))}</tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                            {filtered.map(c => {
                                const remaining = c.amount - c.used;
                                const s = STATUS[c.status];
                                return (
                                    <tr key={c.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                                        <td className="px-4 py-3 font-black text-xs text-violet-600">{c.id}</td>
                                        <td className="px-4 py-3">
                                            <p className="text-sm font-bold text-slate-900 dark:text-white">{c.customer}</p>
                                            <p className="text-xs text-slate-400">{c.phone}</p>
                                        </td>
                                        <td className="px-4 py-3 text-xs text-slate-500">{c.date}</td>
                                        <td className="px-4 py-3 text-xs text-slate-500">{c.expiry}</td>
                                        <td className="px-4 py-3 text-sm font-bold text-slate-900 dark:text-white">₹{c.amount.toLocaleString()}</td>
                                        <td className="px-4 py-3 text-sm font-bold text-slate-500">₹{c.used.toLocaleString()}</td>
                                        <td className="px-4 py-3 text-sm font-black text-emerald-600">₹{remaining.toLocaleString()}</td>
                                        <td className="px-4 py-3">
                                            <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-bold ${s.color}`}>
                                                {s.icon} {c.status}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3">
                                            <button className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors">
                                                <ChevronRight className="w-4 h-4 text-slate-400" />
                                            </button>
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

export default CustomerCredits;

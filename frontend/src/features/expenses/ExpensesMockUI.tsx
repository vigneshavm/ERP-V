import React, { useState, useMemo } from 'react';
import { 
    Receipt, Plus, Search, Filter, TrendingUp, Wallet, 
    Download, ChevronRight, Zap, IndianRupee, PieChart,
    ShieldCheck, BarChart3
} from 'lucide-react';
import { } from 'react-router-dom';
import { purchases } from '../../data/index';
import Layout from '../../components/shared/Layout/index';

const ExpensesMockUI: React.FC = () => {
    const [searchQuery, setSearchQuery] = useState('');

    const metrics = useMemo(() => {
        const totalExpenses = purchases.reduce((sum, p) => sum + p.total, 0);
        const pendingCount = purchases.filter(p => p.status === 'PENDING').length;
        
        return [
            { label: 'Operating Capital', val: `₹${(totalExpenses/100000).toFixed(1)}L`, sub: 'LIFETIME VOLUME', icon: Wallet, color: 'text-violet-500', bg: 'bg-violet-500/10' },
            { label: 'Critical Outflow', val: `₹${(totalExpenses/10000).toFixed(1)}K`, sub: 'MTD SPEND', icon: TrendingUp, color: 'text-fuchsia-500', bg: 'bg-fuchsia-500/10' },
            { label: 'Pending Audit', val: pendingCount, sub: 'NODES REQUIRING ACTION', icon: ShieldCheck, color: 'text-amber-500', bg: 'bg-amber-500/10' },
            { label: 'Expense Index', val: purchases.length, sub: 'VOUCHER COUNT', icon: BarChart3, color: 'text-sky-500', bg: 'bg-sky-500/10' }
        ];
    }, []);

    const categories = [
        { cat: 'Procurement', pct: 64, color: 'bg-violet-500', text: 'text-violet-500' },
        { cat: 'Logistics', pct: 18, color: 'bg-fuchsia-500', text: 'text-fuchsia-500' },
        { cat: 'Operational', pct: 12, color: 'bg-sky-500', text: 'text-sky-500' },
        { cat: 'Miscellaneous', pct: 6, color: 'bg-amber-500', text: 'text-amber-500' }
    ];

    return (
        <Layout>
            <div className="p-8 space-y-8 h-full flex flex-col text-main animate-fade-in relative z-10">
                {/* Header */}
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-display font-black tracking-tighter text-neutral-900 dark:text-white flex items-center gap-3">
                            Expense <span className="text-violet-500">Intelligence</span>
                        </h1>
                        <p className="text-[10px] uppercase tracking-[0.2em] font-black text-neutral-500 dark:text-neutral-400 mt-1">
                            Fiscal Monitoring Node // V4.0
                        </p>
                    </div>
                    <div className="flex gap-4">
                        <button className="h-12 px-6 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-neutral-900 dark:text-white font-bold text-xs tracking-widest rounded-sm hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-all shadow-sm flex items-center gap-3 uppercase">
                            <Download className="w-4 h-4 text-violet-500" /> Export Data
                        </button>
                        <button className="h-12 px-8 bg-violet-600 text-white font-black uppercase tracking-widest text-xs rounded-sm transition-all shadow-lg shadow-violet-500/20 flex items-center gap-3 hover:opacity-90">
                            <Plus className="w-4 h-4" /> Log Expenditure
                        </button>
                    </div>
                </div>

                {/* KPI Matrix */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    {metrics.map((card, i) => (
                        <div key={i} className="bg-white dark:bg-neutral-900 p-6 rounded-sm border border-neutral-200 dark:border-neutral-800 flex flex-col gap-4 group hover:border-violet-500/50 transition-all cursor-pointer shadow-sm relative overflow-hidden">
                            <div className="flex justify-between items-start relative z-10">
                                <div className={`p-3 rounded-sm ${card.bg} ${card.color} border border-current/10`}>
                                    <card.icon className="w-5 h-5" />
                                </div>
                                <span className={`text-[9px] font-black ${card.color} uppercase tracking-[0.2em]`}>Live Node</span>
                            </div>
                            <div className="relative z-10">
                                <p className="text-[9px] font-black text-neutral-500 uppercase tracking-widest mb-1">{card.label}</p>
                                <p className="text-2xl font-display font-black tracking-tighter text-neutral-900 dark:text-white tabular-nums">{card.val}</p>
                                <p className={`text-[9px] font-black text-neutral-400 uppercase tracking-widest mt-2`}>{card.sub}</p>
                            </div>
                            <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-violet-500/5 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700" />
                        </div>
                    ))}
                </div>

                {/* Categorical Decomposition */}
                <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-sm p-6 shadow-sm">
                    <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-neutral-900 dark:text-white flex items-center gap-2 mb-6">
                        <PieChart className="w-4 h-4 text-violet-500" /> Sectoral Breakdown
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                        {categories.map((c, i) => (
                            <div key={i} className="space-y-3">
                                <div className="flex justify-between items-end">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-neutral-500">{c.cat}</p>
                                    <p className={`text-xs font-black ${c.text}`}>{c.pct}%</p>
                                </div>
                                <div className="h-1.5 w-full bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden">
                                    <div className={`h-full ${c.color} rounded-full transition-all duration-1000`} style={{ width: `${c.pct}%` }} />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Registry Table */}
                <div className="flex-1 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-sm flex flex-col overflow-hidden shadow-sm">
                    <div className="p-4 border-b border-neutral-100 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-950/50 flex flex-col lg:flex-row justify-between items-center gap-4">
                        <div className="flex items-center gap-4">
                            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-neutral-900 dark:text-white flex items-center gap-2">
                                <Receipt className="w-4 h-4 text-violet-500" /> Expense Registry
                            </h3>
                            <div className="h-4 w-[1px] bg-neutral-200 dark:bg-neutral-800 hidden lg:block" />
                            <div className="relative w-64">
                                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                                <input 
                                    type="text" 
                                    placeholder="FILTER BY ID / VENDOR..." 
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-sm py-2 pl-10 pr-4 text-[9px] font-black tracking-widest uppercase focus:border-violet-500 outline-none" 
                                />
                            </div>
                        </div>
                        <div className="flex gap-4">
                            <button className="h-10 px-4 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-sm text-[9px] font-black uppercase tracking-widest text-neutral-500 hover:text-violet-500 transition-all flex items-center gap-2">
                                <Filter className="w-4 h-4" /> System Filters
                            </button>
                        </div>
                    </div>

                    <div className="flex-1 overflow-auto custom-scrollbar">
                        <table className="w-full text-left border-collapse">
                            <thead className="bg-neutral-50 dark:bg-neutral-950 sticky top-0 z-20 backdrop-blur-md border-b border-neutral-200 dark:border-neutral-800">
                                <tr className="text-neutral-500 dark:text-neutral-400 text-[10px] font-black uppercase tracking-[0.2em]">
                                    <th className="px-8 py-5">Voucher Reference</th>
                                    <th className="px-8 py-5">Classification</th>
                                    <th className="px-8 py-5">Temporal node</th>
                                    <th className="px-8 py-5 text-right">Quantum (INR)</th>
                                    <th className="px-8 py-5 text-center">Protocol state</th>
                                    <th className="px-8 py-5 w-10"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                                {purchases.map((rec, idx) => (
                                    <tr key={idx} className="hover:bg-violet-500/[0.02] transition-all group">
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-sm bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-violet-500 group-hover:bg-violet-500 group-hover:text-white transition-all">
                                                    <Zap className="w-5 h-5" />
                                                </div>
                                                <span className="font-mono text-sm font-black text-neutral-900 dark:text-white uppercase">EXP-{rec.id.split('-').pop()}</span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <span className="px-3 py-1 bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-sm text-[9px] font-black uppercase tracking-widest text-neutral-500">
                                                Procurement
                                            </span>
                                        </td>
                                        <td className="px-8 py-6">
                                            <span className="text-xs font-bold text-neutral-400 uppercase tracking-widest">{rec.date}</span>
                                        </td>
                                        <td className="px-8 py-6 text-right">
                                            <div className="flex items-center justify-end gap-1 font-mono text-sm font-black text-neutral-900 dark:text-white tabular-nums tracking-tighter">
                                                <IndianRupee className="w-3.5 h-3.5" />
                                                {rec.total.toLocaleString()}
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="flex justify-center">
                                                <span className={`px-4 py-1.5 rounded-sm text-[9px] font-black uppercase tracking-widest border ${rec.status === 'RECEIVED' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-amber-500/10 text-amber-500 border-amber-500/20'}`}>
                                                    {rec.status}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <button className="p-2 text-neutral-300 hover:text-violet-500 transition-all">
                                                <ChevronRight className="w-5 h-5" />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </Layout>
    );
};

export default ExpensesMockUI;

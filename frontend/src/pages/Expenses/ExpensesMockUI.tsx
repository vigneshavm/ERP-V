import React, { useState, useMemo } from 'react';
import { Receipt, Plus, Search, Filter, TrendingUp, AlertTriangle, CheckCircle2, Wallet, Coffee, Car, Wrench, MoreHorizontal, Download, X } from 'lucide-react';
import expensesData from '../../mockData/expensesData.json';

type ExpenseStatus = 'Approved' | 'Pending' | 'Rejected';

interface Expense {
    id: string;
    desc: string;
    cat: string;
    date: string;
    amount: string;
    amountNum: number;
    status: ExpenseStatus;
}

const IconMap: Record<string, React.ElementType> = {
    TrendingUp, Receipt, AlertTriangle, CheckCircle2, Wrench, Car, Coffee, Wallet
};

const MOCK_EXPENSES: Expense[] = expensesData.MOCK_EXPENSES as Expense[];

const STATUS_COLORS: Record<ExpenseStatus, string> = {
    Approved: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    Pending:  'bg-amber-500/10  text-amber-400  border-amber-500/20',
    Rejected: 'bg-rose-500/10   text-rose-400   border-rose-500/20',
};

const ExpensesMockUI: React.FC = () => {
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<'All' | ExpenseStatus>('All');

    const filtered = useMemo(() => {
        const q = searchQuery.toLowerCase().trim();
        return MOCK_EXPENSES.filter(exp => {
            const matchesStatus = statusFilter === 'All' || exp.status === statusFilter;
            const matchesSearch = !q ||
                exp.id.toLowerCase().includes(q) ||
                exp.desc.toLowerCase().includes(q) ||
                exp.cat.toLowerCase().includes(q) ||
                exp.date.toLowerCase().includes(q) ||
                exp.status.toLowerCase().includes(q);
            return matchesStatus && matchesSearch;
        });
    }, [searchQuery, statusFilter]);

    return (
        <div className="min-h-screen bg-app text-main font-sans selection:bg-violet-500/30 overflow-hidden flex flex-col">
            <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
                <div className="absolute top-[-10%] left-[20%] w-[55%] h-[55%] bg-violet-700/10 rounded-full blur-[160px]" />
                <div className="absolute bottom-[-10%] right-[5%] w-[35%] h-[35%] bg-fuchsia-700/10 rounded-full blur-[130px]" />
            </div>
            <main className="relative z-10 flex-1 flex flex-col max-w-[1600px] w-full mx-auto px-8 py-8">
                <header className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-3xl font-black tracking-tight text-main flex items-center gap-3">
                            Expense Intelligence
                            <span className="px-3 py-1 bg-violet-500/10 border border-violet-500/20 text-violet-400 rounded-lg text-xs font-bold uppercase tracking-widest flex items-center gap-1">
                                <Wallet className="w-3 h-3" /> FY 2026-27
                            </span>
                        </h1>
                        <p className="text-sm text-secondary mt-1 font-medium">Track, categorize, and audit all business expenditures in real-time.</p>
                    </div>
                    <div className="flex gap-4">
                        <button className="h-11 px-6 bg-card hover:bg-card text-main font-bold text-sm tracking-wide rounded-xl transition-all border border-default flex items-center gap-2">
                            <Download className="w-4 h-4" /> Export Report
                        </button>
                        <button className="h-11 px-6 bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-main font-black uppercase tracking-widest text-xs rounded-xl transition-all shadow-[0_0_20px_rgba(124,58,237,0.3)] flex items-center gap-2">
                            <Plus className="w-4 h-4" /> Log Expense
                        </button>
                    </div>
                </header>

                <div className="grid grid-cols-4 gap-6 mb-8">
                    {expensesData.kpis.map((card, i) => {
                        const Icon = IconMap[card.iconName];
                        return (
                            <div key={i} className={`glass-panel backdrop-blur-md rounded-2xl p-6 border ${card.border} group hover:bg-card/80 transition-all cursor-pointer`}>
                                <div className={`p-3 rounded-xl ${card.bg} ${card.color} w-fit mb-4`}>
                                    {Icon && <Icon className="w-5 h-5" />}
                                </div>
                                <p className="text-[10px] font-black text-secondary uppercase tracking-widest">{card.label}</p>
                                <p className="text-2xl font-black tracking-tighter mt-1 text-main">{card.val}</p>
                                <p className={`text-[10px] mt-1 font-bold ${card.color}`}>{card.sub}</p>
                            </div>
                        );
                    })}
                </div>

                <div className="flex flex-col gap-4 flex-1">
                    {/* By Category — horizontal strip */}
                    <div className="glass-panel backdrop-blur-xl border border-default rounded-2xl p-5">
                        <h3 className="text-[10px] font-black uppercase tracking-widest text-secondary mb-4">By Category</h3>
                        <div className="grid grid-cols-5 gap-4">
                            {expensesData.categories.map((c, i) => {
                                const Icon = IconMap[c.iconName];
                                return (
                                    <div key={i} className="flex flex-col gap-2">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-1.5">
                                                {Icon && <Icon className={`w-3.5 h-3.5 ${c.text}`} />}
                                                <span className="text-xs font-bold text-main truncate">{c.cat}</span>
                                            </div>
                                            <span className={`text-xs font-black ${c.text}`}>{c.pct}%</span>
                                        </div>
                                        <div className="h-1.5 bg-card rounded-full overflow-hidden">
                                            <div className={`h-full ${c.color} rounded-full transition-all`} style={{ width: `${c.pct}%` }} />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Full-width table */}
                    <div className="flex-1 glass-panel backdrop-blur-xl border border-default rounded-3xl flex flex-col overflow-hidden">
                        {/* Toolbar */}
                        <div className="p-5 border-b border-default flex justify-between items-center bg-card gap-4">
                            <div className="flex gap-3 items-center flex-1">
                                {/* Search */}
                                <div className="relative flex-1 max-w-sm">
                                    <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-secondary" />
                                    <input
                                        type="text"
                                        placeholder="Search expense, category, vendor..."
                                        value={searchQuery}
                                        onChange={e => setSearchQuery(e.target.value)}
                                        className="w-full bg-input border border-default rounded-xl py-2.5 pl-11 pr-9 text-sm focus:outline-none focus:border-violet-500 transition-colors text-main placeholder:text-slate-500"
                                    />
                                    {searchQuery && (
                                        <button
                                            onClick={() => setSearchQuery('')}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-secondary hover:text-main transition-colors"
                                        >
                                            <X className="w-3.5 h-3.5" />
                                        </button>
                                    )}
                                </div>
                                <button className="h-10 px-4 bg-card hover:bg-card/80 border border-default rounded-xl text-xs font-bold text-main flex items-center gap-2 transition-all">
                                    <Filter className="w-4 h-4" /> Filter
                                </button>
                                {/* Record count badge */}
                                <span className="text-[10px] font-black text-secondary">
                                    {filtered.length} of {MOCK_EXPENSES.length} records
                                </span>
                            </div>

                            {/* Status filter tabs */}
                            <div className="flex gap-1.5">
                                {(['All', 'Pending', 'Approved', 'Rejected'] as const).map(tab => (
                                    <button
                                        key={tab}
                                        onClick={() => setStatusFilter(tab)}
                                        className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                                            statusFilter === tab
                                                ? tab === 'Pending'  ? 'bg-amber-500/20  text-amber-400  border border-amber-500/30'
                                                : tab === 'Approved' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                                : tab === 'Rejected' ? 'bg-rose-500/20    text-rose-400   border border-rose-500/30'
                                                : 'bg-violet-500/20 text-violet-400 border border-violet-500/30'
                                                : 'text-secondary hover:text-main border border-transparent hover:border-default'
                                        }`}
                                    >
                                        {tab}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Table */}
                        <div className="flex-1 overflow-auto">
                            <table className="w-full text-left border-collapse">
                                <thead className="bg-app sticky top-0 z-20 backdrop-blur-md">
                                    <tr>
                                        {['Expense ID', 'Description', 'Category', 'Date', 'Amount', 'Status', 'Actions'].map(h => (
                                            <th key={h} className={`px-8 py-4 text-[10px] font-black uppercase tracking-widest text-secondary border-b border-default ${h === 'Amount' || h === 'Actions' ? 'text-right' : h === 'Status' ? 'text-center' : ''}`}>{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-default">
                                    {filtered.length > 0 ? filtered.map((exp) => (
                                        <tr key={exp.id} className="hover:bg-card/30 transition-colors group">
                                            <td className="px-8 py-5"><span className="font-mono text-sm font-bold text-violet-400 group-hover:underline cursor-pointer">{exp.id}</span></td>
                                            <td className="px-8 py-5"><div className="text-sm font-bold text-main">{exp.desc}</div></td>
                                            <td className="px-8 py-5"><span className="px-2.5 py-1 bg-card border border-default rounded-lg text-[10px] font-black uppercase tracking-widest text-muted">{exp.cat}</span></td>
                                            <td className="px-8 py-5"><div className="text-sm font-bold text-main">{exp.date}</div></td>
                                            <td className="px-8 py-5 text-right"><span className="font-mono text-base font-black tracking-tighter text-main">₹{exp.amount}</span></td>
                                            <td className="px-8 py-5">
                                                <div className="flex justify-center">
                                                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${STATUS_COLORS[exp.status]}`}>
                                                        {exp.status}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-8 py-5">
                                                <div className="flex justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button className="p-2 text-muted hover:text-violet-400 bg-card hover:bg-card rounded-lg transition-colors">
                                                        <MoreHorizontal className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    )) : (
                                        <tr>
                                            <td colSpan={7} className="px-8 py-16 text-center">
                                                <div className="flex flex-col items-center gap-3">
                                                    <Search className="w-8 h-8 text-secondary opacity-40" />
                                                    <p className="text-sm font-bold text-secondary">No expenses match your search</p>
                                                    <p className="text-xs text-muted">
                                                        {searchQuery && <span>"{searchQuery}"</span>}
                                                        {searchQuery && statusFilter !== 'All' && <span> · </span>}
                                                        {statusFilter !== 'All' && <span>Status: {statusFilter}</span>}
                                                    </p>
                                                    <button
                                                        onClick={() => { setSearchQuery(''); setStatusFilter('All'); }}
                                                        className="mt-1 text-xs text-violet-400 hover:text-violet-300 font-bold underline underline-offset-2"
                                                    >
                                                        Clear filters
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default ExpensesMockUI;

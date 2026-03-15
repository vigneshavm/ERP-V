import React, { useState, useEffect, useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from "@/app/store/store";
import {
    addDailyRecord,
    updateDailyRecord,
    deleteDailyRecord,
    setDailyRecordSynced
} from "@/entities/finance/model/financeSlice";
import { SyncManager } from "@/widgets/sync-manager/lib/SyncManager";
import Layout from "@/shared/ui/Layout";
import {
    IndianRupee, Plus, CheckCircle2, History,
    AlertCircle, Search,
    Edit2, Trash2, X, Zap,
    TrendingUp, TrendingDown, Calendar, Download,
    Filter, Layers, RotateCcw
} from 'lucide-react';
import { formatCurrency } from "@/shared/lib/utils/helpers";
import { useBranchResolver } from "@/hooks/useBranchResolver";
import {
    AreaChart, Area, CartesianGrid, Legend,
    ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";

type PeriodType = 'DAILY' | 'MONTHLY' | 'YEARLY' | 'CUSTOM';

const DailyFinancePage: React.FC = () => {
    const dispatch = useDispatch<AppDispatch>();
    const {  theme, user  } = useAuthStore();
    const { getBranchName } = useBranchResolver();
    const { dailyFinanceRecords } = useSelector((state: RootState) => state.finance);

    const tx = useMemo(() => dailyFinanceRecords || [], [dailyFinanceRecords]);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [selectedRowId, setSelectedRowId] = useState<string | null>(null);

    useEffect(() => {
        SyncManager.syncDailyFinanceEntries();
    }, []);

    // Analytics Filters
    const [period, setPeriod] = useState<PeriodType>('MONTHLY');
    const [customStart, setCustomStart] = useState(() => {
        const d = new Date(); d.setDate(d.getDate() - 30); return d.toISOString().split('T')[0];
    });
    const [customEnd, setCustomEnd] = useState(() => new Date().toISOString().split('T')[0]);

    // Form State
    const [date, setDate] = useState(() => new Date().toISOString().split("T")[0]);
    const [cash, setCash] = useState("");
    const [online, setOnline] = useState("");
    const [exp, setExp] = useState("");
    const [drawerCash, setDrawerCash] = useState("");
    const [notes, setNotes] = useState("");
    const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    // List Filters
    const [recentSearch, setRecentSearch] = useState('');
    const [recentFrom, setRecentFrom] = useState('');
    const [recentTo, setRecentTo] = useState('');
    const [netMin, setNetMin] = useState('');
    const [netMax, setNetMax] = useState('');
    const [recentSortBy, setRecentSortBy] = useState<'date' | 'net' | 'notes'>('date');
    const [recentSortDir, setRecentSortDir] = useState<'desc' | 'asc'>('desc');

    const currentTotalSales = (parseFloat(cash) || 0) + (parseFloat(online) || 0);

    const uid = () => crypto.randomUUID();

    const saveTransaction = (e: React.FormEvent) => {
        e.preventDefault();
        const payload = {
            id: editingId || uid(),
            date,
            cashSales: parseFloat(cash) || 0,
            onlineSales: parseFloat(online) || 0,
            totalSales: currentTotalSales,
            expenses: parseFloat(exp) || 0,
            cashInDrawer: parseFloat(drawerCash) || 0,
            notes: notes || '',
            timestamp: new Date().toISOString(),
            tenantId: typeof user?.tenantId === 'object' && user?.tenantId !== null ? (user.tenantId as any)._id : user?.tenantId
        };

        if (editingId) {
            dispatch(updateDailyRecord(payload));
            setEditingId(null);
        } else {
            dispatch(addDailyRecord(payload));
        }

        setCash(""); setOnline(""); setExp(""); setDrawerCash(""); setNotes("");
        setStatusMsg({ type: 'success', text: editingId ? 'Record updated successfully.' : 'Daily record saved.' });
        setTimeout(() => setStatusMsg(null), 3000);
    };

    const handleEdit = (record: any) => {
        setEditingId(record.id);
        setDate(record.date);
        setCash(record.cashSales.toString());
        setOnline(record.onlineSales.toString());
        setExp(record.expenses.toString());
        setDrawerCash(record.cashInDrawer.toString());
        setNotes(record.notes);
    };

    const cancelEdit = () => {
        setEditingId(null);
        setCash(""); setOnline(""); setExp(""); setDrawerCash(""); setNotes("");
    };

    const handleDelete = (id: string) => {
        if (window.confirm("Delete this financial record?")) {
            dispatch(deleteDailyRecord(id));
            setStatusMsg({ type: 'success', text: 'Record deleted.' });
            setTimeout(() => setStatusMsg(null), 3000);
        }
    };

    // --- Computed Data ---
    const filteredTransactions = useMemo(() => {
        let data = [...tx].sort((a: any, b: any) => a.date.localeCompare(b.date));
        if (period === 'CUSTOM') {
            data = data.filter((t: any) => t.date >= customStart && t.date <= customEnd);
        }
        return data;
    }, [tx, period, customStart, customEnd]);

    const summaryStats = useMemo(() => {
        return filteredTransactions.reduce((acc: any, t: any) => {
            const income = t.totalSales || (t.cashSales + t.onlineSales);
            acc.sales += income;
            acc.expenses += t.expenses;
            acc.profit += (income - t.expenses);
            return acc;
        }, { sales: 0, expenses: 0, profit: 0 });
    }, [filteredTransactions]);

    const chartData = useMemo(() => {
        const map: Record<string, { label: string; income: number; expense: number; profit: number }> = {};
        filteredTransactions.forEach((t: any) => {
            let key = t.date;
            let label = new Date(t.date).toLocaleDateString('default', { day: 'numeric', month: 'short' });
            if (period === 'MONTHLY') {
                key = t.date.substring(0, 7);
                label = new Date(t.date).toLocaleDateString('default', { month: 'short', year: '2-digit' });
            } else if (period === 'YEARLY') {
                key = t.date.substring(0, 4);
                label = key;
            }
            if (!map[key]) map[key] = { label, income: 0, expense: 0, profit: 0 };
            const income = t.totalSales || (t.cashSales + t.onlineSales);
            map[key].income += income;
            map[key].expense += t.expenses;
            map[key].profit += (income - t.expenses);
        });
        return Object.values(map);
    }, [filteredTransactions, period]);

    const recentFiltered = useMemo(() => {
        let list = [...tx];
        if (recentFrom) list = list.filter((t: any) => t.date >= recentFrom);
        if (recentTo) list = list.filter((t: any) => t.date <= recentTo);
        if (recentSearch.trim()) {
            const q = recentSearch.trim().toLowerCase();
            list = list.filter((t: any) => (t.notes || '').toLowerCase().includes(q) || t.date.includes(q));
        }
        if (netMin) {
            const min = parseFloat(netMin) || 0;
            list = list.filter((t: any) => (t.totalSales - t.expenses) >= min);
        }
        if (netMax) {
            const max = parseFloat(netMax);
            if (!isNaN(max)) list = list.filter((t: any) => (t.totalSales - t.expenses) <= max);
        }
        list.sort((a: any, b: any) => {
            let cmp = 0;
            if (recentSortBy === 'date') cmp = a.date.localeCompare(b.date);
            else if (recentSortBy === 'net') cmp = (a.totalSales - a.expenses) - (b.totalSales - b.expenses);
            else if (recentSortBy === 'notes') cmp = (a.notes || '').localeCompare(b.notes || '');
            return recentSortDir === 'desc' ? -cmp : cmp;
        });
        return list;
    }, [tx, recentFrom, recentTo, recentSearch, netMin, netMax, recentSortBy, recentSortDir]);

    const isDark = theme === 'dark';

    return (
        <Layout>
            <div className="space-y-8 animate-in fade-in duration-700 pb-10 max-w-[1600px] mx-auto">

                {/* Header Section */}
                <div className="flex items-center justify-between pb-2">
                    <div className="flex items-center gap-4">
                        <div className="flex flex-col">
                            <h1 className="text-xl font-bold text-slate-800 dark:text-neutral-100 tracking-tight">Today's Summary</h1>
                            <div className="flex items-center gap-2 mt-1">
                                <span className="px-2 py-0.5 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-500 dark:text-indigo-400 text-[9px] font-black uppercase rounded-md border border-indigo-100/50 dark:border-indigo-500/20">
                                    {typeof user?.tenantId === 'object' && user?.tenantId !== null ? (user.tenantId as any).name : (user?.tenantId || 'Business')}
                                </span>
                                <span className="w-1 h-1 rounded-full bg-slate-200 dark:bg-neutral-600" />
                                <span className="text-[10px] font-bold text-slate-400 dark:text-neutral-500 capitalize">
                                    {getBranchName((user as any).branchId || 'All')}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <button className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-neutral-800 border border-slate-100 dark:border-neutral-700 rounded-xl text-[10px] font-bold text-slate-500 dark:text-neutral-400 uppercase tracking-wider shadow-sm hover:bg-slate-50 dark:hover:bg-neutral-700 transition-all active:scale-95">
                            <Download className="w-3.5 h-3.5" /> Export
                        </button>
                    </div>
                </div>

                {/* Summary Metrics */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Total Sales */}
                    <div className="bg-[#F8FFF9] dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-500/20 p-5 rounded-2xl flex flex-col justify-between min-h-[120px] relative overflow-hidden group">
                        <div className="relative z-10">
                            <div className="flex items-center gap-2 mb-3">
                                <TrendingUp className="w-4 h-4 text-emerald-500" />
                                <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">Total Sales</span>
                            </div>
                            <span className="text-2xl font-black text-slate-900 dark:text-white">₹ {formatCurrency(summaryStats.sales)}</span>
                        </div>
                    </div>

                    {/* Total Expenses */}
                    <div className="bg-[#FFF8F8] dark:bg-rose-500/10 border border-rose-100 dark:border-rose-500/20 p-5 rounded-2xl flex flex-col justify-between min-h-[120px] relative overflow-hidden group">
                        <div className="relative z-10">
                            <div className="flex items-center gap-2 mb-3">
                                <TrendingDown className="w-4 h-4 text-rose-500" />
                                <span className="text-[10px] font-bold text-rose-600 dark:text-rose-400 uppercase tracking-widest">Total Expenses</span>
                            </div>
                            <span className="text-2xl font-black text-slate-900 dark:text-white">₹ {formatCurrency(summaryStats.expenses)}</span>
                        </div>
                    </div>

                    {/* Net Profit */}
                    <div className="bg-[#E8F2FF]/30 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/20 p-5 rounded-2xl flex flex-col justify-between min-h-[120px] relative overflow-hidden group">
                        <div className="relative z-10">
                            <div className="flex items-center gap-2 mb-3">
                                <Zap className="w-4 h-4 text-indigo-500" />
                                <span className="text-[10px] font-bold text-indigo-500 dark:text-indigo-400 uppercase tracking-widest">Net Profit</span>
                            </div>
                            <span className="text-2xl font-black text-slate-900 dark:text-white">₹ {formatCurrency(summaryStats.profit)}</span>
                        </div>
                    </div>
                </div>

                {/* Main Content Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                    {/* Left: Chart + Transaction History */}
                    <div className="lg:col-span-2 space-y-6">

                        {/* Sales Flow Chart */}
                        <div className="bg-white dark:bg-neutral-800 p-6 rounded-2xl border border-slate-100 dark:border-neutral-700 shadow-sm overflow-hidden relative group">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full -mr-16 -mt-16 group-hover:scale-110 transition-all"></div>
                            <div className="flex items-center justify-between mb-6 relative z-10">
                                <div>
                                    <h3 className="text-lg font-bold text-slate-800 dark:text-neutral-100 flex items-center gap-2">
                                        <TrendingUp className="w-5 h-5 text-indigo-500" /> Sales Flow
                                    </h3>
                                    <p className="text-[10px] text-slate-400 dark:text-neutral-500 font-bold uppercase tracking-widest">Income vs Expense Trend</p>
                                </div>

                                <div className="flex items-center bg-slate-50 dark:bg-neutral-900 p-1 rounded-lg border border-slate-100 dark:border-neutral-700">
                                    {['DAILY', 'MONTHLY', 'YEARLY', 'CUSTOM'].map(p => (
                                        <button
                                            key={p}
                                            onClick={() => setPeriod(p as PeriodType)}
                                            className={`px-3 py-1.5 rounded-md text-[9px] font-bold uppercase tracking-wider transition-all ${period === p
                                                ? 'bg-white dark:bg-neutral-800 text-indigo-500 shadow-sm border border-slate-100 dark:border-neutral-700'
                                                : 'text-slate-400 dark:text-neutral-500 hover:text-slate-700 dark:hover:text-neutral-300'
                                                }`}
                                        >
                                            {p === 'CUSTOM' ? 'Range' : p.charAt(0) + p.slice(1).toLowerCase()}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {period === 'CUSTOM' && (
                                <div className="flex flex-wrap gap-4 mb-6 p-4 bg-slate-50 dark:bg-neutral-900 rounded-xl border border-slate-100 dark:border-neutral-700">
                                    <div className="flex items-center gap-2">
                                        <span className="text-[10px] font-bold text-slate-400 dark:text-neutral-500 uppercase">From:</span>
                                        <input type="date" value={customStart} onChange={e => setCustomStart(e.target.value)} className="p-2 border border-slate-200 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-800 text-[10px] font-bold text-slate-700 dark:text-neutral-200" />
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-[10px] font-bold text-slate-400 dark:text-neutral-500 uppercase">To:</span>
                                        <input type="date" value={customEnd} onChange={e => setCustomEnd(e.target.value)} className="p-2 border border-slate-200 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-800 text-[10px] font-bold text-slate-700 dark:text-neutral-200" />
                                    </div>
                                </div>
                            )}

                            <div className="h-[300px] relative z-10">
                                {chartData.length > 0 ? (
                                    <ResponsiveContainer width="100%" height="100%">
                                        <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                            <defs>
                                                <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2} />
                                                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                                                </linearGradient>
                                                <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.1} />
                                                    <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
                                                </linearGradient>
                                            </defs>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDark ? '#262626' : '#f1f5f9'} />
                                            <XAxis dataKey="label" fontSize={10} stroke="#94a3b8" axisLine={false} tickLine={false} fontWeight={600} dy={10} />
                                            <YAxis fontSize={10} stroke="#94a3b8" tickFormatter={val => `₹${val >= 1000 ? (val / 1000).toFixed(0) + 'k' : val}`} axisLine={false} tickLine={false} fontWeight={600} />
                                            <Tooltip
                                                contentStyle={{ backgroundColor: isDark ? '#171717' : '#fff', borderColor: isDark ? '#404040' : '#e2e8f0', borderRadius: '12px' }}
                                                formatter={(val: number) => [`₹${formatCurrency(val)}`, '']}
                                            />
                                            <Legend iconType="circle" align="right" verticalAlign="top" wrapperStyle={{ fontSize: '10px', fontWeight: 600 }} />
                                            <Area type="monotone" dataKey="income" name="Income" stroke="#6366f1" fill="url(#colorIncome)" strokeWidth={3} activeDot={{ r: 6, strokeWidth: 0, fill: '#6366f1' }} />
                                            <Area type="monotone" dataKey="expense" name="Expense" stroke="#f43f5e" fill="url(#colorExpense)" strokeWidth={3} strokeDasharray="5 5" activeDot={{ r: 4, strokeWidth: 0, fill: '#f43f5e' }} />
                                            <Area type="monotone" dataKey="profit" name="Net Profit" stroke="#10b981" fill="transparent" strokeWidth={4} activeDot={{ r: 8, strokeWidth: 0, fill: '#10b981' }} />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <div className="h-full flex flex-col items-center justify-center text-slate-300 dark:text-neutral-600">
                                        <Layers size={48} className="mb-4 opacity-30" />
                                        <p className="text-[10px] font-bold text-slate-400 dark:text-neutral-500 uppercase tracking-widest text-center">No data available for this period</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Transaction History Table */}
                        <div className="bg-white dark:bg-neutral-800 rounded-2xl border border-slate-100 dark:border-neutral-700 shadow-sm overflow-hidden flex flex-col min-h-[400px]">
                            <div className="p-5 border-b border-slate-50 dark:border-neutral-700 flex items-center justify-between">
                                <h3 className="font-bold text-slate-800 dark:text-neutral-100 flex items-center gap-2">
                                    <History className="w-4 h-4 text-indigo-500" /> Transaction History
                                </h3>
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                                    <input
                                        value={recentSearch}
                                        onChange={e => setRecentSearch(e.target.value)}
                                        placeholder="Search..."
                                        className="pl-9 pr-3 py-2 bg-slate-50 dark:bg-neutral-900 border border-slate-100 dark:border-neutral-700 rounded-lg text-[10px] font-bold text-slate-600 dark:text-neutral-300 uppercase outline-none w-44 focus:ring-2 focus:ring-indigo-500/20 transition-all"
                                    />
                                </div>
                            </div>

                            <div className="overflow-x-auto flex-1">
                                <table className="w-full text-left text-sm tabular-nums">
                                    <thead className="bg-slate-50 dark:bg-neutral-900 border-b border-slate-100 dark:border-neutral-700">
                                        <tr className="text-[10px] font-black text-slate-400 dark:text-neutral-500 uppercase tracking-widest">
                                            <th className="p-5">Date</th>
                                            <th className="p-5 text-right">Income</th>
                                            <th className="p-5 text-right">Expense</th>
                                            <th className="p-5 text-right">Net</th>
                                            <th className="p-5 text-right"></th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50 dark:divide-neutral-700">
                                        {recentFiltered.length === 0 ? (
                                            <tr>
                                                <td colSpan={5} className="p-16 text-center">
                                                    <div className="flex flex-col items-center">
                                                        <Layers className="w-10 h-10 text-slate-200 dark:text-neutral-700 mb-3" />
                                                        <p className="text-[10px] font-bold text-slate-400 dark:text-neutral-500 uppercase tracking-widest">No records found</p>
                                                    </div>
                                                </td>
                                            </tr>
                                        ) : recentFiltered.map((t: any) => {
                                            const netFlow = (t.totalSales || (t.cashSales + t.onlineSales)) - t.expenses;
                                            return (
                                                <tr
                                                    key={t.id}
                                                    onClick={() => setSelectedRowId(t.id === selectedRowId ? null : t.id)}
                                                    className={`hover:bg-slate-50 dark:hover:bg-neutral-700/30 transition-colors group cursor-default ${selectedRowId === t.id ? 'bg-indigo-50/50 dark:bg-indigo-500/5' : ''}`}
                                                >
                                                    <td className="p-5">
                                                        <div className="flex items-center gap-3">
                                                            <div className={`w-2 h-2 rounded-full ${t.synced === false ? 'bg-amber-400 animate-pulse' : 'bg-emerald-400'}`} />
                                                            <div>
                                                                <div className="font-bold text-slate-800 dark:text-neutral-100 text-sm">
                                                                    {new Date(t.date).toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' })}
                                                                </div>
                                                                <div className="text-[9px] text-slate-400 dark:text-neutral-500 font-bold">{t.id.slice(0, 8)}</div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="p-5 text-right">
                                                        <span className="font-bold text-emerald-600 dark:text-emerald-400 text-sm">
                                                            ₹{formatCurrency(t.totalSales || (t.cashSales + t.onlineSales))}
                                                        </span>
                                                    </td>
                                                    <td className="p-5 text-right">
                                                        <span className="font-bold text-rose-500 text-sm">
                                                            {t.expenses > 0 ? `₹${formatCurrency(t.expenses)}` : '—'}
                                                        </span>
                                                    </td>
                                                    <td className="p-5 text-right">
                                                        <span className={`text-sm font-black ${netFlow >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                                                            ₹{formatCurrency(netFlow)}
                                                        </span>
                                                    </td>
                                                    <td className="p-5 text-right">
                                                        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-all">
                                                            <button onClick={(e) => { e.stopPropagation(); handleEdit(t); }} className="p-2 text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 rounded-lg transition-all active:scale-90"><Edit2 size={14} /></button>
                                                            <button onClick={(e) => { e.stopPropagation(); handleDelete(t.id); }} className="p-2 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-lg transition-all active:scale-90"><Trash2 size={14} /></button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>

                    {/* Right Sidebar: Entry Form */}
                    <div className="space-y-6">

                        {/* Daily Entry Form */}
                        <div className="bg-white dark:bg-neutral-800 rounded-2xl border border-slate-100 dark:border-neutral-700 shadow-sm overflow-hidden">
                            <div className="p-5 border-b border-slate-50 dark:border-neutral-700 flex items-center justify-between">
                                <h3 className="font-bold text-slate-800 dark:text-neutral-100 flex items-center gap-2">
                                    <Plus className="w-4 h-4 text-indigo-500" /> {editingId ? 'Edit Record' : 'New Entry'}
                                </h3>
                                {editingId && (
                                    <button onClick={cancelEdit} className="p-1.5 hover:bg-rose-50 dark:hover:bg-rose-500/10 text-slate-400 hover:text-rose-500 rounded-lg transition-colors">
                                        <X size={14} />
                                    </button>
                                )}
                            </div>

                            <form onSubmit={saveTransaction} className="p-5 space-y-4">
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-bold text-slate-400 dark:text-neutral-500 uppercase tracking-widest">Date</label>
                                    <div className="relative">
                                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 dark:text-neutral-500" />
                                        <input type="date" required value={date} onChange={e => setDate(e.target.value)} className="w-full pl-9 pr-3 py-3 bg-slate-50 dark:bg-neutral-900 border border-slate-100 dark:border-neutral-700 rounded-xl text-sm font-bold text-slate-700 dark:text-neutral-200 outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all" />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-bold text-slate-400 dark:text-neutral-500 uppercase tracking-widest">Cash Sales</label>
                                        <input type="number" step="0.01" value={cash} onChange={e => setCash(e.target.value)} placeholder="0.00" className="w-full px-3 py-3 bg-slate-50 dark:bg-neutral-900 border border-slate-100 dark:border-neutral-700 rounded-xl text-sm font-bold text-slate-700 dark:text-neutral-200 tabular-nums outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all" />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-bold text-slate-400 dark:text-neutral-500 uppercase tracking-widest">Online Sales</label>
                                        <input type="number" step="0.01" value={online} onChange={e => setOnline(e.target.value)} placeholder="0.00" className="w-full px-3 py-3 bg-slate-50 dark:bg-neutral-900 border border-slate-100 dark:border-neutral-700 rounded-xl text-sm font-bold text-slate-700 dark:text-neutral-200 tabular-nums outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all" />
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-bold text-rose-500 uppercase tracking-widest">Expenses</label>
                                    <input type="number" step="0.01" value={exp} onChange={e => setExp(e.target.value)} placeholder="0.00" className="w-full px-3 py-3 bg-slate-50 dark:bg-neutral-900 border border-slate-100 dark:border-neutral-700 rounded-xl text-sm font-bold text-rose-500 tabular-nums outline-none focus:ring-2 focus:ring-rose-500/20 transition-all" />
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-bold text-slate-400 dark:text-neutral-500 uppercase tracking-widest">Cash in Drawer</label>
                                    <input type="number" step="0.01" value={drawerCash} onChange={e => setDrawerCash(e.target.value)} placeholder="Counted amount" className="w-full px-3 py-3 bg-slate-50 dark:bg-neutral-900 border border-slate-100 dark:border-neutral-700 rounded-xl text-sm font-bold text-slate-700 dark:text-neutral-200 tabular-nums outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all" />
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-bold text-slate-400 dark:text-neutral-500 uppercase tracking-widest">Notes</label>
                                    <input type="text" value={notes} onChange={e => setNotes(e.target.value)} placeholder="Optional notes..." className="w-full px-3 py-3 bg-slate-50 dark:bg-neutral-900 border border-slate-100 dark:border-neutral-700 rounded-xl text-sm font-medium text-slate-700 dark:text-neutral-200 outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all" />
                                </div>

                                {/* Live Preview */}
                                <div className="bg-[#E8F2FF]/30 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/20 p-4 rounded-xl">
                                    <div className="flex items-center justify-between">
                                        <span className="text-[10px] font-bold text-indigo-500 dark:text-indigo-400 uppercase tracking-widest">Total Sales Preview</span>
                                        <span className="text-lg font-black text-slate-900 dark:text-white">₹ {formatCurrency(currentTotalSales)}</span>
                                    </div>
                                </div>

                                <button type="submit" className="w-full py-3.5 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl text-[10px] font-bold uppercase tracking-widest shadow-lg shadow-indigo-500/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2">
                                    <CheckCircle2 className="w-4 h-4" />
                                    {editingId ? 'Update Record' : 'Save Entry'}
                                </button>
                            </form>
                        </div>

                        {/* Status Message */}
                        {statusMsg && (
                            <div className={`p-4 rounded-xl flex items-center gap-3 text-[10px] font-bold uppercase tracking-widest border ${statusMsg.type === 'success' ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-100 dark:border-emerald-500/20' : 'bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-100 dark:border-rose-500/20'}`}>
                                {statusMsg.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
                                {statusMsg.text}
                            </div>
                        )}

                        {/* Records Count */}
                        <div className="bg-slate-50 dark:bg-neutral-900 border border-slate-100 dark:border-neutral-700 p-4 rounded-xl text-center">
                            <p className="text-[10px] font-bold text-slate-400 dark:text-neutral-500 uppercase tracking-widest">
                                Total Records: <span className="text-indigo-500 dark:text-indigo-400 font-black">{tx.length}</span>
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </Layout>
    );
};

export default DailyFinancePage;

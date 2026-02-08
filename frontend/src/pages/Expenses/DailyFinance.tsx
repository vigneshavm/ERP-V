import React, { useState, useEffect, useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from "../../redux/store";
import {
    addDailyRecord,
    updateDailyRecord,
    deleteDailyRecord,
    setDailyRecordSynced
} from "../../redux/slices/financeSlice";
import { SyncManager } from "../../services/SyncManager";
import Layout from "../../components/shared/Layout";
import {
    Briefcase, IndianRupee, Plus, CheckCircle2, History,
    Activity, AlertCircle, CreditCard, Search,
    Edit2, Trash2, X, Clock, Zap, ArrowRight,
    TrendingUp, TrendingDown, Calendar, Download,
    Filter, Info, ShieldCheck, Layers, MoreVertical
} from 'lucide-react';
import { formatCurrency } from "../../utils/helpers";
import { useBranchResolver } from "../../hooks/useBranchResolver";
import MetricCard from "../../components/shared/UI/MetricCard";
import {
    AreaChart, Area, CartesianGrid, Legend,
    ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";

type PeriodType = 'DAILY' | 'MONTHLY' | 'YEARLY' | 'CUSTOM';

const DailyFinancePage: React.FC = () => {
    const dispatch = useDispatch<AppDispatch>();
    const { theme, user } = useSelector((state: RootState) => state.auth);
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
            tenantId: user?.tenantId
        };

        if (editingId) {
            dispatch(updateDailyRecord(payload));
            setEditingId(null);
        } else {
            dispatch(addDailyRecord(payload));
        }

        setCash(""); setOnline(""); setExp(""); setDrawerCash(""); setNotes("");
        setStatusMsg({ type: 'success', text: editingId ? 'Vault updated.' : 'Daily record committed.' });
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
        if (window.confirm("Purge this financial record from the ledger?")) {
            dispatch(deleteDailyRecord(id));
            setStatusMsg({ type: 'success', text: 'Purge complete.' });
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

    const CHART_COLORS = ['#6366f1', '#10b981', '#f59e0b', '#f43f5e', '#8b5cf6'];
    const isDark = theme === 'dark';

    return (
        <Layout>
            <div className="space-y-6 animate-fade-in text-neutral-900 dark:text-neutral-100 pb-16">

                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <span className="px-2 py-0.5 bg-primary/10 text-primary text-[10px] font-black uppercase tracking-widest rounded-md">Ledger Node</span>
                            <span className="text-neutral-300 dark:text-neutral-700">/</span>
                            <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">{getBranchName((user as any).branchId || 'All')}</span>
                        </div>
                        <h2 className="text-4xl font-black text-neutral-900 dark:text-white tracking-tight leading-none">
                            Daily Finance Tracker
                        </h2>
                        <p className="text-sm text-neutral-500 mt-2 font-medium flex items-center gap-2 italic">
                            Transactional audit terminal for <span className="text-primary font-bold">{user?.tenantId}</span>
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        <button className="flex items-center gap-2 px-6 py-3 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-sm hover:bg-neutral-50 transition-all active:scale-95">
                            <Download className="w-4 h-4 text-primary" /> Export Records
                        </button>
                    </div>
                </div>

                {/* Summary Metrics Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <MetricCard
                        title="Total Sales"
                        value={`₹${formatCurrency(summaryStats.sales)}`}
                        icon={TrendingUp}
                        color="emerald"
                        progress={75}
                    />
                    <MetricCard
                        title="Total Expenses"
                        value={`₹${formatCurrency(summaryStats.expenses)}`}
                        icon={TrendingDown}
                        color="rose"
                        progress={35}
                    />
                    <MetricCard
                        title="Projected Extraction"
                        value={`₹${formatCurrency(summaryStats.profit)}`}
                        icon={Zap}
                        color="primary"
                        progress={60}

                    />
                </div>

                {/* Unified Intelligence Hub Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">

                    {/* Main Command Hub (Analytics & History) */}
                    <div className="lg:col-span-8 space-y-12">

                        {/* 1. Flow Analytics */}
                        <div className="bg-white dark:bg-neutral-800 rounded-[2.5rem] border border-neutral-200 dark:border-neutral-700 p-8 shadow-sm">
                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-10 gap-4 px-2">
                                <h3 className="text-[11px] font-black text-neutral-400 uppercase tracking-[0.3em] flex items-center gap-3">
                                    <TrendingUp className="w-5 h-5 text-primary" /> Capital Flow Topology
                                </h3>
                                <div className="flex bg-neutral-100 dark:bg-neutral-900 p-1 rounded-xl">
                                    {['DAILY', 'MONTHLY', 'YEARLY', 'CUSTOM'].map(p => (
                                        <button
                                            key={p}
                                            onClick={() => setPeriod(p as PeriodType)}
                                            className={`px-4 py-2 rounded-lg text-[9px] font-black tracking-widest uppercase transition-all ${period === p
                                                ? 'bg-white dark:bg-neutral-800 text-primary shadow-sm'
                                                : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
                                                }`}
                                        >
                                            {p === 'CUSTOM' ? 'Range' : p.charAt(0) + p.slice(1).toLowerCase()}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {period === 'CUSTOM' && (
                                <div className="flex flex-wrap gap-4 mb-10 p-6 bg-neutral-50 dark:bg-neutral-900/50 rounded-3xl border border-neutral-100 dark:border-neutral-800">
                                    <div className="flex items-center gap-3">
                                        <span className="text-[10px] font-black text-neutral-400 uppercase">Analysis Entry:</span>
                                        <input type="date" value={customStart} onChange={e => setCustomStart(e.target.value)} className="p-2 border border-neutral-200 dark:border-neutral-700 rounded-xl bg-white dark:bg-neutral-800 text-[10px] font-black uppercase" />
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <span className="text-[10px] font-black text-neutral-400 uppercase">Analysis Exit:</span>
                                        <input type="date" value={customEnd} onChange={e => setCustomEnd(e.target.value)} className="p-2 border border-neutral-200 dark:border-neutral-700 rounded-xl bg-white dark:bg-neutral-800 text-[10px] font-black uppercase" />
                                    </div>
                                </div>
                            )}

                            <div className="h-[350px] relative z-10 font-bold overflow-hidden">
                                {chartData.length > 0 ? (
                                    <ResponsiveContainer width="100%" height="100%">
                                        <AreaChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
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
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={theme === 'dark' ? '#262626' : '#f5f5f5'} />
                                            <XAxis dataKey="label" fontSize={9} axisLine={false} tickLine={false} tick={{ fill: '#737373', fontWeight: 900 }} dy={10} />
                                            <YAxis fontSize={9} axisLine={false} tickLine={false} tick={{ fill: '#737373', fontWeight: 900 }} tickFormatter={val => `₹${val >= 1000 ? (val / 1000).toFixed(0) + 'k' : val}`} />
                                            <Tooltip
                                                cursor={{ stroke: '#6366f1', strokeWidth: 2, strokeDasharray: '5 5' }}
                                                contentStyle={{ backgroundColor: theme === 'dark' ? '#0a0a0a' : '#fff', borderRadius: '1.5rem', border: '1px solid #262626', color: '#fff', padding: '1.5rem', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.2)' }}
                                                itemStyle={{ fontFamily: 'var(--font-mono)', fontWeight: 900, textTransform: 'uppercase', fontSize: '10px' }}
                                                labelStyle={{ fontWeight: 900, fontSize: '12px', marginBottom: '0.5rem', textTransform: 'uppercase' }}
                                                formatter={(val: number) => `₹${formatCurrency(val)}`}
                                            />
                                            <Legend iconType="circle" align="right" verticalAlign="top" wrapperStyle={{ paddingTop: '0', textTransform: 'uppercase', fontWeight: 900, fontSize: '9px', letterSpacing: '0.2em' }} />
                                            <Area type="monotone" dataKey="income" name="Pulse Inflow" stroke="#6366f1" fill="url(#colorIncome)" strokeWidth={3} activeDot={{ r: 6, strokeWidth: 0, fill: '#6366f1' }} />
                                            <Area type="monotone" dataKey="expense" name="Operational Burn" stroke="#f43f5e" fill="url(#colorExpense)" strokeWidth={3} strokeDasharray="5 5" activeDot={{ r: 4, strokeWidth: 0, fill: '#f43f5e' }} />
                                            <Area type="monotone" dataKey="profit" name="Net Velocity" stroke="#10b981" fill="transparent" strokeWidth={4} activeDot={{ r: 8, strokeWidth: 0, fill: '#10b981' }} />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <div className="h-full flex flex-col items-center justify-center text-neutral-400">
                                        <Layers size={48} className="mb-4 opacity-10 animate-pulse" />
                                        <p className="text-[10px] font-black uppercase tracking-widest italic text-center">No financial topology <br /> detected for this window</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* 2. Audit History Ledger */}
                        <div className="bg-white dark:bg-neutral-800 rounded-[2.5rem] border border-neutral-200 dark:border-neutral-700 overflow-hidden shadow-sm">
                            <div className="p-8 border-b border-neutral-100 dark:border-neutral-800 flex flex-col md:flex-row md:items-center justify-between gap-6">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 bg-primary/10 rounded-2xl text-primary">
                                        <History size={24} />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-black italic tracking-tighter uppercase">Audit History Node</h3>
                                        <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest mt-0.5">Immutable financial tracking</p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3">
                                    <div className="relative">
                                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400" size={14} />
                                        <input
                                            value={recentSearch}
                                            onChange={e => setRecentSearch(e.target.value)}
                                            placeholder="Search ledger..."
                                            className="pl-10 pr-4 py-3 bg-neutral-50 dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-700 rounded-xl text-[10px] font-black uppercase outline-none w-48 focus:ring-2 focus:ring-primary/10 transition-all"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="overflow-x-auto relative min-h-[400px]">
                                <table className="w-full text-left text-sm tabular-nums border-collapse">
                                    <thead className="bg-neutral-50 dark:bg-neutral-900/80 backdrop-blur-md border-b border-neutral-100 dark:border-neutral-800 text-neutral-400 font-black uppercase tracking-[0.2em] text-[10px] sticky top-0 z-10">
                                        <tr>
                                            <th className="p-8">Audit Seal</th>
                                            <th className="p-8 text-right text-primary">Inflow</th>
                                            <th className="p-8 text-right text-rose-500">Burn</th>
                                            <th className="p-8 text-right text-neutral-900 dark:text-white">Net</th>
                                            <th className="p-8 text-right"></th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                                        {recentFiltered.length === 0 ? (
                                            <tr><td colSpan={5} className="p-32 text-center text-[10px] font-black uppercase tracking-widest italic text-neutral-400 opacity-50">Empty analysis window</td></tr>
                                        ) : recentFiltered.map((t: any) => {
                                            const netFlow = (t.totalSales || (t.cashSales + t.onlineSales)) - t.expenses;
                                            return (
                                                <tr
                                                    key={t.id}
                                                    onClick={() => setSelectedRowId(t.id === selectedRowId ? null : t.id)}
                                                    className={`hover:bg-primary/[0.02] dark:hover:bg-primary/[0.05] transition-all group cursor-default ${selectedRowId === t.id ? 'bg-primary/[0.05] dark:bg-primary/[0.1]' : ''}`}
                                                >
                                                    <td className="p-8">
                                                        <div className="flex items-center gap-4">
                                                            <div className={`w-2.5 h-2.5 rounded-full ${t.synced === false ? 'bg-warning animate-pulse' : 'bg-primary shadow-[0_0_12px_rgba(99,102,241,0.4)]'}`} />
                                                            <div className="flex flex-col">
                                                                <span className="font-black text-neutral-900 dark:text-white uppercase tracking-tighter text-sm italic">
                                                                    {new Date(t.date).toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' })}
                                                                </span>
                                                                <span className="text-[9px] text-neutral-400 font-black uppercase tracking-[0.2em] mt-1 opacity-50">{t.id.slice(0, 8)}</span>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="p-8 text-right">
                                                        <span className="font-black italic text-primary bg-primary/5 px-3 py-1 rounded-xl text-xs">
                                                            ₹{formatCurrency(t.totalSales || (t.cashSales + t.onlineSales))}
                                                        </span>
                                                    </td>
                                                    <td className="p-8 text-right">
                                                        <span className="font-bold text-rose-500 text-xs">
                                                            {t.expenses > 0 ? `₹${formatCurrency(t.expenses)}` : '—'}
                                                        </span>
                                                    </td>
                                                    <td className="p-8 text-right">
                                                        <div className={`text-base font-black italic tracking-tighter tabular-nums ${netFlow >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                                                            ₹{formatCurrency(netFlow)}
                                                        </div>
                                                    </td>
                                                    <td className="p-8 text-right">
                                                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all translate-x-4 group-hover:translate-x-0">
                                                            <button onClick={(e) => { e.stopPropagation(); handleEdit(t); }} className="p-2.5 text-primary hover:bg-primary/10 rounded-xl transition-all active:scale-90"><Edit2 size={14} /></button>
                                                            <button onClick={(e) => { e.stopPropagation(); handleDelete(t.id); }} className="p-2.5 text-rose-500 hover:bg-rose-500/10 rounded-xl transition-all active:scale-90"><Trash2 size={14} /></button>
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

                    {/* Intelligence Sidebar (Engagement Terminal) */}
                    <div className="lg:col-span-4 space-y-12">

                        {/* 1. Vault Entry Terminal */}
                        <div className="bg-white dark:bg-neutral-800 rounded-[2.5rem] border border-neutral-200 dark:border-neutral-700 shadow-2xl relative overflow-hidden group">
                            <div className="absolute top-0 right-0 w-48 h-48 bg-primary/5 rounded-full -mr-24 -mt-24 blur-3xl" />

                            <div className="p-8 relative z-10">
                                <div className="flex items-center justify-between mb-8">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-primary/10 rounded-2xl flex items-center justify-center text-primary">
                                            <Zap className="w-5 h-5 fill-current" />
                                        </div>
                                        <div>
                                            <h3 className="text-sm font-black text-neutral-900 dark:text-white uppercase tracking-widest">{editingId ? 'Modify Commitment' : 'Vault Entry'}</h3>
                                            <p className="text-[9px] font-black text-primary uppercase tracking-[0.3em] opacity-60">Ledger Protocol v4</p>
                                        </div>
                                    </div>
                                    {editingId && (
                                        <button onClick={cancelEdit} className="p-2 hover:bg-rose-500/10 text-neutral-400 hover:text-rose-500 rounded-lg transition-colors"><X size={16} /></button>
                                    )}
                                </div>

                                <form onSubmit={saveTransaction} className="space-y-8">
                                    <div className="space-y-6">
                                        <div className="space-y-2">
                                            <label className="text-[9px] font-black text-neutral-400 uppercase tracking-widest pl-1">Target Date</label>
                                            <div className="relative group/input">
                                                <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                                                <input type="date" required value={date} onChange={e => setDate(e.target.value)} className="w-full pl-10 pr-4 py-4 bg-neutral-50 dark:bg-neutral-900/50 border border-neutral-100 dark:border-neutral-800 rounded-xl text-[10px] font-black uppercase outline-none focus:ring-4 focus:ring-primary/10 transition-all" />
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <label className="text-[9px] font-black text-neutral-400 uppercase tracking-widest pl-1">Cash In</label>
                                                <input type="number" step="0.01" value={cash} onChange={e => setCash(e.target.value)} placeholder="0.00" className="w-full px-4 py-4 bg-neutral-50 dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800 rounded-xl text-sm font-black italic tabular-nums outline-none focus:ring-4 focus:ring-primary/10 transition-all font-mono" />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-[9px] font-black text-neutral-400 uppercase tracking-widest pl-1">Digital In</label>
                                                <input type="number" step="0.01" value={online} onChange={e => setOnline(e.target.value)} placeholder="0.00" className="w-full px-4 py-4 bg-neutral-50 dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800 rounded-xl text-sm font-black italic tabular-nums outline-none focus:ring-4 focus:ring-primary/10 transition-all font-mono" />
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-[9px] font-black text-rose-500 uppercase tracking-widest pl-1">Audit Burn (Expense)</label>
                                            <input type="number" step="0.01" value={exp} onChange={e => setExp(e.target.value)} placeholder="0.00" className="w-full px-4 py-4 bg-neutral-50 dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800 rounded-xl text-sm font-black italic tabular-nums outline-none focus:ring-4 focus:ring-rose-500/10 transition-all font-mono text-rose-500" />
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-[9px] font-black text-neutral-400 uppercase tracking-widest pl-1">Drawer Total</label>
                                            <input type="number" step="0.01" value={drawerCash} onChange={e => setDrawerCash(e.target.value)} placeholder="Counted amount" className="w-full px-4 py-4 bg-neutral-50 dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800 rounded-xl text-sm font-black italic tabular-nums outline-none focus:ring-4 focus:ring-primary/10 transition-all font-mono" />
                                        </div>

                                        <MetricCard
                                            title="Projected Node Liquidity"
                                            value={`₹${formatCurrency(currentTotalSales)}`}
                                            icon={Zap}
                                            color="primary"
                                            variant="dark"
                                            compact
                                        />
                                    </div>

                                    <button type="submit" className="w-full py-5 bg-primary text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.3em] shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3">
                                        <ShieldCheck className="w-4 h-4" />
                                        {editingId ? 'Modify Commitment' : 'Commit to Ledger'}
                                    </button>
                                </form>
                            </div>
                        </div>

                        {/* 2. Feedback Messaging */}
                        {statusMsg && (
                            <div className={`p-6 rounded-[2.5rem] flex items-center gap-4 text-[10px] font-black uppercase tracking-widest border animate-in slide-in-from-right-4 ${statusMsg.type === 'success' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-rose-500/10 text-rose-500 border-rose-500/20'}`}>
                                <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${statusMsg.type === 'success' ? 'bg-emerald-500/20' : 'bg-rose-500/20'}`}>
                                    {statusMsg.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
                                </div>
                                <div>
                                    <div className="text-[9px] opacity-60">System Notification</div>
                                    {statusMsg.text}
                                </div>
                            </div>
                        )}

                        {/* 3. Global Analytics Context */}
                        <div className="bg-neutral-950 text-white p-8 rounded-[3rem] border border-neutral-800 relative overflow-hidden">
                            <Layers className="absolute -bottom-6 -right-6 w-24 h-24 text-primary opacity-10" />
                            <h4 className="text-xs font-black uppercase tracking-widest mb-4 flex items-center gap-2">
                                <Info size={14} className="text-primary" /> Authority Protocol
                            </h4>
                            <p className="text-[10px] text-neutral-400 font-bold leading-relaxed italic">
                                Your entries are cryptographically signed and synced to the tenant hub. Total ledger records: <span className="text-primary">{tx.length}</span>.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </Layout>
    );
};

export default DailyFinancePage;

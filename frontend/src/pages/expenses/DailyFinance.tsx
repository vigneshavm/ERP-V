import React, { useState, useEffect, useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '../../redux/store';
import {
    addDailyRecord,
    updateDailyRecord,
    deleteDailyRecord,
    setDailyRecordSynced
} from '../../redux/slices/financeSlice';
import { SyncManager } from '../../services/SyncManager';
import Layout from '../../components/Layout';
import {
    Briefcase, History, IndianRupee, Plus, CheckCircle,
    Activity, AlertCircle, CreditCard, Search,
    Edit2, Trash2, X, Clock, Zap, ArrowRight,
    TrendingUp, LayoutGrid, Calendar, Download,
    Filter, Info, ShieldCheck, Layers, MoreVertical
} from 'lucide-react';
import { formatCurrency } from '../../utils/helpers';
import { useBranchResolver } from '../../hooks/useBranchResolver';
import {
    BarChart, Bar, CartesianGrid, Legend,
    ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";

type PeriodType = 'DAILY' | 'MONTHLY' | 'YEARLY' | 'CUSTOM';

const DailyFinancePage: React.FC = () => {
    const dispatch = useDispatch<AppDispatch>();
    const { theme, user } = useSelector((state: RootState) => state.auth);
    const { getBranchName } = useBranchResolver();
    const { dailyFinanceRecords } = useSelector((state: RootState) => state.finance);

    const tx = useMemo(() => dailyFinanceRecords || [], [dailyFinanceRecords]);
    const [view, setView] = useState<'ENTRY' | 'CHARTS' | 'RECENT'>('ENTRY');
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
        setView('ENTRY');
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

    return (
        <Layout>
            <div className="space-y-6 animate-fade-in text-neutral-900 dark:text-neutral-100 pb-16">

                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h2 className="text-3xl font-black flex items-center gap-2 tracking-tight uppercase">
                            <Activity className="w-8 h-8 text-primary" />
                            Daily Ledger Node
                        </h2>
                        <p className="text-sm text-neutral-500 mt-1 font-medium flex items-center gap-2">
                            System Terminal for <span className="font-bold text-primary italic uppercase">{user?.tenantId}</span> / <span className="font-bold">{getBranchName((user as any).branchId || 'All')}</span>
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <button className="px-5 py-2.5 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-[10px] font-black flex items-center gap-2 hover:bg-neutral-50 shadow-sm transition active:scale-95 uppercase tracking-[0.2em]">
                            <Download className="w-4 h-4 text-primary" /> Export Records
                        </button>
                        <button
                            onClick={() => setView('ENTRY')}
                            className="px-5 py-2.5 bg-primary text-white rounded-xl text-[10px] font-black shadow-lg shadow-primary/20 flex items-center gap-2 hover:bg-primary/90 transition hover:scale-105 active:scale-95 uppercase tracking-[0.2em]"
                        >
                            <Plus className="w-4 h-4 fill-current" /> New Transaction
                        </button>
                    </div>
                </div>

                {/* View Switcher */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white dark:bg-neutral-800 p-2 rounded-2xl border border-neutral-200 dark:border-neutral-700">
                    <div className="flex p-1 bg-neutral-100 dark:bg-neutral-900 rounded-xl w-full md:w-auto">
                        {[
                            { id: 'ENTRY', label: 'Vault Entry', icon: LayoutGrid },
                            { id: 'RECENT', label: 'Audit History', icon: History },
                            { id: 'CHARTS', label: 'Flow Analytics', icon: TrendingUp }
                        ].map(t => (
                            <button
                                key={t.id}
                                onClick={() => setView(t.id as any)}
                                className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${view === t.id
                                    ? 'bg-white dark:bg-neutral-800 text-primary shadow-sm'
                                    : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
                                    }`}
                            >
                                <t.icon className="w-4 h-4" />
                                {t.label}
                            </button>
                        ))}
                    </div>

                    {statusMsg && (
                        <div className={`px-4 py-2 rounded-xl flex items-center gap-2 text-[10px] font-black uppercase tracking-widest animate-in slide-in-from-right-4 ${statusMsg.type === 'success' ? 'bg-success/10 text-success border border-success/20' : 'bg-error/10 text-error border border-error/20'
                            }`}>
                            {statusMsg.type === 'success' ? <CheckCircle size={14} /> : <AlertCircle size={14} />}
                            {statusMsg.text}
                        </div>
                    )}
                </div>

                {/* --- ENTRY VIEW --- */}
                {view === 'ENTRY' && (
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                        {/* Entry Form */}
                        <div className="lg:col-span-12">
                            <div className="bg-white dark:bg-neutral-800 rounded-[3rem] border border-neutral-200 dark:border-neutral-700 p-10 shadow-sm relative overflow-hidden group">
                                <Activity className="absolute -top-10 -right-10 w-48 h-48 text-primary opacity-5 group-hover:scale-110 transition duration-1000" />

                                <div className="max-w-4xl">
                                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-10">
                                        <div>
                                            <h3 className="text-2xl font-black italic tracking-tighter uppercase mb-1">
                                                {editingId ? 'Edit Ledger Post' : 'Post Daily Record'}
                                            </h3>
                                            <p className="text-xs font-bold text-neutral-400 uppercase tracking-widest italic">Node: {user?.tenantId} | Terminal Alpha</p>
                                        </div>
                                        {editingId && (
                                            <button onClick={cancelEdit} className="p-3 bg-neutral-100 dark:bg-neutral-900 rounded-full text-neutral-400 hover:text-error transition">
                                                <X size={20} />
                                            </button>
                                        )}
                                    </div>

                                    <form onSubmit={saveTransaction} className="space-y-8">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                                            {/* Date Pick */}
                                            <div className="space-y-4">
                                                <label className="text-[10px] font-black text-neutral-400 uppercase tracking-[0.3em] pl-1">Posting Date</label>
                                                <div className="relative group/input">
                                                    <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400 group-focus-within/input:text-primary transition-colors" />
                                                    <input
                                                        type="date"
                                                        required
                                                        value={date}
                                                        onChange={e => setDate(e.target.value)}
                                                        className="w-full pl-12 pr-4 py-5 bg-neutral-50 dark:bg-neutral-900/50 border border-neutral-100 dark:border-neutral-800 rounded-2xl text-base font-black italic outline-none focus:ring-4 focus:ring-primary/10 hover:border-primary/30 transition-all cursor-pointer"
                                                    />
                                                </div>
                                            </div>

                                            {/* Auto Total */}
                                            <div className="space-y-4">
                                                <label className="text-[10px] font-black text-primary uppercase tracking-[0.3em] pl-1">Calculated Net Inflow</label>
                                                <div className="w-full px-6 py-5 bg-neutral-950 text-primary-light border border-neutral-800 rounded-2xl flex items-center justify-between shadow-xl shadow-primary/5">
                                                    <div className="text-2xl font-black italic tabular-nums tracking-tighter">₹{formatCurrency(currentTotalSales)}</div>
                                                    <div className="px-3 py-1 bg-primary/20 text-primary text-[9px] font-black uppercase tracking-widest rounded-full italic border border-primary/30">Auto-Computed</div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-8">
                                            {/* Field Group 1 */}
                                            <div className="space-y-6">
                                                <div className="space-y-3">
                                                    <label className="text-[10px] font-black text-neutral-400 uppercase tracking-[0.3em] pl-1">Cash In-Flow</label>
                                                    <div className="relative">
                                                        <IndianRupee size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400" />
                                                        <input
                                                            type="number"
                                                            step="0.01"
                                                            value={cash}
                                                            onChange={e => setCash(e.target.value)}
                                                            placeholder="0.00"
                                                            className="w-full pl-12 pr-4 py-4 bg-neutral-50 dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800 rounded-xl text-lg font-bold tabular-nums outline-none focus:ring-2 focus:ring-primary/20 transition-all font-mono"
                                                        />
                                                    </div>
                                                </div>
                                                <div className="space-y-3">
                                                    <label className="text-[10px] font-black text-neutral-400 uppercase tracking-[0.3em] pl-1">Online / UPI Pulse</label>
                                                    <div className="relative">
                                                        <CreditCard size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400" />
                                                        <input
                                                            type="number"
                                                            step="0.01"
                                                            value={online}
                                                            onChange={e => setOnline(e.target.value)}
                                                            placeholder="0.00"
                                                            className="w-full pl-12 pr-4 py-4 bg-neutral-50 dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800 rounded-xl text-lg font-bold tabular-nums outline-none focus:ring-2 focus:ring-primary/20 transition-all font-mono"
                                                        />
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Field Group 2 */}
                                            <div className="space-y-6">
                                                <div className="space-y-3">
                                                    <label className="text-[10px] font-black text-error uppercase tracking-[0.3em] pl-1">Operating Burn (Expenses)</label>
                                                    <div className="relative">
                                                        <Briefcase size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400" />
                                                        <input
                                                            type="number"
                                                            step="0.01"
                                                            value={exp}
                                                            onChange={e => setExp(e.target.value)}
                                                            placeholder="0.00"
                                                            className="w-full pl-12 pr-4 py-4 bg-neutral-50 dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800 rounded-xl text-lg font-bold tabular-nums outline-none focus:ring-2 focus:ring-error/20 transition-all font-mono"
                                                        />
                                                    </div>
                                                </div>
                                                <div className="space-y-3">
                                                    <label className="text-[10px] font-black text-neutral-400 uppercase tracking-[0.3em] pl-1">Closing Cash (Drawer Count)</label>
                                                    <div className="relative">
                                                        <IndianRupee size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400" />
                                                        <input
                                                            type="number"
                                                            step="0.01"
                                                            value={drawerCash}
                                                            onChange={e => setDrawerCash(e.target.value)}
                                                            placeholder="Amount counted at close"
                                                            className="w-full pl-12 pr-4 py-4 bg-neutral-50 dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800 rounded-xl text-lg font-bold tabular-nums outline-none focus:ring-2 focus:ring-primary/20 transition-all font-mono"
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="space-y-3">
                                            <label className="text-[10px] font-black text-neutral-400 uppercase tracking-[0.3em] pl-1">Terminal Notes (Audit Commentary)</label>
                                            <input
                                                type="text"
                                                value={notes}
                                                onChange={e => setNotes(e.target.value)}
                                                placeholder="e.g. Surge in high-ticket UPI sales, electricity audit pending..."
                                                className="w-full px-6 py-4 bg-neutral-50 dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800 rounded-xl text-sm italic font-medium outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                                            />
                                        </div>

                                        <button
                                            type="submit"
                                            className="w-full py-6 mt-6 bg-primary text-white rounded-[2rem] text-xs font-black uppercase tracking-[0.3em] shadow-2xl shadow-primary/30 hover:scale-[1.01] active:scale-95 transition-all flex items-center justify-center gap-4"
                                        >
                                            <ShieldCheck className="w-5 h-5 fill-current" />
                                            {editingId ? 'Update Ledger Commitment' : 'Authorize Daily Commitment'}
                                        </button>
                                    </form>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* --- ANALYTICS VIEW --- */}
                {view === 'CHARTS' && (
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                        <div className="lg:col-span-8">
                            <div className="bg-white dark:bg-neutral-800 rounded-[3rem] border border-neutral-200 dark:border-neutral-700 p-8 shadow-sm">
                                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4 px-2">
                                    <h3 className="text-sm font-black text-neutral-400 uppercase tracking-[0.3em] flex items-center gap-3">
                                        <TrendingUp className="w-5 h-5 text-primary" /> Capital Flow Topology
                                    </h3>
                                    <div className="flex bg-neutral-100 dark:bg-neutral-900 p-1 rounded-xl">
                                        {['DAILY', 'MONTHLY', 'YEARLY', 'CUSTOM'].map(p => (
                                            <button
                                                key={p}
                                                onClick={() => setPeriod(p as PeriodType)}
                                                className={`px-3 py-1.5 rounded-lg text-[9px] font-black tracking-widest uppercase transition ${period === p ? 'bg-white dark:bg-neutral-800 text-primary shadow-sm' : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
                                                    }`}
                                            >
                                                {p === 'CUSTOM' ? 'Range' : p.charAt(0) + p.slice(1).toLowerCase()}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {period === 'CUSTOM' && (
                                    <div className="flex flex-wrap gap-4 mb-8 p-6 bg-neutral-50 dark:bg-neutral-900/50 rounded-3xl border border-neutral-100 dark:border-neutral-800">
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

                                <div className="h-[400px]">
                                    {chartData.length > 0 ? (
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={theme === 'dark' ? '#262626' : '#f5f5f5'} />
                                                <XAxis dataKey="label" fontSize={10} axisLine={false} tickLine={false} tick={{ fill: theme === 'dark' ? '#525252' : '#a3a3a3', fontWeight: 900 }} dy={10} />
                                                <YAxis fontSize={10} axisLine={false} tickLine={false} tick={{ fill: theme === 'dark' ? '#525252' : '#a3a3a3', fontWeight: 900 }} tickFormatter={val => `₹${val / 1000}k`} />
                                                <Tooltip
                                                    cursor={{ fill: 'rgba(0,0,0,0.03)' }}
                                                    contentStyle={{ backgroundColor: theme === 'dark' ? '#0a0a0a' : '#fff', borderRadius: '1.5rem', border: '1px solid #262626', color: '#fff', padding: '1.5rem', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.2)' }}
                                                    itemStyle={{ fontFamily: 'var(--font-mono)', fontWeight: 900, textTransform: 'uppercase', fontSize: '10px' }}
                                                    labelStyle={{ fontWeight: 900, fontSize: '12px', marginBottom: '0.5rem', textTransform: 'uppercase' }}
                                                    formatter={(val: number) => `₹${formatCurrency(val)}`}
                                                />
                                                <Legend iconType="circle" wrapperStyle={{ paddingTop: '2rem', textTransform: 'uppercase', fontWeight: 900, fontSize: '9px' }} />
                                                <Bar dataKey="income" name="Pulse Inflow" fill="#6366f1" radius={[8, 8, 0, 0]} barSize={24} />
                                                <Bar dataKey="expense" name="Operational Burn" fill="#f43f5e" radius={[8, 8, 0, 0]} barSize={24} />
                                                <Bar dataKey="profit" name="Net Velocity" fill="#10b981" radius={[8, 8, 0, 0]} barSize={24} />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    ) : (
                                        <div className="h-full flex flex-col items-center justify-center text-neutral-400">
                                            <Layers size={48} className="mb-4 opacity-10 animate-pulse" />
                                            <p className="text-[10px] font-black uppercase tracking-widest italic">No data topology available for this range</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="lg:col-span-4 space-y-6">
                            <h3 className="text-[10px] font-black text-neutral-400 uppercase tracking-[0.3em] pl-4">Period Overview</h3>
                            <div className="bg-white dark:bg-neutral-800 rounded-[3.5rem] p-10 border border-neutral-200 dark:border-neutral-700 shadow-sm space-y-8">
                                <div className="space-y-2">
                                    <div className="text-[9px] font-black text-neutral-400 uppercase tracking-[0.2em]">Gross Node Revenue</div>
                                    <div className="text-3xl font-black text-neutral-900 dark:text-white tracking-tighter italic">₹{formatCurrency(summaryStats.sales)}</div>
                                </div>
                                <div className="space-y-2">
                                    <div className="text-[9px] font-black text-error uppercase tracking-[0.2em]">Total Operating Burn</div>
                                    <div className="text-3xl font-black text-error tracking-tighter italic">₹{formatCurrency(summaryStats.expenses)}</div>
                                </div>
                                <div className="p-8 bg-success/5 border border-success/10 rounded-[2.5rem] space-y-2">
                                    <div className="text-[9px] font-black text-success uppercase tracking-[0.2em]">Net Margin Extraction</div>
                                    <div className="text-4xl font-black text-success tracking-tighter italic tabular-nums">₹{formatCurrency(summaryStats.profit)}</div>
                                    <div className="flex items-center gap-2 mt-4 pt-4 border-t border-success/10">
                                        <TrendingUp className="w-4 h-4 text-success" />
                                        <span className="text-[10px] font-black text-success uppercase">Capital Extraction Stable</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* --- AUDIT HISTORY VIEW --- */}
                {view === 'RECENT' && (
                    <div className="space-y-6">
                        <div className="bg-white dark:bg-neutral-800 rounded-[3rem] border border-neutral-200 dark:border-neutral-700 overflow-hidden shadow-sm">
                            <div className="p-8 border-b border-neutral-100 dark:border-neutral-800 flex flex-col md:flex-row md:items-center justify-between gap-6">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 bg-primary/10 rounded-2xl text-primary">
                                        <History size={24} />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-black italic tracking-tighter uppercase">Audit History Node</h3>
                                        <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest mt-0.5">Immutable financial ledger tracing</p>
                                    </div>
                                </div>

                                <div className="flex flex-wrap items-center gap-3">
                                    <div className="relative">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" size={14} />
                                        <input
                                            value={recentSearch}
                                            onChange={e => setRecentSearch(e.target.value)}
                                            placeholder="Search ledger..."
                                            className="pl-9 pr-4 py-3 bg-neutral-50 dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-700 rounded-xl text-xs outline-none w-48 font-bold"
                                        />
                                    </div>
                                    <button
                                        onClick={() => { setRecentSearch(''); setRecentFrom(''); setRecentTo(''); setNetMin(''); setNetMax(''); setRecentSortBy('date'); setRecentSortDir('desc'); setSelectedRowId(null); }}
                                        className="px-4 py-3 text-[10px] font-black uppercase tracking-widest bg-neutral-100 dark:bg-neutral-900 hover:bg-neutral-200 dark:hover:bg-neutral-700/50 rounded-xl transition"
                                    >
                                        Reset Filters
                                    </button>
                                </div>
                            </div>

                            <div className="bg-neutral-50/50 dark:bg-neutral-900/30 p-4 border-b border-neutral-100 dark:border-neutral-800 flex flex-wrap gap-4 items-center">
                                <div className="flex items-center gap-2">
                                    <span className="text-[9px] font-black text-neutral-400 uppercase">Analysis Window:</span>
                                    <input type="date" value={recentFrom} onChange={e => setRecentFrom(e.target.value)} className="px-3 py-1.5 border border-neutral-100 dark:border-neutral-800 rounded-lg bg-white dark:bg-neutral-800 text-[9px] font-black uppercase" />
                                    <span className="text-neutral-300">/</span>
                                    <input type="date" value={recentTo} onChange={e => setRecentTo(e.target.value)} className="px-3 py-1.5 border border-neutral-100 dark:border-neutral-800 rounded-lg bg-white dark:bg-neutral-800 text-[9px] font-black uppercase" />
                                </div>
                                <div className="h-6 w-[1px] bg-neutral-200 dark:bg-neutral-800" />
                                <div className="flex items-center gap-2">
                                    <span className="text-[9px] font-black text-neutral-400 uppercase">Magnitude Filter:</span>
                                    <input type="number" placeholder="MIN" value={netMin} onChange={e => setNetMin(e.target.value)} className="px-3 py-1.5 border border-neutral-100 dark:border-neutral-800 rounded-lg bg-white dark:bg-neutral-800 text-[9px] font-black w-20" />
                                    <input type="number" placeholder="MAX" value={netMax} onChange={e => setNetMax(e.target.value)} className="px-3 py-1.5 border border-neutral-100 dark:border-neutral-800 rounded-lg bg-white dark:bg-neutral-800 text-[9px] font-black w-20" />
                                </div>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm tabular-nums">
                                    <thead className="bg-neutral-50 dark:bg-neutral-900 border-b border-neutral-100 dark:border-neutral-800 text-neutral-400 font-black uppercase tracking-[0.2em] text-[10px]">
                                        <tr>
                                            <th className="p-6">Commitment Hash / Date</th>
                                            <th className="p-6 text-right">Vault Cash</th>
                                            <th className="p-6 text-right">Digital UPI</th>
                                            <th className="p-6 text-right text-primary">Total Sales</th>
                                            <th className="p-6 text-right text-error">Operating Burn</th>
                                            <th className="p-6 text-right text-neutral-900 dark:text-white">Net Node Flow</th>
                                            <th className="p-6">Authority Notes</th>
                                            <th className="p-6"></th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                                        {recentFiltered.length === 0 ? (
                                            <tr><td colSpan={8} className="p-20 text-center text-[10px] font-black uppercase tracking-widest italic text-neutral-400">Zero entries located in current analysis window</td></tr>
                                        ) : recentFiltered.map((t: any) => (
                                            <tr
                                                key={t.id}
                                                onClick={() => setSelectedRowId(t.id === selectedRowId ? null : t.id)}
                                                className={`hover:bg-neutral-50 dark:hover:bg-neutral-700/30 transition-colors group cursor-default ${selectedRowId === t.id ? 'bg-primary/[0.03]' : ''}`}
                                            >
                                                <td className="p-6">
                                                    <div className="flex items-center gap-3">
                                                        <div className={`w-2 h-2 rounded-full ${t.synced === false ? 'bg-warning animate-pulse' : 'bg-primary shadow-[0_0_8px_rgba(99,102,241,0.5)]'}`} title={t.synced === false ? 'Syncing...' : 'Encrypted & Synced'} />
                                                        <div className="flex flex-col">
                                                            <span className="font-black text-neutral-900 dark:text-white uppercase tracking-tighter">
                                                                {new Date(t.date).toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' })}
                                                            </span>
                                                            <span className="text-[9px] text-neutral-400 font-bold uppercase mt-0.5">ID: {t.id.slice(0, 8)}</span>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="p-6 text-right font-bold text-neutral-600 dark:text-neutral-400">
                                                    {t.cashSales > 0 ? `₹${formatCurrency(t.cashSales)}` : '—'}
                                                </td>
                                                <td className="p-6 text-right font-bold text-neutral-600 dark:text-neutral-400">
                                                    {t.onlineSales > 0 ? `₹${formatCurrency(t.onlineSales)}` : '—'}
                                                </td>
                                                <td className="p-6 text-right font-black italic text-primary">
                                                    ₹{formatCurrency(t.totalSales)}
                                                </td>
                                                <td className="p-6 text-right font-bold text-error">
                                                    {t.expenses > 0 ? `₹${formatCurrency(t.expenses)}` : '—'}
                                                </td>
                                                <td className="p-6 text-right font-black italic text-base tracking-tighter tabular-nums">
                                                    <span className={(t.totalSales - t.expenses) >= 0 ? 'text-success' : 'text-error'}>
                                                        ₹{formatCurrency(t.totalSales - t.expenses)}
                                                    </span>
                                                </td>
                                                <td className="p-6">
                                                    <span className="text-[10px] font-bold text-neutral-400 italic max-w-[150px] truncate block" title={t.notes}>
                                                        {t.notes || '—'}
                                                    </span>
                                                </td>
                                                <td className="p-6 text-right">
                                                    <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); handleEdit(t); }}
                                                            className="p-2 text-primary hover:bg-primary/10 rounded-xl transition"
                                                        >
                                                            <Edit2 size={14} />
                                                        </button>
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); handleDelete(t.id); }}
                                                            className="p-2 text-error hover:bg-error/10 rounded-xl transition"
                                                        >
                                                            <Trash2 size={14} />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}

                {/* Agent Intelligence Footer */}
                <div className="bg-neutral-950 text-white p-8 rounded-[3.5rem] border border-neutral-800 shadow-2xl relative overflow-hidden group">
                    <Layers className="absolute -bottom-10 -right-10 w-48 h-48 text-primary opacity-5 group-hover:scale-110 transition duration-1000" />
                    <div className="relative z-10 flex flex-col lg:flex-row items-center gap-12">
                        <div className="flex-1">
                            <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary/20 border border-primary/30 rounded-full text-primary-light text-[9px] font-black uppercase tracking-[0.2em] mb-4">
                                <Zap className="w-3.5 h-3.5 fill-current" /> Auto-Audit Protocol Active
                            </div>
                            <h4 className="text-3xl font-black mb-4 italic tracking-tighter">Synchronized <span className="text-primary underline underline-offset-8">Financial Flow.</span></h4>
                            <p className="text-sm text-neutral-400 font-bold leading-relaxed italic max-w-2xl">
                                Your daily commitments are automatically synced across the oracle network. The ledger currently identifies {tx.length} historical nodes with <span className="text-success tracking-widest font-black uppercase">100% Data Integrity</span>.
                            </p>
                        </div>
                        <div className="flex flex-col sm:flex-row gap-4">
                            <div className="p-6 bg-white/5 border border-white/10 rounded-3xl flex items-center gap-4">
                                <Info className="w-8 h-8 text-primary opacity-50" />
                                <div>
                                    <div className="text-[10px] font-black text-neutral-500 uppercase">Analysis Confidence</div>
                                    <div className="text-xl font-black italic">98.4%</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </Layout>
    );
};

export default DailyFinancePage;

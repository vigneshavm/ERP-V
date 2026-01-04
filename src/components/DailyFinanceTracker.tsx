
import React, { useState, useEffect, useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch, saveDailyFinanceRecord, updateDailyFinanceRecord, deleteDailyFinanceRecord } from '../store';
import { SyncManager } from '../services/SyncManager';
import { APP_CONFIG } from '../../config';
import {
  Briefcase, History, IndianRupee, Plus, CheckCircle,
  Activity, AlertCircle, CalendarDays, CreditCard, Search,
  Edit2, Trash2, X, Clock
} from 'lucide-react';
import { Card } from './Card';
import { formatCurrency } from '../utils/helpers';
import { useBranchResolver } from '../hooks/useBranchResolver';

import {
  BarChart, Bar, CartesianGrid, Legend,
  ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";

interface TrackerTransaction {
  id: string;
  date: string;
  cashSales: number;
  onlineSales: number;
  totalSales: number;
  expenses: number;
  cashInDrawer: number;
  notes: string;
  timestamp: string;
}

type PeriodType = 'DAILY' | 'MONTHLY' | 'YEARLY' | 'CUSTOM';

const DailyFinanceTracker: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { theme, user } = useSelector((state: RootState) => state.auth);
  const { getBranchName } = useBranchResolver();
  const { dailyFinanceRecords } = useSelector((state: RootState) => state.finance);

  const tx = useMemo(() => dailyFinanceRecords, [dailyFinanceRecords]);
  const [view, setView] = useState<'ENTRY' | 'CHARTS' | 'RECENT'>('ENTRY');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedRowId, setSelectedRowId] = useState<string | null>(null);

  useEffect(() => {
    // Trigger sync on mount to catch up
    SyncManager.syncDailyFinanceEntries();
  }, []);

  // Analytics State
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

  // Recent view filters / search / sort state
  const [recentSearch, setRecentSearch] = useState('');
  const [recentFrom, setRecentFrom] = useState('');
  const [recentTo, setRecentTo] = useState('');
  const [netMin, setNetMin] = useState('');
  const [netMax, setNetMax] = useState('');
  const [recentSortBy, setRecentSortBy] = useState<'date' | 'net' | 'notes'>('date');
  const [recentSortDir, setRecentSortDir] = useState<'desc' | 'asc'>('desc');

  // Auto-calc for form
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
      dispatch(updateDailyFinanceRecord(payload));
      setEditingId(null);
    } else {
      dispatch(saveDailyFinanceRecord(payload));
    }

    setCash(""); setOnline(""); setExp(""); setDrawerCash(""); setNotes("");
    setStatusMsg({ type: 'success', text: editingId ? 'Record updated and syncing...' : 'Record saved and syncing...' });
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
    if (window.confirm("Are you sure you want to delete this record?")) {
      dispatch(deleteDailyFinanceRecord(id));
      setStatusMsg({ type: 'success', text: 'Record deleted from syncing...' });
      setTimeout(() => setStatusMsg(null), 3000);
    }
  };

  // 1. Centralized Filter Logic
  const filteredTransactions = useMemo(() => {
    let data = [...tx].sort((a, b) => a.date.localeCompare(b.date));

    // Only filter by date if Custom is selected
    if (period === 'CUSTOM') {
      data = data.filter(t => t.date >= customStart && t.date <= customEnd);
    }
    return data;
  }, [tx, period, customStart, customEnd]);

  // 2. Dynamic Summary Stats (Based on Filter)
  const summaryStats = useMemo(() => {
    return filteredTransactions.reduce((acc, t) => {
      const income = t.totalSales || (t.cashSales + t.onlineSales); // Fallback for old data
      acc.sales += income;
      acc.expenses += t.expenses;
      acc.profit += (income - t.expenses);
      return acc;
    }, { sales: 0, expenses: 0, profit: 0 });
  }, [filteredTransactions]);

  // 3. Dynamic Chart Data (Based on Filter + Period Grouping)
  const chartData = useMemo(() => {
    const map: Record<string, { label: string; income: number; expense: number; profit: number }> = {};

    filteredTransactions.forEach(t => {
      let key = t.date;
      let label = new Date(t.date).toLocaleDateString('default', { day: 'numeric', month: 'short' });

      // Grouping Logic
      if (period === 'MONTHLY') {
        key = t.date.substring(0, 7); // YYYY-MM
        label = new Date(t.date).toLocaleDateString('default', { month: 'short', year: '2-digit' });
      } else if (period === 'YEARLY') {
        key = t.date.substring(0, 4); // YYYY
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

  // RECENT: filtered & sorted list based on user controls
  const recentFiltered = useMemo(() => {
    let list = [...tx];

    if (recentFrom) list = list.filter(t => t.date >= recentFrom);
    if (recentTo) list = list.filter(t => t.date <= recentTo);

    if (recentSearch.trim()) {
      const q = recentSearch.trim().toLowerCase();
      list = list.filter(t => (t.notes || '').toLowerCase().includes(q) || t.date.includes(q) || (String(t.totalSales - t.expenses)).includes(q));
    }

    if (netMin) {
      const min = parseFloat(netMin) || 0;
      list = list.filter(t => (t.totalSales - t.expenses) >= min);
    }
    if (netMax) {
      const max = parseFloat(netMax);
      if (!isNaN(max)) list = list.filter(t => (t.totalSales - t.expenses) <= max);
    }

    list.sort((a, b) => {
      let cmp = 0;
      if (recentSortBy === 'date') cmp = a.date.localeCompare(b.date);
      else if (recentSortBy === 'net') cmp = (a.totalSales - a.expenses) - (b.totalSales - b.expenses);
      else if (recentSortBy === 'notes') cmp = (a.notes || '').localeCompare(b.notes || '');

      return recentSortDir === 'desc' ? -cmp : cmp;
    });

    return list;
  }, [tx, recentFrom, recentTo, recentSearch, netMin, netMax, recentSortBy, recentSortDir]);

  return (
    <div className="space-y-6 animate-fade-in">
      <h2 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-slate-100 flex flex-col md:flex-row md:items-center gap-1 md:gap-3">
        Daily Finance
        <span className="text-sm md:text-lg font-normal text-slate-500 md:border-l md:border-slate-300 dark:md:border-slate-700 md:pl-3">
          {user?.tenantId && getBranchName(user.branchId || 'All')}
        </span>
      </h2>

      <div className="flex bg-slate-100 dark:bg-slate-800 rounded-lg p-1 w-fit">
        <button onClick={() => setView('ENTRY')} className={`px-4 py-2 rounded-md text-sm font-bold transition-all ${view === 'ENTRY' ? 'bg-white dark:bg-slate-600 shadow-md text-indigo-600 dark:text-indigo-300' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700'}`}>Data Entry</button>
        <button onClick={() => setView('RECENT')} className={`px-4 py-2 rounded-md text-sm font-bold transition-all ${view === 'RECENT' ? 'bg-white dark:bg-slate-600 shadow-md text-indigo-600 dark:text-indigo-300' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700'}`}>Recent Entries</button>
        <button onClick={() => setView('CHARTS')} className={`px-4 py-2 rounded-md text-sm font-bold transition-all ${view === 'CHARTS' ? 'bg-white dark:bg-slate-600 shadow-md text-indigo-600 dark:text-indigo-300' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700'}`}>Analytics</button>
      </div>

      {statusMsg && (
        <div className={`p-3 rounded-lg flex items-center gap-2 text-sm font-bold ${statusMsg.type === 'success' ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'}`}>
          {statusMsg.type === 'success' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
          {statusMsg.text}
        </div>
      )}

      {/* VIEW: DATA ENTRY */}
      {view === 'ENTRY' && (
        <div className="grid grid-cols-1 lg:grid-cols-1 gap-6">
          <Card className="p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                {editingId ? 'Edit Daily Entry' : 'Daily Transactions'}
              </h3>
              {editingId && (
                <button
                  onClick={cancelEdit}
                  className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-white transition"
                  title="Cancel Edit"
                >
                  <X size={20} />
                </button>
              )}
            </div>
            <form onSubmit={saveTransaction} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Date</label>
                  <div className="relative">
                    <input type="date" required value={date} onChange={e => setDate(e.target.value)} className="w-full p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 transition-colors" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Total Sales (Auto)</label>
                  <div className="relative">
                    <div className="w-full p-2 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800 rounded-lg font-bold text-indigo-700 dark:text-indigo-300 flex items-center h-[42px]">
                      {formatCurrency(currentTotalSales)}
                    </div>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Cash Sales</label>
                  <div className="relative">
                    <IndianRupee size={14} className="absolute left-3 top-3.5 text-slate-400" />
                    <input type="number" step="0.01" value={cash} onChange={e => setCash(e.target.value)} placeholder="0.00" className="w-full pl-8 p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 transition-colors" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">UPI / Card Sales</label>
                  <div className="relative">
                    <CreditCard size={14} className="absolute left-3 top-3.5 text-slate-400" />
                    <input type="number" step="0.01" value={online} onChange={e => setOnline(e.target.value)} placeholder="0.00" className="w-full pl-8 p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 transition-colors" />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Total Expenses</label>
                  <div className="relative">
                    <Briefcase size={14} className="absolute left-3 top-3.5 text-slate-400" />
                    <input type="number" step="0.01" value={exp} onChange={e => setExp(e.target.value)} placeholder="0.00" className="w-full pl-8 p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 transition-colors" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Cash in Drawer</label>
                  <div className="relative">
                    <IndianRupee size={14} className="absolute left-3 top-3.5 text-slate-400" />
                    <input type="number" step="0.01" value={drawerCash} onChange={e => setDrawerCash(e.target.value)} placeholder="Counted Cash" className="w-full pl-8 p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 transition-colors" />
                  </div>
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Notes</label>
                <input type="text" value={notes} onChange={e => setNotes(e.target.value)} placeholder="e.g. Electricity bill..." className="w-full p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 transition-colors" />
              </div>
              <button type="submit" className={`w-full py-3 ${editingId ? 'bg-indigo-700 hover:bg-indigo-600' : 'bg-indigo-600 hover:bg-indigo-500'} text-white rounded-lg font-bold transition shadow-lg flex items-center justify-center gap-2`}>
                {editingId ? <CheckCircle size={18} /> : <Plus size={18} />}
                {editingId ? 'Update Record' : 'Save Daily Record'}
              </button>
            </form>
          </Card>
        </div>
      )}

      {/* VIEW: ANALYTICS */}
      {view === 'CHARTS' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="p-6 lg:col-span-2">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
              <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2 underline underline-offset-8 decoration-indigo-500/30">
                <Activity size={18} className="text-indigo-600 dark:text-indigo-400" /> Financial Performance
              </h3>
              <div className="flex flex-wrap gap-2">
                {['DAILY', 'MONTHLY', 'YEARLY', 'CUSTOM'].map(p => (
                  <button key={p} onClick={() => setPeriod(p as PeriodType)} className={`px-3 py-1 rounded text-xs font-bold transition ${period === p ? 'bg-indigo-600 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'}`}>
                    {p === 'CUSTOM' ? 'Custom' : p.charAt(0) + p.slice(1).toLowerCase()}
                  </button>
                ))}
              </div>
            </div>

            {period === 'CUSTOM' && (
              <div className="flex gap-2 mb-4 p-2 bg-slate-50 dark:bg-slate-700/30 rounded border border-slate-200 dark:border-slate-700 text-sm">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-500 dark:text-slate-400">From:</span>
                  <input type="date" value={customStart} onChange={e => setCustomStart(e.target.value)} className="p-1 border border-slate-200 dark:border-slate-600 rounded bg-white dark:bg-slate-800 text-slate-900 dark:text-white" />
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-500 dark:text-slate-400">To:</span>
                  <input type="date" value={customEnd} onChange={e => setCustomEnd(e.target.value)} className="p-1 border border-slate-200 dark:border-slate-600 rounded bg-white dark:bg-slate-800 text-slate-900 dark:text-white" />
                </div>
              </div>
            )}

            <div className="h-[350px]">
              {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={theme === 'dark' ? '#334155' : '#e2e8f0'} />
                    <XAxis dataKey="label" fontSize={12} stroke={theme === 'dark' ? '#94a3b8' : '#64748b'} />
                    <YAxis fontSize={12} stroke={theme === 'dark' ? '#94a3b8' : '#64748b'} tickFormatter={val => `${val / 1000}k`} />
                    <Tooltip
                      contentStyle={{ backgroundColor: theme === 'dark' ? '#1e293b' : '#fff', borderRadius: '8px', border: theme === 'dark' ? '1px solid #334155' : '1px solid #e2e8f0', color: theme === 'dark' ? '#fff' : '#000' }}
                      formatter={(val: number) => formatCurrency(val)}
                    />
                    <Legend wrapperStyle={{ color: theme === 'dark' ? '#cbd5e1' : '#475569' }} />
                    <Bar dataKey="income" name="Total Sales" fill="#6366f1" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="expense" name="Expenses" fill="#f43f5e" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="profit" name="Net Profit" fill="#10b981" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-slate-400 dark:text-slate-600">
                  <Activity size={48} className="mb-2 opacity-20" />
                  <p>No data for this period.</p>
                </div>
              )}
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="font-bold text-lg text-slate-800 dark:text-white mb-4">
              Summary <span className="text-slate-400 dark:text-slate-500 font-medium text-sm">({period === 'CUSTOM' ? 'Custom Range' : period === 'MONTHLY' ? 'All Time (Monthly)' : 'All Time'})</span>
            </h3>
            <div className="space-y-4">
              <div className="p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl border border-indigo-100 dark:border-indigo-800">
                <div className="text-xs font-bold text-indigo-500 dark:text-indigo-400 uppercase mb-1">Total Sales</div>
                <div className="text-2xl font-black text-indigo-900 dark:text-indigo-100">{formatCurrency(summaryStats.sales)}</div>
              </div>
              <div className="p-4 bg-rose-50 dark:bg-rose-900/20 rounded-xl border border-rose-100 dark:border-rose-900/50">
                <div className="text-xs font-bold text-rose-500 dark:text-rose-400 uppercase mb-1">Total Expenses</div>
                <div className="text-2xl font-black text-rose-900 dark:text-rose-100">{formatCurrency(summaryStats.expenses)}</div>
              </div>
              <div className="p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl border border-emerald-100 dark:border-emerald-900/50">
                <div className="text-xs font-bold text-emerald-500 dark:text-emerald-400 uppercase mb-1">Net Profit</div>
                <div className="text-2xl font-black text-emerald-900 dark:text-emerald-100">{formatCurrency(summaryStats.profit)}</div>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* VIEW: RECENT ENTRIES */}
      {view === 'RECENT' && (
        <div className="grid grid-cols-1 gap-6">
          <Card className="p-0 overflow-hidden flex flex-col h-[600px]">
            <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <History size={18} /> Recent Entries
                </h3>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 text-slate-400" size={14} />
                  <input value={recentSearch} onChange={e => setRecentSearch(e.target.value)} placeholder="Search..." className="pl-8 p-2 text-xs border rounded bg-white dark:bg-slate-900 outline-none w-32 md:w-48" />
                </div>
                <input type="date" value={recentFrom} onChange={e => setRecentFrom(e.target.value)} className="p-2 text-xs border rounded bg-white dark:bg-slate-900" />
                <span className="text-slate-400">-</span>
                <input type="date" value={recentTo} onChange={e => setRecentTo(e.target.value)} className="p-2 text-xs border rounded bg-white dark:bg-slate-900" />

                <button onClick={() => { setRecentSearch(''); setRecentFrom(''); setRecentTo(''); setNetMin(''); setNetMax(''); setRecentSortBy('date'); setRecentSortDir('desc'); setSelectedRowId(null); }} className="px-3 py-2 text-xs font-bold bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 rounded text-slate-600 dark:text-slate-300 transition">
                  Clear
                </button>
              </div>
            </div>

            <div className="p-2 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700 flex gap-2 overflow-x-auto">
              <input type="number" placeholder="Min Net" value={netMin} onChange={e => setNetMin(e.target.value)} className="p-1.5 text-xs border rounded bg-white dark:bg-slate-900 w-24" />
              <input type="number" placeholder="Max Net" value={netMax} onChange={e => setNetMax(e.target.value)} className="p-1.5 text-xs border rounded bg-white dark:bg-slate-900 w-24" />
              <select value={recentSortBy} onChange={e => setRecentSortBy(e.target.value as any)} className="p-1.5 text-xs border rounded bg-white dark:bg-slate-900">
                <option value="date">Sort: Date</option>
                <option value="net">Sort: Net Amt</option>
                <option value="notes">Sort: Notes</option>
              </select>
              <button onClick={() => setRecentSortDir(d => d === 'asc' ? 'desc' : 'asc')} className="p-1.5 px-3 text-xs border rounded bg-white dark:bg-slate-900 font-bold">
                {recentSortDir === 'asc' ? '↑ Asc' : '↓ Desc'}
              </button>
            </div>

            <div className="flex-1 overflow-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-slate-50 dark:bg-slate-800 sticky top-0 z-10 shadow-sm">
                  <tr>
                    <th className="p-3 text-xs font-bold text-slate-500 uppercase tracking-wider w-[120px]">Date</th>
                    <th className="p-3 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Cash</th>
                    <th className="p-3 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Online</th>
                    <th className="p-3 text-xs font-bold text-slate-500 uppercase tracking-wider text-right text-indigo-600 dark:text-indigo-400">Total</th>
                    <th className="p-3 text-xs font-bold text-slate-500 uppercase tracking-wider text-right text-rose-600 dark:text-rose-400">Exp</th>
                    <th className="p-3 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Net</th>
                    <th className="p-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Notes</th>
                    <th className="p-3 text-xs font-bold text-slate-500 uppercase tracking-wider text-right w-[80px]">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                  {recentFiltered.length === 0 && (
                    <tr>
                      <td colSpan={8} className="p-8 text-center text-slate-400 text-sm">
                        No entries found matching your filters.
                      </td>
                    </tr>
                  )}
                  {recentFiltered.map((t) => (
                    <tr
                      key={t.id}
                      onClick={() => setSelectedRowId(t.id === selectedRowId ? null : t.id)}
                      className={`
                        group transition-colors cursor-pointer text-sm
                        ${selectedRowId === t.id ? 'bg-indigo-50 dark:bg-indigo-900/20' : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'}
                      `}
                    >
                      <td className="p-2 border-r border-transparent md:border-slate-100 dark:md:border-slate-800/50">
                        <div className="flex items-center gap-2">
                          <div className={`w-1.5 h-1.5 rounded-full ${t.synced === false ? 'bg-amber-500' : 'bg-emerald-500'}`} title={t.synced === false ? 'Pending Sync' : 'Synced'} />
                          <span className="font-medium text-slate-700 dark:text-slate-300">
                            {new Date(t.date).toLocaleDateString(undefined, { day: '2-digit', month: '2-digit', year: 'numeric' })}
                          </span>
                        </div>
                      </td>
                      <td className="p-2 text-right font-mono text-slate-600 dark:text-slate-400">
                        {t.cashSales > 0 ? formatCurrency(t.cashSales) : '-'}
                      </td>
                      <td className="p-2 text-right font-mono text-slate-600 dark:text-slate-400">
                        {t.onlineSales > 0 ? formatCurrency(t.onlineSales) : '-'}
                      </td>
                      <td className="p-2 text-right font-mono font-bold text-indigo-600 dark:text-indigo-400">
                        {formatCurrency(t.totalSales)}
                      </td>
                      <td className="p-2 text-right font-mono text-rose-500 dark:text-rose-400">
                        {t.expenses > 0 ? formatCurrency(t.expenses) : '-'}
                      </td>
                      <td className="p-2 text-right font-mono font-bold">
                        <span className={(t.totalSales - t.expenses) >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}>
                          {formatCurrency(t.totalSales - t.expenses)}
                        </span>
                      </td>
                      <td className="p-2 max-w-[200px] truncate text-slate-500 dark:text-slate-400" title={t.notes}>
                        {t.notes}
                      </td>
                      <td className="p-2 text-right">
                        <div className="flex items-center justify-end gap-1 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={(e) => { e.stopPropagation(); handleEdit(t); }}
                            className="p-1.5 text-indigo-500 hover:bg-indigo-100 dark:hover:bg-indigo-900/30 rounded"
                            title="Edit"
                          >
                            <Edit2 size={14} />
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); handleDelete(t.id); }}
                            className="p-1.5 text-rose-500 hover:bg-rose-100 dark:hover:bg-rose-900/30 rounded"
                            title="Delete"
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
          </Card>
        </div>
      )}
    </div>
  );
};
export default DailyFinanceTracker;

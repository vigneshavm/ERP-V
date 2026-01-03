
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
          <Card className="p-6">
            <div className="flex items-center justify-between mb-6 gap-3">
              <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2 underline underline-offset-8 decoration-indigo-500/30">
                <History size={18} /> Recent Entries
              </h3>
              <div className="flex items-center gap-2 w-full max-w-2xl">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-3 text-slate-400" />
                  <input value={recentSearch} onChange={e => setRecentSearch(e.target.value)} placeholder="Search notes, date or amount" className="w-full pl-10 p-2 border rounded bg-white dark:bg-slate-900 text-sm outline-none" />
                </div>
                <button onClick={() => { setRecentSearch(''); setRecentFrom(''); setRecentTo(''); setNetMin(''); setNetMax(''); setRecentSortBy('date'); setRecentSortDir('desc'); }} className="px-3 py-2 text-sm bg-slate-100 dark:bg-slate-700 rounded">Clear</button>
              </div>
            </div>

            <div className="flex gap-2 mb-4 flex-wrap">
              <input type="date" value={recentFrom} onChange={e => setRecentFrom(e.target.value)} className="p-2 border rounded text-sm" />
              <input type="date" value={recentTo} onChange={e => setRecentTo(e.target.value)} className="p-2 border rounded text-sm" />
              <input type="number" placeholder="Min net" value={netMin} onChange={e => setNetMin(e.target.value)} className="p-2 border rounded text-sm" />
              <input type="number" placeholder="Max net" value={netMax} onChange={e => setNetMax(e.target.value)} className="p-2 border rounded text-sm" />
              <select value={recentSortBy} onChange={e => setRecentSortBy(e.target.value as any)} className="p-2 border rounded text-sm">
                <option value="date">Date</option>
                <option value="net">Net Amount</option>
                <option value="notes">Notes</option>
              </select>
              <select value={recentSortDir} onChange={e => setRecentSortDir(e.target.value as any)} className="p-2 border rounded text-sm">
                <option value="desc">Desc</option>
                <option value="asc">Asc</option>
              </select>
            </div>

            <div className="flex-1 overflow-auto space-y-3 pr-2 custom-scrollbar max-h-[600px]">
              {recentFiltered.length === 0 && <div className="text-center py-10 text-slate-400">No records found.</div>}
              {recentFiltered.map(t => (
                <div key={t.id} className="p-3 bg-slate-50 dark:bg-slate-700/30 rounded-lg border border-slate-200 dark:border-slate-700 hover:shadow-md transition-all">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex flex-col">
                      <span className="text-xs font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1"><CalendarDays size={12} /> {new Date(t.date).toLocaleDateString()}</span>
                      <div className="flex items-center gap-2 mt-1">
                        {t.synced === false ? (
                          <span className="flex items-center gap-1 text-[10px] font-bold text-amber-600 bg-amber-50 dark:bg-amber-900/20 px-1.5 py-0.5 rounded">
                            <Clock size={10} /> Pending
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 px-1.5 py-0.5 rounded">
                            <CheckCircle size={10} /> Synced
                          </span>
                        )}
                      </div>
                    </div>
                    <span className={`text-xs font-bold px-2 py-0.5 rounded ${(t.totalSales - t.expenses) >= 0 ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'}`}>Net: {formatCurrency(t.totalSales - t.expenses)}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 dark:text-slate-300">
                    <div>Sales: <span className="font-bold text-indigo-600 dark:text-indigo-400">{formatCurrency(t.totalSales)}</span></div>
                    <div>Exp: <span className="font-bold text-rose-600 dark:text-rose-400">{formatCurrency(t.expenses)}</span></div>
                  </div>
                  {t.cashInDrawer > 0 && <div className="text-[10px] text-slate-400 mt-1 pt-1 border-t border-slate-200 dark:border-slate-600">Drawer: {formatCurrency(t.cashInDrawer)}</div>}

                  <div className="flex gap-2 mt-2 pt-2 border-t border-slate-100 dark:border-slate-700">
                    <button
                      onClick={() => handleEdit(t)}
                      className="flex-1 flex items-center justify-center gap-1 py-1 text-[10px] font-bold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded transition"
                    >
                      <Edit2 size={10} /> Edit
                    </button>
                    <button
                      onClick={() => handleDelete(t.id)}
                      className="flex-1 flex items-center justify-center gap-1 py-1 text-[10px] font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded transition"
                    >
                      <Trash2 size={10} /> Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};
export default DailyFinanceTracker;

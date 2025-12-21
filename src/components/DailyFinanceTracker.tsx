
import React, { useState, useEffect, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import { APP_CONFIG } from '../../config';
import {
  Briefcase, History, IndianRupee, Plus, CheckCircle,
  Activity, AlertCircle, CalendarDays, CreditCard
} from 'lucide-react';
import { Card } from './Card';
import { formatCurrency } from '../utils/helpers';

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
  const { theme } = useSelector((state: RootState) => state.auth);
  const [tx, setTx] = useState<TrackerTransaction[]>(() => {
    try {
      const saved = localStorage.getItem("omni_fin_tracker");
      if (saved && JSON.parse(saved).length > 0) return JSON.parse(saved);

      if (APP_CONFIG.IS_DEMO) {
        const subDays = (d: number) => {
          const date = new Date();
          date.setDate(date.getDate() - d);
          return date.toISOString().split('T')[0];
        };

        return [
          { id: 'dt1', date: subDays(0), cashSales: 12000, onlineSales: 8000, totalSales: 20000, expenses: 500, cashInDrawer: 11500, notes: 'Good footfall', timestamp: new Date().toISOString() },
          { id: 'dt2', date: subDays(1), cashSales: 15000, onlineSales: 5000, totalSales: 20000, expenses: 1500, cashInDrawer: 13500, notes: 'Paid electricity', timestamp: new Date().toISOString() },
          { id: 'dt3', date: subDays(2), cashSales: 8000, onlineSales: 12000, totalSales: 20000, expenses: 200, cashInDrawer: 7800, notes: 'Rainy day', timestamp: new Date().toISOString() },
          { id: 'dt4', date: subDays(3), cashSales: 20000, onlineSales: 15000, totalSales: 35000, expenses: 5000, cashInDrawer: 15000, notes: 'Weekend rush', timestamp: new Date().toISOString() },
        ];
      }
      return [];
    } catch (e) { return []; }
  });
  const [view, setView] = useState<'ENTRY' | 'CHARTS'>('ENTRY');

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

  // Auto-calc for form
  const currentTotalSales = (parseFloat(cash) || 0) + (parseFloat(online) || 0);

  useEffect(() => { localStorage.setItem("omni_fin_tracker", JSON.stringify(tx)); }, [tx]);

  const uid = () => crypto.randomUUID();

  const saveTransaction = (e: React.FormEvent) => {
    e.preventDefault();
    const newTx: TrackerTransaction = {
      id: uid(), date, cashSales: parseFloat(cash) || 0, onlineSales: parseFloat(online) || 0,
      totalSales: currentTotalSales, expenses: parseFloat(exp) || 0, cashInDrawer: parseFloat(drawerCash) || 0,
      notes: notes || '', timestamp: new Date().toISOString()
    };
    setTx(prev => [newTx, ...prev]);
    setCash(""); setOnline(""); setExp(""); setDrawerCash(""); setNotes("");
    setStatusMsg({ type: 'success', text: 'Record saved successfully!' });
    setTimeout(() => setStatusMsg(null), 3000);
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

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
          Daily Finance <span className="text-slate-500 text-base font-normal">/ Tracker</span>
        </h2>
        <div className="flex bg-slate-100 dark:bg-slate-700/50 rounded-lg p-1">
          <button onClick={() => setView('ENTRY')} className={`px-4 py-2 rounded-md text-sm font-bold transition ${view === 'ENTRY' ? 'bg-white dark:bg-slate-600 shadow text-indigo-600 dark:text-indigo-300' : 'text-slate-500 dark:text-slate-400'}`}>Data Entry</button>
          <button onClick={() => setView('CHARTS')} className={`px-4 py-2 rounded-md text-sm font-bold transition ${view === 'CHARTS' ? 'bg-white dark:bg-slate-600 shadow text-indigo-600 dark:text-indigo-300' : 'text-slate-500 dark:text-slate-400'}`}>Analytics</button>
        </div>
      </div>

      {statusMsg && (
        <div className={`p-3 rounded-lg flex items-center gap-2 text-sm font-bold ${statusMsg.type === 'success' ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'}`}>
          {statusMsg.type === 'success' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
          {statusMsg.text}
        </div>
      )}

      {/* VIEW: DATA ENTRY */}
      {view === 'ENTRY' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="p-6">
            <h3 className="font-bold text-lg text-slate-800 dark:text-white mb-4 flex items-center gap-2">Record Daily Transactions</h3>
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
              <button type="submit" className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-bold transition shadow-lg flex items-center justify-center gap-2">
                <Plus size={18} /> Save Daily Record
              </button>
            </form>
          </Card>

          <Card className="p-6 h-full flex flex-col">
            <h3 className="font-bold text-lg text-slate-800 dark:text-white mb-4 flex items-center gap-2"><History size={18} /> Recent Entries</h3>
            <div className="flex-1 overflow-auto space-y-3 pr-2 custom-scrollbar max-h-[450px]">
              {tx.length === 0 && <div className="text-center py-10 text-slate-400">No records found.</div>}
              {tx.slice(0, 10).map(t => (
                <div key={t.id} className="p-3 bg-slate-50 dark:bg-slate-700/30 rounded-lg border border-slate-200 dark:border-slate-700 hover:shadow-md transition-all">
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-xs font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1"><CalendarDays size={12} /> {new Date(t.date).toLocaleDateString()}</span>
                    <span className={`text-xs font-bold px-2 py-0.5 rounded ${(t.totalSales - t.expenses) >= 0 ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'}`}>Net: {formatCurrency(t.totalSales - t.expenses)}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 dark:text-slate-300">
                    <div>Sales: <span className="font-bold text-indigo-600 dark:text-indigo-400">{formatCurrency(t.totalSales)}</span></div>
                    <div>Exp: <span className="font-bold text-rose-600 dark:text-rose-400">{formatCurrency(t.expenses)}</span></div>
                  </div>
                  {t.cashInDrawer > 0 && <div className="text-[10px] text-slate-400 mt-1 pt-1 border-t border-slate-200 dark:border-slate-600">Drawer: {formatCurrency(t.cashInDrawer)}</div>}
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {/* VIEW: CHARTS */}
      {view === 'CHARTS' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="p-6 lg:col-span-2">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
              <h3 className="font-bold text-lg text-slate-800 dark:text-white flex items-center gap-2"><Activity size={18} className="text-indigo-600 dark:text-indigo-400" /> Financial Performance</h3>
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
    </div>
  );
};
export default DailyFinanceTracker;

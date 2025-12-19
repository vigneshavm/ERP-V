import React, { useState, useEffect, useMemo } from 'react';

import {
  Briefcase, History, Scissors, LogOut, Users,
  Receipt, Search, ShieldAlert,
  XCircle, User, DollarSign, Plus, Trash2, Save, CreditCard,
  Printer, X, Calculator, IndianRupee, Scan, CheckCircle, PenLine,
  Flame, Zap, ShoppingCart, Package, Lock, Tags, Percent, ArrowUpRight,
  CalendarDays, ArrowDownLeft, Loader2, List, BarChart3, CalendarIcon, TrendingUp
  , Truck, Landmark, ChevronLeft, Calendar, Activity, Check, Filter, Banknote,
  FileText, Clock,
  ChevronRight, CheckCircle2, ListChecks, CheckSquare, Wallet, TrendingDown,
  AlertCircle, FileText as FileTextIcon,
  Upload, AlertTriangle, PauseCircle, PlayCircle, RotateCcw,
  Smartphone, Monitor, Gift, QrCode, PieChart as PieChartIcon, FileSpreadsheet,
  AlertOctagon, ClipboardCheck,

} from 'lucide-react';

import { formatCurrency, getDaysInMonth, getFirstDayOfMonth, formatDateISO } from '../utils/helpers';


import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, CartesianGrid, Legend,
  ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";

interface TrackerTransaction {
  id: string;
  date: string;
  cashSales: number;
  onlineSales: number;
  totalSales: number; // New Field
  expenses: number;
  cashInDrawer: number; // New Field
  notes: string;
  timestamp: string;
}

const Card: React.FC<{ children: React.ReactNode, className?: string }> = ({ children, className }) => (
  <div className={`rounded-xl border border-slate-200 bg-white shadow-sm ${className}`}>
    {children}
  </div>
);

type PeriodType = 'DAILY' | 'MONTHLY' | 'YEARLY' | 'CUSTOM';

const FinanceTracker: React.FC = () => {
  const [tx, setTx] = useState<TrackerTransaction[]>(() => (localStorage.getItem("omni_fin_tracker"), []));
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
      notes, timestamp: new Date().toISOString()
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
    // For Daily/Monthly/Yearly, we show ALL history grouped by that period
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
    <div className="space-y-6">
      {/* Header & Tabs */}
      {/* <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-slate-200 shadow-sm"> */}

      <div className="flex bg-slate-100 rounded-lg p-1">
        <button onClick={() => setView('ENTRY')} className={`px-4 py-2 rounded-md text-sm font-bold transition ${view === 'ENTRY' ? 'bg-white shadow text-indigo-600' : 'text-slate-500'}`}>Data Entry</button>
        <button onClick={() => setView('CHARTS')} className={`px-4 py-2 rounded-md text-sm font-bold transition ${view === 'CHARTS' ? 'bg-white shadow text-indigo-600' : 'text-slate-500'}`}>Analytics</button>
      </div>
      {/* </div> */}

      {statusMsg && (
        <div className={`p-3 rounded-lg flex items-center gap-2 text-sm font-bold ${statusMsg.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
          {statusMsg.type === 'success' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
          {statusMsg.text}
        </div>
      )}

      {/* VIEW: DATA ENTRY */}
      {view === 'ENTRY' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="p-6">
            {/* <h3 className="font-bold text-lg text-slate-800 mb-4 flex items-center gap-2"><PenLine size={18}/> Daily Record</h3> */}
            <form onSubmit={saveTransaction} className="space-y-4">
              {/* <div className="grid grid-cols-2 gap-4">
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Date</label>
                <input type="date" required value={date} onChange={e => setDate(e.target.value)} className="w-full p-2 border rounded-lg outline-none focus:ring-2 focus:ring-indigo-500" />
              </div> */}
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-xs font-bold text-slate-500 uppercase mb-1">Date</label>
                  <div className="relative">
                    <DollarSign size={14} className="absolute left-3 top-3 text-slate-400" />
                    <input type="number" step="0.01" value={cash} onChange={e => setCash(e.target.value)} placeholder="0.00" className="w-full pl-8 p-2 border rounded-lg outline-none focus:ring-2 focus:ring-indigo-500" />
                  </div></div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Total Sales (Auto)</label>
                  <div className="relative">
                     <div className="w-full p-2 bg-indigo-50 border border-indigo-100 rounded-lg font-bold 
              text-indigo-700 flex items-center">
                <span className="mr-1">₹</span> {currentTotalSales.toFixed(2)}</div>
                </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-xs font-bold text-slate-500 uppercase mb-1">Cash Sales</label>
                  <div className="relative"><DollarSign size={14} className="absolute left-3 top-3 text-slate-400" /><input type="number" step="0.01" value={cash} onChange={e => setCash(e.target.value)} placeholder="0.00" className="w-full pl-8 p-2 border rounded-lg outline-none focus:ring-2 focus:ring-indigo-500" /></div></div>
                <div><label className="block text-xs font-bold text-slate-500 uppercase mb-1">UPI / Card Sales</label><div className="relative"><CreditCard size={14} className="absolute left-3 top-3 text-slate-400" /><input type="number" step="0.01" value={online} onChange={e => setOnline(e.target.value)} placeholder="0.00" className="w-full pl-8 p-2 border rounded-lg outline-none focus:ring-2 focus:ring-indigo-500" /></div></div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-xs font-bold text-slate-500 uppercase mb-1">Total Expenses</label><div className="relative"><Briefcase size={14} className="absolute left-3 top-3 text-slate-400" /><input type="number" step="0.01" value={exp} onChange={e => setExp(e.target.value)} placeholder="0.00" className="w-full pl-8 p-2 border rounded-lg outline-none focus:ring-2 focus:ring-indigo-500" /></div></div>
                <div><label className="block text-xs font-bold text-slate-500 uppercase mb-1">Cash in Drawer</label><div className="relative"><DollarSign size={14} className="absolute left-3 top-3 text-slate-400" /><input type="number" step="0.01" value={drawerCash} onChange={e => setDrawerCash(e.target.value)} placeholder="Counted Cash" className="w-full pl-8 p-2 border rounded-lg outline-none focus:ring-2 focus:ring-indigo-500" /></div></div>
              </div>
              <div><label className="block text-xs font-bold text-slate-500 uppercase mb-1">Notes</label><input type="text" value={notes} onChange={e => setNotes(e.target.value)} placeholder="e.g. Electricity bill..." className="w-full p-2 border rounded-lg outline-none focus:ring-2 focus:ring-indigo-500" /></div>
              <button type="submit" className="w-full py-3 bg-indigo-600 text-white rounded-lg font-bold hover:bg-indigo-700 transition shadow-lg flex items-center justify-center gap-2"><Plus size={18} /> Save Daily Record</button>
            </form>
          </Card>
          <Card className="p-6 h-full flex flex-col">
            <h3 className="font-bold text-lg text-slate-800 mb-4 flex items-center gap-2"><History size={18} /> Recent Entries</h3>
            <div className="flex-1 overflow-auto space-y-3 pr-2 custom-scrollbar max-h-[400px]">
              {tx.length === 0 && <div className="text-center py-10 text-slate-400">No records found.</div>}
              {tx.slice(0, 10).map(t => (
                <div key={t.id} className="p-3 bg-slate-50 rounded-lg border border-slate-200 hover:shadow-sm transition">
                  <div className="flex justify-between items-start mb-2"><span className="text-xs font-bold text-slate-500 flex items-center gap-1"><CalendarDays size={12} /> {new Date(t.date).toLocaleDateString()}</span><span className={`text-xs font-bold px-2 py-0.5 rounded ${(t.totalSales - t.expenses) >= 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>Net: {formatCurrency(t.totalSales - t.expenses)}</span></div>
                  <div className="grid grid-cols-2 gap-2 text-xs text-slate-600"><div>Sales: <span className="font-bold text-indigo-600">{formatCurrency(t.totalSales)}</span></div><div>Exp: <span className="font-bold text-rose-600">{formatCurrency(t.expenses)}</span></div></div>
                  {t.cashInDrawer > 0 && <div className="text-[10px] text-slate-400 mt-1">Drawer: {formatCurrency(t.cashInDrawer)}</div>}
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
              <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2"><Activity size={18} className="text-indigo-600" /> Financial Performance</h3>
              <div className="flex flex-wrap gap-2">
                {['DAILY', 'MONTHLY', 'YEARLY', 'CUSTOM'].map(p => (
                  <button key={p} onClick={() => setPeriod(p as PeriodType)} className={`px-3 py-1 rounded text-xs font-bold transition ${period === p ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
                    {p === 'CUSTOM' ? 'Custom' : p.charAt(0) + p.slice(1).toLowerCase()}
                  </button>
                ))}
              </div>
            </div>

            {period === 'CUSTOM' && (
              <div className="flex gap-2 mb-4 p-2 bg-slate-50 rounded border border-slate-200 text-sm">
                <div className="flex items-center gap-2"><span className="text-xs font-bold text-slate-500">From:</span><input type="date" value={customStart} onChange={e => setCustomStart(e.target.value)} className="p-1 border rounded bg-white" /></div>
                <div className="flex items-center gap-2"><span className="text-xs font-bold text-slate-500">To:</span><input type="date" value={customEnd} onChange={e => setCustomEnd(e.target.value)} className="p-1 border rounded bg-white" /></div>
              </div>
            )}

            <div className="h-[350px]">
              {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="label" fontSize={12} stroke="#94a3b8" />
                    <YAxis fontSize={12} stroke="#94a3b8" tickFormatter={val => `${val / 1000}k`} />
                    <Tooltip
                      contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                      formatter={(val: number) => formatCurrency(val)}
                    />
                    <Legend />
                    <Bar dataKey="income" name="Total Sales" fill="#4f46e5" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="expense" name="Expenses" fill="#f43f5e" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="profit" name="Net Profit" fill="#10b981" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-slate-400">
                  <BarChart3 size={48} className="mb-2 opacity-20" />
                  <p>No data for this period.</p>
                </div>
              )}
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="font-bold text-lg text-slate-800 mb-4">
              Summary <span className="text-slate-400 font-medium text-sm">({period === 'CUSTOM' ? 'Custom Range' : period === 'MONTHLY' ? 'All Time (Monthly)' : 'All Time'})</span>
            </h3>
            <div className="space-y-4">
              <div className="p-4 bg-indigo-50 rounded-xl border border-indigo-100">
                <div className="text-xs font-bold text-indigo-500 uppercase mb-1">Total Sales</div>
                <div className="text-2xl font-black text-indigo-900">{formatCurrency(summaryStats.sales)}</div>
              </div>
              <div className="p-4 bg-rose-50 rounded-xl border border-rose-100">
                <div className="text-xs font-bold text-rose-500 uppercase mb-1">Total Expenses</div>
                <div className="text-2xl font-black text-rose-900">{formatCurrency(summaryStats.expenses)}</div>
              </div>
              <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-100">
                <div className="text-xs font-bold text-emerald-500 uppercase mb-1">Net Profit</div>
                <div className="text-2xl font-black text-emerald-900">{formatCurrency(summaryStats.profit)}</div>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};
export default FinanceTracker;
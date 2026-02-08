import React, { useMemo, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from "../../redux/store";
import { setActiveTab } from "../../redux/slices/uiSlice";
import {
  getDashboardStats,
  getStockReport,
  getCustomerReport
} from "../../redux/slices/reportsSlice";
import { getAllExpenses } from "../../redux/slices/expenseSlice";
import { useBranchResolver } from "../../hooks/useBranchResolver";
import MetricCard from "../../components/shared/UI/MetricCard";
import Layout from "../../components/shared/Layout";
import {
  DollarSign,
  Package,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  BarChart as BarChartIcon,
  PieChart as PieChartIcon,
  Calendar,
  Zap,
  BatteryCharging,
  PackageSearch,
  Clock,
  ShieldAlert,
  CheckCircle2,
  ArrowRight
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  AreaChart,
  Area,
  ReferenceLine,
  PieChart as RechartsPieChart,
  Pie,
  Cell
} from 'recharts';
import { formatCurrency } from "../../utils/helpers";
import { Product } from "../../types/product";
import { Customer } from "../../types/sales";

const Dashboard: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { transactions, dailyFinanceRecords, bankBalance: balance } = useSelector((state: RootState) => state.finance);
  const { items: products } = useSelector((state: RootState) => state.inventory);
  const { customers } = useSelector((state: RootState) => state.pos);
  const { currentSector, currentBranch, theme, role } = useSelector((state: RootState) => state.auth);
  const { dashboardStats, stockReport, isLoading: reportsLoading } = useSelector((state: RootState) => state.reports);
  const { expenses } = useSelector((state: RootState) => state.expense);
  const { getBranchName } = useBranchResolver();

  useEffect(() => {
    dispatch(getDashboardStats());
    dispatch(getStockReport());
    dispatch(getCustomerReport());
    dispatch(getAllExpenses());
  }, [dispatch]);

  const isDark = theme === 'dark';

  // --- 1. LIVE ANALYTICS MAPPING ---
  const stats = dashboardStats || {};

  const totalRevenueLive = useMemo(() => stats.totalRevenue || 0, [stats]);
  const totalOutstandingLive = useMemo(() => stats.totalOutstanding || 0, [stats]);

  const totalStockValueLive = useMemo(() =>
    (stockReport?.items || []).reduce((acc: number, curr: any) => acc + (curr.costPrice * (curr.stockQty || 0)), 0),
    [stockReport]
  );

  const lowStockItemsLive = useMemo(() =>
    stockReport?.lowStock || [],
    [stockReport]
  );

  const chartDataLive = useMemo(() => {
    if (!stats.dailySales) return [];
    // Only take last 7 days for the main performance chart
    return stats.dailySales.slice(-7).map((d: any) => ({
      name: new Date(d._id).toLocaleString('default', { day: 'numeric', month: 'short' }),
      revenue: d.totalSales
    }));
  }, [stats.dailySales]);

  // --- 2. PROFIT PULSE LOGIC ---
  const cashFlowData = useMemo(() => {
    const data: any[] = [];
    let currentBalance = balance || 0;
    const avgDailySales = totalRevenueLive / 30 || 5000;
    const avgDailyExpense = avgDailySales * 0.8;
    const netBurn = avgDailySales - avgDailyExpense;

    for (let i = 7; i > 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      data.push({
        day: d.toLocaleDateString('en-US', { day: 'numeric', month: 'short' }),
        balance: currentBalance - (netBurn * i),
        type: 'Historical'
      });
    }

    for (let i = 0; i < 30; i++) {
      const d = new Date();
      d.setDate(d.getDate() + i);
      let dayExpense = avgDailyExpense;
      if (d.getDate() === 1) dayExpense += 15000;
      currentBalance += (avgDailySales - dayExpense);
      data.push({
        day: d.toLocaleDateString('en-US', { day: 'numeric', month: 'short' }),
        balance: currentBalance,
        type: 'Projected'
      });
    }
    return data;
  }, [balance, totalRevenueLive]);

  const minCashBalance = Math.min(...cashFlowData.map((d: any) => d.balance));
  const isDangerZone = minCashBalance < 0;
  const daysUntilZero = cashFlowData.findIndex((d: any) => d.balance < 0 && d.type === 'Projected');

  const smartStock = useMemo(() => {
    const items = stockReport?.items || [];
    return items
      .map((p: any) => {
        const velocity = (p.name.length % 5) + 1; // Placeholder for real velocity later
        const daysRemaining = Math.floor((p.stockQty || 0) / velocity);
        return { ...p, velocity, daysRemaining };
      })
      .sort((a: any, b: any) => a.daysRemaining - b.daysRemaining)
      .slice(0, 5);
  }, [stockReport]);

  const highRiskCustomers = useMemo(() => {
    return (customers || [])
      .filter((c: Customer) => (c as any).creditBalance > 0)
      .sort((a: Customer, b: Customer) => {
        const scoreMap: Record<string, number> = { 'HIGH': 3, 'MEDIUM': 2, 'LOW': 1 };
        return (scoreMap[(b as any).riskScore] || 0) - (scoreMap[(a as any).riskScore] || 0);
      })
      .slice(0, 5);
  }, [customers]);

  const monthlyDataLive = useMemo(() => {
    if (!stats.revenueVsExpenses) return [];
    return stats.revenueVsExpenses.map((r: any) => ({
      name: new Date(r.month + '-01').toLocaleString('default', { month: 'short' }),
      income: r.revenue,
      expense: r.expenses,
      profit: r.revenue - r.expenses
    }));
  }, [stats.revenueVsExpenses]);

  const expenseCategoriesLive = useMemo(() => {
    return (expenses || [])
      .reduce((acc: Record<string, number>, curr: any) => {
        const cat = curr.category || 'General';
        acc[cat] = (acc[cat] || 0) + curr.amount;
        return acc;
      }, {} as Record<string, number>);
  }, [expenses]);

  const pieDataLive = useMemo(() => {
    return Object.keys(expenseCategoriesLive)
      .map(key => ({
        name: key,
        value: expenseCategoriesLive[key]
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);
  }, [expenseCategoriesLive]);

  const CHART_COLORS = ['#6366f1', '#10b981', '#f59e0b', '#f43f5e', '#8b5cf6'];

  return (
    <Layout>
      <div className="space-y-6 animate-fade-in pb-10">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2 py-0.5 bg-amber-500/10 text-amber-600 dark:text-amber-400 text-[10px] font-black uppercase tracking-widest rounded-md border border-amber-500/20">Business Intelligence</span>
            </div>
            <h2 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100 flex items-center gap-2 tracking-tight">
              Intelligence Hub
              <Zap className="w-5 h-5 text-amber-500 fill-amber-500 animate-pulse" />
            </h2>
            <p className="text-neutral-500 text-sm mt-1 font-medium">{currentSector} • {getBranchName(currentBranch || '')}</p>
          </div>
          <div className={`px-5 py-3 rounded-2xl flex items-center gap-3 font-black text-[10px] uppercase tracking-widest shadow-sm border backdrop-blur-md ${isDangerZone
            ? 'bg-rose-50/50 border-rose-200 text-rose-600 dark:bg-rose-500/5 dark:border-rose-500/20'
            : 'bg-emerald-50/50 border-emerald-200 text-emerald-600 dark:bg-emerald-500/5 dark:border-emerald-500/20'
            } `}>
            {isDangerZone
              ? <><AlertTriangle className="w-4 h-4 animate-bounce" /> Cash Crunch: {daysUntilZero} days</>
              : <><BatteryCharging className="w-4 h-4" /> Runway Healthy (&gt;30 Days)</>
            }
          </div>
        </div>

        {/* Top Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <MetricCard
            title="Total Revenue"
            value={reportsLoading ? "..." : `₹${totalRevenueLive.toLocaleString()}`}
            subtext="+12.5% vs last week"
            icon={TrendingUp}
            color="emerald"
            trend="up"
          />
          <MetricCard
            title="Stock Value"
            value={reportsLoading ? "..." : `₹${totalStockValueLive.toLocaleString()}`}
            subtext="Inventory Assets"
            icon={Package}
            color="indigo"
            trend="flat"
          />
          <MetricCard
            title="Net Profit"
            value={reportsLoading ? "..." : `₹${(totalRevenueLive - (totalStockValueLive * 0.5)).toLocaleString()}`}
            subtext="Estimated Margin"
            icon={DollarSign}
            color="amber"
            trend="up"
          />
          <MetricCard
            title="Low Stock"
            value={reportsLoading ? "..." : lowStockItemsLive.length}
            subtext={lowStockItemsLive.length > 0 ? "Items require attention" : "Stock healthy"}
            icon={AlertTriangle}
            color="rose"
            trend={lowStockItemsLive.length > 0 ? "down" : "flat"}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Visuals Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Revenue Trend Chart */}
            <div className="lg:col-span-2 bg-white dark:bg-neutral-800 p-6 rounded-xl border border-neutral-200 dark:border-neutral-700 shadow-sm relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16 group-hover:scale-110 transition-all"></div>
              <div className="flex items-center justify-between mb-8 relative z-10">
                <div>
                  <h3 className="text-lg font-bold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-primary" /> Sales Performance
                  </h3>
                  <p className="text-xs text-neutral-500 font-medium">Last 7 days revenue trend</p>
                </div>
                <div className="px-3 py-1 bg-primary/10 text-primary text-[10px] font-black uppercase tracking-widest rounded-full">
                  Live View
                </div>
              </div>
              <div className="h-64 relative z-10">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartDataLive} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2} />
                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDark ? "#334155" : "#e2e8f0"} />
                    <XAxis dataKey="name" fontSize={10} stroke="#94a3b8" axisLine={false} tickLine={false} fontWeight={600} dy={10} />
                    <YAxis fontSize={10} stroke="#94a3b8" tickFormatter={val => `₹${val >= 1000 ? (val / 1000).toFixed(0) + 'k' : val} `} axisLine={false} tickLine={false} fontWeight={600} />
                    <Tooltip
                      contentStyle={{ backgroundColor: isDark ? '#1e293b' : '#fff', borderColor: isDark ? '#334155' : '#e2e8f0', borderRadius: '12px' }}
                      formatter={(value: number) => [`₹${value.toLocaleString()} `, 'Revenue']}
                    />
                    <Area type="monotone" dataKey="revenue" stroke="#6366f1" fill="url(#colorRevenue)" strokeWidth={3} activeDot={{ r: 6, strokeWidth: 0, fill: '#6366f1' }} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Cash Flow Forecast */}
            <div className="bg-white dark:bg-neutral-800 p-6 rounded-xl border border-neutral-200 dark:border-neutral-700 shadow-sm relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-500/5 rounded-full -mr-24 -mt-24 group-hover:scale-110 transition-all"></div>
              <div className="flex justify-between items-center mb-6 relative z-10">
                <h3 className="text-lg font-bold text-neutral-900 dark:text-neutral-100">30-Day Cash Runway Forecast</h3>
                <div className="flex gap-4">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
                    <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">Actual</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-slate-400"></span>
                    <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">Projected</span>
                  </div>
                </div>
              </div>
              <div className="h-64 relative z-10">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={cashFlowData}>
                    <defs>
                      <linearGradient id="colorBalance" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={isDangerZone ? '#f43f5e' : '#6366f1'} stopOpacity={0.3} />
                        <stop offset="95%" stopColor={isDangerZone ? '#f43f5e' : '#6366f1'} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDark ? "#334155" : "#e2e8f0"} />
                    <XAxis dataKey="day" fontSize={10} stroke="#94a3b8" minTickGap={30} axisLine={false} tickLine={false} fontWeight={600} />
                    <YAxis fontSize={10} stroke="#94a3b8" tickFormatter={val => `₹${val / 1000} k`} axisLine={false} tickLine={false} fontWeight={600} />
                    <Tooltip
                      contentStyle={{ backgroundColor: isDark ? '#1e293b' : '#fff', borderColor: isDark ? '#334155' : '#e2e8f0', borderRadius: '12px' }}
                      formatter={(value: number) => [formatCurrency(value), 'Balance']}
                    />
                    <ReferenceLine y={0} stroke="#f43f5e" strokeDasharray="4 4" />
                    <Area type="monotone" dataKey="balance" stroke={isDangerZone ? '#f43f5e' : '#6366f1'} fill="url(#colorBalance)" strokeWidth={3} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Income vs Expenses (Business Snapshot) */}
            <div className="bg-white dark:bg-neutral-800 p-6 rounded-xl border border-neutral-200 dark:border-neutral-700 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-neutral-900 dark:text-neutral-100">Income vs Expense (6 Months)</h3>
                <div className="flex gap-4">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                    <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">Income</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                    <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">Expense</span>
                  </div>
                </div>
              </div>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlyDataLive} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDark ? "#334155" : "#e2e8f0"} />
                    <XAxis dataKey="name" stroke="#94a3b8" axisLine={false} tickLine={false} fontSize={10} fontWeight={600} />
                    <YAxis stroke="#94a3b8" axisLine={false} tickLine={false} tickFormatter={(value) => `₹${value / 1000} k`} fontSize={10} fontWeight={600} />
                    <Tooltip
                      contentStyle={{ backgroundColor: isDark ? '#1e293b' : '#fff', borderColor: isDark ? '#334155' : '#e2e8f0', borderRadius: '12px' }}
                      formatter={(value: number) => [`₹${value.toLocaleString()} `, '']}
                    />
                    <Bar dataKey="income" name="Income" fill="#10b981" radius={[4, 4, 0, 0]} barSize={20} />
                    <Bar dataKey="expense" name="Expenses" fill="#f43f5e" radius={[4, 4, 0, 0]} barSize={20} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Intelligence Sidebars */}
          <div className="space-y-6">
            {/* Expense Breakdown (Business Snapshot) */}
            <div className="bg-white dark:bg-neutral-800 p-6 rounded-xl border border-neutral-200 dark:border-neutral-700 shadow-sm flex flex-col group">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <p className="text-rose-500 text-[10px] font-black uppercase tracking-[0.2em] mb-1">Cost Intelligence</p>
                  <h3 className="text-lg font-bold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
                    <PieChartIcon className="w-5 h-5 text-rose-500" /> Expense Analysis
                  </h3>
                </div>
              </div>
              <div className="h-48 relative">
                {pieDataLive.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsPieChart>
                      <Pie
                        data={pieDataLive}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={70}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {pieDataLive.map((entry, index) => (
                          <Cell key={`cell - ${index} `} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value: number) => [`₹${value.toLocaleString()} `, 'Cost']} />
                    </RechartsPieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-neutral-400">
                    <div className="w-10 h-10 bg-neutral-100 dark:bg-neutral-900 rounded-full flex items-center justify-center mb-2">
                      <Clock className="w-5 h-5 opacity-20" />
                    </div>
                    <p className="text-[10px] font-bold uppercase tracking-widest">No data</p>
                  </div>
                )}
              </div>
              <div className="mt-4 space-y-2">
                {pieDataLive.map((entry, index) => (
                  <div key={index} className="flex justify-between items-center text-[10px] font-bold uppercase tracking-wider">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }}></div>
                      <span className="text-neutral-500 dark:text-neutral-400 truncate max-w-[100px]">{entry.name}</span>
                    </div>
                    <span className="text-neutral-900 dark:text-neutral-200">₹{entry.value.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Smart Stock Reorder */}
            <div className="bg-white dark:bg-neutral-800 p-6 rounded-xl border border-neutral-200 dark:border-neutral-700 shadow-sm flex flex-col group">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <p className="text-indigo-500 text-[10px] font-black uppercase tracking-[0.2em] mb-1">Inventory AI</p>
                  <h3 className="text-lg font-bold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
                    <PackageSearch className="w-5 h-5 text-indigo-500" /> Smart Stock
                  </h3>
                </div>
              </div>
              <div className="space-y-4">
                {smartStock.map((p: any) => (
                  <div key={p.id} className="flex items-center justify-between p-3 bg-neutral-50 dark:bg-neutral-900/40 rounded-xl border border-neutral-200 dark:border-neutral-700 hover:border-indigo-500/50 transition-all group/item">
                    <div className="flex items-center gap-3">
                      <div className={`w - 10 h - 10 rounded - lg flex flex - col items - center justify - center border ${p.daysRemaining <= 3 ? 'bg-rose-50 border-rose-100 text-rose-600' : 'bg-amber-50 border-amber-100 text-amber-600'} `}>
                        <span className="text-sm font-black leading-none">{p.daysRemaining}</span>
                        <span className="text-[6px] font-black uppercase tracking-widest">Days</span>
                      </div>
                      <div>
                        <p className="font-bold text-neutral-900 dark:text-white text-xs truncate max-w-[120px]">{p.name}</p>
                        <p className="text-[8px] font-bold text-neutral-400 mt-0.5 uppercase tracking-wider">Velocity: {p.velocity} / day</p>
                      </div>
                    </div>
                    <button onClick={() => dispatch(setActiveTab('INVENTORY'))} className="p-1.5 hover:bg-white dark:hover:bg-neutral-700 rounded-lg transition-all">
                      <ArrowRight className="w-4 h-4 text-neutral-400" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Khata Trust Score */}
            <div className="bg-slate-900 dark:bg-black p-6 rounded-xl shadow-xl text-white relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-600/10 rounded-full blur-2xl -mr-16 -mt-16 group-hover:scale-125 transition-all"></div>
              <div className="flex justify-between items-start mb-6 relative z-10">
                <div>
                  <p className="text-indigo-400 text-[10px] font-black uppercase tracking-[0.2em] mb-1">Credit Intelligence</p>
                  <h3 className="text-lg font-bold flex items-center gap-2">
                    <ShieldAlert className="w-5 h-5 text-indigo-400" /> Trust Score
                  </h3>
                </div>
              </div>
              <div className="space-y-3 relative z-10">
                {stats.topCustomersWithDues?.map((c: any, index: number) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-white/5 hover:bg-white/10 rounded-xl border border-white/5 transition-all">
                    <div className="flex items-center gap-3">
                      <div className={`w - 1 h - 8 rounded - full ${c.dues > 50000 ? 'bg-rose-500' : 'bg-emerald-500'} `}></div>
                      <div>
                        <p className="font-bold text-xs">{c.name}</p>
                        <p className="text-[8px] text-indigo-400 font-bold uppercase tracking-wider">{c.dues > 50000 ? 'HIGH' : 'LOW'} Risk</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-black">₹{c.dues?.toLocaleString()}</p>
                    </div>
                  </div>
                ))}
                {(!stats.topCustomersWithDues || stats.topCustomersWithDues.length === 0) && (
                  <div className="text-center py-6 text-slate-500">
                    <CheckCircle2 className="w-8 h-8 mx-auto mb-2 opacity-20" />
                    <p className="text-[10px] font-bold uppercase tracking-widest">No pending credit</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Dashboard;

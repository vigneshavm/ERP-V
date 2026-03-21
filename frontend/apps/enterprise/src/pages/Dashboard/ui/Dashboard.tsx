import { useAuthStore } from '@repo/shared';
import React, { useMemo, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from "@/app/store/store";
import {
  getDashboardStats,
  getStockReport,
  getCustomerReport
} from "@/widgets/stats-dashboard/model/reportsSlice";
import { getAllExpenses } from "@/features/expense-tracking/model/expenseSlice";
import { getSupplierAnalytics } from "@/entities/contact/model/supplierSlice";
import { useBranchResolver } from "@/hooks/useBranchResolver";
import { useERPDashboard, DashboardStats } from '@repo/shared';
import Layout from "@/shared/ui/Layout/Layout";
import {
  RotateCcw,
  ArrowUp,
  ArrowDown,
  Plus,
  Briefcase,
  Wallet,
  Package,
  Clock
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell
} from 'recharts';

const Dashboard: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { transactions, bankBalance: balance } = useSelector((state: RootState) => state.finance);
  const { currentSector } = useAuthStore();
  const { getBranchName, currentBranchId } = useBranchResolver();
  const { stats: dashboardStats, stockReport, loading: reportsLoading, refresh: refreshDashboard } = useERPDashboard();

  const sectorName = currentSector || 'All Branches';

  useEffect(() => {
    dispatch(getCustomerReport());
    dispatch(getAllExpenses());
    const interval = setInterval(() => {
      refreshDashboard();
    }, 30000);
    return () => clearInterval(interval);
  }, [dispatch, refreshDashboard]);

  const handleRefresh = () => {
    refreshDashboard();
    dispatch(getCustomerReport());
    dispatch(getAllExpenses());
  };

  const defaultStats: DashboardStats = {
    totalRevenue: 2470000, 
    totalOutstanding: 320000,
    totalBalance: 1840000,
    totalProfit: 0,
    dailySales: [],
    revenueVsExpenses: []
  };
  
  const stats = dashboardStats || defaultStats;
  const totalRevenue = useMemo(() => stats.totalRevenue || 0, [stats]);
  const totalOutstanding = useMemo(() => stats.totalOutstanding || 0, [stats]);
  const totalBalance = useMemo(() => balance || stats.totalBalance || 0, [balance, stats]);
  const totalStockValue = useMemo(() =>
    (stockReport?.items || []).reduce((acc: number, curr: any) => acc + (curr.costPrice * (curr.stockQty || 0)), 0) || 4120000,
    [stockReport]
  );

  const chartData = useMemo(() => {
    const rawData = stats.dailySales || [];
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    
    if (rawData.length === 0) {
        return days.map(d => ({ name: d, revenue: Math.floor(Math.random() * 50000) + 100000 }));
    }

    return rawData.slice(-7).map((d: any, i: number) => ({
      name: days[i] || new Date(d._id).toLocaleString('default', { day: 'numeric', month: 'short' }),
      revenue: d.totalSales
    }));
  }, [stats.dailySales]);

  const formatCurrency = (val: number) => {
    if (val >= 100000) return `₹${(val / 100000).toFixed(1)}L`;
    return `₹${val.toLocaleString()}`;
  };

  return (
    <Layout>
      <div className="page-shell">
        
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-4xl font-extrabold tracking-tight mb-1 opacity-95">Dashboard</h1>
            <p className="text-sm font-medium text-main/40 flex items-center gap-2">
              Neural Retail Co • {sectorName} • <span className="text-green-500 font-bold">Live</span>
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-xs font-semibold text-muted mr-4">
              <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse shadow-[0_0_8px_#22c55e]" />
              Live • updated 2m ago
            </div>
            <button 
              onClick={handleRefresh}
              className="px-4 py-2 erp-card text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 hover:bg-white/10 active:scale-95 transition-all text-secondary"
            >
              <RotateCcw size={14} className={reportsLoading ? 'animate-spin text-purple-400' : ''} />
              Refresh
            </button>
            <button className="btn btn-primary text-[10px] uppercase tracking-widest">
              <Plus size={16} />
              New Sale
            </button>
          </div>
        </div>

        {/* Top Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {/* Revenue */}
          <div className="erp-card p-6 flex flex-col justify-between group">
            <div className="flex justify-between items-start mb-6">
              <span className="premium-stat-label">Revenue MTD</span>
              <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center text-orange-500 border border-orange-500/20 shadow-[0_0_15px_rgba(249,115,22,0.1)]">
                 <Briefcase size={18} />
              </div>
            </div>
            <div>
              <div className="premium-stat-value mb-1">{formatCurrency(totalRevenue)}</div>
              <div className="text-[10px] font-bold text-green-400 flex items-center gap-1 uppercase tracking-wider">
                <ArrowUp size={10} strokeWidth={3} /> 18% vs last month
              </div>
            </div>
          </div>

          {/* Dues */}
          <div className="erp-card p-6 flex flex-col justify-between">
            <div className="flex justify-between items-start mb-6">
              <span className="premium-stat-label">Outstanding Dues</span>
              <div className="w-10 h-10 rounded-xl bg-red-400/10 flex items-center justify-center text-red-400 border border-red-400/20 shadow-[0_0_15px_rgba(248,113,113,0.1)]">
                <Clock size={18} />
              </div>
            </div>
            <div>
              <div className="premium-stat-value mb-1">{formatCurrency(totalOutstanding)}</div>
              <div className="text-[10px] font-bold text-orange-400 flex items-center gap-1 uppercase tracking-wider">
                4% pending collection
              </div>
            </div>
          </div>

          {/* Bank */}
          <div className="erp-card p-6 flex flex-col justify-between">
            <div className="flex justify-between items-start mb-6">
              <span className="premium-stat-label">Bank Balance</span>
              <div className="w-10 h-10 rounded-xl bg-blue-400/10 flex items-center justify-center text-blue-400 border border-blue-400/20 shadow-[0_0_15px_rgba(96,165,250,0.1)]">
                <Wallet size={18} />
              </div>
            </div>
            <div>
              <div className="premium-stat-value mb-1">{formatCurrency(totalBalance)}</div>
              <div className="text-[10px] font-bold text-green-400 flex items-center gap-1 uppercase tracking-wider">
                <ArrowUp size={10} strokeWidth={3} /> 6% vs yesterday
              </div>
            </div>
          </div>

          {/* Stock */}
          <div className="erp-card p-6 flex flex-col justify-between">
            <div className="flex justify-between items-start mb-6">
              <span className="premium-stat-label">Stock Value</span>
              <div className="w-10 h-10 rounded-xl bg-amber-700/10 flex items-center justify-center text-amber-700 border border-amber-700/20 shadow-[0_0_15px_rgba(180,83,9,0.1)]">
                <Package size={18} />
              </div>
            </div>
            <div>
              <div className="premium-stat-value mb-1">{formatCurrency(totalStockValue)}</div>
              <div className="text-[10px] font-bold text-muted flex items-center gap-1 uppercase tracking-wider">
                142 SKUs • 3 low stock
              </div>
            </div>
          </div>
        </div>

        {/* Middle Section: Chart and Bank Summary */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Sales Chart */}
          <div className="lg:col-span-2 erp-card p-6 flex flex-col">
            <div className="flex justify-between items-center mb-10">
              <div className="flex items-center gap-3">
                <h3 className="text-lg font-bold tracking-tight">Sales • Last 7 Days</h3>
                <span className="px-2 py-0.5 bg-indigo-500/20 text-[indigo-400] text-[9px] font-black uppercase rounded border border-indigo-500/30">Live</span>
              </div>
              <div className="flex gap-2">
                {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(d => (
                   <span key={d} className={`text-[10px] font-bold px-1 transition-all ${d === 'Sun' ? 'text-indigo-400' : 'text-muted'}`}>{d}</span>
                ))}
              </div>
            </div>
            <div className="h-64 sm:h-72 w-full mt-auto">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="0 0" vertical={false} stroke="var(--erp-card-border)" />
                  <XAxis 
                     dataKey="name" 
                     fontSize={10} 
                     stroke="var(--erp-txt3)" 
                     axisLine={false} 
                     tickLine={false} 
                     tick={{ fontWeight: 700, fill: 'var(--erp-txt3)' }}
                     dy={15}
                  />
                  <Tooltip 
                    cursor={{ fill: 'var(--erp-txt3)' }} 
                    contentStyle={{ backgroundColor: 'var(--erp-card)', borderColor: 'var(--erp-card-border)', color: 'var(--erp-txt1)', borderRadius: '12px', fontSize: '10px', fontWeight: 'bold' }}
                    itemStyle={{ color: 'var(--erp-primary)' }}
                  />
                  <Bar dataKey="revenue" radius={[4, 4, 0, 0]} barSize={32}>
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill="#6366f1" opacity={0.3 + (index * 0.1)} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Cash & Bank Summary */}
          <div className="erp-card p-6 flex flex-col">
            <h3 className="text-lg font-bold mb-8 tracking-tight">Cash & Bank Summary</h3>
            <div className="space-y-3 flex-1">
               <div className="erp-action-item">
                  <span className="text-xs font-bold text-muted uppercase tracking-widest">Cash in Hand</span>
                  <span className="text-sm font-black text-[var(--erp-success)] tracking-tight">₹1.24L</span>
               </div>
               <div className="erp-action-item">
                  <span className="text-xs font-bold text-muted uppercase tracking-widest">HDFC Current A/C</span>
                  <span className="text-sm font-black text-[var(--erp-primary)] tracking-tight">₹12.8L</span>
               </div>
               <div className="erp-action-item">
                  <span className="text-xs font-bold text-muted uppercase tracking-widest">SBI Savings A/C</span>
                  <span className="text-sm font-black text-[var(--erp-primary)] tracking-tight">₹4.36L</span>
               </div>
            </div>
          </div>
        </div>

        {/* Bottom Section: Recent Transactions */}
        <div className="erp-card p-0 overflow-hidden">
          <div className="px-8 py-6 border-b border-default flex justify-between items-center">
            <h3 className="text-lg font-bold tracking-tight">Recent Transactions</h3>
            <button className="text-[10px] font-bold text-main/40 hover:text-main flex items-center gap-1 transition-all px-4 py-2 bg-[var(--erp-bg-sunken)] rounded-lg border border-default hover:bg-white/10 uppercase tracking-widest">
                View All
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="text-[10px] font-bold text-muted uppercase tracking-[0.2em] bg-white/[0.02]">
                <tr>
                   <th className="px-8 py-5">Invoice #</th>
                   <th className="px-8 py-5">Customer</th>
                   <th className="px-8 py-5">Amount</th>
                   <th className="px-8 py-5">Date</th>
                   <th className="px-8 py-5">Status</th>
                   <th className="px-8 py-5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-xs font-bold">
                {[
                    { id: 'INV-2847', customer: 'Rajan Textiles', amount: 24500, status: 'PAID', color: 'green' },
                    { id: 'INV-2846', customer: 'Kumar Electronics', amount: 8200, status: 'PARTIAL', color: 'orange' },
                    { id: 'INV-2845', customer: 'Sharma Brothers', amount: 3750, status: 'PAID', color: 'green' },
                    { id: 'INV-2844', customer: 'Patel Hardware', amount: 15600, status: 'OVERDUE', color: 'red' },
                    { id: 'INV-2843', customer: 'Gupta & Sons', amount: 7300, status: 'PAID', color: 'green' }
                ].map((tx, idx) => (
                    <tr key={idx} className="hover:bg-white/[0.01] transition-colors group">
                       <td className="px-8 py-6 text-main">{tx.id}</td>
                       <td className="px-8 py-6 text-secondary">{tx.customer}</td>
                       <td className="px-8 py-6 text-main tracking-tighter text-sm">₹{tx.amount.toLocaleString()}</td>
                       <td className="px-8 py-6 text-muted font-medium">{idx < 2 ? 'Today, 2:14pm' : idx < 4 ? 'Yesterday' : '2 days ago'}</td>
                       <td className="px-8 py-6">
                           <span className={`premium-badge ${
                               tx.color === 'green' ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 
                               tx.color === 'orange' ? 'bg-orange-500/10 text-orange-400 border border-orange-500/20' : 
                               'bg-red-500/10 text-red-400 border border-red-500/20'
                           }`}>
                               {tx.status}
                           </span>
                       </td>
                       <td className="px-8 py-6 text-right">
                           <button className="text-[10px] font-bold uppercase text-main/40 hover:text-main px-3 py-1.5 bg-[var(--erp-bg-sunken)] rounded-lg border border-default transition-all hover:bg-white/10">
                               View
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

export default Dashboard;

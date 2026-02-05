import React, { useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from "../../redux/store";
import { setActiveTab } from "../../redux/slices/uiSlice";
import { useBranchResolver } from "../../hooks/useBranchResolver";
import Layout from "../../components/shared/Layout";
import {
  DollarSign,
  Package,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  BarChart as BarChartIcon,
  Calendar
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';

const Dashboard: React.FC = () => {
  const dispatch = useDispatch();
  const { transactions, dailyFinanceRecords } = useSelector((state: RootState) => state.finance);
  const { items: products } = useSelector((state: RootState) => state.inventory);
  const { currentSector, currentBranch, theme, role } = useSelector((state: RootState) => state.auth);
  const { getBranchName } = useBranchResolver();

  // Filtered Data based on Sector - Memoized
  const sectorTransactions = useMemo(() => (transactions || []).filter((t: any) => t.sector === currentSector), [transactions, currentSector]);
  const sectorProducts = useMemo(() => (products || []).filter((p: any) => p.sector === currentSector), [products, currentSector]);

  const totalRevenue = useMemo(() => {
    return sectorTransactions
      .filter((t: any) => t.type === 'INCOME')
      .reduce((acc: number, curr: any) => acc + curr.amount, 0) +
      (dailyFinanceRecords || [])
        .reduce((acc: number, curr: any) => acc + (curr.totalSales || 0), 0);
  }, [sectorTransactions, dailyFinanceRecords]);

  const totalStockValue = useMemo(() =>
    sectorProducts.reduce((acc: number, curr: any) => acc + (curr.costPrice * (curr.stockQty || 0)), 0),
    [sectorProducts]
  );

  const lowStockItems = useMemo(() =>
    sectorProducts.filter((p: any) => (p.stockQty || 0) < 10),
    [sectorProducts]
  );

  // Chart Data: Last 7 days revenue - Memoized
  const chartData = useMemo(() => {
    const days = 7;
    const data = [];
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const displayDate = d.toLocaleString('default', { day: 'numeric', month: 'short' });

      const dayRev = sectorTransactions
        .filter((t: any) => t.type === 'INCOME' && t.date.startsWith(dateStr))
        .reduce((acc: number, curr: any) => acc + curr.amount, 0);

      data.push({
        name: displayDate,
        fullDate: dateStr,
        revenue: dayRev
      });
    }
    return data;
  }, [sectorTransactions]);

  // -- UI Components --
  const MetricCard = ({ title, value, subtext, icon: Icon, color, trend }: any) => (
    <div className="bg-white dark:bg-neutral-800 p-6 rounded-xl border border-neutral-200 dark:border-neutral-700 shadow-sm relative overflow-hidden group hover:border-primary/50 transition-all">
      <div className={`absolute top-0 right-0 w-24 h-24 bg-${color}-500/10 rounded-full blur-2xl -mr-12 -mt-12 group-hover:bg-${color}-500/20 transition-all`}></div>
      <div className="flex justify-between items-start relative z-10">
        <div>
          <p className="text-neutral-500 dark:text-neutral-400 text-sm font-medium uppercase tracking-wide">{title}</p>
          <h3 className="text-3xl font-bold text-neutral-900 dark:text-white mt-1">{value}</h3>
          {subtext && <p className={`text-xs font-medium mt-2 flex items-center gap-1 ${trend === 'up' ? 'text-success' : trend === 'down' ? 'text-error' : 'text-neutral-400'}`}>
            {trend === 'up' ? <TrendingUp className="w-3 h-3" /> : trend === 'down' ? <TrendingDown className="w-3 h-3" /> : null}
            {subtext}
          </p>}
        </div>
        <div className={`p-3 rounded-xl bg-${color}-500/10 text-${color}-500`}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
    </div>
  );

  return (
    <Layout>
      <div className="space-y-6 animate-fade-in pb-10">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
              <BarChartIcon className="w-6 h-6 text-primary" />
              Dashboard
              <span className="text-xs font-medium text-neutral-500 dark:text-neutral-400 bg-neutral-100 dark:bg-neutral-800 px-2 py-1 rounded-lg ml-2">
                {currentSector} • {getBranchName(currentBranch || '')}
              </span>
            </h2>
            <p className="text-neutral-500 text-sm mt-1">Performance Overview for {new Date().toLocaleString('default', { month: 'long', year: 'numeric' })}</p>
          </div>
          <div className="flex gap-2">
            <div className="hidden lg:block text-right pr-4 border-r border-neutral-200 dark:border-neutral-700 mr-2">
              <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">Active Session</p>
              <p className="text-xs font-semibold text-neutral-600 dark:text-neutral-300">Counter {currentBranch || '01'}</p>
            </div>
            <button className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/90 transition-all shadow-sm">
              Quick Action
            </button>
          </div>
        </div>

        {role === 'Owner' && (
          <div className="group relative bg-[#4F46E5] rounded-[2.5rem] p-8 md:p-12 text-white shadow-2xl shadow-indigo-500/30 overflow-hidden border border-white/20">
            <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-white/[0.08] blur-[100px] rounded-full translate-x-1/2 -translate-y-1/2 group-hover:scale-110 transition-transform duration-700"></div>
            <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-black/10 blur-[80px] rounded-full -translate-x-1/2 translate-y-1/2"></div>

            <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-12">
              <div className="max-w-xl space-y-6 text-center lg:text-left">
                <div className="w-fit mx-auto lg:mx-0 px-4 py-1.5 bg-white/10 backdrop-blur-md rounded-full border border-white/20">
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white">E-commerce Expansion</p>
                </div>
                <h3 className="text-4xl md:text-5xl font-black tracking-tight leading-tight">
                  Grow Your Business <br />
                  <span className="text-indigo-200">Beyond Boundaries.</span>
                </h3>
                <p className="text-white/80 text-lg font-medium leading-relaxed">
                  Launch your dedicated storefront today. Fully integrated inventory management and POS synchronization included.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
                <button
                  onClick={() => dispatch(setActiveTab('GROW_STORE'))}
                  className="w-full sm:w-auto bg-white text-indigo-600 px-10 py-5 rounded-[1.5rem] font-black uppercase tracking-widest text-xs hover:shadow-2xl hover:translate-y-[-4px] transition-all active:scale-95 shadow-xl"
                >
                  Launch Online Store
                </button>
                <button className="w-full sm:w-auto bg-white/5 hover:bg-white/10 text-white px-8 py-5 rounded-[1.5rem] font-black uppercase tracking-widest text-xs backdrop-blur-md border border-white/20 transition-all">
                  Learn More
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <MetricCard
            title="Total Revenue"
            value={`₹${totalRevenue.toLocaleString()}`}
            subtext="+12.5% vs last week"
            icon={TrendingUp}
            color="success"
            trend="up"
          />
          {role === 'Owner' && (
            <>
              <MetricCard
                title="Stock Value"
                value={`₹${totalStockValue.toLocaleString()}`}
                subtext="Inventory Assets"
                icon={Package}
                color="primary"
                trend="flat"
              />
              <MetricCard
                title="Net Profit"
                value={`₹${(totalRevenue - (totalStockValue * 0.5)).toLocaleString()}`}
                subtext="Estimated Margin"
                icon={DollarSign}
                color="warning"
                trend="up"
              />
            </>
          )}
          <MetricCard
            title="Low Stock"
            value={lowStockItems.length}
            subtext={lowStockItems.length > 0 ? "Items require attention" : "Stock healthy"}
            icon={AlertTriangle}
            color="error"
            trend={lowStockItems.length > 0 ? "down" : "flat"}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Chart */}
          <div className="lg:col-span-2 bg-white dark:bg-neutral-800 p-6 rounded-xl border border-neutral-200 dark:border-neutral-700 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-neutral-900 dark:text-neutral-100">Revenue Trend (Last 7 Days)</h3>
              <div className="flex gap-2">
                <span className="text-xs font-medium text-neutral-500 bg-neutral-100 dark:bg-neutral-700 px-2 py-1 rounded">Weekly View</span>
              </div>
            </div>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={theme === 'dark' ? "#334155" : "#e2e8f0"} />
                  <XAxis dataKey="name" stroke={theme === 'dark' ? "#94a3b8" : "#64748b"} axisLine={false} tickLine={false} />
                  <YAxis stroke={theme === 'dark' ? "#94a3b8" : "#64748b"} axisLine={false} tickLine={false} tickFormatter={(value) => `₹${value / 1000}k`} />
                  <Tooltip
                    contentStyle={{ backgroundColor: theme === 'dark' ? '#1e293b' : '#fff', borderColor: theme === 'dark' ? '#334155' : '#e2e8f0', borderRadius: '8px' }}
                    formatter={(value: number) => [`₹${value.toLocaleString()}`, 'Revenue']}
                  />
                  <Legend />
                  <Bar dataKey="revenue" name="Revenue" fill="#10b981" radius={[4, 4, 0, 0]} barSize={40} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Low Stock List */}
          <div className="bg-white dark:bg-neutral-800 p-6 rounded-xl border border-neutral-200 dark:border-neutral-700 shadow-sm flex flex-col">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-neutral-900 dark:text-neutral-100">Low Stock Alerts</h3>
              <span className={`px-3 py-1 text-[10px] font-bold rounded-full uppercase tracking-widest shadow-sm ${lowStockItems.length > 0 ? 'bg-error text-white' : 'bg-success text-white'}`}>
                {lowStockItems.length} Urgent
              </span>
            </div>

            <div className="space-y-4 flex-1 overflow-y-auto custom-scrollbar max-h-[300px]">
              {lowStockItems.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center py-10">
                  <div className="w-16 h-16 bg-success/10 rounded-full flex items-center justify-center mb-4">
                    <Package className="w-8 h-8 text-success" />
                  </div>
                  <p className="text-neutral-900 dark:text-white font-bold text-lg">System Healthy</p>
                  <p className="text-xs text-neutral-400 mt-2 uppercase tracking-wide font-medium">All stock levels stabilized</p>
                </div>
              ) : lowStockItems.map((item: any) => (
                <div key={item.id} className="flex flex-col gap-3 p-4 bg-neutral-50 dark:bg-neutral-700/50 hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-all rounded-xl border border-neutral-200 dark:border-neutral-600 group">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-bold text-neutral-900 dark:text-white tracking-tight leading-tight group-hover:text-primary transition-colors text-sm">{item.name}</p>
                      <p className="text-[10px] text-neutral-400 font-bold mt-1 uppercase tracking-wider">SKU: {item.sku}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-error text-sm font-bold leading-none">{item.stockQty}</p>
                      <p className="text-[8px] text-error/60 font-bold uppercase mt-1">Left</p>
                    </div>
                  </div>
                  <button
                    onClick={() => dispatch(setActiveTab('INVENTORY'))}
                    className="w-full py-2 bg-white dark:bg-neutral-600 text-neutral-900 dark:text-white text-[10px] font-bold uppercase tracking-widest rounded-lg border border-neutral-200 dark:border-neutral-500 hover:bg-primary hover:text-white hover:border-primary transition-all shadow-sm"
                  >
                    Quick Restock
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Dashboard;

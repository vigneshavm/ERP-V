import React, { useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from "../../redux/store";
import { setActiveTab } from "../../redux/slices/uiSlice";
import { useBranchResolver } from "../../hooks/useBranchResolver";
import { DollarSign, Package, TrendingUp, AlertTriangle } from 'lucide-react';
import { CardSkeleton } from "../../components/core/Feedback/Skeleton";

const LazyRevenueChart = React.lazy(() => import('../../components/Dashboard/RevenueChart'));

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ElementType;
  color: string;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon: Icon, color }) => (
  <div className="bg-card p-6 rounded-xl border border-default shadow-lg hover:shadow-xl transition-all duration-300">
    <div className="flex justify-between items-start">
      <div>
        <p className="text-secondary text-sm font-bold uppercase tracking-wider">{title}</p>
        <h3 className="text-3xl font-black text-main mt-2 tracking-tight">{value}</h3>
      </div>
      <div className={`p-4 rounded-2xl bg-opacity-20 ${color} shadow-inner`}>
        <Icon className={`w-7 h-7 ${color.replace('bg-', 'text-')}`} />
      </div>
    </div>
  </div>
);


const Dashboard: React.FC = () => {
  const dispatch = useDispatch();
  const { transactions, dailyFinanceRecords } = useSelector((state: RootState) => state.finance);
  const { items: products } = useSelector((state: RootState) => state.inventory);
  const { currentSector, currentBranch, theme, role } = useSelector((state: RootState) => state.auth);
  const { getBranchName } = useBranchResolver();

  // Filtered Data based on Sector - Memoized
  const sectorTransactions = useMemo(() => (transactions || []).filter(t => t.sector === currentSector), [transactions, currentSector]);
  const sectorProducts = useMemo(() => (products || []).filter(p => p.sector === currentSector), [products, currentSector]);

  const totalRevenue = useMemo(() => {
    return sectorTransactions
      .filter(t => t.type === 'INCOME')
      .reduce((acc, curr) => acc + curr.amount, 0) +
      (dailyFinanceRecords || [])
        .reduce((acc, curr) => acc + (curr.totalSales || 0), 0);
  }, [sectorTransactions, dailyFinanceRecords]);

  const totalStockValue = useMemo(() =>
    sectorProducts.reduce((acc, curr) => acc + (curr.costPrice * (curr.stockQty || 0)), 0),
    [sectorProducts]
  );

  const lowStockItems = useMemo(() =>
    sectorProducts.filter(p => (p.stockQty || 0) < 10),
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

      const dayRev = sectorTransactions
        .filter(t => t.type === 'INCOME' && t.date.startsWith(dateStr))
        .reduce((acc, curr) => acc + curr.amount, 0);

      data.push({ name: dateStr.substr(5), revenue: dayRev });
    }
    return data;
  }, [sectorTransactions]);

  return (
    <div className="space-y-8 animate-fade-in p-4 md:p-6 bg-app min-h-screen">
      <h2 className="text-3xl md:text-4xl font-black text-main flex flex-col md:flex-row md:items-center gap-2 md:gap-4 tracking-tight">
        Dashboard
        <span className="text-sm md:text-xl font-bold text-secondary md:border-l-2 md:border-default md:pl-4">
          {currentSector} / {getBranchName(currentBranch || '')}
        </span>
      </h2>

      {role === 'Owner' && (
        <div className="bg-gradient-to-br from-primary via-primary/95 to-indigo-700 rounded-3xl p-8 text-white shadow-2xl shadow-primary/20 flex flex-col md:flex-row items-center justify-between gap-8 overflow-hidden relative border border-white/10">
          <div className="absolute top-0 right-0 w-80 h-80 bg-white/10 blur-[100px] rounded-full -mr-40 -mt-40"></div>
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-black/10 blur-[80px] rounded-full -ml-32 -mb-32"></div>
          <div className="relative z-10 text-center md:text-left flex-1">
            <h3 className="text-2xl font-black mb-3 tracking-tight">Grow Your Business Online</h3>
            <p className="text-white/90 text-sm max-w-2xl font-medium leading-relaxed">
              Reach more customers by launching your dedicated e-commerce store.
              Fully integrated with your POS and Inventory. Streamline orders and sync stock seamlessly.
            </p>
          </div>
          <button
            onClick={() => dispatch(setActiveTab('GROW_STORE'))}
            className="relative z-10 bg-white text-primary px-8 py-4 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-neutral-50 transition-all shrink-0 shadow-xl active:scale-95 btn-interactive"
          >
            Launch Online Store
          </button>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Revenue"
          value={`₹${totalRevenue.toLocaleString()}`}
          icon={TrendingUp}
          color="bg-emerald-600"
        />
        {role === 'Owner' && (
          <>
            <StatCard
              title="Stock Value"
              value={`₹${totalStockValue.toLocaleString()}`}
              icon={Package}
              color="bg-primary"
            />
            <StatCard
              title="Net Profit"
              value={`₹${(totalRevenue - (totalStockValue * 0.5)).toLocaleString()}`}
              icon={DollarSign}
              color="bg-violet-600"
            />
          </>
        )}
        <StatCard
          title="Low Stock Items"
          value={lowStockItems.length}
          icon={AlertTriangle}
          color="bg-rose-600"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Chart */}
        {/* Chart */}
        <div className="lg:col-span-2 bg-card p-6 rounded-2xl border border-default shadow-lg transition-all overflow-hidden">
          <h3 className="text-xl font-black text-main mb-8 ml-2 tracking-tight">Revenue Trend (Last 7 Days)</h3>
          <div className="h-72">
            <React.Suspense fallback={<CardSkeleton />}>
              <LazyRevenueChart data={chartData} theme={theme || 'light'} />
            </React.Suspense>
          </div>
        </div>

        {/* Low Stock List */}
        {/* Low Stock List */}
        <div className="bg-card p-6 rounded-2xl border border-default shadow-lg transition-all">
          <h3 className="text-xl font-black text-main mb-6 tracking-tight">Low Stock Alerts</h3>
          <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
            {lowStockItems.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-48 text-center">
                <div className="w-16 h-16 bg-emerald-50 dark:bg-emerald-900/10 rounded-full flex items-center justify-center mb-4">
                  <Package className="w-8 h-8 text-emerald-600" />
                </div>
                <p className="text-secondary font-bold">All stock is healthy</p>
                <p className="text-xs text-muted mt-1 uppercase tracking-wider font-bold">No inventory alerts</p>
              </div>
            ) : lowStockItems.map(item => (
              <div key={item.id} className="flex justify-between items-center p-4 bg-surface hover:bg-primary-soft transition-all rounded-xl border border-default group cursor-default">
                <div>
                  <p className="font-bold text-main leading-tight group-hover:text-primary transition-colors">{item.name}</p>
                  <p className="text-[10px] text-muted font-black mt-1 uppercase tracking-wider">SKU: {item.sku} • {getBranchName(item.branchId || '')}</p>
                </div>
                <span className="px-3 py-1 bg-rose-50 dark:bg-rose-900/20 text-rose-600 text-[10px] font-black rounded-full uppercase tracking-tighter shadow-sm border border-rose-100 dark:border-rose-900/30">
                  {item.stockQty} left
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div >
  );
};

export default Dashboard;

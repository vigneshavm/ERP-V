
import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, setActiveTab } from '../store';
import { useBranchResolver } from '../hooks/useBranchResolver';
import { DollarSign, Package, TrendingUp, AlertTriangle } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ElementType;
  color: string;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon: Icon, color }) => (
  <div className="bg-white dark:bg-neutral-800 p-6 rounded-xl border border-neutral-200 dark:border-neutral-700 shadow-lg hover:border-neutral-300 dark:hover:border-neutral-600 transition-colors">
    <div className="flex justify-between items-start">
      <div>
        <p className="text-neutral-500 dark:text-neutral-400 text-sm font-medium">{title}</p>
        <h3 className="text-2xl font-bold text-neutral-900 dark:text-white mt-2">{value}</h3>
      </div>
      <div className={`p-3 rounded-lg bg-opacity-10 ${color}`}>
        <Icon className={`w-6 h-6 ${color.replace('bg-', 'text-')}`} />
      </div>
    </div>
  </div>
);


const Dashboard: React.FC = () => {
  const dispatch = useDispatch();
  const { transactions, dailyFinanceRecords } = useSelector((state: RootState) => state.finance);
  const { products } = useSelector((state: RootState) => state.inventory);
  const { currentSector, currentBranch, theme, role } = useSelector((state: RootState) => state.auth);
  const { getBranchName } = useBranchResolver();

  // Filtered Data based on Sector
  const sectorTransactions = (transactions || []).filter(t => t.sector === currentSector);
  const sectorProducts = (products || []).filter(p => p.sector === currentSector);

  const totalRevenue = sectorTransactions
    .filter(t => t.type === 'INCOME')
    .reduce((acc, curr) => acc + curr.amount, 0) +
    (dailyFinanceRecords || [])
      .reduce((acc, curr) => acc + (curr.totalSales || 0), 0);

  const totalStockValue = sectorProducts.reduce((acc, curr) => acc + (curr.cost * (curr.stock || 0)), 0);

  const lowStockItems = sectorProducts.filter(p => (p.stock || 0) < 10);

  // Chart Data: Last 7 days revenue
  const chartData = (() => {
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
  })();

  return (
    <div className="space-y-6 animate-fade-in">
      <h2 className="text-2xl md:text-3xl font-bold text-neutral-900 dark:text-neutral-100 flex flex-col md:flex-row md:items-center gap-1 md:gap-3">
        Dashboard
        <span className="text-sm md:text-lg font-normal text-neutral-500 md:border-l md:border-neutral-300 dark:md:border-neutral-700 md:pl-3">
          {currentSector} / {getBranchName(currentBranch)}
        </span>
      </h2>

      {role === 'Owner' && (
        <div className="bg-gradient-to-r from-primary to-secondary rounded-2xl p-6 text-white shadow-xl flex flex-col md:flex-row items-center justify-between gap-6 overflow-hidden relative">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 blur-3xl rounded-full -mr-32 -mt-32"></div>
          <div className="relative z-10 text-center md:text-left">
            <h3 className="text-xl font-bold mb-2">Grow Your Business Online</h3>
            <p className="text-white/80 text-sm max-w-lg">
              Reach more customers by launching your dedicated e-commerce store.
              Fully integrated with your POS and Inventory.
            </p>
          </div>
          <button
            onClick={() => dispatch(setActiveTab('GROW'))}
            className="relative z-10 bg-white text-primary px-6 py-3 rounded-xl font-black uppercase tracking-widest text-xs hover:bg-neutral-50 transition-all shrink-0 shadow-lg shadow-black/20 active:scale-95"
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
          color="bg-success"
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
              color="bg-secondary"
            />
          </>
        )}
        <StatCard
          title="Low Stock Items"
          value={lowStockItems.length}
          icon={AlertTriangle}
          color="bg-error"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Chart */}
        <div className="lg:col-span-2 bg-white dark:bg-neutral-800 p-6 rounded-xl border border-neutral-200 dark:border-neutral-700 shadow-lg transition-colors">
          <h3 className="text-lg font-bold text-neutral-900 dark:text-neutral-100 mb-6">Revenue Trend (Last 7 Days)</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke={theme === 'dark' ? "#334155" : "#e2e8f0"} />
                <XAxis dataKey="name" stroke={theme === 'dark' ? "#94a3b8" : "#64748b"} />
                <YAxis stroke={theme === 'dark' ? "#94a3b8" : "#64748b"} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: theme === 'dark' ? '#0f172a' : '#ffffff',
                    borderColor: theme === 'dark' ? '#334155' : '#cbd5e1',
                    color: theme === 'dark' ? '#f8fafc' : '#0f172a',
                    borderRadius: '8px'
                  }}
                  itemStyle={{ color: theme === 'dark' ? '#f8fafc' : '#0f172a' }}
                  formatter={(value) => [`₹${(value as number).toLocaleString()}`, 'Revenue']}
                />
                <Bar dataKey="revenue" fill="var(--color-primary)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Low Stock List */}
        <div className="bg-white dark:bg-neutral-800 p-6 rounded-xl border border-neutral-200 dark:border-neutral-700 shadow-lg transition-colors">
          <h3 className="text-lg font-bold text-neutral-900 dark:text-neutral-100 mb-4">Low Stock Alerts</h3>
          <div className="space-y-4 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
            {lowStockItems.length === 0 ? (
              <p className="text-neutral-500 italic">No inventory alerts.</p>
            ) : lowStockItems.map(item => (
              <div key={item.id} className="flex justify-between items-center p-3 bg-neutral-50 dark:bg-neutral-700/50 rounded-lg border border-error/10">
                <div>
                  <p className="font-medium text-neutral-800 dark:text-neutral-200">{item.name}</p>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400">SKU: {item.sku} <span className="text-neutral-500">({getBranchName(item.branchId)})</span></p>
                </div>
                <span className="px-3 py-1 bg-error/10 text-error text-xs font-bold rounded-full">
                  {item.stock} left
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

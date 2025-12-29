
import React from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
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
  <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-lg hover:border-slate-300 dark:hover:border-slate-600 transition-colors">
    <div className="flex justify-between items-start">
      <div>
        <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">{title}</p>
        <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-2">{value}</h3>
      </div>
      <div className={`p-3 rounded-lg bg-opacity-20 ${color}`}>
        <Icon className={`w-6 h-6 dark:text-white text-slate-800`} />
      </div>
    </div>
  </div>
);


const Dashboard: React.FC = () => {
  const { transactions } = useSelector((state: RootState) => state.finance);
  const { products } = useSelector((state: RootState) => state.inventory);
  const { currentSector, currentBranch, theme, role } = useSelector((state: RootState) => state.auth);
  const { getBranchName } = useBranchResolver();

  // Filtered Data based on Sector and Branch
  const sectorTransactions = transactions.filter(t =>
    t.sector === currentSector && (currentBranch === 'All' || t.branchId === currentBranch)
  );

  const sectorProducts = products.filter(p =>
    p.sector === currentSector && (currentBranch === 'All' || p.branchId === currentBranch)
  );

  const totalRevenue = sectorTransactions
    .filter(t => t.type === 'INCOME')
    .reduce((acc, curr) => acc + curr.amount, 0);

  const totalStockValue = sectorProducts.reduce((acc, curr) => acc + (curr.cost * curr.stock), 0);

  const lowStockItems = sectorProducts.filter(p => p.stock < 10);

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
      <h2 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-slate-100 flex flex-col md:flex-row md:items-center gap-1 md:gap-3">
        Dashboard
        <span className="text-sm md:text-lg font-normal text-slate-500 md:border-l md:border-slate-300 dark:md:border-slate-700 md:pl-3">
          {currentSector} / {getBranchName(currentBranch)}
        </span>
      </h2>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Revenue"
          value={`₹${totalRevenue.toLocaleString()}`}
          icon={TrendingUp}
          color="bg-emerald-500"
        />
        {role === 'Owner' && (
          <>
            <StatCard
              title="Stock Value"
              value={`₹${totalStockValue.toLocaleString()}`}
              icon={Package}
              color="bg-indigo-500"
            />
            <StatCard
              title="Net Profit"
              value={`₹${(totalRevenue - (totalStockValue * 0.5)).toLocaleString()}`}
              icon={DollarSign}
              color="bg-purple-500"
            />
          </>
        )}
        <StatCard
          title="Low Stock Items"
          value={lowStockItems.length}
          icon={AlertTriangle}
          color="bg-red-500"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Chart */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-lg transition-colors">
          <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-6">Revenue Trend (Last 7 Days)</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke={theme === 'dark' ? "#334155" : "#e2e8f0"} />
                <XAxis dataKey="name" stroke={theme === 'dark' ? "#94a3b8" : "#64748b"} />
                <YAxis stroke={theme === 'dark' ? "#94a3b8" : "#64748b"} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: theme === 'dark' ? '#1e293b' : '#ffffff',
                    borderColor: theme === 'dark' ? '#334155' : '#cbd5e1',
                    color: theme === 'dark' ? '#f1f5f9' : '#1e293b'
                  }}
                  itemStyle={{ color: theme === 'dark' ? '#f1f5f9' : '#1e293b' }}
                  formatter={(value) => [`₹${value.toLocaleString()}`, 'Revenue']}
                />
                <Bar dataKey="revenue" fill="#6366f1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Low Stock List */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-lg transition-colors">
          <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-4">Low Stock Alerts</h3>
          <div className="space-y-4 max-h-64 overflow-y-auto pr-2">
            {lowStockItems.length === 0 ? (
              <p className="text-slate-500 italic">No inventory alerts.</p>
            ) : lowStockItems.map(item => (
              <div key={item.id} className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg border border-red-500/20">
                <div>
                  <p className="font-medium text-slate-800 dark:text-slate-200">{item.name}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">SKU: {item.sku} <span className="text-slate-500">({getBranchName(item.branchId)})</span></p>
                </div>
                <span className="px-3 py-1 bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-400 text-xs font-bold rounded-full">
                  {item.stock} left
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

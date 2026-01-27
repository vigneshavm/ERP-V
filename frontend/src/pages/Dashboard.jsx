import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import Layout from "../components/Layout";
import api from "../services/api";
import { getAllExpenses } from "../redux/slices/expenseSlice";
import { getAllBills } from "../redux/slices/billSlice";
import { getDashboardStats } from "../redux/slices/reportsSlice";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  TrendingUp,
  CreditCard,
  IndianRupee,
  FileText,
  Plus,
  ArrowRight,
  Package,
  ArrowUpRight,
  ArrowDownRight,
  Target,
  ShoppingCart
} from "lucide-react";
import BusinessSetupModal from "../components/business/BusinessSetupModal";

const Dashboard = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const { expenses = [] } = useSelector((state) => state.expense);
  const { bills = [] } = useSelector((state) => state.bill);
  const { dashboardStats } = useSelector((state) => state.reports);
  const [fadeIn, setFadeIn] = useState(false);
  const [showSetupModal, setShowSetupModal] = useState(false);

  useEffect(() => {
    const checkSetupStatus = async () => {
      try {
        const response = await api.get('/api/business/setup');
        if (response.data && response.data.success) {
          if (!response.data.data.isSetupComplete) {
            setShowSetupModal(true);
          }
        }
      } catch (error) {
        console.error("Failed to check business setup status", error);
      }
    };

    if (!user) {
      navigate("/login");
    } else {
      checkSetupStatus();
      dispatch(getAllExpenses());
      dispatch(getAllBills());
      dispatch(getDashboardStats());
      setTimeout(() => setFadeIn(true), 100);
    }
  }, [user, navigate, dispatch]);

  if (!user) return null;

  // --- METRICS CALCULATION ---
  const totalRevenue = dashboardStats?.totalRevenue || 0;
  const totalExpenses = Array.isArray(expenses)
    ? expenses.reduce((sum, exp) => sum + exp.amount, 0)
    : 0;
  const netProfit = totalRevenue - totalExpenses;
  const profitMargin = totalRevenue > 0 ? ((netProfit / totalRevenue) * 100).toFixed(1) : 0;

  // Mock Inventory Data (Mapping Requirement: Inventory Category Widget)
  // In a real scenario, this would come from a 'stock' slice.
  const inventoryStatus = [
    { label: "Raw Materials", count: 124, status: "Healthy", color: "bg-emerald-500" },
    { label: "Work in Progress", count: 45, status: "Pending", color: "bg-amber-500" },
    { label: "Finished Goods", count: 320, status: "Ready", color: "bg-blue-500" },
    { label: "Returns", count: 12, status: "Action", color: "bg-rose-500" },
  ];

  // Mock Targets (Mapping Requirement: Quarterly Targets)
  const deptBudgets = [
    { name: "Marketing", spent: 45000, total: 60000, color: "bg-indigo-500" },
    { name: "R&D", spent: 28000, total: 80000, color: "bg-emerald-500" },
    { name: "Operations", spent: 92000, total: 100000, color: "bg-blue-500" },
  ];

  // Chart Data Mapper
  // Using revenueVsExpenses from stats, taking just revenue for the "Sales Overview"
  const salesChartData = dashboardStats?.revenueVsExpenses?.map(item => ({
    name: item.month,
    value: item.revenue
  })) || [];

  const recentOrders = bills?.slice(0, 5) || [];

  return (
    <Layout>
      <div className={`transition-all duration-700 ease-out ${fadeIn ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}>

        {/* HEADER SECTION (In-page) */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-black text-slate-800 dark:text-white mb-1">
              Welcome back, {user?.name?.split(' ')[0] || 'Manager'}
            </h1>
            <p className="text-slate-500 text-sm font-medium">Here's what's happening with your business today.</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => navigate("/reports")}
              className="px-5 py-2.5 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold shadow-sm hover:bg-slate-50 hover:border-slate-300 transition-all"
            >
              Generate Report
            </button>
            <button
              onClick={() => navigate("/sales/order")}
              className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-emerald-500/20 transition-all flex items-center gap-2"
            >
              <Plus className="w-4 h-4" /> Create Order
            </button>
          </div>
        </div>

        {/* TOP ROW: SUMMARY CARDS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Total Revenue */}
          <div className="bg-white dark:bg-slate-900 rounded-[24px] p-6 shadow-sm border border-slate-100 dark:border-slate-800 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
              <IndianRupee className="w-24 h-24 text-emerald-600" />
            </div>
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-emerald-50 dark:bg-emerald-500/10 rounded-2xl text-emerald-600">
                <IndianRupee className="w-6 h-6" />
              </div>
              <span className="text-sm font-bold text-slate-400 uppercase tracking-wider">Total Revenue</span>
            </div>
            <div className="flex items-end gap-3 mb-2">
              <h2 className="text-4xl font-black text-slate-800 dark:text-white">
                ₹{(totalRevenue / 1000).toFixed(1)}k
              </h2>
              <span className="mb-1.5 px-2 py-0.5 bg-emerald-50 dark:bg-emerald-500/20 text-emerald-600 text-xs font-bold rounded-lg flex items-center gap-1">
                <ArrowUpRight className="w-3 h-3" /> 12.5%
              </span>
            </div>
            <p className="text-slate-400 text-xs font-medium">Compared to last month</p>
          </div>

          {/* Procurement Costs */}
          <div className="bg-white dark:bg-slate-900 rounded-[24px] p-6 shadow-sm border border-slate-100 dark:border-slate-800 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
              <CreditCard className="w-24 h-24 text-rose-600" />
            </div>
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-rose-50 dark:bg-rose-500/10 rounded-2xl text-rose-600">
                <CreditCard className="w-6 h-6" />
              </div>
              <span className="text-sm font-bold text-slate-400 uppercase tracking-wider">Procurement</span>
            </div>
            <div className="flex items-end gap-3 mb-2">
              <h2 className="text-4xl font-black text-slate-800 dark:text-white">
                ₹{(totalExpenses / 1000).toFixed(1)}k
              </h2>
              <span className="mb-1.5 px-2 py-0.5 bg-rose-50 dark:bg-rose-500/20 text-rose-600 text-xs font-bold rounded-lg flex items-center gap-1">
                <ArrowUpRight className="w-3 h-3" /> 4.2%
              </span>
            </div>
            <p className="text-slate-400 text-xs font-medium">Compared to last month</p>
          </div>

          {/* Net Profit */}
          <div className="bg-white dark:bg-slate-900 rounded-[24px] p-6 shadow-sm border border-slate-100 dark:border-slate-800 relative overflow-hidden group transition-all hover:shadow-lg hover:shadow-emerald-500/5 hover:border-emerald-500/20">
            <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
              <TrendingUp className="w-24 h-24 text-blue-600" />
            </div>
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-blue-50 dark:bg-blue-500/10 rounded-2xl text-blue-600">
                <TrendingUp className="w-6 h-6" />
              </div>
              <span className="text-sm font-bold text-slate-400 uppercase tracking-wider">Net Profit</span>
            </div>
            <div className="flex items-end gap-3 mb-2">
              <h2 className="text-4xl font-black text-slate-800 dark:text-white">
                ₹{(netProfit / 1000).toFixed(1)}k
              </h2>
              <span className="mb-1.5 px-2 py-0.5 bg-blue-50 dark:bg-blue-500/20 text-blue-600 text-xs font-bold rounded-lg flex items-center gap-1">
                {profitMargin}% Margin
              </span>
            </div>
            <p className="text-slate-400 text-xs font-medium">After tax & deductions</p>
          </div>
        </div>

        {/* MIDDLE SECTION: INVENTORY + CHARTS */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Inventory Status Widget */}
          <div className="bg-white dark:bg-slate-900 rounded-[24px] p-6 shadow-sm border border-slate-100 dark:border-slate-800">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-black text-slate-800 dark:text-white">Inventory Status</h3>
              <button onClick={() => navigate('/inventory')} className="text-emerald-600 text-xs font-bold uppercase hover:underline">View All</button>
            </div>
            <div className="space-y-4">
              {inventoryStatus.map((item, index) => (
                <div key={index} className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 transition-colors cursor-pointer group">
                  <div className="flex items-center gap-4">
                    <div className={`w-2 h-2 rounded-full ${item.color} ring-4 ring-white dark:ring-slate-800 shadow-sm`}></div>
                    <div>
                      <p className="text-sm font-bold text-slate-700 dark:text-slate-200">{item.label}</p>
                      <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">{item.status}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-black text-slate-900 dark:text-white">{item.count}</span>
                    <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-emerald-500 transition-colors" />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Sales Overview Chart */}
          <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-[24px] p-6 shadow-sm border border-slate-100 dark:border-slate-800">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-black text-slate-800 dark:text-white">Sales Overview</h3>
                <p className="text-slate-400 text-xs font-medium mt-1">Monthly revenue performance</p>
              </div>
              <select className="bg-slate-100 dark:bg-slate-800 border-none text-slate-600 text-xs font-bold rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-500/20">
                <option>This Year</option>
                <option>Last Year</option>
              </select>
            </div>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={salesChartData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }} barSize={32}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 600 }}
                    tickLine={false}
                    axisLine={false}
                    dy={10}
                  />
                  <YAxis
                    tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 600 }}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) => `₹${value / 1000}k`}
                  />
                  <Tooltip
                    cursor={{ fill: 'transparent' }}
                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 40px -10px rgba(0,0,0,0.1)' }}
                    itemStyle={{ color: '#10b981', fontWeight: 'bold' }}
                    formatter={(value) => [`₹${value}`, 'Revenue']}
                  />
                  <Bar
                    dataKey="value"
                    fill="#10b981"
                    radius={[8, 8, 8, 8]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* BOTTOM SECTION: TARGETS & RECENT ORDERS */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Quarterly Targets */}
          <div className="bg-white dark:bg-slate-900 rounded-[24px] p-6 shadow-sm border border-slate-100 dark:border-slate-800">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-black text-slate-800 dark:text-white flex items-center gap-2">
                <Target className="w-5 h-5 text-emerald-500" /> Quarterly Targets
              </h3>
            </div>
            <div className="space-y-6">
              {deptBudgets.map((dept, index) => (
                <div key={index}>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm font-bold text-slate-700 dark:text-slate-200">{dept.name}</span>
                    <span className="text-xs font-bold text-slate-500">
                      {Math.round((dept.spent / dept.total) * 100)}% ({dept.spent / 1000}k / {dept.total / 1000}k)
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2.5 overflow-hidden">
                    <div
                      className={`${dept.color} h-2.5 rounded-full transition-all duration-1000 ease-out`}
                      style={{ width: `${(dept.spent / dept.total) * 100}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Orders */}
          <div className="bg-white dark:bg-slate-900 rounded-[24px] p-6 shadow-sm border border-slate-100 dark:border-slate-800">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-black text-slate-800 dark:text-white flex items-center gap-2">
                <ShoppingCart className="w-5 h-5 text-emerald-500" /> Recent Orders
              </h3>
              <button onClick={() => navigate('/purchase/bills')} className="text-slate-400 hover:text-emerald-500 transition-colors">
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left border-b border-slate-100 dark:border-slate-800">
                    <th className="pb-3 text-xs font-bold text-slate-400 uppercase tracking-wider">Order ID</th>
                    <th className="pb-3 text-xs font-bold text-slate-400 uppercase tracking-wider">Date</th>
                    <th className="pb-3 text-xs font-bold text-slate-400 uppercase tracking-wider">Amount</th>
                    <th className="pb-3 text-xs font-bold text-slate-400 uppercase tracking-wider text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 dark:divide-slate-800/50">
                  {recentOrders.length > 0 ? (
                    recentOrders.map((order, index) => (
                      <tr key={index} className="group hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                        <td className="py-3 text-sm font-bold text-slate-700 dark:text-slate-200">
                          #{order.billNumber || '---'}
                        </td>
                        <td className="py-3 text-xs font-medium text-slate-500">
                          {new Date(order.date).toLocaleDateString()}
                        </td>
                        <td className="py-3 text-sm font-bold text-slate-800 dark:text-white">
                          ₹{order.amount?.toLocaleString()}
                        </td>
                        <td className="py-3 text-right">
                          <span className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider ${order.status === 'paid' ? 'bg-emerald-100 text-emerald-600' :
                            order.status === 'unpaid' ? 'bg-rose-100 text-rose-600' :
                              'bg-amber-100 text-amber-600'
                            }`}>
                            {order.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="py-8 text-center text-slate-400 text-sm">No recent orders found.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

      </div>
      <BusinessSetupModal isOpen={showSetupModal} onClose={() => setShowSetupModal(false)} />
    </Layout>
  );
};

export default Dashboard;

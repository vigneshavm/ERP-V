import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import Layout from "../components/Layout";
import { getAllExpenses } from "../redux/slices/expenseSlice";
import { getAllBills } from "../redux/slices/billSlice";
import { getDashboardStats } from "../redux/slices/reportsSlice";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area,
} from "recharts";
import {
  TrendingUp,
  TrendingDown,
  Receipt,
  CreditCard,
  Clock,
  IndianRupee,
  FileText,
  Plus,
  ArrowRight,
  Activity,
  Users,
  Target,
  Zap,
  BarChart3,
  PieChartIcon,
  AlertCircle
} from "lucide-react";

const Dashboard = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const { expenses = [] } = useSelector((state) => state.expense);
  const { bills = [] } = useSelector((state) => state.bill);
  const { dashboardStats } = useSelector((state) => state.reports);
  const [fadeIn, setFadeIn] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate("/login");
    } else {
      dispatch(getAllExpenses());
      dispatch(getAllBills());
      dispatch(getDashboardStats());
      setTimeout(() => setFadeIn(true), 50);
    }
  }, [user, navigate, dispatch]);

  if (!user) {
    return null;
  }

  // Calculate metrics
  const totalExpenses = Array.isArray(expenses)
    ? expenses.reduce((sum, exp) => sum + exp.amount, 0)
    : 0;

  const totalBillsAmount = Array.isArray(bills)
    ? bills.reduce((sum, bill) => sum + bill.amount, 0)
    : 0;
  const totalOutstanding = Array.isArray(bills)
    ? bills
      .filter((bill) => bill.status === "unpaid")
      .reduce((sum, bill) => sum + bill.amount, 0)
    : 0;

  const totalRevenue = dashboardStats?.totalRevenue || 0;
  const totalInvoices = dashboardStats?.totalInvoices || 0;
  const netProfit = totalRevenue - totalExpenses;

  // Time-based greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 17) return "Good Afternoon";
    return "Good Evening";
  };

  // Chart colors
  const COLORS = {
    primary: "#6366f1",
    emerald: "#10b981",
    rose: "#f43f5e",
    amber: "#f59e0b",
    blue: "#3b82f6",
    violet: "#8b5cf6"
  };

  return (
    <Layout>
      <div className={`transition-opacity duration-500 ease-out ${fadeIn ? "opacity-100" : "opacity-0"}`}>

        {/* IMMERSIVE HERO BANNER */}
        <div className="bg-gradient-to-br from-indigo-600 via-indigo-700 to-violet-800 rounded-[3rem] p-12 mb-8 text-white shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 p-12 opacity-10 pointer-events-none">
            <BarChart3 className="w-64 h-64" />
          </div>
          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            <div>
              <div className="flex items-center gap-2 text-indigo-200 text-[10px] font-black uppercase tracking-[0.2em] mb-4">
                <Activity className="w-4 h-4 text-emerald-400 animate-pulse" />
                Executive Command Center
              </div>
              <h1 className="text-4xl lg:text-5xl font-black tracking-tight mb-2">
                {getGreeting()}, {user?.name?.split(' ')[0] || 'User'}
              </h1>
              <p className="text-indigo-200 text-sm font-medium mb-8">
                Here's a real-time snapshot of your business performance.
              </p>
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() => navigate("/invoices/create")}
                  className="px-5 py-2.5 bg-white text-indigo-700 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-xl hover:bg-indigo-50 transition-all flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" /> New Invoice
                </button>
                <button
                  onClick={() => navigate("/expenses")}
                  className="px-5 py-2.5 bg-white/10 backdrop-blur-md border border-white/20 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-white/20 transition-all flex items-center gap-2"
                >
                  <Receipt className="w-4 h-4" /> Add Expense
                </button>
              </div>
            </div>
            <div className="hidden lg:grid grid-cols-2 gap-4">
              <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-[2rem] p-6">
                <div className="flex items-center gap-2 text-emerald-300 text-[9px] font-black uppercase tracking-widest mb-3">
                  <TrendingUp className="w-3.5 h-3.5" /> Net Profit
                </div>
                <p className={`text-3xl font-black ${netProfit >= 0 ? 'text-emerald-300' : 'text-rose-300'}`}>
                  {netProfit >= 0 ? '+' : ''}₹{Math.abs(netProfit).toLocaleString('en-IN')}
                </p>
              </div>
              <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-[2rem] p-6">
                <div className="flex items-center gap-2 text-amber-300 text-[9px] font-black uppercase tracking-widest mb-3">
                  <Clock className="w-3.5 h-3.5" /> Outstanding
                </div>
                <p className="text-3xl font-black text-amber-300">₹{totalOutstanding.toLocaleString('en-IN')}</p>
              </div>
            </div>
          </div>
        </div>

        {/* BENTO METRICS GRID */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {/* Total Revenue - Featured */}
          <div className="col-span-2 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-[2rem] p-8 text-white shadow-xl relative overflow-hidden group">
            <div className="absolute top-4 right-4 opacity-20 group-hover:scale-110 transition-transform">
              <IndianRupee className="w-24 h-24" />
            </div>
            <div className="relative z-10">
              <div className="flex items-center gap-2 text-emerald-100 text-[9px] font-black uppercase tracking-widest mb-4">
                <TrendingUp className="w-3.5 h-3.5" /> Total Revenue
              </div>
              <p className="text-5xl font-black tracking-tight">₹{totalRevenue.toLocaleString('en-IN')}</p>
              <p className="text-emerald-100 text-xs font-bold mt-2">Lifetime earnings</p>
            </div>
          </div>

          {/* Invoices */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2rem] p-6 shadow-sm hover:shadow-xl transition-all group">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-blue-600 mb-4 group-hover:scale-110 transition-transform">
              <FileText className="w-6 h-6" />
            </div>
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Invoices</p>
            <p className="text-3xl font-black text-slate-800 dark:text-white">{totalInvoices}</p>
            <p className="text-xs font-bold text-slate-400 mt-1">Generated</p>
          </div>

          {/* Expenses */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2rem] p-6 shadow-sm hover:shadow-xl transition-all group">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-900/20 flex items-center justify-center text-rose-600 mb-4 group-hover:scale-110 transition-transform">
              <TrendingDown className="w-6 h-6" />
            </div>
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Expenses</p>
            <p className="text-3xl font-black text-slate-800 dark:text-white">₹{totalExpenses.toLocaleString('en-IN')}</p>
            <p className="text-xs font-bold text-rose-500 mt-1">Total spent</p>
          </div>
        </div>

        {/* CHARTS SECTION */}
        {dashboardStats && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Revenue Trend */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2rem] p-8 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-tight">Revenue Trend</h3>
                  <p className="text-[10px] font-bold text-slate-400 mt-0.5">Last 30 days performance</p>
                </div>
                <span className="px-3 py-1.5 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 rounded-xl text-[9px] font-black uppercase tracking-widest">Daily</span>
              </div>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={dashboardStats.dailySales || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={COLORS.primary} stopOpacity={0.2} />
                        <stop offset="95%" stopColor={COLORS.primary} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis
                      dataKey="_id"
                      tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 600 }}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(value) => value?.split("-").slice(1).join("/") || ''}
                    />
                    <YAxis
                      tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 600 }}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(value) => `₹${value}`}
                    />
                    <Tooltip
                      contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 40px -10px rgba(0,0,0,0.2)', fontWeight: 600 }}
                      formatter={(value) => [`₹${value?.toLocaleString('en-IN') || 0}`, 'Revenue']}
                    />
                    <Area
                      type="monotone"
                      dataKey="totalSales"
                      stroke={COLORS.primary}
                      strokeWidth={3}
                      fillOpacity={1}
                      fill="url(#colorRevenue)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Profitability */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2rem] p-8 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-tight">Profitability</h3>
                  <p className="text-[10px] font-bold text-slate-400 mt-0.5">Revenue vs Expenses</p>
                </div>
                <span className="px-3 py-1.5 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 rounded-xl text-[9px] font-black uppercase tracking-widest">Monthly</span>
              </div>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={dashboardStats.revenueVsExpenses || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis
                      dataKey="month"
                      tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 600 }}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 600 }}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(value) => `₹${value}`}
                    />
                    <Tooltip
                      cursor={{ fill: 'transparent' }}
                      contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 40px -10px rgba(0,0,0,0.2)', fontWeight: 600 }}
                    />
                    <Bar dataKey="revenue" name="Revenue" fill={COLORS.emerald} radius={[8, 8, 0, 0]} maxBarSize={32} />
                    <Bar dataKey="expenses" name="Expenses" fill={COLORS.rose} radius={[8, 8, 0, 0]} maxBarSize={32} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Payment Methods */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2rem] p-8 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-tight">Payment Modes</h3>
                  <p className="text-[10px] font-bold text-slate-400 mt-0.5">Distribution by method</p>
                </div>
              </div>
              <div className="h-56 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={dashboardStats.paymentMethods || []}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={85}
                      paddingAngle={4}
                      dataKey="count"
                      nameKey="_id"
                    >
                      {(dashboardStats.paymentMethods || []).map((entry, index) => {
                        const colors = [COLORS.emerald, COLORS.primary, COLORS.amber, COLORS.violet];
                        return <Cell key={`cell-${index}`} fill={colors[index % colors.length]} stroke="none" />;
                      })}
                    </Pie>
                    <Tooltip contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 40px -10px rgba(0,0,0,0.2)', fontWeight: 600 }} />
                    <Legend layout="vertical" align="right" verticalAlign="middle" iconType="circle" wrapperStyle={{ fontSize: '11px', fontWeight: 600 }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Top Receivables */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2rem] p-8 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-tight">Top Receivables</h3>
                  <p className="text-[10px] font-bold text-slate-400 mt-0.5">Outstanding amounts</p>
                </div>
                <button
                  onClick={() => navigate("/customers/dues")}
                  className="px-3 py-1.5 bg-slate-50 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 text-slate-500 hover:text-indigo-600 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all flex items-center gap-1"
                >
                  View All <ArrowRight className="w-3 h-3" />
                </button>
              </div>
              <div className="space-y-3">
                {(dashboardStats.topCustomersWithDues || []).length > 0 ? (
                  (dashboardStats.topCustomersWithDues || []).slice(0, 4).map((customer, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-2xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-all">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white text-sm font-black">
                          {customer.name?.charAt(0).toUpperCase() || '?'}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-800 dark:text-white">{customer.name}</p>
                          <p className="text-[10px] font-bold text-slate-400">Customer</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-black text-rose-600">₹{customer.dues?.toLocaleString('en-IN') || 0}</p>
                        <p className="text-[10px] font-bold text-rose-400">Due</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="py-12 flex flex-col items-center justify-center text-slate-300">
                    <AlertCircle className="w-12 h-12 mb-3 opacity-50" />
                    <p className="text-sm font-bold">No outstanding payments</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* QUICK ACTIONS */}
        <div className="mb-8">
          <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
            <Zap className="w-4 h-4" /> Quick Actions
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <button
              onClick={() => navigate("/invoices")}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 text-left hover:border-indigo-300 dark:hover:border-indigo-700 hover:shadow-lg transition-all group"
            >
              <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center text-indigo-600 mb-3 group-hover:scale-110 transition-transform">
                <FileText className="w-5 h-5" />
              </div>
              <p className="text-sm font-black text-slate-800 dark:text-white">Invoices</p>
              <p className="text-[10px] font-bold text-slate-400 mt-0.5">Manage billing</p>
            </button>
            <button
              onClick={() => navigate("/customers")}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 text-left hover:border-emerald-300 dark:hover:border-emerald-700 hover:shadow-lg transition-all group"
            >
              <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center text-emerald-600 mb-3 group-hover:scale-110 transition-transform">
                <Users className="w-5 h-5" />
              </div>
              <p className="text-sm font-black text-slate-800 dark:text-white">Customers</p>
              <p className="text-[10px] font-bold text-slate-400 mt-0.5">View contacts</p>
            </button>
            <button
              onClick={() => navigate("/expenses")}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 text-left hover:border-rose-300 dark:hover:border-rose-700 hover:shadow-lg transition-all group"
            >
              <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-900/20 flex items-center justify-center text-rose-600 mb-3 group-hover:scale-110 transition-transform">
                <CreditCard className="w-5 h-5" />
              </div>
              <p className="text-sm font-black text-slate-800 dark:text-white">Expenses</p>
              <p className="text-[10px] font-bold text-slate-400 mt-0.5">Track spending</p>
            </button>
            <button
              onClick={() => navigate("/reports")}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 text-left hover:border-amber-300 dark:hover:border-amber-700 hover:shadow-lg transition-all group"
            >
              <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center text-amber-600 mb-3 group-hover:scale-110 transition-transform">
                <Target className="w-5 h-5" />
              </div>
              <p className="text-sm font-black text-slate-800 dark:text-white">Reports</p>
              <p className="text-[10px] font-bold text-slate-400 mt-0.5">Analytics</p>
            </button>
          </div>
        </div>

      </div>
    </Layout>
  );
};

export default Dashboard;


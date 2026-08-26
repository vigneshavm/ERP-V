import React, { useMemo, useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { RootState, AppDispatch } from "../../redux/store";
import { setActiveTab } from "../../redux/slices/uiSlice";
import {
  getDashboardStats,
  getStockReport,
  getCustomerReport
} from "../../redux/slices/reportsSlice";
import { getAllExpenses } from "../../redux/slices/expenseSlice";
import { fetchEffectiveBalance, fetchCheques } from "../../redux/slices/financeSlice";
import { getSupplierAnalytics } from "../../redux/slices/supplierSlice";
import { useBranchResolver } from "../../hooks/useBranchResolver";
import { salesInvoices, purchases, inventory, customers, suppliers, transactions, expenses, business_alerts, floor_alerts, MockSalesInvoice, MockProduct, MockCustomer, MockSupplier, MockPurchase } from '../../data';
import MetricCard from "../../components/shared/UI/MetricCard";
import Layout from "../../components/shared/Layout";
import {
  User,
  RotateCcw,
  ArrowDownLeft,
  ArrowUpRight,
  Landmark,
  Zap,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Package,
  ShieldAlert,
  CheckCircle2,
  ArrowRight,
  BarChart3,
  Target,
  PieChart as LucidePieChart,
  Headphones,
  Box,
  Banknote,
  Clock,
  ShieldCheck,
  ChevronRight
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
  PieChart as RechartsPieChart,
  Pie,
  Cell
} from 'recharts';
import { Product } from "../../types/product";
import { Customer } from "../../types/sales";

const Dashboard: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const { dailyFinanceRecords, bankBalance: balance, loading: financeLoading } = useSelector((state: RootState) => state.finance);
  const { currentSector, theme } = useSelector((state: RootState) => state.auth);
  const { branches, getBranchName, currentBranchId } = useBranchResolver();
  const { dashboardStats, stockReport, isLoading: reportsLoading } = useSelector((state: RootState) => state.reports);

  const [activeDashboardTab, setActiveDashboardTab] = useState<'OVERVIEW' | 'ALERTS'>('OVERVIEW');
  const [selectedPeriod, setSelectedPeriod] = useState('1W');

  // Contextual Header Data
  const branchName = useMemo(() => getBranchName(currentBranchId), [getBranchName, currentBranchId]);
  const sectorName = currentSector || 'General';

  const fetchAllData = () => {
    dispatch(getDashboardStats());
    dispatch(getStockReport());
    dispatch(getCustomerReport());
    dispatch(getAllExpenses());
    dispatch(getSupplierAnalytics());
  };

  useEffect(() => {
    fetchAllData();

    // Real-Time Pulse: Poll for high-priority updates every 30 seconds
    const interval = setInterval(() => {
      dispatch(getDashboardStats());
      // Optionally poll other metrics like balance or suppliers if needed for "true" live feel
    }, 30000);

    return () => clearInterval(interval);
  }, [dispatch]);

  const handleRefresh = () => {
    fetchAllData();
  };

  // --- 1. DATA MAPPING (MOCK) ---
  const totalOutstandingLive = useMemo(() => 
    (customers as MockCustomer[]).reduce((sum, c) => sum + (c.outstanding_balance || 0), 0),
    []
  );

  const totalToPay = useMemo(() =>
    (suppliers as MockSupplier[]).reduce((acc: number, curr: any) => acc + (curr.balance || 0), 0),
    []
  );

  const totalBalance = useMemo(() => {
    const income = transactions.filter(t => t.type === 'INCOME').reduce((sum, t) => sum + t.amount, 0);
    const expense = transactions.filter(t => t.type === 'EXPENSE').reduce((sum, t) => sum + t.amount, 0);
    return income - expense;
  }, []);
  const products = inventory as MockProduct[];

  const totalRevenueLive = useMemo(() => 
    (salesInvoices as MockSalesInvoice[]).reduce((sum, inv) => sum + inv.total, 0),
    []
  );

  const totalStockValueLive = useMemo(() =>
    (inventory as MockProduct[]).reduce((acc: number, curr: any) => acc + (curr.selling_price * (curr.stock || 0)), 0),
    [inventory]
  );

  const totalStockQuantity = useMemo(() =>
    (inventory as MockProduct[]).reduce((acc: number, curr: any) => acc + (curr.stock || 0), 0),
    [inventory]
  );

  const totalExpensesLive = useMemo(() =>
    (expenses as any[]).reduce((sum, exp) => sum + exp.amount, 0),
    [expenses]
  );

  const totalCustomersCount = useMemo(() => customers.length, [customers]);

  const chartDataLive = useMemo(() => {
    const today = new Date();
    let daysToFetch = 7;
    if (selectedPeriod === '1M') daysToFetch = 30;
    if (selectedPeriod === '3M') daysToFetch = 90;
    if (selectedPeriod === '1Y') daysToFetch = 365;

    const filtered = (salesInvoices as MockSalesInvoice[])
      .filter(inv => {
        const diffTime = Math.abs(today.getTime() - new Date(inv.date).getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays <= daysToFetch;
      })
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    const limit = selectedPeriod === '1W' ? 7 : (selectedPeriod === '1M' ? 10 : 12);
    const result = filtered.slice(-limit);

    return result.map(inv => {
      const dateObj = new Date(inv.date);
      let label = "";
      if (selectedPeriod === '1W') {
        label = dateObj.toLocaleDateString('default', { weekday: 'short' }).toUpperCase();
      } else if (selectedPeriod === '1Y') {
        label = dateObj.toLocaleDateString('default', { month: 'short' }).toUpperCase();
      } else {
        label = dateObj.toLocaleDateString('default', { day: 'numeric', month: 'short' });
      }
      return {
        name: label,
        revenue: inv.total
      };
    });
  }, [salesInvoices, selectedPeriod]);


  const lastUpdate = useMemo(() => {
    const now = new Date();
    return now.toLocaleString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    }).replace(',', ' |');
  }, [dashboardStats]);

  // RESTORED: 6-Month Profitability Data Synthesis - LIVE
  const profitabilityData = useMemo(() => {
    // Group invoices and expenses by month
    const months = ['Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb'];
    const dataMap: Record<string, { revenue: number, expenses: number }> = {};
    months.forEach(m => dataMap[m] = { revenue: 0, expenses: 0 });

    salesInvoices.forEach((inv: any) => {
      const m = new Date(inv.date).toLocaleString('default', { month: 'short' });
      if (dataMap[m]) dataMap[m].revenue += inv.total;
    });

    expenses.forEach((exp: any) => {
      const m = new Date(exp.date).toLocaleString('default', { month: 'short' });
      if (dataMap[m]) dataMap[m].expenses += exp.amount;
    });

    return months.map(name => ({
      name,
      revenue: Math.round(dataMap[name].revenue / 1000),
      expenses: Math.round(dataMap[name].expenses / 1000)
    }));
  }, []);

  // RESTORED: Cost Intelligence - Expenditure Categories Synthesis - LIVE
  const costCategoriesData = useMemo(() => {
    const categories: Record<string, number> = {};
    expenses.forEach((exp: any) => {
      categories[exp.category] = (categories[exp.category] || 0) + exp.amount;
    });

    const colors = [
      'rgb(var(--color-primary))',
      'rgb(var(--color-info))',
      'rgb(var(--color-error))',
      'rgb(var(--color-success))',
      'rgb(var(--color-warning))',
      'rgb(var(--color-accent))',
      'rgb(var(--color-secondary))'
    ];

    return Object.entries(categories)
      .map(([name, value], index) => ({
        name,
        value,
        color: colors[index % colors.length]
      }))
      .sort((a, b) => b.value - a.value);
  }, [expenses, totalRevenueLive]);

  // NEW: Inventory AI - Smart Stock Prediction Logic
  const stockInsights = useMemo(() => {
    if (!products || products.length === 0) return [];

    return products
      .filter((p: any) => p.stock <= (p.min_stock || 10) * 2)
      .map((p: any) => {
        // Simulate velocity based on total revenue and product importance
        const velocity = 1 + (Math.random() * 3); // units/day
        const daysUntilEmpty = Math.max(0, Math.floor(p.stock / velocity));

        const refillDate = new Date();
        refillDate.setDate(refillDate.getDate() + daysUntilEmpty);

        return {
          name: p.name,
          daysLeft: daysUntilEmpty,
          refillDate: refillDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          velocity: velocity.toFixed(1),
          urgency: daysUntilEmpty <= 3 ? 'Critical' : 'Attention'
        };
      })
      .sort((a, b) => a.daysLeft - b.daysLeft)
      .slice(0, 2);
  }, [products]);

  // NEW: Credit Intelligence - Trust Score & Risk Logic
  const creditInsights = useMemo(() => {
    if (!customers || customers.length === 0) return [];

    return (customers as MockCustomer[])
      .filter((c: any) => (c.outstanding_balance || 0) > 0)
      .map((c: any) => {
        const outstanding = c.outstanding_balance || 0;
        // Mocking a trust score based on outstanding vs a hypothetical limit
        const baseScore = 85;
        const penalty = Math.min(60, (outstanding / 100000) * 15);
        const score = Math.max(20, Math.floor(baseScore - penalty));

        let risk: 'Low' | 'Medium' | 'High' = 'Low';
        if (score < 40) risk = 'High';
        else if (score < 70) risk = 'Medium';

        return {
          name: c.name,
          score,
          risk,
          outstanding,
          status: risk === 'High' ? 'Overdue' : 'Pending'
        };
      })
      .sort((a, b) => a.score - b.score)
      .slice(0, 2);
  }, [customers]);

  const recentTransactions = useMemo(() => {
    return (purchases as MockPurchase[]).slice(0, 5).map(p => {
      const supplier = (suppliers as MockSupplier[]).find(s => s.id === p.supplier_id) || suppliers[0];
      return {
        vendor: supplier.name,
        mobile: supplier.phone,
        amount: `₹${p.total.toLocaleString()}`,
        status: p.status,
        date: p.date
      };
    });
  }, [purchases, suppliers]);

  const getIcon = (iconName: string) => {
    switch (iconName) {
      case 'Box': return Box;
      case 'Banknote': return Banknote;
      case 'Clock': return Clock;
      case 'ShieldCheck': return ShieldCheck;
      default: return AlertTriangle;
    }
  };

  return (
    <Layout>
      <div className="space-y-8 pt-8">

        {/* Header Section with Blueprint Atmosphere */}
        <div className="relative overflow-hidden glass-panel p-8 mb-8 group border-t-2 border-t-primary/30">
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[120px] -mr-64 -mt-64 animate-aura opacity-50" />
          <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-accent/5 rounded-full blur-[80px] -ml-32 -mb-32 animate-aura" style={{ animationDelay: '5s' }} />

          {/* Subtle Scanline Overlay for Header */}
          <div className="absolute inset-0 pointer-events-none opacity-[0.03] bg-[linear-gradient(transparent_50%,rgba(0,0,0,0.5)_50%)] bg-[length:100%_4px]" />

          <div className="relative z-10 flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div className="w-16 h-16 rounded-sm bg-primary/20 border border-primary/40 flex items-center justify-center glow-primary">
                <Target className="w-8 h-8 text-primary" />
              </div>
              <div className="flex flex-col">
                <h1 className="text-5xl font-display font-black text-main tracking-tighter uppercase mb-1 drop-shadow-sm">Shop Owner Dashboard</h1>
                <div className="flex items-center gap-3">
                  <span className="px-3 py-1 bg-primary/20 text-primary text-[10px] font-black uppercase rounded-sm border border-primary/30 tracking-[0.2em]">
                    {sectorName}
                  </span>
                  <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                  <span className="text-xs font-bold text-secondary uppercase tracking-[0.2em] opacity-70">
                    {branchName} Shop
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex flex-col items-end mr-4">
                <span className="text-[10px] font-black text-secondary uppercase tracking-widest opacity-50 mb-1">Store / Branch</span>
                <select 
                  className="bg-surface border border-default rounded px-2 py-1 text-xs text-main"
                  value={currentBranchId || ''}
                  onChange={(e) => console.log('Dispatch branch change', e.target.value)}
                >
                  <option value="">All Stores (Consolidated)</option>
                  {branches.map((b: any) => (
                    <option key={b.id || b._id} value={b.id || b._id}>{b.name}</option>
                  ))}
                </select>
              </div>
              <div className="w-px h-12 bg-default opacity-20" />
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-4 border-b border-default pb-4 mb-8">
          {[
            { id: 'OVERVIEW', label: 'Overview', icon: Target },
            { id: 'ALERTS', label: 'Business Alerts', icon: AlertTriangle }
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = activeDashboardTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveDashboardTab(tab.id as any)}
                className={`flex items-center gap-2 px-6 py-3 rounded-sm transition-all border ${
                  isActive 
                    ? 'bg-primary/20 border-primary/50 text-primary glow-primary' 
                    : 'bg-surface/50 border-default/30 text-secondary hover:border-primary/30 hover:text-main'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span className="text-xs font-black uppercase tracking-widest">{tab.label}</span>
              </button>
            );
          })}
        </div>

        {activeDashboardTab === 'OVERVIEW' && <>
        {/* Business Overview Section */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold text-secondary uppercase tracking-[0.2em] opacity-60">Business Overview</h2>
            <div className="flex items-center gap-3 glass-panel px-4 py-2 hover:border-primary/40 transition-all">
              <span className="text-[9px] font-black text-secondary uppercase tracking-widest opacity-60">Sync: {lastUpdate}</span>
              <div className="w-px h-3 bg-default opacity-50" />
              <RotateCcw
                onClick={handleRefresh}
                className={`w-3.5 h-3.5 text-primary cursor-pointer transition-transform duration-700 ${reportsLoading ? 'animate-spin' : 'hover:rotate-180'}`}
              />
            </div>
          </div>

          {/* Metrics Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
            {/* Revenue Flow */}
            <div className="card-interactive p-6 flex flex-col justify-between min-h-[170px] grad-primary border-l-4 border-l-primary group bg-card/60 backdrop-blur-2xl">
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl -mr-16 -mt-16 animate-aura" />
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className="w-10 h-10 rounded-sm bg-primary/20 flex items-center justify-center text-primary border border-primary/30 group-hover:glow-primary transition-all">
                      <TrendingUp className="w-5 h-5" />
                    </div>
                    <span className="text-[11px] font-black text-secondary uppercase tracking-[0.2em]">Revenue Flow</span>
                  </div>
                  <div className="flex items-center gap-1 text-[10px] font-black text-success bg-success/10 border border-success/20 px-2 py-0.5 rounded-sm">
                    <TrendingUp className="w-3 h-3" />
                    +12.4%
                  </div>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-sm font-black text-primary opacity-50">₹</span>
                  <span className="text-4xl font-display font-black text-main tracking-tighter group-hover:text-primary transition-colors">{(totalRevenueLive / 100000).toFixed(2)}L</span>
                </div>
              </div>
              <div className="absolute bottom-0 left-0 right-0 h-14 opacity-30 group-hover:opacity-60 transition-all duration-700">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartDataLive}>
                    <Area type="monotone" dataKey="revenue" stroke="var(--primary)" fill="var(--primary)" strokeWidth={3} dot={false} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Capital Outflow */}
            <div className="card-interactive p-6 flex flex-col justify-between min-h-[170px] grad-error border-l-4 border-l-danger group bg-card/60 backdrop-blur-2xl">
              <div className="absolute top-0 right-0 w-32 h-32 bg-danger/5 rounded-full blur-3xl -mr-16 -mt-16 animate-aura" style={{ animationDelay: '2s' }} />
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className="w-10 h-10 rounded-sm bg-danger/20 flex items-center justify-center text-danger border border-danger/30 group-hover:glow-error transition-all">
                      <ArrowUpRight className="w-5 h-5" />
                    </div>
                    <span className="text-[11px] font-black text-secondary uppercase tracking-[0.2em]">Capital Outflow</span>
                  </div>
                  <div className="flex items-center gap-1 text-[10px] font-black text-success bg-success/10 border border-success/20 px-2 py-0.5 rounded-sm">
                    <TrendingUp className="w-3 h-3" />
                    +4.2%
                  </div>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-sm font-black text-danger opacity-50">₹</span>
                  <span className="text-4xl font-display font-black text-main tracking-tighter group-hover:text-danger transition-colors">{(totalExpensesLive / 100000).toFixed(2)}L</span>
                </div>
              </div>
              <div className="absolute bottom-0 left-0 right-0 h-14 opacity-30 group-hover:opacity-60 transition-all duration-700">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartDataLive}>
                    <Area type="monotone" dataKey="revenue" stroke="var(--danger)" fill="var(--danger)" strokeWidth={3} dot={false} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Customer Base */}
            <div className="card-interactive p-6 flex flex-col justify-between min-h-[170px] grad-primary border-l-4 border-l-info group bg-card/60 backdrop-blur-2xl">
              <div className="absolute top-0 right-0 w-32 h-32 bg-info/5 rounded-full blur-3xl -mr-16 -mt-16 animate-aura" style={{ animationDelay: '3s' }} />
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className="w-10 h-10 rounded-sm bg-info/20 flex items-center justify-center text-info border border-info/30 group-hover:glow-primary transition-all">
                      <User className="w-5 h-5" />
                    </div>
                    <span className="text-[11px] font-black text-secondary uppercase tracking-[0.2em]">Customer Base</span>
                  </div>
                  <div className="flex items-center gap-1 text-[10px] font-black text-success bg-success/10 border border-success/20 px-2 py-0.5 rounded-sm">
                    <TrendingUp className="w-3 h-3" />
                    +8.1%
                  </div>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-display font-black text-main tracking-tighter group-hover:text-info transition-colors">{totalCustomersCount}</span>
                </div>
              </div>
              <div className="absolute bottom-0 left-0 right-0 h-14 opacity-30 group-hover:opacity-60 transition-all duration-700">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartDataLive}>
                    <Area type="monotone" dataKey="revenue" stroke="var(--info)" fill="var(--info)" strokeWidth={3} dot={false} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Stock Capacity */}
            <div className="card-interactive p-6 flex flex-col justify-between min-h-[170px] grad-warning border-l-4 border-l-warning group bg-card/60 backdrop-blur-2xl">
              <div className="absolute top-0 right-0 w-32 h-32 bg-warning/5 rounded-full blur-3xl -mr-16 -mt-16 animate-aura" style={{ animationDelay: '4s' }} />
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className="w-10 h-10 rounded-sm bg-warning/20 flex items-center justify-center text-warning border border-warning/30 group-hover:glow-primary transition-all">
                      <Package className="w-5 h-5" />
                    </div>
                    <span className="text-[11px] font-black text-secondary uppercase tracking-[0.2em]">Stock Capacity</span>
                  </div>
                  <div className="flex items-center gap-1 text-[10px] font-black text-danger bg-danger/10 border border-danger/20 px-2 py-0.5 rounded-sm">
                    <TrendingDown className="w-3 h-3" />
                    -2.4%
                  </div>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-display font-black text-main tracking-tighter group-hover:text-warning transition-colors">{totalStockQuantity.toLocaleString()}</span>
                </div>
              </div>
              <div className="absolute bottom-0 left-0 right-0 h-14 opacity-30 group-hover:opacity-60 transition-all duration-700">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartDataLive}>
                    <Area type="monotone" dataKey="revenue" stroke="var(--warning)" fill="var(--warning)" strokeWidth={3} dot={false} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

        {/* Intelligence Hub Grid - Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Performance Visualization */}
          {chartDataLive.length > 0 && (
            <div className="card-interactive p-8 group bg-card/60 backdrop-blur-2xl overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl -mr-32 -mt-32 animate-aura opacity-50" />
              <div className="flex items-center justify-between mb-10 relative z-10 border-b border-default pb-4">
                <div>
                  <h3 className="text-2xl font-display font-black text-main tracking-tighter uppercase flex items-center gap-4">
                    <div className="w-2 h-8 bg-primary rounded-full shadow-[0_0_15px_rgba(var(--color-primary),0.5)]" />
                    Sales Performance
                  </h3>
                  <p className="text-[11px] text-secondary font-black uppercase tracking-[0.3em] opacity-50 mt-1">Institutional Performance Over Time</p>
                </div>
                <div className="flex items-center gap-2">
                  {['1W', '1M', '3M', '1Y'].map(p => (
                    <button 
                      key={p}
                      onClick={() => setSelectedPeriod(p)}
                      className={`px-3 py-1 text-[10px] font-black uppercase tracking-widest transition-all rounded-sm border ${selectedPeriod === p ? 'bg-primary border-primary text-white shadow-lg shadow-primary/20' : 'bg-surface/50 border-default text-secondary hover:border-primary/50'}`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>
              <div className="h-72 relative z-10">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartDataLive} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="var(--primary)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgb(var(--color-border))" opacity={0.2} />
                    <XAxis dataKey="name" fontSize={10} stroke="rgb(var(--color-text-secondary))" axisLine={false} tickLine={false} fontWeight={900} dy={15} />
                    <YAxis fontSize={10} stroke="rgb(var(--color-text-secondary))" tickFormatter={val => `₹${val >= 1000 ? (val / 1000).toFixed(0) + 'k' : val}`} axisLine={false} tickLine={false} fontWeight={900} />
                    <Tooltip
                      contentStyle={{ 
                        backgroundColor: 'rgb(var(--color-card))', 
                        borderColor: 'rgb(var(--color-border))', 
                        borderRadius: '4px', 
                        border: '1px solid rgba(var(--color-primary), 0.2)', 
                        color: 'rgb(var(--color-text))', 
                        boxShadow: 'var(--glow-primary)' 
                      }}
                      itemStyle={{ color: 'rgb(var(--color-primary))', fontWeight: '900' }}
                      formatter={(value: number) => [`₹${value.toLocaleString()}`, 'MAGNITUDE']}
                    />
                    <Area type="monotone" dataKey="revenue" stroke="var(--primary)" fill="url(#colorRevenue)" strokeWidth={4} activeDot={{ r: 8, strokeWidth: 0, fill: 'var(--primary)' }} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Shop Floor Alerts */}
          <div className="card-interactive p-8 group bg-card/60 backdrop-blur-2xl overflow-hidden relative">
              <div className="absolute top-0 right-0 w-48 h-48 bg-danger/5 rounded-full blur-3xl -mr-24 -mt-24 animate-aura opacity-50" />
              <div className="flex items-center justify-between mb-6 relative z-10 border-b border-default pb-4">
                  <div>
                      <h3 className="text-2xl font-display font-black text-main tracking-tighter uppercase flex items-center gap-4 italic">
                          <div className="w-2 h-8 bg-danger rounded-full shadow-[0_0_15px_rgba(var(--color-error),0.5)]" />
                          Floor Alerts
                      </h3>
                      <p className="text-[11px] text-secondary font-black uppercase tracking-[0.3em] opacity-50 mt-1">Immediate Tactical Tasks</p>
                  </div>
                  <span className="w-7 h-7 bg-danger/10 text-danger rounded-sm border border-danger/20 flex items-center justify-center text-[11px] font-black animate-pulse">
                      {floor_alerts.length}
                  </span>
              </div>
              <div className="flex-1 space-y-3 relative z-10">
                  {floor_alerts.map((alert, i) => {
                      const Icon = getIcon(alert.icon);
                      return (
                          <div key={i} className={`p-4 rounded-sm border border-default hover:border-primary/50 transition-all cursor-pointer group/alert flex items-start gap-4 hover:translate-x-1 duration-200`}>
                              <div className={`p-2 rounded-sm border mt-0.5 ${alert.colorClass}`}>
                                  <Icon className="w-4 h-4" />
                              </div>
                              <div className="flex-1">
                                  <h4 className="text-[12px] font-black text-main uppercase tracking-tight group-hover/alert:text-primary transition-colors">{alert.title}</h4>
                                  <p className="text-[10px] text-secondary mt-0.5 leading-relaxed opacity-80 font-bold uppercase tracking-widest">{alert.desc}</p>
                              </div>
                          </div>
                      );
                  })}
              </div>
              <button
                  onClick={() => { dispatch(setActiveTab('AUDIT_LOGS')); }}
                  className="w-full mt-6 py-3 rounded-sm border border-default text-[10px] font-black uppercase tracking-widest text-secondary hover:text-primary hover:border-primary/30 transition-all flex items-center justify-center gap-2 relative z-10"
              >
                  View All Activity <ChevronRight className="w-3.5 h-3.5" />
              </button>
          </div>
        </div>

        {/* Analytical Intelligence Grid - Profitability & Cost Intelligence */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Profitability Analysis */}
          <div className="card-interactive p-8 group bg-card/60 backdrop-blur-2xl overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-success/10 rounded-full blur-3xl -mr-32 -mt-32 animate-aura opacity-50" style={{ animationDelay: '2s' }} />
            <div className="flex justify-between items-center mb-10 relative z-10 border-b border-default pb-4">
              <div>
                <h3 className="text-2xl font-display font-black text-main tracking-tighter uppercase flex items-center gap-4">
                  <div className="w-2 h-8 bg-success rounded-full shadow-[0_0_15px_rgba(var(--color-success),0.5)]" />
                  Monthly Business Health (P&L)
                </h3>
                <p className="text-[11px] text-secondary font-black uppercase tracking-[0.3em] opacity-50 mt-1">6-Month Growth Analysis</p>
              </div>
            </div>
            <div className="h-56 relative z-10">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={profitabilityData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }} barGap={8}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgb(var(--color-border))" opacity={0.2} />
                  <XAxis dataKey="month" fontSize={10} stroke="rgb(var(--color-text-secondary))" axisLine={false} tickLine={false} fontWeight={900} />
                  <YAxis fontSize={10} stroke="rgb(var(--color-text-secondary))" tickFormatter={val => `₹${(val / 1000).toFixed(0)}k`} axisLine={false} tickLine={false} fontWeight={900} />
                  <Tooltip
                    cursor={{ fill: 'rgb(var(--color-primary))', opacity: 0.1 }}
                    contentStyle={{ 
                      backgroundColor: 'rgb(var(--color-card))', 
                      borderColor: 'rgb(var(--color-border))', 
                      borderRadius: '4px', 
                      border: '1px solid rgba(var(--color-success), 0.2)', 
                      fontSize: '10px', 
                      color: 'rgb(var(--color-text))', 
                      boxShadow: 'var(--glow-success)' 
                    }}
                    formatter={(value: number) => [`₹${value.toLocaleString()}`, '']}
                  />
                  <Bar dataKey="revenue" fill="rgb(var(--color-success))" radius={[2, 2, 0, 0]} barSize={24} />
                  <Bar dataKey="expenses" fill="rgb(var(--color-error))" radius={[2, 2, 0, 0]} barSize={24} opacity={0.6} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Cost Intelligence Pie Chart */}
          <div className="card-interactive p-8 group bg-card/60 backdrop-blur-2xl overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-danger/10 rounded-full blur-3xl -mr-32 -mt-32 animate-aura opacity-50" style={{ animationDelay: '4s' }} />
            <div className="flex justify-between items-center mb-10 relative z-10 border-b border-default pb-4">
              <div>
                <h3 className="text-2xl font-display font-black text-main tracking-tighter uppercase flex items-center gap-4">
                  <div className="w-2 h-8 bg-danger rounded-full shadow-[0_0_15px_rgba(var(--color-error),0.5)]" />
                  Expense Breakdown
                </h3>
                <p className="text-[11px] text-secondary font-black uppercase tracking-[0.3em] opacity-50 mt-1">Where Your Money is Going</p>
              </div>
            </div>
            <div className="h-56 relative z-10 flex items-center">
              <div className="flex-1 h-full">
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsPieChart>
                    <Pie
                      data={costCategoriesData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={90}
                      paddingAngle={10}
                      dataKey="value"
                    >
                      {costCategoriesData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ backgroundColor: 'rgb(var(--color-card))', border: '1px solid var(--border-default)', borderRadius: '4px', color: 'var(--text-main)', boxShadow: 'var(--glow-error)', fontSize: '10px' }}
                      formatter={(value: number) => `₹${value.toLocaleString()}`}
                    />
                  </RechartsPieChart>
                </ResponsiveContainer>
              </div>
              <div className="w-1/2 space-y-4">
                {costCategoriesData.map((item, i) => (
                  <div key={i} className="flex items-center justify-between border-b border-default/30 pb-2">
                    <div className="flex items-center gap-3">
                      <div className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: item.color, boxShadow: `0 0 10px ${item.color}40` }} />
                      <span className="text-[10px] font-black text-secondary uppercase tracking-[0.1em] truncate max-w-[100px] opacity-80">{item.name}</span>
                    </div>
                    <span className="text-[11px] font-black text-main tracking-tighter">{Math.round((item.value / costCategoriesData.reduce((s, c) => s + c.value, 0)) * 100)}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
        </>}

        {/* Intelligence Widgets - ALWAYS VISIBLE */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-12">
          {/* Inventory Predictor Widget */}
          <div className="card-interactive p-8 grad-primary border-l-4 border-l-primary group bg-card/60 backdrop-blur-2xl overflow-hidden relative">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl -mr-16 -mt-16 animate-aura opacity-50" />
            <div className="relative z-10 flex items-center gap-6 mb-8">
              <div className="w-14 h-14 rounded-sm bg-primary/20 flex items-center justify-center text-primary border border-primary/30 group-hover:glow-primary transition-all">
                <Package className="w-7 h-7" />
              </div>
              <div>
                <h4 className="text-sm font-black text-main uppercase tracking-tight">Low Stock Warning</h4>
                <p className="text-[10px] text-secondary font-black uppercase tracking-widest opacity-60">Predicting items about to run out</p>
              </div>
            </div>
            <div className="space-y-4 relative z-10">
              {stockInsights.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between bg-surface/40 p-4 rounded-sm border border-default/30 hover:border-primary/40 transition-all group/stock">
                  <div>
                    <p className="text-[11px] font-black text-main uppercase tracking-tight mb-1 group-hover/stock:text-primary transition-colors">{item.name}</p>
                    <p className="text-[9px] text-secondary uppercase font-black opacity-40">Predictive ETA: {item.refillDate}</p>
                  </div>
                  <div className="text-right">
                    <p className={`text-[11px] font-black uppercase tracking-widest ${item.urgency === 'Critical' ? 'text-danger animate-pulse' : 'text-primary'}`}>
                      {item.daysLeft} DAYS LEFT
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Credit Intelligence Widget */}
          <div className="card-interactive p-8 grad-primary border-l-4 border-l-accent group bg-card/60 backdrop-blur-2xl overflow-hidden relative">
            <div className="absolute top-0 right-0 w-32 h-32 bg-accent/10 rounded-full blur-3xl -mr-16 -mt-16 animate-aura opacity-50" />
            <div className="relative z-10 flex items-center gap-6 mb-8">
              <div className="w-14 h-14 rounded-sm bg-accent/20 flex items-center justify-center text-accent border border-accent/30 group-hover:glow-primary transition-all">
                <User className="w-7 h-7" />
              </div>
              <div>
                <h4 className="text-sm font-black text-main uppercase tracking-tight">Customer Credit Risk</h4>
                <p className="text-[10px] text-secondary font-black uppercase tracking-widest opacity-60">Tracking risky udhaar customers</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 relative z-10">
              {creditInsights.map((item, idx) => (
                <div key={idx} className="p-4 bg-surface/40 rounded-sm border border-default/30 hover:border-accent/40 transition-all">
                  <p className="text-[9px] font-black text-secondary uppercase tracking-[0.2em] mb-4 opacity-50">{item.name}</p>
                  <div className="flex items-end justify-between">
                    <p className="text-xl font-display font-black text-main tracking-tighter">{item.score}<span className="text-[10px] text-secondary ml-1 opacity-30">/100</span></p>
                    <span className={`text-[8px] font-black px-2 py-0.5 rounded-sm uppercase tracking-widest border shadow-sm ${item.risk === 'High' ? 'bg-danger/20 border-danger/40 text-danger' : 'bg-success/20 border-success/40 text-success'}`}>
                      {item.risk} RISK
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {activeDashboardTab === 'ALERTS' &&
        <div className="space-y-6 mt-12">
          <h3 className="text-[11px] font-black text-secondary uppercase tracking-[0.5em] opacity-50 pl-2 mb-4 border-b border-default pb-4">Important Business Alerts</h3>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {business_alerts.map((alert, idx) => (
              <div key={idx} className="card-interactive p-8 grad-error border-l-4 border-l-danger group relative overflow-hidden bg-card/60 backdrop-blur-2xl">
                <div className="absolute -right-4 -top-4 w-32 h-32 bg-danger/10 rounded-full blur-3xl animate-aura opacity-50" />
                <div className="flex items-center justify-between mb-6 relative z-10">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-sm bg-danger/20 flex items-center justify-center text-danger border border-danger/30 group-hover:glow-error transition-all">
                      <ShieldAlert className="w-7 h-7 animate-pulse" />
                    </div>
                    <div>
                      <h4 className="text-sm font-black text-main uppercase tracking-tight">{alert.title}</h4>
                      <p className="text-[10px] text-secondary font-black uppercase tracking-widest opacity-60">{alert.subtitle}</p>
                    </div>
                  </div>
                </div>
                <p className="text-[11px] text-secondary leading-relaxed mb-6 font-bold opacity-80 relative z-10">
                  {alert.description}
                </p>
                <div className="flex items-end justify-between mb-6 relative z-10">
                  <div className="px-3 py-1 bg-danger/20 border border-danger/30 rounded-sm text-[9px] font-black text-danger uppercase tracking-widest">
                    {alert.urgency}
                  </div>
                  <p className="text-2xl font-display font-black text-main tracking-tighter">{alert.metric}</p>
                </div>
                <button className="w-full py-3 bg-danger/10 border border-danger/30 text-[10px] font-black text-danger uppercase tracking-[0.3em] hover:bg-danger hover:text-white transition-all relative z-10 rounded-sm">
                  {alert.action}
                </button>
              </div>
            ))}
          </div>
        </div>
        }

        {/* Recent Vendor Transactions */}
        <div className="card-interactive p-8 group bg-card/60 backdrop-blur-2xl overflow-hidden relative mt-6">
            <div className="absolute bottom-0 left-0 w-96 h-96 bg-primary/5 rounded-full blur-[120px] -ml-48 -mb-48 animate-aura opacity-50" />
            <div className="flex items-center justify-between mb-8 relative z-10 border-b border-default pb-4">
                <div>
                    <h3 className="text-2xl font-display font-black text-main tracking-tighter uppercase flex items-center gap-4 italic">
                        <div className="w-2 h-8 bg-primary rounded-full shadow-[0_0_15px_rgba(var(--color-primary),0.5)]" />
                        Vendor Purchase Log
                    </h3>
                    <p className="text-[11px] text-secondary font-black uppercase tracking-[0.3em] opacity-50 mt-1">Latest procurement & supply nodes</p>
                </div>
            </div>
            <div className="overflow-x-auto relative z-10">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="border-b border-default">
                            <th className="py-3 px-4 text-[9px] font-black uppercase tracking-widest text-secondary opacity-50">Vendor Node</th>
                            <th className="py-3 px-4 text-[9px] font-black uppercase tracking-widest text-secondary opacity-50">Identity Node</th>
                            <th className="py-3 px-4 text-[9px] font-black uppercase tracking-widest text-secondary opacity-50">Throughput</th>
                            <th className="py-3 px-4 text-[9px] font-black uppercase tracking-widest text-secondary opacity-50 text-center">Protocol State</th>
                            <th className="py-3 px-4 text-[9px] font-black uppercase tracking-widest text-secondary opacity-50 text-right">Timestamp</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-default/50">
                        {recentTransactions.map((txn, i) => (
                            <tr key={i} className="hover:bg-default/5 transition-colors group/row">
                                <td className="py-4 px-4">
                                    <p className="text-sm font-black text-main uppercase tracking-tight group-hover/row:text-primary transition-colors">{txn.vendor}</p>
                                </td>
                                <td className="py-4 px-4 text-[10px] font-black text-secondary uppercase tracking-widest">{txn.mobile}</td>
                                <td className="py-4 px-4 text-sm font-black text-main tabular-nums">{txn.amount}</td>
                                <td className="py-4 px-4 text-center">
                                    <span className={`px-3 py-1 rounded-sm text-[9px] font-black uppercase tracking-widest border ${txn.status === 'RECEIVED' ? 'bg-success/10 border-success/30 text-success' : 'bg-warning/10 border-warning/30 text-warning'}`}>
                                        {txn.status}
                                    </span>
                                </td>
                                <td className="py-4 px-4 text-[10px] font-black text-secondary text-right uppercase tracking-widest">{txn.date}</td>
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

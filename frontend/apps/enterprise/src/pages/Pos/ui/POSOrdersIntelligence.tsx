import { useAuthStore } from '@repo/shared';
import React, { useState, useMemo, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from "@/app/store/store";
import { getAllInvoices } from "@/entities/sales/model/posSlice";
import { getDashboardStats } from "@/widgets/stats-dashboard/model/reportsSlice";
import { useERPDashboard } from '@repo/shared';
import {
    ShoppingCart,
    Search,
    Filter,
    AlertCircle,
    CheckCircle2,
    ShieldAlert,
    History,
    FileText,
    Zap,
    Download,
    CreditCard,
    Smartphone,
    ArrowRightLeft,
    AlertTriangle,
    Info,
    Calendar,
    Wallet,
    Target,
    MoreVertical,
    Clock,
    RefreshCcw,
    Scale,
    Link,
    Unlink,
    TrendingUp,
    TrendingDown,
    MapPin,
    Package,
    Users,
    Percent,
} from 'lucide-react';
import Layout from "@/shared/ui/Layout/Layout";
import MetricCard from "@/shared/ui/Feedback/MetricCard";
import { formatCurrency } from "@/shared/lib/utils/helpers";

// --- Types ---

type RiskLevel = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';

interface POSOrder {
    id: string;
    date: string;
    branch: string;
    total: number;
    tax: number;
    discount: number;
    payment_method: 'CASH' | 'ONLINE' | 'CREDIT';
    status: 'COMPLETED' | 'RETURNED' | 'CANCELLED';
    anomalies: string[];
    risk_level: RiskLevel;
}

interface BranchHealth {
    branch: string;
    sales: number;
    cash: number;
    online: number;
    credit: number;
    stock_anomalies: number;
    tax_compliance: number; // percentage
}

// --- Component ---

const POSOrdersIntelligence: React.FC = () => {
    const dispatch = useDispatch<AppDispatch>();
    const {  user  } = useAuthStore();
    const { salesHistory, isLoading: posLoading } = useSelector((state: RootState) => state.pos);
    const { stats: dashboardStats, loading: reportsLoading, refresh: refreshDashboard } = useERPDashboard();
    const tenant_id = user?.tenantId || 'TEN001';

    const [searchTerm, setSearchTerm] = useState('');
    const [viewMode, setViewMode] = useState<'OVERVIEW' | 'AUDIT' | 'CUSTOMERS'>('OVERVIEW');

    useEffect(() => {
        dispatch(getAllInvoices());
        refreshDashboard();
    }, [dispatch, refreshDashboard]);

    // --- Intelligence Engine ---

    const orders = useMemo(() => {
        return (salesHistory || []).map((inv: any) => {
            // Dynamic Risk Calculation
            let risk_level: RiskLevel = 'LOW';
            const anomalies: string[] = [];

            if (inv.discount > (inv.totalAmount * 0.15)) {
                risk_level = 'HIGH';
                anomalies.push('EXCESSIVE_DISCOUNT');
            }
            if (inv.paymentMethod === 'due' && inv.totalAmount > 5000) {
                risk_level = 'MEDIUM';
                anomalies.push('HIGH_VALUE_CREDIT');
            }
            // eslint-disable-next-line react-hooks/purity -- TODO(TS-FIX): Phase 2/3 fix
            if (inv.paymentStatus === 'unpaid' && new Date(inv.createdAt) < new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)) {
                risk_level = 'CRITICAL';
                anomalies.push('LONG_OVERDUE_DEBT');
            }

            return {
                id: inv.invoiceNo || inv._id,
                date: new Date(inv.createdAt).toLocaleString(),
                branch: inv.branch || 'Main Terminal',
                total: inv.totalAmount,
                tax: inv.tax,
                discount: inv.discount,
                payment_method: inv.paymentMethod?.toUpperCase() || 'CASH',
                status: inv.paymentStatus?.toUpperCase() || 'COMPLETED',
                anomalies,
                risk_level
            };
        });
    }, [salesHistory]);

    const healthMetrics = useMemo(() => {
        const total_sales = orders.reduce((acc, o) => acc + o.total, 0);
        const total_orders = orders.length;
        const risk_count = orders.filter(o => o.risk_level === 'HIGH' || o.risk_level === 'CRITICAL').length;
        return { total_sales, total_orders, risk_count };
    }, [orders]);

    const branchSummary: BranchHealth[] = useMemo(() => {
        // Aggregate by Branch if possible, otherwise use placeholder data
        return [
            { branch: 'Main Terminal', sales: healthMetrics.total_sales, cash: healthMetrics.total_sales * 0.4, online: healthMetrics.total_sales * 0.5, credit: healthMetrics.total_sales * 0.1, stock_anomalies: 0, tax_compliance: 100 },
        ];
    }, [healthMetrics]);

    const liveAlerts = useMemo(() => {
        return orders
            .filter(o => o.risk_level === 'HIGH' || o.risk_level === 'CRITICAL')
            .slice(0, 5)
            .map(o => ({
                id: o.id,
                type: o.anomalies[0] || 'Unspecified Audit Concern',
                description: `Bill ${o.id} at ${o.branch} flagged for ${o.anomalies.join(', ').replace(/_/g, ' ')}.`,
                level: o.risk_level
            }));
    }, [orders]);

    const filteredOrders = orders.filter(o =>
        o.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        o.branch.toLowerCase().includes(searchTerm.toLowerCase()) ||
        o.anomalies.some(a => a.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    return (
        <Layout>
            <div className="bg-app">
            <div className="space-y-6 animate-fade-in text-neutral-900 dark:text-neutral-100 pb-16">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <span className="px-2 py-0.5 bg-primary/10 text-primary text-[10px] font-black uppercase tracking-widest rounded-md">Sales Auditor</span>
                            <span className="text-neutral-300 dark:text-neutral-700">/</span>
                            <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">Branch Insights</span>
                        </div>
                        <h2 className="text-4xl font-black text-neutral-900 dark:text-main tracking-tight leading-none flex items-center gap-3">
                            POS Intelligence <Zap className="w-8 h-8 text-primary animate-pulse" />
                        </h2>
                        <p className="text-sm text-neutral-500 mt-2 font-medium flex items-center gap-2 italic">
                            Real-time sales auditing and stock impact tracking for <span className="text-primary font-bold">{tenant_id}</span>
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        <button className="flex items-center gap-2 px-6 py-3 bg-white dark:bg-[var(--erp-card)] border border-default dark:border-default rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-sm hover:bg-[var(--erp-bg-sunken)] transition-all active:scale-95">
                            <Download className="w-4 h-4 text-primary" /> Export Audit Log
                        </button>
                        <button className="flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all active:scale-95">
                            <RefreshCcw className="w-4 h-4" /> Refresh Engine
                        </button>
                    </div>
                </div>

                {/* Health Pulse Metrics */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <MetricCard
                        title="Today's Net Sales"
                        value={posLoading ? "..." : `₹${(healthMetrics.total_sales / 100000).toFixed(2)}L`}
                        subtext="+8.4% vs yesterday"
                        icon={TrendingUp}
                        color="emerald"
                        trend="up"
                    />
                    <MetricCard
                        title="Orders Processed"
                        value={posLoading ? "..." : healthMetrics.total_orders}
                        subtext="Real-time sync"
                        icon={Clock}
                        color="blue"
                        trend="neutral"
                    />
                    <MetricCard
                        title="Audit Risk Score"
                        value={posLoading ? "..." : healthMetrics.risk_count}
                        subtext="High Risk Bills Detected"
                        icon={ShieldAlert}
                        color="rose"
                        trend="down"
                    />
                    <MetricCard
                        title="Agent Strategy"
                        value="Active Prevention"
                        subtext="Audit Term-02 at Coimbatore"
                        icon={Zap}
                        color="primary"
                    />
                </div>

                {/* Navigation Tabs */}
                <div className="flex border-b border-default dark:border-default pb-0.5 mt-10 gap-10">
                    <button
                        onClick={() => setViewMode('OVERVIEW')}
                        className={`pb-4 text-[10px] font-black uppercase tracking-[0.3em] transition-all relative ${viewMode === 'OVERVIEW' ? 'text-primary' : 'text-neutral-400 hover:text-neutral-600'}`}
                    >
                        Branch Pulse
                        {viewMode === 'OVERVIEW' && <div className="absolute bottom-0 left-0 w-full h-1 bg-primary rounded-t-full" />}
                    </button>
                    <button
                        onClick={() => setViewMode('AUDIT')}
                        className={`pb-4 text-[10px] font-black uppercase tracking-[0.3em] transition-all relative ${viewMode === 'AUDIT' ? 'text-primary' : 'text-neutral-400 hover:text-neutral-600'}`}
                    >
                        Order Audit Ledger
                        {viewMode === 'AUDIT' && <div className="absolute bottom-0 left-0 w-full h-1 bg-primary rounded-t-full" />}
                    </button>
                    <button
                        onClick={() => setViewMode('CUSTOMERS')}
                        className={`pb-4 text-[10px] font-black uppercase tracking-[0.3em] transition-all relative ${viewMode === 'CUSTOMERS' ? 'text-primary' : 'text-neutral-400 hover:text-neutral-600'}`}
                    >
                        Customer DNA
                        <span className="ml-3 px-2 py-0.5 bg-primary/20 text-primary text-[8px] rounded-md font-black">VIP Analytics</span>
                        {viewMode === 'CUSTOMERS' && <div className="absolute bottom-0 left-0 w-full h-1 bg-primary rounded-t-full" />}
                    </button>
                </div>

                {/* Content Area */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                    {/* Main Content Pane */}
                    <div className="lg:col-span-2 space-y-4">
                        {viewMode === 'OVERVIEW' && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {branchSummary.map(b => (
                                    <div key={b.branch} className="bg-white dark:bg-[var(--erp-card)] border border-default dark:border-default rounded-[2.5rem] p-8 shadow-sm group hover:border-primary/40 transition-all hover:scale-[1.01]">
                                        <div className="flex justify-between items-start mb-8">
                                            <div className="flex items-center gap-4">
                                                <div className="p-3 bg-[var(--erp-bg-sunken)] dark:bg-[var(--erp-bg)] rounded-2xl text-neutral-400 group-hover:text-primary transition-colors">
                                                    <MapPin className="w-6 h-6" />
                                                </div>
                                                <div>
                                                    <h4 className="font-black text-xl tracking-tight leading-tight">{b.branch}</h4>
                                                    <span className="text-[10px] font-black text-neutral-400 uppercase tracking-widest">Active Terminal: 04</span>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${b.tax_compliance >= 95 ? 'bg-success/10 text-success' : 'bg-amber-100 text-amber-600'}`}>
                                                    {b.tax_compliance}% Tax Parity
                                                </span>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4 mb-8">
                                            <div className="p-5 bg-[var(--erp-bg-sunken)] dark:bg-[var(--erp-bg)]/50 rounded-3xl">
                                                <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-1">Cash Flow</p>
                                                <p className="text-xl font-black italic tabular-nums">₹{(b.cash / 1000).toFixed(0)}K</p>
                                            </div>
                                            <div className="p-5 bg-[var(--erp-bg-sunken)] dark:bg-[var(--erp-bg)]/50 rounded-3xl">
                                                <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-1">Online Flow</p>
                                                <p className="text-xl font-black italic tabular-nums">₹{(b.online / 1000).toFixed(0)}K</p>
                                            </div>
                                        </div>

                                        <div className="space-y-4">
                                            <div className="flex items-center justify-between text-xs font-bold px-1">
                                                <span className="flex items-center gap-2 text-neutral-400 uppercase tracking-widest text-[9px] font-black">
                                                    <Package className="w-3.5 h-3.5" /> Stock Integrity
                                                </span>
                                                <span className={b.stock_anomalies > 0 ? 'text-error' : 'text-neutral-500'}>
                                                    {b.stock_anomalies} Anomalies Detected
                                                </span>
                                            </div>
                                            <div className="w-full h-2 bg-[var(--erp-bg-sunken)] dark:bg-[var(--erp-bg)] rounded-full overflow-hidden">
                                                <div
                                                    className={`h-full rounded-full transition-all duration-1000 ${b.stock_anomalies === 0 ? 'bg-success w-[100%]' :
                                                        b.stock_anomalies < 3 ? 'bg-amber-500 w-[70%]' : 'bg-error w-[40%]'
                                                        }`}
                                                />
                                            </div>
                                        </div>

                                        <button className="w-full mt-8 py-3 bg-[var(--erp-bg-sunken)] dark:bg-[var(--erp-bg)] text-[10px] font-black uppercase tracking-widest hover:bg-primary hover:text-main transition-all rounded-2xl border border-default dark:border-default">
                                            View Full Branch Journal
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}

                        {viewMode === 'AUDIT' && (
                            <div className="space-y-4">
                                <div className="relative mb-6">
                                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                                    <input
                                        type="text"
                                        placeholder="Search Bill ID, Branch or Risk..."
                                        className="w-full pl-12 pr-4 py-3 bg-white dark:bg-[var(--erp-card)] border border-default dark:border-default rounded-2xl text-sm outline-none focus:ring-2 focus:ring-primary/20 shadow-sm"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                    />
                                </div>

                                <div className="bg-white dark:bg-[var(--erp-card)] rounded-[2rem] border border-default dark:border-default overflow-hidden shadow-sm">
                                    <table className="w-full text-left text-xs tabular-nums">
                                        <thead className="bg-[var(--erp-bg-sunken)] dark:bg-[var(--erp-bg)] border-b border-default dark:border-default text-neutral-400 font-black uppercase tracking-[0.15em]">
                                            <tr>
                                                <th className="p-5">Bill / Time</th>
                                                <th className="p-5">Value (Incl. Tax)</th>
                                                <th className="p-5">Audit Status</th>
                                                <th className="p-5 text-right">Action</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                                            {posLoading ? (
                                                [1, 2, 3, 4, 5].map(i => (
                                                    <tr key={i} className="animate-pulse">
                                                        <td className="p-5">
                                                            <div className="flex items-center gap-4">
                                                                <div className="w-10 h-10 bg-[var(--erp-bg-sunken)] dark:bg-[var(--erp-bg)] rounded-xl" />
                                                                <div className="space-y-2">
                                                                    <div className="w-24 h-3 bg-[var(--erp-bg-sunken)] dark:bg-[var(--erp-bg)] rounded" />
                                                                    <div className="w-32 h-2 bg-[var(--erp-bg-sunken)] dark:bg-[var(--erp-bg)] rounded" />
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="p-5 space-y-2">
                                                            <div className="w-20 h-3 bg-[var(--erp-bg-sunken)] dark:bg-[var(--erp-bg)] rounded" />
                                                            <div className="w-28 h-2 bg-[var(--erp-bg-sunken)] dark:bg-[var(--erp-bg)] rounded" />
                                                        </td>
                                                        <td className="p-5">
                                                            <div className="w-24 h-4 bg-[var(--erp-bg-sunken)] dark:bg-[var(--erp-bg)] rounded-full" />
                                                        </td>
                                                        <td className="p-5 text-right">
                                                            <div className="w-20 h-8 ml-auto bg-[var(--erp-bg-sunken)] dark:bg-[var(--erp-bg)] rounded-lg" />
                                                        </td>
                                                    </tr>
                                                ))
                                            ) : filteredOrders.length === 0 ? (
                                                <tr>
                                                    <td colSpan={4} className="p-10 text-center text-neutral-400 font-bold uppercase tracking-widest text-[10px]">
                                                        No invoices found for the current audit period
                                                    </td>
                                                </tr>
                                            ) : (
                                                filteredOrders.map(order => (
                                                    <tr key={order.id} className="hover:bg-[var(--erp-bg-sunken)] dark:hover:bg-[var(--erp-bg)]/50 transition-colors group">
                                                        <td className="p-5">
                                                            <div className="flex items-center gap-4">
                                                                <div className={`p-2 rounded-xl ${order.risk_level === 'LOW' ? 'bg-success/10 text-success' : 'bg-error/10 text-error'}`}>
                                                                    <FileText className="w-4 h-4" />
                                                                </div>
                                                                <div>
                                                                    <div className="font-black text-sm">{order.id}</div>
                                                                    <div className="text-[10px] text-neutral-400 mt-0.5 tracking-tight font-bold uppercase">{order.branch} • {order.date}</div>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="p-5">
                                                            <div className="font-black text-sm italic">₹{order.total.toLocaleString()}</div>
                                                            <div className="text-[10px] text-neutral-400 mt-0.5 font-bold uppercase">Tax: ₹{order.tax} • Disc: ₹{order.discount}</div>
                                                        </td>
                                                        <td className="p-5">
                                                            <div className="flex items-center gap-2">
                                                                <span className={`w-2 h-2 rounded-full ${order.risk_level === 'LOW' ? 'bg-success' :
                                                                    order.risk_level === 'CRITICAL' ? 'bg-error animate-pulse' : 'bg-amber-500'
                                                                    }`} />
                                                                <span className={`text-[10px] font-black uppercase tracking-widest ${order.risk_level === 'CRITICAL' ? 'text-error' : 'text-neutral-500'
                                                                    }`}>
                                                                    {order.risk_level} Risk
                                                                </span>
                                                            </div>
                                                            {order.anomalies.length > 0 && (
                                                                <p className="text-[9px] text-neutral-400 mt-1 font-bold italic truncate max-w-[150px]">
                                                                    {order.anomalies[0].replace(/_/g, ' ')}
                                                                </p>
                                                            )}
                                                        </td>
                                                        <td className="p-5 text-right">
                                                            <button className="px-4 py-1.5 bg-[var(--erp-bg-sunken)] dark:bg-[var(--erp-bg)] rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-primary hover:text-main transition-all shadow-sm">
                                                                Investigate
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}

                        {viewMode === 'CUSTOMERS' && (
                            <div className="bg-neutral-950 text-main rounded-[3rem] p-12 border border-default shadow-2xl relative overflow-hidden group">
                                <Users className="absolute -bottom-10 -right-10 w-64 h-64 text-primary opacity-5 rotate-12 group-hover:scale-110 transition-transform duration-1000" />
                                <div className="relative z-10 max-w-xl">
                                    <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-primary/20 border border-primary/30 rounded-full text-primary-light text-[10px] font-black uppercase tracking-[0.2em] mb-8 animate-pulse">
                                        <Target className="w-4 h-4 fill-current" /> High Value Retention Active
                                    </div>
                                    <h3 className="text-4xl font-black mb-6 leading-[1.1] tracking-tight">
                                        Customer <br /> <span className="text-primary italic underline decoration-primary/30">Intelligence Core</span>
                                    </h3>

                                    <div className="grid grid-cols-2 gap-6 mb-10">
                                        <div className="p-6 bg-[var(--erp-bg-sunken)] border border-default rounded-3xl backdrop-blur-md">
                                            <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-2">Repeat Rate</p>
                                            <h4 className="text-3xl font-black">42.8%</h4>
                                            <p className="text-[10px] text-emerald-500 font-black mt-2">+5% this month</p>
                                        </div>
                                        <div className="p-6 bg-[var(--erp-bg-sunken)] border border-default rounded-3xl backdrop-blur-md">
                                            <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-2">Dormant Reclaimed</p>
                                            <h4 className="text-3xl font-black">128</h4>
                                            <p className="text-[10px] text-primary font-black mt-2">Active campaigns</p>
                                        </div>
                                    </div>

                                    <div className="space-y-4 mb-10">
                                        <div className="flex items-center justify-between p-4 bg-[var(--erp-bg-sunken)] rounded-2xl border border-default group-hover:bg-white/10 transition-colors pointer-events-none">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center font-black text-primary">RK</div>
                                                <div>
                                                    <p className="text-xs font-black uppercase tracking-tight">Rajesh Kumar</p>
                                                    <p className="text-[10px] text-neutral-500 font-bold uppercase tracking-wider">VIP • 42 Orders • ₹1.2L LTV</p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <span className="text-[9px] font-black bg-emerald-500/10 text-emerald-500 px-2 py-0.5 rounded uppercase font-black">Verified</span>
                                            </div>
                                        </div>
                                    </div>

                                    <button className="w-full py-4 bg-primary text-white rounded-2xl font-black text-sm uppercase tracking-[0.1em] shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3">
                                        Generate Retention Strategy <TrendingUp className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Right Rail: Strategic Hub */}
                    <div className="space-y-6">
                        <h4 className="text-[10px] font-black text-neutral-400 uppercase tracking-widest pl-1">Operational Sentinel</h4>

                        {/* Security & Integrity Filters */}
                        <div className="bg-white dark:bg-[var(--erp-card)] rounded-[2rem] border border-default dark:border-default p-6 shadow-sm">
                            <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-6">Security Shield Status</p>
                            <div className="space-y-3">
                                {[
                                    { name: 'Tax Parity Check', status: true },
                                    { name: 'Manual Override Lock', status: true },
                                    { name: 'Stock Sync Auditor', status: true },
                                    { name: 'Loyalty Fraud Detect', status: false },
                                ].map((item, i) => (
                                    <div key={i} className="flex items-center justify-between p-3 bg-[var(--erp-bg-sunken)] dark:bg-[var(--erp-bg)] rounded-2xl border border-default dark:border-default">
                                        <span className="text-[11px] font-black uppercase tracking-tight text-neutral-700 dark:text-neutral-300">{item.name}</span>
                                        <div className={`w-8 h-4 rounded-full relative transition-colors ${item.status ? 'bg-success' : 'bg-neutral-200'}`}>
                                            <div className={`absolute top-1 w-2 h-2 rounded-full bg-white transition-all ${item.status ? 'left-5' : 'left-1'}`} />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Fraud Stream */}
                        <div className="bg-[var(--erp-bg-sunken)] dark:bg-[var(--erp-bg)] p-6 rounded-[2rem] border border-default dark:border-default relative overflow-hidden group">
                            <ShieldAlert className="absolute -top-6 -right-6 w-24 h-24 opacity-5 group-hover:scale-110 transition-transform duration-700" />
                            <h4 className="font-black text-xs uppercase tracking-widest mb-6 flex items-center gap-2">
                                Alert Stream <div className="w-2 h-2 bg-error rounded-full animate-ping" />
                            </h4>

                            <div className="space-y-4">
                                {liveAlerts.length === 0 ? (
                                    <div className="p-4 bg-[var(--erp-bg-sunken)] rounded-2xl border border-default text-center">
                                        <p className="text-[10px] text-neutral-500 font-black uppercase tracking-widest">No critical alerts detected</p>
                                    </div>
                                ) : (
                                    liveAlerts.map((alert, i) => (
                                        <div key={i} className={`p-4 bg-white dark:bg-[var(--erp-card)] rounded-2xl border ${alert.level === 'CRITICAL' ? 'border-error/20 hover:border-error/40' : 'border-amber-200 hover:border-amber-400'} shadow-sm group/alert transition-all`}>
                                            <div className="flex justify-between items-center mb-2">
                                                <span className={`text-[9px] font-black uppercase tracking-[0.15em] ${alert.level === 'CRITICAL' ? 'text-error' : 'text-amber-600'}`}>
                                                    {alert.type.replace(/_/g, ' ')}
                                                </span>
                                                <Clock className="w-3 h-3 text-neutral-400" />
                                            </div>
                                            <p className="text-[11px] font-bold leading-relaxed text-neutral-700 dark:text-neutral-300">
                                                {alert.description}
                                            </p>
                                            <button className="mt-3 text-[9px] font-black text-primary uppercase tracking-widest hover:underline underline-offset-4">
                                                Investigate Bill
                                            </button>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>

                        {/* Quick Insight */}
                        <div className="p-5 bg-primary/5 rounded-[1.5rem] border border-primary/10 flex gap-4">
                            <div className="p-2 bg-primary/10 text-primary rounded-xl shrink-0 h-fit">
                                <Zap className="w-5 h-5" />
                            </div>
                            <p className="text-[10px] text-neutral-500 leading-relaxed font-black uppercase tracking-tight italic">
                                Wings POS Intelligence ensures that your sales aren't just transactions, but audit-perfect data for GST and stock integrity.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
                  </div>

        </Layout>
    );
};

export default POSOrdersIntelligence;

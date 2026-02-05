import React, { useState, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from "../../redux/store";
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
    const { user } = useSelector((state: RootState) => state.auth);
    const tenant_id = user?.tenantId || 'TEN001';

    const [searchTerm, setSearchTerm] = useState('');
    const [viewMode, setViewMode] = useState<'OVERVIEW' | 'AUDIT' | 'CUSTOMERS'>('OVERVIEW');

    // --- Intelligence Engine ---

    const orders: POSOrder[] = useMemo(() => [
        { id: 'ORD-9901', date: '2026-01-11 14:20', branch: 'Chennai Main', total: 12500, tax: 2250, discount: 500, payment_method: 'ONLINE', status: 'COMPLETED', anomalies: [], risk_level: 'LOW' },
        { id: 'ORD-9902', date: '2026-01-11 15:45', branch: 'Madurai Godown', total: 4500, tax: 270, discount: 1200, payment_method: 'CASH', status: 'COMPLETED', anomalies: ['MANUAL_DISCOUNT_OVERRIDE'], risk_level: 'HIGH' },
        { id: 'ORD-9903', date: '2026-01-11 16:10', branch: 'Chennai Main', total: 8200, tax: 492, discount: 0, payment_method: 'ONLINE', status: 'COMPLETED', anomalies: ['TAX_MISMATCH_6%_EXPECTED_18%'], risk_level: 'CRITICAL' },
        { id: 'ORD-9904', date: '2026-01-11 10:05', branch: 'Coimbatore Store', total: 5500, tax: 990, discount: 200, payment_method: 'CASH', status: 'RETURNED', anomalies: ['STOCK_NOT_RESTORED'], risk_level: 'MEDIUM' },
        { id: 'ORD-9905', date: '2026-01-11 18:30', branch: 'Chennai Main', total: 45000, tax: 8100, discount: 0, payment_method: 'CREDIT', status: 'COMPLETED', anomalies: [], risk_level: 'LOW' },
    ], []);

    const branchSummary: BranchHealth[] = useMemo(() => [
        { branch: 'Chennai Main', sales: 620000, cash: 210000, online: 380000, credit: 30000, stock_anomalies: 2, tax_compliance: 94 },
        { branch: 'Madurai Godown', sales: 340000, cash: 180000, online: 150000, credit: 10000, stock_anomalies: 0, tax_compliance: 100 },
        { branch: 'Coimbatore Store', sales: 280000, cash: 120000, online: 140000, credit: 20000, stock_anomalies: 5, tax_compliance: 88 },
    ], []);

    const healthMetrics = useMemo(() => {
        const total_sales = branchSummary.reduce((acc, b) => acc + b.sales, 0);
        const total_orders = 482; // Simulated
        const gst_collected = total_sales * 0.15; // Simulated 15% avg
        const risk_count = orders.filter(o => o.risk_level === 'HIGH' || o.risk_level === 'CRITICAL').length;
        return { total_sales, total_orders, gst_collected, risk_count };
    }, [branchSummary, orders]);

    const filteredOrders = orders.filter(o =>
        o.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        o.branch.toLowerCase().includes(searchTerm.toLowerCase()) ||
        o.anomalies.some(a => a.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    return (
        <div className="space-y-6 animate-fade-in text-neutral-900 dark:text-neutral-100 pb-16">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-black flex items-center gap-2 tracking-tight">
                        <ShoppingCart className="w-6 h-6 text-primary" />
                        POS Orders Intelligence
                    </h2>
                    <p className="text-sm text-neutral-500 mt-0.5">
                        Real-time sales auditing and stock impact tracking for <span className="font-bold text-primary">{tenant_id}</span>
                    </p>
                </div>
                <div className="flex gap-2">
                    <button className="px-4 py-2 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-neutral-50 shadow-sm transition-all active:scale-95">
                        <Download className="w-4 h-4" /> Export Audit Log
                    </button>
                    <button className="px-4 py-2 bg-primary text-white rounded-xl text-sm font-black shadow-lg shadow-primary/20 flex items-center gap-2 hover:bg-primary/90 transition-all active:scale-95">
                        <RefreshCcw className="w-4 h-4" /> Refresh Engine
                    </button>
                </div>
            </div>

            {/* Health Pulse Rows */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white dark:bg-neutral-800 p-6 rounded-3xl border border-neutral-200 dark:border-neutral-700 shadow-sm relative group overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                        <TrendingUp className="w-16 h-16" />
                    </div>
                    <p className="text-[10px] font-black text-neutral-400 uppercase tracking-[0.1em] mb-1">Today's Net Sales</p>
                    <h3 className="text-2xl font-black tabular-nums">₹{(healthMetrics.total_sales / 100000).toFixed(2)}L</h3>
                    <div className="flex items-center gap-1.5 mt-2">
                        <TrendingUp className="w-4 h-4 text-success" />
                        <span className="text-xs font-bold text-success">+8.4% vs yesterday</span>
                    </div>
                </div>

                <div className="bg-white dark:bg-neutral-800 p-6 rounded-3xl border border-neutral-200 dark:border-neutral-700 shadow-sm relative group overflow-hidden">
                    <p className="text-[10px] font-black text-neutral-400 uppercase tracking-[0.1em] mb-1">Orders Processed</p>
                    <h3 className="text-2xl font-black tabular-nums">{healthMetrics.total_orders} <span className="text-xs text-neutral-400 font-black uppercase tracking-tighter not-italic">Bills</span></h3>
                    <div className="flex items-center gap-1.5 mt-2">
                        <Clock className="w-4 h-4 text-neutral-400" />
                        <span className="text-xs font-medium text-neutral-500">Peak: 1:30 PM (64 bills/hr)</span>
                    </div>
                </div>

                <div className="bg-white dark:bg-neutral-800 p-6 rounded-3xl border border-neutral-200 dark:border-neutral-700 shadow-sm relative group overflow-hidden">
                    <p className="text-[10px] font-black text-neutral-400 uppercase tracking-[0.1em] mb-1">Audit Risk Score</p>
                    <h3 className="text-2xl font-black text-error">{healthMetrics.risk_count} <span className="text-xs text-neutral-400 font-black uppercase tracking-tighter not-italic">High Risk</span></h3>
                    <div className="flex items-center gap-1.5 mt-2 text-error animate-pulse">
                        <ShieldAlert className="w-4 h-4" />
                        <span className="text-xs font-black uppercase tracking-widest">Action Required</span>
                    </div>
                </div>

                <div className="bg-neutral-900 text-white p-6 rounded-3xl shadow-xl shadow-neutral-900/20 relative group overflow-hidden border border-neutral-800">
                    <Zap className="absolute top-0 right-0 p-4 opacity-10 group-hover:rotate-12 transition-transform duration-700" />
                    <p className="text-[10px] font-black text-primary-light uppercase tracking-[0.1em] mb-1 italic">Agent Strategy</p>
                    <h3 className="text-sm font-black italic leading-tight">"Audit Term-02 at Coimbatore (5 stock anomalies detected)"</h3>
                    <p className="text-[10px] opacity-70 mt-2 font-black uppercase tracking-widest">Active Prevention</p>
                </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex border-b border-neutral-100 dark:border-neutral-800 pb-0.5 mt-8 gap-8">
                <button
                    onClick={() => setViewMode('OVERVIEW')}
                    className={`pb-3 text-sm font-black transition-all relative ${viewMode === 'OVERVIEW' ? 'text-primary' : 'text-neutral-400 hover:text-neutral-600'}`}
                >
                    Branch Pulse
                    {viewMode === 'OVERVIEW' && <div className="absolute bottom-0 left-0 w-full h-1 bg-primary rounded-t-full" />}
                </button>
                <button
                    onClick={() => setViewMode('AUDIT')}
                    className={`pb-3 text-sm font-black transition-all relative ${viewMode === 'AUDIT' ? 'text-primary' : 'text-neutral-400 hover:text-neutral-600'}`}
                >
                    Order Audit Ledger
                    {viewMode === 'AUDIT' && <div className="absolute bottom-0 left-0 w-full h-1 bg-primary rounded-t-full" />}
                </button>
                <button
                    onClick={() => setViewMode('CUSTOMERS')}
                    className={`pb-3 text-sm font-black transition-all relative ${viewMode === 'CUSTOMERS' ? 'text-primary' : 'text-neutral-400 hover:text-neutral-600'}`}
                >
                    Customer DNA
                    <span className="ml-2 px-1.5 py-0.5 bg-primary text-white text-[8px] rounded uppercase">VIP Analytics</span>
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
                                <div key={b.branch} className="bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-[2.5rem] p-8 shadow-sm group hover:border-primary/40 transition-all hover:scale-[1.01]">
                                    <div className="flex justify-between items-start mb-8">
                                        <div className="flex items-center gap-4">
                                            <div className="p-3 bg-neutral-100 dark:bg-neutral-900 rounded-2xl text-neutral-400 group-hover:text-primary transition-colors">
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
                                        <div className="p-5 bg-neutral-50 dark:bg-neutral-900/50 rounded-3xl">
                                            <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-1">Cash Flow</p>
                                            <p className="text-xl font-black italic tabular-nums">₹{(b.cash / 1000).toFixed(0)}K</p>
                                        </div>
                                        <div className="p-5 bg-neutral-50 dark:bg-neutral-900/50 rounded-3xl">
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
                                        <div className="w-full h-2 bg-neutral-100 dark:bg-neutral-900 rounded-full overflow-hidden">
                                            <div
                                                className={`h-full rounded-full transition-all duration-1000 ${b.stock_anomalies === 0 ? 'bg-success w-[100%]' :
                                                    b.stock_anomalies < 3 ? 'bg-amber-500 w-[70%]' : 'bg-error w-[40%]'
                                                    }`}
                                            />
                                        </div>
                                    </div>

                                    <button className="w-full mt-8 py-3 bg-neutral-50 dark:bg-neutral-900 text-[10px] font-black uppercase tracking-widest hover:bg-primary hover:text-white transition-all rounded-2xl border border-neutral-100 dark:border-neutral-800">
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
                                    className="w-full pl-12 pr-4 py-3 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-primary/20 shadow-sm"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>

                            <div className="bg-white dark:bg-neutral-800 rounded-[2rem] border border-neutral-200 dark:border-neutral-700 overflow-hidden shadow-sm">
                                <table className="w-full text-left text-xs tabular-nums">
                                    <thead className="bg-neutral-50 dark:bg-neutral-900 border-b border-neutral-100 dark:border-neutral-800 text-neutral-400 font-black uppercase tracking-[0.15em]">
                                        <tr>
                                            <th className="p-5">Bill / Time</th>
                                            <th className="p-5">Value (Incl. Tax)</th>
                                            <th className="p-5">Audit Status</th>
                                            <th className="p-5 text-right">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                                        {filteredOrders.map(order => (
                                            <tr key={order.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-900/50 transition-colors group">
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
                                                    <button className="px-4 py-1.5 bg-neutral-100 dark:bg-neutral-900 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-primary hover:text-white transition-all shadow-sm">
                                                        Investigate
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {viewMode === 'CUSTOMERS' && (
                        <div className="bg-neutral-900 text-white rounded-[3rem] p-12 border border-neutral-800 shadow-2xl relative overflow-hidden group">
                            <Users className="absolute -bottom-10 -right-10 w-64 h-64 text-primary opacity-5 rotate-12 group-hover:scale-110 transition-transform duration-1000" />
                            <div className="relative z-10 max-w-xl">
                                <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-primary/20 border border-primary/30 rounded-full text-primary-light text-[10px] font-black uppercase tracking-[0.2em] mb-8 animate-pulse">
                                    <Target className="w-4 h-4 fill-current" /> High Value Retention Active
                                </div>
                                <h3 className="text-4xl font-black mb-6 leading-[1.1] tracking-tight">
                                    Customer <br /> <span className="text-primary italic underline decoration-primary/30">Intelligence Core</span>
                                </h3>

                                <div className="grid grid-cols-2 gap-6 mb-10">
                                    <div className="p-6 bg-white/5 border border-white/10 rounded-3xl backdrop-blur-md">
                                        <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-2">Repeat Rate</p>
                                        <h4 className="text-3xl font-black">42.8%</h4>
                                        <p className="text-[10px] text-success font-black mt-2">+5% this month</p>
                                    </div>
                                    <div className="p-6 bg-white/5 border border-white/10 rounded-3xl backdrop-blur-md">
                                        <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-2">Dormant Reclaimed</p>
                                        <h4 className="text-3xl font-black">128</h4>
                                        <p className="text-[10px] text-primary font-black mt-2">Active campaigns</p>
                                    </div>
                                </div>

                                <div className="space-y-4 mb-10">
                                    <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/10 group-hover:bg-white/10 transition-colors pointer-events-none">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center font-black text-primary">RK</div>
                                            <div>
                                                <p className="text-xs font-black uppercase tracking-tight">Rajesh Kumar</p>
                                                <p className="text-[10px] text-neutral-500 font-bold uppercase tracking-wider">VIP • 42 Orders • ₹1.2L LTV</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <span className="text-[9px] font-black bg-success/10 text-success px-2 py-0.5 rounded uppercase">Verified</span>
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
                    <div className="bg-white dark:bg-neutral-800 rounded-[2rem] border border-neutral-200 dark:border-neutral-700 p-6 shadow-sm">
                        <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-6">Security Shield Status</p>
                        <div className="space-y-3">
                            {[
                                { name: 'Tax Parity Check', status: true },
                                { name: 'Manual Override Lock', status: true },
                                { name: 'Stock Sync Auditor', status: true },
                                { name: 'Loyalty Fraud Detect', status: false },
                            ].map((item, i) => (
                                <div key={i} className="flex items-center justify-between p-3 bg-neutral-50 dark:bg-neutral-900 rounded-2xl border border-neutral-100 dark:border-neutral-800">
                                    <span className="text-[11px] font-black uppercase tracking-tight text-neutral-700 dark:text-neutral-300">{item.name}</span>
                                    <div className={`w-8 h-4 rounded-full relative transition-colors ${item.status ? 'bg-success' : 'bg-neutral-200'}`}>
                                        <div className={`absolute top-1 w-2 h-2 rounded-full bg-white transition-all ${item.status ? 'left-5' : 'left-1'}`} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Fraud Stream */}
                    <div className="bg-neutral-100 dark:bg-neutral-900 p-6 rounded-[2rem] border border-neutral-200 dark:border-neutral-800 relative overflow-hidden group">
                        <ShieldAlert className="absolute -top-6 -right-6 w-24 h-24 opacity-5 group-hover:scale-110 transition-transform duration-700" />
                        <h4 className="font-black text-xs uppercase tracking-widest mb-6 flex items-center gap-2">
                            Alert Stream <div className="w-2 h-2 bg-error rounded-full animate-ping" />
                        </h4>

                        <div className="space-y-4">
                            <div className="p-4 bg-white dark:bg-neutral-800 rounded-2xl border border-error/20 shadow-sm group/alert hover:border-error/40 transition-all">
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-[9px] font-black uppercase text-error tracking-[0.15em]">Critical Tax Overide</span>
                                    <Clock className="w-3 h-3 text-neutral-400" />
                                </div>
                                <p className="text-[11px] font-bold leading-relaxed text-neutral-700 dark:text-neutral-300">
                                    Terminal POS04 (Chennai) processed Bill <span className="text-error italic">#9903</span> with an 8% GST manual reduction.
                                </p>
                                <button className="mt-3 text-[9px] font-black text-primary uppercase tracking-widest hover:underline underline-offset-4">
                                    Flag Terminal
                                </button>
                            </div>

                            <div className="p-4 bg-white dark:bg-neutral-800 rounded-2xl border border-amber-200 shadow-sm group/alert hover:border-amber-400 transition-all">
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-[9px] font-black uppercase text-amber-600 tracking-[0.15em]">Stock Desync</span>
                                    <Clock className="w-3 h-3 text-neutral-400" />
                                </div>
                                <p className="text-[11px] font-bold leading-relaxed text-neutral-700 dark:text-neutral-300">
                                    Bill #9904 returned items but master inventory was not updated. Potential manual override.
                                </p>
                            </div>
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
    );
};

export default POSOrdersIntelligence;

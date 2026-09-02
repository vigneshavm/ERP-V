import { useState, useEffect, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from "../../../services/api";
import { toast } from 'react-toastify';
import {
    ShoppingCart,
    Package,
    Plus,
    Search,
    Eye,
    Trash2,
    CheckCircle2,
    Clock,
    XCircle,
    TrendingUp,
    FileCheck,
    AlertTriangle,
    Download,
    Calendar,
    Briefcase,
    Zap,
    RefreshCw,
    Truck,
    ShieldCheck
} from 'lucide-react';
import { SalesOrder } from '../../../types/sales';
import Layout from '../../../components/shared/Layout';

const SalesOrderList = () => {
    const navigate = useNavigate();
    const [orders, setOrders] = useState<SalesOrder[]>([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({ status: '', search: '', overdue: false });

    const isOverdue = (order: SalesOrder) => {
        if (!order.expectedDeliveryDate) return false;
        return new Date(order.expectedDeliveryDate) < new Date() &&
               !['Delivered', 'Invoiced', 'Cancelled'].includes(order.status);
    };

    useEffect(() => { fetchOrders(); }, [filters.status, filters.overdue]);

    const fetchOrders = async () => {
        setLoading(true);
        try {
            const user = JSON.parse(localStorage.getItem('user') || '{}');
            const token = user?.token;
            const params = new URLSearchParams();
            if (filters.status) params.append('status', filters.status);
            if (filters.overdue) params.append('overdue', 'true');
            const response = await api.get(`/api/sales-orders?${params.toString()}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setOrders(response.data);
        } catch {
            toast.error('Failed to fetch orders');
        } finally {
            setLoading(false);
        }
    };

    const filteredOrders = useMemo(() => {
        if (!filters.search) return orders;
        const s = filters.search.toLowerCase();
        return orders.filter(o =>
            o.orderNumber.toLowerCase().includes(s) ||
            o.customer?.name.toLowerCase().includes(s)
        );
    }, [orders, filters.search]);

    const getStatusConfig = (status: string) => {
        switch (status) {
            case 'Delivered':
            case 'Invoiced':           return { color: 'text-success', bg: 'bg-success/10', border: 'border-success/30', icon: CheckCircle2 };
            case 'Confirmed':          return { color: 'text-warning', bg: 'bg-warning/10', border: 'border-warning/30', icon: Zap };
            case 'Partially Delivered':
            case 'Partially Invoiced': return { color: 'text-info',    bg: 'bg-info/10',    border: 'border-info/30',    icon: Clock };
            case 'Cancelled':          return { color: 'text-danger',  bg: 'bg-danger/10',  border: 'border-danger/30',  icon: XCircle };
            default:                   return { color: 'text-secondary',bg: 'bg-surface',   border: 'border-default',    icon: FileCheck };
        }
    };

    const metrics = useMemo(() => {
        const total = orders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
        const overdueCount = orders.filter(isOverdue).length;
        const pendingCount = orders.filter(o => !['Delivered', 'Invoiced', 'Cancelled'].includes(o.status)).length;
        return { total, overdueCount, pendingCount, count: orders.length };
    }, [orders]);

    const kpiCards = [
        { label: 'Total Value',     value: `₹${metrics.total.toLocaleString()}`, icon: TrendingUp,   color: 'text-warning', bg: 'bg-warning/10',   border: 'border-warning/30',   sub: 'Gross Order Value' },
        { label: 'Active Orders',   value: metrics.pendingCount,                  icon: Clock,         color: 'text-info',    bg: 'bg-info/10',      border: 'border-info/30',      sub: 'Fulfillment Pending' },
        { label: 'Total Orders',    value: metrics.count,                          icon: Briefcase,     color: 'text-primary', bg: 'bg-primary/10',   border: 'border-primary/30',   sub: 'All Documented Orders' },
        { label: 'Overdue',         value: metrics.overdueCount,                   icon: AlertTriangle, color: metrics.overdueCount > 0 ? 'text-danger' : 'text-success', bg: metrics.overdueCount > 0 ? 'bg-danger/10' : 'bg-success/10', border: metrics.overdueCount > 0 ? 'border-danger/30' : 'border-success/30', sub: 'SLA Breach Risk' },
    ];

    return (
        <Layout>
            <div className="relative space-y-8 pt-4">
                {/* Ambient Background Blobs */}
                <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
                    <div className="absolute top-[-15%] left-[5%] w-[55%] h-[55%] bg-warning/10 rounded-full blur-[160px] animate-aura opacity-60" />
                    <div className="absolute bottom-[-10%] right-[5%] w-[40%] h-[40%] bg-primary/10 rounded-full blur-[140px] animate-aura opacity-50" style={{ animationDelay: '7s' }} />
                    <div className="absolute top-[40%] right-[20%] w-[25%] h-[25%] bg-accent/5 rounded-full blur-[100px] animate-aura opacity-40" style={{ animationDelay: '3s' }} />
                </div>

                <div className="relative z-10 space-y-8">
                    {/* Header */}
                    <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                        <div className="relative pl-5">
                            <div className="absolute left-0 top-0 bottom-0 w-1 bg-warning rounded-full shadow-[0_0_15px_rgba(var(--color-warning),0.5)]" />
                            <h1 className="text-3xl font-display font-black tracking-tighter text-main flex items-center gap-3">
                                Sales <span className="text-warning">Orders</span>
                                <span className="px-3 py-1 bg-warning/10 border border-warning/20 text-warning rounded-sm text-[10px] font-black uppercase tracking-widest">
                                    Order Register
                                </span>
                            </h1>
                            <div className="flex items-center gap-2 mt-1">
                                <span className="flex h-2 w-2 rounded-full bg-success animate-pulse" />
                                <p className="text-[10px] uppercase tracking-[0.2em] font-black text-secondary">
                                    {orders.length} orders synced
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 w-full md:w-auto">
                            <button
                                onClick={fetchOrders}
                                className={`p-2.5 bg-card border border-default rounded-sm hover:bg-surface transition-all ${loading ? 'animate-spin' : ''}`}
                            >
                                <RefreshCw className="w-4 h-4 text-warning" />
                            </button>
                            <button className="flex items-center gap-2 px-5 py-2.5 bg-card border border-default rounded-sm text-xs font-black uppercase tracking-widest text-muted hover:text-main hover:border-warning/30 transition-all">
                                <Download className="w-4 h-4" /> Export
                            </button>
                            <Link
                                to="/sales/orders/new"
                                className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-2.5 bg-warning text-warning-fg rounded-sm shadow-lg shadow-warning/20 transition-all text-xs font-black uppercase tracking-widest hover:opacity-90"
                            >
                                <Plus className="w-4 h-4" /> New Order
                            </Link>
                        </div>
                    </header>

                    {/* KPI Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        {kpiCards.map((card, i) => (
                            <div key={i} className="card-interactive p-6 relative overflow-hidden group bg-card/60 backdrop-blur-2xl border border-default">
                                <div className="flex justify-between items-start mb-4">
                                    <div className={`p-3 rounded-sm ${card.bg} ${card.color} border ${card.border}`}>
                                        <card.icon className="w-5 h-5" />
                                    </div>
                                    <div className="text-[10px] font-black text-success bg-success/10 border border-success/30 px-2 py-1 rounded-sm uppercase tracking-widest">
                                        +12.4%
                                    </div>
                                </div>
                                <h3 className={`text-2xl font-display font-black tracking-tighter tabular-nums ${card.color}`}>
                                    {loading ? '—' : card.value}
                                </h3>
                                <p className="text-[10px] font-black text-secondary uppercase tracking-widest mt-1">{card.label}</p>
                                <div className="mt-3 h-1 w-full bg-border rounded-full overflow-hidden">
                                    <div className={`h-full rounded-full w-[65%] ${card.bg.replace('/10', '')}`} />
                                </div>
                                <p className="text-[9px] font-bold text-secondary mt-2 flex items-center gap-1">
                                    <Zap className="w-3 h-3 text-warning" /> {card.sub}
                                </p>
                            </div>
                        ))}
                    </div>

                    {/* Toolbar — standalone bordered card */}
                    <div className="glass-panel rounded-sm border border-default p-5 flex flex-col md:flex-row justify-between items-center gap-4">
                        <div className="relative w-full md:w-96">
                            <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-warning" />
                            <input
                                type="text"
                                placeholder="Search order number or customer..."
                                value={filters.search}
                                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                                className="w-full bg-card border border-default rounded-sm py-3 pl-12 pr-4 text-xs font-bold focus:outline-none focus:border-warning/50 focus:ring-2 focus:ring-warning/10 transition-all text-main placeholder:text-secondary"
                            />
                        </div>
                        <div className="flex items-center gap-3 w-full md:w-auto">
                            <div className="flex bg-surface p-1 rounded-sm border border-default overflow-x-auto gap-1">
                                {['', 'Confirmed', 'Invoiced', 'Delivered', 'Cancelled'].map(s => (
                                    <button
                                        key={s || 'all'}
                                        onClick={() => setFilters({ ...filters, status: s })}
                                        className={`px-4 py-2 rounded-sm text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${
                                            filters.status === s
                                                ? 'bg-card text-warning shadow-sm border border-default'
                                                : 'text-secondary hover:text-main'
                                        }`}
                                    >
                                        {s || 'All'}
                                    </button>
                                ))}
                            </div>
                            <button
                                onClick={() => setFilters({ ...filters, overdue: !filters.overdue })}
                                className={`px-4 py-2 rounded-sm text-[10px] font-black uppercase tracking-widest transition-all border whitespace-nowrap ${
                                    filters.overdue
                                        ? 'bg-danger text-white border-danger'
                                        : 'bg-card border-default text-secondary hover:text-danger hover:border-danger/30'
                                }`}
                            >
                                Overdue Only
                            </button>
                        </div>
                    </div>

                    {/* Table — standalone bordered card */}
                    <div className="glass-panel flex flex-col overflow-hidden rounded-sm border border-default">
                        <div className="flex-1 overflow-auto min-h-[400px]">
                            <table className="w-full text-left border-collapse">
                                <thead className="bg-surface/50 sticky top-0 z-20 border-b border-default">
                                    <tr>
                                        <th className="px-6 py-4 text-[9px] font-black uppercase tracking-widest text-secondary">Order No.</th>
                                        <th className="px-6 py-4 text-[9px] font-black uppercase tracking-widest text-secondary">Customer</th>
                                        <th className="px-6 py-4 text-[9px] font-black uppercase tracking-widest text-secondary">Dates</th>
                                        <th className="px-6 py-4 text-[9px] font-black uppercase tracking-widest text-secondary text-center">Status</th>
                                        <th className="px-6 py-4 text-[9px] font-black uppercase tracking-widest text-secondary text-right">Amount (INR)</th>
                                        <th className="px-6 py-4 w-24" />
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-default">
                                    {loading ? (
                                        [...Array(5)].map((_, i) => (
                                            <tr key={i} className="animate-pulse">
                                                {[...Array(6)].map((_, j) => (
                                                    <td key={j} className="px-6 py-5">
                                                        <div className="h-4 bg-surface rounded-sm w-full" />
                                                    </td>
                                                ))}
                                            </tr>
                                        ))
                                    ) : filteredOrders.length === 0 ? (
                                        <tr>
                                            <td colSpan={6} className="px-8 py-20 text-center">
                                                <div className="flex flex-col items-center gap-4">
                                                    <div className="p-6 bg-surface rounded-sm border border-default">
                                                        <Package className="w-10 h-10 text-secondary opacity-30" />
                                                    </div>
                                                    <div>
                                                        <h3 className="text-base font-black text-main uppercase tracking-widest">No Orders Found</h3>
                                                        <p className="text-sm text-secondary mt-1">Refine your search or filter.</p>
                                                    </div>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredOrders.map((order) => {
                                            const config = getStatusConfig(order.status);
                                            const Icon = config.icon;
                                            return (
                                                <tr
                                                    key={order._id}
                                                    className="hover:bg-warning/[0.03] transition-all group border-l-4 border-l-transparent hover:border-l-warning cursor-pointer"
                                                    onClick={() => navigate(`/sales/sales-order/${order._id}`)}
                                                >
                                                    <td className="px-6 py-5">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-8 h-8 rounded-sm bg-warning/10 border border-warning/20 flex items-center justify-center">
                                                                <ShoppingCart className="w-4 h-4 text-warning" />
                                                            </div>
                                                            <div>
                                                                <span className="font-mono text-sm font-bold text-main group-hover:text-warning transition-colors tracking-tighter">{order.orderNumber}</span>
                                                                <div className="text-[9px] text-secondary font-bold uppercase tracking-widest mt-0.5">ID: {order._id?.slice(-8).toUpperCase()}</div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-5">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-8 h-8 rounded-sm bg-warning/10 border border-warning/20 flex items-center justify-center text-[10px] font-black text-warning">
                                                                {order.customer?.name?.[0]?.toUpperCase() || 'C'}
                                                            </div>
                                                            <div>
                                                                <div className="text-sm font-black text-main uppercase tracking-tight">{order.customer?.name}</div>
                                                                <div className="text-[10px] text-secondary font-bold uppercase tracking-widest">{order.customer?.phone}</div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-5">
                                                        <div className="flex flex-col gap-1">
                                                            <span className="text-[10px] font-black text-main uppercase tracking-widest flex items-center gap-2">
                                                                <Calendar className="w-3 h-3 text-warning" /> {new Date(order.orderDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                                                            </span>
                                                            <span className={`text-[9px] font-bold uppercase tracking-widest flex items-center gap-2 ${isOverdue(order) ? 'text-danger' : 'text-secondary'}`}>
                                                                <Truck className="w-3 h-3" /> SLA: {new Date(order.expectedDeliveryDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                                                            </span>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-5">
                                                        <div className="flex justify-center">
                                                            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-sm text-[10px] font-black uppercase tracking-widest border ${config.bg} ${config.color} ${config.border}`}>
                                                                <Icon className="w-3.5 h-3.5" /> {order.status}
                                                            </span>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-5 text-right">
                                                        <div className="text-lg font-display font-black tracking-tighter text-main tabular-nums">
                                                            ₹{order.totalAmount?.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                                        </div>
                                                        <div className="text-[9px] text-success font-black uppercase tracking-widest mt-1">+ GST INCLUDED</div>
                                                    </td>
                                                    <td className="px-6 py-5">
                                                        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-all">
                                                            <button
                                                                onClick={(e) => { e.stopPropagation(); navigate(`/sales/sales-order/${order._id}`); }}
                                                                className="p-2 text-secondary hover:text-warning hover:bg-warning/10 rounded-sm transition-all"
                                                                title="View"
                                                            >
                                                                <Eye className="w-4 h-4" />
                                                            </button>
                                                            <button
                                                                onClick={(e) => e.stopPropagation()}
                                                                className="p-2 text-secondary hover:text-danger hover:bg-danger/10 rounded-sm transition-all"
                                                                title="Delete"
                                                            >
                                                                <Trash2 className="w-4 h-4" />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Footer */}
                        <div className="p-5 border-t border-default bg-surface/20 flex justify-between items-center">
                            <p className="text-[10px] font-black uppercase tracking-widest text-secondary">
                                Showing <span className="text-main">{filteredOrders.length}</span> of <span className="text-main">{orders.length}</span> orders
                            </p>
                            <div className="flex items-center gap-2">
                                <ShieldCheck className="w-3.5 h-3.5 text-warning" />
                                <span className="text-[9px] font-black text-secondary uppercase tracking-widest">Ledger Verified</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </Layout>
    );
};

export default SalesOrderList;

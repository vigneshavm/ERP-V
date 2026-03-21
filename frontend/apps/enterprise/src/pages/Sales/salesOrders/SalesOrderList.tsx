import { logger } from '@/shared/lib/logger';
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '@/shared/api/api';
import { toast } from 'react-toastify';
import Layout from '@/shared/ui/Layout/Layout';
import PageShell from '@/shared/ui/Layout/PageShell';
import { SalesOrder } from '@repo/shared';
import {
    Plus,
    Search,
    Eye,
    Trash2,
    Calendar,
    ArrowRight,
    TrendingUp,
    ShieldCheck,
    CreditCard,
    Clock,
    Printer,
    Filter,
    ArrowUpRight,
    CheckCircle,
    AlertCircle,
    Package,
    ArrowLeft,
    XCircle,
    FileText
} from 'lucide-react';

const SalesOrderList: React.FC = () => {
    const navigate = useNavigate();
    const [orders, setOrders] = useState<SalesOrder[]>([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({
        status: '',
        search: '',
        overdue: false
    });

    const isOverdue = (order: SalesOrder) => {
        if (!order.expectedDeliveryDate) return false;
        return new Date(order.expectedDeliveryDate) < new Date() && order.status !== 'Delivered' && order.status !== 'Invoiced' && order.status !== 'Cancelled';
    };

    useEffect(() => {
        fetchOrders();
    }, [filters]);

    const fetchOrders = async () => {
        setLoading(true);
        try {
            const user = JSON.parse(localStorage.getItem('user') || '{}');
            const token = user?.token;
            const params = new URLSearchParams();
            if (filters.status) params.append('status', filters.status);
            if (filters.overdue) params.append('overdue', 'true');

            const response = await api.get(
                `/sales-orders?${params.toString()}`,
                { headers: { Authorization: `Bearer ${token}` } }
            );

            let fetchedOrders = response.data.data;

            // Apply search filter on frontend
            if (filters.search) {
                const searchLower = filters.search.toLowerCase();
                fetchedOrders = fetchedOrders.filter((order: SalesOrder) =>
                    order.orderNumber?.toLowerCase().includes(searchLower) ||
                    order.customer?.name?.toLowerCase().includes(searchLower)
                );
            }

            setOrders(fetchedOrders);
        } catch (error: any) {
            logger.error('Error fetching orders:', error);
            toast.error('Failed to fetch sales orders');
        } finally {
            setLoading(false);
        }
    };

    const getStatusConfig = (status: string) => {
        switch (status) {
            case 'Delivered':
            case 'Invoiced':
                return { bg: 'bg-emerald-500/10', text: 'text-emerald-500', icon: CheckCircle };
            case 'Confirmed':
                return { bg: 'bg-indigo-500/10', text: 'text-indigo-500', icon: Package };
            case 'Partially Delivered':
            case 'Partially Invoiced':
                return { bg: 'bg-amber-500/10', text: 'text-amber-500', icon: Clock };
            case 'Cancelled':
                return { bg: 'bg-rose-500/10', text: 'text-rose-500', icon: XCircle };
            default: // Draft
                return { bg: 'bg-neutral-500/10', text: 'text-neutral-500', icon: FileText };
        }
    };

    // Calculate Dashboard Metrics
    const totalOrders = orders.length;
    const totalRevenue = orders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
    const confirmedOrders = orders.filter((o) => ['Confirmed', 'Partially Delivered', 'Delivered'].includes(o.status)).length;
    const overdueOrders = orders.filter((o) => isOverdue(o)).length;

    if (loading && orders.length === 0) {
        return (
            <Layout>
                <PageShell className="flex flex-col items-center justify-center py-40">
                    <div className="relative">
                        <div className="w-16 h-16 rounded-full border-4 border-indigo-500/20 border-t-indigo-500 animate-spin" />
                        <Package className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-6 h-6 text-indigo-500 animate-pulse" />
                    </div>
                    <p className="mt-6 text-sm font-black uppercase tracking-widest text-neutral-400 animate-pulse">Scanning Logistics Matrix...</p>
                </PageShell>
            </Layout>
        );
    }

    return (
        <Layout>
            <PageShell className="bg-app flex-1 flex flex-col min-h-0 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <span className="px-2 py-0.5 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-[10px] font-black uppercase tracking-widest rounded-md border border-indigo-500/20">Market Operations</span>
                            <span className="text-neutral-300 dark:text-neutral-700">/</span>
                            <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">Orders Portal</span>
                        </div>
                        <h2 className="text-4xl font-black text-neutral-900 dark:text-main tracking-tight leading-none flex items-center gap-3">
                            Sales Orders Intelligence <TrendingUp className="w-8 h-8 text-indigo-500" />
                        </h2>
                        <p className="text-sm text-neutral-500 font-medium italic mt-3">
                            Monitoring and orchestration of customer fulfillment cycles.
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => window.print()}
                            className="p-4 bg-white dark:bg-neutral-900 border border-default dark:border-neutral-800 rounded-2xl text-neutral-500 hover:bg-neutral-50 transition-all shadow-sm"
                            title="Print Artifact List"
                        >
                            <Printer className="w-5 h-5" />
                        </button>
                        <button
                            onClick={() => navigate('/sales/sales-order')}
                            className="px-8 py-4 bg-indigo-600 text-white rounded-2xl font-black uppercase tracking-[0.2em] text-xs shadow-xl shadow-indigo-600/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3"
                        >
                            <Plus className="w-5 h-5" /> 
                            <span>Initiate Order</span>
                        </button>
                    </div>
                </div>

                {/* Dashboard Metrics Grid */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    {[
                        { label: 'Projected Revenue', value: `₹${totalRevenue.toLocaleString()}`, icon: CreditCard, color: 'emerald', trend: '+12% Velocity' },
                        { label: 'Active Pipelines', value: totalOrders, icon: Package, color: 'indigo', progress: 70 },
                        { label: 'Conversion Success', value: confirmedOrders, icon: CheckCircle, color: 'teal', sub: `${((confirmedOrders / (totalOrders || 1)) * 100).toFixed(0)}% Integrity` },
                        { label: 'Vortex Alerts', value: overdueOrders, icon: AlertCircle, color: overdueOrders > 0 ? 'rose' : 'neutral', alert: overdueOrders > 0 },
                    ].map((kpi, i) => (
                        <div key={i} className="erp-card rounded-[2.5rem] p-8 shadow-sm border-none relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:scale-110 transition-transform duration-700">
                                <kpi.icon className="w-20 h-20" />
                            </div>
                            <div className="relative z-10 flex flex-col h-full justify-between">
                                <div>
                                    <p className="text-[9px] font-black text-neutral-400 uppercase tracking-[0.2em] mb-1">{kpi.label}</p>
                                    <h3 className={`text-3xl font-black tracking-tighter italic ${kpi.alert ? 'text-rose-600' : 'text-neutral-900 dark:text-main'}`}>
                                        {kpi.value}
                                    </h3>
                                </div>
                                <div className="mt-6 flex flex-col gap-2">
                                    {kpi.trend && (
                                        <div className="flex items-center gap-1.5 text-emerald-500 font-black uppercase tracking-widest text-[8px]">
                                            <TrendingUp className="w-2.5 h-2.5" /> {kpi.trend}
                                        </div>
                                    )}
                                    {kpi.progress && (
                                        <div className="h-1 w-full bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden mt-1">
                                            <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${kpi.progress}%` }}></div>
                                        </div>
                                    )}
                                    {kpi.sub && (
                                        <p className="text-[9px] font-black text-neutral-400 uppercase tracking-widest leading-none italic">{kpi.sub}</p>
                                    )}
                                    {kpi.label === 'Vortex Alerts' && (
                                        <p className={`text-[9px] font-black uppercase tracking-widest leading-none italic ${kpi.alert ? 'text-rose-400 animate-pulse' : 'text-neutral-400'}`}>
                                            {kpi.alert ? 'Requires Critical Signal' : 'All Vectors Nominal'}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Main Operations Island */}
                <div className="erp-card rounded-[3rem] p-4 shadow-sm border-none overflow-hidden relative group">
                    {/* Advanced Filter Matrix */}
                    <div className="p-4 bg-[var(--erp-bg-sunken)] dark:bg-neutral-950/50 rounded-[2.5rem] mb-6 flex flex-col lg:flex-row gap-6 items-center justify-between border border-default dark:border-neutral-800">
                        {/* Search Component */}
                        <div className="relative w-full lg:max-w-xl group/search">
                            <div className="absolute inset-y-0 left-0 pl-6 flex items-center pointer-events-none">
                                <Search className="h-4 w-4 text-neutral-400 group-focus-within/search:text-indigo-500 transition-colors" />
                            </div>
                            <input
                                type="text"
                                placeholder="Intercept by Sequence ID or Identity..."
                                value={filters.search}
                                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                                className="block w-full pl-14 pr-6 py-4 bg-white dark:bg-neutral-900 border-none rounded-[1.5rem] text-sm font-bold placeholder:text-neutral-500 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all shadow-sm italic uppercase tracking-tight"
                            />
                        </div>

                        {/* Status & Alerts Matrix */}
                        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
                            <div className="flex items-center gap-2 p-1.5 bg-white dark:bg-neutral-900 rounded-[1.5rem] border border-default dark:border-neutral-800 flex-1 lg:flex-none">
                                <Filter className="w-4 h-4 text-neutral-400 ml-3" />
                                <select
                                    value={filters.status}
                                    onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                                    className="px-4 py-2 bg-transparent border-none text-[10px] font-black uppercase tracking-[0.2em] text-neutral-600 dark:text-neutral-400 focus:ring-0 outline-none cursor-pointer"
                                >
                                    <option value="">Global States</option>
                                    <option value="Draft">Draft Mode</option>
                                    <option value="Confirmed">Confirmed</option>
                                    <option value="Delivered">Delivered</option>
                                    <option value="Invoiced">Invoiced</option>
                                    <option value="Cancelled">Neutralized</option>
                                </select>
                            </div>

                            <label className="flex items-center justify-center gap-3 px-6 py-3 bg-white dark:bg-neutral-900 border border-default dark:border-neutral-800 rounded-[1.5rem] shadow-sm hover:bg-rose-500/5 transition-all cursor-pointer group/overdue w-full sm:w-auto">
                                <input
                                    type="checkbox"
                                    checked={filters.overdue}
                                    onChange={(e) => setFilters({ ...filters, overdue: e.target.checked })}
                                    className="w-4 h-4 text-rose-600 rounded-lg border-neutral-300 focus:ring-rose-500 bg-transparent"
                                />
                                <span className="text-[10px] font-black uppercase tracking-widest text-neutral-600 group-hover/overdue:text-rose-600 transition-colors">Alert Flux</span>
                            </label>

                            {(filters.status || filters.search || filters.overdue) && (
                                <button
                                    onClick={() => setFilters({ status: '', search: '', overdue: false })}
                                    className="px-4 py-2 text-[10px] font-black uppercase tracking-widest text-neutral-400 hover:text-indigo-500 transition-colors"
                                >
                                    Clear
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Logistics Matrix Display */}
                    {orders.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-32 text-center">
                            <div className="p-8 bg-neutral-50 dark:bg-neutral-900 rounded-[3rem] mb-6 text-neutral-200 animate-in zoom-in duration-500">
                                <Package className="w-16 h-16" />
                            </div>
                            <h3 className="text-xl font-black text-neutral-900 dark:text-main uppercase tracking-tighter">Vortex Empty</h3>
                            <p className="text-sm font-bold text-neutral-500 mt-2 italic max-w-sm">
                                Zero logistics signals detected. Re-calibrate filters or initiate a new order sequence.
                            </p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto px-2">
                            <table className="w-full text-left border-separate border-spacing-y-4">
                                <thead>
                                    <tr className="text-[10px] font-black text-neutral-400 uppercase tracking-[0.3em]">
                                        <th className="px-8 py-2">Order Identification</th>
                                        <th className="px-8 py-2">Counterparty Entity</th>
                                        <th className="px-8 py-2">Fiscal Date</th>
                                        <th className="px-8 py-2">State Node</th>
                                        <th className="px-8 py-2 text-right">Aggregate Value</th>
                                        <th className="px-8 py-2 text-right">Command</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {orders.map((order: SalesOrder) => {
                                        const config = getStatusConfig(order.status);
                                        const StatusIcon = config.icon;
                                        return (
                                            <tr 
                                                key={order._id}
                                                onClick={() => navigate(`/sales/sales-order/${order._id}`)}
                                                className="group/row cursor-pointer hover:transform hover:-translate-y-1 transition-all duration-500"
                                            >
                                                <td className="px-2 py-1">
                                                    <div className="bg-white dark:bg-neutral-900 rounded-[1.5rem] p-6 border border-default dark:border-neutral-800 group-hover/row:border-indigo-500/20 group-hover/row:shadow-xl group-hover/row:shadow-indigo-500/5 transition-all relative overflow-hidden">
                                                        <div className="relative z-10">
                                                            <div className="text-lg font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-tighter italic">
                                                                {order.orderNumber}
                                                            </div>
                                                            {isOverdue(order) && (
                                                                <div className="flex items-center gap-1.5 mt-2 px-2 py-0.5 bg-rose-500/10 text-rose-600 rounded-md text-[8px] font-black uppercase tracking-widest w-max animate-pulse">
                                                                    <AlertCircle className="w-2.5 h-2.5" /> ALERT OVERDUE
                                                                </div>
                                                            )}
                                                        </div>
                                                        <div className="absolute top-0 right-0 p-1 opacity-0 group-hover/row:opacity-10 transition-opacity">
                                                            <ArrowUpRight className="w-12 h-12" />
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-2 py-1">
                                                    <div className="bg-white dark:bg-neutral-900 rounded-[1.5rem] p-6 border border-default dark:border-neutral-800 transition-all font-medium text-main">
                                                        <p className="text-sm font-black text-neutral-900 dark:text-neutral-100 uppercase tracking-tight leading-none mb-1">
                                                            {order.customer?.name || 'Anonymous Client'}
                                                        </p>
                                                        <span className="text-[9px] font-black text-neutral-400 uppercase tracking-widest italic leading-none">
                                                            {order.customer?.phone || 'No Dial Signal'}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="px-2 py-1">
                                                    <div className="bg-white dark:bg-neutral-900 rounded-[1.5rem] p-6 border border-default dark:border-neutral-800 transition-all font-mono font-black text-neutral-500 dark:text-neutral-400 uppercase tracking-tight text-xs">
                                                        {new Date(order.orderDate).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                                                    </div>
                                                </td>
                                                <td className="px-2 py-1">
                                                    <div className="bg-white dark:bg-neutral-900 rounded-[1.5rem] p-6 border border-default dark:border-neutral-800 transition-all">
                                                        <div className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] border ${config.bg} ${config.text} border-current/10`}>
                                                            <StatusIcon className="w-3.5 h-3.5" />
                                                            {order.status}
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-2 py-1 text-right">
                                                     <div className="bg-white dark:bg-neutral-900 rounded-[1.5rem] p-6 border border-default dark:border-neutral-800 transition-all">
                                                        <span className="text-xl font-black text-neutral-900 dark:text-neutral-100 font-mono tracking-tighter italic">
                                                            ₹{order.totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                                        </span>
                                                     </div>
                                                </td>
                                                <td className="px-2 py-1 text-right">
                                                    <div className="flex justify-end pr-4">
                                                        <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/30 flex items-center justify-center text-indigo-600 transition-all group-hover/row:bg-indigo-600 group-hover/row:text-white group-hover/row:scale-110 active:scale-90">
                                                            <ArrowRight className="w-5 h-5" />
                                                        </div>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </PageShell>
        </Layout>
    );
};

export default SalesOrderList;

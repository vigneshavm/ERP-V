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
    Calculator,
    CheckCircle2,
    Clock,
    XCircle,
    ArrowLeft,
    TrendingUp,
    FileCheck,
    AlertTriangle,
    Download,
    Filter,
    ChevronRight,
    Calendar,
    Briefcase,
    Zap,
    RefreshCw,
    User,
    Truck,
    IndianRupee,
    Layers,
    ShieldCheck
} from 'lucide-react';
import { SalesOrder } from '../../../types/sales';

const SalesOrderList = () => {
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
        return new Date(order.expectedDeliveryDate) < new Date() && 
               !['Delivered', 'Invoiced', 'Cancelled'].includes(order.status);
    };

    useEffect(() => {
        fetchOrders();
    }, [filters.status, filters.overdue]);

    const fetchOrders = async () => {
        setLoading(true);
        try {
            const user = JSON.parse(localStorage.getItem('user') || '{}');
            const token = user?.token;
            const params = new URLSearchParams();
            if (filters.status) params.append('status', filters.status);
            if (filters.overdue) params.append('overdue', 'true');

            const response = await api.get(
                `/api/sales-orders?${params.toString()}`,
                { headers: { Authorization: `Bearer ${token}` } }
            );

            setOrders(response.data);
        } catch (error: any) {
            toast.error('Failed to sync order matrix');
        } finally {
            setLoading(false);
        }
    };

    const filteredOrders = useMemo(() => {
        if (!filters.search) return orders;
        const searchLower = filters.search.toLowerCase();
        return orders.filter((order) =>
            order.orderNumber.toLowerCase().includes(searchLower) ||
            order.customer?.name.toLowerCase().includes(searchLower)
        );
    }, [orders, filters.search]);

    const getStatusConfig = (status: string) => {
        switch (status) {
            case 'Delivered':
            case 'Invoiced':
                return { color: 'text-emerald-500', bg: 'bg-emerald-500/10', icon: CheckCircle2 };
            case 'Confirmed':
                return { color: 'text-amber-500', bg: 'bg-amber-500/10', icon: Zap };
            case 'Partially Delivered':
            case 'Partially Invoiced':
                return { color: 'text-blue-500', bg: 'bg-blue-500/10', icon: Clock };
            case 'Cancelled':
                return { color: 'text-rose-500', bg: 'bg-rose-500/10', icon: XCircle };
            default:
                return { color: 'text-neutral-500', bg: 'bg-neutral-500/10', icon: FileCheck };
        }
    };

    const metrics = useMemo(() => {
        const total = orders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
        const overdueCount = orders.filter(isOverdue).length;
        const pendingCount = orders.filter(o => !['Delivered', 'Invoiced', 'Cancelled'].includes(o.status)).length;
        return { total, overdueCount, pendingCount, count: orders.length };
    }, [orders]);

    return (
        <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 text-neutral-900 dark:text-white font-sans selection:bg-amber-500/30 overflow-x-hidden flex flex-col transition-colors animate-fade-in relative">
            {/* Ambient Background */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
                <div className="absolute top-[-20%] left-[10%] w-[60%] h-[60%] bg-amber-600/10 rounded-full blur-[150px]" />
                <div className="absolute bottom-[-10%] right-[10%] w-[40%] h-[40%] bg-rose-600/10 rounded-full blur-[150px]" />
            </div>

            <main className="relative z-10 flex-1 flex flex-col max-w-[1600px] w-full mx-auto px-8 py-8 space-y-8">
                {/* Modern Header */}
                <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    <div className="relative">
                        <div className="absolute -left-4 top-0 bottom-0 w-1 bg-amber-500 rounded-full shadow-[0_0_15px_rgba(245,158,11,0.5)]"></div>
                        <h1 className="text-3xl font-display font-black tracking-tighter text-neutral-900 dark:text-white flex items-center gap-3">
                            Order <span className="text-amber-500">Logistics</span>
                            <span className="px-3 py-1 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-lg text-xs font-bold uppercase tracking-widest">
                                Protocol Matrix
                            </span>
                        </h1>
                        <div className="flex items-center gap-2 mt-1">
                            <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
                            <p className="text-[10px] uppercase tracking-[0.2em] font-black text-neutral-500 dark:text-neutral-400">Ledger Pipeline Active // Operational Status: Nominal</p>
                        </div>
                    </div>
                    
                    <div className="flex items-center gap-3 w-full md:w-auto">
                        <button className="p-3 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl hover:scale-110 transition-transform shadow-sm group">
                            <RefreshCw className="w-4 h-4 text-neutral-500 group-hover:text-amber-500" onClick={fetchOrders} />
                        </button>
                        <Link to="/sales/orders/new" className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-3 bg-amber-500 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-amber-600 transition-all shadow-lg shadow-amber-500/20">
                            <Plus className="w-4 h-4" /> Initialize Order Protocol
                        </Link>
                    </div>
                </header>

                {/* Industrial KPI Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {[
                        { label: 'Cumulative Volume', value: `₹${metrics.total.toLocaleString()}`, icon: TrendingUp, color: 'text-amber-500', trend: '+12.4%', detail: 'Gross Logistical Value' },
                        { label: 'Active Pipeline', value: metrics.pendingCount, icon: Clock, color: 'text-blue-500', trend: 'Live', detail: 'Fulfillment Pending' },
                        { label: 'Protocol Nodes', value: metrics.count, icon: Briefcase, color: 'text-neutral-500', trend: 'Verified', detail: 'Total Documented Orders' },
                        { label: 'Critical Overdue', value: metrics.overdueCount, icon: AlertTriangle, color: metrics.overdueCount > 0 ? 'text-rose-500' : 'text-emerald-500', trend: 'Priority', detail: 'SLA Breach Risk' },
                    ].map((stat, i) => (
                        <div key={i} className="bg-white dark:bg-neutral-900 rounded-[32px] border border-neutral-200 dark:border-neutral-800 p-8 shadow-sm group hover:border-amber-500/30 transition-all relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-neutral-500/5 to-transparent rounded-bl-[100px]"></div>
                            <div className="relative z-10 flex flex-col h-full">
                                <div className="flex items-center justify-between mb-4">
                                    <div className={`p-3 rounded-2xl ${stat.color.replace('text', 'bg')}/10 ${stat.color}`}>
                                        <stat.icon className="w-6 h-6" />
                                    </div>
                                    <span className={`text-[10px] font-black uppercase tracking-widest ${stat.trend.includes('+') ? 'text-emerald-500' : 'text-neutral-400'}`}>
                                        {stat.trend}
                                    </span>
                                </div>
                                <h3 className="text-[10px] font-black text-neutral-400 uppercase tracking-[0.2em] mb-1">{stat.label}</h3>
                                <div className="text-3xl font-display font-black text-neutral-900 dark:text-white tracking-tighter mt-auto">
                                    {stat.value}
                                </div>
                                <p className="text-[9px] font-bold text-neutral-500 uppercase tracking-widest mt-2">{stat.detail}</p>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Institutional Data Matrix */}
                <div className="bg-white dark:bg-neutral-900 rounded-[40px] border border-neutral-200 dark:border-neutral-800 shadow-sm overflow-hidden flex flex-col">
                    {/* Matrix Control Bar */}
                    <div className="p-8 border-b border-neutral-200 dark:border-neutral-800 flex flex-col md:flex-row gap-6 items-center justify-between bg-neutral-50/50 dark:bg-neutral-950/50">
                        <div className="relative w-full md:max-w-md group">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-amber-500 group-focus-within:scale-110 transition-transform" />
                            <input
                                type="text"
                                placeholder="Scan Matrix (Order #, Entity...)"
                                value={filters.search}
                                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                                className="w-full bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-2xl py-4 pl-12 pr-6 text-xs font-bold focus:border-amber-500/50 outline-none transition-all dark:text-white shadow-inner"
                            />
                        </div>

                        <div className="flex items-center gap-4 w-full md:w-auto">
                            <div className="flex items-center gap-2 bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 p-1.5 rounded-2xl">
                                <button 
                                    onClick={() => setFilters({ ...filters, overdue: !filters.overdue })}
                                    className={`px-4 py-2 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${filters.overdue ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/20' : 'text-neutral-400 hover:text-neutral-900 dark:hover:text-white'}`}
                                >
                                    SLA Breach
                                </button>
                                <select
                                    value={filters.status}
                                    onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                                    className="bg-transparent text-[10px] font-black uppercase tracking-widest px-4 py-2 outline-none text-neutral-500 dark:text-neutral-400 cursor-pointer"
                                >
                                    <option value="">All Status Protocols</option>
                                    <option value="Confirmed">Confirmed</option>
                                    <option value="Invoiced">Invoiced</option>
                                    <option value="Delivered">Delivered</option>
                                    <option value="Cancelled">Cancelled</option>
                                </select>
                            </div>
                            <button className="p-3 bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl hover:text-amber-500 transition-colors">
                                <Download className="w-4 h-4" />
                            </button>
                        </div>
                    </div>

                    {/* Data Matrix */}
                    <div className="overflow-x-auto custom-scrollbar">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-neutral-50 dark:bg-neutral-950/50">
                                    <th className="px-8 py-5 text-[10px] font-black text-neutral-400 uppercase tracking-[0.2em] border-b border-neutral-200 dark:border-neutral-800">Order Node</th>
                                    <th className="px-8 py-5 text-[10px] font-black text-neutral-400 uppercase tracking-[0.2em] border-b border-neutral-200 dark:border-neutral-800">Customer Entity</th>
                                    <th className="px-8 py-5 text-[10px] font-black text-neutral-400 uppercase tracking-[0.2em] border-b border-neutral-200 dark:border-neutral-800">Operational Log</th>
                                    <th className="px-8 py-5 text-[10px] font-black text-neutral-400 uppercase tracking-[0.2em] border-b border-neutral-200 dark:border-neutral-800">Status Protocol</th>
                                    <th className="px-8 py-5 text-[10px] font-black text-neutral-400 uppercase tracking-[0.2em] border-b border-neutral-200 dark:border-neutral-800 text-right">Net Valuation</th>
                                    <th className="px-8 py-5 text-[10px] font-black text-neutral-400 uppercase tracking-[0.2em] border-b border-neutral-200 dark:border-neutral-800 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                                {loading ? (
                                    <tr>
                                        <td colSpan={6} className="px-8 py-20 text-center">
                                            <div className="flex flex-col items-center gap-4">
                                                <div className="w-12 h-12 border-4 border-amber-500/20 border-t-amber-500 rounded-full animate-spin"></div>
                                                <p className="text-[10px] font-black text-amber-500 uppercase tracking-[0.2em] animate-pulse">Syncing Order Matrix...</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : filteredOrders.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="px-8 py-20 text-center">
                                            <div className="flex flex-col items-center gap-4 text-neutral-300 dark:text-neutral-700">
                                                <Package className="w-16 h-16 opacity-20" />
                                                <p className="text-xs font-black uppercase tracking-widest">Protocol Matrix Empty</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    filteredOrders.map((order) => (
                                        <tr 
                                            key={order._id} 
                                            className="group hover:bg-amber-500/[0.02] transition-colors cursor-pointer"
                                            onClick={() => navigate(`/sales/sales-order/${order._id}`)}
                                        >
                                            <td className="px-8 py-6">
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-black text-neutral-900 dark:text-white uppercase tracking-tight group-hover:text-amber-500 transition-colors">{order.orderNumber}</span>
                                                    <span className="text-[9px] font-bold text-neutral-400 uppercase tracking-widest mt-1">ID: {order._id?.slice(-8).toUpperCase()}</span>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-10 h-10 rounded-xl bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-neutral-500 group-hover:bg-amber-500 group-hover:text-white transition-all">
                                                        <User className="w-5 h-5" />
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <span className="text-sm font-black text-neutral-900 dark:text-white uppercase tracking-tight">{order.customer?.name}</span>
                                                        <span className="text-[9px] font-bold text-neutral-400 uppercase tracking-widest mt-0.5">{order.customer?.phone}</span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6">
                                                <div className="flex flex-col">
                                                    <span className="text-[10px] font-black text-neutral-900 dark:text-white uppercase tracking-widest flex items-center gap-2">
                                                        <Calendar className="w-3 h-3 text-amber-500" /> {new Date(order.orderDate).toLocaleDateString()}
                                                    </span>
                                                    <span className={`text-[9px] font-bold uppercase tracking-widest mt-1 flex items-center gap-2 ${isOverdue(order) ? 'text-rose-500' : 'text-neutral-400'}`}>
                                                        <Truck className="w-3 h-3" /> SLA: {new Date(order.expectedDeliveryDate).toLocaleDateString()}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6">
                                                {(() => {
                                                    const config = getStatusConfig(order.status);
                                                    const Icon = config.icon;
                                                    return (
                                                        <div className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full ${config.bg} ${config.color} border border-${config.color.split('-')[1]}-500/20 shadow-sm`}>
                                                            <Icon className="w-3.5 h-3.5" />
                                                            <span className="text-[10px] font-black uppercase tracking-widest">{order.status}</span>
                                                        </div>
                                                    );
                                                })()}
                                            </td>
                                            <td className="px-8 py-6 text-right">
                                                <div className="flex flex-col items-end">
                                                    <span className="text-sm font-mono font-black text-neutral-900 dark:text-white tracking-tighter flex items-center gap-1">
                                                        <IndianRupee className="w-3 h-3 text-amber-500" /> {order.totalAmount?.toLocaleString()}
                                                    </span>
                                                    <span className="text-[9px] font-bold text-neutral-400 uppercase tracking-widest mt-1">Matrix Yield</span>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6 text-right">
                                                <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0">
                                                    <button 
                                                        className="p-3 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-amber-500 rounded-xl hover:bg-amber-500 hover:text-white transition-all shadow-sm"
                                                        title="Matrix View"
                                                    >
                                                        <Eye className="w-4 h-4" />
                                                    </button>
                                                    <button 
                                                        className="p-3 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-rose-500 rounded-xl hover:bg-rose-500 hover:text-white transition-all shadow-sm"
                                                        title="Purge Object"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Matrix Status Bar */}
                    <div className="p-8 border-t border-neutral-100 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-950/50 flex flex-col md:flex-row justify-between items-center gap-6">
                        <div className="flex items-center gap-6">
                            <div className="flex -space-x-3">
                                {[1, 2, 3, 4].map(i => (
                                    <div key={i} className="w-10 h-10 rounded-full border-2 border-white dark:border-neutral-900 bg-neutral-200 dark:bg-neutral-800 overflow-hidden shadow-xl shadow-black/5 flex items-center justify-center">
                                        <User className="w-5 h-5 text-neutral-400" />
                                    </div>
                                ))}
                            </div>
                            <div className="flex flex-col">
                                <span className="text-xs font-black text-neutral-900 dark:text-white uppercase tracking-widest">Active Dispatch Nodes</span>
                                <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest">Protocol Version 4.0 // Stable Matrix</span>
                            </div>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="flex flex-col items-end">
                                <span className="text-xs font-black text-emerald-500 uppercase tracking-[0.2em]">Operational Pulse</span>
                                <div className="w-48 h-1 bg-neutral-200 dark:bg-neutral-800 rounded-full mt-2 overflow-hidden shadow-inner">
                                    <div className="w-[85%] h-full bg-emerald-500 rounded-full animate-pulse" />
                                </div>
                            </div>
                            <button className="p-3 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl hover:scale-110 transition-transform shadow-lg shadow-black/5">
                                <ShieldCheck className="w-4 h-4 text-amber-500" />
                            </button>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default SalesOrderList;



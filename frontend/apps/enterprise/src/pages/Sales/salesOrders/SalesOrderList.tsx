import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import api from "@/services/api";
import { toast } from 'react-toastify';
import Layout from "@/components/shared/Layout/Layout";
import { SalesOrder } from '@/types/sales';
import { 
  Package, 
  Search, 
  Filter, 
  Printer, 
  Plus, 
  TrendingUp, 
  Clock, 
  AlertCircle, 
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Activity,
  Layers,
  ArrowUpRight,
  Zap,
  ShieldCheck,
  MoreVertical,
  X,
  CreditCard,
  Target,
  BarChart3,
  Calendar,
  Navigation
} from 'lucide-react';

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
            toast.error('Registry Sync Failure: Cannot retrieve fulfillment manifests');
        } finally {
            setLoading(false);
        }
    };

    const filteredOrders = useMemo(() => {
        if (!filters.search) return orders;
        const q = filters.search.toLowerCase();
        return orders.filter(o => 
            o.orderNumber.toLowerCase().includes(q) || 
            o.customer?.name.toLowerCase().includes(q)
        );
    }, [orders, filters.search]);

    const metrics = useMemo(() => ({
        totalRevenue: orders.reduce((sum, o) => sum + (o.totalAmount || 0), 0),
        activeVolume: orders.length,
        conversionRate: orders.length ? (orders.filter(o => ['Confirmed', 'Delivered'].includes(o.status)).length / orders.length) * 100 : 0,
        overdueCount: orders.filter(isOverdue).length
    }), [orders]);

    const getStatusConfig = (status: string) => {
        switch (status) {
            case 'Delivered':
            case 'Invoiced': return { color: "text-emerald-400", bg: "bg-emerald-400/10", border: "border-emerald-400/20", icon: CheckCircle, text: "Fulfilled" };
            case 'Confirmed': return { color: "text-blue-400", bg: "bg-blue-400/10", border: "border-blue-400/20", icon: Activity, text: "Resolved" };
            case 'Partially Delivered':
            case 'Partially Invoiced': return { color: "text-amber-400", bg: "bg-amber-400/10", border: "border-amber-400/20", icon: Clock, text: "Fragmented" };
            case 'Cancelled': return { color: "text-rose-400", bg: "bg-rose-400/10", border: "border-rose-400/20", icon: X, text: "Terminated" };
            default: return { color: "text-slate-400", bg: "bg-slate-400/10", border: "border-slate-400/20", icon: Layers, text: "Projection" };
        }
    };

    const MetricPanel = ({ title, value, icon: Icon, colorClass, gradient, subtext }: any) => (
        <motion.div 
            whileHover={{ y: -5, scale: 1.02 }}
            className="glass-panel p-8 border border-white/5 relative overflow-hidden group shadow-2xl transition-all"
        >
            <div className={`absolute top-0 right-0 w-32 h-32 ${gradient} opacity-5 rounded-full blur-[40px] -mr-8 -mt-8 group-hover:scale-150 transition-transform duration-700`}></div>
            <div className="flex justify-between items-start relative z-10">
                <div className="space-y-4">
                    <p className="text-[10px] font-black text-secondary uppercase tracking-[0.4em] opacity-40 group-hover:opacity-100 transition-opacity">{title}</p>
                    <div className="space-y-1">
                        <h3 className="text-3xl font-display font-black text-main tracking-tighter">{value}</h3>
                        {subtext && <p className={`text-[9px] font-black mt-2 uppercase tracking-widest ${colorClass} italic`}>{subtext}</p>}
                    </div>
                </div>
                <div className={`p-4 rounded-2xl ${colorClass.replace('text', 'bg')}/10 border border-white/5 ${colorClass} shadow-inner`}>
                    <Icon className="w-6 h-6" />
                </div>
            </div>
        </motion.div>
    );

    return (
        <Layout>
            <div className="min-h-screen bg-app p-4 lg:p-8 relative overflow-hidden pb-32">
                {/* Visual Background Accents */}
                <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-primary/5 rounded-full blur-[140px] pointer-events-none -mr-48 -mt-48 opacity-20"></div>
                <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-blue-500/5 rounded-full blur-[120px] pointer-events-none -ml-32 -mb-32 opacity-10"></div>

                <div className="max-w-7xl mx-auto relative z-10 space-y-10">
                    {/* Integrated Header */}
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
                        <div className="space-y-3">
                            <div className="flex items-center gap-3 text-primary font-black text-[10px] uppercase tracking-[0.5em]">
                                <ShieldCheck className="w-4 h-4" />
                                Operational Protocol: Fulfillment 2036
                            </div>
                            <h1 className="text-5xl md:text-6xl font-display font-black text-main tracking-tighter uppercase leading-none">
                                Resolution <span className="text-primary italic">Registry</span>
                            </h1>
                            <p className="text-secondary text-base font-medium opacity-60 max-w-xl">Centralized manifest orchestration and real-time fulfillment intelligence.</p>
                        </div>

                        <div className="flex items-center gap-4">
                            <button onClick={() => window.print()} className="w-14 h-14 glass-panel border border-white/10 hover:border-primary/40 transition-all text-secondary hover:text-primary flex items-center justify-center shadow-xl">
                                <Printer className="w-6 h-6" />
                            </button>
                            <button
                                onClick={() => navigate('/sales/sales-order')}
                                className="px-10 py-5 bg-primary text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.4em] shadow-2xl shadow-primary/40 hover:bg-primary-hover hover:scale-[1.05] active:scale-[0.98] transition-all flex items-center gap-4 group"
                            >
                                <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform duration-500" />
                                Initialize Manifest
                            </button>
                        </div>
                    </div>

                    {/* Operational Intelligence Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                        <MetricPanel title="Revenue Projection" value={`₹${metrics.totalRevenue.toLocaleString()}`} icon={TrendingUp} colorClass="text-emerald-400" gradient="bg-emerald-500" subtext="+14.8% CAPITAL GROWTH" />
                        <MetricPanel title="Active Manifests" value={metrics.activeVolume} icon={Layers} colorClass="text-primary" gradient="bg-primary" subtext="OPERATIONAL THREADS" />
                        <MetricPanel title="Resolution Index" value={`${metrics.conversionRate.toFixed(1)}%`} icon={Target} colorClass="text-blue-400" gradient="bg-blue-500" subtext="FIDELITY QUOTIENT" />
                        <MetricPanel title="SLA Breaches" value={metrics.overdueCount} icon={AlertCircle} colorClass="text-rose-400" gradient="bg-rose-500" subtext={metrics.overdueCount > 0 ? "CRITICAL INTERVENTION" : "REGISTRY STABLE"} />
                    </div>

                    {/* Control Hub */}
                    <div className="space-y-6">
                        <div className="glass-panel p-4 border border-white/5 flex flex-col lg:flex-row items-center gap-6 shadow-2xl">
                            <div className="flex-1 w-full relative group/search">
                                <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-primary/40 group-focus-within/search:text-primary transition-colors" />
                                <input 
                                    type="text"
                                    placeholder="SCAN REGISTRY FOR MANIFEST HASH OR ENTITY MARKS..."
                                    value={filters.search}
                                    onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                                    className="w-full bg-white/5 border border-white/10 rounded-[1.5rem] pl-16 pr-6 py-5 text-[11px] font-black text-main uppercase tracking-[0.2em] focus:outline-none focus:border-primary/40 focus:ring-4 focus:ring-primary/5 transition-all placeholder:text-secondary/20"
                                />
                            </div>
                            
                            <div className="flex flex-wrap items-center gap-4 w-full lg:w-auto">
                                <select 
                                    value={filters.status}
                                    onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                                    className="bg-white/5 border border-white/10 rounded-2xl px-6 py-5 text-[10px] font-black text-secondary uppercase tracking-widest focus:outline-none focus:border-primary/40 appearance-none min-w-[180px] cursor-pointer"
                                >
                                    <option value="" className="bg-neutral-900">All Lifecycle Phases</option>
                                    <option value="Draft" className="bg-neutral-900">Projection (Draft)</option>
                                    <option value="Confirmed" className="bg-neutral-900">Resolved (Confirmed)</option>
                                    <option value="Delivered" className="bg-neutral-900">Fulfilled (Delivered)</option>
                                    <option value="Invoiced" className="bg-neutral-900">Settled (Invoiced)</option>
                                    <option value="Cancelled" className="bg-neutral-900">Terminated (Cancelled)</option>
                                </select>

                                <label className={`flex items-center gap-4 px-6 py-5 rounded-2xl border cursor-pointer transition-all group ${filters.overdue ? 'bg-rose-500/10 border-rose-500/40 text-rose-400' : 'bg-white/5 border-white/10 text-secondary hover:bg-white/10'}`}>
                                    <input
                                        type="checkbox"
                                        checked={filters.overdue}
                                        onChange={(e) => setFilters({ ...filters, overdue: e.target.checked })}
                                        className="hidden"
                                    />
                                    <div className={`w-5 h-5 rounded-md border flex items-center justify-center transition-colors ${filters.overdue ? 'bg-rose-500 border-rose-500' : 'border-white/20'}`}>
                                        {filters.overdue && <X className="w-3 h-3 text-white" />}
                                    </div>
                                    <span className="text-[10px] font-black uppercase tracking-widest">SLA Alert</span>
                                </label>

                                {Object.values(filters).some(v => v) && (
                                    <button 
                                        onClick={() => setFilters({ status: '', search: '', overdue: false })}
                                        className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-rose-500/40 hover:text-rose-500 hover:border-rose-500/40 transition-all hover:rotate-90"
                                    >
                                        <X className="w-6 h-6" />
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Registry Latticework */}
                        <div className="glass-panel border border-white/5 overflow-hidden shadow-2xl">
                            {loading ? (
                                <div className="flex flex-col items-center justify-center py-48 space-y-6">
                                    <div className="w-16 h-16 border-4 border-primary/10 border-t-primary rounded-full animate-spin shadow-2xl shadow-primary/20"></div>
                                    <div className="text-center space-y-2">
                                        <p className="text-[10px] font-black text-secondary uppercase tracking-[0.5em] animate-pulse">Syncing Registry lattice...</p>
                                        <p className="text-[8px] font-bold text-primary/40 uppercase tracking-widest">Protocol 2036.04 Secure Link</p>
                                    </div>
                                </div>
                            ) : filteredOrders.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-48 text-center space-y-8">
                                    <div className="relative">
                                        <div className="absolute inset-0 bg-primary/20 blur-[60px] rounded-full"></div>
                                        <div className="w-24 h-24 bg-white/5 border border-white/5 rounded-[2.5rem] flex items-center justify-center relative z-10">
                                            <Package className="w-12 h-12 text-primary opacity-20" />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <h3 className="text-2xl font-display font-black text-main uppercase tracking-tight">Queue Void Detected</h3>
                                        <p className="text-secondary text-sm font-medium opacity-40 max-w-xs mx-auto leading-relaxed italic">No operational manifests match the current control parameters in the synchronized lattice.</p>
                                    </div>
                                </div>
                            ) : (
                                <div className="overflow-x-auto custom-scrollbar">
                                    <table className="w-full text-left border-separate border-spacing-0">
                                        <thead>
                                            <tr className="bg-white/5 border-b border-white/5">
                                                <th className="px-8 py-6 text-[9px] font-black text-secondary uppercase tracking-[0.4em] opacity-40 italic">Protocol Index</th>
                                                <th className="px-8 py-6 text-[9px] font-black text-secondary uppercase tracking-[0.4em] opacity-40 italic">Commercial Entity</th>
                                                <th className="px-8 py-6 text-[9px] font-black text-secondary uppercase tracking-[0.4em] opacity-40 italic">Temporal Delta</th>
                                                <th className="px-8 py-6 text-[9px] font-black text-secondary uppercase tracking-[0.4em] opacity-40 italic text-center">Lifecycle state</th>
                                                <th className="px-8 py-6 text-[9px] font-black text-secondary uppercase tracking-[0.4em] opacity-40 italic text-right">Magnitude</th>
                                                <th className="px-8 py-6 text-[9px] font-black text-secondary uppercase tracking-[0.4em] opacity-40 italic text-right w-32">Action</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-white/5">
                                            <AnimatePresence mode="popLayout">
                                                {filteredOrders.map((order, idx) => {
                                                    const status = getStatusConfig(order.status);
                                                    const StatusIcon = status.icon;
                                                    const overdue = isOverdue(order);
                                                    return (
                                                        <motion.tr 
                                                            layout
                                                            key={order._id}
                                                            initial={{ opacity: 0, x: -20 }}
                                                            animate={{ opacity: 1, x: 0 }}
                                                            exit={{ opacity: 0, scale: 0.98 }}
                                                            transition={{ delay: idx * 0.03 }}
                                                            className="group hover:bg-white/[0.02] transition-colors cursor-default"
                                                        >
                                                            <td className="px-8 py-6">
                                                                <div 
                                                                    onClick={() => navigate(`/sales/sales-order/${order._id}`)}
                                                                    className="text-sm font-display font-black text-primary tracking-tighter cursor-pointer hover:text-primary-hover uppercase flex items-center gap-2 group/id transition-colors"
                                                                >
                                                                    {order.orderNumber}
                                                                    <ArrowUpRight className="w-3 h-3 opacity-0 group-hover/id:opacity-100 group-hover/id:translate-x-0.5 group-hover/id:-translate-y-0.5 transition-all text-primary/40" />
                                                                </div>
                                                                {overdue && (
                                                                    <div className="text-[8px] font-black text-rose-500 uppercase tracking-widest mt-1.5 flex items-center gap-1.5 bg-rose-500/5 px-2 py-0.5 rounded-full border border-rose-500/10 w-fit">
                                                                        <AlertCircle className="w-2.5 h-2.5" /> SLA BREACH
                                                                    </div>
                                                                )}
                                                            </td>
                                                            <td className="px-8 py-6">
                                                                <div className="text-[11px] font-black text-main uppercase tracking-widest leading-none">{order.customer?.name || 'Unknown Proxy'}</div>
                                                                <div className="text-[9px] font-bold text-secondary/40 uppercase tracking-[0.1em] mt-2 flex items-center gap-2 italic">
                                                                    <Activity className="w-2.5 h-2.5 text-emerald-500/40" />
                                                                    {order.customer?.phone || 'NO_HASH_LINK'}
                                                                </div>
                                                            </td>
                                                            <td className="px-8 py-6">
                                                                <div className="text-[11px] font-bold text-main uppercase tracking-tight">{new Date(order.orderDate).toLocaleDateString("en-US", { month: 'short', day: 'numeric', year: 'numeric' })}</div>
                                                                <div className="text-[9px] font-black text-secondary/30 uppercase tracking-widest mt-1.5">Manifest Locked / 2036</div>
                                                            </td>
                                                            <td className="px-8 py-6">
                                                                <div className="flex justify-center">
                                                                    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border ${status.bg} ${status.border} ${status.color} shadow-sm group-hover:scale-105 transition-transform`}>
                                                                        <StatusIcon className="w-3 h-3" />
                                                                        <span className="text-[8px] font-black uppercase tracking-[0.2em] leading-none">{status.text}</span>
                                                                    </div>
                                                                </div>
                                                            </td>
                                                            <td className="px-8 py-6 text-right">
                                                                <div className="font-display font-black text-main tracking-tighter text-xl tabular-nums leading-none">₹{order.totalAmount.toLocaleString()}</div>
                                                                <div className="text-[8px] font-black text-primary/40 uppercase tracking-[0.2em] mt-2 italic">authorized Magnitude</div>
                                                            </td>
                                                            <td className="px-8 py-6 text-right">
                                                                <button 
                                                                    onClick={() => navigate(`/sales/sales-order/${order._id}`)}
                                                                    className="w-12 h-12 rounded-2xl bg-white/5 border border-white/5 hover:border-primary/40 flex items-center justify-center transition-all group/btn shadow-xl ml-auto"
                                                                >
                                                                    <Navigation className="w-5 h-5 text-secondary group-hover/btn:text-primary group-hover/btn:rotate-45 transition-all" />
                                                                </button>
                                                            </td>
                                                        </motion.tr>
                                                    );
                                                })}
                                            </AnimatePresence>
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <style>{`
                .glass-panel { background: rgba(255, 255, 255, 0.03); backdrop-filter: blur(25px); border-radius: 2.5rem; }
                .font-display { font-family: 'Outfit', sans-serif; }
                .custom-scrollbar::-webkit-scrollbar { height: 4px; width: 4px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: rgba(255, 255, 255, 0.01); }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(var(--color-primary-rgb), 0.2); border-radius: 20px; }
                select option { background-color: #0c0a09; color: white; padding: 20px; }
            `}</style>
        </Layout>
    );
};

export default SalesOrderList;

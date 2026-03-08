import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import api from "@/services/api";
import { toast } from 'react-toastify';
import Layout from "@/components/shared/Layout/Layout";
import SalesOrderTemplate from '@/components/sales/SalesOrderTemplate';
import {
    Package,
    Truck,
    FileText,
    CheckCircle,
    XCircle,
    Clock,
    ArrowLeft,
    Printer,
    AlertTriangle,
    Phone,
    Mail,
    ClipboardList,
    BadgeCheck,
    Receipt,
    LucideIcon,
    ChevronLeft,
    Activity,
    Layers,
    History,
    Zap,
    ArrowUpRight,
    MapPin,
    User,
    TrendingUp,
    ShieldCheck,
    Box
} from 'lucide-react';
import { SalesOrder, SalesOrderItem } from '@/types/sales';

const SalesOrderDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [order, setOrder] = useState<SalesOrder | null>(null);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);

    useEffect(() => {
        fetchOrderDetails();
    }, [id]);

    const fetchOrderDetails = async () => {
        setLoading(true);
        try {
            const user = JSON.parse(localStorage.getItem('user') || '{}');
            const token = user?.token;
            const response = await api.get(
                `/api/sales-orders/${id}`,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setOrder(response.data);
        } catch (error: any) {
            toast.error('Resolution Sync Failure: Cannot retrieve manifest details');
            navigate('/sales/sales-order-list');
        } finally {
            setLoading(false);
        }
    };

    const handleCancelOrder = async () => {
        if (!confirm('Abort Protocol: Confirming will permanently terminate this resolution thread. Proceed?')) {
            return;
        }

        setActionLoading(true);
        try {
            const user = JSON.parse(localStorage.getItem('user') || '{}');
            const token = user?.token;
            await api.post(
                `/api/sales-orders/${id}/cancel`,
                {},
                { headers: { Authorization: `Bearer ${token}` } }
            );
            toast.success('Resolution thread terminated successfully');
            fetchOrderDetails();
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Termination Protocol Failed');
        } finally {
            setActionLoading(false);
        }
    };

    const getStatusConfig = (status: string | undefined) => {
        const configs: Record<string, any> = {
            'Draft': { color: 'text-slate-500', bg: 'bg-slate-500/10', border: 'border-slate-500/20', icon: ClipboardList, text: 'Projection (Draft)' },
            'Confirmed': { color: 'text-blue-400', bg: 'bg-blue-400/10', border: 'border-blue-400/20', icon: BadgeCheck, text: 'Resolved (Confirmed)' },
            'Partially Delivered': { color: 'text-purple-400', bg: 'bg-purple-400/10', border: 'border-purple-400/20', icon: Truck, text: 'Fragmented Delivery' },
            'Delivered': { color: 'text-indigo-400', bg: 'bg-indigo-400/10', border: 'border-indigo-400/20', icon: Package, text: 'Fulfilled' },
            'Partially Invoiced': { color: 'text-amber-400', bg: 'bg-amber-400/10', border: 'border-amber-400/20', icon: Receipt, text: 'Fragmented Settlement' },
            'Invoiced': { color: 'text-emerald-400', bg: 'bg-emerald-400/10', border: 'border-emerald-400/20', icon: CheckCircle, text: 'Settled & Archived' },
            'Cancelled': { color: 'text-rose-400', bg: 'bg-rose-400/10', border: 'border-rose-400/20', icon: XCircle, text: 'Terminated' }
        };
        return (status && configs[status]) || configs['Draft'];
    };

    const lifecycleStages = useMemo(() => {
        const stages = ['Draft', 'Confirmed', 'Delivered', 'Invoiced'];
        const currentStatus = order?.status?.replace('Partially ', '') || 'Draft';
        const currentIndex = stages.indexOf(currentStatus);

        return stages.map((stage, index) => ({
            name: stage === 'Invoiced' ? 'Settled' : stage,
            completed: index < currentIndex,
            current: index === currentIndex,
            upcoming: index > currentIndex
        }));
    }, [order?.status]);

    if (loading || !order) {
        return (
            <Layout>
                <div className="flex flex-col items-center justify-center py-40 space-y-6">
                    <div className="w-16 h-16 border-4 border-primary/10 border-t-primary rounded-full animate-spin shadow-2xl shadow-primary/20"></div>
                    <div className="text-center space-y-2">
                        <p className="text-[10px] font-black text-secondary uppercase tracking-[0.5em] animate-pulse">Decoding Resolution Manifest...</p>
                        <p className="text-[8px] font-bold text-primary/40 uppercase tracking-widest">Protocol 2036.04 Secure Link</p>
                    </div>
                </div>
            </Layout>
        );
    }

    const status = getStatusConfig(order.status);
    const hasItemsToDeliver = order.items.some((item) => ((item.reservedQty || 0) - (item.deliveredQty || 0)) > 0);
    const canConvertToDC = hasItemsToDeliver && (order.status === 'Confirmed' || order.status === 'Partially Delivered');
    const canCancel = order.status !== 'Cancelled' && order.status !== 'Invoiced';

    const summaryMetrics = [
        {
            label: "Asset Allocation",
            value: order.items.length,
            subtext: "Discrete Manifest Units",
            icon: Box,
            colorClass: "text-primary bg-primary/10"
        },
        {
            label: "Fulfillment Velocity",
            value: `${Math.round(order.items.reduce((acc, curr) => acc + (curr.deliveredQty || 0), 0) / order.items.reduce((acc, curr) => acc + curr.quantity, 0) * 100) || 0}%`,
            subtext: "Secure Dispatch Status",
            icon: Truck,
            colorClass: "text-indigo-400 bg-indigo-400/10"
        },
        {
            label: "SLA Temporal Marker",
            value: new Date(order.orderDate).toLocaleDateString(),
            subtext: "Effective Protocol Date",
            icon: Clock,
            colorClass: order.isOverdue ? "text-rose-500 bg-rose-500/10" : "text-emerald-400 bg-emerald-400/10"
        }
    ];

    const customerData = {
        name: order.customer?.name || 'Walk-in Proxy',
        initials: order.customer?.name?.charAt(0).toUpperCase() || 'W',
        details: [
            { icon: Phone, label: order.customer?.phone || 'NULL_PH' },
            { icon: Mail, label: order.customer?.email || 'NULL_EM' },
            { icon: MapPin, label: "Jurisdiction: Global Commerce" },
            { icon: ShieldCheck, label: "Trust Vector: High Precision" }
        ]
    };

    return (
        <Layout>
            <SalesOrderTemplate
                orderNumber={order.orderNumber}
                orderDate={new Date(order.orderDate).toLocaleDateString()}
                status={status}
                totalAmount={order.totalAmount}
                customer={customerData}
                summaryMetrics={summaryMetrics}
                onBack={() => navigate('/sales/sales-order-list')}
                actions={
                    <div className="flex gap-4">
                        {canConvertToDC && (
                            <button
                                onClick={() => navigate(`/sales/delivery-challan?salesOrderId=${order._id}`)}
                                className="px-8 py-4 bg-primary text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.4em] shadow-2xl shadow-primary/40 hover:bg-primary-hover hover:scale-[1.05] active:scale-[0.98] transition-all flex items-center gap-4 group"
                            >
                                <Truck className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                Initiate Fulfillment
                            </button>
                        )}
                        {canCancel && (
                            <button
                                onClick={handleCancelOrder}
                                disabled={actionLoading}
                                className="px-8 py-4 bg-white/5 border border-rose-500/20 text-rose-500 rounded-2xl font-black text-[10px] uppercase tracking-[0.4em] hover:bg-rose-500/10 hover:scale-[1.05] transition-all flex items-center gap-4 disabled:opacity-20 shadow-xl shadow-rose-900/10"
                            >
                                <XCircle className="w-5 h-5" />
                                Terminate Manifest
                            </button>
                        )}
                    </div>
                }
            >
                {/* Lifecycle Progress Integrated */}
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="glass-panel p-10 border border-white/5 shadow-inner"
                >
                    <div className="text-[10px] font-black text-primary uppercase tracking-[0.4em] mb-10 border-l-2 border-primary pl-4">Resolution Lifecycle Projection</div>
                    <div className="flex items-center justify-between relative px-6 md:px-12">
                        {/* Connector Line */}
                        <div className="absolute top-[24px] left-12 right-12 h-1 bg-white/5 z-0" />
                        
                        {lifecycleStages.map((stage, idx) => (
                            <div key={stage.name} className="relative z-10 flex flex-col items-center gap-4 group">
                                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xs font-black transition-all duration-700 ${
                                    stage.completed ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/40 scale-110' :
                                    stage.current ? 'bg-primary text-white shadow-lg shadow-primary/40 ring-8 ring-primary/5 scale-125' :
                                    'bg-white/5 text-secondary/20 border border-white/10 group-hover:border-white/20'
                                }`}>
                                    {stage.completed ? <CheckCircle className="w-6 h-6" /> : idx + 1}
                                </div>
                                <span className={`text-[9px] font-black uppercase tracking-[0.3em] transition-all ${stage.current ? 'text-primary' : 'text-secondary/40 group-hover:text-secondary/60'}`}>
                                    {stage.name}
                                </span>
                            </div>
                        ))}
                    </div>
                </motion.div>

                {/* Inventory Partition */}
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="glass-panel border border-white/5 overflow-hidden shadow-2xl"
                >
                    <div className="px-10 py-7 border-b border-white/5 bg-white/[0.02] flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20">
                                <Layers className="w-5 h-5" />
                            </div>
                            <span className="text-[10px] font-black text-secondary uppercase tracking-[0.4em]">Operational Allocation Manifest</span>
                        </div>
                        <div className="flex items-center gap-2">
                             <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                             <span className="text-[8px] font-black text-emerald-500 uppercase tracking-widest">Real-time Sync</span>
                        </div>
                    </div>
                    <div className="overflow-x-auto custom-scrollbar">
                        <table className="w-full text-left order-separate border-spacing-0">
                            <thead>
                                <tr className="border-b border-white/5">
                                    <th className="px-10 py-6 text-[9px] font-black text-secondary/40 uppercase tracking-[0.4em] opacity-40">Protocol Index</th>
                                    <th className="px-10 py-6 text-[9px] font-black text-secondary/40 uppercase tracking-[0.4em] opacity-40">Asset Identifier</th>
                                    <th className="px-10 py-6 text-[9px] font-black text-secondary/40 uppercase tracking-[0.4em] opacity-40 text-right">Magnitude</th>
                                    <th className="px-10 py-6 text-[9px] font-black text-secondary/40 uppercase tracking-[0.4em] opacity-40 text-center w-64">Fulfillment Status</th>
                                    <th className="px-10 py-6 text-[9px] font-black text-secondary/40 uppercase tracking-[0.4em] opacity-40 text-right">Value Scalar</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {order.items.map((item, idx) => {
                                    const deliveryProgress = item.quantity > 0 ? ((item.deliveredQty || 0) / item.quantity) * 100 : 0;
                                    return (
                                        <tr key={idx} className="group hover:bg-white/[0.02] transition-colors cursor-default">
                                            <td className="px-10 py-6 text-[10px] font-black text-secondary/30 font-mono italic">{String(idx + 1).padStart(2, '0')}</td>
                                            <td className="px-10 py-6">
                                                <div className="text-sm font-display font-black text-main uppercase tracking-tight group-hover:text-primary transition-colors leading-none">{item.item?.name || item.name}</div>
                                                <div className="flex items-center gap-2 mt-2">
                                                    <p className="text-[9px] font-black text-secondary/40 uppercase tracking-[0.1em]">Unit Manifest: ₹{item.rate?.toLocaleString()}</p>
                                                    <div className="w-1 h-1 rounded-full bg-white/10"></div>
                                                    <p className="text-[9px] font-black text-primary/40 uppercase tracking-[0.1em]">Verified Asset</p>
                                                </div>
                                            </td>
                                            <td className="px-10 py-6 text-right">
                                                <div className="font-mono font-black text-main text-lg">{item.quantity}</div>
                                                <div className="text-[8px] font-bold text-secondary/40 uppercase tracking-widest mt-1">Allocation Volume</div>
                                            </td>
                                            <td className="px-10 py-6">
                                                <div className="flex flex-col items-center gap-3">
                                                    <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden border border-white/10 shadow-inner group">
                                                        <motion.div 
                                                            initial={{ width: 0 }}
                                                            animate={{ width: `${deliveryProgress}%` }}
                                                            className={`h-full ${deliveryProgress === 100 ? 'bg-emerald-500' : 'bg-primary'} rounded-full shadow-lg`}
                                                        />
                                                    </div>
                                                    <div className="flex justify-between w-full">
                                                        <span className="text-[8px] font-black text-secondary opacity-40 uppercase tracking-widest">
                                                            Fulfillment Latency: {Math.round(deliveryProgress)}%
                                                        </span>
                                                        <span className="text-[8px] font-black text-primary uppercase tracking-widest italic font-bold">
                                                            {item.deliveredQty || 0} / {item.quantity} DISPATCHED
                                                        </span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-10 py-6 text-right">
                                                <div className="font-display font-black text-main tracking-tighter text-xl tabular-nums leading-none">₹{item.total?.toLocaleString()}</div>
                                                <div className="text-[8px] font-black text-primary/40 uppercase tracking-[0.2em] mt-2 italic shadow-sm">Net Resolution Magnitude</div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>

                    {/* Yield Analysis Footer */}
                    <div className="p-10 bg-white/[0.01] border-t border-white/5 grid grid-cols-1 md:grid-cols-4 gap-8">
                         <div className="space-y-1">
                             <div className="text-[9px] font-black text-secondary uppercase tracking-[0.4em] opacity-40">Gross Manifest</div>
                             <div className="text-xl font-display font-black text-main tracking-tighter tabular-nums">₹{order.subtotal?.toLocaleString()}</div>
                         </div>
                         <div className="space-y-1">
                             <div className="text-[9px] font-black text-secondary uppercase tracking-[0.4em] opacity-40">Value Absorption (Tax)</div>
                             <div className="text-xl font-display font-black text-primary tracking-tighter tabular-nums">+₹{order.taxTotal?.toLocaleString()}</div>
                         </div>
                         <div className="space-y-1">
                             <div className="text-[9px] font-black text-secondary uppercase tracking-[0.4em] opacity-40">Resolution Rebate</div>
                             <div className="text-xl font-display font-black text-rose-500 tracking-tighter tabular-nums">-₹{order.discountTotal?.toLocaleString()}</div>
                         </div>
                         <div className="space-y-1 text-right">
                             <div className="text-[9px] font-black text-primary uppercase tracking-[0.4em]">Authorized Net Position</div>
                             <div className="text-3xl font-display font-black text-main tracking-tighter tabular-nums leading-none">₹{order.totalAmount?.toLocaleString()}</div>
                         </div>
                    </div>
                </motion.div>

                {/* Secure Network Traceability */}
                <AnimatePresence>
                    {((order.deliveryChallans && order.deliveryChallans.length > 0) || (order.invoices && order.invoices.length > 0)) && (
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.98 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="glass-panel p-10 border border-white/5 space-y-8"
                        >
                            <div className="flex items-center gap-4">
                                <Activity className="w-5 h-5 text-primary" />
                                <div className="text-[10px] font-black text-secondary uppercase tracking-[0.4em]">Lattice Traceability: Linked Manifests</div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {order.deliveryChallans?.map((dc: any, idx: number) => (
                                    <motion.div 
                                        whileHover={{ scale: 1.02 }}
                                        key={idx} 
                                        className="flex items-center justify-between p-5 bg-white/[0.03] border border-white/10 rounded-2xl group hover:border-primary/40 transition-all cursor-pointer shadow-lg"
                                    >
                                        <div className="flex items-center gap-5">
                                            <div className="w-12 h-12 bg-indigo-500/10 rounded-xl text-indigo-400 flex items-center justify-center border border-indigo-500/20 shadow-inner">
                                                <Truck className="w-6 h-6" />
                                            </div>
                                            <div className="space-y-1">
                                                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-secondary group-hover:text-main transition-colors">{dc.challanNumber || `DC-LNK-${idx}`}</span>
                                                <div className="text-[8px] font-black text-indigo-400/60 uppercase tracking-widest italic">Dispatch Protocol Link</div>
                                            </div>
                                        </div>
                                        <ArrowUpRight className="w-5 h-5 opacity-40 group-hover:opacity-100 group-hover:text-primary transition-all" />
                                    </motion.div>
                                ))}
                                {order.invoices?.map((inv: any, idx: number) => (
                                    <motion.div 
                                        whileHover={{ scale: 1.02 }}
                                        key={idx} 
                                        className="flex items-center justify-between p-5 bg-white/[0.03] border border-white/10 rounded-2xl group hover:border-emerald-500/40 transition-all cursor-pointer shadow-lg"
                                    >
                                        <div className="flex items-center gap-5">
                                            <div className="w-12 h-12 bg-emerald-500/10 rounded-xl text-emerald-400 flex items-center justify-center border border-emerald-500/20 shadow-inner">
                                                <FileText className="w-6 h-6" />
                                            </div>
                                            <div className="space-y-1">
                                                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-secondary group-hover:text-main transition-colors">{inv.invoiceNo || `INV-LNK-${idx}`}</span>
                                                <div className="text-[8px] font-black text-emerald-400/60 uppercase tracking-widest italic">Capital Resolution Link</div>
                                            </div>
                                        </div>
                                        <ArrowUpRight className="w-5 h-5 opacity-40 group-hover:opacity-100 group-hover:text-emerald-500 transition-all" />
                                    </motion.div>
                                ))}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </SalesOrderTemplate>

            <style>{`
                .custom-scrollbar::-webkit-scrollbar { width: 4px; height: 4px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: rgba(255, 255, 255, 0.01); }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(var(--color-primary-rgb), 0.2); border-radius: 20px; }
            `}</style>
        </Layout>
    );
};

export default SalesOrderDetail;

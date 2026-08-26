import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from "../../../services/api";
import { toast } from 'react-toastify';
import {
    Package,
    Truck,
    FileText,
    CheckCircle2,
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
    Download,
    Share2,
    RefreshCw,
    Calculator,
    Globe,
    IndianRupee,
    ShieldCheck,
    Calendar,
    Briefcase,
    Zap,
    User,
    Layers,
    CheckCircle
} from 'lucide-react';
import { SalesOrder, SalesOrderItem } from '../../../types/sales';

interface StatusConfig {
    color: string;
    icon: LucideIcon;
    text: string;
    glow: string;
}

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
            toast.error('Failed to sync order matrix');
            navigate('/sales/orders');
        } finally {
            setLoading(false);
        }
    };

    const handleCancelOrder = async () => {
        if (!confirm('Are you sure you want to cancel this order? Reserved stock will be released.')) {
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
            toast.success('Protocol cancelled successfully');
            fetchOrderDetails();
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Cancellation failure');
        } finally {
            setActionLoading(false);
        }
    };

    const getStatusConfig = (status: string | undefined): StatusConfig => {
        const configs: Record<string, StatusConfig> = {
            'Draft': { color: 'text-neutral-500', glow: 'bg-neutral-500/10', icon: ClipboardList, text: 'Draft Mode' },
            'Confirmed': { color: 'text-warning', glow: 'bg-warning/10', icon: BadgeCheck, text: 'Protocol Confirmed' },
            'Partially Delivered': { color: 'text-blue-500', glow: 'bg-blue-500/10', icon: Truck, text: 'Partial Fulfillment' },
            'Delivered': { color: 'text-primary', glow: 'bg-primary/10', icon: Package, text: 'Logistical Completion' },
            'Partially Invoiced': { color: 'text-warning', glow: 'bg-warning/10', icon: Receipt, text: 'Partial Invoicing' },
            'Invoiced': { color: 'text-success', glow: 'bg-success/10', icon: CheckCircle2, text: 'Fiscal Finalization' },
            'Cancelled': { color: 'text-danger', glow: 'bg-danger/10', icon: XCircle, text: 'Protocol Aborted' }
        };
        return (status && configs[status]) || configs['Draft'];
    };

    const lifecycleStages = useMemo(() => {
        const stages = ['Draft', 'Confirmed', 'Delivered', 'Invoiced'];
        const currentStatus = order?.status?.replace('Partially ', '') || 'Draft';
        const currentIndex = stages.indexOf(currentStatus);

        return stages.map((stage, index) => ({
            name: stage,
            completed: index < currentIndex || (index === currentIndex && (order?.status === 'Delivered' || order?.status === 'Invoiced')),
            current: index === currentIndex && order?.status !== 'Delivered' && order?.status !== 'Invoiced',
            upcoming: index > currentIndex
        }));
    }, [order]);

    if (loading) {
        return (
            <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 flex flex-col items-center justify-center gap-4">
                <div className="w-12 h-12 border-4 border-warning/20 border-t-amber-500 rounded-full animate-spin"></div>
                <p className="text-[10px] font-black text-warning uppercase tracking-[0.2em] animate-pulse">Syncing Order Node...</p>
            </div>
        );
    }

    if (!order) {
        return (
            <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 flex flex-col items-center justify-center gap-4">
                <AlertTriangle className="w-16 h-16 text-danger opacity-20" />
                <p className="text-xs font-black text-neutral-400 uppercase tracking-widest text-center">Node Not Found // Protocol Error</p>
                <button onClick={() => navigate('/sales/orders')} className="mt-4 px-6 py-3 bg-amber-500 text-white rounded-sm text-[10px] font-black uppercase tracking-widest hover:bg-amber-600 transition-all shadow-lg shadow-amber-500/20">
                    Return to Registry
                </button>
            </div>
        );
    }

    const statusConfig = getStatusConfig(order.status);
    const StatusIcon = statusConfig.icon;
    const hasItemsToDeliver = order.items.some((item) => ((item.reservedQty || 0) - (item.deliveredQty || 0)) > 0);
    const canConvertToDC = hasItemsToDeliver && (order.status === 'Confirmed' || order.status === 'Partially Delivered');
    const canCancel = order.status !== 'Cancelled' && order.status !== 'Invoiced';

    return (
        <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 text-neutral-900 dark:text-white font-sans selection:bg-amber-500/30 overflow-x-hidden flex flex-col transition-colors animate-fade-in relative">
            {/* Ambient Background */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
                <div className="absolute top-[-20%] left-[10%] w-[60%] h-[60%] bg-amber-600/10 rounded-full blur-[150px]" />
                <div className="absolute bottom-[-10%] right-[10%] w-[40%] h-[40%] bg-rose-600/10 rounded-full blur-[150px]" />
            </div>

            <main className="relative z-10 flex-1 flex flex-col max-w-[1600px] w-full mx-auto px-8 py-8 space-y-8 pb-20">
                {/* Modern Header */}
                <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    <div className="flex items-center gap-6">
                        <button 
                            onClick={() => navigate('/sales/orders')}
                            className="p-3 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-sm hover:scale-110 transition-transform text-neutral-500 hover:text-warning shadow-sm"
                        >
                            <ArrowLeft className="w-5 h-5" />
                        </button>
                        <div className="relative">
                            <div className="absolute -left-4 top-0 bottom-0 w-1 bg-amber-500 rounded-full shadow-[0_0_15px_rgba(245,158,11,0.5)]"></div>
                            <h1 className="text-3xl font-display font-black tracking-tighter text-neutral-900 dark:text-white flex items-center gap-3">
                                {order.orderNumber}
                                <span className={`px-3 py-1 ${statusConfig.glow} border border-current/20 ${statusConfig.color} rounded-lg text-xs font-bold uppercase tracking-widest`}>
                                    {statusConfig.text}
                                </span>
                            </h1>
                            <div className="flex items-center gap-2 mt-1">
                                <span className="flex h-2 w-2 rounded-full bg-emerald-500"></span>
                                <p className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest">Protocol Active // Log Date: {new Date(order.orderDate).toLocaleDateString()}</p>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <button className="p-3 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl hover:text-warning transition-colors shadow-sm group">
                            <Printer className="w-4 h-4" onClick={() => window.print()} />
                        </button>
                        <button className="p-3 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl hover:text-warning transition-colors shadow-sm">
                            <Download className="w-4 h-4" />
                        </button>
                        {canConvertToDC && (
                            <button 
                                onClick={() => navigate(`/sales/delivery-challan?salesOrderId=${order._id}`)}
                                className="px-6 py-3 bg-amber-500 text-white rounded-sm text-[10px] font-black uppercase tracking-widest hover:bg-amber-600 transition-all shadow-lg shadow-amber-500/20"
                            >
                                <Truck className="w-4 h-4 inline-block mr-2" /> Dispatch Fulfillment
                            </button>
                        )}
                        {canCancel && (
                            <button 
                                onClick={handleCancelOrder}
                                disabled={actionLoading}
                                className="px-6 py-3 bg-white dark:bg-neutral-900 border border-danger/30 text-danger rounded-sm text-[10px] font-black uppercase tracking-widest hover:bg-rose-500 hover:text-white transition-all shadow-sm"
                            >
                                <XCircle className="w-4 h-4 inline-block mr-2" /> Abort Protocol
                            </button>
                        )}
                    </div>
                </header>

                {/* Progress Timeline */}
                <div className="bg-white dark:bg-neutral-900 rounded-[40px] border border-neutral-200 dark:border-neutral-800 p-8 shadow-sm">
                    <div className="flex items-center justify-between gap-4 max-w-4xl mx-auto">
                        {lifecycleStages.map((stage, index) => (
                            <div key={stage.name} className="flex-1 flex items-center gap-4 last:flex-none">
                                <div className="flex flex-col items-center gap-2 relative">
                                    <div className={`w-12 h-12 rounded-sm flex items-center justify-center transition-all ${stage.completed ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' : stage.current ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/20 animate-pulse' : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-400'}`}>
                                        {stage.completed ? <CheckCircle className="w-6 h-6" /> : <span className="font-black">{index + 1}</span>}
                                    </div>
                                    <span className={`text-[9px] font-black uppercase tracking-widest absolute -bottom-6 whitespace-nowrap ${stage.current ? 'text-warning' : 'text-neutral-400'}`}>
                                        {stage.name}
                                    </span>
                                </div>
                                {index < 3 && (
                                    <div className={`h-1 flex-1 rounded-full ${stage.completed ? 'bg-emerald-500' : 'bg-neutral-100 dark:bg-neutral-800'}`} />
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                    {/* Main Content Area */}
                    <div className="lg:col-span-2 space-y-8">
                        {/* Information Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            {/* Order Info */}
                            <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-[40px] overflow-hidden shadow-sm">
                                <div className="p-8 border-b border-neutral-100 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-950/50">
                                    <h3 className="text-[10px] font-black text-neutral-400 uppercase tracking-[0.3em] flex items-center gap-2">
                                        <Briefcase className="w-4 h-4 text-warning" /> Protocol Meta
                                    </h3>
                                </div>
                                <div className="p-8 grid grid-cols-2 gap-6">
                                    {[
                                        { label: 'Registry ID', value: order.orderNumber, icon: FileText },
                                        { label: 'Log Date', value: new Date(order.orderDate).toLocaleDateString(), icon: Calendar },
                                        { label: 'SLA Breach', value: new Date(order.expectedDeliveryDate).toLocaleDateString(), icon: Truck, urgent: order.isOverdue },
                                        { label: 'Node Admin', value: order.createdBy?.name || 'Automated System', icon: User },
                                    ].map((item, i) => (
                                        <div key={i} className="space-y-1">
                                            <p className="text-[9px] font-black text-neutral-400 uppercase tracking-widest">{item.label}</p>
                                            <p className={`text-xs font-black uppercase tracking-tight ${item.urgent ? 'text-danger' : 'text-neutral-900 dark:text-white'}`}>{item.value}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Entity Mapping */}
                            <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-[40px] overflow-hidden shadow-sm">
                                <div className="p-8 border-b border-neutral-100 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-950/50">
                                    <h3 className="text-[10px] font-black text-neutral-400 uppercase tracking-[0.3em] flex items-center gap-2">
                                        <User className="w-4 h-4 text-warning" /> Entity Mapping
                                    </h3>
                                </div>
                                <div className="p-8 flex items-center gap-6">
                                    <div className="w-16 h-16 rounded-sm bg-amber-500 flex items-center justify-center text-white text-2xl font-black shadow-lg shadow-amber-500/20">
                                        {order.customer?.name?.charAt(0).toUpperCase() || '?'}
                                    </div>
                                    <div>
                                        <p className="text-lg font-black text-neutral-900 dark:text-white uppercase tracking-tight">{order.customer?.name}</p>
                                        <div className="space-y-1 mt-2">
                                            <p className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest flex items-center gap-2"><Phone className="w-3 h-3" /> {order.customer?.phone}</p>
                                            <p className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest flex items-center gap-2"><Mail className="w-3 h-3" /> {order.customer?.email}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Item Matrix */}
                        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-[40px] overflow-hidden shadow-sm">
                            <div className="p-8 border-b border-neutral-100 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-950/50 flex items-center justify-between">
                                <h3 className="text-[10px] font-black text-neutral-400 uppercase tracking-[0.3em]">Manifest Registry</h3>
                                <span className="px-3 py-1 bg-neutral-100 dark:bg-neutral-800 text-neutral-500 rounded-lg text-[9px] font-black uppercase tracking-widest">{order.items.length} Nodes</span>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-neutral-50/50 dark:bg-neutral-950/50">
                                            <th className="px-8 py-4 text-[9px] font-black text-neutral-400 uppercase tracking-[0.2em] border-b border-neutral-200 dark:border-neutral-800 w-16 text-center">Node</th>
                                            <th className="px-8 py-4 text-[9px] font-black text-neutral-400 uppercase tracking-[0.2em] border-b border-neutral-200 dark:border-neutral-800">Product Specification</th>
                                            <th className="px-8 py-4 text-[9px] font-black text-neutral-400 uppercase tracking-[0.2em] border-b border-neutral-200 dark:border-neutral-800 text-right">Qty</th>
                                            <th className="px-8 py-4 text-[9px] font-black text-neutral-400 uppercase tracking-[0.2em] border-b border-neutral-200 dark:border-neutral-800 text-right">Fulfillment</th>
                                            <th className="px-8 py-4 text-[9px] font-black text-neutral-400 uppercase tracking-[0.2em] border-b border-neutral-200 dark:border-neutral-800 text-right">Net Valuation</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                                        {order.items.map((item, index) => {
                                            const progress = item.quantity > 0 ? ((item.deliveredQty || 0) / item.quantity) * 100 : 0;
                                            return (
                                                <tr key={index} className="group hover:bg-amber-500/[0.01] transition-colors">
                                                    <td className="px-8 py-6 text-center text-[10px] font-black text-neutral-400">{(index + 1).toString().padStart(2, '0')}</td>
                                                    <td className="px-8 py-6">
                                                        <div className="flex flex-col">
                                                            <span className="text-sm font-black text-neutral-900 dark:text-white uppercase tracking-tight">{item.item?.name || item.name}</span>
                                                            <span className="text-[9px] font-bold text-neutral-400 uppercase tracking-widest mt-1">Rate: ₹{item.rate} // Tax: {item.tax}%</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-8 py-6 text-right">
                                                        <span className="text-sm font-mono font-black text-neutral-900 dark:text-white">{item.quantity}</span>
                                                    </td>
                                                    <td className="px-8 py-6 text-right w-40">
                                                        <div className="flex flex-col items-end gap-1.5">
                                                            <div className="w-full h-1.5 bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden shadow-inner">
                                                                <div 
                                                                    className={`h-full transition-all duration-1000 ${progress === 100 ? 'bg-emerald-500' : 'bg-amber-500'}`} 
                                                                    style={{ width: `${progress}%` }} 
                                                                />
                                                            </div>
                                                            <span className="text-[9px] font-black text-neutral-500 uppercase tracking-widest">{item.deliveredQty || 0} / {item.quantity} DISPATCHED</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-8 py-6 text-right">
                                                        <div className="text-sm font-mono font-black text-neutral-900 dark:text-white flex items-center justify-end gap-1">
                                                            <IndianRupee className="w-3 h-3 text-warning" />
                                                            {item.total?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Directives */}
                        {order.notes && (
                            <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-[32px] p-8 shadow-sm">
                                <h3 className="text-[10px] font-black text-neutral-400 uppercase tracking-[0.3em] mb-4 flex items-center gap-2">
                                    <Info className="w-4 h-4 text-warning" /> Operational Directives
                                </h3>
                                <p className="text-sm font-bold text-neutral-600 dark:text-neutral-400 leading-relaxed bg-neutral-50/50 dark:bg-neutral-950/50 p-6 rounded-sm border border-neutral-100 dark:border-neutral-800 shadow-inner">
                                    {order.notes}
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Sidebar: Financials & History */}
                    <div className="space-y-8 sticky top-8">
                        {/* Financial Ledger */}
                        <div className="bg-neutral-900 dark:bg-white rounded-[40px] p-8 text-white dark:text-neutral-900 shadow-2xl relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-warning/10 rounded-bl-[100px]" />
                            <h3 className="text-[10px] font-black opacity-50 uppercase tracking-[0.3em] mb-8">Valuation Ledger</h3>
                            <div className="space-y-4 relative z-10">
                                {[
                                    { label: 'Sub-Valuation', value: order.subtotal, color: 'text-white dark:text-neutral-900' },
                                    { label: 'Tax Vector', value: order.taxTotal, color: 'text-success dark:text-emerald-600' },
                                    { label: 'Protocol Discount', value: -order.discountTotal, color: 'text-danger dark:text-rose-600' },
                                ].map((item, i) => (
                                    <div key={i} className="flex justify-between items-center text-xs font-bold uppercase tracking-widest opacity-80">
                                        <span>{item.label}</span>
                                        <span className={`font-mono ${item.color}`}>₹{item.value?.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                                    </div>
                                ))}
                                <div className="pt-6 border-t border-white/10 dark:border-neutral-200 mt-2">
                                    <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-40 mb-2">Net Final Valuation</p>
                                    <div className="text-4xl font-display font-black tracking-tighter flex items-center gap-2">
                                        <IndianRupee className="w-8 h-8 text-warning" />
                                        {order.totalAmount?.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Linked Matrix Nodes */}
                        {((order.deliveryChallans && order.deliveryChallans.length > 0) || (order.invoices && order.invoices.length > 0)) && (
                            <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-[40px] overflow-hidden shadow-sm">
                                <div className="p-8 border-b border-neutral-100 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-950/50">
                                    <h3 className="text-[10px] font-black text-neutral-400 uppercase tracking-[0.3em]">Linked Manifests</h3>
                                </div>
                                <div className="p-8 space-y-6">
                                    {order.deliveryChallans && order.deliveryChallans.length > 0 && (
                                        <div className="space-y-3">
                                            <p className="text-[9px] font-black text-neutral-400 uppercase tracking-widest">Dispatch Nodes</p>
                                            {order.deliveryChallans.map((dc: any, index: number) => (
                                                <div key={index} className="flex items-center justify-between p-4 bg-neutral-50 dark:bg-neutral-950 rounded-sm border border-neutral-100 dark:border-neutral-800 group cursor-pointer hover:border-warning/30 transition-all">
                                                    <div className="flex items-center gap-3">
                                                        <Truck className="w-4 h-4 text-warning" />
                                                        <span className="text-xs font-black uppercase tracking-tight group-hover:text-warning">{dc.challanNumber || `DC-0${index+1}`}</span>
                                                    </div>
                                                    <ChevronRight className="w-4 h-4 text-neutral-300 group-hover:translate-x-1 transition-transform" />
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                    {order.invoices && order.invoices.length > 0 && (
                                        <div className="space-y-3">
                                            <p className="text-[9px] font-black text-neutral-400 uppercase tracking-widest">Fiscal Nodes</p>
                                            {order.invoices.map((inv: any, index: number) => (
                                                <div key={index} className="flex items-center justify-between p-4 bg-neutral-50 dark:bg-neutral-950 rounded-sm border border-neutral-100 dark:border-neutral-800 group cursor-pointer hover:border-success/30 transition-all">
                                                    <div className="flex items-center gap-3">
                                                        <FileText className="w-4 h-4 text-success" />
                                                        <span className="text-xs font-black uppercase tracking-tight group-hover:text-success">{inv.invoiceNo || `INV-0${index+1}`}</span>
                                                    </div>
                                                    <ChevronRight className="w-4 h-4 text-neutral-300 group-hover:translate-x-1 transition-transform" />
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
};

export default SalesOrderDetail;

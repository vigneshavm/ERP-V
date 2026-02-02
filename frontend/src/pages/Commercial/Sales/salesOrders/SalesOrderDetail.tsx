import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from "../../../../services/api";
import { toast } from 'react-toastify';
import Layout from "../../../../components/shared/Layout/Layout";
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
    LucideIcon
} from 'lucide-react';
import { SalesOrder, SalesOrderItem } from '../../../../types/sales';

interface StatusConfig {
    color: string;
    icon: LucideIcon;
    text: string;
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
            console.error('Error fetching order details:', error);
            toast.error('Failed to fetch order details');
            navigate('/sales/sales-order-list');
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
            toast.success('Sales Order cancelled successfully');
            fetchOrderDetails();
        } catch (error: any) {
            console.error('Error cancelling order:', error);
            toast.error(error.response?.data?.message || 'Failed to cancel order');
        } finally {
            setActionLoading(false);
        }
    };

    const getStatusConfig = (status: string | undefined): StatusConfig => {
        const configs: Record<string, StatusConfig> = {
            'Draft': { color: 'from-slate-500 to-slate-600', icon: ClipboardList, text: 'Draft Order' },
            'Confirmed': { color: 'from-blue-500 to-blue-600', icon: BadgeCheck, text: 'Order Confirmed' },
            'Partially Delivered': { color: 'from-purple-500 to-purple-600', icon: Truck, text: 'Partially Delivered' },
            'Delivered': { color: 'from-indigo-500 to-indigo-600', icon: Package, text: 'Fully Delivered' },
            'Partially Invoiced': { color: 'from-amber-500 to-amber-600', icon: Receipt, text: 'Partially Invoiced' },
            'Invoiced': { color: 'from-emerald-500 to-emerald-600', icon: CheckCircle, text: 'Invoiced & Complete' },
            'Cancelled': { color: 'from-red-500 to-red-600', icon: XCircle, text: 'Order Cancelled' }
        };
        return (status && configs[status]) || configs['Draft'];
    };

    const getLifecycleStages = () => {
        const stages = ['Draft', 'Confirmed', 'Delivered', 'Invoiced'];
        const currentStatus = order?.status?.replace('Partially ', '') || 'Draft';
        const currentIndex = stages.indexOf(currentStatus);

        return stages.map((stage, index) => ({
            name: stage,
            completed: index < currentIndex,
            current: index === currentIndex,
            upcoming: index > currentIndex
        }));
    };

    if (loading) {
        return (
            <Layout>
                <div className="flex flex-col items-center justify-center py-20">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600 mb-4"></div>
                    <p className="text-slate-500 font-medium">Loading order details...</p>
                </div>
            </Layout>
        );
    }

    if (!order) {
        return (
            <Layout>
                <div className="flex flex-col items-center justify-center py-20">
                    <AlertTriangle className="w-12 h-12 text-amber-500 mb-4" />
                    <p className="text-slate-700 font-bold text-lg">Order not found</p>
                    <button onClick={() => navigate('/sales/sales-order-list')} className="mt-4 text-indigo-600 font-medium hover:underline">
                        Back to Orders
                    </button>
                </div>
            </Layout>
        );
    }

    const statusConfig = getStatusConfig(order.status);
    const StatusIcon = statusConfig.icon;
    const hasItemsToDeliver = order.items.some((item) => ((item.reservedQty || 0) - (item.deliveredQty || 0)) > 0);
    const canConvertToDC = hasItemsToDeliver && (order.status === 'Confirmed' || order.status === 'Partially Delivered');
    const canCancel = order.status !== 'Cancelled' && order.status !== 'Invoiced';

    return (
        <Layout>
            <div className="space-y-6 animate-fade-in pb-10">
                {/* Immersive Status Banner */}
                <div className={`bg-gradient-to-r ${statusConfig.color} rounded-[2rem] p-8 text-white shadow-xl relative overflow-hidden`}>
                    <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
                        <StatusIcon className="w-48 h-48" />
                    </div>
                    <div className="relative z-10">
                        <button
                            onClick={() => navigate('/sales/sales-order-list')}
                            className="flex items-center gap-2 text-white/80 hover:text-white text-sm font-medium mb-6 transition-colors"
                        >
                            <ArrowLeft className="w-4 h-4" /> Back to Orders
                        </button>
                        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                            <div>
                                <div className="flex items-center gap-3 mb-2">
                                    <StatusIcon className="w-6 h-6" />
                                    <span className="text-white/80 text-sm font-bold uppercase tracking-widest">{statusConfig.text}</span>
                                </div>
                                <h1 className="text-4xl font-black tracking-tight mb-2">{order.orderNumber}</h1>
                                <p className="text-white/80 font-medium">
                                    {order.customer?.name} • Created {new Date(order.orderDate).toLocaleDateString()}
                                </p>
                                {order.isOverdue && (
                                    <div className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 bg-white/20 rounded-xl text-sm font-bold">
                                        <Clock className="w-4 h-4" /> Delivery Overdue
                                    </div>
                                )}
                            </div>
                            <div className="flex flex-wrap gap-3">
                                <button
                                    onClick={() => window.print()}
                                    className="px-4 py-2.5 bg-white/10 backdrop-blur-md border border-white/20 text-white rounded-xl text-sm font-bold hover:bg-white/20 transition-all flex items-center gap-2"
                                >
                                    <Printer className="w-4 h-4" /> Print
                                </button>
                                {canConvertToDC && (
                                    <button
                                        onClick={() => navigate(`/sales/delivery-challan?salesOrderId=${order._id}`)}
                                        className="px-4 py-2.5 bg-white text-purple-700 rounded-xl text-sm font-bold shadow-lg hover:bg-purple-50 transition-all flex items-center gap-2"
                                    >
                                        <Truck className="w-4 h-4" /> Create Delivery Challan
                                    </button>
                                )}
                                {canCancel && (
                                    <button
                                        onClick={handleCancelOrder}
                                        disabled={actionLoading}
                                        className="px-4 py-2.5 bg-red-500/20 border border-red-300/30 text-white rounded-xl text-sm font-bold hover:bg-red-500/30 transition-all flex items-center gap-2 disabled:opacity-50"
                                    >
                                        <XCircle className="w-4 h-4" /> Cancel Order
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Order Lifecycle Timeline */}
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6">
                    <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4">Order Lifecycle</h3>
                    <div className="flex items-center justify-between">
                        {getLifecycleStages().map((stage, index) => (
                            <div key={stage.name} className="flex items-center flex-1">
                                <div className="flex flex-col items-center">
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all ${stage.completed ? 'bg-emerald-500 text-white' :
                                        stage.current ? 'bg-indigo-600 text-white ring-4 ring-indigo-100' :
                                            'bg-slate-100 text-slate-400'
                                        }`}>
                                        {stage.completed ? <CheckCircle className="w-5 h-5" /> : index + 1}
                                    </div>
                                    <p className={`mt-2 text-xs font-bold ${stage.current ? 'text-indigo-600' : 'text-slate-500'}`}>
                                        {stage.name}
                                    </p>
                                </div>
                                {index < 3 && (
                                    <div className={`flex-1 h-1 mx-2 rounded-full ${stage.completed ? 'bg-emerald-500' : 'bg-slate-200'}`} />
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 space-y-6">
                        {/* Order Info */}
                        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                            <div className="bg-slate-50 px-6 py-3 border-b border-slate-100">
                                <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Order Information</h2>
                            </div>
                            <div className="p-6 grid grid-cols-2 md:grid-cols-4 gap-6">
                                <div>
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Order Number</p>
                                    <p className="text-sm font-bold text-slate-800">{order.orderNumber}</p>
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Order Date</p>
                                    <p className="text-sm font-medium text-slate-800">{new Date(order.orderDate).toLocaleDateString()}</p>
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Expected Delivery</p>
                                    <p className="text-sm font-medium text-slate-800">
                                        {new Date(order.expectedDeliveryDate).toLocaleDateString()}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Created By</p>
                                    <p className="text-sm font-medium text-slate-800">{order.createdBy?.name || 'N/A'}</p>
                                </div>
                            </div>
                        </div>

                        {/* Customer Info */}
                        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                            <div className="bg-slate-50 px-6 py-3 border-b border-slate-100">
                                <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Customer Details</h2>
                            </div>
                            <div className="p-6 flex items-start gap-4">
                                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white text-xl font-black shadow-lg">
                                    {order.customer?.name?.charAt(0).toUpperCase() || '?'}
                                </div>
                                <div className="flex-1">
                                    <p className="text-lg font-bold text-slate-800">{order.customer?.name}</p>
                                    <div className="flex flex-wrap gap-4 mt-2 text-sm text-slate-600">
                                        {order.customer?.phone && (
                                            <span className="flex items-center gap-1.5">
                                                <Phone className="w-4 h-4 text-slate-400" /> {order.customer.phone}
                                            </span>
                                        )}
                                        {order.customer?.email && (
                                            <span className="flex items-center gap-1.5">
                                                <Mail className="w-4 h-4 text-slate-400" /> {order.customer.email}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Items Table */}
                        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                            <div className="bg-slate-50 px-6 py-3 border-b border-slate-100">
                                <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Order Items</h2>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead className="bg-slate-50 border-b border-slate-200">
                                        <tr className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                                            <th className="px-4 py-3 text-center w-12">#</th>
                                            <th className="px-4 py-3">Product</th>
                                            <th className="px-4 py-3 text-right">Qty</th>
                                            <th className="px-4 py-3 text-right">Rate</th>
                                            <th className="px-4 py-3 text-right">Tax</th>
                                            <th className="px-4 py-3 text-center">Fulfillment</th>
                                            <th className="px-4 py-3 text-right">Total</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {order.items.map((item: SalesOrderItem, index: number) => {
                                            const deliveryProgress = item.quantity > 0 ? ((item.deliveredQty || 0) / item.quantity) * 100 : 0;
                                            return (
                                                <tr key={index} className="hover:bg-slate-50/80 transition-colors">
                                                    <td className="px-4 py-3 text-center text-xs text-slate-400 font-bold">{index + 1}</td>
                                                    <td className="px-4 py-3">
                                                        <p className="font-semibold text-slate-800">{item.item?.name || item.name}</p>
                                                    </td>
                                                    <td className="px-4 py-3 text-right font-medium">{item.quantity}</td>
                                                    <td className="px-4 py-3 text-right font-medium">₹{item.rate}</td>
                                                    <td className="px-4 py-3 text-right text-slate-600">{item.tax}%</td>
                                                    <td className="px-4 py-3">
                                                        <div className="flex flex-col items-center gap-1">
                                                            <div className="w-24 h-2 bg-slate-100 rounded-full overflow-hidden">
                                                                <div
                                                                    className="h-full bg-emerald-500 rounded-full transition-all"
                                                                    style={{ width: `${deliveryProgress}%` }}
                                                                />
                                                            </div>
                                                            <span className="text-[10px] font-bold text-slate-500">
                                                                {item.deliveredQty || 0}/{item.quantity} delivered
                                                            </span>
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-3 text-right font-bold text-slate-800">₹{item.total?.toFixed(2) || '0.00'}</td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Notes */}
                        {order.notes && (
                            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                                <div className="bg-slate-50 px-6 py-3 border-b border-slate-100">
                                    <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Notes</h2>
                                </div>
                                <div className="p-6">
                                    <p className="text-sm text-slate-600">{order.notes}</p>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Sidebar */}
                    <div className="lg:col-span-1 space-y-6">
                        {/* Order Summary */}
                        <div className="bg-white border border-indigo-100 rounded-2xl shadow-sm overflow-hidden sticky top-4">
                            <div className="bg-indigo-50/50 px-6 py-3 border-b border-indigo-100">
                                <h2 className="text-xs font-bold text-indigo-800 uppercase tracking-wider">Order Summary</h2>
                            </div>
                            <div className="p-6 space-y-4">
                                <div className="flex justify-between text-sm">
                                    <span className="text-slate-500 font-medium">Subtotal</span>
                                    <span className="font-bold text-slate-800">₹{order.subtotal?.toFixed(2) || '0.00'}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-slate-500 font-medium">Tax</span>
                                    <span className="font-bold text-slate-800">₹{order.taxTotal?.toFixed(2) || '0.00'}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-slate-500 font-medium">Discount</span>
                                    <span className="font-bold text-rose-600">-₹{order.discountTotal?.toFixed(2) || '0.00'}</span>
                                </div>
                            </div>
                            <div className="bg-slate-800 px-6 py-5 flex justify-between items-center text-white">
                                <span className="text-lg font-bold tracking-tight">Net Total</span>
                                <span className="text-2xl font-bold tracking-tight">₹{order.totalAmount?.toFixed(2) || '0.00'}</span>
                            </div>
                        </div>

                        {/* Conversion History */}
                        {((order.deliveryChallans && order.deliveryChallans.length > 0) || (order.invoices && order.invoices.length > 0)) && (
                            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                                <div className="bg-slate-50 px-6 py-3 border-b border-slate-100">
                                    <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Linked Documents</h2>
                                </div>
                                <div className="p-6 space-y-4">
                                    {order.deliveryChallans && order.deliveryChallans.length > 0 && (
                                        <div>
                                            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Delivery Challans</p>
                                            <div className="space-y-2">
                                                {order.deliveryChallans.map((dc: any, index: number) => (
                                                    <div key={index} className="flex items-center gap-2 p-2 bg-purple-50 rounded-lg">
                                                        <Truck className="w-4 h-4 text-purple-600" />
                                                        <span className="text-sm font-medium text-purple-800">{dc.challanNumber || `DC #${index + 1}`}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                    {order.invoices && order.invoices.length > 0 && (
                                        <div>
                                            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Invoices</p>
                                            <div className="space-y-2">
                                                {order.invoices.map((inv: any, index: number) => (
                                                    <div key={index} className="flex items-center gap-2 p-2 bg-emerald-50 rounded-lg">
                                                        <FileText className="w-4 h-4 text-emerald-600" />
                                                        <span className="text-sm font-medium text-emerald-800">{inv.invoiceNo || `Invoice #${index + 1}`}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </Layout>
    );
};

export default SalesOrderDetail;


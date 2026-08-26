import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import {
    Truck,
    Plus,
    Trash2,
    Save,
    ArrowLeft,
    Clock,
    ShieldCheck,
    Zap,
    Info,
    Layers,
    Globe,
    RefreshCw,
    ShoppingBag,
    Tag,
    IndianRupee,
    Minus,
    Search,
    Calendar,
    Briefcase,
    CheckCircle2,
    Package,
    User,
    ChevronRight,
    MapPin,
    Navigation,
    Anchor,
    Plane,
    Activity
} from 'lucide-react';
import CustomerSelectionModal from "../../../components/shared/Modals/CustomerSelectionModal";
import ItemSelectionModal from "../../../components/shared/Modals/ItemSelectionModal";
import SalesOrderSelectionModal from "../../../components/shared/Modals/SalesOrderSelectionModal";
import { createDeliveryChallan, reset } from "../../../redux/slices/deliveryChallanSlice";
import { RootState } from '../../../redux/store';

interface ChallanItem {
    item: string;
    name: string;
    sku: string;
    quantity: number;
    deliveredQty: number;
    unit: string;
    description: string;
    availableStock: number;
    sellingPrice: number;
}

interface ChallanFormData {
    challanNo: string;
    challanDate: string;
    deliveryDate: string;
    customer: any;
    salesOrder: any;
    items: ChallanItem[];
    vehicleNo: string;
    driverName: string;
    transportMode: string;
    notes: string;
}

const DeliveryChallan = () => {
    const navigate = useNavigate();
    const dispatch = useDispatch<any>();
    const { isLoading, isSuccess, isError, message, challan } = useSelector((state: RootState) => state.deliveryChallan);

    const [showCustomerModal, setShowCustomerModal] = useState(false);
    const [showItemModal, setShowItemModal] = useState(false);
    const [showSalesOrderModal, setShowSalesOrderModal] = useState(false);
    const [formData, setFormData] = useState<ChallanFormData>({
        challanNo: 'DC-' + Date.now(),
        challanDate: new Date().toISOString().split('T')[0],
        deliveryDate: '',
        customer: null,
        salesOrder: null,
        items: [],
        vehicleNo: '',
        driverName: '',
        transportMode: 'road',
        notes: ''
    });

    useEffect(() => {
        if (isError) {
            toast.error(message);
            dispatch(reset());
        }

        if (isSuccess && challan) {
            toast.success('Dispatch Protocol Finalized');
            dispatch(reset());
            navigate(`/sales/delivery-challan/${challan._id}`);
        }
    }, [isError, isSuccess, message, challan, navigate, dispatch]);

    const handleSalesOrderSelect = (order: any) => {
        const orderItems = order.items.map((item: any) => ({
            item: item.item._id || item.item,
            name: item.item.name || 'Unknown Node',
            sku: item.item.sku || '',
            quantity: item.quantity,
            deliveredQty: item.quantity - (item.deliveredQty || 0),
            unit: item.item.unit || 'pcs',
            description: '',
            availableStock: item.item.stock || 0,
            sellingPrice: item.rate
        }));

        setFormData({
            ...formData,
            customer: order.customer,
            salesOrder: order._id,
            items: orderItems,
            deliveryDate: order.expectedDeliveryDate ? new Date(order.expectedDeliveryDate).toISOString().split('T')[0] : ''
        });

        toast.success(`Matrix Loaded from Sales Order ${order.orderNumber}`);
    };

    const handleItemSelect = (item: any) => {
        const newItem = {
            item: item._id,
            name: item.name,
            sku: item.sku,
            quantity: item.quantity || 1,
            deliveredQty: item.quantity || 1,
            unit: item.unit || 'pcs',
            description: '',
            availableStock: item.stockQty - (item.reservedStock || 0),
            sellingPrice: item.sellingPrice || 0
        };

        setFormData({
            ...formData,
            items: [...formData.items, newItem]
        });
        toast.success(`Added ${item.name} to dispatch manifest`);
    };

    const updateItem = (index: number, field: keyof ChallanItem, value: any) => {
        const newItems = [...formData.items];
        (newItems[index] as any)[field] = value;

        if (field === 'deliveredQty') {
            const maxQty = newItems[index].availableStock;
            if (value > maxQty) {
                toast.warning(`SLA Alert: Delivery exceeds available stock (${maxQty})`);
                (newItems[index] as any)[field] = maxQty;
            }
        }

        setFormData({ ...formData, items: newItems });
    };

    const removeItem = (index: number) => {
        const item = formData.items[index];
        const newItems = formData.items.filter((_, i) => i !== index);
        setFormData({ ...formData, items: newItems });
        toast.warn(`Removed ${item.name} from dispatch manifest`);
    };

    const handleSave = () => {
        if (!formData.customer) {
            toast.error('Entity mapping required');
            return;
        }

        if (formData.items.length === 0) {
            toast.error('Dispatch manifest cannot be empty');
            return;
        }

        const invalidItems = formData.items.filter(item => !item.deliveredQty || item.deliveredQty <= 0);
        if (invalidItems.length > 0) {
            toast.error('All dispatch nodes must have positive quantity');
            return;
        }

        const challanData = {
            customerId: formData.customer._id,
            challanDate: formData.challanDate,
            deliveryDate: formData.deliveryDate || undefined,
            salesOrderId: formData.salesOrder || undefined,
            items: formData.items.map(item => ({
                item: item.item,
                quantity: item.quantity,
                deliveredQty: item.deliveredQty,
                unit: item.unit,
                description: item.description
            })),
            vehicleNo: formData.vehicleNo,
            driverName: formData.driverName,
            transportMode: formData.transportMode,
            notes: formData.notes
        };

        dispatch(createDeliveryChallan(challanData) as any);
    };

    const metrics = useMemo(() => {
        const totalItems = formData.items.length;
        const totalQty = formData.items.reduce((sum, item) => sum + (item.deliveredQty || 0), 0);
        return { totalItems, totalQty };
    }, [formData.items]);

    return (
        <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 text-neutral-900 dark:text-white font-sans selection:bg-amber-500/30 overflow-hidden flex flex-col transition-colors animate-fade-in relative">
            {/* Ambient Background */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
                <div className="absolute top-[-20%] left-[10%] w-[60%] h-[60%] bg-amber-600/10 rounded-full blur-[150px]" />
                <div className="absolute bottom-[-10%] right-[10%] w-[40%] h-[40%] bg-rose-600/10 rounded-full blur-[150px]" />
            </div>

            {/* Top Command Bar */}
            <header className="relative z-20 bg-white/80 dark:bg-neutral-900/80 backdrop-blur-md border-b border-neutral-200 dark:border-neutral-800 px-8 py-4 flex items-center justify-between shadow-sm transition-all">
                <div className="flex items-center gap-6">
                    <button 
                        onClick={() => navigate('/sales/challans')}
                        className="p-3 bg-neutral-100 dark:bg-neutral-800 rounded-sm hover:scale-110 transition-transform text-neutral-500 hover:text-warning"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-2xl font-display font-black tracking-tighter text-neutral-900 dark:text-white">
                                Dispatch <span className="text-warning">Protocol</span>
                            </h1>
                            <span className="px-3 py-1 bg-warning/10 border border-warning/20 text-warning rounded-lg text-[10px] font-black uppercase tracking-widest">
                                Logistics v4.0
                            </span>
                        </div>
                        <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest mt-0.5 flex items-center gap-2">
                            <Globe className="w-3 h-3" /> Global Fulfillment Node // Operational Mode: Dispatch
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <button 
                        onClick={() => navigate('/sales/challans')}
                        className="hidden md:flex items-center gap-2 px-6 py-3 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-300 rounded-sm text-[10px] font-black uppercase tracking-widest hover:bg-neutral-50 dark:hover:bg-neutral-700 transition-all shadow-sm"
                    >
                        Cancel
                    </button>
                    <button 
                        onClick={handleSave}
                        disabled={isLoading}
                        className="flex items-center gap-2 px-8 py-3 bg-amber-500 text-white rounded-sm text-[10px] font-black uppercase tracking-widest hover:bg-amber-600 transition-all shadow-lg shadow-amber-500/20 disabled:opacity-50"
                    >
                        {isLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
                        Finalize Protocol
                    </button>
                </div>
            </header>

            <main className="relative z-10 flex-1 flex overflow-hidden">
                {/* Left Panel: Items Matrix */}
                <section className="flex-1 overflow-y-auto custom-scrollbar p-8">
                    <div className="max-w-[1000px] mx-auto space-y-8 pb-20">
                        {/* Summary Dashboard */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {[
                                { label: 'Dispatch Nodes', value: `${metrics.totalItems} Units`, icon: Layers, color: 'text-warning' },
                                { label: 'Gross Quantity', value: metrics.totalQty, icon: Activity, color: 'text-blue-500' },
                                { label: 'Risk Protocol', value: 'Nominal', icon: ShieldCheck, color: 'text-success' }
                            ].map((stat, i) => (
                                <div key={i} className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-sm p-6 shadow-sm flex items-center gap-4">
                                    <div className={`p-3 rounded-sm ${stat.color.replace('text', 'bg')}/10 ${stat.color}`}>
                                        <stat.icon className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest">{stat.label}</p>
                                        <p className="text-lg font-black text-neutral-900 dark:text-white uppercase tracking-tight">{stat.value}</p>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Items Data Matrix */}
                        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-[40px] shadow-sm overflow-hidden flex flex-col transition-all">
                            <div className="p-8 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between bg-neutral-50/50 dark:bg-neutral-950/50">
                                <h3 className="text-[10px] font-black text-neutral-400 uppercase tracking-[0.3em]">Dispatch Manifest</h3>
                                <div className="flex items-center gap-3">
                                    {formData.salesOrder && (
                                        <span className="px-3 py-1 bg-warning/10 border border-warning/20 text-warning rounded-lg text-[9px] font-black uppercase tracking-widest flex items-center gap-2">
                                            <Briefcase className="w-3 h-3" /> Linked to SO
                                        </span>
                                    )}
                                    <button 
                                        onClick={() => setShowItemModal(true)}
                                        className="p-3 bg-amber-500 text-white rounded-sm hover:scale-110 transition-transform shadow-lg shadow-amber-500/20"
                                    >
                                        <Plus className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-neutral-50 dark:bg-neutral-950/50">
                                            <th className="px-8 py-4 text-[9px] font-black text-neutral-400 uppercase tracking-[0.2em] border-b border-neutral-200 dark:border-neutral-800 w-16 text-center">Node</th>
                                            <th className="px-8 py-4 text-[9px] font-black text-neutral-400 uppercase tracking-[0.2em] border-b border-neutral-200 dark:border-neutral-800">Product Specification</th>
                                            <th className="px-8 py-4 text-[9px] font-black text-neutral-400 uppercase tracking-[0.2em] border-b border-neutral-200 dark:border-neutral-800 w-32 text-right">Available</th>
                                            <th className="px-8 py-4 text-[9px] font-black text-neutral-400 uppercase tracking-[0.2em] border-b border-neutral-200 dark:border-neutral-800 w-40 text-right">Dispatch Qty</th>
                                            <th className="px-8 py-4 text-[9px] font-black text-neutral-400 uppercase tracking-[0.2em] border-b border-neutral-200 dark:border-neutral-800 w-24 text-center">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                                        {formData.items.length === 0 ? (
                                            <tr>
                                                <td colSpan={5} className="px-8 py-20 text-center">
                                                    <div className="flex flex-col items-center gap-4 opacity-20 grayscale">
                                                        <Truck className="w-16 h-16 text-warning" />
                                                        <p className="text-xs font-black uppercase tracking-widest text-neutral-400">Manifest Empty // Sync Entity or Items</p>
                                                    </div>
                                                </td>
                                            </tr>
                                        ) : (
                                            formData.items.map((item, index) => (
                                                <tr key={index} className="group hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors">
                                                    <td className="px-8 py-6 text-center text-[10px] font-black text-neutral-400">
                                                        {index + 1}
                                                    </td>
                                                    <td className="px-8 py-6">
                                                        <div className="flex flex-col">
                                                            <span className="text-sm font-black text-neutral-900 dark:text-white uppercase tracking-tight">{item.name}</span>
                                                            <span className="text-[9px] font-bold text-neutral-400 uppercase tracking-widest mt-1 flex items-center gap-1">
                                                                SKU: {item.sku || 'N/A'} // UNIT: {item.unit}
                                                            </span>
                                                        </div>
                                                    </td>
                                                    <td className="px-8 py-6 text-right">
                                                        <span className={`text-[10px] font-black uppercase tracking-widest ${item.availableStock > 0 ? 'text-success' : 'text-danger'}`}>
                                                            {item.availableStock} Units
                                                        </span>
                                                    </td>
                                                    <td className="px-8 py-6 text-right">
                                                        <div className="inline-flex items-center bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl overflow-hidden p-1 shadow-inner">
                                                            <button 
                                                                onClick={() => updateItem(index, 'deliveredQty', Math.max(1, item.deliveredQty - 1))}
                                                                className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg text-neutral-400 transition-colors"
                                                            >
                                                                <Minus className="w-3 h-3" />
                                                            </button>
                                                            <input
                                                                type="number"
                                                                value={item.deliveredQty}
                                                                onChange={(e) => updateItem(index, 'deliveredQty', parseFloat(e.target.value) || 0)}
                                                                className="w-16 text-center bg-transparent text-xs font-black outline-none dark:text-white"
                                                            />
                                                            <button 
                                                                onClick={() => updateItem(index, 'deliveredQty', item.deliveredQty + 1)}
                                                                className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg text-neutral-400 transition-colors"
                                                            >
                                                                <Plus className="w-3 h-3" />
                                                            </button>
                                                        </div>
                                                    </td>
                                                    <td className="px-8 py-6 text-center">
                                                        <button 
                                                            onClick={() => removeItem(index)}
                                                            className="p-3 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-danger rounded-xl hover:bg-rose-500 hover:text-white transition-all shadow-sm"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Logistics Directives */}
                        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-[32px] p-8 shadow-sm">
                            <h3 className="text-[10px] font-black text-neutral-400 uppercase tracking-[0.3em] mb-6 flex items-center gap-2">
                                <Info className="w-4 h-4 text-warning" /> Operational Directives
                            </h3>
                            <textarea 
                                value={formData.notes}
                                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                className="w-full bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-sm p-6 text-xs font-bold outline-none focus:border-warning/30 transition-all dark:text-white placeholder:text-neutral-500 min-h-[120px] shadow-inner"
                                placeholder="Enter specific logistical protocols, handling terms, or delivery notes..."
                            />
                        </div>
                    </div>
                </section>

                {/* Right Panel: Logistics parameters */}
                <aside className="w-[400px] bg-white/50 dark:bg-neutral-900/50 backdrop-blur-xl border-l border-neutral-200 dark:border-neutral-800 p-8 flex flex-col gap-8 overflow-y-auto custom-scrollbar relative z-20 shadow-2xl">
                    <div className="space-y-8">
                        {/* Customer Entity Mapping */}
                        <div>
                            <h3 className="text-[10px] font-black text-neutral-400 uppercase tracking-[0.3em] mb-4">Entity Mapping</h3>
                            {formData.customer ? (
                                <div className="bg-white dark:bg-neutral-900 border-2 border-warning/20 rounded-sm p-6 shadow-xl shadow-amber-500/5 relative overflow-hidden group transition-all hover:scale-[1.02]">
                                    <div className="absolute top-0 right-0 w-16 h-16 bg-amber-500/5 rounded-bl-[40px]" />
                                    <div className="flex items-start gap-4 mb-4 relative z-10">
                                        <div className="w-12 h-12 rounded-sm bg-amber-500 flex items-center justify-center text-white shadow-lg shadow-amber-500/20">
                                            <User className="w-6 h-6" />
                                        </div>
                                        <div className="flex-1 overflow-hidden">
                                            <p className="text-sm font-black text-neutral-900 dark:text-white uppercase tracking-tight truncate">{formData.customer.name}</p>
                                            <p className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest mt-0.5 truncate">{formData.customer.address?.line1}, {formData.customer.address?.city}</p>
                                        </div>
                                        <button 
                                            onClick={() => setFormData({ ...formData, customer: null, salesOrder: null, items: [] })}
                                            className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-xl text-neutral-400 hover:text-danger transition-colors"
                                        >
                                            <RefreshCw className="w-4 h-4" />
                                        </button>
                                    </div>
                                    <div className="space-y-2 pt-4 border-t border-neutral-100 dark:border-neutral-800">
                                        <div className="flex items-center gap-2 text-[10px] font-bold text-neutral-500 uppercase tracking-widest">
                                            <MapPin className="w-3 h-3 text-warning" /> SLA: Local Node Dispatch
                                        </div>
                                        <div className="flex items-center gap-2 text-[10px] font-bold text-neutral-500 uppercase tracking-widest">
                                            <Tag className="w-3 h-3 text-warning" /> Ph: {formData.customer.phone}
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    <button 
                                        onClick={() => setShowCustomerModal(true)}
                                        className="w-full bg-white dark:bg-neutral-900 border border-dashed border-neutral-300 dark:border-neutral-700 rounded-sm p-6 flex flex-col items-center gap-3 hover:border-amber-500/50 transition-all group shadow-sm"
                                    >
                                        <Search className="w-6 h-6 text-neutral-300 group-hover:text-warning transition-colors" />
                                        <p className="text-[10px] font-black text-neutral-400 uppercase tracking-[0.2em] group-hover:text-warning transition-colors">Map Customer Entity</p>
                                    </button>
                                    <div className="flex items-center gap-2 px-4 py-2 opacity-30">
                                        <div className="h-px flex-1 bg-neutral-300 dark:bg-neutral-700" />
                                        <span className="text-[9px] font-black uppercase tracking-widest">OR</span>
                                        <div className="h-px flex-1 bg-neutral-300 dark:bg-neutral-700" />
                                    </div>
                                    <button 
                                        onClick={() => setShowSalesOrderModal(true)}
                                        className="w-full bg-warning/10 border border-warning/20 text-warning rounded-sm p-6 flex flex-col items-center gap-3 hover:bg-warning/20 transition-all group shadow-sm"
                                    >
                                        <Briefcase className="w-6 h-6" />
                                        <p className="text-[10px] font-black uppercase tracking-[0.2em]">Select from Sales Order</p>
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Transport Parameters */}
                        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-[32px] p-6 space-y-6 shadow-sm">
                            <h3 className="text-[10px] font-black text-neutral-400 uppercase tracking-[0.3em] mb-4">Logistics Matrix</h3>
                            <div className="space-y-4">
                                <div>
                                    <label className="text-[9px] font-black text-neutral-400 uppercase tracking-widest block mb-2">Transport Vector</label>
                                    <div className="grid grid-cols-5 gap-2">
                                        {[
                                            { id: 'road', icon: Truck },
                                            { id: 'rail', icon: Navigation },
                                            { id: 'air', icon: Plane },
                                            { id: 'ship', icon: Anchor },
                                            { id: 'courier', icon: Globe }
                                        ].map(mode => (
                                            <button
                                                key={mode.id}
                                                onClick={() => setFormData({ ...formData, transportMode: mode.id })}
                                                className={`p-3 rounded-xl border transition-all flex items-center justify-center ${formData.transportMode === mode.id ? 'bg-amber-500 border-amber-500 text-white shadow-lg shadow-amber-500/20' : 'bg-neutral-50 dark:bg-neutral-800 border-neutral-100 dark:border-neutral-700 text-neutral-400 hover:border-warning/30'}`}
                                                title={mode.id.toUpperCase()}
                                            >
                                                <mode.icon className="w-4 h-4" />
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div>
                                    <label className="text-[9px] font-black text-neutral-400 uppercase tracking-widest block mb-2">Vehicle Node ID</label>
                                    <div className="relative">
                                        <Navigation className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-warning" />
                                        <input
                                            type="text"
                                            value={formData.vehicleNo}
                                            onChange={(e) => setFormData({ ...formData, vehicleNo: e.target.value })}
                                            placeholder="MH-01-AB-1234"
                                            className="w-full bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-sm py-3 pl-12 pr-4 text-xs font-bold outline-none focus:border-warning/30 transition-all dark:text-white"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="text-[9px] font-black text-neutral-400 uppercase tracking-widest block mb-2">Dispatch Date</label>
                                    <div className="relative">
                                        <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-warning" />
                                        <input
                                            type="date"
                                            value={formData.challanDate}
                                            onChange={(e) => setFormData({ ...formData, challanDate: e.target.value })}
                                            className="w-full bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-sm py-3 pl-12 pr-4 text-xs font-bold outline-none focus:border-warning/30 transition-all dark:text-white"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Dispatch Valuation */}
                        <div className="bg-neutral-900 dark:bg-white rounded-[40px] p-8 text-white dark:text-neutral-900 shadow-2xl relative overflow-hidden mt-auto">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-warning/10 rounded-bl-[100px]" />
                            <h3 className="text-[10px] font-black opacity-50 uppercase tracking-[0.3em] mb-8">Dispatch Valuation</h3>
                            <div className="space-y-6 relative z-10">
                                <div className="flex justify-between items-center text-xs font-bold uppercase tracking-widest opacity-80">
                                    <span>Matrix Nodes</span>
                                    <span className="font-mono">{metrics.totalItems} Units</span>
                                </div>
                                <div className="flex justify-between items-center text-xs font-bold uppercase tracking-widest opacity-80">
                                    <span>Logistics Protocol</span>
                                    <span className="font-mono text-success dark:text-emerald-600">{formData.transportMode.toUpperCase()}</span>
                                </div>
                                <div className="pt-6 border-t border-white/10 dark:border-neutral-200">
                                    <div className="flex flex-col gap-1">
                                        <span className="text-[10px] font-black uppercase tracking-[0.3em] opacity-40">Total Fulfillment Qty</span>
                                        <div className="text-4xl font-display font-black tracking-tighter flex items-center gap-3">
                                            <Activity className="w-8 h-8 text-warning" />
                                            {metrics.totalQty.toLocaleString()}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </aside>
            </main>

            <CustomerSelectionModal
                isOpen={showCustomerModal}
                onClose={() => setShowCustomerModal(false)}
                onSelect={(customer: any) => {
                    setFormData({ ...formData, customer });
                    setShowCustomerModal(false);
                    toast.success(`Entity ${customer.name} mapped to dispatch protocol`);
                }}
            />

            <ItemSelectionModal
                isOpen={showItemModal}
                onClose={() => setShowItemModal(false)}
                onSelect={handleItemSelect}
            />

            <SalesOrderSelectionModal
                isOpen={showSalesOrderModal}
                onClose={() => setShowSalesOrderModal(false)}
                onSelect={handleSalesOrderSelect}
            />
        </div>
    );
};

export default DeliveryChallan;

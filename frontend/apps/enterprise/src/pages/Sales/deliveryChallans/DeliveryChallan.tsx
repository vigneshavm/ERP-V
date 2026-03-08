import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Truck, 
  Package, 
  User, 
  Calendar, 
  Plus, 
  Trash2, 
  CheckCircle, 
  AlertCircle, 
  ArrowLeft,
  Zap,
  Clock,
  Navigation,
  ShieldCheck,
  Search,
  FileText,
  X,
  Container,
  Activity,
  ChevronRight,
  Box,
  Layers,
  MapPin,
  Anchor,
  Plane,
  Train,
  Printer
} from 'lucide-react';
import { toast } from 'react-toastify';
import Layout from "@/components/shared/Layout/Layout";
import CustomerSelectionModal from "@/components/shared/Modals/CustomerSelectionModal";
import ItemSelectionModal from "@/components/shared/Modals/ItemSelectionModal";
import SalesOrderSelectionModal from "@/components/shared/Modals/SalesOrderSelectionModal";
import { createDeliveryChallan, reset } from "@/redux/slices/deliveryChallanSlice";
import { RootState } from '@/redux/store';

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

const DeliveryChallan = () => {
    const navigate = useNavigate();
    const dispatch = useDispatch<any>();
    const { isLoading, isSuccess, isError, message, challan } = useSelector((state: RootState) => state.deliveryChallan);

    const [showCustomerModal, setShowCustomerModal] = useState(false);
    const [showItemModal, setShowItemModal] = useState(false);
    const [showSalesOrderModal, setShowSalesOrderModal] = useState(false);

    const [formData, setFormData] = useState({
        challanNo: 'LOG-' + Date.now().toString().slice(-6),
        challanDate: new Date().toISOString().split('T')[0],
        deliveryDate: '',
        customer: null as any,
        salesOrder: null as any,
        items: [] as ChallanItem[],
        vehicleNo: '',
        driverName: '',
        transportMode: 'road',
        notes: ''
    });

    useEffect(() => {
        if (isError) {
            toast.error(message || 'Logistics synchronization failure');
            dispatch(reset());
        }
        if (isSuccess && challan) {
            toast.success('Logistics hub: Fulfillment manifest locked');
            dispatch(reset());
            navigate(`/sales/delivery-challan/${challan._id}`);
        }
    }, [isError, isSuccess, message, challan, navigate, dispatch]);

    const handleSalesOrderSelect = (order: any) => {
        const orderItems = order.items.map((item: any) => ({
            item: item.item._id || item.item,
            name: item.item.name || 'Unknown Asset',
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
        toast.success(`Protocol Linked: Loaded ${orderItems.length} assets from Resolution Engine`);
    };

    const handleItemSelect = (item: any) => {
        const newItem: ChallanItem = {
            item: item._id,
            name: item.name,
            sku: item.sku,
            quantity: 1,
            deliveredQty: 1,
            unit: item.unit || 'pcs',
            description: '',
            availableStock: (item.stockQty || 0) - (item.reservedStock || 0),
            sellingPrice: item.sellingPrice || 0
        };
        setFormData({ ...formData, items: [...formData.items, newItem] });
    };

    const updateItem = (index: number, field: keyof ChallanItem, value: any) => {
        const newItems = [...formData.items];
        (newItems[index] as any)[field] = value;
        if (field === 'deliveredQty' && value > newItems[index].availableStock) {
            toast.warning(`Stock disruption: Insufficient assets (${newItems[index].availableStock} available)`);
            newItems[index].deliveredQty = newItems[index].availableStock;
        }
        setFormData({ ...formData, items: newItems });
    };

    const removeItem = (index: number) => {
        const newItems = formData.items.filter((_, i) => i !== index);
        setFormData({ ...formData, items: newItems });
    };

    const handleSave = () => {
        if (!formData.customer) { toast.error('Entity identification required'); return; }
        if (formData.items.length === 0) { toast.error('Fulfillment matrix is empty'); return; }
        
        const challanData = {
            customerId: formData.customer._id || formData.customer.id,
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
        dispatch(createDeliveryChallan(challanData));
    };

    const totalAssetQuantity = useMemo(() => formData.items.reduce((sum, item) => sum + (item.deliveredQty || 0), 0), [formData.items]);

    const GlassPanel = ({ children, title, icon: Icon, className = "" }: any) => (
        <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`glass-panel border border-white/5 shadow-2xl overflow-hidden ${className}`}
        >
            {title && (
                <div className="px-6 py-4 border-b border-white/5 bg-white/5 flex items-center justify-between">
                    <h3 className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.3em] flex items-center gap-3">
                        {Icon && <Icon className="w-4 h-4" />}
                        {title}
                    </h3>
                    <div className="flex gap-1">
                        <div className="w-1 h-1 bg-emerald-500/40 rounded-full"></div>
                        <div className="w-1 h-1 bg-emerald-500/20 rounded-full"></div>
                    </div>
                </div>
            )}
            <div className="p-6">{children}</div>
        </motion.div>
    );

    const TransportIcon = () => {
        switch(formData.transportMode) {
            case 'ship': return <Anchor className="w-4 h-4" />;
            case 'air': return <Plane className="w-4 h-4" />;
            case 'rail': return <Train className="w-4 h-4" />;
            default: return <Truck className="w-4 h-4" />;
        }
    }

    return (
        <Layout>
            <div className="min-h-screen bg-app p-4 lg:p-8 relative overflow-hidden pb-20">
                {/* Visual Accents */}
                <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-emerald-500/5 rounded-full blur-[140px] pointer-events-none -mr-48 -mt-48"></div>
                <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-blue-500/5 rounded-full blur-[120px] pointer-events-none -ml-32 -mb-32"></div>

                <div className="max-w-7xl mx-auto relative z-10 space-y-8">
                    {/* Logistics Header */}
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                        <div className="space-y-2">
                            <div className="flex items-center gap-3 text-emerald-500 font-black text-[10px] uppercase tracking-[0.4em]">
                                <Navigation className="w-4 h-4" />
                                Protocol: Logistics Hub / 2036
                            </div>
                            <h1 className="text-4xl md:text-5xl font-display font-black text-main tracking-tighter uppercase">
                                Logistics <span className="text-emerald-500 italic">Dispatch</span>
                            </h1>
                            <p className="text-secondary text-sm font-medium opacity-60">Physical asset orchestration and jurisdictional fulfillment dispatching.</p>
                        </div>

                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => navigate('/sales/delivery-challan-list')}
                                className="group px-6 py-4 glass-panel border border-white/10 hover:border-white/20 transition-all font-black text-[10px] uppercase tracking-widest text-secondary group-hover:text-main"
                            >
                                Registry
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={isLoading}
                                className="px-10 py-4 bg-emerald-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.4em] shadow-2xl shadow-emerald-900/40 hover:bg-emerald-500 disabled:opacity-40 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-4 focus:ring-4 focus:ring-emerald-500/20"
                            >
                                {isLoading ? <Clock className="w-5 h-5 animate-spin" /> : <ShieldCheck className="w-5 h-5" />}
                                {isLoading ? 'Synchronizing...' : 'Lock Manifest'}
                            </button>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                        {/* LEFT: Configuration */}
                        <div className="lg:col-span-8 space-y-8">
                            <div className="grid md:grid-cols-2 gap-8">
                                {/* Document Identifiers */}
                                <GlassPanel title="Protocol Markers" icon={FileText} className="h-full">
                                    <div className="space-y-6">
                                        <div className="space-y-1.5">
                                            <label className="text-[9px] font-black text-secondary uppercase tracking-[0.2em] opacity-40">Manifest Index</label>
                                            <div className="text-3xl font-display font-black text-emerald-500 tracking-tighter uppercase italic">{formData.challanNo}</div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4 pt-2">
                                            <div className="space-y-2">
                                                <label className="text-[9px] font-black text-secondary uppercase tracking-widest opacity-60">Dispatch Date</label>
                                                <input 
                                                    type="date" 
                                                    value={formData.challanDate}
                                                    onChange={(e) => setFormData({ ...formData, challanDate: e.target.value })}
                                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-xs font-bold text-main focus:outline-none focus:border-emerald-500/40 transition-all"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-[9px] font-black text-emerald-500 uppercase tracking-widest">Arrival Projection</label>
                                                <input 
                                                    type="date" 
                                                    value={formData.deliveryDate}
                                                    onChange={(e) => setFormData({ ...formData, deliveryDate: e.target.value })}
                                                    className="w-full bg-emerald-500/5 border border-emerald-500/20 rounded-xl px-4 py-3 text-xs font-black text-emerald-500 focus:outline-none focus:ring-4 focus:ring-emerald-500/5 transition-all"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </GlassPanel>

                                {/* Entity Identification */}
                                <GlassPanel title="Counterparty Identification" icon={User} className="h-full">
                                    {formData.customer ? (
                                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                                            <div className="flex items-start justify-between">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-16 h-16 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-center justify-center text-emerald-500 font-black text-2xl shadow-inner uppercase font-display">
                                                        {formData.customer.name?.charAt(0)}
                                                    </div>
                                                    <div>
                                                        <div className="text-xl font-display font-black text-main uppercase tracking-tight leading-none">{formData.customer.name}</div>
                                                        <div className="flex items-center gap-2 text-[9px] font-bold text-emerald-500 uppercase tracking-[0.2em] mt-2 bg-emerald-500/5 px-2 py-0.5 rounded-full border border-emerald-500/10">
                                                            <Activity className="w-3 h-3" /> Jurisdiction Verified
                                                        </div>
                                                    </div>
                                                </div>
                                                <button 
                                                    onClick={() => setFormData({ ...formData, customer: null, salesOrder: null, items: [] })}
                                                    className="p-2 rounded-xl bg-white/5 hover:bg-rose-500/10 text-secondary hover:text-rose-500 transition-all"
                                                >
                                                    <X className="w-4 h-4" />
                                                </button>
                                            </div>
                                            <div className="p-5 bg-white/5 border border-white/5 rounded-2xl space-y-2 group hover:bg-white/10 transition-colors">
                                                <div className="flex items-center gap-2 text-[8px] font-black text-secondary/40 uppercase tracking-widest">
                                                    <MapPin className="w-3 h-3 text-emerald-500" /> Destination Protocol
                                                </div>
                                                <div className="text-xs font-bold text-main leading-relaxed italic">{formData.customer.address?.line1 || 'Primary Sector HQ'}</div>
                                                <div className="text-[9px] font-bold text-secondary/40 uppercase tracking-tight">{formData.customer.address?.city || 'Central Hub'} • {formData.customer.phone}</div>
                                            </div>
                                        </motion.div>
                                    ) : (
                                        <div className="grid grid-cols-1 gap-4 pt-2">
                                            <motion.button
                                                whileHover={{ scale: 1.02 }}
                                                whileTap={{ scale: 0.98 }}
                                                onClick={() => setShowCustomerModal(true)}
                                                className="w-full h-16 border border-dashed border-white/10 rounded-2xl flex items-center justify-center gap-4 group hover:border-emerald-500/40 hover:bg-emerald-500/5 transition-all text-secondary"
                                            >
                                                <User className="w-5 h-5 opacity-40 group-hover:opacity-100 group-hover:text-emerald-500" />
                                                <span className="text-[9px] font-black uppercase tracking-[0.2em]">Manual Entity ID</span>
                                            </motion.button>
                                            <motion.button
                                                whileHover={{ scale: 1.02 }}
                                                whileTap={{ scale: 0.98 }}
                                                onClick={() => setShowSalesOrderModal(true)}
                                                className="w-full h-16 bg-emerald-500/5 border border-emerald-500/20 rounded-2xl flex items-center justify-center gap-4 group hover:bg-emerald-500/10 transition-all text-emerald-500"
                                            >
                                                <Zap className="w-5 h-5 group-hover:scale-110 transition-transform" />
                                                <span className="text-[9px] font-black uppercase tracking-[0.2em]">Sync Order Protocol</span>
                                            </motion.button>
                                        </div>
                                    )}
                                </GlassPanel>
                            </div>

                            {/* Fulfillment Matrix */}
                            <GlassPanel title="Asset Fulfillment Matrix" icon={Container}>
                                <div className="space-y-8">
                                    <div className="flex justify-between items-center px-2">
                                        <div className="text-[9px] font-black text-secondary uppercase tracking-[0.4em] opacity-40">Core Dispatch Registry</div>
                                        <button 
                                            onClick={() => setShowItemModal(true)}
                                            className="px-6 py-3 bg-emerald-500/10 border border-emerald-500/20 hover:bg-emerald-500/20 rounded-xl transition-all flex items-center gap-3 group"
                                        >
                                            <Plus className="w-4 h-4 text-emerald-500 group-hover:rotate-90 transition-transform" />
                                            <span className="text-[9px] font-black uppercase tracking-widest text-emerald-500">Inject Asset</span>
                                        </button>
                                    </div>

                                    <div className="overflow-x-auto custom-scrollbar -mx-2 px-2">
                                        <table className="w-full border-separate border-spacing-y-3">
                                            <thead>
                                                <tr className="text-[8px] font-black text-secondary/40 uppercase tracking-[0.4em] text-left">
                                                    <th className="px-6 pb-2">Operational Asset</th>
                                                    <th className="px-6 pb-2 text-right">Magnitude</th>
                                                    <th className="px-6 pb-2 text-right w-32">Dispatch</th>
                                                    <th className="px-6 pb-2">Condition Protocol</th>
                                                    <th className="px-6 pb-2 w-12 text-center"></th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                <AnimatePresence mode="popLayout">
                                                    {formData.items.length === 0 ? (
                                                        <tr className="opacity-10">
                                                            <td colSpan={5} className="py-24 text-center">
                                                                <Box className="w-16 h-16 mx-auto mb-6" />
                                                                <div className="text-[10px] font-black uppercase tracking-[0.4em]">Fulfillment Protocol Void</div>
                                                            </td>
                                                        </tr>
                                                    ) : (
                                                        formData.items.map((item, index) => (
                                                            <motion.tr 
                                                                layout
                                                                key={index}
                                                                initial={{ opacity: 0, scale: 0.98 }}
                                                                animate={{ opacity: 1, scale: 1 }}
                                                                exit={{ opacity: 0, scale: 0.98 }}
                                                                className="bg-white/5 rounded-3xl border border-white/5 group hover:bg-white/10 transition-all"
                                                            >
                                                                <td className="px-6 py-5 rounded-l-3xl">
                                                                    <div className="text-sm font-black text-main uppercase tracking-tight">{item.name}</div>
                                                                    <div className="text-[8px] font-black text-secondary/40 uppercase mt-2 bg-white/5 inline-block px-2 py-0.5 rounded tracking-widest">ID: {item.sku || 'UNRECORDED'}</div>
                                                                </td>
                                                                <td className="px-6 py-5 text-right">
                                                                    <div className={`text-[9px] font-black px-3 py-1 rounded-full border inline-block ${item.availableStock > 5 ? 'text-emerald-500 border-emerald-500/20 bg-emerald-500/5' : 'text-rose-500 border-rose-500/20 bg-rose-500/5'} uppercase tracking-widest`}>
                                                                        {item.availableStock} in Reserve
                                                                    </div>
                                                                </td>
                                                                <td className="px-6 py-5">
                                                                    <div className="relative group/input">
                                                                        <input 
                                                                            type="number"
                                                                            value={item.deliveredQty}
                                                                            onChange={(e) => updateItem(index, 'deliveredQty', parseFloat(e.target.value) || 0)}
                                                                            className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 px-4 text-right text-sm font-black text-emerald-500 focus:outline-none focus:border-emerald-500/40 focus:ring-4 focus:ring-emerald-500/10 transition-all font-mono"
                                                                        />
                                                                        <div className="absolute right-0 top-0 bottom-0 pr-3 flex items-center pointer-events-none opacity-0 group-focus-within/input:opacity-100 transition-opacity">
                                                                            <span className="text-[8px] font-black text-emerald-500 uppercase tracking-widest">{item.unit}</span>
                                                                        </div>
                                                                    </div>
                                                                </td>
                                                                <td className="px-6 py-5">
                                                                    <input 
                                                                        type="text" 
                                                                        value={item.description}
                                                                        onChange={(e) => updateItem(index, 'description', e.target.value)}
                                                                        placeholder="State condition marks..."
                                                                        className="w-full bg-transparent border-none focus:ring-0 p-0 text-[10px] font-medium text-secondary/40 italic placeholder:opacity-20"
                                                                    />
                                                                </td>
                                                                <td className="px-6 py-5 text-center rounded-r-3xl">
                                                                    <button 
                                                                        onClick={() => removeItem(index)}
                                                                        className="w-8 h-8 rounded-xl bg-rose-500/5 hover:bg-rose-500 text-rose-500/40 hover:text-white flex items-center justify-center transition-all"
                                                                    >
                                                                        <Trash2 className="w-4 h-4" />
                                                                    </button>
                                                                </td>
                                                            </motion.tr>
                                                        ))
                                                    )}
                                                </AnimatePresence>
                                            </tbody>
                                        </table>
                                    </div>
                                    
                                    {formData.items.length > 0 && (
                                        <div className="flex justify-end pr-6 pt-4">
                                            <div className="flex items-center gap-12 border-t border-white/5 pt-8 w-full justify-end">
                                                <div className="space-y-1 text-right">
                                                    <div className="text-[9px] font-black text-secondary/40 uppercase tracking-[0.2em]">Asset Magnitude</div>
                                                    <div className="text-4xl font-display font-black text-emerald-500 tracking-tighter tabular-nums">{totalAssetQuantity} <span className="text-[10px] uppercase font-bold text-secondary/40 ml-2 tracking-[0.3em]">Units</span></div>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </GlassPanel>
                        </div>

                        {/* RIGHT: Logistics Intelligence */}
                        <div className="lg:col-span-4 space-y-8">
                            <GlassPanel title="Logistics Configuration" icon={Truck} className="sticky top-8">
                                <div className="space-y-6">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <label className="text-[9px] font-black text-secondary uppercase tracking-widest opacity-40">Transport Protocol</label>
                                            <div className="relative group">
                                                <select 
                                                    value={formData.transportMode}
                                                    onChange={(e) => setFormData({ ...formData, transportMode: e.target.value })}
                                                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-12 py-4 text-[10px] font-black text-main uppercase tracking-widest focus:outline-none focus:border-emerald-500/40 appearance-none cursor-pointer"
                                                >
                                                    <option value="road" className="bg-neutral-900">Road Carrier</option>
                                                    <option value="rail" className="bg-neutral-900">Rail Network</option>
                                                    <option value="air" className="bg-neutral-900">Air Shipment</option>
                                                    <option value="ship" className="bg-neutral-900">Maritime</option>
                                                    <option value="courier" className="bg-neutral-900">Elite Courier</option>
                                                </select>
                                                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-500"><TransportIcon /></div>
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[9px] font-black text-secondary uppercase tracking-widest opacity-40">Asset Carrier ID</label>
                                            <input 
                                                type="text" 
                                                value={formData.vehicleNo}
                                                onChange={(e) => setFormData({ ...formData, vehicleNo: e.target.value })}
                                                placeholder="TAG-772"
                                                className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-[10px] font-black text-main uppercase tracking-widest focus:outline-none focus:border-emerald-500/40 placeholder:opacity-20"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-[9px] font-black text-secondary uppercase tracking-widest opacity-40">Designated Pilot</label>
                                        <div className="relative">
                                            <input 
                                                type="text" 
                                                value={formData.driverName}
                                                onChange={(e) => setFormData({ ...formData, driverName: e.target.value })}
                                                placeholder="OPERATOR IDENTIFIER..."
                                                className="w-full bg-white/5 border border-white/10 rounded-2xl pl-12 pr-6 py-4 text-[10px] font-black text-main uppercase tracking-widest focus:outline-none focus:border-emerald-500/40"
                                            />
                                            <Layers className="w-4 h-4 text-emerald-500 absolute left-4 top-1/2 -translate-y-1/2" />
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <label className="text-[9px] font-black text-secondary uppercase tracking-widest opacity-40">Strategic Annotations</label>
                                        <textarea 
                                            value={formData.notes}
                                            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                            placeholder="Specify tactical delivery constraints..."
                                            className="w-full bg-white/5 border border-white/10 rounded-[2rem] p-6 text-[10px] font-medium text-main resize-none h-44 placeholder:text-secondary/20 focus:outline-none focus:border-emerald-500/40 transition-all custom-scrollbar"
                                        />
                                    </div>

                                    <div className="p-6 bg-emerald-500/5 border border-emerald-500/10 rounded-[2rem] flex items-center justify-between group cursor-help hover:bg-emerald-500/10 transition-all">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 bg-emerald-500/10 rounded-2xl flex items-center justify-center text-emerald-500 shadow-inner">
                                                <Activity className="w-6 h-6 animate-pulse" />
                                            </div>
                                            <div>
                                                <div className="text-[10px] font-black text-main uppercase tracking-widest">Global Telemetry</div>
                                                <div className="text-[9px] font-bold text-emerald-500 uppercase tracking-widest mt-1">Satellite Link: Secure</div>
                                            </div>
                                        </div>
                                        <ChevronRight className="w-5 h-5 text-emerald-500 opacity-40 group-hover:translate-x-1 group-hover:opacity-100 transition-all" />
                                    </div>

                                    <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/5 mt-auto">
                                        <button className="py-4 glass-panel border border-white/5 text-secondary hover:text-main text-[9px] font-black uppercase tracking-[0.3em] transition-all flex items-center justify-center gap-3">
                                            <Printer className="w-4 h-4" /> Draft
                                        </button>
                                        <button className="py-4 glass-panel border border-white/5 text-secondary hover:text-main text-[9px] font-black uppercase tracking-[0.3em] transition-all flex items-center justify-center gap-3">
                                            <Search className="w-4 h-4" /> Trace
                                        </button>
                                    </div>
                                </div>
                            </GlassPanel>
                        </div>
                    </div>
                </div>
            </div>

            <CustomerSelectionModal
                isOpen={showCustomerModal}
                onClose={() => setShowCustomerModal(false)}
                onSelect={(customer: any) => {
                    setFormData({ ...formData, customer });
                    setShowCustomerModal(false);
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

            <style>{`
                .custom-scrollbar::-webkit-scrollbar { width: 4px; height: 4px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: rgba(255, 255, 255, 0.01); }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(16, 185, 129, 0.2); border-radius: 20px; }
                select option { background-color: #0c0a09; color: white; padding: 20px; }
                .font-display { font-family: 'Outfit', sans-serif; }
                .glass-panel { background: rgba(255, 255, 255, 0.03); backdrop-filter: blur(20px); border-radius: 2.5rem; }
            `}</style>
        </Layout>
    );
};

export default DeliveryChallan;

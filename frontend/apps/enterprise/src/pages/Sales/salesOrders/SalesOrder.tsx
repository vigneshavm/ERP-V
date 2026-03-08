import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Package, 
  User, 
  Calendar, 
  Trash2, 
  Plus, 
  Minus, 
  CheckCircle, 
  AlertCircle, 
  ChevronRight, 
  Search, 
  ArrowLeft,
  ShieldCheck,
  Zap,
  Clock,
  Printer,
  FileText,
  X,
  Layers,
  TrendingUp,
  Activity,
  ArrowUpRight,
  ClipboardList,
  Target
} from 'lucide-react';
import api from "@/services/api";
import { toast } from 'react-toastify';
import Layout from "@/components/shared/Layout/Layout";
import CustomerSelectionModal from "@/components/shared/Modals/CustomerSelectionModal";
import ItemSelectionModal from "@/components/shared/Modals/ItemSelectionModal";
import type { SalesOrder, SalesOrderItem, Customer } from '@/types/sales';

const SalesOrderPage = () => {
    const navigate = useNavigate();
    const [showCustomerModal, setShowCustomerModal] = useState(false);
    const [showItemModal, setShowItemModal] = useState(false);
    const [loading, setLoading] = useState(false);

    interface SalesOrderFormData {
        orderDate: string;
        expectedDeliveryDate: string;
        customer: Customer | null;
        items: SalesOrderItem[];
        discount: number;
        notes: string;
    }

    const [formData, setFormData] = useState<SalesOrderFormData>({
        orderDate: new Date().toISOString().split('T')[0],
        expectedDeliveryDate: '',
        customer: null,
        items: [],
        discount: 0,
        notes: ''
    });

    // Calculations
    const subtotal = useMemo(() => formData.items.reduce((sum, item) => sum + (item.quantity * item.rate), 0), [formData.items]);
    const totalTax = useMemo(() => formData.items.reduce((sum, item) => {
        const sub = item.quantity * item.rate;
        return sum + (sub * (item.tax || 0) / 100);
    }, 0), [formData.items]);
    const itemDiscounts = useMemo(() => formData.items.reduce((sum, item) => sum + (item.discount || 0), 0), [formData.items]);
    const finalTotal = useMemo(() => Math.max(0, subtotal + totalTax - itemDiscounts - formData.discount), [subtotal, totalTax, itemDiscounts, formData.discount]);

    const addItemFromModal = (item: any) => {
        const existingIndex = formData.items.findIndex((i) => i.item === item._id);

        if (existingIndex >= 0) {
            const newItems = [...formData.items];
            newItems[existingIndex].quantity += item.quantity || 1;
            setFormData({ ...formData, items: newItems });
        } else {
            const newItem: SalesOrderItem = {
                item: item._id,
                name: item.name,
                quantity: item.quantity || 1,
                rate: item.sellingPrice || 0,
                tax: 18,
                discount: 0,
                availableStock: item.stockQty - (item.reservedStock || 0)
            };
            setFormData({ ...formData, items: [...formData.items, newItem] });
        }
    };

    const updateItem = (index: number, field: keyof SalesOrderItem, value: any) => {
        const newItems = [...formData.items];
        (newItems[index] as any)[field] = value;
        setFormData({ ...formData, items: newItems });
    };

    const removeItem = (index: number) => {
        const newItems = formData.items.filter((_, i) => i !== index);
        setFormData({ ...formData, items: newItems });
    };

    const validateForm = () => {
        if (!formData.customer) { toast.error('Entity identification required'); return false; }
        if (formData.items.length === 0) { toast.error('Fulfillment matrix is empty'); return false; }
        if (!formData.expectedDeliveryDate) { toast.error('Resolution timeline undefined'); return false; }
        
        for (const item of formData.items) {
            if (item.availableStock !== undefined && item.quantity > item.availableStock) {
                toast.error(`Stock disruption for ${item.name}. Available: ${item.availableStock}`);
                return false;
            }
        }
        return true;
    };

    const handleSaveDraft = async () => {
        if (!validateForm()) return;
        setLoading(true);
        try {
            const user = JSON.parse(localStorage.getItem('user') || '{}');
            const payload = {
                customerId: formData.customer?.id || formData.customer?._id,
                orderDate: formData.orderDate,
                expectedDeliveryDate: formData.expectedDeliveryDate,
                items: formData.items.map((item) => ({
                    item: item.item,
                    quantity: item.quantity,
                    rate: item.rate,
                    tax: item.tax,
                    discount: item.discount
                })),
                discount: formData.discount,
                notes: formData.notes
            };
            await api.post(`/api/sales-orders`, payload, { headers: { Authorization: `Bearer ${user?.token}` } });
            toast.success('Fulfillment manifest saved as draft');
            navigate('/sales/sales-order-list');
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Sync disruption');
        } finally { setLoading(false); }
    };

    const handleConfirmOrder = async () => {
        if (!validateForm()) return;
        setLoading(true);
        try {
            const user = JSON.parse(localStorage.getItem('user') || '{}');
            const token = user?.token;
            const payload = {
                customerId: formData.customer?.id || formData.customer?._id,
                orderDate: formData.orderDate,
                expectedDeliveryDate: formData.expectedDeliveryDate,
                items: formData.items.map((item) => ({
                    item: item.item,
                    quantity: item.quantity,
                    rate: item.rate,
                    tax: item.tax,
                    discount: item.discount
                })),
                discount: formData.discount,
                notes: formData.notes
            };
            const createResponse = await api.post(`/api/sales-orders`, payload, { headers: { Authorization: `Bearer ${token}` } });
            const orderId = createResponse.data.salesOrder._id;
            await api.post(`/api/sales-orders/${orderId}/confirm`, {}, { headers: { Authorization: `Bearer ${token}` } });
            toast.success('Resolution confirmed. Inventory locked.');
            navigate('/sales/sales-order-list');
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Protocol failure');
        } finally { setLoading(false); }
    };

    // UI Components
    const GlassPanel = ({ children, title, icon: Icon, className = "" }: any) => (
        <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`glass-panel border border-white/5 shadow-2xl overflow-hidden ${className}`}
        >
            {title && (
                <div className="px-10 py-6 border-b border-white/5 bg-white/[0.02] flex items-center justify-between">
                    <h3 className="text-[10px] font-black text-primary uppercase tracking-[0.4em] flex items-center gap-4">
                        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center border border-primary/20">
                            {Icon && <Icon className="w-4 h-4" />}
                        </div>
                        {title}
                    </h3>
                    <div className="flex gap-2">
                        <div className="w-1.5 h-1.5 bg-primary/40 rounded-full animate-pulse"></div>
                        <div className="w-1.5 h-1.5 bg-primary/20 rounded-full"></div>
                    </div>
                </div>
            )}
            <div className="p-10">{children}</div>
        </motion.div>
    );

    return (
        <Layout>
            <div className="min-h-screen bg-app p-4 lg:p-8 relative overflow-hidden pb-32">
                {/* Visual Background Accents */}
                <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-primary/5 rounded-full blur-[160px] pointer-events-none -mr-48 -mt-48 opacity-20"></div>
                <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-indigo-500/5 rounded-full blur-[140px] pointer-events-none -ml-32 -mb-32 opacity-10"></div>

                <div className="max-w-7xl mx-auto relative z-10 space-y-10">
                    {/* Resolution Header */}
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
                        <div className="space-y-3">
                            <div className="flex items-center gap-3 text-primary font-black text-[10px] uppercase tracking-[0.5em]">
                                <ShieldCheck className="w-4 h-4" />
                                Operational Protocol: Resolution Engine / 2036
                            </div>
                            <h1 className="text-5xl md:text-6xl font-display font-black text-main tracking-tighter uppercase leading-none">
                                Commercial <span className="text-primary italic">Engine</span>
                            </h1>
                            <p className="text-secondary text-base font-medium opacity-60 max-w-xl">High-fidelity fulfillment orchestration and synchronized asset locking.</p>
                        </div>

                        <div className="flex items-center gap-4">
                            <button
                                onClick={() => navigate('/sales/sales-order-list')}
                                className="group w-14 h-14 glass-panel border border-white/10 hover:border-rose-500/40 transition-all flex items-center justify-center shadow-xl text-secondary hover:text-rose-500"
                            >
                                <X className="w-6 h-6 transition-transform group-hover:rotate-90" />
                            </button>
                            <button
                                onClick={handleSaveDraft}
                                disabled={loading}
                                className="px-8 py-5 glass-panel border border-white/10 text-primary hover:bg-primary/5 transition-all flex items-center gap-4 shadow-xl"
                            >
                                <Zap className="w-5 h-5" />
                                <span className="text-[10px] font-black uppercase tracking-[0.4em]">{loading ? 'SYNCING...' : 'CACHE DRAFT'}</span>
                            </button>
                            <button
                                onClick={handleConfirmOrder}
                                disabled={loading}
                                className="px-10 py-5 bg-primary text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.4em] shadow-2xl shadow-primary/40 hover:bg-primary-hover hover:scale-[1.05] active:scale-[0.98] transition-all flex items-center gap-4 group"
                            >
                                {loading ? <Clock className="w-5 h-5 animate-spin" /> : <ShieldCheck className="w-5 h-5 group-hover:scale-110 transition-transform" />}
                                {loading ? 'PROCESSING...' : 'AUTHORIZE RESOLUTION'}
                            </button>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                        {/* Primary Configuration Compartment */}
                        <div className="lg:col-span-8 space-y-8">
                            <div className="grid md:grid-cols-2 gap-8">
                                {/* Entity Details */}
                                <GlassPanel title="Protocol Entity" icon={User} className="h-full">
                                    {formData.customer ? (
                                        <div className="space-y-6">
                                            <div className="flex items-start justify-between">
                                                <div className="flex items-center gap-5">
                                                    <div className="w-20 h-20 bg-gradient-to-br from-primary/20 to-indigo-500/10 border border-primary/30 rounded-3xl flex items-center justify-center text-primary font-black text-3xl font-display shadow-inner">
                                                        {formData.customer.name?.charAt(0).toUpperCase()}
                                                    </div>
                                                    <div className="space-y-1">
                                                        <div className="text-2xl font-display font-black text-main uppercase tracking-tight leading-none">{formData.customer.name}</div>
                                                        <div className="flex items-center gap-2 text-[10px] font-black text-primary uppercase tracking-[0.2em] opacity-60">
                                                            <Activity className="w-3.5 h-3.5" /> 
                                                            FIDELITY PROFILE: HIGH-PRECISION
                                                        </div>
                                                    </div>
                                                </div>
                                                <button 
                                                    onClick={() => setFormData({ ...formData, customer: null })}
                                                    className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 hover:bg-rose-500/10 hover:border-rose-500/40 flex items-center justify-center transition-all group"
                                                >
                                                    <Trash2 className="w-5 h-5 text-rose-500/40 group-hover:text-rose-500 transition-colors" />
                                                </button>
                                            </div>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="p-5 bg-white/5 border border-white/5 rounded-2xl space-y-3 hover:bg-white/[0.08] transition-colors">
                                                    <div className="text-[9px] font-black text-secondary/40 uppercase tracking-[0.3em]">Temporal Marker</div>
                                                    <div className="text-xs font-black text-main tracking-widest">{formData.customer.phone || 'NONE_DETECTED'}</div>
                                                </div>
                                                <div className="p-5 bg-white/5 border border-white/5 rounded-2xl space-y-3 hover:bg-white/[0.08] transition-colors overflow-hidden">
                                                    <div className="text-[9px] font-black text-secondary/40 uppercase tracking-[0.3em]">Communication Hash</div>
                                                    <div className="text-xs font-black text-main truncate hover:text-primary transition-colors">{formData.customer.email || 'REDACTED'}</div>
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <motion.button
                                            whileHover={{ scale: 1.01, border: '2px solid rgba(var(--color-primary-rgb), 0.4)' }}
                                            whileTap={{ scale: 0.99 }}
                                            onClick={() => setShowCustomerModal(true)}
                                            className="w-full h-48 border-2 border-dashed border-white/10 rounded-3xl flex flex-col items-center justify-center gap-4 group transition-all bg-white/[0.02] hover:bg-primary/[0.02]"
                                        >
                                            <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-center group-hover:bg-primary/10 group-hover:border-primary/20 transition-all">
                                                <User className="w-8 h-8 text-secondary group-hover:text-primary transition-colors" />
                                            </div>
                                            <span className="text-[11px] font-black uppercase tracking-[0.4em] text-secondary group-hover:text-primary transition-colors">IDENTIFY COMMERCIAL ENTITY</span>
                                        </motion.button>
                                    )}
                                </GlassPanel>

                                {/* Timeline Precision */}
                                <GlassPanel title="Temporal Resolution" icon={Calendar} className="h-full">
                                    <div className="space-y-6">
                                        <div className="space-y-3">
                                            <label className="text-[10px] font-black text-secondary uppercase tracking-[0.4em] opacity-40">Establishment Date</label>
                                            <div className="relative group">
                                                <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-primary/40" />
                                                <input 
                                                    type="date" 
                                                    value={formData.orderDate}
                                                    onChange={(e) => setFormData({ ...formData, orderDate: e.target.value })}
                                                    className="w-full bg-white/5 border border-white/10 rounded-2xl pl-12 pr-4 py-5 text-[11px] font-black text-main uppercase tracking-widest focus:outline-none focus:border-primary/40 focus:ring-4 focus:ring-primary/5 transition-all"
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-3">
                                            <label className="text-[10px] font-black text-primary uppercase tracking-[0.4em]">Target Resolution Date</label>
                                            <div className="relative group">
                                                <Target className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-primary" />
                                                <input 
                                                    type="date" 
                                                    value={formData.expectedDeliveryDate}
                                                    onChange={(e) => setFormData({ ...formData, expectedDeliveryDate: e.target.value })}
                                                    className="w-full bg-primary/5 border border-primary/20 rounded-2xl pl-12 pr-4 py-5 text-[11px] font-black text-primary uppercase tracking-widest focus:outline-none focus:ring-4 focus:ring-primary/10 transition-all font-mono"
                                                />
                                            </div>
                                            <p className="text-[8px] font-black text-primary/40 uppercase tracking-widest italic flex items-center gap-2">
                                                <Activity className="w-3 h-3" /> SLA Synchronization Active
                                            </p>
                                        </div>
                                    </div>
                                </GlassPanel>
                            </div>

                            {/* Fulfillment Matrix */}
                            <GlassPanel title="Fulfillment Matrix" icon={Package}>
                                <div className="space-y-8">
                                    <div className="flex justify-between items-center">
                                        <div className="flex items-center gap-3">
                                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                                            <div className="text-[10px] font-black text-secondary uppercase tracking-[0.4em]">Integrated Asset Registry</div>
                                        </div>
                                        <button 
                                            onClick={() => setShowItemModal(true)}
                                            className="px-8 py-3 bg-white/5 border border-white/10 hover:border-primary/40 hover:bg-primary/5 rounded-xl transition-all flex items-center gap-3 group"
                                        >
                                            <Plus className="w-5 h-5 text-primary group-hover:rotate-90 transition-transform duration-500" />
                                            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-secondary group-hover:text-main">Inject Asset</span>
                                        </button>
                                    </div>

                                    <div className="overflow-x-auto custom-scrollbar">
                                        <table className="w-full border-separate border-spacing-y-4">
                                            <thead>
                                                <tr className="text-[9px] font-black text-secondary/40 uppercase tracking-[0.5em] text-left">
                                                    <th className="px-6 pb-2">Operational Asset</th>
                                                    <th className="px-6 pb-2 text-right">Magnitude</th>
                                                    <th className="px-6 pb-2 text-right">Unit Rate</th>
                                                    <th className="px-6 pb-2 text-right">Net Resolution</th>
                                                    <th className="px-6 pb-2 w-16 text-center"></th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                <AnimatePresence mode="popLayout">
                                                    {formData.items.length === 0 ? (
                                                        <tr className="group">
                                                            <td colSpan={5} className="py-24 text-center">
                                                                <div className="relative inline-block">
                                                                    <div className="absolute inset-0 bg-primary/20 blur-[60px] rounded-full scale-150 opacity-20"></div>
                                                                    <ClipboardList className="w-16 h-16 mx-auto mb-6 text-primary/20 relative z-10" />
                                                                </div>
                                                                <div className="text-[11px] font-black uppercase tracking-[0.5em] text-secondary opacity-40">Matrix Status: Offline / Awaiting Asset Injection</div>
                                                            </td>
                                                        </tr>
                                                    ) : (
                                                        formData.items.map((item, index) => (
                                                            <motion.tr 
                                                                layout
                                                                key={index}
                                                                initial={{ opacity: 0, x: -20 }}
                                                                animate={{ opacity: 1, x: 0 }}
                                                                exit={{ opacity: 0, scale: 0.95 }}
                                                                className="bg-white/5 rounded-3xl border border-white/5 group hover:bg-white/[0.08] transition-all"
                                                            >
                                                                <td className="px-6 py-6 rounded-l-[1.5rem]">
                                                                    <div className="text-sm font-display font-black text-main uppercase tracking-tight group-hover:text-primary transition-colors leading-none">{item.name}</div>
                                                                    <div className="flex items-center gap-3 mt-3">
                                                                        <div className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest ${item.availableStock && item.availableStock > 0 ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-500 border border-rose-500/20'}`}>
                                                                            Stock: {item.availableStock || '0'}
                                                                        </div>
                                                                        <div className="text-[8px] font-black text-primary/40 uppercase tracking-widest italic">Authorized Unit</div>
                                                                    </div>
                                                                </td>
                                                                <td className="px-6 py-6">
                                                                    <div className="flex items-center justify-end gap-3">
                                                                        <button 
                                                                            onClick={() => updateItem(index, 'quantity', Math.max(1, (item.quantity || 1) - 1))}
                                                                            className="w-10 h-10 bg-white/5 border border-white/5 rounded-xl flex items-center justify-center hover:bg-primary/10 hover:border-primary/20 hover:text-primary transition-all shadow-inner"
                                                                        >
                                                                            <Minus className="w-4 h-4" />
                                                                        </button>
                                                                        <div className="w-12 text-center">
                                                                            <span className="text-lg font-display font-black text-main leading-none tabular-nums">{item.quantity}</span>
                                                                            <div className="text-[7px] font-black text-secondary/40 uppercase tracking-widest mt-1">VOL</div>
                                                                        </div>
                                                                        <button 
                                                                            onClick={() => updateItem(index, 'quantity', (item.quantity || 1) + 1)}
                                                                            className="w-10 h-10 bg-white/5 border border-white/5 rounded-xl flex items-center justify-center hover:bg-primary/10 hover:border-primary/20 hover:text-primary transition-all shadow-inner"
                                                                        >
                                                                            <Plus className="w-4 h-4" />
                                                                        </button>
                                                                    </div>
                                                                </td>
                                                                <td className="px-6 py-6 text-right">
                                                                    <div className="text-sm font-black text-main tabular-nums">₹{item.rate?.toLocaleString()}</div>
                                                                    <div className="text-[8px] font-black text-secondary/40 uppercase tracking-widest mt-1">VALUE_INDEX</div>
                                                                </td>
                                                                <td className="px-6 py-6 text-right">
                                                                    <div className="text-lg font-display font-black text-main tracking-tighter tabular-nums">₹{(item.quantity * (item.rate || 0)).toLocaleString()}</div>
                                                                    <div className="text-[8px] font-black text-primary/40 uppercase tracking-widest mt-1 italic">Authorized NET</div>
                                                                </td>
                                                                <td className="px-6 py-6 text-center rounded-r-[1.5rem]">
                                                                    <button 
                                                                        onClick={() => removeItem(index)}
                                                                        className="w-10 h-10 rounded-xl bg-white/5 border border-white/5 hover:bg-rose-500/10 hover:border-rose-500/40 text-rose-500/40 hover:text-rose-500 transition-all flex items-center justify-center group/del shadow-xl"
                                                                    >
                                                                        <Trash2 className="w-5 h-5 group-hover/del:scale-110 transition-transform" />
                                                                    </button>
                                                                </td>
                                                            </motion.tr>
                                                        ))
                                                    )}
                                                </AnimatePresence>
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </GlassPanel>
                        </div>

                        {/* Intelligence Hub Partition */}
                        <div className="lg:col-span-4 space-y-8">
                            <GlassPanel title="Resolution Intelligence" icon={TrendingUp} className="sticky top-8">
                                <div className="space-y-8">
                                    {/* Calculations */}
                                    <div className="space-y-6">
                                        <div className="flex justify-between items-end border-b border-white/5 pb-6 group">
                                            <div className="space-y-1">
                                                <span className="text-[10px] font-black text-secondary/40 uppercase tracking-[0.4em] group-hover:text-secondary transition-colors">Operational Base</span>
                                                <div className="text-[9px] font-black text-primary/40 uppercase tracking-widest italic">SUM_MANIFEST</div>
                                            </div>
                                            <span className="text-xl font-display font-black text-main tabular-nums tracking-tighter">₹{subtotal.toLocaleString()}</span>
                                        </div>
                                        <div className="flex justify-between items-end border-b border-white/5 pb-6 group">
                                            <div className="space-y-1">
                                                <span className="text-[10px] font-black text-secondary/40 uppercase tracking-[0.4em] group-hover:text-secondary transition-colors">Protocol Value Transfer (18%)</span>
                                                <div className="text-[9px] font-black text-primary/40 uppercase tracking-widest italic">VAT_SYNC</div>
                                            </div>
                                            <span className="text-xl font-display font-black text-main tabular-nums tracking-tighter">₹{totalTax.toLocaleString()}</span>
                                        </div>
                                        <div className="flex justify-between items-end group">
                                            <div className="space-y-1">
                                                <span className="text-[10px] font-black text-rose-500/40 uppercase tracking-[0.4em] group-hover:text-rose-500 transition-colors">Aggregated Asset Rebates</span>
                                                <div className="text-[9px] font-black text-rose-500/20 uppercase tracking-widest italic font-mono">-REBATE_LOCKED</div>
                                            </div>
                                            <span className="text-xl font-display font-black text-rose-500 tabular-nums tracking-tighter">-₹{itemDiscounts.toLocaleString()}</span>
                                        </div>

                                        <div className="space-y-3 pt-4 border-t border-primary/20">
                                            <div className="flex items-center justify-between">
                                                <label className="text-[10px] font-black text-primary uppercase tracking-[0.4em]">Resolution Incentive Override</label>
                                                <Zap className="w-3.5 h-3.5 text-primary animate-pulse" />
                                            </div>
                                            <div className="relative group">
                                                <div className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-black text-rose-400 opacity-40 group-focus-within:opacity-100 transition-opacity">₹</div>
                                                <input 
                                                    type="number" 
                                                    value={formData.discount}
                                                    onChange={(e) => setFormData({ ...formData, discount: parseFloat(e.target.value) || 0 })}
                                                    className="w-full bg-rose-500/5 border border-rose-500/20 rounded-2xl px-6 py-5 text-xl font-display font-black text-rose-500 focus:outline-none focus:border-rose-500 focus:ring-4 focus:ring-rose-500/10 transition-all text-right tabular-nums tracking-tighter"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Final Resolution Magnitude */}
                                    <div className="p-8 bg-gradient-to-br from-primary/10 to-indigo-500/5 border border-primary/20 rounded-3xl relative overflow-hidden group shadow-2xl">
                                         <div className="absolute top-0 right-0 w-48 h-48 bg-primary/20 rounded-full blur-[60px] -mr-24 -mt-24 pointer-events-none group-hover:scale-150 transition-transform duration-1000"></div>
                                         <div className="space-y-6 relative z-10">
                                            <div className="flex justify-between items-center">
                                                <span className="text-[11px] font-black text-primary uppercase tracking-[0.5em] italic">Net Contract Magnitude</span>
                                                <ShieldCheck className="w-5 h-5 text-primary" />
                                            </div>
                                            <div className="flex items-baseline justify-end gap-3">
                                                <span className="text-2xl text-primary font-black mb-1">₹</span>
                                                <span className="text-6xl font-display font-black text-main tracking-tighter leading-none tabular-nums">
                                                    {finalTotal.toLocaleString()}
                                                </span>
                                            </div>
                                            
                                            <div className="pt-4">
                                                <button 
                                                    onClick={handleConfirmOrder}
                                                    disabled={loading || formData.items.length === 0}
                                                    className="w-full py-6 bg-primary text-white rounded-[1.5rem] font-black text-[11px] uppercase tracking-[0.5em] shadow-2xl shadow-primary/40 hover:bg-primary-hover hover:scale-[1.02] active:scale-[0.98] disabled:opacity-40 transition-all flex items-center justify-center gap-4 group/btn"
                                                >
                                                    {loading ? (
                                                        <Clock className="w-5 h-5 animate-spin" />
                                                    ) : (
                                                        <ShieldCheck className="w-6 h-6 group-hover/btn:scale-110 transition-transform" />
                                                    )}
                                                    {loading ? 'INITIALIZING PROTOCOL...' : 'AUTHORIZE RESOLUTION'}
                                                </button>
                                                <p className="text-center text-[8px] font-black text-primary/40 uppercase tracking-widest mt-4 italic">Confirming will lock inventory and establish commercial obligation.</p>
                                            </div>
                                         </div>
                                    </div>

                                    {/* Conflict Annotations */}
                                    <div className="space-y-4">
                                        <div className="flex items-center gap-3">
                                            <ClipboardList className="w-4 h-4 text-secondary/40" />
                                            <label className="text-[10px] font-black text-secondary/40 uppercase tracking-[0.4em]">Protocol Annotations</label>
                                        </div>
                                        <textarea 
                                            value={formData.notes}
                                            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                            placeholder="SPECIFY LOGISTICS CONSTRAINTS OR RESOLUTION OVERRIDES..."
                                            className="w-full bg-white/5 border border-white/10 rounded-2xl p-6 text-[11px] font-black text-main uppercase tracking-widest resize-none h-40 placeholder:text-secondary/10 focus:outline-none focus:border-primary/40 focus:ring-4 focus:ring-primary/5 transition-all scrollbar-hide"
                                        />
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
                onSelect={addItemFromModal}
            />

            <style>{`
                .glass-panel { background: rgba(255, 255, 255, 0.03); backdrop-filter: blur(25px); border-radius: 2.5rem; }
                .font-display { font-family: 'Outfit', sans-serif; }
                .custom-scrollbar::-webkit-scrollbar { width: 4px; height: 4px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: rgba(255, 255, 255, 0.01); }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(var(--color-primary-rgb), 0.2); border-radius: 20px; }
            `}</style>
        </Layout>
    );
};

export default SalesOrderPage;

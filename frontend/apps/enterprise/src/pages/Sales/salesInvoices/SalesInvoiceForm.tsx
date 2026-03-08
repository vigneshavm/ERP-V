import { useState, useEffect, useMemo } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ShieldCheck, 
  User, 
  Calendar, 
  Receipt, 
  Plus, 
  Trash2, 
  Save, 
  Truck, 
  ArrowLeft,
  Zap,
  Clock,
  Printer,
  FileText,
  X,
  CreditCard,
  ChevronRight,
  TrendingUp,
  AlertCircle,
  Activity,
  Layers,
  ArrowRight,
  Package,
  Calculator,
  Percent,
  Coins
} from "lucide-react";
import { toast } from "react-toastify";

import { createSalesInvoice, reset } from "@/redux/slices/salesInvoiceSlice";
import Layout from "@/components/shared/Layout/Layout";
import CustomerSelectionModal from "@/components/shared/Modals/CustomerSelectionModal";
import { AppDispatch, RootState } from "@/redux/store";

interface InvoiceItem {
    name: string;
    quantity: number;
    rate: number;
    tax: number;
    amount: number;
}

const SalesInvoiceForm = () => {
    const navigate = useNavigate();
    const dispatch = useDispatch<AppDispatch>();
    const { isLoading, isSuccess, isError, message } = useSelector(
        (state: RootState) => state.salesInvoice
    );

    // Form State
    const [formData, setFormData] = useState({
        invoiceNo: `RES-${Date.now().toString().slice(-6)}`,
        invoiceDate: new Date().toISOString().split("T")[0],
        dueDate: "",
        customer: null as any,
        items: [{ name: "", quantity: 1, rate: 0, tax: 18, amount: 0 }] as InvoiceItem[],
        discount: 0,
        shippingCharges: 0,
        notes: "",
        termsAndConditions: "",
    });

    const [showCustomerModal, setShowCustomerModal] = useState(false);

    useEffect(() => {
        if (isSuccess) {
            toast.success("Revenue Resolution Engine: Protocol synchronized successfully!");
            dispatch(reset());
            navigate("/sales");
        }
        if (isError) {
            toast.error(message || "Protocol decryption failure: Resolution synchronization error");
        }
    }, [isSuccess, isError, message, dispatch, navigate]);

    // Calculations
    const subtotal = useMemo(() => formData.items.reduce((sum, item) => sum + (item.quantity * item.rate), 0), [formData.items]);
    const totalTax = useMemo(() => formData.items.reduce((sum, item) => sum + ((item.quantity * item.rate * item.tax) / 100), 0), [formData.items]);
    const grandTotal = useMemo(() => subtotal + totalTax + Number(formData.shippingCharges) - Number(formData.discount), [subtotal, totalTax, formData.shippingCharges, formData.discount]);

    const updateItem = (index: number, field: keyof InvoiceItem, value: any) => {
        const newItems = [...formData.items];
        (newItems[index] as any)[field] = value;
        const base = (newItems[index].quantity || 0) * (newItems[index].rate || 0);
        newItems[index].amount = base + (base * (newItems[index].tax || 0) / 100);
        setFormData({ ...formData, items: newItems });
    };

    const addItem = () => {
        setFormData({
            ...formData,
            items: [...formData.items, { name: "", quantity: 1, rate: 0, tax: 18, amount: 0 }],
        });
        toast.info("Resolution Engine: Injected new operational asset matrix");
    };

    const removeItem = (index: number) => {
        if (formData.items.length > 1) {
            const newItems = formData.items.filter((_, i) => i !== index);
            setFormData({ ...formData, items: newItems });
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.customer) { toast.error("Protocol Error: Entity identification required"); return; }
        if (formData.items.some(item => !item.name || item.quantity <= 0 || item.rate <= 0)) {
            toast.error("Integrity check failed: Invalid line items in operational matrix");
            return;
        }

        const payload = {
            ...formData,
            customer: formData.customer._id || formData.customer.id,
            totalAmount: grandTotal,
            subtotal,
            tax: totalTax,
            status: "unpaid",
        };

        dispatch(createSalesInvoice(payload));
    };

    const GlassPanel = ({ children, title, icon: Icon, className = "", gradient = "" }: any) => (
        <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`glass-panel border border-white/5 shadow-2xl overflow-hidden relative ${className}`}
        >
            {gradient && <div className={`absolute top-0 right-0 w-32 h-32 ${gradient} opacity-5 rounded-full blur-[40px] -mr-8 -mt-8 pointer-events-none`}></div>}
            {title && (
                <div className="px-8 py-5 border-b border-white/5 bg-white/[0.02] flex items-center justify-between">
                    <h3 className="text-[10px] font-black text-primary uppercase tracking-[0.4em] flex items-center gap-3">
                        {Icon && <Icon className="w-4 h-4" />}
                        {title}
                    </h3>
                    <div className="flex gap-1.5">
                        <div className="w-1.5 h-1.5 bg-primary/40 rounded-full"></div>
                        <div className="w-1.5 h-1.5 bg-primary/20 rounded-full"></div>
                    </div>
                </div>
            )}
            <div className="p-8">{children}</div>
        </motion.div>
    );

    return (
        <Layout>
            <div className="min-h-screen bg-app p-4 lg:p-8 relative overflow-hidden pb-32">
                {/* Visual Background Elements */}
                <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-primary/5 rounded-full blur-[160px] pointer-events-none -mr-48 -mt-48 opacity-20"></div>
                <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-emerald-500/5 rounded-full blur-[140px] pointer-events-none -ml-32 -mb-32 opacity-10"></div>

                <div className="max-w-7xl mx-auto relative z-10 space-y-10">
                    {/* Control Header */}
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
                        <motion.div 
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="space-y-3"
                        >
                            <div className="flex items-center gap-3 text-primary font-black text-[10px] uppercase tracking-[0.5em]">
                                <ShieldCheck className="w-4 h-4" />
                                Operational Protocol: Revenue Generation
                            </div>
                            <h1 className="text-5xl md:text-6xl font-display font-black text-main tracking-tighter uppercase leading-none">
                                Resolution <span className="text-primary italic">Engine</span>
                            </h1>
                            <p className="text-secondary text-base font-medium opacity-60 max-w-xl">High-fidelity industrial billing logic for revenue recognition and capital manifest orchestration.</p>
                        </motion.div>

                        <div className="flex items-center gap-4">
                            <Link to="/sales" className="px-8 py-5 glass-panel border border-white/10 text-secondary hover:text-main transition-all flex items-center gap-3 group">
                                <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                                <span className="text-[10px] font-black uppercase tracking-widest">Abort protocol</span>
                            </Link>
                            <button
                                onClick={handleSubmit}
                                disabled={isLoading}
                                className="px-10 py-5 bg-primary text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.4em] shadow-2xl shadow-primary/40 hover:bg-primary-hover hover:scale-[1.05] active:scale-[0.98] transition-all flex items-center gap-4 disabled:opacity-40"
                            >
                                {isLoading ? <Clock className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                                {isLoading ? 'Synchronizing Lattice...' : 'Authorize Resolution'}
                            </button>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-10">
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                            {/* Primary Configuration */}
                            <div className="lg:col-span-8 space-y-10">
                                {/* Protocol Identifiers */}
                                <div className="grid md:grid-cols-3 gap-8">
                                    <GlassPanel title="Protocol Identity" icon={Receipt} className="md:col-span-1" gradient="bg-primary">
                                        <div className="space-y-2">
                                            <div className="text-[9px] font-black text-secondary uppercase tracking-[0.3em] opacity-40">Resolution Index</div>
                                            <div className="text-2xl font-display font-black text-primary tracking-tighter uppercase italic">{formData.invoiceNo}</div>
                                        </div>
                                    </GlassPanel>
                                    <GlassPanel title="Temporal Projections" icon={Calendar} className="md:col-span-2" gradient="bg-emerald-500">
                                        <div className="grid grid-cols-2 gap-8">
                                            <div className="space-y-3">
                                                <label className="text-[9px] font-black text-secondary uppercase tracking-widest opacity-60">Recognition Date</label>
                                                <input 
                                                    type="date" 
                                                    value={formData.invoiceDate}
                                                    onChange={(e) => setFormData({ ...formData, invoiceDate: e.target.value })}
                                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-5 py-3.5 text-xs font-bold text-main focus:outline-none focus:border-primary/40 transition-all"
                                                />
                                            </div>
                                            <div className="space-y-3">
                                                <label className="text-[9px] font-black text-primary uppercase tracking-widest">Settlement Deadline</label>
                                                <input 
                                                    type="date" 
                                                    value={formData.dueDate}
                                                    onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                                                    className="w-full bg-primary/5 border border-primary/20 rounded-xl px-5 py-3.5 text-xs font-black text-primary focus:outline-none focus:ring-4 focus:ring-primary/5 transition-all"
                                                />
                                            </div>
                                        </div>
                                    </GlassPanel>
                                </div>

                                {/* Entity Identification */}
                                <GlassPanel title="Counterparty Identification" icon={User} gradient="bg-blue-500">
                                    {formData.customer ? (
                                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center justify-between">
                                            <div className="flex items-center gap-8">
                                                <div className="w-20 h-20 bg-primary/10 border border-primary/20 rounded-3xl flex items-center justify-center text-primary font-black text-3xl shadow-inner font-display uppercase italic">
                                                    {formData.customer.name?.charAt(0)}
                                                </div>
                                                <div className="space-y-2">
                                                    <div className="text-3xl font-display font-black text-main uppercase tracking-tight leading-none">{formData.customer.name}</div>
                                                    <div className="flex items-center gap-4">
                                                        <span className="flex items-center gap-2 text-[10px] font-black text-emerald-500 uppercase tracking-widest bg-emerald-500/5 px-3 py-1 rounded-full border border-emerald-500/10">
                                                            <Activity className="w-3 h-3" /> Jurisdiction Verified
                                                        </span>
                                                        <span className="text-[10px] font-bold text-secondary/40 uppercase tracking-wider">{formData.customer.phone}</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <button 
                                                type="button"
                                                onClick={() => setFormData({ ...formData, customer: null })}
                                                className="w-12 h-12 rounded-2xl bg-rose-500/5 hover:bg-rose-500/10 border border-rose-500/10 text-rose-500 flex items-center justify-center transition-all group"
                                            >
                                                <X className="w-6 h-6 group-hover:rotate-90 transition-transform" />
                                            </button>
                                        </motion.div>
                                    ) : (
                                        <motion.button
                                            type="button"
                                            whileHover={{ scale: 1.01 }}
                                            whileTap={{ scale: 0.99 }}
                                            onClick={() => setShowCustomerModal(true)}
                                            className="w-full h-40 border border-dashed border-white/10 rounded-[2.5rem] flex flex-col items-center justify-center gap-4 group hover:border-primary/40 hover:bg-primary/5 transition-all text-secondary"
                                        >
                                            <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                                                <User className="w-8 h-8 opacity-40 group-hover:opacity-100 group-hover:text-primary transition-all" />
                                            </div>
                                            <span className="text-[10px] font-black uppercase tracking-[0.3em] font-display">Identify commercial counterparty</span>
                                        </motion.button>
                                    )}
                                </GlassPanel>

                                {/* Resolution Matrix */}
                                <GlassPanel title="Operational Asset Matrix" icon={Layers}>
                                    <div className="space-y-8">
                                        <div className="overflow-x-auto custom-scrollbar -mx-2 px-2">
                                            <table className="w-full border-separate border-spacing-y-4">
                                                <thead>
                                                    <tr className="text-[8px] font-black text-secondary/40 uppercase tracking-[0.4em] text-left italic">
                                                        <th className="px-6 pb-2">Operational Asset Detail</th>
                                                        <th className="px-6 pb-2 text-right">Magnitude</th>
                                                        <th className="px-6 pb-2 text-right w-40">Unit Scalar (Rate)</th>
                                                        <th className="px-6 pb-2 text-right">Net Resolution</th>
                                                        <th className="px-6 pb-2 w-12 text-center"></th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    <AnimatePresence mode="popLayout">
                                                        {formData.items.map((item, index) => (
                                                            <motion.tr 
                                                                layout
                                                                key={index}
                                                                initial={{ opacity: 0, scale: 0.98 }}
                                                                animate={{ opacity: 1, scale: 1 }}
                                                                exit={{ opacity: 0, scale: 0.98 }}
                                                                className="bg-white/5 rounded-[2rem] border border-white/5 group hover:bg-white/10 transition-all"
                                                            >
                                                                <td className="px-6 py-6 rounded-l-[2rem] min-w-[320px]">
                                                                    <div className="relative">
                                                                        <input 
                                                                            type="text"
                                                                            placeholder="DEFINE OPERATIONAL ASSET OR SERVICE..."
                                                                            value={item.name}
                                                                            onChange={(e) => updateItem(index, 'name', e.target.value)}
                                                                            className="w-full bg-transparent border-none focus:ring-0 p-0 text-sm font-black text-main placeholder:text-secondary/20 uppercase tracking-tighter"
                                                                        />
                                                                        <div className="mt-2 flex items-center gap-3">
                                                                            <span className="text-[8px] font-black text-primary/40 uppercase tracking-widest flex items-center gap-1">
                                                                                <ShieldCheck className="w-2.5 h-2.5" /> Secure Asset
                                                                            </span>
                                                                            <div className="w-1 h-1 bg-white/10 rounded-full"></div>
                                                                            <span className="text-[8px] font-black text-emerald-500/40 uppercase tracking-widest flex items-center gap-1">
                                                                                <activity className="w-2.5 h-2.5" /> High Precision
                                                                            </span>
                                                                        </div>
                                                                    </div>
                                                                </td>
                                                                <td className="px-6 py-6 w-32">
                                                                    <input 
                                                                        type="number"
                                                                        value={item.quantity}
                                                                        onChange={(e) => updateItem(index, 'quantity', Number(e.target.value))}
                                                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-right text-xs font-black text-main focus:outline-none focus:border-primary/40 font-mono"
                                                                    />
                                                                </td>
                                                                <td className="px-6 py-6 font-mono">
                                                                    <div className="relative group/rate">
                                                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[9px] font-black text-secondary/40">₹</span>
                                                                        <input 
                                                                            type="number"
                                                                            value={item.rate}
                                                                            onChange={(e) => updateItem(index, 'rate', Number(e.target.value))}
                                                                            className="w-full bg-white/5 border border-white/10 rounded-xl pl-8 pr-4 py-3 text-right text-xs font-black text-emerald-500 focus:outline-none focus:border-emerald-500/40"
                                                                        />
                                                                    </div>
                                                                </td>
                                                                <td className="px-6 py-6 text-right rounded-r-[2rem]">
                                                                    <div className="text-lg font-display font-black text-main tracking-tighter tabular-nums">₹{item.amount.toLocaleString()}</div>
                                                                    <div className="text-[8px] font-black text-primary/60 uppercase tracking-widest mt-1">Lattice Tax: {item.tax}%</div>
                                                                </td>
                                                                <td className="px-6 py-6 text-center">
                                                                    <button 
                                                                        type="button"
                                                                        onClick={() => removeItem(index)}
                                                                        className="w-10 h-10 rounded-xl bg-rose-500/5 hover:bg-rose-500 text-rose-500/40 hover:text-white flex items-center justify-center transition-all group/del"
                                                                    >
                                                                        <Trash2 className="w-4 h-4 group-hover/del:scale-110 transition-transform" />
                                                                    </button>
                                                                </td>
                                                            </motion.tr>
                                                        ))}
                                                    </AnimatePresence>
                                                </tbody>
                                            </table>
                                        </div>
                                        <button 
                                            type="button"
                                            onClick={addItem}
                                            className="w-full py-5 bg-white/[0.03] border border-dashed border-white/10 hover:border-primary/40 rounded-[2rem] transition-all flex items-center justify-center gap-4 group"
                                        >
                                            <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                                                <Plus className="w-5 h-5 text-primary group-hover:rotate-90 transition-transform duration-500" />
                                            </div>
                                            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-secondary group-hover:text-main">Inject High-Value Asset Manifest</span>
                                        </button>
                                    </div>
                                </GlassPanel>
                            </div>

                            {/* Secondary intelligence */}
                            <div className="lg:col-span-4 space-y-10">
                                <GlassPanel title="Lattice Summary" icon={Zap} className="sticky top-8" gradient="bg-amber-500">
                                    <div className="space-y-8">
                                        <div className="space-y-5">
                                            <div className="flex justify-between items-center px-2">
                                                <span className="text-[9px] font-black text-secondary uppercase tracking-[0.2em] opacity-40">Gross Liquidity</span>
                                                <span className="text-sm font-black text-main font-mono tabular-nums">₹{subtotal.toLocaleString()}</span>
                                            </div>
                                            <div className="flex justify-between items-center px-2">
                                                <span className="text-[9px] font-black text-secondary uppercase tracking-[0.2em] opacity-40">Aggregate Tax</span>
                                                <span className="text-sm font-black text-primary font-mono tabular-nums">₹{totalTax.toLocaleString()}</span>
                                            </div>
                                            
                                            <div className="space-y-3 pt-2">
                                                <label className="text-[9px] font-black text-secondary uppercase tracking-widest opacity-40 flex items-center gap-2"><Truck className="w-3 h-3" /> Logistics Manifest fee</label>
                                                <div className="relative">
                                                     <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-secondary/40">₹</span>
                                                     <input 
                                                        type="number"
                                                        value={formData.shippingCharges}
                                                        onChange={(e) => setFormData({ ...formData, shippingCharges: Number(e.target.value) })}
                                                        className="w-full bg-white/5 border border-white/10 rounded-2xl px-10 py-4 text-sm font-black text-main focus:outline-none focus:border-primary/40 font-mono"
                                                    />
                                                </div>
                                            </div>

                                            <div className="space-y-3">
                                                <label className="text-[9px] font-black text-secondary uppercase tracking-widest opacity-40 flex items-center gap-2"><Percent className="w-3 h-3" /> Yield Reduction (Disc)</label>
                                                <div className="relative">
                                                     <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-rose-500/40">₹</span>
                                                     <input 
                                                        type="number"
                                                        value={formData.discount}
                                                        onChange={(e) => setFormData({ ...formData, discount: Number(e.target.value) })}
                                                        className="w-full bg-rose-500/5 border border-rose-500/20 rounded-2xl px-10 py-4 text-sm font-black text-rose-500 focus:outline-none focus:border-rose-500/50 font-mono"
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        <div className="relative p-8 rounded-[2.5rem] bg-gradient-to-br from-primary/20 via-primary/5 to-transparent border border-primary/20 overflow-hidden group">
                                            <div className="absolute top-0 right-0 w-48 h-48 bg-primary/20 rounded-full blur-[60px] -mr-24 -mt-24 pointer-events-none group-hover:scale-125 transition-transform duration-1000"></div>
                                            <div className="space-y-6 relative z-10">
                                                <div className="flex justify-between items-start">
                                                    <div className="space-y-1">
                                                        <div className="text-[10px] font-black text-primary uppercase tracking-[0.5em]">Net Position</div>
                                                        <div className="text-[8px] font-black text-primary/40 uppercase tracking-widest">Protocol 2036.04 Secure</div>
                                                    </div>
                                                    <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center text-primary shadow-inner">
                                                        <Coins className="w-6 h-6" />
                                                    </div>
                                                </div>
                                                <div className="flex items-baseline gap-2">
                                                    <span className="text-base text-primary font-black pb-1">₹</span>
                                                    <span className="text-5xl font-display font-black text-main tracking-tighter tabular-nums leading-none">
                                                        {grandTotal.toLocaleString()}
                                                    </span>
                                                </div>
                                                <button 
                                                    type="submit"
                                                    disabled={isLoading || formData.items.length === 0}
                                                    className="w-full py-5 bg-primary text-white rounded-[1.5rem] font-black text-[11px] uppercase tracking-[0.5em] shadow-2xl shadow-primary/50 hover:bg-primary-hover hover:scale-[1.05] active:scale-[0.98] transition-all disabled:opacity-40"
                                                >
                                                    {isLoading ? 'Synchronizing Lattices...' : 'Authorize Resolution'}
                                                </button>
                                            </div>
                                        </div>

                                        <div className="space-y-6 pt-4 border-t border-white/5">
                                            <div className="space-y-3">
                                                <label className="text-[9px] font-black text-secondary uppercase tracking-widest opacity-40">Tactical Annotations</label>
                                                <textarea 
                                                    value={formData.notes}
                                                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                                    placeholder="SPECIFY TACTICAL RESOLUTION NOTES..."
                                                    className="w-full bg-white/5 border border-white/10 rounded-[2rem] p-6 text-[11px] font-medium text-main resize-none h-32 placeholder:text-secondary/20 focus:outline-none focus:border-primary/40 transition-all custom-scrollbar uppercase tracking-tight"
                                                />
                                            </div>
                                            <div className="space-y-3">
                                                <label className="text-[9px] font-black text-secondary uppercase tracking-widest opacity-40">Jurisdictional Clauses</label>
                                                <textarea 
                                                    value={formData.termsAndConditions}
                                                    onChange={(e) => setFormData({ ...formData, termsAndConditions: e.target.value })}
                                                    placeholder="DEFINE COMMERCIAL CLAUSES..."
                                                    className="w-full bg-white/5 border border-white/10 rounded-[2rem] p-6 text-[11px] font-medium text-main resize-none h-32 placeholder:text-secondary/20 focus:outline-none focus:border-primary/40 transition-all custom-scrollbar uppercase tracking-tight"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </GlassPanel>
                            </div>
                        </div>
                    </form>
                </div>

                <CustomerSelectionModal
                    isOpen={showCustomerModal}
                    onClose={() => setShowCustomerModal(false)}
                    onSelect={(customer: any) => {
                        setFormData({ ...formData, customer });
                        setShowCustomerModal(false);
                        toast.success(`Protocol Linked: Identification verified for ${customer.name}`);
                    }}
                />

                <style>{`
                    .custom-scrollbar::-webkit-scrollbar { width: 4px; height: 4px; }
                    .custom-scrollbar::-webkit-scrollbar-track { background: rgba(255, 255, 255, 0.01); }
                    .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(var(--color-primary-rgb), 0.2); border-radius: 20px; }
                    .glass-panel { background: rgba(255, 255, 255, 0.03); backdrop-filter: blur(25px); border-radius: 3rem; }
                    .font-display { font-family: 'Outfit', sans-serif; }
                    input:focus, textarea:focus { border-color: rgba(var(--color-primary-rgb), 0.4) !important; box-shadow: 0 0 0 4px rgba(var(--color-primary-rgb), 0.05) !important; }
                `}</style>
            </div>
        </Layout>
    );
};

export default SalesInvoiceForm;

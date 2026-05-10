import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { createSalesInvoice, reset } from "../../../redux/slices/salesInvoiceSlice";
import CustomerSelectionModal from "../../../components/shared/Modals/CustomerSelectionModal";
import { AppDispatch, RootState } from "../../../redux/store";
import { 
    Plus, Trash2, Save, User, Calendar, Receipt, Percent, 
    Truck, FileText, ArrowLeft, Info, ChevronRight, Calculator,
    ShieldCheck, Zap, Briefcase, Clock, IndianRupee, Layers, 
    ArrowRight, Globe, CheckCircle2, AlertCircle, RefreshCw
} from "lucide-react";
import { toast } from "react-toastify";

// Types
interface InvoiceItem {
    name: string;
    quantity: number;
    rate: number;
    tax: number; // Percentage
    amount: number;
}

const SalesInvoiceForm: React.FC = () => {
    const navigate = useNavigate();
    const dispatch = useDispatch<AppDispatch>();
    const { isLoading, isSuccess, isError, message } = useSelector(
        (state: RootState) => state.salesInvoice
    );

    // Form State
    const [formData, setFormData] = useState({
        invoiceNo: `INV-${Date.now().toString().slice(-6)}`,
        invoiceDate: new Date().toISOString().split("T")[0],
        dueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
        customer: null as any,
        items: [] as InvoiceItem[],
        discount: 0,
        shippingCharges: 0,
        notes: "",
        termsAndConditions: "1. Goods once sold will not be taken back.\n2. Interest @18% p.a. will be charged if not paid within due date.",
    });

    const [showCustomerModal, setShowCustomerModal] = useState(false);
    const [hasSubmitted, setHasSubmitted] = useState(false);

    // Reset state on mount
    useEffect(() => {
        dispatch(reset());
    }, [dispatch]);

    // Initialize with one empty item
    useEffect(() => {
        if (formData.items.length === 0) {
            setFormData(prev => ({
                ...prev,
                items: [{ name: "", quantity: 1, rate: 0, tax: 0, amount: 0 }]
            }));
        }
    }, []);

    // Handle Success/Error
    useEffect(() => {
        if (isSuccess && hasSubmitted) {
            toast.success("Invoice generated successfully in the system matrix.");
            dispatch(reset());
            navigate("/sales/register");
        }
        if (isError && hasSubmitted) {
            toast.error(message || "Failed to finalize invoice");
            setHasSubmitted(false);
        }
    }, [isSuccess, isError, message, dispatch, navigate, hasSubmitted]);

    // Calculations
    const calculateItemAmount = (item: InvoiceItem) => {
        const baseAmount = item.quantity * item.rate;
        const taxAmount = (baseAmount * item.tax) / 100;
        return baseAmount + taxAmount;
    };

    const updateItem = (index: number, field: keyof InvoiceItem, value: any) => {
        const newItems = [...formData.items];
        newItems[index] = { ...newItems[index], [field]: value };
        newItems[index].amount = calculateItemAmount(newItems[index]);
        setFormData({ ...formData, items: newItems });
    };

    const addItem = () => {
        setFormData({
            ...formData,
            items: [...formData.items, { name: "", quantity: 1, rate: 0, tax: 0, amount: 0 }],
        });
    };

    const removeItem = (index: number) => {
        if (formData.items.length > 1) {
            const newItems = formData.items.filter((_, i) => i !== index);
            setFormData({ ...formData, items: newItems });
        }
    };

    const calculateSubtotal = () => {
        return formData.items.reduce((sum, item) => sum + (item.quantity * item.rate), 0);
    };

    const calculateTotalTax = () => {
        return formData.items.reduce((sum, item) => sum + ((item.quantity * item.rate * item.tax) / 100), 0);
    };

    const calculateTotal = () => {
        const subtotal = calculateSubtotal();
        const totalTax = calculateTotalTax();
        return subtotal + totalTax + Number(formData.shippingCharges) - Number(formData.discount);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.customer) {
            toast.error("Critical: Customer node must be selected.");
            return;
        }
        if (formData.items.some(item => !item.name || item.quantity <= 0 || item.rate <= 0)) {
            toast.error("Validation failed: Ensure all items have valid quantitative data.");
            return;
        }

        setHasSubmitted(true);
        const payload = {
            ...formData,
            customer: formData.customer._id,
            totalAmount: calculateTotal(),
            subtotal: calculateSubtotal(),
            tax: calculateTotalTax(),
            status: "unpaid",
        };

        dispatch(createSalesInvoice(payload));
    };

    return (
        <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 text-neutral-900 dark:text-white font-sans selection:bg-amber-500/30 overflow-x-hidden flex flex-col transition-colors animate-fade-in relative">
            {/* Ambient Background */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
                <div className="absolute top-[-20%] left-[10%] w-[60%] h-[60%] bg-amber-600/10 rounded-full blur-[150px]" />
                <div className="absolute bottom-[-10%] right-[10%] w-[40%] h-[40%] bg-rose-600/10 rounded-full blur-[150px]" />
            </div>

            <main className="relative z-10 flex-1 flex flex-col max-w-[1600px] w-full mx-auto px-8 py-8 space-y-8">
                {/* Cyber Header */}
                <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    <div className="relative">
                        <div className="absolute -left-4 top-0 bottom-0 w-1 bg-amber-500 rounded-full shadow-[0_0_15px_rgba(245,158,11,0.5)]"></div>
                        <h1 className="text-3xl font-display font-black tracking-tighter text-neutral-900 dark:text-white flex items-center gap-3">
                            Invoice <span className="text-amber-500">Intelligence</span>
                            <span className="px-3 py-1 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-lg text-xs font-bold uppercase tracking-widest">
                                Protocol v2.4
                            </span>
                        </h1>
                        <div className="flex items-center gap-2 mt-1">
                            <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
                            <p className="text-[10px] uppercase tracking-[0.2em] font-black text-neutral-500 dark:text-neutral-400">Ledger Pipeline Ready // Node: {formData.invoiceNo}</p>
                        </div>
                    </div>
                    
                    <div className="flex items-center gap-3 w-full md:w-auto">
                        <Link to="/sales/register" className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-2.5 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-neutral-900 dark:text-white rounded-xl hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-all text-xs font-bold shadow-sm">
                            <ArrowLeft className="w-4 h-4 text-amber-500" /> Back to Registry
                        </Link>
                    </div>
                </header>

                <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    {/* Main Entry Panel */}
                    <div className="lg:col-span-8 space-y-8">
                        
                        {/* Section 1: Transaction Context */}
                        <div className="bg-white dark:bg-neutral-900 rounded-[32px] border border-neutral-200 dark:border-neutral-800 p-8 shadow-sm relative overflow-hidden group">
                            <div className="flex items-center gap-4 mb-8">
                                <div className="w-12 h-12 bg-amber-500/10 rounded-2xl flex items-center justify-center text-amber-500">
                                    <Receipt className="w-6 h-6" />
                                </div>
                                <div>
                                    <h3 className="text-sm font-black text-neutral-900 dark:text-white uppercase tracking-[0.2em]">Transaction Context</h3>
                                    <p className="text-[10px] text-neutral-500 font-black uppercase tracking-widest mt-1">Define temporal and reference parameters</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-neutral-500 uppercase tracking-widest ml-1">Reference ID</label>
                                    <div className="relative group">
                                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-amber-500">
                                            <Layers className="w-4 h-4" />
                                        </div>
                                        <input 
                                            type="text" 
                                            value={formData.invoiceNo}
                                            disabled
                                            className="w-full bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-2xl py-4 pl-12 pr-4 text-sm font-mono font-bold text-neutral-400 cursor-not-allowed"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-neutral-500 uppercase tracking-widest ml-1">Emission Date</label>
                                    <div className="relative group">
                                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-amber-500">
                                            <Calendar className="w-4 h-4" />
                                        </div>
                                        <input 
                                            type="date" 
                                            value={formData.invoiceDate}
                                            onChange={(e) => setFormData({ ...formData, invoiceDate: e.target.value })}
                                            className="w-full bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-2xl py-4 pl-12 pr-4 text-sm font-bold focus:border-amber-500/50 outline-none transition-all dark:text-white"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-neutral-500 uppercase tracking-widest ml-1">Due Threshold</label>
                                    <div className="relative group">
                                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-rose-500">
                                            <Clock className="w-4 h-4" />
                                        </div>
                                        <input 
                                            type="date" 
                                            value={formData.dueDate}
                                            onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                                            className="w-full bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-2xl py-4 pl-12 pr-4 text-sm font-bold focus:border-amber-500/50 outline-none transition-all dark:text-white"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Section 2: Items Matrix */}
                        <div className="bg-white dark:bg-neutral-900 rounded-[32px] border border-neutral-200 dark:border-neutral-800 shadow-sm overflow-hidden flex flex-col group">
                            <div className="p-8 border-b border-neutral-200 dark:border-neutral-800 flex justify-between items-center bg-neutral-50/50 dark:bg-neutral-950/50">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-rose-500/10 rounded-2xl flex items-center justify-center text-rose-500">
                                        <Zap className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-black text-neutral-900 dark:text-white uppercase tracking-[0.2em]">Inventory Matrix</h3>
                                        <p className="text-[10px] text-neutral-500 font-black uppercase tracking-widest mt-1">Process line-item valuations</p>
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    onClick={addItem}
                                    className="flex items-center gap-2 px-6 py-3 bg-amber-500 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-amber-600 transition-all shadow-lg shadow-amber-500/20"
                                >
                                    <Plus className="w-4 h-4" /> Add Asset
                                </button>
                            </div>

                            <div className="overflow-x-auto custom-scrollbar">
                                <table className="w-full text-left">
                                    <thead>
                                        <tr className="border-b border-neutral-200 dark:border-neutral-800 text-[10px] font-black text-neutral-500 dark:text-neutral-400 uppercase tracking-[0.2em] bg-neutral-50/30 dark:bg-neutral-950/30">
                                            <th className="px-8 py-5 min-w-[280px]">Item Definition</th>
                                            <th className="px-4 py-5 w-24 text-center">Qty</th>
                                            <th className="px-4 py-5 w-32 text-right">Unit Rate</th>
                                            <th className="px-4 py-5 w-24 text-center">Tax %</th>
                                            <th className="px-8 py-5 w-32 text-right">Valuation</th>
                                            <th className="px-4 py-5 w-16"></th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                                        {formData.items.map((item, index) => (
                                            <tr key={index} className="hover:bg-amber-500/[0.01] transition-colors group/row">
                                                <td className="px-8 py-5">
                                                    <input
                                                        type="text"
                                                        placeholder="Define inventory item / SKU..."
                                                        value={item.name}
                                                        onChange={(e) => updateItem(index, 'name', e.target.value)}
                                                        className="w-full bg-transparent border-none focus:ring-0 p-0 text-sm font-bold text-neutral-900 dark:text-white placeholder:text-neutral-400 dark:placeholder:text-neutral-700 placeholder:uppercase placeholder:text-[10px] placeholder:tracking-widest"
                                                    />
                                                </td>
                                                <td className="px-4 py-5">
                                                    <input
                                                        type="number"
                                                        min="1"
                                                        value={item.quantity}
                                                        onChange={(e) => updateItem(index, 'quantity', Number(e.target.value))}
                                                        className="w-full bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl py-2 px-2 text-sm text-center font-mono font-bold text-neutral-900 dark:text-white outline-none focus:border-amber-500/50 transition-all"
                                                    />
                                                </td>
                                                <td className="px-4 py-5 text-right">
                                                    <div className="relative">
                                                        <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[10px] text-amber-500 font-bold">₹</span>
                                                        <input
                                                            type="number"
                                                            min="0"
                                                            value={item.rate}
                                                            onChange={(e) => updateItem(index, 'rate', Number(e.target.value))}
                                                            className="w-full bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl py-2 pl-6 pr-2 text-sm text-right font-mono font-bold text-neutral-900 dark:text-white outline-none focus:border-amber-500/50 transition-all"
                                                        />
                                                    </div>
                                                </td>
                                                <td className="px-4 py-5">
                                                    <input
                                                        type="number"
                                                        min="0"
                                                        max="100"
                                                        value={item.tax}
                                                        onChange={(e) => updateItem(index, 'tax', Number(e.target.value))}
                                                        className="w-full bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl py-2 px-2 text-sm text-center font-mono font-bold text-amber-500 outline-none focus:border-amber-500/50 transition-all"
                                                    />
                                                </td>
                                                <td className="px-8 py-5 text-right">
                                                    <span className="text-sm font-black text-neutral-900 dark:text-white font-mono tracking-tighter">₹{item.amount.toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
                                                </td>
                                                <td className="px-4 py-5 text-center">
                                                    <button
                                                        type="button"
                                                        onClick={() => removeItem(index)}
                                                        className="p-2.5 text-neutral-400 hover:text-rose-500 hover:bg-rose-500/10 rounded-xl transition-all"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Section 3: Notes & Compliance */}
                        <div className="bg-white dark:bg-neutral-900 rounded-[32px] border border-neutral-200 dark:border-neutral-800 p-8 shadow-sm">
                            <div className="flex items-center gap-4 mb-8">
                                <div className="w-12 h-12 bg-neutral-500/10 rounded-2xl flex items-center justify-center text-neutral-500">
                                    <Globe className="w-6 h-6" />
                                </div>
                                <div>
                                    <h3 className="text-sm font-black text-neutral-900 dark:text-white uppercase tracking-[0.2em]">Metadata & Compliance</h3>
                                    <p className="text-[10px] text-neutral-500 font-black uppercase tracking-widest mt-1">Legal and internal protocol strings</p>
                                </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-4">
                                    <label className="text-[10px] font-black text-neutral-500 uppercase tracking-widest flex items-center gap-2">
                                        <Info className="w-3.5 h-3.5 text-amber-500" /> Internal Notes
                                    </label>
                                    <textarea
                                        placeholder="Add mission-critical notes for auditing..."
                                        value={formData.notes}
                                        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                        className="w-full p-5 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-[24px] text-xs font-bold min-h-[140px] focus:border-amber-500/50 outline-none transition-all resize-none text-neutral-900 dark:text-white placeholder:text-neutral-400 dark:placeholder:text-neutral-800 shadow-inner"
                                    />
                                </div>
                                <div className="space-y-4">
                                    <label className="text-[10px] font-black text-neutral-500 uppercase tracking-widest flex items-center gap-2">
                                        <ShieldCheck className="w-3.5 h-3.5 text-rose-500" /> Terms & Conditions
                                    </label>
                                    <textarea
                                        placeholder="Define legal framework for this node..."
                                        value={formData.termsAndConditions}
                                        onChange={(e) => setFormData({ ...formData, termsAndConditions: e.target.value })}
                                        className="w-full p-5 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-[24px] text-[11px] font-bold min-h-[140px] focus:border-amber-500/50 outline-none transition-all resize-none text-neutral-500 dark:text-neutral-400 shadow-inner"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Sidebar: Customer & Total */}
                    <div className="lg:col-span-4 space-y-8">
                        
                        {/* Customer Selection Card */}
                        <div className="bg-white dark:bg-neutral-900 rounded-[32px] border border-neutral-200 dark:border-neutral-800 p-8 shadow-sm relative group">
                            <div className="flex justify-between items-center mb-8">
                                <h3 className="text-xs font-black text-neutral-900 dark:text-white uppercase tracking-[0.2em]">B2B Entity Path</h3>
                                {!formData.customer && (
                                    <span className="flex h-2.5 w-2.5 rounded-full bg-rose-500 animate-ping"></span>
                                )}
                            </div>

                            {formData.customer ? (
                                <div className="p-6 bg-amber-500/5 rounded-3xl border border-amber-500/10 relative transition-all hover:bg-amber-500/10">
                                    <div className="flex items-center gap-5">
                                        <div className="w-14 h-14 bg-amber-500 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-amber-500/30">
                                            <User className="w-7 h-7" />
                                        </div>
                                        <div>
                                            <p className="font-black text-neutral-900 dark:text-white text-lg tracking-tighter">{formData.customer.name}</p>
                                            <p className="text-[10px] text-amber-500 font-black uppercase tracking-widest mt-1">ID: {formData.customer._id?.slice(-8).toUpperCase()}</p>
                                        </div>
                                    </div>
                                    <div className="mt-6 pt-6 border-t border-neutral-200 dark:border-neutral-800 space-y-3">
                                        <div className="flex justify-between text-[11px] font-bold">
                                            <span className="text-neutral-400 uppercase tracking-widest">Protocol</span>
                                            <span className="text-neutral-900 dark:text-white">{formData.customer.phone || 'Standard'}</span>
                                        </div>
                                        <div className="flex justify-between text-[11px] font-bold">
                                            <span className="text-neutral-400 uppercase tracking-widest">Tax ID</span>
                                            <span className="text-neutral-900 dark:text-white">{formData.customer.gstin || 'EXEMPT'}</span>
                                        </div>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setShowCustomerModal(true)}
                                        className="w-full mt-6 py-4 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-2xl text-[10px] font-black text-neutral-900 dark:text-white uppercase tracking-widest hover:border-amber-500 transition-all shadow-sm"
                                    >
                                        Switch Entity
                                    </button>
                                </div>
                            ) : (
                                <button
                                    type="button"
                                    onClick={() => setShowCustomerModal(true)}
                                    className="w-full py-16 border-2 border-dashed border-neutral-200 dark:border-neutral-800 rounded-[32px] flex flex-col items-center justify-center gap-5 text-neutral-400 hover:border-amber-500/50 hover:text-amber-500 hover:bg-amber-500/[0.02] transition-all group/btn"
                                >
                                    <div className="w-16 h-16 bg-neutral-100 dark:bg-neutral-800 rounded-2xl flex items-center justify-center group-hover/btn:scale-110 transition-all shadow-inner">
                                        <Plus className="w-8 h-8 opacity-40 group-hover/btn:opacity-100" />
                                    </div>
                                    <span className="font-black text-[10px] uppercase tracking-[0.2em]">Map Customer Node</span>
                                </button>
                            )}
                        </div>

                        {/* Valuation Summary Card */}
                        <div className="bg-white dark:bg-neutral-900 rounded-[32px] border border-neutral-200 dark:border-neutral-800 p-8 shadow-sm relative overflow-hidden">
                            <div className="flex items-center gap-4 mb-8">
                                <div className="w-12 h-12 bg-neutral-100 dark:bg-neutral-800 rounded-2xl flex items-center justify-center text-amber-500">
                                    <Calculator className="w-6 h-6" />
                                </div>
                                <div>
                                    <h3 className="text-xs font-black text-neutral-900 dark:text-white uppercase tracking-[0.2em]">Valuation Engine</h3>
                                    <p className="text-[10px] text-neutral-500 font-black uppercase tracking-widest mt-1">Real-time fiscal computation</p>
                                </div>
                            </div>

                            <div className="space-y-6">
                                <div className="flex justify-between items-center group/item">
                                    <span className="text-[11px] font-black text-neutral-400 uppercase tracking-widest group-hover/item:text-neutral-900 dark:group-hover/item:text-white transition-colors">Subtotal Core</span>
                                    <span className="font-mono font-bold text-neutral-900 dark:text-white">₹{calculateSubtotal().toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
                                </div>
                                <div className="flex justify-between items-center group/item">
                                    <span className="text-[11px] font-black text-neutral-400 uppercase tracking-widest group-hover/item:text-neutral-900 dark:group-hover/item:text-white transition-colors">Tax Accumulation</span>
                                    <span className="font-mono font-bold text-emerald-500">+ ₹{calculateTotalTax().toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
                                </div>
                                
                                <div className="pt-6 border-t border-neutral-100 dark:border-neutral-800 space-y-6">
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black text-neutral-400 uppercase tracking-[0.2em] flex items-center justify-between">
                                            Logistics Adjustment <Truck className="w-4 h-4 text-amber-500" />
                                        </label>
                                        <div className="relative">
                                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[10px] text-amber-500 font-bold">₹</span>
                                            <input
                                                type="number"
                                                value={formData.shippingCharges}
                                                onChange={(e) => setFormData({ ...formData, shippingCharges: Number(e.target.value) })}
                                                className="w-full bg-neutral-100 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-2xl py-4 pl-8 pr-4 text-sm font-mono font-bold text-neutral-900 dark:text-white outline-none focus:border-amber-500/50 transition-all text-right shadow-inner"
                                            />
                                        </div>
                                    </div>
                                    
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black text-neutral-400 uppercase tracking-[0.2em] flex items-center justify-between">
                                            Yield Discount <Percent className="w-4 h-4 text-rose-500" />
                                        </label>
                                        <div className="relative">
                                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[10px] text-rose-500 font-bold">₹</span>
                                            <input
                                                type="number"
                                                value={formData.discount}
                                                onChange={(e) => setFormData({ ...formData, discount: Number(e.target.value) })}
                                                className="w-full bg-neutral-100 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-2xl py-4 pl-8 pr-4 text-sm font-mono font-bold text-rose-500 outline-none focus:border-rose-500/50 transition-all text-right shadow-inner"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-8 p-8 bg-neutral-900 dark:bg-black rounded-3xl relative shadow-2xl group overflow-hidden border border-neutral-800">
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full -mr-16 -mt-16 blur-2xl"></div>
                                    <p className="text-[10px] font-black text-neutral-500 uppercase tracking-[0.3em] mb-2 relative z-10">Net Total Valuation</p>
                                    <h2 className="text-4xl font-display font-black text-white tracking-tighter relative z-10 flex items-baseline gap-2">
                                        <span className="text-amber-500 text-2xl font-mono">₹</span>
                                        {calculateTotal().toLocaleString(undefined, {minimumFractionDigits: 2})}
                                    </h2>
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full mt-8 py-5 bg-amber-500 text-white rounded-2xl font-black text-xs uppercase tracking-[0.3em] shadow-xl shadow-amber-500/20 hover:bg-amber-600 hover:-translate-y-1 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 group/submit"
                            >
                                {isLoading ? (
                                    <>
                                        <div className="w-5 h-5 border-[3px] border-white/20 border-t-white rounded-full animate-spin"></div>
                                        Processing Logic...
                                    </>
                                ) : (
                                    <>
                                        <Save className="w-5 h-5 group-hover/submit:scale-125 transition-all" />
                                        Finalize Registry
                                    </>
                                )}
                            </button>
                        </div>

                        {/* Security Badge */}
                        <div className="flex items-center justify-center gap-4 py-4 px-6 bg-neutral-100 dark:bg-neutral-900/50 rounded-2xl border border-neutral-200 dark:border-neutral-800">
                            <ShieldCheck className="w-5 h-5 text-emerald-500" />
                            <span className="text-[10px] font-black uppercase tracking-widest text-neutral-500">Secured via Ledger Protocol v4.0</span>
                        </div>
                    </div>
                </form>
            </main>

            <CustomerSelectionModal
                isOpen={showCustomerModal}
                onClose={() => setShowCustomerModal(false)}
                onSelect={(customer: any) => {
                    setFormData({ ...formData, customer });
                    setShowCustomerModal(false);
                }}
            />
        </div>
    );
};

export default SalesInvoiceForm;


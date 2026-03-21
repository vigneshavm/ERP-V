import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { createSalesInvoice, reset } from "@/entities/sales/model/salesInvoiceSlice";
import Layout from "@/shared/ui/Layout/Layout";
import PageHeader from "@/shared/ui/Layout/PageHeader";
import PageShell from "@/shared/ui/Layout/PageShell";
import FormInput from "@/shared/ui/Form/Input";
import CustomerSelectionModal from "@/shared/ui/Modals/CustomerSelectionModal";
import { AppDispatch, RootState } from "@/app/store/store";
import { 
    Plus, 
    Trash2, 
    Save, 
    User, 
    Calendar, 
    Receipt, 
    Percent, 
    Truck, 
    FileText, 
    ArrowLeft,
    ChevronDown,
    ShoppingBag,
    CreditCard,
    CheckCircle2
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

const SalesInvoiceForm = () => {
    const navigate = useNavigate();
    const dispatch = useDispatch<AppDispatch>();
    const { isLoading, isSuccess, isError, message } = useSelector(
        (state: RootState) => state.salesInvoice
    );

    // Form State
    const [formData, setFormData] = useState({
        invoiceNo: `INV-${Date.now()}`, 
        invoiceDate: new Date().toISOString().split("T")[0],
        dueDate: "",
        customer: null as any,
        items: [] as InvoiceItem[],
        discount: 0,
        shippingCharges: 0,
        notes: "",
        termsAndConditions: "",
    });

    const [showCustomerModal, setShowCustomerModal] = useState(false);

    // Initialize with one empty item
    useEffect(() => {
        if (formData.items.length === 0) {
            setFormData(prev => ({
                ...prev,
                items: [{ name: "", quantity: 1, rate: 0, tax: 0, amount: 0 }]
            }));
        }
    }, []);

    useEffect(() => {
        if (isSuccess) {
            toast.success("Invoice created successfully!");
            dispatch(reset());
            navigate("/sales"); 
        }
        if (isError) {
            toast.error(message || "Failed to create invoice");
        }
        return () => {
            dispatch(reset());
        };
    }, [isSuccess, isError, message, dispatch, navigate]);

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
            toast.error("Please select a customer");
            return;
        }
        if (formData.items.some(item => !item.name || item.quantity <= 0 || item.rate <= 0)) {
            toast.error("Please ensure all items have valid details");
            return;
        }

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
        <Layout>
            <PageShell className="bg-app flex-1 flex flex-col min-h-0 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <span className="px-2 py-0.5 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-[10px] font-black uppercase tracking-widest rounded-md border border-indigo-500/20">Sales Transaction</span>
                            <span className="text-neutral-300 dark:text-neutral-700">/</span>
                            <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">Register v4.2</span>
                        </div>
                        <h2 className="text-4xl font-black text-neutral-900 dark:text-main tracking-tight leading-none flex items-center gap-3">
                            Sales Register <Receipt className="w-8 h-8 text-indigo-500" />
                        </h2>
                        <div className="flex items-center gap-4 mt-3">
                             <Link
                                to="/sales"
                                className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-neutral-400 hover:text-indigo-500 transition-colors"
                            >
                                <ArrowLeft className="w-4 h-4" /> Back to Summary
                            </Link>
                            <span className="w-1 h-1 rounded-full bg-neutral-300 dark:bg-neutral-800" />
                            <p className="text-sm text-neutral-500 font-medium italic">
                                Draft and issue high-fidelity sales invoices.
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="px-4 py-2 erp-card rounded-xl border-indigo-500/20 bg-indigo-500/[0.03] flex items-center gap-3">
                            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                            <span className="text-[10px] font-black uppercase tracking-widest text-indigo-600 dark:text-indigo-400">Live Sync Active</span>
                        </div>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="flex flex-col gap-8">
                    {/* Top Row: Meta and Customer */}
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                        {/* Section 1: Customer Selection */}
                        <div className="lg:col-span-7 erp-card rounded-[2.5rem] p-8 shadow-sm border-none relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:scale-110 transition-transform duration-700">
                                <User className="w-32 h-32" />
                            </div>
                            
                            <div className="flex justify-between items-center mb-8 relative z-10">
                                <h3 className="text-xs font-black text-neutral-400 uppercase tracking-widest flex items-center gap-3">
                                    <div className="p-2 bg-indigo-500/10 rounded-lg text-indigo-500"><User className="w-4 h-4" /></div>
                                    Customer Intelligence
                                </h3>
                                {formData.customer && (
                                    <button
                                        type="button"
                                        onClick={() => setShowCustomerModal(true)}
                                        className="text-[10px] font-black uppercase tracking-widest text-indigo-500 hover:text-indigo-400 transition-colors"
                                    >
                                        Switch Profile
                                    </button>
                                )}
                            </div>

                            <div className="relative z-10">
                                {formData.customer ? (
                                    <div className="flex items-center justify-between p-6 bg-indigo-500/[0.03] dark:bg-neutral-900/50 rounded-2xl border border-indigo-500/10 group-hover:bg-white dark:group-hover:bg-neutral-900 transition-all">
                                        <div className="flex items-center gap-5">
                                            <div className="w-14 h-14 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-600/20">
                                                <span className="text-xl font-black">{formData.customer.name.charAt(0)}</span>
                                            </div>
                                            <div>
                                                <p className="text-lg font-black text-neutral-900 dark:text-neutral-100 uppercase tracking-tight leading-none mb-1">{formData.customer.name}</p>
                                                <p className="text-[11px] text-neutral-500 font-bold flex items-center gap-2 italic">
                                                    {formData.customer.phone || formData.customer.email || "No contact info"}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex flex-col items-end gap-1">
                                            <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-600 text-[8px] font-black uppercase tracking-widest rounded">Verified</span>
                                            <span className="text-[10px] font-black text-indigo-500 uppercase tracking-tight">VIP Ledger</span>
                                        </div>
                                    </div>
                                ) : (
                                    <div
                                        onClick={() => setShowCustomerModal(true)}
                                        className="border-2 border-dashed border-default rounded-[2rem] p-12 flex flex-col items-center justify-center text-neutral-400 cursor-pointer hover:border-indigo-500/30 hover:bg-indigo-500/[0.02] hover:text-indigo-500 transition-all group/select bg-[var(--erp-bg-sunken)] dark:bg-neutral-900/30"
                                    >
                                        <div className="p-4 bg-white dark:bg-neutral-900 rounded-2xl shadow-sm mb-4 group-hover/select:scale-110 transition-transform border border-default">
                                            <Plus className="w-6 h-6" />
                                        </div>
                                        <span className="text-sm font-black uppercase tracking-[0.2em]">Select Customer Account</span>
                                        <p className="text-[10px] font-bold mt-2 text-neutral-500 uppercase italic">Binding transaction to identity...</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Section 2: Invoice Metadata */}
                        <div className="lg:col-span-5 erp-card rounded-[2.5rem] p-8 shadow-sm border-none bg-neutral-900 text-white relative flex flex-col justify-between group">
                            <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:rotate-12 transition-transform duration-700">
                                <FileText className="w-32 h-32 text-indigo-400" />
                            </div>
                            
                            <div className="relative z-10 flex justify-between items-start">
                                <div>
                                    <h3 className="text-xs font-black text-indigo-400 uppercase tracking-widest mb-1 flex items-center gap-2">
                                        <Receipt className="w-4 h-4" /> Invoice Identity
                                    </h3>
                                    <p className="text-[10px] text-neutral-500 font-bold uppercase tracking-widest italic leading-none">Automated Sequence</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-2xl font-black tracking-tighter leading-none mb-1">{formData.invoiceNo}</p>
                                    <span className="text-[10px] font-black text-indigo-500 uppercase tracking-widest">Serial Master</span>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4 mt-8 relative z-10">
                                <div className="p-4 bg-white/5 rounded-2xl border border-white/10">
                                    <p className="text-[9px] font-black text-neutral-500 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                                        <Calendar className="w-3 h-3 text-indigo-400" /> Issue Date
                                    </p>
                                    <input
                                        type="date"
                                        value={formData.invoiceDate}
                                        onChange={(e) => setFormData({ ...formData, invoiceDate: e.target.value })}
                                        className="bg-transparent border-none p-0 text-sm font-black outline-none w-full text-white cursor-pointer color-scheme-dark"
                                    />
                                </div>
                                <div className="p-4 bg-white/5 rounded-2xl border border-white/10">
                                    <p className="text-[9px] font-black text-neutral-500 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                                        <Calendar className="w-3 h-3 text-rose-400" /> Due Date
                                    </p>
                                    <input
                                        type="date"
                                        value={formData.dueDate}
                                        onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                                        className="bg-transparent border-none p-0 text-sm font-black outline-none w-full text-white cursor-pointer color-scheme-dark"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Section 3: Items Breakdown */}
                    <div className="erp-card rounded-[2.5rem] p-8 shadow-sm border-none overflow-hidden relative group">
                        <div className="flex justify-between items-center mb-8 px-2">
                            <h3 className="text-xs font-black text-neutral-400 uppercase tracking-widest flex items-center gap-3">
                                <div className="p-2 bg-indigo-500/10 rounded-lg text-indigo-500"><ShoppingBag className="w-4 h-4" /></div>
                                Commodity Inventory Breakdown
                            </h3>
                            <button
                                type="button"
                                onClick={addItem}
                                className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-indigo-600/20 hover:scale-105 active:scale-95 transition-all flex items-center gap-2"
                            >
                                <Plus className="w-4 h-4" /> Append Line Item
                            </button>
                        </div>

                        <div className="overflow-x-auto px-1">
                            <table className="w-full text-left border-separate border-spacing-y-3">
                                <thead>
                                    <tr className="text-[10px] font-black text-neutral-400 uppercase tracking-[0.2em]">
                                        <th className="px-6 py-2">Line Item / SKU Details</th>
                                        <th className="px-6 py-2 w-28 text-right">Quantity</th>
                                        <th className="px-6 py-2 w-36 text-right">Unit Rate</th>
                                        <th className="px-6 py-2 w-28 text-right">Tax (%)</th>
                                        <th className="px-6 py-2 w-40 text-right">Net Value</th>
                                        <th className="px-6 py-2 w-16 text-center"></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {formData.items.map((item, index) => (
                                        <tr key={index} className="group/row hover:transform hover:-translate-y-0.5 transition-all duration-300">
                                            <td className="px-2 py-1">
                                                <div className="flex items-center gap-3 bg-[var(--erp-bg-sunken)] dark:bg-neutral-900/50 rounded-2xl p-4 border border-default dark:border-neutral-800 focus-within:ring-1 focus-within:ring-indigo-500/20 focus-within:bg-white dark:focus-within:bg-neutral-900 transition-all">
                                                    <div className="p-2 bg-white dark:bg-neutral-800 rounded-lg text-neutral-400"><FileText className="w-4 h-4" /></div>
                                                    <input
                                                        type="text"
                                                        placeholder="Line item description..."
                                                        value={item.name}
                                                        onChange={(e) => updateItem(index, 'name', e.target.value)}
                                                        className="w-full bg-transparent border-none focus:ring-0 p-0 text-sm font-black uppercase tracking-tight text-neutral-700 dark:text-neutral-200 placeholder:text-neutral-500"
                                                    />
                                                </div>
                                            </td>
                                            <td className="px-2 py-1">
                                                <div className="bg-[var(--erp-bg-sunken)] dark:bg-neutral-900/50 rounded-2xl p-4 border border-default dark:border-neutral-800 focus-within:ring-1 focus-within:ring-indigo-500/20 focus-within:bg-white dark:focus-within:bg-neutral-900 transition-all">
                                                    <input
                                                        type="number"
                                                        min="1"
                                                        value={item.quantity}
                                                        onChange={(e) => updateItem(index, 'quantity', Number(e.target.value))}
                                                        className="w-full bg-transparent border-none focus:ring-0 p-0 text-sm font-black text-right text-neutral-700 dark:text-neutral-100 font-mono"
                                                    />
                                                </div>
                                            </td>
                                            <td className="px-2 py-1">
                                                <div className="bg-[var(--erp-bg-sunken)] dark:bg-neutral-900/50 rounded-2xl p-4 border border-default dark:border-neutral-800 focus-within:ring-1 focus-within:ring-indigo-500/20 focus-within:bg-white dark:focus-within:bg-neutral-900 transition-all">
                                                    <input
                                                        type="number"
                                                        min="0"
                                                        value={item.rate}
                                                        onChange={(e) => updateItem(index, 'rate', Number(e.target.value))}
                                                        className="w-full bg-transparent border-none focus:ring-0 p-0 text-sm font-black text-right text-neutral-700 dark:text-neutral-100 font-mono"
                                                    />
                                                </div>
                                            </td>
                                            <td className="px-2 py-1">
                                                <div className="bg-[var(--erp-bg-sunken)] dark:bg-neutral-900/50 rounded-2xl p-4 border border-default dark:border-neutral-800 focus-within:ring-1 focus-within:ring-indigo-500/20 focus-within:bg-white dark:focus-within:bg-neutral-900 transition-all">
                                                    <input
                                                        type="number"
                                                        min="0"
                                                        max="100"
                                                        value={item.tax}
                                                        onChange={(e) => updateItem(index, 'tax', Number(e.target.value))}
                                                        className="w-full bg-transparent border-none focus:ring-0 p-0 text-sm font-black text-right text-indigo-500 font-mono"
                                                    />
                                                </div>
                                            </td>
                                            <td className="px-6 py-1 text-right">
                                                <span className="text-lg font-black text-neutral-900 dark:text-neutral-100 font-mono italic">
                                                    ₹{item.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                                </span>
                                            </td>
                                            <td className="px-2 py-1 text-center">
                                                <button
                                                    type="button"
                                                    onClick={() => removeItem(index)}
                                                    className="p-3 bg-rose-500/5 hover:bg-rose-500 text-rose-500 hover:text-white rounded-xl transition-all active:scale-90"
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

                    {/* Section 4: Summary & Global Parameters */}
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-8 mb-20">
                        {/* Note/Terms Column */}
                        <div className="md:col-span-7 space-y-6">
                            <div className="erp-card rounded-[2.5rem] p-8 shadow-sm border-none bg-indigo-600 text-white relative group overflow-hidden">
                                <FileText className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-125 transition-transform duration-700 w-32 h-32" />
                                <h3 className="text-xs font-black uppercase tracking-widest mb-6 flex items-center gap-2">
                                    <FileText className="w-4 h-4" /> Legal & Tactical Notes
                                </h3>
                                <div className="space-y-4 relative z-10">
                                    <textarea
                                        placeholder="Add critical internal notes here..."
                                        value={formData.notes}
                                        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                        className="w-full p-5 bg-white/10 border border-white/20 rounded-2xl text-xs font-bold text-white placeholder:text-indigo-200/50 focus:bg-white/15 outline-none resize-none h-24 transition-all"
                                    />
                                    <textarea
                                        placeholder="Terms and conditions for invoice display..."
                                        value={formData.termsAndConditions}
                                        onChange={(e) => setFormData({ ...formData, termsAndConditions: e.target.value })}
                                        className="w-full p-5 bg-white/10 border border-white/20 rounded-2xl text-[10px] font-bold text-indigo-100 placeholder:text-indigo-200/50 focus:bg-white/15 outline-none resize-none h-24 transition-all uppercase tracking-tight"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Totals Column */}
                        <div className="md:col-span-5 flex flex-col gap-6">
                            <div className="erp-card rounded-[2.5rem] p-8 shadow-sm border-none bg-white dark:bg-neutral-900 group">
                                <h3 className="text-xs font-black text-neutral-400 uppercase tracking-widest mb-8 flex items-center gap-2">
                                    <CreditCard className="w-4 h-4 text-indigo-500" /> Fiscal Liquidity Summary
                                </h3>

                                <div className="space-y-5 text-[11px] font-black uppercase tracking-[0.1em]">
                                    <div className="flex justify-between items-center text-neutral-500">
                                        <span>Consolidated Subtotal</span>
                                        <span className="font-mono text-neutral-900 dark:text-neutral-100">₹{calculateSubtotal().toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-indigo-500">
                                        <span>Aggregated Sales Tax</span>
                                        <span className="font-mono">+ ₹{calculateTotalTax().toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                                    </div>
                                    
                                    <div className="h-px bg-default dark:bg-neutral-800 my-2" />

                                    <div className="flex justify-between items-center text-neutral-600 dark:text-neutral-400">
                                        <span className="flex items-center gap-2"><Truck className="w-4 h-4 text-neutral-400" /> Logistics Surcharge</span>
                                        <div className="bg-[var(--erp-bg-sunken)] dark:bg-neutral-800 px-3 py-1 rounded-lg border border-default dark:border-neutral-700">
                                            <input
                                                type="number"
                                                value={formData.shippingCharges}
                                                onChange={(e) => setFormData({ ...formData, shippingCharges: Number(e.target.value) })}
                                                className="w-20 text-right bg-transparent border-none outline-none p-0 font-mono text-neutral-900 dark:text-neutral-100 text-xs"
                                            />
                                        </div>
                                    </div>
                                    <div className="flex justify-between items-center text-rose-500">
                                        <span className="flex items-center gap-2"><Percent className="w-4 h-4 text-rose-400" /> Discretionary Rebate</span>
                                        <div className="bg-rose-500/5 px-3 py-1 rounded-lg border border-rose-500/10">
                                            <input
                                                type="number"
                                                value={formData.discount}
                                                onChange={(e) => setFormData({ ...formData, discount: Number(e.target.value) })}
                                                className="w-20 text-right bg-transparent border-none outline-none p-0 font-mono text-rose-600 dark:text-rose-400 text-xs font-black"
                                            />
                                        </div>
                                    </div>

                                    <div className="pt-6 mt-4 border-t-2 border-dashed border-default dark:border-neutral-800 flex justify-between items-end">
                                        <div>
                                            <span className="text-neutral-400 text-[9px] block mb-1">Total Fiscal Obligation</span>
                                            <span className="text-2xl font-black text-indigo-600 dark:text-indigo-400 tracking-tighter">Grand Total</span>
                                        </div>
                                        <div className="text-right">
                                            <span className="text-4xl font-black text-emerald-500 dark:text-emerald-400 font-mono tracking-tighter italic">
                                                ₹{calculateTotal().toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full py-5 bg-neutral-900 dark:bg-indigo-600 text-white rounded-[2.5rem] font-black uppercase tracking-[0.2em] text-sm shadow-xl shadow-indigo-600/20 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center gap-4 group relative overflow-hidden"
                            >
                                {isLoading ? (
                                    <>
                                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        Finalizing Transaction...
                                    </>
                                ) : (
                                    <>
                                        <CheckCircle2 className="w-6 h-6 text-emerald-400" />
                                        Commit & Issue Invoice
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </form>

                <CustomerSelectionModal
                    isOpen={showCustomerModal}
                    onClose={() => setShowCustomerModal(false)}
                    onSelect={(customer: any) => {
                        setFormData({ ...formData, customer });
                        setShowCustomerModal(false);
                    }}
                />
            </PageShell>
        </Layout>
    );
};

export default SalesInvoiceForm;

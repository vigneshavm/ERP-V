import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { createSalesInvoice, reset } from "@/entities/sales/model/salesInvoiceSlice";
import Layout from "@/shared/ui/Layout/Layout";
import PageHeader from "@/shared/ui/Layout/PageHeader";
import FormInput from "@/shared/ui/Form/Input";
import CustomerSelectionModal from "@/shared/ui/Modals/CustomerSelectionModal";
import { AppDispatch, RootState } from "@/app/store/store";
import { Plus, Trash2, Save, User, Calendar, Receipt, Percent, Truck, FileText, ArrowLeft } from "lucide-react";
import { toast } from "react-toastify";

// Types (Adjust based on your actual types/sales.ts)
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
        // eslint-disable-next-line react-hooks/purity -- TODO(TS-FIX): Phase 2/3 fix
        invoiceNo: `INV-${Date.now()}`, // Temporary ID generation
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
            navigate("/sales"); // Go back to list
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

        // Adapt payload to your API requirements
        const payload = {
            ...formData,
            customer: formData.customer._id, // Assuming customer object has _id
            totalAmount: calculateTotal(),
            subtotal: calculateSubtotal(),
            tax: calculateTotalTax(),
            status: "unpaid", // Default status
            // validUntil: formData.dueDate // Check API field name
        };

        dispatch(createSalesInvoice(payload));
    };

    return (
        <Layout>
            <div className="max-w-5xl mx-auto pb-20 animate-fade-in premium-bg min-h-screen px-4 pt-6">
                <PageHeader
                    title="Create New Invoice"
                    description="Draft and issue a new sales invoice"
                    backButton={
                        <Link
                            to="/sales"
                            className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-indigo-400 transition-colors"
                        >
                            <ArrowLeft className="w-4 h-4" /> Back to Sales
                        </Link>
                    }
                />

                <form onSubmit={handleSubmit} className="space-y-6 mt-6">
                    {/* Section 1: Invoice Details */}
                    <div className="premium-card p-6 shadow-2xl">
                        <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                            <FileText className="w-4 h-4 text-indigo-400" /> Invoice Details
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <FormInput
                                label="Invoice Number"
                                name="invoiceNo"
                                value={formData.invoiceNo}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, invoiceNo: e.target.value })}
                                icon={<Receipt className="w-4 h-4" />}
                                required
                                disabled // Auto-generated usually
                            />
                            <FormInput
                                label="Invoice Date"
                                type="date"
                                name="invoiceDate"
                                value={formData.invoiceDate}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, invoiceDate: e.target.value })}
                                icon={<Calendar className="w-4 h-4" />}
                                required
                            />
                            <FormInput
                                label="Due Date"
                                type="date"
                                name="dueDate"
                                value={formData.dueDate}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, dueDate: e.target.value })}
                                icon={<Calendar className="w-4 h-4" />}
                            />
                        </div>
                    </div>

                    {/* Section 2: Customer Selection */}
                    <div className="premium-card p-6 shadow-2xl">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                                <User className="w-4 h-4 text-indigo-400" /> Customer
                            </h3>
                            {!formData.customer && (
                                <button
                                    type="button"
                                    onClick={() => setShowCustomerModal(true)}
                                    className="text-[10px] font-black uppercase tracking-widest text-indigo-400 hover:text-indigo-300"
                                >
                                    Select Customer
                                </button>
                            )}
                        </div>

                        {formData.customer ? (
                            <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/10">
                                <div>
                                    <p className="font-black text-slate-300 uppercase tracking-tight">{formData.customer.name}</p>
                                    <p className="text-[10px] text-slate-600 font-mono tracking-tighter">{formData.customer.phone || formData.customer.email}</p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setFormData({ ...formData, customer: null })}
                                    className="px-3 py-1.5 bg-white/5 hover:bg-white/10 rounded-lg text-slate-500 text-[10px] font-black uppercase tracking-widest transition-all"
                                >
                                    Change
                                </button>
                            </div>
                        ) : (
                            <div
                                onClick={() => setShowCustomerModal(true)}
                                className="border-2 border-dashed border-white/10 rounded-xl p-8 flex flex-col items-center justify-center text-slate-600 cursor-pointer hover:border-indigo-500/50 hover:text-indigo-400 transition-all bg-white/5"
                            >
                                <User className="w-8 h-8 mb-2" />
                                <span className="text-[10px] font-black uppercase tracking-widest">Click to select a customer</span>
                            </div>
                        )}
                    </div>

                    {/* Section 3: Items */}
                    <div className="premium-card p-6 shadow-2xl overflow-hidden">
                        <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-4">Items Breakdown</h3>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="border-b border-white/10 text-[10px] font-black text-slate-500 uppercase tracking-widest">
                                        <th className="px-4 py-3 min-w-[200px]">Item Name</th>
                                        <th className="px-4 py-3 w-24 text-right">Qty</th>
                                        <th className="px-4 py-3 w-32 text-right">Rate</th>
                                        <th className="px-4 py-3 w-24 text-right">Tax (%)</th>
                                        <th className="px-4 py-3 w-32 text-right">Amount</th>
                                        <th className="px-4 py-3 w-16"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-neutral-200 dark:divide-neutral-700">
                                    {formData.items.map((item, index) => (
                                        <tr key={index} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                                            <td className="px-4 py-3">
                                                <input
                                                    type="text"
                                                    placeholder="Item name/description"
                                                    value={item.name}
                                                    onChange={(e) => updateItem(index, 'name', e.target.value)}
                                                    className="w-full bg-transparent border-none focus:ring-0 p-0 text-sm font-black uppercase tracking-tight text-slate-300 placeholder:text-slate-600"
                                                />
                                            </td>
                                            <td className="px-4 py-3">
                                                <input
                                                    type="number"
                                                    min="1"
                                                    value={item.quantity}
                                                    onChange={(e) => updateItem(index, 'quantity', Number(e.target.value))}
                                                    className="w-full bg-transparent border-none focus:ring-0 p-0 text-sm font-black text-right text-slate-300 font-mono"
                                                />
                                            </td>
                                            <td className="px-4 py-3">
                                                <input
                                                    type="number"
                                                    min="0"
                                                    value={item.rate}
                                                    onChange={(e) => updateItem(index, 'rate', Number(e.target.value))}
                                                    className="w-full bg-transparent border-none focus:ring-0 p-0 text-sm font-black text-right text-slate-300 font-mono"
                                                />
                                            </td>
                                            <td className="px-4 py-3">
                                                <input
                                                    type="number"
                                                    min="0"
                                                    max="100"
                                                    value={item.tax}
                                                    onChange={(e) => updateItem(index, 'tax', Number(e.target.value))}
                                                    className="w-full bg-transparent border-none focus:ring-0 p-0 text-sm font-black text-right text-slate-500 font-mono"
                                                />
                                            </td>
                                            <td className="px-4 py-3 text-right font-black text-indigo-400 font-mono">
                                                ₹{item.amount.toFixed(2)}
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                <button
                                                    type="button"
                                                    onClick={() => removeItem(index)}
                                                    className="text-neutral-400 hover:text-rose-500 transition-colors p-1"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        <button
                            type="button"
                            onClick={addItem}
                            className="mt-4 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-indigo-400 hover:text-indigo-300 transition-colors px-4"
                        >
                            <Plus className="w-4 h-4" /> Add Item
                        </button>
                    </div>

                    {/* Section 4: Summary & Totals */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                            <div className="premium-card p-6 shadow-2xl h-full">
                                <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4">Notes & Terms</h3>
                                <textarea
                                    placeholder="Add notes for the customer..."
                                    value={formData.notes}
                                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                    className="w-full p-3 bg-white/5 border border-white/10 rounded-xl text-xs font-medium text-slate-200 mb-4 focus:ring-1 focus:ring-indigo-500/50 outline-none resize-none h-24 placeholder:text-slate-600"
                                />
                                <textarea
                                    placeholder="Terms and conditions..."
                                    value={formData.termsAndConditions}
                                    onChange={(e) => setFormData({ ...formData, termsAndConditions: e.target.value })}
                                    className="w-full p-3 bg-white/5 border border-white/10 rounded-xl text-xs font-medium text-slate-200 focus:ring-1 focus:ring-indigo-500/50 outline-none resize-none h-24 placeholder:text-slate-600"
                                />
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="premium-card p-6 shadow-2xl">
                                <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4">Payment Summary</h3>

                                <div className="space-y-3 text-[10px] font-black uppercase tracking-widest">
                                    <div className="flex justify-between text-slate-500 text-xs">
                                        <span>Subtotal</span>
                                        <span className="font-mono text-slate-300">₹{calculateSubtotal().toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between text-indigo-400 text-xs">
                                        <span>Tax (Total)</span>
                                        <span className="font-mono">+ ₹{calculateTotalTax().toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-slate-500">
                                        <span className="flex items-center gap-1"><Truck className="w-3.5 h-3.5" /> Shipping</span>
                                        <input
                                            type="number"
                                            value={formData.shippingCharges}
                                            onChange={(e) => setFormData({ ...formData, shippingCharges: Number(e.target.value) })}
                                            className="w-24 text-right bg-transparent border-b border-white/10 focus:border-indigo-400 outline-none p-1 font-mono text-slate-300"
                                        />
                                    </div>
                                    <div className="flex justify-between items-center text-slate-500">
                                        <span className="flex items-center gap-1"><Percent className="w-3.5 h-3.5" /> Discount</span>
                                        <input
                                            type="number"
                                            value={formData.discount}
                                            onChange={(e) => setFormData({ ...formData, discount: Number(e.target.value) })}
                                            className="w-24 text-right bg-transparent border-b border-white/10 focus:border-indigo-400 outline-none p-1 text-rose-400 font-mono"
                                        />
                                    </div>
                                    <div className="border-t border-white/10 pt-4 flex justify-between items-end">
                                        <span className="text-slate-400">Total Payable</span>
                                        <span className="font-black text-3xl font-mono tracking-tighter text-emerald-400">
                                            ₹{calculateTotal().toFixed(2)}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full py-4 bg-indigo-600 text-white rounded-xl font-black uppercase tracking-widest text-lg shadow-2xl shadow-indigo-600/20 hover:bg-indigo-500 transition-all disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center gap-3 overflow-hidden group relative"
                            >
                                <div className="absolute inset-0 bg-white/5 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                                {isLoading ? (
                                    <>Processing</>
                                ) : (
                                    <><Save className="w-6 h-6" /> Save & Create Invoice</>
                                )}
                            </button>
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
                }}
            />
        </Layout>
    );
};

export default SalesInvoiceForm;

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { createSalesInvoice, reset } from "@/redux/slices/salesInvoiceSlice";
import Layout from "@/components/shared/Layout/Layout";
import PageHeader from "@/components/shared/Layout/PageHeader";
import FormInput from "@/components/core/Form/Input";
import CustomerSelectionModal from "@/components/shared/Modals/CustomerSelectionModal"; // Assuming this exists or similar
import { AppDispatch, RootState } from "@/redux/store";
import { Plus, Trash2, Save, User, Calendar, Receipt, Percent, Truck, FileText } from "lucide-react";
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
            <div className="max-w-5xl mx-auto pb-20 animate-fade-in">
                <PageHeader
                    title="Create New Invoice"
                    description="Draft and issue a new sales invoice"
                    backUrl="/sales" // Or /sales/invoice if that's the list
                />

                <form onSubmit={handleSubmit} className="space-y-6 mt-6">
                    {/* Section 1: Invoice Details */}
                    <div className="bg-white dark:bg-neutral-800 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6 shadow-sm">
                        <h3 className="text-lg font-bold text-neutral-800 dark:text-neutral-100 mb-4 flex items-center gap-2">
                            <FileText className="w-5 h-5 text-primary" /> Invoice Details
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <FormInput
                                label="Invoice Number"
                                name="invoiceNo"
                                value={formData.invoiceNo}
                                onChange={(e) => setFormData({ ...formData, invoiceNo: e.target.value })}
                                icon={<Receipt className="w-4 h-4" />}
                                required
                                disabled // Auto-generated usually
                            />
                            <FormInput
                                label="Invoice Date"
                                type="date"
                                name="invoiceDate"
                                value={formData.invoiceDate}
                                onChange={(e) => setFormData({ ...formData, invoiceDate: e.target.value })}
                                icon={<Calendar className="w-4 h-4" />}
                                required
                            />
                            <FormInput
                                label="Due Date"
                                type="date"
                                name="dueDate"
                                value={formData.dueDate}
                                onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                                icon={<Calendar className="w-4 h-4" />}
                            />
                        </div>
                    </div>

                    {/* Section 2: Customer Selection */}
                    <div className="bg-white dark:bg-neutral-800 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6 shadow-sm">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-bold text-neutral-800 dark:text-neutral-100 flex items-center gap-2">
                                <User className="w-5 h-5 text-primary" /> Customer
                            </h3>
                            {!formData.customer && (
                                <button
                                    type="button"
                                    onClick={() => setShowCustomerModal(true)}
                                    className="text-sm font-medium text-primary hover:underline"
                                >
                                    Select Customer
                                </button>
                            )}
                        </div>

                        {formData.customer ? (
                            <div className="flex items-center justify-between p-4 bg-neutral-50 dark:bg-neutral-900 rounded-lg border border-neutral-200 dark:border-neutral-700">
                                <div>
                                    <p className="font-bold text-neutral-900 dark:text-neutral-100">{formData.customer.name}</p>
                                    <p className="text-sm text-neutral-500">{formData.customer.phone || formData.customer.email}</p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setFormData({ ...formData, customer: null })}
                                    className="p-2 hover:bg-neutral-200 dark:hover:bg-neutral-800 rounded-md text-neutral-500"
                                >
                                    Change
                                </button>
                            </div>
                        ) : (
                            <div
                                onClick={() => setShowCustomerModal(true)}
                                className="border-2 border-dashed border-neutral-300 dark:border-neutral-700 rounded-lg p-8 flex flex-col items-center justify-center text-neutral-400 cursor-pointer hover:border-primary hover:text-primary transition-colors"
                            >
                                <User className="w-8 h-8 mb-2" />
                                <span className="font-medium">Click to select a customer</span>
                            </div>
                        )}
                    </div>

                    {/* Section 3: Items */}
                    <div className="bg-white dark:bg-neutral-800 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6 shadow-sm overflow-hidden">
                        <h3 className="text-lg font-bold text-neutral-800 dark:text-neutral-100 mb-4">Items</h3>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="border-b border-neutral-200 dark:border-neutral-700 text-xs font-semibold text-neutral-500 uppercase">
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
                                        <tr key={index}>
                                            <td className="px-4 py-3">
                                                <input
                                                    type="text"
                                                    placeholder="Item name/description"
                                                    value={item.name}
                                                    onChange={(e) => updateItem(index, 'name', e.target.value)}
                                                    className="w-full bg-transparent border-none focus:ring-0 p-0 text-sm font-medium placeholder:text-neutral-400"
                                                />
                                            </td>
                                            <td className="px-4 py-3">
                                                <input
                                                    type="number"
                                                    min="1"
                                                    value={item.quantity}
                                                    onChange={(e) => updateItem(index, 'quantity', Number(e.target.value))}
                                                    className="w-full bg-transparent border-none focus:ring-0 p-0 text-sm text-right"
                                                />
                                            </td>
                                            <td className="px-4 py-3">
                                                <input
                                                    type="number"
                                                    min="0"
                                                    value={item.rate}
                                                    onChange={(e) => updateItem(index, 'rate', Number(e.target.value))}
                                                    className="w-full bg-transparent border-none focus:ring-0 p-0 text-sm text-right"
                                                />
                                            </td>
                                            <td className="px-4 py-3">
                                                <input
                                                    type="number"
                                                    min="0"
                                                    max="100"
                                                    value={item.tax}
                                                    onChange={(e) => updateItem(index, 'tax', Number(e.target.value))}
                                                    className="w-full bg-transparent border-none focus:ring-0 p-0 text-sm text-right text-neutral-500"
                                                />
                                            </td>
                                            <td className="px-4 py-3 text-right font-medium text-neutral-900 dark:text-neutral-100">
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
                            className="mt-4 flex items-center gap-2 text-sm font-bold text-primary hover:text-primary-hover transition-colors px-4" // Added px-4 for alignment if needed
                        >
                            <Plus className="w-4 h-4" /> Add Item
                        </button>
                    </div>

                    {/* Section 4: Summary & Totals */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                            <div className="bg-white dark:bg-neutral-800 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6 shadow-sm h-full">
                                <h3 className="text-sm font-bold text-neutral-500 uppercase mb-4">Notes & Terms</h3>
                                <textarea
                                    placeholder="Add notes for the customer..."
                                    value={formData.notes}
                                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                    className="w-full p-3 bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-lg text-sm mb-4 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none resize-none h-24"
                                />
                                <textarea
                                    placeholder="Terms and conditions..."
                                    value={formData.termsAndConditions}
                                    onChange={(e) => setFormData({ ...formData, termsAndConditions: e.target.value })}
                                    className="w-full p-3 bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none resize-none h-24"
                                />
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="bg-white dark:bg-neutral-800 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6 shadow-sm">
                                <h3 className="text-sm font-bold text-neutral-500 uppercase mb-4">Payment Summary</h3>

                                <div className="space-y-3 text-sm">
                                    <div className="flex justify-between text-neutral-600 dark:text-neutral-400">
                                        <span>Subtotal</span>
                                        <span>₹{calculateSubtotal().toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between text-neutral-600 dark:text-neutral-400">
                                        <span>Tax (Total)</span>
                                        <span>+ ₹{calculateTotalTax().toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-neutral-600 dark:text-neutral-400">
                                        <span className="flex items-center gap-1"><Truck className="w-3 h-3" /> Shipping</span>
                                        <input
                                            type="number"
                                            value={formData.shippingCharges}
                                            onChange={(e) => setFormData({ ...formData, shippingCharges: Number(e.target.value) })}
                                            className="w-24 text-right bg-transparent border-b border-neutral-300 dark:border-neutral-700 focus:border-primary outline-none p-1"
                                        />
                                    </div>
                                    <div className="flex justify-between items-center text-neutral-600 dark:text-neutral-400">
                                        <span className="flex items-center gap-1"><Percent className="w-3 h-3" /> Discount</span>
                                        <input
                                            type="number"
                                            value={formData.discount}
                                            onChange={(e) => setFormData({ ...formData, discount: Number(e.target.value) })}
                                            className="w-24 text-right bg-transparent border-b border-neutral-300 dark:border-neutral-700 focus:border-primary outline-none p-1 text-rose-500"
                                        />
                                    </div>
                                    <div className="border-t border-neutral-200 dark:border-neutral-700 pt-3 flex justify-between items-center font-bold text-lg text-neutral-900 dark:text-neutral-100">
                                        <span>Total Amount</span>
                                        <span>₹{calculateTotal().toFixed(2)}</span>
                                    </div>
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full py-4 bg-primary text-white rounded-xl font-bold text-lg shadow-lg hover:bg-primary-hover hover:shadow-primary/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {isLoading ? (
                                    <>Processing...</>
                                ) : (
                                    <><Save className="w-5 h-5" /> Save & Create Invoice</>
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

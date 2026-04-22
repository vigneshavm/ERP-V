import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from "@/services/api";
import { toast } from 'react-toastify';
import Layout from "@/components/shared/Layout/Layout";
import PageHeader from "@/components/shared/Layout/PageHeader";
import FormInput from "@/components/core/Form/Input";
import CustomerSelectionModal from "@/components/shared/Modals/CustomerSelectionModal";
import ItemSelectionModal from "@/components/shared/Modals/ItemSelectionModal";
import type { SalesOrder, SalesOrderItem, Customer } from '@/types/sales';

const SalesOrderPage = () => {
    const navigate = useNavigate();
    const [showCustomerModal, setShowCustomerModal] = useState(false);
    const [showItemModal, setShowItemModal] = useState(false);
    const [loading, setLoading] = useState(false);

    // Using a shape compatible with SalesOrder but allowing for form state
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

    const addItemFromModal = (item: any) => {
        const existingIndex = formData.items.findIndex((i) => i.item === item._id);

        if (existingIndex >= 0) {
            // Update quantity if item already exists
            const newItems = [...formData.items];
            newItems[existingIndex].quantity += item.quantity || 1;
            setFormData({ ...formData, items: newItems });
        } else {
            // Add new item
            const newItem: SalesOrderItem = {
                item: item._id,
                name: item.name,
                quantity: item.quantity || 1,
                rate: item.sellingPrice || 0,
                tax: 18,
                discount: 0,
                availableStock: item.stockQty - (item.reservedStock || 0)
            };

            setFormData({
                ...formData,
                items: [...formData.items, newItem]
            });
        }
    };

    const updateItem = (index: number, field: keyof SalesOrderItem, value: number) => {
        const newItems = [...formData.items];
        // @ts-ignore - Dynamic key assignment
        newItems[index][field] = value;
        setFormData({ ...formData, items: newItems });
    };

    const removeItem = (index: number) => {
        const newItems = formData.items.filter((_, i) => i !== index);
        setFormData({ ...formData, items: newItems });
    };

    const calculateItemTotal = (item: SalesOrderItem) => {
        const subtotal = item.quantity * item.rate;
        const taxAmount = (subtotal * item.tax) / 100;
        return subtotal + taxAmount - item.discount;
    };

    const calculateSubtotal = () => {
        return formData.items.reduce((sum, item) => sum + (item.quantity * item.rate), 0);
    };

    const calculateTax = () => {
        return formData.items.reduce((sum, item) => {
            const subtotal = item.quantity * item.rate;
            return sum + (subtotal * item.tax / 100);
        }, 0);
    };

    const calculateItemDiscount = () => {
        return formData.items.reduce((sum, item) => sum + (item.discount || 0), 0);
    };

    const calculateTotal = () => {
        return calculateSubtotal() + calculateTax() - calculateItemDiscount() - formData.discount;
    };

    const validateForm = () => {
        if (!formData.customer) {
            toast.error('Please select a customer');
            return false;
        }

        if (formData.items.length === 0) {
            toast.error('Please add at least one item');
            return false;
        }

        if (!formData.expectedDeliveryDate) {
            toast.error('Please select expected delivery date');
            return false;
        }

        // Validate stock availability
        for (const item of formData.items) {
            if (item.availableStock !== undefined && item.quantity > item.availableStock) {
                toast.error(`Insufficient available stock for ${item.name}. Available: ${item.availableStock}`);
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
            const token = user?.token;
            // Ensure customer is not null (validated in validateForm)
            if (!formData.customer) return;

            const payload = {
                customerId: formData.customer.id || formData.customer._id,
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

            const response = await api.post(
                `/api/sales-orders`,
                payload,
                { headers: { Authorization: `Bearer ${token}` } }
            );

            toast.success('Sales Order saved as draft successfully!');
            navigate('/sales/sales-order-list');
        } catch (error: any) {
            console.error('Error saving sales order:', error);
            toast.error(error.response?.data?.message || 'Failed to save sales order');
        } finally {
            setLoading(false);
        }
    };

    const handleConfirmOrder = async () => {
        if (!validateForm()) return;

        setLoading(true);
        try {
            const user = JSON.parse(localStorage.getItem('user') || '{}');
            const token = user?.token;

            if (!formData.customer) return;

            // First create the order
            const payload = {
                customerId: formData.customer.id || formData.customer._id,
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

            const createResponse = await api.post(
                `/api/sales-orders`,
                payload,
                { headers: { Authorization: `Bearer ${token}` } }
            );

            const orderId = createResponse.data.salesOrder._id;

            // Then confirm it
            await api.post(
                `/api/sales-orders/${orderId}/confirm`,
                {},
                { headers: { Authorization: `Bearer ${token}` } }
            );

            toast.success('Sales Order confirmed successfully! Stock reserved.');
            navigate('/sales/sales-order-list');
        } catch (error: any) {
            console.error('Error confirming sales order:', error);
            toast.error(error.response?.data?.message || 'Failed to confirm sales order');
        } finally {
            setLoading(false);
        }
    };

    const statusOptions = [
        { value: 'Draft', label: 'Draft', color: 'bg-gray-100 text-gray-800' },
        { value: 'Confirmed', label: 'Confirmed', color: 'bg-blue-100 text-blue-800' },
        { value: 'Partially Delivered', label: 'Partially Delivered', color: 'bg-purple-100 text-purple-800' },
        { value: 'Delivered', label: 'Delivered', color: 'bg-indigo-100 text-indigo-800' },
        { value: 'Partially Invoiced', label: 'Partially Invoiced', color: 'bg-yellow-100 text-yellow-800' },
        { value: 'Invoiced', label: 'Invoiced', color: 'bg-green-100 text-green-800' },
        { value: 'Cancelled', label: 'Cancelled', color: 'bg-red-100 text-red-800' }
    ];

    // Helper to calculate total tax amount for display
    const totalTaxAmount = calculateTax();
    const subTotalAmount = calculateSubtotal();
    const totalDiscountAmount = calculateItemDiscount();
    const finalTotalAmount = calculateTotal();

    return (
        <Layout>
            <div className="flex flex-col h-[calc(100vh-theme(spacing.16))] bg-surface/40 animate-fade-in">
                {/* ERP Header Action Bar */}
                <div className="glass-panel border-b border-default/30 px-6 py-4 flex items-center justify-between shadow-sm shrink-0 z-10">
                    <div>
                        <h1 className="text-2xl font-bold text-main tracking-tight">Sales Order</h1>
                        <p className="text-sm text-secondary opacity-70 mt-0.5">Manage customer orders and reservations</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => navigate('/sales/sales-order-list')}
                            className="px-4 py-2 text-sm font-medium text-main opacity-90 glass-panel border border-default/40 rounded-lg hover:bg-surface/40 transition-colors shadow-sm"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSaveDraft}
                            disabled={loading}
                            className="px-4 py-2 text-sm font-medium text-primary bg-primary/10 border border-indigo-200 rounded-lg hover:bg-primary/20 disabled:opacity-50 transition-colors shadow-sm"
                        >
                            {loading ? 'Saving...' : 'Save Draft'}
                        </button>
                        <button
                            onClick={handleConfirmOrder}
                            disabled={loading}
                            className="px-6 py-2 text-sm font-medium text-white bg-emerald-600 border border-transparent rounded-lg shadow-sm hover:bg-emerald-700 focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 disabled:opacity-50 flex items-center gap-2 transition-all"
                        >
                            {loading ? (
                                <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                            ) : (
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                            )}
                            {loading ? 'Processing...' : 'Confirm Order'}
                        </button>
                    </div>
                </div>

                {/* Main Content Scrollable Area */}
                <div className="flex-1 overflow-auto p-6">
                    <div className="max-w-7xl mx-auto space-y-6 pb-10">
                        {/* Top Section: Order Info & Customer */}
                        <div className="glass-panel border border-default/30 rounded-xl shadow-sm overflow-hidden">
                            <div className="bg-surface/30 px-6 py-3 border-b border-default/20 flex justify-between items-center">
                                <h2 className="text-xs font-bold text-secondary opacity-70 uppercase tracking-wider">Order Information</h2>
                                <div className="text-xs font-bold text-secondary opacity-70 glass-panel px-2.5 py-1 rounded-md border border-default/30 shadow-sm">
                                    DRAFT MODE
                                </div>
                            </div>
                            <div className="p-6 grid grid-cols-1 md:grid-cols-4 gap-8">
                                {/* Column 1: Dates */}
                                <div className="space-y-5">
                                    <div>
                                        <label className="block text-xs font-bold text-secondary opacity-70 mb-1.5 uppercase">Order Date <span className="text-red-500">*</span></label>
                                        <input
                                            type="date"
                                            value={formData.orderDate}
                                            onChange={(e) => setFormData({ ...formData, orderDate: e.target.value })}
                                            className="w-full px-3 py-2 border border-default/40 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-primary shadow-sm"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-secondary opacity-70 mb-1.5 uppercase">Expected Delivery <span className="text-red-500">*</span></label>
                                        <input
                                            type="date"
                                            value={formData.expectedDeliveryDate}
                                            onChange={(e) => setFormData({ ...formData, expectedDeliveryDate: e.target.value })}
                                            className="w-full px-3 py-2 border border-default/40 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-primary shadow-sm"
                                        />
                                    </div>
                                </div>

                                {/* Column 2: Empty Spacer or Additional Meta */}
                                <div className="hidden md:block"></div>

                                {/* Column 3 & 4: Customer Panel */}
                                <div className="md:col-span-2 border border-default/30 rounded-xl bg-surface/30 p-4 relative group hover:border-indigo-300 transition-colors">
                                    <label className="block text-xs font-bold text-primary mb-3 uppercase tracking-wider">Customer Details</label>
                                    {formData.customer ? (
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <p className="font-bold text-main text-base">{formData.customer.name}</p>
                                                {/* @ts-ignore - address might be string or object */}
                                                <p className="text-sm text-secondary mt-1">{formData.customer.address?.line1 || typeof formData.customer.address === 'string' ? formData.customer.address : ''}, {formData.customer.address?.city}</p>
                                                <div className="flex gap-4 mt-3 text-xs font-medium text-secondary opacity-70">
                                                    <span className="flex items-center gap-1">
                                                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                                                        {formData.customer.phone}
                                                    </span>
                                                    {formData.customer.email && (
                                                        <span className="flex items-center gap-1">
                                                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                                                            {formData.customer.email}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => setFormData({ ...formData, customer: null })}
                                                className="text-danger hover:text-red-700 text-xs font-medium border border-red-200 glass-panel px-3 py-1.5 rounded-lg hover:bg-danger/10 transition-colors shadow-sm"
                                            >
                                                Change
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="h-full flex flex-col items-center justify-center gap-3 py-4">
                                            <div className="p-3 glass-panel rounded-full shadow-sm">
                                                <svg className="w-6 h-6 text-secondary opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                                            </div>
                                            <p className="text-sm font-medium text-secondary opacity-70">No customer selected</p>
                                            <button
                                                onClick={() => setShowCustomerModal(true)}
                                                className="px-4 py-2 bg-primary text-white text-xs font-bold uppercase tracking-wider rounded-lg hover:bg-primary-hover shadow-sm flex items-center gap-2 transition-all"
                                            >
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                                                Find Customer
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Items Section - Dense Table with Calculations */}
                        <div className="glass-panel border border-default/30 rounded-xl shadow-sm overflow-hidden flex flex-col min-h-[300px]">
                            <div className="px-6 py-3 border-b border-default/20 bg-surface/30 flex justify-between items-center">
                                <h2 className="text-xs font-bold text-secondary opacity-70 uppercase tracking-wider">Line Items</h2>
                                <button
                                    onClick={() => setShowItemModal(true)}
                                    className="px-4 py-2 bg-emerald-600 text-white text-xs font-bold uppercase tracking-wider rounded-lg hover:bg-emerald-700 flex items-center gap-2 shadow-sm transition-all"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
                                    Add Product
                                </button>
                            </div>

                            <div className="flex-1 overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-surface/40 border-b border-default/30 text-xs font-bold text-secondary opacity-70 uppercase tracking-wider">
                                            <th className="px-4 py-3 border-r border-default/30 w-12 text-center">#</th>
                                            <th className="px-4 py-3 border-r border-default/30">Product</th>
                                            <th className="px-4 py-3 border-r border-default/30 w-28 text-right">Qty</th>
                                            <th className="px-4 py-3 border-r border-default/30 w-32 text-right">Rate</th>
                                            <th className="px-4 py-3 border-r border-default/30 w-24 text-right">Tax %</th>
                                            <th className="px-4 py-3 border-r border-default/30 w-28 text-right">Disc</th>
                                            <th className="px-4 py-3 border-r border-default/30 w-32 text-right">Total</th>
                                            <th className="px-4 py-3 w-12 text-center"></th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-default/20">
                                        {formData.items.length === 0 ? (
                                            <tr>
                                                <td colSpan={8} className="px-4 py-16 text-center text-secondary opacity-50">
                                                    <div className="flex flex-col items-center gap-2">
                                                        <svg className="w-8 h-8 text-secondary opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>
                                                        <p className="text-sm font-medium">No items added yet</p>
                                                        <p className="text-xs">Select products to build your order</p>
                                                    </div>
                                                </td>
                                            </tr>
                                        ) : (
                                            formData.items.map((item, index) => (
                                                <tr key={index} className="hover:bg-surface/40/80 group transition-colors">
                                                    <td className="px-4 py-2 text-xs text-secondary opacity-70 text-center border-r border-default/20 bg-surface/40/30">
                                                        {index + 1}
                                                    </td>
                                                    <td className="px-4 py-2 border-r border-default/20 max-w-xs">
                                                        <p className="text-sm font-semibold text-main truncate">{item.name}</p>
                                                        <p className="text-[10px] uppercase font-bold text-secondary opacity-50 mt-0.5">Stock: {item.availableStock}</p>
                                                    </td>
                                                    <td className="px-4 py-2 border-r border-default/20 text-right p-1.5">
                                                        <input
                                                            type="number"
                                                            min="1"
                                                            max={item.availableStock}
                                                            value={item.quantity}
                                                            onChange={(e) => updateItem(index, 'quantity', parseFloat(e.target.value) || 0)}
                                                            className="w-full text-right px-2 py-1.5 text-sm border border-default/30 rounded-md focus:ring-2 focus:ring-primary focus:border-primary transition-all font-medium"
                                                        />
                                                    </td>
                                                    <td className="px-4 py-2 border-r border-default/20 text-right p-1.5">
                                                        <input
                                                            type="number"
                                                            value={item.rate}
                                                            onChange={(e) => updateItem(index, 'rate', parseFloat(e.target.value) || 0)}
                                                            className="w-full text-right px-2 py-1.5 text-sm border border-default/30 rounded-md focus:ring-2 focus:ring-primary focus:border-primary transition-all font-medium"
                                                        />
                                                    </td>
                                                    <td className="px-4 py-2 border-r border-default/20 text-right p-1.5">
                                                        <select
                                                            value={item.tax}
                                                            onChange={(e) => updateItem(index, 'tax', parseFloat(e.target.value))}
                                                            className="w-full text-right px-1 py-1.5 text-sm border border-default/30 rounded-md focus:ring-2 focus:ring-primary focus:border-primary transition-all glass-panel"
                                                        >
                                                            <option value="0">0%</option>
                                                            <option value="5">5%</option>
                                                            <option value="12">12%</option>
                                                            <option value="18">18%</option>
                                                            <option value="28">28%</option>
                                                        </select>
                                                    </td>
                                                    <td className="px-4 py-2 border-r border-default/20 text-right p-1.5">
                                                        <input
                                                            type="number"
                                                            value={item.discount}
                                                            onChange={(e) => updateItem(index, 'discount', parseFloat(e.target.value) || 0)}
                                                            className="w-full text-right px-2 py-1.5 text-sm border border-default/30 rounded-md focus:ring-2 focus:ring-primary focus:border-primary transition-all"
                                                        />
                                                    </td>
                                                    <td className="px-4 py-2 border-r border-default/20 text-right font-bold text-main opacity-90">
                                                        ₹{calculateItemTotal(item).toFixed(2)}
                                                    </td>
                                                    <td className="px-4 py-2 text-center">
                                                        <button
                                                            onClick={() => removeItem(index)}
                                                            className="text-secondary opacity-50 hover:text-danger transition-colors p-1.5 hover:bg-danger/10 rounded-lg"
                                                            title="Remove Item"
                                                        >
                                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                            </svg>
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                    {formData.items.length > 0 && (
                                        <tfoot className="bg-surface/30 border-t border-default/30">
                                            <tr>
                                                <td colSpan={6} className="px-4 py-3 text-xs text-right text-secondary opacity-70 uppercase font-bold border-r border-default/30">Subtotal</td>
                                                <td className="px-4 py-3 text-sm text-right font-bold text-main opacity-90 border-r border-default/30">₹{subTotalAmount.toFixed(2)}</td>
                                                <td></td>
                                            </tr>
                                            <tr>
                                                <td colSpan={6} className="px-4 py-3 text-xs text-right text-secondary opacity-70 uppercase font-bold border-r border-default/30">Total Tax</td>
                                                <td className="px-4 py-3 text-sm text-right font-bold text-main opacity-90 border-r border-default/30">₹{totalTaxAmount.toFixed(2)}</td>
                                                <td></td>
                                            </tr>
                                        </tfoot>
                                    )}
                                </table>
                            </div>
                        </div>

                        {/* Bottom Section: Notes & Final Totals */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            {/* Notes Panel */}
                            <div className="md:col-span-2 glass-panel border border-default/30 rounded-xl shadow-sm overflow-hidden flex flex-col">
                                <div className="bg-surface/30 px-6 py-3 border-b border-default/20">
                                    <h2 className="text-xs font-bold text-secondary opacity-70 uppercase tracking-wider">Terms & Notes</h2>
                                </div>
                                <div className="p-4 flex-1">
                                    <textarea
                                        value={formData.notes}
                                        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                        rows={4}
                                        className="w-full h-full px-4 py-3 border border-default/40 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-primary resize-none placeholder:text-secondary opacity-50"
                                        placeholder="Add payment terms, delivery instructions, or general remarks..."
                                    />
                                </div>
                            </div>

                            {/* Final Calculations Panel */}
                            <div className="glass-panel border border-indigo-100 rounded-xl shadow-sm overflow-hidden flex flex-col">
                                <div className="bg-primary/10/50 px-6 py-3 border-b border-indigo-100">
                                    <h2 className="text-xs font-bold text-indigo-800 uppercase tracking-wider">Order Summary</h2>
                                </div>
                                <div className="p-6 space-y-4 flex-1">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-secondary opacity-70 font-medium">Subtotal</span>
                                        <span className="font-bold text-main">₹{subTotalAmount.toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-secondary opacity-70 font-medium">Item Discounts</span>
                                        <span className="font-bold text-danger">-₹{totalDiscountAmount.toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-secondary opacity-70 font-medium">Tax</span>
                                        <span className="font-bold text-main">₹{totalTaxAmount.toFixed(2)}</span>
                                    </div>
                                    <div className="border-t border-default/20 pt-4 mt-2">
                                        <div className="flex justify-between items-center mb-2">
                                            <span className="text-sm font-bold text-secondary">Additional Discount</span>
                                            <input
                                                type="number"
                                                value={formData.discount}
                                                onChange={(e) => setFormData({ ...formData, discount: parseFloat(e.target.value) || 0 })}
                                                className="w-24 text-right px-3 py-1.5 text-sm border border-default/40 rounded-lg focus:ring-2 focus:ring-primary font-medium"
                                            />
                                        </div>
                                    </div>
                                </div>
                                <div className="bg-slate-800 px-6 py-5 flex justify-between items-center text-white">
                                    <span className="text-lg font-bold tracking-tight">Net Total</span>
                                    <span className="text-2xl font-bold tracking-tight">₹{finalTotalAmount.toFixed(2)}</span>
                                </div>
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
            </div>
        </Layout>
    );
};

export default SalesOrderPage;


import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import api from "@/services/api";
import { toast } from 'react-toastify';
import {
    ShoppingCart,
    User,
    Plus,
    Trash2,
    Save,
    ArrowLeft,
    Clock,
    ChevronRight,
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
    Truck,
    Package
} from 'lucide-react';
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

    const addItemFromModal = (item: any) => {
        const existingIndex = formData.items.findIndex((i) => i.item === item._id);

        if (existingIndex >= 0) {
            const newItems = [...formData.items];
            newItems[existingIndex].quantity += item.quantity || 1;
            setFormData({ ...formData, items: newItems });
            toast.info(`Updated quantity for ${item.name}`);
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

            setFormData({
                ...formData,
                items: [...formData.items, newItem]
            });
            toast.success(`Added ${item.name} to manifest`);
        }
    };

    const updateItem = (index: number, field: keyof SalesOrderItem, value: any) => {
        const newItems = [...formData.items];
        // @ts-ignore
        newItems[index][field] = value;
        setFormData({ ...formData, items: newItems });
    };

    const removeItem = (index: number) => {
        const item = formData.items[index];
        const newItems = formData.items.filter((_, i) => i !== index);
        setFormData({ ...formData, items: newItems });
        toast.warn(`Removed ${item.name} from manifest`);
    };

    const totals = useMemo(() => {
        const subtotal = formData.items.reduce((sum, item) => sum + (item.quantity * item.rate), 0);
        const tax = formData.items.reduce((sum, item) => sum + (item.quantity * item.rate * (item.tax / 100)), 0);
        const itemDiscount = formData.items.reduce((sum, item) => sum + (item.discount || 0), 0);
        const total = subtotal + tax - itemDiscount - formData.discount;
        return { subtotal, tax, itemDiscount, total };
    }, [formData]);

    const validateForm = () => {
        if (!formData.customer) {
            toast.error('Customer entity required for protocol');
            return false;
        }
        if (formData.items.length === 0) {
            toast.error('Manifest cannot be empty');
            return false;
        }
        if (!formData.expectedDeliveryDate) {
            toast.error('SLA delivery date required');
            return false;
        }
        return true;
    };

    const handleSaveDraft = async () => {
        if (!validateForm()) return;
        setLoading(true);
        try {
            const user = JSON.parse(localStorage.getItem('user') || '{}');
            const token = user?.token;
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

            await api.post(`/api/sales-orders`, payload, { headers: { Authorization: `Bearer ${token}` } });
            toast.success('Protocol saved as draft');
            navigate('/sales/orders');
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Protocol failure');
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

            const createResponse = await api.post(`/api/sales-orders`, payload, { headers: { Authorization: `Bearer ${token}` } });
            const orderId = createResponse.data.salesOrder._id;
            await api.post(`/api/sales-orders/${orderId}/confirm`, {}, { headers: { Authorization: `Bearer ${token}` } });

            toast.success('Protocol finalized // Stock reserved');
            navigate('/sales/orders');
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Finalization failure');
        } finally {
            setLoading(false);
        }
    };

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
                        onClick={() => navigate('/sales/orders')}
                        className="p-3 bg-neutral-100 dark:bg-neutral-800 rounded-sm hover:scale-110 transition-transform text-neutral-500 hover:text-warning"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-2xl font-display font-black tracking-tighter text-neutral-900 dark:text-white">
                                Order <span className="text-warning">Initialization</span>
                            </h1>
                            <span className="px-3 py-1 bg-warning/10 border border-warning/20 text-warning rounded-lg text-[10px] font-black uppercase tracking-widest">
                                Protocol v4.0
                            </span>
                        </div>
                        <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest mt-0.5 flex items-center gap-2">
                            <Globe className="w-3 h-3" /> Global Logistics Node // Operational Mode: Manual
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <button 
                        onClick={handleSaveDraft}
                        disabled={loading}
                        className="hidden md:flex items-center gap-2 px-6 py-3 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-300 rounded-sm text-[10px] font-black uppercase tracking-widest hover:bg-neutral-50 dark:hover:bg-neutral-700 transition-all shadow-sm disabled:opacity-50"
                    >
                        <Save className="w-4 h-4" /> Save Manifest
                    </button>
                    <button 
                        onClick={handleConfirmOrder}
                        disabled={loading}
                        className="flex items-center gap-2 px-8 py-3 bg-amber-500 text-white rounded-sm text-[10px] font-black uppercase tracking-widest hover:bg-amber-600 transition-all shadow-lg shadow-amber-500/20 disabled:opacity-50"
                    >
                        {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
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
                                { label: 'Node Status', value: 'Ready', icon: Zap, color: 'text-warning' },
                                { label: 'Item Manifest', value: `${formData.items.length} Nodes`, icon: Layers, color: 'text-blue-500' },
                                { label: 'Logistical Risk', value: 'Low', icon: ShieldCheck, color: 'text-success' }
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
                                <h3 className="text-[10px] font-black text-neutral-400 uppercase tracking-[0.3em]">Manifest Ledger</h3>
                                <button 
                                    onClick={() => setShowItemModal(true)}
                                    className="p-3 bg-amber-500 text-white rounded-sm hover:scale-110 transition-transform shadow-lg shadow-amber-500/20"
                                >
                                    <Plus className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-neutral-50 dark:bg-neutral-950/50">
                                            <th className="px-8 py-4 text-[9px] font-black text-neutral-400 uppercase tracking-[0.2em] border-b border-neutral-200 dark:border-neutral-800 w-16 text-center">Node</th>
                                            <th className="px-8 py-4 text-[9px] font-black text-neutral-400 uppercase tracking-[0.2em] border-b border-neutral-200 dark:border-neutral-800">Product Specification</th>
                                            <th className="px-8 py-4 text-[9px] font-black text-neutral-400 uppercase tracking-[0.2em] border-b border-neutral-200 dark:border-neutral-800 w-32 text-right">Qty</th>
                                            <th className="px-8 py-4 text-[9px] font-black text-neutral-400 uppercase tracking-[0.2em] border-b border-neutral-200 dark:border-neutral-800 w-40 text-right">Rate</th>
                                            <th className="px-8 py-4 text-[9px] font-black text-neutral-400 uppercase tracking-[0.2em] border-b border-neutral-200 dark:border-neutral-800 w-32 text-right">Total</th>
                                            <th className="px-8 py-4 text-[9px] font-black text-neutral-400 uppercase tracking-[0.2em] border-b border-neutral-200 dark:border-neutral-800 w-24 text-center">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                                        {formData.items.length === 0 ? (
                                            <tr>
                                                <td colSpan={6} className="px-8 py-20 text-center">
                                                    <div className="flex flex-col items-center gap-4 opacity-20 grayscale">
                                                        <ShoppingBag className="w-16 h-16 text-warning" />
                                                        <p className="text-xs font-black uppercase tracking-widest text-neutral-400">Ledger Empty // Please Add Nodes</p>
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
                                                            <span className="text-[9px] font-bold text-warning uppercase tracking-widest mt-1 flex items-center gap-1">
                                                                <Package className="w-3 h-3" /> Availability: {item.availableStock} Units
                                                            </span>
                                                        </div>
                                                    </td>
                                                    <td className="px-8 py-6 text-right">
                                                        <div className="inline-flex items-center bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl overflow-hidden p-1">
                                                            <button 
                                                                onClick={() => updateItem(index, 'quantity', Math.max(1, item.quantity - 1))}
                                                                className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg text-neutral-400 transition-colors"
                                                            >
                                                                <Minus className="w-3 h-3" />
                                                            </button>
                                                            <input
                                                                type="number"
                                                                value={item.quantity}
                                                                onChange={(e) => updateItem(index, 'quantity', parseFloat(e.target.value) || 0)}
                                                                className="w-12 text-center bg-transparent text-xs font-black outline-none dark:text-white"
                                                            />
                                                            <button 
                                                                onClick={() => updateItem(index, 'quantity', item.quantity + 1)}
                                                                className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg text-neutral-400 transition-colors"
                                                            >
                                                                <Plus className="w-3 h-3" />
                                                            </button>
                                                        </div>
                                                    </td>
                                                    <td className="px-8 py-6 text-right">
                                                        <div className="flex flex-col items-end">
                                                            <div className="flex items-center gap-2 text-sm font-mono font-black dark:text-white">
                                                                <IndianRupee className="w-3 h-3 text-warning" />
                                                                <input
                                                                    type="number"
                                                                    value={item.rate}
                                                                    onChange={(e) => updateItem(index, 'rate', parseFloat(e.target.value) || 0)}
                                                                    className="w-24 text-right bg-transparent outline-none focus:text-warning"
                                                                />
                                                            </div>
                                                            <span className="text-[9px] font-bold text-neutral-400 uppercase tracking-widest mt-1">Tax: {item.tax}%</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-8 py-6 text-right">
                                                        <div className="text-sm font-mono font-black text-neutral-900 dark:text-white flex items-center justify-end gap-1">
                                                            <IndianRupee className="w-3 h-3 text-warning" />
                                                            {(item.quantity * item.rate * (1 + item.tax/100) - (item.discount || 0)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
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

                        {/* Internal Directives */}
                        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-[32px] p-8 shadow-sm">
                            <h3 className="text-[10px] font-black text-neutral-400 uppercase tracking-[0.3em] mb-6 flex items-center gap-2">
                                <Info className="w-4 h-4 text-warning" /> Operational Directives
                            </h3>
                            <textarea 
                                value={formData.notes}
                                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                className="w-full bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-sm p-6 text-xs font-bold outline-none focus:border-warning/30 transition-all dark:text-white placeholder:text-neutral-500 min-h-[120px] shadow-inner"
                                placeholder="Enter specific logistical protocols or terms..."
                            />
                        </div>
                    </div>
                </section>

                {/* Right Panel: Valuation Engine */}
                <aside className="w-[400px] bg-white/50 dark:bg-neutral-900/50 backdrop-blur-xl border-l border-neutral-200 dark:border-neutral-800 p-8 flex flex-col gap-8 overflow-y-auto custom-scrollbar relative z-20 shadow-2xl">
                    <div className="space-y-8">
                        {/* Customer Entity Mapping */}
                        <div>
                            <h3 className="text-[10px] font-black text-neutral-400 uppercase tracking-[0.3em] mb-4">Entity Mapping</h3>
                            {formData.customer ? (
                                <div className="bg-white dark:bg-neutral-900 border-2 border-warning/20 rounded-sm p-6 shadow-xl shadow-amber-500/5 relative overflow-hidden group">
                                    <div className="absolute top-0 right-0 w-16 h-16 bg-amber-500/5 rounded-bl-[40px]" />
                                    <div className="flex items-start gap-4 mb-4 relative z-10">
                                        <div className="w-12 h-12 rounded-sm bg-amber-500 flex items-center justify-center text-white shadow-lg shadow-amber-500/20">
                                            <User className="w-6 h-6" />
                                        </div>
                                        <div className="flex-1 overflow-hidden">
                                            <p className="text-sm font-black text-neutral-900 dark:text-white uppercase tracking-tight truncate">{formData.customer.name}</p>
                                            <p className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest mt-0.5">{formData.customer.phone}</p>
                                        </div>
                                        <button 
                                            onClick={() => setFormData({ ...formData, customer: null })}
                                            className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-xl text-neutral-400 hover:text-danger transition-colors"
                                        >
                                            <RefreshCw className="w-4 h-4" />
                                        </button>
                                    </div>
                                    <div className="space-y-2 pt-4 border-t border-neutral-100 dark:border-neutral-800">
                                        <div className="flex items-center gap-2 text-[10px] font-bold text-neutral-500 uppercase tracking-widest">
                                            <Tag className="w-3 h-3" /> Risk Profile: Standard
                                        </div>
                                        <div className="flex items-center gap-2 text-[10px] font-bold text-neutral-500 uppercase tracking-widest">
                                            <Clock className="w-3 h-3" /> Priority: High
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <button 
                                    onClick={() => setShowCustomerModal(true)}
                                    className="w-full bg-white dark:bg-neutral-900 border border-dashed border-neutral-300 dark:border-neutral-700 rounded-sm p-8 flex flex-col items-center gap-4 hover:border-amber-500/50 transition-all group shadow-sm"
                                >
                                    <div className="w-16 h-16 rounded-sm bg-neutral-50 dark:bg-neutral-800 flex items-center justify-center text-neutral-300 group-hover:bg-amber-500 group-hover:text-white transition-all shadow-inner">
                                        <Search className="w-8 h-8" />
                                    </div>
                                    <p className="text-[10px] font-black text-neutral-400 uppercase tracking-[0.2em] group-hover:text-warning transition-colors">Scan for Customer Entity</p>
                                </button>
                            )}
                        </div>

                        {/* Logistical Parameters */}
                        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-[32px] p-6 space-y-6 shadow-sm">
                            <h3 className="text-[10px] font-black text-neutral-400 uppercase tracking-[0.3em] mb-4">Parameters</h3>
                            <div className="space-y-4">
                                <div>
                                    <label className="text-[9px] font-black text-neutral-400 uppercase tracking-widest block mb-2">Protocol Date</label>
                                    <div className="relative">
                                        <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-warning" />
                                        <input
                                            type="date"
                                            value={formData.orderDate}
                                            onChange={(e) => setFormData({ ...formData, orderDate: e.target.value })}
                                            className="w-full bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-sm py-3 pl-12 pr-4 text-xs font-bold outline-none focus:border-warning/30 transition-all dark:text-white"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="text-[9px] font-black text-neutral-400 uppercase tracking-widest block mb-2">SLA Delivery Date</label>
                                    <div className="relative">
                                        <Truck className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-warning" />
                                        <input
                                            type="date"
                                            value={formData.expectedDeliveryDate}
                                            onChange={(e) => setFormData({ ...formData, expectedDeliveryDate: e.target.value })}
                                            className="w-full bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-sm py-3 pl-12 pr-4 text-xs font-bold outline-none focus:border-warning/30 transition-all dark:text-white shadow-inner"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Valuation Summary */}
                        <div className="bg-neutral-900 dark:bg-white rounded-[40px] p-8 text-white dark:text-neutral-900 shadow-2xl relative overflow-hidden mt-auto">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-warning/10 rounded-bl-[100px]" />
                            <h3 className="text-[10px] font-black opacity-50 uppercase tracking-[0.3em] mb-8">Valuation Summary</h3>
                            <div className="space-y-4 relative z-10">
                                <div className="flex justify-between items-center text-xs font-bold uppercase tracking-widest opacity-80">
                                    <span>Sub-Valuation</span>
                                    <span className="font-mono">₹{totals.subtotal.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between items-center text-xs font-bold uppercase tracking-widest opacity-80">
                                    <span>Tax Vector</span>
                                    <span className="font-mono text-success dark:text-emerald-600">₹{totals.tax.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between items-center text-xs font-bold uppercase tracking-widest opacity-80">
                                    <span>Manifest Credits</span>
                                    <span className="font-mono text-danger dark:text-rose-600">-₹{totals.itemDiscount.toLocaleString()}</span>
                                </div>
                                <div className="pt-4 border-t border-white/10 dark:border-neutral-200">
                                    <div className="flex justify-between items-center mb-6">
                                        <span className="text-[10px] font-black uppercase tracking-widest opacity-50">Custom Offset</span>
                                        <div className="relative">
                                            <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3 text-warning" />
                                            <input
                                                type="number"
                                                value={formData.discount}
                                                onChange={(e) => setFormData({ ...formData, discount: parseFloat(e.target.value) || 0 })}
                                                className="w-24 bg-white/5 dark:bg-neutral-100 border border-white/10 dark:border-neutral-200 rounded-xl py-2 pl-8 pr-3 text-right text-xs font-black outline-none focus:border-amber-500/50 transition-all dark:text-neutral-900 shadow-inner"
                                            />
                                        </div>
                                    </div>
                                    <div className="flex flex-col gap-1">
                                        <span className="text-[10px] font-black uppercase tracking-[0.3em] opacity-40">Net Operational Value</span>
                                        <div className="text-4xl font-display font-black tracking-tighter flex items-center gap-2">
                                            <IndianRupee className="w-8 h-8 text-warning" />
                                            {totals.total.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
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
                    toast.success(`Entity ${customer.name} mapped to protocol`);
                }}
            />

            <ItemSelectionModal
                isOpen={showItemModal}
                onClose={() => setShowItemModal(false)}
                onSelect={addItemFromModal}
            />
        </div>
    );
};

export default SalesOrderPage;

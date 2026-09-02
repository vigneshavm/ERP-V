import React, { useState, useEffect } from 'react';
import Layout from "../../components/shared/Layout/index.js";
import FormInput from "../../components/core/Form/Input.js";
import SupplierSelectionModal from "../../components/shared/Modals/SupplierSelectionModal.js";
import api from "../../services/api.js";
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import { Save, Printer, FileText, User, Phone, X,
    Plus, Trash2, Calculator, CreditCard, Banknote,
    Building2, RefreshCw, AlertTriangle
} from 'lucide-react';
import PageHeader from "../../components/shared/Layout/PageHeader.js";
import { Supplier } from "../../redux/slices/supplierSlice.js";

interface ReturnItem {
    name: string;
    quantity: number;
    rate: number;
    tax: number;
    amount: number;
    reason: string;
}

interface PurchaseReturnFormData {
    debitNoteNo: string;
    debitNoteDate: string;
    originalPurchase: any; // Could be typed if needed
    supplier: Supplier | null;
    items: ReturnItem[];
    refundMethod: 'credit' | 'cash' | 'bank_transfer' | 'adjust_next_bill' | string;
    discount: number;
    notes: string;
    bankAccount: string;
}

const PurchaseReturn: React.FC = () => {
    const [formData, setFormData] = useState<PurchaseReturnFormData>({
        debitNoteNo: 'DN-' + Date.now(),
        debitNoteDate: new Date().toISOString().split('T')[0],
        originalPurchase: null,
        supplier: null,
        items: [{ name: '', quantity: 1, rate: 0, tax: 18, amount: 0, reason: '' }],
        refundMethod: 'credit',
        discount: 0,
        notes: '',
        bankAccount: ''
    });
    const [showSupplierModal, setShowSupplierModal] = useState(false);
    const [bankAccounts, setBankAccounts] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const refundMethods = [
        { value: 'credit', label: 'Credit Note', icon: CreditCard, color: 'indigo' },
        { value: 'cash', label: 'Cash Refund', icon: Banknote, color: 'emerald' },
        { value: 'bank_transfer', label: 'Bank Transfer', icon: Building2, color: 'blue' },
        { value: 'adjust_next_bill', label: 'Adjust Next Bill', icon: RefreshCw, color: 'purple' }
    ];

    const returnReasons = ['Damaged Product', 'Wrong Item', 'Quality Issue', 'Expired Product', 'Other'];

    useEffect(() => {
        const fetchBanks = async () => {
            try {
                const userDataString = localStorage.getItem('user');
                if (!userDataString) return;
                const userData = JSON.parse(userDataString);
                const token = userData?.token;
                const response = await api.get(
                    `/api/cashbank/accounts`,
                    { headers: { Authorization: `Bearer ${token}` } }
                );
                setBankAccounts(response.data.filter((acc: any) => acc.status === 'active'));
            } catch (error) {
                console.error('Error fetching banks:', error);
            }
        };
        fetchBanks();
    }, []);

    const addItem = () => setFormData({ ...formData, items: [...formData.items, { name: '', quantity: 1, rate: 0, tax: 18, amount: 0, reason: '' }] });

    const removeItem = (index: number) => {
        if (formData.items.length > 1) {
            const newItems = formData.items.filter((_, i) => i !== index);
            setFormData({ ...formData, items: newItems });
        }
    };

    const updateItem = (index: number, field: keyof ReturnItem, value: any) => {
        const newItems = [...formData.items];
        (newItems[index] as any)[field] = value;
        if (field === 'quantity' || field === 'rate') {
            newItems[index].amount = newItems[index].quantity * newItems[index].rate;
        }
        setFormData({ ...formData, items: newItems });
    };

    const calculateSubtotal = () => formData.items.reduce((sum, item) => sum + item.amount, 0);
    const calculateTax = () => formData.items.reduce((sum, item) => sum + (item.amount * item.tax / 100), 0);
    const calculateTotal = () => calculateSubtotal() + calculateTax() - formData.discount;

    const handleSubmit = async () => {
        if (!formData.supplier) return toast.warning('Please select a supplier');
        if (formData.items.some(item => !item.name || item.quantity <= 0)) return toast.warning('Please fill all item details');
        if (formData.refundMethod === 'bank_transfer' && !formData.bankAccount) return toast.warning('Please select a bank account');

        try {
            setLoading(true);
            const userDataString = localStorage.getItem('user');
            if (!userDataString) return;
            const userData = JSON.parse(userDataString);
            const token = userData?.token;

            await api.post(
                `/api/purchase-returns`,
                {
                    supplierId: formData.supplier._id,
                    items: formData.items,
                    refundMethod: formData.refundMethod,
                    bankAccount: formData.bankAccount,
                    discount: formData.discount,
                    notes: formData.notes,
                    returnDate: formData.debitNoteDate
                },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            toast.success('Purchase return processed successfully');
            navigate('/purchase/return'); // Updated path for consistency
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to process return');
        } finally {
            setLoading(false);
        }
    };

    const getMethodColorClasses = (color: string, isSelected: boolean) => {
        const colors: Record<string, string> = {
            indigo: isSelected ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20 ring-2 ring-indigo-500/20' : 'border-slate-200 dark:border-neutral-700 hover:border-indigo-300 hover:bg-indigo-50/50',
            emerald: isSelected ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 ring-2 ring-emerald-500/20' : 'border-slate-200 dark:border-neutral-700 hover:border-emerald-300 hover:bg-emerald-50/50',
            blue: isSelected ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 ring-2 ring-blue-500/20' : 'border-slate-200 dark:border-neutral-700 hover:border-blue-300 hover:bg-blue-50/50',
            purple: isSelected ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20 ring-2 ring-purple-500/20' : 'border-slate-200 dark:border-neutral-700 hover:border-purple-300 hover:bg-purple-50/50'
        };
        return colors[color] || colors.indigo;
    };

    return (
        <Layout>
            <div className="space-y-6 animate-fade-in pb-10">
                <PageHeader
                    title="Purchase Return / Debit Note"
                    description="Record returns and issue debit notes to suppliers"
                    actions={
                        <div className="flex gap-3">
                            <button className="btn btn-secondary bg-white dark:bg-neutral-800">
                                <Printer className="w-4 h-4" />
                                Print
                            </button>
                            <button
                                onClick={handleSubmit}
                                disabled={loading}
                                className="btn btn-primary bg-rose-600 hover:bg-rose-700"
                            >
                                <Save className="w-4 h-4" />
                                {loading ? 'Saving...' : 'Save Debit Note'}
                            </button>
                        </div>
                    }
                />

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Main Content */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Debit Note Details Card */}
                        <div className="bg-white dark:bg-[rgb(var(--color-card))] border dark:border-[rgb(var(--color-border))] rounded-sm p-6 shadow-sm">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-8 h-8 bg-slate-100 dark:bg-neutral-800 rounded-lg flex items-center justify-center">
                                    <FileText className="w-4 h-4 text-slate-600 dark:text-neutral-400" />
                                </div>
                                <h2 className="text-base font-semibold text-slate-900 dark:text-white">Debit Note Details</h2>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <FormInput
                                    label="Debit Note Number"
                                    name="debitNoteNo"
                                    value={formData.debitNoteNo}
                                    onChange={(e) => setFormData({ ...formData, debitNoteNo: e.target.value })}
                                    required
                                />
                                <FormInput
                                    label="Debit Note Date"
                                    name="debitNoteDate"
                                    type="date"
                                    value={formData.debitNoteDate}
                                    onChange={(e) => setFormData({ ...formData, debitNoteDate: e.target.value })}
                                    required
                                />
                            </div>
                        </div>

                        {/* Supplier Card */}
                        <div className="bg-white dark:bg-[rgb(var(--color-card))] border dark:border-[rgb(var(--color-border))] rounded-sm p-6 shadow-sm">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-8 h-8 bg-slate-100 dark:bg-neutral-800 rounded-lg flex items-center justify-center">
                                    <User className="w-4 h-4 text-slate-600 dark:text-neutral-400" />
                                </div>
                                <h2 className="text-base font-semibold text-slate-900 dark:text-white">Supplier</h2>
                            </div>
                            {formData.supplier ? (
                                <div className="p-4 bg-gradient-to-r from-rose-50 to-red-50 dark:from-rose-900/10 dark:to-red-900/10 border border-rose-200 dark:border-rose-800 rounded-xl">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 bg-white dark:bg-neutral-800 rounded-xl flex items-center justify-center shadow-sm">
                                                <span className="text-lg font-bold text-rose-700 dark:text-danger">
                                                    {formData.supplier.businessName?.charAt(0) || 'S'}
                                                </span>
                                            </div>
                                            <div>
                                                <p className="font-semibold text-slate-900 dark:text-white">{formData.supplier.businessName}</p>
                                                <p className="text-sm text-slate-600 dark:text-neutral-400">{formData.supplier.contactPersonName}</p>
                                                {formData.supplier.contactNo && (
                                                    <div className="flex items-center gap-1.5 mt-1 text-sm text-slate-500">
                                                        <Phone className="w-3.5 h-3.5" />
                                                        {formData.supplier.contactNo}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => setFormData({ ...formData, supplier: null })}
                                            className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                        >
                                            <X className="w-5 h-5" />
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <button
                                    onClick={() => setShowSupplierModal(true)}
                                    className="w-full px-4 py-8 border-2 border-dashed border-slate-200 dark:border-neutral-700 rounded-sm text-slate-500 hover:border-rose-400 hover:text-rose-600 hover:bg-rose-50/50 dark:hover:bg-rose-900/10 transition-all flex flex-col items-center justify-center gap-3"
                                >
                                    <div className="w-12 h-12 bg-slate-50 dark:bg-neutral-800 rounded-full flex items-center justify-center">
                                        <Plus className="w-6 h-6 text-danger" />
                                    </div>
                                    <span className="font-medium">Click to select supplier</span>
                                </button>
                            )}
                        </div>

                        {/* Items Card */}
                        <div className="bg-white dark:bg-[rgb(var(--color-card))] border dark:border-[rgb(var(--color-border))] rounded-sm p-6 shadow-sm overflow-hidden">
                            <div className="flex items-center justify-between mb-6">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 bg-slate-100 dark:bg-neutral-800 rounded-lg flex items-center justify-center">
                                        <AlertTriangle className="w-4 h-4 text-slate-600 dark:text-neutral-400" />
                                    </div>
                                    <h2 className="text-base font-semibold text-slate-900 dark:text-white">Return Items</h2>
                                </div>
                                <button
                                    onClick={addItem}
                                    className="btn btn-secondary py-2 border-emerald-200 text-emerald-600 hover:bg-emerald-50"
                                >
                                    <Plus className="w-4 h-4" />
                                    Add Item
                                </button>
                            </div>
                            <div className="overflow-x-auto -mx-6">
                                <table className="w-full text-left text-sm whitespace-nowrap">
                                    <thead className="bg-slate-50 dark:bg-neutral-900/50 border-y dark:border-neutral-700">
                                        <tr>
                                            <th className="px-6 py-3 font-semibold text-slate-500">Item</th>
                                            <th className="px-6 py-3 font-semibold text-slate-500 w-20 text-right">Qty</th>
                                            <th className="px-6 py-3 font-semibold text-slate-500 w-32 text-right">Rate</th>
                                            <th className="px-6 py-3 font-semibold text-slate-500 w-24 text-right">Tax %</th>
                                            <th className="px-6 py-3 font-semibold text-slate-500 w-32 text-right">Total</th>
                                            <th className="px-6 py-3 font-semibold text-slate-500 w-48">Reason</th>
                                            <th className="px-6 py-3 w-10"></th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 dark:divide-neutral-800">
                                        {formData.items.map((item, index) => (
                                            <tr key={index} className="group hover:bg-slate-50/50 dark:hover:bg-neutral-800/50 transition-colors">
                                                <td className="px-6 py-3">
                                                    <input
                                                        type="text"
                                                        value={item.name}
                                                        onChange={(e) => updateItem(index, 'name', e.target.value)}
                                                        className="w-full bg-transparent outline-none font-medium border-b border-transparent focus:border-rose-500"
                                                        placeholder="Item name"
                                                    />
                                                </td>
                                                <td className="px-6 py-3">
                                                    <input
                                                        type="number"
                                                        value={item.quantity}
                                                        onChange={(e) => updateItem(index, 'quantity', parseFloat(e.target.value) || 0)}
                                                        className="w-full bg-transparent outline-none text-right font-medium"
                                                    />
                                                </td>
                                                <td className="px-6 py-3">
                                                    <input
                                                        type="number"
                                                        value={item.rate}
                                                        onChange={(e) => updateItem(index, 'rate', parseFloat(e.target.value) || 0)}
                                                        className="w-full bg-transparent outline-none text-right font-medium"
                                                    />
                                                </td>
                                                <td className="px-6 py-3">
                                                    <select
                                                        value={item.tax}
                                                        onChange={(e) => updateItem(index, 'tax', parseFloat(e.target.value))}
                                                        className="w-full bg-transparent outline-none text-right font-medium"
                                                    >
                                                        <option value="0">0%</option>
                                                        <option value="5">5%</option>
                                                        <option value="12">12%</option>
                                                        <option value="18">18%</option>
                                                        <option value="28">28%</option>
                                                    </select>
                                                </td>
                                                <td className="px-6 py-3 text-right font-bold text-slate-900 dark:text-white">
                                                    ₹{item.amount.toFixed(2)}
                                                </td>
                                                <td className="px-6 py-3">
                                                    <select
                                                        value={item.reason}
                                                        onChange={(e) => updateItem(index, 'reason', e.target.value)}
                                                        className="w-full bg-transparent outline-none font-medium text-slate-600 dark:text-neutral-400"
                                                    >
                                                        <option value="">Select reason</option>
                                                        {returnReasons.map(reason => (
                                                            <option key={reason} value={reason}>{reason}</option>
                                                        ))}
                                                    </select>
                                                </td>
                                                <td className="px-6 py-3 text-center">
                                                    <button
                                                        onClick={() => removeItem(index)}
                                                        className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                                                        disabled={formData.items.length === 1}
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

                        {/* Refund Details Card */}
                        <div className="bg-white dark:bg-[rgb(var(--color-card))] border dark:border-[rgb(var(--color-border))] rounded-sm p-6 shadow-sm">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-8 h-8 bg-slate-100 dark:bg-neutral-800 rounded-lg flex items-center justify-center">
                                    <CreditCard className="w-4 h-4 text-slate-600 dark:text-neutral-400" />
                                </div>
                                <h2 className="text-base font-semibold text-slate-900 dark:text-white">Refund Details</h2>
                            </div>
                            <div className="space-y-6">
                                <div>
                                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Refund Method</label>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                        {refundMethods.map((method) => {
                                            const isSelected = formData.refundMethod === method.value;
                                            const IconComponent = method.icon;
                                            return (
                                                <button
                                                    key={method.value}
                                                    onClick={() => setFormData({ ...formData, refundMethod: method.value, bankAccount: '' })}
                                                    className={`group p-4 border-2 rounded-sm transition-all text-center ${getMethodColorClasses(method.color, isSelected)}`}
                                                >
                                                    <div className={`w-12 h-12 mx-auto mb-3 rounded-xl flex items-center justify-center transition-colors ${isSelected ? `bg-${method.color}-100 dark:bg-${method.color}-900/30` : 'bg-slate-50 dark:bg-neutral-800'}`}>
                                                        <IconComponent className={`w-6 h-6 transition-colors ${isSelected ? `text-${method.color}-600 dark:text-${method.color}-400` : 'text-slate-400'}`} />
                                                    </div>
                                                    <div className={`text-xs font-bold uppercase tracking-wider transition-colors ${isSelected ? 'text-slate-900 dark:text-white' : 'text-slate-500'}`}>
                                                        {method.label}
                                                    </div>
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>

                                {formData.refundMethod === 'bank_transfer' && (
                                    <div className="animate-in slide-in-from-top-2">
                                        <label className="block text-sm font-medium text-slate-700 dark:text-neutral-300 mb-2">Select Bank Account</label>
                                        <select
                                            value={formData.bankAccount}
                                            onChange={(e) => setFormData({ ...formData, bankAccount: e.target.value })}
                                            className="w-full px-4 py-3 bg-slate-50 dark:bg-neutral-900 border border-slate-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/20"
                                        >
                                            <option value="">Choose Bank Account</option>
                                            {bankAccounts.map(acc => (
                                                <option key={acc._id} value={acc._id}>
                                                    {acc.bankName} - ****{acc.accountNumber?.slice(-4)} (₹{acc.currentBalance?.toLocaleString()})
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                )}

                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-neutral-300 mb-2">Notes</label>
                                    <textarea
                                        value={formData.notes}
                                        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                        rows={3}
                                        className="w-full px-4 py-3 bg-slate-50 dark:bg-neutral-900 border border-slate-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/20 resize-none transition-all"
                                        placeholder="Add notes about this return..."
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Summary Sidebar */}
                    <div className="lg:col-span-1">
                        <div className="bg-white dark:bg-[rgb(var(--color-card))] border dark:border-[rgb(var(--color-border))] rounded-sm overflow-hidden shadow-lg sticky top-6">
                            <div className="bg-gradient-to-r from-rose-500 to-red-600 p-6">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-xl flex items-center justify-center text-white">
                                        <Calculator className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <h2 className="text-lg font-bold text-white">Return Balance</h2>
                                        <p className="text-rose-100/80 text-xs font-medium uppercase tracking-wider">Debit Note Value</p>
                                    </div>
                                </div>
                            </div>

                            <div className="p-6">
                                <div className="space-y-4 mb-8">
                                    <div className="flex justify-between items-center py-2">
                                        <span className="text-sm text-slate-500">Subtotal</span>
                                        <span className="text-sm font-medium text-slate-900 dark:text-white">₹{calculateSubtotal().toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between items-center py-2">
                                        <span className="text-sm text-slate-500">Total Tax</span>
                                        <span className="text-sm font-medium text-slate-900 dark:text-white">₹{calculateTax().toFixed(2)}</span>
                                    </div>
                                    <div className="pt-2">
                                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Discount Adjustment</label>
                                        <div className="relative">
                                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-bold">₹</span>
                                            <input
                                                type="number"
                                                value={formData.discount}
                                                onChange={(e) => setFormData({ ...formData, discount: parseFloat(e.target.value) || 0 })}
                                                className="w-full pl-8 pr-4 py-2.5 bg-slate-50 dark:bg-neutral-900 border border-slate-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:border-rose-500"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="border-t dark:border-neutral-800 pt-6 mb-8 text-center">
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Total Refund / Credit</p>
                                    <p className="text-4xl font-black text-emerald-600">₹{calculateTotal().toLocaleString()}</p>
                                </div>

                                <div className="space-y-3">
                                    <button
                                        onClick={handleSubmit}
                                        disabled={loading}
                                        className="w-full py-4 bg-gradient-to-r from-rose-600 to-red-600 text-white font-bold rounded-sm hover:from-rose-700 hover:to-red-700 transition-all shadow-xl shadow-rose-500/20 flex items-center justify-center gap-3 disabled:opacity-50"
                                    >
                                        <Save className="w-5 h-5" />
                                        {loading ? 'Processing...' : 'Issue Debit Note'}
                                    </button>
                                    <button className="w-full py-3.5 border border-slate-200 dark:border-neutral-700 text-slate-700 dark:text-neutral-300 font-semibold rounded-sm hover:bg-slate-50 dark:hover:bg-neutral-800 transition-colors flex items-center justify-center gap-2">
                                        <Printer className="w-4 h-4" />
                                        Print Document
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <SupplierSelectionModal
                isOpen={showSupplierModal}
                onClose={() => setShowSupplierModal(false)}
                onSelect={(supplier: any) => setFormData({ ...formData, supplier })}
            />
        </Layout>
    );
};

export default PurchaseReturn;


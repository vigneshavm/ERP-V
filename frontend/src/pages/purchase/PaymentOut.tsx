import React, { useState } from 'react';
import Layout from '../../components/Layout';
import FormInput from '../../components/FormInput';
import SupplierSelectionModal from '../../components/SupplierSelectionModal';
import api from '../../services/api';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import {
    ArrowUpCircle, Save, Printer, Banknote, Smartphone,
    CreditCard, FileText, Building2, Phone, User, X, Wallet, Plus
} from 'lucide-react';
import PageHeader from '../../components/PageHeader';
import { Supplier } from '../../redux/slices/supplierSlice';

interface PaymentOutFormData {
    paymentNo: string;
    paymentDate: string;
    supplier: Supplier | null;
    paymentMethod: 'cash' | 'upi' | 'card' | 'cheque' | 'bank_transfer' | string;
    amount: number;
    notes: string;
}

const PaymentOut: React.FC = () => {
    const [formData, setFormData] = useState<PaymentOutFormData>({
        paymentNo: 'PAY-' + Date.now(),
        paymentDate: new Date().toISOString().split('T')[0],
        supplier: null,
        paymentMethod: 'cash',
        amount: 0,
        notes: ''
    });
    const [showSupplierModal, setShowSupplierModal] = useState(false);
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const paymentMethods = [
        { value: 'cash', label: 'Cash', icon: Banknote, color: 'emerald' },
        { value: 'upi', label: 'UPI', icon: Smartphone, color: 'purple' },
        { value: 'card', label: 'Card', icon: CreditCard, color: 'blue' },
        { value: 'cheque', label: 'Cheque', icon: FileText, color: 'amber' },
        { value: 'bank_transfer', label: 'Bank Transfer', icon: Building2, color: 'indigo' }
    ];

    const handleSubmit = async () => {
        if (!formData.supplier) return toast.warning('Please select a supplier');
        if (formData.amount <= 0) return toast.warning('Please enter a valid amount');

        try {
            setLoading(true);
            const userDataString = localStorage.getItem('user');
            if (!userDataString) return;
            const userData = JSON.parse(userDataString);
            const token = userData?.token;

            await api.post(
                `/api/purchase-payments`,
                {
                    supplierId: formData.supplier._id,
                    paymentDate: formData.paymentDate,
                    paymentMethod: formData.paymentMethod,
                    amount: formData.amount,
                    notes: formData.notes,
                    paymentNo: formData.paymentNo
                },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            toast.success('Payment recorded successfully');
            navigate('/purchase/payment-out');
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to record payment');
        } finally {
            setLoading(false);
        }
    };

    const getMethodColorClasses = (color: string, isSelected: boolean) => {
        const colors: Record<string, string> = {
            emerald: isSelected ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 ring-2 ring-emerald-500/20' : 'border-slate-200 dark:border-neutral-700 hover:border-emerald-300 hover:bg-emerald-50/50',
            purple: isSelected ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20 ring-2 ring-purple-500/20' : 'border-slate-200 dark:border-neutral-700 hover:border-purple-300 hover:bg-purple-50/50',
            blue: isSelected ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 ring-2 ring-blue-500/20' : 'border-slate-200 dark:border-neutral-700 hover:border-blue-300 hover:bg-blue-50/50',
            amber: isSelected ? 'border-amber-500 bg-amber-50 dark:bg-amber-900/20 ring-2 ring-amber-500/20' : 'border-slate-200 dark:border-neutral-700 hover:border-amber-300 hover:bg-amber-50/50',
            indigo: isSelected ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20 ring-2 ring-indigo-500/20' : 'border-slate-200 dark:border-neutral-700 hover:border-indigo-300 hover:bg-indigo-50/50'
        };
        return colors[color] || colors.indigo;
    };

    const getIconColorClasses = (color: string, isSelected: boolean) => {
        const colors: Record<string, string> = {
            emerald: isSelected ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400 group-hover:text-emerald-500',
            purple: isSelected ? 'text-purple-600 dark:text-purple-400' : 'text-slate-400 group-hover:text-purple-500',
            blue: isSelected ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400 group-hover:text-blue-500',
            amber: isSelected ? 'text-amber-600 dark:text-amber-400' : 'text-slate-400 group-hover:text-amber-500',
            indigo: isSelected ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400 group-hover:text-indigo-500'
        };
        return colors[color] || colors.indigo;
    };

    return (
        <Layout>
            <div className="space-y-6 animate-fade-in pb-10">
                <PageHeader
                    title="Payment Out"
                    description="Record new outgoing payments to your suppliers"
                    actions={
                        <div className="flex gap-3">
                            <button className="btn btn-secondary bg-white dark:bg-neutral-800">
                                <Printer className="w-4 h-4" />
                                Print Receipt
                            </button>
                            <button
                                onClick={handleSubmit}
                                disabled={loading}
                                className="btn btn-primary"
                            >
                                <Save className="w-4 h-4" />
                                {loading ? 'Saving...' : 'Save Payment'}
                            </button>
                        </div>
                    }
                />

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Main Content */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Payment Details Card */}
                        <div className="bg-white dark:bg-[rgb(var(--color-card))] border dark:border-[rgb(var(--color-border))] rounded-2xl p-6 shadow-sm">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-8 h-8 bg-slate-100 dark:bg-neutral-800 rounded-lg flex items-center justify-center">
                                    <FileText className="w-4 h-4 text-slate-600 dark:text-neutral-400" />
                                </div>
                                <h2 className="text-base font-semibold text-slate-900 dark:text-white">Payment Details</h2>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <FormInput
                                    label="Payment Number"
                                    name="paymentNo"
                                    value={formData.paymentNo}
                                    onChange={(e) => setFormData({ ...formData, paymentNo: e.target.value })}
                                    required
                                />
                                <FormInput
                                    label="Payment Date"
                                    name="paymentDate"
                                    type="date"
                                    value={formData.paymentDate}
                                    onChange={(e) => setFormData({ ...formData, paymentDate: e.target.value })}
                                    required
                                />
                            </div>
                        </div>

                        {/* Supplier Card */}
                        <div className="bg-white dark:bg-[rgb(var(--color-card))] border dark:border-[rgb(var(--color-border))] rounded-2xl p-6 shadow-sm">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-8 h-8 bg-slate-100 dark:bg-neutral-800 rounded-lg flex items-center justify-center">
                                    <User className="w-4 h-4 text-slate-600 dark:text-neutral-400" />
                                </div>
                                <h2 className="text-base font-semibold text-slate-900 dark:text-white">Supplier</h2>
                            </div>
                            {formData.supplier ? (
                                <div className="p-4 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/10 dark:to-orange-900/10 border border-amber-200 dark:border-amber-800 rounded-xl">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 bg-white dark:bg-neutral-800 rounded-xl flex items-center justify-center shadow-sm">
                                                <span className="text-lg font-bold text-amber-700 dark:text-amber-500">
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
                                    className="w-full px-4 py-8 border-2 border-dashed border-slate-200 dark:border-neutral-700 rounded-2xl text-slate-500 hover:border-amber-400 hover:text-amber-600 hover:bg-amber-50/50 dark:hover:bg-amber-900/10 transition-all flex flex-col items-center justify-center gap-3"
                                >
                                    <div className="w-12 h-12 bg-slate-50 dark:bg-neutral-800 rounded-full flex items-center justify-center">
                                        <Plus className="w-6 h-6" />
                                    </div>
                                    <span className="font-medium">Click to select supplier</span>
                                </button>
                            )}
                        </div>

                        {/* Payment Method Card */}
                        <div className="bg-white dark:bg-[rgb(var(--color-card))] border dark:border-[rgb(var(--color-border))] rounded-2xl p-6 shadow-sm">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-8 h-8 bg-slate-100 dark:bg-neutral-800 rounded-lg flex items-center justify-center">
                                    <Wallet className="w-4 h-4 text-slate-600 dark:text-neutral-400" />
                                </div>
                                <h2 className="text-base font-semibold text-slate-900 dark:text-white">Payment Method</h2>
                            </div>
                            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
                                {paymentMethods.map((method) => {
                                    const isSelected = formData.paymentMethod === method.value;
                                    const IconComponent = method.icon;
                                    return (
                                        <button
                                            key={method.value}
                                            onClick={() => setFormData({ ...formData, paymentMethod: method.value })}
                                            className={`group p-4 border-2 rounded-2xl transition-all text-center ${getMethodColorClasses(method.color, isSelected)}`}
                                        >
                                            <div className={`w-12 h-12 mx-auto mb-3 rounded-xl flex items-center justify-center transition-colors ${isSelected ? `bg-${method.color}-100 dark:bg-${method.color}-900/30` : 'bg-slate-50 dark:bg-neutral-800'}`}>
                                                <IconComponent className={`w-6 h-6 transition-colors ${getIconColorClasses(method.color, isSelected)}`} />
                                            </div>
                                            <div className={`text-xs font-bold uppercase tracking-wider transition-colors ${isSelected ? 'text-slate-900 dark:text-white' : 'text-slate-500'}`}>
                                                {method.label}
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Notes Card */}
                        <div className="bg-white dark:bg-[rgb(var(--color-card))] border dark:border-[rgb(var(--color-border))] rounded-2xl p-6 shadow-sm">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-8 h-8 bg-slate-100 dark:bg-neutral-800 rounded-lg flex items-center justify-center">
                                    <FileText className="w-4 h-4 text-slate-600 dark:text-neutral-400" />
                                </div>
                                <h2 className="text-base font-semibold text-slate-900 dark:text-white">Notes</h2>
                            </div>
                            <textarea
                                value={formData.notes}
                                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                rows={3}
                                className="w-full px-4 py-3 bg-slate-50 dark:bg-neutral-900 border border-slate-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 resize-none transition-all"
                                placeholder="Add internal notes or payment details..."
                            />
                        </div>
                    </div>

                    {/* Summary Sidebar */}
                    <div className="lg:col-span-1">
                        <div className="bg-white dark:bg-[rgb(var(--color-card))] border dark:border-[rgb(var(--color-border))] rounded-2xl overflow-hidden shadow-lg sticky top-6">
                            <div className="bg-gradient-to-r from-amber-500 to-orange-500 p-6">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-xl flex items-center justify-center text-white shadow-inner">
                                        <Wallet className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <h2 className="text-lg font-bold text-white">Summary</h2>
                                        <p className="text-amber-100/80 text-xs font-medium uppercase tracking-wider">Outgoing Transfer</p>
                                    </div>
                                </div>
                            </div>

                            <div className="p-6">
                                <div className="mb-8">
                                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Amount to Pay</label>
                                    <div className="relative group">
                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 dark:text-neutral-600 text-2xl font-bold transition-colors group-focus-within:text-amber-500">₹</span>
                                        <input
                                            type="number"
                                            value={formData.amount}
                                            onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })}
                                            className="w-full pl-10 pr-4 py-5 text-4xl font-black text-slate-900 dark:text-white bg-slate-50 dark:bg-neutral-900 border-2 border-slate-100 dark:border-neutral-800 rounded-2xl focus:outline-none focus:border-amber-500 transition-all text-right"
                                            placeholder="0"
                                        />
                                    </div>
                                </div>

                                {formData.supplier && (
                                    <div className="mb-8 space-y-4">
                                        <div className="flex justify-between items-center py-3 border-b border-slate-100 dark:border-neutral-800">
                                            <span className="text-sm text-slate-500">Paying To</span>
                                            <span className="text-sm font-bold text-slate-900 dark:text-white">{formData.supplier.businessName}</span>
                                        </div>
                                        <div className="flex justify-between items-center py-3 border-b border-slate-100 dark:border-neutral-800">
                                            <span className="text-sm text-slate-500">Method</span>
                                            <span className="text-sm font-bold text-slate-900 dark:text-white capitalize">{formData.paymentMethod.replace('_', ' ')}</span>
                                        </div>
                                    </div>
                                )}

                                <div className="space-y-3">
                                    <button
                                        onClick={handleSubmit}
                                        disabled={loading}
                                        className="w-full py-4 bg-gradient-to-r from-amber-600 to-orange-600 text-white font-bold rounded-2xl hover:from-amber-700 hover:to-orange-700 transition-all shadow-xl shadow-amber-500/20 active:scale-[0.98] flex items-center justify-center gap-3 disabled:opacity-50"
                                    >
                                        <Save className="w-5 h-5" />
                                        {loading ? 'Processing...' : 'Save & Record'}
                                    </button>
                                    <button className="w-full py-3.5 border border-slate-200 dark:border-neutral-700 text-slate-700 dark:text-neutral-300 font-semibold rounded-2xl hover:bg-slate-50 dark:hover:bg-neutral-800 transition-colors flex items-center justify-center gap-2">
                                        <Printer className="w-4 h-4" />
                                        Print Voucher
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
                onSelectSupplier={(supplier) => setFormData({ ...formData, supplier })}
            />
        </Layout>
    );
};

export default PaymentOut;

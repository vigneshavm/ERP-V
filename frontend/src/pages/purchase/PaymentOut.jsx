import { useState } from 'react';
import Layout from '../../components/Layout';
import FormInput from '../../components/FormInput';
import SupplierSelectionModal from '../../components/SupplierSelectionModal';
import { ArrowUpCircle, Save, Printer, Banknote, Smartphone, CreditCard, FileText, Building2, Phone, User, X, Wallet } from 'lucide-react';

const PaymentOut = () => {
    const [formData, setFormData] = useState({
        paymentNo: 'PAY-' + Date.now(),
        paymentDate: new Date().toISOString().split('T')[0],
        supplier: null,
        paymentMethod: 'cash',
        amount: 0,
        notes: ''
    });
    const [showSupplierModal, setShowSupplierModal] = useState(false);

    const paymentMethods = [
        { value: 'cash', label: 'Cash', icon: Banknote, color: 'emerald' },
        { value: 'upi', label: 'UPI', icon: Smartphone, color: 'purple' },
        { value: 'card', label: 'Card', icon: CreditCard, color: 'blue' },
        { value: 'cheque', label: 'Cheque', icon: FileText, color: 'amber' },
        { value: 'bank_transfer', label: 'Bank Transfer', icon: Building2, color: 'indigo' }
    ];

    const getMethodColorClasses = (method, isSelected) => {
        const colors = {
            emerald: isSelected ? 'border-emerald-500 bg-emerald-50 ring-2 ring-emerald-500/20' : 'border-slate-200 hover:border-emerald-300 hover:bg-emerald-50/50',
            purple: isSelected ? 'border-purple-500 bg-purple-50 ring-2 ring-purple-500/20' : 'border-slate-200 hover:border-purple-300 hover:bg-purple-50/50',
            blue: isSelected ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-500/20' : 'border-slate-200 hover:border-blue-300 hover:bg-blue-50/50',
            amber: isSelected ? 'border-amber-500 bg-amber-50 ring-2 ring-amber-500/20' : 'border-slate-200 hover:border-amber-300 hover:bg-amber-50/50',
            indigo: isSelected ? 'border-indigo-500 bg-indigo-50 ring-2 ring-indigo-500/20' : 'border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/50'
        };
        return colors[method] || colors.indigo;
    };

    const getIconColorClasses = (color, isSelected) => {
        const colors = {
            emerald: isSelected ? 'text-emerald-600' : 'text-slate-400 group-hover:text-emerald-500',
            purple: isSelected ? 'text-purple-600' : 'text-slate-400 group-hover:text-purple-500',
            blue: isSelected ? 'text-blue-600' : 'text-slate-400 group-hover:text-blue-500',
            amber: isSelected ? 'text-amber-600' : 'text-slate-400 group-hover:text-amber-500',
            indigo: isSelected ? 'text-indigo-600' : 'text-slate-400 group-hover:text-indigo-500'
        };
        return colors[color] || colors.indigo;
    };

    return (
        <Layout>
            {/* Modern Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl flex items-center justify-center shadow-lg shadow-amber-500/20">
                        <ArrowUpCircle className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">Payment Out</h1>
                        <p className="text-slate-500 text-sm">Record payments to suppliers</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <button className="inline-flex items-center gap-2 px-4 py-2.5 border border-slate-200 text-slate-700 text-sm font-medium rounded-xl hover:bg-slate-50 transition-colors">
                        <Printer className="w-4 h-4" />
                        Print Receipt
                    </button>
                    <button className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-amber-600 to-orange-600 text-white text-sm font-medium rounded-xl hover:from-amber-700 hover:to-orange-700 transition-all shadow-lg shadow-amber-500/25">
                        <Save className="w-4 h-4" />
                        Save Payment
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Content */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Payment Details Card */}
                    <div className="bg-white border border-slate-200 rounded-2xl p-6">
                        <div className="flex items-center gap-3 mb-5">
                            <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center">
                                <FileText className="w-4 h-4 text-slate-600" />
                            </div>
                            <h2 className="text-base font-semibold text-slate-900">Payment Details</h2>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormInput
                                label="Payment Number"
                                value={formData.paymentNo}
                                onChange={(e) => setFormData({ ...formData, paymentNo: e.target.value })}
                                required
                            />
                            <FormInput
                                label="Payment Date"
                                type="date"
                                value={formData.paymentDate}
                                onChange={(e) => setFormData({ ...formData, paymentDate: e.target.value })}
                                required
                            />
                        </div>
                    </div>

                    {/* Supplier Card */}
                    <div className="bg-white border border-slate-200 rounded-2xl p-6">
                        <div className="flex items-center gap-3 mb-5">
                            <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center">
                                <User className="w-4 h-4 text-slate-600" />
                            </div>
                            <h2 className="text-base font-semibold text-slate-900">Supplier</h2>
                        </div>
                        {formData.supplier ? (
                            <div className="p-4 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center">
                                            <span className="text-lg font-bold text-amber-700">
                                                {formData.supplier.businessName?.charAt(0) || 'S'}
                                            </span>
                                        </div>
                                        <div>
                                            <p className="font-semibold text-slate-900">{formData.supplier.businessName}</p>
                                            <p className="text-sm text-slate-600">{formData.supplier.contactPersonName}</p>
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
                                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                        title="Clear supplier"
                                    >
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <button
                                onClick={() => setShowSupplierModal(true)}
                                className="w-full px-4 py-4 border-2 border-dashed border-slate-300 rounded-xl text-slate-500 hover:border-amber-400 hover:text-amber-600 hover:bg-amber-50/50 transition-all flex items-center justify-center gap-2"
                            >
                                <User className="w-5 h-5" />
                                Click to select supplier
                            </button>
                        )}
                    </div>

                    {/* Payment Method Card */}
                    <div className="bg-white border border-slate-200 rounded-2xl p-6">
                        <div className="flex items-center gap-3 mb-5">
                            <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center">
                                <Wallet className="w-4 h-4 text-slate-600" />
                            </div>
                            <h2 className="text-base font-semibold text-slate-900">Payment Method</h2>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                            {paymentMethods.map((method) => {
                                const isSelected = formData.paymentMethod === method.value;
                                const IconComponent = method.icon;
                                return (
                                    <button
                                        key={method.value}
                                        onClick={() => setFormData({ ...formData, paymentMethod: method.value })}
                                        className={`group p-4 border-2 rounded-xl transition-all ${getMethodColorClasses(method.color, isSelected)}`}
                                    >
                                        <div className={`w-10 h-10 mx-auto mb-2 rounded-lg flex items-center justify-center transition-colors ${isSelected ? `bg-${method.color}-100` : 'bg-slate-100 group-hover:bg-slate-50'}`}>
                                            <IconComponent className={`w-5 h-5 transition-colors ${getIconColorClasses(method.color, isSelected)}`} />
                                        </div>
                                        <div className={`text-sm font-medium transition-colors ${isSelected ? 'text-slate-900' : 'text-slate-600'}`}>
                                            {method.label}
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Notes Card */}
                    <div className="bg-white border border-slate-200 rounded-2xl p-6">
                        <div className="flex items-center gap-3 mb-5">
                            <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center">
                                <FileText className="w-4 h-4 text-slate-600" />
                            </div>
                            <h2 className="text-base font-semibold text-slate-900">Notes</h2>
                        </div>
                        <textarea
                            value={formData.notes}
                            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                            rows="3"
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 resize-none transition-all"
                            placeholder="Add notes about this payment..."
                        />
                    </div>
                </div>

                {/* Summary Sidebar */}
                <div className="lg:col-span-1">
                    <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden sticky top-4">
                        {/* Header */}
                        <div className="bg-gradient-to-r from-amber-500 to-orange-500 p-5">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                                    <Wallet className="w-5 h-5 text-white" />
                                </div>
                                <div>
                                    <h2 className="text-base font-semibold text-white">Payment Summary</h2>
                                    <p className="text-amber-100 text-sm">Outgoing payment</p>
                                </div>
                            </div>
                        </div>

                        {/* Content */}
                        <div className="p-5">
                            <div className="mb-6">
                                <label className="block text-sm font-medium text-slate-700 mb-2">Amount Paid</label>
                                <div className="relative">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 text-xl font-medium">₹</span>
                                    <input
                                        type="number"
                                        value={formData.amount}
                                        onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })}
                                        className="w-full pl-10 pr-4 py-4 text-3xl font-bold text-slate-900 bg-slate-50 border-2 border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all"
                                        placeholder="0.00"
                                    />
                                </div>
                            </div>

                            {/* Quick Info */}
                            {formData.supplier && (
                                <div className="mb-6 p-4 bg-slate-50 rounded-xl">
                                    <p className="text-xs font-medium text-slate-400 uppercase tracking-wide mb-1">Paying To</p>
                                    <p className="text-sm font-semibold text-slate-900">{formData.supplier.businessName}</p>
                                </div>
                            )}

                            <div className="space-y-3">
                                <button className="w-full py-3.5 bg-gradient-to-r from-amber-600 to-orange-600 text-white text-sm font-medium rounded-xl hover:from-amber-700 hover:to-orange-700 transition-all shadow-lg shadow-amber-500/25 flex items-center justify-center gap-2">
                                    <Save className="w-4 h-4" />
                                    Save Payment
                                </button>
                                <button className="w-full py-3.5 border border-slate-200 text-slate-700 text-sm font-medium rounded-xl hover:bg-slate-50 transition-colors flex items-center justify-center gap-2">
                                    <Printer className="w-4 h-4" />
                                    Print Receipt
                                </button>
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

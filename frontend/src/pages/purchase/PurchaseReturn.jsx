import { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import FormInput from '../../components/FormInput';
import SupplierSelectionModal from '../../components/SupplierSelectionModal';
import api from '../../services/api';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import { RotateCcw, Save, Printer, FileText, User, Phone, X, Plus, Trash2, Package, Calculator, CreditCard, Banknote, Building2, RefreshCw, FileEdit, AlertTriangle } from 'lucide-react';

const PurchaseReturn = () => {
    const [formData, setFormData] = useState({
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
    const [bankAccounts, setBankAccounts] = useState([]);
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
                const userData = JSON.parse(localStorage.getItem('user'));
                const token = userData?.token;
                const response = await api.get(
                    `/api/cashbank/accounts`,
                    { headers: { Authorization: `Bearer ${token}` } }
                );
                setBankAccounts(response.data.filter(acc => acc.status === 'active'));
            } catch (error) {
                console.error('Error fetching banks:', error);
            }
        };
        fetchBanks();
    }, []);

    const addItem = () => setFormData({ ...formData, items: [...formData.items, { name: '', quantity: 1, rate: 0, tax: 18, amount: 0, reason: '' }] });

    const removeItem = (index) => {
        if (formData.items.length > 1) {
            const newItems = formData.items.filter((_, i) => i !== index);
            setFormData({ ...formData, items: newItems });
        }
    };

    const updateItem = (index, field, value) => {
        const newItems = [...formData.items];
        newItems[index][field] = value;
        if (field === 'quantity' || field === 'rate') newItems[index].amount = newItems[index].quantity * newItems[index].rate;
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
            const userData = JSON.parse(localStorage.getItem('user'));
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
            navigate('/purchase/bills');
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to process return');
        } finally {
            setLoading(false);
        }
    };

    const getMethodColorClasses = (method, isSelected) => {
        const colors = {
            indigo: isSelected ? 'border-indigo-500 bg-indigo-50 ring-2 ring-indigo-500/20' : 'border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/50',
            emerald: isSelected ? 'border-emerald-500 bg-emerald-50 ring-2 ring-emerald-500/20' : 'border-slate-200 hover:border-emerald-300 hover:bg-emerald-50/50',
            blue: isSelected ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-500/20' : 'border-slate-200 hover:border-blue-300 hover:bg-blue-50/50',
            purple: isSelected ? 'border-purple-500 bg-purple-50 ring-2 ring-purple-500/20' : 'border-slate-200 hover:border-purple-300 hover:bg-purple-50/50'
        };
        return colors[method] || colors.indigo;
    };

    return (
        <Layout>
            {/* Modern Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-rose-500 to-red-600 rounded-2xl flex items-center justify-center shadow-lg shadow-rose-500/20">
                        <RotateCcw className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">Purchase Return / Debit Note</h1>
                        <p className="text-slate-500 text-sm">Process returns to suppliers</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <button className="inline-flex items-center gap-2 px-4 py-2.5 border border-slate-200 text-slate-700 text-sm font-medium rounded-xl hover:bg-slate-50 transition-colors">
                        <Printer className="w-4 h-4" />
                        Print
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={loading}
                        className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-rose-600 to-red-600 text-white text-sm font-medium rounded-xl hover:from-rose-700 hover:to-red-700 transition-all shadow-lg shadow-rose-500/25 disabled:opacity-50"
                    >
                        <Save className="w-4 h-4" />
                        {loading ? 'Saving...' : 'Save Debit Note'}
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Content */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Debit Note Details Card */}
                    <div className="bg-white border border-slate-200 rounded-2xl p-6">
                        <div className="flex items-center gap-3 mb-5">
                            <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center">
                                <FileText className="w-4 h-4 text-slate-600" />
                            </div>
                            <h2 className="text-base font-semibold text-slate-900">Debit Note Details</h2>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormInput
                                label="Debit Note Number"
                                value={formData.debitNoteNo}
                                onChange={(e) => setFormData({ ...formData, debitNoteNo: e.target.value })}
                                required
                            />
                            <FormInput
                                label="Debit Note Date"
                                type="date"
                                value={formData.debitNoteDate}
                                onChange={(e) => setFormData({ ...formData, debitNoteDate: e.target.value })}
                                required
                            />
                        </div>
                    </div>

                    {/* Original Purchase Card */}
                    <div className="bg-white border border-slate-200 rounded-2xl p-6">
                        <div className="flex items-center gap-3 mb-5">
                            <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center">
                                <Package className="w-4 h-4 text-slate-600" />
                            </div>
                            <h2 className="text-base font-semibold text-slate-900">Original Purchase</h2>
                        </div>
                        <button className="w-full px-4 py-4 border-2 border-dashed border-slate-300 rounded-xl text-slate-500 hover:border-rose-400 hover:text-rose-600 hover:bg-rose-50/50 transition-all flex items-center justify-center gap-2">
                            <Package className="w-5 h-5" />
                            Click to select original purchase
                        </button>
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
                            <div className="p-4 bg-gradient-to-r from-rose-50 to-red-50 border border-rose-200 rounded-xl">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-rose-100 rounded-xl flex items-center justify-center">
                                            <span className="text-lg font-bold text-rose-700">
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
                                className="w-full px-4 py-4 border-2 border-dashed border-slate-300 rounded-xl text-slate-500 hover:border-rose-400 hover:text-rose-600 hover:bg-rose-50/50 transition-all flex items-center justify-center gap-2"
                            >
                                <User className="w-5 h-5" />
                                Click to select supplier
                            </button>
                        )}
                    </div>

                    {/* Return Items Card */}
                    <div className="bg-white border border-slate-200 rounded-2xl p-6">
                        <div className="flex items-center justify-between mb-5">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center">
                                    <AlertTriangle className="w-4 h-4 text-slate-600" />
                                </div>
                                <h2 className="text-base font-semibold text-slate-900">Return Items</h2>
                            </div>
                            <button
                                onClick={addItem}
                                className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700 transition-colors"
                            >
                                <Plus className="w-4 h-4" />
                                Add Item
                            </button>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="bg-slate-50 border-b border-slate-200">
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Item</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide w-20">Qty</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide w-28">Rate</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide w-24">Tax</th>
                                        <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wide w-28">Amount</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide w-36">Reason</th>
                                        <th className="px-4 py-3 w-12"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {formData.items.map((item, index) => (
                                        <tr key={index} className="group hover:bg-slate-50/50 transition-colors">
                                            <td className="px-4 py-3">
                                                <input
                                                    type="text"
                                                    value={item.name}
                                                    onChange={(e) => updateItem(index, 'name', e.target.value)}
                                                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all"
                                                    placeholder="Item name"
                                                />
                                            </td>
                                            <td className="px-4 py-3">
                                                <input
                                                    type="number"
                                                    value={item.quantity}
                                                    onChange={(e) => updateItem(index, 'quantity', parseFloat(e.target.value) || 0)}
                                                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all"
                                                />
                                            </td>
                                            <td className="px-4 py-3">
                                                <input
                                                    type="number"
                                                    value={item.rate}
                                                    onChange={(e) => updateItem(index, 'rate', parseFloat(e.target.value) || 0)}
                                                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all"
                                                />
                                            </td>
                                            <td className="px-4 py-3">
                                                <select
                                                    value={item.tax}
                                                    onChange={(e) => updateItem(index, 'tax', parseFloat(e.target.value))}
                                                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all"
                                                >
                                                    <option value="0">0%</option>
                                                    <option value="5">5%</option>
                                                    <option value="12">12%</option>
                                                    <option value="18">18%</option>
                                                    <option value="28">28%</option>
                                                </select>
                                            </td>
                                            <td className="px-4 py-3 text-right">
                                                <span className="font-semibold text-slate-900">₹{item.amount.toFixed(2)}</span>
                                            </td>
                                            <td className="px-4 py-3">
                                                <select
                                                    value={item.reason}
                                                    onChange={(e) => updateItem(index, 'reason', e.target.value)}
                                                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all"
                                                >
                                                    <option value="">Select reason</option>
                                                    {returnReasons.map(reason => (
                                                        <option key={reason} value={reason}>{reason}</option>
                                                    ))}
                                                </select>
                                            </td>
                                            <td className="px-4 py-3">
                                                <button
                                                    onClick={() => removeItem(index)}
                                                    className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
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
                    <div className="bg-white border border-slate-200 rounded-2xl p-6">
                        <div className="flex items-center gap-3 mb-5">
                            <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center">
                                <CreditCard className="w-4 h-4 text-slate-600" />
                            </div>
                            <h2 className="text-base font-semibold text-slate-900">Refund Details</h2>
                        </div>
                        <div className="space-y-5">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-3">Refund Method</label>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                    {refundMethods.map((method) => {
                                        const isSelected = formData.refundMethod === method.value;
                                        const IconComponent = method.icon;
                                        return (
                                            <button
                                                key={method.value}
                                                onClick={() => setFormData({ ...formData, refundMethod: method.value, bankAccount: '' })}
                                                className={`group p-4 border-2 rounded-xl transition-all ${getMethodColorClasses(method.color, isSelected)}`}
                                            >
                                                <div className={`w-10 h-10 mx-auto mb-2 rounded-lg flex items-center justify-center transition-colors ${isSelected ? `bg-${method.color}-100` : 'bg-slate-100'}`}>
                                                    <IconComponent className={`w-5 h-5 transition-colors ${isSelected ? `text-${method.color}-600` : 'text-slate-400'}`} />
                                                </div>
                                                <div className={`text-sm font-medium transition-colors ${isSelected ? 'text-slate-900' : 'text-slate-600'}`}>
                                                    {method.label}
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {formData.refundMethod === 'bank_transfer' && (
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">Select Bank Account</label>
                                    <select
                                        value={formData.bankAccount}
                                        onChange={(e) => setFormData({ ...formData, bankAccount: e.target.value })}
                                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all"
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
                                <label className="block text-sm font-medium text-slate-700 mb-2">Notes</label>
                                <textarea
                                    value={formData.notes}
                                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                    rows="3"
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 resize-none transition-all"
                                    placeholder="Add notes about this return..."
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Summary Sidebar */}
                <div className="lg:col-span-1">
                    <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden sticky top-4">
                        {/* Header */}
                        <div className="bg-gradient-to-r from-rose-500 to-red-500 p-5">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                                    <Calculator className="w-5 h-5 text-white" />
                                </div>
                                <div>
                                    <h2 className="text-base font-semibold text-white">Return Summary</h2>
                                    <p className="text-rose-100 text-sm">Refund calculation</p>
                                </div>
                            </div>
                        </div>

                        {/* Content */}
                        <div className="p-5">
                            <div className="space-y-4 mb-5">
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-slate-600">Subtotal</span>
                                    <span className="text-sm font-medium text-slate-900">₹{calculateSubtotal().toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-slate-600">Tax</span>
                                    <span className="text-sm font-medium text-slate-900">₹{calculateTax().toFixed(2)}</span>
                                </div>
                                <div>
                                    <label className="block text-sm text-slate-600 mb-2">Discount</label>
                                    <div className="relative">
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">₹</span>
                                        <input
                                            type="number"
                                            value={formData.discount}
                                            onChange={(e) => setFormData({ ...formData, discount: parseFloat(e.target.value) || 0 })}
                                            className="w-full pl-7 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Refund Amount */}
                            <div className="border-t border-slate-200 pt-4 mb-5">
                                <div className="flex justify-between items-center">
                                    <span className="text-lg font-bold text-slate-900">Refund Amount</span>
                                    <span className="text-2xl font-bold text-emerald-600">₹{calculateTotal().toFixed(2)}</span>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <button
                                    onClick={handleSubmit}
                                    disabled={loading}
                                    className="w-full py-3.5 bg-gradient-to-r from-rose-600 to-red-600 text-white text-sm font-medium rounded-xl hover:from-rose-700 hover:to-red-700 transition-all shadow-lg shadow-rose-500/25 flex items-center justify-center gap-2 disabled:opacity-50"
                                >
                                    <Save className="w-4 h-4" />
                                    {loading ? 'Saving...' : 'Save Debit Note'}
                                </button>
                                <button className="w-full py-3.5 border border-slate-200 text-slate-700 text-sm font-medium rounded-xl hover:bg-slate-50 transition-colors flex items-center justify-center gap-2">
                                    <Printer className="w-4 h-4" />
                                    Print Debit Note
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

export default PurchaseReturn;

import { useState } from 'react';
import Layout from '../../components/Layout';
import FormInput from '../../components/FormInput';
import SupplierSelectionModal from '../../components/SupplierSelectionModal';
import { ShoppingCart, Save, Printer, FileText, User, Phone, X, Plus, Trash2, Package, Calculator, Truck, FileEdit } from 'lucide-react';

const Purchase = () => {
    const [formData, setFormData] = useState({
        purchaseNo: 'PUR-' + Date.now(),
        purchaseDate: new Date().toISOString().split('T')[0],
        supplier: null,
        items: [{ name: '', quantity: 1, rate: 0, tax: 18, amount: 0 }],
        discount: 0,
        shippingCharges: 0,
        notes: ''
    });
    const [showSupplierModal, setShowSupplierModal] = useState(false);

    const addItem = () => setFormData({ ...formData, items: [...formData.items, { name: '', quantity: 1, rate: 0, tax: 18, amount: 0 }] });

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
    const calculateTotal = () => calculateSubtotal() + calculateTax() - formData.discount + formData.shippingCharges;

    return (
        <Layout>
            {/* Modern Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/20">
                        <ShoppingCart className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">Purchase Entry</h1>
                        <p className="text-slate-500 text-sm">Record supplier purchases</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <button className="inline-flex items-center gap-2 px-4 py-2.5 border border-slate-200 text-slate-700 text-sm font-medium rounded-xl hover:bg-slate-50 transition-colors">
                        <Printer className="w-4 h-4" />
                        Print
                    </button>
                    <button className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white text-sm font-medium rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all shadow-lg shadow-blue-500/25">
                        <Save className="w-4 h-4" />
                        Save Purchase
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Content */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Purchase Details Card */}
                    <div className="bg-white border border-slate-200 rounded-2xl p-6">
                        <div className="flex items-center gap-3 mb-5">
                            <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center">
                                <FileText className="w-4 h-4 text-slate-600" />
                            </div>
                            <h2 className="text-base font-semibold text-slate-900">Purchase Details</h2>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormInput
                                label="Purchase Number"
                                value={formData.purchaseNo}
                                onChange={(e) => setFormData({ ...formData, purchaseNo: e.target.value })}
                                required
                            />
                            <FormInput
                                label="Purchase Date"
                                type="date"
                                value={formData.purchaseDate}
                                onChange={(e) => setFormData({ ...formData, purchaseDate: e.target.value })}
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
                            <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                                            <span className="text-lg font-bold text-blue-700">
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
                                className="w-full px-4 py-4 border-2 border-dashed border-slate-300 rounded-xl text-slate-500 hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50/50 transition-all flex items-center justify-center gap-2"
                            >
                                <User className="w-5 h-5" />
                                Click to select supplier
                            </button>
                        )}
                    </div>

                    {/* Items Card */}
                    <div className="bg-white border border-slate-200 rounded-2xl p-6">
                        <div className="flex items-center justify-between mb-5">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center">
                                    <Package className="w-4 h-4 text-slate-600" />
                                </div>
                                <h2 className="text-base font-semibold text-slate-900">Items</h2>
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
                                                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                                                    placeholder="Item name"
                                                />
                                            </td>
                                            <td className="px-4 py-3">
                                                <input
                                                    type="number"
                                                    value={item.quantity}
                                                    onChange={(e) => updateItem(index, 'quantity', parseFloat(e.target.value) || 0)}
                                                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                                                />
                                            </td>
                                            <td className="px-4 py-3">
                                                <input
                                                    type="number"
                                                    value={item.rate}
                                                    onChange={(e) => updateItem(index, 'rate', parseFloat(e.target.value) || 0)}
                                                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                                                />
                                            </td>
                                            <td className="px-4 py-3">
                                                <select
                                                    value={item.tax}
                                                    onChange={(e) => updateItem(index, 'tax', parseFloat(e.target.value))}
                                                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
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

                    {/* Notes Card */}
                    <div className="bg-white border border-slate-200 rounded-2xl p-6">
                        <div className="flex items-center gap-3 mb-5">
                            <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center">
                                <FileEdit className="w-4 h-4 text-slate-600" />
                            </div>
                            <h2 className="text-base font-semibold text-slate-900">Notes</h2>
                        </div>
                        <textarea
                            value={formData.notes}
                            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                            rows="3"
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 resize-none transition-all"
                            placeholder="Add notes about this purchase..."
                        />
                    </div>
                </div>

                {/* Summary Sidebar */}
                <div className="lg:col-span-1">
                    <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden sticky top-4">
                        {/* Header */}
                        <div className="bg-gradient-to-r from-blue-500 to-indigo-500 p-5">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                                    <Calculator className="w-5 h-5 text-white" />
                                </div>
                                <div>
                                    <h2 className="text-base font-semibold text-white">Summary</h2>
                                    <p className="text-blue-100 text-sm">Purchase total</p>
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
                                            className="w-full pl-7 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="flex items-center gap-2 text-sm text-slate-600 mb-2">
                                        <Truck className="w-4 h-4" />
                                        Shipping
                                    </label>
                                    <div className="relative">
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">₹</span>
                                        <input
                                            type="number"
                                            value={formData.shippingCharges}
                                            onChange={(e) => setFormData({ ...formData, shippingCharges: parseFloat(e.target.value) || 0 })}
                                            className="w-full pl-7 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Total */}
                            <div className="border-t border-slate-200 pt-4 mb-5">
                                <div className="flex justify-between items-center">
                                    <span className="text-lg font-bold text-slate-900">Total</span>
                                    <span className="text-2xl font-bold text-blue-600">₹{calculateTotal().toFixed(2)}</span>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <button className="w-full py-3.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white text-sm font-medium rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2">
                                    <Save className="w-4 h-4" />
                                    Save Purchase
                                </button>
                                <button className="w-full py-3.5 border border-slate-200 text-slate-700 text-sm font-medium rounded-xl hover:bg-slate-50 transition-colors flex items-center justify-center gap-2">
                                    <FileText className="w-4 h-4" />
                                    Save as Draft
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

export default Purchase;

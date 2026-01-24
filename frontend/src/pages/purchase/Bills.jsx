import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import api from '../../services/api';
import { toast } from 'react-toastify';
import Layout from '../../components/Layout';
import FormInput from '../../components/FormInput';
import PaymentModal from '../../components/PaymentModal';
import { getAllBills, createBill, updateBill, deleteBill, reset } from '../../redux/slices/billSlice';
import { getAllSuppliers } from '../../redux/slices/supplierSlice';
import { FileText, Plus, IndianRupee, CheckCircle, AlertCircle, Search, Eye, Pencil, Trash2, CreditCard, Clock } from 'lucide-react';

const Bills = () => {
    const dispatch = useDispatch();
    const { bills, isLoading, isError, message } = useSelector(state => state.bill);
    const { suppliers } = useSelector(state => state.suppliers);

    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [showAddBill, setShowAddBill] = useState(false);
    const [deleteConfirm, setDeleteConfirm] = useState(null);
    const [editingBill, setEditingBill] = useState(null);
    const [bankAccounts, setBankAccounts] = useState([]);
    const [paymentModal, setPaymentModal] = useState({
        isOpen: false,
        bill: null
    });
    const [formData, setFormData] = useState({
        date: new Date().toISOString().split('T')[0],
        supplier: '',
        amount: '',
        dueDate: '',
        status: 'unpaid',
        description: '',
        paymentMethod: 'cash',
        paidAmount: 0,
        bankAccount: ''
    });

    useEffect(() => {
        dispatch(getAllBills());
        dispatch(getAllSuppliers());
        fetchBankAccounts();
        return () => {
            dispatch(reset());
        };
    }, [dispatch]);

    const fetchBankAccounts = async () => {
        try {
            const userData = JSON.parse(localStorage.getItem('user'));
            const token = userData?.token;
            const response = await api.get(
                `/api/cashbank/accounts`,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            console.log('Bank accounts response:', response.data);
            setBankAccounts(response.data);
        } catch (error) {
            console.error('Error fetching bank accounts:', error);
        }
    };

    const getStatusBadge = (status) => {
        switch (status) {
            case 'paid':
                return (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <CheckCircle className="w-3.5 h-3.5" />
                        Paid
                    </span>
                );
            case 'partial':
                return (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                        <Clock className="w-3.5 h-3.5" />
                        Partial
                    </span>
                );
            case 'unpaid':
                return (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-red-50 text-red-700 border border-red-200">
                        <AlertCircle className="w-3.5 h-3.5" />
                        Unpaid
                    </span>
                );
            default:
                return (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-slate-50 text-slate-700 border border-slate-200">
                        {status}
                    </span>
                );
        }
    };

    const handleMarkAsPaid = (bill) => {
        setPaymentModal({
            isOpen: true,
            bill
        });
    };

    const handlePaymentSubmit = async (paymentData) => {
        try {
            const userData = JSON.parse(localStorage.getItem('user'));
            const token = userData?.token;
            await api.put(
                `/api/bills/${paymentModal.bill._id}/payment`,
                paymentData,
                { headers: { Authorization: `Bearer ${token}` } }
            );

            toast.success('Payment recorded successfully');
            setPaymentModal({ isOpen: false, bill: null });
            dispatch(getAllBills());
        } catch (error) {
            toast.error(error.response?.data?.message || 'Payment failed');
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingBill) {
                await dispatch(updateBill({ id: editingBill._id, billData: formData }));
            } else {
                await dispatch(createBill(formData));
            }
            setShowAddBill(false);
            setEditingBill(null);
            resetForm();
            dispatch(getAllBills());
        } catch (error) {
            console.error('Error saving bill:', error);
        }
    };

    const handleEdit = (bill) => {
        setEditingBill(bill);
        setFormData({
            date: new Date(bill.date).toISOString().split('T')[0],
            supplier: bill.supplier._id,
            amount: bill.amount,
            dueDate: bill.dueDate ? new Date(bill.dueDate).toISOString().split('T')[0] : '',
            status: bill.status,
            description: bill.description || ''
        });
        setShowAddBill(true);
    };

    const handleDelete = async (id) => {
        try {
            await dispatch(deleteBill(id));
            setDeleteConfirm(null);
        } catch (error) {
            console.error('Error deleting bill:', error);
        }
    };

    const resetForm = () => {
        setFormData({
            date: new Date().toISOString().split('T')[0],
            supplier: '',
            amount: '',
            dueDate: '',
            status: 'unpaid',
            description: '',
            paymentMethod: 'cash',
            paidAmount: 0,
            bankAccount: ''
        });
    };

    const filteredBills = bills.filter(bill => {
        const matchesSearch = bill.billNo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (bill.supplier?.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            bill.amount?.toString().includes(searchTerm);
        const matchesStatus = statusFilter === 'all' || bill.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    const totalBillsAmount = bills.reduce((sum, bill) => sum + (bill.amount || 0), 0);
    const totalPaidAmount = bills.filter(bill => bill.status === 'paid').reduce((sum, bill) => sum + (bill.amount || 0), 0);
    const totalOutstanding = bills.filter(bill => bill.status === 'unpaid').reduce((sum, bill) => sum + (bill.amount || 0), 0);

    return (
        <Layout>
            {/* Modern Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
                        <FileText className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">Bills</h1>
                        <p className="text-slate-500 text-sm">Manage supplier bills and payments</p>
                    </div>
                </div>
                <button
                    onClick={() => setShowAddBill(true)}
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white text-sm font-medium rounded-xl hover:from-indigo-700 hover:to-indigo-800 transition-all shadow-lg shadow-indigo-500/25"
                >
                    <Plus className="w-4 h-4" />
                    New Bill
                </button>
            </div>

            {/* Error Message */}
            {isError && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3">
                    <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                    <p className="text-red-700 text-sm">{message}</p>
                </div>
            )}

            {/* KPI Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <div className="bg-white border border-slate-200 rounded-2xl p-5 hover:shadow-lg hover:shadow-slate-200/50 transition-all">
                    <div className="flex items-center justify-between mb-3">
                        <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
                            <FileText className="w-5 h-5 text-blue-600" />
                        </div>
                        <span className="text-xs font-medium text-slate-400 uppercase tracking-wide">Count</span>
                    </div>
                    <p className="text-2xl font-bold text-slate-900">{bills.length}</p>
                    <p className="text-sm text-slate-500 mt-1">Total Bills</p>
                </div>

                <div className="bg-white border border-slate-200 rounded-2xl p-5 hover:shadow-lg hover:shadow-slate-200/50 transition-all">
                    <div className="flex items-center justify-between mb-3">
                        <div className="w-10 h-10 bg-purple-50 rounded-xl flex items-center justify-center">
                            <IndianRupee className="w-5 h-5 text-purple-600" />
                        </div>
                        <span className="text-xs font-medium text-slate-400 uppercase tracking-wide">Value</span>
                    </div>
                    <p className="text-2xl font-bold text-slate-900">₹{totalBillsAmount.toLocaleString('en-IN')}</p>
                    <p className="text-sm text-slate-500 mt-1">Total Amount</p>
                </div>

                <div className="bg-white border border-slate-200 rounded-2xl p-5 hover:shadow-lg hover:shadow-slate-200/50 transition-all">
                    <div className="flex items-center justify-between mb-3">
                        <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center">
                            <CheckCircle className="w-5 h-5 text-emerald-600" />
                        </div>
                        <span className="text-xs font-medium text-slate-400 uppercase tracking-wide">Cleared</span>
                    </div>
                    <p className="text-2xl font-bold text-emerald-600">₹{totalPaidAmount.toLocaleString('en-IN')}</p>
                    <p className="text-sm text-slate-500 mt-1">Amount Paid</p>
                </div>

                <div className="bg-white border border-slate-200 rounded-2xl p-5 hover:shadow-lg hover:shadow-slate-200/50 transition-all">
                    <div className="flex items-center justify-between mb-3">
                        <div className="w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center">
                            <AlertCircle className="w-5 h-5 text-red-600" />
                        </div>
                        <span className="text-xs font-medium text-slate-400 uppercase tracking-wide">Pending</span>
                    </div>
                    <p className="text-2xl font-bold text-red-600">₹{totalOutstanding.toLocaleString('en-IN')}</p>
                    <p className="text-sm text-slate-500 mt-1">Outstanding</p>
                </div>
            </div>

            {/* Filter Island */}
            <div className="bg-white border border-slate-200 rounded-2xl p-4 mb-6">
                <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                    <div className="w-full sm:w-96 relative">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search by bill number or supplier..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                        />
                    </div>
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                    >
                        <option value="all">All Status</option>
                        <option value="paid">Paid</option>
                        <option value="partial">Partial</option>
                        <option value="unpaid">Unpaid</option>
                    </select>
                </div>
            </div>

            {/* Premium Table */}
            <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
                {isLoading ? (
                    <div className="flex flex-col items-center justify-center py-16">
                        <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-4"></div>
                        <p className="text-slate-500 text-sm">Loading bills...</p>
                    </div>
                ) : filteredBills.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16">
                        <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mb-4">
                            <FileText className="w-8 h-8 text-slate-400" />
                        </div>
                        <p className="text-slate-500 text-sm">
                            {searchTerm ? "No bills match your search" : "No bills recorded"}
                        </p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="bg-slate-50 border-b border-slate-200">
                                    <th className="text-left px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wide">Bill No</th>
                                    <th className="text-left px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wide">Date</th>
                                    <th className="text-left px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wide">Supplier</th>
                                    <th className="text-right px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wide">Amount</th>
                                    <th className="text-center px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wide">Status</th>
                                    <th className="text-right px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wide">Paid</th>
                                    <th className="text-left px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wide">Due Date</th>
                                    <th className="text-right px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wide">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {filteredBills.map((bill) => (
                                    <tr key={bill._id} className="group hover:bg-slate-50/50 transition-colors">
                                        <td className="px-6 py-4">
                                            <span className="font-semibold text-indigo-600">{bill.billNo}</span>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-slate-600">
                                            {new Date(bill.date).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-sm font-medium text-slate-900">
                                                {bill.supplier?.businessName || 'N/A'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <span className="text-sm font-semibold text-slate-900">
                                                ₹{(bill.amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            {getStatusBadge(bill.paymentStatus || bill.status)}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            {bill.paidAmount ? (
                                                <span className="text-sm font-medium text-emerald-600">
                                                    ₹{bill.paidAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                                </span>
                                            ) : (
                                                <span className="text-sm text-slate-400">₹0.00</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-slate-600">
                                            {bill.dueDate ? new Date(bill.dueDate).toLocaleDateString() : '—'}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                {bill.paymentStatus !== 'paid' && bill.status !== 'paid' && (
                                                    <button
                                                        onClick={() => handleMarkAsPaid(bill)}
                                                        className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                                                        title="Record Payment"
                                                    >
                                                        <CreditCard className="w-4 h-4" />
                                                    </button>
                                                )}
                                                <button
                                                    onClick={() => handleEdit(bill)}
                                                    className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                                                    title="Edit"
                                                >
                                                    <Pencil className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => setDeleteConfirm(bill._id)}
                                                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                    title="Delete"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Add/Edit Bill Modal */}
            {showAddBill && (
                <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50">
                    <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center">
                                <FileText className="w-5 h-5 text-indigo-600" />
                            </div>
                            <h2 className="text-lg font-bold text-slate-900">
                                {editingBill ? 'Edit Bill' : 'Add New Bill'}
                            </h2>
                        </div>
                        <form onSubmit={handleSubmit}>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                                <FormInput
                                    label="Date"
                                    type="date"
                                    value={formData.date}
                                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                    required
                                />

                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">Supplier <span className="text-red-500">*</span></label>
                                    <select
                                        value={formData.supplier}
                                        onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
                                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                                        required
                                    >
                                        <option value="">Select supplier</option>
                                        {suppliers.map(supplier => (
                                            <option key={supplier._id} value={supplier._id}>
                                                {supplier.businessName}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <FormInput
                                    label="Amount"
                                    type="number"
                                    value={formData.amount}
                                    onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || '' })}
                                    required
                                />

                                <FormInput
                                    label="Due Date (Optional)"
                                    type="date"
                                    value={formData.dueDate}
                                    onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                                />

                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">Payment Status</label>
                                    <select
                                        value={formData.status}
                                        onChange={(e) => setFormData({ ...formData, status: e.target.value, paidAmount: e.target.value === 'paid' ? formData.amount : 0 })}
                                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                                    >
                                        <option value="unpaid">Unpaid</option>
                                        <option value="paid">Paid</option>
                                    </select>
                                </div>

                                {formData.status === 'paid' && (
                                    <>
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-2">Payment Method</label>
                                            <select
                                                value={formData.paymentMethod}
                                                onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value, bankAccount: '' })}
                                                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                                            >
                                                <option value="cash">Cash</option>
                                                <option value="bank_transfer">Bank Transfer</option>
                                                <option value="upi">UPI</option>
                                                <option value="card">Card</option>
                                                <option value="cheque">Cheque</option>
                                            </select>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-2">Paid Amount</label>
                                            <input
                                                type="number"
                                                value={formData.paidAmount}
                                                onChange={(e) => setFormData({ ...formData, paidAmount: parseFloat(e.target.value) || 0 })}
                                                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                                                placeholder="Enter amount paid"
                                                max={formData.amount}
                                            />
                                        </div>

                                        {formData.paymentMethod === 'bank_transfer' && (
                                            <div className="md:col-span-2">
                                                <label className="block text-sm font-medium text-slate-700 mb-2">Bank Account <span className="text-red-500">*</span></label>
                                                <select
                                                    value={formData.bankAccount}
                                                    onChange={(e) => setFormData({ ...formData, bankAccount: e.target.value })}
                                                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                                                    required
                                                >
                                                    <option value="">Choose Bank Account</option>
                                                    {bankAccounts.map(acc => (
                                                        <option key={acc._id} value={acc._id}>
                                                            {acc.bankName} - ****{acc.accountNumber.slice(-4)} (₹{acc.currentBalance.toFixed(2)})
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>
                                        )}
                                    </>
                                )}

                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-slate-700 mb-2">Description</label>
                                    <textarea
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                        rows="2"
                                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 resize-none"
                                        placeholder="Add description..."
                                    />
                                </div>
                            </div>

                            <div className="flex gap-3">
                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="flex-1 px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white text-sm font-medium rounded-xl hover:from-indigo-700 hover:to-indigo-800 transition-all disabled:opacity-50"
                                >
                                    {isLoading ? 'Saving...' : (editingBill ? 'Update Bill' : 'Save Bill')}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowAddBill(false);
                                        setEditingBill(null);
                                        resetForm();
                                    }}
                                    className="px-4 py-2.5 border border-slate-200 text-slate-700 text-sm font-medium rounded-xl hover:bg-slate-50 transition-colors"
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {deleteConfirm && (
                <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50">
                    <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4 shadow-2xl border border-slate-200">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center">
                                <Trash2 className="w-5 h-5 text-red-600" />
                            </div>
                            <h3 className="text-lg font-bold text-slate-900">Confirm Delete</h3>
                        </div>
                        <p className="text-slate-600 mb-6 text-sm">
                            Are you sure you want to delete this bill? This action cannot be undone.
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setDeleteConfirm(null)}
                                className="flex-1 px-4 py-2.5 border border-slate-200 text-slate-700 text-sm font-medium rounded-xl hover:bg-slate-50 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => handleDelete(deleteConfirm)}
                                className="flex-1 px-4 py-2.5 bg-red-600 text-white text-sm font-medium rounded-xl hover:bg-red-700 transition-colors"
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Payment Modal */}
            {paymentModal.isOpen && paymentModal.bill && (
                <PaymentModal
                    isOpen={paymentModal.isOpen}
                    onClose={() => setPaymentModal({ isOpen: false, bill: null })}
                    onSubmit={handlePaymentSubmit}
                    documentType="Bill"
                    totalAmount={paymentModal.bill.amount}
                    paidAmount={paymentModal.bill.paidAmount || 0}
                />
            )}
        </Layout>
    );
};

export default Bills;

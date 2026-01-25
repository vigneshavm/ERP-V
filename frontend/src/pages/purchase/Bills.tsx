import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import api from '../../services/api';
import { toast } from 'react-toastify';
import Layout from '../../components/Layout';
import FormInput from '../../components/FormInput';
import PaymentModal from '../../components/PaymentModal';
import { getAllBills, createBill, updateBill, deleteBill, reset, Bill } from '../../redux/slices/billSlice';
import { getAllSuppliers, Supplier } from '../../redux/slices/supplierSlice';
import { RootState, AppDispatch } from '../../redux/store';
import {
    FileText, Plus, IndianRupee, CheckCircle, AlertCircle,
    Search, Pencil, Trash2, CreditCard, Clock, Eye
} from 'lucide-react';
import PageHeader from '../../components/PageHeader';
import StatsCard from '../../components/StatsCard';

// Using the icon from lucide-react directly


const Bills: React.FC = () => {
    const dispatch = useDispatch<AppDispatch>();
    const { bills, isLoading, isError, message } = useSelector((state: RootState) => state.bill);
    const { suppliers } = useSelector((state: RootState) => state.suppliers);

    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [showAddBill, setShowAddBill] = useState(false);
    const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
    const [editingBill, setEditingBill] = useState<Bill | null>(null);
    const [bankAccounts, setBankAccounts] = useState<any[]>([]);
    const [paymentModal, setPaymentModal] = useState<{ isOpen: boolean; bill: Bill | null }>({
        isOpen: false,
        bill: null
    });
    const [formData, setFormData] = useState({
        date: new Date().toISOString().split('T')[0],
        supplier: '',
        amount: 0,
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
            const userDataString = localStorage.getItem('user');
            if (!userDataString) return;
            const userData = JSON.parse(userDataString);
            const token = userData?.token;
            const response = await api.get(
                `/api/cashbank/accounts`,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setBankAccounts(response.data);
        } catch (error) {
            console.error('Error fetching bank accounts:', error);
        }
    };

    const getStatusBadge = (status: string) => {
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

    const handleMarkAsPaid = (bill: Bill) => {
        setPaymentModal({
            isOpen: true,
            bill
        });
    };

    const handlePaymentSubmit = async (paymentData: any) => {
        if (!paymentModal.bill) return;
        try {
            const userDataString = localStorage.getItem('user');
            if (!userDataString) return;
            const userData = JSON.parse(userDataString);
            const token = userData?.token;
            await api.put(
                `/api/bills/${paymentModal.bill._id}/payment`,
                paymentData,
                { headers: { Authorization: `Bearer ${token}` } }
            );

            toast.success('Payment recorded successfully');
            setPaymentModal({ isOpen: false, bill: null });
            dispatch(getAllBills());
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Payment failed');
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
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

    const handleEdit = (bill: Bill) => {
        setEditingBill(bill);
        setFormData({
            date: new Date(bill.date).toISOString().split('T')[0],
            supplier: bill.supplier._id,
            amount: bill.amount,
            dueDate: bill.dueDate ? new Date(bill.dueDate).toISOString().split('T')[0] : '',
            status: bill.status,
            description: bill.description || '',
            paymentMethod: 'cash',
            paidAmount: bill.paidAmount || 0,
            bankAccount: ''
        });
        setShowAddBill(true);
    };

    const handleDelete = async (id: string) => {
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
            amount: 0,
            dueDate: '',
            status: 'unpaid',
            description: '',
            paymentMethod: 'cash',
            paidAmount: 0,
            bankAccount: ''
        });
    };

    const filteredBills = bills.filter((bill: Bill) => {
        const matchesSearch = bill.billNo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (bill.supplier?.businessName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            bill.amount?.toString().includes(searchTerm);
        const matchesStatus = statusFilter === 'all' || bill.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    const totalBillsAmount = bills.reduce((sum: number, bill: Bill) => sum + (bill.amount || 0), 0);
    const totalPaidAmount = bills.filter((bill: Bill) => bill.status === 'paid').reduce((sum: number, bill: Bill) => sum + (bill.amount || 0), 0);
    const totalOutstanding = bills.filter((bill: Bill) => bill.status === 'unpaid').reduce((sum: number, bill: Bill) => sum + (bill.amount || 0), 0);

    const formatCurrency = (amount: number) =>
        new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);

    return (
        <Layout>
            <div className="space-y-6 animate-fade-in pb-10">
                <PageHeader
                    title="Supplier Bills"
                    description="Record and track bills from your vendors and suppliers"
                    actions={
                        <button
                            onClick={() => setShowAddBill(true)}
                            className="btn btn-primary"
                        >
                            <Plus className="w-4 h-4" />
                            New Bill
                        </button>
                    }
                />

                {/* KPI Metrics */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <StatsCard
                        title="Total Bills"
                        value={bills.length}
                        icon={<FileText className="w-full h-full" />}
                        iconBgColor="bg-blue-100"
                        iconColor="text-blue-600"
                    />
                    <StatsCard
                        title="Total Amount"
                        value={formatCurrency(totalBillsAmount)}
                        icon={<IndianRupee className="w-full h-full" />}
                        iconBgColor="bg-purple-100"
                        iconColor="text-purple-600"
                    />
                    <StatsCard
                        title="Amount Paid"
                        value={formatCurrency(totalPaidAmount)}
                        icon={<CheckCircle className="w-full h-full" />}
                        iconBgColor="bg-emerald-100"
                        iconColor="text-emerald-600"
                        trend="Settled"
                        trendUp={true}
                    />
                    <StatsCard
                        title="Outstanding"
                        value={formatCurrency(totalOutstanding)}
                        icon={<AlertCircle className="w-full h-full" />}
                        iconBgColor="bg-red-100"
                        iconColor="text-red-600"
                        trend="To be paid"
                        trendUp={false}
                    />
                </div>

                {/* Filter Sidebar */}
                <div className="bg-white dark:bg-[rgb(var(--color-card))] border dark:border-[rgb(var(--color-border))] rounded-2xl p-4">
                    <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                        <div className="w-full sm:w-96 relative">
                            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Search bill # or supplier..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-neutral-900 border border-slate-200 dark:border-neutral-700 rounded-xl text-sm"
                            />
                        </div>
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="px-4 py-2.5 bg-slate-50 dark:bg-neutral-900 border border-slate-200 dark:border-neutral-700 rounded-xl text-sm"
                        >
                            <option value="all">All Status</option>
                            <option value="paid">Paid</option>
                            <option value="partial">Partial</option>
                            <option value="unpaid">Unpaid</option>
                        </select>
                    </div>
                </div>

                {/* Table */}
                <div className="bg-white dark:bg-[rgb(var(--color-card))] border dark:border-[rgb(var(--color-border))] rounded-2xl overflow-hidden shadow-sm">
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center py-20">
                            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-brand-600 mb-4"></div>
                            <p className="text-neutral-500 font-medium">Loading bills...</p>
                        </div>
                    ) : filteredBills.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 text-neutral-500">
                            <FileText className="w-12 h-12 mb-4 opacity-20" />
                            <p className="font-medium">No bills found</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-slate-50 dark:bg-neutral-900/50 border-b dark:border-neutral-700">
                                    <tr>
                                        <th className="px-6 py-4 font-semibold text-slate-500 uppercase tracking-wider">Bill No</th>
                                        <th className="px-6 py-4 font-semibold text-slate-500 uppercase tracking-wider">Date</th>
                                        <th className="px-6 py-4 font-semibold text-slate-500 uppercase tracking-wider">Supplier</th>
                                        <th className="px-6 py-4 font-semibold text-slate-500 uppercase tracking-wider text-right">Amount</th>
                                        <th className="px-6 py-4 font-semibold text-slate-500 uppercase tracking-wider text-center">Status</th>
                                        <th className="px-6 py-4 font-semibold text-slate-500 uppercase tracking-wider text-right">Paid</th>
                                        <th className="px-6 py-4 font-semibold text-slate-500 uppercase tracking-wider">Due Date</th>
                                        <th className="px-6 py-4 font-semibold text-slate-500 uppercase tracking-wider text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-neutral-800">
                                    {filteredBills.map((bill: Bill) => (
                                        <tr key={bill._id} className="group hover:bg-slate-50/50 dark:hover:bg-neutral-800/50 transition-colors">
                                            <td className="px-6 py-4 font-semibold text-indigo-600 dark:text-indigo-400">
                                                {bill.billNo}
                                            </td>
                                            <td className="px-6 py-4 text-slate-600 dark:text-neutral-400">
                                                {new Date(bill.date).toLocaleDateString()}
                                            </td>
                                            <td className="px-6 py-4 font-medium text-slate-900 dark:text-white">
                                                {bill.supplier?.businessName || 'N/A'}
                                            </td>
                                            <td className="px-6 py-4 text-right font-semibold text-slate-900 dark:text-white">
                                                {formatCurrency(bill.amount)}
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                {getStatusBadge(bill.paymentStatus || bill.status)}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                {bill.paidAmount ? (
                                                    <span className="font-medium text-emerald-600 dark:text-emerald-400">
                                                        {formatCurrency(bill.paidAmount)}
                                                    </span>
                                                ) : (
                                                    <span className="text-slate-400 italic">₹0</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 text-slate-600 dark:text-neutral-400">
                                                {bill.dueDate ? new Date(bill.dueDate).toLocaleDateString() : '—'}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    {bill.paymentStatus !== 'paid' && bill.status !== 'paid' && (
                                                        <button
                                                            onClick={() => handleMarkAsPaid(bill)}
                                                            className="p-2 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-lg transition-colors"
                                                            title="Record Payment"
                                                        >
                                                            <CreditCard className="w-4 h-4" />
                                                        </button>
                                                    )}
                                                    <button
                                                        onClick={() => handleEdit(bill)}
                                                        className="p-2 text-slate-600 hover:bg-slate-100 dark:hover:bg-neutral-700 rounded-lg transition-colors"
                                                        title="Edit"
                                                    >
                                                        <Pencil className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => setDeleteConfirm(bill._id)}
                                                        className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
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

                {/* Modals - Simplified for migration demo */}
                {showAddBill && (
                    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                        <div className="bg-white dark:bg-neutral-800 rounded-2xl w-full max-w-lg shadow-2xl border dark:border-neutral-700 overflow-hidden">
                            <div className="p-6 border-b dark:border-neutral-700 flex items-center justify-between">
                                <h2 className="text-lg font-bold">{editingBill ? 'Edit Bill' : 'Add New Bill'}</h2>
                                <button onClick={() => { setShowAddBill(false); setEditingBill(null); resetForm(); }} className="text-neutral-500 hover:text-neutral-700">
                                    <Plus className="w-6 h-6 rotate-45" />
                                </button>
                            </div>
                            <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[70vh] overflow-y-auto custom-scrollbar">
                                <div className="grid grid-cols-2 gap-4">
                                    <FormInput
                                        label="Date"
                                        name="date"
                                        type="date"
                                        value={formData.date}
                                        onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                        required
                                    />
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 dark:text-neutral-300 mb-1">Supplier</label>
                                        <select
                                            value={formData.supplier}
                                            onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
                                            className="w-full px-4 py-2 bg-slate-50 dark:bg-neutral-900 border border-slate-200 dark:border-neutral-700 rounded-xl text-sm"
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
                                        name="amount"
                                        type="number"
                                        value={formData.amount}
                                        onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })}
                                        required
                                    />
                                    <FormInput
                                        label="Due Date"
                                        name="dueDate"
                                        type="date"
                                        value={formData.dueDate}
                                        onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-neutral-300 mb-1">Description</label>
                                    <textarea
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                        rows={3}
                                        className="w-full px-4 py-3 bg-slate-50 dark:bg-neutral-900 border border-slate-200 dark:border-neutral-700 rounded-xl text-sm"
                                        placeholder="Add notes..."
                                    />
                                </div>
                            </form>
                            <div className="p-6 bg-slate-50 dark:bg-neutral-900/50 border-t dark:border-neutral-700 flex gap-3">
                                <button
                                    onClick={handleSubmit}
                                    className="flex-1 btn btn-primary py-2.5"
                                >
                                    {editingBill ? 'Update Bill' : 'Save Bill'}
                                </button>
                                <button
                                    onClick={() => { setShowAddBill(false); setEditingBill(null); resetForm(); }}
                                    className="px-6 py-2.5 border border-slate-200 dark:border-neutral-700 rounded-xl text-sm font-medium"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Delete Confirm */}
                {deleteConfirm && (
                    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                        <div className="bg-white dark:bg-neutral-800 rounded-2xl w-full max-w-sm p-6 shadow-2xl border dark:border-neutral-700">
                            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
                                <Trash2 className="w-6 h-6 text-red-600" />
                            </div>
                            <h3 className="text-lg font-bold mb-2">Delete Bill?</h3>
                            <p className="text-neutral-500 text-sm mb-6">Are you sure you want to delete this bill? This action cannot be undone.</p>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => handleDelete(deleteConfirm)}
                                    className="flex-1 py-2.5 bg-red-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-red-500/20"
                                >
                                    Confirm Delete
                                </button>
                                <button
                                    onClick={() => setDeleteConfirm(null)}
                                    className="flex-1 py-2.5 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm font-medium"
                                >
                                    Cancel
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
            </div>
        </Layout>
    );
};

export default Bills;

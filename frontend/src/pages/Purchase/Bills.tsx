import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import api from "../../services/api.js";
import { toast } from 'react-toastify';
import Layout from "../../components/shared/Layout/index.js";
import FormInput from "../../components/core/Form/Input.js";
import PaymentModal from "../../components/shared/Modals/PaymentModal.js";
import { getAllBills, createBill, updateBill, deleteBill, reset, Bill } from "../../redux/slices/billSlice.js";
import { getAllSuppliers, Supplier } from "../../redux/slices/supplierSlice.js";
import { RootState, AppDispatch } from "../../redux/store.js";
import {
    FileText, Plus, IndianRupee, CheckCircle, AlertCircle,
    Search, Pencil, Trash2, CreditCard, Clock, Eye
} from 'lucide-react';
import PageHeader from "../../components/shared/Layout/PageHeader.js";
import StatsCard from "../../components/shared/Display/StatsCard.js";
import BillForm from "./BillForm";
import { BillStatus } from '../../types/purchase';

// Using the icon from lucide-react directly


const Bills: React.FC = () => {
    const navigate = useNavigate();
    const dispatch = useDispatch<AppDispatch>();
    const { bills, isLoading, isError, message } = useSelector((state: RootState) => state.bill);
    const { suppliers } = useSelector((state: RootState) => state.suppliers);

    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [showForm, setShowForm] = useState(false);
    const [editingBill, setEditingBill] = useState<Bill | null>(null);
    const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
    const [bankAccounts, setBankAccounts] = useState<any[]>([]);
    const [paymentModal, setPaymentModal] = useState<{ isOpen: boolean; bill: Bill | null }>({
        isOpen: false,
        bill: null
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
        const s = status?.toLowerCase();
        switch (s) {
            case 'paid':
                return (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 uppercase tracking-wider">
                        <CheckCircle className="w-3.5 h-3.5" />
                        Paid
                    </span>
                );
            case 'matched':
            case 'approved':
                return (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200 uppercase tracking-wider">
                        <CheckCircle className="w-3.5 h-3.5" />
                        {status}
                    </span>
                );
            case 'partial':
            case 'received':
                return (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200 uppercase tracking-wider">
                        <Clock className="w-3.5 h-3.5" />
                        {status}
                    </span>
                );
            case 'disputed':
            case 'rejected':
                return (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold bg-red-50 text-red-700 border border-red-200 uppercase tracking-wider">
                        <AlertCircle className="w-3.5 h-3.5" />
                        {status}
                    </span>
                );
            case 'hold':
                return (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-300 uppercase tracking-wider">
                        <Clock className="w-3.5 h-3.5" />
                        Hold
                    </span>
                );
            case 'unpaid':
                return (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold bg-red-50 text-red-700 border border-red-200 uppercase tracking-wider">
                        <AlertCircle className="w-3.5 h-3.5" />
                        Unpaid
                    </span>
                );
            default:
                return (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold bg-slate-50 text-slate-700 border border-slate-200 uppercase tracking-wider">
                        {status || 'Unknown'}
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

    const handleSaveBill = async (billData: any) => {
        try {
            if (editingBill) {
                await dispatch(updateBill({ id: editingBill?._id || editingBill?.id || '', billData }));
            } else {
                await dispatch(createBill(billData));
            }
            setShowForm(false);
            setEditingBill(null);
            dispatch(getAllBills());
        } catch (error) {
            console.error('Error saving bill:', error);
        }
    };

    const handleEdit = (bill: Bill) => {
        setEditingBill(bill);
        setShowForm(true);
    };

    const handleDelete = async (id: string) => {
        try {
            await dispatch(deleteBill(id));
            setDeleteConfirm(null);
        } catch (error) {
            console.error('Error deleting bill:', error);
        }
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
                            onClick={() => { setEditingBill(null); setShowForm(true); }}
                            className="btn btn-primary bg-brand-600 hover:bg-brand-700 shadow-brand-600/20"
                        >
                            <Plus className="w-4 h-4" />
                            New Bill
                        </button>
                    }
                />

                {showForm ? (
                    <BillForm
                        onBack={() => setShowForm(false)}
                        onSave={handleSaveBill}
                        initialData={editingBill as any}
                    />
                ) : (
                    <>

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
                                    <option value="Received">Received</option>
                                    <option value="Matched">Matched</option>
                                    <option value="Approved">Approved</option>
                                    <option value="Paid">Paid</option>
                                    <option value="Disputed">Disputed</option>
                                    <option value="Hold">On Hold</option>
                                </select>
                            </div>
                        </div>

                        {/* Table */}
                        <div className="bg-white dark:bg-[rgb(var(--color-card))] border dark:border-[rgb(var(--color-border))] rounded-2xl overflow-hidden shadow-sm">
                            {isLoading ? (
                                <div className="flex flex-col items-center justify-center py-20">
                                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-brand-600 mb-4"></div>
                                    <p className="text-muted font-medium">Loading bills...</p>
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
                                                <th className="px-6 py-4 font-semibold text-secondary uppercase tracking-wider">Bill Details</th>
                                                <th className="px-6 py-4 font-semibold text-secondary uppercase tracking-wider">Reference (PO/GRN)</th>
                                                <th className="px-6 py-4 font-semibold text-secondary uppercase tracking-wider">Supplier</th>
                                                <th className="px-6 py-4 font-semibold text-slate-500 uppercase tracking-wider text-right">Amount</th>
                                                <th className="px-6 py-4 font-semibold text-slate-500 uppercase tracking-wider text-center">Status</th>
                                                <th className="px-6 py-4 font-semibold text-secondary uppercase tracking-wider">Due Date</th>
                                                <th className="px-6 py-4 font-semibold text-slate-500 uppercase tracking-wider text-right">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100 dark:divide-neutral-800">
                                            {filteredBills.map((bill: any) => (
                                                <tr key={bill._id} className="group hover:bg-slate-50/50 dark:hover:bg-neutral-800/50 transition-colors">
                                                    <td className="px-6 py-4">
                                                        <div className="flex flex-col">
                                                            <span className="font-semibold text-indigo-600 dark:text-indigo-400">{bill.billNo || bill.bill_number}</span>
                                                            <span className="text-[10px] text-neutral-500">{new Date(bill.date || bill.bill_date).toLocaleDateString()}</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="flex flex-col gap-1">
                                                            {bill.po_number && (
                                                                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-neutral-500 bg-neutral-100 dark:bg-neutral-800 px-2 py-0.5 rounded">
                                                                    PO: {bill.po_number}
                                                                </span>
                                                            )}
                                                            {bill.grn_number && (
                                                                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-primary bg-primary/5 px-2 py-0.5 rounded">
                                                                    GRN: {bill.grn_number}
                                                                </span>
                                                            )}
                                                            {!bill.po_number && !bill.grn_number && <span className="text-neutral-400 text-xs">Direct Bill</span>}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span className="font-medium text-slate-900 dark:text-white truncate max-w-[150px] inline-block">
                                                            {bill.supplier?.businessName || bill.vendor_name || 'N/A'}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 text-right font-semibold text-slate-900 dark:text-white">
                                                        {formatCurrency(bill.amount || bill.total_amount)}
                                                    </td>
                                                    <td className="px-6 py-4 text-center">
                                                        {getStatusBadge(bill.status)}
                                                    </td>
                                                    <td className="px-6 py-4 text-secondary">
                                                        {bill.dueDate || bill.due_date ? new Date(bill.dueDate || bill.due_date).toLocaleDateString() : '—'}
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center justify-end gap-1 opacity-100 lg:opacity-0 group-hover:opacity-100 transition-opacity">
                                                            <button
                                                                onClick={() => navigate(`/purchase/bills/view/${bill._id || bill.id}`)}
                                                                className="p-2 text-primary hover:bg-primary/10 rounded-lg transition-colors"
                                                                title="View Details"
                                                            >
                                                                <Eye className="w-4 h-4" />
                                                            </button>
                                                            {(bill.status === 'unpaid' || bill.status === 'Approved' || bill.status === 'Matched') && (
                                                                <button
                                                                    onClick={() => handleMarkAsPaid(bill)}
                                                                    className="p-2 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-lg transition-colors"
                                                                    title="Record Payment"
                                                                >
                                                                    <CreditCard className="w-4 h-4" />
                                                                </button>
                                                            )}
                                                            <button
                                                                onClick={() => setDeleteConfirm(bill._id || bill.id)}
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

                    </>
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
                                    className="flex-1 py-1 px-4 bg-slate-100 hover:bg-slate-200 dark:bg-neutral-700 dark:hover:bg-neutral-600 rounded-lg text-sm font-medium transition-colors"
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


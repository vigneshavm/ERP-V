
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import api from "../../../services/api";
import { toast } from 'react-toastify';
import { getAllInvoices, deleteInvoice, resetPosState } from "../../../redux/slices/posSlice";
import Layout from "../../../components/shared/Layout/Layout";
import PaymentModal from "../../../components/shared/Modals/PaymentModal";
import { RootState } from "../../../redux/store";
import { AppDispatch } from "../../../redux/store";
import { Invoice } from "../../../types/sales";

interface PaymentModalState {
    isOpen: boolean;
    invoice: Invoice | null;
}

const Invoices = () => {
    const navigate = useNavigate();
    const dispatch = useDispatch<AppDispatch>();
    const { invoices, isLoading, isError, message } = useSelector(
        (state: RootState) => state.pos
    );

    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
    const [paymentModal, setPaymentModal] = useState<PaymentModalState>({
        isOpen: false,
        invoice: null
    });

    useEffect(() => {
        dispatch(getAllInvoices());
        return () => {
            dispatch(resetPosState());
        };
    }, [dispatch]);

    const handleDelete = async (id: string | null) => {
        if (!id) return;
        await dispatch(deleteInvoice(id));
        setDeleteConfirm(null);
        dispatch(getAllInvoices());
    };

    const handleReceivePayment = (invoice: Invoice) => {
        setPaymentModal({
            isOpen: true,
            invoice
        });
    };

    const handlePaymentSubmit = async (paymentData: any) => {
        try {
            if (!paymentModal.invoice) return;

            const userDataStr = localStorage.getItem('user');
            const userData = userDataStr ? JSON.parse(userDataStr) : null;
            const token = userData?.token;

            await api.put(
                `/api/pos/invoice/${paymentModal.invoice._id || paymentModal.invoice.id}/payment`,
                paymentData,
                { headers: { Authorization: `Bearer ${token}` } }
            );

            toast.success('Payment received successfully');
            setPaymentModal({ isOpen: false, invoice: null });
            dispatch(getAllInvoices());
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Payment failed');
        }
    };

    const filteredInvoices = invoices.filter((invoice) => {
        const customerName = typeof invoice.customer === 'string'
            ? invoice.customerName || ""
            : (invoice.customer?.name || "");

        const matchesSearch =
            invoice.invoiceNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
            customerName.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesStatus =
            statusFilter === "all" || invoice.paymentStatus === statusFilter;
        return matchesSearch && matchesStatus;
    });

    const getStatusColor = (status: string) => {
        switch (status) {
            case "paid":
                return "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/30";
            case "partial":
                return "bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400 border border-amber-200 dark:border-amber-900/30";
            case "unpaid":
                return "bg-rose-50 text-rose-700 dark:bg-rose-900/20 dark:text-rose-400 border border-rose-200 dark:border-rose-900/30";
            default:
                return "bg-surface text-secondary border border-default";
        }
    };

    const totalSales = invoices.reduce((sum, inv) => sum + inv.totalAmount, 0);
    const totalPaid = invoices.reduce((sum, inv) => sum + inv.paidAmount, 0);
    // const totalDue = totalSales - totalPaid;

    // Recalculate total due based on individual invoices to avoid precision errors or just simpler logic
    const totalDue = invoices.reduce((sum, inv) => {
        const paid = inv.paidAmount || 0;
        const due = inv.totalAmount - paid;
        return sum + (due > 0 ? due : 0);
    }, 0);


    return (
        <Layout>
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <button
                        onClick={() => navigate("/pos")}
                        className="flex items-center text-secondary hover:text-main mb-4 transition-colors"
                    >
                        <svg
                            className="w-5 h-5 mr-2"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M15 19l-7-7 7-7"
                            />
                        </svg>
                        Back to POS
                    </button>
                    <h1 className="text-3xl font-bold text-main mb-2">
                        Invoices
                    </h1>
                    <p className="text-secondary">
                        View and manage all invoices
                    </p>
                </div>

                {/* Error Message */}
                {isError && (
                    <div className="mb-6 p-4 bg-rose-50 dark:bg-rose-900/10 border border-rose-200 dark:border-rose-900/20 rounded-xl">
                        <p className="text-rose-600 dark:text-rose-400 text-sm font-medium">{message}</p>
                    </div>
                )}

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
                    <div className="bg-card rounded-xl shadow-sm border border-default p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-secondary text-sm font-medium">
                                    Total Invoices
                                </p>
                                <p className="text-3xl font-bold text-main mt-2">
                                    {invoices.length}
                                </p>
                            </div>
                            <div className="p-3 bg-primary-soft rounded-lg">
                                <svg
                                    className="w-8 h-8 text-primary"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                    />
                                </svg>
                            </div>
                        </div>
                    </div>

                    <div className="bg-card rounded-xl shadow-sm border border-default p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-secondary text-sm font-medium">
                                    Total Sales
                                </p>
                                <p className="text-3xl font-bold text-main mt-2">
                                    ₹{totalSales.toFixed(0)}
                                </p>
                            </div>
                            <div className="p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg">
                                <svg
                                    className="w-8 h-8 text-emerald-600"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                                    />
                                </svg>
                            </div>
                        </div>
                    </div>

                    <div className="bg-card rounded-xl shadow-sm border border-default p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-secondary text-sm font-medium">
                                    Amount Collected
                                </p>
                                <p className="text-3xl font-bold text-main mt-2">
                                    ₹{totalPaid.toFixed(0)}
                                </p>
                            </div>
                            <div className="p-3 bg-violet-50 dark:bg-violet-900/20 rounded-lg">
                                <svg
                                    className="w-8 h-8 text-violet-600"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"
                                    />
                                </svg>
                            </div>
                        </div>
                    </div>

                    <div className="bg-card rounded-xl shadow-sm border border-default p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-secondary text-sm font-medium">
                                    Outstanding Dues
                                </p>
                                <p className="text-3xl font-bold text-main mt-2">
                                    ₹{totalDue.toFixed(0)}
                                </p>
                            </div>
                            <div className="p-3 bg-rose-50 dark:bg-rose-900/20 rounded-lg">
                                <svg
                                    className="w-8 h-8 text-rose-600"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                                    />
                                </svg>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Filters */}
                <div className="bg-card rounded-xl shadow-sm border border-default p-4 mb-6">
                    <div className="flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0">
                        <div className="w-full sm:w-96">
                            <div className="relative">
                                <input
                                    type="text"
                                    placeholder="Search by invoice number or customer..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2 border border-default bg-input text-main placeholder:text-muted rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                                />
                                <svg
                                    className="absolute left-3 top-2.5 w-5 h-5 text-muted"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                                    />
                                </svg>
                            </div>
                        </div>

                        <div className="flex items-center space-x-4">
                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                                className="px-4 py-2 border border-default bg-input text-main rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                            >
                                <option value="all">All Status</option>
                                <option value="paid">Paid</option>
                                <option value="partial">Partial</option>
                                <option value="unpaid">Unpaid</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Invoices Table */}
                <div className="bg-card rounded-xl shadow-sm border border-default overflow-hidden">
                    {isLoading ? (
                        <div className="flex justify-center items-center py-12">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                        </div>
                    ) : filteredInvoices.length === 0 ? (
                        <div className="text-center py-12">
                            <svg
                                className="w-16 h-16 text-muted mx-auto mb-4"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                />
                            </svg>
                            <p className="text-secondary text-lg">
                                No invoices found
                            </p>
                            <button
                                onClick={() => navigate("/pos")}
                                className="mt-4 text-primary hover:text-primary-hover font-bold transition-colors"
                            >
                                Create your first invoice
                            </button>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-surface border-b border-default">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-bold text-secondary uppercase tracking-wider">
                                            Invoice No
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-bold text-secondary uppercase tracking-wider">
                                            Date
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-bold text-secondary uppercase tracking-wider">
                                            Customer
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-bold text-secondary uppercase tracking-wider">
                                            Items
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-bold text-secondary uppercase tracking-wider">
                                            Total
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-bold text-secondary uppercase tracking-wider">
                                            Paid
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-bold text-secondary uppercase tracking-wider">
                                            Status
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-bold text-secondary uppercase tracking-wider">
                                            Payment
                                        </th>
                                        <th className="px-6 py-3 text-right text-xs font-bold text-secondary uppercase tracking-wider">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-card divide-y divide-default">
                                    {filteredInvoices.map((invoice) => {
                                        const customerName = typeof invoice.customer === 'string'
                                            ? invoice.customerName || "Walk-in"
                                            : (invoice.customer?.name || "Walk-in");
                                        const customerPhone = typeof invoice.customer === 'string'
                                            ? invoice.customerPhone
                                            : invoice.customer?.phone;

                                        return (
                                            <tr
                                                key={invoice._id || invoice.id}
                                                className="hover:bg-surface transition-colors"
                                            >
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="text-sm font-bold text-primary">
                                                        {invoice.invoiceNo}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="text-sm text-main font-medium">
                                                        {new Date(invoice.createdAt).toLocaleDateString(
                                                            "en-IN"
                                                        )}
                                                    </div>
                                                    <div className="text-xs text-secondary">
                                                        {new Date(invoice.createdAt).toLocaleTimeString()}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="text-sm text-main font-semibold">
                                                        {customerName}
                                                    </div>
                                                    {customerPhone && (
                                                        <div className="text-xs text-secondary">
                                                            {customerPhone}
                                                        </div>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="text-sm text-main font-medium">
                                                        {invoice.items.length} items
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="text-sm font-bold text-main">
                                                        ₹{invoice.totalAmount.toFixed(2)}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="text-sm text-main font-medium">
                                                        ₹{invoice.paidAmount.toFixed(2)}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span
                                                        className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(
                                                            invoice.paymentStatus
                                                        )}`}
                                                    >
                                                        {invoice.paymentStatus}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className="text-sm text-main capitalize">
                                                        {invoice.paymentMethod}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-3">
                                                    {invoice.paymentStatus !== 'paid' && (
                                                        <button
                                                            onClick={() => handleReceivePayment(invoice)}
                                                            className="text-emerald-600 hover:text-emerald-700 font-bold transition-colors"
                                                        >
                                                            Receive
                                                        </button>
                                                    )}
                                                    <button
                                                        onClick={() =>
                                                            navigate(`/pos/invoice/${invoice._id || invoice.id}`)
                                                        }
                                                        className="text-primary hover:text-primary-hover font-bold transition-colors"
                                                    >
                                                        View
                                                    </button>
                                                    <button
                                                        onClick={() => setDeleteConfirm(invoice._id || invoice.id)}
                                                        className="text-rose-600 hover:text-rose-700 font-bold transition-colors"
                                                    >
                                                        Delete
                                                    </button>
                                                </td>
                                            </tr>
                                        )
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {/* Delete Confirmation Modal */}
                {deleteConfirm && (
                    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
                        <div className="bg-card rounded-xl p-6 max-w-md w-full mx-4 border border-default shadow-xl">
                            <h3 className="text-lg font-bold text-main mb-4">
                                Confirm Delete
                            </h3>
                            <p className="text-secondary mb-6">
                                Are you sure you want to delete this invoice? This action cannot
                                be undone.
                            </p>
                            <div className="flex space-x-4">
                                <button
                                    onClick={() => setDeleteConfirm(null)}
                                    className="flex-1 px-4 py-2 border border-default text-main bg-card rounded-lg hover:bg-surface transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={() => handleDelete(deleteConfirm)}
                                    className="flex-1 px-4 py-2 bg-error text-white rounded-lg hover:brightness-90 transition-all font-medium"
                                >
                                    Delete
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Payment Modal */}
                {paymentModal.isOpen && paymentModal.invoice && (
                    <PaymentModal
                        isOpen={paymentModal.isOpen}
                        onClose={() => setPaymentModal({ isOpen: false, invoice: null })}
                        onSubmit={handlePaymentSubmit}
                        documentType="Invoice"
                        totalAmount={paymentModal.invoice.totalAmount}
                        paidAmount={paymentModal.invoice.paidAmount || 0}
                    />
                )}
            </div>
        </Layout>
    );
};

export default Invoices;

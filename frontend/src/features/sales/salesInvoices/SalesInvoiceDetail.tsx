import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import { getSalesInvoiceById, reset, clearSalesInvoice, markSalesInvoiceAsPaid, editSalesInvoice } from "@/redux/slices/salesInvoiceSlice";
import Layout from "@/components/shared/Layout/Layout";
import PaymentModal from "../../../components/shared/Modals/PaymentModal";
import { AppDispatch, RootState } from "@/redux/store";
import { Customer, PopulatedInvoice } from "@/types/sales";
import receiptDataService from "@/services/receiptDataService";
import { printSaleReceipt } from "@/utils/printService";
import {
    CheckCircle,
    Clock,
    AlertCircle,
    ArrowLeft,
    Printer,
    CreditCard,
    Phone,
    Mail,
    MapPin,
    Receipt,
    BadgeCheck,
    Pencil,
    X
} from 'lucide-react';

// Editing a completed invoice's line qty/price/discount is sensitive (it reverses/adjusts
// stock and recomputes totals -- see backend's PosController.editInvoice), so it's restricted
// to the same roles as discount approval, mirroring usePOSCheckout.ts's DISCOUNT_APPROVER_ROLES.
const INVOICE_EDIT_ROLES = ['owner', 'co-owner', 'manager'];

interface EditableInvoiceItem {
    item: string;
    name?: string;
    quantity: number;
    price: number;
    discount: number;
}

const SalesInvoiceDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const dispatch = useDispatch<AppDispatch>();
    const { invoice, isLoading, isError, message } = useSelector((state: RootState) => state.salesInvoice);
    const { user } = useSelector((state: RootState) => state.auth);
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [editItems, setEditItems] = useState<EditableInvoiceItem[]>([]);
    const [editDiscount, setEditDiscount] = useState(0);
    const [editReason, setEditReason] = useState('');
    const [editSubmitting, setEditSubmitting] = useState(false);
    const [editError, setEditError] = useState('');
    const [isPrintingReceipt, setIsPrintingReceipt] = useState(false);

    const canEditInvoice = !!(user?.role && INVOICE_EDIT_ROLES.includes(user.role));

    useEffect(() => {
        if (id) {
            dispatch(getSalesInvoiceById(id));
        }
        return () => {
            dispatch(reset());
        };
    }, [dispatch, id]);

    const handlePrint = () => {
        window.print();
    };

    // Reprints this invoice as a thermal/POS-style customer receipt (distinct from
    // handlePrint's browser print of this A4 detail page). This is the one production entry
    // point for receiptDataService.fetchReceiptContext: it re-fetches the invoice by its real
    // invoiceNo (same GET /api/sales-invoice/invoice/:id this page already loads via
    // getSalesInvoiceById) plus tenant/branch, then feeds them through the same
    // generateReceiptJSON/printSaleReceipt pipeline POS checkout uses. POS checkout itself must
    // keep building Sale/Tenant/Branch from in-memory/redux state -- it prints immediately after
    // an offline-capable checkout, before any server round trip is guaranteed to have completed,
    // so an API refetch there would risk printing fallback/dummy data. Here the invoice is
    // already confirmed to exist server-side (it's on screen), so a fetch is safe.
    const handlePrintReceipt = async () => {
        if (!invoice?.invoiceNo || isPrintingReceipt) return;
        setIsPrintingReceipt(true);
        try {
            const { sale, tenant, branch } = await receiptDataService.fetchReceiptContext(invoice.invoiceNo, { strict: true });
            printSaleReceipt(sale, tenant, branch);
        } catch (error) {
            console.error('Failed to print receipt', error);
            toast.error('Could not print the receipt. Please try again.');
        } finally {
            setIsPrintingReceipt(false);
        }
    };

    const handlePayment = async (paymentData: any) => {
        if (!invoice) return;
        const result = await dispatch(markSalesInvoiceAsPaid({
            id: (invoice._id || invoice.id) as string,
            amount: paymentData.paidAmount,
            bankAccount: paymentData.bankAccount,
            paymentMethod: paymentData.paymentMethod
        }));

        if (result.meta.requestStatus === 'fulfilled') {
            setShowPaymentModal(false);
            if (id) dispatch(getSalesInvoiceById(id));
        }
    };

    const openEditModal = () => {
        if (!invoice) return;
        setEditItems(
            (invoice.items || []).map((it) => ({
                item: it.item,
                name: it.name,
                quantity: it.quantity,
                price: it.price,
                discount: it.discount || 0,
            }))
        );
        setEditDiscount(invoice.discount || 0);
        setEditReason('');
        setEditError('');
        setShowEditModal(true);
    };

    const updateEditItem = (index: number, field: 'quantity' | 'price' | 'discount', value: number) => {
        setEditItems((prev) => prev.map((it, i) => (i === index ? { ...it, [field]: value } : it)));
    };

    const handleSaveEdit = async () => {
        if (!invoice) return;
        if (!editReason.trim()) {
            setEditError('An edit reason is required.');
            return;
        }
        setEditSubmitting(true);
        setEditError('');
        const result = await dispatch(editSalesInvoice({
            id: (invoice._id || invoice.id) as string,
            items: editItems.map((it) => ({
                item: it.item,
                quantity: it.quantity,
                price: it.price,
                discount: it.discount,
            })),
            discount: editDiscount,
            editReason: editReason.trim(),
        }));
        setEditSubmitting(false);

        if (result.meta.requestStatus === 'fulfilled') {
            setShowEditModal(false);
            if (id) dispatch(getSalesInvoiceById(id));
        } else {
            setEditError((result.payload as string) || 'Failed to save invoice edits.');
        }
    };

    const getStatusConfig = (status: string) => {
        const configs: Record<string, any> = {
            'paid': { color: 'from-emerald-500 to-emerald-600', icon: CheckCircle, text: 'Paid in Full', badge: 'bg-emerald-100 text-emerald-800' },
            'partial': { color: 'from-amber-500 to-amber-600', icon: Clock, text: 'Partially Paid', badge: 'bg-amber-100 text-amber-800' },
            'unpaid': { color: 'from-red-500 to-red-600', icon: AlertCircle, text: 'Payment Due', badge: 'bg-red-100 text-red-800' }
        };
        return configs[status] || configs['unpaid'];
    };

    const isCustomer = (cust: any): cust is Customer => {
        return cust && typeof cust === 'object' && 'name' in cust;
    };

    if (isLoading || !invoice) {
        return (
            <Layout>
                <div className="flex flex-col items-center justify-center py-20">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary mb-4"></div>
                    <p className="text-secondary opacity-70 font-medium">Loading invoice...</p>
                </div>
            </Layout>
        );
    }

    if (isError) {
        return (
            <Layout>
                <div className="max-w-4xl mx-auto">
                    <div className="p-4 bg-danger/10 border border-red-200 rounded-lg flex items-center gap-3">
                        <AlertCircle className="w-5 h-5 text-red-500" />
                        <p className="text-red-700">{message}</p>
                    </div>
                    <button
                        onClick={() => navigate('/sales/invoice')}
                        className="mt-4 text-primary hover:text-primary font-medium flex items-center gap-2"
                    >
                        <ArrowLeft className="w-4 h-4" /> Back to Sales Invoices
                    </button>
                </div>
            </Layout>
        );
    }

    const populatedInvoice = invoice as unknown as PopulatedInvoice;
    const statusConfig = getStatusConfig(invoice.paymentStatus);
    const StatusIcon = statusConfig.icon;
    const balanceDue = (invoice.totalAmount || 0) - (invoice.paidAmount || 0);

    return (
        <Layout>
            <div className="space-y-6 animate-fade-in pb-10">
                {/* Immersive Status Banner */}
                <div className={`bg-gradient-to-r ${statusConfig.color} rounded-[2rem] p-8 text-white shadow-xl relative overflow-hidden print:hidden`}>
                    <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
                        <Receipt className="w-48 h-48" />
                    </div>
                    <div className="relative z-10">
                        <button
                            onClick={() => navigate('/sales')}
                            className="flex items-center gap-2 text-white/80 hover:text-white text-sm font-medium mb-6 transition-colors"
                        >
                            <ArrowLeft className="w-4 h-4" /> Back to Invoices
                        </button>
                        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                            <div>
                                <div className="flex items-center gap-3 mb-2">
                                    <StatusIcon className="w-6 h-6" />
                                    <span className="text-white/80 text-sm font-bold uppercase tracking-widest">{statusConfig.text}</span>
                                </div>
                                <h1 className="text-4xl font-black tracking-tight mb-2">{invoice.invoiceNo}</h1>
                                <p className="text-white/80 font-medium">
                                    {populatedInvoice.customer?.name || 'Walk-in Customer'} • {new Date(invoice.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                                </p>
                                {balanceDue > 0 && (
                                    <div className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 glass-panel/20 rounded-xl text-sm font-bold">
                                        <AlertCircle className="w-4 h-4" /> ₹{balanceDue.toFixed(2)} Balance Due
                                    </div>
                                )}
                            </div>
                            <div className="flex flex-wrap gap-3">
                                <button
                                    onClick={handlePrint}
                                    className="px-4 py-2.5 glass-panel/10 backdrop-blur-md border border-white/20 text-white rounded-xl text-sm font-bold hover:glass-panel/20 transition-all flex items-center gap-2"
                                >
                                    <Printer className="w-4 h-4" /> Print
                                </button>
                                <button
                                    onClick={handlePrintReceipt}
                                    disabled={isPrintingReceipt}
                                    title="Print the customer-facing thermal receipt for this invoice"
                                    className="px-4 py-2.5 glass-panel/10 backdrop-blur-md border border-white/20 text-white rounded-xl text-sm font-bold hover:glass-panel/20 transition-all flex items-center gap-2 disabled:opacity-50"
                                >
                                    <Receipt className="w-4 h-4" /> {isPrintingReceipt ? 'Printing...' : 'Print Receipt'}
                                </button>
                                {invoice.paymentStatus !== 'paid' && (
                                    <button
                                        onClick={() => setShowPaymentModal(true)}
                                        className="px-4 py-2.5 glass-panel text-emerald-700 rounded-xl text-sm font-bold shadow-lg hover:bg-success/10 transition-all flex items-center gap-2"
                                    >
                                        <CreditCard className="w-4 h-4" /> Record Payment
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 space-y-6">
                        {/* Customer Card */}
                        {invoice.customer && (
                            <div className="glass-panel border border-default/30 rounded-sm shadow-sm overflow-hidden print:shadow-none print:border">
                                <div className="bg-surface/40 px-6 py-3 border-b border-default/20">
                                    <h2 className="text-xs font-bold text-secondary opacity-70 uppercase tracking-wider">Bill To</h2>
                                </div>
                                <div className="p-6 flex items-start gap-4">
                                    <div className="w-14 h-14 rounded-sm bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white text-xl font-black shadow-lg">
                                        {isCustomer(invoice.customer) ? (invoice.customer.name.charAt(0).toUpperCase()) : '?'}
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-lg font-bold text-main">
                                            {populatedInvoice.customer?.name || 'Customer'}
                                        </p>
                                        <div className="flex flex-wrap gap-4 mt-2 text-sm text-secondary">
                                            {populatedInvoice.customer?.phone && (
                                                <span className="flex items-center gap-1.5">
                                                    <Phone className="w-4 h-4 text-secondary opacity-50" /> {populatedInvoice.customer.phone}
                                                </span>
                                            )}
                                            {populatedInvoice.customer?.email && (
                                                <span className="flex items-center gap-1.5">
                                                    <Mail className="w-4 h-4 text-secondary opacity-50" /> {populatedInvoice.customer.email}
                                                </span>
                                            )}
                                        </div>
                                        {populatedInvoice.customer?.address && (
                                            <p className="mt-2 text-sm text-secondary opacity-70 flex items-start gap-1.5">
                                                <MapPin className="w-4 h-4 text-secondary opacity-50 mt-0.5" /> {populatedInvoice.customer.address}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Invoice Items */}
                        <div className="glass-panel border border-default/30 rounded-sm shadow-sm overflow-hidden print:shadow-none print:border">
                            <div className="bg-surface/40 px-6 py-3 border-b border-default/20 flex justify-between items-center">
                                <h2 className="text-xs font-bold text-secondary opacity-70 uppercase tracking-wider">Invoice Items</h2>
                                <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase ${statusConfig.badge}`}>
                                    {invoice.paymentStatus}
                                </span>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead className="bg-surface/40 border-b border-default/30">
                                        <tr className="text-xs font-bold text-secondary opacity-70 uppercase tracking-wider">
                                            <th className="px-4 py-3 text-center w-12">#</th>
                                            <th className="px-4 py-3">Item</th>
                                            <th className="px-4 py-3 text-right">Qty</th>
                                            <th className="px-4 py-3 text-right">Price</th>
                                            <th className="px-4 py-3 text-right">Total</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-default/20">
                                        {invoice.items?.map((item, index) => (
                                            <tr key={index} className="hover:bg-surface/40/80 transition-colors">
                                                <td className="px-4 py-3 text-center text-xs text-secondary opacity-50 font-bold">{index + 1}</td>
                                                <td className="px-4 py-3 font-medium text-main">{item.name || 'Item'}</td>
                                                <td className="px-4 py-3 text-right font-medium">{item.quantity}</td>
                                                <td className="px-4 py-3 text-right text-secondary">₹{item.price?.toFixed(2) || '0.00'}</td>
                                                <td className="px-4 py-3 text-right font-bold text-main">₹{item.total?.toFixed(2) || '0.00'}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Invoice Info */}
                        <div className="glass-panel border border-default/30 rounded-sm shadow-sm overflow-hidden print:shadow-none print:border">
                            <div className="bg-surface/40 px-6 py-3 border-b border-default/20 flex justify-between items-center">
                                <h2 className="text-xs font-bold text-secondary opacity-70 uppercase tracking-wider">Invoice Details</h2>
                                {invoice.isEdited && (
                                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase bg-amber-100 text-amber-800" title={invoice.lastEditReason || ''}>
                                        Edited
                                    </span>
                                )}
                            </div>
                            <div className="p-6 grid grid-cols-2 md:grid-cols-4 gap-6">
                                <div>
                                    <p className="text-xs font-bold text-secondary opacity-50 uppercase tracking-wider mb-1">Invoice No</p>
                                    <p className="text-sm font-bold text-main">{invoice.invoiceNo}</p>
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-secondary opacity-50 uppercase tracking-wider mb-1">Invoice Date</p>
                                    <p className="text-sm font-medium text-main">
                                        {new Date(invoice.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-secondary opacity-50 uppercase tracking-wider mb-1">Payment Method</p>
                                    <p className="text-sm font-medium text-main capitalize">{invoice.paymentMethod || 'N/A'}</p>
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-secondary opacity-50 uppercase tracking-wider mb-1">Time</p>
                                    <p className="text-sm font-medium text-main">
                                        {new Date(invoice.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Sidebar */}
                    <div className="lg:col-span-1 space-y-6">
                        {/* Payment Summary */}
                        <div className="glass-panel border border-indigo-100 rounded-sm shadow-sm overflow-hidden sticky top-4 print:shadow-none print:border">
                            <div className="bg-primary/10/50 px-6 py-3 border-b border-indigo-100">
                                <h2 className="text-xs font-bold text-indigo-800 uppercase tracking-wider">Payment Summary</h2>
                            </div>
                            <div className="p-6 space-y-4">
                                <div className="flex justify-between text-sm">
                                    <span className="text-secondary opacity-70 font-medium">Subtotal</span>
                                    <span className="font-bold text-main">₹{invoice.subtotal?.toFixed(2) || '0.00'}</span>
                                </div>
                                {(invoice.tax || 0) > 0 && (
                                    <div className="flex justify-between text-sm">
                                        <span className="text-secondary opacity-70 font-medium">Tax</span>
                                        <span className="font-bold text-main">+₹{invoice.tax?.toFixed(2) || '0.00'}</span>
                                    </div>
                                )}
                                {(invoice.discount || 0) > 0 && (
                                    <div className="flex justify-between text-sm">
                                        <span className="text-secondary opacity-70 font-medium">Discount</span>
                                        <span className="font-bold text-danger">-₹{invoice.discount?.toFixed(2) || '0.00'}</span>
                                    </div>
                                )}
                                <div className="border-t pt-4">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-secondary opacity-70 font-medium">Total Amount</span>
                                        <span className="font-bold text-main">₹{invoice.totalAmount?.toFixed(2) || '0.00'}</span>
                                    </div>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-secondary opacity-70 font-medium">Paid Amount</span>
                                    <span className="font-bold text-success">₹{invoice.paidAmount?.toFixed(2) || '0.00'}</span>
                                </div>
                            </div>
                            <div className={`px-6 py-5 flex justify-between items-center text-white ${balanceDue > 0 ? 'bg-red-600' : 'bg-emerald-600'
                                }`}>
                                <span className="text-lg font-bold tracking-tight">
                                    {balanceDue > 0 ? 'Balance Due' : 'Fully Paid'}
                                </span>
                                <span className="text-2xl font-bold tracking-tight">
                                    {balanceDue > 0 ? `₹${balanceDue.toFixed(2)}` : <BadgeCheck className="w-8 h-8" />}
                                </span>
                            </div>
                        </div>

                        {/* Quick Actions */}
                        <div className="glass-panel border border-default/30 rounded-sm shadow-sm overflow-hidden print:hidden">
                            <div className="bg-surface/40 px-6 py-3 border-b border-default/20">
                                <h2 className="text-xs font-bold text-secondary opacity-70 uppercase tracking-wider">Quick Actions</h2>
                            </div>
                            <div className="p-4 space-y-2">
                                {invoice.paymentStatus !== 'paid' && (
                                    <button
                                        onClick={() => setShowPaymentModal(true)}
                                        className="w-full py-3 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition-all flex items-center justify-center gap-2"
                                    >
                                        <CreditCard className="w-4 h-4" /> Record Payment
                                    </button>
                                )}
                                {canEditInvoice && (
                                    <button
                                        onClick={openEditModal}
                                        className="w-full py-3 border border-default/40 text-main opacity-90 rounded-xl font-medium hover:bg-surface/40 transition-all flex items-center justify-center gap-2"
                                    >
                                        <Pencil className="w-4 h-4" /> Edit Invoice
                                    </button>
                                )}
                                <button
                                    onClick={handlePrint}
                                    className="w-full py-3 border border-default/40 text-main opacity-90 rounded-xl font-medium hover:bg-surface/40 transition-all flex items-center justify-center gap-2"
                                >
                                    <Printer className="w-4 h-4" /> Print Invoice
                                </button>
                                <button
                                    onClick={handlePrintReceipt}
                                    disabled={isPrintingReceipt}
                                    className="w-full py-3 border border-default/40 text-main opacity-90 rounded-xl font-medium hover:bg-surface/40 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                                >
                                    <Receipt className="w-4 h-4" /> {isPrintingReceipt ? 'Printing...' : 'Print Receipt'}
                                </button>
                                <button
                                    onClick={() => {
                                        dispatch(clearSalesInvoice());
                                        dispatch(reset());
                                        navigate('/sales/invoice');
                                    }}
                                    className="w-full py-3 border border-default/40 text-main opacity-90 rounded-xl font-medium hover:bg-surface/40 transition-all flex items-center justify-center gap-2"
                                >
                                    <ArrowLeft className="w-4 h-4" /> Back to List
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Print Footer */}
                <div className="hidden print:block mt-12 pt-6 border-t text-center text-secondary opacity-70 text-sm">
                    <p>Thank you for your business!</p>
                    <p className="mt-1">This is a computer-generated invoice.</p>
                </div>
            </div>

            {/* Print Styles */}
            <style>{`
                @media print {
                    .print\\:hidden { display: none !important; }
                    .print\\:shadow-none { box-shadow: none !important; }
                    .print\\:border { border: 1px solid #e2e8f0 !important; }
                    .print\\:block { display: block !important; }
                }
            `}</style>

            {/* Payment Modal */}
            {showPaymentModal && (
                <PaymentModal
                    isOpen={showPaymentModal}
                    onClose={() => setShowPaymentModal(false)}
                    onSubmit={handlePayment}
                    documentType="Sales Invoice"
                    totalAmount={invoice.totalAmount}
                    paidAmount={invoice.paidAmount}
                />
            )}

            {/* Edit Invoice Modal -- corrects existing lines' qty/price/discount only.
                Cannot add/remove lines or touch payment fields; see PosController.editInvoice. */}
            {showEditModal && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-sm shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                        <div className="px-6 py-4 border-b border-default/20 flex justify-between items-center sticky top-0 bg-white z-10">
                            <h2 className="text-lg font-bold text-main">Edit Invoice {invoice.invoiceNo}</h2>
                            <button onClick={() => setShowEditModal(false)} className="text-secondary opacity-60 hover:opacity-100">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="p-6 space-y-4">
                            <p className="text-xs text-secondary opacity-70">
                                Correct quantity, price, or discount on existing lines. Lines cannot be added or removed here,
                                and stock will be adjusted for any quantity change.
                            </p>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm">
                                    <thead className="border-b border-default/30">
                                        <tr className="text-xs font-bold text-secondary opacity-70 uppercase tracking-wider">
                                            <th className="py-2 pr-2">Item</th>
                                            <th className="py-2 px-2 text-right w-24">Qty</th>
                                            <th className="py-2 px-2 text-right w-28">Price</th>
                                            <th className="py-2 pl-2 text-right w-28">Discount</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-default/20">
                                        {editItems.map((it, index) => (
                                            <tr key={it.item || index}>
                                                <td className="py-2 pr-2 font-medium text-main">{it.name || 'Item'}</td>
                                                <td className="py-2 px-2">
                                                    <input
                                                        type="number"
                                                        min={0}
                                                        value={it.quantity}
                                                        onChange={(e) => updateEditItem(index, 'quantity', Number(e.target.value))}
                                                        className="w-full text-right border border-default/40 rounded-md px-2 py-1"
                                                    />
                                                </td>
                                                <td className="py-2 px-2">
                                                    <input
                                                        type="number"
                                                        min={0}
                                                        step="0.01"
                                                        value={it.price}
                                                        onChange={(e) => updateEditItem(index, 'price', Number(e.target.value))}
                                                        className="w-full text-right border border-default/40 rounded-md px-2 py-1"
                                                    />
                                                </td>
                                                <td className="py-2 pl-2">
                                                    <input
                                                        type="number"
                                                        min={0}
                                                        step="0.01"
                                                        value={it.discount}
                                                        onChange={(e) => updateEditItem(index, 'discount', Number(e.target.value))}
                                                        className="w-full text-right border border-default/40 rounded-md px-2 py-1"
                                                    />
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            <div>
                                <label className="text-xs font-bold text-secondary opacity-70 uppercase tracking-wider mb-1 block">
                                    Bill-level Discount (₹)
                                </label>
                                <input
                                    type="number"
                                    min={0}
                                    step="0.01"
                                    value={editDiscount}
                                    onChange={(e) => setEditDiscount(Number(e.target.value))}
                                    className="w-full border border-default/40 rounded-md px-3 py-2"
                                />
                            </div>

                            <div>
                                <label className="text-xs font-bold text-secondary opacity-70 uppercase tracking-wider mb-1 block">
                                    Reason for Edit (required)
                                </label>
                                <textarea
                                    value={editReason}
                                    onChange={(e) => setEditReason(e.target.value)}
                                    rows={2}
                                    className="w-full border border-default/40 rounded-md px-3 py-2"
                                    placeholder="e.g. Corrected quantity per customer request"
                                />
                            </div>

                            {editError && (
                                <p className="text-sm text-red-600">{editError}</p>
                            )}
                        </div>
                        <div className="px-6 py-4 border-t border-default/20 flex justify-end gap-3 sticky bottom-0 bg-white">
                            <button
                                onClick={() => setShowEditModal(false)}
                                className="px-4 py-2 border border-default/40 rounded-xl font-medium text-main opacity-90 hover:bg-surface/40"
                                disabled={editSubmitting}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSaveEdit}
                                className="px-4 py-2 bg-primary text-white rounded-xl font-bold hover:opacity-90 disabled:opacity-50"
                                disabled={editSubmitting}
                            >
                                {editSubmitting ? 'Saving...' : 'Save Changes'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </Layout>
    );
};

export default SalesInvoiceDetail;


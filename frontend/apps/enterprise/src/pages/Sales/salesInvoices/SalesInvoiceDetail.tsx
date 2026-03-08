import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useParams } from 'react-router-dom';
import { getSalesInvoiceById, reset, clearSalesInvoice, markSalesInvoiceAsPaid } from "@/entities/sales/model/salesInvoiceSlice";
import Layout from "@/shared/ui/Layout/Layout";
import PaymentModal from "@/shared/ui/Modals/PaymentModal";
import { AppDispatch, RootState } from "@/app/store/store";
import { Customer, PopulatedInvoice } from '@repo/shared-kernel';
import {
    FileText,
    CheckCircle,
    Clock,
    AlertCircle,
    ArrowLeft,
    Printer,
    CreditCard,
    User,
    Phone,
    Mail,
    MapPin,
    Receipt,
    BadgeCheck
} from 'lucide-react';

const SalesInvoiceDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const dispatch = useDispatch<AppDispatch>();
    const { invoice, isLoading, isError, message } = useSelector((state: RootState) => state.salesInvoice);
    const [showPaymentModal, setShowPaymentModal] = useState(false);

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
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600 mb-4"></div>
                    <p className="text-slate-500 font-medium">Loading invoice...</p>
                </div>
            </Layout>
        );
    }

    if (isError) {
        return (
            <Layout>
                <div className="max-w-4xl mx-auto">
                    <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
                        <AlertCircle className="w-5 h-5 text-red-500" />
                        <p className="text-red-700">{message}</p>
                    </div>
                    <button
                        onClick={() => navigate('/sales/invoice')}
                        className="mt-4 text-indigo-600 hover:text-indigo-700 font-medium flex items-center gap-2"
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
                                    <div className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 bg-white/20 rounded-xl text-sm font-bold">
                                        <AlertCircle className="w-4 h-4" /> ₹{balanceDue.toFixed(2)} Balance Due
                                    </div>
                                )}
                            </div>
                            <div className="flex flex-wrap gap-3">
                                <button
                                    onClick={handlePrint}
                                    className="px-4 py-2.5 bg-white/10 backdrop-blur-md border border-white/20 text-white rounded-xl text-sm font-bold hover:bg-white/20 transition-all flex items-center gap-2"
                                >
                                    <Printer className="w-4 h-4" /> Print
                                </button>
                                {invoice.paymentStatus !== 'paid' && (
                                    <button
                                        onClick={() => setShowPaymentModal(true)}
                                        className="px-4 py-2.5 bg-white text-emerald-700 rounded-xl text-sm font-bold shadow-lg hover:bg-emerald-50 transition-all flex items-center gap-2"
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
                            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden print:shadow-none print:border">
                                <div className="bg-slate-50 px-6 py-3 border-b border-slate-100">
                                    <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Bill To</h2>
                                </div>
                                <div className="p-6 flex items-start gap-4">
                                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white text-xl font-black shadow-lg">
                                        {isCustomer(invoice.customer) ? (invoice.customer.name.charAt(0).toUpperCase()) : '?'}
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-lg font-bold text-slate-800">
                                            {populatedInvoice.customer?.name || 'Customer'}
                                        </p>
                                        <div className="flex flex-wrap gap-4 mt-2 text-sm text-slate-600">
                                            {populatedInvoice.customer?.phone && (
                                                <span className="flex items-center gap-1.5">
                                                    <Phone className="w-4 h-4 text-slate-400" /> {populatedInvoice.customer.phone}
                                                </span>
                                            )}
                                            {populatedInvoice.customer?.email && (
                                                <span className="flex items-center gap-1.5">
                                                    <Mail className="w-4 h-4 text-slate-400" /> {populatedInvoice.customer.email}
                                                </span>
                                            )}
                                        </div>
                                        {populatedInvoice.customer?.address && (
                                            <p className="mt-2 text-sm text-slate-500 flex items-start gap-1.5">
                                                <MapPin className="w-4 h-4 text-slate-400 mt-0.5" /> {populatedInvoice.customer.address}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Invoice Items */}
                        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden print:shadow-none print:border">
                            <div className="bg-slate-50 px-6 py-3 border-b border-slate-100 flex justify-between items-center">
                                <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Invoice Items</h2>
                                <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase ${statusConfig.badge}`}>
                                    {invoice.paymentStatus}
                                </span>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead className="bg-slate-50 border-b border-slate-200">
                                        <tr className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                                            <th className="px-4 py-3 text-center w-12">#</th>
                                            <th className="px-4 py-3">Item</th>
                                            <th className="px-4 py-3 text-right">Qty</th>
                                            <th className="px-4 py-3 text-right">Price</th>
                                            <th className="px-4 py-3 text-right">Total</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {invoice.items?.map((item: any, index: number) => (
                                            <tr key={index} className="hover:bg-slate-50/80 transition-colors">
                                                <td className="px-4 py-3 text-center text-xs text-slate-400 font-bold">{index + 1}</td>
                                                <td className="px-4 py-3 font-medium text-slate-800">{item.name || 'Item'}</td>
                                                <td className="px-4 py-3 text-right font-medium">{item.quantity}</td>
                                                <td className="px-4 py-3 text-right text-slate-600">₹{item.price?.toFixed(2) || '0.00'}</td>
                                                <td className="px-4 py-3 text-right font-bold text-slate-800">₹{item.total?.toFixed(2) || '0.00'}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Invoice Info */}
                        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden print:shadow-none print:border">
                            <div className="bg-slate-50 px-6 py-3 border-b border-slate-100">
                                <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Invoice Details</h2>
                            </div>
                            <div className="p-6 grid grid-cols-2 md:grid-cols-4 gap-6">
                                <div>
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Invoice No</p>
                                    <p className="text-sm font-bold text-slate-800">{invoice.invoiceNo}</p>
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Invoice Date</p>
                                    <p className="text-sm font-medium text-slate-800">
                                        {new Date(invoice.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Payment Method</p>
                                    <p className="text-sm font-medium text-slate-800 capitalize">{invoice.paymentMethod || 'N/A'}</p>
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Time</p>
                                    <p className="text-sm font-medium text-slate-800">
                                        {new Date(invoice.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Sidebar */}
                    <div className="lg:col-span-1 space-y-6">
                        {/* Payment Summary */}
                        <div className="bg-white border border-indigo-100 rounded-2xl shadow-sm overflow-hidden sticky top-4 print:shadow-none print:border">
                            <div className="bg-indigo-50/50 px-6 py-3 border-b border-indigo-100">
                                <h2 className="text-xs font-bold text-indigo-800 uppercase tracking-wider">Payment Summary</h2>
                            </div>
                            <div className="p-6 space-y-4">
                                <div className="flex justify-between text-sm">
                                    <span className="text-slate-500 font-medium">Subtotal</span>
                                    <span className="font-bold text-slate-800">₹{invoice.subtotal?.toFixed(2) || '0.00'}</span>
                                </div>
                                {(invoice.tax || 0) > 0 && (
                                    <div className="flex justify-between text-sm">
                                        <span className="text-slate-500 font-medium">Tax</span>
                                        <span className="font-bold text-slate-800">+₹{invoice.tax?.toFixed(2) || '0.00'}</span>
                                    </div>
                                )}
                                {(invoice.discount || 0) > 0 && (
                                    <div className="flex justify-between text-sm">
                                        <span className="text-slate-500 font-medium">Discount</span>
                                        <span className="font-bold text-rose-600">-₹{invoice.discount?.toFixed(2) || '0.00'}</span>
                                    </div>
                                )}
                                <div className="border-t pt-4">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-slate-500 font-medium">Total Amount</span>
                                        <span className="font-bold text-slate-800">₹{invoice.totalAmount?.toFixed(2) || '0.00'}</span>
                                    </div>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-slate-500 font-medium">Paid Amount</span>
                                    <span className="font-bold text-emerald-600">₹{invoice.paidAmount?.toFixed(2) || '0.00'}</span>
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
                        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden print:hidden">
                            <div className="bg-slate-50 px-6 py-3 border-b border-slate-100">
                                <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Quick Actions</h2>
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
                                <button
                                    onClick={handlePrint}
                                    className="w-full py-3 border border-slate-300 text-slate-700 rounded-xl font-medium hover:bg-slate-50 transition-all flex items-center justify-center gap-2"
                                >
                                    <Printer className="w-4 h-4" /> Print Invoice
                                </button>
                                <button
                                    onClick={() => {
                                        dispatch(clearSalesInvoice());
                                        dispatch(reset());
                                        navigate('/sales/invoice');
                                    }}
                                    className="w-full py-3 border border-slate-300 text-slate-700 rounded-xl font-medium hover:bg-slate-50 transition-all flex items-center justify-center gap-2"
                                >
                                    <ArrowLeft className="w-4 h-4" /> Back to List
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Print Footer */}
                <div className="hidden print:block mt-12 pt-6 border-t text-center text-slate-500 text-sm">
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
        </Layout>
    );
};

export default SalesInvoiceDetail;


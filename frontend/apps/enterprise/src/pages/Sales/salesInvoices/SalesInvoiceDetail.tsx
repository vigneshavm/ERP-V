import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useParams } from 'react-router-dom';
import { getSalesInvoiceById, reset, clearSalesInvoice, markSalesInvoiceAsPaid } from "@/entities/sales/model/salesInvoiceSlice";
import Layout from "@/shared/ui/Layout/Layout";
import PageShell from "@/shared/ui/Layout/PageShell";
import PaymentModal from "@/shared/ui/Modals/PaymentModal";
import { AppDispatch, RootState } from "@/app/store/store";
import { Customer, PopulatedInvoice } from '@repo/shared';
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
    BadgeCheck,
    ChevronRight,
    Sparkles,
    ShieldCheck
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
            'paid': { 
                color: 'from-emerald-500 to-teal-600', 
                icon: CheckCircle, 
                text: 'Settled', 
                badge: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
                glow: 'shadow-emerald-500/20'
            },
            'partial': { 
                color: 'from-amber-400 to-orange-500', 
                icon: Clock, 
                text: 'Arrears Active', 
                badge: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
                glow: 'shadow-amber-500/20'
            },
            'unpaid': { 
                color: 'from-rose-500 to-red-600', 
                icon: AlertCircle, 
                text: 'Liability Outstanding', 
                badge: 'bg-rose-500/10 text-rose-500 border-rose-500/20',
                glow: 'shadow-rose-500/20'
            }
        };
        return configs[status] || configs['unpaid'];
    };

    const isCustomer = (cust: any): cust is Customer => {
        return cust && typeof cust === 'object' && 'name' in cust;
    };

    if (isLoading || !invoice) {
        return (
            <Layout>
                <PageShell className="flex flex-col items-center justify-center py-40">
                    <div className="relative">
                        <div className="w-16 h-16 rounded-full border-4 border-indigo-500/20 border-t-indigo-500 animate-spin" />
                        <Receipt className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-6 h-6 text-indigo-500 animate-pulse" />
                    </div>
                    <p className="mt-6 text-sm font-black uppercase tracking-widest text-neutral-400 animate-pulse">Decrypting Sales Data...</p>
                </PageShell>
            </Layout>
        );
    }

    if (isError) {
        return (
            <Layout>
                <PageShell className="max-w-4xl mx-auto py-20">
                    <div className="erp-card rounded-[2.5rem] p-8 border-rose-500/20 bg-rose-500/[0.02] flex flex-col items-center text-center">
                        <div className="p-4 bg-rose-500/10 rounded-2xl text-rose-500 mb-4">
                            <AlertCircle className="w-10 h-10" />
                        </div>
                        <h2 className="text-xl font-black text-neutral-900 dark:text-main uppercase tracking-tight mb-2">Retrieval Failed</h2>
                        <p className="text-neutral-500 font-medium mb-6 max-w-md">{message}</p>
                        <button
                            onClick={() => navigate('/sales')}
                            className="px-6 py-3 bg-neutral-900 dark:bg-neutral-800 text-white rounded-xl font-black uppercase tracking-widest text-[10px] hover:bg-neutral-800 transition-all flex items-center gap-2"
                        >
                            <ArrowLeft className="w-4 h-4" /> Return to Command Center
                        </button>
                    </div>
                </PageShell>
            </Layout>
        );
    }

    const populatedInvoice = invoice as unknown as PopulatedInvoice;
    const statusConfig = getStatusConfig(invoice.paymentStatus);
    const StatusIcon = statusConfig.icon;
    const balanceDue = (invoice.totalAmount || 0) - (invoice.paidAmount || 0);

    return (
        <Layout>
            <PageShell className="bg-app flex-1 flex flex-col min-h-0 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                {/* Immersive Status Banner */}
                <div className={`bg-gradient-to-br ${statusConfig.color} rounded-[3rem] p-10 text-white shadow-2xl ${statusConfig.glow} relative overflow-hidden print:hidden group`}>
                    <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none group-hover:scale-110 group-hover:rotate-12 transition-transform duration-1000">
                        <Receipt className="w-64 h-64" />
                    </div>
                    
                    <div className="relative z-10">
                        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8">
                            <div className="flex-1">
                                <div className="flex items-center gap-3 mb-6">
                                    <button
                                        onClick={() => navigate('/sales')}
                                        className="p-2 bg-white/10 hover:bg-white/20 rounded-xl transition-all"
                                    >
                                        <ArrowLeft className="w-4 h-4" />
                                    </button>
                                    <span className="w-1 h-1 rounded-full bg-white/30" />
                                    <div className="flex items-center gap-2 px-3 py-1 bg-white/10 backdrop-blur-md rounded-lg border border-white/10">
                                        <StatusIcon className="w-3.5 h-3.5" />
                                        <span className="text-[10px] font-black uppercase tracking-widest">{statusConfig.text}</span>
                                    </div>
                                </div>
                                
                                <h1 className="text-5xl font-black tracking-tighter mb-4 flex items-baseline gap-4">
                                    {invoice.invoiceNo}
                                    <span className="text-lg font-bold text-white/50 tracking-normal italic font-serif">Original Master copy</span>
                                </h1>
                                
                                <div className="flex flex-wrap items-center gap-6">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center backdrop-blur-md">
                                            <User className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <p className="text-[9px] font-black text-white/50 uppercase tracking-widest leading-none mb-1">Entity</p>
                                            <p className="text-sm font-black uppercase tracking-tight leading-none">
                                                {populatedInvoice.customer?.name || 'Anonymous Client'}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="w-px h-8 bg-white/10 hidden sm:block" />
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center backdrop-blur-md">
                                            <Calendar className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <p className="text-[9px] font-black text-white/50 uppercase tracking-widest leading-none mb-1">Fiscal Date</p>
                                            <p className="text-sm font-black uppercase tracking-tight leading-none">
                                                {new Date(invoice.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="flex flex-wrap items-end gap-3 self-end lg:self-center">
                                <button
                                    onClick={handlePrint}
                                    className="px-6 py-3 bg-white/10 backdrop-blur-xl border border-white/20 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-white/20 transition-all flex items-center gap-2"
                                >
                                    <Printer className="w-4 h-4" /> Global Print
                                </button>
                                {invoice.paymentStatus !== 'paid' && (
                                    <button
                                        onClick={() => setShowPaymentModal(true)}
                                        className="px-8 py-3 bg-white text-neutral-900 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-2xl hover:scale-105 active:scale-95 transition-all flex items-center gap-2"
                                    >
                                        <CreditCard className="w-4 h-4" /> Settle Transaction
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-20">
                    <div className="lg:col-span-8 space-y-8">
                        {/* Summary & Customer Matrix */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            {/* Customer Profile */}
                            <div className="erp-card rounded-[2.5rem] p-8 shadow-sm border-none relative overflow-hidden group">
                                <div className="absolute -top-4 -right-4 w-32 h-32 bg-indigo-500/5 rounded-full blur-3xl group-hover:bg-indigo-500/10 transition-colors" />
                                <h3 className="text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                                    <User className="w-4 h-4 text-indigo-500" /> Counterparty Profile
                                </h3>
                                <div className="flex items-start gap-5">
                                    <div className="w-16 h-16 rounded-[1.25rem] bg-indigo-600 flex items-center justify-center text-white text-2xl font-black shadow-lg shadow-indigo-600/20">
                                        {isCustomer(invoice.customer) ? (invoice.customer.name.charAt(0).toUpperCase()) : '?'}
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-xl font-black text-neutral-900 dark:text-neutral-100 uppercase tracking-tight leading-none mb-2">
                                            {populatedInvoice.customer?.name || 'Walk-in Client'}
                                        </p>
                                        <div className="space-y-1.5">
                                            <div className="flex items-center gap-2 text-xs font-bold text-neutral-500 italic">
                                                <Phone className="w-3 h-3" /> {populatedInvoice.customer?.phone || 'No direct dial'}
                                            </div>
                                            <div className="flex items-center gap-2 text-xs font-bold text-neutral-500 italic">
                                                <Mail className="w-3 h-3" /> {populatedInvoice.customer?.email || 'No email registered'}
                                            </div>
                                            {populatedInvoice.customer?.address && (
                                                <div className="mt-4 pt-4 border-t border-default dark:border-neutral-800 flex items-start gap-2 text-[10px] font-medium text-neutral-400 uppercase tracking-tight leading-relaxed">
                                                    <MapPin className="w-3 h-3 mt-1 shrink-0 text-indigo-500/50" /> {populatedInvoice.customer.address}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Key Performance Matrix */}
                            <div className="erp-card rounded-[2.5rem] p-8 shadow-sm border-none bg-neutral-900 text-white flex flex-col justify-between group overflow-hidden">
                                <ShieldCheck className="absolute top-0 right-0 p-8 opacity-5 group-hover:scale-125 transition-transform duration-1000 w-32 h-32" />
                                <div>
                                    <h3 className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                                        <BadgeCheck className="w-4 h-4" /> Compliance Matrix
                                    </h3>
                                    <div className="grid grid-cols-2 gap-4 relative z-10">
                                        <div className="p-4 bg-white/5 rounded-2xl border border-white/10">
                                            <p className="text-[8px] font-black text-neutral-500 uppercase tracking-widest mb-1.5">Methodology</p>
                                            <p className="text-sm font-black uppercase tracking-tight text-white">{invoice.paymentMethod || 'N/A'}</p>
                                        </div>
                                        <div className="p-4 bg-white/5 rounded-2xl border border-white/10">
                                            <p className="text-[8px] font-black text-neutral-500 uppercase tracking-widest mb-1.5">Verification</p>
                                            <p className="text-sm font-black uppercase tracking-tight text-emerald-400 flex items-center gap-1.5">
                                                High Trust <Sparkles className="w-3 h-3" />
                                            </p>
                                        </div>
                                    </div>
                                </div>
                                <div className="mt-8 flex justify-between items-end relative z-10">
                                    <div>
                                        <p className="text-[8px] font-black text-neutral-500 uppercase tracking-widest leading-none mb-1">Time Precision</p>
                                        <p className="text-lg font-black uppercase tracking-tighter leading-none">
                                            {new Date(invoice.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                                        </p>
                                    </div>
                                    <div className="w-10 h-10 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-400">
                                        <Clock className="w-5 h-5" />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Inventory Breakdown */}
                        <div className="erp-card rounded-[2.5rem] p-8 shadow-sm border-none overflow-hidden relative group">
                             <div className="flex justify-between items-center mb-8 px-2">
                                <h3 className="text-xs font-black text-neutral-400 uppercase tracking-widest flex items-center gap-3">
                                    <div className="p-2 bg-indigo-500/10 rounded-lg text-indigo-500"><FileText className="w-4 h-4" /></div>
                                    Inventory Breakdown Ledger
                                </h3>
                                <div className={`px-4 py-1.5 rounded-xl border text-[10px] font-black uppercase tracking-widest ${statusConfig.badge}`}>
                                    {invoice.paymentStatus}
                                </div>
                            </div>

                            <div className="overflow-x-auto px-1">
                                <table className="w-full text-left border-separate border-spacing-y-3">
                                    <thead>
                                        <tr className="text-[10px] font-black text-neutral-400 uppercase tracking-[0.2em]">
                                            <th className="px-6 py-2 w-12 text-center">#</th>
                                            <th className="px-6 py-2">Entity Description</th>
                                            <th className="px-6 py-2 w-28 text-right">Volume</th>
                                            <th className="px-6 py-2 w-36 text-right">Unit Liquidity</th>
                                            <th className="px-6 py-2 w-40 text-right">Aggregate</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {invoice.items?.map((item: any, index: number) => (
                                            <tr key={index} className="group/row hover:transform hover:-translate-y-0.5 transition-all duration-300">
                                                <td className="px-2 py-1 text-center font-mono font-black text-neutral-400 text-xs">{index + 1}</td>
                                                <td className="px-2 py-1">
                                                    <div className="bg-[var(--erp-bg-sunken)] dark:bg-neutral-900/50 rounded-2xl p-4 border border-default dark:border-neutral-800 transition-all">
                                                        <span className="text-sm font-black uppercase tracking-tight text-neutral-700 dark:text-neutral-200">
                                                            {item.name || 'Core Commodity'}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="px-2 py-1">
                                                    <div className="bg-[var(--erp-bg-sunken)] dark:bg-neutral-900/50 rounded-2xl p-4 border border-default dark:border-neutral-800 transition-all text-right font-mono font-black text-neutral-900 dark:text-neutral-100 italic">
                                                        {item.quantity}
                                                    </div>
                                                </td>
                                                <td className="px-2 py-1">
                                                    <div className="bg-[var(--erp-bg-sunken)] dark:bg-neutral-900/50 rounded-2xl p-4 border border-default dark:border-neutral-800 transition-all text-right font-mono font-black text-neutral-500 dark:text-neutral-400">
                                                        ₹{item.price?.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-1 text-right">
                                                    <span className="text-lg font-black text-neutral-900 dark:text-neutral-100 font-mono tracking-tighter italic">
                                                        ₹{item.total?.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>

                    {/* Sidebar: Financial Synthesis */}
                    <div className="lg:col-span-4 flex flex-col gap-8">
                        {/* Synthesis Summary */}
                        <div className="erp-card rounded-[2.5rem] p-8 shadow-sm border-none bg-white dark:bg-neutral-900 relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none group-hover:scale-125 transition-transform duration-1000">
                                <CreditCard className="w-32 h-32 text-indigo-500" />
                            </div>
                            
                            <h3 className="text-xs font-black text-neutral-400 uppercase tracking-widest mb-8 flex items-center gap-2">
                                <CreditCard className="w-4 h-4 text-indigo-500" /> Fiscal Synthesis
                            </h3>

                            <div className="space-y-6 relative z-10">
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center">
                                        <span className="text-[10px] font-black text-neutral-400 uppercase tracking-widest italic">Consolidated Subtotal</span>
                                        <span className="text-sm font-black font-mono text-neutral-900 dark:text-neutral-100 italic">₹{invoice.subtotal?.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                                    </div>
                                    {(invoice.tax || 0) > 0 && (
                                        <div className="flex justify-between items-center">
                                            <span className="text-[10px] font-black text-indigo-500 uppercase tracking-widest italic">Aggregated Tax</span>
                                            <span className="text-sm font-black font-mono text-indigo-500 italic">+₹{invoice.tax?.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                                        </div>
                                    )}
                                    {(invoice.discount || 0) > 0 && (
                                        <div className="flex justify-between items-center">
                                            <span className="text-[10px] font-black text-rose-500 uppercase tracking-widest italic">Selective Rebate</span>
                                            <span className="text-sm font-black font-mono text-rose-500 italic">-₹{invoice.discount?.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                                        </div>
                                    )}
                                </div>

                                <div className="h-px bg-default dark:bg-neutral-800 my-2" />

                                <div className="space-y-4">
                                     <div className="flex justify-between items-end bg-[var(--erp-bg-sunken)] dark:bg-neutral-950/50 p-6 rounded-[2rem] border border-default dark:border-neutral-800">
                                        <div>
                                            <p className="text-[8px] font-black text-neutral-500 uppercase tracking-widest mb-1.5 italic">Operational Total</p>
                                            <p className="text-xl font-black text-neutral-900 dark:text-neutral-100 tracking-tighter uppercase leading-none italic">Net Value</p>
                                        </div>
                                        <span className="text-3xl font-black text-neutral-900 dark:text-neutral-100 font-mono tracking-tighter italic">
                                            ₹{invoice.totalAmount?.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                        </span>
                                    </div>

                                    <div className="flex justify-between items-center px-6">
                                        <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest italic">Liquidity Received</span>
                                        <span className="text-lg font-black font-mono text-emerald-500 italic">₹{invoice.paidAmount?.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                                    </div>
                                </div>

                                <div className={`mt-8 p-8 rounded-[2.5rem] flex flex-col items-center justify-center text-center gap-3 shadow-2xl ${balanceDue > 0 ? 'bg-rose-500 text-white shadow-rose-500/20' : 'bg-emerald-500 text-white shadow-emerald-500/20'}`}>
                                    <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-80 italic italic">Current Status</p>
                                    <div className="flex items-center gap-3">
                                        <span className="text-3xl font-black tracking-tighter uppercase italic leading-none">
                                            {balanceDue > 0 ? `₹${balanceDue.toLocaleString(undefined, { minimumFractionDigits: 2 })}` : 'Settled'}
                                        </span>
                                        {balanceDue <= 0 && <BadgeCheck className="w-8 h-8 animate-in zoom-in spin-in duration-700" />}
                                    </div>
                                    <p className="text-[8px] font-black uppercase tracking-widest opacity-60">
                                        {balanceDue > 0 ? 'Residual Fiscal Liability' : 'Transaction Integrity Verified'}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Quick Operations Matrix */}
                        <div className="erp-card rounded-[2.5rem] p-8 shadow-sm border-none bg-neutral-900 group">
                             <h3 className="text-xs font-black text-neutral-500 uppercase tracking-widest mb-8 flex items-center gap-2">
                                <FileText className="w-4 h-4 text-neutral-700" /> Strategic Operations
                            </h3>
                            <div className="flex flex-col gap-3">
                                {invoice.paymentStatus !== 'paid' && (
                                    <button
                                        onClick={() => setShowPaymentModal(true)}
                                        className="w-full py-4 bg-indigo-600 text-white rounded-[1.5rem] font-black uppercase tracking-[0.2em] text-xs shadow-xl shadow-indigo-600/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3 group/btn"
                                    >
                                        <CreditCard className="w-4 h-4 group-hover/btn:rotate-12 transition-transform" /> Settle Arrears
                                    </button>
                                )}
                                <button
                                    onClick={handlePrint}
                                    className="w-full py-4 bg-white/5 border border-white/10 text-neutral-400 rounded-[1.5rem] font-black uppercase tracking-[0.2em] text-[10px] hover:bg-white/10 hover:text-white transition-all flex items-center justify-center gap-3"
                                >
                                    <Printer className="w-4 h-4" /> Generate Physical Artifact
                                </button>
                                <button
                                    onClick={() => {
                                        dispatch(clearSalesInvoice());
                                        dispatch(reset());
                                        navigate('/sales');
                                    }}
                                    className="w-full py-4 bg-transparent text-neutral-600 rounded-[1.5rem] font-black uppercase tracking-[0.2em] text-[10px] hover:bg-white/5 hover:text-neutral-400 transition-all flex items-center justify-center gap-3"
                                >
                                    <ArrowLeft className="w-4 h-4" /> Return to Summary
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Aesthetic Footer Artifact */}
                <div className="hidden print:block mt-20 pt-10 border-t-2 border-dashed border-neutral-200 text-center">
                    <p className="text-xl font-black uppercase tracking-[0.5em] text-neutral-900 mb-4 italic">BizzAI Enterprise</p>
                    <p className="text-sm font-bold text-neutral-500">Global Sales Transmission Protocol v4.2</p>
                    <div className="mt-8 flex justify-center gap-20">
                        <div className="w-40 h-px bg-neutral-300" />
                        <div className="w-40 h-px bg-neutral-300" />
                    </div>
                    <div className="flex justify-center gap-32 mt-2 text-[10px] font-black uppercase tracking-widest text-neutral-400">
                        <span>Authorized Signal</span>
                        <span>Recipient Signature</span>
                    </div>
                </div>
            </PageShell>

            <style>{`
                @media print {
                    @page { margin: 0; size: auto; }
                    body { background: white; }
                    .print\\:hidden { display: none !important; }
                    .print\\:block { display: block !important; }
                    .bg-app { background: white !important; }
                }
            `}</style>

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

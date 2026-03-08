import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { getSalesInvoiceById, reset, clearSalesInvoice, markSalesInvoiceAsPaid } from "@/redux/slices/salesInvoiceSlice";
import Layout from "@/components/shared/Layout/Layout";
import PaymentModal from "@/components/shared/Modals/PaymentModal";
import { AppDispatch, RootState } from "@/redux/store";
import { Customer, PopulatedInvoice } from "@/types/sales";
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
    ChevronLeft,
    Activity,
    ShieldCheck,
    Layers,
    History,
    Zap
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

    const handlePrint = () => window.print();

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
        switch (status) {
            case 'paid': return { color: "text-emerald-500", bg: "bg-emerald-500/10", border: "border-emerald-500/20", icon: CheckCircle, text: "Protocol: Settled" };
            case 'partial': return { color: "text-amber-500", bg: "bg-amber-500/10", border: "border-amber-500/20", icon: Clock, text: "Protocol: Fragmented" };
            default: return { color: "text-rose-500", bg: "bg-rose-500/10", border: "border-rose-500/20", icon: AlertCircle, text: "Protocol: Pending Exposure" };
        }
    };

    const isCustomer = (cust: any): cust is Customer => {
        return cust && typeof cust === 'object' && 'name' in cust;
    };

    if (isLoading || !invoice) {
        return (
            <Layout>
                <div className="flex flex-col items-center justify-center py-32 space-y-4">
                    <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
                    <p className="text-[10px] font-black text-secondary uppercase tracking-[0.3em]">Decoding Revenue Certificate...</p>
                </div>
            </Layout>
        );
    }

    const populatedInvoice = invoice as unknown as PopulatedInvoice;
    const status = getStatusConfig(invoice.paymentStatus);
    const balanceDue = (invoice.totalAmount || 0) - (invoice.paidAmount || 0);

    return (
        <Layout>
            <div className="min-h-screen bg-app p-4 lg:p-8 relative overflow-hidden pb-32">
                {/* Background Textures */}
                <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-primary/5 rounded-full blur-[160px] pointer-events-none -mr-48 -mt-48 opacity-30"></div>
                <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-blue-500/5 rounded-full blur-[140px] pointer-events-none -ml-32 -mb-32 opacity-20"></div>

                <div className="max-w-6xl mx-auto relative z-10 space-y-8">
                    {/* Navigation & Actions */}
                    <motion.div 
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex flex-col md:flex-row md:items-center justify-between gap-6 print:hidden"
                    >
                        <button 
                            onClick={() => navigate('/sales')}
                            className="flex items-center gap-3 text-[10px] font-black text-secondary uppercase tracking-[0.3em] hover:text-primary transition-colors group"
                        >
                            <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                            Return to Registry
                        </button>

                        <div className="flex items-center gap-3">
                            <button onClick={handlePrint} className="p-3 glass-panel border border-white/10 hover:border-white/20 transition-all text-secondary hover:text-main">
                                <Printer className="w-5 h-5" />
                            </button>
                            {invoice.paymentStatus !== 'paid' && (
                                <button
                                    onClick={() => setShowPaymentModal(true)}
                                    className="px-8 py-3 bg-emerald-600 text-white rounded-xl font-black text-[10px] uppercase tracking-[0.4em] shadow-2xl shadow-emerald-900/40 hover:bg-emerald-500 transition-all flex items-center gap-3"
                                >
                                    <CreditCard className="w-4 h-4" />
                                    Resolve Settlement
                                </button>
                            )}
                        </div>
                    </motion.div>

                    {/* Certificate Header */}
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="glass-panel p-8 border border-white/5 relative overflow-hidden"
                    >
                        <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none">
                            <Receipt className="w-64 h-64" />
                        </div>
                        
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 relative z-10">
                            <div className="space-y-4">
                                <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full border ${status.bg} ${status.border} ${status.color}`}>
                                    <status.icon className="w-3 h-3" />
                                    <span className="text-[9px] font-black uppercase tracking-widest">{status.text}</span>
                                </div>
                                <div>
                                    <h1 className="text-4xl md:text-6xl font-display font-black text-main tracking-tighter uppercase line-clamp-1">
                                        {invoice.invoiceNo}
                                    </h1>
                                    <p className="text-secondary text-sm font-medium opacity-60 mt-1">
                                        Established {new Date(invoice.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })} — System Verified
                                    </p>
                                </div>
                            </div>

                            <div className="flex flex-col items-end">
                                <div className="text-[10px] font-black text-secondary uppercase tracking-[0.3em] mb-1">Capture Velocity</div>
                                <div className="text-4xl md:text-5xl font-display font-black text-main tracking-tighter">
                                    ₹{invoice.totalAmount?.toLocaleString()}
                                </div>
                                {balanceDue > 0 && (
                                    <div className="text-[10px] font-black text-rose-500 uppercase tracking-widest mt-2 flex items-center gap-2">
                                        <AlertCircle className="w-3 h-3" />
                                        ₹{balanceDue.toLocaleString()} Exposure Remaining
                                    </div>
                                )}
                            </div>
                        </div>
                    </motion.div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        <div className="lg:col-span-2 space-y-8">
                            {/* Counterparty Block */}
                            <motion.div 
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                className="glass-panel p-8 border border-white/5"
                            >
                                <div className="text-[10px] font-black text-primary uppercase tracking-[0.3em] mb-6">Commercial Entity</div>
                                <div className="flex items-start gap-6">
                                    <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white text-3xl font-black shadow-2xl shadow-primary/20">
                                        {isCustomer(invoice.customer) ? invoice.customer.name.charAt(0).toUpperCase() : <User />}
                                    </div>
                                    <div className="space-y-4 flex-1">
                                        <div>
                                            <h2 className="text-2xl font-display font-black text-main uppercase tracking-tight">
                                                {isCustomer(invoice.customer) ? invoice.customer.name : 'Walk-in Proxy'}
                                            </h2>
                                            <p className="text-secondary text-xs font-bold uppercase tracking-widest opacity-40">Verified Entity Signature</p>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {isCustomer(invoice.customer) && invoice.customer.phone && (
                                                <div className="flex items-center gap-3 text-secondary">
                                                    <div className="p-2 bg-white/5 rounded-lg"><Phone className="w-3.5 h-3.5" /></div>
                                                    <span className="text-xs font-bold font-mono tracking-tight">{invoice.customer.phone}</span>
                                                </div>
                                            )}
                                            {isCustomer(invoice.customer) && invoice.customer.email && (
                                                <div className="flex items-center gap-3 text-secondary">
                                                    <div className="p-2 bg-white/5 rounded-lg"><Mail className="w-3.5 h-3.5" /></div>
                                                    <span className="text-xs font-bold font-mono tracking-tight">{invoice.customer.email}</span>
                                                </div>
                                            )}
                                            {isCustomer(invoice.customer) && invoice.customer.address && (
                                                <div className="flex items-center gap-3 text-secondary md:col-span-2">
                                                    <div className="p-2 bg-white/5 rounded-lg shrink-0"><MapPin className="w-3.5 h-3.5" /></div>
                                                    <span className="text-xs font-bold tracking-tight opacity-60 uppercase">{invoice.customer.address}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </motion.div>

                            {/* Manifest Items */}
                            <motion.div 
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="glass-panel border border-white/5 overflow-hidden"
                            >
                                <div className="px-8 py-6 border-b border-white/5 bg-white/5 flex justify-between items-center">
                                    <div className="text-[10px] font-black text-secondary uppercase tracking-[0.3em]">Asset Distribution</div>
                                    <div className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest ${status.bg} ${status.color}`}>
                                        {invoice.paymentStatus}
                                    </div>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left">
                                        <thead>
                                            <tr className="border-b border-white/5">
                                                <th className="px-8 py-4 text-[9px] font-black text-secondary/40 uppercase tracking-widest">Index</th>
                                                <th className="px-8 py-4 text-[9px] font-black text-secondary/40 uppercase tracking-widest">Asset Identifier</th>
                                                <th className="px-8 py-4 text-[9px] font-black text-secondary/40 uppercase tracking-widest text-right">Volume</th>
                                                <th className="px-8 py-4 text-[9px] font-black text-secondary/40 uppercase tracking-widest text-right">Unit Scalar</th>
                                                <th className="px-8 py-4 text-[9px] font-black text-secondary/40 uppercase tracking-widest text-right">Net Value</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-white/5">
                                            {invoice.items?.map((item, idx) => (
                                                <tr key={idx} className="group hover:bg-white/5 transition-colors">
                                                    <td className="px-8 py-5 text-[10px] font-black text-secondary/20">{String(idx + 1).padStart(2, '0')}</td>
                                                    <td className="px-8 py-5">
                                                        <div className="text-xs font-black text-main uppercase tracking-tight">{item.name || 'Anonymous Asset'}</div>
                                                        <div className="text-[8px] font-black text-secondary/40 uppercase mt-0.5 tracking-widest">ID: {Math.random().toString(36).substr(2, 6).toUpperCase()}</div>
                                                    </td>
                                                    <td className="px-8 py-5 text-right text-xs font-bold text-main">{item.quantity}</td>
                                                    <td className="px-8 py-5 text-right text-xs font-black text-secondary/60 font-mono">₹{item.price?.toLocaleString()}</td>
                                                    <td className="px-8 py-5 text-right font-display font-black text-main tracking-tighter text-lg">₹{item.total?.toLocaleString()}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </motion.div>
                        </div>

                        {/* Sidebar Analytics */}
                        <div className="space-y-8">
                            {/* Settlement Summary */}
                            <motion.div 
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                className="glass-panel border-2 border-primary/20 overflow-hidden sticky top-8"
                            >
                                <div className="p-8 space-y-6">
                                    <div className="text-[10px] font-black text-primary uppercase tracking-[0.3em]">Capital Summary</div>
                                    <div className="space-y-4">
                                        <div className="flex justify-between items-center group">
                                            <span className="text-[10px] font-black text-secondary uppercase tracking-widest opacity-40 group-hover:opacity-100 transition-opacity">Gross Subtotal</span>
                                            <span className="text-sm font-black text-main font-mono">₹{invoice.subtotal?.toLocaleString()}</span>
                                        </div>
                                        {Boolean(invoice.tax) && (
                                            <div className="flex justify-between items-center group">
                                                <span className="text-[10px] font-black text-secondary uppercase tracking-widest opacity-40 group-hover:opacity-100 transition-opacity">Tax Vector</span>
                                                <span className="text-sm font-black text-main font-mono">+₹{invoice.tax?.toLocaleString()}</span>
                                            </div>
                                        )}
                                        {Boolean(invoice.discount) && (
                                            <div className="flex justify-between items-center group">
                                                <span className="text-[10px] font-black text-secondary uppercase tracking-widest opacity-40 group-hover:opacity-100 transition-opacity">Yield Discount</span>
                                                <span className="text-sm font-black text-rose-500 font-mono">-₹{invoice.discount?.toLocaleString()}</span>
                                            </div>
                                        )}
                                        <div className="h-px bg-white/5 my-2"></div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-[10px] font-black text-secondary uppercase tracking-widest opacity-40">Net Position</span>
                                            <span className="text-xl font-display font-black text-main tracking-tighter">₹{invoice.totalAmount?.toLocaleString()}</span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Liquidized</span>
                                            <span className="text-lg font-black text-emerald-500 tracking-tighter">₹{invoice.paidAmount?.toLocaleString()}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className={`p-6 flex justify-between items-center text-white ${balanceDue > 0 ? 'bg-rose-600/80 shadow-inner' : 'bg-emerald-600/80 shadow-inner'} backdrop-blur-md`}>
                                    <div className="space-y-0.5">
                                        <div className="text-[8px] font-black uppercase tracking-[0.4em] opacity-60">Status Descriptor</div>
                                        <div className="text-lg font-display font-black uppercase tracking-tight">
                                            {balanceDue > 0 ? 'Residual Exposure' : 'Resolved Archive'}
                                        </div>
                                    </div>
                                    <div className="text-2xl font-display font-black tracking-tighter">
                                        {balanceDue > 0 ? `₹${balanceDue.toLocaleString()}` : <BadgeCheck className="w-10 h-10" />}
                                    </div>
                                </div>
                            </motion.div>

                            {/* Meta Metrics */}
                            <motion.div 
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="glass-panel p-6 border border-white/5 grid grid-cols-2 gap-6"
                            >
                                <div className="space-y-1">
                                    <div className="text-[8px] font-black text-secondary uppercase tracking-widest opacity-40">Method</div>
                                    <div className="text-[10px] font-black text-primary uppercase">{invoice.paymentMethod || 'SECURE'}</div>
                                </div>
                                <div className="space-y-1">
                                    <div className="text-[8px] font-black text-secondary uppercase tracking-widest opacity-40">Temporal</div>
                                    <div className="text-[10px] font-black text-primary uppercase">{new Date(invoice.createdAt).toLocaleTimeString()}</div>
                                </div>
                            </motion.div>
                        </div>
                    </div>
                </div>

                {/* Print Context Only */}
                <div className="hidden print:block fixed inset-0 bg-white text-black p-12 z-[200]">
                    <div className="flex justify-between border-b-2 border-black pb-8 mb-8">
                        <div>
                            <h1 className="text-4xl font-black uppercase tracking-tighter">{invoice.invoiceNo}</h1>
                            <p className="text-sm font-bold mt-2">Revenue Recognition Certificate</p>
                        </div>
                        <div className="text-right">
                            <p className="font-black uppercase tracking-widest text-[10px]">Registry Date</p>
                            <p className="text-xl font-bold">{new Date().toLocaleDateString()}</p>
                        </div>
                    </div>
                    {/* Simplified print table would go here if needed, but the CSS handles it mostly */}
                </div>
            </div>

            <style>{`
                .glass-panel { background: rgba(255, 255, 255, 0.03); backdrop-filter: blur(20px); border-radius: 2rem; }
                .font-display { font-family: 'Outfit', sans-serif; }
                @media print {
                    body { background: white !important; }
                    .print\\:hidden { display: none !important; }
                    .glass-panel { background: none !important; border: 1px solid #000 !important; border-radius: 0 !important; color: black !important; }
                    .text-main, .text-secondary, .text-primary { color: black !important; }
                    .shadow-2xl, .shadow-xl { box-shadow: none !important; }
                }
            `}</style>

            {/* Payment Modal Integration */}
            <AnimatePresence>
                {showPaymentModal && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <motion.div 
                            initial={{ opacity: 0 }} 
                            animate={{ opacity: 1 }} 
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-black/80 backdrop-blur-xl"
                            onClick={() => setShowPaymentModal(false)}
                        />
                        <motion.div 
                            initial={{ scale: 0.9, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.9, y: 20 }}
                            className="relative z-10 w-full max-w-xl"
                        >
                            <PaymentModal
                                isOpen={showPaymentModal}
                                onClose={() => setShowPaymentModal(false)}
                                onSubmit={handlePayment}
                                documentType="Sales Invoice"
                                totalAmount={invoice.totalAmount}
                                paidAmount={invoice.paidAmount}
                            />
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </Layout>
    );
};

export default SalesInvoiceDetail;

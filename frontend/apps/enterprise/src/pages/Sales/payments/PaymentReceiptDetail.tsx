import { logger } from '@/shared/lib/logger';
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "@/shared/api/api";
import { toast } from "react-toastify";
import Layout from "@/shared/ui/Layout/Layout";
import PageShell from "@/shared/ui/Layout/PageShell";
import {
  ArrowLeft,
  Printer,
  Receipt,
  User,
  Phone,
  Mail,
  CreditCard,
  Banknote,
  Smartphone,
  FileText,
  CheckCircle,
  AlertCircle,
  Clock,
  Sparkles,
  ShieldCheck,
  Calendar,
  Wallet,
  Zap,
  Target,
  ArrowRightCircle,
  IndianRupee
} from 'lucide-react';

const PaymentReceiptDetail: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const user = JSON.parse(localStorage.getItem("user") || '{}');
  const token = user?.token;

  const [payment, setPayment] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPaymentDetail();
  }, [id]);

  const fetchPaymentDetail = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/payment-in/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setPayment(response.data);
    } catch (error) {
      logger.error("Error fetching payment:", error);
      toast.error("Failed to fetch payment details");
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading || !payment || !payment.customer) {
    return (
      <Layout>
        <PageShell className="flex flex-col items-center justify-center py-40">
            <div className="relative">
                <div className="w-16 h-16 rounded-full border-4 border-emerald-500/20 border-t-emerald-500 animate-spin" />
                <Zap className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-6 h-6 text-emerald-500 animate-pulse" />
            </div>
            <p className="mt-6 text-sm font-black uppercase tracking-widest text-neutral-400 animate-pulse">Materializing Fiscal Artifact...</p>
        </PageShell>
      </Layout>
    );
  }

  return (
    <Layout>
      <PageShell className="bg-app flex-1 flex flex-col min-h-0 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-700 max-w-5xl mx-auto w-full">
        {/* Immersive Cinematic Header */}
        <div className="erp-card rounded-[3.5rem] p-12 bg-neutral-900 text-white shadow-2xl relative overflow-hidden group print:hidden">
            <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none group-hover:scale-110 group-hover:rotate-12 transition-transform duration-1000">
                <IndianRupee className="w-80 h-80" />
            </div>
            
            <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-10">
                <div className="flex-1">
                    <div className="flex items-center gap-3 mb-8">
                        <button
                            onClick={() => navigate("/sales/payment-in-list")}
                            className="p-3 bg-white/10 hover:bg-white/20 rounded-2xl transition-all active:scale-95"
                        >
                            <ArrowLeft className="w-5 h-5" />
                        </button>
                        <span className="w-1 h-1 rounded-full bg-white/30" />
                        <div className="flex items-center gap-2 px-4 py-1.5 bg-emerald-500/20 backdrop-blur-md rounded-xl border border-emerald-500/20">
                            <Sparkles className="w-4 h-4 text-emerald-400 animate-pulse" />
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-300">Fiscal Artifact</span>
                        </div>
                    </div>
                    
                    <h1 className="text-6xl font-black tracking-tighter mb-4 flex items-baseline gap-4 leading-none">
                        {payment.receiptNumber}
                        <span className="text-xl font-bold text-white/40 tracking-normal italic font-serif">Inflow Record</span>
                    </h1>
                    
                    <div className="flex flex-wrap items-center gap-8 mt-10">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center backdrop-blur-md border border-white/5">
                                <User className="w-6 h-6 text-emerald-400" />
                            </div>
                            <div>
                                <p className="text-[9px] font-black text-white/50 uppercase tracking-[0.2em] mb-1.5 leading-none">Source Entity</p>
                                <p className="text-lg font-black uppercase tracking-tight leading-none text-white italic">
                                    {payment.customer.name}
                                </p>
                            </div>
                        </div>
                        <div className="w-px h-10 bg-white/10 hidden sm:block" />
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center backdrop-blur-md border border-white/5">
                                <Calendar className="w-6 h-6 text-emerald-400" />
                            </div>
                            <div>
                                <p className="text-[9px] font-black text-white/50 uppercase tracking-[0.2em] mb-1.5 leading-none">Settlement Cycle</p>
                                <p className="text-lg font-black uppercase tracking-tight leading-none text-white italic">
                                    {new Date(payment.paymentDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex flex-col items-end gap-6 self-end lg:self-center">
                    <div className="text-right">
                        <p className="text-[10px] font-black text-white/30 uppercase tracking-[0.3em] mb-2 italic">Total Collection</p>
                        <h2 className="text-5xl font-black text-emerald-400 tracking-tighter italic">₹{payment.totalAmount.toLocaleString()}</h2>
                    </div>
                    <button
                        onClick={handlePrint}
                        className="px-10 py-5 bg-white text-neutral-900 rounded-[2rem] text-[10px] font-black uppercase tracking-[0.2em] hover:scale-105 active:scale-95 transition-all flex items-center gap-4 shadow-2xl"
                    >
                        <Printer className="w-5 h-5" /> 
                        <span>Materialize Receipt</span>
                    </button>
                </div>
            </div>
        </div>

        <div className="grid grid-cols-12 gap-8 mb-24">
            {/* Payment Intelligence Sidebar */}
            <div className="col-span-12 lg:col-span-4 space-y-8">
                {/* Protocol Methods Card */}
                <div className="erp-card rounded-[3rem] p-10 shadow-sm border-none bg-white dark:bg-neutral-900 flex flex-col gap-10">
                    <h3 className="text-[10px] font-black text-neutral-400 dark:text-neutral-500 uppercase tracking-[0.3em] flex items-center gap-3 italic">
                        <Target className="w-4 h-4 text-emerald-500" /> Inflow Protocol(s)
                    </h3>
                    
                    <div className="space-y-4">
                        {payment.paymentMethods.map((pm: any, idx: number) => (
                            <div
                                key={idx}
                                className="group/pm p-6 bg-[var(--erp-bg-sunken)] dark:bg-neutral-950/50 rounded-[2rem] border border-default dark:border-neutral-800 hover:border-emerald-500/20 transition-all flex items-center justify-between"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-white dark:bg-neutral-900 rounded-2xl flex items-center justify-center text-emerald-500 shadow-sm border border-default dark:border-neutral-800 group-hover/pm:scale-110 transition-transform">
                                        {pm.method === "cash" && <Banknote className="w-6 h-6" />}
                                        {pm.method === "card" && <CreditCard className="w-6 h-6" />}
                                        {pm.method === "upi" && <Smartphone className="w-6 h-6" />}
                                        {!["cash", "card", "upi"].includes(pm.method) && <Wallet className="w-6 h-6" />}
                                    </div>
                                    <div>
                                        <p className="text-sm font-black text-neutral-900 dark:text-main uppercase tracking-tight italic leading-none mb-1.5">{pm.method}</p>
                                        <p className="text-[9px] font-black text-neutral-400 uppercase tracking-widest leading-none italic">{pm.reference || 'DIRECT SETTLEMENT'}</p>
                                    </div>
                                </div>
                                <div className="text-lg font-black text-emerald-600 dark:text-emerald-400 italic">
                                    ₹{pm.amount.toLocaleString()}
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="p-6 bg-emerald-500/5 rounded-[2rem] border border-emerald-500/10 mt-auto">
                        <div className="flex justify-between items-center mb-1">
                            <span className="text-[9px] font-black text-neutral-400 uppercase tracking-widest italic">Net Inflow Pulse</span>
                            <span className="text-base font-black text-emerald-600 italic">₹{payment.totalAmount.toLocaleString()}</span>
                        </div>
                        <div className="w-full h-1 bg-emerald-500/10 rounded-full overflow-hidden mt-3">
                            <div className="h-full bg-emerald-500 w-full animate-pulse" />
                        </div>
                    </div>
                </div>

                {/* Entity Context Card */}
                <div className="erp-card rounded-[2.5rem] p-8 shadow-sm border-none group">
                    <h3 className="text-[10px] font-black text-neutral-400 dark:text-neutral-500 uppercase tracking-widest mb-8 flex items-center gap-2 italic">
                        <User className="w-4 h-4 text-emerald-500/50" /> Entity Context
                    </h3>
                    <div className="space-y-6">
                        <div className="flex items-center gap-4 p-5 bg-[var(--erp-bg-sunken)] dark:bg-neutral-950/50 rounded-2xl border border-default dark:border-neutral-800">
                             <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-600 border border-emerald-500/20 font-black">
                                {payment.customer.name.charAt(0)}
                             </div>
                             <div>
                                <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-1 italic">Participant</p>
                                <p className="text-base font-black text-neutral-900 dark:text-main uppercase tracking-tight italic leading-none">{payment.customer.name}</p>
                             </div>
                        </div>
                        <div className="grid grid-cols-1 gap-4">
                            <div className="flex items-center gap-4 text-neutral-600 dark:text-neutral-400 border-b border-default dark:border-neutral-800 pb-4 last:border-0">
                                <Phone className="w-4 h-4 text-neutral-400" />
                                <p className="text-xs font-black font-mono tracking-tight">{payment.customer.phone}</p>
                            </div>
                            {payment.customer.email && (
                            <div className="flex items-center gap-4 text-neutral-600 dark:text-neutral-400 border-b border-default dark:border-neutral-800 pb-4 last:border-0">
                                <Mail className="w-4 h-4 text-neutral-400" />
                                <p className="text-xs font-black font-mono tracking-tight italic">{payment.customer.email}</p>
                            </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="col-span-12 lg:col-span-8 space-y-8">
                {/* Allocation Matrix */}
                <div className="erp-card rounded-[3.5rem] p-1 shadow-2xl border-none overflow-hidden bg-white dark:bg-neutral-900 relative">
                    <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 opacity-20" />
                    <div className="p-10">
                        <div className="flex items-center gap-4 mb-10 px-2">
                            <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                                <Target className="w-6 h-6" />
                            </div>
                            <h3 className="text-2xl font-black text-neutral-900 dark:text-main uppercase tracking-tighter italic leading-none">Allocation Ledger</h3>
                        </div>

                        {payment.allocatedInvoices && payment.allocatedInvoices.length > 0 ? (
                            <div className="overflow-x-auto px-1">
                                <table className="w-full text-left border-separate border-spacing-y-4">
                                    <thead>
                                        <tr className="text-[10px] font-black uppercase tracking-[0.3em] text-neutral-400">
                                            <th className="px-8 py-2">Target Node</th>
                                            <th className="px-8 py-2 text-right">Node Total</th>
                                            <th className="px-8 py-2 text-right">Settle Vector</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {payment.allocatedInvoices.map((allocation: any, index: number) => (
                                            <tr key={index} className="group/row hover:transform hover:-translate-y-1 transition-all duration-500 cursor-pointer"
                                                onClick={() => navigate(`/sales/invoice/${allocation.invoice?._id}`)}
                                            >
                                                <td className="px-2 py-1">
                                                    <div className="bg-[var(--erp-bg-sunken)] dark:bg-neutral-950/50 rounded-[1.5rem] p-6 border border-default dark:border-neutral-800 group-hover/row:border-emerald-500/20 transition-all flex items-center gap-4">
                                                        <div className="p-3 bg-white dark:bg-neutral-900 rounded-xl border border-default dark:border-neutral-800 text-teal-500">
                                                            <FileText className="w-5 h-5" />
                                                        </div>
                                                        <div>
                                                            <p className="text-base font-black text-neutral-900 dark:text-neutral-100 uppercase tracking-tight italic leading-none mb-1">{allocation.invoice?.invoiceNo || 'DIRECT'}</p>
                                                            <span className="text-[9px] font-black text-neutral-400 uppercase tracking-widest italic leading-none">FISCAL TARGET NODE</span>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-2 py-1 text-right">
                                                    <div className="bg-[var(--erp-bg-sunken)] dark:bg-neutral-950/50 rounded-[1.5rem] p-6 border border-default dark:border-neutral-800 transition-all font-mono font-bold text-neutral-500 italic text-sm">
                                                        ₹{allocation.invoice?.totalAmount?.toLocaleString() || '0.00'}
                                                    </div>
                                                </td>
                                                <td className="px-2 py-1 text-right">
                                                    <div className="bg-[var(--erp-bg-sunken)] dark:bg-neutral-950/50 rounded-[1.5rem] p-6 border border-default dark:border-neutral-800 transition-all font-mono font-black text-emerald-600 dark:text-emerald-400 italic text-xl">
                                                        ₹{allocation.allocatedAmount.toLocaleString()}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div className="p-20 text-center bg-[var(--erp-bg-sunken)] dark:bg-neutral-950/50 rounded-[2.5rem] border border-dashed border-default dark:border-neutral-800">
                                <Zap className="w-12 h-12 text-amber-500 mx-auto mb-4 opacity-50" />
                                <h4 className="text-xl font-black text-neutral-900 dark:text-main uppercase tracking-tighter italic">Unallocated Advance Node</h4>
                                <p className="text-sm font-bold text-neutral-500 mt-2 italic max-w-sm mx-auto">
                                    This collection is currently floating in the fiscal matrix as a credit for future settlements.
                                </p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Fiscal Health & Dues Section */}
                <div className="erp-card rounded-[3rem] p-10 bg-[var(--erp-bg-sunken)] dark:bg-neutral-950/30 border border-default dark:border-neutral-800 shadow-inner group">
                    <h3 className="text-[10px] font-black text-neutral-400 dark:text-white/20 uppercase tracking-[0.3em] mb-10 flex items-center gap-3 italic">
                        <CheckCircle className="w-4 h-4 text-emerald-500" /> Reconciliation State
                    </h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="erp-card rounded-[2rem] p-8 shadow-sm border-none bg-white dark:bg-neutral-900 group/health">
                             <div className="flex justify-between items-center mb-8">
                                <div className="p-3 bg-emerald-500/10 rounded-xl text-emerald-500">
                                    <Wallet className="w-6 h-6" />
                                </div>
                                <span className="text-[9px] font-black text-neutral-400 uppercase tracking-widest italic group-hover/health:text-emerald-500 transition-colors">Net Pulse</span>
                             </div>
                             <div className="space-y-4">
                                <div className="flex justify-between items-center text-xs font-bold uppercase tracking-tight italic">
                                    <span className="text-neutral-500">Payment Inflow</span>
                                    <span className="text-neutral-900 dark:text-main">₹{payment.totalAmount.toLocaleString()}</span>
                                </div>
                                {payment.creditApplied > 0 && (
                                <div className="flex justify-between items-center text-xs font-bold uppercase tracking-tight italic">
                                    <span className="text-orange-500">Credit Inbound</span>
                                    <span className="text-orange-500">+₹{payment.creditApplied.toLocaleString()}</span>
                                </div>
                                )}
                                <div className="h-px bg-default dark:bg-neutral-800 w-full" />
                                <div className="flex justify-between items-center text-lg font-black uppercase tracking-tighter italic">
                                    <span className="text-neutral-900 dark:text-main">Effective Power</span>
                                    <span className="text-emerald-600 dark:text-emerald-400">₹{(payment.totalAmount + payment.creditApplied).toLocaleString()}</span>
                                </div>
                             </div>
                        </div>

                        <div className="flex flex-col justify-center">
                            {(() => {
                                const currentDues = payment.customerCurrentDues || 0;
                                const effectivePayment = payment.totalAmount + payment.creditApplied;
                                const duesBeforePayment = currentDues + effectivePayment;

                                if (effectivePayment > duesBeforePayment && duesBeforePayment > 0) {
                                    const excessAmount = effectivePayment - duesBeforePayment;
                                    return (
                                        <div className="p-8 rounded-[2rem] bg-emerald-600 text-white shadow-xl shadow-emerald-600/20 animate-in zoom-in-95 duration-500">
                                            <div className="flex items-center gap-4 mb-4">
                                                <Sparkles className="w-8 h-8 text-white animate-pulse" />
                                                <h4 className="text-xl font-black uppercase tracking-tighter italic leading-none">Surplus Credit Node</h4>
                                            </div>
                                            <p className="text-sm font-medium opacity-80 uppercase tracking-tight italic mb-6">
                                                Collection exceeded all liabilities. Surplus cached in customer ledger.
                                            </p>
                                            <div className="text-3xl font-black italic tracking-tighter leading-none">
                                                +₹{excessAmount.toLocaleString()}
                                            </div>
                                        </div>
                                    );
                                }

                                if (Math.abs(effectivePayment - duesBeforePayment) < 0.01 && duesBeforePayment > 0) {
                                    return (
                                        <div className="p-8 rounded-[2rem] bg-teal-600 text-white shadow-xl shadow-teal-600/20 animate-in zoom-in-95 duration-500">
                                            <div className="flex items-center gap-4 mb-4">
                                                <CheckCircle className="w-8 h-8 text-white" />
                                                <h4 className="text-xl font-black uppercase tracking-tighter italic leading-none">Zero Debt Protocol</h4>
                                            </div>
                                            <p className="text-sm font-medium opacity-80 uppercase tracking-tight italic">
                                                This cycle successfully purged all outstanding target dues for this entity.
                                            </p>
                                        </div>
                                    );
                                }

                                if (effectivePayment < duesBeforePayment && duesBeforePayment > 0) {
                                    const remainingDues = duesBeforePayment - effectivePayment;
                                    return (
                                        <div className="p-8 rounded-[2rem] bg-amber-500 text-white shadow-xl shadow-amber-500/20 animate-in zoom-in-95 duration-500">
                                            <div className="flex items-center gap-4 mb-4">
                                                <AlertCircle className="w-8 h-8 text-white" />
                                                <h4 className="text-xl font-black uppercase tracking-tighter italic leading-none">Partial Settle State</h4>
                                            </div>
                                            <p className="text-sm font-medium opacity-80 uppercase tracking-tight italic mb-6">
                                                Liabilities persist. Net outstanding balance detected in ledger.
                                            </p>
                                            <div className="text-3xl font-black italic tracking-tighter leading-none">
                                                -₹{remainingDues.toLocaleString()}
                                            </div>
                                        </div>
                                    );
                                }

                                return (
                                    <div className="p-8 rounded-[2rem] bg-indigo-600 text-white shadow-xl shadow-indigo-600/20 animate-in zoom-in-95 duration-500">
                                        <div className="flex items-center gap-4 mb-4">
                                            <Zap className="w-8 h-8 text-white" />
                                            <h4 className="text-xl font-black uppercase tracking-tighter italic leading-none">Advance Position</h4>
                                        </div>
                                        <p className="text-sm font-medium opacity-80 uppercase tracking-tight italic">
                                            Pre-paid liquidity node available for future fiscal allocations.
                                        </p>
                                    </div>
                                );
                            })()}
                        </div>
                    </div>
                </div>

                {/* Internal Supplemental Observations */}
                {payment.notes && (
                    <div className="erp-card rounded-[2.5rem] p-10 shadow-sm border-none bg-neutral-900 text-white relative overflow-hidden group/notes">
                        <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none group-hover/notes:scale-110 transition-transform">
                            <FileText className="w-40 h-40" />
                        </div>
                        <h3 className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-6 flex items-center gap-2 italic relative z-10">
                            Supplemental Observations Ledger
                        </h3>
                        <p className="text-sm font-medium text-white/70 leading-relaxed italic relative z-10 border-l-2 border-white/10 pl-6 uppercase tracking-tight">
                            {payment.notes}
                        </p>
                    </div>
                )}
            </div>
        </div>

        {/* Branded verification footprint */}
        <div className="mt-8 flex items-center justify-center gap-6 opacity-30 group pb-24 print:hidden">
            <div className="h-px w-20 bg-neutral-400 dark:bg-neutral-600" />
            <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4" />
                <span className="text-[9px] font-black uppercase tracking-[0.3em]">Fiscal Integrity Secured • Receipt Verified Immutable</span>
            </div>
            <div className="h-px w-20 bg-neutral-400 dark:bg-neutral-600" />
        </div>

        {/* Print Ledger Styles */}
        <style>{`
            @media print {
                @page { margin: 0; size: auto; }
                body { background: white !important; font-family: 'Inter', sans-serif !important; -webkit-print-color-adjust: exact !important; }
                body * { visibility: hidden !important; }
                .page-shell, .page-shell * { visibility: visible !important; }
                .bg-app { background: white !important; }
                .erp-card { border: none !important; box-shadow: none !important; border-radius: 0 !important; color: black !important; background: white !important; }
                .dark .erp-card { background: white !important; color: black !important; border: 1px solid #eee !important; min-height: auto !important; }
                .dark h1, .dark h2, .dark h3, .dark span, .dark p, .dark td, .dark th { color: black !important; }
                .page-shell { position: absolute; left: 0; top: 0; width: 100%; padding: 0 !important; margin: 0 !important; display: block !important; }
                .print\\:hidden, button, .sparkles, footer, .opacity-30 { display: none !important; }
                h1 { font-size: 2.5rem !important; margin-bottom: 0.5rem !important; }
                .text-emerald-600, .text-emerald-400 { color: #059669 !important; }
                .text-emerald-600, .text-emerald-400 { color: #059669 !important; }
                .bg-neutral-900 { border-bottom: 2px solid #eee !important; padding: 2rem !important; }
                table { border-spacing: 0 !important; }
                td, th { border-bottom: 1px solid #eee !important; padding: 1rem !important; }
                .bg-[var(--erp-bg-sunken)] { background: #f9fafb !important; }
            }
        `}</style>
      </PageShell>
    </Layout>
  );
};

export default PaymentReceiptDetail;

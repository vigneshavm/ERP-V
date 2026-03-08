import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import api from "@/services/api";
import { toast } from "react-toastify";
import Layout from "@/components/shared/Layout/Layout";
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
  ChevronLeft,
  Activity,
  ShieldCheck,
  Layers,
  History,
  Zap,
  ArrowUpRight,
  BadgeCheck,
  MapPin,
  Wallet
} from 'lucide-react';

const API_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";

const PaymentReceiptDetail = () => {
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
      const response = await api.get(`${API_URL}/api/payment-in/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setPayment(response.data);
    } catch (error) {
      toast.error("Settlement Sync Failure: Cannot retrieve receipt manifest");
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => window.print();

  if (loading || !payment) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center py-32 space-y-4">
          <div className="w-12 h-12 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin"></div>
          <p className="text-[10px] font-black text-secondary uppercase tracking-[0.3em]">Decoding Settlement Manifest...</p>
        </div>
      </Layout>
    );
  }

  const effectivePayment = payment.totalAmount + (payment.creditApplied || 0);

  return (
    <Layout>
      <div className="min-h-screen bg-app p-4 lg:p-8 relative overflow-hidden pb-32">
        {/* Backdrop Accents */}
        <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-emerald-500/5 rounded-full blur-[160px] pointer-events-none -mr-48 -mt-48 opacity-30"></div>
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-blue-500/5 rounded-full blur-[140px] pointer-events-none -ml-32 -mb-32 opacity-20"></div>

        <div className="max-w-6xl mx-auto relative z-10 space-y-8">
          {/* Navigation & Actions */}
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col md:flex-row md:items-center justify-between gap-6 print:hidden"
          >
            <button 
              onClick={() => navigate("/sales/payment-in-list")}
              className="flex items-center gap-3 text-[10px] font-black text-secondary uppercase tracking-[0.3em] hover:text-emerald-500 transition-colors group"
            >
              <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
              Settlement Registry
            </button>

            <button 
              onClick={handlePrint}
              className="px-8 py-3 bg-emerald-600 text-white rounded-xl font-black text-[10px] uppercase tracking-[0.4em] shadow-2xl shadow-emerald-900/40 hover:bg-emerald-500 transition-all flex items-center gap-3"
            >
              <Printer className="w-4 h-4" />
              Generate Physical Manifest
            </button>
          </motion.div>

          {/* Master Receipt Header */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass-panel p-10 border border-white/5 relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none">
              <Receipt className="w-64 h-64" />
            </div>
            
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 relative z-10">
              <div className="space-y-4">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-emerald-500/20 bg-emerald-500/10 text-emerald-500">
                  <CheckCircle className="w-3 h-3" />
                  <span className="text-[9px] font-black uppercase tracking-widest">Protocol: Verified Settlement</span>
                </div>
                <div>
                  <h1 className="text-4xl md:text-6xl font-display font-black text-main tracking-tighter uppercase line-clamp-1">
                    {payment.receiptNumber}
                  </h1>
                  <p className="text-secondary text-sm font-medium opacity-60 mt-1">
                    Established {new Date(payment.paymentDate).toLocaleDateString("en-IN", { day: '2-digit', month: 'short', year: 'numeric' })} — System Authenticated
                  </p>
                </div>
              </div>

              <div className="flex flex-col items-end">
                <div className="text-[10px] font-black text-secondary uppercase tracking-[0.3em] mb-1">Liquid Capital Capture</div>
                <div className="text-4xl md:text-5xl font-display font-black text-main tracking-tighter">
                  ₹{payment.totalAmount.toLocaleString()}
                </div>
                {payment.creditApplied > 0 && (
                  <div className="text-[10px] font-black text-amber-500 uppercase tracking-widest mt-2 flex items-center gap-2">
                    <Zap className="w-3 h-3" />
                    + ₹{payment.creditApplied.toLocaleString()} Applied Credit
                  </div>
                )}
              </div>
            </div>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
              {/* Counterparty Intelligence */}
              <motion.div 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="glass-panel p-8 border border-white/5 flex flex-col md:flex-row gap-8 items-start"
              >
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white text-3xl font-black shadow-2xl shadow-emerald-500/20">
                  {payment.customer?.name?.charAt(0).toUpperCase() || <User />}
                </div>
                <div className="space-y-6 flex-1">
                  <div>
                    <h2 className="text-2xl font-display font-black text-main uppercase tracking-tight">{payment.customer.name}</h2>
                    <div className="text-[10px] font-black text-secondary uppercase tracking-[0.3em] opacity-40 mt-1">Authorized Remitter Profile</div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center gap-3 text-secondary">
                      <div className="p-2 bg-white/5 rounded-lg"><Phone className="w-3.5 h-3.5" /></div>
                      <span className="text-xs font-bold font-mono tracking-tight">{payment.customer.phone}</span>
                    </div>
                    {payment.customer.email && (
                      <div className="flex items-center gap-3 text-secondary">
                        <div className="p-2 bg-white/5 rounded-lg"><Mail className="w-3.5 h-3.5" /></div>
                        <span className="text-xs font-bold font-mono tracking-tight">{payment.customer.email}</span>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>

              {/* Settlement Allocation Manifest */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass-panel border border-white/5 overflow-hidden"
              >
                <div className="px-8 py-6 border-b border-white/5 bg-white/5 text-[10px] font-black text-secondary uppercase tracking-[0.3em]">
                  Revenue Allocation Matrix
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b border-white/5">
                        <th className="px-8 py-4 text-[9px] font-black text-secondary/40 uppercase tracking-widest">Index</th>
                        <th className="px-8 py-4 text-[9px] font-black text-secondary/40 uppercase tracking-widest">Target Invoice</th>
                        <th className="px-8 py-4 text-[9px] font-black text-secondary/40 uppercase tracking-widest text-right">Invoice Magnitude</th>
                        <th className="px-8 py-4 text-[9px] font-black text-secondary/40 uppercase tracking-widest text-right">Settled Volume</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {payment.allocatedInvoices?.map((allocation: any, idx: number) => (
                        <tr key={idx} className="group hover:bg-white/5 transition-colors">
                          <td className="px-8 py-5 text-[10px] font-black text-secondary/20 font-mono italic">{String(idx + 1).padStart(2, '0')}</td>
                          <td className="px-8 py-5">
                            <div className="text-xs font-black text-main uppercase tracking-tight">{allocation.invoice?.invoiceNo || 'N/A'}</div>
                            <div className="text-[8px] font-black text-emerald-500 uppercase tracking-widest mt-0.5">Allocation Verified</div>
                          </td>
                          <td className="px-8 py-5 text-right font-bold text-secondary/60 font-mono text-xs">₹{allocation.invoice?.totalAmount?.toLocaleString() || '0.00'}</td>
                          <td className="px-8 py-5 text-right font-display font-black text-emerald-500 tracking-tighter text-lg">₹{allocation.allocatedAmount.toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </motion.div>
            </div>

            {/* Terminal Analytics Sidebar */}
            <div className="space-y-8">
              {/* Aggregate Position */}
              <motion.div 
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="glass-panel border-2 border-emerald-500/20 overflow-hidden sticky top-8"
              >
                <div className="p-8 space-y-6">
                  <div className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.3em]">Settlement Aggregate</div>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center opacity-40 hover:opacity-100 transition-all">
                      <span className="text-[10px] font-black text-secondary uppercase tracking-widest">Gross Remittance</span>
                      <span className="text-sm font-black text-main font-mono">₹{payment.totalAmount.toLocaleString()}</span>
                    </div>
                    {payment.creditApplied > 0 && (
                      <div className="flex justify-between items-center opacity-40 hover:opacity-100 transition-all">
                        <span className="text-[10px] font-black text-secondary uppercase tracking-widest">Credit Injection</span>
                        <span className="text-sm font-black text-amber-500 font-mono">+₹{payment.creditApplied.toLocaleString()}</span>
                      </div>
                    )}
                    <div className="h-px bg-white/5 my-2"></div>
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-black text-main uppercase tracking-widest">Effective Settlement</span>
                      <span className="text-2xl font-display font-black text-emerald-500 tracking-tighter">₹{effectivePayment.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-[10px] font-black text-secondary uppercase tracking-widest opacity-40">Allocated Flux</span>
                      <span className="font-black text-main opacity-60">₹{payment.allocatedInvoices.reduce((sum: number, inv: any) => sum + inv.allocatedAmount, 0).toLocaleString()}</span>
                    </div>
                  </div>
                </div>
                <div className="bg-emerald-500/10 p-6 flex items-center gap-4 text-emerald-500 backdrop-blur-md border-t border-emerald-500/20">
                  <ShieldCheck className="w-5 h-5 animate-pulse" />
                  <div className="text-[10px] font-black uppercase tracking-[0.3em]">Ledger Integrity Confirmed</div>
                </div>
              </motion.div>

              {/* Payment Methods Traceability */}
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="glass-panel p-8 border border-white/5 space-y-6"
              >
                <div className="text-[10px] font-black text-secondary uppercase tracking-[0.3em]">Capture Vectors</div>
                <div className="space-y-4">
                  {payment.paymentMethods.map((pm: any, idx: number) => (
                    <div key={idx} className="p-4 bg-white/5 rounded-2xl border border-white/5 group hover:border-emerald-500/40 transition-all">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-500">
                             {pm.method === "cash" && <Banknote className="w-4 h-4" />}
                             {pm.method === "card" && <CreditCard className="w-4 h-4" />}
                             {pm.method === "upi" && <Smartphone className="w-4 h-4" />}
                             {pm.method === "cheque" && <FileText className="w-4 h-4" />}
                          </div>
                          <span className="text-[10px] font-black uppercase tracking-widest text-main">{pm.method}</span>
                        </div>
                        <span className="text-sm font-black text-emerald-500 font-mono">₹{pm.amount.toLocaleString()}</span>
                      </div>
                      {pm.reference && <div className="text-[8px] font-black text-secondary/40 uppercase tracking-widest mt-1">REF: {pm.reference}</div>}
                      {pm.chequeNumber && (
                        <div className="mt-2 pt-2 border-t border-white/5 space-y-1">
                          <div className="text-[8px] font-black text-secondary/60 uppercase tracking-widest">CHEQUE #{pm.chequeNumber}</div>
                          <div className="text-[8px] font-black text-secondary/40 uppercase tracking-widest">{pm.chequeBank} | {new Date(pm.chequeDate).toLocaleDateString()}</div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .glass-panel { background: rgba(255, 255, 255, 0.03); backdrop-filter: blur(20px); border-radius: 2rem; }
        .font-display { font-family: 'Outfit', sans-serif; }
        @media print {
          .print\\:hidden { display: none !important; }
        }
      `}</style>
    </Layout>
  );
};

export default PaymentReceiptDetail;

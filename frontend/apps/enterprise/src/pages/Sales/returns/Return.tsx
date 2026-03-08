import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import api from "../../../services/api";
import { toast } from "react-toastify";
import Layout from "../../../components/shared/Layout/Layout";
import {
  RotateCcw,
  FileText,
  User,
  Phone,
  Mail,
  X,
  Save,
  Trash2,
  ChevronRight,
  AlertCircle,
  CheckCircle,
  Search,
  Zap,
  ShieldCheck,
  Package,
  Activity,
  History,
  ArrowRight,
  Banknote,
  CreditCard,
  Building2,
  AlertTriangle
} from 'lucide-react';

const API_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";

const Return = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [searchInvoice, setSearchInvoice] = useState("");

  const [formData, setFormData] = useState<any>(() => {
    const savedDraft = localStorage.getItem("returnDraft");
    if (savedDraft) {
      try {
        return JSON.parse(savedDraft);
      } catch (error: any) {
        console.error("Error loading return draft:", error);
      }
    }
    return {
      selectedInvoice: null,
      customer: null,
      items: [],
      refundMethod: "",
      originalPaymentInfo: null,
      notes: "",
    };
  });

  const user = JSON.parse(localStorage.getItem("user") || '{}');
  const token = user?.token;

  useEffect(() => {
    if (formData.selectedInvoice || formData.items.length > 0) {
      localStorage.setItem("returnDraft", JSON.stringify(formData));
    }
  }, [formData]);

  useEffect(() => {
    if (showInvoiceModal) {
      fetchInvoices();
    }
  }, [showInvoiceModal]);

  const fetchInvoices = async () => {
    if (!token) {
      toast.error("Protocol Authentication Failed: Token Missing");
      return;
    }
    try {
      const response = await api.get(`${API_URL}/api/pos/invoices`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setInvoices(response.data);
    } catch (error: any) {
      toast.error("Registry Sync Failure: Cannot retrieve invoices");
    }
  };

  const handleInvoiceSelect = async (invoice: any) => {
    try {
      const response = await api.get(`${API_URL}/api/pos/invoice/${invoice._id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const fullInvoice = response.data || {};
      
      let existingReturns: any[] = [];
      try {
        const returnsResponse = await api.get(`${API_URL}/api/returns`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        existingReturns = returnsResponse.data.filter((ret: any) => ret.invoice._id === invoice._id);
      } catch (e) {}

      const returnedQuantities: any = {};
      existingReturns.forEach((rec) => {
        (rec.items || []).forEach((item: any) => {
          const productId = typeof item.product === "object" ? item.product._id : item.product;
          if (!productId) return;
          returnedQuantities[productId] = (returnedQuantities[productId] || 0) + (Number(item.returnedQty) || 0);
        });
      });

      const returnItems = fullInvoice.items
        .map((item: any) => {
          const itemData = item.item;
          const itemId = typeof itemData === "object" ? itemData._id : itemData;
          const itemName = typeof itemData === "object" ? itemData.name : "Asset";
          const alreadyReturned = Number(returnedQuantities[itemId]) || 0;
          const remainingQty = Number(item.quantity || 0) - alreadyReturned;

          return {
            productId: itemId,
            productName: itemName,
            originalQty: item.quantity,
            alreadyReturned,
            remainingQty,
            returnedQty: 0,
            rate: item.price,
            taxPercent: 0,
            condition: "not_damaged",
            reason: "",
          };
        })
        .filter((item: any) => item.remainingQty > 0);

      if (returnItems.length === 0) {
        toast.warning("Protocol Termination: No remaining assets available for retrieval");
        return;
      }

      setFormData({
        selectedInvoice: fullInvoice,
        customer: fullInvoice.customer,
        items: returnItems,
        refundMethod: "",
        originalPaymentInfo: {
          method: fullInvoice.paymentMethod,
          paidAmount: fullInvoice.paidAmount || 0,
        },
        notes: "",
      });

      setShowInvoiceModal(false);
    } catch (error) {
      toast.error("Resolution Error: Failed to decode invoice manifest");
    }
  };

  const updateItem = (index: number, field: string, value: any) => {
    const newItems = [...formData.items];
    newItems[index][field] = value;
    setFormData({ ...formData, items: newItems });
  };

  const calculateSubtotal = () => formData.items.reduce((sum: number, item: any) => sum + (item.returnedQty * item.rate), 0);
  const calculateTotal = () => calculateSubtotal();

  const handleSubmit = async () => {
    if (!formData.selectedInvoice || !formData.refundMethod) {
      toast.error("Validation Error: Missing protocol parameters");
      return;
    }

    const itemsToReturn = formData.items.filter((i: any) => i.returnedQty > 0);
    if (itemsToReturn.length === 0) {
      toast.error("Validation Error: No assets flagged for retrieval");
      return;
    }

    setLoading(true);
    try {
      await api.post(`${API_URL}/api/returns`, {
        invoiceId: formData.selectedInvoice._id,
        items: itemsToReturn,
        refundMethod: formData.refundMethod,
        notes: formData.notes,
      }, { headers: { Authorization: `Bearer ${token}` } });

      localStorage.removeItem("returnDraft");
      toast.success("Protocol Success: Inventory Retrieval Synchronized");
      setTimeout(() => navigate("/sales/returned-items"), 1500);
    } catch (error) {
      toast.error("Synchronization Failure: Communication interrupted");
    } finally {
      setLoading(false);
    }
  };

  const GlassPanel = ({ children, title, icon: Icon, className = "" }: any) => (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`glass-panel border border-white/5 shadow-2xl overflow-hidden ${className}`}
    >
      {title && (
        <div className="px-6 py-4 border-b border-white/5 bg-white/5 flex items-center justify-between">
          <h3 className="text-[10px] font-black text-primary uppercase tracking-[0.3em] flex items-center gap-3">
            {Icon && <Icon className="w-4 h-4" />}
            {title}
          </h3>
          <div className="flex gap-1">
            <div className="w-1 h-1 bg-primary/40 rounded-full"></div>
          </div>
        </div>
      )}
      <div className="p-6">{children}</div>
    </motion.div>
  );

  const filteredInvoices = invoices.filter(inv => 
    inv.invoiceNo.toLowerCase().includes(searchInvoice.toLowerCase()) ||
    (inv.customer?.name || "").toLowerCase().includes(searchInvoice.toLowerCase())
  );

  return (
    <Layout>
      <div className="min-h-screen bg-app p-4 lg:p-8 relative overflow-hidden pb-32">
        {/* Background Accents */}
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-rose-500/5 rounded-full blur-[140px] pointer-events-none -mr-48 -mt-48 opacity-30"></div>
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-indigo-500/5 rounded-full blur-[120px] pointer-events-none -ml-32 -mb-32 opacity-20"></div>

        <div className="max-w-7xl mx-auto relative z-10 space-y-8">
          {/* Tactical Header */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-3 text-rose-500 font-black text-[10px] uppercase tracking-[0.4em]">
                <ShieldCheck className="w-4 h-4" />
                Protocol: Inventory Retrieval / 2036
              </div>
              <h1 className="text-4xl md:text-5xl font-display font-black text-main tracking-tighter uppercase">
                Returns <span className="text-rose-500 italic">Intelligence</span>
              </h1>
              <p className="text-secondary text-sm font-medium opacity-60">High-fidelity asset reconciliation and liquidity reversal.</p>
            </div>

            <div className="flex items-center gap-3">
              <button 
                onClick={() => navigate("/sales/returned-items")}
                className="px-6 py-3 bg-white/5 border border-white/10 rounded-xl text-[10px] font-black text-secondary uppercase tracking-widest hover:text-main hover:border-white/20 transition-all flex items-center gap-3"
              >
                <History className="w-4 h-4" />
                Registry
              </button>
              <button 
                onClick={handleSubmit}
                disabled={loading}
                className="px-8 py-3 bg-rose-600 text-white rounded-xl font-black text-[10px] uppercase tracking-[0.4em] shadow-2xl shadow-rose-900/40 hover:bg-rose-500 transition-all flex items-center gap-3 disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                {loading ? "Processing..." : "Commit Reversal"}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-8 space-y-8">
              {/* Manifest Source Identification */}
              <GlassPanel title="Manifest Source" icon={FileText}>
                {formData.selectedInvoice ? (
                   <div className="p-6 bg-rose-500/5 border border-rose-500/10 rounded-2xl flex items-center justify-between group">
                    <div className="flex items-center gap-6">
                      <div className="w-14 h-14 bg-rose-500/10 border border-rose-500/20 rounded-2xl flex items-center justify-center text-rose-500 font-black text-xl">
                        {formData.selectedInvoice.invoiceNo.charAt(0)}
                      </div>
                      <div>
                        <div className="text-xl font-display font-black text-main uppercase tracking-tight">{formData.selectedInvoice.invoiceNo}</div>
                        <div className="text-[10px] font-bold text-secondary/60 uppercase tracking-widest mt-1 italic">
                          Established: {new Date(formData.selectedInvoice.createdAt).toLocaleDateString()} — ₹{formData.selectedInvoice.totalAmount?.toLocaleString()}
                        </div>
                      </div>
                    </div>
                    <button 
                      onClick={() => setFormData({ ...formData, selectedInvoice: null, items: [] })}
                      className="p-3 hover:bg-rose-500/10 rounded-xl text-rose-500 transition-colors"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                ) : (
                  <button 
                    onClick={() => setShowInvoiceModal(true)}
                    className="w-full py-10 border-2 border-dashed border-white/10 rounded-3xl flex flex-col items-center justify-center gap-4 group hover:border-rose-500/40 transition-all"
                  >
                    <div className="w-14 h-14 bg-white/5 rounded-full flex items-center justify-center group-hover:bg-rose-500/10 transition-colors">
                      <Search className="w-6 h-6 text-white/20 group-hover:text-rose-500" />
                    </div>
                    <div>
                      <div className="text-[10px] font-black uppercase tracking-[0.3em] text-secondary">Identify Source Manifest</div>
                      <div className="text-[9px] font-bold text-secondary/20 uppercase tracking-widest mt-1">Search by ID or Counterparty Label</div>
                    </div>
                  </button>
                )}
              </GlassPanel>

              {/* Asset Retrieval Matrix */}
              {formData.items.length > 0 && (
                <GlassPanel title="Asset Retrieval Matrix" icon={Package}>
                  <div className="overflow-x-auto -mx-6">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="border-b border-white/5">
                          <th className="px-8 py-4 text-[9px] font-black text-secondary/40 uppercase tracking-widest">Asset Configuration</th>
                          <th className="px-8 py-4 text-[9px] font-black text-secondary/40 uppercase tracking-widest text-right">Magnitude</th>
                          <th className="px-8 py-4 text-[9px] font-black text-secondary/40 uppercase tracking-widest text-center">Protocol Flag</th>
                          <th className="px-12 py-4 text-[9px] font-black text-secondary/40 uppercase tracking-widest">Operational Parameters</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {formData.items.map((item: any, idx: number) => (
                          <tr key={idx} className="group hover:bg-white/5 transition-colors">
                            <td className="px-8 py-6">
                              <div className="text-xs font-black text-main uppercase tracking-tight">{item.productName}</div>
                              <div className="text-[8px] font-black text-secondary/40 uppercase tracking-widest mt-0.5">AVAIL: {item.remainingQty} UNITS</div>
                            </td>
                            <td className="px-8 py-6 text-right">
                              <div className="text-xs font-black text-main font-mono">₹{item.rate.toLocaleString()}</div>
                              <div className="text-[8px] font-black text-rose-500 uppercase mt-0.5">Per Unit</div>
                            </td>
                            <td className="px-8 py-6">
                              <div className="flex justify-center">
                                <input 
                                  type="number"
                                  value={item.returnedQty || ''}
                                  onChange={e => updateItem(idx, "returnedQty", Math.min(Number(e.target.value), item.remainingQty))}
                                  className="w-20 bg-white/5 border border-white/10 rounded-lg px-2 py-2 text-center text-xs font-black text-rose-500 focus:outline-none focus:border-rose-500/40"
                                />
                              </div>
                            </td>
                            <td className="px-8 py-6 space-y-2">
                              <div className="flex gap-2">
                                <select 
                                  value={item.condition}
                                  onChange={e => updateItem(idx, "condition", e.target.value)}
                                  className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-[10px] font-black text-main uppercase tracking-widest"
                                >
                                  <option value="not_damaged" className="bg-neutral-900">Pristine</option>
                                  <option value="damaged" className="bg-neutral-900">Compromised</option>
                                </select>
                                <select 
                                  value={item.reason}
                                  onChange={e => updateItem(idx, "reason", e.target.value)}
                                  className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-[10px] font-black text-main uppercase tracking-widest"
                                >
                                  <option value="" className="bg-neutral-900">Select Causality</option>
                                  {(item.condition === 'damaged' ? ['Defective', 'Expired', 'Logistics Gap'] : ['Wrong Spec', 'Excess', 'Redundant']).map(r => (
                                    <option key={r} value={r} className="bg-neutral-900">{r}</option>
                                  ))}
                                </select>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </GlassPanel>
              )}
            </div>

            {/* Reversal Intelligence Sidebar */}
            <div className="lg:col-span-4 space-y-8">
              {/* Counterparty Identification */}
              {formData.customer && (
                <GlassPanel title="Counterparty Profile" icon={User}>
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-12 h-12 bg-gradient-to-br from-rose-500 to-indigo-600 rounded-2xl flex items-center justify-center text-white font-black text-lg shadow-xl shadow-rose-900/20">
                      {formData.customer.name.charAt(0)}
                    </div>
                    <div>
                      <div className="text-sm font-black text-main uppercase tracking-widest">{formData.customer.name}</div>
                      <div className="text-[10px] font-bold text-secondary opacity-40 uppercase tracking-widest mt-1 italic">{formData.customer.phone}</div>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="p-4 bg-white/5 border border-white/5 rounded-2xl flex justify-between items-center">
                      <span className="text-[9px] font-black text-secondary uppercase tracking-widest">Liquid Position</span>
                      <span className={`text-sm font-black ${formData.customer.dues < 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                        ₹{Math.abs(formData.customer.dues).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </GlassPanel>
              )}

              {/* Liquidity Reversal Logic */}
              <GlassPanel title="Reversal Protocol" icon={Zap} className="sticky top-8">
                <div className="space-y-8">
                  <div className="space-y-3">
                    <label className="text-[9px] font-black text-secondary uppercase tracking-widest">Redistribution Vector</label>
                    <div className="grid grid-cols-2 gap-3">
                      {[
                        { id: 'cash', label: 'Cash Reserve', icon: Banknote },
                        { id: 'credit', label: 'Ledger Credit', icon: ShieldCheck }
                      ].map(v => (
                        <button 
                          key={v.id}
                          onClick={() => setFormData({ ...formData, refundMethod: v.id })}
                          className={`flex flex-col items-center gap-3 p-4 rounded-2xl border transition-all ${formData.refundMethod === v.id ? 'bg-rose-500/10 border-rose-500/40 text-rose-500' : 'bg-white/5 border-white/5 text-secondary hover:border-white/20'}`}
                        >
                          <v.icon className={`w-5 h-5 ${formData.refundMethod === v.id ? 'animate-pulse' : ''}`} />
                          <span className="text-[9px] font-black uppercase tracking-widest">{v.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-6 pt-6 border-t border-white/5">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-black text-secondary uppercase tracking-[0.2em]">Retrieved Magnitude</span>
                      <span className="text-3xl font-display font-black text-main tracking-tighter">₹{calculateTotal().toLocaleString()}</span>
                    </div>
                    <div className="p-4 bg-rose-500/5 border border-rose-500/10 rounded-2xl flex items-center gap-3 text-rose-500">
                      <AlertTriangle className="w-4 h-4 animate-pulse" />
                      <div className="text-[9px] font-black uppercase tracking-widest">Action: Liquidity Drawdown</div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[9px] font-black text-secondary uppercase tracking-widest">Protocol Remarks</label>
                    <textarea 
                      value={formData.notes}
                      onChange={e => setFormData({ ...formData, notes: e.target.value })}
                      className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-xs font-medium text-main resize-none h-24 placeholder:text-secondary/20 focus:outline-none focus:border-rose-500/40"
                      placeholder="Specify causality flags..."
                    />
                  </div>
                </div>
              </GlassPanel>
            </div>
          </div>
        </div>
      </div>

      {/* Invoice Modal */}
      <AnimatePresence>
        {showInvoiceModal && (
          <div className="fixed inset-0 flex items-center justify-center z-[100] px-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowInvoiceModal(false)} className="absolute inset-0 bg-black/80 backdrop-blur-md" />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="w-full max-w-2xl glass-panel border border-white/10 shadow-2xl overflow-hidden relative z-10">
              <div className="px-8 py-6 border-b border-white/10 bg-white/5 flex items-center justify-between">
                <h3 className="text-[12px] font-black text-rose-500 uppercase tracking-[0.3em]">Manifest Registry</h3>
                <button onClick={() => setShowInvoiceModal(false)} className="text-secondary hover:text-main transition-colors"><X className="w-6 h-6" /></button>
              </div>
              <div className="p-8 space-y-6">
                <div className="relative">
                  <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-rose-500" />
                  <input type="text" placeholder="IDENTIFY BY ID OR COUNTERPARTY..." value={searchInvoice} onChange={e => setSearchInvoice(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-2xl py-5 pl-14 pr-6 text-sm font-bold tracking-widest text-main focus:outline-none focus:border-rose-500/40 transition-all" />
                </div>
                <div className="space-y-3 max-h-[400px] overflow-y-auto custom-scrollbar pr-2">
                  {filteredInvoices.map(inv => (
                    <button key={inv._id} onClick={() => handleInvoiceSelect(inv)} className="w-full p-5 bg-white/5 border border-white/5 hover:border-rose-500/40 rounded-2xl flex items-center justify-between group transition-all">
                      <div className="text-left">
                        <div className="text-sm font-black text-main uppercase tracking-widest group-hover:text-rose-500 transition-colors">{inv.invoiceNo}</div>
                        <div className="text-[10px] font-medium text-secondary flex items-center gap-2 mt-1 italic">{inv.customer?.name || 'Walk-in'} • {new Date(inv.createdAt).toLocaleDateString()}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-black text-main">₹{inv.totalAmount?.toLocaleString()}</div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <style>{`
        .glass-panel { background: rgba(255, 255, 255, 0.03); backdrop-filter: blur(20px); border-radius: 2rem; }
        .font-display { font-family: 'Outfit', sans-serif; }
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(244, 63, 94, 0.2); border-radius: 20px; }
      `}</style>
    </Layout>
  );
};

export default Return;

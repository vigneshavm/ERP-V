import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { motion, AnimatePresence } from "framer-motion";
import {
  getAllSalesInvoices,
  getSalesInvoiceSummary,
  deleteSalesInvoice,
  reset,
} from "@/redux/slices/salesInvoiceSlice";
import Layout from "@/components/shared/Layout/Layout";
import CustomerSelectionModal from "@/components/shared/Modals/CustomerSelectionModal";
import { AppDispatch, RootState } from "@/redux/store";
import { Customer, Invoice } from "@/types/sales";
import {
  FileText,
  Plus,
  Search,
  Filter,
  Trash2,
  Eye,
  MoreVertical,
  CheckCircle,
  Clock,
  AlertCircle,
  XCircle,
  TrendingUp,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Activity,
  Layers,
  ArrowUpRight,
  Download,
  CreditCard,
  ShieldCheck,
  Zap,
  History,
  Navigation
} from "lucide-react";

const SalesInvoice = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const {
    invoices = [],
    summary = null,
    isLoading,
    isError,
    message,
  } = useSelector((state: RootState) => state.salesInvoice);

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  useEffect(() => {
    dispatch(getAllSalesInvoices());
    dispatch(getSalesInvoiceSummary());
    return () => {
      dispatch(reset());
    };
  }, [dispatch]);

  const handleDelete = async (id: string) => {
    await dispatch(deleteSalesInvoice(id));
    setDeleteConfirm(null);
    dispatch(getAllSalesInvoices());
  };

  const isCustomer = (cust: any): cust is Customer => {
    return cust && typeof cust === 'object' && 'name' in cust;
  };

  const filteredInvoices = useMemo(() => {
    if (!Array.isArray(invoices)) return [];
    return (invoices as Invoice[]).filter((invoice) => {
      const customer = invoice.customer;
      const customerName = isCustomer(customer) ? customer.name : '';
      const matchesSearch =
        invoice.invoiceNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customerName.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus =
        statusFilter === "all" || invoice.paymentStatus === statusFilter;
      const matchesCustomer =
        !selectedCustomer || (isCustomer(customer) && customer._id === selectedCustomer._id);
      return matchesSearch && matchesStatus && matchesCustomer;
    });
  }, [invoices, searchTerm, statusFilter, selectedCustomer]);

  const totalPages = Math.ceil(filteredInvoices.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedInvoices = filteredInvoices.slice(startIndex, startIndex + itemsPerPage);

  const getStatusConfig = (status: string) => {
    switch (status) {
      case "paid": return { color: "text-emerald-500", bg: "bg-emerald-500/10", border: "border-emerald-500/20", icon: CheckCircle, text: "Settled" };
      case "partial": return { color: "text-amber-500", bg: "bg-amber-500/10", border: "border-amber-500/20", icon: Clock, text: "Fragmented" };
      case "unpaid": return { color: "text-rose-500", bg: "bg-rose-500/10", border: "border-rose-500/20", icon: AlertCircle, text: "Pending" };
      default: return { color: "text-neutral-500", bg: "bg-neutral-500/10", border: "border-neutral-500/20", icon: Layers, text: "Archived" };
    }
  };

  const MetricPanel = ({ title, value, subtext, icon: Icon, colorClass, gradient }: any) => (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="glass-panel p-8 border border-white/5 relative overflow-hidden group hover:scale-[1.02] transition-all duration-500"
    >
      <div className={`absolute top-0 right-0 w-32 h-32 ${gradient} opacity-10 rounded-full blur-[50px] -mr-12 -mt-12 group-hover:scale-150 transition-transform duration-700`}></div>
      <div className="flex justify-between items-start relative z-10">
        <div className="space-y-4">
          <div className="text-[10px] font-black text-secondary uppercase tracking-[0.4em] opacity-40 group-hover:opacity-100 transition-opacity">{title}</div>
          <div className="space-y-1">
            <h3 className="text-3xl font-display font-black text-main tracking-tighter">{value}</h3>
            <p className={`text-[10px] font-black ${colorClass} uppercase tracking-widest`}>{subtext}</p>
          </div>
        </div>
        <div className={`w-14 h-14 rounded-2xl ${colorClass.replace('text', 'bg')}/10 border border-white/5 flex items-center justify-center ${colorClass} group-hover:scale-110 transition-transform duration-500 shadow-inner`}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
    </motion.div>
  );

  return (
    <Layout>
      <div className="min-h-screen bg-app p-4 lg:p-8 relative overflow-hidden pb-20">
        {/* Background Accents */}
        <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-primary/5 rounded-full blur-[140px] pointer-events-none -mr-48 -mt-48 opacity-20"></div>
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-emerald-500/5 rounded-full blur-[120px] pointer-events-none -ml-32 -mb-32 opacity-10"></div>

        <div className="max-w-7xl mx-auto relative z-10 space-y-10">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
            <div className="space-y-3">
              <div className="flex items-center gap-3 text-primary font-black text-[10px] uppercase tracking-[0.5em]">
                <ShieldCheck className="w-4 h-4" />
                Capital Protocol: 2036.04
              </div>
              <h1 className="text-5xl md:text-6xl font-display font-black text-main tracking-tighter uppercase leading-none">
                Revenue <span className="text-primary italic">Resolution</span>
              </h1>
              <p className="text-secondary text-base font-medium opacity-60 max-w-xl">Real-time centralized registry for revenue recognition, capital flow manifests, and counterparty settlement protocols.</p>
            </div>

            <button
              onClick={() => navigate('/sales/new')}
              className="px-10 py-5 bg-primary text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.4em] shadow-2xl shadow-primary/40 hover:bg-primary-hover hover:scale-[1.05] active:scale-[0.98] transition-all flex items-center gap-4 group"
            >
              <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform duration-500" />
              Initialize Revenue Manifest
            </button>
          </div>

          {/* Metrics Intelligence */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <MetricPanel 
              title="Manifest Magnitude" 
              value={summary?.totalInvoices || 0} 
              subtext="Verifed Certifications"
              icon={Layers} 
              colorClass="text-primary" 
              gradient="bg-primary"
            />
            <MetricPanel 
              title="Liquid Absorption" 
              value={`₹${(summary?.totalPaid || 0).toLocaleString()}`} 
              subtext="Settled Capital"
              icon={TrendingUp} 
              colorClass="text-emerald-500"
              gradient="bg-emerald-500"
            />
            <MetricPanel 
              title="Exposure Latency" 
              value={`₹${(summary?.outstandingDues || 0).toLocaleString()}`} 
              subtext="Pending Resolution"
              icon={Activity} 
              colorClass="text-rose-500" 
              gradient="bg-rose-500"
            />
          </div>

          {/* Control Hub */}
          <div className="glass-panel p-4 border border-white/5 space-y-4">
             <div className="flex flex-col lg:flex-row items-center gap-6">
                <div className="flex-1 w-full relative group/search">
                  <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-primary/40 group-focus-within/search:text-primary transition-colors" />
                  <input 
                    type="text"
                    placeholder="SCAN REGISTRY FOR MANIFEST HASH OR ENTITY MARKS..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-[1.5rem] pl-16 pr-6 py-5 text-[11px] font-black text-main uppercase tracking-[0.2em] focus:outline-none focus:border-primary/40 focus:ring-4 focus:ring-primary/5 transition-all placeholder:text-secondary/20"
                  />
                </div>
                
                <div className="flex flex-wrap items-center gap-4 w-full lg:w-auto">
                  <select 
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="bg-white/5 border border-white/10 rounded-2xl px-6 py-5 text-[10px] font-black text-secondary uppercase tracking-widest focus:outline-none focus:border-primary/40 appearance-none flex-1 lg:flex-none cursor-pointer min-w-[160px]"
                  >
                    <option value="all" className="bg-neutral-900">All Status Flags</option>
                    <option value="paid" className="bg-neutral-900">Settled Only</option>
                    <option value="partial" className="bg-neutral-900">Fragmented</option>
                    <option value="unpaid" className="bg-neutral-900">Pending Only</option>
                  </select>

                  <button 
                    onClick={() => setShowCustomerModal(true)}
                    className={`px-6 py-5 rounded-2xl border transition-all flex items-center gap-3 text-[10px] font-black uppercase tracking-widest flex-1 lg:flex-none justify-center ${
                      selectedCustomer 
                      ? 'bg-primary/10 border-primary/40 text-primary' 
                      : 'bg-white/5 border-white/10 text-secondary hover:bg-white/10 hover:border-white/20'
                    }`}
                  >
                    {selectedCustomer ? (
                        <>
                            <Zap className="w-4 h-4 fill-primary" />
                            {selectedCustomer.name}
                            <XCircle onClick={(e) => { e.stopPropagation(); setSelectedCustomer(null); }} className="w-4 h-4 ml-1 cursor-pointer hover:text-rose-500" />
                        </>
                    ) : (
                        <>
                            <Filter className="w-4 h-4" />
                            Entity Filter
                        </>
                    )}
                  </button>

                  <div className="w-px h-10 bg-white/5 mx-2 hidden lg:block"></div>

                  <button className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-secondary hover:text-primary hover:border-primary/40 transition-all group shadow-inner">
                    <Download className="w-5 h-5 group-active:scale-90 transition-transform" />
                  </button>
                </div>
             </div>
          </div>

          {/* Registry Latticework */}
          <div className="glass-panel border border-white/5 overflow-hidden shadow-2xl">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-40 space-y-6">
                <div className="w-16 h-16 border-4 border-primary/10 border-t-primary rounded-full animate-spin shadow-2xl shadow-primary/20"></div>
                <div className="text-center space-y-2">
                    <p className="text-[10px] font-black text-secondary uppercase tracking-[0.5em] animate-pulse">Syncing Lattice registry...</p>
                    <p className="text-[8px] font-bold text-primary/40 uppercase tracking-widest">Protocol 2036.04 Secure Link</p>
                </div>
              </div>
            ) : filteredInvoices.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-48 text-center space-y-8">
                <div className="relative">
                    <div className="absolute inset-0 bg-primary/20 blur-[60px] rounded-full"></div>
                    <div className="w-24 h-24 bg-white/5 border border-white/5 rounded-[2.5rem] flex items-center justify-center relative z-10">
                        <FileText className="w-12 h-12 text-primary opacity-20" />
                    </div>
                </div>
                <div className="space-y-2">
                  <h3 className="text-2xl font-display font-black text-main uppercase tracking-tight">Registry Void Detected</h3>
                  <p className="text-secondary text-sm font-medium opacity-40 max-w-xs mx-auto leading-relaxed italic">No operational manifests match the current control parameters in the synchronized lattice.</p>
                </div>
                <button 
                  onClick={() => { setSearchTerm(''); setStatusFilter('all'); setSelectedCustomer(null); }}
                  className="px-8 py-3 bg-white/5 border border-white/10 hover:border-primary/40 rounded-xl text-[10px] font-black text-secondary uppercase tracking-widest transition-all hover:text-primary"
                >
                  Reset Parameters
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto custom-scrollbar">
                <table className="w-full text-left border-separate border-spacing-0">
                  <thead>
                    <tr className="bg-white/5 border-b border-white/5">
                      <th className="px-8 py-6 text-[9px] font-black text-secondary uppercase tracking-[0.4em] opacity-40">Protocol Index</th>
                      <th className="px-8 py-6 text-[9px] font-black text-secondary uppercase tracking-[0.4em] opacity-40">Temporal Marker</th>
                      <th className="px-8 py-6 text-[9px] font-black text-secondary uppercase tracking-[0.4em] opacity-40">Commercial Entity</th>
                      <th className="px-8 py-6 text-[9px] font-black text-secondary uppercase tracking-[0.4em] opacity-40 text-right">Value Magnitude</th>
                      <th className="px-8 py-6 text-[9px] font-black text-secondary uppercase tracking-[0.4em] opacity-40 text-center">Status Flag</th>
                      <th className="px-8 py-6 text-[9px] font-black text-secondary uppercase tracking-[0.4em] opacity-40 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    <AnimatePresence mode="popLayout">
                      {paginatedInvoices.map((invoice, idx) => {
                        const status = getStatusConfig(invoice.paymentStatus);
                        const StatusIcon = status.icon;
                        return (
                          <motion.tr 
                            layout
                            key={invoice._id}
                            initial={{ opacity: 0, x: -20, scale: 0.99 }}
                            animate={{ opacity: 1, x: 0, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.98 }}
                            transition={{ delay: idx * 0.05 }}
                            className="group hover:bg-white/[0.02] transition-colors cursor-default"
                          >
                            <td className="px-8 py-6">
                              <span 
                                onClick={() => navigate(`/sales/invoice/${invoice._id}`)}
                                className="text-sm font-display font-black text-primary tracking-tighter cursor-pointer hover:text-primary-hover uppercase flex items-center gap-2 group/id transition-colors"
                              >
                                {invoice.invoiceNo}
                                <ArrowUpRight className="w-3 h-3 opacity-0 group-hover/id:opacity-100 group-hover/id:translate-x-0.5 group-hover/id:-translate-y-0.5 transition-all text-primary/40" />
                              </span>
                            </td>
                            <td className="px-8 py-6">
                              <div className="text-[11px] font-bold text-main uppercase tracking-tight">{new Date(invoice.createdAt).toLocaleDateString("en-US", { day: '2-digit', month: 'short', year: 'numeric' })}</div>
                              <div className="text-[9px] font-black text-secondary/30 uppercase tracking-[0.1em] mt-1">{new Date(invoice.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                            </td>
                            <td className="px-8 py-6">
                              <div className="text-[11px] font-black text-main uppercase tracking-widest leading-none">
                                {isCustomer(invoice.customer) ? invoice.customer.name : "Walk-in Prototype"}
                              </div>
                              {isCustomer(invoice.customer) && invoice.customer.phone && (
                                <div className="text-[9px] font-bold text-secondary/40 uppercase mt-1.5 flex items-center gap-2 italic">
                                    <Activity className="w-2.5 h-2.5 text-emerald-500/40" />
                                    {invoice.customer.phone}
                                </div>
                              )}
                            </td>
                            <td className="px-8 py-6 text-right">
                              <div className="font-display font-black text-main tracking-tighter text-xl tabular-nums">₹{invoice.totalAmount.toLocaleString()}</div>
                              <div className={`text-[8px] font-black uppercase tracking-[0.2em] mt-1 ${invoice.paidAmount >= invoice.totalAmount ? 'text-emerald-500' : 'text-rose-500/60'}`}>Settled: ₹{invoice.paidAmount.toLocaleString()}</div>
                            </td>
                            <td className="px-8 py-6">
                              <div className="flex justify-center">
                                <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border ${status.bg} ${status.border} ${status.color} shadow-sm group-hover:scale-105 transition-transform`}>
                                  <StatusIcon className="w-3 h-3" />
                                  <span className="text-[8px] font-black uppercase tracking-[0.2em] leading-none">{status.text}</span>
                                </div>
                              </div>
                            </td>
                            <td className="px-8 py-6 text-right">
                              <div className="flex justify-end gap-3 opacity-0 group-hover:opacity-100 transition-all scale-95 group-hover:scale-100">
                                <button 
                                  onClick={() => navigate(`/sales/invoice/${invoice._id}`)}
                                  className="w-10 h-10 rounded-xl bg-white/5 border border-white/5 hover:border-primary/40 flex items-center justify-center transition-all group/view"
                                >
                                  <Eye className="w-4 h-4 text-secondary group-hover/view:text-primary transition-colors" />
                                </button>
                                <button 
                                  onClick={() => setDeleteConfirm(invoice._id || null)}
                                  className="w-10 h-10 rounded-xl bg-white/5 border border-white/5 hover:border-rose-500/40 flex items-center justify-center transition-all group/del"
                                >
                                  <Trash2 className="w-4 h-4 text-secondary group-hover/del:text-rose-500 transition-colors" />
                                </button>
                              </div>
                            </td>
                          </motion.tr>
                        );
                      })}
                    </AnimatePresence>
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination Logistics */}
            {totalPages > 1 && (
              <div className="px-8 py-6 border-t border-white/5 bg-white/[0.01] flex items-center justify-between">
                <div className="flex items-center gap-4 text-[9px] font-black text-secondary uppercase tracking-[0.2em]">
                  <span className="opacity-40">Registry Scope:</span>
                  <div className="flex items-center gap-1.5">
                    <span className="text-main">{startIndex + 1}</span>
                    <span className="text-main/20">—</span>
                    <span className="text-main">{Math.min(startIndex + itemsPerPage, filteredInvoices.length)}</span>
                    <span className="text-main/20">/</span>
                    <span className="text-main">{filteredInvoices.length}</span>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <button 
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="w-12 h-12 border border-white/10 rounded-2xl flex items-center justify-center disabled:opacity-20 hover:bg-white/10 transition-all text-secondary"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <div className="px-4 py-2 bg-white/5 rounded-xl border border-white/5 text-[10px] font-black text-main uppercase tracking-widest min-w-[100px] text-center italic">
                    Sector {currentPage} <span className="text-primary/40 mx-1">|</span> {totalPages}
                  </div>
                  <button 
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="w-12 h-12 border border-white/10 rounded-2xl flex items-center justify-center disabled:opacity-20 hover:bg-white/10 transition-all text-secondary"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Delete Confirmation Protocol */}
        <AnimatePresence>
          {deleteConfirm && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
               <motion.div 
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }} 
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-black/80 backdrop-blur-xl"
                onClick={() => setDeleteConfirm(null)}
              />
              <motion.div 
                initial={{ opacity: 0, scale: 0.9, y: 30 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 30 }}
                className="relative z-[110] bg-neutral-900 border border-white/10 rounded-[2.5rem] p-10 max-w-sm w-full text-center space-y-8 shadow-2xl shadow-rose-900/40"
              >
                <div className="w-20 h-20 bg-rose-500/10 border border-rose-500/20 rounded-full flex items-center justify-center mx-auto text-rose-500 shadow-inner">
                  <AlertTriangle className="w-10 h-10" />
                </div>
                <div className="space-y-3">
                  <h3 className="text-3xl font-display font-black text-main uppercase tracking-tight">registry purge?</h3>
                  <p className="text-secondary text-xs font-medium opacity-60 leading-relaxed italic">This action will permanently retrieve this capital manifest and disrupt the associated lattice linkage.</p>
                </div>
                <div className="flex gap-4">
                  <button 
                    onClick={() => setDeleteConfirm(null)}
                    className="flex-1 py-4 bg-white/5 border border-white/5 rounded-2xl text-[10px] font-black uppercase tracking-widest text-secondary hover:text-main transition-all"
                  >
                    Abort
                  </button>
                  <button 
                    onClick={() => handleDelete(deleteConfirm)}
                    className="flex-1 py-4 bg-rose-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-2xl shadow-rose-600/20 hover:bg-rose-500 hover:scale-[1.05] transition-all"
                  >
                    Confirm Purge
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        <style>{`
          .glass-panel { background: rgba(255, 255, 255, 0.03); backdrop-filter: blur(25px); border-radius: 2.5rem; }
          .font-display { font-family: 'Outfit', sans-serif; }
          .custom-scrollbar::-webkit-scrollbar { height: 4px; width: 4px; }
          .custom-scrollbar::-webkit-scrollbar-track { background: rgba(255, 255, 255, 0.01); }
          .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(var(--color-primary-rgb), 0.2); border-radius: 20px; }
          select option { background-color: #0c0a09; color: white; padding: 20px; }
        `}</style>

        <CustomerSelectionModal
          isOpen={showCustomerModal}
          onClose={() => setShowCustomerModal(false)}
          onSelect={(customer: any) => {
            setSelectedCustomer(customer);
            setShowCustomerModal(false);
          }}
        />
      </div>
    </Layout>
  );
};

export default SalesInvoice;

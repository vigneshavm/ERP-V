import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Layout from "@/shared/ui/Layout/Layout";
import PageShell from "@/shared/ui/Layout/PageShell";
import api from "@/shared/api/api";
import { toast } from "react-toastify";
import EstimateTemplate from "@/features/pos-checkout/ui/EstimateTemplate";
import { 
    ArrowLeft, 
    Printer, 
    FileText, 
    Calculator,
    ChevronRight,
    Sparkles,
    ShieldCheck,
    Calendar,
    User
} from 'lucide-react';

const EstimateDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [estimate, setEstimate] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchEstimate();
  }, [id]);

  const fetchEstimate = async () => {
    try {
      const user = JSON.parse(localStorage.getItem("user") || '{}');
      const response = await api.get(
        `/estimates/${id}`,
        {
          headers: { Authorization: `Bearer ${user.token}` },
        }
      );
      setEstimate(response.data.data);
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to fetch estimate");
      navigate("/sales/estimates");
    } finally {
      setIsLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (isLoading || !estimate) {
    return (
      <Layout>
        <PageShell className="flex flex-col items-center justify-center py-40">
            <div className="relative">
                <div className="w-16 h-16 rounded-full border-4 border-indigo-500/20 border-t-indigo-500 animate-spin" />
                <Calculator className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-6 h-6 text-indigo-500 animate-pulse" />
            </div>
            <p className="mt-6 text-sm font-black uppercase tracking-widest text-neutral-400 animate-pulse">Reconstructing Proposal Matrix...</p>
        </PageShell>
      </Layout>
    );
  }

  return (
    <Layout>
      <PageShell className="bg-app flex-1 flex flex-col min-h-0 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-700 max-w-5xl mx-auto w-full">
        {/* Immersive Header - Hidden on print */}
        <div className="erp-card rounded-[3rem] p-10 bg-neutral-900 text-white shadow-2xl relative overflow-hidden print:hidden group">
            <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none group-hover:scale-110 group-hover:rotate-12 transition-transform duration-1000">
                <FileText className="w-64 h-64" />
            </div>
            
            <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8">
                <div className="flex-1">
                    <div className="flex items-center gap-3 mb-6">
                        <button
                            onClick={() => navigate("/sales/estimates")}
                            className="p-2 bg-white/10 hover:bg-white/20 rounded-xl transition-all"
                        >
                            <ArrowLeft className="w-4 h-4" />
                        </button>
                        <span className="w-1 h-1 rounded-full bg-white/30" />
                        <div className="flex items-center gap-2 px-3 py-1 bg-indigo-500/20 backdrop-blur-md rounded-lg border border-indigo-500/20">
                            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                            <span className="text-[10px] font-black uppercase tracking-widest text-indigo-300">Active Proposal</span>
                        </div>
                    </div>
                    
                    <h1 className="text-5xl font-black tracking-tighter mb-4 flex items-baseline gap-4">
                        {estimate.estimateNo}
                        <span className="text-lg font-bold text-white/50 tracking-normal italic font-serif">Valuation Artifact</span>
                    </h1>
                    
                    <div className="flex flex-wrap items-center gap-6">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center backdrop-blur-md">
                                <User className="w-5 h-5 text-indigo-400" />
                            </div>
                            <div>
                                <p className="text-[9px] font-black text-white/50 uppercase tracking-widest leading-none mb-1">Target Account</p>
                                <p className="text-sm font-black uppercase tracking-tight leading-none text-white">
                                    {(typeof estimate.customer === 'object' && estimate.customer?.name) || 'Walk-in Prospect'}
                                </p>
                            </div>
                        </div>
                        <div className="w-px h-8 bg-white/10 hidden sm:block" />
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center backdrop-blur-md">
                                <Calendar className="w-5 h-5 text-indigo-400" />
                            </div>
                            <div>
                                <p className="text-[9px] font-black text-white/50 uppercase tracking-widest leading-none mb-1">Origin Date</p>
                                <p className="text-sm font-black uppercase tracking-tight leading-none text-white">
                                    {new Date(estimate.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex flex-wrap items-end gap-3 self-end lg:self-center">
                    <button
                        onClick={handlePrint}
                        className="px-8 py-4 bg-indigo-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-2xl shadow-indigo-600/20 hover:scale-105 active:scale-95 transition-all flex items-center gap-3 overflow-hidden"
                    >
                        <Printer className="w-5 h-5" /> 
                        <span>Materialize Copy</span>
                    </button>
                </div>
            </div>
        </div>

        {/* Estimate Card */}
        <div className="erp-card rounded-[3.5rem] p-1 shadow-2xl border-none overflow-hidden bg-white dark:bg-neutral-900 relative group animate-in zoom-in-95 duration-1000 delay-150">
           <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 opacity-20" />
           <div className="p-4 sm:p-8 md:p-12 relative z-10 print:p-0">
                <EstimateTemplate estimate={estimate} />
           </div>
           
           {/* Decorative elements */}
           <div className="absolute -bottom-20 -right-20 w-80 h-80 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none group-hover:bg-indigo-500/10 transition-colors" />
           <div className="absolute -top-20 -left-20 w-80 h-80 bg-purple-500/5 rounded-full blur-3xl pointer-events-none group-hover:bg-purple-500/10 transition-colors" />
        </div>

        {/* Aesthetic Page Footer */}
        <div className="mt-8 flex items-center justify-center gap-6 opacity-30 group print:hidden">
            <div className="h-px w-20 bg-neutral-400 dark:bg-neutral-600" />
            <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4" />
                <span className="text-[9px] font-black uppercase tracking-[0.3em]">Proposal Integrity Verified</span>
            </div>
            <div className="h-px w-20 bg-neutral-400 dark:bg-neutral-600" />
        </div>
      </PageShell>

      {/* Print Styles */}
      <style>{`
        @media print {
          @page { margin: 0; size: auto; }
          body { background: white; -webkit-print-color-adjust: exact; }
          body * { visibility: hidden; }
          .bg-app { background: white !important; }
          .erp-card { border: none !important; box-shadow: none !important; border-radius: 0 !important; }
          
          #root, .page-shell, .erp-card, .erp-card * {
            visibility: visible;
          }
          
          .page-shell {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            padding: 0 !important;
            margin: 0 !important;
            display: block !important;
          }
          
          .print\\:hidden {
            display: none !important;
          }
          
          .animate-in { animation: none !important; }
        }
      `}</style>
    </Layout>
  );
};

export default EstimateDetail;

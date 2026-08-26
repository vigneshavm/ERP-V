import { useEffect, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import api from "../../../services/api";
import { toast } from "react-toastify";
import EstimateTemplate from "@/components/sales/EstimateTemplate";
import { 
    ArrowLeft, 
    Printer, 
    FileText, 
    ShieldCheck, 
    Zap, 
    Download, 
    Share2, 
    RefreshCw,
    Calculator,
    Globe,
    CheckCircle2
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
    setIsLoading(true);
    try {
      const user = JSON.parse(localStorage.getItem("user") || '{}');
      const response = await api.get(
        `/api/estimates/${id}`,
        {
          headers: { Authorization: `Bearer ${user.token}` },
        }
      );
      setEstimate(response.data);
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
      <div className="h-screen bg-neutral-950 flex flex-col items-center justify-center gap-4">
        <div className="w-12 h-12 border-4 border-warning/20 border-t-amber-500 rounded-full animate-spin"></div>
        <p className="text-[10px] font-black text-warning uppercase tracking-[0.2em] animate-pulse">Syncing Matrix Node...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 text-neutral-900 dark:text-white font-sans selection:bg-amber-500/30 overflow-x-hidden flex flex-col transition-colors animate-fade-in relative">
      {/* Ambient Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-20%] left-[10%] w-[60%] h-[60%] bg-amber-600/10 rounded-full blur-[150px]" />
        <div className="absolute bottom-[-10%] right-[10%] w-[40%] h-[40%] bg-rose-600/10 rounded-full blur-[150px]" />
      </div>

      <main className="relative z-10 flex-1 flex flex-col max-w-[1200px] w-full mx-auto px-8 py-8 space-y-8">
        {/* Modern Header - Hidden on print */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 print:hidden">
          <div className="relative">
            <Link to="/sales/estimates" className="flex items-center gap-2 text-[10px] font-black text-neutral-500 uppercase tracking-widest hover:text-warning transition-colors mb-4 group">
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> Back to Registry
            </Link>
            <div className="absolute -left-4 top-10 bottom-0 w-1 bg-amber-500 rounded-full shadow-[0_0_15px_rgba(245,158,11,0.5)]"></div>
            <h1 className="text-3xl font-display font-black tracking-tighter text-neutral-900 dark:text-white flex items-center gap-3">
              Proforma <span className="text-warning">Matrix View</span>
              <span className="px-3 py-1 bg-warning/10 border border-warning/20 text-warning rounded-lg text-[9px] font-bold uppercase tracking-widest">
                {estimate.estimateNo}
              </span>
            </h1>
            <div className="flex items-center gap-2 mt-1">
              <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <p className="text-[10px] uppercase tracking-[0.2em] font-black text-neutral-500 dark:text-neutral-400">Institutional Audit Pass // Verified Hash</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3 w-full md:w-auto">
            <button className="p-3 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl hover:scale-110 transition-transform shadow-sm group">
              <Share2 className="w-4 h-4 text-neutral-500 group-hover:text-warning" />
            </button>
            <button
              onClick={handlePrint}
              className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-3 bg-neutral-900 dark:bg-white text-white dark:text-black rounded-sm text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-all shadow-lg shadow-black/20"
            >
              <Printer className="w-4 h-4" /> Export to Hardcopy
            </button>
            <button
              onClick={() => navigate(`/sales/estimate/edit/${id}`)}
              className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-3 bg-amber-500 text-white rounded-sm text-[10px] font-black uppercase tracking-widest hover:bg-amber-600 transition-all shadow-lg shadow-amber-500/20"
            >
              <Zap className="w-4 h-4 text-white" /> Modify Protocol
            </button>
          </div>
        </header>

        {/* Status Dashboard */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 print:hidden">
            <div className="bg-white dark:bg-neutral-900 rounded-sm border border-neutral-200 dark:border-neutral-800 p-6 flex items-center gap-5 shadow-sm">
                <div className="w-12 h-12 bg-warning/10 rounded-sm flex items-center justify-center text-warning">
                    <Globe className="w-6 h-6" />
                </div>
                <div>
                    <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest">Protocol Origin</p>
                    <p className="text-sm font-black text-neutral-900 dark:text-white uppercase tracking-tighter mt-0.5">Central Ledger Node</p>
                </div>
            </div>
            <div className="bg-white dark:bg-neutral-900 rounded-sm border border-neutral-200 dark:border-neutral-800 p-6 flex items-center gap-5 shadow-sm">
                <div className="w-12 h-12 bg-success/10 rounded-sm flex items-center justify-center text-success">
                    <ShieldCheck className="w-6 h-6" />
                </div>
                <div>
                    <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest">Validation Status</p>
                    <p className="text-sm font-black text-success uppercase tracking-tighter mt-0.5">Matrix Verified 4.0</p>
                </div>
            </div>
            <div className="bg-white dark:bg-neutral-900 rounded-sm border border-neutral-200 dark:border-neutral-800 p-6 flex items-center gap-5 shadow-sm">
                <div className="w-12 h-12 bg-danger/10 rounded-sm flex items-center justify-center text-danger">
                    <Calculator className="w-6 h-6" />
                </div>
                <div>
                    <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest">Fiscal Yield</p>
                    <p className="text-sm font-black text-neutral-900 dark:text-white font-mono tracking-tighter mt-0.5">₹{estimate.totalAmount?.toLocaleString()}</p>
                </div>
            </div>
        </div>

        {/* Estimate Card */}
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-[40px] shadow-2xl overflow-hidden print:shadow-none print:border-0 print:rounded-none relative mb-20 group">
          <div className="absolute inset-0 bg-gradient-to-br from-amber-500/[0.02] to-rose-500/[0.02] pointer-events-none"></div>
          <div className="p-4 print:p-0">
            <EstimateTemplate estimate={estimate} />
          </div>
          
          {/* Internal Footer Metadata */}
          <div className="p-8 border-t border-neutral-100 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-950/50 flex flex-col md:flex-row justify-between items-center gap-6 print:hidden">
              <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-warning/10 flex items-center justify-center">
                    <CheckCircle2 className="w-5 h-5 text-warning" />
                  </div>
                  <div className="flex flex-col">
                      <span className="text-[10px] font-black text-neutral-900 dark:text-white uppercase tracking-widest">Internal Hash Sequence</span>
                      <span className="text-[9px] font-bold text-neutral-400 uppercase tracking-widest font-mono">EST-VAL-{id?.slice(-8).toUpperCase()} // NODE-SAFE</span>
                  </div>
              </div>
              <div className="text-[10px] font-black text-neutral-400 uppercase tracking-widest flex items-center gap-2">
                  <RefreshCw className="w-3.5 h-3.5 text-warning" /> Sequence Updated: {new Date(estimate.updatedAt).toLocaleTimeString()}
              </div>
          </div>
        </div>
      </main>

      {/* Print Styles */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .print\\:shadow-none,
          .print\\:shadow-none * {
            visibility: visible;
          }
          .print\\:shadow-none {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            border: none !important;
            background: white !important;
          }
          .print\\:hidden {
            display: none !important;
          }
          /* Dark mode print adjustment */
          @media (prefers-color-scheme: dark) {
            .print\\:shadow-none {
              color: black !important;
              background: white !important;
            }
          }
        }
      `}</style>
    </div>
  );
};

export default EstimateDetail;


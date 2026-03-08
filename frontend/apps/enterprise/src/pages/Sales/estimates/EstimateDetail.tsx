import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import Layout from "../../../components/shared/Layout/Layout";
import api from "../../../services/api";
import { toast } from "react-toastify";
import EstimateTemplate from "@/components/sales/EstimateTemplate";
import { 
  ArrowLeft, 
  Printer, 
  FileText, 
  ShieldCheck, 
  History, 
  ChevronLeft,
  Share2,
  Download,
  Zap,
  Activity,
  Award,
  Globe,
  Settings,
  Terminal,
  ChevronRight
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
        `/api/estimates/${id}`,
        {
          headers: { Authorization: `Bearer ${user.token}` },
        }
      );
      setEstimate(response.data);
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Protocol decryption failure");
      navigate("/sales/estimates");
    } finally {
      setIsLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const GlassPanel = ({ children, className = "" }: any) => (
    <div className={`glass-panel border border-white/5 shadow-2xl overflow-hidden ${className}`}>
      {children}
    </div>
  );

  if (isLoading || !estimate) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center py-64 space-y-8">
            <div className="relative">
                <div className="w-20 h-20 border-2 border-indigo-500/20 rounded-full"></div>
                <div className="absolute top-0 left-0 w-20 h-20 border-t-2 border-indigo-500 rounded-full animate-spin"></div>
                <Zap className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 text-indigo-500 animate-pulse" />
            </div>
            <div className="space-y-2 text-center">
                <p className="text-[10px] font-black text-secondary uppercase tracking-[0.5em] animate-pulse">Decrypting Resolution Manifest</p>
                <p className="text-[8px] font-bold text-white/20 uppercase tracking-widest">Secure Lattice Encryption: AES-4096</p>
            </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen bg-app p-4 lg:p-8 relative overflow-hidden pb-32">
        {/* Background High-Fidelity Accents */}
        <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-indigo-500/5 rounded-full blur-[160px] pointer-events-none -mr-48 -mt-48 opacity-40"></div>
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-emerald-500/5 rounded-full blur-[140px] pointer-events-none -ml-32 -mb-32 opacity-20"></div>

        <div className="max-w-5xl mx-auto relative z-10 space-y-10">
          {/* Master Tactical Header */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 print:hidden">
            <div className="space-y-6">
              <button
                onClick={() => navigate("/sales/estimates")}
                className="flex items-center gap-3 text-[10px] font-black text-secondary uppercase tracking-[0.4em] hover:text-indigo-500 transition-all group"
              >
                <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center group-hover:border-indigo-500/40 group-hover:bg-indigo-500/10 transition-all">
                    <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                </div>
                Synthesis Registry
              </button>
              
              <div className="space-y-3">
                <div className="flex items-center gap-4 text-indigo-500 font-black text-[10px] uppercase tracking-[0.5em]">
                  <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></div>
                  Resolution ID: {estimate.estimateNo}
                </div>
                <h1 className="text-5xl md:text-6xl font-display font-black text-main tracking-tighter uppercase leading-[0.9]">
                  Projection <br /> <span className="text-secondary italic">Manifest</span>
                </h1>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <button 
                onClick={() => toast.info("Resolution Shared via Encrypted Thread")}
                className="p-5 bg-white/5 border border-white/10 rounded-2xl text-secondary hover:text-indigo-500 hover:border-indigo-500/30 transition-all group shadow-xl"
              >
                <Share2 className="w-5 h-5 group-hover:scale-110 transition-transform" />
              </button>
              <button 
                onClick={handlePrint}
                className="group px-10 py-5 bg-indigo-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.4em] shadow-2xl shadow-indigo-900/40 hover:bg-indigo-500 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-4 overflow-hidden relative"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                <Printer className="w-5 h-5" />
                Capture Schema
              </button>
            </div>
          </div>

          {/* Operational Pulse Markers */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 print:hidden">
            {[
              { label: 'Lifecycle State', value: estimate.status?.toUpperCase() || 'PROJECTION', icon: Zap, color: 'indigo' },
              { label: 'Asset Magnitude', value: `${estimate.items?.length || 0} COMPONENTS`, icon: FileText, color: 'slate' },
              { label: 'Network Integrity', value: 'SYNCHRONIZED', icon: ShieldCheck, color: 'emerald' },
              { label: 'Projection Latency', value: '0.24ms', icon: Activity, color: 'indigo' }
            ].map((marker, idx) => (
              <GlassPanel key={idx} className="p-6 border border-white/5 relative group">
                <div className={`absolute top-0 left-0 w-1 h-0 group-hover:h-full bg-${marker.color}-500/40 transition-all`}></div>
                <div className="text-[9px] font-black text-secondary/40 uppercase tracking-[0.3em] mb-3 flex items-center gap-3">
                  <marker.icon className={`w-3.5 h-3.5 text-${marker.color}-500/60`} />
                  {marker.label}
                </div>
                <div className="text-xs font-black text-main uppercase tracking-widest tabular-nums">{marker.value}</div>
              </GlassPanel>
            ))}
          </div>

          {/* Master Manifest Container */}
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative print:m-0"
          >
            {/* Aesthetic Borders for Web View */}
            <div className="absolute -inset-1 bg-gradient-to-br from-indigo-500/20 via-transparent to-emerald-500/10 rounded-[3.5rem] blur-2xl opacity-20 pointer-events-none print:hidden"></div>
            <div className="relative shadow-[0_0_100px_rgba(0,0,0,0.5)] rounded-[3rem] overflow-hidden border border-white/5 print:rounded-none print:border-0 print:shadow-none">
                <EstimateTemplate estimate={estimate} />
            </div>
          </motion.div>
          
          {/* Action Synthesis Hub - Footer */}
          <div className="flex flex-col md:flex-row justify-center items-center gap-6 print:hidden">
             <button 
                onClick={() => navigate(`/sales/estimate/edit/${id}`)}
                className="group px-12 py-6 glass-panel border border-white/10 text-secondary font-black text-[10px] uppercase tracking-[0.4em] hover:text-indigo-500 hover:border-indigo-500/30 transition-all flex items-center gap-4 relative overflow-hidden"
              >
                <div className="absolute inset-0 bg-indigo-500/5 translate-y-full group-hover:translate-y-0 transition-transform"></div>
                <Settings className="w-5 h-5 group-hover:rotate-90 transition-transform" />
                Recalibrate Projection
             </button>
             
             <div className="flex items-center gap-4 text-secondary/20 font-black text-[10px] uppercase tracking-widest cursor-default">
                <div className="w-8 h-px bg-white/10"></div>
                Lattice Thread Secured
                <div className="w-8 h-px bg-white/10"></div>
             </div>

             <button 
                className="group px-12 py-6 glass-panel border border-white/10 text-emerald-500 font-black text-[10px] uppercase tracking-[0.4em] hover:bg-emerald-500/10 hover:border-emerald-500/30 transition-all flex items-center gap-4 relative overflow-hidden"
              >
                <div className="absolute inset-0 bg-emerald-500/5 translate-y-full group-hover:translate-y-0 transition-transform"></div>
                <Award className="w-5 h-5" />
                Authorize Resolution
             </button>
          </div>
        </div>
      </div>

      <style>{`
        @media print {
          body * { visibility: hidden; }
          .rounded-\\[3rem\\], .rounded-\\[3rem\\] * { visibility: visible; }
          .rounded-\\[3rem\\] { 
            position: absolute; 
            left: 0; 
            top: 0; 
            width: 100% !important; 
            max-width: none !important;
            border: none !important; 
            box-shadow: none !important; 
            transform: none !important;
            margin: 0 !important;
            padding: 0 !important;
          }
          .print\\:hidden { display: none !important; }
        }
        .glass-panel { background: rgba(255, 255, 255, 0.03); backdrop-filter: blur(25px); border-radius: 2rem; }
        .font-display { font-family: 'Outfit', sans-serif; }
      `}</style>
    </Layout>
  );
};

export default EstimateDetail;

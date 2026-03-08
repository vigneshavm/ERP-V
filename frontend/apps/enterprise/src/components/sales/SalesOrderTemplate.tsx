import React from 'react';
import { motion } from 'framer-motion';
import { 
  LucideIcon, 
  ShieldCheck, 
  Activity, 
  Zap, 
  Printer, 
  ArrowUpRight 
} from 'lucide-react';

interface SalesOrderTemplateProps {
  orderNumber: string;
  orderDate: string;
  status: {
    text: string;
    icon: LucideIcon;
    color: string;
    bg: string;
    border: string;
  };
  totalAmount: number;
  customer: {
    name: string;
    initials: string;
    details: Array<{ icon: LucideIcon; label: string }>;
  };
  summaryMetrics: Array<{
    label: string;
    value: string | number;
    subtext?: string;
    icon?: LucideIcon;
    colorClass?: string;
  }>;
  children: React.ReactNode;
  actions?: React.ReactNode;
  onBack?: () => void;
  backLabel?: string;
}

const SalesOrderTemplate: React.FC<SalesOrderTemplateProps> = ({
  orderNumber,
  orderDate,
  status,
  totalAmount,
  customer,
  summaryMetrics,
  children,
  actions,
  onBack,
  backLabel = "Return to Registry"
}) => {
  return (
    <div className="min-h-screen bg-app p-4 lg:p-8 relative overflow-hidden pb-32">
      {/* Abstract Background Accents */}
      <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-primary/5 rounded-full blur-[160px] pointer-events-none -mr-48 -mt-48 opacity-30"></div>
      <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-indigo-500/5 rounded-full blur-[140px] pointer-events-none -ml-32 -mb-32 opacity-20"></div>

      <div className="max-w-6xl mx-auto relative z-10 space-y-8">
        {/* Navigation & Actions Toolbar */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row md:items-center justify-between gap-6 print:hidden"
        >
          {onBack && (
            <button 
              onClick={onBack}
              className="flex items-center gap-3 text-[10px] font-black text-secondary uppercase tracking-[0.4em] hover:text-primary transition-all group"
            >
              <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                <ArrowUpRight className="w-4 h-4 rotate-[225deg] group-hover:rotate-[270deg] transition-transform" />
              </div>
              {backLabel}
            </button>
          )}

          <div className="flex items-center gap-4">
            <button 
              onClick={() => window.print()} 
              className="w-12 h-12 glass-panel border border-white/10 hover:border-primary/40 transition-all text-secondary hover:text-primary flex items-center justify-center shadow-xl"
            >
              <Printer className="w-5 h-5" />
            </button>
            {actions}
          </div>
        </motion.div>

        {/* Master Identity Header */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="glass-panel p-10 lg:p-14 border border-white/10 relative overflow-hidden shadow-2xl"
        >
          <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none group">
            <status.icon className="w-72 h-72 translate-x-12 -translate-y-12" />
          </div>
          
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-10 relative z-10">
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <div className={`flex items-center gap-2.5 px-4 py-1.5 rounded-full border ${status.bg} ${status.border} ${status.color} shadow-sm`}>
                  <status.icon className="w-4 h-4" />
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] leading-none">{status.text}</span>
                </div>
                <div className="h-px w-8 bg-white/10"></div>
                <div className="text-[9px] font-black text-primary/40 uppercase tracking-[0.4em]">Protocol: Resolution Manifest</div>
              </div>
              
              <div className="space-y-2">
                <h1 className="text-5xl md:text-7xl font-display font-black text-main tracking-tighter uppercase leading-none">
                  {orderNumber}
                </h1>
                <p className="text-secondary text-base font-medium opacity-60 flex items-center gap-3 italic">
                  <span className="text-primary/60">Established:</span> {orderDate}
                  <span className="w-1.5 h-1.5 rounded-full bg-white/10"></span>
                  Lattice Synchronized
                </p>
              </div>
            </div>

            <div className="flex flex-col items-end text-right space-y-2">
                <div className="text-[10px] font-black text-secondary uppercase tracking-[0.5em] opacity-40">Manifest Net Magnitude</div>
                <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-black text-primary mb-1">₹</span>
                    <span className="text-5xl md:text-6xl font-display font-black text-main tracking-tighter leading-none tabular-nums">
                        {totalAmount.toLocaleString()}
                    </span>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 bg-emerald-500/5 rounded-xl border border-emerald-500/10 text-emerald-500">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span className="text-[9px] font-black uppercase tracking-widest">Capital Secured</span>
                </div>
            </div>
          </div>
        </motion.div>

        {/* Global Overview Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {summaryMetrics.map((metric, idx) => (
                <motion.div 
                    key={idx}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 * idx }}
                    className="glass-panel p-8 border border-white/5 relative overflow-hidden group hover:scale-[1.02] transition-all"
                >
                    <div className="flex justify-between items-start relative z-10">
                        <div className="space-y-4">
                            <div className="text-[10px] font-black text-secondary uppercase tracking-[0.4em] opacity-40 group-hover:opacity-100 transition-opacity">{metric.label}</div>
                            <div className="space-y-1">
                                <h3 className="text-3xl font-display font-black text-main tracking-tighter">{metric.value}</h3>
                                {metric.subtext && <p className="text-[9px] font-black text-primary uppercase tracking-widest opacity-60 italic">{metric.subtext}</p>}
                            </div>
                        </div>
                        {metric.icon && (
                            <div className={`w-14 h-14 rounded-2xl ${metric.colorClass || 'text-primary bg-primary/10'} border border-white/5 flex items-center justify-center transition-transform group-hover:scale-110 shadow-inner`}>
                                <metric.icon className="w-6 h-6" />
                            </div>
                        )}
                    </div>
                </motion.div>
            ))}
        </div>

        {/* Layout Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Primary Analysis Partition */}
            <div className="lg:col-span-8 space-y-8">
                {/* Entity Context Card */}
                <motion.div 
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="glass-panel p-10 border border-white/5 relative overflow-hidden"
                >
                    <div className="flex flex-col md:flex-row gap-10 items-start">
                        <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-primary to-indigo-600 flex items-center justify-center text-white text-4xl font-black shadow-2xl font-display uppercase italic relative group shrink-0">
                            <div className="absolute inset-0 bg-white/20 blur-[20px] rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></div>
                            {customer.initials}
                        </div>
                        <div className="space-y-8 flex-1">
                            <div>
                                <h2 className="text-3xl font-display font-black text-main uppercase tracking-tight leading-none">{customer.name}</h2>
                                <div className="text-[10px] font-black text-primary uppercase tracking-[0.4em] mt-3 flex items-center gap-2">
                                    <Activity className="w-3 h-3" />
                                    Identity Profile: Commercial Counterparty
                                </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-white/5">
                                {customer.details.map((detail, idx) => (
                                    <div key={idx} className="flex items-center gap-4 text-secondary group">
                                        <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center group-hover:bg-primary/10 transition-colors border border-white/5">
                                            <detail.icon className="w-4 h-4 text-primary/60 group-hover:text-primary transition-colors" />
                                        </div>
                                        <span className="text-xs font-black font-mono tracking-tight group-hover:text-main transition-colors">{detail.label}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* Sub-component Container (usually items table) */}
                {children}
            </div>

            {/* Sidebar intelligence */}
            <div className="lg:col-span-4 space-y-8 print:hidden">
                <div className="sticky top-8 space-y-8">
                    {/* Resolution Logic (Sidebar) */}
                    {/* (This will be filled by children if needed, but standardizing summary metrics here too) */}
                    <div className="glass-panel p-2 border border-white/5 bg-primary/5">
                        <div className="p-8 space-y-6">
                            <div className="flex items-center gap-3 text-primary font-black text-[10px] uppercase tracking-[0.4em]">
                                <Zap className="w-4 h-4" />
                                System Integrity Check
                            </div>
                            <div className="space-y-3">
                                <p className="text-[10px] text-secondary/60 font-medium leading-relaxed italic uppercase">
                                    Verification thread completed. Resolution Manifest is synchronized with the global capital registry. Fulfillment protocol is authorized.
                                </p>
                                <div className="flex items-center gap-2 text-emerald-500 text-[9px] font-black uppercase tracking-widest">
                                    <ShieldCheck className="w-3.5 h-3.5" />
                                    Lattice Hash: {Math.random().toString(36).substring(7).toUpperCase()}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
      </div>

      <style>{`
        .glass-panel { background: rgba(255, 255, 255, 0.03); backdrop-filter: blur(25px); border-radius: 2.5rem; }
        .font-display { font-family: 'Outfit', sans-serif; }
        @media print {
            .print\\:hidden { display: none !important; }
        }
      `}</style>
    </div>
  );
};

export default SalesOrderTemplate;

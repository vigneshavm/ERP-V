import React from 'react';
import { motion } from 'framer-motion';
import { 
  Calculator, 
  User, 
  Phone, 
  Mail, 
  MapPin, 
  Calendar, 
  FileText, 
  ShieldCheck,
  Zap,
  Package,
  ArrowRight,
  TrendingUp,
  Activity,
  Award
} from 'lucide-react';

interface EstimateTemplateProps {
    estimate: {
        estimateNo: string;
        createdAt: Date | string;
        customer: any;
        items: any[];
        subtotal: number;
        discount: number;
        totalAmount: number;
        notes: string;
        status: string;
    };
}

const EstimateTemplate: React.FC<EstimateTemplateProps> = ({ estimate }) => {
    return (
        <div className="bg-[#050505] p-16 max-w-5xl mx-auto shadow-2xl relative overflow-hidden font-sans text-white/90 min-h-[1100px] flex flex-col justify-between border border-white/10 rounded-[3rem]">
            {/* Background High-Fidelity Accents */}
            <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-indigo-500/5 rounded-full blur-[160px] pointer-events-none -mr-48 -mt-48 opacity-40"></div>
            <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-primary/5 rounded-full blur-[140px] pointer-events-none -ml-32 -mb-32 opacity-20"></div>

            <div className="relative z-10">
                {/* Master Identity Header */}
                <div className="flex justify-between items-start mb-20">
                    <div className="space-y-8">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-indigo-500/10 rounded-2xl flex items-center justify-center border border-indigo-500/30 group">
                                <ShieldCheck className="w-6 h-6 text-indigo-400 group-hover:scale-110 transition-transform" />
                            </div>
                            <div className="space-y-1">
                                <div className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.5em] leading-none">Protocol Authorization</div>
                                <div className="text-[9px] font-bold text-white/40 uppercase tracking-widest">Lattice Verified ID: {estimate._id?.substring(0, 12).toUpperCase() || 'SYN-TRACE-03'}</div>
                            </div>
                        </div>
                        
                        <div className="relative">
                            <h1 className="text-7xl font-display font-black tracking-tighter uppercase leading-[0.85] text-white">
                                Capital <br />
                                <span className="text-indigo-500 italic">Projection</span>
                            </h1>
                            <div className="absolute -left-6 top-0 bottom-0 w-1 bg-gradient-to-b from-indigo-500 to-transparent"></div>
                        </div>

                        <div className="inline-flex items-center gap-3 px-6 py-2 bg-white/5 border border-white/10 rounded-full">
                            <FileText className="w-3.5 h-3.5 text-indigo-400" />
                            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-white/60">Manifest # {estimate.estimateNo}</span>
                        </div>
                    </div>
                    
                    <div className="text-right space-y-10">
                        <div className="relative inline-block">
                            <div className="absolute inset-0 bg-indigo-500/20 blur-[40px] rounded-full scale-150"></div>
                            <div className="w-28 h-28 bg-[#0a0a0a] border border-white/10 rounded-[2.5rem] flex items-center justify-center text-indigo-500 font-black text-4xl shadow-2xl relative z-10 font-display italic">
                                EV
                            </div>
                        </div>
                        
                        <div className="space-y-2">
                            <div className="text-[10px] font-black text-white/20 uppercase tracking-[0.5em]">Temporal Nexus</div>
                            <div className="text-lg font-black text-white uppercase tracking-tighter tabular-nums">
                                {new Date(estimate.createdAt).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase()}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-24 mb-24">
                    {/* Counterparty Analysis */}
                    <div className="space-y-8 relative">
                         <div className="flex items-center gap-3 text-indigo-400 font-black text-[11px] uppercase tracking-[0.4em]">
                            <User className="w-4 h-4" />
                            Counterparty Domain
                        </div>
                        {estimate.customer ? (
                            <div className="space-y-6">
                                <div className="space-y-2">
                                    <p className="text-3xl font-display font-black text-white uppercase tracking-tight leading-none">{estimate.customer.name}</p>
                                    <div className="flex items-center gap-2">
                                        <Activity className="w-3 h-3 text-emerald-500 animate-pulse" />
                                        <span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest">Commercial Link Secure</span>
                                    </div>
                                </div>
                                
                                <div className="grid grid-cols-1 gap-4">
                                    <div className="flex items-center gap-4 text-white/60 group">
                                        <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center group-hover:bg-indigo-500/10 transition-colors">
                                            <Phone className="w-4 h-4 text-indigo-400/60" />
                                        </div>
                                        <span className="text-xs font-bold tracking-widest group-hover:text-white transition-colors uppercase">{estimate.customer.phone}</span>
                                    </div>
                                    {estimate.customer.email && (
                                        <div className="flex items-center gap-4 text-white/60 group">
                                            <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center group-hover:bg-indigo-500/10 transition-colors">
                                                <Mail className="w-4 h-4 text-indigo-400/60" />
                                            </div>
                                            <span className="text-xs font-bold tracking-tight group-hover:text-white transition-colors lowecase">{estimate.customer.email}</span>
                                        </div>
                                    )}
                                </div>

                                {estimate.customer.address && (
                                    <div className="flex items-start gap-4 text-white/40 leading-relaxed max-w-sm pt-4 border-t border-white/5">
                                        <MapPin className="w-4 h-4 mt-1 text-indigo-500 flex-shrink-0" />
                                        <span className="text-[10px] font-medium uppercase tracking-[0.1em]">
                                             {typeof estimate.customer.address === 'string' ? estimate.customer.address : estimate.customer.address.line1}
                                        </span>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="p-6 bg-white/5 border border-dashed border-white/10 rounded-2xl">
                                <p className="text-white/20 italic text-[11px] uppercase tracking-widest text-center">Walk-in Counterparty Projection</p>
                            </div>
                        )}
                    </div>

                    {/* Originator Metadata */}
                    <div className="space-y-8 text-right relative">
                        <div className="flex items-center justify-end gap-3 text-indigo-400 font-black text-[11px] uppercase tracking-[0.4em]">
                            System Originator
                            <Zap className="w-4 h-4" />
                        </div>
                        <div className="space-y-4">
                            <div className="space-y-1">
                                <p className="text-xl font-display font-black text-white uppercase tracking-wider">Enterprise Vision ERP</p>
                                <p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest italic">Global Synthesis Node</p>
                            </div>
                            <div className="text-[10px] font-bold text-white/30 space-y-2 uppercase tracking-[0.15em] leading-relaxed">
                                <p>Operational District 9</p>
                                <p>Synthesis Hub Alpha-01</p>
                                <p>New Delhi, IN 110001</p>
                                <p className="text-indigo-400/40">central.protocol@enterprise.vision</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Asset Attribution Matrix */}
                <div className="mb-20">
                    <table className="w-full text-left border-separate border-spacing-0">
                        <thead>
                            <tr className="border-b border-white/20">
                                <th className="pb-6 text-[10px] font-black text-white/20 uppercase tracking-[0.4em] italic">Asset Identification</th>
                                <th className="pb-6 text-[10px] font-black text-white/20 uppercase tracking-[0.4em] italic text-right">Magnitude</th>
                                <th className="pb-6 text-[10px] font-black text-white/20 uppercase tracking-[0.4em] italic text-center">Unit Scalar</th>
                                <th className="pb-6 text-[10px] font-black text-white/20 uppercase tracking-[0.4em] italic text-right">Yield (NET)</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5 border-t border-white/10">
                            {estimate.items.map((item, index) => (
                                <tr key={index} className="group">
                                    <td className="py-8 pr-12">
                                        <div className="flex items-center gap-4">
                                            <div className="w-1.5 h-10 bg-indigo-500/20 group-hover:bg-indigo-500 transition-colors rounded-full"></div>
                                            <div>
                                                <p className="text-sm font-display font-black text-white uppercase tracking-tight group-hover:text-indigo-400 transition-colors mb-1">{item.name}</p>
                                                <div className="flex items-center gap-4">
                                                    <span className="text-[9px] font-bold text-white/30 uppercase tracking-[0.2em]">{item.sku || 'REF_NULL'}</span>
                                                    <div className="w-1 h-1 bg-white/10 rounded-full"></div>
                                                    <span className="text-[9px] font-black text-indigo-500/60 uppercase tracking-widest italic">High Velocity Asset</span>
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="py-8 text-right">
                                        <div className="text-sm font-black text-white/60 font-mono tracking-tight uppercase tabular-nums">₹{item.price.toLocaleString()}</div>
                                        <div className="text-[8px] font-black text-white/20 uppercase tracking-widest mt-1">Base Scalar</div>
                                    </td>
                                    <td className="py-8 text-center">
                                        <div className="inline-flex items-center justify-center px-4 py-1.5 bg-white/5 rounded-full border border-white/10 text-xs font-black text-white tabular-nums">
                                            {item.quantity} units
                                        </div>
                                    </td>
                                    <td className="py-8 text-right">
                                         <div className="text-lg font-display font-black text-white tracking-tighter tabular-nums leading-none">₹{item.total?.toLocaleString()}</div>
                                         <div className="text-[8px] font-black text-indigo-500/60 uppercase tracking-widest mt-1 italic">Resolution Yield</div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Synthesis Aggregation */}
                <div className="flex justify-end mb-20 relative">
                    <div className="w-full max-w-sm space-y-6">
                        <div className="space-y-3 px-6">
                            <div className="flex justify-between items-center group">
                                <span className="text-[10px] font-black text-white/20 uppercase tracking-[0.4em] group-hover:text-white/40 transition-colors">Gross Manifest Magnitude</span>
                                <span className="text-sm font-black text-white/60 font-mono tabular-nums">₹{estimate.subtotal?.toLocaleString()}</span>
                            </div>
                            {estimate.discount > 0 && (
                                <div className="flex justify-between items-center group">
                                    <span className="text-[10px] font-black text-rose-500/60 uppercase tracking-[0.4em] flex items-center gap-2">
                                        <div className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse"></div>
                                        Tactical Rebate
                                    </span>
                                    <span className="text-sm font-black text-rose-500 font-mono tabular-nums">-₹{estimate.discount?.toLocaleString()}</span>
                                </div>
                            )}
                        </div>

                        <div className="p-10 bg-indigo-600 rounded-[2.5rem] relative overflow-hidden group shadow-[0_0_80px_rgba(79,70,229,0.3)] border border-indigo-400/30">
                           <div className="absolute top-0 right-0 w-48 h-48 bg-white/20 rounded-full blur-[60px] -mr-24 -mt-24 pointer-events-none group-hover:scale-125 transition-transform duration-1000"></div>
                           <div className="flex flex-col relative z-10 space-y-2">
                                <div className="flex justify-between items-center">
                                    <span className="text-[11px] font-black text-white/60 uppercase tracking-[0.5em] mb-2 leading-none">Net Resolution Position</span>
                                    <Award className="w-6 h-6 text-white/40" />
                                </div>
                                <p className="text-6xl font-display font-black text-white tracking-tighter tabular-nums leading-none">₹{estimate.totalAmount?.toLocaleString()}</p>
                                <div className="flex items-center gap-2 pt-2 border-t border-white/20 mt-4">
                                     <div className="w-2 h-2 rounded-full bg-white/30"></div>
                                     <div className="text-[9px] font-black text-white/70 uppercase tracking-[0.4em]">Authorized Projection Manifest</div>
                                </div>
                           </div>
                        </div>
                    </div>
                </div>

                {/* Conflict Annotations & Technical Threads */}
                {estimate.notes && (
                    <div className="bg-white/[0.03] p-10 rounded-[2.5rem] border border-white/5 flex gap-8 relative overflow-hidden group">
                        <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-indigo-500/20 group-hover:bg-indigo-500 transition-colors"></div>
                        <div className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center text-white/20 shrink-0 border border-white/5">
                            <FileText className="w-6 h-6" />
                        </div>
                        <div className="space-y-3">
                            <h4 className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.5em]">System Annotations & Protocol Exceptions</h4>
                            <p className="text-white/40 text-xs font-medium leading-relaxed italic uppercase tracking-[0.1em]">{estimate.notes}</p>
                        </div>
                    </div>
                )}
            </div>

            {/* Verification Footer */}
            <div className="mt-20 pt-10 border-t border-white/5 flex justify-between items-end relative z-10">
                <div className="flex items-center gap-6">
                    <div className="w-14 h-14 bg-indigo-600 rounded-2xl flex items-center justify-center text-white font-black text-2xl font-display italic shadow-xl">EV</div>
                    <div className="space-y-1">
                        <p className="text-[10px] font-black text-white uppercase tracking-[0.4em] leading-none">Enterprise Vision Lattice</p>
                        <p className="text-[8px] font-bold text-white/20 uppercase tracking-[0.3em]">Hardware-Synchronized Authentication</p>
                    </div>
                </div>
                <div className="text-right space-y-4">
                    <div className="space-y-1">
                        <p className="text-[9px] font-black text-indigo-500/60 uppercase tracking-widest leading-loose">
                            ELECTRONIC RESOLUTION MANIFEST <br />
                            TIMESTAMP: {new Date().toISOString().toUpperCase()}
                        </p>
                        <p className="text-[8px] font-bold text-white/10 uppercase tracking-widest italic">
                            HASH-LINKED: {Math.random().toString(36).substring(2, 18).toUpperCase()}
                        </p>
                    </div>
                    <div className="flex items-center justify-end gap-2 text-emerald-500/40 text-[9px] font-black uppercase tracking-widest">
                         <ShieldCheck className="w-3.5 h-3.5" />
                         Compliance Verified
                    </div>
                </div>
            </div>

            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@100..900&family=JetBrains+Mono:wght@100..800&display=swap');
                .font-display { font-family: 'Outfit', sans-serif; }
                .font-mono { font-family: 'JetBrains Mono', monospace; }
                @media print {
                    body { background: white !important; color: black !important; }
                    .rounded-[3rem] { border: none !important; border-radius: 0 !important; }
                    .bg-[#050505] { background: white !important; color: black !important; }
                    .text-white { color: black !important; }
                    .text-white\\/90 { color: black !important; }
                    .text-white\\/60 { color: #555 !important; }
                    .text-white\\/40 { color: #888 !important; }
                    .text-white\\/30 { color: #aaa !important; }
                    .text-white\\/20 { color: #ccc !important; }
                    .text-indigo-400 { color: #4f46e5 !important; }
                    .bg-indigo-600 { background: #4f46e5 !important; }
                    .shadow-2xl { box-shadow: none !important; }
                    .glass-panel { background: white !important; border: 1px solid #eee !important; }
                }
            `}</style>
        </div>
    );
};

export default EstimateTemplate;

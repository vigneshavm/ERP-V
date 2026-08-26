import React, { useMemo } from 'react';
import { Save, X, Plus, FileText, ArrowLeft, Zap, ShieldCheck, CreditCard, IndianRupee } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Layout from '../../../components/shared/Layout';

const PaymentInCreatorMockUI: React.FC = () => {
    const navigate = useNavigate();

    return (
        <Layout>
            <div className="p-8 space-y-8 h-full flex flex-col text-main animate-fade-in relative z-10">
                {/* Header */}
                <header className="flex justify-between items-center">
                    <div className="flex items-center gap-6">
                        <button 
                            onClick={() => navigate(-1)}
                            className="w-12 h-12 flex items-center justify-center bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-sm hover:bg-primary hover:text-white transition-all group"
                        >
                            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                        </button>
                        <div className="relative pl-5">
                            <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary rounded-full shadow-[0_0_15px_rgba(59,130,246,0.5)]" />
                            <h1 className="text-3xl font-display font-black tracking-tighter text-main flex items-center gap-3">
                                Payment <span className="text-primary italic">Inbound</span>
                                <span className="px-3 py-1 bg-primary/10 border border-primary/20 text-primary rounded-sm text-[10px] font-black uppercase tracking-widest flex items-center gap-1">
                                    <Zap className="w-3.5 h-3.5" /> Entry Protocol
                                </span>
                            </h1>
                            <p className="text-[10px] text-neutral-500 mt-1 font-black uppercase tracking-[0.2em] opacity-70">Revenue Realization & Node Settlement</p>
                        </div>
                    </div>
                    <div className="flex gap-4">
                        <button className="h-11 px-6 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-main font-black uppercase tracking-widest text-[10px] rounded-sm hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-all shadow-sm flex items-center gap-2">
                            <X className="w-4 h-4 text-rose-500" /> Abort Cycle
                        </button>
                        <button className="h-11 px-8 bg-primary text-white font-black uppercase tracking-widest text-[10px] rounded-sm transition-all shadow-lg shadow-primary/20 flex items-center gap-2 hover:opacity-90">
                            <Save className="w-4 h-4" /> Commit Record
                        </button>
                    </div>
                </header>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 flex-1 overflow-hidden">
                    {/* Main Form Area */}
                    <div className="lg:col-span-2 space-y-8 overflow-y-auto custom-scrollbar pr-4">
                        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-sm p-8 shadow-sm">
                            <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-neutral-400 mb-8 flex items-center gap-3">
                                <div className="w-1.5 h-6 bg-primary rounded-full shadow-[0_0_10px_rgba(59,130,246,0.3)]" />
                                Primary Metadata // V4
                            </h2>
                            <div className="grid grid-cols-2 gap-8">
                                <div className="space-y-3">
                                    <label className="text-[9px] font-black uppercase tracking-[0.2em] text-neutral-400 block">Document Identification</label>
                                    <input 
                                        type="text" 
                                        className="w-full bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-sm px-5 py-3.5 text-xs text-neutral-400 font-black tracking-widest shadow-inner outline-none cursor-not-allowed italic" 
                                        value="VCH-AUTO-GEN" 
                                        disabled 
                                    />
                                </div>
                                <div className="space-y-3">
                                    <label className="text-[9px] font-black uppercase tracking-[0.2em] text-neutral-400 block">Temporal Timestamp</label>
                                    <input 
                                        type="date" 
                                        className="w-full bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-sm px-5 py-3.5 text-xs text-main font-black tracking-widest outline-none focus:border-primary transition-all" 
                                        defaultValue={new Date().toISOString().split('T')[0]}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-sm overflow-hidden shadow-sm">
                            <div className="p-6 border-b border-neutral-100 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-950/50 flex justify-between items-center">
                                <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-neutral-400 flex items-center gap-3">
                                    <div className="w-1.5 h-6 bg-primary rounded-full shadow-[0_0_10px_rgba(59,130,246,0.3)]" />
                                    Allocation Matrix // Settlements
                                </h2>
                                <button className="h-9 px-4 bg-primary text-white text-[9px] font-black uppercase tracking-widest rounded-sm hover:opacity-90 transition-all flex items-center gap-2">
                                    <Plus className="w-3.5 h-3.5" /> Add Protocol
                                </button>
                            </div>
                            <div className="p-0">
                                <table className="w-full text-left border-collapse">
                                    <thead className="bg-neutral-50 dark:bg-neutral-950/80 border-b border-neutral-200 dark:border-neutral-800">
                                        <tr className="text-neutral-500 text-[9px] font-black uppercase tracking-[0.2em]">
                                            <th className="px-8 py-4">Node Reference</th>
                                            <th className="px-8 py-4 text-right">Pending (INR)</th>
                                            <th className="px-8 py-4 text-right">Settled (INR)</th>
                                            <th className="px-8 py-4 text-right">Net Value</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                                        {[1, 2].map((_, i) => (
                                            <tr key={i} className="group hover:bg-primary/[0.02] transition-all">
                                                <td className="px-8 py-5">
                                                    <select className="bg-transparent text-xs font-black text-primary uppercase tracking-tight outline-none w-full appearance-none cursor-pointer">
                                                        <option>Select Reference Protocol...</option>
                                                        <option>INV-00241 - Main Tenant</option>
                                                        <option>INV-00245 - Main Tenant</option>
                                                    </select>
                                                </td>
                                                <td className="px-8 py-5 text-right font-mono text-xs font-black text-neutral-400 tabular-nums">0.00</td>
                                                <td className="px-8 py-5 text-right font-mono text-xs font-black text-neutral-400 tabular-nums">0.00</td>
                                                <td className="px-8 py-5 text-right font-mono text-xs font-black text-main tabular-nums">0.00</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>

                    {/* Sidebar Summary */}
                    <div className="space-y-8">
                        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-sm p-8 shadow-sm relative overflow-hidden group">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-1000" />
                            <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-neutral-400 mb-8 border-b border-neutral-100 dark:border-neutral-800 pb-4 relative z-10">
                                Total Settlement Index
                            </h2>
                            <div className="space-y-5 relative z-10">
                                <div className="flex justify-between items-center text-[10px] font-black text-neutral-500 uppercase tracking-widest">
                                    <span>Principal Value</span>
                                    <span className="font-mono text-xs text-main">₹0.00</span>
                                </div>
                                <div className="flex justify-between items-center text-[10px] font-black text-neutral-500 uppercase tracking-widest">
                                    <span>Adjustment Factor</span>
                                    <span className="font-mono text-xs text-rose-500">₹0.00</span>
                                </div>
                                <div className="pt-6 border-t-2 border-primary/20 flex flex-col gap-2 mt-4">
                                    <span className="text-[9px] font-black text-primary uppercase tracking-[0.3em] italic">Net Credit Valuation</span>
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2 text-3xl font-display font-black text-primary tabular-nums tracking-tighter">
                                            <IndianRupee className="w-5 h-5 stroke-[3]" />
                                            0
                                        </div>
                                        <div className="p-3 bg-primary/10 rounded-sm border border-primary/20 text-primary">
                                            <CreditCard className="w-5 h-5" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-emerald-500/5 border border-emerald-500/10 p-6 rounded-sm space-y-4">
                            <div className="flex items-center gap-3 text-emerald-500">
                                <ShieldCheck className="w-5 h-5" />
                                <span className="text-[10px] font-black uppercase tracking-widest">Integrity Locked</span>
                            </div>
                            <p className="text-[9px] font-black text-neutral-400 uppercase tracking-widest leading-relaxed">
                                This entry will be cryptographically hashed and indexed upon commitment. Non-repudiation protocol active.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </Layout>
    );
};

export default PaymentInCreatorMockUI;

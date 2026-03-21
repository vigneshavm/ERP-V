import React from 'react';
import { 
    Hash, Lock, Settings2, ChevronRight, ShieldCheck, 
    CheckCircle2, AlertCircle, RefreshCcw, Plus 
} from 'lucide-react';
import { useSequenceControl, NumberSeries } from '../model/useSequenceControl';

export const SequenceControlFeature: React.FC = () => {
    const { series, formatNumber } = useSequenceControl();

    return (
        <div className="space-y-8 animate-fade-in">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-indigo-50 dark:bg-indigo-900/30 rounded-lg">
                            <Hash className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-black text-main dark:text-main uppercase tracking-tight">Sequence Controller</h2>
                    </div>
                    <p className="text-xs text-muted font-bold uppercase tracking-widest opacity-60 ml-1">Architectural backbone for legal document isolation</p>
                </div>
                <button className="px-6 py-3 bg-indigo-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-3 hover:bg-indigo-700 shadow-xl shadow-indigo-600/20 transition-all active:scale-95">
                    <Plus className="w-4 h-4" /> Initialize New Chain
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                <div className="lg:col-span-3 space-y-4">
                    {series.map((s) => (
                        <div key={s.id} className="bg-white dark:bg-[var(--erp-bg)] rounded-[2.5rem] p-6 border border-default dark:border-default flex flex-col md:flex-row items-center justify-between gap-6 group hover:border-indigo-500 transition-all shadow-sm">
                            <div className="flex items-center gap-6">
                                <div className="w-16 h-16 rounded-2xl bg-[var(--erp-bg-sunken)] dark:bg-[var(--erp-card)]/50 flex items-center justify-center border border-slate-100 dark:border-default group-hover:bg-indigo-50 dark:group-hover:bg-indigo-900/20 transition-colors relative overflow-hidden">
                                     {s.status === 'LOCKED' ? (
                                         <Lock className="w-6 h-6 text-muted" />
                                     ) : (
                                         <Settings2 className="w-6 h-6 text-indigo-500" />
                                     )}
                                     <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                </div>
                                <div>
                                    <h4 className="font-black text-sm uppercase tracking-tight text-main dark:text-main">{s.documentType} Registry</h4>
                                    <div className="flex items-center gap-2 mt-2">
                                        <span className="px-2 py-1 rounded-lg bg-[var(--erp-bg-sunken)] dark:bg-[var(--erp-card)] text-[9px] font-black text-muted uppercase tracking-widest">{s.branchId}</span>
                                        <span className="px-2 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-900/30 text-[9px] font-black text-indigo-600 uppercase tracking-widest">FY-{s.year}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="flex-1 flex flex-col items-center md:items-end">
                                <p className="text-[9px] font-black text-muted uppercase tracking-[0.3em] mb-2 opacity-40">Dynamic Preview</p>
                                <code className="text-xl font-black tracking-tighter text-indigo-600 dark:text-indigo-400 bg-indigo-50/50 dark:bg-indigo-900/20 px-6 py-2 rounded-2xl border border-indigo-100 dark:border-indigo-500/10">
                                    {formatNumber(s)}
                                </code>
                            </div>

                            <div className="flex items-center gap-6 border-l border-slate-100 dark:border-default pl-8 h-full">
                                <div className="text-right">
                                    <p className="text-[9px] font-black text-muted uppercase tracking-widest mb-1 opacity-40">Index</p>
                                    <p className="text-lg font-black text-main dark:text-main">{s.currentValue}</p>
                                </div>
                                <button className="p-3 bg-[var(--erp-bg-sunken)] dark:bg-[var(--erp-card)] rounded-xl hover:bg-[var(--erp-bg-sunken)] dark:hover:bg-slate-700 transition-all active:scale-90">
                                    <ChevronRight className="w-5 h-5 text-muted group-hover:text-indigo-500 transition-colors" />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="space-y-8">
                    <div className="bg-[var(--erp-bg)] text-main p-8 rounded-[3rem] shadow-2xl relative overflow-hidden group border border-default">
                        <ShieldCheck className="absolute -top-12 -right-12 w-48 h-48 opacity-5 group-hover:rotate-12 transition-all duration-1000 text-indigo-400" />
                        <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-400 mb-8 italic">Sequence Intelligence</h4>

                        <ul className="space-y-6">
                            <li className="flex gap-4">
                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0 shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                                <p className="text-[11px] font-bold text-muted leading-relaxed uppercase tracking-tight">
                                    Integrity Check <span className="text-main font-black">Passed</span>. No numbering gaps in FY-2025.
                                </p>
                            </li>
                            <li className="flex gap-4">
                                <div className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 shrink-0 shadow-[0_0_10px_rgba(245,158,11,0.5)]" />
                                <p className="text-[11px] font-bold text-muted leading-relaxed uppercase tracking-tight">
                                    Soft-Lock Warning on <span className="text-main font-black">JE-778</span>. Suggesting chain renewal.
                                </p>
                            </li>
                        </ul>

                        <div className="mt-10 pt-8 border-t border-default space-y-4">
                             {[
                                { label: 'Zero-Gap Sync', status: 'Optimal' },
                                { label: 'Branch Barrier', status: 'Secured' },
                                { label: 'Audit Compliance', status: 'Verified' }
                            ].map((v, i) => (
                                <div key={i} className="flex justify-between items-center bg-[var(--erp-bg-sunken)] p-3 rounded-2xl border border-default group/pill hover:bg-white/10 transition-all cursor-default">
                                    <span className="text-[10px] font-black text-muted uppercase tracking-tighter group-hover/pill:text-slate-300 transition-colors">{v.label}</span>
                                    <span className="text-[9px] font-black text-indigo-400 uppercase tracking-widest">{v.status}</span>
                                </div>
                            ))}
                        </div>

                        <button className="w-full mt-10 py-4 bg-indigo-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-indigo-600/20 hover:bg-indigo-500 active:scale-95 transition-all">
                            Initiate Audit Trace
                        </button>
                    </div>

                    <div className="bg-emerald-500/5 dark:bg-emerald-500/10 p-8 rounded-[2.5rem] border border-emerald-500/20 shadow-inner relative overflow-hidden group">
                        <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500" />
                        <div className="flex items-center gap-3 mb-4">
                            <RefreshCcw className="w-4 h-4 text-emerald-500 animate-spin-slow" />
                            <h5 className="text-[11px] font-black uppercase tracking-widest text-emerald-600">Lifecycle Engine</h5>
                        </div>
                        <p className="text-[10px] font-bold text-muted dark:text-muted leading-relaxed uppercase tracking-tight">
                            Document chains for <span className="text-main dark:text-main font-black">Revenue & Spend</span> reset on <span className="text-emerald-600 font-bold">April 01</span>.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

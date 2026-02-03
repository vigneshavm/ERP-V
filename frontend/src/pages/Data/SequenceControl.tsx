import React, { useState } from 'react';
import {
    Hash,
    ShieldCheck,
    AlertCircle,
    RefreshCcw,
    Plus,
    ChevronRight,
    Lock,
    Settings2,
    CheckCircle2
} from 'lucide-react';

interface NumberSeries {
    id: string;
    documentType: string;
    prefix: string;
    suffix: string;
    padding: number;
    currentValue: number;
    branchId: string;
    year: string;
    status: 'ACTIVE' | 'LOCKED';
}

const SequenceControl: React.FC = () => {
    const [series, setSeries] = useState<NumberSeries[]>([
        { id: '1', documentType: 'Invoice', prefix: 'CHN-INV', suffix: '', padding: 6, currentValue: 234, branchId: 'Chennai', year: '2025', status: 'ACTIVE' },
        { id: '2', documentType: 'Bill', prefix: 'MDU-PUR', suffix: '', padding: 6, currentValue: 91, branchId: 'Madurai', year: '2025', status: 'ACTIVE' },
        { id: '3', documentType: 'Payment', prefix: 'CHN-PAY', suffix: '', padding: 6, currentValue: 102, branchId: 'Chennai', year: '2025', status: 'ACTIVE' },
        { id: '4', documentType: 'Journal', prefix: 'JE', suffix: '', padding: 6, currentValue: 778, branchId: 'GLOBAL', year: '2025', status: 'LOCKED' },
    ]);

    const formatNumber = (s: NumberSeries) => {
        const num = s.currentValue.toString().padStart(s.padding, '0');
        return `${s.prefix}-${s.year}-${num}${s.suffix}`;
    };

    return (
        <div className="space-y-6 animate-fade-in text-slate-900 dark:text-white">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-xl font-black uppercase tracking-tight flex items-center gap-2">
                        <Hash className="w-5 h-5 text-indigo-500" />
                        Number Series Sequence Control
                    </h2>
                    <p className="text-xs text-slate-500 font-medium">The legal document backbone. Branch-wise isolated, GST compliant.</p>
                </div>
                <button className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-black uppercase tracking-widest flex items-center gap-2 hover:bg-indigo-700 shadow-lg shadow-indigo-600/20 transition-all active:scale-95">
                    <Plus className="w-4 h-4" /> New Sequence
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                <div className="lg:col-span-3 space-y-4">
                    {series.map((s) => (
                        <div key={s.id} className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5 flex flex-col md:flex-row items-center justify-between gap-4 group hover:border-indigo-500/50 transition-all shadow-sm">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-xl bg-slate-50 dark:bg-slate-900 flex items-center justify-center border border-slate-100 dark:border-slate-700 group-hover:bg-indigo-50 dark:group-hover:bg-indigo-900/20 transition-colors">
                                    {s.status === 'LOCKED' ? <Lock className="w-5 h-5 text-slate-400" /> : <Settings2 className="w-5 h-5 text-indigo-500" />}
                                </div>
                                <div>
                                    <h4 className="font-black text-sm uppercase tracking-tight">{s.documentType} Series</h4>
                                    <div className="flex items-center gap-2 mt-1">
                                        <span className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-900 text-[10px] font-bold text-slate-500 uppercase">{s.branchId}</span>
                                        <span className="px-1.5 py-0.5 rounded bg-indigo-50 dark:bg-indigo-900/30 text-[10px] font-bold text-indigo-600 uppercase">FY-{s.year}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="flex-1 flex flex-col items-center md:items-end">
                                <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Preview</p>
                                <code className="text-lg font-black tracking-tighter text-indigo-600 dark:text-indigo-400 bg-indigo-50/50 dark:bg-indigo-900/30 px-3 py-1 rounded-lg">
                                    {formatNumber(s)}
                                </code>
                            </div>

                            <div className="flex items-center gap-4 border-l border-slate-100 dark:border-slate-700 pl-4 h-full">
                                <div className="text-right">
                                    <p className="text-[10px] font-black text-slate-400 uppercase">Current</p>
                                    <p className="text-sm font-black">{s.currentValue}</p>
                                </div>
                                <button className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors">
                                    <ChevronRight className="w-5 h-5 text-slate-300" />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="space-y-6">
                    <div className="bg-slate-900 text-white p-6 rounded-[2.5rem] shadow-2xl relative overflow-hidden group">
                        <ShieldCheck className="absolute -top-10 -right-10 w-40 h-40 opacity-5 group-hover:rotate-12 transition-all duration-1000" />
                        <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-400 mb-6 italic">Sequence Intelligence</h4>

                        <ul className="space-y-4">
                            <li className="flex gap-3">
                                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                                <p className="text-[11px] font-bold text-slate-300 leading-relaxed">
                                    No numbering gaps detected in <span className="text-white">FY-2025</span>. GST audits will pass internal consistency checks.
                                </p>
                            </li>
                            <li className="flex gap-3">
                                <AlertCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                                <p className="text-[11px] font-bold text-slate-300 leading-relaxed">
                                    Document <span className="text-white">JE-2025-000778</span> reached soft-lock. Suggesting sequence renewal for Q1.
                                </p>
                            </li>
                        </ul>

                        <div className="mt-8 pt-6 border-t border-white/10 space-y-4">
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Validation Protocol</p>
                            {[
                                { label: 'Zero-Gap Check', status: 'PASS' },
                                { label: 'Branch Isolation', status: 'ACTIVE' },
                                { label: 'GST Compliance', status: 'SAFE' }
                            ].map((v, i) => (
                                <div key={i} className="flex justify-between items-center bg-white/5 p-2 rounded-xl border border-white/5">
                                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">{v.label}</span>
                                    <span className="text-[9px] font-black text-indigo-400 uppercase">{v.status}</span>
                                </div>
                            ))}
                        </div>

                        <button className="w-full mt-6 py-3 bg-indigo-500 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-indigo-500/20 hover:scale-[1.02] active:scale-95 transition-all">
                            Run Full Audit Trace
                        </button>
                    </div>

                    <div className="bg-white dark:bg-slate-800 p-6 rounded-[2rem] border border-slate-200 dark:border-slate-700 shadow-sm border-l-4 border-l-emerald-500">
                        <div className="flex items-center gap-3 mb-4">
                            <RefreshCcw className="w-4 h-4 text-emerald-500" />
                            <h5 className="text-[11px] font-black uppercase tracking-widest">Auto-Reset Cycles</h5>
                        </div>
                        <p className="text-[10px] font-bold text-slate-500 leading-relaxed">
                            Sequences for <span className="text-indigo-600 dark:text-indigo-400 font-black">Sales & Purchase</span> are set to auto-reset on April 1st (Fiscal Year start).
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SequenceControl;

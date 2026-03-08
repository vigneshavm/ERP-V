import React, { useState, useMemo, useCallback } from 'react';
import {
    Calculator, Store, Landmark, FileText, CheckCircle2, CreditCard,
    AlertTriangle, ShieldCheck, Copy, Check, Eye, EyeOff, Sparkles, Info
} from 'lucide-react';
import { FinanceTabProps } from './types';

/* ─── GSTIN / PAN Validator  ──────────────────────────────────── */
const GSTIN_REGEX = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
const PAN_REGEX = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
const IFSC_REGEX = /^[A-Z]{4}0[A-Z0-9]{6}$/;

type ValidationStatus = 'idle' | 'valid' | 'invalid' | 'partial';

const useFieldValidation = (value: string, regex: RegExp, minLength: number) => {
    return useMemo((): ValidationStatus => {
        if (!value || value.length === 0) return 'idle';
        if (regex.test(value.toUpperCase())) return 'valid';
        if (value.length < minLength) return 'partial';
        return 'invalid';
    }, [value, regex, minLength]);
};

const ValidationIndicator: React.FC<{ status: ValidationStatus; label: string }> = ({ status, label }) => {
    if (status === 'idle') return null;
    return (
        <div className={`flex items-center gap-1.5 mt-2 transition-all duration-300 animate-in fade-in slide-in-from-bottom-2 ${
            status === 'valid' ? 'text-emerald-600' : status === 'invalid' ? 'text-red-500' : 'text-amber-500'
        }`}>
            {status === 'valid' && <CheckCircle2 className="w-3.5 h-3.5" />}
            {status === 'invalid' && <AlertTriangle className="w-3.5 h-3.5" />}
            {status === 'partial' && <Info className="w-3.5 h-3.5" />}
            <span className="text-[10px] font-black uppercase tracking-widest">
                {status === 'valid' ? `${label} Verified` : status === 'invalid' ? `Invalid ${label} Format` : `Continue typing...`}
            </span>
        </div>
    );
};

/* ─── Copy Button  ────────────────────────────────────────────── */
const CopyButton: React.FC<{ value: string }> = ({ value }) => {
    const [copied, setCopied] = useState(false);
    return (
        <button
            onClick={() => { navigator.clipboard.writeText(value); setCopied(true); setTimeout(() => setCopied(false), 1500); }}
            className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-all text-slate-400 hover:text-indigo-500"
            title="Copy to clipboard"
        >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
        </button>
    );
};

/* ─── Bank Card Preview  ──────────────────────────────────────── */
const BankCardPreview: React.FC<{ bankName: string; accNo: string; ifsc: string; holderName: string }> = ({
    bankName, accNo, ifsc, holderName
}) => {
    const [showFull, setShowFull] = useState(false);
    const maskedAcc = useMemo(() => {
        if (!accNo || accNo.length < 4) return '•••• •••• ••••';
        if (showFull) return accNo;
        return '•'.repeat(accNo.length - 4) + accNo.slice(-4);
    }, [accNo, showFull]);

    return (
        <div className="relative overflow-hidden rounded-[2rem] p-8 min-h-[220px] flex flex-col justify-between bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-900 text-white shadow-2xl shadow-slate-400/20 dark:shadow-none group">
            {/* Decorative Elements */}
            <div className="absolute top-0 right-0 w-48 h-48 bg-white/5 rounded-full -mr-24 -mt-24 blur-[1px]" />
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-indigo-500/10 rounded-full -ml-16 -mb-16" />
            <div className="absolute top-6 right-6">
                <Landmark className="w-10 h-10 text-white/10" />
            </div>

            {/* Header */}
            <div className="relative z-10">
                <div className="flex items-center gap-3 mb-1">
                    <div className="w-10 h-6 rounded bg-gradient-to-r from-amber-400 to-amber-600" />
                    <div className="w-8 h-8 rounded-full bg-red-500/30 -ml-3 border-2 border-red-400/50" />
                </div>
                <p className="text-[10px] font-black text-white/40 uppercase tracking-[0.3em] mt-3">Settlement Account</p>
                <h4 className="text-lg font-black text-white/90 mt-0.5">{bankName || 'Your Bank Name'}</h4>
            </div>

            {/* Account Number */}
            <div className="relative z-10 my-4">
                <div className="flex items-center gap-3">
                    <p className="text-xl font-mono font-bold tracking-[0.15em] text-white/80">{maskedAcc}</p>
                    <button
                        onClick={() => setShowFull(!showFull)}
                        className="p-1 rounded-lg hover:bg-white/10 transition-all text-white/40 hover:text-white/80"
                    >
                        {showFull ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                </div>
            </div>

            {/* Footer */}
            <div className="relative z-10 flex items-end justify-between">
                <div>
                    <p className="text-[8px] font-black text-white/30 uppercase tracking-[0.2em]">Account Holder</p>
                    <p className="text-sm font-bold text-white/70">{holderName || 'Your Name'}</p>
                </div>
                <div className="text-right">
                    <p className="text-[8px] font-black text-white/30 uppercase tracking-[0.2em]">IFSC</p>
                    <p className="text-sm font-mono font-bold text-white/70">{ifsc || '—'}</p>
                </div>
            </div>

            {/* Hover effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
        </div>
    );
};

/* ─── Main FinanceTab  ─────────────────────────────────────── */
const FinanceTab: React.FC<FinanceTabProps> = ({
    taxMode, setTaxMode, gstin, setGstin, pan, setPan,
    bankName, setBankName, accNo, setAccNo, ifsc, setIfsc, accountHolderName, setAccountHolderName
}) => {
    const gstinStatus = useFieldValidation(gstin || '', GSTIN_REGEX, 5);
    const panStatus = useFieldValidation(pan || '', PAN_REGEX, 4);
    const ifscStatus = useFieldValidation(ifsc || '', IFSC_REGEX, 4);

    return (
        <div className="p-6 space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Tax & Pricing Section */}
            <section>
                <div className="flex items-center gap-3 mb-8">
                    <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center">
                        <Calculator className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-slate-800 dark:text-white leading-none">Tax & Pricing Strategy</h3>
                        <p className="text-xs text-slate-500 font-medium mt-1">Configure default taxation and compliance IDs</p>
                    </div>
                </div>

                <div className="grid lg:grid-cols-3 gap-8">
                    {/* Tax Mode Card */}
                    <div className="lg:col-span-1 bg-slate-50/50 dark:bg-slate-800/20 border border-slate-100 dark:border-slate-800 p-6 rounded-3xl space-y-6">
                        <div>
                            <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-3">Default Tax Computation</label>
                            <div className="flex bg-white dark:bg-slate-900 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
                                <button
                                    onClick={() => setTaxMode('EXCLUSIVE')}
                                    className={`flex-1 flex flex-col items-center py-4 rounded-xl transition-all ${taxMode === 'EXCLUSIVE' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 font-bold'}`}
                                >
                                    <span className="text-xs font-black">EXCLUSIVE</span>
                                    <span className={`text-[9px] mt-0.5 opacity-60 ${taxMode === 'EXCLUSIVE' ? 'text-white' : ''}`}>+ Tax on Price</span>
                                </button>
                                <button
                                    onClick={() => setTaxMode('INCLUSIVE')}
                                    className={`flex-1 flex flex-col items-center py-4 rounded-xl transition-all ${taxMode === 'INCLUSIVE' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 font-bold'}`}
                                >
                                    <span className="text-xs font-black">INCLUSIVE</span>
                                    <span className={`text-[9px] mt-0.5 opacity-60 ${taxMode === 'INCLUSIVE' ? 'text-white' : ''}`}>Inc. Tax in Price</span>
                                </button>
                            </div>
                        </div>
                        <div className="p-4 bg-white/50 dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-slate-800">
                            <div className="flex gap-2 text-[10px] text-slate-500 font-medium leading-relaxed">
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                                <span>This mode will be auto-calculated for all new inventory items and POS transactions.</span>
                            </div>
                        </div>
                    </div>

                    {/* Registration Details */}
                    <div className="lg:col-span-2 grid md:grid-cols-2 gap-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-8 rounded-3xl shadow-sm">
                        <div className="space-y-1">
                            <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                                <FileText className="w-3 h-3 text-indigo-500" /> GSTIN / VAT Number
                                {(gstin || '').length > 0 && <CopyButton value={gstin || ''} />}
                            </label>
                            <div className="relative">
                                <input
                                    type="text"
                                    value={gstin || ''}
                                    onChange={e => setGstin?.(e.target.value.toUpperCase())}
                                    className={`w-full px-4 py-3.5 bg-slate-50/50 dark:bg-slate-800/50 border rounded-2xl outline-none focus:ring-2 font-black text-sm text-slate-700 dark:text-white transition-all ${
                                        gstinStatus === 'valid' ? 'border-emerald-300 focus:ring-emerald-500/20 focus:border-emerald-500' :
                                        gstinStatus === 'invalid' ? 'border-red-300 focus:ring-red-500/20 focus:border-red-500' :
                                        'border-slate-100 dark:border-slate-700 focus:ring-indigo-500/20 focus:border-indigo-500'
                                    }`}
                                    placeholder="e.g. 29ABCDE1234F1Z5"
                                    maxLength={15}
                                />
                                {gstinStatus === 'valid' && (
                                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                        <ShieldCheck className="w-5 h-5 text-emerald-500" />
                                    </div>
                                )}
                            </div>
                            <ValidationIndicator status={gstinStatus} label="GSTIN" />
                        </div>
                        <div className="space-y-1">
                            <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                                <CreditCard className="w-3 h-3 text-indigo-500" /> Permanent Account (PAN)
                                {(pan || '').length > 0 && <CopyButton value={pan || ''} />}
                            </label>
                            <div className="relative">
                                <input
                                    type="text"
                                    value={pan || ''}
                                    onChange={e => setPan?.(e.target.value.toUpperCase())}
                                    className={`w-full px-4 py-3.5 bg-slate-50/50 dark:bg-slate-800/50 border rounded-2xl outline-none focus:ring-2 font-black text-sm text-slate-700 dark:text-white transition-all ${
                                        panStatus === 'valid' ? 'border-emerald-300 focus:ring-emerald-500/20 focus:border-emerald-500' :
                                        panStatus === 'invalid' ? 'border-red-300 focus:ring-red-500/20 focus:border-red-500' :
                                        'border-slate-100 dark:border-slate-700 focus:ring-indigo-500/20 focus:border-indigo-500'
                                    }`}
                                    placeholder="e.g. ABCDE1234F"
                                    maxLength={10}
                                />
                                {panStatus === 'valid' && (
                                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                        <ShieldCheck className="w-5 h-5 text-emerald-500" />
                                    </div>
                                )}
                            </div>
                            <ValidationIndicator status={panStatus} label="PAN" />
                        </div>
                        <div className="md:col-span-2 pt-4">
                            <div className="p-4 bg-indigo-50/50 dark:bg-indigo-900/20 border border-indigo-100/50 dark:border-indigo-800 rounded-2xl">
                                <p className="text-[10px] text-indigo-600 dark:text-indigo-300 font-bold leading-relaxed">
                                    REGISTRATION NOTE: These IDs are critical for B2B billing and tax filing. Ensure they are correct as per your legal documents.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Banking Details Section */}
            <section>
                <div className="flex items-center gap-3 mb-8">
                    <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center">
                        <Landmark className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-slate-800 dark:text-white leading-none">Settlement Banking</h3>
                        <p className="text-xs text-slate-500 font-medium mt-1">Official bank account for invoice payments</p>
                    </div>
                </div>

                <div className="grid lg:grid-cols-5 gap-8">
                    {/* Bank Card Preview */}
                    <div className="lg:col-span-2">
                        <BankCardPreview
                            bankName={bankName || ''}
                            accNo={accNo || ''}
                            ifsc={ifsc || ''}
                            holderName={accountHolderName || ''}
                        />
                    </div>

                    {/* Input Fields */}
                    <div className="lg:col-span-3 grid md:grid-cols-2 gap-6">
                        <div className="space-y-1">
                            <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-widest ml-1">Official Bank Name</label>
                            <input type="text" value={bankName || ''} onChange={e => setBankName?.(e.target.value)} className="w-full px-5 py-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 font-bold text-slate-800 dark:text-white" placeholder="e.g. HDFC Bank" />
                        </div>
                        <div className="space-y-1">
                            <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-widest ml-1">Account Holder Name</label>
                            <input type="text" value={accountHolderName || ''} onChange={e => setAccountHolderName?.(e.target.value)} className="w-full px-5 py-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 font-bold text-slate-800 dark:text-white" />
                        </div>
                        <div className="space-y-1">
                            <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-widest ml-1">Corporate Account Number</label>
                            <input type="text" value={accNo || ''} onChange={e => setAccNo?.(e.target.value)} className="w-full px-5 py-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 font-bold text-slate-800 dark:text-white tracking-widest" placeholder="e.g. 50100..." />
                        </div>
                        <div className="space-y-1">
                            <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                                IFSC / Routing Code
                                {(ifsc || '').length > 0 && <CopyButton value={ifsc || ''} />}
                            </label>
                            <div className="relative">
                                <input
                                    type="text"
                                    value={ifsc || ''}
                                    onChange={e => setIfsc?.(e.target.value.toUpperCase())}
                                    className={`w-full px-5 py-4 bg-white dark:bg-slate-900 border rounded-2xl outline-none focus:ring-2 font-bold text-slate-800 dark:text-white transition-all ${
                                        ifscStatus === 'valid' ? 'border-emerald-300 focus:ring-emerald-500/20 focus:border-emerald-500' :
                                        ifscStatus === 'invalid' ? 'border-red-300 focus:ring-red-500/20 focus:border-red-500' :
                                        'border-slate-200 dark:border-slate-800 focus:ring-amber-500/20 focus:border-amber-500'
                                    }`}
                                    placeholder="e.g. HDFC0001234"
                                />
                                {ifscStatus === 'valid' && (
                                    <div className="absolute right-4 top-1/2 -translate-y-1/2">
                                        <ShieldCheck className="w-5 h-5 text-emerald-500" />
                                    </div>
                                )}
                            </div>
                            <ValidationIndicator status={ifscStatus} label="IFSC" />
                        </div>
                    </div>
                </div>

                <div className="mt-8 p-6 bg-amber-50/30 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-800 rounded-[2rem] flex flex-col md:flex-row items-center gap-6">
                    <div className="w-16 h-16 bg-white dark:bg-slate-800 rounded-2xl shadow-sm flex items-center justify-center shrink-0">
                        <Landmark className="w-8 h-8 text-amber-500" />
                    </div>
                    <div className="flex-1 text-center md:text-left">
                        <p className="text-sm font-black text-slate-800 dark:text-white leading-none">Print on Sales Invoices</p>
                        <p className="text-xs text-slate-500 mt-1 font-medium leading-relaxed">By default, these banking details will be printed on the footer of all Digitally Generated GST Invoices to facilitate direct bank transfers from your clients.</p>
                    </div>
                    <div className="flex items-center gap-3 bg-white dark:bg-slate-800 p-1.5 rounded-xl border border-slate-100 dark:border-slate-700">
                        <span className="text-[10px] font-black text-slate-400 ml-3">STATUS</span>
                        <div className="px-4 py-1.5 bg-emerald-500 text-white rounded-lg text-[10px] font-black tracking-widest">ENABLED</div>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default FinanceTab;

import React from 'react';
import { Calculator, Store, Landmark, FileText, CheckCircle2, CreditCard } from 'lucide-react';
import { FinanceTabProps } from './types';

const FinanceTab: React.FC<FinanceTabProps> = ({
    taxMode, setTaxMode, gstin, setGstin, pan, setPan,
    bankName, setBankName, accNo, setAccNo, ifsc, setIfsc, accountHolderName, setAccountHolderName
}) => {
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
                            </label>
                            <input
                                type="text"
                                value={gstin || ''}
                                onChange={e => setGstin?.(e.target.value)}
                                className="w-full px-4 py-3.5 bg-slate-50/50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-black text-sm text-slate-700 dark:text-white"
                                placeholder="e.g. 29ABCDE1234F1Z5"
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                                <CreditCard className="w-3 h-3 text-indigo-500" /> Permanent Account (PAN)
                            </label>
                            <input
                                type="text"
                                value={pan || ''}
                                onChange={e => setPan?.(e.target.value)}
                                className="w-full px-4 py-3.5 bg-slate-50/50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-black text-sm text-slate-700 dark:text-white"
                                placeholder="e.g. ABCDE1234F"
                            />
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

                <div className="grid md:grid-cols-2 gap-8">
                    <div className="space-y-6">
                        <div className="space-y-1">
                            <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-widest ml-1">Official Bank Name</label>
                            <input type="text" value={bankName || ''} onChange={e => setBankName?.(e.target.value)} className="w-full px-5 py-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 font-bold text-slate-800 dark:text-white" placeholder="e.g. HDFC Bank" />
                        </div>
                        <div className="space-y-1">
                            <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-widest ml-1">IFSC / Routing Code</label>
                            <input type="text" value={ifsc || ''} onChange={e => setIfsc?.(e.target.value)} className="w-full px-5 py-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 font-bold text-slate-800 dark:text-white" placeholder="e.g. HDFC0001234" />
                        </div>
                    </div>
                    <div className="space-y-6">
                        <div className="space-y-1">
                            <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-widest ml-1">Account Holder Name</label>
                            <input type="text" value={accountHolderName || ''} onChange={e => setAccountHolderName?.(e.target.value)} className="w-full px-5 py-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 font-bold text-slate-800 dark:text-white" />
                        </div>
                        <div className="space-y-1">
                            <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-widest ml-1">Corporate Account Number</label>
                            <input type="text" value={accNo || ''} onChange={e => setAccNo?.(e.target.value)} className="w-full px-5 py-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 font-bold text-slate-800 dark:text-white tracking-widest" placeholder="e.g. 50100..." />
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

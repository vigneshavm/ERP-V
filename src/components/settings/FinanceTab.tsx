import React from 'react';
import { Calculator, Store } from 'lucide-react';
import { TaxMode } from '../../types/common';

interface FinanceTabProps {
    taxMode: TaxMode;
    setTaxMode: (m: TaxMode) => void;
    gstin: string;
    setGstin: (val: string) => void;
    pan: string;
    setPan: (val: string) => void;
    bankName: string;
    setBankName: (val: string) => void;
    accNo: string;
    setAccNo: (val: string) => void;
    ifsc: string;
    setIfsc: (val: string) => void;
    accountHolderName: string;
    setAccountHolderName: (val: string) => void;
}

const FinanceTab: React.FC<FinanceTabProps> = ({
    taxMode, setTaxMode, gstin, setGstin, pan, setPan,
    bankName, setBankName, accNo, setAccNo, ifsc, setIfsc, accountHolderName, setAccountHolderName
}) => {
    return (
        <div className="p-6 md:p-8 space-y-8">
            <div>
                <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-6 flex items-center gap-2">
                    <Calculator className="w-5 h-5 text-indigo-500" /> Tax & Pricing
                </h3>
                <div className="grid md:grid-cols-2 gap-8">
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-3">Default Tax Logic</label>
                        <div className="flex bg-slate-100 dark:bg-slate-900/50 p-1.5 rounded-xl border border-slate-200 dark:border-slate-700">
                            <button onClick={() => setTaxMode('EXCLUSIVE')} className={`flex-1 py-3 text-sm font-bold rounded-lg transition-all ${taxMode === 'EXCLUSIVE' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'}`}>
                                Exclusive (+ Tax)
                            </button>
                            <button onClick={() => setTaxMode('INCLUSIVE')} className={`flex-1 py-3 text-sm font-bold rounded-lg transition-all ${taxMode === 'INCLUSIVE' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'}`}>
                                Inclusive (Inc. Tax)
                            </button>
                        </div>
                        <p className="text-xs text-slate-400 mt-2">New products will use this default unless specified otherwise.</p>
                    </div>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-2">GSTIN / VAT Number</label>
                            <input type="text" value={gstin} onChange={e => setGstin(e.target.value)} className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white" placeholder="e.g. 29ABCDE1234F1Z5" />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-2">PAN Number</label>
                            <input type="text" value={pan} onChange={e => setPan(e.target.value)} className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white" placeholder="e.g. ABCDE1234F" />
                        </div>
                    </div>
                </div>
            </div>
            <div className="pt-6 border-t border-slate-100 dark:border-slate-700">
                <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-6 flex items-center gap-2">
                    <Store className="w-5 h-5 text-indigo-500" /> Banking Details (For Invoices)
                </h3>
                <div className="grid md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Bank Name</label>
                        <input type="text" value={bankName} onChange={e => setBankName(e.target.value)} className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white" placeholder="e.g. HDFC Bank" />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Account Number</label>
                        <input type="text" value={accNo} onChange={e => setAccNo(e.target.value)} className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white" placeholder="e.g. 50100..." />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-2">IFSC / Swift Code</label>
                        <input type="text" value={ifsc} onChange={e => setIfsc(e.target.value)} className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white" placeholder="e.g. HDFC0001234" />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Account Holder Name</label>
                        <input type="text" value={accountHolderName} onChange={e => setAccountHolderName(e.target.value)} className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white" />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default FinanceTab;

import React from 'react';
import { Printer, FileText, Hash } from 'lucide-react';
import { PrintSettingsTabProps } from './types';

const PrintSettingsTab: React.FC<PrintSettingsTabProps> = ({ printSettings, setPrintSettings }) => {
    return (
        <div className="p-6 space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="p-6 bg-indigo-50/50 dark:bg-indigo-900/10 border border-indigo-100 dark:border-indigo-800 rounded-sm flex items-start gap-5">
                <div className="w-12 h-12 rounded-sm bg-white dark:bg-slate-800 shadow-sm flex items-center justify-center shrink-0">
                    <Printer className="w-6 h-6 text-primary" />
                </div>
                <div>
                    <p className="text-sm font-black text-indigo-800 dark:text-indigo-200">Bill / Receipt Print Layout</p>
                    <p className="text-xs text-primary dark:text-primary mt-1 leading-relaxed max-w-2xl">
                        Controls the header and footer text printed on every bill/receipt, and how Goods Receipt Note (GRN) numbers are generated.
                    </p>
                </div>
            </div>

            <section>
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center">
                        <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-slate-800 dark:text-white leading-none">Bill Header & Footer</h3>
                        <p className="text-xs text-slate-500 font-medium mt-1">Printed at the top and bottom of every bill/receipt</p>
                    </div>
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                    <div>
                        <label className="text-xs font-black text-slate-500 uppercase tracking-widest mb-1 block">Header Text</label>
                        <textarea
                            value={printSettings.billHeaderText}
                            onChange={(e) => setPrintSettings(prev => ({ ...prev, billHeaderText: e.target.value }))}
                            rows={3}
                            placeholder="e.g. GST Regd. No: 33ABCDE1234F1Z5"
                            className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-sm outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white shadow-sm resize-none text-sm"
                        />
                    </div>
                    <div>
                        <label className="text-xs font-black text-slate-500 uppercase tracking-widest mb-1 block">Footer Text</label>
                        <textarea
                            value={printSettings.billFooterText}
                            onChange={(e) => setPrintSettings(prev => ({ ...prev, billFooterText: e.target.value }))}
                            rows={3}
                            placeholder="e.g. Thank you for your business!"
                            className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-sm outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white shadow-sm resize-none text-sm"
                        />
                    </div>
                </div>
            </section>

            <section>
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-xl bg-orange-50 dark:bg-orange-900/20 flex items-center justify-center">
                        <Hash className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-slate-800 dark:text-white leading-none">GRN Numbering</h3>
                        <p className="text-xs text-slate-500 font-medium mt-1">Controls how Goods Receipt Note numbers are generated</p>
                    </div>
                </div>
                <div className="grid md:grid-cols-3 gap-4">
                    <div>
                        <label className="text-xs font-black text-slate-500 uppercase tracking-widest mb-1 block">Mode</label>
                        <select
                            value={printSettings.grnNumberingMode}
                            onChange={(e) => setPrintSettings(prev => ({ ...prev, grnNumberingMode: e.target.value as 'AUTO' | 'MANUAL' }))}
                            className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-sm outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white shadow-sm text-sm"
                        >
                            <option value="AUTO">Auto-generate</option>
                            <option value="MANUAL">Manual entry</option>
                        </select>
                    </div>
                    <div>
                        <label className="text-xs font-black text-slate-500 uppercase tracking-widest mb-1 block">Prefix</label>
                        <input
                            type="text"
                            value={printSettings.grnNumberingPrefix}
                            onChange={(e) => setPrintSettings(prev => ({ ...prev, grnNumberingPrefix: e.target.value }))}
                            placeholder="GRN"
                            className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-sm outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white shadow-sm text-sm"
                        />
                    </div>
                    <div>
                        <label className="text-xs font-black text-slate-500 uppercase tracking-widest mb-1 block">Reset Sequence</label>
                        <select
                            value={printSettings.grnNumberingReset}
                            onChange={(e) => setPrintSettings(prev => ({ ...prev, grnNumberingReset: e.target.value as 'NEVER' | 'YEARLY' | 'MONTHLY' }))}
                            className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-sm outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white shadow-sm text-sm"
                        >
                            <option value="NEVER">Never</option>
                            <option value="YEARLY">Every year</option>
                            <option value="MONTHLY">Every month</option>
                        </select>
                    </div>
                </div>
                <p className="text-[10px] text-slate-400 font-medium mt-3">
                    Note: this setting is stored on your tenant now; GRN number generation itself still uses its existing date-based scheme (see GRNController) and is not yet wired to read this prefix/reset mode.
                </p>
            </section>
        </div>
    );
};

export default PrintSettingsTab;

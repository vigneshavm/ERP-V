import React, { ChangeEvent } from 'react';
import { Upload, Loader2, AlertCircle, LayoutTemplate, CheckCircle2, Zap } from 'lucide-react';
import { BranchId } from '../../types/common';
import { Tenant } from '../../types/tenant';

interface PurchaseUploadProps {
    handleFileUpload: (e: ChangeEvent<HTMLInputElement>) => void;
    isProcessing: boolean;
    error: string | null;
    targetBranch: BranchId;
    setTargetBranch: (branch: BranchId) => void;
    role: string;
    currentBranch: string;
    tenants: Tenant[];
    tenantId: string | undefined;
}

const PurchaseUpload: React.FC<PurchaseUploadProps> = ({
    handleFileUpload, isProcessing, error, targetBranch, setTargetBranch, role, currentBranch, tenants, tenantId
}) => {
    return (
        <div className="space-y-6">
            <div className="bg-emerald-50/30 dark:bg-emerald-900/10 p-10 rounded-[2.5rem] border-2 border-emerald-100 dark:border-emerald-800/30 border-dashed text-center transition-all hover:bg-emerald-50 dark:hover:bg-emerald-900/20 group relative overflow-hidden">
                <input
                    type="file"
                    id="invoiceUpload"
                    className="hidden"
                    accept="image/*,application/pdf"
                    onChange={handleFileUpload}
                    disabled={isProcessing}
                />
                <label htmlFor="invoiceUpload" className="cursor-pointer flex flex-col items-center gap-5">
                    <div className={`w-20 h-20 rounded-3xl flex items-center justify-center shadow-xl transition-all ${isProcessing ? 'bg-emerald-600 animate-pulse' : 'bg-white dark:bg-slate-800 group-hover:scale-110'
                        }`}>
                        {isProcessing ?
                            <Loader2 className="w-10 h-10 text-white animate-spin" /> :
                            <Upload className="w-10 h-10 text-emerald-600" />
                        }
                    </div>
                    <div>
                        <h3 className="text-2xl font-black text-slate-800 dark:text-white tracking-tight">
                            {isProcessing ? 'Analyzing Smart Invoice...' : 'AI-Powered Purchase'}
                        </h3>
                        <p className="text-slate-500 dark:text-slate-400 mt-2 text-sm font-medium">
                            {isProcessing ? 'Extracting itemized data using Gemini 1.5...' : 'Drop your supplier invoice to auto-populate inventory.'}
                        </p>
                    </div>
                    {!isProcessing && (
                        <span className="px-8 py-3 bg-emerald-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-200 dark:shadow-none active:scale-95">
                            Browse Invoice
                        </span>
                    )}
                </label>
            </div>

            {error && (
                <div className="p-5 bg-rose-50 dark:bg-rose-900/20 border border-rose-100 dark:border-rose-800/50 rounded-2xl flex items-center gap-4 text-rose-600 dark:text-rose-400 animate-in fade-in slide-in-from-top-4">
                    <div className="w-10 h-10 rounded-xl bg-white dark:bg-slate-800 flex items-center justify-center shrink-0 shadow-sm">
                        <AlertCircle className="w-5 h-5 shadow-sm" />
                    </div>
                    <p className="text-sm font-bold uppercase tracking-wider">{error}</p>
                </div>
            )}

            <div className="p-6 bg-white dark:bg-slate-800/50 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm transition-colors">
                <div className="flex items-center gap-3 mb-5">
                    <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                        <LayoutTemplate className="w-4 h-4 text-emerald-600" />
                    </div>
                    <label className="text-[10px] text-slate-400 uppercase font-black tracking-[0.15em]">Target Branch Selection</label>
                </div>

                <div className="flex flex-wrap gap-3">
                    {(() => {
                        const currentTenant = tenants.find(t => t.id === tenantId);
                        const tenantBranches = currentTenant
                            ? currentTenant.locations.flatMap(loc => loc.branches)
                            : [];

                        const visibleBranches = role === 'Owner'
                            ? tenantBranches
                            : tenantBranches.filter(b => b.id === currentBranch);

                        return visibleBranches.map(b => (
                            <label key={b.id} className={`
                                flex items-center gap-3 px-5 py-3 rounded-2xl border-2 transition-all cursor-pointer
                                ${targetBranch === b.id
                                    ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300'
                                    : 'border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-500'}
                            `}>
                                <input
                                    type="radio"
                                    name="targetBranch"
                                    value={b.id}
                                    checked={targetBranch === b.id || (role !== 'Owner' && currentBranch === b.id)}
                                    onChange={() => role === 'Owner' && setTargetBranch(b.id as BranchId)}
                                    disabled={role !== 'Owner'}
                                    className="hidden"
                                />
                                <span className="text-xs font-black uppercase tracking-wider">{b.name}</span>
                                {targetBranch === b.id && <CheckCircle2 className="w-4 h-4" />}
                            </label>
                        ));
                    })()}
                </div>
            </div>

            <div className="p-6 bg-emerald-600 dark:bg-emerald-500 rounded-[2rem] text-white shadow-xl shadow-emerald-200 dark:shadow-none relative overflow-hidden group">
                <div className="relative z-10 flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center shrink-0">
                        <Zap className="w-5 h-5" />
                    </div>
                    <div>
                        <p className="font-black text-[10px] uppercase tracking-widest opacity-80 mb-1">Intelligent Automation</p>
                        <p className="text-sm font-medium leading-relaxed">
                            Our AI engine will transform this invoice into structured stock data.
                            {role === 'Owner' ? ' You can verify pricing before commitment.' : ' Your submission will enter the Owner Approval Queue.'}
                        </p>
                    </div>
                </div>
                <div className="absolute -right-4 -bottom-4 opacity-10 group-hover:scale-110 transition-transform duration-700">
                    <Zap className="w-24 h-24" />
                </div>
            </div>
        </div>
    );
};

export default PurchaseUpload;

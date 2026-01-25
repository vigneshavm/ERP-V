import React, { ChangeEvent } from 'react';
import { Upload, Loader2, AlertCircle } from 'lucide-react';
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
            <div className="bg-white dark:bg-slate-800 p-8 rounded-xl border border-slate-200 dark:border-slate-700 border-dashed text-center transition-colors">
                <input
                    type="file"
                    id="invoiceUpload"
                    className="hidden"
                    accept="image/*,application/pdf"
                    onChange={handleFileUpload}
                />
                <label htmlFor="invoiceUpload" className="cursor-pointer flex flex-col items-center gap-4">
                    <div className="w-16 h-16 bg-indigo-50 dark:bg-indigo-600/20 text-indigo-600 dark:text-indigo-500 rounded-full flex items-center justify-center">
                        {isProcessing ? <Loader2 className="w-8 h-8 animate-spin" /> : <Upload className="w-8 h-8" />}
                    </div>
                    <div>
                        <h3 className="text-xl font-bold text-slate-800 dark:text-slate-200">Upload Supplier Invoice</h3>
                        <p className="text-slate-500 dark:text-slate-400 mt-2 text-sm">Supports IMG, PDF. Powered by Gemini AI.</p>
                    </div>
                    <span className="px-4 py-2 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-sm hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors">Select File</span>
                </label>
            </div>

            {error && (
                <div className="p-4 bg-red-100 dark:bg-red-900/30 border border-red-200 dark:border-red-500/50 rounded-lg flex items-center gap-3 text-red-700 dark:text-red-200">
                    <AlertCircle className="w-5 h-5" />
                    {error}
                </div>
            )}

            <div className="p-4 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 transition-colors">
                <label className="text-xs text-slate-500 uppercase font-bold block mb-2">Target Branch for this Upload</label>
                <div className="flex flex-wrap gap-4">
                    {(() => {
                        const currentTenant = tenants.find(t => t.id === tenantId);
                        const tenantBranches = currentTenant
                            ? currentTenant.locations.flatMap(loc => loc.branches)
                            : [];

                        const visibleBranches = role === 'Owner'
                            ? tenantBranches
                            : tenantBranches.filter(b => b.id === currentBranch);

                        return visibleBranches.map(b => (
                            <label key={b.id} className={`flex items-center gap-2 ${role === 'Owner' ? 'cursor-pointer' : 'cursor-default'}`}>
                                <input
                                    type="radio"
                                    name="targetBranch"
                                    value={b.id}
                                    checked={targetBranch === b.id || (role !== 'Owner' && currentBranch === b.id)}
                                    onChange={() => role === 'Owner' && setTargetBranch(b.id as BranchId)}
                                    disabled={role !== 'Owner'}
                                    className="text-indigo-600 focus:ring-indigo-500 bg-slate-100 dark:bg-slate-700 border-slate-300 dark:border-slate-600 disabled:opacity-50"
                                />
                                <span className="text-slate-700 dark:text-slate-300 text-sm">{b.name}</span>
                            </label>
                        ));
                    })()}
                </div>
            </div>

            <div className="p-4 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-500/30 rounded-lg text-indigo-800 dark:text-indigo-200 text-sm transition-colors">
                <p className="font-bold mb-1">AI Processing</p>
                <p>The system will automatically extract items, quantities, and costs. {role === 'Owner' ? 'You will review and set selling prices.' : 'Your upload will be pending Owner approval.'}</p>
            </div>
        </div>
    );
};

export default PurchaseUpload;

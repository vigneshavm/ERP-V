import React, { ChangeEvent, useState } from 'react';
import {
    Upload, Loader2, AlertCircle, LayoutTemplate, CheckCircle2, Zap,
    FileSpreadsheet, Download, Table, Trash2, Save, FileText, AlertTriangle
} from 'lucide-react';
import { BranchId } from "../../types/common";
import { Tenant } from "../../types/tenant";
import {
    parsePurchaseFile,
    validatePurchaseData,
    groupPurchases,
    downloadPurchaseTemplate,
    ValidationResult
} from '../../utils/purchaseUpload.utils';
import { toast } from 'react-toastify';
import api from '../../services/api';
import { useNavigate } from 'react-router-dom';

interface PurchaseUploadProps {
    handleFileUpload?: (e: ChangeEvent<HTMLInputElement>) => void;
    isProcessing?: boolean;
    error?: string | null;
    targetBranch?: BranchId;
    setTargetBranch?: (branch: BranchId) => void;
    role?: string;
    currentBranch?: string;
    tenants?: Tenant[];
    tenantId?: string | undefined;
}

const PurchaseUpload: React.FC<PurchaseUploadProps> = ({
    handleFileUpload = () => { },
    isProcessing: aiProcessing = false,
    error: aiError = null,
    targetBranch = '',
    setTargetBranch = () => { },
    role = 'Staff',
    currentBranch = '',
    tenants = [],
    tenantId = ''
}) => {
    const navigate = useNavigate();
    const [mode, setMode] = useState<'AI' | 'BULK'>('AI');
    const [isBulkProcessing, setIsBulkProcessing] = useState(false);
    const [bulkResults, setBulkResults] = useState<ValidationResult[]>([]);
    const [stagedPurchases, setStagedPurchases] = useState<any[]>([]);
    const [_bulkError, setBulkError] = useState<string | null>(null);

    const handleBulkFileSelection = async (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsBulkProcessing(true);
        setBulkError(null);
        try {
            const rawData = await parsePurchaseFile(file);
            const validation = validatePurchaseData(rawData);
            setBulkResults(validation);

            const grouped = groupPurchases(validation.filter(v => v.isValid));
            setStagedPurchases(grouped);

            if (validation.some(v => !v.isValid)) {
                toast.warning(`${validation.filter(v => !v.isValid).length} rows have validation errors.`);
            }
        } catch (err: any) {
            setBulkError(err.message);
            toast.error(err.message);
        } finally {
            setIsBulkProcessing(false);
        }
    };

    const processBulkUpload = async () => {
        if (stagedPurchases.length === 0) return toast.error('No valid records to upload');

        setIsBulkProcessing(true);
        try {
            let successCount = 0;
            let failCount = 0;

            // Process in sequence to avoid overwhelming the server and for better rollback/error tracking
            for (const purchase of stagedPurchases) {
                try {
                    const payload = {
                        ...purchase,
                        status: 'COMPLETED',
                        receipt_status: 'Received',
                        payment_terms: 'Net 30',
                        branch_id: targetBranch || currentBranch
                    };
                    await api.post('/purchases', payload);
                    successCount++;
                } catch (err) {
                    failCount++;
                    console.error('Failed to upload purchase:', purchase.details.invoice_no, err);
                }
            }

            toast.success(`Successfully uploaded ${successCount} purchases. ${failCount} failed.`);
            if (failCount === 0) {
                navigate('/tenant/purchase');
            } else {
                // Remove successful ones and keep failed ones for review
                // (In a real app, we'd need more detailed error mapping per item)
                setStagedPurchases([]);
                setBulkResults([]);
            }
        } catch (err: any) {
            toast.error('Bulk upload failed: ' + err.message);
        } finally {
            setIsBulkProcessing(false);
        }
    };

    const removeBulkRow = (index: number) => {
        const newResults = bulkResults.filter((_, i) => i !== index);
        setBulkResults(newResults);
        const grouped = groupPurchases(newResults.filter(v => v.isValid));
        setStagedPurchases(grouped);
    };

    return (
        <div className="space-y-6 max-w-7xl mx-auto">
            {/* Mode Switcher */}
            <div className="flex bg-slate-100 dark:bg-slate-800/50 p-1.5 rounded-sm w-fit mx-auto shadow-inner border border-slate-200 dark:border-slate-700">
                <button
                    onClick={() => setMode('AI')}
                    className={`flex items-center gap-2 px-8 py-3 rounded-sm text-sm font-black transition-all ${mode === 'AI'
                        ? 'bg-white dark:bg-slate-700 text-primary shadow-md'
                        : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
                        }`}
                >
                    <Zap className={`w-4 h-4 ${mode === 'AI' ? 'fill-indigo-600' : ''}`} />
                    SMART AI
                </button>
                <button
                    onClick={() => setMode('BULK')}
                    className={`flex items-center gap-2 px-8 py-3 rounded-sm text-sm font-black transition-all ${mode === 'BULK'
                        ? 'bg-white dark:bg-slate-700 text-emerald-600 shadow-md'
                        : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
                        }`}
                >
                    <FileSpreadsheet className="w-4 h-4" />
                    BULK IMPORT
                </button>
            </div>

            {mode === 'AI' ? (
                /* AI UPLOAD VIEW (Original Functionality Enhanced) */
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="bg-emerald-50/30 dark:bg-emerald-900/10 p-10 rounded-[2.5rem] border-2 border-emerald-100 dark:border-emerald-800/30 border-dashed text-center transition-all hover:bg-emerald-50 dark:hover:bg-emerald-900/20 group relative overflow-hidden">
                        <input
                            type="file"
                            id="invoiceUpload"
                            className="hidden"
                            accept="image/*,application/pdf"
                            onChange={handleFileUpload}
                            disabled={aiProcessing}
                        />
                        <label htmlFor="invoiceUpload" className="cursor-pointer flex flex-col items-center gap-5">
                            <div className={`w-20 h-20 rounded-sm flex items-center justify-center shadow-xl transition-all ${aiProcessing ? 'bg-emerald-600 animate-pulse' : 'bg-white dark:bg-slate-800 group-hover:scale-110'
                                }`}>
                                {aiProcessing ?
                                    <Loader2 className="w-10 h-10 text-white animate-spin" /> :
                                    <Upload className="w-10 h-10 text-emerald-600" />
                                }
                            </div>
                            <div>
                                <h3 className="text-2xl font-black text-slate-800 dark:text-white tracking-tight">
                                    {aiProcessing ? 'Analyzing Smart Invoice...' : 'AI-Powered Purchase'}
                                </h3>
                                <p className="text-slate-500 dark:text-slate-400 mt-2 text-sm font-medium">
                                    {aiProcessing ? 'Extracting itemized data using Gemini 1.5...' : 'Drop your supplier invoice to auto-populate inventory.'}
                                </p>
                            </div>
                            {!aiProcessing && (
                                <span className="px-8 py-3 bg-emerald-600 text-white rounded-sm text-[10px] font-black uppercase tracking-[0.2em] hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-200 dark:shadow-none active:scale-95">
                                    Browse Invoice
                                </span>
                            )}
                        </label>
                    </div>

                    {(aiError) && (
                        <div className="p-5 bg-rose-50 dark:bg-rose-900/20 border border-rose-100 dark:border-rose-800/50 rounded-sm flex items-center gap-4 text-rose-600 dark:text-danger animate-in fade-in slide-in-from-top-4">
                            <div className="w-10 h-10 rounded-xl bg-white dark:bg-slate-800 flex items-center justify-center shrink-0 shadow-sm">
                                <AlertCircle className="w-5 h-5 shadow-sm" />
                            </div>
                            <p className="text-sm font-bold uppercase tracking-wider">{aiError}</p>
                        </div>
                    )}
                </div>
            ) : (
                /* BULK IMPORT VIEW */
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Control Panel */}
                        <div className="lg:col-span-1 space-y-6">
                            <div className="bg-white dark:bg-slate-800 p-6 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm">
                                <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                                    <Download className="w-3.5 h-3.5" /> Getting Started
                                </h4>
                                <p className="text-sm text-slate-600 dark:text-slate-400 mb-6 font-medium">
                                    Download our official template to ensure your data format matches our system.
                                </p>
                                <button
                                    onClick={downloadPurchaseTemplate}
                                    className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-slate-900 dark:bg-slate-700 text-white rounded-sm text-xs font-black uppercase tracking-wider hover:bg-slate-800 transition-all shadow-lg active:scale-95"
                                >
                                    <FileSpreadsheet className="w-4 h-4" />
                                    Download Template
                                </button>
                            </div>

                            <div className="bg-white dark:bg-slate-800 p-6 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm">
                                <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                                    <Upload className="w-3.5 h-3.5" /> Upload File
                                </h4>
                                <input
                                    type="file"
                                    id="bulkUpload"
                                    className="hidden"
                                    accept=".xlsx, .csv"
                                    onChange={handleBulkFileSelection}
                                    disabled={isBulkProcessing}
                                />
                                <label htmlFor="bulkUpload" className="cursor-pointer group">
                                    <div className="p-8 border-2 border-dashed border-emerald-100 dark:border-emerald-800/30 rounded-[1.5rem] text-center group-hover:bg-emerald-50/50 dark:group-hover:bg-emerald-900/10 transition-all">
                                        <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900/30 rounded-sm flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
                                            {isBulkProcessing ? <Loader2 className="w-6 h-6 text-emerald-600 animate-spin" /> : <Upload className="w-6 h-6 text-emerald-600" />}
                                        </div>
                                        <p className="text-xs font-bold text-slate-600 dark:text-slate-400">Click to upload .xlsx or .csv</p>
                                    </div>
                                </label>
                            </div>
                        </div>

                        {/* Stats & Actions */}
                        <div className="lg:col-span-2 bg-white dark:bg-slate-800 p-8 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col justify-between">
                            <div className="grid grid-cols-3 gap-6">
                                <div className="p-5 bg-slate-50 dark:bg-slate-900/50 rounded-sm border border-slate-100 dark:border-slate-700/50">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Rows</p>
                                    <p className="text-2xl font-black text-slate-900 dark:text-white">{bulkResults.length}</p>
                                </div>
                                <div className="p-5 bg-emerald-50 dark:bg-emerald-900/10 rounded-sm border border-emerald-100 dark:border-emerald-900/20">
                                    <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-1">Valid Records</p>
                                    <p className="text-2xl font-black text-emerald-700 dark:text-success">{stagedPurchases.length}</p>
                                </div>
                                <div className="p-5 bg-rose-50 dark:bg-rose-900/10 rounded-sm border border-rose-100 dark:border-rose-900/20">
                                    <p className="text-[10px] font-black text-rose-600 uppercase tracking-widest mb-1">Errors</p>
                                    <p className="text-2xl font-black text-rose-700 dark:text-danger">{bulkResults.filter(r => !r.isValid).length}</p>
                                </div>
                            </div>

                            <div className="mt-8 pt-8 border-t border-slate-50 dark:border-slate-700 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className={`w-3 h-3 rounded-full ${stagedPurchases.length > 0 ? 'bg-emerald-500' : 'bg-slate-300'} animate-pulse`} />
                                    <p className="text-xs font-bold text-slate-500">
                                        {stagedPurchases.length > 0
                                            ? `Ready to process ${stagedPurchases.length} distinct purchases`
                                            : 'Waiting for valid file upload...'}
                                    </p>
                                </div>
                                <button
                                    onClick={processBulkUpload}
                                    disabled={stagedPurchases.length === 0 || isBulkProcessing}
                                    className={`flex items-center gap-3 px-8 py-4 rounded-sm text-xs font-black uppercase tracking-widest transition-all ${stagedPurchases.length > 0 && !isBulkProcessing
                                        ? 'bg-emerald-600 text-white shadow-xl shadow-emerald-200 dark:shadow-none hover:bg-emerald-700 active:scale-95'
                                        : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                                        }`}
                                >
                                    {isBulkProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                    Commit Bulk Entry
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Preview Table */}
                    {bulkResults.length > 0 && (
                        <div className="bg-white dark:bg-slate-800 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-500">
                            <div className="px-8 py-6 border-b border-slate-50 dark:border-slate-700 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/30">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
                                        <Table className="w-5 h-5 text-primary" />
                                    </div>
                                    <div>
                                        <h4 className="font-black text-slate-900 dark:text-white text-lg tracking-tight">Data Preview</h4>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Verify records before commit</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => { setBulkResults([]); setStagedPurchases([]); }}
                                    className="p-3 text-danger hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-sm transition-colors"
                                    title="Clear Data"
                                >
                                    <Trash2 className="w-5 h-5" />
                                </button>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-slate-50 dark:bg-slate-900/50">
                                            <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center w-16">Row</th>
                                            <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                                            <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Invoice</th>
                                            <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Product</th>
                                            <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Qty</th>
                                            <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Rate</th>
                                            <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center w-20">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50 dark:divide-slate-700">
                                        {bulkResults.map((res, idx) => (
                                            <tr key={idx} className={`group hover:bg-slate-50 dark:hover:bg-slate-900/30 transition-colors ${!res.isValid ? 'bg-rose-50/30 dark:bg-rose-900/5' : ''}`}>
                                                <td className="px-6 py-4 text-xs font-black text-slate-300 text-center">{idx + 1}</td>
                                                <td className="px-6 py-4">
                                                    {res.isValid ? (
                                                        <div className="flex items-center gap-2 text-emerald-600">
                                                            <CheckCircle2 className="w-4 h-4" />
                                                            <span className="text-[10px] font-black uppercase">Ready</span>
                                                        </div>
                                                    ) : (
                                                        <div className="flex flex-col gap-1">
                                                            <div className="flex items-center gap-2 text-rose-600">
                                                                <AlertTriangle className="w-4 h-4" />
                                                                <span className="text-[10px] font-black uppercase">Fix Required</span>
                                                            </div>
                                                            {res.errors.map((err, ei) => (
                                                                <p key={ei} className="text-[9px] text-danger font-medium leading-tight">• {err}</p>
                                                            ))}
                                                        </div>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-2">
                                                        <FileText className="w-4 h-4 text-slate-400" />
                                                        <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase">{res.row['Invoice No']}</span>
                                                    </div>
                                                    <p className="text-[10px] text-slate-400 mt-1">{res.row['Date']}</p>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{res.row['Product Name'] || 'Unknown'}</span>
                                                    <p className="text-[10px] text-slate-400 mt-1 uppercase tracking-wider">{res.row['SKU'] || 'No SKU'}</p>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <span className="text-sm font-black text-slate-900 dark:text-white">{res.row['Quantity']}</span>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <span className="text-xs font-black text-emerald-600 dark:text-success">₹{parseFloat(String(res.row['Rate'] || 0)).toLocaleString()}</span>
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    <button
                                                        onClick={() => removeBulkRow(idx)}
                                                        className="p-2 text-slate-300 hover:text-danger transition-colors"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Target Branch remains at bottom for both */}
            <div className="p-6 bg-white dark:bg-slate-800/50 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm transition-colors mt-8">
                <div className="flex items-center gap-3 mb-5">
                    <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                        <LayoutTemplate className="w-4 h-4 text-emerald-600" />
                    </div>
                    <label className="text-[10px] text-slate-400 uppercase font-black tracking-[0.15em]">Target Branch Selection</label>
                </div>

                <div className="flex flex-wrap gap-3">
                    {(() => {
                        const currentTenant = tenants.find(t => t.id === tenantId);
                        const tenantBranches = currentTenant?.locations
                            ? currentTenant.locations.flatMap(loc => loc.branches)
                            : [];

                        const visibleBranches = role === 'Owner'
                            ? tenantBranches
                            : tenantBranches.filter(b => b.id === currentBranch);

                        return visibleBranches.map(b => (
                            <label key={b.id} className={`
                                flex items-center gap-3 px-5 py-3 rounded-sm border-2 transition-all cursor-pointer
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

            {/* AI Banner - only show if mode is AI */}
            {mode === 'AI' && (
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
            )}
        </div>
    );
};

export default PurchaseUpload;

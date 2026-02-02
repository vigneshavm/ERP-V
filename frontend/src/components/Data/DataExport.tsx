import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../../redux/store';
import {
    Download,
    FileSpreadsheet,
    FileText,
    File,
    Calendar,
    CheckCircle,
    XCircle,
    Loader2,
    Trash2,
    Check,
    Square,
    Package,
    Users,
    ShoppingCart,
    ArrowRight,
    DollarSign,
    BookOpen,
    Receipt,
    CreditCard,
    AlertTriangle,
    Clock,
    Zap,
    ShieldCheck,
    Briefcase,
    Globe
} from 'lucide-react';

type ExportFormat = 'XLSX' | 'CSV' | 'PDF' | 'TALLY_XML' | 'GSTN_JSON';
type ExportStatus = 'PROCESSING' | 'READY' | 'FAILED';

interface ExportModule {
    id: string;
    label: string;
    icon: React.ElementType;
    hasDateFilter: boolean;
    description: string;
}

const EXPORT_MODULES: ExportModule[] = [
    { id: 'items', label: 'Inventory Master', icon: Package, hasDateFilter: false, description: 'HSN, Price lists, and Stock levels' },
    { id: 'parties', label: 'Party Ledgers', icon: Users, hasDateFilter: false, description: 'Customer & Vendor profiles with GSTIN' },
    { id: 'sales', label: 'Sales Vouchers', icon: ShoppingCart, hasDateFilter: true, description: 'B2B/B2C Invoices for GST filing' },
    { id: 'purchase', label: 'Purchase Entry', icon: ArrowRight, hasDateFilter: true, description: 'Inward supplies and ITC tracking' },
    { id: 'ledger', label: 'General Ledger', icon: BookOpen, hasDateFilter: true, description: 'Complete accounting audit trail' },
    { id: 'gst_reports', label: 'Statutory Reports', icon: Receipt, hasDateFilter: true, description: 'GSTR-1, 2, 3B ready datasets' },
];

const DataExport: React.FC = () => {
    const { user } = useSelector((state: RootState) => state.auth);
    const { tenants } = useSelector((state: RootState) => state.tenant);
    const activeTenant = tenants.find(t => t.id === user?.tenantId);

    const [selectedModules, setSelectedModules] = useState<string[]>([]);
    const [format, setFormat] = useState<ExportFormat>('XLSX');
    const [branchMode, setBranchMode] = useState<'SINGLE' | 'CONSOLIDATED'>('SINGLE');

    const toggleModule = (id: string) => {
        setSelectedModules(prev => prev.includes(id) ? prev.filter(m => m !== id) : [...prev, id]);
    };

    return (
        <div className="space-y-6 animate-fade-in text-slate-900 dark:text-white">
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
                <div>
                    <h2 className="text-xl font-black uppercase tracking-tight flex items-center gap-2">
                        <Download className="w-5 h-5 text-indigo-500" />
                        Statutory Data Export Engine
                    </h2>
                    <p className="text-xs text-slate-500 font-medium select-none italic">Generating audit-ready datasets for Tally, GSTN, and CA review.</p>
                </div>
                <div className="flex bg-slate-100 dark:bg-slate-800 p-1.5 rounded-xl gap-1">
                    <button
                        onClick={() => setBranchMode('SINGLE')}
                        className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${branchMode === 'SINGLE' ? 'bg-white dark:bg-slate-700 text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        Current Branch
                    </button>
                    <button
                        onClick={() => setBranchMode('CONSOLIDATED')}
                        className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${branchMode === 'CONSOLIDATED' ? 'bg-white dark:bg-slate-700 text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        Consolidated
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                <div className="lg:col-span-3 space-y-6">
                    {/* Module Grid */}
                    <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 p-8 shadow-sm">
                        <div className="flex items-center justify-between mb-8">
                            <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">Export Scope</h3>
                            <button onClick={() => setSelectedModules(EXPORT_MODULES.map(m => m.id))} className="text-[10px] font-black text-indigo-500 uppercase tracking-widest hover:underline">Select All Universe</button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {EXPORT_MODULES.map((mod) => {
                                const isSelected = selectedModules.includes(mod.id);
                                return (
                                    <button
                                        key={mod.id}
                                        onClick={() => toggleModule(mod.id)}
                                        className={`p-6 rounded-[2rem] border-2 transition-all text-left relative overflow-hidden group ${isSelected ? 'border-indigo-500 bg-indigo-50/30 dark:bg-indigo-900/20' : 'border-slate-100 dark:border-slate-800 hover:border-slate-200'}`}
                                    >
                                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-4 transition-colors ${isSelected ? 'bg-indigo-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-400 group-hover:bg-slate-200'}`}>
                                            <mod.icon className="w-6 h-6" />
                                        </div>
                                        <p className={`text-sm font-black mb-1 ${isSelected ? 'text-indigo-900 dark:text-indigo-200' : 'text-slate-900 dark:text-white'}`}>{mod.label}</p>
                                        <p className="text-[10px] font-medium text-slate-500 leading-tight">{mod.description}</p>
                                        {isSelected && <div className="absolute top-4 right-4"><CheckCircle className="w-5 h-5 text-indigo-500" /></div>}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Format & Logic */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 p-8">
                            <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 mb-6">Output Format</h3>
                            <div className="grid grid-cols-2 gap-3">
                                {[
                                    { id: 'XLSX', label: 'MS Excel', ext: '.xlsx' },
                                    { id: 'PDF', label: 'Audit PDF', ext: '.pdf' },
                                    { id: 'TALLY_XML', label: 'Tally Prime', ext: '.xml' },
                                    { id: 'GSTN_JSON', label: 'GSTN Offline', ext: '.json' }
                                ].map((f) => (
                                    <button
                                        key={f.id}
                                        onClick={() => setFormat(f.id as ExportFormat)}
                                        className={`p-4 rounded-2xl border transition-all text-center ${format === f.id ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-900/20 shadow-sm' : 'border-slate-100 dark:border-slate-800'}`}
                                    >
                                        <p className={`text-[11px] font-black uppercase ${format === f.id ? 'text-indigo-600' : 'text-slate-400'}`}>{f.label}</p>
                                        <p className="text-[9px] font-bold text-slate-400 mt-1">{f.ext}</p>
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="bg-slate-900 text-white p-8 rounded-[2.5rem] shadow-2xl relative overflow-hidden flex flex-col justify-center">
                            <div className="absolute top-0 right-0 p-8 opacity-10"><Globe className="w-32 h-32" /></div>
                            <h4 className="text-[10px] font-black uppercase tracking-widest text-indigo-400 mb-6 italic underline decoration-indigo-500 underline-offset-4">Legal Shield</h4>
                            <div className="space-y-4">
                                <label className="flex items-center gap-3 cursor-pointer group">
                                    <div className="w-5 h-5 rounded border border-white/20 flex items-center justify-center p-1 group-hover:border-indigo-500 transition-colors">
                                        <div className="w-full h-full bg-indigo-500 rounded-sm" />
                                    </div>
                                    <span className="text-[10px] font-black uppercase text-slate-300">Mask Sensitive PII</span>
                                </label>
                                <label className="flex items-center gap-3 cursor-pointer group">
                                    <div className="w-5 h-5 rounded border border-white/20 flex items-center justify-center p-1 group-hover:border-indigo-500 transition-colors">
                                        <div className="w-full h-full bg-indigo-500 rounded-sm" />
                                    </div>
                                    <span className="text-[10px] font-black uppercase text-slate-300">Apply Digital Stamp</span>
                                </label>
                                <label className="flex items-center gap-3 cursor-pointer group">
                                    <div className="w-5 h-5 rounded border border-white/20 flex items-center justify-center p-1 group-hover:border-indigo-500 transition-colors">
                                        <div className="w-full h-full bg-indigo-500 rounded-sm" />
                                    </div>
                                    <span className="text-[10px] font-black uppercase text-slate-300">Log to Audit Trail</span>
                                </label>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="bg-white dark:bg-slate-900 p-8 rounded-[3rem] border border-slate-200 dark:border-slate-800 shadow-sm">
                        <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-6">Pre-Export Audit</h4>
                        <div className="space-y-6">
                            <div className="flex items-start gap-4">
                                <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center text-emerald-500 shrink-0">
                                    <ShieldCheck className="w-5 h-5" />
                                </div>
                                <div>
                                    <p className="text-[11px] font-black uppercase mb-1">Unallocated Recs</p>
                                    <p className="text-[10px] font-bold text-emerald-500">ZERO DISCREPANCY</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-4">
                                <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center text-indigo-500 shrink-0">
                                    <Zap className="w-5 h-5" />
                                </div>
                                <div>
                                    <p className="text-[11px] font-black uppercase mb-1">Ledger Balance</p>
                                    <p className="text-[10px] font-bold text-indigo-400">TALLY READY (A+)</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-4">
                                <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center text-amber-500 shrink-0">
                                    <AlertTriangle className="w-5 h-5" />
                                </div>
                                <div>
                                    <p className="text-[11px] font-black uppercase mb-1">GSTIN Missing</p>
                                    <p className="text-[10px] font-bold text-amber-500">4 ENTITIES (FLAGGED)</p>
                                </div>
                            </div>
                        </div>

                        <div className="mt-8 pt-8 border-t border-slate-100 dark:border-slate-800 space-y-4">
                            <div className="flex justify-between items-center bg-slate-50 dark:bg-slate-800/50 p-3 rounded-2xl">
                                <div className="flex items-center gap-3">
                                    <Briefcase className="w-4 h-4 text-slate-400" />
                                    <span className="text-[10px] font-black uppercase text-slate-500">Entity Storage</span>
                                </div>
                                <span className="text-[10px] font-black">12.4 MB</span>
                            </div>
                            <button className="w-full py-4 bg-indigo-600 text-white rounded-[2rem] font-black uppercase tracking-widest text-[10px] hover:bg-indigo-700 shadow-xl shadow-indigo-600/20 active:scale-95 transition-all">
                                Initialize Export
                            </button>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-slate-200 dark:border-slate-800">
                        <div className="flex items-center justify-between mb-4">
                            <h5 className="text-[10px] font-black uppercase tracking-widest">Active Jobs</h5>
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        </div>
                        <div className="space-y-3">
                            <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700">
                                <div className="flex justify-between items-center mb-1">
                                    <span className="text-[9px] font-black uppercase truncate pr-4">GSTR1_JAN2025.xml</span>
                                    <span className="text-[9px] font-black text-indigo-500">88%</span>
                                </div>
                                <div className="w-full h-1 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                                    <div className="w-[88%] h-full bg-indigo-500" />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DataExport;

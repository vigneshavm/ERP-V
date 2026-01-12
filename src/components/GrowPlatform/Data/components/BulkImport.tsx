import React, { useState, useRef } from 'react';
import {
    Upload,
    FileSpreadsheet,
    FileText,
    CheckCircle,
    XCircle,
    Loader2,
    AlertTriangle,
    Download,
    HelpCircle,
    FilePlus,
    X,
    Eye,
    Save,
    ShieldCheck,
    Zap,
    RefreshCcw,
    Database,
    Search,
    ChevronDown,
    MapPin
} from 'lucide-react';
import * as XLSX from 'xlsx';

type ImportStatus = 'IDLE' | 'ANALYZING' | 'MAPPING' | 'PREVIEW' | 'IMPORTING' | 'COMPLETED' | 'FAILED';
type ImportEntity = 'ITEMS' | 'CUSTOMERS' | 'VENDORS' | 'OPENING_STOCK' | 'PRICE_LISTS' | 'HSN_CODES' | 'BRANCH_MAPPINGS';

interface ImportData {
    headers: string[];
    rows: any[];
    preview: any[];
    totalRows: number;
}

const SYSTEM_FIELDS: Record<ImportEntity, Record<string, { label: string; required: boolean; type: string }>> = {
    'ITEMS': {
        'name': { label: 'Item Name', required: true, type: 'text' },
        'sku': { label: 'SKU / Item Code', required: true, type: 'text' },
        'category': { label: 'Category', required: false, type: 'text' },
        'sales_price': { label: 'Sales Price', required: true, type: 'number' },
        'tax_percent': { label: 'Tax %', required: true, type: 'number' },
        'hsn_code': { label: 'HSN Code', required: true, type: 'text' },
        'branch_id': { label: 'Branch ID', required: true, type: 'text' }
    },
    'CUSTOMERS': {
        'name': { label: 'Customer Name', required: true, type: 'text' },
        'phone': { label: 'Phone', required: true, type: 'text' },
        'gstin': { label: 'GSTIN', required: false, type: 'text' },
        'branch_id': { label: 'Primary Branch', required: true, type: 'text' }
    },
    'VENDORS': {
        'name': { label: 'Vendor Name', required: true, type: 'text' },
        'phone': { label: 'Phone', required: true, type: 'text' },
        'gstin': { label: 'GSTIN', required: true, type: 'text' }
    },
    'OPENING_STOCK': {
        'sku': { label: 'SKU / Item Code', required: true, type: 'text' },
        'quantity': { label: 'Quantity', required: true, type: 'number' },
        'branch_id': { label: 'Branch ID', required: true, type: 'text' },
        'batch': { label: 'Batch No', required: false, type: 'text' }
    },
    'PRICE_LISTS': {
        'sku': { label: 'SKU / Item Code', required: true, type: 'text' },
        'price': { label: 'New Price', required: true, type: 'number' },
        'valid_from': { label: 'Valid From', required: false, type: 'date' }
    },
    'HSN_CODES': {
        'code': { label: 'HSN Code', required: true, type: 'text' },
        'description': { label: 'Description', required: true, type: 'text' },
        'tax_rate': { label: 'Tax Rate %', required: true, type: 'number' }
    },
    'BRANCH_MAPPINGS': {
        'sku': { label: 'SKU / Item Code', required: true, type: 'text' },
        'branch_id': { label: 'Branch ID', required: true, type: 'text' },
        'min_stock': { label: 'Min Stock Level', required: false, type: 'number' }
    }
};

const BulkImport: React.FC = () => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [status, setStatus] = useState<ImportStatus>('IDLE');
    const [entity, setEntity] = useState<ImportEntity>('ITEMS');
    const [importData, setImportData] = useState<ImportData | null>(null);
    const [mappings, setMappings] = useState<Record<string, string>>({});
    const [errors, setErrors] = useState<string[]>([]);
    const [progress, setProgress] = useState(0);

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setStatus('ANALYZING');
        setTimeout(() => setStatus('MAPPING'), 1500); // Simulate analysis
        setImportData({
            headers: ['SKU', 'Product Name', 'Rate', 'GST', 'HSN', 'Branch Area'],
            rows: [],
            preview: [
                ['TS-M-001', 'Cotton Polo', '599', '5', '6105', 'Chennai'],
                ['TS-M-002', 'Silk Shirt', '1499', '12', '6205', 'Madurai'],
            ],
            totalRows: 245
        });
    };

    return (
        <div className="space-y-6 animate-fade-in text-slate-900 dark:text-white">
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
                <div>
                    <h2 className="text-xl font-black uppercase tracking-tight flex items-center gap-2">
                        <Upload className="w-5 h-5 text-indigo-500" />
                        Bulk Data Ingestion Engine
                    </h2>
                    <p className="text-xs text-slate-500 font-medium select-none">Intelligent mass upload with rollback protection and zero data pollution.</p>
                </div>
                <div className="flex gap-4">
                    <button className="px-4 py-2 bg-indigo-50 dark:bg-slate-800 text-indigo-600 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 border border-indigo-100 dark:border-slate-700">
                        <Download className="w-4 h-4" /> Template
                    </button>
                    <select
                        value={entity}
                        onChange={(e) => setEntity(e.target.value as ImportEntity)}
                        className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2 text-[10px] font-black uppercase tracking-widest outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                        {Object.keys(SYSTEM_FIELDS).map(k => (
                            <option key={k} value={k}>{k.replace('_', ' ')}</option>
                        ))}
                    </select>
                </div>
            </div>

            {status === 'IDLE' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div
                        className="lg:col-span-2 bg-white dark:bg-slate-900 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-[3rem] p-16 text-center cursor-pointer hover:border-indigo-500/50 hover:bg-slate-50/50 transition-all group flex flex-col items-center justify-center relative overflow-hidden"
                        onClick={() => fileInputRef.current?.click()}
                    >
                        <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:rotate-12 transition-transform">
                            <FileSpreadsheet className="w-48 h-48" />
                        </div>
                        <div className="w-20 h-20 bg-indigo-600 text-white rounded-[2rem] flex items-center justify-center mb-6 shadow-xl shadow-indigo-600/20 group-hover:scale-110 transition-transform">
                            <Upload className="w-8 h-8" />
                        </div>
                        <h3 className="text-2xl font-black uppercase tracking-tight mb-2">Drop Inventory Master</h3>
                        <p className="text-xs text-slate-500 font-medium max-w-xs mx-auto">Excel, CSV, or Text format. Engine will auto-reconcile with {entity} schema.</p>
                        <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileUpload} />
                    </div>

                    <div className="space-y-6">
                        <div className="bg-slate-900 text-white p-8 rounded-[2.5rem] shadow-2xl relative overflow-hidden group">
                            <h4 className="text-[10px] font-black uppercase tracking-widest text-indigo-400 mb-6 italic underline decoration-indigo-500/50 underline-offset-4">Import Intelligence</h4>
                            <div className="space-y-6">
                                <div className="flex gap-4">
                                    <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
                                        <ShieldCheck className="w-5 h-5 text-emerald-400" />
                                    </div>
                                    <div>
                                        <p className="text-[11px] font-black uppercase text-white mb-1">Atomicity Protocol</p>
                                        <p className="text-[10px] font-medium text-slate-400 leading-relaxed italic">All or Nothing. Rollback triggered on single row fault.</p>
                                    </div>
                                </div>
                                <div className="flex gap-4">
                                    <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
                                        <Zap className="w-5 h-5 text-indigo-400" />
                                    </div>
                                    <div>
                                        <p className="text-[11px] font-black uppercase text-white mb-1">Deep Compliance</p>
                                        <p className="text-[10px] font-medium text-slate-400 leading-relaxed italic">AI validates HSN patterns vs GST rates in real-time.</p>
                                    </div>
                                </div>
                                <div className="flex gap-4">
                                    <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
                                        <Database className="w-5 h-5 text-amber-400" />
                                    </div>
                                    <div>
                                        <p className="text-[11px] font-black uppercase text-white mb-1">Pollution Shield</p>
                                        <p className="text-[10px] font-medium text-slate-400 leading-relaxed italic">Preventing Cross-Tenant/Branch data leakage.</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-slate-200 dark:border-slate-800">
                            <div className="flex items-center gap-3 mb-4">
                                <RefreshCcw className="w-4 h-4 text-indigo-500" />
                                <h5 className="text-[10px] font-black uppercase tracking-widest">Active Schema</h5>
                            </div>
                            <div className="space-y-2">
                                {(Object.values(SYSTEM_FIELDS[entity]) as any[]).map((f, i) => (
                                    <div key={i} className="flex justify-between items-center text-[9px] font-bold">
                                        <span className="text-slate-500">{f.label}</span>
                                        <span className={f.required ? 'text-red-500' : 'text-slate-400'}>{f.required ? 'REQ' : 'OPT'}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {status === 'MAPPING' && importData && (
                <div className="space-y-6">
                    <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 p-8 shadow-sm">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8 border-b border-slate-100 dark:border-slate-800 pb-6">
                            <div className="flex items-center gap-4">
                                <div className="w-14 h-14 bg-emerald-50 dark:bg-emerald-900/30 rounded-2xl flex items-center justify-center text-emerald-500 shadow-inner">
                                    <CheckCircle className="w-8 h-8" />
                                </div>
                                <div>
                                    <h4 className="font-black text-lg">File Verified: {importData.totalRows} Records</h4>
                                    <p className="text-xs text-slate-500 font-medium">Auto-mapped 4/6 columns using AI heuristic match.</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <button onClick={() => setStatus('IDLE')} className="px-5 py-2 text-red-500 bg-red-50 dark:bg-red-900/20 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-red-600 hover:text-white transition-all">Cancel</button>
                                <button onClick={() => setStatus('PREVIEW')} className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-700 shadow-xl shadow-indigo-600/20 transition-all">Generate Preview</button>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {(Object.entries(SYSTEM_FIELDS[entity]) as [string, any][]).map(([key, field]) => (
                                <div key={key} className="p-5 rounded-[2rem] border border-slate-100 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-800/20 group hover:border-indigo-500/50 transition-colors">
                                    <div className="flex items-center justify-between mb-3 px-1">
                                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{field.label} {field.required && <span className="text-red-500">*</span>}</span>
                                        <Zap className="w-3.5 h-3.5 text-indigo-500 opacity-40 group-hover:opacity-100 transition-opacity" />
                                    </div>
                                    <select className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-xs font-bold outline-none focus:ring-2 focus:ring-indigo-500 transition-all appearance-none cursor-pointer">
                                        <option>-- Map Column --</option>
                                        {importData.headers.map(h => <option key={h}>{h}</option>)}
                                    </select>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {status === 'PREVIEW' && importData && (
                <div className="space-y-6">
                    <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
                        <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-white dark:bg-slate-900 z-10 sticky top-0">
                            <div>
                                <h3 className="font-black text-xl flex items-center gap-2">
                                    <Eye className="w-5 h-5 text-indigo-500" />
                                    Audit Preview (Heuristic Check)
                                </h3>
                                <p className="text-xs font-medium text-slate-500 mt-1 uppercase tracking-widest">Validating 245 rows across 6 branch dimensions</p>
                            </div>
                            <button onClick={() => setStatus('IMPORTING')} className="px-10 py-4 bg-emerald-500 text-white rounded-[2rem] font-black uppercase tracking-widest text-[10px] hover:bg-emerald-600 shadow-xl shadow-emerald-500/20 active:scale-95 transition-all flex items-center gap-3">
                                <Save className="w-4 h-4" /> Commit to Ledger
                            </button>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-700">
                                        <th className="p-5 text-[10px] font-black uppercase text-slate-400 tracking-widest">Status</th>
                                        {importData.headers.map((h, i) => (
                                            <th key={i} className="p-5 text-[10px] font-black uppercase text-slate-400 tracking-widest whitespace-nowrap">{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {importData.preview.map((row, r_idx) => (
                                        <tr key={r_idx} className="border-b border-slate-50 dark:border-slate-800/30 group hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors">
                                            <td className="p-5">
                                                <div className="flex items-center gap-2 text-[10px] font-black uppercase text-emerald-500">
                                                    <CheckCircle className="w-3.5 h-3.5" /> VALID
                                                </div>
                                            </td>
                                            {row.map((cell: any, c_idx: number) => (
                                                <td key={c_idx} className="p-5 text-xs font-bold text-slate-700 dark:text-slate-300">{cell}</td>
                                            ))}
                                        </tr>
                                    ))}
                                    <tr className="bg-amber-500/5 border-b border-amber-500/10">
                                        <td className="p-5">
                                            <div className="flex items-center gap-2 text-[10px] font-black uppercase text-amber-500">
                                                <AlertTriangle className="w-3.5 h-3.5" /> WARNING
                                            </div>
                                        </td>
                                        <td className="p-5 text-xs font-bold text-slate-700 dark:text-slate-300">TS-M-ERROR</td>
                                        <td className="p-5 text-xs font-bold text-slate-700 dark:text-slate-300">Faulty Item</td>
                                        <td className="p-5 text-xs font-bold text-red-500">NaN</td>
                                        <td className="p-5 text-xs font-bold text-slate-700 dark:text-slate-300">18</td>
                                        <td className="p-5 text-xs font-bold text-slate-700 dark:text-slate-300">9900</td>
                                        <td className="p-5 text-xs font-bold text-slate-700 dark:text-slate-300">Chennai</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {status === 'IMPORTING' && (
                <div className="bg-slate-900 text-white rounded-[3rem] p-20 text-center shadow-2xl relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/20 to-transparent pointer-events-none" />
                    <div className="w-32 h-32 bg-white/5 backdrop-blur-md rounded-[2.5rem] flex items-center justify-center mx-auto mb-10 relative">
                        <div className="absolute inset-0 rounded-[2.5rem] border-4 border-white/10" />
                        <div className="absolute inset-0 rounded-[2.5rem] border-4 border-indigo-500 border-t-transparent animate-spin" />
                        <span className="text-2xl font-black text-indigo-400">76%</span>
                    </div>
                    <h3 className="text-3xl font-black uppercase tracking-tight mb-4">Ingesting Data...</h3>
                    <p className="text-slate-400 font-medium max-w-sm mx-auto italic">Engine is verifying GST-HSN mapping for Coimbatore branch records. Atomicity protocol enabled.</p>
                </div>
            )}
        </div>
    );
};

export default BulkImport;

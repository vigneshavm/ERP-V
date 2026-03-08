import { useState, ChangeEvent, useTransition } from 'react';
import * as XLSX from 'xlsx';
import api from "@/services/api";
import { toast } from 'react-toastify';
import { 
    Upload, FileSpreadsheet, AlertCircle, 
    CheckCircle2, Loader2, Info, 
    Database, Activity, ShieldCheck,
    CloudUpload, RefreshCcw, Search,
    ChevronRight, XSquare, Archive
} from 'lucide-react';

interface ProcessedRow {
    row: number;
    name: string;
    sku: string;
    category: string;
    costPrice: string | number;
    sellingPrice: string | number;
    stock: string | number;
    unit: string;
    status?: 'valid' | 'warning' | 'error';
    validationErrors?: string[];
    [key: string]: any;
}

interface ValidationResult {
    status: 'valid' | 'warning' | 'error';
    errors: string[];
}

interface ImportError {
    row: number;
    itemName?: string;
    sku?: string;
    errors?: string[];
    error?: string;
}

const BulkImport = () => {
    const [isPending, startTransition] = useTransition();
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [mappingData, setMappingData] = useState<ProcessedRow[]>([]);
    const [showPreview, setShowPreview] = useState(false);
    const [importing, setImporting] = useState(false);
    const [errors, setErrors] = useState<ImportError[]>([]);
    const [dragActive, setDragActive] = useState(false);

    const validateRow = (row: ProcessedRow, rowIndex: number, allRows: ProcessedRow[]): ValidationResult => {
        const errors: string[] = [];
        const validUnits = [
            'pcs', 'kg', 'g', 'mg', 'l', 'ml', 'box', 'pack', 'bag', 'bottle',
            'can', 'dozen', 'm', 'cm', 'ft', 'unit', 'pair', 'set'
        ];

        if (!row.name || String(row.name).trim() === '') {
            errors.push('Identity Missing: Name field cannot be null');
        }

        if (!row.costPrice || String(row.costPrice) === '') {
            errors.push('Financial Logic Error: Acquisition rate required');
        } else if (isNaN(Number(row.costPrice)) || Number(row.costPrice) <= 0) {
            errors.push('Value Mismatch: Cost must be a positive integer');
        }

        if (!row.sellingPrice || String(row.sellingPrice) === '') {
            errors.push('Market Entry Error: Unit price required');
        } else if (isNaN(Number(row.sellingPrice)) || Number(row.sellingPrice) <= 0) {
            errors.push('Value Mismatch: Price must be a positive integer');
        }

        if (!row.category || String(row.category).trim() === '') {
            errors.push('Classification Missing: Category segment required');
        }

        if (row.unit && String(row.unit).trim() !== '') {
            const unitLower = String(row.unit).toLowerCase().trim();
            if (!validUnits.includes(unitLower)) {
                errors.push(`Standard Deviation: Unit "${row.unit}" unknown to lexicon`);
            }
        }

        if (row.sku && String(row.sku).trim() !== '') {
            const skuLower = String(row.sku).toLowerCase().trim();
            const duplicateRows = allRows
                .map((r, idx) => ({ ...r, originalIndex: idx }))
                .filter(r => r.sku && String(r.sku).toLowerCase().trim() === skuLower && r.originalIndex !== rowIndex);

            if (duplicateRows.length > 0) {
                const rowNumbers = [rowIndex + 1, ...duplicateRows.map(r => r.originalIndex + 1)].sort((a, b) => a - b);
                errors.push(`Conflict Detected: SKU duplication at rows ${rowNumbers.join(', ')}`);
            }
        }

        if (errors.length === 0) {
            if (!row.sku || String(row.sku).trim() === '') {
                return { status: 'warning', errors: ['Non-indexed: SKU recommended for tracking'] };
            }
            return { status: 'valid', errors: [] };
        }

        return { status: 'error', errors };
    };

    const processFile = async (file: File) => {
        startTransition(async () => {
            try {
                setSelectedFile(file);
                const fileData = await file.arrayBuffer();
                const workbook = XLSX.read(fileData, { type: 'array' });
                const worksheet = workbook.Sheets[workbook.SheetNames[0]];
                const data: any[] = XLSX.utils.sheet_to_json(worksheet);

                if (data.length === 0) {
                    toast.error('Payload Empty: No data detected in sector.');
                    return;
                }

                const processedData: ProcessedRow[] = data.map((row: any, index: number) => {
                    const processedRow: ProcessedRow = {
                        row: index + 1,
                        name: row['Name'] || row['Item Name'] || row['Product Name'] || '',
                        sku: row['SKU'] || row['Product Code'] || '',
                        category: row['Category'] || '',
                        costPrice: row['Cost Price'] || row['Cost'] || '',
                        sellingPrice: row['Selling Price'] || row['Price'] || row['Unit Price'] || '',
                        stock: row['Stock Quantity'] || row['Stock'] || row['Quantity'] || '0',
                        unit: row['Unit'] || '',
                    };

                    return processedRow;
                });

                processedData.forEach((row, index) => {
                    const validation = validateRow(row, index, processedData);
                    row.status = validation.status;
                    row.validationErrors = validation.errors;
                });

                setMappingData(processedData);
                setShowPreview(true);
                toast.success(`Ingestion Complete: ${data.length} records parsed.`);
            } catch (error) {
                console.error('Heuristic mismatch:', error);
                toast.error('Sector Read Error: Payload corrupted or invalid.');
            }
        });
    };

    const handleFileSelect = (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) processFile(file);
    };

    const handleDrag = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") setDragActive(true);
        else if (e.type === "dragleave") setDragActive(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            processFile(e.dataTransfer.files[0]);
        }
    };

    const handleImport = async () => {
        try {
            setImporting(true);
            const validRows = mappingData.filter(row => row.status === 'valid' || row.status === 'warning');

            if (validRows.length === 0) {
                toast.error('Commit Denied: Zero valid records in buffer.');
                return;
            }

            const itemsToImport = validRows.map(row => ({
                name: row.name,
                sku: row.sku || undefined,
                category: row.category || undefined,
                costPrice: parseFloat(String(row.costPrice)),
                sellingPrice: parseFloat(String(row.sellingPrice)),
                stockQty: parseInt(String(row.stock)) || 0,
                unit: row.unit || undefined,
            }));

            // Simulate commit delay
            await new Promise(r => setTimeout(r, 2000));

            const response = await api.post(`/api/inventory/import`, { items: itemsToImport });

            toast.success(`Success: ${response.data.imported} records committed, ${response.data.updated} localized.`);

            if (response.data.skipped > 0) {
                toast.warning(`Notice: ${response.data.skipped} records reached terminal failure.`);
            }

            if (response.data.skipped === 0) {
                setShowPreview(false);
                setSelectedFile(null);
                setMappingData([]);
            }
        } catch (error: any) {
            console.error('Commit failure:', error);
            toast.error('Commit Fault: Sync interrupted by kernel.');
        } finally {
            setImporting(false);
        }
    };

    const validRowsCount = mappingData.filter(row => row.status === 'valid').length;
    const warningRowsCount = mappingData.filter(row => row.status === 'warning').length;
    const errorRowsCount = mappingData.filter(row => row.status === 'error').length;
    const complianceScore = mappingData.length > 0 
        ? Math.round(((validRowsCount + (warningRowsCount * 0.5)) / mappingData.length) * 100)
        : 0;

    return (
        <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Engine Overview HUD */}
            <div className="bg-slate-900 rounded-[3rem] p-10 flex flex-col md:flex-row items-center gap-10 border border-slate-800 shadow-2xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-10 opacity-5 pointer-events-none group-hover:opacity-10 transition-opacity">
                    <CloudUpload className="w-64 h-64 text-indigo-500" />
                </div>
                <div className="relative z-10 w-24 h-24 rounded-[2.5rem] bg-indigo-600 flex items-center justify-center shrink-0 shadow-2xl shadow-indigo-500/30 group-hover:scale-105 transition-transform duration-500">
                    <Database className="w-12 h-12 text-white" />
                </div>
                <div className="relative z-10 flex-1 text-center md:text-left">
                    <h1 className="text-3xl font-black text-white italic uppercase tracking-tighter mb-2">Ingestion <span className="text-indigo-400">Engine</span></h1>
                    <p className="text-slate-400 text-sm font-medium leading-relaxed max-w-2xl">High-throughput data assimilation matrix. Heuristic analysis and schema mapping active for Excel/CSV payloads.</p>
                </div>
                <div className="relative z-10 flex flex-col items-end gap-3 shrink-0">
                    <div className="px-6 py-2 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded-full text-[10px] font-black tracking-widest flex items-center gap-3">
                        <Activity className="w-3.5 h-3.5 animate-pulse" /> BUFFER SYSTEM READY
                    </div>
                    <div className="text-right hidden md:block">
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Lexicon Sync</p>
                        <p className="text-xs font-black text-emerald-500 uppercase italic">Stable (42ms)</p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Upload & Preview Hub */}
                <div className="lg:col-span-8 space-y-8">
                    {!showPreview ? (
                        <div 
                            className={`relative bg-white dark:bg-slate-950 rounded-[3.5rem] p-16 border-4 border-dashed transition-all duration-500 group cursor-pointer text-center ${
                                dragActive ? 'border-indigo-600 bg-indigo-50/10 scale-[0.99]' : 'border-slate-100 dark:border-slate-800 hover:border-indigo-200 dark:hover:border-slate-700'
                            }`}
                            onDragEnter={handleDrag}
                            onDragLeave={handleDrag}
                            onDragOver={handleDrag}
                            onDrop={handleDrop}
                            onClick={() => (document.getElementById('file-upload') as HTMLInputElement).click()}
                        >
                            <input type="file" accept=".csv,.xlsx" onChange={handleFileSelect} className="hidden" id="file-upload" />
                            
                            {/* Pulse Signal Waves (Decorative) */}
                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden rounded-[3rem]">
                                <div className="w-[300px] h-[300px] bg-indigo-500/5 rounded-full animate-ping opacity-20"></div>
                                <div className="absolute w-[200px] h-[200px] bg-indigo-500/10 rounded-full animate-pulse opacity-20"></div>
                            </div>

                            <div className="relative z-10">
                                <div className="w-24 h-24 bg-slate-50 dark:bg-slate-900 rounded-[2rem] flex items-center justify-center mx-auto mb-8 group-hover:bg-indigo-600 group-hover:text-white transition-all duration-500 shadow-xl border border-slate-100 dark:border-slate-800">
                                    <CloudUpload className="w-10 h-10" />
                                </div>
                                <h3 className="text-2xl font-black text-slate-900 dark:text-white italic uppercase tracking-tighter mb-3">Initialize Payload</h3>
                                <p className="text-slate-400 font-bold text-xs uppercase tracking-widest mb-2">Drop spreadsheet or click to navigate sector</p>
                                <div className="flex items-center justify-center gap-4 mt-6">
                                    <span className="px-3 py-1 bg-slate-100 dark:bg-slate-800 rounded-lg text-[9px] font-black text-slate-500 uppercase tracking-widest">XLSX</span>
                                    <span className="w-1.5 h-1.5 rounded-full bg-slate-300"></span>
                                    <span className="px-3 py-1 bg-slate-100 dark:bg-slate-800 rounded-lg text-[9px] font-black text-slate-500 uppercase tracking-widest">CSV</span>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="bg-white dark:bg-slate-950 rounded-[3rem] border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden animate-in fade-in zoom-in-95 duration-500">
                            <div className="p-8 border-b border-slate-50 dark:border-slate-900 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/10">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
                                        <Search className="w-5 h-5 text-white" />
                                    </div>
                                    <h3 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-[0.2em] italic">Heuristic Preview</h3>
                                </div>
                                <div className="flex items-center gap-4">
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{selectedFile?.name}</span>
                                    <button onClick={() => { setShowPreview(false); setSelectedFile(null); setMappingData([]); }} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors">
                                        <XSquare className="w-4 h-4 text-rose-500" />
                                    </button>
                                </div>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-800">
                                        <tr>
                                            <th className="px-8 py-5 text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Node</th>
                                            <th className="px-8 py-5 text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Status</th>
                                            <th className="px-8 py-5 text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Asset Label</th>
                                            <th className="px-8 py-5 text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Category</th>
                                            <th className="px-8 py-5 text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Pricing Matrix</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50 dark:divide-slate-900 text-[10px] font-bold">
                                        {mappingData.slice(0, 10).map((row) => (
                                            <tr key={row.row} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/40 transition-colors group">
                                                <td className="px-8 py-5 text-slate-400 font-mono tracking-tighter">0x{(row.row+1000).toString(16)}</td>
                                                <td className="px-8 py-5">
                                                    <div className={`w-fit px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-tighter flex items-center gap-2 ${
                                                        row.status === 'valid' ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' :
                                                        row.status === 'warning' ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20' :
                                                        'bg-rose-500/10 text-rose-500 border border-rose-500/20'
                                                    }`}>
                                                        <div className={`w-1 h-1 rounded-full ${row.status === 'valid' ? 'bg-emerald-500' : row.status === 'warning' ? 'bg-amber-500' : 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.5)]'}`} />
                                                        {row.status}
                                                    </div>
                                                </td>
                                                <td className="px-8 py-5">
                                                    <p className="text-slate-900 dark:text-white uppercase tracking-tight truncate max-w-[150px]">{row.name}</p>
                                                    <p className="text-[8px] text-slate-400 font-mono mt-0.5 tracking-widest">{row.sku || 'N/A'}</p>
                                                </td>
                                                <td className="px-8 py-5 text-slate-500 uppercase italic">{row.category}</td>
                                                <td className="px-8 py-5 font-black text-slate-900 dark:text-white">
                                                    <div className="flex gap-4">
                                                        <span className="text-indigo-500">C:₹{row.costPrice}</span>
                                                        <span className="text-emerald-500">S:₹{row.sellingPrice}</span>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                                {mappingData.length > 10 && (
                                    <div className="p-6 text-center bg-slate-50/30 dark:bg-slate-900/20 border-t border-slate-50 dark:border-slate-800">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">Display limited to initial 10 nodes • Sector contains {mappingData.length} records</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Tactical Sidebar */}
                <div className="lg:col-span-4 space-y-8">
                    {/* Compliance HUD */}
                    <div className={`${showPreview ? 'bg-slate-900' : 'bg-slate-100 dark:bg-slate-900'} rounded-[3rem] p-8 border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden group transition-all duration-700`}>
                        <div className="relative z-10">
                            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] mb-8 text-slate-400 italic">Compliance Metrics</h3>
                            
                            <div className="flex items-center justify-between mb-8">
                                <div className="space-y-1">
                                    <p className="text-4xl font-black text-indigo-500 italic tracking-tighter">{complianceScore}%</p>
                                    <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Heuristic Score</p>
                                </div>
                                <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
                                    <ShieldCheck className={`w-8 h-8 ${complianceScore > 80 ? 'text-emerald-500' : 'text-indigo-500'}`} />
                                </div>
                            </div>

                            <div className="space-y-4">
                                {[
                                    { label: 'Valid Records', count: validRowsCount, color: 'emerald' },
                                    { label: 'Soft Warnings', count: warningRowsCount, color: 'amber' },
                                    { label: 'Terminal Conflicts', count: errorRowsCount, color: 'rose' }
                                ].map((item, i) => (
                                    <div key={i} className="flex justify-between items-center px-4 py-3 bg-white dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800/50">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-1.5 h-1.5 rounded-full bg-${item.color}-500`} />
                                            <span className="text-[9px] font-black uppercase tracking-widest text-slate-500">{item.label}</span>
                                        </div>
                                        <span className={`text-[10px] font-black text-${item.color}-500 italic`}>{item.count}</span>
                                    </div>
                                ))}
                            </div>

                            {showPreview && (
                                <div className="mt-8 pt-8 border-t border-slate-200 dark:border-slate-800 space-y-4">
                                    <button 
                                        onClick={handleImport}
                                        disabled={importing || validRowsCount === 0}
                                        className="w-full py-5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-[1.5rem] font-black text-xs uppercase tracking-[0.2em] shadow-xl shadow-indigo-500/20 active:scale-[0.98] transition-all disabled:opacity-50 overflow-hidden relative"
                                    >
                                        {importing ? (
                                            <div className="flex items-center justify-center gap-4">
                                                <Loader2 className="w-5 h-5 animate-spin" />
                                                <span>COMMITTING...</span>
                                            </div>
                                        ) : (
                                            <div className="flex items-center justify-center gap-4">
                                                <RefreshCcw className="w-4 h-4" />
                                                <span>COMMIT PAYLOAD</span>
                                            </div>
                                        )}
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Protocol Reference */}
                    <div className="bg-indigo-600 rounded-[2.5rem] p-8 text-white shadow-2xl shadow-indigo-600/30 overflow-hidden group">
                        <div className="flex items-center gap-4 mb-6">
                            <Info className="w-5 h-5 opacity-70" />
                            <h4 className="text-[10px] font-black uppercase tracking-widest">Protocol Rules</h4>
                        </div>
                        <ul className="space-y-4">
                            {[
                                'Headers must include Name, Cost, Price',
                                'Duplicate SKUs will trigger conflict isolation',
                                'Units restricted to validated lexicon only',
                                'System auto-detects legacy column labels'
                            ].map((rule, i) => (
                                <li key={i} className="flex gap-4 group/item">
                                    <ChevronRight className="w-4 h-4 opacity-40 mt-1 transition-transform group-hover/item:translate-x-1" />
                                    <p className="text-[11px] font-bold text-indigo-100 italic leading-relaxed uppercase tracking-tight">{rule}</p>
                                </li>
                            ))}
                        </ul>
                        <button className="w-full mt-8 py-4 bg-white/10 hover:bg-white/20 border border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all">
                            Export Lexicon Mapping
                        </button>
                    </div>

                    {/* Crisis Advisory */}
                    <div className="p-6 bg-rose-500/5 border border-rose-500/10 rounded-[2.5rem] flex items-start gap-4">
                        <Archive className="w-5 h-5 text-rose-500 shrink-0 mt-1" />
                        <p className="text-[10px] font-black text-rose-800 dark:text-rose-400 leading-relaxed uppercase italic">
                            Commitment of payload to main ledger is <span className="underline decoration-rose-500/30">Irreversible</span>. Ensure heuristic alignment before commit.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BulkImport;

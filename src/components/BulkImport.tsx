import React, { useState, useRef } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import {
    Upload,
    Download,
    FileSpreadsheet,
    CheckCircle,
    XCircle,
    AlertTriangle,
    AlertCircle,
    Loader2,
    FileText,
    Trash2,
    Eye,
    X,
    Check,
    Edit3,
    SkipForward,
    Play,
    RefreshCw
} from 'lucide-react';

type ImportStatus = 'IDLE' | 'VALIDATING' | 'PREVIEW' | 'IMPORTING' | 'COMPLETE' | 'ERROR';
type RowStatus = 'VALID' | 'ERROR' | 'WARNING' | 'SKIPPED';

interface ImportRow {
    rowNumber: number;
    name: string;
    sku: string;
    category: string;
    costPrice: number | null;
    sellingPrice: number | null;
    stockQuantity: number | null;
    unit: string;
    status: RowStatus;
    errors: string[];
    isNew: boolean;
}

interface ImportResult {
    total: number;
    imported: number;
    updated: number;
    failed: number;
    skipped: number;
}

const BulkImport: React.FC = () => {
    const { user } = useSelector((state: RootState) => state.auth);
    const { tenants } = useSelector((state: RootState) => state.tenant);

    const activeTenant = tenants.find(t => t.id === user?.tenantId);
    const isOwnerOrAdmin = user?.systemRole === 'Owner' || (user?.role as string).toLowerCase() === 'admin';

    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [fileName, setFileName] = useState<string | null>(null);
    const [fileSize, setFileSize] = useState<number>(0);
    const [status, setStatus] = useState<ImportStatus>('IDLE');
    const [progress, setProgress] = useState(0);

    // Mock import data
    const [importRows, setImportRows] = useState<ImportRow[]>([]);
    const [importResult, setImportResult] = useState<ImportResult | null>(null);

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = () => {
        setIsDragging(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        const file = e.dataTransfer.files[0];
        if (file) handleFile(file);
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) handleFile(file);
    };

    const handleFile = (file: File) => {
        const validTypes = ['.csv', '.xlsx', 'text/csv', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'];
        const ext = file.name.substring(file.name.lastIndexOf('.'));

        if (!validTypes.includes(ext) && !validTypes.includes(file.type)) {
            alert('Please upload a CSV or Excel file (.csv or .xlsx)');
            return;
        }

        if (file.size > 5 * 1024 * 1024) {
            alert('File size must be less than 5MB');
            return;
        }

        setFileName(file.name);
        setFileSize(file.size);
        simulateValidation();
    };

    const simulateValidation = () => {
        setStatus('VALIDATING');
        setProgress(0);

        const interval = setInterval(() => {
            setProgress(p => {
                if (p >= 100) {
                    clearInterval(interval);
                    setStatus('PREVIEW');
                    generateMockData();
                    return 100;
                }
                return p + 10;
            });
        }, 200);
    };

    const generateMockData = () => {
        const mockRows: ImportRow[] = [
            { rowNumber: 1, name: 'Organic Wheat Flour 5kg', sku: 'WF-001', category: 'Grains', costPrice: 180, sellingPrice: 245, stockQuantity: 50, unit: 'pcs', status: 'VALID', errors: [], isNew: true },
            { rowNumber: 2, name: 'Basmati Rice Premium 1kg', sku: 'BR-002', category: 'Grains', costPrice: 140, sellingPrice: 185, stockQuantity: 75, unit: 'pcs', status: 'VALID', errors: [], isNew: false },
            { rowNumber: 3, name: 'Cold Pressed Coconut Oil 1L', sku: 'CO-003', category: 'Oils', costPrice: 250, sellingPrice: 320, stockQuantity: 30, unit: 'pcs', status: 'VALID', errors: [], isNew: true },
            { rowNumber: 4, name: '', sku: 'JP-004', category: 'Sugar', costPrice: 70, sellingPrice: 95, stockQuantity: 100, unit: 'pcs', status: 'ERROR', errors: ['Name is required'], isNew: true },
            { rowNumber: 5, name: 'Turmeric Powder 200g', sku: 'TP-005', category: 'Spices', costPrice: 45, sellingPrice: 65, stockQuantity: 120, unit: 'pcs', status: 'VALID', errors: [], isNew: true },
            { rowNumber: 6, name: 'Red Chilli Powder 250g', sku: 'RC-006', category: 'Spices', costPrice: null, sellingPrice: 78, stockQuantity: 80, unit: 'pcs', status: 'ERROR', errors: ['Cost Price is required'], isNew: true },
            { rowNumber: 7, name: 'Coriander Powder 100g', sku: 'CP-007', category: 'Spices', costPrice: 25, sellingPrice: 38, stockQuantity: -5, unit: 'pcs', status: 'ERROR', errors: ['Stock Quantity must be positive'], isNew: true },
            { rowNumber: 8, name: 'Cumin Seeds 200g', sku: 'CS-008', category: 'Spices', costPrice: 120, sellingPrice: 160, stockQuantity: 45, unit: 'pcs', status: 'VALID', errors: [], isNew: false },
            { rowNumber: 9, name: 'Black Pepper Whole 100g', sku: 'BP-009', category: 'Spices', costPrice: 180, sellingPrice: 245, stockQuantity: 35, unit: 'pcs', status: 'WARNING', errors: ['Category "Spices" will be auto-created'], isNew: true },
            { rowNumber: 10, name: 'Mustard Oil 1L', sku: 'MO-010', category: 'Oils', costPrice: 160, sellingPrice: 210, stockQuantity: 25, unit: 'pcs', status: 'VALID', errors: [], isNew: true }
        ];
        setImportRows(mockRows);
    };

    const handleSkipRow = (rowNumber: number) => {
        setImportRows(rows => rows.map(r =>
            r.rowNumber === rowNumber ? { ...r, status: 'SKIPPED' } : r
        ));
    };

    const handleStartImport = () => {
        setStatus('IMPORTING');
        setProgress(0);

        const validRows = importRows.filter(r => r.status === 'VALID' || r.status === 'WARNING');
        let current = 0;

        const interval = setInterval(() => {
            current++;
            setProgress((current / validRows.length) * 100);

            if (current >= validRows.length) {
                clearInterval(interval);
                setStatus('COMPLETE');
                setImportResult({
                    total: importRows.length,
                    imported: validRows.filter(r => r.isNew).length,
                    updated: validRows.filter(r => !r.isNew).length,
                    failed: importRows.filter(r => r.status === 'ERROR').length,
                    skipped: importRows.filter(r => r.status === 'SKIPPED').length
                });
            }
        }, 300);
    };

    const handleReset = () => {
        setStatus('IDLE');
        setFileName(null);
        setFileSize(0);
        setProgress(0);
        setImportRows([]);
        setImportResult(null);
    };

    const formatBytes = (bytes: number) => {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
    };

    const validCount = importRows.filter(r => r.status === 'VALID').length;
    const warningCount = importRows.filter(r => r.status === 'WARNING').length;
    const errorCount = importRows.filter(r => r.status === 'ERROR').length;
    const skippedCount = importRows.filter(r => r.status === 'SKIPPED').length;

    const getRowStatusBadge = (status: RowStatus) => {
        const styles: Record<RowStatus, { bg: string; text: string; icon: React.ElementType }> = {
            VALID: { bg: 'bg-green-100', text: 'text-green-600', icon: CheckCircle },
            ERROR: { bg: 'bg-red-100', text: 'text-red-600', icon: XCircle },
            WARNING: { bg: 'bg-yellow-100', text: 'text-yellow-600', icon: AlertTriangle },
            SKIPPED: { bg: 'bg-slate-100', text: 'text-slate-500', icon: SkipForward }
        };
        const s = styles[status];
        return (
            <span className={`px-2 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${s.bg} ${s.text} flex items-center gap-1 w-fit`}>
                <s.icon className="w-3 h-3" /> {status}
            </span>
        );
    };

    if (!isOwnerOrAdmin) {
        return (
            <div className="flex flex-col items-center justify-center h-96 text-center">
                <AlertCircle className="w-16 h-16 text-red-400 mb-4" />
                <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-2">Access Denied</h2>
                <p className="text-slate-500">Only Owners and Admins can access the Bulk Import module.</p>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 dark:text-white">Bulk Import Items</h1>
                    <p className="text-slate-500 mt-1">Upload CSV or Excel files to create or update products in bulk.</p>
                </div>
                <button
                    className="px-6 py-3 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl font-bold text-sm hover:bg-slate-200 transition-all flex items-center gap-2"
                >
                    <Download className="w-4 h-4" /> Download Sample File
                </button>
            </div>

            {/* Upload Zone */}
            {status === 'IDLE' && (
                <div
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-2xl p-16 text-center cursor-pointer transition-all ${isDragging
                            ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20'
                            : 'border-slate-200 dark:border-slate-700 hover:border-indigo-300 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                        }`}
                >
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept=".csv,.xlsx"
                        onChange={handleFileSelect}
                        className="hidden"
                    />
                    <div className="w-20 h-20 bg-indigo-100 dark:bg-indigo-900/30 rounded-2xl flex items-center justify-center mx-auto mb-6">
                        <Upload className="w-10 h-10 text-indigo-600" />
                    </div>
                    <h3 className="text-xl font-black text-slate-900 dark:text-white mb-2">
                        Drag & drop your file here
                    </h3>
                    <p className="text-slate-500 mb-4">or click to browse</p>
                    <div className="flex items-center justify-center gap-4 text-sm">
                        <span className="px-3 py-1 bg-slate-100 dark:bg-slate-800 rounded-lg font-bold text-slate-600">.CSV</span>
                        <span className="px-3 py-1 bg-slate-100 dark:bg-slate-800 rounded-lg font-bold text-slate-600">.XLSX</span>
                        <span className="text-slate-400">Max 5MB</span>
                    </div>
                </div>
            )}

            {/* Validating */}
            {status === 'VALIDATING' && (
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-12 text-center">
                    <Loader2 className="w-12 h-12 text-indigo-600 mx-auto mb-6 animate-spin" />
                    <h3 className="text-xl font-black text-slate-900 dark:text-white mb-2">Validating File</h3>
                    <p className="text-slate-500 mb-6">{fileName}</p>
                    <div className="w-full max-w-md mx-auto bg-slate-100 dark:bg-slate-800 rounded-full h-3">
                        <div
                            className="bg-indigo-600 h-3 rounded-full transition-all"
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                    <p className="text-sm font-bold text-slate-500 mt-4">{progress}% complete</p>
                </div>
            )}

            {/* Preview */}
            {status === 'PREVIEW' && (
                <div className="space-y-6">
                    {/* File Info & Stats */}
                    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center">
                                    <FileSpreadsheet className="w-6 h-6 text-indigo-600" />
                                </div>
                                <div>
                                    <p className="font-bold text-slate-900 dark:text-white">{fileName}</p>
                                    <p className="text-sm text-slate-500">{formatBytes(fileSize)} • {importRows.length} rows</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-6">
                                <div className="text-center">
                                    <p className="text-2xl font-black text-green-600">{validCount}</p>
                                    <p className="text-[10px] font-bold text-slate-500 uppercase">Valid</p>
                                </div>
                                <div className="text-center">
                                    <p className="text-2xl font-black text-yellow-600">{warningCount}</p>
                                    <p className="text-[10px] font-bold text-slate-500 uppercase">Warnings</p>
                                </div>
                                <div className="text-center">
                                    <p className="text-2xl font-black text-red-600">{errorCount}</p>
                                    <p className="text-[10px] font-bold text-slate-500 uppercase">Errors</p>
                                </div>
                                <div className="text-center">
                                    <p className="text-2xl font-black text-slate-400">{skippedCount}</p>
                                    <p className="text-[10px] font-bold text-slate-500 uppercase">Skipped</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Warning Banner */}
                    {errorCount > 0 && (
                        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 flex items-center gap-4">
                            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                            <p className="text-sm font-medium text-red-700 dark:text-red-300">
                                {errorCount} rows have errors and will be skipped during import. You can fix or skip them below.
                            </p>
                        </div>
                    )}

                    {/* Preview Table */}
                    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
                        <div className="p-4 border-b border-slate-100 dark:border-slate-800">
                            <h3 className="font-bold text-slate-900 dark:text-white">Preview Data</h3>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-slate-100 dark:border-slate-800 text-left">
                                        <th className="p-4 text-[10px] font-black uppercase tracking-widest text-slate-500">#</th>
                                        <th className="p-4 text-[10px] font-black uppercase tracking-widest text-slate-500">Name</th>
                                        <th className="p-4 text-[10px] font-black uppercase tracking-widest text-slate-500">SKU</th>
                                        <th className="p-4 text-[10px] font-black uppercase tracking-widest text-slate-500">Category</th>
                                        <th className="p-4 text-[10px] font-black uppercase tracking-widest text-slate-500">Cost</th>
                                        <th className="p-4 text-[10px] font-black uppercase tracking-widest text-slate-500">Price</th>
                                        <th className="p-4 text-[10px] font-black uppercase tracking-widest text-slate-500">Stock</th>
                                        <th className="p-4 text-[10px] font-black uppercase tracking-widest text-slate-500">Status</th>
                                        <th className="p-4 text-[10px] font-black uppercase tracking-widest text-slate-500">Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {importRows.map((row) => (
                                        <tr
                                            key={row.rowNumber}
                                            className={`border-b border-slate-50 dark:border-slate-800/50 ${row.status === 'ERROR' ? 'bg-red-50 dark:bg-red-900/10' :
                                                    row.status === 'SKIPPED' ? 'opacity-50' : ''
                                                }`}
                                        >
                                            <td className="p-4 text-sm font-bold text-slate-400">{row.rowNumber}</td>
                                            <td className="p-4">
                                                <span className={`font-medium ${row.name ? 'text-slate-900 dark:text-white' : 'text-red-500 italic'}`}>
                                                    {row.name || '(empty)'}
                                                </span>
                                                {!row.isNew && <span className="ml-2 px-2 py-0.5 bg-blue-100 text-blue-600 text-[10px] font-bold rounded">UPDATE</span>}
                                            </td>
                                            <td className="p-4 text-sm font-mono text-slate-600 dark:text-slate-400">{row.sku}</td>
                                            <td className="p-4 text-sm text-slate-600 dark:text-slate-400">{row.category}</td>
                                            <td className={`p-4 text-sm font-medium ${row.costPrice === null ? 'text-red-500' : 'text-slate-600 dark:text-slate-400'}`}>
                                                {row.costPrice !== null ? `₹${row.costPrice}` : '-'}
                                            </td>
                                            <td className="p-4 text-sm font-medium text-slate-600 dark:text-slate-400">
                                                {row.sellingPrice !== null ? `₹${row.sellingPrice}` : '-'}
                                            </td>
                                            <td className={`p-4 text-sm font-medium ${row.stockQuantity !== null && row.stockQuantity < 0 ? 'text-red-500' : 'text-slate-600 dark:text-slate-400'}`}>
                                                {row.stockQuantity}
                                            </td>
                                            <td className="p-4">
                                                {getRowStatusBadge(row.status)}
                                                {row.errors.length > 0 && (
                                                    <p className="text-[10px] text-red-500 mt-1">{row.errors[0]}</p>
                                                )}
                                            </td>
                                            <td className="p-4">
                                                {row.status === 'ERROR' && (
                                                    <button
                                                        onClick={() => handleSkipRow(row.rowNumber)}
                                                        className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 transition-colors"
                                                        title="Skip this row"
                                                    >
                                                        <SkipForward className="w-4 h-4" />
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center justify-between">
                        <button
                            onClick={handleReset}
                            className="px-6 py-3 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl font-bold text-sm hover:bg-slate-200 transition-all flex items-center gap-2"
                        >
                            <X className="w-4 h-4" /> Cancel Import
                        </button>
                        <button
                            onClick={handleStartImport}
                            disabled={validCount + warningCount === 0}
                            className="px-8 py-3 bg-indigo-600 text-white rounded-xl font-bold text-sm hover:bg-indigo-700 transition-all flex items-center gap-2 disabled:opacity-50"
                        >
                            <Play className="w-4 h-4" /> Import {validCount + warningCount} Items
                        </button>
                    </div>
                </div>
            )}

            {/* Importing */}
            {status === 'IMPORTING' && (
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-12 text-center">
                    <Loader2 className="w-12 h-12 text-indigo-600 mx-auto mb-6 animate-spin" />
                    <h3 className="text-xl font-black text-slate-900 dark:text-white mb-2">Importing Products</h3>
                    <p className="text-slate-500 mb-6">Please wait while we process your data...</p>
                    <div className="w-full max-w-md mx-auto bg-slate-100 dark:bg-slate-800 rounded-full h-3">
                        <div
                            className="bg-indigo-600 h-3 rounded-full transition-all"
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                    <p className="text-sm font-bold text-slate-500 mt-4">{Math.round(progress)}% complete</p>
                </div>
            )}

            {/* Complete */}
            {status === 'COMPLETE' && importResult && (
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-12 text-center">
                    <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                        <CheckCircle className="w-10 h-10 text-green-600" />
                    </div>
                    <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-2">Import Complete!</h3>
                    <p className="text-slate-500 mb-8">Your products have been successfully imported.</p>

                    <div className="grid grid-cols-4 gap-6 max-w-xl mx-auto mb-8">
                        <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-4">
                            <p className="text-2xl font-black text-slate-900 dark:text-white">{importResult.total}</p>
                            <p className="text-[10px] font-bold text-slate-500 uppercase">Total Rows</p>
                        </div>
                        <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-4">
                            <p className="text-2xl font-black text-green-600">{importResult.imported}</p>
                            <p className="text-[10px] font-bold text-slate-500 uppercase">Created</p>
                        </div>
                        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4">
                            <p className="text-2xl font-black text-blue-600">{importResult.updated}</p>
                            <p className="text-[10px] font-bold text-slate-500 uppercase">Updated</p>
                        </div>
                        <div className="bg-red-50 dark:bg-red-900/20 rounded-xl p-4">
                            <p className="text-2xl font-black text-red-600">{importResult.failed + importResult.skipped}</p>
                            <p className="text-[10px] font-bold text-slate-500 uppercase">Skipped</p>
                        </div>
                    </div>

                    <button
                        onClick={handleReset}
                        className="px-8 py-3 bg-indigo-600 text-white rounded-xl font-bold text-sm hover:bg-indigo-700 transition-all flex items-center gap-2 mx-auto"
                    >
                        <RefreshCw className="w-4 h-4" /> Import Another File
                    </button>
                </div>
            )}

            {/* File Format Info */}
            {(status === 'IDLE' || status === 'PREVIEW') && (
                <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-6">
                    <h4 className="font-bold text-slate-900 dark:text-white mb-4">Required File Format</h4>
                    <div className="grid grid-cols-7 gap-2 text-center">
                        {['Name*', 'SKU*', 'Category', 'Cost Price*', 'Selling Price*', 'Stock Qty', 'Unit'].map((header) => (
                            <div key={header} className="px-3 py-2 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700">
                                <span className={`text-xs font-bold ${header.includes('*') ? 'text-indigo-600' : 'text-slate-600 dark:text-slate-400'}`}>{header}</span>
                            </div>
                        ))}
                    </div>
                    <p className="text-xs text-slate-500 mt-3">* Required fields. SKU must be unique per tenant. Categories are auto-created if they don't exist.</p>
                </div>
            )}
        </div>
    );
};

export default BulkImport;

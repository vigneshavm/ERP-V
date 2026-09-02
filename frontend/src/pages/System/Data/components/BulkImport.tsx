import { useState, ChangeEvent } from 'react';
import * as XLSX from 'xlsx';
import api from "@/services/api";
import { toast } from 'react-toastify';

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
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [mappingData, setMappingData] = useState<ProcessedRow[]>([]);
    const [showPreview, setShowPreview] = useState(false);
    const [importing, setImporting] = useState(false);
    const [_errors, setErrors] = useState<ImportError[]>([]);

    const validateRow = (row: ProcessedRow, rowIndex: number, allRows: ProcessedRow[]): ValidationResult => {
        const errors: string[] = [];
        const validUnits = [
            'pcs', 'kg', 'g', 'mg', 'l', 'ml', 'box', 'pack', 'bag', 'bottle',
            'can', 'dozen', 'm', 'cm', 'ft', 'unit', 'pair', 'set'
        ];

        if (!row.name || String(row.name).trim() === '') {
            errors.push('Item name is required and cannot be blank');
        }

        if (!row.costPrice || String(row.costPrice) === '') {
            errors.push('Cost price is required');
        } else if (isNaN(Number(row.costPrice)) || Number(row.costPrice) <= 0) {
            errors.push('Cost price must be a positive number');
        }

        if (!row.sellingPrice || String(row.sellingPrice) === '') {
            errors.push('Selling price is required');
        } else if (isNaN(Number(row.sellingPrice)) || Number(row.sellingPrice) <= 0) {
            errors.push('Selling price must be a positive number');
        }

        if (!row.category || String(row.category).trim() === '') {
            errors.push('Category is required and cannot be left blank');
        }

        if (row.unit && String(row.unit).trim() !== '') {
            const unitLower = String(row.unit).toLowerCase().trim();
            if (!validUnits.includes(unitLower)) {
                errors.push(`Invalid unit "${row.unit}". Valid units: ${validUnits.join(', ')}`);
            }
        }

        if (row.sku && String(row.sku).trim() !== '') {
            const skuLower = String(row.sku).toLowerCase().trim();
            const duplicateRows = allRows
                .map((r, idx) => ({ ...r, originalIndex: idx }))
                .filter(r => r.sku && String(r.sku).toLowerCase().trim() === skuLower && r.originalIndex !== rowIndex);

            if (duplicateRows.length > 0) {
                const rowNumbers = [rowIndex + 1, ...duplicateRows.map(r => r.originalIndex + 1)].sort((a, b) => a - b);
                errors.push(
                    `SKU "${row.sku}" is duplicated in rows ${rowNumbers.join(', ')}. Each SKU must be unique to prevent order confusion`
                );
            }
        }

        if (errors.length === 0) {
            if (!row.sku || String(row.sku).trim() === '') {
                return { status: 'warning', errors: ['SKU is empty - recommended for better tracking'] };
            }
            return { status: 'valid', errors: [] };
        }

        return { status: 'error', errors };
    };

    const handleFileSelect = async (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        try {
            setSelectedFile(file);
            const fileData = await file.arrayBuffer();
            const workbook = XLSX.read(fileData, { type: 'array' });
            const worksheet = workbook.Sheets[workbook.SheetNames[0]];
            const data: any[] = XLSX.utils.sheet_to_json(worksheet);

            if (data.length === 0) {
                toast.error('No data found in the file');
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
            toast.success(`Loaded ${data.length} rows from file`);
        } catch (error) {
            console.error('Error reading file:', error);
            toast.error('Error reading file. Please ensure it is a valid Excel or CSV file');
        }
    };

    const handleImport = async () => {
        try {
            setImporting(true);
            const validRows = mappingData.filter(row => row.status === 'valid' || row.status === 'warning');

            if (validRows.length === 0) {
                toast.error('No valid rows to import');
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

            const userStr = localStorage.getItem('user');
            const user = userStr ? JSON.parse(userStr) : null;
            if (!user || !user.token) {
                toast.error('Please login to import items');
                return;
            }

            const response = await api.post(`/api/inventory/import`, {
                items: itemsToImport
            }, {
                headers: {
                    Authorization: `Bearer ${user.token}`
                }
            });

            toast.success(`Successfully imported ${response.data.imported} items and updated ${response.data.updated} items`);

            if (response.data.validationErrors && response.data.validationErrors.length > 0) {
                setErrors(response.data.validationErrors);
                toast.warning(`${response.data.skipped} items were skipped due to validation errors`);
            }

            if (response.data.skipped === 0) {
                setShowPreview(false);
                setSelectedFile(null);
                setMappingData([]);
                setErrors([]);
            }
        } catch (error: any) {
            console.error('Import error:', error);
            const errorMsg = error.response?.data?.message || 'Failed to import items';
            toast.error(errorMsg);

            if (error.response?.data?.validationErrors) {
                setErrors(error.response.data.validationErrors);
            } else if (error.response?.data?.errors) {
                setErrors(error.response.data.errors);
            }
        } finally {
            setImporting(false);
        }
    };

    const validRowsCount = mappingData.filter(row => row.status === 'valid').length;
    const warningRowsCount = mappingData.filter(row => row.status === 'warning').length;
    const errorRowsCount = mappingData.filter(row => row.status === 'error').length;
    const importableRowsCount = validRowsCount + warningRowsCount;

    const downloadSampleFile = () => {
        const sampleData = [
            {
                'Name': 'Rice Bag 25kg',
                'SKU': 'RICE-001',
                'Category': 'Grocery',
                'Cost Price': 450,
                'Selling Price': 500,
                'Stock Quantity': 100,
                'Unit': 'bag'
            },
            {
                'Name': 'Wheat Flour 10kg',
                'SKU': 'WHEAT-001',
                'Category': 'Grocery',
                'Cost Price': 280,
                'Selling Price': 320,
                'Stock Quantity': 150,
                'Unit': 'kg'
            }
        ];

        const worksheet = XLSX.utils.json_to_sheet(sampleData);
        worksheet['!cols'] = [
            { wch: 20 }, { wch: 12 }, { wch: 15 }, { wch: 12 }, { wch: 14 }, { wch: 15 }, { wch: 10 }
        ];

        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Items');
        XLSX.writeFile(workbook, 'sample_import_items.xlsx');
        toast.success('Sample file downloaded successfully');
    };

    return (
        <div className="max-w-7xl mx-auto space-y-6">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-main mb-2">Bulk Import Hub</h1>
                <p className="text-secondary">Import multiple items from CSV or Excel files with auto-validation</p>
            </div>

            <div className="bg-indigo-50 dark:bg-indigo-900/10 border border-indigo-200 dark:border-indigo-900/20 rounded-xl p-6 mb-6">
                <div className="flex items-start">
                    <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg mr-4 text-primary">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                    <div className="flex-1">
                        <h3 className="text-indigo-900 dark:text-indigo-200 font-semibold mb-2 uppercase tracking-widest text-xs">Ingestion Protocol</h3>
                        <ul className="text-secondary text-[11px] font-bold space-y-1 uppercase tracking-tight">
                            <li>• Required headers: Name, Cost Price, Selling Price, Category</li>
                            <li>• Optional headers: SKU, Stock Quantity, Unit</li>
                            <li>• File format: CSV or Excel (.xlsx)</li>
                            <li>• Schema validation: Auto-detects column headers and validates types</li>
                        </ul>
                    </div>
                </div>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm p-8 border border-slate-100 dark:border-slate-800">
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-black uppercase tracking-tight text-slate-900 dark:text-white">Upload Source</h3>
                    <button
                        type="button"
                        onClick={downloadSampleFile}
                        className="flex items-center space-x-2 px-4 py-2 text-primary border border-indigo-100 dark:border-slate-800 rounded-lg hover:bg-slate-50 transition-all text-[10px] font-black uppercase tracking-widest"
                    >
                        <span>Download Sample</span>
                    </button>
                </div>

                <div className="border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl p-12 text-center hover:border-indigo-500 transition-all group cursor-pointer" onClick={() => (document.getElementById('file-upload') as HTMLInputElement).click()}>
                    <input
                        type="file"
                        accept=".csv,.xlsx,.xls"
                        onChange={handleFileSelect}
                        className="hidden"
                        id="file-upload"
                    />
                    <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:bg-indigo-50 transition-colors">
                        <svg className="w-8 h-8 text-slate-400 group-hover:text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                        </svg>
                    </div>
                    <p className="text-slate-600 dark:text-slate-300 font-black text-xs uppercase tracking-widest mb-2">
                        {selectedFile ? selectedFile.name : 'Click to select spreadsheet'}
                    </p>
                    <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">Excel or CSV</p>
                </div>
            </div>

            {showPreview && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                    <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm p-4 border border-slate-100 dark:border-slate-800">
                        <p className="text-slate-400 text-[9px] font-black uppercase tracking-widest">Total Rows</p>
                        <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">{mappingData.length}</p>
                    </div>
                    <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm p-4 border border-slate-100 dark:border-slate-800">
                        <p className="text-success text-[9px] font-black uppercase tracking-widest">Valid</p>
                        <p className="text-2xl font-black text-success mt-1">{validRowsCount}</p>
                    </div>
                    <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm p-4 border border-slate-100 dark:border-slate-800">
                        <p className="text-warning text-[9px] font-black uppercase tracking-widest">Warnings</p>
                        <p className="text-2xl font-black text-warning mt-1">{warningRowsCount}</p>
                    </div>
                    <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm p-4 border border-slate-100 dark:border-slate-800">
                        <p className="text-danger text-[9px] font-black uppercase tracking-widest">Invalid</p>
                        <p className="text-2xl font-black text-danger mt-1">{errorRowsCount}</p>
                    </div>
                </div>
            )}

            {showPreview && (
                <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm overflow-hidden border border-slate-100 dark:border-slate-800 mb-6">
                    <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
                        <h3 className="text-xs font-black uppercase tracking-widest text-slate-500">Heuristic Preview</h3>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-100 dark:border-slate-700">
                                <tr>
                                    <th className="px-6 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Row</th>
                                    <th className="px-6 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                                    <th className="px-6 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Name</th>
                                    <th className="px-6 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">SKU</th>
                                    <th className="px-6 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Category</th>
                                    <th className="px-6 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Price</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs font-bold">
                                {mappingData.slice(0, 10).map((row) => (
                                    <tr key={row.row} className="hover:bg-slate-50 dark:hover:bg-slate-800/30">
                                        <td className="px-6 py-3 text-slate-400">{row.row}</td>
                                        <td className="px-6 py-3">
                                            <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-tighter ${row.status === 'valid' ? 'bg-emerald-50 text-emerald-600' :
                                                    row.status === 'warning' ? 'bg-amber-50 text-amber-600' :
                                                        'bg-rose-50 text-rose-600'
                                                }`}>
                                                {row.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-3 text-slate-700 dark:text-slate-300 uppercase truncate max-w-[150px]">{row.name}</td>
                                        <td className="px-6 py-3 text-slate-500 font-mono tracking-tighter">{row.sku}</td>
                                        <td className="px-6 py-3 text-slate-500">{row.category}</td>
                                        <td className="px-6 py-3 text-slate-900 dark:text-white">₹{row.sellingPrice}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {mappingData.length > 10 && (
                            <div className="p-4 text-center border-t border-slate-100 dark:border-slate-800">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Showing first 10 rows of {mappingData.length}</p>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {showPreview && (
                <div className="flex gap-4">
                    <button
                        onClick={() => {
                            setShowPreview(false);
                            setSelectedFile(null);
                            setMappingData([]);
                        }}
                        className="flex-1 py-4 border border-slate-200 dark:border-slate-800 text-slate-500 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-slate-50 transition-all"
                    >
                        Reset Engine
                    </button>
                    <button
                        onClick={handleImport}
                        disabled={importableRowsCount === 0 || importing}
                        className="flex-[2] py-4 bg-indigo-600 text-white rounded-xl font-black text-xs uppercase tracking-widest shadow-xl shadow-indigo-600/20 active:scale-95 transition-all disabled:opacity-50"
                    >
                        {importing ? 'Syncing...' : `Commit ${importableRowsCount} Records`}
                    </button>
                </div>
            )}
        </div>
    );
};

export default BulkImport;

import { useState, ChangeEvent } from 'react';
import * as XLSX from 'xlsx';
import Layout from "../../../components/shared/Layout/Layout";
import api from "../../../services/api";
import { toast } from 'react-toastify';

const API_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';

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
    [key: string]: any; // Allow flexibility for raw data mapping if needed
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

const ImportItems = () => {
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [mappingData, setMappingData] = useState<ProcessedRow[]>([]);
    // const [columnMapping, setColumnMapping] = useState({}); // Unused in original code logic for now, but referenced in UI
    const [showPreview, setShowPreview] = useState(false);
    const [importing, setImporting] = useState(false);
    const [errors, setErrors] = useState<ImportError[]>([]);

    const validateRow = (row: ProcessedRow, rowIndex: number, allRows: ProcessedRow[]): ValidationResult => {
        const errors: string[] = [];
        const validUnits = [
            'pcs', 'kg', 'g', 'mg', 'l', 'ml', 'box', 'pack', 'bag', 'bottle',
            'can', 'dozen', 'm', 'cm', 'ft', 'unit', 'pair', 'set'
        ];

        // Check required fields
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

        // Validate category - cannot be blank
        if (!row.category || String(row.category).trim() === '') {
            errors.push('Category is required and cannot be left blank');
        }

        // Validate unit label
        if (row.unit && String(row.unit).trim() !== '') {
            const unitLower = String(row.unit).toLowerCase().trim();
            if (!validUnits.includes(unitLower)) {
                errors.push(`Invalid unit "${row.unit}". Valid units: ${validUnits.join(', ')}`);
            }
        }

        // Check for duplicate SKU within the file
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

        // Return status based on errors
        if (errors.length === 0) {
            // Check for warnings (optional fields)
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

            // Process and validate rows
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

            // Validate all rows with context of full dataset
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

            // Prepare data for batch import
            const itemsToImport = validRows.map(row => ({
                name: row.name,
                sku: row.sku || undefined,
                category: row.category || undefined,
                costPrice: parseFloat(String(row.costPrice)),
                sellingPrice: parseFloat(String(row.sellingPrice)),
                stockQty: parseInt(String(row.stock)) || 0,
                unit: row.unit || undefined,
            }));

            // Get token from localStorage
            const userStr = localStorage.getItem('user');
            const user = userStr ? JSON.parse(userStr) : null;
            if (!user || !user.token) {
                toast.error('Please login to import items');
                return;
            }

            // Send to backend for bulk import
            // Note logic below uses API_URL. `api` instance usually has baseURL set. 
            // If api.ts has baseURL, we should use relative path. 
            // But original code used `${API_URL}/api/inventory/import`.
            // Assuming api instance logic is standard axois. If it has baseURL, appending full URL might be double.
            // However, keeping original logic safe: passing full URL to axios usually overrides baseURL.
            // Or better, use relative path if we know api instance has it.
            // Let's stick to original relative structure but cleaner.

            const response = await api.post(`/api/inventory/import`, {
                items: itemsToImport
            }, {
                headers: {
                    Authorization: `Bearer ${user.token}`
                }
            });

            toast.success(`Successfully imported ${response.data.imported} items and updated ${response.data.updated} items`);

            // Show detailed errors if any
            if (response.data.validationErrors && response.data.validationErrors.length > 0) {
                setErrors(response.data.validationErrors);
                toast.warning(`${response.data.skipped} items were skipped due to validation errors`);
            }

            // Reset form if all imported/updated successfully
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
    // Items we can import = valid + warning
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
            },
            {
                'Name': 'Sugar 1kg',
                'SKU': 'SUGAR-001',
                'Category': 'Grocery',
                'Cost Price': 45,
                'Selling Price': 50,
                'Stock Quantity': 200,
                'Unit': 'kg'
            },
            {
                'Name': 'Cooking Oil 1L',
                'SKU': 'OIL-001',
                'Category': 'Grocery',
                'Cost Price': 120,
                'Selling Price': 140,
                'Stock Quantity': 80,
                'Unit': 'l'
            },
        ];

        const worksheet = XLSX.utils.json_to_sheet(sampleData);

        // Set column widths
        worksheet['!cols'] = [
            { wch: 20 }, // Name
            { wch: 12 }, // SKU
            { wch: 15 }, // Category
            { wch: 12 }, // Cost Price
            { wch: 14 }, // Selling Price
            { wch: 15 }, // Stock Quantity
            { wch: 10 }  // Unit
        ];

        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Items');
        XLSX.writeFile(workbook, 'sample_import_items.xlsx');
        toast.success('Sample file downloaded successfully');
    };

    return (
        <Layout>
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-main mb-2">Import Items</h1>
                    <p className="text-secondary">Import multiple items from CSV or Excel files</p>
                </div>

                {/* Instructions Card */}
                <div className="bg-primary-soft/30 border border-primary/20 rounded-xl p-6 mb-6">
                    <div className="flex items-start">
                        <div className="p-2 bg-primary-soft rounded-lg mr-4">
                            <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <div className="flex-1">
                            <h3 className="text-primary-dark font-semibold mb-2">How to Format Your File</h3>
                            <ul className="text-secondary text-sm space-y-1">
                                <li>• <strong>Required headers:</strong> Name, Cost Price, Selling Price, Category</li>
                                <li>• <strong>Optional headers:</strong> SKU, Stock Quantity, Unit</li>
                                <li>• <strong>File format:</strong> CSV or Excel (.xlsx)</li>
                                <li>• <strong>Name:</strong> Must be unique and cannot be blank</li>
                                <li>• <strong>SKU:</strong> Must be unique across all products (prevents order confusion)</li>
                                <li>• <strong>Category:</strong> Required and cannot be left blank</li>
                                <li>• <strong>Unit:</strong> Must be valid (pcs, kg, g, l, ml, box, pack, bag, bottle, etc.)</li>
                                <li>• <strong>Prices:</strong> Must be numeric values without currency symbols</li>
                                <li>• Download our sample file below for proper formatting reference</li>
                            </ul>
                        </div>
                    </div>
                </div>

                {/* File Upload Section */}
                <div className="bg-card rounded-xl shadow-sm p-8 mb-6">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-lg font-semibold text-main">Upload File</h3>
                        <button
                            type="button"
                            onClick={downloadSampleFile}
                            className="flex items-center space-x-2 px-4 py-2 text-primary border border-primary rounded-lg hover:bg-primary-soft transition btn-interactive"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            <span>Download Sample File</span>
                        </button>
                    </div>

                    <div className="border-2 border-dashed border-default rounded-xl p-12 text-center hover:border-primary transition-all group">
                        <input
                            type="file"
                            accept=".csv,.xlsx,.xls"
                            onChange={handleFileSelect}
                            className="hidden"
                            id="file-upload"
                        />
                        <label htmlFor="file-upload" className="cursor-pointer">
                            <div className="w-20 h-20 bg-primary-soft rounded-full flex items-center justify-center mx-auto mb-6 group-hover:bg-primary/20 transition-colors">
                                <svg className="w-10 h-10 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                </svg>
                            </div>
                            <p className="text-secondary font-medium mb-2">
                                {selectedFile ? selectedFile.name : 'Click to upload or drag and drop'}
                            </p>
                            <p className="text-muted text-sm">CSV or Excel files (MAX. 5MB)</p>
                        </label>
                    </div>
                </div>

                {/* Summary Panel */}
                {showPreview && (
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
                        <div className="bg-card rounded-xl shadow-sm p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-secondary text-sm font-medium">Total Rows</p>
                                    <p className="text-3xl font-bold text-primary mt-2">{mappingData.length}</p>
                                </div>
                                <div className="p-3 bg-primary-soft rounded-lg">
                                    <svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                </div>
                            </div>
                        </div>

                        <div className="bg-card rounded-xl shadow-sm p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-secondary text-sm font-medium">Valid Rows</p>
                                    <p className="text-3xl font-bold text-success mt-2">{validRowsCount}</p>
                                </div>
                                <div className="p-3 bg-success-soft rounded-lg">
                                    <svg className="w-8 h-8 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </div>
                            </div>
                        </div>

                        <div className="bg-card rounded-xl shadow-sm p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-secondary text-sm font-medium">Warnings</p>
                                    <p className="text-3xl font-bold text-warning mt-2">{warningRowsCount}</p>
                                </div>
                                <div className="p-3 bg-warning-soft rounded-lg">
                                    <svg className="w-8 h-8 text-warning" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                    </svg>
                                </div>
                            </div>
                        </div>

                        <div className="bg-card rounded-xl shadow-sm p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-secondary text-sm font-medium">Invalid Rows</p>
                                    <p className="text-3xl font-bold text-error mt-2">{errorRowsCount}</p>
                                </div>
                                <div className="p-3 bg-error-soft rounded-lg">
                                    <svg className="w-8 h-8 text-error" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Column Mapping */}
                {showPreview && (
                    <div className="bg-card rounded-xl shadow-sm p-6 mb-6">
                        <h3 className="text-lg font-semibold text-main mb-4">Column Mapping (Auto-detected)</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {['Name', 'SKU', 'Category', 'Cost Price', 'Selling Price', 'Stock Quantity'].map((field) => (
                                <div key={field}>
                                    <label className="block text-sm font-medium text-secondary mb-2">
                                        {field} {['Name', 'Cost Price', 'Selling Price'].includes(field) && <span className="text-error">*</span>}
                                    </label>
                                    <select
                                        className="w-full px-4 py-2 bg-input border border-default rounded-lg focus:ring-2 focus:ring-primary text-main transition-all"
                                        defaultValue={field.toLowerCase().replace(' ', '_')}
                                        disabled
                                    >
                                        <option value="">Select column...</option>
                                        <option value={field.toLowerCase().replace(' ', '_')}>{field}</option>
                                    </select>
                                    <p className="text-xs text-muted mt-1">Found in file</p>
                                </div>
                            ))}
                        </div>
                        <p className="text-sm text-secondary mt-4 font-medium italic">Note: Column mapping is currently automatic based on header names.</p>
                    </div>
                )}

                {/* Preview Table */}
                {showPreview && (
                    <div className="bg-card rounded-xl shadow-sm overflow-hidden mb-6">
                        <div className="p-6 border-b border-default">
                            <h3 className="text-lg font-semibold text-main">Data Preview</h3>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-surface border-b border-default">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-muted uppercase">Row</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-muted uppercase">Status</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-muted uppercase">Name</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-muted uppercase">SKU</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-muted uppercase">Category</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-muted uppercase">Cost Price</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-muted uppercase">Selling Price</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-muted uppercase">Stock</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-card divide-y divide-default">
                                    {mappingData.map((row) => (
                                        <tr key={row.row} className="hover:bg-surface">
                                            <td className="px-6 py-4 text-sm text-main">{row.row}</td>
                                            <td className="px-6 py-4">
                                                {row.status === 'valid' && (
                                                    <span className="px-2 py-1 text-xs font-medium bg-success-soft text-success rounded flex items-center w-fit">
                                                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                        </svg>
                                                        Valid
                                                    </span>
                                                )}
                                                {row.status === 'warning' && (
                                                    <span className="px-2 py-1 text-xs font-medium bg-warning-soft text-warning rounded flex items-center w-fit">
                                                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01" />
                                                        </svg>
                                                        Warning
                                                    </span>
                                                )}
                                                {row.status === 'error' && (
                                                    <span className="px-2 py-1 text-xs font-medium bg-error-soft text-error rounded flex items-center w-fit">
                                                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                        </svg>
                                                        Error
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-main">{row.name || <span className="text-error">Missing</span>}</td>
                                            <td className="px-6 py-4 text-sm text-muted">{row.sku || '-'}</td>
                                            <td className="px-6 py-4 text-sm text-muted">{row.category}</td>
                                            <td className="px-6 py-4 text-sm text-main">₹{row.costPrice}</td>
                                            <td className="px-6 py-4 text-sm text-main">₹{row.sellingPrice}</td>
                                            <td className="px-6 py-4 text-sm text-main">{row.stock}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* Error List */}
                {showPreview && errorRowsCount > 0 && (
                    <div className="bg-error-soft border border-error-soft rounded-xl p-6 mb-6">
                        <h3 className="text-error font-semibold mb-3 flex items-center">
                            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            Validation Errors - Please Fix Before Import
                        </h3>
                        <div className="space-y-4 text-sm text-error">
                            {mappingData
                                .filter(row => row.status === 'error')
                                .map(row => (
                                    <div key={row.row} className="bg-card p-4 rounded-lg border border-error-soft">
                                        <div className="flex items-start">
                                            <div className="flex-shrink-0 mt-0.5">
                                                <div className="w-6 h-6 bg-error-soft rounded-full flex items-center justify-center">
                                                    <svg className="w-4 h-4 text-error" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                    </svg>
                                                </div>
                                            </div>
                                            <div className="ml-3 flex-1">
                                                <div className="font-semibold text-error mb-1">
                                                    Row {row.row}: {row.name || 'Unknown Item'} {row.sku && `(SKU: ${row.sku})`}
                                                </div>
                                                <ul className="space-y-1">
                                                    {row.validationErrors?.map((err, idx) => (
                                                        <li key={idx} className="flex items-start">
                                                            <span className="text-error mr-2">•</span>
                                                            <span className="flex-1">{err}</span>
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                        </div>
                    </div>
                )}

                {/* API Errors */}
                {errors.length > 0 && (
                    <div className="bg-error-soft border border-error-soft rounded-xl p-6 mb-6">
                        <h3 className="text-error font-semibold mb-3 flex items-center">
                            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                            Import Errors From Server
                        </h3>
                        <div className="space-y-3 text-sm text-error">
                            {errors.map((err, idx) => (
                                <div key={idx} className="bg-card p-4 rounded-lg border border-error-soft">
                                    <div className="flex items-start">
                                        <div className="flex-shrink-0 mt-0.5">
                                            <div className="w-6 h-6 bg-error-soft rounded-full flex items-center justify-center" title="Detailed error information">
                                                <svg className="w-4 h-4 text-error" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                </svg>
                                            </div>
                                        </div>
                                        <div className="ml-3 flex-1">
                                            <div className="font-semibold text-error mb-1">
                                                Row {err.row}: {err.itemName} {err.sku && `(SKU: ${err.sku})`}
                                            </div>
                                            {err.errors ? (
                                                <ul className="space-y-1">
                                                    {err.errors.map((error, errorIdx) => (
                                                        <li key={errorIdx} className="flex items-start">
                                                            <span className="text-error mr-2">•</span>
                                                            <span className="flex-1">{error}</span>
                                                        </li>
                                                    ))}
                                                </ul>
                                            ) : (
                                                <p>{err.error}</p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Action Buttons */}
                {showPreview && (
                    <div className="flex space-x-4">
                        <button
                            type="button"
                            onClick={() => {
                                setShowPreview(false);
                                setSelectedFile(null);
                                setMappingData([]);
                                setErrors([]);
                            }}
                            className="flex-1 px-6 py-3 border border-default text-secondary rounded-lg hover:bg-surface font-medium transition disabled:opacity-50"
                            disabled={importing}
                        >
                            Clear / Reset
                        </button>
                        <button
                            type="button"
                            onClick={handleImport}
                            disabled={importableRowsCount === 0 || importing}
                            className="btn-interactive flex-1 px-6 py-4 bg-primary text-white rounded-xl font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 shadow-lg shadow-primary/25"
                        >
                            {importing ? (
                                <>
                                    <svg className="animate-spin h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                    </svg>
                                    <span>Importing...</span>
                                </>
                            ) : (
                                <span>Import {importableRowsCount} Item{importableRowsCount !== 1 ? 's' : ''}</span>
                            )}
                        </button>
                    </div>
                )}
            </div>
        </Layout>
    );
};

export default ImportItems;

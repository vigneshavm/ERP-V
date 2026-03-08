import { useState } from 'react';
import * as XLSX from 'xlsx';
import api from "@/shared/api/api";
import { toast } from 'react-toastify';

export interface ProcessedRow {
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
}

export const useBulkImport = () => {
    const [importing, setImporting] = useState(false);
    const [mappingData, setMappingData] = useState<ProcessedRow[]>([]);
    
    const validateRow = (row: ProcessedRow, rowIndex: number, allRows: ProcessedRow[]) => {
        const errors: string[] = [];
        if (!row.name) errors.push('Name is required');
        if (!row.costPrice || isNaN(Number(row.costPrice))) errors.push('Valid cost price is required');
        if (!row.sellingPrice || isNaN(Number(row.sellingPrice))) errors.push('Valid selling price is required');
        
        if (errors.length === 0) return { status: 'valid' as const, errors: [] };
        return { status: 'error' as const, errors };
    };

    const processFile = async (file: File) => {
        const buffer = await file.arrayBuffer();
        const workbook = XLSX.read(buffer, { type: 'array' });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const data: any[] = XLSX.utils.sheet_to_json(sheet);
        
        const processed: ProcessedRow[] = data.map((r, i) => ({
            row: i + 1,
            name: r['Name'] || r['Item Name'] || '',
            sku: r['SKU'] || '',
            category: r['Category'] || '',
            costPrice: r['Cost Price'] || '',
            sellingPrice: r['Selling Price'] || '',
            stock: r['Stock'] || '0',
            unit: r['Unit'] || '',
        }));

        processed.forEach((r, i) => {
            const v = validateRow(r, i, processed);
            r.status = v.status;
            r.validationErrors = v.errors;
        });

        setMappingData(processed);
    };

    return {
        importing,
        setImporting,
        mappingData,
        setMappingData,
        processFile
    };
};

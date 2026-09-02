import * as XLSX from 'xlsx';

export interface RawPurchaseRow {
    'Invoice No'?: string;
    'Date'?: string;
    'Vendor Name'?: string;
    'Vendor ID'?: string;
    'Product Name'?: string;
    'SKU'?: string;
    'Quantity'?: string | number;
    'Rate'?: string | number;
    'Tax %'?: string | number;
    'Discount Amount'?: string | number;
    'Notes'?: string;
    'Branch'?: string;
}

export interface ValidationResult {
    isValid: boolean;
    errors: string[];
    row: RawPurchaseRow;
    index: number;
}

export const PURCHASE_TEMPLATE_COLUMNS = [
    'Invoice No',
    'Date',
    'Vendor Name',
    'Vendor ID',
    'Product Name',
    'SKU',
    'Quantity',
    'Rate',
    'Tax %',
    'Discount Amount',
    'Notes',
    'Branch'
];

/**
 * Parses an Excel or CSV file into a list of raw objects.
 */
export const parsePurchaseFile = (file: File): Promise<RawPurchaseRow[]> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = new Uint8Array(e.target?.result as ArrayBuffer);
                const workbook = XLSX.read(data, { type: 'array' });
                const firstSheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[firstSheetName];
                const jsonData = XLSX.utils.sheet_to_json<RawPurchaseRow>(worksheet);
                resolve(jsonData);
            } catch {
                reject(new Error('Failed to parse file. Please ensure it is a valid Excel or CSV file.'));
            }
        };
        reader.onerror = () => reject(new Error('File reading error.'));
        reader.readAsArrayBuffer(file);
    });
};

/**
 * Validates a list of raw purchase rows.
 */
export const validatePurchaseData = (rows: RawPurchaseRow[]): ValidationResult[] => {
    return rows.map((row, index) => {
        const errors: string[] = [];

        if (!row['Invoice No']) errors.push('Invoice No is required');
        if (!row['Date']) errors.push('Date is required');
        if (!row['Vendor Name'] && !row['Vendor ID']) errors.push('Vendor Name or ID is required');
        if (!row['Product Name'] && !row['SKU']) errors.push('Product Name or SKU is required');

        const qty = parseFloat(String(row['Quantity'] || '0'));
        if (isNaN(qty) || qty <= 0) errors.push('Quantity must be a positive number');

        const rate = parseFloat(String(row['Rate'] || '0'));
        if (isNaN(rate) || rate < 0) errors.push('Rate must be a non-negative number');

        const tax = parseFloat(String(row['Tax %'] || '0'));
        if (isNaN(tax) || tax < 0 || tax > 100) errors.push('Tax % must be between 0 and 100');

        return {
            isValid: errors.length === 0,
            errors,
            row,
            index
        };
    });
};

/**
 * Groups flat row data into structured purchase objects.
 */
export const groupPurchases = (validatedRows: ValidationResult[]) => {
    const purchases: Record<string, any> = {};

    validatedRows.forEach(({ row }) => {
        const key = `${row['Invoice No']}_${row['Vendor ID'] || row['Vendor Name']}`;

        if (!purchases[key]) {
            purchases[key] = {
                details: {
                    invoice_no: row['Invoice No'],
                    date: row['Date'],
                    notes: row['Notes'] || '',
                    subtotal: 0,
                    tax_amount: 0,
                    discount_amount: 0,
                    total_amount: 0
                },
                items: [],
                p_vendor_id: row['Vendor ID'],
                vendor_name: row['Vendor Name']
            };
        }

        const qty = parseFloat(String(row['Quantity'] || 0));
        const rate = parseFloat(String(row['Rate'] || 0));
        const taxPercent = parseFloat(String(row['Tax %'] || 0));
        const disc = parseFloat(String(row['Discount Amount'] || 0));

        const basic = qty * rate;
        const taxAmount = (basic * taxPercent) / 100;
        const lineTotal = basic + taxAmount - disc;

        purchases[key].items.push({
            product_name: row['Product Name'],
            sku: row['SKU'],
            quantity: qty,
            rate: rate,
            tax_percent: taxPercent,
            tax_amount: taxAmount,
            discount_amount: disc,
            amount: lineTotal
        });

        purchases[key].details.subtotal += basic;
        purchases[key].details.tax_amount += taxAmount;
        purchases[key].details.discount_amount += disc;
        purchases[key].details.total_amount += lineTotal;
    });

    return Object.values(purchases);
};

/**
 * Generates a template Excel file.
 */
export const downloadPurchaseTemplate = () => {
    const data = [
        PURCHASE_TEMPLATE_COLUMNS,
        ['INV-001', '2024-02-05', 'Acme Corp', 'VEN-101', 'Widget A', 'WGT-A-01', 10, 100, 18, 50, 'Monthly supply', 'Main Branch']
    ];

    const worksheet = XLSX.utils.aoa_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Purchases');

    XLSX.writeFile(workbook, 'Purchase_Bulk_Template.xlsx');
};

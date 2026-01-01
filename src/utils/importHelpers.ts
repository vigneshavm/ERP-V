
import { Product } from '../types/product';

export interface ImportResult {
    valid: boolean;
    errors: string[];
    warnings: string[];
    validatedData: Partial<Product>[];
}

export interface CSVRow {
    sku?: string;
    name?: string;
    category?: string;
    price?: string | number;
    stock?: string | number;
    [key: string]: any; // Allow other columns
}

export const validateImport = (
    rows: CSVRow[],
    existingSkus: Set<string> = new Set()
): ImportResult => {
    const result: ImportResult = { valid: true, errors: [], warnings: [], validatedData: [] };
    const processedSkus = new Set<string>();

    rows.forEach((row, index) => {
        const rowNum = index + 1;
        const sku = row.sku ? String(row.sku).trim().toUpperCase() : '';
        const name = row.name ? String(row.name).trim() : '';
        const price = Number(row.price);
        const stock = Number(row.stock);

        // 1. Mandatory Fields
        if (!name) {
            result.errors.push(`Row ${rowNum}: Missing Product Name.`);
        }
        if (isNaN(price) || price < 0) {
            result.errors.push(`Row ${rowNum}: Invalid Price '${row.price}'. Must be a positive number.`);
        }

        // 2. SKU Validation
        if (sku) {
            if (processedSkus.has(sku)) {
                result.errors.push(`Row ${rowNum}: Duplicate SKU '${sku}' found in import file.`);
            } else if (existingSkus.has(sku)) {
                result.errors.push(`Row ${rowNum}: SKU '${sku}' already exists in database.`);
            }
            processedSkus.add(sku);
        } else {
            result.warnings.push(`Row ${rowNum}: SKU is missing. System will auto-generate one.`);
        }

        // 3. Construct Valid Object
        if (result.errors.length === 0) {
            result.validatedData.push({
                ...row,
                name,
                price,
                stock: isNaN(stock) ? 0 : stock,
                sku: sku || undefined // undefined lets the factory auto-generate
            });
        }
    });

    if (result.errors.length > 0) result.valid = false;
    return result;
};

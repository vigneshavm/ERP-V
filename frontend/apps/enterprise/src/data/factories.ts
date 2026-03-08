
import { Product } from "../types/product";
import { Sector } from "../types/common";
import { ProductUnit } from './constants';

export type ShirtInput = Omit<Partial<Product>, 'sector' | 'hsnCode' | 'gstPercentage'> & {
    price: number;
};

// Helper: Apply Pricing & Tax Rules
const applyPricingRules = (product: Partial<Product>): Partial<Product> => {
    const p = { ...product };

    if (p.mrp && p.price) {
        if (p.price > p.mrp) {
            p.price = p.mrp;
        }
        if (p.discount === undefined) {
            p.discount = Math.round(((p.mrp - p.price) / p.mrp) * 100);
        }
    } else if (p.mrp && p.discount) {
        p.price = Math.round(p.mrp * (1 - p.discount / 100));
    }

    // Auto-Tax based on Sector/Price
    if (!p.gstPercentage && p.sector === Sector.TEXTILE) {
        p.gstPercentage = (p.price || 0) > 1000 ? 12 : 5;
    } else if (p.sector === Sector.ELECTRONICS) {
        p.gstPercentage = 18;
    } else {
        // Default fallbacks for other sectors if not provided
        if (!p.gstPercentage) p.gstPercentage = 18;
    }

    return p;
};

// Helper: Systematic SKU Generator (Universal)
const generateSystematicSKU = (product: Partial<Product>): string => {
    const parts: string[] = [];

    // 1. Category 
    if (product.category) parts.push(product.category.substring(0, 3).toUpperCase());

    // 2. Brand
    if (product.brand) parts.push(product.brand.substring(0, 3).toUpperCase());

    // 3. Type
    const type = product.subCategory || product.productType;
    if (type) parts.push(type.substring(0, 4).toUpperCase().replace(/\s/g, ''));

    // 4. Dynamic Attributes (Prioritized List)
    const attributes = [
        product.color, product.style, product.model,
        product.size, product.capacity, product.waist,
        product.weight, product.flavor, product.variantData?.type
    ];

    // Append first 2 non-empty attributes found
    let count = 0;
    for (const attr of attributes) {
        if (attr && count < 2) {
            parts.push(String(attr).substring(0, 4).toUpperCase().replace(/[^A-Z0-9]/g, ''));
            count++;
        }
    }

    return parts.join('-');
};

const generateMockBarcode = (sku: string): string => {
    let hash = 0;
    for (let i = 0; i < sku.length; i++) {
        hash = ((hash << 5) - hash) + sku.charCodeAt(i);
        hash |= 0;
    }
    const positiveHash = Math.abs(hash).toString().padEnd(12, '0');
    return `890${positiveHash.substring(0, 9)}`;
};

// Universal Factory
export const createProduct = (data: Partial<Product> & { price: number, sector: Sector }): Partial<Product> => {
    return applyPricingRules(data);
};

// Specific Factories (Wrappers around Universal)
export const createShirt = (data: ShirtInput): Partial<Product> => {
    return createProduct({ ...data, hsnCode: "6205", sector: Sector.TEXTILE });
};

export const createPant = (data: ShirtInput): Partial<Product> => {
    return createProduct({ ...data, hsnCode: "6203", sector: Sector.TEXTILE });
};

export const createSpare = (data: Partial<Product>): Partial<Product> => {
    return createProduct({
        ...data,
        price: data.price || 0,
        hsnCode: data.hsnCode || "8414",
        sector: Sector.ELECTRONICS,
        productType: "Spare"
    });
};

export const generateVariants = (base: Partial<Product>, variants: Partial<Product>[]): Partial<Product>[] => {
    return variants.map(variant => {
        let merged = { ...base, ...variant };
        merged = applyPricingRules(merged);
        if (!merged.sku) merged.sku = generateSystematicSKU(merged);
        if (!merged.barcode) merged.barcode = generateMockBarcode(merged.sku || '');

        // Dynamic Name Generation
        const variantSuffix = [
            variant.color, variant.size, variant.capacity, variant.weight, variant.flavor
        ].filter(x => x).join(' - ');

        merged.name = variant.name || (variantSuffix ? `${base.name} (${variantSuffix})` : base.name);
        return merged;
    });
};

export const generateProductMatrix = (
    base: Partial<Product>,
    options1: Partial<Product>[],
    options2: Partial<Product>[]
): Partial<Product>[] => {
    const matrix: Partial<Product>[] = [];
    options1.forEach(opt1 => {
        options2.forEach(opt2 => {
            let combined = { ...base, ...opt1, ...opt2 };
            combined = applyPricingRules(combined);
            if (!combined.sku) combined.sku = generateSystematicSKU(combined);
            if (!combined.barcode) combined.barcode = generateMockBarcode(combined.sku || '');

            // Name
            const suffix = [opt1.color, opt1.style, opt1.weight, opt1.flavor, opt2.size, opt2.capacity].filter(x => x).join(' - ');
            combined.name = `${base.name} (${suffix})`;

            matrix.push(combined);
        });
    });
    return matrix;
};

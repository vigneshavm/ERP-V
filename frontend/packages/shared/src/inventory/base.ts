import { Sector } from '../common/common';
import { ProductUnit, TaxMode } from './enums';

export interface BaseProduct {
    id: string;
    _id?: string;
    name: string;
    sku: string; // Stock Keeping Unit (Unique)
    category: string; // High-level category
    subCategory?: string; // Granular category
    productType?: string; // Generic type e.g. Shirt, Mobile

    // WooCommerce-style Variation Support
    parentId?: string; // Backend: parentId
    isParent: boolean;
    model?: string;
    gender?: string;

    // Pricing
    costPrice: number; // Backend: costPrice
    sellingPrice: number; // Backend: sellingPrice
    price?: number; // Frontend/Legacy: price
    cost?: number; // Frontend/Legacy: cost
    mrp?: number;
    discount?: number;
    taxMode?: TaxMode;
    gstPercentage?: number;
    hsnCode?: string;

    // Inventory
    stockQty: number; // Backend: stockQty
    stock?: number; // Frontend/Legacy: stock
    reservedStock?: number;
    inTransitStock?: number;
    lowStockLimit?: number;
    unit: string | ProductUnit;
    secondaryUnit?: string | ProductUnit;
    conversionFactor?: number; // e.g. 1 Box = 12 Pcs

    // Metadata
    tenantId: string;
    branchId?: string;
    addedBy?: string;

    // Frontend Specific / Legacy
    nameTamil?: string;
    sector?: Sector;
    image?: string;
    description?: string;
    barcode?: string;
    brand?: string;
    location?: string;
    isActive?: boolean;
    variantData?: Record<string, string | number | boolean>;

    // Virtuals (Frontend helper)
    availableStock?: number;
}

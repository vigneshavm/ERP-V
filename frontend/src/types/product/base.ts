import { Sector } from '../common';
import { ProductUnit, TaxMode } from './enums';

export interface BaseProduct {
    id: string;
    _id?: string;
    name: string;
    sku: string; // Stock Keeping Unit (Unique)
    category: string; // High-level category
    subCategory?: string; // Granular category
    productType?: string; // Generic type e.g. Shirt, Mobile

    // Pricing
    costPrice: number; // Backend: costPrice
    sellingPrice: number; // Backend: sellingPrice
    mrp?: number;
    discount?: number;
    taxMode?: TaxMode;
    gstPercentage?: number;
    hsnCode?: string;

    // Inventory
    stockQty: number; // Backend: stockQty
    reservedStock?: number;
    inTransitStock?: number;
    lowStockLimit?: number;
    unit: string | ProductUnit;

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
    isActive?: boolean;
    variantData?: Record<string, string | number | boolean>;

    // Virtuals (Frontend helper)
    availableStock?: number;
}

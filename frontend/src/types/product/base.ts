import { Sector } from '../common';
import { ProductUnit, TaxMode } from './enums';

export interface BaseProduct {
    id: string;
    sku: string; // Stock Keeping Unit (Unique)
    name: string;
    nameTamil?: string;
    category: string; // High-level category
    subCategory?: string; // Granular category

    // Pricing & Cost
    price: number; // Selling Price (MRP or Selling Price)
    mrp?: number; // Maximum Retail Price
    cost: number; // Purchase Price / Cost Price
    discount?: number; // Discount percentage or amount
    taxMode?: TaxMode;
    gstPercentage?: number; // Tax Rate
    hsnCode?: string; // Harmonized System Nomenclature

    // Inventory
    stock: number;
    unit?: string | ProductUnit;
    lastRestocked?: string; // ISO Date
    expiryDate?: string; // ISO Date
    location?: string; // Shelf / Bin Location
    branchId?: string;
    tenantId?: string;
    productType?: string; // Generic type field if needed

    // Metadata
    sector: Sector;
    image?: string;
    description?: string;
    barcode?: string;
    brand?: string;
    isActive?: boolean;

    // Extensibility
    variantData?: Record<string, string | number | boolean>;
}

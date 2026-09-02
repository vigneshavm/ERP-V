/**
 * @deprecated THIS STATIC FILE HAS BEEN DEPRECATED AND REPLACED BY DYNAMIC MONGODB SECTOR-MAPPED PRODUCT CATEGORIES.
 * All consumers (POS Quick Entry, POSCartGrid, usePOSLogic) now fetch real-time categories from:
 * GET /api/product-categories?sectorName=<tenant's Business Sector>
 */

export interface ProductType {
    id: string;
    name: string;
    nameTamil?: string;
    gstRate: number;
    hsnCode?: string;
    defaultUnit: string;
}

// Deprecated empty array fallback for legacy type references
export const productTypes: ProductType[] = [];

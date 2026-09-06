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
    price?: number; // Frontend/Legacy: price
    cost?: number; // Frontend/Legacy: cost
    mrp?: number;
    // Optional wholesale unit price, used at POS billing instead of sellingPrice when the active
    // customer's group name matches "wholesale" -- see usePOSLogic.ts's resolveItemPrice.
    wholesaleRate?: number;
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
    warehouseId?: string; // references a MasterEntry of type WAREHOUSE (falls back to 'MAIN_WAREHOUSE' server-side if omitted)
    isActive?: boolean;
    isSerialized?: boolean; // true for items tracked per physical unit (IMEI/serial), e.g. phones
    variantData?: Record<string, string | number | boolean>;

    // Textile-specific descriptors (Textilesoft: purdesign/purpattern/FashionName/ModelNo) --
    // free-text, with a MasterEntry-backed pick-list (type=PRODUCT_DESIGN/PATTERN/etc) offered
    // on the form via a datalist rather than a hard foreign key.
    design?: string;
    pattern?: string;
    modelNo?: string;
    fashionName?: string;
    subgroupId?: string; // references a MasterEntry of type PRODUCT_SUBGROUP

    // Virtuals (Frontend helper)
    availableStock?: number;
}

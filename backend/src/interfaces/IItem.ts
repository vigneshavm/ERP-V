import { Document, Types } from "mongoose";

export interface IItem extends Document {
    name: string;
    sku?: string;
    barcode?: string;
    hsnCode?: string;  // HSN/SAC code for GST
    gstRate?: 0 | 5 | 12 | 18 | 28; // Standard GST slabs
    category?: string;
    costPrice: number;
    sellingPrice: number;
    // Optional wholesale unit price -- used at POS billing time instead of sellingPrice when the
    // active customer belongs to a customer group whose name matches "wholesale" (see
    // usePOSLogic.ts's resolveItemPrice). Minimal wholesale/retail billing path: no separate
    // wholesale invoice flow, just a per-item price override plus the customer group's existing
    // meta.discountPercent (see CustomerGroups.tsx) applied at checkout.
    wholesaleRate?: number;
    stockQty: number;
    reservedStock: number;
    inTransitStock: number;
    lowStockLimit: number;
    unit: string;
    color?: string;
    size?: string;
    brand?: string;
    shelfCode?: string;
    shelfType?: 'FULL' | 'HALF';
    washingInstructions?: string;
    categoryCode?: string;
    // Textile-specific descriptors (Textilesoft: purdesign/purpattern/FashionName/ModelNo) --
    // free-text like brand/color/size, with a MasterEntry-backed pick-list on the frontend so
    // the vocabulary can be admin-managed without locking the field to a hard foreign key.
    design?: string;
    pattern?: string;
    modelNo?: string;
    fashionName?: string;
    subgroupId?: Types.ObjectId | string; // references a MasterEntry of type PRODUCT_SUBGROUP
    isActive: boolean;
    isSerialized?: boolean; // true for items tracked per physical unit (IMEI/serial), e.g. phones
    addedBy: string; // ObjectId of User - Keep for audit
    tenantId: Types.ObjectId | string; // ObjectId of Tenant - NEW: Scoping
    valuationMethod: 'FIFO' | 'WAC';
    batches: {
        batchNumber: string;
        expiryDate?: Date;
        quantity: number;
        costPrice: number;
        supplierId: Types.ObjectId | string;
        receivedDate: Date;
    }[];
    storeLevels: {
        storeId: Types.ObjectId | string;
        qty: number;
        reservedQty: number;
    }[];
    warehouseId?: string;
    binLocation?: string;
    warehouseLevels?: {
        warehouseId: string;
        binLocation?: string;
        qty: number;
    }[];

    // Virtuals
    availableStock: number;
    overCommittedStock: number;

    // Timestamps
    createdAt: Date;
    updatedAt: Date;
}

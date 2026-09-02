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
    isActive: boolean;
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

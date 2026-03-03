import { Document, Types } from "mongoose";

export interface IItem extends Document {
    name: string;
    sku?: string;
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

    // Virtuals
    availableStock: number;
    overCommittedStock: number;

    // Timestamps
    createdAt: Date;
    updatedAt: Date;
}

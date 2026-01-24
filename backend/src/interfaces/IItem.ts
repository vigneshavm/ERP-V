import { Document } from "mongoose";

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
    addedBy: string; // ObjectId of User

    // Virtuals
    availableStock: number;
    overCommittedStock: number;

    // Timestamps
    createdAt: Date;
    updatedAt: Date;
}

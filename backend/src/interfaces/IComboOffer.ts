import { Document, Types } from "mongoose";

export interface IComboOfferItem {
    itemId: Types.ObjectId | string;
    quantity: number; // combo quantity set (cqtyset) -- how many units of this item go into one bundle
}

export interface IComboOffer extends Document {
    name: string;
    comboCode: string; // human-facing code, unique per tenant
    description?: string;
    items: IComboOfferItem[];
    offerPrice: number; // bundle MRP (offMRP)
    regularPrice: number; // sum of the linked items' sellingPrice * quantity, snapshotted at save time
    barcode?: string; // combo-specific barcode, separate from any individual item's barcode
    validFrom?: Date;
    validTo?: Date;
    isActive: boolean;
    tenantId: Types.ObjectId | string;
    createdBy: string;

    // Virtuals
    discountPercent: number;

    createdAt: Date;
    updatedAt: Date;
}

import mongoose, { Schema, Document } from "mongoose";

export interface IPurchaseItem {
    productId: mongoose.Types.ObjectId;
    productName: string;
    unitId?: string;
    quantity: number;
    rate: number;
    taxPercent?: number;
    taxAmount?: number;
    discountAmount?: number;
    amount: number;
    margin?: number;
    sellingPrice?: number;
    color?: string;
    size?: string;
    categoryCode?: string;
}

export interface IPurchase extends Document {
    purchaseNumber: string;
    tenantId: string;
    branchId?: string;
    vendorId: mongoose.Types.ObjectId;
    date: Date;
    invoiceNo?: string;
    subtotal: number;
    taxAmount: number;
    discountAmount: number;
    shippingAmount?: number;
    roundOff?: number;
    totalAmount: number;
    items: IPurchaseItem[];
    notes?: string;
    status: 'DRAFT' | 'COMPLETED' | 'CANCELLED';
    createdBy: mongoose.Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
}

const purchaseItemSchema = new Schema({
    productId: { type: Schema.Types.ObjectId, ref: 'Item', required: true },
    productName: { type: String, required: true },
    unitId: { type: String, default: 'Piece' },
    quantity: { type: Number, required: true },
    rate: { type: Number, required: true },
    taxPercent: { type: Number, default: 0 },
    taxAmount: { type: Number, default: 0 },
    discountAmount: { type: Number, default: 0 },
    amount: { type: Number, required: true },
    margin: { type: Number, default: 0 },
    sellingPrice: { type: Number, default: 0 },
    color: { type: String },
    size: { type: String },
    categoryCode: { type: String }
}, { _id: false });

const purchaseSchema = new Schema({
    purchaseNumber: { type: String, required: true, unique: true },
    tenantId: { type: String, required: true },
    branchId: { type: String },
    vendorId: { type: Schema.Types.ObjectId, ref: 'Supplier', required: true },
    date: { type: Date, required: true, default: Date.now },
    invoiceNo: { type: String },
    subtotal: { type: Number, required: true, default: 0 },
    taxAmount: { type: Number, required: true, default: 0 },
    discountAmount: { type: Number, required: true, default: 0 },
    shippingAmount: { type: Number, default: 0 },
    roundOff: { type: Number, default: 0 },
    totalAmount: { type: Number, required: true, default: 0 },
    items: [purchaseItemSchema],
    notes: { type: String },
    status: {
        type: String,
        enum: ['DRAFT', 'COMPLETED', 'CANCELLED'],
        default: 'DRAFT'
    },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true }
}, { timestamps: true });

purchaseSchema.index({ tenantId: 1, date: -1 });

const Purchase = mongoose.model<IPurchase>("Purchase", purchaseSchema);
export default Purchase;

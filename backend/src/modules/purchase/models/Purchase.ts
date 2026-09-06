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
    // Wholesale/Retail (WR) Billing: bulk/wholesale rate captured at intake time, separate from
    // `rate` (the landed cost) and `sellingPrice` (retail MRP). Mirrors Item.wholesaleRate's
    // existing convention (see Item.ts) -- when a new Item is created from this row (see
    // createPurchase), this value seeds that field so POS's existing wholesale pricing
    // (usePOSLogic.ts's resolveItemPrice) picks it up automatically.
    wholesaleRate?: number;
    color?: string;
    size?: string;
    categoryCode?: string;
    lotNumber?: string;
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
    // Wholesale/Retail (WR) Billing: which intake track this purchase came through -- see
    // IInvoice.ts's saleChannel for the sales-side equivalent. WHOLESALE purchases get a
    // "WRPUR-" purchaseNumber series instead of "PUR-" (see generatePurchaseNumber).
    channel?: 'RETAIL' | 'WHOLESALE';
    expectedDeliveryDate?: Date;
    approvedBy?: mongoose.Types.ObjectId;
    approvedAt?: Date;
    sentToVendorAt?: Date;
    status: 'DRAFT' | 'SUBMITTED' | 'APPROVED' | 'SENT_TO_VENDOR' | 'PARTIALLY_RECEIVED' | 'COMPLETED' | 'CANCELLED' | 'RECEIVED';
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
    wholesaleRate: { type: Number },
    color: { type: String },
    size: { type: String },
    categoryCode: { type: String },
    lotNumber: { type: String }
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
    channel: {
        type: String,
        enum: ['RETAIL', 'WHOLESALE'],
        default: 'RETAIL'
    },
    expectedDeliveryDate: { type: Date },
    approvedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    approvedAt: { type: Date },
    sentToVendorAt: { type: Date },
    status: {
        type: String,
        enum: ['DRAFT', 'SUBMITTED', 'APPROVED', 'SENT_TO_VENDOR', 'PARTIALLY_RECEIVED', 'COMPLETED', 'CANCELLED', 'RECEIVED'],
        default: 'DRAFT'
    },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true }
}, { timestamps: true });

purchaseSchema.index({ tenantId: 1, date: -1 });

const Purchase = mongoose.model<IPurchase>("Purchase", purchaseSchema);
export default Purchase;

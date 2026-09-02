import mongoose, { Schema, Document } from "mongoose";

export interface IGRNItem {
    productId: mongoose.Types.ObjectId;
    productName: string;
    orderedQty: number;
    receivedQty: number;
    acceptedQty: number;
    damagedQty: number;
    rejectedQty: number;
    rate: number;
    rejectionReason?: string;
    lotNumber?: string;
}

export interface IGRN extends Document {
    grnNumber: string;
    tenantId: string;
    purchaseId: mongoose.Types.ObjectId;
    vendorId: mongoose.Types.ObjectId;
    receivedDate: Date;
    warehouseId?: string;
    deliveryNoteNo?: string;
    status: 'INSPECTED' | 'ACCEPTED' | 'REJECTED' | 'PARTIAL';
    items: IGRNItem[];
    notes?: string;
    receivedBy: mongoose.Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
}

const grnItemSchema = new Schema({
    productId: { type: Schema.Types.ObjectId, ref: 'Item', required: true },
    productName: { type: String, required: true },
    orderedQty: { type: Number, required: true, default: 0 },
    receivedQty: { type: Number, required: true, default: 0 },
    acceptedQty: { type: Number, required: true, default: 0 },
    damagedQty: { type: Number, default: 0 },
    rejectedQty: { type: Number, default: 0 },
    rate: { type: Number, required: true, default: 0 },
    rejectionReason: { type: String },
    lotNumber: { type: String }
}, { _id: false });

const grnSchema = new Schema({
    grnNumber: { type: String, required: true, unique: true },
    tenantId: { type: String, required: true, index: true },
    purchaseId: { type: Schema.Types.ObjectId, ref: 'Purchase', required: true },
    vendorId: { type: Schema.Types.ObjectId, ref: 'Supplier', required: true },
    receivedDate: { type: Date, required: true, default: Date.now },
    warehouseId: { type: String, default: 'MAIN_WAREHOUSE' },
    deliveryNoteNo: { type: String },
    status: {
        type: String,
        enum: ['INSPECTED', 'ACCEPTED', 'REJECTED', 'PARTIAL'],
        default: 'INSPECTED'
    },
    items: [grnItemSchema],
    notes: { type: String },
    receivedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true }
}, { timestamps: true });

grnSchema.index({ tenantId: 1, purchaseId: 1 });

const GRN = mongoose.model<IGRN>("GRN", grnSchema);
export default GRN;

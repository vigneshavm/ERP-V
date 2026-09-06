import mongoose, { Schema, Document } from "mongoose";

// Textilesoft's GRNwiseMaterialTransfer / GRNwiseComboMaterialTransfer pages: move stock that
// was received under a specific GRN from one warehouse/bin location to another, keeping an
// audit trail back to the originating goods receipt. Unlike a plain stock adjustment, this is
// scoped to "material that came in on GRN X" rather than the item's stock in the abstract.
export interface IGRNTransferItem {
    productId: mongoose.Types.ObjectId;
    productName: string;
    quantity: number;
    batchNumber?: string;
}

export interface IGRNTransfer extends Document {
    transferNumber: string;
    tenantId: string;
    sourceGrnId: mongoose.Types.ObjectId;
    fromWarehouseId: string;
    toWarehouseId: string;
    items: IGRNTransferItem[];
    transferDate: Date;
    notes?: string;
    createdBy: mongoose.Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
}

const grnTransferItemSchema = new Schema({
    productId: { type: Schema.Types.ObjectId, ref: 'Item', required: true },
    productName: { type: String, required: true },
    quantity: { type: Number, required: true, min: 0.0001 },
    batchNumber: { type: String }
}, { _id: false });

const grnTransferSchema = new Schema({
    transferNumber: { type: String, required: true, unique: true },
    tenantId: { type: String, required: true, index: true },
    sourceGrnId: { type: Schema.Types.ObjectId, ref: 'GRN', required: true },
    fromWarehouseId: { type: String, required: true },
    toWarehouseId: { type: String, required: true },
    items: { type: [grnTransferItemSchema], required: true, validate: (v: any[]) => v.length > 0 },
    transferDate: { type: Date, required: true, default: Date.now },
    notes: { type: String },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true }
}, { timestamps: true });

grnTransferSchema.index({ tenantId: 1, sourceGrnId: 1 });

const GRNTransfer = mongoose.model<IGRNTransfer>("GRNTransfer", grnTransferSchema);
export default GRNTransfer;

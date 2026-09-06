import mongoose, { Schema, Document } from "mongoose";

// General inter-warehouse stock move, NOT scoped to a goods receipt. GRNTransfer (see
// backend/src/modules/purchase/models/GRNTransfer.ts) requires a sourceGrnId and only moves
// stock traceable to one specific GRN -- this covers the ordinary case of moving existing stock
// between warehouses regardless of when/how it arrived, closing the Textilesoft
// MaterialTransfer/StoreTransferEntry gap (as opposed to its GRN-scoped sibling).
export interface IStockTransferItem {
    productId: mongoose.Types.ObjectId;
    productName: string;
    quantity: number;
}

export interface IStockTransfer extends Document {
    transferNumber: string;
    tenantId: string;
    fromWarehouseId: string;
    toWarehouseId: string;
    items: IStockTransferItem[];
    transferDate: Date;
    notes?: string;
    createdBy: mongoose.Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
}

const stockTransferItemSchema = new Schema({
    productId: { type: Schema.Types.ObjectId, ref: 'Item', required: true },
    productName: { type: String, required: true },
    quantity: { type: Number, required: true, min: 0.0001 }
}, { _id: false });

const stockTransferSchema = new Schema({
    transferNumber: { type: String, required: true, unique: true },
    tenantId: { type: String, required: true, index: true },
    fromWarehouseId: { type: String, required: true },
    toWarehouseId: { type: String, required: true },
    items: { type: [stockTransferItemSchema], required: true, validate: (v: any[]) => v.length > 0 },
    transferDate: { type: Date, required: true, default: Date.now },
    notes: { type: String },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true }
}, { timestamps: true });

stockTransferSchema.index({ tenantId: 1, createdAt: -1 });

const StockTransfer = mongoose.model<IStockTransfer>("StockTransfer", stockTransferSchema);
export default StockTransfer;

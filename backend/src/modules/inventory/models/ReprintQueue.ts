import mongoose, { Schema, Document } from "mongoose";

export interface IReprintQueueItem {
    itemId: mongoose.Types.ObjectId;
    itemName: string;
    sku: string;
    oldPrice: number;
    newPrice: number;
    quantity: number;
    reason?: string;
}

export interface IReprintQueue extends Document {
    tenantId: mongoose.Types.ObjectId;
    items: IReprintQueueItem[];
    createdAt: Date;
    updatedAt: Date;
}

const reprintQueueItemSchema = new Schema({
    itemId: { type: Schema.Types.ObjectId, ref: 'Item', required: true },
    itemName: { type: String, required: true },
    sku: { type: String, required: true },
    oldPrice: { type: Number },
    newPrice: { type: Number, required: true },
    quantity: { type: Number, required: true },
    reason: { type: String }
}, { _id: false });

const reprintQueueSchema = new Schema({
    tenantId: { type: Schema.Types.ObjectId, ref: 'Tenant', required: true, index: true },
    items: [reprintQueueItemSchema]
}, { timestamps: true });

const ReprintQueue = mongoose.model<IReprintQueue>("ReprintQueue", reprintQueueSchema);
export default ReprintQueue;

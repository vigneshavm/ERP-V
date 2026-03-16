import mongoose, { Schema } from "mongoose";
const reprintQueueItemSchema = new Schema({
    itemId: { type: Schema.Types.ObjectId, ref: 'Item', required: true },
    itemName: { type: String, required: true },
    sku: { type: String, required: true },
    oldPrice: { type: Number },
    newPrice: { type: Number, required: true },
    quantity: { type: Number, required: true },
    reason: { type: String },
    updatedAt: { type: Date, default: Date.now }
}, { _id: false });
const reprintQueueSchema = new Schema({
    tenantId: { type: Schema.Types.ObjectId, ref: 'Tenant', required: true, index: true },
    items: [reprintQueueItemSchema]
}, { timestamps: true });
const ReprintQueue = mongoose.model("ReprintQueue", reprintQueueSchema);
export default ReprintQueue;

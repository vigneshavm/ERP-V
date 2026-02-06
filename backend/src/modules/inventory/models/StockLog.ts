import mongoose, { Schema } from "mongoose";
import { IStockLog } from "../../../interfaces/IStockLog.js";

const stockLogSchema = new Schema<IStockLog>(
    {
        itemId: {
            type: Schema.Types.ObjectId,
            ref: "Item",
            required: true,
            index: true
        },
        tenantId: {
            type: Schema.Types.ObjectId,
            ref: "Tenant",
            required: true,
            index: true
        },
        type: {
            type: String,
            enum: ['ADD', 'SUBTRACT', 'SET', 'SALE', 'PURCHASE', 'INIT'],
            required: true
        },
        delta: {
            type: Number,
            required: true
        },
        finalQty: {
            type: Number,
            required: true
        },
        reason: {
            type: String
        },
        performedBy: {
            type: String,
            ref: "User",
            required: true
        }
    },
    { timestamps: true }
);

// Index for fast history retrieval
stockLogSchema.index({ itemId: 1, createdAt: -1 });

const StockLog = mongoose.model<IStockLog>("StockLog", stockLogSchema);
export default StockLog;

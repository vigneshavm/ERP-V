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
            // Every value InventoryService.ts actually writes: 'INIT' (addItem/importItems),
            // 'PURCHASE' (addStock), 'ADJUST' (bulkAdjustStock/updateItem/updateBatchCost),
            // 'SALES' and 'RETURN' (reduceStock — the B2C checkout path). The enum previously
            // only had 'ADD' | 'SUBTRACT' | 'SET' | 'SALE' | 'PURCHASE' | 'INIT', so every
            // reduceStock() call (i.e. every POS sale) threw a Mongoose ValidationError here and
            // rolled back the whole invoice transaction. 'ADD'/'SUBTRACT'/'SET'/'SALE' kept for
            // backward compatibility with any existing StockLog documents using those values.
            enum: ['ADD', 'SUBTRACT', 'SET', 'SALE', 'SALES', 'PURCHASE', 'INIT', 'ADJUST', 'RETURN'],
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

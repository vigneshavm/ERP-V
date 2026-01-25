import mongoose, { Document, Schema } from "mongoose";

export interface IStockMovement extends Document {
    item: mongoose.Types.ObjectId;
    type: "RESERVE" | "RELEASE" | "DELIVER" | "IN_TRANSIT" | "POS_SALE" | "RETURN" | "INVOICE";
    quantity: number;
    sourceId: mongoose.Types.ObjectId;
    sourceType: "SalesOrder" | "DeliveryChallan" | "Invoice" | "Return";
    previousStock: number;
    previousReserved: number;
    previousInTransit: number;
    newStock: number;
    newReserved: number;
    newInTransit: number;
    createdBy: mongoose.Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
}

const stockMovementSchema = new Schema<IStockMovement>(
    {
        item: {
            type: Schema.Types.ObjectId,
            ref: "Item",
            required: true,
        },
        type: {
            type: String,
            enum: ["RESERVE", "RELEASE", "DELIVER", "IN_TRANSIT", "POS_SALE", "RETURN", "INVOICE"],
            required: true,
        },
        quantity: {
            type: Number,
            required: true,
        },
        sourceId: {
            type: Schema.Types.ObjectId,
            required: true,
        },
        sourceType: {
            type: String,
            enum: ["SalesOrder", "DeliveryChallan", "Invoice", "Return"],
            required: true,
        },
        // Before state
        previousStock: {
            type: Number,
            required: true,
        },
        previousReserved: {
            type: Number,
            required: true,
        },
        previousInTransit: {
            type: Number,
            required: true,
        },
        // After state
        newStock: {
            type: Number,
            required: true,
        },
        newReserved: {
            type: Number,
            required: true,
        },
        newInTransit: {
            type: Number,
            required: true,
        },
        createdBy: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
    },
    { timestamps: true }
);

// Index for faster queries
stockMovementSchema.index({ item: 1, createdAt: -1 });
stockMovementSchema.index({ sourceId: 1, sourceType: 1 });
stockMovementSchema.index({ type: 1 });

const StockMovement = mongoose.model<IStockMovement>("StockMovement", stockMovementSchema);
export default StockMovement;

import mongoose, { Document, Schema } from "mongoose";

export interface IRateRevision extends Document {
    itemId: mongoose.Types.ObjectId;
    supplierId: mongoose.Types.ObjectId;
    batchNumber: string; // The specific batch being revised
    oldRate: number;
    newRate: number;
    affectedQty: number; // Qty currently in stock or total received? Ideally total received if we want to pay for all, but cost update only affects stock? 
    // Requirement says "Rate Difference After Sale". So we likely pay for the whole batch, but margin adjustment only affects sold + stock?
    // Let's assume affectedQty is the total Quantity of the batch originally received (or remaining?).
    // Usually, supplier asks for diff on TOTAL supplied quantity.
    diffAmount: number; // (NewRate - OldRate) * affectedQty
    reason: string;
    status: 'PENDING' | 'APPROVED' | 'REJECTED';
    tenantId: string;
    createdBy: mongoose.Types.ObjectId;
    approvedBy?: mongoose.Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
}

const rateRevisionSchema = new Schema<IRateRevision>(
    {
        itemId: {
            type: Schema.Types.ObjectId,
            ref: "Item",
            required: true,
        },
        supplierId: {
            type: Schema.Types.ObjectId,
            ref: "Supplier",
            required: true,
        },
        batchNumber: {
            type: String,
            required: true,
        },
        oldRate: {
            type: Number,
            required: true,
        },
        newRate: {
            type: Number,
            required: true,
        },
        affectedQty: {
            type: Number,
            required: true,
        },
        diffAmount: {
            type: Number,
            required: true,
        },
        reason: {
            type: String,
        },
        status: {
            type: String,
            enum: ['PENDING', 'APPROVED', 'REJECTED'],
            default: 'PENDING',
        },
        tenantId: {
            type: String,
            required: true,
        },
        createdBy: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        approvedBy: {
            type: Schema.Types.ObjectId,
            ref: "User",
        },
    },
    { timestamps: true }
);

const RateRevision = mongoose.model<IRateRevision>("RateRevision", rateRevisionSchema);
export default RateRevision;

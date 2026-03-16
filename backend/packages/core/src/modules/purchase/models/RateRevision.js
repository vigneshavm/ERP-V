import mongoose, { Schema } from "mongoose";
const rateRevisionSchema = new Schema({
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
}, { timestamps: true });
const RateRevision = mongoose.model("RateRevision", rateRevisionSchema);
export default RateRevision;

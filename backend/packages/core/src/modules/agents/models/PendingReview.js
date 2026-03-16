import mongoose, { Schema } from "mongoose";
const pendingReviewSchema = new Schema({
    tenantId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Tenant",
        required: true,
    },
    extractedData: {
        vendor: { type: String, required: true },
        date: { type: Date, required: true },
        amount: { type: Number, required: true },
        currency: { type: String, default: 'INR' },
        category: { type: String },
        taxAmount: { type: Number, default: 0 },
    },
    receiptUrl: { type: String, required: true },
    auditReason: { type: String, required: true },
    status: {
        type: String,
        enum: ['pending', 'approved', 'rejected'],
        default: 'pending',
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
}, { timestamps: true });
const PendingReview = mongoose.model("PendingReview", pendingReviewSchema);
export default PendingReview;

import mongoose, { Schema, Document } from "mongoose";

export interface IPendingReview extends Document {
    tenantId: mongoose.Schema.Types.ObjectId;
    extractedData: {
        vendor: string;
        date: Date;
        amount: number;
        currency: string;
        category?: string;
        taxAmount?: number;
    };
    receiptUrl: string; // URL to original image for side-by-side review
    auditReason: string;
    status: 'pending' | 'approved' | 'rejected';
    createdBy: mongoose.Schema.Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
}

const pendingReviewSchema = new Schema<IPendingReview>(
    {
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
    },
    { timestamps: true }
);

const PendingReview = mongoose.model<IPendingReview>("PendingReview", pendingReviewSchema);
export default PendingReview;

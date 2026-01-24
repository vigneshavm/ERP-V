import mongoose, { Document, Schema } from "mongoose";

export interface IDueAdjustment extends Document {
    customer: mongoose.Types.ObjectId;
    relatedInvoice?: mongoose.Types.ObjectId;
    adjustmentAmount: number;
    adjustmentMethod: "cash" | "bank" | "credit" | "original_payment";
    previousDue: number;
    updatedDue: number;
    notes: string;
    createdBy: mongoose.Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
}

const dueAdjustmentSchema = new Schema<IDueAdjustment>(
    {
        customer: {
            type: Schema.Types.ObjectId,
            ref: "Customer",
            required: true,
        },
        relatedInvoice: {
            type: Schema.Types.ObjectId,
            ref: "Invoice",
            default: null,
        },
        adjustmentAmount: {
            type: Number,
            required: true,
            min: 0,
        },
        adjustmentMethod: {
            type: String,
            enum: ["cash", "bank", "credit", "original_payment"],
            required: true,
        },
        previousDue: {
            type: Number,
            required: true,
        },
        updatedDue: {
            type: Number,
            required: true,
        },
        notes: {
            type: String,
            default: "",
        },
        createdBy: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
    },
    { timestamps: true }
);

// Compound index for customer and user queries
dueAdjustmentSchema.index({ customer: 1, createdBy: 1 });

// Index on createdBy for user-specific queries
dueAdjustmentSchema.index({ createdBy: 1 });

const DueAdjustment = mongoose.model<IDueAdjustment>("DueAdjustment", dueAdjustmentSchema);
export default DueAdjustment;

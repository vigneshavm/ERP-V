import mongoose, { Schema, Document, Types } from "mongoose";

export interface IBranch extends Document {
    name: string;
    address?: string;
    phone?: string;
    email?: string;
    isMain: boolean;
    tenantId: Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
}

const branchSchema = new Schema<IBranch>(
    {
        name: {
            type: String,
            required: [true, "Branch name is required"],
            trim: true
        },
        address: {
            type: String,
            trim: true
        },
        phone: {
            type: String,
            trim: true
        },
        email: {
            type: String,
            trim: true,
            lowercase: true
        },
        isMain: {
            type: Boolean,
            default: false
        },
        tenantId: {
            type: Schema.Types.ObjectId,
            ref: "Tenant",
            required: true,
            index: true
        }
    },
    { timestamps: true }
);

// Ensure unique branch name per tenant
branchSchema.index({ name: 1, tenantId: 1 }, { unique: true });

const Branch = mongoose.model<IBranch>("Branch", branchSchema);
export default Branch;

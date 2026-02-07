import mongoose, { Schema, Document } from "mongoose";

export interface IClearingParameter extends Document {
    sector: string;
    type: 'Local' | 'Outstation' | 'HighValue';
    clearingDays: number;
    holidaysIncluded: boolean;
    tenantId: mongoose.Schema.Types.ObjectId;
    userId: string;
    createdAt: Date;
    updatedAt: Date;
}

const clearingParameterSchema = new Schema<IClearingParameter>(
    {
        sector: {
            type: String,
            required: [true, "Sector is required"],
            index: true,
        },
        type: {
            type: String,
            enum: ['Local', 'Outstation', 'HighValue'],
            required: true,
        },
        clearingDays: {
            type: Number,
            required: true,
            default: 1
        },
        holidaysIncluded: {
            type: Boolean,
            default: false
        },
        tenantId: {
            type: Schema.Types.ObjectId,
            ref: "Tenant",
            required: true,
            index: true,
        },
        userId: {
            type: String,
            ref: "User",
            required: true,
        }
    },
    { timestamps: true }
);

// Ensure unique combination of sector and type per tenant
clearingParameterSchema.index({ tenantId: 1, sector: 1, type: 1 }, { unique: true });

const ClearingParameter = mongoose.model<IClearingParameter>("ClearingParameter", clearingParameterSchema);
export default ClearingParameter;

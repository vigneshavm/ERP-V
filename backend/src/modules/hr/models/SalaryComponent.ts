import mongoose, { Document, Schema } from "mongoose";

export interface ISalaryComponent extends Document {
    tenantId: mongoose.Types.ObjectId;
    name: string; // e.g., Basic, HRA, Provident Fund
    type: 'EARNING' | 'DEDUCTION';
    calculationType: 'FIXED' | 'PERCENTAGE_OF_BASIC';
    defaultValue?: number; // e.g., 0 or percentage value
    isActive: boolean;
    isTaxable: boolean;
}

const salaryComponentSchema = new Schema<ISalaryComponent>(
    {
        tenantId: {
            type: Schema.Types.ObjectId,
            ref: "Tenant",
            required: true,
        },
        name: {
            type: String,
            required: true,
            trim: true,
        },
        type: {
            type: String,
            enum: ['EARNING', 'DEDUCTION'],
            required: true,
        },
        calculationType: {
            type: String,
            enum: ['FIXED', 'PERCENTAGE_OF_BASIC'],
            default: 'FIXED',
        },
        defaultValue: {
            type: Number,
            default: 0,
        },
        isActive: {
            type: Boolean,
            default: true,
        },
        isTaxable: {
            type: Boolean,
            default: true
        }
    },
    { timestamps: true }
);

// Index to prevent duplicate component names per tenant
salaryComponentSchema.index({ tenantId: 1, name: 1 }, { unique: true });

const SalaryComponent = mongoose.model<ISalaryComponent>("SalaryComponent", salaryComponentSchema);
export default SalaryComponent;

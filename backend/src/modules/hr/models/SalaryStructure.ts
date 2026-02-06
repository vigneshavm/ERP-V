import mongoose, { Document, Schema } from "mongoose";

export interface ISalaryStructure extends Document {
    tenantId: mongoose.Types.ObjectId;
    employeeId: mongoose.Types.ObjectId;
    effectiveFrom: Date;
    components: {
        componentId: mongoose.Types.ObjectId; // Ref to SalaryComponent
        amount: number; // The logic-resolved amount (or base for calc)
        calculationValue?: number; // e.g., 12 for 12% if percentage based, logic handled in service
    }[];
    grossSalary: number; // Pre-calculated monthly gross
    netSalaryEstimate: number; // Pre-calculated estimate
    isActive: boolean;
}

const salaryStructureSchema = new Schema<ISalaryStructure>(
    {
        tenantId: {
            type: Schema.Types.ObjectId,
            ref: "Tenant",
            required: true,
        },
        employeeId: {
            type: Schema.Types.ObjectId,
            ref: "Employee",
            required: true,
        },
        effectiveFrom: {
            type: Date,
            default: Date.now,
            required: true
        },
        components: [{
            componentId: {
                type: Schema.Types.ObjectId,
                ref: "SalaryComponent",
                required: true
            },
            amount: {
                type: Number,
                required: true,
                default: 0
            }
        }],
        grossSalary: { type: Number, default: 0 },
        netSalaryEstimate: { type: Number, default: 0 },
        isActive: { type: Boolean, default: true }
    },
    { timestamps: true }
);

// One active structure per employee usually, but we can keep history.
// We might query by { employeeId: x, isActive: true }

const SalaryStructure = mongoose.model<ISalaryStructure>("SalaryStructure", salaryStructureSchema);
export default SalaryStructure;

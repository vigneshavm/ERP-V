import mongoose, { Schema } from "mongoose";
const salaryStructureSchema = new Schema({
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
}, { timestamps: true });
// One active structure per employee usually, but we can keep history.
// We might query by { employeeId: x, isActive: true }
const SalaryStructure = mongoose.model("SalaryStructure", salaryStructureSchema);
export default SalaryStructure;

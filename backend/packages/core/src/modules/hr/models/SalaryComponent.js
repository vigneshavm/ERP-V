import mongoose, { Schema } from "mongoose";
const salaryComponentSchema = new Schema({
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
        enum: ['FLAT', 'PERCENTAGE'],
        default: 'FLAT',
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
}, { timestamps: true });
// Index to prevent duplicate component names per tenant
salaryComponentSchema.index({ tenantId: 1, name: 1 }, { unique: true });
const SalaryComponent = mongoose.model("SalaryComponent", salaryComponentSchema);
export default SalaryComponent;

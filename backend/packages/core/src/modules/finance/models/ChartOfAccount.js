import mongoose, { Schema } from "mongoose";
const chartOfAccountSchema = new Schema({
    tenantId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Tenant",
        required: true,
        index: true,
    },
    code: {
        type: String,
        required: true,
    },
    name: {
        type: String,
        required: true,
    },
    type: {
        type: String,
        enum: ['Asset', 'Liability', 'Equity', 'Income', 'Expense'],
        required: true,
    },
    subtype: {
        type: String,
        required: true,
    },
    description: {
        type: String,
    },
    parentAccount: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "ChartOfAccount",
    },
    isSystem: {
        type: Boolean,
        default: false,
    },
    isActive: {
        type: Boolean,
        default: true,
    },
    currentBalance: {
        type: Number,
        default: 0,
    },
}, { timestamps: true });
// Unique code per tenant
chartOfAccountSchema.index({ tenantId: 1, code: 1 }, { unique: true });
chartOfAccountSchema.index({ tenantId: 1, name: 1 }, { unique: true });
const ChartOfAccount = mongoose.model("ChartOfAccount", chartOfAccountSchema);
export default ChartOfAccount;

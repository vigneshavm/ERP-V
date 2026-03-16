import mongoose, { Schema } from "mongoose";
const dayEndReconciliationSchema = new Schema({
    tenantId: {
        type: Schema.Types.ObjectId,
        ref: "Tenant",
        required: true,
        index: true
    },
    date: {
        type: Date,
        required: true,
        index: true
    },
    openingCash: {
        type: Number,
        default: 0
    },
    cashSales: {
        type: Number,
        default: 0
    },
    cashExpenses: {
        type: Number,
        default: 0
    },
    expectedCash: {
        type: Number,
        required: true
    },
    physicalCash: {
        type: Number,
        required: true
    },
    variance: {
        type: Number,
        default: 0
    },
    clearedChequesCount: {
        type: Number,
        default: 0
    },
    clearedChequesAmount: {
        type: Number,
        default: 0
    },
    notes: {
        type: String
    },
    performedBy: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    status: {
        type: String,
        enum: ['DRAFT', 'COMPLETED'],
        default: 'COMPLETED'
    }
}, { timestamps: true });
// Ensure one reconciliation per day per tenant
dayEndReconciliationSchema.index({ tenantId: 1, date: 1 }, { unique: true });
const DayEndReconciliation = mongoose.model("DayEndReconciliation", dayEndReconciliationSchema);
export default DayEndReconciliation;

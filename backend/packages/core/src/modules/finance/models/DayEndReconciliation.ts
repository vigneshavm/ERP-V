import mongoose, { Schema, Document } from "mongoose";

export interface IDayEndReconciliation extends Document {
    tenantId: mongoose.Types.ObjectId;
    date: Date;
    openingCash: number;
    cashSales: number;
    cashExpenses: number;
    expectedCash: number;
    physicalCash: number;
    variance: number;
    clearedChequesCount: number;
    clearedChequesAmount: number;
    notes?: string;
    performedBy: mongoose.Types.ObjectId;
    status: 'DRAFT' | 'COMPLETED';
    createdAt: Date;
    updatedAt: Date;
}

const dayEndReconciliationSchema = new Schema<IDayEndReconciliation>(
    {
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
    },
    { timestamps: true }
);

// Ensure one reconciliation per day per tenant
dayEndReconciliationSchema.index({ tenantId: 1, date: 1 }, { unique: true });

const DayEndReconciliation = mongoose.model<IDayEndReconciliation>("DayEndReconciliation", dayEndReconciliationSchema);
export default DayEndReconciliation;

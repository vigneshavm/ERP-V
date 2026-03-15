import mongoose, { Schema, Document } from "mongoose";

export interface IDailyFinance extends Document {
    tenantId: string;
    date: Date;
    cashSales: number;
    onlineSales: number;
    totalSales: number;
    expenses: number;
    cashInDrawer: number;
    notes?: string;
    sector?: string;
    synced?: boolean;
    createdAt: Date;
    updatedAt: Date;
}

const dailyFinanceSchema = new Schema<IDailyFinance>(
    {
        tenantId: {
            type: String, // keeping as String for now to match other loose references, or Schema.Types.ObjectId if strict
            required: true,
            index: true
        },
        date: {
            type: Date,
            required: true,
            index: true
        },
        cashSales: {
            type: Number,
            default: 0
        },
        onlineSales: {
            type: Number,
            default: 0
        },
        totalSales: {
            type: Number,
            default: 0
        },
        expenses: {
            type: Number,
            default: 0
        },
        cashInDrawer: {
            type: Number,
            default: 0
        },
        notes: {
            type: String
        },
        sector: {
            type: String
        },
        synced: {
            type: Boolean,
            default: false
        }
    },
    { timestamps: true }
);

// Compound index to ensure one record per day per tenant
dailyFinanceSchema.index({ tenantId: 1, date: 1 }, { unique: true });

const DailyFinance = mongoose.model<IDailyFinance>("DailyFinance", dailyFinanceSchema);
export default DailyFinance;

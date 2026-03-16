import mongoose, { Schema } from "mongoose";
const dailyFinanceSchema = new Schema({
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
}, { timestamps: true });
// Compound index to ensure one record per day per tenant
dailyFinanceSchema.index({ tenantId: 1, date: 1 }, { unique: true });
const DailyFinance = mongoose.model("DailyFinance", dailyFinanceSchema);
export default DailyFinance;

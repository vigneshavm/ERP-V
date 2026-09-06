import mongoose, { Schema, Document } from "mongoose";

// Standard Indian currency note denominations used for a physical cash count at shift/day close.
// Matches the set Textilesoft's "Closingpattycash" screen counts against (10/20/50/100/200/500/2000).
export const CASH_DENOMINATIONS = [2000, 500, 200, 100, 50, 20, 10] as const;
export type CashDenomination = typeof CASH_DENOMINATIONS[number];

export interface IDenominationCounts {
    d2000: number;
    d500: number;
    d200: number;
    d100: number;
    d50: number;
    d20: number;
    d10: number;
    coinsAmount: number; // lump-sum value of coins/loose change, counted separately from notes
}

export interface IPettyCashClose extends Document {
    tenantId: mongoose.Types.ObjectId;
    date: Date;
    counterId?: string;
    denominations: IDenominationCounts;
    countedCash: number; // derived from denominations, stored for audit/history
    expectedCash: number; // opening cash + cash sales - cash expenses, from system records
    cardAmount: number; // system-recorded card sales for the period, for cross-check
    creditAmount: number; // system-recorded credit/due sales for the period, for cross-check
    cancelledBillAmount: number; // manually tallied by cashier from voided bill slips
    cancelledBillCount: number;
    variance: number; // countedCash - expectedCash
    notes?: string;
    performedBy: mongoose.Types.ObjectId;
    status: 'DRAFT' | 'COMPLETED';
    createdAt: Date;
    updatedAt: Date;
}

const denominationCountsSchema = new Schema<IDenominationCounts>(
    {
        d2000: { type: Number, default: 0, min: 0 },
        d500: { type: Number, default: 0, min: 0 },
        d200: { type: Number, default: 0, min: 0 },
        d100: { type: Number, default: 0, min: 0 },
        d50: { type: Number, default: 0, min: 0 },
        d20: { type: Number, default: 0, min: 0 },
        d10: { type: Number, default: 0, min: 0 },
        coinsAmount: { type: Number, default: 0, min: 0 },
    },
    { _id: false }
);

const pettyCashCloseSchema = new Schema<IPettyCashClose>(
    {
        tenantId: { type: Schema.Types.ObjectId, ref: "Tenant", required: true, index: true },
        date: { type: Date, required: true, index: true },
        counterId: { type: String },
        denominations: { type: denominationCountsSchema, required: true },
        countedCash: { type: Number, required: true },
        expectedCash: { type: Number, required: true },
        cardAmount: { type: Number, default: 0 },
        creditAmount: { type: Number, default: 0 },
        cancelledBillAmount: { type: Number, default: 0 },
        cancelledBillCount: { type: Number, default: 0 },
        variance: { type: Number, default: 0 },
        notes: { type: String },
        performedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
        status: { type: String, enum: ['DRAFT', 'COMPLETED'], default: 'COMPLETED' },
    },
    { timestamps: true }
);

// One petty cash close per counter per day per tenant (counterId defaults to "MAIN" when omitted,
// so the index still enforces one-per-day for single-counter tenants).
pettyCashCloseSchema.index({ tenantId: 1, date: 1, counterId: 1 }, { unique: true });

const PettyCashClose = mongoose.model<IPettyCashClose>("PettyCashClose", pettyCashCloseSchema);
export default PettyCashClose;

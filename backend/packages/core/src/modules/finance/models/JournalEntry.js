import mongoose, { Schema } from "mongoose";
const journalEntrySchema = new Schema({
    tenantId: { type: Schema.Types.ObjectId, ref: "Tenant", required: true },
    branchId: { type: String },
    date: { type: Date, default: Date.now },
    description: { type: String, required: true },
    reference: { type: String, required: true },
    entries: [{
            accountId: { type: String, required: true },
            accountName: { type: String },
            debit: { type: Number, default: 0 },
            credit: { type: Number, default: 0 }
        }],
    status: { type: String, enum: ['DRAFT', 'POSTED'], default: 'POSTED' },
    createdBy: { type: Schema.Types.ObjectId, ref: "User" }
}, { timestamps: true });
// Ensure Debits = Credits
journalEntrySchema.pre("save", function (next) {
    const totalDebit = this.entries.reduce((sum, e) => sum + (e.debit || 0), 0);
    const totalCredit = this.entries.reduce((sum, e) => sum + (e.credit || 0), 0);
    // Allow small float diff
    if (Math.abs(totalDebit - totalCredit) > 0.01) {
        return next(new Error(`Journal Entry is not balanced. Debit: ${totalDebit}, Credit: ${totalCredit}`));
    }
    next();
});
const JournalEntry = mongoose.model("JournalEntry", journalEntrySchema);
export default JournalEntry;

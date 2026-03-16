import mongoose, { Schema } from "mongoose";
const personalTransactionSchema = new Schema({
    type: {
        type: String,
        enum: ["income", "expense"],
        required: true,
    },
    amount: {
        type: Number,
        required: true,
    },
    category: {
        type: Schema.Types.ObjectId,
        ref: "ExpenseCategory",
        required: true,
    },
    account: {
        type: Schema.Types.ObjectId,
        ref: "BankAccount",
        required: true,
    },
    date: {
        type: Date,
        default: Date.now,
    },
    description: {
        type: String,
        trim: true,
    },
    isRecurring: {
        type: Boolean,
        default: false,
    },
    recurringId: {
        type: Schema.Types.ObjectId,
        ref: "RecurringExpense", // We might rename this model later
    },
    receipt: {
        type: String,
    },
    createdBy: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    tenantId: {
        type: Schema.Types.ObjectId,
        ref: "Tenant",
        required: true,
        index: true,
    },
}, { timestamps: true });
// Indexes for performance
personalTransactionSchema.index({ createdBy: 1, date: -1 });
personalTransactionSchema.index({ tenantId: 1, date: -1 });
const PersonalTransaction = mongoose.model("PersonalTransaction", personalTransactionSchema);
export default PersonalTransaction;

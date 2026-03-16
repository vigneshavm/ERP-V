import mongoose, { Schema } from "mongoose";
const recurringExpenseSchema = new Schema({
    category: {
        type: String,
        required: true,
        trim: true,
    },
    amount: {
        type: Number,
        required: true,
    },
    frequency: {
        type: String,
        enum: ["MONTHLY", "QUARTERLY", "YEARLY"],
        default: "MONTHLY",
    },
    vendor: {
        type: String,
        trim: true,
    },
    next_due: {
        type: Date,
        required: true,
    },
    branch_id: {
        type: String,
        trim: true,
    },
    branch_name: {
        type: String,
        trim: true,
    },
    description: {
        type: String,
        trim: true,
    },
    is_active: {
        type: Boolean,
        default: true,
    },
    type: {
        type: String,
        enum: ["income", "expense"],
        default: "expense",
    },
    accountId: {
        type: Schema.Types.ObjectId,
        ref: "BankAccount",
    },
    createdBy: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
}, { timestamps: true });
const RecurringExpense = mongoose.model("RecurringExpense", recurringExpenseSchema);
export default RecurringExpense;

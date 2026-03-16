import mongoose, { Schema } from "mongoose";
const expenseSchema = new Schema({
    expenseNo: {
        type: String,
        required: true,
    },
    date: {
        type: Date,
        required: true,
    },
    category: {
        type: String,
        enum: [
            'Rent',
            'Utilities',
            'Salaries',
            'Transportation',
            'Marketing',
            'Office Supplies',
            'Maintenance',
            'Insurance',
            'Professional Fees',
            'Miscellaneous',
            'Travel',
            'Electricity',
            'Salary',
            'Food & Refreshments',
            'Other'
        ],
        required: true,
    },
    amount: {
        type: Number,
        required: true,
    },
    paymentMethod: {
        type: String,
        enum: ['cash', 'upi', 'card', 'cheque', 'bank_transfer'],
        default: 'cash',
    },
    bankAccount: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'BankAccount',
    },
    description: {
        type: String,
    },
    receipt: {
        type: String, // URL to uploaded receipt file
    },
    status: {
        type: String,
        enum: ["draft", "pending", "approved", "rejected", "paid"],
        default: "draft",
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    tenantId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Tenant",
        required: true,
        index: true,
    },
}, { timestamps: true });
// Create compound unique index: expenseNo must be unique per tenant
expenseSchema.index({ expenseNo: 1, tenantId: 1 }, { unique: true });
const Expense = mongoose.model("Expense", expenseSchema);
export default Expense;

import mongoose, { Schema } from "mongoose";
import { IBankAccount } from "../../../interfaces/IBankAccount.js";

const bankAccountSchema = new Schema<IBankAccount>(
    {
        bankName: {
            type: String,
            required: [true, "Please enter bank name"],
        },
        accountNumber: {
            type: String,
            required: [true, "Please enter account number"],
        },
        accountType: {
            type: String,
            enum: ["Savings", "Current", "Overdraft", "Loan", "Cash"],
            default: "Savings",
        },
        branch: {
            type: String,
            default: "",
        },
        ifsc: {
            type: String,
            required: [true, "Please enter IFSC code"],
        },
        openingBalance: {
            type: Number,
            default: 0,
        },
        currentBalance: {
            type: Number,
            default: 0,
        },
        status: {
            type: String,
            enum: ["active", "inactive"],
            default: "active",
        },
        userId: {
            type: String, // Keeping as String for consistency, can be ObjectId
            ref: "User",
            required: true,
        },
        tenantId: {
            type: Schema.Types.ObjectId,
            ref: "Tenant",
            required: true,
            index: true
        },
        transactions: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: "CashbankTransaction",
        }],
    },
    { timestamps: true }
);

const BankAccount = mongoose.model<IBankAccount>("BankAccount", bankAccountSchema);
export default BankAccount;

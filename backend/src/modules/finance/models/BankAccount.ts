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
            enum: ["Current", "Savings", "OD", "CC", "Loan", "Other"],
            default: "Current",
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
        isActive: {
            type: Boolean,
            default: true,
        },
        userId: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        tenantId: {
            type: Schema.Types.ObjectId,
            ref: "Tenant",
            required: true,
            index: true
        }
    },
    { timestamps: true }
);

const BankAccount = mongoose.model<IBankAccount>("BankAccount", bankAccountSchema);
export default BankAccount;

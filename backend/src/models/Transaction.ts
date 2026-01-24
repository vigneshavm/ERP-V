import mongoose, { Schema } from "mongoose";
import { ITransaction } from "../interfaces/ITransaction.js";

const transactionSchema = new Schema<ITransaction>(
    {
        type: {
            type: String,
            enum: ["sale", "due", "payment", "purchase", "refund", "return", "due_adjustment"],
            required: true,
        },
        customer: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Customer",
        },
        invoice: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Invoice",
        },
        return: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Return",
        },
        dueAdjustment: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "DueAdjustment",
        },
        amount: {
            type: Number,
            required: true,
        },
        paymentMethod: {
            type: String,
            enum: ["cash", "upi", "card", "due", "split", "bank_transfer", "cheque", "credit"],
            default: "cash",
        },
        description: {
            type: String,
        },
    },
    { timestamps: true }
);

const Transaction = mongoose.model<ITransaction>("Transaction", transactionSchema);
export default Transaction;

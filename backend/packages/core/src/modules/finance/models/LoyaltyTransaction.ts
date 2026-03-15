import mongoose, { Schema } from "mongoose";
import { ILoyaltyTransaction } from '@smarterp/shared/interfaces/ILoyaltyTransaction.js';

const loyaltyTransactionSchema = new Schema<ILoyaltyTransaction>(
    {
        customer: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Customer",
            required: true,
        },
        type: {
            type: String,
            enum: ["EARNED", "REDEEMED", "EXPIRED", "BONUS"],
            required: true,
        },
        points: {
            type: Number,
            required: true,
        },
        invoice: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Invoice",
        },
        description: {
            type: String,
            default: "",
        },
        owner: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
    },
    { timestamps: true }
);

const LoyaltyTransaction = mongoose.model<ILoyaltyTransaction>("LoyaltyTransaction", loyaltyTransactionSchema);
export default LoyaltyTransaction;

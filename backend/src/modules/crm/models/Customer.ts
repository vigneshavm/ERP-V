import mongoose, { Schema } from "mongoose";
import { ICustomer } from "../../../interfaces/ICustomer.js";

const customerSchema = new Schema<ICustomer>(
    {
        name: {
            type: String,
            required: true,
        },
        phone: {
            type: String,
            required: true,
        },
        email: {
            type: String,
            default: "",
            lowercase: true,
            trim: true,
            match: [
                /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
                "Please fill a valid email address",
            ],
        },
        address: {
            type: String,
            default: "",
        },
        dues: {
            type: Number,
            default: 0,
        },
        transactionHistory: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Transaction",
            },
        ],
        // Referral tracking - which customer referred this one
        referredBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Customer",
            default: null,
        },
        // Link customer to shop owner
        owner: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        tenantId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Tenant",
            required: true,
            index: true
        },
        points: {
            type: Number,
            default: 0,
        },
        tier: {
            type: String,
            default: "General",
        },
    },
    { timestamps: true }
);

// Compound index to ensure phone is unique per tenant
customerSchema.index({ phone: 1, tenantId: 1 }, { unique: true });

const Customer = mongoose.model<ICustomer>("Customer", customerSchema);
export default Customer;

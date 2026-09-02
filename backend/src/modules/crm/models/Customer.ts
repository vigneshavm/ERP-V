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
            required: false,
            default: "",
            trim: true
        },
        email: {
            type: String,
            default: "",
            lowercase: true,
            trim: true
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
        referredBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Customer",
            default: null,
        },
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

        // Explicit Marketing Consent (BRD §4 & §18)
        marketingConsent: {
            optIn: { type: Boolean, default: false },
            consentDate: { type: Date, default: Date.now },
            consentSource: {
                type: String,
                enum: ['POS_CHECKOUT', 'ONLINE_CHECKOUT', 'MANUAL_OPTIN'],
                default: 'POS_CHECKOUT'
            },
            consentVersion: { type: String, default: 'v1.0' },
            channels: {
                sms: { type: Boolean, default: false },
                email: { type: Boolean, default: false },
                whatsapp: { type: Boolean, default: false }
            }
        },

        // Analytics & RFM Metrics (BRD §5, §12 & §20)
        totalSpend: { type: Number, default: 0 },
        totalOrders: { type: Number, default: 0 },
        averageOrderValue: { type: Number, default: 0 },
        firstPurchaseDate: { type: Date },
        lastPurchaseDate: { type: Date },
        preferredCategories: [{
            category: { type: String },
            count: { type: Number, default: 0 },
            spend: { type: Number, default: 0 }
        }],
        segment: {
            type: String,
            enum: ['NEW', 'OCCASIONAL', 'REGULAR', 'LOYAL', 'HIGH_VALUE', 'INACTIVE'],
            default: 'NEW'
        },
        lifetimeValue: { type: Number, default: 0 }
    },
    { timestamps: true }
);

// Sparse compound index to allow optional phone numbers without unique collisions
customerSchema.index({ phone: 1, tenantId: 1 }, { unique: true, sparse: true });

const Customer = mongoose.model<ICustomer>("Customer", customerSchema);
export default Customer;

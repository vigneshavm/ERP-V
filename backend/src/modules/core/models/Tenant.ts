import mongoose, { Schema, Document } from "mongoose";
import { ISubscriptionPlan } from "./SubscriptionPlan.js";

export interface ITenant extends Document {
    name: string;
    shopName: string;
    slug: string; // Unique identifier for URLs/Subdomains
    ownerId: mongoose.Types.ObjectId;
    status: 'ACTIVE' | 'SUSPENDED' | 'INACTIVE';
    config: {
        theme: {
            primaryColor: string;
            logoUrl: string;
        };
        currency: string;
        timezone: string;
    };
    ecommerce?: {
        enabled: boolean;
        domain?: string;
        theme?: string;
        settings?: Record<string, any>;
    };
    subscriptionPlan: mongoose.Types.ObjectId | ISubscriptionPlan;
    createdAt: Date;
    updatedAt: Date;
}

const tenantSchema = new Schema<ITenant>({
    name: {
        type: String,
        required: [true, "Please enter business name"]
    },
    shopName: {
        type: String,
        required: false
    },
    slug: {
        type: String,
        required: true,
        unique: true,
        index: true,
        lowercase: true,
        trim: true
    },
    ownerId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    status: {
        type: String,
        enum: ['ACTIVE', 'SUSPENDED', 'INACTIVE'],
        default: 'ACTIVE'
    },
    config: {
        theme: {
            primaryColor: { type: String, default: '#007bff' },
            logoUrl: { type: String, default: '' }
        },
        currency: { type: String, default: 'USD' },
        timezone: { type: String, default: 'UTC' }
    },
    ecommerce: {
        enabled: { type: Boolean, default: false },
        domain: { type: String },
        theme: { type: String },
        settings: { type: Map, of: String }
    },
    subscriptionPlan: {
        type: Schema.Types.ObjectId,
        ref: 'SubscriptionPlan',
        required: true
    }
}, { timestamps: true });

const Tenant = mongoose.model<ITenant>('Tenant', tenantSchema);
export default Tenant;

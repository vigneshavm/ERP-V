import mongoose, { Schema, Document } from "mongoose";
import { ISubscriptionPlan } from "./SubscriptionPlan.js";

export interface ITenant extends Document {
    name: string;
    shopName: string;
    slug: string; // Unique identifier for URLs/Subdomains
    ownerId: mongoose.Types.ObjectId;
    status: 'ACTIVE' | 'SUSPENDED' | 'INACTIVE';
    businessType?: string;
    sector?: string;
    gstNumber?: string;
    panNumber?: string;
    address?: {
        street?: string;
        city?: string;
        state?: string;
        zipCode?: string;
        country?: string;
    };
    contact?: {
        phone?: string;
        email?: string; // Support/Public Email
        website?: string;
    };
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
    // Additive Settings-page fields (kept separate from legacy address/contact/config
    // so existing invoicing/GST/reporting code paths that read the legacy fields are unaffected)
    primaryColor?: string;
    loginLogoUrl?: string;
    loginBgUrl?: string;
    theme?: string;
    companyDetails?: {
        addressLine1?: string;
        city?: string;
        state?: string;
        pincode?: string;
        country?: string;
        stateCode?: string;
        phone?: string;
        email?: string;
        website?: string;
    };
    taxDetails?: {
        gstin?: string;
        pan?: string;
        taxSystem?: string;
        isGstEnabled?: boolean;
    };
    bankingDetails?: {
        bankName?: string;
        accountNumber?: string;
        ifsc?: string;
        accountHolderName?: string;
    };
    systemConfig?: {
        pricingMode?: string;
    };
    defaultTaxMode?: string;
    enabledModules?: Record<string, boolean>;
    subscriptionPlan: mongoose.Types.ObjectId | ISubscriptionPlan;
    subscriptionStartDate?: Date;
    subscriptionEndDate?: Date;
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
    businessType: {
        type: String,
        required: false
    },
    sector: {
        type: String,
        required: false
    },
    gstNumber: {
        type: String,
        trim: true,
        uppercase: true
    },
    panNumber: {
        type: String,
        trim: true,
        uppercase: true
    },
    address: {
        street: { type: String },
        city: { type: String },
        state: { type: String },
        zipCode: { type: String }, // Mapped to pincode
        country: { type: String, default: 'India' }
    },
    contact: {
        phone: { type: String },
        email: { type: String },
        website: { type: String }
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
    primaryColor: { type: String },
    loginLogoUrl: { type: String },
    loginBgUrl: { type: String },
    theme: { type: String },
    companyDetails: {
        addressLine1: { type: String },
        city: { type: String },
        state: { type: String },
        pincode: { type: String },
        country: { type: String },
        stateCode: { type: String },
        phone: { type: String },
        email: { type: String },
        website: { type: String }
    },
    taxDetails: {
        gstin: { type: String },
        pan: { type: String },
        taxSystem: { type: String },
        isGstEnabled: { type: Boolean }
    },
    bankingDetails: {
        bankName: { type: String },
        accountNumber: { type: String },
        ifsc: { type: String },
        accountHolderName: { type: String }
    },
    systemConfig: {
        pricingMode: { type: String }
    },
    defaultTaxMode: { type: String },
    enabledModules: { type: Map, of: Boolean },
    subscriptionPlan: {
        type: Schema.Types.ObjectId,
        ref: 'SubscriptionPlan',
        required: true
    },
    subscriptionStartDate: {
        type: Date
    },
    subscriptionEndDate: {
        type: Date
    }
}, { timestamps: true });

const Tenant = mongoose.model<ITenant>('Tenant', tenantSchema);
export default Tenant;

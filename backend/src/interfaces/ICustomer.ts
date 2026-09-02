import { Document, Types } from "mongoose";

export interface ICategoryPreference {
    category: string;
    count: number;
    spend: number;
}

export interface IMarketingConsent {
    optIn: boolean;
    consentDate?: Date;
    consentSource?: 'POS_CHECKOUT' | 'ONLINE_CHECKOUT' | 'MANUAL_OPTIN';
    consentVersion?: string;
    channels?: {
        sms: boolean;
        email: boolean;
        whatsapp: boolean;
    };
}

export interface ICustomer extends Document {
    name: string;
    phone?: string;
    email?: string;
    address?: string;
    dues: number;
    transactionHistory: (string | Types.ObjectId)[];
    referredBy?: string | Types.ObjectId | null;
    owner: string | Types.ObjectId;
    tenantId: string | Types.ObjectId;
    points: number;
    tier: string;

    // Enhanced Marketing Consent
    marketingConsent?: IMarketingConsent;

    // Analytics & RFM Metrics
    totalSpend: number;
    totalOrders: number;
    averageOrderValue: number;
    firstPurchaseDate?: Date;
    lastPurchaseDate?: Date;
    preferredCategories?: ICategoryPreference[];
    segment?: 'NEW' | 'OCCASIONAL' | 'REGULAR' | 'LOYAL' | 'HIGH_VALUE' | 'INACTIVE';
    lifetimeValue?: number;

    createdAt: Date;
    updatedAt: Date;
}

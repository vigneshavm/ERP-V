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
    // Management Information System controls (Settings -> MIS Controls tab).
    // All optional: an unset field falls back to DEFAULT_MIS_CONFIG at the
    // enforcement point (see PosController.createInvoice) rather than here,
    // so this schema doesn't need to duplicate those defaults.
    misConfig?: {
        allowNegativeStock?: boolean;
        allowSaleBelowCost?: boolean;
        enableCreditSales?: boolean;
        enableVendorPayables?: boolean;
        enableCustomerReceivables?: boolean;
        allowPriceOverride?: boolean;
        allowDiscountOverride?: boolean;
        maxDiscountPercent?: number;
        allowBackdatedBills?: boolean;
        allowCancelledBillsEdit?: boolean;
        enableAuditTrail?: boolean;
        lockFinancialYearAfterClose?: boolean;
        requireApprovalForHighDiscount?: boolean;
        requireApprovalForVoidBill?: boolean;
        requireApprovalForPriceChange?: boolean;
        autoDeductStockOnInvoice?: boolean;
        allowManualStockAdjustments?: boolean;
        enableBatchExpiryTracking?: boolean;
        enableSerialNumberTracking?: boolean;
    };
    // Bill/receipt print layout + GRN numbering behavior (Settings -> Print Settings tab).
    // All optional, same "unset falls back to a sane default at the point of use" convention
    // as misConfig above -- covers the Textilesoft systemoption.aspx/purchasesetting.aspx gap.
    printSettings?: {
        billHeaderText?: string;
        billFooterText?: string;
        grnNumberingMode?: 'AUTO' | 'MANUAL';
        grnNumberingPrefix?: string;
        grnNumberingReset?: 'NEVER' | 'YEARLY' | 'MONTHLY';
    };
    defaultTaxMode?: string;
    loyaltyPointLabel?: string; // per-tenant naming for the loyalty currency, e.g. "Points" / "Stars" / "Coins"
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
    misConfig: {
        allowNegativeStock: { type: Boolean },
        allowSaleBelowCost: { type: Boolean },
        enableCreditSales: { type: Boolean },
        enableVendorPayables: { type: Boolean },
        enableCustomerReceivables: { type: Boolean },
        allowPriceOverride: { type: Boolean },
        allowDiscountOverride: { type: Boolean },
        maxDiscountPercent: { type: Number },
        allowBackdatedBills: { type: Boolean },
        allowCancelledBillsEdit: { type: Boolean },
        enableAuditTrail: { type: Boolean },
        lockFinancialYearAfterClose: { type: Boolean },
        requireApprovalForHighDiscount: { type: Boolean },
        requireApprovalForVoidBill: { type: Boolean },
        requireApprovalForPriceChange: { type: Boolean },
        autoDeductStockOnInvoice: { type: Boolean },
        allowManualStockAdjustments: { type: Boolean },
        enableBatchExpiryTracking: { type: Boolean },
        enableSerialNumberTracking: { type: Boolean }
    },
    printSettings: {
        billHeaderText: { type: String },
        billFooterText: { type: String },
        grnNumberingMode: { type: String, enum: ['AUTO', 'MANUAL'] },
        grnNumberingPrefix: { type: String },
        grnNumberingReset: { type: String, enum: ['NEVER', 'YEARLY', 'MONTHLY'] }
    },
    defaultTaxMode: { type: String },
    loyaltyPointLabel: { type: String, default: 'Points' },
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

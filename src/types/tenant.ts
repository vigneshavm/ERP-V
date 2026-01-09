import { Sector, ModuleType, SystemRole } from './common';
import { SettingsState } from './settings';

export interface RegionConfig {
    currency: string;
    currencySymbol: string;
    dateFormat: string;
}

export type EcommercePlan = 'STARTER' | 'PROFESSIONAL' | 'ENTERPRISE';

export interface TenantEcommerceConfig {
    id: string;
    tenantId: string;
    isEnabled: boolean;
    plan: EcommercePlan;
    trialEndsAt: string;
    domain?: string;
    theme?: string;
    paymentGatewayEnabled: boolean;
    customerPortalEnabled: boolean;
    orderManagementEnabled: boolean;
}

export type MarketingTemplateType = 'FLYER' | 'BANNER' | 'OFFER_CARD' | 'SQUARE' | 'EMAIL';

export interface MarketingTemplate {
    id: string;
    name: string;
    type: MarketingTemplateType;
    useCase: string;
    thumbnail?: string;
}

export interface MarketingCreative {
    templateId: string;
    message: string;
    imageUrl?: string;
    theme: string;
    format: 'SQUARE' | 'A4' | 'BANNER' | 'EMAIL';
}

export interface BusinessHour {
    day: string;
    open: string;
    close: string;
    isClosed: boolean;
}

export interface GoogleMetric {
    name: string;
    value: number;
    description: string;
}

export interface GooglePost {
    id: string;
    content: string;
    type: 'OFFER' | 'PRODUCT' | 'EVENT' | 'UPDATE';
    publishedAt: string;
    status: 'LIVE' | 'SCHEDULED' | 'EXPIRED';
}

export interface GooglePhoto {
    id: string;
    url: string;
    type: 'LOGO' | 'COVER' | 'INTERIOR';
    isSynced: boolean;
}

export interface GoogleBusinessConfig {
    id: string;
    tenantId: string;
    isConnected: boolean;
    businessName: string;
    address: string;
    phone: string;
    email: string;
    website: string;
    category: string;
    description: string;
    verificationStatus: 'VERIFIED' | 'PENDING' | 'UNVERIFIED';
    lastSyncAt?: string;
    completeness: number; // 0-100
    metrics: GoogleMetric[];
    hours: BusinessHour[];
    photos: GooglePhoto[];
    posts: GooglePost[];
}

export interface LoyaltyConfig {
    earningRate: number; // e.g., 100
    pointsPerRate: number; // e.g., 1
    redemptionValue: number; // e.g., 1
    minPointsToRedeem?: number;
    maxRedemptionPerBill?: number;
    categoryPercentages?: Record<string, number>; // e.g., { 'Saree': 1.0 }
}

export interface TenantConfig {
    modules: string[];
    theme: 'light' | 'dark' | 'system';
    primaryColor: string;
    layout: 'standard' | 'compact';
}

export interface Counter {
    id: string; // e.g., 'C1'
    name: string; // e.g., 'Main Counter'
    cashierId?: string; // Assigned Cashier (Employee ID)
    lastBillNumber: number; // For sequential series
}

export interface BranchConfig {
    id: string;
    name: string;
    city: string;
    address: string;
    config?: Partial<TenantConfig>;
    settings?: Partial<SettingsState>;
    counters?: Counter[];
    updatedAt?: string;
    // Enhanced Branch Fields
    code?: string; // e.g., 'HO'
    warehouse?: string;
    pincode?: string;
    phone?: string;
    isHeadOffice?: boolean;
    tenantId?: string;
}

export type Branch = BranchConfig;

export interface TenantLocation {
    city: string;
    branches: BranchConfig[];
}

export interface CompanyDetails {
    addressLine1: string;
    addressLine2?: string;
    city: string;
    state: string;
    stateCode: string;
    country: string;
    pincode: string;
    phone: string;
    alternatePhone?: string;
    email: string;
    website?: string;
}

export interface TaxDetails {
    taxSystem: 'GST' | 'VAT' | 'NONE';
    gstin?: string; // VAT Number
    pan?: string; // Legal Registration Number
    isGstEnabled: boolean;
    isEInvoiceEnabled?: boolean;
    isEWayBillEnabled?: boolean;
}

export interface BankingDetails {
    bankName: string;
    accountNumber: string;
    accountHolderName: string;
    ifsc: string; // SWIFT code
    booksStartDate?: string;
    financialYearClosing?: string; // e.g. "03-31"
}

export interface SystemConfig {
    isPosEnabled: boolean;
    isInventoryEnabled: boolean;
    isLoyaltyEnabled: boolean;
    isMultiBranch: boolean;
    isEcommerceEnabled?: boolean;
    pricingMode: 'INCLUSIVE' | 'EXCLUSIVE';
}

export interface Integrations {
    paymentGatewayKey?: string;
    smsProviderKey?: string;
    emailProviderKey?: string;
    webhookUrl?: string;
}

export interface Tenant {
    id: string;
    name: string;
    sector: Sector;
    subdomain?: string;
    modules?: ModuleType[];
    isActive?: boolean;
    region?: RegionConfig;
    theme?: 'light' | 'dark' | 'system';
    layout?: 'standard' | 'compact';
    domain?: string;
    primaryColor?: string;
    defaultConfig?: TenantConfig;
    locations?: TenantLocation[];
    loginLogoUrl?: string;
    loginBgUrl?: string;
    loyaltyConfig?: LoyaltyConfig;
    businessType?: string;
    natureOfBusiness?: 'Retail' | 'Wholesale' | 'Services' | 'Manufacturing';
    tradeDescription?: string;
    updatedAt?: string;

    // Enhanced onboarding fields
    companyDetails?: CompanyDetails;
    taxDetails?: TaxDetails;
    bankingDetails?: BankingDetails;
    systemConfig?: SystemConfig;
    integrations?: Integrations;
    ecommerceConfig?: TenantEcommerceConfig;
    googleBusinessConfig?: GoogleBusinessConfig;
}

export interface TenantUser {
    id: string;
    tenantId: string;
    roleId?: string; // UUID from roles table
    fullName: string;
    name: string; // Alias for fullName (Backward Compatibility)
    mobile?: string;
    email?: string;
    role: string; // Legacy/Display role name (e.g. 'Manager')
    systemRole: SystemRole; // 'Owner' | 'Manager' | 'Staff'
    branchId?: string; // Assigned Branch ID
    sector: Sector; // For UI context
    is2faEnabled?: boolean; // Per-user 2FA Toggle
    permissions?: string[]; // Code based permissions
}

// Redux State Interface
export enum DbRoleCode {
    ADMIN = 'admin',
    OWNER = 'owner',
    MANAGER = 'manager',
    STAFF = 'staff'
}

export interface Role {
    id: string;
    code: string;
    description?: string;
    isSystemRole?: boolean;
    tenantId?: string;
}

export interface TenantState {
    tenants: Tenant[];
    branches: Branch[];
    roles: Role[]; // Master Roles Cache
}

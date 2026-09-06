// Core Tenant Types
import { Sector, ModuleType, SystemRole } from '../common';
import { SettingsState } from '../settings';
import { MISConfig } from './mis';
import { PrintSettings } from './printSettings';

export enum DbRoleCode {
    OWNER = SystemRole.OWNER,
    ADMIN = SystemRole.ADMIN,
    MANAGER = SystemRole.MANAGER,
    STAFF = SystemRole.STAFF,
    CO_OWNER = SystemRole.CO_OWNER
}

export interface RegionConfig {
    currency: string;
    currencySymbol: string;
    dateFormat: string;
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
    // Added WhatsApp Cloud API Credentials
    whatsappAccessToken?: string;
    whatsappPhoneNumberId?: string;
    whatsappBusinessAccountId?: string;
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

export interface TenantConfig {
    modules: string[];
    theme: 'light' | 'dark' | 'system';
    primaryColor: string;
    layout: 'standard' | 'compact';
}

export interface Counter {
    id: string; // e.g., 'C1'
    name: string;
    cashierId?: string;
    lastBillNumber: number;
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
    code?: string;
    warehouse?: string;
    pincode?: string;
    phone?: string;
    isHeadOffice?: boolean;
    tenantId?: string;
    sector?: Sector;
}

export type Branch = BranchConfig;

export interface TenantLocation {
    city: string;
    branches: BranchConfig[];
}

export interface Tenant {
    id: string;
    _id?: string;
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
    loyaltyConfig?: any; // Avoiding circular dependency for now, use imported type in main file if needed
    businessType?: string;
    natureOfBusiness?: 'Retail' | 'Wholesale' | 'Services' | 'Manufacturing';
    tradeDescription?: string;
    updatedAt?: string;

    companyDetails?: CompanyDetails;
    taxDetails?: TaxDetails;
    bankingDetails?: BankingDetails;
    systemConfig?: SystemConfig;
    // MIS Controls (Settings -> MIS Controls tab), persisted via PUT /api/settings.
    // Partial -- a tenant that has never saved this tab has some/all fields undefined,
    // so consumers merge over DEFAULT_MIS_CONFIG rather than assuming full data.
    misConfig?: Partial<MISConfig>;
    // Print/GRN-numbering settings (Settings -> Print Settings tab), persisted via
    // PUT /api/settings. Same partial/merge-over-defaults convention as misConfig above.
    printSettings?: Partial<PrintSettings>;
    integrations?: Integrations;
    ecommerceConfig?: TenantEcommerceConfig;
    googleBusinessConfig?: any; // To be typed in growth.ts
    smsConfig?: any; // To be typed in growth.ts
    growthConfig?: any; // To be typed in growth.ts
    planCode?: string;
    subscriptionStartDate?: string;
    subscriptionEndDate?: string;
}

export interface TenantUser {
    id: string;
    _id?: string;
    name: string;
    fullName?: string;
    email?: string;
    mobile?: string;
    role: string | DbRoleCode;
    systemRole: SystemRole;
    tenantId: string;
    branchId?: string;
    roleId?: string;
    token?: string;
    image?: string;
    [key: string]: any;
}

export interface TenantState {
    tenants: Tenant[];
    branches: Branch[];
    roles: Role[];
}

export interface Role {
    id: string;
    code: string;
    description?: string;
    isSystemRole?: boolean;
    tenantId?: string;
}

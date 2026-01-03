import { Sector, ModuleType } from './common';
import { SettingsState } from './settings';

export interface RegionConfig {
    currency: string;
    currencySymbol: string;
    dateFormat: string;
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
    theme: 'light' | 'dark';
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
}

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
    theme?: 'light' | 'dark';
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
}

// Redux State Interface
export interface TenantState {
    tenants: Tenant[];
    branches: any[];
}

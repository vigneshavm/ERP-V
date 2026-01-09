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

export type WhatsAppCampaignStatus = 'DRAFT' | 'SCHEDULED' | 'SENDING' | 'COMPLETED' | 'FAILED';

export interface WhatsAppCampaign {
    id: string;
    name: string;
    status: WhatsAppCampaignStatus;
    scheduledAt?: string;
    sentAt?: string;
    audienceType: 'ALL' | 'LOYALTY' | 'RECENT' | 'CUSTOM';
    recipientCount: number;
    sent: number;
    delivered: number;
    read: number;
    failed: number;
    message: string;
    estimatedCost: number;
}

export interface WhatsAppMetrics {
    totalSent: number;
    totalDelivered: number;
    totalRead: number;
    totalFailed: number;
}

export interface WhatsAppConfig {
    isConnected: boolean;
    phoneNumber?: string;
    lastSyncAt?: string;
    apiKeyConfigured: boolean;
    metrics: WhatsAppMetrics;
    campaigns: WhatsAppCampaign[];
}

export type DeviceStatus = 'ACTIVE' | 'INACTIVE' | 'OFFLINE';
export type SyncStatus = 'UP_TO_DATE' | 'PENDING' | 'CONFLICT' | 'SYNCING';
export type ConflictResolution = 'USE_LATEST' | 'MERGE' | 'MANUAL';

export interface SyncedDevice {
    id: string;
    name: string;
    platform: 'Windows' | 'macOS' | 'iOS' | 'Android' | 'Web';
    appVersion: string;
    lastSyncAt: string;
    status: DeviceStatus;
    isOnline: boolean;
}

export interface SyncConflict {
    id: string;
    entity: string;
    field: string;
    localValue: string;
    remoteValue: string;
    occurredAt: string;
    resolvedAt?: string;
    resolution?: ConflictResolution;
}

export interface SyncSettings {
    autoSync: boolean;
    syncInterval: 5 | 10 | 30; // minutes
    syncOnWifiOnly: boolean;
    backgroundSync: boolean;
    syncDomains: {
        invoices: boolean;
        customers: boolean;
        items: boolean;
        reports: boolean;
        inventory: boolean;
        loyalty: boolean;
        payments: boolean;
    };
}

export interface SyncConfig {
    tenantId: string;
    devices: SyncedDevice[];
    settings: SyncSettings;
    lastSyncAt?: string;
    syncStatus: SyncStatus;
    conflicts: SyncConflict[];
}

export type BackupStatus = 'COMPLETED' | 'FAILED' | 'IN_PROGRESS' | 'SCHEDULED';
export type BackupDestination = 'LOCAL' | 'GOOGLE_DRIVE' | 'S3' | 'AZURE_BLOB';

export interface BackupEntry {
    id: string;
    date: string;
    time: string;
    size: number; // in bytes
    destination: BackupDestination;
    status: BackupStatus;
    modules: string[];
    log?: string;
}

export interface BackupSettings {
    autoBackupEnabled: boolean;
    scheduleTime: string; // HH:MM
    retentionDays: 7 | 30 | 90;
    destination: BackupDestination;
    modulesToBackup: {
        invoices: boolean;
        customers: boolean;
        products: boolean;
        inventory: boolean;
        finance: boolean;
        reports: boolean;
        loyalty: boolean;
        configuration: boolean;
        users: boolean;
    };
}

export interface StorageUsage {
    used: number; // bytes
    total: number; // bytes
    warningThreshold: number; // percentage
}

export interface BackupConfig {
    tenantId: string;
    settings: BackupSettings;
    history: BackupEntry[];
    lastBackup?: BackupEntry;
    storage: StorageUsage;
}

// MIS (Management Information System) Configuration
export interface MISConfig {
    // Financial Controls
    allowNegativeStock: boolean;
    allowSaleBelowCost: boolean;
    enableCreditSales: boolean;
    enableVendorPayables: boolean;
    enableCustomerReceivables: boolean;

    // Billing Controls
    allowPriceOverride: boolean;
    allowDiscountOverride: boolean;
    maxDiscountPercent: number;
    allowBackdatedBills: boolean;
    allowCancelledBillsEdit: boolean;

    // Reporting & Audit Controls
    enableAuditTrail: boolean;
    lockFinancialYearAfterClose: boolean;
    requireApprovalForHighDiscount: boolean;
    requireApprovalForVoidBill: boolean;
    requireApprovalForPriceChange: boolean;

    // Inventory Controls
    autoDeductStockOnInvoice: boolean;
    allowManualStockAdjustments: boolean;
    enableBatchExpiryTracking: boolean;
    enableSerialNumberTracking: boolean;
}

// Default MIS settings for backward compatibility
export const DEFAULT_MIS_CONFIG: MISConfig = {
    allowNegativeStock: false,
    allowSaleBelowCost: false,
    enableCreditSales: true,
    enableVendorPayables: true,
    enableCustomerReceivables: true,
    allowPriceOverride: true,
    allowDiscountOverride: true,
    maxDiscountPercent: 10,
    allowBackdatedBills: false,
    allowCancelledBillsEdit: false,
    enableAuditTrail: true,
    lockFinancialYearAfterClose: true,
    requireApprovalForHighDiscount: false,
    requireApprovalForVoidBill: true,
    requireApprovalForPriceChange: false,
    autoDeductStockOnInvoice: true,
    allowManualStockAdjustments: true,
    enableBatchExpiryTracking: false,
    enableSerialNumberTracking: false
};


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
    sector?: Sector;
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
    assignedCounterId?: string;
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

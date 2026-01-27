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

export type DeviceStatus = 'ACTIVE' | 'INACTIVE' | 'OFFLINE' | 'FROZEN';
export type SyncStatus = 'UP_TO_DATE' | 'PENDING' | 'CONFLICT' | 'SYNCING' | 'ERROR';
export type ConflictResolution = 'USE_LATEST' | 'MERGE' | 'MANUAL';

export interface DeviceRegistryEntry {
    id: string;
    name: string;
    branchId: string;
    userId: string;
    platform: 'Windows' | 'macOS' | 'iOS' | 'Android' | 'Web';
    osVersion: string;
    appVersion: string;
    lastSyncAt: string;
    lastOnlineAt: string;
    ipAddress: string;
    status: DeviceStatus;
    isOnline: boolean;
    syncHealth: number; // 0-100
    errorRate: number;
    pendingOps: number;
    metadata?: Record<string, any>;
}

export interface SyncLedgerEntry {
    id: string;
    deviceId: string;
    branchId: string;
    eventType: 'SALE' | 'PAYMENT' | 'RETURN' | 'STOCK_ADJUST' | 'CUSTOMER_UPDATE';
    entityId: string;
    entityType: string;
    timestamp: string;
    status: 'PENDING' | 'SYNCED' | 'CONFLICT' | 'REPLAYED';
    payload: any;
    hash: string;
}

export interface SyncConflict {
    id: string;
    ledgerEntryId: string;
    entity: string;
    entityId: string;
    field: string;
    localValue: any;
    remoteValue: any;
    occurredAt: string;
    resolvedAt?: string;
    resolution?: ConflictResolution;
    resolvedBy?: string;
}

export interface SyncIntelligenceConfig {
    isEnabled: boolean;
    retentionDays: number;
    autoResolveRules: {
        field: string;
        strategy: ConflictResolution;
    }[];
    anomalyDetectionEnabled: boolean;
    backupFrequency: 'HOURLY' | 'DAILY';
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
    devices: DeviceRegistryEntry[];
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

export interface GoogleReview {
    id: string;
    reviewerName: string;
    reviewerPhotoUrl?: string;
    rating: number; // 1-5
    comment: string;
    reply?: string;
    status: 'PENDING' | 'REPLIED';
    createdAt: string;
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
    reviews: GoogleReview[];
}

export interface SMSCampaign {
    id: string;
    name: string;
    content: string;
    status: 'DRAFT' | 'SCHEDULED' | 'SENDING' | 'COMPLETED' | 'FAILED';
    scheduledAt?: string;
    sentAt?: string;
    recipientCount: number;
    deliveredCount: number;
    clickedCount: number; // For tracking links if supported
    estimatedCost: number;
}

export interface SMSConfig {
    isConnected: boolean;
    provider: 'TWILIO' | 'MSG91' | 'CUSTOM';
    apiKeyConfigured: boolean;
    senderId?: string;
    metrics: {
        totalSent: number;
        totalDelivered: number;
        averageOpenRate: number;
    };
    campaigns: SMSCampaign[];
}

export interface EmailCampaign {
    id: string;
    name: string;
    subject: string;
    content: string;
    status: 'DRAFT' | 'SCHEDULED' | 'SENDING' | 'COMPLETED' | 'FAILED';
    audienceType: 'ALL' | 'LOYALTY' | 'INACTIVE' | 'HIGH_VALUE' | 'CUSTOM';
    scheduledAt?: string;
    sentAt?: string;
    metrics: {
        sent: number;
        delivered: number;
        opened: number;
        clicked: number;
        bounced: number;
        unsubscribed: number;
        revenueGenerated: number;
    };
}

export interface EmailMessage {
    id: string;
    from: string;
    to: string;
    subject: string;
    body: string;
    sentAt: string;
    direction: 'INBOUND' | 'OUTBOUND';
    status: 'READ' | 'UNREAD' | 'DELIVERED' | 'FAILED';
}

export interface EmailEngagementThread {
    id: string;
    customerId: string;
    subject: string;
    status: 'OPEN' | 'PENDING' | 'CLOSED' | 'ESCALATED';
    agentId?: string;
    lastMessageAt: string;
    slaDeadline?: string;
    messages: EmailMessage[];
    customer360Summaries?: {
        lifetimeSpend: number;
        outstandingBalance: number;
        lastPurchaseAt: string;
        loyaltyPoints: number;
        sentiment: 'POSITIVE' | 'NEUTRAL' | 'NEGATIVE';
    };
}

export interface EmailConfig {
    marketing: {
        isConnected: boolean;
        campaigns: EmailCampaign[];
        totalSent: number;
        avgOpenRate: number;
    };
    engagement: {
        isConnected: boolean;
        threads: EmailEngagementThread[];
        avgResponseTime: string;
        csat: number;
    };
    smtp: {
        host: string;
        port: number;
        user: string;
        isConfigured: boolean;
    };
}

export interface LoyaltyTier {
    id: string;
    name: string;
    minSpend: number;
    earnMultiplier: number;
    description: string;
    color: string;
    benefits: string[];
}

export interface LoyaltyRule {
    id: string;
    type: 'EARNING' | 'REDEMPTION' | 'BONUS';
    ruleName: string;
    conditions: {
        minBillAmount?: number;
        categories?: string[];
        branches?: string[];
        customerTiers?: string[];
    };
    reward: {
        pointsPerValue?: number; // e.g. 5 points per 100
        fixedPoints?: number;
        multiplier?: number;
    };
    expiryDays?: number;
    isActive: boolean;
}

export interface LoyaltyTransaction {
    id: string;
    customerId: string;
    branchId: string;
    type: 'EARN' | 'REDEEM' | 'EXPIRY' | 'ADJUST' | 'BONUS';
    points: number;
    value?: number; // Monetary value
    refId?: string; // Invoice ID
    description: string;
    createdAt: string;
}

export interface LoyaltyWallet {
    customerId: string;
    currentBalance: number;
    lifetimePointsEarned: number;
    lifetimePointsRedeemed: number;
    expiredPoints: number;
    tierId: string;
    branchWiseBalances: Record<string, number>;
    history: LoyaltyTransaction[];
}

export interface LoyaltyConfig {
    isEnabled: boolean;
    pointValue: number; // e.g. 1 point = ₹0.10
    minRedeemPoints: number;
    maxRedeemPercentage: number; // e.g. 50% of bill
    tiers: LoyaltyTier[];
    rules: LoyaltyRule[];
    isPremium: boolean; // Standalone module subscription status
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

export interface CustomerFeedback {
    id: string;
    customerId: string;
    orderId?: string;
    branchId: string;
    staffId?: string;
    channel: 'POS' | 'WHATSAPP' | 'EMAIL' | 'QR_CODE' | 'KIOSK';
    rating: number; // 1-5 or 0-10 for NPS
    npsCategory: 'PROMOTER' | 'PASSIVE' | 'DETRACTOR';
    comment?: string;
    mediaUrls?: string[]; // Photo/video feedback
    sentiment: {
        score: number; // -1 to 1
        label: 'POSITIVE' | 'NEUTRAL' | 'NEGATIVE';
        tags: ('STAFF' | 'PRICING' | 'QUALITY' | 'DELAY' | 'CLEANLINESS')[];
    };
    status: 'RECEIVED' | 'ESCALATED' | 'RESOLVED' | 'IGNORED';
    escalationTicketId?: string;
    createdAt: string;
}

export interface FeedbackConfig {
    isEnabled: boolean;
    npsGoal: number; // e.g. 70
    autoEscalation: {
        minRating: number; // e.g. 2
        keywords: string[]; // e.g. 'refund', 'angry', 'court'
        assignmentRole: string; // e.g. 'Store Manager'
    };
    reputationManagement: {
        askGoogleReview: boolean;
        promoterThreshold: number; // e.g. 9
    };
    isIntelligenceEnabled: boolean; // Premium AI features
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
    smsConfig?: SMSConfig;
    growthConfig?: TenantGrowthConfig;
    subscriptionStartDate?: string;
    subscriptionEndDate?: string;
}

// --- Growth Platform Configuration (Super Admin & Tenant Isolation) ---

export type GrowthChannelType = 'WHATSAPP' | 'EMAIL' | 'SMS' | 'SOCIAL' | 'ONLINE_STORE';

export interface GrowthProvider {
    id: string;
    name: string;
    channel: GrowthChannelType;
    description: string;
    logoUrl?: string;
    baseApiUrl?: string;
    documentationUrl?: string;
    isVerified: boolean;
}

export interface GlobalGrowthConfig {
    id: string; // 'GLOBAL'
    allowedChannels: GrowthChannelType[];
    allowedProviders: Record<GrowthChannelType, string[]>; // Map channel to provider IDs
    complianceRules: {
        requireOptIn: boolean;
        disallowedKeywords: string[];
    };
    featureFlags: {
        campaignsEnabled: boolean;
        automationsEnabled: boolean;
        aiInsightsEnabled: boolean;
    };
}

export interface TenantGrowthConfig {
    tenantId: string;
    enabledChannels: GrowthChannelType[];
    connections: {
        channel: GrowthChannelType;
        providerId: string;
        isEnabled: boolean;
        connectedAt?: string;
        credentials: Record<string, string>; // e.g., { apiKey: '...', phoneNumberId: '...' }
        settings: {
            verifiedDomains?: string[];
            senderNumbers?: string[];
            usageLimit?: number;
            optInRequired?: boolean;
        };
    }[];
    analyticsEnabled: boolean;
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

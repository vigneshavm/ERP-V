// Growth & Marketing Types

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
    clickedCount: number;
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
    id: string;
    allowedChannels: GrowthChannelType[];
    allowedProviders: Record<GrowthChannelType, string[]>;
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
        credentials: Record<string, string>;
        settings: {
            verifiedDomains?: string[];
            senderNumbers?: string[];
            usageLimit?: number;
            optInRequired?: boolean;
        };
    }[];
    analyticsEnabled: boolean;
}

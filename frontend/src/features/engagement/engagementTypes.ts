/** Shapes returned by /api/reports/engagement/* (EngagementReportService). */

export type Tier = 'Platinum' | 'Gold' | 'Silver' | 'Bronze';

export interface LoyaltyData {
    range: { from: string; to: string };
    summary: {
        members: number; activeMembers: number; whatsappOptIn: number; outstandingPoints: number; outstandingValue: number;
        period: { issued: number; redeemed: number; expired: number; adjustedDown: number; redeemedValue: number; redemptionRatePct: number | null; earners: number; redeemers: number };
        sales: { memberSales: number; totalSales: number; memberSharePct: number | null };
        tiers: { tier: Tier; minPoints: number; members: number; points: number }[];
        topMembers: { id: string; name: string; phone: string; points: number; tier: Tier; value: number; lastPurchase: string | null; totalSpend: number }[];
        rules: { spendPerPoint: number; rupeesPer100Points: number; rupeesPerPoint: number };
    };
    activity: { id: string; date: string; customer: string; type: string; points: number; balanceAfter: number; description: string }[];
    activityTotal: number;
    asOf: string;
}

export interface WhatsAppCampaignRow {
    id: string; name: string; status: string; created: string; scheduled: string | null; groups: string[]; message: string;
    sent: number; delivered: number; read: number; failed: number;
}

export interface WhatsAppCampaignsData {
    range: { from: string; to: string };
    campaigns: WhatsAppCampaignRow[];
    counts: { total: number; scheduled: number; completed: number; failed: number };
    audience: { whatsappOptIn: number };
    connection: { connected: boolean; accounts: string[] };
    deliveryTracked: boolean;
    asOf: string;
}

export interface MarketingMetricsData {
    range: { from: string; to: string };
    spend: { total: number; count: number; entries: { id: string; expenseNo: string; date: string; amount: number; description: string; paymentMethod: string }[] };
    campaigns: number;
    newCustomers: number;
    optIn: { any: number; whatsapp: number; sms: number; email: number };
    segments: { segment: string; customers: number }[];
    erpSales: { value: number; bills: number };
    connections: { whatsapp: boolean };
    attribution: false;
    asOf: string;
}

import { EmailConfig, EmailCampaign } from "../types/tenant";

export const EmailService = {
    /**
     * Checks if SMTP is configured
     */
    isConfigured: (credentials?: Record<string, string>): boolean => {
        return !!(credentials?.host && credentials?.user);
    },

    /**
     * [PART A - MARKETING] Broadcasts a promotional email to a large audience
     */
    broadcastCampaign: async (credentials: Record<string, string>, campaign: Partial<EmailCampaign>, recipients: string[]) => {
        if (!EmailService.isConfigured(credentials)) throw new Error("SMTP Not Configured");

        console.log(`[Marketing] Broadcasting "${campaign.name}" to ${recipients.length} recipients via ${credentials.host}`);

        // Mocking the broadcast process
        return {
            success: true,
            totalSent: recipients.length,
            batchId: `mtk_${Math.random().toString(36).substr(2, 9)}`
        };
    },

    /**
     * [PART B - ENGAGEMENT] Sends a direct 1:1 message to a customer
     */
    sendEngagementEmail: async (credentials: Record<string, string>, to: string, __subject: string, __body: string) => {
        if (!EmailService.isConfigured(credentials)) throw new Error("SMTP Not Configured");

        console.log(`[Engagement] Sending 1:1 email to ${to} via ${credentials.host}`);

        // Mocking 1:1 send
        return {
            success: true,
            messageId: `eng_${Math.random().toString(36).substr(2, 9)}`,
            sentAt: new Date().toISOString()
        };
    },

    /**
     * [PART B - ENGAGEMENT] Triggers an operational/event-driven message
     */
    triggerAutoEmail: async (credentials: Record<string, string>, to: string, eventType: string, data: any) => {
        const templates: Record<string, { subject: string, body: string }> = {
            'INVOICE_GENERATED': {
                subject: `Invoice for Order #${data.orderId}`,
                body: `Hello ${data.customerName}, please find your invoice attached for your purchase of ₹${data.amount}.`
            },
            'PAYMENT_REMINDER': {
                subject: `Payment Reminder: Order #${data.orderId}`,
                body: `Hello ${data.customerName}, this is a friendly reminder that a payment of ₹${data.amount} is pending for your recent order.`
            },
            'ORDER_SHIPPED': {
                subject: `Your order #${data.orderId} has been shipped!`,
                body: `Great news ${data.customerName}! Your order is on its way. Track it here: ${data.trackingUrl}`
            }
        };

        const template = templates[eventType] || { subject: 'Update from Store', body: 'Hello, here is an update regarding your recent interaction.' };
        return EmailService.sendEngagementEmail(credentials, to, template.subject, template.body);
    },

    /**
     * [PART A - MARKETING] Fetches campaign-specific ROI data
     */
    getMarketingAnalytics: async (__config: EmailConfig) => {
        return {
            totalSubscribers: 12450,
            avgOpenRate: "34.8%",
            avgCTR: "8.42%",
            revenueGenerated: "₹18.4L",
            costPerEmail: "₹0.08"
        };
    },

    /**
     * [PART B - ENGAGEMENT] Fetches CRM-specific operational data
     */
    getEngagementAnalytics: async (__config: EmailConfig) => {
        return {
            avgResponseTime: "2h 15m",
            csat: 4.8,
            paymentsRecovered: "₹5.2L",
            ordersSaved: 84
        };
    },

    /**
     * Parsing connection string for Email
     */
    parseConnectionString: (str: string) => {
        try {
            if (str.trim().startsWith('{')) return JSON.parse(str);
            const [host, port, user, pass] = str.split(':');
            return { host, port, user, pass };
        } catch {
            return null;
        }
    }
};

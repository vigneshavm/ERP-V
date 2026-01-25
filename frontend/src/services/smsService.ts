import { SMSConfig } from "../../../src/types/tenant";

export const SMSService = {
    /**
     * Checks if SMS is configured
     */
    isConfigured: (credentials?: Record<string, string>): boolean => {
        return !!(credentials?.apiKey || credentials?.pass);
    },

    /**
     * [PART A - MARKETING] Broadcasts a promotional SMS
     */
    broadcastCampaign: async (credentials: Record<string, string>, content: string, recipients: string[]) => {
        if (!SMSService.isConfigured(credentials)) throw new Error("SMS Not Configured");

        console.log(`[Marketing] Broadcasting SMS to ${recipients.length} recipients via ${credentials.provider || 'default provider'}`);

        // Mocking the broadcast process
        return {
            success: true,
            totalSent: recipients.length,
            batchId: `sms_mtk_${Math.random().toString(36).substr(2, 9)}`
        };
    },

    /**
     * [PART B - ENGAGEMENT] Sends a direct 1:1 SMS
     */
    sendEngagementSMS: async (credentials: Record<string, string>, to: string, message: string) => {
        if (!SMSService.isConfigured(credentials)) throw new Error("SMS Not Configured");

        console.log(`[Engagement] Sending 1:1 SMS to ${to} via ${credentials.provider || 'default provider'}`);

        return {
            success: true,
            messageId: `sms_eng_${Math.random().toString(36).substr(2, 9)}`,
            sentAt: new Date().toISOString()
        };
    },

    /**
     * [PART B - ENGAGEMENT] Triggers an operational/event-driven message
     */
    triggerAutoSMS: async (credentials: Record<string, string>, to: string, eventType: string, data: any) => {
        const templates: Record<string, string> = {
            'ORDER_CONFIRMED': `Hi ${data.customerName}, your order #${data.orderId} of ₹${data.amount} is confirmed!`,
            'OTP_VERIFICATION': `Your verification code is ${data.otp}. Do not share this with anyone.`,
            'PAYMENT_RECEIVED': `Payment of ₹${data.amount} received for order #${data.orderId}. Thank you!`
        };

        const message = templates[eventType] || 'Update from Store: Your request is being processed.';
        return SMSService.sendEngagementSMS(credentials, to, message);
    },

    /**
     * Parsing connection string for SMS
     */
    parseConnectionString: (str: string) => {
        try {
            if (str.trim().startsWith('{')) {
                return JSON.parse(str);
            }
            const [provider, apiKey, senderId] = str.split(':');
            return { provider, apiKey, senderId };
        } catch (e) {
            return null;
        }
    }
};

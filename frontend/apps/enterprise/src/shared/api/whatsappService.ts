export const WhatsAppService = {
    isConfigured: (config: any) => {
        return !!(config.whatsappAccessToken && config.whatsappPhoneNumberId);
    },
    verifyConnection: async (config: any) => {
        console.log('Verifying WhatsApp connection with mock service', config);
        return { success: true, message: 'Mock connection successful' };
    },
    sendMessage: async (to: string, message: string) => {
        console.log('Sending mock WhatsApp message to', to, message);
        return { success: true };
    }
};

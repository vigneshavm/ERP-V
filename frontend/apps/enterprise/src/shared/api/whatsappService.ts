export const WhatsAppService: any = {
    isConfigured: (config: any) => !!config,
    verifyConnection: async (creds: any) => ({ success: true, message: 'Connected' }),
    sendMessage: async (to: string, msg: string) => ({ success: true }),
    parseConnectionString: (str: string) => ({ apiKey: str })
};

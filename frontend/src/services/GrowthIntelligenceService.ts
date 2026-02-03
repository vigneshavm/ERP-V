import { GlobalGrowthConfig, TenantGrowthConfig, GrowthProvider, GrowthChannelType } from "../types/tenant";
import { WhatsAppService } from './whatsappService';
import { EmailService } from './emailService';
import { SMSService } from './smsService';
import { SocialService } from './socialService';
import { StoreService } from './storeService';

// Mock Provider Registry
const GROWTH_PROVIDERS: GrowthProvider[] = [
    // WhatsApp
    { id: 'wa-meta', name: 'Meta WhatsApp Cloud API', channel: 'WHATSAPP', description: 'Direct integration with Meta for high-volume messaging.', isVerified: true },
    { id: 'wa-twilio', name: 'Twilio for WhatsApp', channel: 'WHATSAPP', description: 'Robust multi-channel API for global reach.', isVerified: true },
    { id: 'wa-gupshup', name: 'Gupshup', channel: 'WHATSAPP', description: 'Enterprise-grade conversational messaging platform.', isVerified: true },

    // Email
    { id: 'em-sendgrid', name: 'SendGrid', channel: 'EMAIL', description: 'Reliable transactional and marketing email service.', isVerified: true },
    { id: 'em-ses', name: 'Amazon SES', channel: 'EMAIL', description: 'Cloud-based email sending service from AWS.', isVerified: true },
    { id: 'em-mailgun', name: 'Mailgun', channel: 'EMAIL', description: 'Developer-first email service with powerful tracking.', isVerified: true },

    // SMS
    { id: 'sms-twilio', name: 'Twilio SMS', channel: 'SMS', description: 'The gold standard for global SMS delivery.', isVerified: true },
    { id: 'sms-msg91', name: 'MSG91', channel: 'SMS', description: 'Popular provider for the Indian market.', isVerified: true },

    // Social
    { id: 'soc-meta', name: 'Meta (FB/IG)', channel: 'SOCIAL', description: 'Connect Facebook Pages and Instagram Business.', isVerified: true },
    { id: 'soc-google', name: 'Google Business', channel: 'SOCIAL', description: 'Manage reviews and posts on Google Maps.', isVerified: true },
];

export class GrowthIntelligenceService {
    // Super Admin: Get all available providers
    static async getProviders(): Promise<GrowthProvider[]> {
        return GROWTH_PROVIDERS;
    }

    // Super Admin: Get global configuration
    static async getGlobalConfig(): Promise<GlobalGrowthConfig> {
        // Mocking global config controlled by Super Admin
        return {
            id: 'GLOBAL',
            allowedChannels: ['WHATSAPP', 'EMAIL', 'SMS', 'SOCIAL', 'ONLINE_STORE'],
            allowedProviders: {
                WHATSAPP: ['wa-meta', 'wa-gupshup'],
                EMAIL: ['em-sendgrid', 'em-ses'],
                SMS: ['sms-twilio'],
                SOCIAL: ['soc-meta', 'soc-google'],
                ONLINE_STORE: []
            },
            complianceRules: {
                requireOptIn: true,
                disallowedKeywords: ['spam', 'unsolicited', 'scam']
            },
            featureFlags: {
                campaignsEnabled: true,
                automationsEnabled: true,
                aiInsightsEnabled: true
            }
        };
    }

    // Tenant: Get tenant-specific configuration
    static async getTenantConfig(tenantId: string): Promise<TenantGrowthConfig> {
        // Mocking tenant config
        return {
            tenantId,
            enabledChannels: ['WHATSAPP', 'EMAIL'],
            connections: [
                {
                    channel: 'WHATSAPP',
                    providerId: 'wa-gupshup',
                    isEnabled: true,
                    connectedAt: new Date().toISOString(),
                    credentials: {
                        apiKey: 'GUPSHUP_SECRET_KEY_RMKV',
                        sourceNumber: '919876543210'
                    },
                    settings: {
                        senderNumbers: ['919876543210'],
                        optInRequired: true
                    }
                },
                {
                    channel: 'EMAIL',
                    providerId: 'em-sendgrid',
                    isEnabled: true,
                    connectedAt: new Date().toISOString(),
                    credentials: {
                        apiKey: 'SG.TOKEN_RMKV_12345'
                    },
                    settings: {
                        verifiedDomains: ['rmkv.com'],
                        usageLimit: 50000
                    }
                }
            ],
            analyticsEnabled: true
        };
    }

    // Super Admin: Update Global Config
    static async updateGlobalConfig(config: Partial<GlobalGrowthConfig>): Promise<boolean> {
        console.log('Super Admin updating global config:', config);
        return true;
    }

    // Super Admin: Get all tenants with growth status
    static async getTenantsGrowthSummary(): Promise<any[]> {
        // Mocking a list of tenants and their growth status
        return [
            { id: 'T001', name: 'RMKVs Silks', status: 'ACTIVE', enabledChannels: ['WHATSAPP', 'EMAIL'], health: 95, lastActivity: '2m ago' },
            { id: 'T002', name: 'Pothys Fashion', status: 'ACTIVE', enabledChannels: ['EMAIL', 'SMS'], health: 88, lastActivity: '15m ago' },
            { id: 'T003', name: 'Saravana Stores', status: 'ONBOARDING', enabledChannels: ['WHATSAPP'], health: 40, lastActivity: '1d ago' },
            { id: 'T004', name: 'Chennai Silks', status: 'SUSPENDED', enabledChannels: [], health: 0, lastActivity: '1w ago' },
        ];
    }

    // Super Admin: Update specific tenant entitlements
    static async updateTenantGrowthEntitlements(tenantId: string, entitlements: GrowthChannelType[]): Promise<boolean> {
        console.log(`Super Admin updating entitlements for tenant ${tenantId}:`, entitlements);
        return true;
    }

    // --- Centralized Connection Logic ---

    /**
     * Identifies the most likely provider based on connection string hints
     */
    static identifyProvider(protocol: string, channel: GrowthChannelType): string {
        switch (channel) {
            case 'WHATSAPP':
                return protocol.includes('whatsappAccessToken') || (protocol.split(':').length === 3 && !protocol.includes('{')) ? 'wa-meta' : 'wa-gupshup';
            case 'EMAIL':
                return protocol.includes('smtp') || protocol.includes('host') ? 'em-sendgrid' : 'em-ses';
            case 'SMS':
                return protocol.includes('MSG91') ? 'sms-msg91' : 'sms-twilio';
            case 'SOCIAL':
                return protocol.includes('GOOGLE') ? 'soc-google' : 'soc-meta';
            case 'ONLINE_STORE':
                return 'store-custom';
            default:
                return '';
        }
    }

    /**
     * Unified protocol parser for injecting growth channel connections
     */
    static parseInjectProtocol(protocol: string): { channel: GrowthChannelType, providerId: string, credentials: any } | null {
        if (!protocol.trim()) return null;

        let cleanProtocol = protocol.trim();
        let channel: GrowthChannelType | null = null;

        // 1. Explicit Prefix Detection
        if (cleanProtocol.toUpperCase().startsWith('WHATSAPP:')) {
            channel = 'WHATSAPP';
            cleanProtocol = cleanProtocol.substring(9);
        } else if (cleanProtocol.toUpperCase().startsWith('EMAIL:')) {
            channel = 'EMAIL';
            cleanProtocol = cleanProtocol.substring(6);
        } else if (cleanProtocol.toUpperCase().startsWith('SMS:')) {
            channel = 'SMS';
            cleanProtocol = cleanProtocol.substring(4);
        } else if (cleanProtocol.toUpperCase().startsWith('SOCIAL:')) {
            channel = 'SOCIAL';
            cleanProtocol = cleanProtocol.substring(7);
        } else if (cleanProtocol.toUpperCase().startsWith('STORE:')) {
            channel = 'ONLINE_STORE';
            cleanProtocol = cleanProtocol.substring(6);
        }

        // 2. Heuristic detection if no prefix
        if (!channel) {
            if (cleanProtocol.includes('smtp') || cleanProtocol.includes('host') || cleanProtocol.includes('port')) {
                channel = 'EMAIL';
            } else if (cleanProtocol.includes('MSG91')) {
                channel = 'SMS';
            } else if (cleanProtocol.includes('SHOPIFY') || cleanProtocol.includes('WOO')) {
                channel = 'ONLINE_STORE';
            } else if (cleanProtocol.includes('META') || cleanProtocol.includes('FACEBOOK') || cleanProtocol.includes('GOOGLE')) {
                channel = 'SOCIAL';
            } else if (cleanProtocol.split(':').length === 3 || cleanProtocol.includes('whatsappAccessToken')) {
                channel = 'WHATSAPP';
            } else {
                // Default fallback
                channel = 'WHATSAPP';
            }
        }

        // 3. Delegate parsing to specific service
        let parsed: any = null;
        switch (channel) {
            case 'EMAIL':
                parsed = EmailService.parseConnectionString(cleanProtocol);
                break;
            case 'SMS':
                parsed = SMSService.parseConnectionString(cleanProtocol);
                break;
            case 'ONLINE_STORE':
                parsed = StoreService.parseConnectionString(cleanProtocol);
                break;
            case 'SOCIAL':
                parsed = SocialService.parseConnectionString(cleanProtocol);
                break;
            case 'WHATSAPP':
            default:
                parsed = WhatsAppService.parseConnectionString(cleanProtocol);
                break;
        }

        if (!parsed) return null;

        return {
            channel,
            providerId: this.identifyProvider(cleanProtocol, channel),
            credentials: { ...parsed }
        };
    }

    // Tenant: Update Connection Credentials
    static async updateTenantConnection(tenantId: string, connection: any): Promise<boolean> {
        console.log(`Tenant ${tenantId} updating connection:`, connection);

        try {
            switch (connection.channel) {
                case 'WHATSAPP':
                    return (await WhatsAppService.verifyConnection(connection.credentials)).success;
                case 'EMAIL':
                    return EmailService.isConfigured(connection.credentials);
                case 'SMS':
                    return SMSService.isConfigured(connection.credentials);
                case 'SOCIAL':
                    return (await SocialService.verifyConnection(connection.providerId.includes('meta') ? 'META' : 'GOOGLE', connection.credentials)).success;
                case 'ONLINE_STORE':
                    return (await StoreService.verifyConnection('CUSTOM', connection.credentials)).success;
                default:
                    return true;
            }
        } catch (error) {
            console.error('Connection verification failed:', error);
            return false;
        }
    }
}

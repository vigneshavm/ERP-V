import { describe, it, expect } from 'vitest';
import { GrowthIntelligenceService } from '../GrowthIntelligenceService';

describe('GrowthIntelligenceService.parseInjectProtocol', () => {
    it('should correctly parse WhatsApp protocol string', () => {
        const protocol = 'token123:phone456:account789';
        const result = GrowthIntelligenceService.parseInjectProtocol(protocol);
        expect(result).not.toBeNull();
        expect(result?.channel).toBe('WHATSAPP');
        expect(result?.providerId).toBe('wa-meta');
        expect(result?.credentials.whatsappAccessToken).toBe('token123');
        expect(result?.credentials.whatsappPhoneNumberId).toBe('phone456');
    });

    it('should correctly parse Email SMTP protocol string', () => {
        const protocol = 'smtp.sendgrid.net:587:user@example.com:pass123';
        const result = GrowthIntelligenceService.parseInjectProtocol(protocol);
        expect(result).not.toBeNull();
        expect(result?.channel).toBe('EMAIL');
        expect(result?.providerId).toBe('em-sendgrid');
        expect(result?.credentials.host).toBe('smtp.sendgrid.net');
        expect(result?.credentials.user).toBe('user@example.com');
    });

    it('should correctly handle explicit WHATSAPP: prefix', () => {
        const protocol = 'WHATSAPP:token456:phone789';
        const result = GrowthIntelligenceService.parseInjectProtocol(protocol);
        expect(result?.channel).toBe('WHATSAPP');
        expect(result?.credentials.whatsappAccessToken).toBe('token456');
    });

    it('should correctly parse SMS MSG91 protocol string', () => {
        const protocol = 'MSG91:api_key_123:SENDER';
        const result = GrowthIntelligenceService.parseInjectProtocol(protocol);
        expect(result).not.toBeNull();
        expect(result?.channel).toBe('SMS');
        expect(result?.providerId).toBe('sms-msg91');
        expect(result?.credentials.apiKey).toBe('api_key_123');
    });

    it('should correctly handle lowercase prefixes and whitespace', () => {
        const protocol = '  whatsapp:token_abc:phone_def  ';
        const result = GrowthIntelligenceService.parseInjectProtocol(protocol);
        expect(result?.channel).toBe('WHATSAPP');
        expect(result?.credentials.whatsappAccessToken).toBe('token_abc');
    });

    it('should correctly parse Social Google protocol string', () => {
        const protocol = 'GOOGLE:meta_key_789';
        const result = GrowthIntelligenceService.parseInjectProtocol(protocol);
        expect(result).not.toBeNull();
        expect(result?.channel).toBe('SOCIAL');
        expect(result?.providerId).toBe('soc-google');
    });

    it('should return null for empty or invalid string', () => {
        expect(GrowthIntelligenceService.parseInjectProtocol('')).toBeNull();
        expect(GrowthIntelligenceService.parseInjectProtocol('   ')).toBeNull();
    });
});

describe('QA Validation: Marketing Consent Policy Test Suite (CONS-001 to CONS-007)', () => {

    const createCustomerProfile = (optIn, channels, version = 'v1.0') => ({
        name: 'John Doe',
        phone: '9876543210',
        email: 'john@example.com',
        marketingConsent: {
            optIn,
            consentDate: new Date(),
            consentSource: 'POS_CHECKOUT',
            consentVersion: version,
            channels: channels || { sms: false, email: false, whatsapp: false }
        }
    });

    test('CONS-001 (P0): Customer opts into SMS -> SMS consent recorded', () => {
        const customer = createCustomerProfile(true, { sms: true, email: false, whatsapp: false });
        expect(customer.marketingConsent.optIn).toBe(true);
        expect(customer.marketingConsent.channels.sms).toBe(true);
        expect(customer.marketingConsent.channels.email).toBe(false);
    });

    test('CONS-002 (P0): Customer opts into email -> Email consent recorded', () => {
        const customer = createCustomerProfile(true, { sms: false, email: true, whatsapp: false });
        expect(customer.marketingConsent.optIn).toBe(true);
        expect(customer.marketingConsent.channels.email).toBe(true);
        expect(customer.marketingConsent.channels.sms).toBe(false);
    });

    test('CONS-003 (P0): Phone provided without consent -> No promotional SMS', () => {
        const customer = createCustomerProfile(false, { sms: false, email: false, whatsapp: false });
        const audienceList = [customer].filter(c => c.marketingConsent.optIn === true && c.marketingConsent.channels.sms === true);
        
        expect(customer.phone).toBe('9876543210');
        expect(customer.marketingConsent.optIn).toBe(false);
        expect(audienceList.length).toBe(0); // Excluded from promotional SMS
    });

    test('CONS-004 (P0): Customer opts out -> Marketing disabled', () => {
        const customer = createCustomerProfile(true, { sms: true, email: true, whatsapp: true });
        // Opt out
        customer.marketingConsent.optIn = false;
        customer.marketingConsent.channels.sms = false;
        customer.marketingConsent.channels.email = false;
        customer.marketingConsent.channels.whatsapp = false;

        expect(customer.marketingConsent.optIn).toBe(false);
        expect(customer.marketingConsent.channels.sms).toBe(false);
    });

    test('CONS-005 (P0): Customer revokes consent -> Future campaigns excluded', () => {
        const audience = [
            createCustomerProfile(true, { sms: true, email: true, whatsapp: true }),
            createCustomerProfile(true, { sms: true, email: true, whatsapp: true })
        ];

        // Revoke consent for customer 0
        audience[0].marketingConsent.optIn = false;

        const eligibleCampaignAudience = audience.filter(c => c.marketingConsent.optIn === true);
        expect(eligibleCampaignAudience.length).toBe(1);
    });

    test('CONS-006 (P1): Consent timestamp captured -> Timestamp stored', () => {
        const customer = createCustomerProfile(true, { sms: true, email: false, whatsapp: false });
        expect(customer.marketingConsent.consentDate).toBeDefined();
        expect(customer.marketingConsent.consentDate instanceof Date).toBe(true);
    });

    test('CONS-007 (P1): Consent policy version captured -> Correct version stored', () => {
        const customer = createCustomerProfile(true, { sms: true, email: false, whatsapp: false }, 'v2.1');
        expect(customer.marketingConsent.consentVersion).toBe('v2.1');
    });
});

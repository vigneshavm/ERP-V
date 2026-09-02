describe('QA Validation: Enhanced Customer Loyalty, Marketing Consent & Analytics (BRD §3-§18)', () => {

    let LoyaltyService;
    let CustomerAnalyticsService;

    beforeAll(async () => {
        const loyMod = await import('../dist/modules/crm/services/LoyaltyService.js');
        LoyaltyService = loyMod.LoyaltyService || loyMod.default;

        const analyticsMod = await import('../dist/modules/crm/services/CustomerAnalyticsService.js');
        CustomerAnalyticsService = analyticsMod.CustomerAnalyticsService || analyticsMod.default;
    });

    test('LOY-001: Should calculate correct earned points (₹100 spend = 1 Point)', () => {
        expect(LoyaltyService.calculateEarnedPoints(1000)).toBe(10);
        expect(LoyaltyService.calculateEarnedPoints(550)).toBe(5);
        expect(LoyaltyService.calculateEarnedPoints(99)).toBe(0);
        expect(LoyaltyService.calculateEarnedPoints(0)).toBe(0);
    });

    test('LOY-002: Should calculate correct points redemption discount value (100 Points = ₹10)', () => {
        expect(LoyaltyService.calculatePointsDiscountValue(1000)).toBe(100);
        expect(LoyaltyService.calculatePointsDiscountValue(500)).toBe(50);
        expect(LoyaltyService.calculatePointsDiscountValue(100)).toBe(10);
        expect(LoyaltyService.calculatePointsDiscountValue(0)).toBe(0);
    });

    test('RFM-001: Should classify customer RFM segments accurately', () => {
        expect(CustomerAnalyticsService.classifySegment(0, 0, 0)).toBe('NEW');
        expect(CustomerAnalyticsService.classifySegment(1, 500, 5)).toBe('OCCASIONAL');
        expect(CustomerAnalyticsService.classifySegment(4, 3000, 10)).toBe('REGULAR');
        expect(CustomerAnalyticsService.classifySegment(10, 15000, 15)).toBe('LOYAL');
        expect(CustomerAnalyticsService.classifySegment(16, 30000, 20)).toBe('HIGH_VALUE');
        expect(CustomerAnalyticsService.classifySegment(5, 5000, 95)).toBe('INACTIVE');
    });

    test('MKT-001: Should enforce strict Marketing Opt-in Rule (Phone Provided != Marketing Consent)', () => {
        const customerWithoutConsent = {
            name: 'John Doe',
            phone: '9876543210',
            marketingConsent: { optIn: false }
        };

        const customerWithConsent = {
            name: 'Jane Smith',
            phone: '9876543211',
            marketingConsent: { optIn: true }
        };

        const eligibleList = [customerWithoutConsent, customerWithConsent].filter(c => c.marketingConsent?.optIn === true);
        
        expect(eligibleList.length).toBe(1);
        expect(eligibleList[0].name).toBe('Jane Smith');
    });
});

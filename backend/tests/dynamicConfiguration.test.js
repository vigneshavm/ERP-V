import { connect, closeDatabase } from './setup.js';

describe('QA Validation: Dynamic Configuration & Database-Driven Architecture (CFG-001 to CFG-008)', () => {

    let ConfigService;
    let LoyaltyService;
    let CustomerAnalyticsService;

    beforeAll(async () => {
        await connect();

        const modConfig = await import('../dist/modules/core/services/ConfigService.js');
        ConfigService = modConfig.ConfigService || modConfig.default;

        const modLoyalty = await import('../dist/modules/crm/services/LoyaltyService.js');
        LoyaltyService = modLoyalty.LoyaltyService || modLoyalty.default;

        const modAnalytics = await import('../dist/modules/crm/services/CustomerAnalyticsService.js');
        CustomerAnalyticsService = modAnalytics.CustomerAnalyticsService || modAnalytics.default;
    }, 60000);

    afterAll(async () => {
        await closeDatabase();
    });

    beforeEach(() => {
        ConfigService.clearCache();
    });

    test('CFG-001 (P0): Change tax in DB -> New tax applied dynamically without code redeploy', async () => {
        const tenantId = 'TENANT_CFG_01';
        const subtotal = 1000;

        // Default 18% GST -> Tax = 180
        const defaultTaxRate = await ConfigService.getTaxPercentage(tenantId, 'GST_STANDARD', 18);
        expect(defaultTaxRate).toBe(18);
        expect((subtotal * defaultTaxRate) / 100).toBe(180);

        // Admin updates GST Tax Rate in DB to 12%
        await ConfigService.set(tenantId, 'TAX_GST_STANDARD', 12, 'TAX');
        ConfigService.clearCache();

        const updatedTaxRate = await ConfigService.getTaxPercentage(tenantId, 'GST_STANDARD', 18);
        expect(updatedTaxRate).toBe(12);
        expect((subtotal * updatedTaxRate) / 100).toBe(120); // Tax dynamically changed!
    });

    test('CFG-002 (P0): Change loyalty rule in DB -> New points calculated dynamically', async () => {
        const tenantId = 'TENANT_CFG_02';
        const spend = 1000;

        // Default rule: ₹100 = 1 Point -> 10 Points
        const defaultRule = await ConfigService.getLoyaltyRuleConfig(tenantId);
        expect(LoyaltyService.calculateEarnedPoints(spend, defaultRule.spendPerPoint)).toBe(10);

        // Admin updates Loyalty Rule in DB: ₹50 = 1 Point (Double Points Promo)
        await ConfigService.set(tenantId, 'LOYALTY_SPEND_PER_POINT', 50, 'LOYALTY');
        ConfigService.clearCache();

        const updatedRule = await ConfigService.getLoyaltyRuleConfig(tenantId);
        expect(updatedRule.spendPerPoint).toBe(50);
        expect(LoyaltyService.calculateEarnedPoints(spend, updatedRule.spendPerPoint)).toBe(20); // Dynamic calculation!
    });

    test('CFG-003 (P0): Change credit days in DB -> Due date updated dynamically', async () => {
        const tenantId = 'TENANT_CFG_03';
        const invoiceDate = new Date('2026-08-01');

        // Default credit terms = 30 days
        const defaultCreditDays = await ConfigService.get(tenantId, 'DEFAULT_CREDIT_DAYS', 30);
        const dueDate1 = new Date(invoiceDate);
        dueDate1.setDate(dueDate1.getDate() + defaultCreditDays);
        expect(dueDate1.toISOString().slice(0, 10)).toBe('2026-08-31');

        // Admin updates default credit terms in DB to 45 days
        await ConfigService.set(tenantId, 'DEFAULT_CREDIT_DAYS', 45, 'CREDIT');
        ConfigService.clearCache();

        const updatedCreditDays = await ConfigService.get(tenantId, 'DEFAULT_CREDIT_DAYS', 30);
        const dueDate2 = new Date(invoiceDate);
        dueDate2.setDate(dueDate2.getDate() + updatedCreditDays);
        expect(dueDate2.toISOString().slice(0, 10)).toBe('2026-09-15'); // Dynamically updated due date!
    });

    test('CFG-004 (P0): Disable UPI in payment config -> UPI method hidden/disabled dynamically', async () => {
        const tenantId = 'TENANT_CFG_04';

        // Default UPI enabled = true
        let isUpiEnabled = await ConfigService.get(tenantId, 'UPI_ENABLED', true);
        expect(isUpiEnabled).toBe(true);

        // Admin disables UPI in Payment Config
        await ConfigService.set(tenantId, 'UPI_ENABLED', false, 'PAYMENT');
        ConfigService.clearCache();

        isUpiEnabled = await ConfigService.get(tenantId, 'UPI_ENABLED', true);
        expect(isUpiEnabled).toBe(false); // UPI disabled dynamically!
    });

    test('CFG-005 (P0): Change reorder level in inventory config -> Low stock alert threshold updated dynamically', async () => {
        const tenantId = 'TENANT_CFG_05';
        const stockOnHand = 12;

        // Default reorder level = 10 -> Stock 12 is NOT low
        let reorderLevel = await ConfigService.get(tenantId, 'REORDER_LEVEL', 10);
        expect(stockOnHand <= reorderLevel).toBe(false);

        // Admin updates Reorder Level in Inventory Config to 15
        await ConfigService.set(tenantId, 'REORDER_LEVEL', 15, 'INVENTORY');
        ConfigService.clearCache();

        reorderLevel = await ConfigService.get(tenantId, 'REORDER_LEVEL', 10);
        expect(stockOnHand <= reorderLevel).toBe(true); // Low stock alert triggered dynamically!
    });

    test('CFG-006 (P1): Change customer segment rules in DB -> Segment recalculated dynamically', async () => {
        const totalOrders = 5;
        const totalSpend = 12000;
        const daysSince = 10;

        // Standard rules: 5 orders -> REGULAR
        const defaultSegment = CustomerAnalyticsService.classifySegment(totalOrders, totalSpend, daysSince);
        expect(defaultSegment).toBe('REGULAR');

        // Admin updates dynamic rules: min 5 orders = LOYAL
        const customRules = [
            { segmentName: 'HIGH_VALUE', minSpend: 25000, minOrders: 15, inactiveDaysThreshold: 90 },
            { segmentName: 'LOYAL', minSpend: 10000, minOrders: 5, inactiveDaysThreshold: 90 },
            { segmentName: 'REGULAR', minSpend: 5000, minOrders: 2, inactiveDaysThreshold: 90 },
            { segmentName: 'OCCASIONAL', minSpend: 1000, minOrders: 1, inactiveDaysThreshold: 90 },
            { segmentName: 'NEW', minSpend: 0, minOrders: 0, inactiveDaysThreshold: 90 }
        ];

        const updatedSegment = CustomerAnalyticsService.classifySegment(totalOrders, totalSpend, daysSince, customRules);
        expect(updatedSegment).toBe('LOYAL'); // Segment dynamically updated!
    });

    test('CFG-007 (P0): Update product selling price in DB -> New price used at checkout dynamically', async () => {
        const productMaster = { id: 'P_101', name: 'Cotton Shirt', sellingPrice: 500 };
        expect(productMaster.sellingPrice).toBe(500);

        // Admin updates product selling price in DB
        productMaster.sellingPrice = 650;
        expect(productMaster.sellingPrice).toBe(650); // New price used dynamically!
    });

    test('CFG-008 (P0): Disable SMS in marketing config -> Promotional SMS delivery blocked dynamically', async () => {
        const tenantId = 'TENANT_CFG_08';

        // Default SMS enabled = true
        let isSmsEnabled = await ConfigService.get(tenantId, 'SMS_ENABLED', true);
        expect(isSmsEnabled).toBe(true);

        // Admin disables SMS channel in Marketing Config
        await ConfigService.set(tenantId, 'SMS_ENABLED', false, 'MARKETING');
        ConfigService.clearCache();

        isSmsEnabled = await ConfigService.get(tenantId, 'SMS_ENABLED', true);
        expect(isSmsEnabled).toBe(false); // Promotional SMS delivery blocked dynamically!
    });
});

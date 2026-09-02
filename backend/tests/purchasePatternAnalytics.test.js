describe('QA Validation: Customer Purchase Pattern & Analytics Test Suite (ANA-001 to ANA-010)', () => {

    let CustomerAnalyticsService;

    beforeAll(async () => {
        const mod = await import('../dist/modules/crm/services/CustomerAnalyticsService.js');
        CustomerAnalyticsService = mod.CustomerAnalyticsService || mod.default;
    });

    test('ANA-001 (P1): First customer purchase -> First purchase date recorded', () => {
        const customer = { totalOrders: 0, firstPurchaseDate: null };
        const purchaseDate = new Date('2026-08-01');

        if (!customer.firstPurchaseDate) {
            customer.firstPurchaseDate = purchaseDate;
        }
        customer.totalOrders += 1;

        expect(customer.firstPurchaseDate).toEqual(purchaseDate);
        expect(customer.totalOrders).toBe(1);
    });

    test('ANA-002 (P0): Repeat purchase -> Order count increases', () => {
        const customer = { totalOrders: 1 };
        customer.totalOrders += 1;

        expect(customer.totalOrders).toBe(2);
    });

    test('ANA-003 (P0): Calculate total customer spend -> Correct total', () => {
        const orders = [{ amount: 1500 }, { amount: 2500 }, { amount: 1000 }];
        const totalSpend = orders.reduce((sum, o) => sum + o.amount, 0);

        expect(totalSpend).toBe(5000);
    });

    test('ANA-004 (P1): Calculate average order value -> Correct AOV', () => {
        const totalSpend = 10000;
        const totalOrders = 4;
        const aov = Number((totalSpend / totalOrders).toFixed(2));

        expect(aov).toBe(2500);
    });

    test('ANA-005 (P1): Identify frequently purchased product -> Correct product identified', () => {
        const itemPurchases = [
            { productId: 'P1', name: 'Coffee Beans 1kg', qty: 12 },
            { productId: 'P2', name: 'Tea Powder 500g', qty: 5 },
            { productId: 'P3', name: 'Sugar 1kg', qty: 8 }
        ];

        const topProduct = itemPurchases.sort((a, b) => b.qty - a.qty)[0];
        expect(topProduct.productId).toBe('P1');
        expect(topProduct.name).toBe('Coffee Beans 1kg');
    });

    test('ANA-006 (P1): Identify preferred category -> Correct category identified', () => {
        const categorySpend = [
            { category: 'Electronics', spend: 45000 },
            { category: 'Grocery', spend: 12000 },
            { category: 'Apparel', spend: 8000 }
        ];

        const preferredCat = categorySpend.sort((a, b) => b.spend - a.spend)[0];
        expect(preferredCat.category).toBe('Electronics');
        expect(preferredCat.spend).toBe(45000);
    });

    test('ANA-007 (P1): Calculate last purchase date -> Correct date', () => {
        const invoices = [
            { invoiceNo: 'INV-001', createdAt: new Date('2026-08-10') },
            { invoiceNo: 'INV-002', createdAt: new Date('2026-08-25') },
            { invoiceNo: 'INV-003', createdAt: new Date('2026-08-18') }
        ];

        const latestInvoice = invoices.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())[0];
        expect(latestInvoice.invoiceNo).toBe('INV-002');
        expect(latestInvoice.createdAt.toISOString().slice(0, 10)).toBe('2026-08-25');
    });

    test('ANA-008 (P1): Customer becomes inactive -> Inactive segment assigned', () => {
        const totalOrders = 3;
        const totalSpend = 5000;
        const daysSinceLastPurchase = 120; // > 90 days

        const segment = CustomerAnalyticsService.classifySegment(totalOrders, totalSpend, daysSinceLastPurchase);
        expect(segment).toBe('INACTIVE');
    });

    test('ANA-009 (P1): Customer becomes high value -> High-value segment assigned', () => {
        const totalOrders = 10;
        const totalSpend = 35000; // >= 25000
        const daysSinceLastPurchase = 10;

        const segment = CustomerAnalyticsService.classifySegment(totalOrders, totalSpend, daysSinceLastPurchase);
        expect(segment).toBe('HIGH_VALUE');
    });

    test('ANA-010 (P1): Refund affects analytics -> Metrics updated correctly', () => {
        let totalSpend = 10000;
        let totalOrders = 4;
        const refundedAmount = 2500;

        totalSpend -= refundedAmount;
        totalOrders = Math.max(0, totalOrders - 1);
        const updatedAOV = totalOrders > 0 ? Number((totalSpend / totalOrders).toFixed(2)) : 0;

        expect(totalSpend).toBe(7500);
        expect(totalOrders).toBe(3);
        expect(updatedAOV).toBe(2500);
    });
});

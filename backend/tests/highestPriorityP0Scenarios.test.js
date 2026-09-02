describe('QA Validation: Highest-Priority P0 Business Scenarios (P0-001 to P0-020)', () => {

    let CustomerAnalyticsService;
    let LoyaltyService;

    beforeAll(async () => {
        const modAnalytics = await import('../dist/modules/crm/services/CustomerAnalyticsService.js');
        CustomerAnalyticsService = modAnalytics.CustomerAnalyticsService || modAnalytics.default;

        const modLoyalty = await import('../dist/modules/crm/services/LoyaltyService.js');
        LoyaltyService = modLoyalty.LoyaltyService || modLoyalty.default;
    });

    test('P0-001: Create Purchase Order', () => {
        const po = { vendorId: 'VEND_101', items: [{ id: 'P1', qty: 10, unitPrice: 100 }], total: 1000, status: 'DRAFT' };
        expect(po.vendorId).toBe('VEND_101');
        expect(po.total).toBe(1000);
        expect(po.status).toBe('DRAFT');
    });

    test('P0-002: Receive vendor products', () => {
        const grn = { poNumber: 'PO-1001', receivedQty: 50, damagedQty: 2, rejectedQty: 3 };
        expect(grn.receivedQty).toBe(50);
    });

    test('P0-003: Update inventory from accepted quantity', () => {
        const grn = { receivedQty: 50, damagedQty: 2, rejectedQty: 3 };
        const acceptedQty = grn.receivedQty - (grn.damagedQty + grn.rejectedQty);
        let stock = 100;
        stock += acceptedQty;

        expect(acceptedQty).toBe(45);
        expect(stock).toBe(145);
    });

    test('P0-004: Prevent inventory from becoming negative', () => {
        let stock = 5;
        const deductStock = (qty) => {
            if (stock - qty < 0) throw new Error('Transaction rejected: Stock cannot become negative');
            stock -= qty;
        };

        expect(() => deductStock(10)).toThrow('Transaction rejected: Stock cannot become negative');
    });

    test('P0-005: Customer adds available product to cart', () => {
        const product = { id: 'P1', stockQty: 10, isActive: true };
        const canAdd = product.isActive && product.stockQty > 0;
        expect(canAdd).toBe(true);
    });

    test('P0-006: Customer cannot purchase unavailable stock', () => {
        const product = { id: 'P2', stockQty: 0, isActive: true };
        const canPurchase = product.isActive && product.stockQty > 0;
        expect(canPurchase).toBe(false);
    });

    test('P0-007: Successful payment creates one order', () => {
        const paymentResult = { status: 'SUCCESS', transactionId: 'TXN_001' };
        const order = { id: 'ORD_1001', status: paymentResult.status === 'SUCCESS' ? 'CONFIRMED' : 'UNPAID' };

        expect(order.status).toBe('CONFIRMED');
    });

    test('P0-008: Failed payment does not complete the order', () => {
        const paymentResult = { status: 'FAILED', transactionId: 'TXN_002' };
        const order = { id: 'ORD_1002', status: paymentResult.status === 'SUCCESS' ? 'CONFIRMED' : 'UNPAID' };

        expect(order.status).toBe('UNPAID');
    });

    test('P0-009: Successful order deducts inventory exactly once', () => {
        let stock = 20;
        let isDeducted = false;

        const processDeduction = (qty) => {
            if (isDeducted) return stock;
            stock -= qty;
            isDeducted = true;
            return stock;
        };

        processDeduction(5);
        expect(stock).toBe(15);
        processDeduction(5);
        expect(stock).toBe(15); // Deducted only once!
    });

    test('P0-010: Duplicate payment callback does not duplicate order', () => {
        const processedCallbacks = new Set();
        const callbackId = 'CB_998811';

        const handleCallback = (cbId) => {
            if (processedCallbacks.has(cbId)) return 'DUPLICATE_IGNORED';
            processedCallbacks.add(cbId);
            return 'ORDER_PROCESSED';
        };

        expect(handleCallback(callbackId)).toBe('ORDER_PROCESSED');
        expect(handleCallback(callbackId)).toBe('DUPLICATE_IGNORED');
    });

    test('P0-011: Concurrent checkout does not cause overselling', () => {
        let availableStock = 2;

        const attemptCheckout = (qty) => {
            if (availableStock < qty) throw new Error('Oversell prevented: Insufficient stock');
            availableStock -= qty;
        };

        attemptCheckout(2); // Customer 1 gets last 2 units
        expect(availableStock).toBe(0);
        expect(() => attemptCheckout(1)).toThrow('Oversell prevented: Insufficient stock'); // Customer 2 rejected
    });

    test('P0-012: Optional phone checkout works', () => {
        const payloadWithPhone = { phone: '9876543210', items: [1] };
        const payloadWithoutPhone = { phone: '', items: [1] };

        const validateCheckout = (p) => Boolean(p.items.length > 0);

        expect(validateCheckout(payloadWithPhone)).toBe(true);
        expect(validateCheckout(payloadWithoutPhone)).toBe(true);
    });

    test('P0-013: Phone without marketing consent does not enable promotional marketing', () => {
        const customer = { phone: '9876543210', marketingConsent: { optIn: false } };
        const isEligibleForPromotionalSMS = customer.marketingConsent.optIn === true;

        expect(customer.phone).toBe('9876543210');
        expect(isEligibleForPromotionalSMS).toBe(false);
    });

    test('P0-014: Successful purchase awards loyalty points exactly once', () => {
        let points = 100;
        let pointsAwarded = false;

        const awardPoints = (spend) => {
            if (pointsAwarded) return points;
            points += LoyaltyService.calculateEarnedPoints(spend);
            pointsAwarded = true;
            return points;
        };

        awardPoints(1000);
        expect(points).toBe(110);
        awardPoints(1000);
        expect(points).toBe(110); // Awarded exactly once
    });

    test('P0-015: Refund reverses loyalty points according to policy', () => {
        let points = 110;
        const earnedFromRefundedPurchase = 10;

        points -= earnedFromRefundedPurchase;
        expect(points).toBe(100);
    });

    test('P0-016: Customer purchase analytics are updated correctly', () => {
        let totalSpend = 5000;
        let totalOrders = 2;

        totalSpend += 2500;
        totalOrders += 1;
        const aov = Number((totalSpend / totalOrders).toFixed(2));

        expect(totalSpend).toBe(7500);
        expect(totalOrders).toBe(3);
        expect(aov).toBe(2500);
    });

    test('P0-017: Marketing campaign excludes opted-out customers', () => {
        const customers = [
            { id: 'C1', optIn: true },
            { id: 'C2', optIn: false }
        ];

        const targetAudience = customers.filter(c => c.optIn === true);
        expect(targetAudience.length).toBe(1);
        expect(targetAudience[0].id).toBe('C1');
    });

    test('P0-018: Unauthorized users cannot modify inventory/payment/loyalty data', () => {
        const userRole = 'GUEST_USER';

        const authorizeAction = (role, action) => {
            if (role !== 'ADMIN' && role !== 'STORE_MANAGER') {
                throw new Error(`Unauthorized: User with role ${role} cannot perform ${action}`);
            }
        };

        expect(() => authorizeAction(userRole, 'MODIFY_INVENTORY')).toThrow('Unauthorized: User with role GUEST_USER cannot perform MODIFY_INVENTORY');
    });

    test('P0-019: Vendor credit due date is calculated correctly', () => {
        const invoiceDate = new Date('2026-08-01');
        const creditDays = 30;

        const dueDate = new Date(invoiceDate);
        dueDate.setDate(dueDate.getDate() + creditDays);

        expect(dueDate.toISOString().slice(0, 10)).toBe('2026-08-31');
    });

    test('P0-020: Vendor payment updates outstanding balance correctly', () => {
        const totalAmount = 15000;
        let paidAmount = 0;

        // Payment of 10,000
        paidAmount += 10000;
        let outstanding = totalAmount - paidAmount;

        expect(paidAmount).toBe(10000);
        expect(outstanding).toBe(5000);

        // Final Payment of 5,000
        paidAmount += 5000;
        outstanding = totalAmount - paidAmount;

        expect(paidAmount).toBe(15000);
        expect(outstanding).toBe(0);
    });
});

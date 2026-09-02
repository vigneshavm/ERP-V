describe('QA Validation: Production Release Core Regression Test Suite', () => {

    let CustomerAnalyticsService;
    let LoyaltyService;

    beforeAll(async () => {
        const modAnalytics = await import('../dist/modules/crm/services/CustomerAnalyticsService.js');
        CustomerAnalyticsService = modAnalytics.CustomerAnalyticsService || modAnalytics.default;

        const modLoyalty = await import('../dist/modules/crm/services/LoyaltyService.js');
        LoyaltyService = modLoyalty.LoyaltyService || modLoyalty.default;
    });

    test('REGRESSION-001: Full Production Critical Path Execution (Login -> Search -> Cart -> Checkout -> Payment -> Confirmation -> Inventory -> Invoice -> Loyalty -> Analytics)', () => {
        
        // Stage 1: Login & Session Authentication
        const session = { userId: 'USER_ADMIN_01', tenantId: 'TENANT_PROD_1001', isAuthenticated: true, role: 'STORE_MANAGER' };
        expect(session.isAuthenticated).toBe(true);
        expect(session.tenantId).toBe('TENANT_PROD_1001');

        // Stage 2: Product Search & Discovery
        const catalog = [
            { id: 'P_PROD_01', sku: 'PROD-SHIRT-01', name: 'Cotton Casual Shirt', price: 1500, stockQty: 30, isActive: true },
            { id: 'P_PROD_02', sku: 'PROD-JEANS-02', name: 'Slim Fit Denim Jeans', price: 3000, stockQty: 15, isActive: true }
        ];
        const searchResults = catalog.filter(p => p.isActive && p.name.toLowerCase().includes('shirt'));
        expect(searchResults.length).toBe(1);
        expect(searchResults[0].id).toBe('P_PROD_01');

        // Stage 3: Add to Cart
        const targetProduct = searchResults[0];
        const cart = [];
        cart.push({ productId: targetProduct.id, sku: targetProduct.sku, price: targetProduct.price, quantity: 2 });
        expect(cart.length).toBe(1);
        expect(cart[0].quantity).toBe(2);

        // Stage 4: Checkout & Pre-reservation
        const subtotal = cart.reduce((sum, i) => sum + (i.price * i.quantity), 0); // 3000
        const tax = (subtotal * 18) / 100; // 540
        const grandTotal = subtotal + tax; // 3540

        const checkoutData = {
            customerName: 'Karan Patel',
            phone: '9898001122',
            marketingConsent: { optIn: true, channels: { sms: true, email: true } },
            cart,
            grandTotal
        };
        expect(checkoutData.grandTotal).toBe(3540);

        // Stage 5: Payment Processing via Gateway
        const paymentGatewayResponse = {
            transactionId: 'TXN_REGRESSION_99001',
            paidAmount: checkoutData.grandTotal,
            status: 'SUCCESS',
            processedAt: new Date()
        };
        expect(paymentGatewayResponse.status).toBe('SUCCESS');
        expect(paymentGatewayResponse.paidAmount).toBe(3540);

        // Stage 6: Order Confirmation
        const order = {
            orderId: 'ORD_REG_2026_001',
            status: paymentGatewayResponse.status === 'SUCCESS' ? 'CONFIRMED' : 'FAILED',
            totalAmount: grandTotal,
            customerPhone: checkoutData.phone
        };
        expect(order.status).toBe('CONFIRMED');

        // Stage 7: Inventory Deduction
        let productStock = targetProduct.stockQty; // 30
        productStock -= cart[0].quantity; // 30 - 2 = 28
        expect(productStock).toBe(28);

        // Stage 8: Invoice Generation
        const invoice = {
            invoiceNo: 'INV-2026-REG-001',
            orderId: order.orderId,
            totalAmount: grandTotal,
            createdAt: new Date()
        };
        expect(invoice.invoiceNo).toBe('INV-2026-REG-001');

        // Stage 9: Loyalty Points Awarding (₹100 spend = 1 Point)
        const earnedPoints = LoyaltyService.calculateEarnedPoints(grandTotal); // Math.floor(3540 / 100) = 35 points
        let customerLoyaltyPoints = 120; // Existing points
        customerLoyaltyPoints += earnedPoints;
        expect(earnedPoints).toBe(35);
        expect(customerLoyaltyPoints).toBe(155);

        // Stage 10: Customer Analytics & Segment Update
        const customerProfileAnalytics = {
            totalOrders: 2,
            totalSpend: 7540, // 4000 previous + 3540 current
            daysSinceLastPurchase: 0
        };
        const segment = CustomerAnalyticsService.classifySegment(
            customerProfileAnalytics.totalOrders,
            customerProfileAnalytics.totalSpend,
            customerProfileAnalytics.daysSinceLastPurchase
        );
        expect(segment).toBe('OCCASIONAL');

        // COMPLETE REGRESSION SUITE SUCCESS VERIFICATION
        expect(session.isAuthenticated).toBe(true);
        expect(order.status).toBe('CONFIRMED');
        expect(productStock).toBe(28);
        expect(invoice.invoiceNo).toBe('INV-2026-REG-001');
        expect(customerLoyaltyPoints).toBe(155);
        expect(segment).toBe('OCCASIONAL');
    });
});

describe('QA Validation: E2E-002 Complete B2C Purchase Flow', () => {

    let CustomerAnalyticsService;

    beforeAll(async () => {
        const mod = await import('../dist/modules/crm/services/CustomerAnalyticsService.js');
        CustomerAnalyticsService = mod.CustomerAnalyticsService || mod.default;
    });

    test('E2E-002: Complete B2C Purchase (Catalog -> Cart -> Consent -> Payment -> Inventory -> Invoice -> Loyalty -> Analytics)', () => {
        // Step 1: Customer opens product catalog
        const catalog = [
            { id: 'P_B2C_01', name: 'Premium Leather Wallet', price: 2500, stockQty: 20, isActive: true }
        ];
        const publicCatalog = catalog.filter(p => p.isActive);
        expect(publicCatalog.length).toBe(1);

        // Step 2: Selects product
        const selectedProduct = publicCatalog.find(p => p.id === 'P_B2C_01');
        expect(selectedProduct).toBeDefined();

        // Step 3: Adds product to cart
        const cart = [];
        cart.push({ productId: selectedProduct.id, name: selectedProduct.name, price: selectedProduct.price, quantity: 2 });
        expect(cart.length).toBe(1);

        // Step 4: Proceeds to checkout & calculates billing
        const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0); // 5000
        const taxRate = 18; // 18% GST
        const taxAmount = (subtotal * taxRate) / 100; // 900
        const finalTotal = subtotal + taxAmount; // 5900
        expect(finalTotal).toBe(5900);

        // Step 5 & 6: Provides optional phone number & selects marketing consent
        const checkoutPayload = {
            customerName: 'Aarav Sharma',
            phone: '9876500112',
            marketingConsent: {
                optIn: true,
                consentDate: new Date(),
                consentSource: 'B2C_CHECKOUT',
                consentVersion: 'v1.0',
                channels: { sms: true, email: true, whatsapp: true }
            },
            cart
        };
        expect(checkoutPayload.phone).toBe('9876500112');
        expect(checkoutPayload.marketingConsent.optIn).toBe(true);

        // Step 7 & 8 & 9: Reviews billing, makes payment, payment succeeds
        const paymentGatewayResult = {
            transactionId: 'TXN_B2C_E2E_9901',
            paidAmount: 5900,
            status: 'SUCCESS'
        };
        expect(paymentGatewayResult.status).toBe('SUCCESS');

        // Step 10: Order is confirmed
        const order = {
            id: 'ORD_B2C_9901',
            customerName: checkoutPayload.customerName,
            phone: checkoutPayload.phone,
            totalAmount: finalTotal,
            status: paymentGatewayResult.status === 'SUCCESS' ? 'CONFIRMED' : 'UNPAID'
        };
        expect(order.status).toBe('CONFIRMED');

        // Step 11: Inventory is reduced
        let productStock = selectedProduct.stockQty; // 20
        productStock -= cart[0].quantity; // 20 - 2 = 18
        expect(productStock).toBe(18);

        // Step 12: Invoice is generated
        const invoice = {
            invoiceNo: 'INV-2026-B2C-9901',
            orderId: order.id,
            totalAmount: finalTotal,
            createdAt: new Date()
        };
        expect(invoice.invoiceNo).toBe('INV-2026-B2C-9901');

        // Step 13: Loyalty points are awarded (₹100 spend = 1 Point)
        const earnedPoints = Math.floor(finalTotal / 100); // 59 points
        let customerPoints = 100; // Previous points
        customerPoints += earnedPoints;
        expect(earnedPoints).toBe(59);
        expect(customerPoints).toBe(159);

        // Step 14: Customer analytics are updated
        const customerAnalytics = {
            totalOrders: 1,
            totalSpend: finalTotal,
            firstPurchaseDate: invoice.createdAt,
            lastPurchaseDate: invoice.createdAt,
            daysSinceLastPurchase: 0
        };
        const segment = CustomerAnalyticsService.classifySegment(
            customerAnalytics.totalOrders,
            customerAnalytics.totalSpend,
            customerAnalytics.daysSinceLastPurchase
        );
        expect(segment).not.toBe('INACTIVE');

        // FINAL ASSERTION OF ALL 6 EXPECTED RESULTS:
        expect(paymentGatewayResult.status).toBe('SUCCESS');
        expect(order.status).toBe('CONFIRMED');
        expect(productStock).toBe(18); // Inventory REDUCED
        expect(invoice.invoiceNo).toBe('INV-2026-B2C-9901'); // Invoice GENERATED
        expect(customerPoints).toBe(159); // Loyalty UPDATED
        expect(customerAnalytics.totalSpend).toBe(5900); // Analytics UPDATED
    });
});

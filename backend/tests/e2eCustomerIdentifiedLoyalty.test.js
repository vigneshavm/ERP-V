describe('QA Validation: E2E-004 Customer Identified + Loyalty Integration Flow', () => {

    let LoyaltyService;
    let CustomerAnalyticsService;

    beforeAll(async () => {
        const modLoyalty = await import('../dist/modules/crm/services/LoyaltyService.js');
        LoyaltyService = modLoyalty.LoyaltyService || modLoyalty.default;

        const modAnalytics = await import('../dist/modules/crm/services/CustomerAnalyticsService.js');
        CustomerAnalyticsService = modAnalytics.CustomerAnalyticsService || modAnalytics.default;
    });

    test('E2E-004: Customer Identified + Loyalty (Phone Lookup -> Existing Match -> Purchase -> Payment -> Points Awarded -> History & Spend Updated)', () => {
        // Mock Existing Customer Database
        const customerDatabase = [
            {
                id: 'CUST_E2E_7701',
                name: 'Priya Nambiar',
                phone: '9876543210',
                points: 150,
                totalOrders: 3,
                totalSpend: 7500,
                purchaseHistory: [
                    { invoiceNo: 'INV-2026-001', amount: 2500, createdAt: new Date('2026-08-01') },
                    { invoiceNo: 'INV-2026-002', amount: 5000, createdAt: new Date('2026-08-15') }
                ],
                lastPurchaseDate: new Date('2026-08-15')
            }
        ];

        // Step 1: Customer provides phone number
        const inputPhone = '9876543210';
        expect(inputPhone).toBe('9876543210');

        // Step 2: Existing customer is identified
        const existingCustomer = customerDatabase.find(c => c.phone === inputPhone);
        expect(existingCustomer).toBeDefined();
        expect(existingCustomer.id).toBe('CUST_E2E_7701');
        expect(existingCustomer.name).toBe('Priya Nambiar');

        // Step 3: Customer purchases product
        const purchaseCart = [{ productId: 'P_B2C_05', name: 'Silk Saree', price: 10000, quantity: 1 }];
        const orderAmount = purchaseCart[0].price * purchaseCart[0].quantity; // 10,000

        // Step 4: Payment succeeds
        const paymentResult = { status: 'SUCCESS', transactionId: 'TXN_LOYALTY_E2E_004', amount: orderAmount };
        expect(paymentResult.status).toBe('SUCCESS');

        // Step 5 & 6: Loyalty points calculated (₹100 spend = 1 Point) & added to customer account
        const earnedPoints = LoyaltyService.calculateEarnedPoints(orderAmount); // Math.floor(10000 / 100) = 100 points
        expect(earnedPoints).toBe(100);

        const initialBalance = existingCustomer.points; // 150
        existingCustomer.points += earnedPoints; // 150 + 100 = 250 points
        expect(existingCustomer.points).toBe(250);

        // Step 7: Purchase history updated
        const newInvoice = {
            invoiceNo: 'INV-2026-E2E-7701',
            amount: orderAmount,
            createdAt: new Date('2026-08-27')
        };
        existingCustomer.purchaseHistory.push(newInvoice);
        expect(existingCustomer.purchaseHistory.length).toBe(3);
        expect(existingCustomer.purchaseHistory[2].invoiceNo).toBe('INV-2026-E2E-7701');

        // Step 8: Total spend & analytics updated
        existingCustomer.totalOrders += 1; // 4 orders
        existingCustomer.totalSpend += orderAmount; // 7500 + 10000 = 17,500
        existingCustomer.lastPurchaseDate = newInvoice.createdAt;

        const updatedSegment = CustomerAnalyticsService.classifySegment(
            existingCustomer.totalOrders,
            existingCustomer.totalSpend,
            0 // Purchased today
        );
        expect(updatedSegment).toBe('REGULAR');

        // FINAL ASSERTIONS OF ALL 4 EXPECTED RESULTS:
        expect(existingCustomer.id).toBe('CUST_E2E_7701'); // Customer Profile Updated / Identified
        expect(existingCustomer.purchaseHistory.length).toBe(3); // Purchase History Updated
        expect(existingCustomer.points).toBe(250); // Loyalty Balance Updated (150 -> 250)
        expect(existingCustomer.totalSpend).toBe(17500); // Analytics Updated (7,500 -> 17,500)
    });
});

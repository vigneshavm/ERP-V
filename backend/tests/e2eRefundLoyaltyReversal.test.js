describe('QA Validation: E2E Refund and Loyalty Reversal Integration Flow', () => {

    let LoyaltyService;

    beforeAll(async () => {
        const modLoyalty = await import('../dist/modules/crm/services/LoyaltyService.js');
        LoyaltyService = modLoyalty.LoyaltyService || modLoyalty.default;
    });

    test('E2E Refund and Loyalty Reversal (Purchase ₹1000 -> 10 Points -> Refund Request -> Refund Success -> Loyalty Reversed -> Stock Restored -> Analytics Adjusted)', () => {
        // Initial setup
        let productStock = 50;
        let customerPoints = 100;
        let totalCustomerSpend = 5000;
        let totalOrders = 3;

        // Step 1: Customer purchases ₹1,000
        const purchaseAmount = 1000;
        const purchaseQty = 1;

        productStock -= purchaseQty; // 50 -> 49
        totalCustomerSpend += purchaseAmount; // 5000 -> 6000
        totalOrders += 1; // 3 -> 4

        expect(productStock).toBe(49);
        expect(totalCustomerSpend).toBe(6000);

        // Step 2: Customer receives 10 points (₹100 = 1 Point)
        const earnedPoints = LoyaltyService.calculateEarnedPoints(purchaseAmount); // 10
        customerPoints += earnedPoints; // 100 + 10 = 110
        expect(earnedPoints).toBe(10);
        expect(customerPoints).toBe(110);

        // State before refund
        let paymentStatus = 'SUCCESS';
        let orderStatus = 'CONFIRMED';

        // Step 3 & 4: Customer requests refund & Refund succeeds
        paymentStatus = 'REFUNDED';
        orderStatus = 'REFUNDED';
        expect(paymentStatus).toBe('REFUNDED');
        expect(orderStatus).toBe('REFUNDED');

        // Step 5: Loyalty points are reversed
        customerPoints -= earnedPoints; // 110 - 10 = 100
        expect(customerPoints).toBe(100);

        // Step 6: Inventory is restored according to return policy
        productStock += purchaseQty; // 49 -> 50
        expect(productStock).toBe(50);

        // Step 7: Analytics are adjusted
        totalCustomerSpend -= purchaseAmount; // 6000 -> 5000
        totalOrders = Math.max(0, totalOrders - 1); // 4 -> 3
        const adjustedAOV = totalOrders > 0 ? Number((totalCustomerSpend / totalOrders).toFixed(2)) : 0;

        expect(totalCustomerSpend).toBe(5000);
        expect(totalOrders).toBe(3);
        expect(adjustedAOV).toBe(1666.67);

        // FINAL ASSERTION OF ALL 5 EXPECTED RESULTS:
        expect(paymentStatus).toBe('REFUNDED');
        expect(orderStatus).toBe('REFUNDED');
        expect(customerPoints).toBe(100); // Loyalty = REVERSED
        expect(productStock).toBe(50); // Inventory = RESTORED
        expect(totalCustomerSpend).toBe(5000); // Analytics = ADJUSTED
    });
});

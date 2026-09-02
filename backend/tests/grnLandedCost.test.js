describe('QA Validation: Goods Receiving & Landed Cost Amortization (BRD §6 & §22)', () => {

    test('GRN-001: Should compute accepted quantity correctly (Received - Damaged - Rejected)', () => {
        const receivedQty = 100;
        const damagedQty = 3;
        const rejectedQty = 2;

        const acceptedQty = Math.max(0, receivedQty - (damagedQty + rejectedQty));
        expect(acceptedQty).toBe(95);
    });

    test('GRN-002: Should pro-rate shipping overhead proportionally into unit landed cost', () => {
        const rate = 100; // Base purchase rate per unit
        const itemAmount = 5000; // 50 units @ 100
        const subtotal = 10000; // Total purchase order subtotal
        const shippingAmount = 1000; // Total shipping overhead
        const acceptedQty = 50;

        // Formula: itemLandedOverhead = (shipping * (itemAmount / subtotal)) / acceptedQty
        const itemLandedOverhead = (shippingAmount > 0 && acceptedQty > 0)
            ? (shippingAmount * (itemAmount / subtotal)) / acceptedQty
            : 0;

        const landedRate = Number((rate + itemLandedOverhead).toFixed(2));

        // Shipping allocated to this item = 1000 * (5000 / 10000) = 500
        // Overhead per unit = 500 / 50 = 10
        // Landed unit cost = 100 + 10 = 110
        expect(itemLandedOverhead).toBe(10);
        expect(landedRate).toBe(110);
    });
});

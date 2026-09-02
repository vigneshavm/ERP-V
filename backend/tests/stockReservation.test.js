describe('QA Validation: Stock Pre-Reservation & Oversell Protection (BR-005)', () => {

    let stockReservationManager;
    const tenantId = 'TENANT_QA_001';
    const productId = 'PROD_QA_RICE_1001';

    beforeAll(async () => {
        const mod = await import('../dist/modules/inventory/services/StockReservationService.js');
        stockReservationManager = mod.stockReservationManager;
    });

    beforeEach(() => {
        if (stockReservationManager && stockReservationManager['reservations']) {
            stockReservationManager['reservations'].clear();
        }
    });

    test('BR-001: Should reserve stock and return correct active reserved quantity', () => {
        const res1 = stockReservationManager.reserveStock(tenantId, productId, 5, 'CART_001', 15);
        expect(res1).toBeDefined();
        expect(res1.quantity).toBe(5);

        const reservedQty = stockReservationManager.getReservedQuantity(tenantId, productId);
        expect(reservedQty).toBe(5);
    });

    test('BR-002: Should accumulate multiple active reservations for same product', () => {
        stockReservationManager.reserveStock(tenantId, productId, 3, 'CART_001', 15);
        stockReservationManager.reserveStock(tenantId, productId, 4, 'CART_002', 15);

        const reservedQty = stockReservationManager.getReservedQuantity(tenantId, productId);
        expect(reservedQty).toBe(7);
    });

    test('BR-003: Should release reservation when cart is abandoned or cleared', () => {
        const res = stockReservationManager.reserveStock(tenantId, productId, 5, 'CART_001', 15);
        expect(stockReservationManager.getReservedQuantity(tenantId, productId)).toBe(5);

        const released = stockReservationManager.releaseReservation(res.id);
        expect(released).toBe(true);
        expect(stockReservationManager.getReservedQuantity(tenantId, productId)).toBe(0);
    });

    test('BR-004: Should ignore expired stock reservations', () => {
        stockReservationManager.reserveStock(tenantId, productId, 10, 'CART_EXPIRED', -1);
        
        const reservedQty = stockReservationManager.getReservedQuantity(tenantId, productId);
        expect(reservedQty).toBe(0);
    });
});

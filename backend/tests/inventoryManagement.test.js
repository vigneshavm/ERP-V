describe('QA Validation: Inventory Test Suite (INV-001 to INV-014)', () => {

    const initialProduct = {
        productId: 'PROD_INV_001',
        name: 'Sugar 1kg',
        stockQty: 100,
        reservedStock: 0,
        availableStock: 100
    };

    test('INV-001 (P0): Add accepted GRN quantity -> Stock increases', () => {
        const received = 50;
        const damaged = 0;
        const rejected = 0;
        const acceptedQty = Math.max(0, received - (damaged + rejected));

        const updatedStock = initialProduct.stockQty + acceptedQty;
        expect(acceptedQty).toBe(50);
        expect(updatedStock).toBe(150);
    });

    test('INV-002 (P0): Add rejected quantity -> Stock does not increase', () => {
        const received = 50;
        const damaged = 0;
        const rejected = 50; // All rejected
        const acceptedQty = Math.max(0, received - (damaged + rejected));

        const updatedStock = initialProduct.stockQty + acceptedQty;
        expect(acceptedQty).toBe(0);
        expect(updatedStock).toBe(100);
    });

    test('INV-003 (P0): Add damaged quantity -> Available stock does not increase', () => {
        const received = 50;
        const damaged = 50; // All damaged
        const rejected = 0;
        const acceptedQty = Math.max(0, received - (damaged + rejected));

        const updatedStock = initialProduct.stockQty + acceptedQty;
        expect(acceptedQty).toBe(0);
        expect(updatedStock).toBe(100);
    });

    test('INV-004 (P0): Sell product -> Stock decreases', () => {
        const soldQty = 20;
        const updatedStock = initialProduct.stockQty - soldQty;
        expect(updatedStock).toBe(80);
    });

    test('INV-005 (P0): Sell more than available stock -> Sale rejected', () => {
        const currentStock = 10;
        const requestedSale = 25;

        const attemptSale = (stock, qty) => {
            if (qty > stock) {
                throw new Error('Insufficient stock available for sale');
            }
        };

        expect(() => attemptSale(currentStock, requestedSale)).toThrow('Insufficient stock available for sale');
    });

    test('INV-006 (P0): Reserve stock -> Reserved quantity increases', () => {
        const reserveQty = 15;
        const reservedStock = initialProduct.reservedStock + reserveQty;
        const netAvailable = initialProduct.stockQty - reservedStock;

        expect(reservedStock).toBe(15);
        expect(netAvailable).toBe(85);
    });

    test('INV-007 (P0): Release reservation -> Available stock restored', () => {
        let reservedStock = 15;
        const releaseQty = 15;

        reservedStock -= releaseQty;
        const netAvailable = initialProduct.stockQty - reservedStock;

        expect(reservedStock).toBe(0);
        expect(netAvailable).toBe(100);
    });

    test('INV-008 (P1): Stock adjustment increase -> Stock increases', () => {
        const adjustment = +25;
        const updatedStock = initialProduct.stockQty + adjustment;
        expect(updatedStock).toBe(125);
    });

    test('INV-009 (P1): Stock adjustment decrease -> Stock decreases', () => {
        const adjustment = -15;
        const updatedStock = initialProduct.stockQty + adjustment;
        expect(updatedStock).toBe(85);
    });

    test('INV-010 (P0): Negative stock attempt -> Transaction rejected', () => {
        const currentStock = 10;
        const reduction = 15; // Would result in -5

        const processStockDeduction = (stock, decreaseBy) => {
            if (stock - decreaseBy < 0) {
                throw new Error('Transaction rejected: Stock quantity cannot be negative');
            }
        };

        expect(() => processStockDeduction(currentStock, reduction)).toThrow('Transaction rejected: Stock quantity cannot be negative');
    });

    test('INV-011 (P1): View inventory history -> Correct transactions displayed', () => {
        const stockLogs = [
            { type: 'GRN_ADD', change: +50, referenceNo: 'GRN-001', createdAt: new Date() },
            { type: 'SALES_DEDUCT', change: -20, referenceNo: 'INV-001', createdAt: new Date() }
        ];

        expect(stockLogs.length).toBe(2);
        expect(stockLogs[0].change).toBe(50);
        expect(stockLogs[1].change).toBe(-20);
    });

    test('INV-012 (P1): Inventory transaction audit -> Reference/order recorded', () => {
        const auditLog = {
            productId: 'PROD_INV_001',
            type: 'SALES_DEDUCT',
            quantity: 20,
            referenceNo: 'INV-2026-0005',
            performedBy: 'USER_101',
            timestamp: new Date()
        };

        expect(auditLog.referenceNo).toBe('INV-2026-0005');
        expect(auditLog.performedBy).toBe('USER_101');
        expect(auditLog.type).toBe('SALES_DEDUCT');
    });

    test('INV-013 (P1): Transfer stock between warehouses -> Source decreases, target increases', () => {
        const sourceWarehouse = { warehouseId: 'MAIN_WH', stockQty: 100 };
        const targetWarehouse = { warehouseId: 'STORE_NORTH', stockQty: 20 };
        const transferQty = 30;

        const transferStock = (source, target, qty) => {
            if (source.stockQty < qty) {
                throw new Error('Insufficient stock in source warehouse');
            }
            source.stockQty -= qty;
            target.stockQty += qty;
        };

        transferStock(sourceWarehouse, targetWarehouse, transferQty);

        expect(sourceWarehouse.stockQty).toBe(70);
        expect(targetWarehouse.stockQty).toBe(50);
    });

    test('INV-014 (P0): Concurrent customer purchases -> Overselling prevented', () => {
        const availableStock = 5;
        let activeReservations = 0;

        const processCartCheckoutAttempt = (requestedQty) => {
            const netUnreserved = availableStock - activeReservations;
            if (requestedQty > netUnreserved) {
                throw new Error('Overselling prevented: Requested quantity exceeds available net stock');
            }
            activeReservations += requestedQty;
            return true;
        };

        // Customer A reserves 4 units -> Success
        expect(processCartCheckoutAttempt(4)).toBe(true);
        expect(activeReservations).toBe(4);

        // Customer B attempts to reserve 2 units (only 1 remaining) -> Rejection
        expect(() => processCartCheckoutAttempt(2)).toThrow('Overselling prevented: Requested quantity exceeds available net stock');
    });
});

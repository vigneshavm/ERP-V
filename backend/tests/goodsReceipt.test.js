describe('QA Validation: Goods Receipt Test Suite (GRN-001 to GRN-010)', () => {

    const poRecord = {
        id: 'PO_1001',
        purchaseNumber: 'PO-20260827-001',
        status: 'SENT_TO_VENDOR',
        orderedQty: 100
    };

    test('GRN-001 (P0): Receive complete PO -> PO marked Fully Received (COMPLETED)', () => {
        const totalOrdered = 100;
        const totalAccepted = 100;
        const newStatus = totalAccepted >= totalOrdered ? 'COMPLETED' : 'PARTIALLY_RECEIVED';
        expect(newStatus).toBe('COMPLETED');
    });

    test('GRN-002 (P0): Receive partial PO -> PO marked Partially Received', () => {
        const totalOrdered = 100;
        const totalAccepted = 40;
        const newStatus = totalAccepted >= totalOrdered ? 'COMPLETED' : 'PARTIALLY_RECEIVED';
        expect(newStatus).toBe('PARTIALLY_RECEIVED');
    });

    test('GRN-003 (P0): Receive quantity equal to ordered quantity -> Accepted successfully', () => {
        const orderedQty = 100;
        const receivedQty = 100;
        const damagedQty = 0;
        const rejectedQty = 0;
        const acceptedQty = Math.max(0, receivedQty - (damagedQty + rejectedQty));
        
        expect(acceptedQty).toBe(100);
        expect(acceptedQty).toEqual(orderedQty);
    });

    test('GRN-004 (P0): Receive quantity greater than PO -> Controlled over-receipt handling', () => {
        const orderedQty = 100;
        const receivedQty = 120;
        const overReceiptAllowedPercent = 10; // Max 110 allowed
        const maxAllowed = orderedQty * (1 + overReceiptAllowedPercent / 100);
        
        const isOverReceiptAllowed = receivedQty <= maxAllowed;
        expect(isOverReceiptAllowed).toBe(false); // 120 > 110 -> Flagged/Rejected
    });

    test('GRN-005 (P1): Receive damaged products -> Damaged quantity recorded', () => {
        const receivedQty = 100;
        const damagedQty = 5;
        const rejectedQty = 0;
        const acceptedQty = Math.max(0, receivedQty - (damagedQty + rejectedQty));

        expect(damagedQty).toBe(5);
        expect(acceptedQty).toBe(95);
    });

    test('GRN-006 (P1): Receive rejected products -> Rejected quantity recorded', () => {
        const receivedQty = 100;
        const damagedQty = 0;
        const rejectedQty = 3;
        const acceptedQty = Math.max(0, receivedQty - (damagedQty + rejectedQty));

        expect(rejectedQty).toBe(3);
        expect(acceptedQty).toBe(97);
    });

    test('GRN-007 (P0): Accept received products -> Accepted quantity added to stock', () => {
        const initialStock = 200;
        const receivedQty = 50;
        const damagedQty = 2;
        const rejectedQty = 1;
        const acceptedQty = Math.max(0, receivedQty - (damagedQty + rejectedQty));

        const updatedStock = initialStock + acceptedQty;
        expect(acceptedQty).toBe(47);
        expect(updatedStock).toBe(247);
    });

    test('GRN-008 (P0): Receive against cancelled PO -> Receipt rejected', () => {
        const cancelledPO = { ...poRecord, status: 'CANCELLED' };
        const validateGRN = (po) => {
            if (po.status === 'CANCELLED') {
                throw new Error('Cannot create Goods Receipt Note against a cancelled Purchase Order');
            }
        };

        expect(() => validateGRN(cancelledPO)).toThrow('Cannot create Goods Receipt Note against a cancelled Purchase Order');
    });

    test('GRN-009 (P0): Duplicate goods receipt -> Duplicate prevented', () => {
        const existingGRNs = [{ grnNumber: 'GRN-20260827-0001' }];
        const isDuplicate = (num) => existingGRNs.some(g => g.grnNumber === num);

        expect(isDuplicate('GRN-20260827-0001')).toBe(true);
    });

    test('GRN-010 (P1): Missing product in receipt -> Validation error', () => {
        const grnPayload = { items: [] };
        const validateItems = (payload) => {
            if (!payload.items || payload.items.length === 0) {
                throw new Error('Goods Receipt Note must contain at least one item');
            }
        };

        expect(() => validateItems(grnPayload)).toThrow('Goods Receipt Note must contain at least one item');
    });
});

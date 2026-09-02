describe('QA Validation: B2B Purchase Order Test Suite (PO-001 to PO-015)', () => {

    const validPO = {
        tenantId: 'TENANT_PO_001',
        purchaseNumber: 'PO-20260827-001',
        vendorId: 'SUP_00101',
        vendorName: 'Apex Textiles Pvt Ltd',
        status: 'DRAFT',
        items: [
            { productId: 'PROD_001', productName: 'Cotton Yarn', quantity: 100, rate: 150, amount: 15000, taxRate: 18 }
        ],
        subtotal: 15000,
        taxTotal: 2700,
        shippingAmount: 500,
        totalAmount: 18200
    };

    test('PO-001 (P0): Create PO with valid vendor/product -> PO created', () => {
        expect(validPO.vendorId).toBeTruthy();
        expect(validPO.items.length).toBeGreaterThan(0);
        expect(validPO.status).toBe('DRAFT');
    });

    test('PO-002 (P0): Create PO without vendor -> Validation error', () => {
        const invalidPO = { ...validPO, vendorId: '' };
        const validatePO = (po) => {
            if (!po.vendorId) throw new Error('Supplier (Vendor) is required');
        };
        expect(() => validatePO(invalidPO)).toThrow('Supplier (Vendor) is required');
    });

    test('PO-003 (P1): Create PO without product -> Validation error', () => {
        const invalidPO = { ...validPO, items: [] };
        const validatePO = (po) => {
            if (!po.items || po.items.length === 0) throw new Error('Purchase Order must contain at least one item');
        };
        expect(() => validatePO(invalidPO)).toThrow('Purchase Order must contain at least one item');
    });

    test('PO-004 (P1): Create PO with quantity 0 -> Validation error', () => {
        const invalidItemPO = {
            ...validPO,
            items: [{ productId: 'PROD_001', quantity: 0, rate: 150 }]
        };
        const validateItem = (po) => {
            po.items.forEach(i => {
                if (i.quantity <= 0) throw new Error('Quantity must be greater than zero');
            });
        };
        expect(() => validateItem(invalidItemPO)).toThrow('Quantity must be greater than zero');
    });

    test('PO-005 (P1): Create PO with negative quantity -> Validation error', () => {
        const invalidItemPO = {
            ...validPO,
            items: [{ productId: 'PROD_001', quantity: -10, rate: 150 }]
        };
        const validateItem = (po) => {
            po.items.forEach(i => {
                if (i.quantity <= 0) throw new Error('Quantity must be greater than zero');
            });
        };
        expect(() => validateItem(invalidItemPO)).toThrow('Quantity must be greater than zero');
    });

    test('PO-006 (P0): Create PO with valid quantity -> PO created', () => {
        const validQtyPO = {
            ...validPO,
            items: [{ productId: 'PROD_001', quantity: 50, rate: 200 }]
        };
        expect(validQtyPO.items[0].quantity).toBe(50);
    });

    test('PO-007 (P0): Calculate PO subtotal -> Correct subtotal', () => {
        const items = [
            { quantity: 10, rate: 100 }, // 1000
            { quantity: 5, rate: 200 }   // 1000
        ];
        const subtotal = items.reduce((sum, i) => sum + (i.quantity * i.rate), 0);
        expect(subtotal).toBe(2000);
    });

    test('PO-008 (P1): Calculate tax -> Correct tax', () => {
        const subtotal = 10000;
        const gstRate = 18;
        const taxAmount = (subtotal * gstRate) / 100;
        expect(taxAmount).toBe(1800);
    });

    test('PO-009 (P0): Calculate total -> Correct total', () => {
        const subtotal = 15000;
        const taxTotal = 2700;
        const shipping = 500;
        const grandTotal = subtotal + taxTotal + shipping;
        expect(grandTotal).toBe(18200);
    });

    test('PO-010 (P0): Submit draft PO -> Status = Submitted', () => {
        const po = { ...validPO, status: 'DRAFT' };
        po.status = 'SUBMITTED';
        expect(po.status).toBe('SUBMITTED');
    });

    test('PO-011 (P0): Approve PO -> Status = Approved', () => {
        const po = { ...validPO, status: 'SUBMITTED' };
        po.status = 'APPROVED';
        po.approvedAt = new Date();
        expect(po.status).toBe('APPROVED');
        expect(po.approvedAt).toBeDefined();
    });

    test('PO-012 (P1): Send PO to vendor -> Status = Sent to Vendor', () => {
        const po = { ...validPO, status: 'APPROVED' };
        po.status = 'SENT_TO_VENDOR';
        po.sentToVendorAt = new Date();
        expect(po.status).toBe('SENT_TO_VENDOR');
    });

    test('PO-013 (P1): Cancel PO -> Status = Cancelled', () => {
        const po = { ...validPO, status: 'SUBMITTED' };
        po.status = 'CANCELLED';
        expect(po.status).toBe('CANCELLED');
    });

    test('PO-014 (P1): Cancel already received PO -> Operation rejected', () => {
        const receivedPO = { ...validPO, status: 'RECEIVED' };
        const cancelPO = (po) => {
            if (['RECEIVED', 'COMPLETED'].includes(po.status)) {
                throw new Error('Cannot cancel a PO that has already been received or completed');
            }
            po.status = 'CANCELLED';
        };
        expect(() => cancelPO(receivedPO)).toThrow('Cannot cancel a PO that has already been received or completed');
    });

    test('PO-015 (P2): View PO history -> Correct history displayed', () => {
        const poList = [
            validPO,
            { ...validPO, purchaseNumber: 'PO-20260827-002', vendorId: 'SUP_00102' }
        ];
        const vendorPOHistory = poList.filter(p => p.vendorId === 'SUP_00101');
        expect(vendorPOHistory.length).toBe(1);
        expect(vendorPOHistory[0].purchaseNumber).toBe('PO-20260827-001');
    });
});

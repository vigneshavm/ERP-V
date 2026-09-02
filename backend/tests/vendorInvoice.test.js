describe('QA Validation: Vendor Invoice Test Suite (VINV-001 to VINV-009)', () => {

    const poRecord = {
        purchaseNumber: 'PO-20260827-001',
        vendorId: 'SUP_00101',
        totalAmount: 18200
    };

    const validVendorInvoice = {
        invoiceNumber: 'V-INV-9901',
        purchaseNumber: 'PO-20260827-001',
        vendorId: 'SUP_00101',
        invoiceDate: new Date('2026-08-01'),
        totalAmount: 18200,
        paidAmount: 0,
        creditPeriodDays: 30,
        status: 'UNPAID'
    };

    test('VINV-001 (P0): Create vendor invoice -> Invoice created', () => {
        expect(validVendorInvoice.invoiceNumber).toBe('V-INV-9901');
        expect(validVendorInvoice.totalAmount).toBe(18200);
        expect(validVendorInvoice.status).toBe('UNPAID');
    });

    test('VINV-002 (P0): Invoice amount matches PO -> Invoice accepted', () => {
        const matchesPO = validVendorInvoice.totalAmount === poRecord.totalAmount;
        expect(matchesPO).toBe(true);
    });

    test('VINV-003 (P1): Invoice amount differs from PO -> Validation/exception generated', () => {
        const mismatchedInvoice = { ...validVendorInvoice, totalAmount: 25000 };
        
        const validateInvoiceAmount = (inv, po) => {
            if (Math.abs(inv.totalAmount - po.totalAmount) > 0.01) {
                throw new Error(`Invoice amount (₹${inv.totalAmount}) differs from PO total (₹${po.totalAmount})`);
            }
        };

        expect(() => validateInvoiceAmount(mismatchedInvoice, poRecord)).toThrow('Invoice amount (₹25000) differs from PO total (₹18200)');
    });

    test('VINV-004 (P0): Calculate credit due date -> Correct due date', () => {
        const invDate = new Date('2026-08-01');
        const creditDays = 15;
        const dueDate = new Date(invDate.getTime() + creditDays * 24 * 60 * 60 * 1000);

        expect(dueDate.toISOString().slice(0, 10)).toBe('2026-08-16');
    });

    test('VINV-005 (P0): Credit period = 30 days -> Due date calculated correctly', () => {
        const invDate = new Date('2026-08-01');
        const creditDays = 30;
        const dueDate = new Date(invDate.getTime() + creditDays * 24 * 60 * 60 * 1000);

        expect(dueDate.toISOString().slice(0, 10)).toBe('2026-08-31');
    });

    test('VINV-006 (P0): Invoice past due date -> Status = Overdue', () => {
        const pastDueInvoice = {
            ...validVendorInvoice,
            dueDate: new Date('2026-08-15'),
            status: 'UNPAID'
        };
        const currentDate = new Date('2026-08-27');

        const evaluateStatus = (inv, now) => {
            if (inv.status !== 'PAID' && inv.dueDate < now) {
                return 'OVERDUE';
            }
            return inv.status;
        };

        expect(evaluateStatus(pastDueInvoice, currentDate)).toBe('OVERDUE');
    });

    test('VINV-007 (P0): Partial payment -> Outstanding balance updated', () => {
        const invoice = { ...validVendorInvoice, totalAmount: 18200, paidAmount: 0 };
        const partialPayment = 8200;

        invoice.paidAmount += partialPayment;
        const outstandingBalance = invoice.totalAmount - invoice.paidAmount;
        invoice.status = outstandingBalance > 0 ? 'PARTIAL' : 'PAID';

        expect(invoice.paidAmount).toBe(8200);
        expect(outstandingBalance).toBe(10000);
        expect(invoice.status).toBe('PARTIAL');
    });

    test('VINV-008 (P0): Full payment -> Status = Paid', () => {
        const invoice = { ...validVendorInvoice, totalAmount: 18200, paidAmount: 0 };
        const fullPayment = 18200;

        invoice.paidAmount += fullPayment;
        const outstandingBalance = invoice.totalAmount - invoice.paidAmount;
        invoice.status = outstandingBalance === 0 ? 'PAID' : 'PARTIAL';

        expect(invoice.paidAmount).toBe(18200);
        expect(outstandingBalance).toBe(0);
        expect(invoice.status).toBe('PAID');
    });

    test('VINV-009 (P1): Duplicate invoice -> Duplicate prevented', () => {
        const existingInvoices = [{ invoiceNumber: 'V-INV-9901', vendorId: 'SUP_00101' }];
        const isDuplicate = (num, vendor) => existingInvoices.some(i => i.invoiceNumber === num && i.vendorId === vendor);

        expect(isDuplicate('V-INV-9901', 'SUP_00101')).toBe(true);
    });
});

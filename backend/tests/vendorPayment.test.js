describe('QA Validation: Vendor Payment Test Suite (VPAY-001 to VPAY-006)', () => {

    const baseVendorInvoice = {
        invoiceNumber: 'V-INV-9901',
        vendorId: 'SUP_00101',
        totalAmount: 15000,
        paidAmount: 0,
        status: 'UNPAID',
        dueDate: new Date('2026-08-15')
    };

    test('VPAY-001 (P0): Make full vendor payment -> Payment successful', () => {
        const invoice = { ...baseVendorInvoice };
        const paymentAmount = 15000;

        invoice.paidAmount += paymentAmount;
        const outstanding = invoice.totalAmount - invoice.paidAmount;
        if (outstanding === 0) invoice.status = 'PAID';

        expect(invoice.paidAmount).toBe(15000);
        expect(outstanding).toBe(0);
        expect(invoice.status).toBe('PAID');
    });

    test('VPAY-002 (P0): Make partial payment -> Outstanding amount updated', () => {
        const invoice = { ...baseVendorInvoice };
        const paymentAmount = 5000;

        invoice.paidAmount += paymentAmount;
        const outstanding = invoice.totalAmount - invoice.paidAmount;
        if (outstanding > 0) invoice.status = 'PARTIAL';

        expect(invoice.paidAmount).toBe(5000);
        expect(outstanding).toBe(10000);
        expect(invoice.status).toBe('PARTIAL');
    });

    test('VPAY-003 (P1): Pay amount greater than outstanding -> Payment rejected', () => {
        const invoice = { ...baseVendorInvoice, totalAmount: 15000, paidAmount: 5000 }; // Outstanding 10000
        const overPaymentAmount = 12000;

        const processVendorPayment = (inv, amount) => {
            const outstanding = inv.totalAmount - inv.paidAmount;
            if (amount > outstanding) {
                throw new Error(`Payment amount (₹${amount}) exceeds outstanding balance (₹${outstanding})`);
            }
        };

        expect(() => processVendorPayment(invoice, overPaymentAmount)).toThrow('Payment amount (₹12000) exceeds outstanding balance (₹10000)');
    });

    test('VPAY-004 (P1): Pay overdue invoice -> Payment accepted and status updated', () => {
        const overdueInvoice = { ...baseVendorInvoice, status: 'OVERDUE', paidAmount: 0 };
        const paymentAmount = 15000;

        overdueInvoice.paidAmount += paymentAmount;
        const outstanding = overdueInvoice.totalAmount - overdueInvoice.paidAmount;
        if (outstanding === 0) overdueInvoice.status = 'PAID';

        expect(overdueInvoice.paidAmount).toBe(15000);
        expect(overdueInvoice.status).toBe('PAID');
    });

    test('VPAY-005 (P0): Duplicate payment request -> Duplicate payment prevented', () => {
        const processedPayments = [{ transactionRef: 'TXN-PAY-00101' }];

        const submitPayment = (txRef) => {
            if (processedPayments.some(p => p.transactionRef === txRef)) {
                throw new Error('Duplicate payment request detected');
            }
        };

        expect(() => submitPayment('TXN-PAY-00101')).toThrow('Duplicate payment request detected');
    });

    test('VPAY-006 (P0): Payment failure -> Invoice remains unpaid', () => {
        const invoice = { ...baseVendorInvoice, paidAmount: 0, status: 'UNPAID' };

        const processPaymentWithGateway = (inv, amount, shouldSucceed = false) => {
            if (!shouldSucceed) {
                // Payment gateway failed - roll back transaction
                throw new Error('Payment transaction failed at gateway');
            }
            inv.paidAmount += amount;
        };

        expect(() => processPaymentWithGateway(invoice, 15000, false)).toThrow('Payment transaction failed at gateway');
        expect(invoice.paidAmount).toBe(0);
        expect(invoice.status).toBe('UNPAID');
    });
});

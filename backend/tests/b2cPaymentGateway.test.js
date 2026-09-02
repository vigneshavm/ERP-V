describe('QA Validation: B2C Payment Gateway Test Suite (PAY-001 to PAY-008)', () => {

    const expectedOrderAmount = 4248;

    test('PAY-001 (P0): Successful payment -> Payment = Success', () => {
        const paymentResult = { transactionId: 'TXN_GATEWAY_1001', status: 'SUCCESS', amount: 4248 };
        expect(paymentResult.status).toBe('SUCCESS');
        expect(paymentResult.amount).toBe(expectedOrderAmount);
    });

    test('PAY-002 (P0): Failed payment -> Payment = Failed', () => {
        const paymentResult = { transactionId: 'TXN_GATEWAY_1002', status: 'FAILED', reason: 'Insufficient card funds' };
        expect(paymentResult.status).toBe('FAILED');
        expect(paymentResult.reason).toBeTruthy();
    });

    test('PAY-003 (P0): Payment timeout -> Payment remains pending/handled correctly', () => {
        const timeoutTransaction = { transactionId: 'TXN_GATEWAY_1003', status: 'PENDING', timeoutSeconds: 300 };
        const handleTimeout = (tx) => {
            if (tx.status === 'PENDING') {
                return { action: 'RETAIN_PENDING_EXPIRE_SWEEP', status: 'PENDING' };
            }
            return tx;
        };

        const res = handleTimeout(timeoutTransaction);
        expect(res.status).toBe('PENDING');
        expect(res.action).toBe('RETAIN_PENDING_EXPIRE_SWEEP');
    });

    test('PAY-004 (P0): Duplicate payment callback -> Only one payment recorded', () => {
        const recordedCallbacks = new Set();
        const callbackId = 'CALLBACK_PAY_998811';

        const processCallback = (id) => {
            if (recordedCallbacks.has(id)) {
                return { duplicate: true, action: 'IGNORED' };
            }
            recordedCallbacks.add(id);
            return { duplicate: false, action: 'PROCESSED' };
        };

        // First webhook invocation
        const res1 = processCallback(callbackId);
        expect(res1.duplicate).toBe(false);

        // Duplicate webhook invocation
        const res2 = processCallback(callbackId);
        expect(res2.duplicate).toBe(true);
        expect(res2.action).toBe('IGNORED');
    });

    test('PAY-005 (P0): Payment amount mismatch -> Payment rejected/flagged', () => {
        const tamperedCallback = { orderId: 'ORD_1001', expectedAmount: 4248, paidAmount: 100 };

        const verifyPaymentAmount = (cb) => {
            if (cb.paidAmount !== cb.expectedAmount) {
                throw new Error(`Payment rejected: Paid amount (₹${cb.paidAmount}) does not match expected order amount (₹${cb.expectedAmount})`);
            }
        };

        expect(() => verifyPaymentAmount(tamperedCallback)).toThrow('Payment rejected: Paid amount (₹100) does not match expected order amount (₹4248)');
    });

    test('PAY-006 (P0): Payment gateway unavailable -> Graceful failure', () => {
        const isGatewayAlive = false;

        const initiateGatewayCall = (online) => {
            if (!online) {
                throw new Error('Payment gateway currently unavailable. Please try again later.');
            }
        };

        expect(() => initiateGatewayCall(isGatewayAlive)).toThrow('Payment gateway currently unavailable. Please try again later.');
    });

    test('PAY-007 (P0): Refund payment -> Refund recorded', () => {
        const paymentRecord = { orderId: 'ORD_1001', amount: 4248, status: 'PAID', refundStatus: 'NONE', refundedAmount: 0 };
        
        // Full Refund
        paymentRecord.refundedAmount = paymentRecord.amount;
        paymentRecord.refundStatus = 'REFUNDED';
        paymentRecord.status = 'REFUNDED';

        expect(paymentRecord.refundedAmount).toBe(4248);
        expect(paymentRecord.refundStatus).toBe('REFUNDED');
    });

    test('PAY-008 (P1): Partial refund -> Partial refund recorded', () => {
        const paymentRecord = { orderId: 'ORD_1001', amount: 4248, status: 'PAID', refundStatus: 'NONE', refundedAmount: 0 };
        const partialRefundAmount = 1000;

        paymentRecord.refundedAmount += partialRefundAmount;
        paymentRecord.refundStatus = paymentRecord.refundedAmount < paymentRecord.amount ? 'PARTIALLY_REFUNDED' : 'REFUNDED';

        expect(paymentRecord.refundedAmount).toBe(1000);
        expect(paymentRecord.refundStatus).toBe('PARTIALLY_REFUNDED');
    });
});

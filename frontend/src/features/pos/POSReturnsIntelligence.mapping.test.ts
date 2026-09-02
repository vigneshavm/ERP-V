import { describe, it, expect } from 'vitest';
import { mapDbReasonToCategory, mapDbRefundMethod } from './POSReturnsIntelligence';

describe('mapDbReasonToCategory', () => {
    it('buckets a damaged/defective item reason as DAMAGED_ITEM', () => {
        expect(mapDbReasonToCategory([{ reason: 'Damaged Product', condition: 'damaged' }])).toBe('DAMAGED_ITEM');
        expect(mapDbReasonToCategory([{ reason: 'Defective Item', condition: 'damaged' }])).toBe('DAMAGED_ITEM');
    });

    it('buckets quality/expired reasons as QUALITY_ISSUE', () => {
        expect(mapDbReasonToCategory([{ reason: 'Quality Issue', condition: 'damaged' }])).toBe('QUALITY_ISSUE');
        expect(mapDbReasonToCategory([{ reason: 'Expired Product', condition: 'damaged' }])).toBe('QUALITY_ISSUE');
    });

    it('buckets "Wrong Item" as WRONG_ITEM', () => {
        expect(mapDbReasonToCategory([{ reason: 'Wrong Item', condition: 'not_damaged' }])).toBe('WRONG_ITEM');
    });

    it('buckets changed-mind/duplicate/no-longer-needed reasons as CUSTOMER_CHANGED_MIND', () => {
        expect(mapDbReasonToCategory([{ reason: 'Customer Changed Mind', condition: 'not_damaged' }])).toBe('CUSTOMER_CHANGED_MIND');
        expect(mapDbReasonToCategory([{ reason: 'Duplicate Order', condition: 'not_damaged' }])).toBe('CUSTOMER_CHANGED_MIND');
        expect(mapDbReasonToCategory([{ reason: 'No Longer Needed', condition: 'not_damaged' }])).toBe('CUSTOMER_CHANGED_MIND');
    });

    it('falls back on item condition for unrecognized/"Other" reason text', () => {
        expect(mapDbReasonToCategory([{ reason: 'Other', condition: 'damaged' }])).toBe('DAMAGED_ITEM');
        expect(mapDbReasonToCategory([{ reason: 'Other', condition: 'not_damaged' }])).toBe('CUSTOMER_CHANGED_MIND');
    });

    it('handles missing/empty items gracefully', () => {
        expect(mapDbReasonToCategory([])).toBe('CUSTOMER_CHANGED_MIND');
        expect(mapDbReasonToCategory(undefined as any)).toBe('CUSTOMER_CHANGED_MIND');
    });
});

describe('mapDbRefundMethod', () => {
    it('maps cash to CASH', () => {
        expect(mapDbRefundMethod({ actualRefundMethod: 'cash' })).toBe('CASH');
    });

    it('maps electronic settlement methods (bank_transfer/upi/card/cheque) to ONLINE, not CREDIT_NOTE', () => {
        expect(mapDbRefundMethod({ actualRefundMethod: 'bank_transfer' })).toBe('ONLINE');
        expect(mapDbRefundMethod({ actualRefundMethod: 'upi' })).toBe('ONLINE');
        expect(mapDbRefundMethod({ actualRefundMethod: 'card' })).toBe('ONLINE');
        expect(mapDbRefundMethod({ actualRefundMethod: 'cheque' })).toBe('ONLINE');
    });

    it('falls back to refundMethod when actualRefundMethod is unresolved', () => {
        expect(mapDbRefundMethod({ refundMethod: 'upi' })).toBe('ONLINE');
        expect(mapDbRefundMethod({ refundMethod: 'cash' })).toBe('CASH');
    });

    it('buckets credit/original_payment/unset as CREDIT_NOTE', () => {
        expect(mapDbRefundMethod({ actualRefundMethod: 'credit' })).toBe('CREDIT_NOTE');
        expect(mapDbRefundMethod({ refundMethod: 'original_payment' })).toBe('CREDIT_NOTE');
        expect(mapDbRefundMethod({})).toBe('CREDIT_NOTE');
    });
});

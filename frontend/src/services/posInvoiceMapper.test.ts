import { describe, test, expect } from 'vitest';
import { buildPosInvoicePayload } from './posInvoiceMapper';
import { Sale } from '../types/sales';

// buildPosInvoicePayload is what both the immediate-checkout path (saleThunks.processSale) and
// the offline-retry replay (SyncManager.syncOfflineSales) use to translate a client-side Sale
// into what POST /api/pos/invoice (PosController.createInvoice) actually expects. If this
// mapping is wrong, checkout either 400s or silently mis-bills every sale.

function makeSale(overrides: Partial<Sale> = {}): Sale {
    return {
        id: 'A01-000123',
        date: '2026-08-26T10:00:00',
        items: [
            { id: 'ITEM_1', name: 'Basmati Rice 5kg', price: 200, qty: 3, gstPercentage: 5, unit: 'Pcs' } as any,
        ],
        total: 630,
        customerId: 'CUST_1',
        sector: 'RETAIL' as any,
        branchId: 'BRANCH_1',
        taxMode: 'INCLUSIVE' as any,
        status: 'COMPLETED' as any,
        paymentStatus: 'PAID' as any,
        paymentMethod: 'CASH',
        ...overrides,
    } as Sale;
}

describe('buildPosInvoicePayload', () => {
    test('maps items, marks a cash sale as fully paid, and passes the customer through', () => {
        const payload = buildPosInvoicePayload(makeSale());

        expect(payload.customerId).toBe('CUST_1');
        expect(payload.paymentMethod).toBe('cash');
        expect(payload.paidAmount).toBe(630); // recognized payment method -> full total marked paid
        expect(payload.items).toEqual([
            { item: 'ITEM_1', name: 'Basmati Rice 5kg', quantity: 3, price: 200, tax: 5, barcode: undefined, isQuickEntry: undefined, discountPercent: 0, salesmanCode: undefined, returnFromBill: undefined, returnFromLine: undefined },
        ]);
    });

    test('a genuinely 0%-GST item stays 0%, it does not fall back to a default rate', () => {
        const sale = makeSale({
            items: [{ id: 'ITEM_ZERO_GST', name: 'Newspaper', price: 10, qty: 2, gstPercentage: 0, unit: 'Pcs' } as any],
        });

        const payload = buildPosInvoicePayload(sale);

        expect(payload.items[0].tax).toBe(0);
    });

    test('an item with neither gstRate nor gstPercentage set defaults to 5%, matching usePOSTotals and receiptGenerator', () => {
        const sale = makeSale({
            items: [{ id: 'ITEM_UNCONFIGURED', name: 'Unconfigured Item', price: 100, qty: 1, unit: 'Pcs' } as any],
        });

        const payload = buildPosInvoicePayload(sale);

        expect(payload.items[0].tax).toBe(5);
    });

    test('gstRate takes precedence over gstPercentage when both are set on a line', () => {
        const sale = makeSale({
            items: [{ id: 'ITEM_1', name: 'Basmati Rice 5kg', price: 200, qty: 3, gstRate: 5, gstPercentage: 18, unit: 'Pcs' } as any],
        });

        const payload = buildPosInvoicePayload(sale);

        expect(payload.items[0].tax).toBe(5);
    });

    test('a line-level gstRate of 0 stays 0% even if the product default gstPercentage is nonzero', () => {
        const sale = makeSale({
            items: [{ id: 'ITEM_1', name: 'Basmati Rice 5kg', price: 200, qty: 3, gstRate: 0, gstPercentage: 18, unit: 'Pcs' } as any],
        });

        const payload = buildPosInvoicePayload(sale);

        expect(payload.items[0].tax).toBe(0);
    });

    test('falls back to gstPercentage when gstRate is not set on the line', () => {
        const sale = makeSale({
            items: [{ id: 'ITEM_1', name: 'Basmati Rice 5kg', price: 200, qty: 3, gstPercentage: 12, unit: 'Pcs' } as any], // gstRate omitted
        });

        const payload = buildPosInvoicePayload(sale);

        expect(payload.items[0].tax).toBe(12);
    });

    test('meter-based items bill by cut length, not unit count', () => {
        const sale = makeSale({
            items: [{ id: 'ITEM_CLOTH', name: 'Cotton Fabric', price: 50, qty: 1, cutLength: 4.5, gstPercentage: 5, unit: 'Meter' } as any],
        });

        const payload = buildPosInvoicePayload(sale);

        expect(payload.items[0].quantity).toBe(4.5);
    });

    test('an unrecognized/pending payment method is not marked as paid', () => {
        const sale = makeSale({ paymentMethod: 'DUE', total: 630 });

        const payload = buildPosInvoicePayload(sale);

        expect(payload.paidAmount).toBe(0);
    });

    test('a walk-in sale with no customerId omits it rather than sending an empty string', () => {
        const sale = makeSale({ customerId: undefined });

        const payload = buildPosInvoicePayload(sale);

        expect(payload.customerId).toBeUndefined();
    });
});

describe('SQL quantity safety', () => {
    const cloth = (overrides: Record<string, unknown> = {}) => makeSale({ items: [{ id: 'CLOTH', name: 'Fabric', price: 50, qty: 2, unit: 'Meter', cutLength: 1.25, ...overrides } as Sale['items'][number]] });
    test.each([undefined, 0, -1, NaN, Infinity])('rejects invalid cut length %s instead of billing one metre', cutLength => {
        expect(() => buildPosInvoicePayload(cloth({ cutLength }))).toThrow('positive cut length');
    });
    test.each([0, NaN, Infinity, -Infinity])('rejects invalid count %s', qty => {
        expect(() => buildPosInvoicePayload(cloth({ qty }))).toThrow('finite, non-zero');
    });
    test.each(['MTR', 'metre', 'METER', ' Meter '])('makes unsupported measured alias %s explicit', unit => {
        expect(() => buildPosInvoicePayload(cloth({ unit }))).toThrow('unavailable in this checkout');
    });
    test('preserves signed measured base quantity and exact return source', () => {
        const line = buildPosInvoicePayload(cloth({ qty: -2, returnFromBill: 'A1', returnFromLine: 9 })).items[0];
        expect(line.quantity).toBe(-2.5);
        expect(line.returnFromBill).toBe('A1');
        expect(line.returnFromLine).toBe(9);
    });
    test('rejects a final quantity that SQL would silently round', () => {
        expect(() => buildPosInvoicePayload(cloth({ qty: 1, cutLength: 1.234 }))).toThrow('two decimal places');
    });
    test('accepts binary floating point noise without changing quantity', () => {
        expect(buildPosInvoicePayload(cloth({ qty: 3, cutLength: 0.1 })).items[0].quantity).toBeCloseTo(0.3, 12);
    });
    test('rejects overflow instead of serializing invalid quantity', () => {
        expect(() => buildPosInvoicePayload(cloth({ qty: 2, cutLength: Number.MAX_VALUE }))).toThrow('precision');
    });
    test('rejects a tiny quantity that SQL would store as zero', () => {
        expect(() => buildPosInvoicePayload(cloth({ qty: 1, cutLength: 1e-12 }))).toThrow('precision');
    });
    test('retains existing piece quantity without applying a cut length', () => {
        expect(buildPosInvoicePayload(cloth({ unit: 'Piece', qty: 3, cutLength: 1.25 })).items[0].quantity).toBe(3);
    });
});

describe('explicit payment allocation payload', () => {
    test('preserves supplied split tenders instead of discarding them', () => {
        const splitPaymentDetails = [{ method: 'cash', amount: 100.25 }, { method: 'upi', amount: 529.75 }];
        expect(buildPosInvoicePayload(makeSale({ splitPaymentDetails })).splitPaymentDetails).toEqual(splitPaymentDetails);
    });
    test('retains the single-payment payload when no split is supplied', () => {
        expect(buildPosInvoicePayload(makeSale()).splitPaymentDetails).toEqual([]);
    });
});

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
            { item: 'ITEM_1', name: 'Basmati Rice 5kg', quantity: 3, price: 200, tax: 5 },
        ]);
    });

    test('a genuinely 0%-GST item stays 0%, it does not fall back to a default rate', () => {
        const sale = makeSale({
            items: [{ id: 'ITEM_ZERO_GST', name: 'Newspaper', price: 10, qty: 2, gstPercentage: 0, unit: 'Pcs' } as any],
        });

        const payload = buildPosInvoicePayload(sale);

        expect(payload.items[0].tax).toBe(0);
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

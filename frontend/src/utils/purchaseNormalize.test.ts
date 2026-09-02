import { describe, test, expect } from 'vitest';
import { normalizePurchaseOrder, normalizePurchaseOrderItem } from './purchaseNormalize';

// The backend Purchase document uses camelCase (productId, productName, taxPercent, amount)
// and, depending on the endpoint, items[].productId is either a bare ObjectId string
// (getAllPurchases - no populate) or a populated Item object (getPurchaseById - populates
// items.productId). The frontend PurchaseOrder/PurchaseOrderItem types use snake_case
// (product_id, product_name, tax_percent, line_total). Several hooks/components used to read
// the snake_case fields straight off raw API responses, which was silently undefined. These
// tests pin down that the normalizer reconciles every shape it can actually receive.

describe('normalizePurchaseOrderItem', () => {
    test('unpopulated backend item (productId as a bare id string)', () => {
        const raw = { productId: 'ITEM_1', productName: 'Cotton Roll', quantity: 10, rate: 50, taxPercent: 5, amount: 500, receivedQty: 2, lotNumber: 'LOT-1' };
        expect(normalizePurchaseOrderItem(raw)).toEqual({
            product_id: 'ITEM_1',
            product_name: 'Cotton Roll',
            sku: undefined,
            quantity: 10,
            rate: 50,
            tax_percent: 5,
            discount_amount: 0,
            line_total: 500,
            received_quantity: 2,
            lot_number: 'LOT-1',
        });
    });

    test('populated backend item (productId as a nested Item object, from getPurchaseById)', () => {
        const raw = { productId: { _id: 'ITEM_2', name: 'Steel Rod', sku: 'SKU-2' }, quantity: 4, rate: 200, amount: 800 };
        const result = normalizePurchaseOrderItem(raw);
        expect(result.product_id).toBe('ITEM_2');
        expect(result.product_name).toBe('Steel Rod');
        expect(result.sku).toBe('SKU-2');
    });

    test('already frontend-shaped item (snake_case) passes through unchanged', () => {
        const raw = { product_id: 'ITEM_3', product_name: 'Yarn', quantity: 1, rate: 10, tax_percent: 0, discount_amount: 0, line_total: 10 };
        const result = normalizePurchaseOrderItem(raw);
        expect(result.product_id).toBe('ITEM_3');
        expect(result.product_name).toBe('Yarn');
    });

    test('missing product name falls back to a placeholder rather than undefined', () => {
        const result = normalizePurchaseOrderItem({ quantity: 1, rate: 1 });
        expect(result.product_name).toBe('Unknown Item');
    });
});

describe('normalizePurchaseOrder', () => {
    test('raw backend order with a populated vendor and items', () => {
        const raw = {
            _id: 'PO_1',
            purchaseNumber: 'PUR-20260820-001',
            vendorId: { _id: 'VEND_1', businessName: 'Acme Textiles' },
            date: '2026-08-20',
            totalAmount: 5450,
            status: 'DRAFT',
            createdAt: '2026-08-20T10:00:00.000Z',
            items: [{ productId: 'ITEM_1', productName: 'Cotton Roll', quantity: 100, rate: 50, amount: 5000 }],
        };
        const result = normalizePurchaseOrder(raw);
        expect(result.id).toBe('PO_1');
        expect(result.po_number).toBe('PUR-20260820-001');
        expect(result.vendor_name).toBe('Acme Textiles');
        expect(result.vendor_id).toBe('VEND_1');
        expect(result.po_date).toBe('2026-08-20');
        expect(result.total_amount).toBe(5450);
        expect(result.created_at).toBe('2026-08-20T10:00:00.000Z');
        expect(result.items).toHaveLength(1);
        expect(result.items[0].product_id).toBe('ITEM_1');
    });

    test('raw backend order with an unpopulated (bare id string) vendor', () => {
        const raw = { _id: 'PO_2', vendorId: 'VEND_2', date: '2026-08-20', totalAmount: 100, status: 'DRAFT', items: [] };
        const result = normalizePurchaseOrder(raw);
        expect(result.vendor_id).toBe('VEND_2');
        expect(result.vendor_name).toBe('Unknown Vendor');
    });

    test('already frontend-shaped order (id + po_number already present) is preserved', () => {
        const raw = { id: 'PO_3', po_number: 'PUR-3', vendor_name: 'Beta Corp', vendor_id: 'VEND_3', po_date: '2026-08-01', total_amount: 200, status: 'APPROVED', items: [], created_at: '2026-08-01T00:00:00.000Z' };
        const result = normalizePurchaseOrder(raw);
        expect(result).toMatchObject({ id: 'PO_3', po_number: 'PUR-3', vendor_name: 'Beta Corp', status: 'APPROVED' });
    });

    test('null/undefined input passes through without throwing', () => {
        expect(normalizePurchaseOrder(null)).toBeNull();
        expect(normalizePurchaseOrder(undefined)).toBeUndefined();
    });
});

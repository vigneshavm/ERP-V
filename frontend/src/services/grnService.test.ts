import { describe, test, expect, vi } from 'vitest';

// api.ts isn't exercised by mapGrnToFrontendGRN (a pure function) but grnService.ts imports it
// for createGRN, so it needs a resolvable module for this file to import at all.
vi.mock('./api', () => ({ default: { post: vi.fn(), get: vi.fn() } }));

import { mapGrnToFrontendGRN } from './grnService';

// Pins down the mapping from a raw POST /api/grn response (GRNController.createGRN's shape -
// camelCase, purchaseId/vendorId possibly populated or possibly bare ids since createGRN's own
// response is unpopulated but getGRNs' is) onto the frontend GRN/GRNItem shape that
// purchaseSlice's addGRN reducer and the GRN list page (useGRNData) consume.

describe('mapGrnToFrontendGRN', () => {
    test('maps an unpopulated createGRN response, using the fallback poNumber/vendorName', () => {
        const backendGrn = {
            _id: 'GRN_1',
            grnNumber: 'GRN-20260820-0001',
            purchaseId: 'PO_1',
            vendorId: 'VEND_1',
            receivedDate: '2026-08-20T00:00:00.000Z',
            status: 'PARTIAL',
            createdAt: '2026-08-20T00:00:00.000Z',
            items: [
                { productId: 'ITEM_1', productName: 'Cotton Roll', orderedQty: 100, receivedQty: 95, acceptedQty: 90, rejectedQty: 5, lotNumber: 'LOT-1' },
            ],
        };

        const result = mapGrnToFrontendGRN(backendGrn, { poNumber: 'PUR-20260820-001', vendorName: 'Acme Textiles' });

        expect(result.id).toBe('GRN_1');
        expect(result.poId).toBe('PO_1');
        expect(result.poNumber).toBe('PUR-20260820-001'); // from fallback, since purchaseId wasn't populated
        expect(result.vendorId).toBe('VEND_1');
        expect(result.vendorName).toBe('Acme Textiles'); // from fallback
        expect(result.status).toBe('PARTIAL');
        expect(result.items).toHaveLength(1);
        expect(result.items[0]).toMatchObject({
            productId: 'ITEM_1', productName: 'Cotton Roll',
            orderedQty: 100, receivedQty: 95, acceptedQty: 90, rejectedQty: 5,
            inspectionStatus: 'Partial', // rejected > 0 AND accepted > 0
            batchNumber: 'LOT-1',
        });
    });

    test('maps a populated getGRNs response (purchaseId/vendorId as nested objects)', () => {
        const backendGrn = {
            _id: 'GRN_2',
            grnNumber: 'GRN-20260820-0002',
            purchaseId: { _id: 'PO_2', purchaseNumber: 'PUR-20260820-002' },
            vendorId: { _id: 'VEND_2', businessName: 'Beta Supplies' },
            status: 'ACCEPTED',
            items: [{ productId: 'ITEM_2', productName: 'Steel Rod', orderedQty: 10, receivedQty: 10, acceptedQty: 10, rejectedQty: 0 }],
        };

        const result = mapGrnToFrontendGRN(backendGrn);

        expect(result.poNumber).toBe('PUR-20260820-002');
        expect(result.vendorName).toBe('Beta Supplies');
        expect(result.items[0].inspectionStatus).toBe('Accepted');
    });

    test('a fully rejected line item (accepted=0, rejected>0) maps to Rejected, not Partial', () => {
        const backendGrn = {
            _id: 'GRN_3', grnNumber: 'GRN-3', purchaseId: 'PO_3', vendorId: 'VEND_3', status: 'REJECTED',
            items: [{ productId: 'ITEM_3', productName: 'Damaged Goods', orderedQty: 5, receivedQty: 5, acceptedQty: 0, rejectedQty: 5 }],
        };
        const result = mapGrnToFrontendGRN(backendGrn);
        expect(result.items[0].inspectionStatus).toBe('Rejected');
    });
});

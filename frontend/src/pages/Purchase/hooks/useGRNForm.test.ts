import { describe, test, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';

// Hook-level end-to-end test for useGRNForm - the standalone "Receive Goods" entry point
// (GRNForm.tsx -> useGRNForm), as opposed to the PurchaseOrderDetails-embedded one covered by
// PurchaseOrderDetails.test.tsx. Mocks only react-redux/react-router-dom wiring and the
// grnService HTTP call; runs the REAL purchaseSlice addGRN action creator and the REAL
// normalizePurchaseOrderItem.

let fakeState: any;
let fakeParams: any = {};
const mockDispatch = vi.fn();
const mockNavigate = vi.fn();

vi.mock('react-redux', () => ({
    useDispatch: () => mockDispatch,
    useSelector: (selector: any) => selector(fakeState),
}));

vi.mock('react-router-dom', () => ({
    useParams: () => fakeParams,
    useNavigate: () => mockNavigate,
}));

const mockCreateGRN = vi.fn();
vi.mock('../../../services/grnService', () => ({
    createGRN: (...args: any[]) => mockCreateGRN(...args),
    mapGrnToFrontendGRN: (grn: any, fallback?: any) => ({
        id: grn._id,
        poId: grn.purchaseId,
        poNumber: fallback?.poNumber,
        vendorName: fallback?.vendorName,
        status: grn.status,
        items: grn.items,
    }),
}));

import { useGRNForm } from './useGRNForm';

const makeOrder = (overrides: any = {}) => ({
    id: 'PO_1',
    po_number: 'PUR-1',
    vendor_name: 'Acme',
    vendor_id: 'VEND_1',
    po_date: '2026-08-20',
    items: [{ product_id: 'ITEM_1', product_name: 'Cotton Roll', quantity: 100, rate: 50, tax_percent: 5, discount_amount: 0, line_total: 5000, received_quantity: 0 }],
    total_amount: 5250,
    status: 'SENT_TO_VENDOR',
    created_at: '2026-08-20T00:00:00.000Z',
    ...overrides,
});

beforeEach(() => {
    mockDispatch.mockClear();
    mockNavigate.mockClear();
    mockCreateGRN.mockReset();
    fakeParams = {};
    fakeState = {
        purchase: { orders: [makeOrder()] },
        auth: { user: { name: 'Priya' }, currentBranch: 'Main' },
    };
});

describe('useGRNForm', () => {
    test('availablePOs only includes POs a real GRN can actually be raised against', () => {
        fakeState.purchase.orders = [
            makeOrder({ id: 'PO_1', status: 'SENT_TO_VENDOR' }),
            makeOrder({ id: 'PO_2', status: 'PARTIALLY_RECEIVED' }),
            makeOrder({ id: 'PO_3', status: 'DRAFT' }),
            makeOrder({ id: 'PO_4', status: 'COMPLETED' }),
        ];
        const { result } = renderHook(() => useGRNForm());
        expect(result.current.availablePOs.map((o: any) => o.id)).toEqual(['PO_1', 'PO_2']);
    });

    test('selecting a PO initializes items from real outstanding quantities (quantity - received_quantity)', () => {
        fakeState.purchase.orders = [makeOrder({
            items: [{ product_id: 'ITEM_1', product_name: 'Cotton Roll', quantity: 100, received_quantity: 20, rate: 50, tax_percent: 5, discount_amount: 0, line_total: 5000 }],
        })];
        const { result } = renderHook(() => useGRNForm());
        act(() => { result.current.handlePOSelect('PO_1'); });

        expect(result.current.grnData.poId).toBe('PO_1');
        expect(result.current.grnData.items).toHaveLength(1);
        expect(result.current.grnData.items![0]).toMatchObject({
            productId: 'ITEM_1', productName: 'Cotton Roll', orderedQty: 100, receivedQty: 80, acceptedQty: 80, rejectedQty: 0,
        });
    });

    test('saveGRN refuses to call the backend with no PO selected', async () => {
        const { result } = renderHook(() => useGRNForm());
        await act(async () => { await result.current.saveGRN(); });

        expect(mockCreateGRN).not.toHaveBeenCalled();
        expect(result.current.saveError).toMatch(/Select a Purchase Order/i);
    });

    test('saveGRN posts a real GRN payload, dispatches the real addGRN action, and navigates to the GRN list', async () => {
        mockCreateGRN.mockResolvedValueOnce({ grn: { _id: 'GRN_9', purchaseId: 'PO_1', status: 'ACCEPTED', items: [] } });
        const { result } = renderHook(() => useGRNForm());
        act(() => { result.current.handlePOSelect('PO_1'); });

        await act(async () => { await result.current.saveGRN(); });

        expect(mockCreateGRN).toHaveBeenCalledWith(expect.objectContaining({
            purchaseId: 'PO_1',
            items: [expect.objectContaining({ productId: 'ITEM_1', productName: 'Cotton Roll', receivedQty: 100, rejectedQty: 0 })],
        }));
        expect(mockDispatch).toHaveBeenCalledWith(expect.objectContaining({
            type: 'purchase/addGRN',
            payload: expect.objectContaining({ id: 'GRN_9', poId: 'PO_1' }),
        }));
        expect(mockNavigate).toHaveBeenCalledWith('/purchase/grn');
        expect(result.current.saveError).toBeNull();
    });

    test('a rejected saveGRN call surfaces saveError and does not navigate away', async () => {
        mockCreateGRN.mockRejectedValueOnce({ response: { data: { message: 'GRN rejected: PO not receivable' } } });
        const { result } = renderHook(() => useGRNForm());
        act(() => { result.current.handlePOSelect('PO_1'); });

        await act(async () => { await result.current.saveGRN(); });

        expect(result.current.saveError).toBe('GRN rejected: PO not receivable');
        expect(mockNavigate).not.toHaveBeenCalled();
        expect(mockDispatch).not.toHaveBeenCalledWith(expect.objectContaining({ type: 'purchase/addGRN' }));
    });

    test('saveGRN omits already-fully-received line items from the payload', async () => {
        fakeState.purchase.orders = [makeOrder({
            items: [
                { product_id: 'ITEM_1', product_name: 'Cotton Roll', quantity: 100, received_quantity: 40, rate: 50, tax_percent: 5, discount_amount: 0, line_total: 5000 },
                { product_id: 'ITEM_2', product_name: 'Steel Rod', quantity: 10, received_quantity: 10, rate: 200, tax_percent: 5, discount_amount: 0, line_total: 2000 },
            ],
        })];
        mockCreateGRN.mockResolvedValueOnce({ grn: { _id: 'GRN_10', purchaseId: 'PO_1', status: 'ACCEPTED', items: [] } });
        const { result } = renderHook(() => useGRNForm());
        act(() => { result.current.handlePOSelect('PO_1'); });

        await act(async () => { await result.current.saveGRN(); });

        expect(mockCreateGRN).toHaveBeenCalledWith(expect.objectContaining({
            items: [expect.objectContaining({ productId: 'ITEM_1', receivedQty: 60 })],
        }));
    });
});

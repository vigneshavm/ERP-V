import { describe, test, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';

// Hook-level end-to-end test for usePurchaseOrders.updatePOLifecycleStatus - the piece that
// decides whether a status transition hits the new validated PATCH /api/purchases/:id/status
// route (real Purchase.status enum values) or falls back to the legacy unvalidated PUT
// /api/purchases/:id (the local-only 'Billed'/'Paid' labels, which aren't in the Mongoose enum
// and would be rejected by the validated route). Mocks only react-redux and the api.ts HTTP
// client; runs the REAL purchaseSlice action creators and the REAL normalizePurchaseOrder(s).

let fakeState: any;
const mockDispatch = vi.fn();

vi.mock('react-redux', () => ({
    useDispatch: () => mockDispatch,
    useSelector: (selector: any) => selector(fakeState),
}));

const mockApiGet = vi.fn();
const mockApiPut = vi.fn();
const mockApiPatch = vi.fn();
const mockApiPost = vi.fn();
const mockApiDelete = vi.fn();
vi.mock('../services/api.js', () => ({
    default: {
        get: (...args: any[]) => mockApiGet(...args),
        put: (...args: any[]) => mockApiPut(...args),
        patch: (...args: any[]) => mockApiPatch(...args),
        post: (...args: any[]) => mockApiPost(...args),
        delete: (...args: any[]) => mockApiDelete(...args),
    },
}));

import { usePurchaseOrders } from './usePurchaseOrders';

beforeEach(() => {
    mockDispatch.mockClear();
    mockApiGet.mockReset();
    mockApiPut.mockReset();
    mockApiPatch.mockReset();
    mockApiPost.mockReset();
    mockApiDelete.mockReset();
    fakeState = { purchase: { orders: [] } };
});

describe('usePurchaseOrders.updatePOLifecycleStatus', () => {
    test('a real lifecycle status (SUBMITTED) hits the validated PATCH route, not the legacy PUT', async () => {
        mockApiPatch.mockResolvedValueOnce({ data: { purchase: { approvedBy: null, approvedAt: null, sentToVendorAt: null } } });
        const { result } = renderHook(() => usePurchaseOrders());

        await act(async () => { await result.current.updatePOLifecycleStatus('PO_1', 'SUBMITTED'); });

        expect(mockApiPatch).toHaveBeenCalledWith('/api/purchases/PO_1/status', { status: 'SUBMITTED' });
        expect(mockApiPut).not.toHaveBeenCalled();
        expect(mockDispatch).toHaveBeenCalledWith(expect.objectContaining({
            type: 'purchase/updateOrder',
            payload: expect.objectContaining({ id: 'PO_1', updates: expect.objectContaining({ status: 'SUBMITTED' }) }),
        }));
    });

    test('approving a PO stamps approvedBy/approvedAt from the real server response into the dispatched update', async () => {
        mockApiPatch.mockResolvedValueOnce({ data: { purchase: { approvedBy: 'USER_1', approvedAt: '2026-08-26T12:00:00.000Z', sentToVendorAt: null } } });
        const { result } = renderHook(() => usePurchaseOrders());

        await act(async () => { await result.current.approveOrder('PO_1'); });

        expect(mockApiPatch).toHaveBeenCalledWith('/api/purchases/PO_1/status', { status: 'APPROVED' });
        expect(mockDispatch).toHaveBeenCalledWith(expect.objectContaining({
            type: 'purchase/updateOrder',
            payload: { id: 'PO_1', updates: { status: 'APPROVED', approvedBy: 'USER_1', approvedAt: '2026-08-26T12:00:00.000Z', sentToVendorAt: null } },
        }));
    });

    test('sendToVendor routes SENT_TO_VENDOR through the validated PATCH route', async () => {
        mockApiPatch.mockResolvedValueOnce({ data: { purchase: {} } });
        const { result } = renderHook(() => usePurchaseOrders());

        await act(async () => { await result.current.sendToVendor('PO_1'); });

        expect(mockApiPatch).toHaveBeenCalledWith('/api/purchases/PO_1/status', { status: 'SENT_TO_VENDOR' });
    });

    test('rejectOrder routes back to DRAFT through the validated PATCH route', async () => {
        mockApiPatch.mockResolvedValueOnce({ data: { purchase: {} } });
        const { result } = renderHook(() => usePurchaseOrders());

        await act(async () => { await result.current.rejectOrder('PO_1'); });

        expect(mockApiPatch).toHaveBeenCalledWith('/api/purchases/PO_1/status', { status: 'DRAFT' });
    });

    test('a local-only status (Billed) is NOT sent to the validated PATCH route - it would be rejected by the Mongoose enum - and falls back to the legacy PUT', async () => {
        mockApiPut.mockResolvedValueOnce({ data: {} });
        const { result } = renderHook(() => usePurchaseOrders());

        await act(async () => { await result.current.updatePOLifecycleStatus('PO_1', 'Billed' as any); });

        expect(mockApiPut).toHaveBeenCalledWith('/api/purchases/PO_1', { status: 'Billed' });
        expect(mockApiPatch).not.toHaveBeenCalled();
        expect(mockDispatch).toHaveBeenCalledWith(expect.objectContaining({
            type: 'purchase/updateOrder',
            payload: { id: 'PO_1', updates: { status: 'Billed' } },
        }));
    });

    test('a local-only status (Paid) also falls back to the legacy PUT', async () => {
        mockApiPut.mockResolvedValueOnce({ data: {} });
        const { result } = renderHook(() => usePurchaseOrders());

        await act(async () => { await result.current.updatePOLifecycleStatus('PO_1', 'Paid' as any); });

        expect(mockApiPut).toHaveBeenCalledWith('/api/purchases/PO_1', { status: 'Paid' });
        expect(mockApiPatch).not.toHaveBeenCalled();
    });

    test('a failed PATCH call propagates so the caller can surface the error, and does not dispatch an optimistic update', async () => {
        mockApiPatch.mockRejectedValueOnce(new Error('PO is not in a state that can transition to APPROVED'));
        const { result } = renderHook(() => usePurchaseOrders());

        await expect(act(async () => { await result.current.approveOrder('PO_1'); })).rejects.toThrow(/cannot transition|not in a state/i);
        expect(mockDispatch).not.toHaveBeenCalledWith(expect.objectContaining({ type: 'purchase/updateOrder' }));
    });
});

describe('usePurchaseOrders.fetchOrders / fetchOrderDetails - real normalization', () => {
    test('fetchOrders normalizes raw backend camelCase orders before dispatching setOrders', async () => {
        mockApiGet.mockResolvedValueOnce({
            data: [{ _id: 'PO_1', vendorId: { _id: 'VEND_1', businessName: 'Acme Textiles' }, date: '2026-08-20', totalAmount: 5000, status: 'DRAFT', items: [] }],
        });
        const { result } = renderHook(() => usePurchaseOrders());

        await act(async () => { await result.current.fetchOrders(); });

        expect(mockApiGet).toHaveBeenCalledWith('/api/purchases');
        expect(mockDispatch).toHaveBeenCalledWith(expect.objectContaining({
            type: 'purchase/setOrders',
            payload: [expect.objectContaining({ id: 'PO_1', vendor_name: 'Acme Textiles', total_amount: 5000 })],
        }));
    });

    test('fetchOrderDetails returns a normalized single order without dispatching', async () => {
        mockApiGet.mockResolvedValueOnce({
            data: { _id: 'PO_2', vendorId: 'VEND_2', date: '2026-08-20', totalAmount: 100, status: 'DRAFT', items: [] },
        });
        const { result } = renderHook(() => usePurchaseOrders());

        let order: any;
        await act(async () => { order = await result.current.fetchOrderDetails('PO_2'); });

        expect(mockApiGet).toHaveBeenCalledWith('/api/purchases/PO_2');
        expect(order).toMatchObject({ id: 'PO_2', vendor_id: 'VEND_2', vendor_name: 'Unknown Vendor' });
    });
});

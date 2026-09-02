import { describe, test, expect, vi, beforeEach } from 'vitest';

// Mocks must be declared before importing the module under test (Vitest hoists vi.mock calls).
const mockApiPost = vi.fn();
vi.mock('../../services/api', () => ({
    default: { post: (...args: any[]) => mockApiPost(...args) },
}));

const mockOfflineSalesAdd = vi.fn();
vi.mock('../../services/db', () => ({
    db: { offlineSales: { add: (...args: any[]) => mockOfflineSalesAdd(...args) } },
}));

const mockToastError = vi.fn();
vi.mock('react-toastify', () => ({
    toast: { error: (...args: any[]) => mockToastError(...args) },
}));

const { processSale } = await import('./saleThunks');

// This is the fix for the sale that "prints but never reaches the DB": processSale used to
// fire-and-forget a POST to '/sales-invoice/sync', a route that never existed. It now awaits the
// real endpoint and, on any failure (network, validation, offline), queues the sale for retry
// instead of silently dropping it.

function makeSale(overrides: any = {}) {
    return {
        id: 'A01-000123',
        date: '2026-08-26T10:00:00',
        items: [{ id: 'ITEM_1', name: 'Rice', price: 200, qty: 3, gstPercentage: 5, unit: 'Pcs' }],
        total: 630,
        paymentMethod: 'CASH',
        sector: 'RETAIL',
        branchId: 'BRANCH_1',
        ...overrides,
    };
}

function makeGetState() {
    return () => ({
        auth: { user: { tenantId: 'TENANT_1' } },
        tenant: { tenants: [{ id: 'TENANT_1', locations: [] }], branches: [] },
    });
}

describe('processSale (saleThunks)', () => {
    let dispatch: ReturnType<typeof vi.fn>;
    let _originalOnLine: PropertyDescriptor | undefined;

    beforeEach(() => {
        dispatch = vi.fn();
        mockApiPost.mockReset();
        mockOfflineSalesAdd.mockReset();
        mockToastError.mockReset();
        _originalOnLine = Object.getOwnPropertyDescriptor(navigator, 'onLine');
    });

    function setOnline(value: boolean) {
        Object.defineProperty(navigator, 'onLine', { value, configurable: true });
    }

    test('online + server accepts the sale: posts to /api/pos/invoice and does not queue offline', async () => {
        setOnline(true);
        mockApiPost.mockResolvedValue({ data: { success: true, invoice: { invoiceNo: 'INV-1' } } });

        await processSale(makeSale())(dispatch as any, makeGetState() as any);

        expect(mockApiPost).toHaveBeenCalledWith('/api/pos/invoice', expect.objectContaining({
            paymentMethod: 'cash',
            items: [expect.objectContaining({ item: 'ITEM_1', quantity: 3, tax: 5 })],
        }));
        expect(mockOfflineSalesAdd).not.toHaveBeenCalled();
        expect(mockToastError).not.toHaveBeenCalled();
    });

    test('online but the server rejects the sale: queues it offline and warns the cashier', async () => {
        setOnline(true);
        mockApiPost.mockResolvedValue({ data: { success: false, message: 'Insufficient stock for Rice' } });

        await processSale(makeSale())(dispatch as any, makeGetState() as any);

        expect(mockOfflineSalesAdd).toHaveBeenCalledTimes(1);
        const queued = mockOfflineSalesAdd.mock.calls[0][0];
        expect(queued.synced).toBe(false);
        expect(queued.retryCount).toBe(0);
        expect(queued.id).toBe('A01-000123');
        expect(mockToastError).toHaveBeenCalledTimes(1);
        expect(mockToastError.mock.calls[0][0]).toMatch(/did NOT save to the server/);
    });

    test('online but the request throws (network error): queues it offline and warns the cashier', async () => {
        setOnline(true);
        mockApiPost.mockRejectedValue(new Error('Network Error'));

        await processSale(makeSale())(dispatch as any, makeGetState() as any);

        expect(mockOfflineSalesAdd).toHaveBeenCalledTimes(1);
        expect(mockToastError).toHaveBeenCalledTimes(1);
    });

    test('fully offline: queues immediately without ever calling the API', async () => {
        setOnline(false);

        await processSale(makeSale())(dispatch as any, makeGetState() as any);

        expect(mockApiPost).not.toHaveBeenCalled();
        expect(mockOfflineSalesAdd).toHaveBeenCalledTimes(1);
        // No server round-trip happened, so there's nothing to warn the cashier about yet -
        // SyncManager reports failures once it actually tries to replay the queue.
        expect(mockToastError).not.toHaveBeenCalled();
    });

    test('still records the optimistic local Redux state (recordSale + deductStock) regardless of sync outcome', async () => {
        setOnline(true);
        mockApiPost.mockResolvedValue({ data: { success: true } });

        await processSale(makeSale())(dispatch as any, makeGetState() as any);

        const dispatchedTypes = dispatch.mock.calls.map(call => call[0]?.type);
        expect(dispatchedTypes).toEqual(expect.arrayContaining([
            expect.stringContaining('recordSale'),
            expect.stringContaining('deductStock'),
            expect.stringContaining('addTransaction'),
        ]));
    });
});

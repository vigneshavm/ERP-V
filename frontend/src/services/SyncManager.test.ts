import { describe, test, expect, vi, beforeEach } from 'vitest';

const mockApiPost = vi.fn();
vi.mock('./api', () => ({
    default: { post: (...args: any[]) => mockApiPost(...args) },
}));

const mockOfflineSalesWhere = vi.fn();
const mockOfflineSalesUpdate = vi.fn();
vi.mock('./db', () => ({
    db: {
        offlineSales: {
            where: (...args: any[]) => mockOfflineSalesWhere(...args),
            update: (...args: any[]) => mockOfflineSalesUpdate(...args),
        },
    },
}));

vi.mock('../redux/store', () => ({ store: { dispatch: vi.fn() } }));
vi.mock('../redux/slices/financeSlice', () => ({ setDailyRecordSynced: vi.fn() }));

const mockLogEvent = vi.fn();
vi.mock('./SyncIntelligenceService', () => ({
    SyncIntelligenceService: { logEvent: (...args: any[]) => mockLogEvent(...args) },
}));

const { SyncManager } = await import('./SyncManager');

// Regression coverage for the offline-queue replay side of the B2C fix: SyncManager used to post
// pending sales to '/sales-invoice/sync' (a route that never existed) and marked them synced
// unconditionally, meaning queued sales looked "synced" locally while never having reached the
// database at all. It now replays through the same real endpoint checkout uses and only marks a
// sale synced once the server confirms it.

function pendingSale(overrides: any = {}) {
    return {
        localId: 1,
        id: 'A01-000123',
        items: [{ id: 'ITEM_1', name: 'Rice', price: 200, qty: 3, gstPercentage: 5, unit: 'Pcs' }],
        total: 630,
        paymentMethod: 'CASH',
        branchId: 'BRANCH_1',
        retryCount: 0,
        ...overrides,
    };
}

function mockPendingQueue(sales: any[]) {
    mockOfflineSalesWhere.mockReturnValue({
        equals: vi.fn(() => ({ toArray: vi.fn(async () => sales) })),
    });
}

describe('SyncManager.syncOfflineSales', () => {
    let _originalOnLine: PropertyDescriptor | undefined;

    beforeEach(() => {
        mockApiPost.mockReset();
        mockOfflineSalesWhere.mockReset();
        mockOfflineSalesUpdate.mockReset();
        mockLogEvent.mockReset();
        // Reset the class's internal re-entrancy guard between tests.
        (SyncManager as any).isSyncing = false;
        _originalOnLine = Object.getOwnPropertyDescriptor(navigator, 'onLine');
        Object.defineProperty(navigator, 'onLine', { value: true, configurable: true });
    });

    test('replays a queued sale through the real invoice endpoint and marks it synced on success', async () => {
        mockPendingQueue([pendingSale()]);
        mockApiPost.mockResolvedValue({ data: { success: true } });

        await SyncManager.syncOfflineSales();

        expect(mockApiPost).toHaveBeenCalledWith('/api/pos/invoice', expect.objectContaining({
            items: [expect.objectContaining({ item: 'ITEM_1', quantity: 3, tax: 5 })],
        }));
        expect(mockOfflineSalesUpdate).toHaveBeenCalledWith(1, { synced: true });
    });

    test('a server rejection (success: false) is treated as a failure, not marked synced', async () => {
        mockPendingQueue([pendingSale()]);
        mockApiPost.mockResolvedValue({ data: { success: false, message: 'Duplicate invoice' } });

        await SyncManager.syncOfflineSales();

        expect(mockOfflineSalesUpdate).toHaveBeenCalledWith(1, { retryCount: 1 });
        expect(mockOfflineSalesUpdate).not.toHaveBeenCalledWith(1, { synced: true });
    });

    test('a network/throw error increments retryCount instead of marking synced', async () => {
        mockPendingQueue([pendingSale({ retryCount: 2 })]);
        mockApiPost.mockRejectedValue(new Error('Network Error'));

        await SyncManager.syncOfflineSales();

        expect(mockOfflineSalesUpdate).toHaveBeenCalledWith(1, { retryCount: 3 });
    });

    test('does nothing when offline', async () => {
        Object.defineProperty(navigator, 'onLine', { value: false, configurable: true });
        mockPendingQueue([pendingSale()]);

        await SyncManager.syncOfflineSales();

        expect(mockApiPost).not.toHaveBeenCalled();
    });
});

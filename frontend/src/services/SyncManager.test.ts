import { describe, test, expect, vi, beforeEach } from 'vitest';

const mockApiPost = vi.fn();
const mockApiPut = vi.fn();
const mockApiDelete = vi.fn();
vi.mock('./api', () => ({
    default: {
        post: (...args: any[]) => mockApiPost(...args),
        put: (...args: any[]) => mockApiPut(...args),
        delete: (...args: any[]) => mockApiDelete(...args),
    },
}));

// Stored rows per queue; `filter` applies the real predicate, so a wrong pending-check fails here.
let offlineSalesRows: any[] = [];
let dailyFinanceRows: any[] = [];
const mockOfflineSalesUpdate = vi.fn();
const mockDailyFinanceUpdate = vi.fn();
vi.mock('./db', () => ({
    db: {
        offlineSales: {
            filter: (pred: (r: any) => boolean) => ({ toArray: async () => offlineSalesRows.filter(pred) }),
            update: (...args: any[]) => mockOfflineSalesUpdate(...args),
        },
        dailyFinanceQueue: {
            filter: (pred: (r: any) => boolean) => ({ toArray: async () => dailyFinanceRows.filter(pred) }),
            update: (...args: any[]) => mockDailyFinanceUpdate(...args),
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
    offlineSalesRows = sales.map(sale => ({ synced: false, ...sale }));
}

describe('SyncManager.syncOfflineSales', () => {
    let _originalOnLine: PropertyDescriptor | undefined;

    beforeEach(() => {
        mockApiPost.mockReset();
        offlineSalesRows = [];
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
        expect(mockLogEvent).toHaveBeenCalledWith(expect.objectContaining({ entityId: 'A01-000123', status: 'FAILED' }));
        expect(mockLogEvent).not.toHaveBeenCalledWith(expect.objectContaining({ status: 'SYNCED' }));
    });

    test('a network/throw error increments retryCount instead of marking synced', async () => {
        mockPendingQueue([pendingSale({ retryCount: 2 })]);
        mockApiPost.mockRejectedValue(new Error('Network Error'));

        await SyncManager.syncOfflineSales();

        expect(mockOfflineSalesUpdate).toHaveBeenCalledWith(1, { retryCount: 3 });
        expect(mockLogEvent).toHaveBeenCalledWith(expect.objectContaining({ status: 'FAILED', payload: expect.objectContaining({ error: 'Network Error', retryCount: 3 }) }));
    });

    test('does nothing when offline', async () => {
        Object.defineProperty(navigator, 'onLine', { value: false, configurable: true });
        mockPendingQueue([pendingSale()]);

        await SyncManager.syncOfflineSales();

        expect(mockApiPost).not.toHaveBeenCalled();
    });

    test('picks up sales stored with synced: false and skips synced ones', async () => {
        offlineSalesRows = [pendingSale({ localId: 1, synced: false }), pendingSale({ localId: 2, id: 'A01-000124', synced: true })];
        mockApiPost.mockResolvedValue({ data: { success: true } });

        await SyncManager.syncOfflineSales();

        expect(mockApiPost).toHaveBeenCalledTimes(1);
        expect(mockOfflineSalesUpdate).toHaveBeenCalledWith(1, { synced: true });
    });
});

describe('SyncManager.syncDailyFinanceEntries', () => {
    beforeEach(() => {
        mockApiPost.mockReset(); mockApiPut.mockReset(); mockApiDelete.mockReset();
        mockDailyFinanceUpdate.mockReset(); mockLogEvent.mockReset();
        (SyncManager as any).isSyncingDF = false;
        Object.defineProperty(navigator, 'onLine', { value: true, configurable: true });
    });

    const queued = (localId: number, operation: string, recordId = 'rec-1', extra: any = {}) =>
        ({ localId, recordId, operation, data: { date: '2026-09-25', cashSales: 100 }, synced: false, retryCount: 0, ...extra });

    test('replays each queued change to the matching /api/daily-finance endpoint, in order', async () => {
        dailyFinanceRows = [queued(1, 'INSERT'), queued(2, 'UPDATE'), queued(3, 'DELETE'), queued(4, 'INSERT', 'rec-2', { synced: true })];
        mockApiPost.mockResolvedValue({ data: { success: true } });
        mockApiPut.mockResolvedValue({ data: { success: true } });
        mockApiDelete.mockResolvedValue({ data: { success: true } });

        await SyncManager.syncDailyFinanceEntries();

        expect(mockApiPost).toHaveBeenCalledTimes(1);
        expect(mockApiPost).toHaveBeenCalledWith('/api/daily-finance', expect.objectContaining({ id: 'rec-1', cashSales: 100 }));
        expect(mockApiPut).toHaveBeenCalledWith('/api/daily-finance/rec-1', expect.objectContaining({ cashSales: 100 }));
        expect(mockApiDelete).toHaveBeenCalledWith('/api/daily-finance/rec-1');
        expect(mockDailyFinanceUpdate.mock.calls.map(c => c[0])).toEqual([1, 2, 3]);
    });

    test('keeps the item queued and logs FAILED when the server does not confirm', async () => {
        dailyFinanceRows = [queued(1, 'INSERT')];
        mockApiPost.mockResolvedValue({ data: { success: false, message: 'A daily finance record already exists for this date' } });

        await SyncManager.syncDailyFinanceEntries();

        expect(mockDailyFinanceUpdate).toHaveBeenCalledWith(1, expect.objectContaining({ retryCount: 1, error: expect.stringContaining('already exists') }));
        expect(mockDailyFinanceUpdate).not.toHaveBeenCalledWith(1, { synced: true });
        expect(mockLogEvent).toHaveBeenCalledWith(expect.objectContaining({ entityId: 'rec-1', status: 'FAILED' }));
    });
});

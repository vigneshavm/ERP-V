import { describe, it, expect, vi, beforeEach } from 'vitest';

const get = vi.fn();
const post = vi.fn();
vi.mock('./api', () => ({ default: { get: (...a: unknown[]) => get(...a), post: (...a: unknown[]) => post(...a) } }));

// In-memory stand-in for the Dexie syncLedger table (filter applies the real predicate).
let rows: any[] = [];
const pruneDelete = vi.fn();
vi.mock('./db', () => ({
    db: {
        syncLedger: {
            add: async (row: any) => { if (addFails) throw new Error('QuotaExceeded'); rows.push(row); },
            filter: (pred: (r: any) => boolean) => ({ limit: () => ({ toArray: async () => rows.filter(pred) }) }),
            where: (field: string) => field === 'id'
                ? { anyOf: (ids: string[]) => ({ modify: async (patch: any) => { rows.filter(r => ids.includes(r.id)).forEach(r => Object.assign(r, patch)); } }) }
                : { below: () => ({ delete: pruneDelete }) },
            orderBy: () => ({ reverse: () => ({ limit: () => ({ toArray: async () => [...rows].reverse() }) }) }),
        },
    },
}));
let addFails = false;

const { SyncIntelligenceService } = await import('./SyncIntelligenceService');

const event = (entityId: string) => ({ deviceId: 'DEV-1', branchId: 'b1', eventType: 'SALE', entityId, entityType: 'Invoice', status: 'FAILED' as const, payload: {} });

beforeEach(() => { vi.clearAllMocks(); rows = []; addFails = false; });

describe('SyncIntelligenceService devices', () => {
    it('reads registered devices from /api/sync/devices and maps Mongo fields', async () => {
        get.mockResolvedValue({ data: { success: true, data: [{ _id: 'd1', name: 'Counter 1', platform: 'Windows', status: 'ACTIVE', isOnline: true, syncHealth: 90, errorRate: 2, pendingOps: 1, lastSyncAt: '2026-09-25T10:00:00.000Z' }] } });
        const devices = await SyncIntelligenceService.getDevices();
        expect(get).toHaveBeenCalledWith('/api/sync/devices');
        expect(devices).toEqual([expect.objectContaining({ id: 'd1', name: 'Counter 1', syncHealth: 90, lastSyncAt: '2026-09-25T10:00:00.000Z' })]);
    });

    it('throws when the device list cannot be loaded', async () => {
        get.mockRejectedValue(new Error('Network Error'));
        await expect(SyncIntelligenceService.getDevices()).rejects.toThrow('Network Error');
    });

    it('keeps one stable device id per browser', () => {
        const id = SyncIntelligenceService.getDeviceId();
        expect(id).toMatch(/^DEV-[0-9A-F]{8}$/);
        expect(SyncIntelligenceService.getDeviceId()).toBe(id);
    });
});

describe('SyncIntelligenceService ledger', () => {
    it('records the event locally, uploads it, and marks it uploaded once accepted', async () => {
        post.mockImplementation(async (_url: string, body: any) => ({ data: { success: true, data: { accepted: body.events.map((e: any) => e.id) } } }));
        await SyncIntelligenceService.logEvent(event('A01-7'));

        expect(post).toHaveBeenCalledWith('/api/sync/ledger', { events: [expect.objectContaining({ entityId: 'A01-7', status: 'FAILED', id: expect.stringMatching(/^LE-/) })] });
        expect(post.mock.calls[0][1].events[0].uploaded).toBeUndefined();
        expect(rows[0].uploaded).toBe(true);
        expect(pruneDelete).toHaveBeenCalled();
    });

    it('keeps the event pending when the upload fails, and sends it on the next attempt', async () => {
        post.mockRejectedValueOnce(new Error('offline'));
        await SyncIntelligenceService.logEvent(event('A01-8'));
        expect(rows[0].uploaded).toBe(false);

        post.mockImplementation(async (_url: string, body: any) => ({ data: { success: true, data: { accepted: body.events.map((e: any) => e.id) } } }));
        await SyncIntelligenceService.uploadPending();
        expect(rows[0].uploaded).toBe(true);
    });

    it('never throws when the local write fails', async () => {
        addFails = true;
        await expect(SyncIntelligenceService.logEvent(event('x'))).resolves.toBeUndefined();
        expect(post).not.toHaveBeenCalled();
    });

    it('reads every device\'s events from the server', async () => {
        get.mockResolvedValue({ data: { success: true, data: [{ id: 'LE-2', deviceId: 'DEV-2' }] } });
        const result = await SyncIntelligenceService.getLedger(10);
        expect(get).toHaveBeenCalledWith('/api/sync/ledger', { params: { limit: 10 } });
        expect(result).toEqual({ entries: [{ id: 'LE-2', deviceId: 'DEV-2' }], source: 'server' });
    });

    it('falls back to this device\'s log, labelled as such, when the server is unreachable', async () => {
        rows = [{ id: 'LE-local', uploaded: true }];
        get.mockRejectedValue(new Error('Network Error'));
        expect(await SyncIntelligenceService.getLedger()).toEqual({ entries: [{ id: 'LE-local', uploaded: true }], source: 'device' });
    });
});

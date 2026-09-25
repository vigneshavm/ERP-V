import { describe, it, expect, vi, beforeEach } from 'vitest';

const get = vi.fn();
vi.mock('./api', () => ({ default: { get: (...a: unknown[]) => get(...a) } }));

const add = vi.fn();
const pruneDelete = vi.fn();
const below = vi.fn(() => ({ delete: pruneDelete }));
const toArray = vi.fn();
const limit = vi.fn(() => ({ toArray }));
vi.mock('./db', () => ({
    db: {
        syncLedger: {
            add: (...a: unknown[]) => add(...a),
            where: () => ({ below }),
            orderBy: () => ({ reverse: () => ({ limit }) }),
        },
    },
}));

const { SyncIntelligenceService } = await import('./SyncIntelligenceService');

beforeEach(() => { vi.clearAllMocks(); });

describe('SyncIntelligenceService', () => {
    it('reads registered devices from /api/sync/devices and maps Mongo fields', async () => {
        get.mockResolvedValue({ data: { success: true, data: [{ _id: 'd1', name: 'Counter 1', platform: 'Windows', status: 'ACTIVE', isOnline: true, syncHealth: 90, errorRate: 2, pendingOps: 1, lastSyncAt: '2026-09-25T10:00:00.000Z' }] } });

        const devices = await SyncIntelligenceService.getDevices();

        expect(get).toHaveBeenCalledWith('/api/sync/devices');
        expect(devices).toEqual([expect.objectContaining({ id: 'd1', name: 'Counter 1', syncHealth: 90, lastSyncAt: '2026-09-25T10:00:00.000Z' })]);
    });

    it('returns no devices when none are registered, and never invents any', async () => {
        get.mockResolvedValue({ data: { success: true, data: [] } });
        expect(await SyncIntelligenceService.getDevices()).toEqual([]);
    });

    it('throws when the device list cannot be loaded', async () => {
        get.mockRejectedValue(new Error('Network Error'));
        await expect(SyncIntelligenceService.getDevices()).rejects.toThrow('Network Error');
    });

    it('stores logged events in the local ledger and prunes old ones', async () => {
        await SyncIntelligenceService.logEvent({ deviceId: 'LOCAL_POS', branchId: 'b1', eventType: 'SALE', entityId: 'A01-7', entityType: 'Invoice', status: 'FAILED', payload: {} });

        expect(add).toHaveBeenCalledWith(expect.objectContaining({ entityId: 'A01-7', status: 'FAILED', id: expect.stringMatching(/^LE-/) }));
        expect(below).toHaveBeenCalled();
        expect(pruneDelete).toHaveBeenCalled();
    });

    it('does not throw when the local ledger write fails', async () => {
        add.mockRejectedValue(new Error('QuotaExceeded'));
        await expect(SyncIntelligenceService.logEvent({ deviceId: 'LOCAL_POS', branchId: 'b1', eventType: 'SALE', entityId: 'x', entityType: 'Invoice', status: 'SYNCED', payload: {} })).resolves.toBeUndefined();
    });

    it('reads the ledger newest first, limited', async () => {
        toArray.mockResolvedValue([{ id: 'LE-1' }]);
        expect(await SyncIntelligenceService.getLedger(10)).toEqual([{ id: 'LE-1' }]);
        expect(limit).toHaveBeenCalledWith(10);
    });
});

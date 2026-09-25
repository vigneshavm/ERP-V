import { jest } from '@jest/globals';

// Sync events used to live only in each browser, so a manager saw just their own device's log.
// Devices now upload them to POST /api/sync/ledger and the screen reads GET /api/sync/ledger for
// the whole tenant. Exercises the real compiled SyncController against a faked model.

const mockBulkWrite = jest.fn();
const mockFind = jest.fn();
jest.unstable_mockModule('../dist/modules/core/models/SyncLedgerEvent.js', () => ({
    default: { bulkWrite: mockBulkWrite, find: mockFind },
}));

const { uploadLedgerEvents, getLedgerEvents, toLedgerDocs } = await import('../dist/modules/core/controllers/SyncController.js');

const resMock = () => {
    const res = {};
    res.status = jest.fn(() => res);
    res.json = jest.fn(() => res);
    return res;
};
const user = { _id: 'user1', tenantId: 'tenantA' };
const event = (id, extra = {}) => ({ id, deviceId: 'dev-1', branchId: 'b1', eventType: 'SALE', entityId: 'A01-7', entityType: 'Invoice', status: 'FAILED', timestamp: '2026-09-25T10:00:00.000Z', payload: { error: 'x' }, hash: 'h', ...extra });

beforeEach(() => jest.clearAllMocks());

describe('sync ledger', () => {
    test('upload stores events once per (tenant, event id), with tenant and user from the session', async () => {
        mockBulkWrite.mockResolvedValue({});
        const res = resMock();
        await uploadLedgerEvents({ user, body: { events: [event('LE-1', { tenantId: 'tenantB' }), event('LE-2')] } }, res, jest.fn());

        const ops = mockBulkWrite.mock.calls[0][0];
        expect(ops).toHaveLength(2);
        expect(ops[0].updateOne.filter).toEqual({ tenantId: 'tenantA', eventId: 'LE-1' });
        expect(ops[0].updateOne.update.$setOnInsert).toEqual(expect.objectContaining({ tenantId: 'tenantA', reportedBy: 'user1', status: 'FAILED' }));
        expect(ops[0].updateOne.upsert).toBe(true);
        expect(res.json).toHaveBeenCalledWith({ success: true, data: { accepted: ['LE-1', 'LE-2'] } });
    });

    test('malformed events are dropped, not stored', () => {
        const docs = toLedgerDocs([event('ok'), event('bad-status', { status: 'DONE' }), event('bad-time', { timestamp: 'nope' }), { id: 5 }, null], 'tenantA', 'user1');
        expect(docs.map(d => d.eventId)).toEqual(['ok']);
        expect(toLedgerDocs('not-an-array', 'tenantA', 'user1')).toEqual([]);
    });

    test('lists the tenant\'s events from all devices, newest first, with a capped limit', async () => {
        const limit = jest.fn(() => ({ lean: async () => [{ eventId: 'LE-2', deviceId: 'dev-2', branchId: 'b1', eventType: 'SALE', entityId: 'A01-8', entityType: 'Invoice', status: 'SYNCED', payload: {}, hash: 'h', timestamp: new Date('2026-09-25T11:00:00Z') }] }));
        const sort = jest.fn(() => ({ limit }));
        mockFind.mockReturnValue({ sort });
        const res = resMock();
        await getLedgerEvents({ user, query: { limit: '9999' } }, res, jest.fn());

        expect(mockFind).toHaveBeenCalledWith({ tenantId: 'tenantA' });
        expect(sort).toHaveBeenCalledWith({ timestamp: -1 });
        expect(limit).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({ success: true, data: [expect.objectContaining({ id: 'LE-2', deviceId: 'dev-2', timestamp: '2026-09-25T11:00:00.000Z' })] });
    });

    test('requires a tenant account', async () => {
        const res = resMock();
        await getLedgerEvents({ user: { _id: 'u' }, query: {} }, res, jest.fn());
        expect(res.status).toHaveBeenCalledWith(400);
        expect(mockFind).not.toHaveBeenCalled();
    });
});

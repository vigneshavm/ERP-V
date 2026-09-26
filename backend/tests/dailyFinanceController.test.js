import { jest } from '@jest/globals';

// Daily Finance used to have no backend: the screen's entries lived only in the browser and the
// offline queue replayed to routes that didn't exist. This exercises the real, compiled
// DailyFinanceController against faked Mongoose calls: records are scoped to the user's tenant
// (never the body's), creates are idempotent on the client id, and deletes can be replayed.

const mockFind = jest.fn();
const mockFindOneAndUpdate = jest.fn();
const mockDeleteOne = jest.fn();

jest.unstable_mockModule('../dist/modules/finance/models/DailyFinance.js', () => ({
    default: { find: mockFind, findOneAndUpdate: mockFindOneAndUpdate, deleteOne: mockDeleteOne },
}));

const {
    listDailyFinance, createDailyFinance, updateDailyFinance, deleteDailyFinance, toDailyFinanceFields,
} = await import('../dist/modules/finance/controllers/DailyFinanceController.js');

const resMock = () => {
    const res = {};
    res.status = jest.fn(() => res);
    res.json = jest.fn(() => res);
    return res;
};
const user = { _id: 'u1', tenantId: 'tenantA' };
const stored = { clientId: 'rec-1', date: new Date('2026-09-25T00:00:00Z'), cashSales: 1000, onlineSales: 500, totalSales: 1500, expenses: 200, cashInDrawer: 800, notes: '', tenantId: 'tenantA' };

beforeEach(() => jest.clearAllMocks());

describe('DailyFinanceController', () => {
    test('lists only the user\'s tenant records, addressed by client id', async () => {
        mockFind.mockReturnValue({ sort: () => ({ lean: async () => [stored] }) });
        const res = resMock();
        await listDailyFinance({ user }, res);

        expect(mockFind).toHaveBeenCalledWith({ tenantId: 'tenantA' });
        expect(res.json).toHaveBeenCalledWith({ success: true, data: [expect.objectContaining({ id: 'rec-1', date: '2026-09-25', totalSales: 1500 })] });
    });

    test('create upserts on (tenant, client id) and ignores a tenantId in the body', async () => {
        mockFindOneAndUpdate.mockResolvedValue(stored);
        const res = resMock();
        await createDailyFinance({ user, body: { id: 'rec-1', date: '2026-09-25', cashSales: '1000', onlineSales: 500, tenantId: 'tenantB', totalSales: 99 } }, res);

        const [filter, update, opts] = mockFindOneAndUpdate.mock.calls[0];
        expect(filter).toEqual({ tenantId: 'tenantA', clientId: 'rec-1' });
        expect(update.$set).toEqual(expect.objectContaining({ cashSales: 1000, onlineSales: 500, totalSales: 1500 }));
        expect(update.$set.tenantId).toBeUndefined();
        expect(opts.upsert).toBe(true);
        expect(res.status).toHaveBeenCalledWith(201);
    });

    test('a second record for the same date is rejected with 409', async () => {
        mockFindOneAndUpdate.mockRejectedValue(Object.assign(new Error('E11000 duplicate key'), { code: 11000 }));
        const res = resMock();
        await createDailyFinance({ user, body: { id: 'rec-2', date: '2026-09-25' } }, res);
        expect(res.status).toHaveBeenCalledWith(409);
    });

    test('update of a record outside the tenant (or missing) is 404', async () => {
        mockFindOneAndUpdate.mockResolvedValue(null);
        const res = resMock();
        await updateDailyFinance({ user, params: { id: 'rec-9' }, body: { cashSales: 10 } }, res);
        expect(mockFindOneAndUpdate.mock.calls[0][0]).toEqual({ tenantId: 'tenantA', clientId: 'rec-9' });
        expect(res.status).toHaveBeenCalledWith(404);
    });

    test('delete is scoped to the tenant and succeeds even if already gone', async () => {
        mockDeleteOne.mockResolvedValue({ deletedCount: 0 });
        const res = resMock();
        await deleteDailyFinance({ user, params: { id: 'rec-1' } }, res);
        expect(mockDeleteOne).toHaveBeenCalledWith({ tenantId: 'tenantA', clientId: 'rec-1' });
        expect(res.status).toHaveBeenCalledWith(200);
    });

    test('requires a tenant account', async () => {
        const res = resMock();
        await listDailyFinance({ user: { _id: 'u1' } }, res);
        expect(res.status).toHaveBeenCalledWith(400);
        expect(mockFind).not.toHaveBeenCalled();
    });

    test('toDailyFinanceFields derives totalSales and drops unknown fields', () => {
        expect(toDailyFinanceFields({ cashSales: '10', onlineSales: 'x', synced: true, _id: 'evil' }))
            .toEqual({ cashSales: 10, onlineSales: 0, totalSales: 10 });
    });
});

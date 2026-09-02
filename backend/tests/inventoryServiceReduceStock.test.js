import 'reflect-metadata';
import { jest } from '@jest/globals';

// Exercises the REAL InventoryService.reduceStock() (imported straight from dist, not
// reimplemented) with the Mongoose I/O boundary (Item, StockLog) swapped for fakes, since a live
// MongoDB isn't reachable from this sandbox. This proves: FIFO batch consumption math, the
// session parameter threading needed for PosController.createInvoice's transaction to stay
// atomic, and the insufficient-stock guard — all against the actual production code path the
// B2C checkout fix wired in.

const mockItemFindOne = jest.fn();
const mockItemFindByIdAndUpdate = jest.fn();
const mockStockLogCreate = jest.fn();

jest.unstable_mockModule('../dist/modules/inventory/models/Item.js', () => ({
    default: {
        findOne: mockItemFindOne,
        findByIdAndUpdate: mockItemFindByIdAndUpdate,
    },
}));

jest.unstable_mockModule('../dist/modules/inventory/models/StockLog.js', () => ({
    default: {
        create: mockStockLogCreate,
    },
}));

const { InventoryRepository } = await import('../dist/repositories/InventoryRepository.js');
const { InventoryService } = await import('../dist/modules/inventory/services/InventoryService.js');

const tenantId = 'TENANT_1';
const itemId = '507f1f77bcf86cd799439011';
const user = { _id: 'USER_1', name: 'Cashier One' };

// A fake mongoose "session" - createInvoice passes this straight through so we can assert on it.
const fakeSession = { id: 'FAKE_SESSION_TOKEN' };

function makeFakeItemQuery(item) {
    return { session: jest.fn(() => Promise.resolve(item)) };
}

function makeFakeUpdateQuery() {
    return { session: jest.fn(() => Promise.resolve({})) };
}

beforeEach(() => {
    mockItemFindOne.mockReset();
    mockItemFindByIdAndUpdate.mockReset();
    mockStockLogCreate.mockReset();
    mockItemFindByIdAndUpdate.mockReturnValue(makeFakeUpdateQuery());
    mockStockLogCreate.mockResolvedValue([{}]);
});

describe('InventoryService.reduceStock — real B2C stock-reduction path', () => {
    test('consumes batches oldest-first (FIFO) and decrements stockQty by the requested quantity', async () => {
        const item = {
            _id: itemId,
            name: 'Basmati Rice 5kg',
            stockQty: 15,
            batches: [
                { batchNumber: 'B-OLD', quantity: 5, receivedDate: new Date('2026-01-01') },
                { batchNumber: 'B-NEW', quantity: 10, receivedDate: new Date('2026-02-01') },
            ],
        };
        mockItemFindOne.mockReturnValue(makeFakeItemQuery(item));

        const repo = new InventoryRepository();
        const service = new InventoryService(repo);

        await service.reduceStock(itemId, 8, tenantId, user, 'SALES', fakeSession);

        // Repository read was scoped to this item/tenant AND the session was threaded through -
        // this is exactly the atomicity fix: without it, reduceStock would read outside the
        // transaction PosController.createInvoice opened.
        expect(mockItemFindOne).toHaveBeenCalledWith({ _id: itemId, tenantId });

        // The stock write happened, decremented by the full requested quantity, on the same session.
        expect(mockItemFindByIdAndUpdate).toHaveBeenCalledTimes(1);
        const [updateId, updatePayload] = mockItemFindByIdAndUpdate.mock.calls[0];
        expect(updateId).toBe(itemId);
        expect(updatePayload.$inc).toEqual({ stockQty: -8 });

        // FIFO: the 5-unit oldest batch is fully consumed and dropped; the 10-unit batch gives up
        // the remaining 3 units it still has left over (5 + 3 = 8).
        expect(updatePayload.$set.batches).toEqual([
            expect.objectContaining({ batchNumber: 'B-NEW', quantity: 7 }),
        ]);

        const updateSessionCall = mockItemFindByIdAndUpdate.mock.results[0].value.session;
        expect(updateSessionCall).toHaveBeenCalledWith(fakeSession);

        // StockLog audit trail: negative delta, type matches the schema's enum (see
        // stockLogEnum.test.js), written on the same session so it can't outlive a rolled-back sale.
        expect(mockStockLogCreate).toHaveBeenCalledTimes(1);
        const [logDocs, logOpts] = mockStockLogCreate.mock.calls[0];
        expect(logDocs).toHaveLength(1);
        expect(logDocs[0]).toMatchObject({ itemId, tenantId, type: 'SALES', delta: -8 });
        expect(logOpts).toEqual({ session: fakeSession });
    });

    test('rejects the sale and writes nothing when requested quantity exceeds stock on hand', async () => {
        const item = { _id: itemId, name: 'Basmati Rice 5kg', stockQty: 3, batches: [] };
        mockItemFindOne.mockReturnValue(makeFakeItemQuery(item));

        const repo = new InventoryRepository();
        const service = new InventoryService(repo);

        await expect(
            service.reduceStock(itemId, 5, tenantId, user, 'SALES', fakeSession)
        ).rejects.toMatchObject({ statusCode: 400, message: expect.stringContaining('Insufficient stock') });

        // Nothing should have been written — a rejected sale must not touch stock or the audit log.
        expect(mockItemFindByIdAndUpdate).not.toHaveBeenCalled();
        expect(mockStockLogCreate).not.toHaveBeenCalled();
    });

    test('rejects when the item does not exist for this tenant', async () => {
        mockItemFindOne.mockReturnValue(makeFakeItemQuery(null));

        const repo = new InventoryRepository();
        const service = new InventoryService(repo);

        await expect(
            service.reduceStock(itemId, 1, tenantId, user, 'SALES', fakeSession)
        ).rejects.toMatchObject({ statusCode: 404 });

        expect(mockItemFindByIdAndUpdate).not.toHaveBeenCalled();
        expect(mockStockLogCreate).not.toHaveBeenCalled();
    });

    test('a purchase-return reduction is logged as RETURN, not SALES', async () => {
        const item = { _id: itemId, name: 'Basmati Rice 5kg', stockQty: 10, batches: [] };
        mockItemFindOne.mockReturnValue(makeFakeItemQuery(item));

        const repo = new InventoryRepository();
        const service = new InventoryService(repo);

        await service.reduceStock(itemId, 2, tenantId, user, 'PURCHASE_RETURN', fakeSession);

        const [logDocs] = mockStockLogCreate.mock.calls[0];
        expect(logDocs[0]).toMatchObject({ type: 'RETURN', delta: -2 });
    });
});

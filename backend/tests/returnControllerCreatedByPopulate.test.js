import { jest } from '@jest/globals';

// Validates the POS Returns Intelligence field-mapping fix: getAllReturns previously only
// populated 'invoice' and 'customer', so the frontend's "Audit Officer" column had no populated
// staff name to read and fell back to the customer's name instead (see
// POSReturnsIntelligence(MockUI).tsx's cashier mapping fix). This exercises the REAL, compiled
// ReturnController.getAllReturns against a faked Mongoose Return.find chain and asserts
// .populate('createdBy', 'name') is now included alongside the pre-existing populates.

const mockReturnFind = jest.fn();

jest.unstable_mockModule('../dist/modules/sales/models/Return.js', () => ({
    default: { find: mockReturnFind },
}));
jest.unstable_mockModule('../dist/modules/sales/models/Invoice.js', () => ({
    default: {},
}));
jest.unstable_mockModule('../dist/modules/inventory/models/Item.js', () => ({
    default: {},
}));
jest.unstable_mockModule('../dist/modules/crm/models/Customer.js', () => ({
    default: {},
}));
jest.unstable_mockModule('../dist/modules/sales/models/Transaction.js', () => ({
    default: {},
}));
jest.unstable_mockModule('../dist/modules/finance/models/CashbankTransaction.js', () => ({
    default: {},
}));

const { getAllReturns } = await import('../dist/modules/sales/controllers/ReturnController.js');

const USER_ID = 'USER_1';

function makeRes() {
    return {
        statusCode: null,
        body: null,
        status(code) { this.statusCode = code; return this; },
        json(payload) { this.body = payload; return this; },
    };
}

// Chainable mock mirroring Mongoose's Query builder: each .populate() call returns the same
// node so calls can stack, and the final .sort() resolves the query.
function chainableReturnsQuery(resolvedValue) {
    const calls = { populate: [] };
    const node = {
        populate: jest.fn((...args) => { calls.populate.push(args); return node; }),
        sort: jest.fn(() => Promise.resolve(resolvedValue)),
        __calls: calls,
    };
    return node;
}

beforeEach(() => {
    mockReturnFind.mockReset();
});

describe('ReturnController.getAllReturns', () => {
    test('populates createdBy (name) alongside invoice and customer, so the Audit Officer column has a real staff name to read', async () => {
        const query = chainableReturnsQuery([
            { _id: 'r1', totalReturnAmount: 100, createdBy: { name: 'Priya Staff' } },
        ]);
        mockReturnFind.mockReturnValue(query);

        const req = { user: { _id: USER_ID } };
        const res = makeRes();

        await getAllReturns(req, res);

        expect(mockReturnFind).toHaveBeenCalledWith({ createdBy: USER_ID });

        const populateArgs = query.__calls.populate.map(args => args[0]);
        expect(populateArgs).toContain('invoice');
        expect(populateArgs).toContain('customer');
        expect(populateArgs).toContain('createdBy');

        const createdByCall = query.__calls.populate.find(args => args[0] === 'createdBy');
        expect(createdByCall).toEqual(['createdBy', 'name']);

        expect(res.statusCode).toBe(200);
        expect(res.body[0].createdBy.name).toBe('Priya Staff');
    });
});

import { jest } from '@jest/globals';

// Validates the Production Mode Dashboard Integration fix: ReportController's four endpoints
// (dashboard-stats/stock/customers/sales) were scoping every query by req.user._id (owner/
// createdBy/addedBy) instead of req.user.tenantId - meaning a shop with more than one staff
// member logged in would only ever see that one user's data. This exercises the REAL, compiled
// ReportController against faked Mongoose model calls, and asserts each query now carries the
// tenantId (not the userId) - except the one query that genuinely can't (Expense has no tenantId
// field on its schema), which is asserted to intentionally still use createdBy.

const mockInvoiceFind = jest.fn();
const mockInvoiceAggregate = jest.fn();
const mockItemFind = jest.fn();
const mockCustomerFind = jest.fn();
const mockExpenseAggregate = jest.fn();

jest.unstable_mockModule('../dist/modules/sales/models/Invoice.js', () => ({
    default: {
        find: mockInvoiceFind,
        aggregate: mockInvoiceAggregate,
    },
}));

jest.unstable_mockModule('../dist/modules/inventory/models/Item.js', () => ({
    default: {
        find: mockItemFind,
    },
}));

jest.unstable_mockModule('../dist/modules/crm/models/Customer.js', () => ({
    default: {
        find: mockCustomerFind,
    },
}));

jest.unstable_mockModule('../dist/modules/expense/models/Expense.js', () => ({
    default: {
        aggregate: mockExpenseAggregate,
    },
}));

const {
    getDashboardStats,
    getStockReport,
    getCustomerReport,
} = await import('../dist/modules/core/controllers/ReportController.js');

const TENANT_ID = 'TENANT_1';
const USER_ID = 'USER_1';

function makeRes() {
    return {
        statusCode: null,
        body: null,
        status(code) { this.statusCode = code; return this; },
        json(payload) { this.body = payload; return this; },
    };
}

function chainable(resolvedValue) {
    const node = {
        sort: jest.fn(() => node),
        limit: jest.fn(() => node),
        select: jest.fn(() => Promise.resolve(resolvedValue)),
        then: (resolve, reject) => Promise.resolve(resolvedValue).then(resolve, reject),
        catch: (reject) => Promise.resolve(resolvedValue).catch(reject),
    };
    return node;
}

beforeEach(() => {
    mockInvoiceFind.mockReset();
    mockInvoiceAggregate.mockReset();
    mockItemFind.mockReset();
    mockCustomerFind.mockReset();
    mockExpenseAggregate.mockReset();
});

describe('ReportController.getStockReport', () => {
    test('scopes Item.find by tenantId, not the logged-in user', async () => {
        mockItemFind.mockReturnValue(chainable([{ stockQty: 2, lowStockLimit: 5 }]));
        const req = { user: { _id: USER_ID, tenantId: TENANT_ID } };
        const res = makeRes();

        await getStockReport(req, res);

        expect(mockItemFind).toHaveBeenCalledWith({ tenantId: TENANT_ID });
        expect(mockItemFind).not.toHaveBeenCalledWith(expect.objectContaining({ addedBy: expect.anything() }));
        expect(res.statusCode).toBe(200);
        expect(res.body.totalItems).toBe(1);
        expect(res.body.lowStock).toHaveLength(1);
    });
});

describe('ReportController.getCustomerReport', () => {
    test('scopes Customer.find by tenantId, not owner', async () => {
        mockCustomerFind.mockReturnValue(chainable([{ name: 'Acme', dues: 500 }]));
        const req = { user: { _id: USER_ID, tenantId: TENANT_ID } };
        const res = makeRes();

        await getCustomerReport(req, res);

        expect(mockCustomerFind).toHaveBeenCalledWith({ tenantId: TENANT_ID, dues: { $gt: 0 } });
        expect(mockCustomerFind).not.toHaveBeenCalledWith(expect.objectContaining({ owner: expect.anything() }));
        expect(res.statusCode).toBe(200);
    });
});

describe('ReportController.getDashboardStats', () => {
    test('scopes Invoice reads by tenantId + excludes soft-deleted invoices, but Expense stays scoped by createdBy (no tenantId field on that schema)', async () => {
        mockInvoiceFind.mockResolvedValueOnce([
            { totalAmount: 1000, paidAmount: 1000, creditApplied: 0 },
            { totalAmount: 500, paidAmount: 200, creditApplied: 0 },
        ]);
        mockInvoiceAggregate
            .mockResolvedValueOnce([{ _id: '2026-08-20', totalSales: 1500 }]) // dailySales
            .mockResolvedValueOnce([{ _id: '2026-08', revenue: 1500 }]) // monthlyRevenue
            .mockResolvedValueOnce([{ _id: 'cash', count: 2, amount: 1500 }]); // paymentMethods
        mockExpenseAggregate.mockResolvedValueOnce([{ _id: '2026-08', expenses: 300 }]);
        mockCustomerFind.mockReturnValue(chainable([{ name: 'Acme', dues: 500 }]));

        const req = { user: { _id: USER_ID, tenantId: TENANT_ID } };
        const res = makeRes();

        await getDashboardStats(req, res);

        // allInvoices (summary metrics)
        expect(mockInvoiceFind).toHaveBeenCalledWith({ tenantId: TENANT_ID, isDeleted: { $ne: true } });

        // dailySales + monthlyRevenue + paymentMethods aggregates - every $match carries
        // tenantId and excludes soft-deleted invoices, never the per-user id.
        for (const call of mockInvoiceAggregate.mock.calls) {
            const matchStage = call[0][0].$match;
            expect(matchStage.tenantId).toBe(TENANT_ID);
            expect(matchStage.isDeleted).toEqual({ $ne: true });
            expect(matchStage.createdBy).toBeUndefined();
        }

        // Expense has no tenantId field on its schema - this one is INTENTIONALLY still
        // per-user, not a leftover bug. Locking that decision in so a future well-meaning
        // "fix" doesn't silently break it by passing a tenantId Expense.find will just ignore.
        const expenseMatch = mockExpenseAggregate.mock.calls[0][0][0].$match;
        expect(expenseMatch).toEqual({ createdBy: USER_ID, date: { $gte: expect.any(Date) } });

        // topCustomersWithDues
        expect(mockCustomerFind).toHaveBeenCalledWith({ tenantId: TENANT_ID, dues: { $gt: 0 } });

        // Response actually reflects the (tenant-scoped) invoices
        expect(res.statusCode).toBe(200);
        expect(res.body.totalInvoices).toBe(2);
        expect(res.body.totalRevenue).toBe(1500);
        expect(res.body.totalCollected).toBe(1200);
        expect(res.body.totalOutstanding).toBe(300);
        expect(res.body.revenueVsExpenses).toEqual([{ month: '2026-08', revenue: 1500, expenses: 300 }]);
    });

    test('a tenant with zero invoices/customers still returns a well-formed 200 (fresh-tenant safe fallback)', async () => {
        mockInvoiceFind.mockResolvedValueOnce([]);
        mockInvoiceAggregate.mockResolvedValueOnce([]).mockResolvedValueOnce([]).mockResolvedValueOnce([]);
        mockExpenseAggregate.mockResolvedValueOnce([]);
        mockCustomerFind.mockReturnValue(chainable([]));

        const req = { user: { _id: USER_ID, tenantId: TENANT_ID } };
        const res = makeRes();

        await getDashboardStats(req, res);

        expect(res.statusCode).toBe(200);
        expect(res.body).toMatchObject({
            totalInvoices: 0,
            totalRevenue: 0,
            totalCollected: 0,
            totalOutstanding: 0,
            dailySales: [],
            revenueVsExpenses: [],
            paymentMethods: [],
            topCustomersWithDues: [],
        });
    });
});

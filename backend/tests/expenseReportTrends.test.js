import { jest } from '@jest/globals';

// The expense report used to invent three figures: monthly income was expenses x 1.5 ("mock income
// for visual consistency with screenshot"), budget utilization was always 75, and the branch
// breakdown was one made-up "Main Branch" row. Exercises the real compiled controller against
// faked models to check each is now real or explicitly absent (null / empty).

const mockExpenseFind = jest.fn();
const mockExpenseAggregate = jest.fn();
const mockCategoryFind = jest.fn();
const mockInvoiceAggregate = jest.fn();

jest.unstable_mockModule('../dist/modules/expense/models/Expense.js', () => ({
    default: { find: mockExpenseFind, aggregate: mockExpenseAggregate },
}));
jest.unstable_mockModule('../dist/modules/expense/models/ExpenseCategory.js', () => ({
    default: { find: mockCategoryFind },
}));
jest.unstable_mockModule('../dist/modules/sales/models/Invoice.js', () => ({
    default: { aggregate: mockInvoiceAggregate },
}));

const { getExpenseReport } = await import('../dist/modules/expense/controllers/ExpenseReportController.js');

const resMock = () => {
    const res = {};
    res.status = jest.fn(() => res);
    res.json = jest.fn(() => res);
    return res;
};
const now = new Date();
const thisMonth = { y: now.getFullYear(), m: now.getMonth() + 1 };
const userId = '64b000000000000000000001';
const tenantId = '64b0000000000000000000aa';

beforeEach(() => {
    jest.clearAllMocks();
    mockExpenseFind.mockResolvedValue([{ amount: 3000, category: 'Rent', paymentMethod: 'bank', description: 'r' }]);
    mockExpenseAggregate.mockResolvedValue([{ _id: thisMonth, total: 3000 }]);
});

describe('expense report trends', () => {
    test('income is the tenant\'s invoiced sales and budget use comes from category budgets', async () => {
        mockCategoryFind.mockResolvedValue([{ name: 'Rent', monthly_budget: 4000 }, { name: 'Food', monthly_budget: 1000 }]);
        mockInvoiceAggregate.mockResolvedValue([{ _id: thisMonth, total: 12000 }]);
        const res = resMock();
        await getExpenseReport({ user: { _id: userId, tenantId }, query: {} }, res);

        const body = res.json.mock.calls[0][0];
        expect(body.monthly_trends).toHaveLength(6);
        expect(body.monthly_trends[0]).toEqual(expect.objectContaining({ expense: 3000, income: 12000, budget: 5000, budget_utilization: 60 }));
        expect(body.monthly_trends[1]).toEqual(expect.objectContaining({ expense: 0, income: 0, budget_utilization: 0 }));
        expect(String(mockInvoiceAggregate.mock.calls[0][0][0].$match.tenantId)).toBe(tenantId);
        expect(body.by_branch).toEqual([]);
    });

    test('with no budgets set and no tenant, utilization and income are null, not invented', async () => {
        mockCategoryFind.mockResolvedValue([]);
        const res = resMock();
        await getExpenseReport({ user: { _id: userId }, query: {} }, res);

        const trend = res.json.mock.calls[0][0].monthly_trends[0];
        expect(trend).toEqual(expect.objectContaining({ expense: 3000, income: null, budget: null, budget_utilization: null }));
        expect(mockInvoiceAggregate).not.toHaveBeenCalled();
    });
});

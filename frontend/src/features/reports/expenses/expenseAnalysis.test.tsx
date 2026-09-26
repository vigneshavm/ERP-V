import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen, waitFor } from '@testing-library/react';

const get = vi.fn();
vi.mock('@/services/api', () => ({ default: { get: (...args: unknown[]) => get(...args) } }));
vi.stubGlobal('ResizeObserver', class { observe() {} unobserve() {} disconnect() {} });

import ExpenseAnalysisReport, { type ExpenseAnalysisData } from './ExpenseAnalysisReport';

afterEach(() => { cleanup(); get.mockReset(); });

const labels = {
    NO_RECEIPT: 'No receipt on an expense of ₹2,000 or more', POSSIBLE_DUPLICATE: 'Same category and amount within 3 days',
    UNUSUALLY_LARGE: '3× or more the usual amount for its category', CASH_ABOVE_LIMIT: 'Paid in cash above ₹10,000 (not deductible under Income-tax s.40A(3))',
    CASH_NOT_ALLOWED: 'Paid in cash in a category set to no cash',
};
const data: ExpenseAnalysisData = {
    range: { from: '2026-09-01', to: '2026-09-30' },
    summary: {
        total: 16100, count: 2, days: 30, avgPerDay: 536.67, withReceipt: 1, cash: 12500, flagged: 1,
        byCategory: [{ category: 'Rent', count: 1, amount: 12500, sharePct: 77.6, budget: 12000, overBudget: true }, { category: 'Electricity', count: 1, amount: 3600, sharePct: 22.4, budget: null, overBudget: false }],
        byMethod: [{ method: 'cash', count: 1, amount: 12500 }, { method: 'upi', count: 1, amount: 3600 }],
        byRecorder: [{ name: 'Anbu', count: 2, amount: 16100 }],
        byDay: [{ date: '2026-09-05', amount: 12500 }, { date: '2026-09-12', amount: 3600 }],
        byMonth: [{ month: '2026-09', amount: 16100 }],
        flagCounts: [{ flag: 'CASH_ABOVE_LIMIT', label: labels.CASH_ABOVE_LIMIT, count: 1, amount: 12500 }],
    },
    rows: [
        { id: 'a', expenseNo: 'EXP-12', date: '2026-09-05', category: 'Rent', amount: 12500, paymentMethod: 'cash', hasReceipt: true, description: 'Shop rent', recordedBy: 'Anbu', flags: ['CASH_ABOVE_LIMIT'] },
        { id: 'b', expenseNo: 'EXP-13', date: '2026-09-12', category: 'Electricity', amount: 3600, paymentMethod: 'upi', hasReceipt: false, description: 'TNEB', recordedBy: 'Anbu', flags: [] },
    ],
    rules: { receiptFrom: 2000, duplicateDays: 3, largeMultiple: 3, largeFrom: 5000, cashLimit: 10000, historyDays: 180, labels },
    asOf: '2026-09-25', source: 'mongo',
};

describe('ExpenseAnalysisReport', () => {
    it('reads the shop-wide expense API for this month and shows real rows and checks', async () => {
        get.mockResolvedValue({ data });
        render(<ExpenseAnalysisReport />);
        await waitFor(() => expect(screen.getByText('EXP-12')).toBeTruthy());
        const [url, cfg] = get.mock.calls[0] as [string, { params: Record<string, string> }];
        expect(url).toBe('/api/reports/finance/expenses');
        expect(cfg.params.from).toMatch(/^\d{4}-\d{2}-01$/);
        expect(screen.getAllByText('₹16,100').length).toBeGreaterThan(0);
        expect(screen.getAllByText(/s\.40A\(3\)/).length).toBeGreaterThan(0);
        expect(screen.getByText(/Rent · 77.6% · budget ₹12,000 · over/)).toBeTruthy();
        expect(screen.queryByText(/Madhan|Sarah|Kishore/)).toBeNull();
    });
});

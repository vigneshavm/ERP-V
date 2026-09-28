import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';

const get = vi.fn();
vi.mock('@/services/api', () => ({ default: { get: (...args: unknown[]) => get(...args) } }));

import { howPaid, nz } from './financeFormat';
import type { CashFlowData, DayBookData, FinanceEntry, ProfitLossData, ProfitTotals } from './financeTypes';
import DayBookReport from './DayBookReport';
import ProfitLossReport from './ProfitLossReport';
import CashFlowReport from './CashFlowReport';

afterEach(() => { cleanup(); get.mockReset(); });

// Recharts' ResponsiveContainer needs ResizeObserver, which jsdom does not provide.
vi.stubGlobal('ResizeObserver', class { observe() {} unobserve() {} disconnect() {} });

const entry = (over: Partial<FinanceEntry>): FinanceEntry => ({
    source: 'shop', type: 'sale', typeLabel: 'Sale', date: '2026-09-22', time: '10:15', ref: 'A1 4243', party: 'Meena', amount: 1000,
    cashIn: 600, bankIn: 400, cashOut: 0, bankOut: 0, credit: 0, note: '', ...over,
});

describe('format helpers', () => {
    it('howPaid lists only the parts that apply', () => {
        expect(howPaid(entry({}))).toBe('Cash ₹600 · Bank ₹400');
        expect(howPaid(entry({ cashIn: 0, bankIn: 0, credit: 1000 }))).toBe('Credit ₹1,000');
        expect(howPaid(entry({ type: 'transfer', cashIn: 0, bankIn: 0 }))).toBe('Own accounts');
    });
    it('nz hides zero amounts', () => {
        expect(nz(0)).toBeNull();
        expect(nz(0.001)).toBeNull();
        expect(nz(5)).toBe(5);
    });
});

describe('DayBookReport', () => {
    it('asks the server for the latest day, then pages day by day from the date it chose', async () => {
        const data: DayBookData = {
            date: '2026-09-22',
            totals: { entries: 2, amount: 1300, cashIn: 600, bankIn: 400, cashOut: 300, bankOut: 0, credit: 0, net: 700 },
            byType: [{ type: 'sale', label: 'Sale', entries: 1, amount: 1000, cashIn: 600, bankIn: 400, cashOut: 0, bankOut: 0, credit: 0, net: 1000 }],
            entries: [entry({}), entry({ source: 'erp', type: 'expense', typeLabel: 'Expense', ref: 'EXP-9', party: 'Electricity', amount: 300, cashIn: 0, bankIn: 0, cashOut: 300, time: '18:00' })],
            checks: { overpaidShopBills: 0, returnsAvailable: true },
            asOf: '2026-09-22',
            source: 'sql',
        };
        get.mockResolvedValue({ data });
        render(<DayBookReport />);
        await waitFor(() => expect(screen.getByText('EXP-9')).toBeTruthy());
        expect((get.mock.calls[0][1] as { params: Record<string, string> }).params.date).toBeUndefined();
        expect(screen.getByText('₹700.00')).toBeTruthy(); // net movement

        fireEvent.click(screen.getByRole('button', { name: 'Previous day' }));
        await waitFor(() => expect(get).toHaveBeenLastCalledWith('/api/reports/finance/daybook', { params: { date: '2026-09-21' } }));
    });
});

const P = (netSales: number, costedSales: number, cost: number, bills = 10): ProfitTotals => ({
    bills, netSales, costedSales, cost, grossProfit: costedSales - cost, marginPct: costedSales ? Math.round(((costedSales - cost) / costedSales) * 1000) / 10 : null,
    coveragePct: netSales ? Math.round((costedSales / netSales) * 1000) / 10 : 0,
});

describe('ProfitLossReport', () => {
    it('shows the statement with uncosted sales kept out of gross profit', async () => {
        const data: ProfitLossData = {
            range: { from: '2026-09-01', to: '2026-09-30' },
            sales: P(100000, 90000, 60000), returns: P(-2000, -2000, -1400, 1), total: P(98000, 88000, 58600, 11),
            uncostedSales: 10000,
            expenses: { total: 12000, byCategory: [{ category: 'Electricity', amount: 7000 }, { category: 'Salaries', amount: 5000 }] },
            netProfit: 17400,
            bySource: { shop: P(95000, 85000, 57000), erp: P(3000, 3000, 1600, 1) },
            byMonth: [{ month: '2026-09', netSales: 98000, costedSales: 88000, cost: 58600, grossProfit: 29400, expenses: 12000, netProfit: 17400 }],
            asOf: '2026-09-22',
            source: 'sql',
        };
        get.mockResolvedValue({ data });
        render(<ProfitLossReport />);
        await waitFor(() => expect(screen.getByText('Profit & loss statement')).toBeTruthy());
        expect(screen.getByText('Of which: sales with no known cost')).toBeTruthy();
        expect(screen.getByText('₹10,000.00')).toBeTruthy();
        expect(screen.getByText('Electricity')).toBeTruthy();
        expect(screen.getByText('₹17,400.00')).toBeTruthy();
        expect(screen.queryByText('By month')).toBeNull(); // single month
    });
});

describe('CashFlowReport', () => {
    it('switches to monthly bars for long periods and lists inflows/outflows', async () => {
        const byDay = Array.from({ length: 90 }, (_, i) => {
            const d = new Date(2026, 5, 1 + i);
            const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
            return { date: iso, inflow: 1000, outflow: 400, net: 600, cashNet: 500, bankNet: 100 };
        });
        const data: CashFlowData = {
            range: { from: '2026-06-01', to: '2026-08-29' },
            totals: { entries: 900, amount: 126000, cashIn: 70000, bankIn: 20000, cashOut: 36000, bankOut: 0, credit: 5000, net: 54000 },
            inflows: [{ type: 'sale', label: 'Sale', cash: 70000, bank: 20000, total: 90000, entries: 800 }],
            outflows: [{ type: 'expense', label: 'Expense', cash: 36000, bank: 0, total: 36000, entries: 100 }],
            credit: { sales: 5000, purchases: 0 },
            transfers: 0,
            byDay,
            checks: { overpaidShopBills: 0, returnsAvailable: true },
            asOf: '2026-08-29',
            source: 'sql',
        };
        get.mockResolvedValue({ data });
        render(<CashFlowReport />);
        await waitFor(() => expect(screen.getByText('Money in and out by month')).toBeTruthy());
        expect(screen.getByText('Inflows')).toBeTruthy();
        expect(screen.getByText('₹54,000.00')).toBeTruthy();
        expect(screen.getByText(/no opening cash position is recorded/)).toBeTruthy();
    });
});

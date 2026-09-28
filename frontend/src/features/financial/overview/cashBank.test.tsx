import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

const get = vi.fn();
const post = vi.fn();
vi.mock('@/services/api', () => ({ default: { get: (...a: unknown[]) => get(...a), post: (...a: unknown[]) => post(...a) } }));
vi.stubGlobal('ResizeObserver', class { observe() {} unobserve() {} disconnect() {} });

import CashBankOverview from './CashBankOverview';
import BankReconciliationPage from './BankReconciliationPage';
import LoansPage from './LoansPage';
import { emiFor } from './cashBankFormat';
import type { CashBankOverviewData, LoansData, ReconciliationData } from './cashBankTypes';

afterEach(() => { cleanup(); get.mockReset(); post.mockReset(); });
const wrap = (ui: React.ReactElement) => render(<MemoryRouter>{ui}</MemoryRouter>);

const loan = { id: 'l1', name: 'SBI business loan', principal: 200000, interestRate: 11, termMonths: 24, emi: 9322, pending: 150000, startDate: '2026-01-10', status: 'active', paid: 74576, payments: 8, lastPayment: '2026-08-10', emisDue: 8, overdueEmis: 0, nextDue: '2026-10-10', paidPct: 33.2, health: 'on-track' as const };

const overview: CashBankOverviewData = {
    today: '2026-09-25',
    cash: { count: { date: '2026-09-24', counted: 18250, expected: 18400, variance: -150, counters: 1 }, since: '2026-09-25', movement: { cashIn: 6200, cashOut: 1800, fromBank: 0, toBank: 10000 }, estimated: 12650, daysSinceCount: 1 },
    banks: [{ id: 'b1', name: 'SBI Current', type: 'Current', branch: 'Mukkudal', balance: 342000, opening: 100000, status: 'active', unreconciled: 3, unreconciledAmount: 18500, unreconciledOld: 0 }],
    bankTotal: 342000,
    loans: [loan],
    loanTotals: { active: 1, pending: 150000, monthlyEmi: 9322, nextDue: '2026-10-10' },
    cheques: { rows: [{ id: 'c1', number: '004512', payee: 'Ramraj Cotton', bank: 'SBI', amount: 24000, date: '2026-09-28', type: 'ISSUED' }], toReceive: 0, toPay: 24000 },
    overdueBills: { count: 0, amount: 0, rows: [] },
    trend: { from: '2026-08-27', to: '2026-09-25', totals: { cashIn: 90000, bankIn: 40000, cashOut: 30000, bankOut: 45000, net: 55000 }, byDay: [{ date: '2026-09-24', inflow: 8000, outflow: 2000, net: 6000, cashNet: 5000, bankNet: 1000 }] },
    alerts: [{ level: 'warning', code: 'CASH_VARIANCE', text: 'The last count was ₹150 short against expected cash (2026-09-24).' }],
    rules: { staleCountDays: 2, varianceWarn: 100, varianceCritical: 1000, dueSoonDays: 7, unreconciledDays: 30 },
    asOf: '2026-09-24', source: 'sql',
};

describe('CashBankOverview', () => {
    it('shows the estimated cash, bank total and the alerts from the server', async () => {
        get.mockResolvedValue({ data: overview });
        wrap(<CashBankOverview />);
        await waitFor(() => expect(screen.getByText('Cash in hand (estimated)')).toBeTruthy());
        expect(get.mock.calls[0][0]).toBe('/api/reports/finance/cash-bank-overview');
        expect(screen.getAllByText('₹12,650').length).toBeGreaterThan(0);
        expect(screen.getAllByText('₹3,42,000').length).toBeGreaterThan(0);
        expect(screen.getByText(/₹150 short/)).toBeTruthy();
        expect(screen.getByRole('link', { name: 'SBI Current' }).getAttribute('href')).toBe('/cashbank/ledger/b1');
    });

    it('says the drawer has not been counted instead of inventing a cash figure', async () => {
        get.mockResolvedValue({ data: { ...overview, cash: { count: null, since: null, movement: { cashIn: 0, cashOut: 0, fromBank: 0, toBank: 0 }, estimated: null, daysSinceCount: null }, alerts: [] } });
        wrap(<CashBankOverview />);
        await waitFor(() => expect(screen.getByText('Not counted')).toBeTruthy());
        expect(screen.getByRole('link', { name: 'Do a close' })).toBeTruthy();
    });

    it('shows the error with a retry when the API fails', async () => {
        get.mockRejectedValue(Object.assign(new Error('500'), { response: { status: 500, data: { message: 'Unable to load Cash & Bank Overview' } } }));
        wrap(<CashBankOverview />);
        await waitFor(() => expect(screen.getByText(/Unable to load Cash & Bank Overview/)).toBeTruthy());
        expect(screen.queryByText('Bank balance')).toBeNull();
    });
});

describe('BankReconciliationPage', () => {
    const rec: ReconciliationData = {
        range: { from: '2026-09-01', to: '2026-09-30' },
        account: { id: 'b1', name: 'SBI Current', type: 'Current', erpBalance: 342000 },
        summary: { statementNet: 5000, erpNet: 4700, statementClosing: 350000, reconciledLines: 0, reconciledEntries: 0, suggested: 1, onlyInStatement: { count: 1, net: -300 }, onlyInErp: { count: 0, net: 0 } },
        matches: [{ statementId: 's1', entryId: 'e1', amount: 5300, direction: 'credit', dayGap: 1 }],
        lines: [
            { id: 's1', date: '2026-09-10', amount: 5300, type: 'credit', description: 'NEFT MEENA STORES', reference: 'UTR1', balance: 350300, reconciled: false },
            { id: 's2', date: '2026-09-12', amount: 300, type: 'debit', description: 'SMS CHARGES', reference: '', balance: 350000, reconciled: false },
        ],
        entries: [{ id: 'e1', date: '2026-09-09', amount: 5300, direction: 'credit', description: 'Deposit', reference: '', reconciled: false }],
        asOf: '2026-09-25',
    };

    it('lists suggestions and posts the ticked pairs', async () => {
        get.mockImplementation((url: string) => Promise.resolve({ data: url.includes('/loans') ? { today: '2026-09-25', loans: [], totals: {}, banks: [{ id: 'b1', name: 'SBI Current', type: 'Current' }] } : rec }));
        post.mockResolvedValue({ data: { matched: 1 } });
        wrap(<BankReconciliationPage />);
        await waitFor(() => expect(screen.getByText('NEFT MEENA STORES')).toBeTruthy());
        const recCall = get.mock.calls.find(c => String(c[0]).includes('bank-reconciliation'));
        expect((recCall![1] as { params: Record<string, string> }).params.accountId).toBe('b1');
        expect(screen.getByText('SMS CHARGES')).toBeTruthy(); // only in statement
        fireEvent.click(screen.getByRole('button', { name: 'Confirm 1 match' }));
        await waitFor(() => expect(post).toHaveBeenCalledWith('/api/reports/finance/bank-reconciliation/match', { pairs: [{ statementId: 's1', entryId: 'e1' }] }));
    });
});

describe('LoansPage', () => {
    const loans: LoansData = { today: '2026-09-25', loans: [loan], totals: { active: 1, pending: 150000, paid: 74576, monthlyEmi: 9322, overdue: 0 }, banks: [{ id: 'b1', name: 'SBI Current', type: 'Current' }] };

    it('computes a standard EMI', () => {
        expect(emiFor(200000, 11, 24)).toBe(9322);
        expect(emiFor(120000, 0, 12)).toBe(10000);
        expect(emiFor(0, 11, 24)).toBe(0);
    });

    it('records an EMI from a bank account', async () => {
        get.mockResolvedValue({ data: loans });
        post.mockResolvedValue({ data: {} });
        wrap(<LoansPage />);
        await waitFor(() => expect(screen.getByText('SBI business loan')).toBeTruthy());
        fireEvent.click(screen.getByRole('button', { name: 'Record EMI' }));
        fireEvent.click(screen.getByRole('button', { name: 'Record payment' }));
        await waitFor(() => expect(post).toHaveBeenCalled());
        const [url, body] = post.mock.calls[0] as [string, Record<string, unknown>];
        expect(url).toBe('/api/loans/l1/payments');
        expect(body).toMatchObject({ amountPaid: 9322, paymentMethod: 'BankTransfer', bankAccountId: 'b1' });
    });
});

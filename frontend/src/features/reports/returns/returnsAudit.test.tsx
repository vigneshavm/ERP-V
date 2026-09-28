import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';

const get = vi.fn();
vi.mock('@/services/api', () => ({ default: { get: (...args: unknown[]) => get(...args) } }));

import ReturnsAuditReport, { type ReturnsAuditData } from './ReturnsAuditReport';

afterEach(() => { cleanup(); get.mockReset(); });

const data: ReturnsAuditData = {
    range: { from: '2026-09-01', to: '2026-09-30' },
    summary: {
        returns: 2, value: 2250, cash: 1850, bank: 0, creditNote: 400,
        byLevel: { CRITICAL: 0, HIGH: 1, MEDIUM: 0, LOW: 1 },
        byFlag: [{ code: 'CASH_ABOVE_LIMIT', label: 'Cash refund above ₹1,000', level: 'HIGH', returns: 1, value: 1850 }],
        byReason: [{ reason: 'Wrong Item', lines: 2, value: 2250 }],
        byCashier: [{ cashier: 'Arun', returns: 2, value: 2250, cash: 1850 }],
        erpBills: 40, returnRatePct: 5,
    },
    rows: [
        { id: 'a', returnId: 'RET-7', date: '2026-09-20', time: '10:00', bill: 'INV-12', customer: 'Meena', cashier: 'Arun', amount: 1850, refundMode: 'cash', refundMethod: 'cash', reasons: 'Wrong Item', items: 1, status: 'processed', flags: ['CASH_ABOVE_LIMIT'], level: 'HIGH' },
        { id: 'b', returnId: 'RET-8', date: '2026-09-21', time: '11:00', bill: null, customer: 'Walk-in', cashier: 'Arun', amount: 400, refundMode: 'credit_note', refundMethod: 'credit', reasons: 'Wrong Item', items: 1, status: 'processed', flags: [], level: 'LOW' },
    ],
    rules: [
        { code: 'REFUND_EXCEEDS_BILL', label: 'Refunds exceed the bill', level: 'CRITICAL' },
        { code: 'CASH_ABOVE_LIMIT', label: 'Cash refund above ₹1,000', level: 'HIGH' },
    ],
    limits: { cashRefund: 1000, cashierDaily: 3, repeatCount: 2, repeatDays: 30 },
    shopReturnRows: 0, asOf: '2026-09-25', source: 'mongo',
};

describe('ReturnsAuditReport', () => {
    it('shows the server\'s returns and flags, with no sample data', async () => {
        get.mockResolvedValue({ data });
        render(<ReturnsAuditReport />);
        await waitFor(() => expect(screen.getByText('RET-7')).toBeTruthy());
        expect(get.mock.calls[0][0]).toBe('/api/reports/returns-audit');
        expect(screen.getByText('5% of 40 ERP bills')).toBeTruthy();
        expect(screen.getByText('Bill not linked')).toBeTruthy();
        expect(screen.getAllByText(/Cash refund above ₹1,000/).length).toBeGreaterThan(0);
        expect(screen.getByText(/Manager approval and receipt scans are not recorded/)).toBeTruthy();
        expect(screen.queryByText(/RET-104/)).toBeNull();
    });

    it('shows an empty state, not demo returns, when there are none', async () => {
        get.mockResolvedValue({ data: { ...data, rows: [], summary: { ...data.summary, returns: 0, byFlag: [], byReason: [], byCashier: [] } } });
        render(<ReturnsAuditReport />);
        await waitFor(() => expect(get).toHaveBeenCalled());
        await waitFor(() => expect(screen.queryByText('Returns', { selector: 'h3' })).toBeNull());
        expect(screen.queryByText(/RET-/)).toBeNull();
    });

    it('shows the error when the API fails', async () => {
        get.mockRejectedValue(Object.assign(new Error('x'), { response: { status: 500, data: { message: 'Unable to load Returns & Refund Audit' } } }));
        render(<ReturnsAuditReport />);
        await waitFor(() => expect(screen.getByText(/Unable to load Returns/)).toBeTruthy());
        expect(screen.queryByText(/RET-/)).toBeNull();
    });

    it('filters to flagged returns', async () => {
        get.mockResolvedValue({ data });
        render(<ReturnsAuditReport />);
        await waitFor(() => expect(screen.getByText('RET-8')).toBeTruthy());
        fireEvent.click(screen.getByRole('button', { name: /filters/i }));
        fireEvent.change(screen.getByLabelText('Risk'), { target: { value: 'FLAGGED' } });
        await waitFor(() => expect(screen.queryByText('RET-8')).toBeNull());
        expect(screen.getByText('RET-7')).toBeTruthy();
    });
});

import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, renderHook, screen, waitFor } from '@testing-library/react';

const get = vi.fn();
vi.mock('@/services/api', () => ({ default: { get: (...args: unknown[]) => get(...args) } }));

import { periodLabel, periodRange } from './hooks/useReportPeriod';
import { useServerReport } from './hooks/useReportData';
import { ReportColumn, ReportTable } from './components';
import { StockGroupTable } from './stock/StockGroupTable';
import { compactRupees } from './components/reportChart';
import BrandWiseSalesReport from './BrandWiseSalesReport';
import { DayBillsDialog } from './analytics/DayBillsDialog';
import { reportRegistry } from './config/reportRegistry';

afterEach(() => { cleanup(); get.mockReset(); });

describe('All time period', () => {
    it('sends no dates and is labelled "All time"', () => {
        expect(periodRange('all')).toEqual({ from: '', to: '' });
        expect(periodLabel({ from: '', to: '' })).toBe('All time');
    });
});

describe('useServerReport', () => {
    it('sends filters, search and sort, and goes back to page 1 when they change', async () => {
        get.mockImplementation((_url: string, { params }: { params: Record<string, string> }) =>
            Promise.resolve({ data: { items: [{ id: params.page }], pagination: { page: Number(params.page), limit: 25, total: 60, pages: 3 } } }));
        const { result, rerender } = renderHook(({ type }) => useServerReport<{ items: { id: string }[]; pagination: { page: number; limit: number; total: number; pages: number } }, { id: string }>('/x', { type }, { numericSort: ['value'] }), { initialProps: { type: '' } });
        await waitFor(() => expect(result.current.data).not.toBeNull());

        act(() => result.current.tableProps.pagination!.onPage(3));
        await waitFor(() => expect(get).toHaveBeenLastCalledWith('/x', { params: expect.objectContaining({ page: '3' }) }));

        rerender({ type: 'customer' });
        await waitFor(() => expect(get).toHaveBeenLastCalledWith('/x', { params: expect.objectContaining({ page: '1', type: 'customer' }) }));

        act(() => result.current.tableProps.sort!.onSort('value'));
        await waitFor(() => expect(get).toHaveBeenLastCalledWith('/x', { params: expect.objectContaining({ sort: 'value', dir: 'desc', page: '1' }) }));
    });

    it('leaves search to the filters when tableSearch is false', async () => {
        get.mockResolvedValue({ data: { items: [], pagination: { page: 1, limit: 25, total: 0, pages: 1 } } });
        const { result } = renderHook(() => useServerReport('/s', { search: 'saree' }, { tableSearch: false }));
        await waitFor(() => expect(get).toHaveBeenCalled());
        expect(get).toHaveBeenLastCalledWith('/s', { params: expect.objectContaining({ search: 'saree' }) });
        expect(result.current.tableProps.search).toBeUndefined();
    });
});

interface Entry { date: string; description: string; debit: number; balance: number }
const LEDGER: ReportColumn<Entry>[] = [
    { key: 'date', header: 'Date', value: e => e.date },
    { key: 'description', header: 'Description', value: e => e.description, subtext: e => (e.description.startsWith('Bill') ? 'large' : null) },
    { key: 'debit', header: 'Debit', type: 'currency', blankZero: true, value: e => e.debit },
    { key: 'balance', header: 'Balance', type: 'currency', value: e => e.balance },
];

describe('ReportTable pinned rows and cell options', () => {
    it('renders opening/closing rows around the data, blanks zeros, shows subtext', () => {
        render(
            <ReportTable
                title="Ledger"
                columns={LEDGER}
                rows={[{ date: 'd1', description: 'Bill 1', debit: 1500, balance: 1500 }, { date: 'd2', description: 'Payment', debit: 0, balance: 0 }]}
                rowKey={(_, i) => String(i)}
                pinnedTopRows={[{ date: '', description: 'Opening balance', debit: 0, balance: 0 }]}
                pinnedBottomRows={[{ date: '', description: 'Closing balance', debit: 1500, balance: 0 }]}
            />,
        );
        const rows = screen.getAllByRole('row').slice(1).map(r => r.textContent);
        expect(rows[0]).toContain('Opening balance');
        expect(rows[rows.length - 1]).toContain('Closing balance');
        expect(screen.getByText('large')).toBeTruthy();
        // Payment row: debit 0 is blank, balance 0 still shows ₹0.00.
        expect(rows[2]).toBe('d2Payment₹0.00');
    });
});

describe('StockGroupTable', () => {
    it('keeps the "Others (n)" roll-up last whatever the sort, and click-to-filter toggles', () => {
        const pick = vi.fn();
        render(
            <StockGroupTable
                title="By brand"
                label="Brand"
                groups={[
                    { key: 'Others (12)', lots: 99, qty: 999, costValue: 99999, mrpValue: 0 },
                    { key: 'Alpha', lots: 1, qty: 1, costValue: 10, mrpValue: 0 },
                    { key: 'Beta', lots: 2, qty: 2, costValue: 20, mrpValue: 0 },
                ]}
                onPick={pick}
                picked="Beta"
            />,
        );
        fireEvent.click(screen.getByRole('button', { name: /value \(cost\)/i }));
        const names = screen.getAllByRole('row').slice(1).map(r => r.firstChild?.textContent);
        expect(names).toEqual(['Beta', 'Alpha', 'Others (12)']);
        fireEvent.click(screen.getByText('Beta'));
        expect(pick).toHaveBeenLastCalledWith('');
        fireEvent.click(screen.getByText('Alpha'));
        expect(pick).toHaveBeenLastCalledWith('Alpha');
    });
});

describe('Detailed Analytics read the server in every mode', () => {
    it('renders the ERP breakdown the server computed, with its basis note', async () => {
        get.mockResolvedValue({ data: {
            rows: [{ name: 'Ramraj', revenue: 1550, count: 2, items: 3 }, { name: 'No Brand', revenue: 120, count: 1, items: 1 }],
            range: { from: '2026-09-01', to: '2026-09-30' }, asOf: '2026-09-25', source: 'mongo', basis: 'Grouped from ERP invoices.',
        } });
        render(<BrandWiseSalesReport />);
        await waitFor(() => expect(screen.getAllByText('Ramraj').length).toBeGreaterThan(0));
        expect(get.mock.calls[0][0]).toBe('/api/reports/shop-sales');
        expect((get.mock.calls[0][1] as { params: Record<string, string> }).params.dim).toBe('brand');
        expect(screen.getByText(/Grouped from ERP invoices\./)).toBeTruthy();
    });

    it('shows the server error instead of browser-side figures when the shop database is down', async () => {
        get.mockRejectedValue(Object.assign(new Error('503'), { response: { status: 503, data: { message: 'The shop database could not be reached' } } }));
        render(<BrandWiseSalesReport />);
        await waitFor(() => expect(screen.getByText(/could not be reached/)).toBeTruthy());
        expect(screen.queryByText('Total sales')).toBeNull();
    });

    it('day bills always come from the server', async () => {
        get.mockResolvedValue({ data: { source: 'mongo', date: '2026-09-20', rows: [
            { _id: 'a1', invoiceNo: 'INV-7', createdAt: '2026-09-20T05:00:00Z', customer: { name: 'Meena' }, paymentMethod: 'upi', totalAmount: 400, cancelled: false },
        ] } });
        render(<DayBillsDialog date="2026-09-20" onClose={() => {}} />);
        await waitFor(() => expect(screen.getByText('INV-7')).toBeTruthy());
        expect(get).toHaveBeenCalledWith('/api/reports/shop-sales/day-bills', { params: { date: '2026-09-20' } });
    });
});

describe('chart axis units', () => {
    it('uses Indian units', () => {
        expect(compactRupees(950)).toBe('₹950');
        expect(compactRupees(12500)).toBe('₹12.5K');
        expect(compactRupees(420000)).toBe('₹4.2L');
        expect(compactRupees(13000000)).toBe('₹1.3Cr');
    });
});

describe('registry data sources', () => {
    it('party reports are shop-database only', () => {
        const parties = Object.values(reportRegistry).filter(r => r.category === 'parties');
        expect(parties.length).toBe(8);
        for (const r of parties) expect(r.dataSource).toBe('textilesoft-sql');
    });
});

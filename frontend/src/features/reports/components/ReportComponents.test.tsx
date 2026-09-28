import React from 'react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { act, cleanup, fireEvent, render, renderHook, screen, within } from '@testing-library/react';
import { ReportPageShell } from './ReportPageShell';
import { ReportTable, ReportColumn } from './ReportTable';
import { dataSourceLabel, pageWindow } from './reportHelpers';
import { useClientReportTable } from '../hooks/useClientReportTable';

afterEach(cleanup);

describe('ReportPageShell', () => {
    it('coming-soon reports show no toolbar and never render their children', () => {
        render(<ReportPageShell reportId="purchase" onRefresh={() => {}}><p>SAMPLE FIGURES</p></ReportPageShell>);
        expect(screen.getByRole('heading', { name: 'Purchase Report' })).toBeTruthy();
        expect(screen.getAllByText('Coming soon').length).toBeGreaterThan(0);
        expect(screen.queryByText('SAMPLE FIGURES')).toBeNull();
        expect(screen.queryByRole('button', { name: /refresh/i })).toBeNull();
    });

    it('first load shows the skeleton; later refreshes keep the data visible', () => {
        const { rerender } = render(<ReportPageShell reportId="inventory" loading><p>DATA</p></ReportPageShell>);
        expect(screen.getByLabelText('Loading report')).toBeTruthy();
        expect(screen.queryByText('DATA')).toBeNull();

        rerender(<ReportPageShell reportId="inventory" loading={false}><p>DATA</p></ReportPageShell>);
        expect(screen.getByText('DATA')).toBeTruthy();
        expect(screen.getByText('Last refreshed:')).toBeTruthy();

        rerender(<ReportPageShell reportId="inventory" loading><p>DATA</p></ReportPageShell>);
        expect(screen.getByText('DATA')).toBeTruthy();
    });

    it('errors show the error state with retry, and no sample fallback', () => {
        const retry = vi.fn();
        render(<ReportPageShell reportId="inventory" error="timeout" onRetry={retry}><p>DATA</p></ReportPageShell>);
        expect(screen.getByText('Unable to load report')).toBeTruthy();
        expect(screen.queryByText('DATA')).toBeNull();
        fireEvent.click(screen.getByRole('button', { name: 'Try again' }));
        expect(retry).toHaveBeenCalledOnce();
    });

    it('empty with active filters offers Clear filters', () => {
        const clear = vi.fn();
        render(
            <ReportPageShell reportId="inventory" isEmpty filters={{ content: <input aria-label="Brand" />, activeCount: 2, onClear: clear }}>
                <p>DATA</p>
            </ReportPageShell>,
        );
        expect(screen.getByText('No data found')).toBeTruthy();
        expect(screen.getAllByText('No data').length).toBeGreaterThan(0);
        fireEvent.click(screen.getByRole('button', { name: 'Clear filters' }));
        expect(clear).toHaveBeenCalledOnce();
    });

    it('filters panel toggles and shows the active count', () => {
        render(<ReportPageShell reportId="inventory" filters={{ content: <input aria-label="Brand" />, activeCount: 1, onClear: () => {} }}><p>DATA</p></ReportPageShell>);
        const button = screen.getByRole('button', { name: /filters/i });
        expect(within(button).getByText('1')).toBeTruthy();
        expect(screen.queryByLabelText('Brand')).toBeNull();
        fireEvent.click(button);
        expect(screen.getByLabelText('Brand')).toBeTruthy();
    });

    it('validation reports show the reconciliation warning', () => {
        render(<ReportPageShell reportId="sales"><p>DATA</p></ReportPageShell>);
        expect(screen.getByText(/being reconciled/)).toBeTruthy();
        expect(screen.getAllByText('Data validation').length).toBeGreaterThan(0);
    });

    it('audit footer shows what the API said answered', () => {
        render(<ReportPageShell reportId="inventory" meta={{ resolvedSource: 'sql', asOf: '2026-09-22', recordCount: 4243 }}><p>DATA</p></ReportPageShell>);
        expect(screen.getByText('Textilesoft SQL')).toBeTruthy();
        expect(screen.getByText('4,243')).toBeTruthy();
        expect(screen.getByText(/^22 Sept? 2026$/)).toBeTruthy();
    });
});

describe('dataSourceLabel', () => {
    it('prefers the resolved source; combined only includes SQL in SQL mode', () => {
        expect(dataSourceLabel('item-data-source', 'mongo')).toBe('ERP MongoDB');
        expect(dataSourceLabel('combined', 'sql')).toBe('Textilesoft SQL + ERP MongoDB');
        expect(dataSourceLabel('combined', 'mongo')).toBe('ERP MongoDB');
        expect(dataSourceLabel('combined')).toBe('Textilesoft SQL + ERP MongoDB');
        expect(dataSourceLabel('item-data-source')).toBe('Not reported by the server');
        expect(dataSourceLabel(null)).toBe('Not connected');
    });
});

describe('pageWindow', () => {
    it('keeps first, last and neighbours with gaps', () => {
        expect(pageWindow(1, 5)).toEqual([1, 2, 3, 4, 5]);
        expect(pageWindow(1, 170)).toEqual([1, 2, 3, 4, 'gap', 170]);
        expect(pageWindow(50, 170)).toEqual([1, 'gap', 49, 50, 51, 'gap', 170]);
        expect(pageWindow(170, 170)).toEqual([1, 'gap', 167, 168, 169, 170]);
    });
});

interface Bill { no: string; customer: string; amount: number; status: string }
const BILLS: Bill[] = Array.from({ length: 30 }, (_, i) => ({
    no: `B${i + 1}`, customer: i % 2 ? 'Ravi' : 'Meena', amount: (i + 1) * 1000.5, status: i === 0 ? 'Cancelled' : 'Done',
}));
const COLUMNS: ReportColumn<Bill>[] = [
    { key: 'no', header: 'Bill No', value: b => b.no },
    { key: 'customer', header: 'Customer', value: b => b.customer },
    { key: 'amount', header: 'Amount', type: 'currency', value: b => b.amount },
    { key: 'status', header: 'Status', type: 'status', value: b => b.status, statusTones: { Done: 'success', Cancelled: 'danger' } },
];

describe('useClientReportTable', () => {
    it('pages, searches and sorts (numbers biggest first, then reverse, then default)', () => {
        const { result } = renderHook(() => useClientReportTable(BILLS, COLUMNS, { pageSize: 25 }));
        expect(result.current.tableProps.rows).toHaveLength(25);
        expect(result.current.tableProps.pagination?.total).toBe(30);

        act(() => result.current.tableProps.search!.onChange('ravi'));
        expect(result.current.filteredRows).toHaveLength(15);

        act(() => result.current.tableProps.sort!.onSort('amount'));
        expect(result.current.tableProps.rows[0].no).toBe('B30');
        act(() => result.current.tableProps.sort!.onSort('amount'));
        expect(result.current.tableProps.rows[0].no).toBe('B2');
        act(() => result.current.tableProps.sort!.onSort('amount'));
        expect(result.current.tableProps.sort!.key).toBeNull();
    });
});

describe('ReportTable', () => {
    it('formats currency, shows status badges, and hides columns', () => {
        const Harness = () => {
            const { tableProps } = useClientReportTable(BILLS, COLUMNS, { pageSize: 25 });
            return <ReportTable title="Sales Transactions" columns={COLUMNS} rowKey={b => b.no} {...tableProps} />;
        };
        render(<Harness />);
        expect(screen.getByText('₹1,000.50')).toBeTruthy();
        expect(screen.getByText('Cancelled')).toBeTruthy();
        expect(screen.getByText(/Showing/).textContent?.replace(/\s+/g, ' ')).toBe('Showing 1 to 25 of 30 records');

        fireEvent.click(screen.getByRole('button', { name: /columns/i }));
        fireEvent.click(screen.getByRole('checkbox', { name: 'Customer' }));
        expect(screen.queryByRole('columnheader', { name: /customer/i })).toBeNull();
        // The first column can't be hidden.
        expect((screen.getByRole('checkbox', { name: 'Bill No' }) as HTMLInputElement).disabled).toBe(true);
    });
});

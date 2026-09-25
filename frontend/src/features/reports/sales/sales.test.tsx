import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen, waitFor } from '@testing-library/react';

const get = vi.fn();
vi.mock('@/services/api', () => ({ default: { get: (...args: unknown[]) => get(...args) } }));

import SalesReport from './SalesReport';
import BusinessReportsHub from '../BusinessReportsHub';
import { REPORT_PAGES, reportPageFor } from '../config/reportPages';
import { reportRegistry } from '../config/reportRegistry';

afterEach(() => { cleanup(); get.mockReset(); });
vi.stubGlobal('ResizeObserver', class { observe() {} unobserve() {} disconnect() {} });

const data = {
    range: { from: '2026-09-01', to: '2026-09-30' },
    summary: {
        bills: 3, value: 4500, gst: 214.29, netSales: 4285.71, cash: 2500, bank: 1500, credit: 500,
        days: 22, avgPerDay: 204.55, avgBill: 1500, bestDay: { date: '2026-09-20', value: 3000, bills: 2 },
    },
    cancelled: { bills: 1, value: 1200 },
    bySource: { shop: { bills: 2, value: 3000 }, erp: { bills: 1, value: 1500 } },
    byDay: [{ date: '2026-09-20', value: 3000, bills: 2 }, { date: '2026-09-21', value: 1500, bills: 1 }],
    topCustomers: [{ name: 'Meena Stores', bills: 2, value: 3000 }],
    walkIn: { bills: 1, value: 1500 },
    topItems: [{ name: 'Cotton saree', qty: 4, value: 2800 }],
    items: [
        { source: 'shop', id: 's1', ref: 'A1 4243', date: '2026-09-20', time: '10:15', customer: 'Meena Stores', value: 2000, gst: 95.24, netSales: 1904.76, cash: 1000, bank: 1000, credit: 0 },
        { source: 'erp', id: 'e1', ref: 'INV-77', date: '2026-09-21', time: null, customer: 'Walk-in', value: 1500, gst: 71.43, netSales: 1428.57, cash: 1500, bank: 0, credit: 0 },
    ],
    pagination: { page: 1, pageSize: 50, total: 3, totalPages: 1 },
    sort: 'date', dir: 'desc',
    checks: { overpaidShopBills: 0 },
    asOf: '2026-09-21',
    source: 'sql',
};

describe('SalesReport', () => {
    it('reads the live sales API for this month and shows its figures, not sample data', async () => {
        get.mockResolvedValue({ data });
        render(<SalesReport />);
        await waitFor(() => expect(screen.getByText('INV-77')).toBeTruthy());
        const [url, cfg] = get.mock.calls[0] as [string, { params: Record<string, unknown> }];
        expect(url).toBe('/api/reports/finance/sales');
        expect(cfg.params.from).toMatch(/^\d{4}-\d{2}-01$/);
        expect(screen.getByText('Total revenue')).toBeTruthy();
        expect(screen.getAllByText('₹4,500').length).toBeGreaterThan(0);
        expect(screen.getByText('Cancelled amount')).toBeTruthy();
        expect(screen.getAllByText('₹1,200').length).toBeGreaterThan(0);
        expect(screen.getByText(/Meena Stores · 2 bills/)).toBeTruthy();
        expect(screen.getByText(/Cotton saree · qty 4/)).toBeTruthy();
    });
});

describe('report router', () => {
    it('has a page for every report the registry does not mark coming-soon', () => {
        for (const r of Object.values(reportRegistry)) {
            if (!r.hubView) continue;
            if (r.implementationStatus === 'coming-soon') expect(reportPageFor(r.hubView)).toBeNull();
            else expect(reportPageFor(r.hubView), r.id).toBeTruthy();
        }
        expect(REPORT_PAGES.REPORT_SALES).toBe(SalesReport);
    });

    it('shows the coming-soon state rather than figures for a report with no page', () => {
        render(<BusinessReportsHub view="TRIAL_BALANCE" />);
        expect(screen.getByText(/has not been connected to your shop's data yet/)).toBeTruthy();
        expect(get).not.toHaveBeenCalled();
    });
});

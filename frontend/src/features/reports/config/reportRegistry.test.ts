import { describe, it, expect } from 'vitest';
import {
    REPORT_CATEGORIES,
    getReport,
    getReportByAppView,
    getReportsByCategory,
    reportRegistry,
} from './reportRegistry';

const all = Object.entries(reportRegistry);

describe('reportRegistry', () => {
    it('each entry id matches its key', () => {
        for (const [key, report] of all) expect(report.id).toBe(key);
    });

    it('every report belongs to a known category, and every category has reports', () => {
        const ids = REPORT_CATEGORIES.map(c => c.id);
        for (const [, report] of all) expect(ids).toContain(report.category);
        for (const id of ids) expect(getReportsByCategory(id).length).toBeGreaterThan(0);
    });

    it('live and validation reports have something to render and a declared data source', () => {
        for (const [, report] of all) {
            if (report.implementationStatus === 'coming-soon') continue;
            expect(report.hubView).not.toBeNull();
            expect(report.dataSource).not.toBeNull();
        }
    });

    it('keeps the 35 catalog reports', () => {
        expect(all).toHaveLength(35);
    });

    it('maps global viewModes to the same reports the old switch did', () => {
        const expected: Record<string, string> = {
            REPORT_SALES: 'sales',
            REPORT_PURCHASE: 'purchase',
            REPORT_INVENTORY: 'inventory',
            REPORT_CUSTOMER: 'sales-party',
            REPORT_SUPPLIER: 'purchase-party',
            REPORT_TAX: 'gstr3b',
            REPORT_FINANCIAL: 'all-transactions',
            DAY_BOOK: 'daybook',
            TRIAL_BALANCE: 'trial-balance',
            PROFIT_LOSS: 'profit-loss',
            BALANCE_SHEET: 'balance-sheet',
            CASH_FLOW: 'cash-flow',
        };
        for (const [mode, id] of Object.entries(expected)) {
            expect(getReportByAppView(mode as never)?.id).toBe(id);
        }
        expect(getReportByAppView('REPORTS')).toBeNull();
    });

    it('getReport returns null for unknown ids', () => {
        expect(getReport('nope')).toBeNull();
        expect(getReport('sales')?.title).toBe('Sales Report');
    });
});

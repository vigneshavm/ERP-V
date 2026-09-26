import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen, waitFor, within } from '@testing-library/react';

const get = vi.fn();
vi.mock('@/services/api', () => ({ default: { get: (...args: unknown[]) => get(...args) } }));

import { outwardFindings } from './gstFindings';
import { monthLabel, rateLabel } from './gstFormat';
import type { Gstr3bData, OutwardChecks, PurchaseRegisterData, TaxTotals } from './gstTypes';
import Gstr3bReport from './Gstr3bReport';
import PurchaseGstRegister from './PurchaseGstRegister';

afterEach(() => { cleanup(); get.mockReset(); });

const CLEAN: OutwardChecks = {
    shopHeaderVsLineTax: { header: 1000, lines: 1000.4, difference: 0.4 },
    shopHeaderVsLineValue: { header: 21000, lines: 21000, difference: 0 },
    unknownRate: { lines: 0, value: 0 },
    missingHsn: { lines: 0, value: 0 },
    hsnViaGroupLines: 0,
    shopInterStateBills: 0,
    erpZeroRateLines: { lines: 0, value: 0 },
    erpDerivedLines: 0,
    erpReturnsNotDeducted: { invoices: 0, value: 0 },
};

const T = (taxable: number, cgst: number, sgst: number, igst = 0, lines = 10): TaxTotals =>
    ({ lines, qty: lines, value: taxable + cgst + sgst + igst, taxable, cgst, sgst, igst, tax: cgst + sgst + igst });

describe('outwardFindings', () => {
    it('lists nothing when the data reconciles (sub-rupee rounding is not an issue)', () => {
        expect(outwardFindings(CLEAN)).toEqual([]);
    });

    it('flags header/line tax differences and ERP 0% lines as warnings', () => {
        const f = outwardFindings({
            ...CLEAN,
            shopHeaderVsLineTax: { header: 1000, lines: 1012, difference: 12 },
            erpZeroRateLines: { lines: 3, value: 450 },
            hsnViaGroupLines: 40,
        });
        expect(f.filter(x => x.tone === 'warning')).toHaveLength(2);
        expect(f.some(x => x.tone === 'info' && x.text.includes('HSN master'))).toBe(true);
        expect(f[0].text).toContain('₹12.00');
    });
});

describe('format helpers', () => {
    it('labels', () => {
        expect(rateLabel(-1)).toBe('Unknown rate');
        expect(rateLabel(12)).toBe('12%');
        expect(monthLabel('2026-08')).toBe('Aug 2026');
    });
});

describe('Gstr3bReport', () => {
    it('shows output tax, ITC and the set-off, and asks for the previous month by default', async () => {
        const data: Gstr3bData = {
            range: { from: '2026-08-01', to: '2026-08-31' },
            outward: { taxable: T(20000, 500, 500), nilRated: T(1000, 0, 0, 0, 2), total: T(21000, 500, 500, 0, 12), interStateTaxable: T(0, 0, 0, 0, 0) },
            itc: { eligible: T(8000, 200, 200), blocked: T(1000, 25, 25, 0, 1), allPurchases: T(9000, 225, 225) },
            setOff: {
                liability: { cgst: 500, sgst: 500, igst: 0 },
                credit: { cgst: 200, sgst: 200, igst: 0 },
                paidByCredit: { igst: { cgst: 0, sgst: 0, igst: 0 }, cgst: { cgst: 200, sgst: 0, igst: 0 }, sgst: { cgst: 0, sgst: 200, igst: 0 } },
                cash: { cgst: 300, sgst: 300, igst: 0 },
                carryForward: { cgst: 0, sgst: 0, igst: 0 },
            },
            byMonth: [{ month: '2026-08', outputTax: 1000, taxable: 20000, itc: 400, net: 600 }],
            checks: CLEAN,
            asOf: '2026-09-22',
            source: 'sql',
        };
        get.mockResolvedValue({ data });
        render(<Gstr3bReport />);
        await waitFor(() => expect(screen.getByText('Payment of tax')).toBeTruthy());

        const [url, opts] = get.mock.calls[0] as [string, { params: Record<string, string> }];
        expect(url).toBe('/api/reports/gst/gstr3b');
        expect(opts.params.from).toMatch(/^\d{4}-\d{2}-01$/);

        expect(screen.getByText('₹600.00')).toBeTruthy(); // pay in cash
        expect(screen.getByText('No issues found for this period.')).toBeTruthy();
        const cgstRow = screen.getAllByRole('row').find(r => within(r).queryByText('CGST') && within(r).queryByText('₹300.00'));
        expect(cgstRow).toBeTruthy();
        // Single month: no by-month table.
        expect(screen.queryByText('By month')).toBeNull();
        expect(screen.getByText('Textilesoft SQL + ERP MongoDB')).toBeTruthy();
    });
});

describe('PurchaseGstRegister', () => {
    it('marks documents without a GSTIN as not claimable and reports it', async () => {
        const data: PurchaseRegisterData = {
            range: { from: '2026-08-01', to: '2026-08-31' },
            summary: { all: T(9000, 225, 225), eligible: T(8000, 200, 200), noGstin: T(1000, 25, 25, 0, 1), returns: T(-500, -12.5, -12.5, 0, 1), documents: 2, suppliersWithoutGstin: 1 },
            byRate: [{ rate: 5, ...T(9000, 225, 225) }],
            items: [
                { source: 'shop', kind: 'purchase', doc: 'VJ11', supplierInvoiceNo: null, date: '2026-08-05', invoiceDate: '2026-08-04', supplier: 'N.BALASUBRAMANIAM TEXTILES', gstin: '33AABCN1234F1Z5', rates: '5%', lines: 3, qty: 54, value: 8400, taxable: 8000, cgst: 200, sgst: 200, igst: 0, tax: 400, itcEligible: true },
                { source: 'shop', kind: 'purchase', doc: 'VJ12', supplierInvoiceNo: null, date: '2026-08-09', invoiceDate: null, supplier: 'LOCAL WEAVER', gstin: '', rates: '5%', lines: 1, qty: 10, value: 1050, taxable: 1000, cgst: 25, sgst: 25, igst: 0, tax: 50, itcEligible: false },
            ],
            pagination: { page: 1, limit: 50, total: 2, pages: 1 },
            checks: { unknownRate: 0, returnsAvailable: true },
            asOf: '2026-09-22',
            source: 'sql',
        };
        get.mockResolvedValue({ data });
        render(<PurchaseGstRegister />);
        await waitFor(() => expect(screen.getByText('VJ12')).toBeTruthy());
        expect(screen.getByText('No GSTIN')).toBeTruthy();
        expect(screen.getByText(/1 suppliers have no valid GSTIN/)).toBeTruthy();
        expect(screen.getByText('33AABCN1234F1Z5')).toBeTruthy();
    });
});

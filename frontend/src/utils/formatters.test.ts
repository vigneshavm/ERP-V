import { describe, it, expect } from 'vitest';
import {
    MISSING,
    formatCurrency,
    formatDateTime,
    formatNumber,
    formatPercentage,
    formatQuantity,
    formatReportDate,
} from './formatters';
import { formatCurrency as legacyFormatCurrency } from './helpers';

// Intl output uses a narrow no-break space in some places; normalise so assertions stay readable.
const norm = (s: string) => s.replace(/\s/g, ' ');

describe('formatCurrency', () => {
    it('defaults to 2 decimals with Indian grouping (unchanged from helpers.ts)', () => {
        expect(formatCurrency(12450.5)).toBe('₹12,450.50');
        expect(formatCurrency(4234946)).toBe('₹42,34,946.00');
    });

    it('supports whole rupees for BI views', () => {
        expect(formatCurrency(4234946.4, { fractionDigits: 0 })).toBe('₹42,34,946');
    });

    it('formats negatives and zero', () => {
        expect(formatCurrency(0)).toBe('₹0.00');
        expect(formatCurrency(-1500)).toBe('-₹1,500.00');
    });

    it('renders non-numbers as MISSING, never as ₹0', () => {
        expect(formatCurrency(NaN)).toBe(MISSING);
        expect(formatCurrency(Infinity)).toBe(MISSING);
        expect(formatCurrency(undefined)).toBe(MISSING);
        expect(formatCurrency(null)).toBe(MISSING);
    });

    it('is the same function helpers.ts re-exports', () => {
        expect(legacyFormatCurrency).toBe(formatCurrency);
    });
});

describe('number formatters', () => {
    it('formatNumber: whole, Indian grouping', () => {
        expect(formatNumber(4243)).toBe('4,243');
        expect(formatNumber(1234567)).toBe('12,34,567');
        expect(formatNumber(NaN)).toBe(MISSING);
    });

    it('formatQuantity: keeps up to 3 decimals, drops trailing zeros', () => {
        expect(formatQuantity(14259)).toBe('14,259');
        expect(formatQuantity(12.5)).toBe('12.5');
        expect(formatQuantity(2.3456)).toBe('2.346');
    });

    it('formatPercentage: value is already a percentage', () => {
        expect(formatPercentage(12.5, 2)).toBe('12.50%');
        expect(formatPercentage(12.46)).toBe('12.5%');
        expect(formatPercentage(undefined)).toBe(MISSING);
    });
});

describe('report dates', () => {
    it('formatReportDate: "24 Dec 2025"', () => {
        expect(norm(formatReportDate(new Date(2025, 11, 24)))).toBe('24 Dec 2025');
    });

    it('formatDateTime includes the time', () => {
        const out = norm(formatDateTime(new Date(2026, 8, 23, 21, 32)));
        expect(out).toMatch(/^23 Sept? 2026, 9:32 pm$/i);
    });

    it("reads API 'yyyy-mm-dd' dates as calendar dates (no timezone shift)", () => {
        expect(norm(formatReportDate('2026-09-23'))).toMatch(/^23 Sept? 2026$/);
        expect(formatReportDate('2026-02-30')).toBe(MISSING);
    });

    it('invalid or empty dates render as MISSING', () => {
        expect(formatReportDate('not a date')).toBe(MISSING);
        expect(formatReportDate(null)).toBe(MISSING);
        expect(formatDateTime('')).toBe(MISSING);
    });
});

/**
 * Canonical display formatters for the whole ERP (reports, POS, invoices, ledgers).
 *
 * Rules:
 * - Always Indian grouping (en-IN): ₹42,34,946, not ₹4,234,946 or 4.23M.
 * - A value that isn't a finite number renders as MISSING ("—"), never as ₹0. A broken
 *   calculation must look broken, not like a real zero, especially on audit reports.
 * - Intl formatters are cached; building one per call is the expensive part.
 *
 * `utils/helpers.ts` re-exports formatCurrency/formatDate from here so existing imports keep working.
 */

export const MISSING = '—';

type Numeric = number | null | undefined;

const isNumber = (value: Numeric): value is number =>
    typeof value === 'number' && Number.isFinite(value);

const warnMissing = (fn: string, value: unknown): void => {
    if (import.meta.env?.DEV) {
        console.warn(`[formatters] ${fn} received a non-numeric value`, value);
    }
};

const cache = new Map<string, Intl.NumberFormat>();
const numberFormat = (key: string, options: Intl.NumberFormatOptions): Intl.NumberFormat => {
    let fmt = cache.get(key);
    if (!fmt) {
        fmt = new Intl.NumberFormat('en-IN', options);
        cache.set(key, fmt);
    }
    return fmt;
};

export interface CurrencyOptions {
    /**
     * Decimal places, applied as both min and max. Default 2 (transactional screens:
     * ₹12,450.50). BI/KPI views pass 0 for whole rupees (₹42,34,946).
     */
    fractionDigits?: number;
}

export const formatCurrency = (value: Numeric, options: CurrencyOptions = {}): string => {
    if (!isNumber(value)) {
        warnMissing('formatCurrency', value);
        return MISSING;
    }
    const digits = options.fractionDigits ?? 2;
    return numberFormat(`cur:${digits}`, {
        style: 'currency',
        currency: 'INR',
        minimumFractionDigits: digits,
        maximumFractionDigits: digits,
    }).format(value);
};

/** Counts: bills, records, parties. Whole numbers, Indian grouping (4,243). */
export const formatNumber = (value: Numeric): string => {
    if (!isNumber(value)) {
        warnMissing('formatNumber', value);
        return MISSING;
    }
    return numberFormat('num', { maximumFractionDigits: 0 }).format(value);
};

/** Stock/sale quantities: up to 3 decimals for metre/kg items, none shown when whole (14,259 / 12.5). */
export const formatQuantity = (value: Numeric): string => {
    if (!isNumber(value)) {
        warnMissing('formatQuantity', value);
        return MISSING;
    }
    return numberFormat('qty', { maximumFractionDigits: 3 }).format(value);
};

/** `value` is already a percentage (12.5 → "12.5%"), not a ratio. */
export const formatPercentage = (value: Numeric, fractionDigits = 1): string => {
    if (!isNumber(value)) {
        warnMissing('formatPercentage', value);
        return MISSING;
    }
    return `${numberFormat(`pct:${fractionDigits}`, {
        minimumFractionDigits: fractionDigits,
        maximumFractionDigits: fractionDigits,
    }).format(value)}%`;
};

type DateInput = string | number | Date | null | undefined;

const toValidDate = (value: DateInput): Date | null => {
    if (value === null || value === undefined || value === '') return null;
    // A bare 'yyyy-mm-dd' (how the report APIs send dates) is a calendar date: read it as local
    // midnight. new Date('2026-09-23') would be UTC midnight and show the previous day west of UTC.
    if (typeof value === 'string') {
        const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
        if (m) {
            const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
            return d.getMonth() === Number(m[2]) - 1 ? d : null;
        }
    }
    const d = value instanceof Date ? value : new Date(value);
    return Number.isNaN(d.getTime()) ? null : d;
};

/**
 * Legacy display date: the browser-locale `toLocaleDateString()` output that ~35 screens were
 * built around. Kept as-is so those screens don't change; new report code should use
 * formatReportDate.
 */
export const formatDate = (date: string | number | Date): string => {
    return new Date(date).toLocaleDateString();
};

const reportDate = new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
const reportDateTime = new Intl.DateTimeFormat('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true,
});

/** Report/audit date: "24 Dec 2025". */
export const formatReportDate = (value: DateInput): string => {
    const d = toValidDate(value);
    return d ? reportDate.format(d) : MISSING;
};

/** Report/audit timestamp: "23 Sep 2026, 9:32 pm". */
export const formatDateTime = (value: DateInput): string => {
    const d = toValidDate(value);
    return d ? reportDateTime.format(d) : MISSING;
};

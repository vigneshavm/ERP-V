/**
 * Unified Date Calculation Utility
 * Handles month ranges, day start/end boundaries, period parsing, and India Standard Time (IST) conversions.
 * IST functions are used by financial reports, sales analytics, and expense tracking.
 */

export interface DateRange {
    startDate: Date;
    endDate: Date;
    daysInMonth?: number;
}

// India Standard Time offset (UTC+5:30)
export const IST_OFFSET_MS = 5.5 * 3_600_000;

/**
 * Returns normalized start and end date objects for a given month and year.
 * @param year e.g. 2026
 * @param month 1-indexed (1=Jan) or 0-indexed (0=Jan) based on isZeroIndexed
 * @param isZeroIndexed boolean flag indicating if month parameter is 0-indexed (default: false)
 */
export const getMonthDateRange = (
    year: number,
    month: number,
    isZeroIndexed = false
): DateRange => {
    const monthIdx = isZeroIndexed ? month : month - 1;
    const startDate = new Date(year, monthIdx, 1, 0, 0, 0, 0);
    const endDate = new Date(year, monthIdx + 1, 0, 23, 59, 59, 999);
    const daysInMonth = endDate.getDate();

    return {
        startDate,
        endDate,
        daysInMonth,
    };
};

/**
 * Returns normalized start (00:00:00.000) and end (23:59:59.999) dates for a specific day.
 */
export const getDayDateRange = (dateInput?: string | Date): DateRange => {
    const target = dateInput ? new Date(dateInput) : new Date();
    const startDate = new Date(target.getFullYear(), target.getMonth(), target.getDate(), 0, 0, 0, 0);
    const endDate = new Date(target.getFullYear(), target.getMonth(), target.getDate(), 23, 59, 59, 999);

    return {
        startDate,
        endDate,
    };
};

/**
 * Converts Date to YYYY-MM-DD string in India Standard Time (IST).
 * Used across financial reports, sales analytics, and expense tracking.
 */
export const istDate = (d: Date | string): string => {
    const date = d instanceof Date ? d : new Date(d);
    return new Date(date.getTime() + IST_OFFSET_MS).toISOString().slice(0, 10);
};

/**
 * Extracts the hour (0-23) from a timestamp in India Standard Time (IST).
 * Used in hourly sales aggregations and time-based analytics.
 */
export const istHour = (d: Date | string): number => {
    const date = d instanceof Date ? d : new Date(d);
    return new Date(date.getTime() + IST_OFFSET_MS).getUTCHours();
};

/**
 * Converts Date to HH:MM time string in India Standard Time (IST).
 */
export const istTime = (d: Date | string): string => {
    const date = d instanceof Date ? d : new Date(d);
    return new Date(date.getTime() + IST_OFFSET_MS).toISOString().slice(11, 16);
};

/**
 * Creates a Date object for the start of a day in IST (00:00:00+05:30).
 * Used to construct date-range queries for reports.
 */
export const istStart = (d: string): Date => {
    return new Date(`${d}T00:00:00+05:30`);
};

/**
 * Creates a Date object for the exclusive end of a day in IST (next day 00:00:00+05:30).
 * Used to construct date-range queries: { $gte: istStart(date), $lt: istEndExclusive(date) }
 */
export const istEndExclusive = (d: string): Date => {
    return new Date(istStart(d).getTime() + 86_400_000); // +1 day in ms
};

/**
 * Returns today's date as YYYY-MM-DD string in IST.
 */
export const todayIst = (): string => istDate(new Date());

/**
 * Adds days to a YYYY-MM-DD date string and returns the result as YYYY-MM-DD in IST.
 * Positive days = future, negative days = past.
 */
export const addDays = (iso: string, days: number): string => {
    const d = istStart(iso);
    d.setDate(d.getDate() + days);
    return istDate(d);
};

/**
 * Returns the number of days between two YYYY-MM-DD date strings.
 */
export const daysBetween = (from: string, to: string): number => {
    const start = istStart(from).getTime();
    const end = istStart(to).getTime();
    return Math.round((end - start) / 86_400_000);
};

/**
 * Safely converts an unknown value to YYYY-MM-DD string in IST, or null if invalid.
 * Handles Date objects, timestamps, and date strings.
 */
export const dateOf = (v: unknown): string | null => {
    const d = v instanceof Date ? v : v ? new Date(String(v)) : null;
    return d && !Number.isNaN(d.getTime()) ? istDate(d) : null;
};

/**
 * Validates and returns a { from, to } ISO date range (YYYY-MM-DD), or null if either value
 * is not a valid ISO date string or `from` is after `to`. Used by finance and GST report parsers.
 */
export const parseISODateRange = <T extends { from: string; to: string }>(from: unknown, to: unknown): T | null => {
    const ok = (v: unknown): v is string => typeof v === "string" && /^\d{4}-\d{2}-\d{2}$/.test(v);
    if (!ok(from) || !ok(to) || from > to) return null;
    return { from, to } as T;
};

/**
 * MongoDB query filter matching a [from, to] IST day range (inclusive of `to`).
 * Used across report services querying by createdAt/date fields.
 */
export const dateRangeQuery = (r: { from: string; to: string }) => ({ $gte: istStart(r.from), $lt: istEndExclusive(r.to) });

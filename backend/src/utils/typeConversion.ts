/**
 * Type conversion utilities used across reports, analytics, and financial calculations.
 * Provides safe conversions with sensible defaults to prevent NaN/undefined in reports.
 */

/**
 * Convert to number, returning 0 if not a valid finite number.
 * Used in financial calculations, analytics, and data aggregations.
 * @example toNumber('123.45') => 123.45
 * @example toNumber('invalid') => 0
 * @example toNumber(null) => 0
 */
export const toNumber = (v: unknown): number => {
    const x = Number(v);
    return Number.isFinite(x) ? x : 0;
};

/**
 * Convert to string with trimming, returning empty string if not a string-like value.
 * Used in labels, descriptions, and text aggregations.
 * @example toString('  hello  ') => 'hello'
 * @example toString(null) => ''
 */
export const toString = (v: unknown): string => {
    return typeof v === "string" ? v.trim() : "";
};

/**
 * Round to 2 decimal places (nearest paisa for currency).
 * Used in all financial calculations (profit, tax, amounts, etc.).
 * @example round2(123.456) => 123.46
 * @example round2(123.454) => 123.45
 */
export const round2 = (v: number): number => Math.round(v * 100) / 100;

/**
 * Commonly used abbreviated names (compatibility with existing math services).
 * Prefer the full-name versions in new code.
 */
export const n = toNumber;      // Backward compat alias
export const s = toString;      // Backward compat alias

/**
 * Converts a value to number, parsing strings with Indian number format (commas).
 * Used for user input and locale-formatted displays.
 * @example parseIndianNumber('1,23,456.50') => 123456.50
 * @example parseIndianNumber('123456.50') => 123456.50
 */
export const parseIndianNumber = (v: unknown): number => {
    if (typeof v === "number") return v;
    if (typeof v !== "string") return 0;
    const cleaned = v.replace(/,/g, "");
    const num = Number(cleaned);
    return Number.isFinite(num) ? num : 0;
};

/**
 * Format a number as Indian locale string with comma separators.
 * Used in reports, dashboards, and displays.
 * @example formatIndianNumber(123456.5) => '1,23,456.5'
 */
export const formatIndianNumber = (v: number): string => {
    return v.toLocaleString("en-IN");
};

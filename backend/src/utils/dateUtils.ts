/**
 * Unified Date Calculation Utility
 * Handles month ranges, day start/end boundaries, and period parsing.
 */

export interface DateRange {
    startDate: Date;
    endDate: Date;
    daysInMonth?: number;
}

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

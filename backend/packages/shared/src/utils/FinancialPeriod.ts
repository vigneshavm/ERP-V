/**
 * Utility to calculate the financial period boundaries based on a custom start day.
 */
export class FinancialPeriod {
    /**
     * Calculates the start and end dates of the financial period containing the given date.
     * 
     * @param date The date to find the period for
     * @param monthStartDay The day of the month the period starts on (1-31)
     * @returns { startDate: Date, endDate: Date }
     */
    static getPeriod(date: Date, monthStartDay: number): { startDate: Date; endDate: Date } {
        const d = new Date(date);
        const year = d.getFullYear();
        const month = d.getMonth();
        const day = d.getDate();

        let startDate: Date;
        let endDate: Date;

        if (day >= monthStartDay) {
            // We are in the period starting in the current month
            startDate = new Date(year, month, monthStartDay);
            // End date is one month later, minus one day
            endDate = new Date(year, month + 1, monthStartDay - 1);
        } else {
            // We are in the period starting in the previous month
            startDate = new Date(year, month - 1, monthStartDay);
            // End date is in the current month, minus one day
            endDate = new Date(year, month, monthStartDay - 1);
        }

        // Handle cases where monthStartDay is 31 and the month has only 30 days
        // JavaScript Date constructor handles this by wrapping to next month, 
        // e.g., new Date(2023, 1, 31) becomes March 3rd.
        // We want it to be the last day of the month if the requested day doesn't exist.
        if (startDate.getDate() !== monthStartDay) {
            startDate = new Date(startDate.getFullYear(), startDate.getMonth(), 0);
        }
        
        // Similarly for endDate
        // If monthStartDay is 15, endDate day is 14. 14 always exists.
        // If monthStartDay is 1, endDate day is 0 (last day of previous month).
        
        return { startDate, endDate };
    }

    /**
     * Generates a list of last N financial periods ending with the current one.
     */
    static getRecentPeriods(count: number, monthStartDay: number): Array<{ startDate: Date; endDate: Date; label: string }> {
        const periods = [];
        let current = new Date();

        for (let i = 0; i < count; i++) {
            const period = this.getPeriod(current, monthStartDay);
            const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
            
            periods.push({
                ...period,
                label: `${monthNames[period.startDate.getMonth()]} ${period.startDate.getDate()} - ${monthNames[period.endDate.getMonth()]} ${period.endDate.getDate()}`
            });

            // Move current to before the start of this period to get the previous one
            current = new Date(period.startDate.getTime() - 24 * 60 * 60 * 1000);
        }

        return periods;
    }
}

import { CalendarTransaction, Category } from '@repo/shared';

export interface ForecastResult {
    currentSpent: number;
    projectedSpent: number;
    dailyAverage: number;
    daysRemaining: number;
    isOverBudget: boolean;
}

export interface CategoryTrend {
    categoryId: string;
    categoryName: string;
    spent: number;
    limit: number;
    projected: number;
    overBy: number;
}

/**
 * Calculates a linear forecast for the month based on current spending.
 */
export const calculateMonthlyForecast = (
    transactions: CalendarTransaction[],
    monthlyBudget: number
): ForecastResult => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const todayDate = now.getDate();

    // Get total days in current month
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const daysPassed = todayDate; // including today
    const daysRemaining = daysInMonth - daysPassed;

    // Filter transactions for current month
    const currentMonthTxns = transactions.filter(t => {
        const d = new Date(t.date);
        return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    });

    const currentSpent = currentMonthTxns.reduce((sum, t) => sum + t.amount, 0);
    const dailyAverage = currentSpent / daysPassed;
    const projectedSpent = currentSpent + (dailyAverage * daysRemaining);

    return {
        currentSpent,
        projectedSpent,
        dailyAverage,
        daysRemaining,
        isOverBudget: projectedSpent > monthlyBudget
    };
};

/**
 * Analyzes categories to find those likely to exceed their limits.
 */
export const analyzeCategoryTrends = (
    transactions: CalendarTransaction[],
    categories: Category[]
): CategoryTrend[] => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const todayDate = now.getDate();
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const daysRemaining = daysInMonth - todayDate;

    return categories
        .filter(cat => (cat.limit ?? 0) > 0)
        .map(cat => {
            const catTxns = transactions.filter(t => {
                const d = new Date(t.date);
                return t.categoryId === cat.id && d.getMonth() === currentMonth && d.getFullYear() === currentYear;
            });

            const limit = cat.limit ?? 0;
            const spent = catTxns.reduce((sum, t) => sum + t.amount, 0);
            const dailyAvg = spent / todayDate;
            const projected = spent + (dailyAvg * daysRemaining);
            const overBy = Math.max(0, projected - limit);

            return {
                categoryId: cat.id,
                categoryName: cat.name,
                spent,
                limit,
                projected,
                overBy
            };
        })
        .filter(trend => trend.projected > trend.limit)
        .sort((a, b) => b.overBy - a.overBy);
};

/**
 * Simulates the impact of changing daily spend on a goal's completion date.
 */
export const simulateGoalImpact = (
    currentSavings: number,
    targetAmount: number,
    plannedDailySavings: number
): { reachDate: Date | null } => {
    if (plannedDailySavings <= 0) return { reachDate: null };

    const remaining = targetAmount - currentSavings;
    if (remaining <= 0) return { reachDate: new Date() };

    const daysToReach = Math.ceil(remaining / plannedDailySavings);
    const reachDate = new Date();
    reachDate.setDate(reachDate.getDate() + daysToReach);

    return { reachDate };
};

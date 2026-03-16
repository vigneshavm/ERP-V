import { api } from '@repo/shared';
import { StatsData } from '@repo/shared';

export const fetchStatsData = async (): Promise<StatsData> => {
    return api.get<StatsData>('/personal/expenses/expense-reports/stats');
};

export const fetchYearlyInsights = async (): Promise<any> => {
    return api.get('/personal/expenses/expense-reports/yearly-insights');
};

export const fetchReports = async (): Promise<any[]> => {
    return api.get<any[]>('/personal/expenses/expense-reports');
};

export const fetchRecurringBills = async (): Promise<any[]> => {
    return api.get<any[]>('/personal/expenses/recurring-expenses');
};


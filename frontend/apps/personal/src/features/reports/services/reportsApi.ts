import { api } from '@repo/shared';
import { StatsData } from '@repo/shared';

export const fetchStatsData = async (): Promise<StatsData> => {
    return api.get<StatsData>('/personal/reports/stats');
};

export const fetchYearlyInsights = async (): Promise<any> => {
    return api.get('/personal/reports/yearly-insights');
};

export const fetchReports = async (): Promise<any[]> => {
    return api.get<any[]>('/personal/reports');
};

export const fetchRecurringBills = async (): Promise<any[]> => {
    return api.get<any[]>('/personal/reports/recurring-bills');
};


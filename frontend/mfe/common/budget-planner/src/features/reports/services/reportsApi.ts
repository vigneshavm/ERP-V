import { appData, delay } from '../../../services/mockState';
import { StatsData } from '@repo/shared';

export const fetchStatsData = async (): Promise<StatsData> => {
    await delay(500);
    return {
        stats: appData.stats,
        categories: appData.categories as any[]
    };
};

export const fetchYearlyInsights = async (): Promise<any> => {
    await delay(500);
    return appData.yearlyInsights;
};

export const fetchReports = async (): Promise<any[]> => {
    await delay(500);
    return appData.reports || [];
};

export const fetchRecurringBills = async (): Promise<any[]> => {
    await delay(500);
    return appData.recurringBills;
};

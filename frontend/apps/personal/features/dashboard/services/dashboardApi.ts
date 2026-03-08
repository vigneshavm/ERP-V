import { appData, delay, smsMockMessages } from '../../../services/mockState';
import { DashboardData } from '@repo/shared';

export const fetchDashboardData = async (): Promise<DashboardData> => {
    await delay(500);
    return {
        profile: appData.profile,
        smsTransfers: {
            ...appData.smsTransfers,
            pendingCount: smsMockMessages.length
        },
        monthlySummaries: appData.monthlySummaries
    };
};

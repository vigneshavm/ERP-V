import { appData, delay } from '../../../services/mockState';

export const fetchNotifications = async (): Promise<any[]> => {
    await delay(500);
    return appData.notifications || [];
};

export const checkAnomaly = async (amount: number, category: string): Promise<any> => {
    await delay(300);
    // Simple mock logic
    if (amount > 10000) {
        return { isAnomaly: true, reason: 'High spending in ' + category };
    }
    return { isAnomaly: false };
};

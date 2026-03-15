import { api } from '@repo/shared';

export const fetchNotifications = async (): Promise<any[]> => {
    return api.get<any[]>('/personal/notifications');
};

export const checkAnomaly = async (amount: number, category: string): Promise<any> => {
    return api.post('/personal/notifications/check-anomaly', { amount, category });
};


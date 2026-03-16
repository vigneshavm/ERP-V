import { api } from '@repo/shared';

export const fetchNotifications = async (): Promise<{ success: boolean; data: any[]; unreadCount: number }> => {
    return api.get<{ success: boolean; data: any[]; unreadCount: number }>('/personal/notifications');
};

export const checkAnomaly = async (amount: number, category: string): Promise<any> => {
    return api.post('/personal/notifications/check-anomaly', { amount, category });
};


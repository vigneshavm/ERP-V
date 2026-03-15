import { api } from '@repo/shared';
import { DashboardData } from '@repo/shared';

export const fetchDashboardData = async (): Promise<DashboardData> => {
    return api.get<DashboardData>('/personal/dashboard');
};


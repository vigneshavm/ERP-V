import { logger } from '@/shared/lib/logger';
import api from '@/shared/api/api';

/**
 * Onboarding Data Queries
 * Recreated from git history to restore functionality lost during FSD migration.
 */

export const fetchTenantsRaw = async () => {
    try {
        const { data } = await api.get('/business/profile');
        if (data && data.success && data.data) {
            const profile = data.data;
            const tenant = {
                id: profile._id || profile.userId,
                name: profile.businessName,
                isActive: true,
                companyDetails: {
                    phone: profile.phone,
                    email: profile.email,
                    addressLine1: profile.address
                },
                modules: ['POS', 'INVENTORY', 'FINANCE'],
                locations: []
            };
            return [tenant];
        }
        return [];
    } catch (error) {
        logger.error("Failed to fetch tenants from API", error);
        return [];
    }
};

export const fetchBranchesRaw = async (tenantId: string | null) => {
    try {
        const { data } = await api.get('/branches');
        if (data && data.success && Array.isArray(data.data)) {
            return data.data;
        }
        return [];
    } catch (error) {
        logger.error("Failed to fetch branches", error);
        return [];
    }
};

export const fetchEmployeesRaw = async (tenantId: string | null) => {
    try {
        const { data } = await api.get('/users');
        if (data && data.success && Array.isArray(data.data)) {
            return data.data;
        }
        return [];
    } catch (error) {
        logger.error("Failed to fetch employees", error);
        return [];
    }
};

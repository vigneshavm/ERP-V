/**
 * Registration Utility
 * Migrated from utils/registrationUtil to FSD: features/tenant-onboarding/lib/registrationUtil
 */

import api from '@/shared/api/api';

export interface RegistrationData {
    businessName: string;
    businessType: string;
    sector: string;
    city: string;
    state: string;
    modules: string[];
    adminName: string;
    adminEmail: string;
    adminMobile: string;
    adminPassword: string;
    preferredLogin: 'email' | 'mobile';
    employeeCount: number;
    branchCount: number;
}

export const registrationUtil = {
    async registerTenant(data: RegistrationData) {
        const response = await api.post('/api/tenants/register', {
            business: {
                name: data.businessName,
                type: data.businessType,
                sector: data.sector,
                location: { city: data.city, state: data.state },
            },
            modules: data.modules,
            admin: {
                name: data.adminName,
                email: data.adminEmail,
                mobile: data.adminMobile,
                password: data.adminPassword,
                preferredLogin: data.preferredLogin,
            },
            capacity: {
                employees: data.employeeCount,
                branches: data.branchCount,
            }
        });
        return response.data;
    }
};

import api from "../services/api.js";
import { DATA_MODE } from "../services/dataSource";
import { demoDB } from '../data/demo';

export const fetchTenantsRaw = async () => {
    if (DATA_MODE === 'DEMO') {
        return demoDB.tenants;
    }
    // Fetch from Node.js API
    try {
        const { data } = await api.get('/business/profile');
        if (data && data.success && data.data) {
            // Map BusinessProfile to Tenant structure
            // The frontend expects an array of tenants
            const profile = data.data;
            const tenant = {
                id: profile._id || profile.userId, // Use _id or userId
                name: profile.businessName,
                isActive: true,
                // Map other fields as best as possible
                companyDetails: {
                    phone: profile.phone,
                    email: profile.email,
                    addressLine1: profile.address
                },
                modules: ['POS', 'INVENTORY', 'FINANCE'], // Default modules for now
                locations: [] // Needs branch fetching
            };
            return [tenant];
        }
        return [];
    } catch (error) {
        console.error("Failed to fetch tenants from API", error);
        return [];
    }
};

export const fetchBranchesRaw = async (tenantId: string | null) => {
    if (DATA_MODE === 'DEMO') {
        const branches = demoDB.branches;
        return tenantId ? branches.filter(b => b.tenantId === tenantId) : branches;
    }
    try {
        // Assuming backend has /api/branches endpoint
        const { data } = await api.get('/branches');
        if (data && data.success && Array.isArray(data.data)) {
            return data.data;
        }
        return [];
    } catch (error) {
        console.error("Failed to fetch branches", error);
        return [];
    }
};

export const fetchEmployeesRaw = async (tenantId: string | null) => {
    if (DATA_MODE === 'DEMO') {
        const users = demoDB.employees;
        return tenantId ? users.filter(u => u.tenantId === tenantId) : users;
    }
    try {
        // Assuming backend has /api/users endpoint
        const { data } = await api.get('/users');
        if (data && data.success && Array.isArray(data.data)) {
            return data.data;
        }
        return [];
    } catch (error) {
        console.error("Failed to fetch employees", error);
        return [];
    }
};

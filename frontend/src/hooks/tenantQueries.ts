import api from "../services/api";

export const fetchTenantsRaw = async () => {
    // Fetch from Node.js API
    try {
        const { data } = await api.get('/api/business/profile');
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
    try {
        // Assuming backend has /api/branches endpoint
        const { data } = await api.get('/api/branches');
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
    try {
        // Assuming backend has /api/users endpoint
        const { data } = await api.get('/api/users');
        if (data && data.success && Array.isArray(data.data)) {
            return data.data;
        }
        return [];
    } catch (error) {
        console.error("Failed to fetch employees", error);
        return [];
    }
};

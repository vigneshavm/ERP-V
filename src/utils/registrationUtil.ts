import { Tenant, TenantUser, Branch } from '../types/tenant';
import { Sector, SystemRole } from '../types/common';
import { normalizeModules, DEFAULT_TENANT_MODULES } from './entitlementUtil';

const DYNAMIC_DATA_KEY = 'DYNAMIC_DEMO_DATA';

interface DynamicData {
    tenants: Tenant[];
    branches: Branch[];
    employees: TenantUser[];
}

export const registrationUtil = {
    /**
     * Get dynamic data from localStorage
     */
    loadDynamicData: (): DynamicData => {
        const stored = localStorage.getItem(DYNAMIC_DATA_KEY);
        if (stored) {
            try {
                return JSON.parse(stored);
            } catch (e) {
                console.error("Failed to parse dynamic data", e);
            }
        }
        return { tenants: [], branches: [], employees: [] };
    },

    /**
     * Save dynamic data to localStorage
     */
    saveDynamicData: (data: DynamicData) => {
        localStorage.setItem(DYNAMIC_DATA_KEY, JSON.stringify(data));
    },

    /**
     * Register a new tenant with initial admin and branch
     */
    registerTenant: (details: {
        businessName: string;
        businessType: string;
        sector: string;
        city: string;
        state: string;
        modules: string[];
        adminName: string;
        adminEmail?: string;
        adminMobile?: string;
        adminPassword?: string;
        preferredLogin: 'email' | 'mobile';
        employeeCount: number;
        branchCount: number;
    }): { tenant: Tenant, admin: TenantUser } => {
        const dynamicData = registrationUtil.loadDynamicData();

        // Normalize and Deduplicate Modules
        let canonicalModules = normalizeModules(details.modules);

        // Validation Guard: If no modules resolved, use defaults to prevent blank UI
        if (canonicalModules.length === 0) {
            console.warn("[Signup] No valid modules resolved for tenant, falling back to defaults.");
            canonicalModules = DEFAULT_TENANT_MODULES;
        }

        // 1. Create Tenant
        const tenantId = `TEN_${Date.now()}`;
        const newTenant: Tenant = {
            id: tenantId,
            name: details.businessName,
            businessType: details.businessType,
            sector: details.sector as Sector,
            modules: canonicalModules as any[],
            isActive: true,
            companyDetails: {
                addressLine1: `${details.city}, ${details.state}`,
                city: details.city,
                state: details.state,
                stateCode: 'IN', // Default
                country: 'India',
                pincode: '000000',
                phone: details.adminMobile || '',
                email: details.adminEmail || ''
            }
        };

        // 2. Create Primary Branch
        const branchId = `BR_${Date.now()}`;
        const mainBranch: Branch = {
            id: branchId,
            tenantId: tenantId,
            name: 'Main Branch',
            city: details.city,
            address: `${details.city}, ${details.state}`,
            sector: details.sector as Sector,
            code: 'MAIN'
        };

        // 3. Create Admin User
        const adminId = `USR_${Date.now()}`;
        const adminUser: TenantUser = {
            id: adminId,
            tenantId: tenantId,
            fullName: details.adminName,
            name: details.adminName,
            email: details.adminEmail,
            mobile: details.adminMobile,
            role: 'Owner',
            systemRole: 'Owner',
            branchId: branchId,
            sector: details.sector as Sector,
            password: details.adminPassword || 'password123' // Mock password
        } as any; // Cast to bypass strict password type if needed in future

        // 4. Persistence
        dynamicData.tenants.push(newTenant);
        dynamicData.branches.push(mainBranch);
        dynamicData.employees.push(adminUser);

        // Add skeleton branches if branchCount > 1
        for (let i = 1; i < details.branchCount; i++) {
            dynamicData.branches.push({
                id: `BR_${Date.now()}_${i}`,
                tenantId: tenantId,
                name: `Branch ${i + 1}`,
                city: details.city,
                address: details.city,
                sector: details.sector as Sector,
                code: `BR${i + 1}`
            });
        }

        registrationUtil.saveDynamicData(dynamicData);

        return { tenant: newTenant, admin: adminUser };
    }
};

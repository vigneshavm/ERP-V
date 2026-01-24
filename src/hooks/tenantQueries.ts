import { getTable } from '../services/dataSource';

export const fetchTenantsRaw = async () => {
    return await getTable('tenants', {
        select: `
            *,
            tenant_business_info (*),
            tenant_company_details (*),
            tenant_tax_details (*),
            tenant_banking_details (*),
            tenant_system_config (*),
            tenant_integrations (*),
            tenant_active_modules (
                system_modules (
                    code
                )
            )
        `
    });
};

export const fetchBranchesRaw = async (tenantId: string | null) => {
    return await getTable('branches', {
        filters: tenantId ? { tenant_id: tenantId } : undefined
    });
};

export const fetchEmployeesRaw = async (tenantId: string | null) => {
    return await getTable('tenant_users', {
        select: '*, role:roles(code, description)',
        filters: tenantId ? { tenant_id: tenantId } : undefined
    });
};

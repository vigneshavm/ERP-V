import { supabase } from '../lib/supabase';
import { APP_CONFIG } from '../config';

export const fetchTenantsRaw = async () => {
    if (!supabase) return [];
    const { data, error } = await supabase.from('tenants').select(`
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
    `);
    if (error) throw error;
    return data || [];
};

export const fetchBranchesRaw = async (tenantId: string | null) => {
    if (!supabase) return [];
    let query = supabase.from('branches').select('*');
    if (tenantId) query = query.eq('tenant_id', tenantId);
    const { data, error } = await query;
    if (error) throw error;
    return data || [];
};

export const fetchEmployeesRaw = async (tenantId: string | null) => {
    if (!supabase) return [];
    let query = supabase.from('tenant_users').select('*, role:roles(code, description)');
    if (tenantId) query = query.eq('tenant_id', tenantId);
    const { data, error } = await query;
    if (error) throw error;
    return data || [];
};

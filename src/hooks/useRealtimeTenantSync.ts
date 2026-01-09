import { useEffect } from 'react';
import { supabase } from '../lib/supabase';

export const useRealtimeTenantSync = (tenantId: string | undefined, onSync: () => void) => {
    useEffect(() => {
        if (!supabase) return;

        const tenantTables = [
            'tenants',
            'tenant_business_info',
            'tenant_company_details',
            'tenant_tax_details',
            'tenant_banking_details',
            'tenant_system_config',
            'tenant_integrations'
        ];

        const tenantChannels = tenantTables.map(tableName => {
            return supabase
                .channel(`public:${tableName}`)
                .on('postgres_changes', {
                    event: '*',
                    schema: 'public',
                    table: tableName,
                    filter: (tableName !== 'tenants' && tenantId) ? `tenant_id=eq.${tenantId}` : undefined
                }, () => {
                    onSync();
                })
                .subscribe();
        });

        return () => {
            tenantChannels.forEach(channel => supabase.removeChannel(channel));
        };
    }, [tenantId, onSync]);
};

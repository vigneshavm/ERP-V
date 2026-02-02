import { useEffect } from 'react';
// Supabase realtime removed

export const useRealtimeTenantSync = (tenantId: string | undefined, onSync: () => void) => {
    // No-op for now as Supabase realtime is removed
    useEffect(() => {
        // console.log("Realtime sync disabled.");
    }, [tenantId, onSync]);
};

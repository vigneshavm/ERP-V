import { useState } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../redux/store';
import { useTenantData } from './useTenantData';
import { useProductSync } from './useProductSync';
import { useFinanceSync } from './useFinanceSync';
import { useSalesSync } from './useSalesSync';
import { usePurchaseSync } from './usePurchaseSync';
import { useHRData } from './useHRData';
import { useVisualPreferences } from './useVisualPreferences';

/**
 * Orchestrator Hook for MongoDB/REST data synchronization.
 * Splits logic into domain-specific hooks for better maintainability and performance.
 */
export const useDBDataSync = () => {
    const { user } = useSelector((state: RootState) => state.auth);
    // Ensure tenantId is a string, even if user object has full tenant populated
    const tenantId = user?.tenantId && typeof user.tenantId === 'object'
        ? (user.tenantId as any)._id
        : user?.tenantId;

    const [loading] = useState(false);
    const [error] = useState<string | null>(null);

    // 1. Fetch Tenant & Branch Master Data (Requires user ID for session repair)
    useTenantData(user);

    // 2. Domain-specific sync hooks (Only run when tenantId is available)
    useProductSync(tenantId);
    useSalesSync(tenantId);
    useFinanceSync(tenantId);
    useHRData(tenantId);
    usePurchaseSync(tenantId);
    useVisualPreferences(tenantId, user?.id);

    return { loading, error };
};

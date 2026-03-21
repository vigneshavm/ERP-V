import { useAuthStore } from '@repo/shared';
import { useState, useEffect } from 'react';
import { useTenantData } from '@/features/tenant-onboarding/lib/useTenantData';
import { useProductSync } from './useProductSync';
import { useFinanceSync } from './useFinanceSync';
import { useSalesSync } from './useSalesSync';
import { usePurchaseSync } from './usePurchaseSync';
import { useVisualPreferences } from '@/features/tenant-onboarding/lib/useVisualPreferences';

/**
 * Orchestrator Hook for MongoDB/REST data synchronization.
 *
 * FIX 5: Domain sync hooks are deferred by SYNC_DELAY_MS after mount so they
 * do not race with the critical render path. Tenant data is fetched
 * immediately (it is needed for routing), but the heavier domain syncs
 * (products, sales, finance, purchase) wait until the UI is interactive.
 *
 * This removes the 5-parallel-request flood that previously hit the network
 * before the first frame was painted.
 */

const SYNC_DELAY_MS = 800; // defer domain syncs until after first paint

export const useDBDataSync = () => {
  const { user } = useAuthStore();

  const tenantId = user?.tenantId && typeof user.tenantId === 'object'
    ? (user.tenantId as any)._id
    : user?.tenantId;

  const [loading] = useState(false);
  const [error] = useState<string | null>(null);

  // FIX 5: Gate that flips true after SYNC_DELAY_MS. All domain sync hooks
  // receive null until this fires, so they stay idle during first render.
  const [syncReady, setSyncReady] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setSyncReady(true), SYNC_DELAY_MS);
    return () => clearTimeout(timer);
  }, []);

  // Tenant & branch master data — needed immediately for routing, not deferred.
  useTenantData(user);

  // Domain-specific syncs — deferred until UI is interactive.
  const deferredTenantId = syncReady ? tenantId : null;
  useProductSync(deferredTenantId);
  useSalesSync(deferredTenantId);
  useFinanceSync(deferredTenantId);
  usePurchaseSync(deferredTenantId);
  useVisualPreferences(syncReady ? tenantId : undefined, syncReady ? user?.id : undefined);

  return { loading, error };
};

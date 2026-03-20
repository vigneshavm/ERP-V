import { useAuthStore } from '@repo/shared';
import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { RootState, useAppDispatch } from '@/app/store/store';
import { useUiStore } from '@/shared/lib/store/uiStore';
import { useDBDataSync } from '@/widgets/sync-manager/lib/useDBDataSync';
import { getSession, clearSession } from '@/shared/lib/utils/session';
import { APP_CONFIG } from '@/app/config';
import { logger } from '@/shared/lib/logger';
import type { Tenant } from '@/entities/session/model/core';
import { setUser, getProfile } from '@/entities/session/model/authSlice';
import { setActiveTenantId } from '@/entities/session/model/tenantSlice';

type ViewMode = 'LANDING' | 'ADMIN' | 'TENANT';

export const useAppBootstrap = () => {
  const dispatch = useAppDispatch();
  const { user, role } = useAuthStore();
  const { tenants } = useSelector((s: RootState) => s.tenant);
  const { isSyncing } = useUiStore();

  useDBDataSync();

  const [viewMode, setViewMode] = useState<ViewMode>(
    () => getSession() ? 'TENANT' : 'LANDING'
  );
  const [currentTenant, setCurrentTenant] = useState<Tenant | null>(null);

  // FIX 4: Read cached tenant from localStorage synchronously so isResolving
  // starts as false when we already know the tenant. This eliminates the
  // full-screen LoadingScreen flash on every navigation for returning users.
  // isResolving only stays true when there is genuinely no cached context.
  const [isResolving, setIsResolving] = useState<boolean>(() => {
    if (!APP_CONFIG?.REQUIRE_TENANT_ID) return false;
    if (typeof window === 'undefined') return true;
    const cached = localStorage.getItem('erp_current_tenant');
    if (cached) {
      dispatch(setActiveTenantId(cached));
    }
    // If we have a cached tenant id we can optimistically skip the loading
    // screen — the tenant list will confirm it asynchronously.
    return !cached;
  });

  // Restore session from storage on mount
  useEffect(() => {
    const sessionUser = getSession();
    if (sessionUser) {
      try {
        dispatch(setUser(sessionUser));
      } catch (e) {
        logger.error('Failed to restore session', e);
        clearSession();
      }
    }
  }, [dispatch]);

  // Fetch profile once token is available
  useEffect(() => {
    if (user?.token) {
      dispatch(getProfile());
    }
  }, [dispatch, user?.token]);

  // Resolve active tenant from stored preference or deploy config.
  // FIX 4: If we already resolved optimistically above (isResolving=false),
  // this effect still runs to confirm and update the tenant object, but the
  // UI is not blocked waiting for it.
  useEffect(() => {
    const storedId = localStorage.getItem('erp_current_tenant');

    if (tenants.length > 0) {
      if (storedId) {
        const restored = tenants.find(t => t.id === storedId);
        if (restored) {
          setCurrentTenant(restored);
          dispatch(setActiveTenantId(restored.id));
          setViewMode('TENANT');
        }
      } else if (
        APP_CONFIG?.REQUIRE_TENANT_ID &&
        APP_CONFIG?.DEPLOY_TENANT_ID &&
        viewMode === 'LANDING'
      ) {
        const t = tenants.find(t => t.id === APP_CONFIG.DEPLOY_TENANT_ID);
        if (t) {
          setCurrentTenant(t);
          dispatch(setActiveTenantId(t.id));
          setViewMode('TENANT');
        }
      }
      setIsResolving(false);
    } else if (!APP_CONFIG?.REQUIRE_TENANT_ID) {
      setIsResolving(false);
    }
  }, [tenants, viewMode]);

  // Global 401 handler — force logout on any unauthorized API response
  useEffect(() => {
    const handle = () => {
      clearSession();
      dispatch(setUser(null));
      setViewMode('LANDING');
      logger.info('Force logout triggered by API 401');
    };
    window.addEventListener('auth:unauthorized', handle);
    return () => window.removeEventListener('auth:unauthorized', handle);
  }, [dispatch]);

  return {
    viewMode,
    isResolving,
    currentTenant,
    role,
    user,
    handlers: {
      setViewMode,
      setCurrentTenant,
      setIsLoggedIn: (val: boolean) => {
        if (!val) {
          clearSession();
          dispatch(setUser(null));
          setViewMode('LANDING');
        }
      },
    },
  };
};

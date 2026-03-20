import { logger } from '@/shared/lib/logger';
import { Middleware } from '@reduxjs/toolkit';
import { saveState } from '../storage';

// Keys to persist and their slice names
const PERSIST_KEYS: Record<string, string> = {
    inventory: 'inventory',
    pos: 'pos',
    finance: 'finance',
    labor: 'labor',
    purchase: 'purchase'
};

const saveTimeouts: Record<string, NodeJS.Timeout> = {};

export const persistenceMiddleware: Middleware = (store) => (next) => (action) => {
    const result = next(action);
    const state = store.getState();

    // Check if the action belongs to a slice that needs persistence
    const actionType = (action as any).type || '';
    const sliceName = actionType.split('/')[0];

    if (PERSIST_KEYS[sliceName]) {
        if (saveTimeouts[sliceName]) {
            clearTimeout(saveTimeouts[sliceName]);
        }

        saveTimeouts[sliceName] = setTimeout(() => {
            const tenantId = (state.tenant as any).activeTenantId || state.auth.user?.tenantId;
            logger.info(`[Persistence] Debounced save for slice: ${sliceName} (Tenant: ${tenantId || 'None'})`);
            saveState(PERSIST_KEYS[sliceName], state[sliceName], tenantId);
            delete saveTimeouts[sliceName];
        }, 1000); // 1s debounce
    }

    return result;
};


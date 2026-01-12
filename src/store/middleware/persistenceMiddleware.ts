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

let saveTimeout: NodeJS.Timeout | null = null;

export const persistenceMiddleware: Middleware = (store) => (next) => (action) => {
    const result = next(action);
    const state = store.getState();

    // Check if the action belongs to a slice that needs persistence
    const actionType = (action as any).type || '';
    const sliceName = actionType.split('/')[0];

    if (PERSIST_KEYS[sliceName]) {
        if (saveTimeout) clearTimeout(saveTimeout);

        saveTimeout = setTimeout(() => {
            const tenantId = state.auth.user?.tenantId;
            console.log(`[Persistence] Debounced save for slice: ${sliceName} (Tenant: ${tenantId || 'None'})`);
            saveState(PERSIST_KEYS[sliceName], state[sliceName], tenantId);
        }, 1000); // 1s debounce
    }

    return result;
};

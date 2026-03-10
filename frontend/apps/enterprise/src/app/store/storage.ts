import { APP_CONFIG } from "@/app/config";

export const loadState = <T>(key: string, defaultState: T, tenantId?: string): T => {
    try {
        const partitionKey = tenantId ? `${tenantId}_${key}` : key;
        const serialized = localStorage.getItem(partitionKey);
        if (serialized) {
            const loadedState = JSON.parse(serialized);
            return { ...defaultState, ...loadedState };
        }
        // If no local storage, and DEMO mode is on, return mock data merged with default structure
        if (APP_CONFIG.IS_DEMO) {
            return defaultState;
        }
        return defaultState;
    } catch {
        return defaultState;
    }
};

export const saveState = <T>(key: string, state: T, tenantId?: string): void => {
    try {
        const partitionKey = tenantId ? `${tenantId}_${key}` : key;
        localStorage.setItem(partitionKey, JSON.stringify(state));
    } catch (e) {
        console.warn("Could not save state", e);
    }
};

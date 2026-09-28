export const loadState = <T>(key: string, defaultState: T, tenantId?: string): T => {
    try {
        const partitionKey = tenantId ? `${tenantId}_${key}` : key;
        const serialized = localStorage.getItem(partitionKey);
        if (serialized) {
            const loadedState = JSON.parse(serialized);
            return { ...defaultState, ...loadedState };
        }
        // Nothing saved yet: start from the empty default state (never sample data, in demo mode or not).
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

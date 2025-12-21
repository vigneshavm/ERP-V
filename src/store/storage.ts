import { APP_CONFIG } from '../config';

export const loadState = (key: string, defaultState: any) => {
    try {
        const serialized = localStorage.getItem(key);
        if (serialized) {
            return JSON.parse(serialized);
        }
        // If no local storage, and DEMO mode is on, return mock data merged with default structure
        if (APP_CONFIG.IS_DEMO) {
            return defaultState;
        }
        return defaultState;
    } catch (e) {
        return defaultState;
    }
};

export const saveState = (key: string, state: any) => {
    try {
        localStorage.setItem(key, JSON.stringify(state));
    } catch (e) {
        console.warn("Could not save state", e);
    }
};

import { User } from '@/entities/session/model/authSlice';

export const getSession = (): User | null => {
    if (typeof window === 'undefined') return null;
    const stored = localStorage.getItem('user');
    if (!stored) return null;
    try {
        return JSON.parse(stored);
    } catch {
        return null;
    }
};

export const clearSession = () => {
    if (typeof window === 'undefined') return;
    localStorage.removeItem('user');
    localStorage.removeItem('erp_current_tenant');
    // Optional: clear other session related stuff
};

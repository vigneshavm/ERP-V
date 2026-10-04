import { useSyncExternalStore } from 'react';

/**
 * The salesperson chosen at the till: an employee code from the shop's staff list (Textilesoft dbo.newemployee),
 * sent with each bill and stored as the line's salesperson. Remembered per browser; empty = Textilesoft's default.
 */
const KEY = 'pos-salesperson-code';
let current = '';
try { current = window.localStorage.getItem(KEY) ?? ''; } catch { /* storage unavailable: keep in memory */ }
const listeners = new Set<() => void>();

export const getSalesperson = (): string => current;

export const setSalesperson = (code: string): void => {
    current = code;
    try { window.localStorage.setItem(KEY, code); } catch { /* ignore */ }
    listeners.forEach(l => l());
};

export const useSalesperson = (): [string, (code: string) => void] => {
    const value = useSyncExternalStore(
        (cb) => { listeners.add(cb); return () => { listeners.delete(cb); }; },
        getSalesperson,
        getSalesperson,
    );
    return [value, setSalesperson];
};

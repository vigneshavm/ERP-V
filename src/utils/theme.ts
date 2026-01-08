
export const THEME_KEY = 'erp_theme';

export type Theme = 'light' | 'dark' | 'system';

export const getStoredTheme = (): Theme | null => {
    const stored = localStorage.getItem(THEME_KEY);
    return (stored === 'light' || stored === 'dark' || stored === 'system') ? stored : null;
};

export const setStoredTheme = (theme: Theme) => {
    localStorage.setItem(THEME_KEY, theme);
    applyTheme(theme);
};

export const applyTheme = (theme: Theme) => {
    const root = document.documentElement;
    if (theme === 'system') {
        const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        if (isDark) {
            root.classList.add('dark');
        } else {
            root.classList.remove('dark');
        }
    } else if (theme === 'dark') {
        root.classList.add('dark');
    } else {
        root.classList.remove('dark');
    }
};

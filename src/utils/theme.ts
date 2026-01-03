
export const THEME_KEY = 'erp_theme';

export type Theme = 'light' | 'dark';

export const getStoredTheme = (): Theme | null => {
    const stored = localStorage.getItem(THEME_KEY);
    return (stored === 'light' || stored === 'dark') ? stored : null;
};

export const setStoredTheme = (theme: Theme) => {
    localStorage.setItem(THEME_KEY, theme);
    // Determine if we need to dispatch an event or rely on React state
    // For immediate effect outside React:
    if (theme === 'dark') {
        document.documentElement.classList.add('dark');
    } else {
        document.documentElement.classList.remove('dark');
    }
};

export const applyTheme = (theme: Theme) => {
    if (theme === 'dark') {
        document.documentElement.classList.add('dark');
    } else {
        document.documentElement.classList.remove('dark');
    }
};

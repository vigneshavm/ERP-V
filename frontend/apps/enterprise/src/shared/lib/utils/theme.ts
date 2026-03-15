export const THEME_KEY = 'erp_theme';

export type Theme = 'light' | 'dark' | 'system' | 'cyber' | 'gold' | 'neon';

export const getStoredTheme = (): Theme | null => {
    if (typeof window === 'undefined') return null;
    const stored = localStorage.getItem(THEME_KEY);
    return (['light', 'dark', 'system', 'cyber', 'gold', 'neon'] as Theme[]).includes(stored as Theme) ? (stored as Theme) : null;
};

export const setStoredTheme = (theme: Theme) => {
    if (typeof window === 'undefined') return;
    localStorage.setItem(THEME_KEY, theme);
    applyTheme(theme);
};

export const applyTheme = (theme: Theme) => {
    if (typeof window === 'undefined' || typeof document === 'undefined') return;
    const root = document.documentElement;
    
    // Standard system theme logic
    let activeTheme = theme;
    if (theme === 'system') {
        const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        activeTheme = isDark ? 'dark' : 'light';
    }

    // Set data-theme attribute (modern approach used by Personal MFE/Matrix)
    root.setAttribute('data-theme', activeTheme);
    
    // Legacy class support for Tailwind 'dark:' mode
    if (activeTheme === 'dark' || activeTheme === 'cyber' || activeTheme['includes']?.('gold')) {
        root.classList.add('dark');
        root.classList.remove('light');
    } else {
        root.classList.add('light');
        root.classList.remove('dark');
    }
};

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { getStoredTheme, setStoredTheme, applyTheme, Theme } from '@/shared/lib/utils/theme';

interface ThemeContextType {
    theme: Theme;
    setTheme: (theme: Theme) => void;
    toggleTheme: () => void;
    isDark: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
    children: ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
    const [theme, setThemeState] = useState<Theme>('dark'); // Default to dark for Matrix feel
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect -- TODO(TS-FIX): Phase 2/3 fix
        setIsMounted(true);
        const saved = getStoredTheme();
        if (saved) {
            setThemeState(saved);
            applyTheme(saved);
        } else {
            applyTheme('dark');
        }
    }, []);

    const setTheme = (newTheme: Theme) => {
        setThemeState(newTheme);
        setStoredTheme(newTheme);
    };

    const toggleTheme = () => {
        const nextTheme = theme === 'dark' ? 'light' : 'dark';
        setTheme(nextTheme);
    };

    const isDarkTheme = theme === 'dark' || theme === 'cyber' || theme === 'gold';

    const value: ThemeContextType = {
        theme,
        setTheme,
        toggleTheme,
        isDark: isDarkTheme,
    };

    // Prevent hydration mismatch by always rendering initial light/dark state
    // but applying classes only after mount if needed.
    // For Matrix, we often want dark anyway.
    return (
        <ThemeContext.Provider value={value}>
            <div className={isMounted ? '' : 'dark'}>
                {children}
            </div>
        </ThemeContext.Provider>
    );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useTheme = (): ThemeContextType => {
    const context = useContext(ThemeContext);
    if (context === undefined) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
};

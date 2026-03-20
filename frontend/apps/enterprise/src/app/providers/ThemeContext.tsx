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
        setIsMounted(true);
        const saved = getStoredTheme();
        const initialTheme = saved || 'dark';
        setThemeState(initialTheme);
        applyTheme(initialTheme);
        const root = window.document.documentElement;
        root.classList.remove('light', 'dark', 'cyber', 'gold');
        root.classList.add(initialTheme);
    }, []);

    const setTheme = (newTheme: Theme) => {
        setThemeState(newTheme);
        setStoredTheme(newTheme);
        applyTheme(newTheme);
        
        const root = window.document.documentElement;
        root.classList.remove('light', 'dark', 'cyber', 'gold');
        root.classList.add(newTheme);
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

    return (
        <ThemeContext.Provider value={value}>
            {children}
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

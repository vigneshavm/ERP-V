"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useUser } from '@repo/shared';

export type ThemeType = 'Dark' | 'Light' | 'System' | 'Cyber' | 'Gold';

interface UserProfile {
    name: string;
    initials: string;
}

interface SettingsContextType {
    theme: ThemeType;
    setTheme: (theme: ThemeType) => void;
    accentColor: string;
    setAccentColor: (color: string) => void;
    currency: string;
    setCurrency: (currency: string) => void;
    userProfile: UserProfile;
    setUserProfile: (profile: UserProfile | ((prev: UserProfile) => UserProfile)) => void;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    // Theme
    const [theme, setThemeState] = useState<ThemeType>('Dark');

    // Accent Color
    const [accentColor, setAccentColorState] = useState<string>('#F1C40F');

    // Currency
    const [currency, setCurrencyState] = useState<string>('INR');

    // User Profile
    const [userProfile, setUserProfileState] = useState<UserProfile>({ name: 'Amvic', initials: 'AV' });

    const { user, loading: userLoading, updateSettings } = useUser();

    // Initial load from localStorage and Adapter
    useEffect(() => {
        const savedTheme = localStorage.getItem('app-theme-preference') as ThemeType;
        if (savedTheme) setThemeState(savedTheme);

        const savedAccent = localStorage.getItem('app-accent-color');
        if (savedAccent) setAccentColorState(savedAccent);

        const savedCurrency = localStorage.getItem('app-currency');
        if (savedCurrency) setCurrencyState(savedCurrency);

        if (user) {
            setUserProfileState({
                name: user.name,
                initials: user.name.split(' ').map((n: string) => n[0]).join('').toUpperCase()
            });
        }
    }, [user]);

    // Persist and apply Theme
    const setTheme = (newTheme: ThemeType) => {
        setThemeState(newTheme);
        localStorage.setItem('app-theme-preference', newTheme);

        const appliedTheme = newTheme === 'System'
            ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
            : newTheme.toLowerCase();

        document.documentElement.setAttribute('data-theme', appliedTheme);
        localStorage.setItem('app-theme', appliedTheme);
    };

    // System theme listener
    useEffect(() => {
        if (theme === 'System') {
            const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
            const handleChange = (e: MediaQueryListEvent) => {
                document.documentElement.setAttribute('data-theme', e.matches ? 'dark' : 'light');
            };
            mediaQuery.addEventListener('change', handleChange);
            return () => mediaQuery.removeEventListener('change', handleChange);
        }
    }, [theme]);

    // Apply theme on mount/change
    useEffect(() => {
        const appliedTheme = theme === 'System'
            ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
            : theme.toLowerCase();
        document.documentElement.setAttribute('data-theme', appliedTheme);
    }, [theme]);

    // Persist and apply Accent Color
    const setAccentColor = (newColor: string) => {
        setAccentColorState(newColor);
        localStorage.setItem('app-accent-color', newColor);
        document.documentElement.style.setProperty('--primary-color', newColor);
    };

    useEffect(() => {
        document.documentElement.style.setProperty('--primary-color', accentColor);
    }, [accentColor]);

    // Persist Currency
    const setCurrency = (newCurrency: string) => {
        setCurrencyState(newCurrency);
        localStorage.setItem('app-currency', newCurrency);
    };

    // Persist User Profile
    const setUserProfile = (profileOrUpdater: UserProfile | ((prev: UserProfile) => UserProfile)) => {
        setUserProfileState(prev => {
            const newProfile = typeof profileOrUpdater === 'function' ? profileOrUpdater(prev) : profileOrUpdater;
            localStorage.setItem('app-user-profile', JSON.stringify(newProfile));
            return newProfile;
        });
    };

    return (
        <SettingsContext.Provider value={{
            theme, setTheme,
            accentColor, setAccentColor,
            currency, setCurrency,
            userProfile, setUserProfile
        }}>
            {children}
        </SettingsContext.Provider>
    );
};

export const useSettings = () => {
    const context = useContext(SettingsContext);
    if (context === undefined) {
        throw new Error('useSettings must be used within a SettingsProvider');
    }
    return context;
};

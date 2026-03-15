"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { en } from './locales/en';
import { es } from './locales/es';
import { hi } from './locales/hi';
import { ta } from './locales/ta';

type Translations = Record<string, any>;

const locales: Record<string, { name: string; translations: Translations; flag: string }> = {
    'en': { name: 'English', translations: en, flag: '🇺🇸' },
    'es': { name: 'Español', translations: es, flag: '🇪🇸' },
    'hi': { name: 'Hindi', translations: hi, flag: '🇮🇳' },
    'ta': { name: 'தமிழ் (Tamil)', translations: ta, flag: '🇮🇳' },
};

interface LanguageContextType {
    language: string;
    setLanguage: (lang: string) => void;
    t: (key: string) => string;
    availableLanguages: Array<{ code: string; name: string; flag: string }>;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [language, setLanguageState] = useState<string>(() => {
        if (typeof window !== 'undefined') {
            return localStorage.getItem('appLanguage') || 'en';
        }
        return 'en';
    });

    const setLanguage = (lang: string) => {
        if (locales[lang]) {
            setLanguageState(lang);
            localStorage.setItem('appLanguage', lang);
        }
    };

    const t = (key: string): string => {
        const keys = key.split('.');
        let value: any = locales[language]?.translations || locales['en'].translations;

        for (const k of keys) {
            if (value && typeof value === 'object' && k in value) {
                value = value[k];
            } else {
                return key; // Fallback to key if not found
            }
        }

        return typeof value === 'string' ? value : key;
    };

    const availableLanguages = Object.entries(locales).map(([code, data]) => ({
        code,
        name: data.name,
        flag: data.flag
    }));

    // For language changes, we re-render naturally because of state change.

    return (
        <LanguageContext.Provider value={{ language, setLanguage, t, availableLanguages }}>
            {children}
        </LanguageContext.Provider>
    );
};

export const useLanguage = () => {
    const context = useContext(LanguageContext);
    if (context === undefined) {
        throw new Error('useLanguage must be used within a LanguageProvider');
    }
    return context;
};

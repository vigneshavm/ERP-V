import React, { useCallback, useState } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../redux/store';
import { LanguageContext } from './LanguageContext';
import { getStoredLanguage, setStoredLanguage, Language } from '../utils/language';
import { posTranslations, TranslationKey } from '../i18n/posTranslations';

interface LanguageProviderProps {
    children: React.ReactNode;
}

export const LanguageProvider: React.FC<LanguageProviderProps> = ({ children }) => {
    // Strategy mirrors ConfigProvider's theme resolution: the user's saved profile setting
    // (Settings -> Personalization, persisted server-side so it follows them across devices)
    // wins on initial load; localStorage is the fallback for when it's never been saved, and
    // is also what the POSHeader quick-toggle writes to for an immediate same-device override.
    const profileLanguage = useSelector((state: RootState) => state.auth.user?.language as Language | undefined);
    const [language, setLanguageState] = useState<Language>(() => profileLanguage || getStoredLanguage() || 'en');

    const setLanguage = useCallback((next: Language) => {
        setLanguageState(next);
        setStoredLanguage(next);
    }, []);

    const t = useCallback((key: TranslationKey) => posTranslations[language][key], [language]);

    return (
        <LanguageContext.Provider value={{ language, setLanguage, t }}>
            {children}
        </LanguageContext.Provider>
    );
};

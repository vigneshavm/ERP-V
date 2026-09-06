// Per-device POS UI language preference. Mirrors utils/theme.ts's storage pattern -- a plain
// localStorage-backed setting, not a full app-wide locale (see contexts/LanguageContext.tsx for
// why this is scoped to the POS/billing module rather than the whole app).
export const LANGUAGE_KEY = 'erp_pos_language';

export type Language = 'en' | 'ta';

export const getStoredLanguage = (): Language | null => {
    const stored = localStorage.getItem(LANGUAGE_KEY);
    return (stored === 'en' || stored === 'ta') ? stored : null;
};

export const setStoredLanguage = (language: Language) => {
    localStorage.setItem(LANGUAGE_KEY, language);
};

import { createContext, useContext } from 'react';
import { posTranslations, TranslationKey } from '../i18n/posTranslations';
import { Language } from '../utils/language';

export interface LanguageContextType {
    language: Language;
    setLanguage: (language: Language) => void;
    t: (key: TranslationKey) => string;
}

// Deliberately scoped to the POS/billing module (mirrors Textilesoft's GstSaleCashBillEntry
// "+Tamil language variant") rather than a full app-wide i18n system -- there is no translated
// content anywhere else in the app yet, so a global provider would be a promise this doesn't
// keep. See contexts/LanguageProvider.tsx (mounted at POSTemplateRegistry.tsx, not the app root).
export const LanguageContext = createContext<LanguageContextType>({
    language: 'en',
    setLanguage: () => {},
    t: (key) => posTranslations.en[key],
});

export const useLanguage = () => useContext(LanguageContext);

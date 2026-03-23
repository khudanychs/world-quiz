import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import enTranslation from './locales/en/translation.json';
import csTranslation from './locales/cs/translation.json';
import deTranslation from './locales/de/translation.json';

const resources = {
  en: { translation: enTranslation },
  cs: { translation: csTranslation },
  de: { translation: deTranslation }
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    supportedLngs: ['en', 'cs', 'de'],
    nonExplicitSupportedLngs: true,
    fallbackLng: 'en',
    detection: {
      order: ['path', 'querystring', 'localStorage', 'cookie', 'navigator', 'htmlTag'],
      lookupFromPathIndex: 0,
      caches: ['localStorage', 'cookie'],
      convertDetectedLanguage: (lng: string) => {
        const value = (lng || '').toLowerCase();
        if (value === 'cz') return 'cs';
        if (value.startsWith('cs')) return 'cs';
        if (value.startsWith('de')) return 'de';
        return 'en';
      },
    },
    interpolation: { escapeValue: false }
  });

export default i18n;

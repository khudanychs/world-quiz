import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import enTranslation from './locales/en/translation.json';
import csTranslation from './locales/cs/translation.json';
import deTranslation from './locales/de/translation.json';

function normalizeLanguageCode(input: string): 'en' | 'cs' | 'de' {
  const value = (input || '').toLowerCase();
  if (value === 'cz' || value.startsWith('cs')) return 'cs';
  if (value.startsWith('de')) return 'de';
  return 'en';
}

function migrateLegacyStoredLanguage(): void {
  if (typeof window === 'undefined') return;

  try {
    const stored = window.localStorage.getItem('i18nextLng');
    if (stored && stored.toLowerCase().startsWith('cz')) {
      window.localStorage.setItem('i18nextLng', 'cs');
    }

    const cookieMatch = document.cookie.match(/(?:^|;\s*)i18next=([^;]+)/i);
    const cookieValue = cookieMatch?.[1] || '';
    if (cookieValue.toLowerCase().startsWith('cz')) {
      document.cookie = 'i18next=cs; path=/; max-age=31536000';
    }
  } catch {
    // Ignore storage access errors; i18next fallback logic still works.
  }
}

const resources = {
  en: { translation: enTranslation },
  cs: { translation: csTranslation },
  de: { translation: deTranslation }
};

migrateLegacyStoredLanguage();

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    supportedLngs: ['en', 'cs', 'de'],
    nonExplicitSupportedLngs: true,
    fallbackLng: 'en',
    detection: {
      // Prioritize stored preference (localStorage, cookie) over URL path
      // This ensures back button respects the user's explicitly chosen language
      order: ['localStorage', 'cookie', 'path', 'querystring', 'navigator', 'htmlTag'],
      lookupFromPathIndex: 2, // 'path' is now at index 2
      caches: ['localStorage', 'cookie'],
      convertDetectedLanguage: (lng: string) => normalizeLanguageCode(lng),
    },
    interpolation: { escapeValue: false }
  });

export default i18n;

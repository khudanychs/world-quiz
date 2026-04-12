import i18next from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

const i18n = i18next.createInstance();
const loadedLanguages = new Set<SupportedLanguage>();

type SupportedLanguage = 'en' | 'cs' | 'de';

function normalizeLanguageCode(input: string): SupportedLanguage {
  const value = (input || '').toLowerCase();
  if (value === 'cz' || value.startsWith('cs')) return 'cs';
  if (value.startsWith('de')) return 'de';
  return 'en';
}

async function loadTranslationBundle(language: SupportedLanguage): Promise<Record<string, unknown>> {
  if (language === 'cs') {
    const mod = await import('./locales/cs/translation.json');
    return mod.default as Record<string, unknown>;
  }

  if (language === 'de') {
    const mod = await import('./locales/de/translation.json');
    return mod.default as Record<string, unknown>;
  }

  const mod = await import('./locales/en/translation.json');
  return mod.default as Record<string, unknown>;
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

function getCookieValue(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(new RegExp(`(?:^|;\\s*)${name}=([^;]+)`));
  return match?.[1] ?? null;
}

function detectInitialLanguage(): SupportedLanguage {
  if (typeof window === 'undefined') return 'en';

  const prefix = window.location.pathname.split('/').filter(Boolean)[0] || '';
  if (prefix) {
    return normalizeLanguageCode(prefix);
  }

  const stored = window.localStorage.getItem('i18nextLng');
  if (stored) {
    return normalizeLanguageCode(stored);
  }

  const cookieLng = getCookieValue('i18next');
  if (cookieLng) {
    return normalizeLanguageCode(cookieLng);
  }

  return normalizeLanguageCode(window.navigator.language || 'en');
}

export async function ensureLanguageResources(languageInput: string): Promise<SupportedLanguage> {
  const language = normalizeLanguageCode(languageInput);
  if (loadedLanguages.has(language)) {
    return language;
  }

  const translation = await loadTranslationBundle(language);
  i18n.addResourceBundle(language, 'translation', translation, true, true);
  loadedLanguages.add(language);
  return language;
}

export async function changeAppLanguage(languageInput: string): Promise<void> {
  const language = await ensureLanguageResources(languageInput);
  if (normalizeLanguageCode(i18n.language) === language) {
    return;
  }
  await i18n.changeLanguage(language);
}

migrateLegacyStoredLanguage();

const initPromise = (async () => {
  const initialLanguage = detectInitialLanguage();
  const languagesToPrime = Array.from(new Set<SupportedLanguage>(['en', initialLanguage]));

  const resources: Record<string, { translation: Record<string, unknown> }> = {};
  for (const lang of languagesToPrime) {
    resources[lang] = { translation: await loadTranslationBundle(lang) };
    loadedLanguages.add(lang);
  }

  await i18n
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
      resources,
      lng: initialLanguage,
      supportedLngs: ['en', 'cs', 'de'],
      nonExplicitSupportedLngs: true,
      fallbackLng: 'en',
      partialBundledLanguages: true,
      detection: {
        order: ['path', 'localStorage', 'cookie', 'querystring', 'navigator', 'htmlTag'],
        lookupFromPathIndex: 0,
        caches: ['localStorage', 'cookie'],
        convertDetectedLanguage: (lng: string) => normalizeLanguageCode(lng),
      },
      interpolation: { escapeValue: false }
    });
})();

export function initI18n(): Promise<void> {
  return initPromise;
}

export default i18n;

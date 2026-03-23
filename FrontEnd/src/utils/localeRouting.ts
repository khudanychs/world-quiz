export const SUPPORTED_LOCALE_PREFIXES = ['en', 'cz', 'de'] as const;

export type LocalePrefix = (typeof SUPPORTED_LOCALE_PREFIXES)[number];

export function getBaseLanguage(language: string): 'en' | 'cs' | 'de' {
  const base = (language || 'en').toLowerCase().split('-')[0];
  if (base === 'cz') return 'cs';
  if (base === 'cs') return 'cs';
  if (base === 'de') return 'de';
  return 'en';
}

export function getLocalePrefixFromLanguage(language: string): LocalePrefix {
  const base = getBaseLanguage(language);
  if (base === 'cs') return 'cz';
  if (base === 'de') return 'de';
  return 'en';
}

export function getLanguageFromLocalePrefix(prefix: string): 'en' | 'cs' | 'de' | null {
  const value = (prefix || '').toLowerCase();
  if (value === 'en') return 'en';
  if (value === 'cz') return 'cs';
  if (value === 'de') return 'de';
  return null;
}

export function stripLocalePrefix(pathname: string): string {
  if (!pathname || pathname === '/') return '/';

  const parts = pathname.split('/').filter(Boolean);
  if (parts.length === 0) return '/';

  const first = parts[0].toLowerCase();
  if (!SUPPORTED_LOCALE_PREFIXES.includes(first as LocalePrefix)) {
    return pathname.startsWith('/') ? pathname : `/${pathname}`;
  }

  const rest = parts.slice(1);
  return rest.length === 0 ? '/' : `/${rest.join('/')}`;
}

export function buildLocalizedPath(path: string, language: string): string {
  const prefix = getLocalePrefixFromLanguage(language);
  const normalizedPath = stripLocalePrefix(path);
  return normalizedPath === '/' ? `/${prefix}` : `/${prefix}${normalizedPath}`;
}

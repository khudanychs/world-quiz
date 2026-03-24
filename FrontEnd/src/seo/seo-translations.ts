export const SEO_BASE_URL = "https://world-quiz.com";

const LOCALE_PREFIX_PATTERN = /^\/(en|de|cz|cs)(\/|$)/i;

function normalizePathInput(path: string): string {
  const value = (path || "/").trim();
  if (value.startsWith("http://") || value.startsWith("https://")) {
    const parsed = new URL(value);
    return parsed.pathname || "/";
  }
  return value.startsWith("/") ? value : `/${value}`;
}

function normalizeLocalePrefix(pathname: string): string {
  return pathname.replace(/^\/cs(\/|$)/i, "/cz$1");
}

function isLocalizedPath(pathname: string): boolean {
  return LOCALE_PREFIX_PATTERN.test(pathname);
}

function toLocalePrefix(language?: string): "en" | "de" | "cz" {
  const base = (language || "").toLowerCase().split("-")[0];
  if (base === "de") return "de";
  if (base === "cs" || base === "cz") return "cz";
  return "en";
}

export interface SEOEntry {
  title: string;
  description: string;
  path: string;
  ogImage?: string;
  noindex?: boolean;
}

export const SEO_TRANSLATIONS = {
  defaultOgImage: "/newtablogo.png",
  routes: {
    home: {
      title: "World Quiz - Test Your Geography Knowledge",
      description:
        "Challenge yourself with World Quiz: flags, country encyclopedia, physical geography, and global leaderboards.",
      path: "/",
    },
    leaderboards: {
      title: "World Quiz Leaderboards - Global Geography Rankings",
      description:
        "Track top scores in Flag Match and Cards Match. See daily and all-time World Quiz champions.",
      path: "/leaderboards",
    },
    map: {
      title: "Interactive World Map - Explore Countries and Capitals",
      description:
        "Explore a responsive world map with country flags, names, and capitals in World Quiz Explore mode.",
      path: "/map",
    },
    countries: {
      title: "Country Encyclopedia - World Quiz",
      description:
        "Browse country facts, capitals, population, area, languages, and neighboring countries in the World Quiz encyclopedia.",
      path: "/countries",
    },
    terms: {
      title: "Terms and Conditions - World Quiz",
      description:
        "Read the World Quiz terms and conditions, user responsibilities, and service rules.",
      path: "/terms",
    },
    privacy: {
      title: "Privacy Policy - World Quiz",
      description:
        "Learn how World Quiz collects, processes, and protects personal data under GDPR and applicable law.",
      path: "/privacy",
    },
    notFound: {
      title: "Page Not Found - World Quiz",
      description:
        "The page you are looking for does not exist in World Quiz.",
      path: "/404",
      noindex: true,
    },
    shapeMatch: {
      title: "Cards Match Game - Flags, Countries, Capitals and Shapes",
      description:
        "Play Cards Match in World Quiz and match flags, countries, capitals, and shapes before time runs out.",
      path: "/game/shape-match",
    },
    auth: {
      title: "Account Access - World Quiz",
      description:
        "Sign in or create a World Quiz account.",
      path: "/auth",
      noindex: true,
    },
    setNickname: {
      title: "Choose Nickname - World Quiz",
      description:
        "Set your World Quiz nickname to continue.",
      path: "/set-nickname",
      noindex: true,
    },
    settings: {
      title: "Account Settings - World Quiz",
      description:
        "Manage your World Quiz account settings and profile.",
      path: "/settings",
      noindex: true,
    },
  } satisfies Record<string, SEOEntry>,
};

/**
 * Convert a path to a full canonical URL without language prefix.
 * @deprecated Use toCanonicalUrlWithLanguage instead for multi-language sites
 */
export function toCanonicalUrl(path: string): string {
  return new URL(path, SEO_BASE_URL).toString();
}

/**
 * Convert a path to a full canonical URL for a localized SPA.
 *
 * Rules:
 * - Localized routes canonicalize to themselves.
 * - Non-localized routes canonicalize to the current language variant.
 * - If current language is unavailable, fallback is English (`/en/...`).
 * - Root path canonicalizes to the current language root, with English fallback.
 *
 * Examples:
 * - toCanonicalUrlWithLanguage('/cz/countries') => https://world-quiz.com/cz/countries
 * - toCanonicalUrlWithLanguage('/de/countries') => https://world-quiz.com/de/countries
 * - toCanonicalUrlWithLanguage('/countries', 'cs') => https://world-quiz.com/cz/countries
 * - toCanonicalUrlWithLanguage('/') => https://world-quiz.com/en/
 */
export function toCanonicalUrlWithLanguage(path: string, currentLanguage?: string): string {
  const normalized = normalizeLocalePrefix(normalizePathInput(path));
  const localePrefix = toLocalePrefix(currentLanguage);

  if (normalized === "/") {
    return new URL(`/${localePrefix}/`, SEO_BASE_URL).toString();
  }

  const canonicalPath = isLocalizedPath(normalized) ? normalized : `/${localePrefix}${normalized}`;
  return new URL(canonicalPath, SEO_BASE_URL).toString();
}

/**
 * Helper function to generate hreflang URLs for a given base path
 */
export function getAlternateLanguageUrls(basePath: string): { lang: string, url: string }[] {
  const normalized = normalizeLocalePrefix(normalizePathInput(basePath));
  // Replace the locale prefix (e.g. /cz/) with a single slash (/)
  let cleanPath = normalized.replace(LOCALE_PREFIX_PATTERN, "/");
  // Remove duplicate slashes if they occurred, e.g. //countries -> /countries
  cleanPath = cleanPath.replace(/\/+/g, "/");
  
  // If we ended up with just "/", make suffix empty so we don't append / to /en
  const suffix = cleanPath === "/" ? "" : cleanPath;

  return [
    { lang: "en", url: new URL(`/en${suffix}`, SEO_BASE_URL).toString() },
    { lang: "cs", url: new URL(`/cz${suffix}`, SEO_BASE_URL).toString() },
    { lang: "de", url: new URL(`/de${suffix}`, SEO_BASE_URL).toString() },
    { lang: "x-default", url: new URL(`/en${suffix}`, SEO_BASE_URL).toString() },
  ];
}

export function getSeoOgImage(entry: SEOEntry): string {
  return new URL(entry.ogImage ?? SEO_TRANSLATIONS.defaultOgImage, SEO_BASE_URL).toString();
}
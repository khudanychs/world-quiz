export const SEO_BASE_URL = "https://world-quiz.com";

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

export function toCanonicalUrl(path: string): string {
  return new URL(path, SEO_BASE_URL).toString();
}

export function getSeoOgImage(entry: SEOEntry): string {
  return new URL(entry.ogImage ?? SEO_TRANSLATIONS.defaultOgImage, SEO_BASE_URL).toString();
}

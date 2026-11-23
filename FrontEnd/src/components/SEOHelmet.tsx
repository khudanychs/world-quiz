import { Helmet } from "react-helmet-async";
import { useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useLocation } from "react-router-dom";
import {
  getAlternateLanguageUrls,
  getSeoOgImage,
  toCanonicalUrlWithLanguage,
} from "../seo/seo-translations";
import { getBaseLanguage, stripLocalePrefix } from "../utils/localeRouting";

interface SEOHelmetProps {
  title?: string;
  description?: string;
  canonicalUrl?: string;
  ogImage?: string;
  noindex?: boolean;
  structuredData?: Record<string, unknown> | Array<Record<string, unknown>>;
  preserveExplicitMeta?: boolean;
  contentReady?: boolean;
  contentError?: string | null;
}

type SeoRouteKey =
  | "home"
  | "leaderboards"
  | "map"
  | "countries"
  | "flagMatch"
  | "flagMatchWorld"
  | "flagMatchEurope"
  | "flagMatchAsia"
  | "flagMatchAfrica"
  | "flagMatchAmericas"
  | "flagMatchOceania"
  | "shapeMatch"
  | "physicalGeo"
  | "physicalGeoMountains"
  | "physicalGeoRivers"
  | "physicalGeoDeserts"
  | "physicalGeoWaters"
  | "guessCountry"
  | "terms"
  | "privacy"
  | "auth"
  | "setNickname"
  | "settings"
  | "notFound";

const FLAG_MATCH_ROUTE_KEYS: Record<string, SeoRouteKey> = {
  world: "flagMatchWorld",
  europe: "flagMatchEurope",
  asia: "flagMatchAsia",
  africa: "flagMatchAfrica",
  americas: "flagMatchAmericas",
  oceania: "flagMatchOceania",
};

const PHYSICAL_GEO_ROUTE_KEYS: Record<string, SeoRouteKey> = {
  mountains: "physicalGeoMountains",
  rivers: "physicalGeoRivers",
  deserts: "physicalGeoDeserts",
  waters: "physicalGeoWaters",
};

function clipForSerp(text: string, maxLength: number): string {
  const normalized = text.replace(/\s+/g, " ").trim();
  if (normalized.length <= maxLength) {
    return normalized;
  }

  const candidate = normalized.slice(0, maxLength + 1);
  const lastWordBoundary = candidate.lastIndexOf(" ");
  const cutAt = lastWordBoundary > Math.floor(maxLength * 0.6) ? lastWordBoundary : maxLength;
  return normalized.slice(0, cutAt).trim();
}

function resolveSeoRouteKey(pathname: string): SeoRouteKey {
  const normalized = pathname.replace(/\/+$/, "") || "/";
  if (normalized === "/") return "home";
  if (normalized.startsWith("/leaderboards")) return "leaderboards";
  if (normalized.startsWith("/map")) return "map";
  if (normalized.startsWith("/countries")) return "countries";
  if (normalized === "/game/flags" || normalized.startsWith("/game/flags/")) {
    const region = normalized.slice("/game/flags/".length).toLowerCase();
    return FLAG_MATCH_ROUTE_KEYS[region] ?? "flagMatch";
  }
  if (normalized.startsWith("/game/shape-match")) return "shapeMatch";
  if (normalized === "/game/physical-geo" || normalized.startsWith("/game/physical-geo/")) {
    const mode = normalized.slice("/game/physical-geo/".length).toLowerCase();
    return PHYSICAL_GEO_ROUTE_KEYS[mode] ?? "physicalGeo";
  }
  if (normalized.startsWith("/game/guess-country")) return "guessCountry";
  if (normalized.startsWith("/terms")) return "terms";
  if (normalized.startsWith("/privacy")) return "privacy";
  if (normalized.startsWith("/auth")) return "auth";
  if (normalized.startsWith("/set-nickname")) return "setNickname";
  if (normalized.startsWith("/settings")) return "settings";
  return "notFound";
}

export function SEOHelmet({
  title,
  description,
  canonicalUrl,
  ogImage,
  noindex = false,
  structuredData,
  preserveExplicitMeta = false,
  contentReady = true,
  contentError,
}: SEOHelmetProps) {
  const { i18n, t } = useTranslation();
  const location = useLocation();
  const htmlLang = useMemo(() => {
    return getBaseLanguage(i18n.language);
  }, [i18n.language]);

  const plainPathname = useMemo(() => stripLocalePrefix(location.pathname), [location.pathname]);
  const routeKey = useMemo(() => resolveSeoRouteKey(plainPathname), [plainPathname]);
  const routeNoindex =
    routeKey === "auth" ||
    routeKey === "setNickname" ||
    routeKey === "settings" ||
    routeKey === "notFound";
  const shouldNoindex = noindex || routeNoindex;
  const robotsContent = shouldNoindex ? "noindex, nofollow" : "index, follow";

  const localizedTitle = t(`seo.routes.${routeKey}.title`, {
    defaultValue: title ?? "World Quiz",
  });
  const localizedDescription = t(`seo.routes.${routeKey}.description`, {
    defaultValue: description ?? "Play World Quiz geography games and map challenges.",
  });
  const finalTitle = clipForSerp(
    preserveExplicitMeta && title ? title : localizedTitle,
    60,
  );
  const finalDescription = clipForSerp(
    preserveExplicitMeta && description ? description : localizedDescription,
    160,
  );

  const routeCanonicalUrl = toCanonicalUrlWithLanguage(location.pathname || plainPathname, htmlLang);
  const finalCanonicalUrl =
    preserveExplicitMeta && canonicalUrl ? canonicalUrl : routeCanonicalUrl;

  const finalOgImage =
    preserveExplicitMeta && ogImage
      ? ogImage
      : getSeoOgImage({
          title: finalTitle,
          description: finalDescription,
          path: plainPathname || "/",
          ogImage: "/newtablogo.png",
        });

  const ogLocale = htmlLang === "cs" ? "cs_CZ" : htmlLang === "de" ? "de_DE" : "en_US";
  const alternateUrls = useMemo(
    () => getAlternateLanguageUrls(finalCanonicalUrl),
    [finalCanonicalUrl],
  );

  const defaultStructuredData: Record<string, unknown> = useMemo(() => {
    const isGameRoute = plainPathname.startsWith("/game/");
    return {
      "@context": "https://schema.org",
      "@type": isGameRoute ? "Quiz" : "EducationalApplication",
      name: finalTitle,
      description: finalDescription,
      applicationCategory: "Game",
      operatingSystem: "Any",
      inLanguage: htmlLang,
      url: finalCanonicalUrl,
    };
  }, [finalCanonicalUrl, finalDescription, finalTitle, htmlLang, plainPathname]);

  const structuredDataNodes = useMemo(() => {
    const baseNodes = structuredData
      ? (Array.isArray(structuredData) ? structuredData : [structuredData])
      : [];

    if (baseNodes.length === 0) {
      return [defaultStructuredData];
    }

    return [defaultStructuredData, ...baseNodes];
  }, [defaultStructuredData, structuredData]);

  useEffect(() => {
    if (typeof document === "undefined") {
      return;
    }
    if (window.__WORLD_QUIZ_PRERENDER__) window.__WORLD_QUIZ_APP_MOUNTED__ = true;

    const marker = "data-wq-jsonld";
    const previous = document.head.querySelectorAll(`script[${marker}="true"]`);
    previous.forEach((node) => node.remove());

    for (const node of structuredDataNodes) {
      const script = document.createElement("script");
      script.type = "application/ld+json";
      script.setAttribute(marker, "true");
      script.text = JSON.stringify(node);
      document.head.appendChild(script);
    }

    return () => {
      const current = document.head.querySelectorAll(`script[${marker}="true"]`);
      current.forEach((node) => node.remove());
    };
  }, [structuredDataNodes]);

  return (
    <>
      <span
        hidden
        data-prerender-state={contentError ? "error" : contentReady ? "ready" : "loading"}
        data-prerender-scope={plainPathname}
        data-prerender-error={contentError || undefined}
      />
      <Helmet prioritizeSeoTags>
        <html lang={htmlLang} />
        <title>{finalTitle}</title>
        <meta name="description" content={finalDescription} />
        <meta
          name="keywords"
          content="country flag matching game, flag matching game, flag match, geography quiz"
        />
        <meta name="robots" content={robotsContent} />
        <link rel="canonical" href={finalCanonicalUrl} />
        {alternateUrls.map(({ lang, url }) => (
          <link key={`hreflang-${lang}`} rel="alternate" hrefLang={lang} href={url} />
        ))}

        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="World Quiz" />
        <meta property="og:locale" content={ogLocale} />
        <meta property="og:url" content={finalCanonicalUrl} />
        <meta property="og:title" content={finalTitle} />
        <meta property="og:description" content={finalDescription} />
        <meta property="og:image" content={finalOgImage} />

        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:url" content={finalCanonicalUrl} />
        <meta name="twitter:title" content={finalTitle} />
        <meta name="twitter:description" content={finalDescription} />
        <meta name="twitter:image" content={finalOgImage} />

        {structuredDataNodes.map((node, index) => (
          <script
            key={`jsonld-${index}`}
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(node) }}
          />
        ))}
      </Helmet>
    </>
  );
}

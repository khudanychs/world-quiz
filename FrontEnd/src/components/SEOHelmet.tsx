import { Helmet } from "react-helmet-async";
import { useMemo } from "react";
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
}

type SeoRouteKey =
  | "home"
  | "leaderboards"
  | "map"
  | "countries"
  | "flagMatch"
  | "shapeMatch"
  | "physicalGeo"
  | "guessCountry"
  | "terms"
  | "privacy"
  | "auth"
  | "setNickname"
  | "settings"
  | "notFound";

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
  if (pathname === "/") return "home";
  if (pathname.startsWith("/leaderboards")) return "leaderboards";
  if (pathname.startsWith("/map")) return "map";
  if (pathname.startsWith("/countries")) return "countries";
  if (pathname.startsWith("/game/flags")) return "flagMatch";
  if (pathname.startsWith("/game/shape-match")) return "shapeMatch";
  if (pathname.startsWith("/game/physical-geo")) return "physicalGeo";
  if (pathname.startsWith("/game/guess-country")) return "guessCountry";
  if (pathname.startsWith("/terms")) return "terms";
  if (pathname.startsWith("/privacy")) return "privacy";
  if (pathname.startsWith("/auth")) return "auth";
  if (pathname.startsWith("/set-nickname")) return "setNickname";
  if (pathname.startsWith("/settings")) return "settings";
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

  return (
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
  );
}

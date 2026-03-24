import { Helmet } from "react-helmet-async";
import { useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { getAlternateLanguageUrls } from "../seo/seo-translations";

interface SEOHelmetProps {
  title: string;
  description: string;
  canonicalUrl: string;
  ogImage: string;
  noindex?: boolean;
  structuredData?: Record<string, unknown> | Array<Record<string, unknown>>;
}

export function SEOHelmet({
  title,
  description,
  canonicalUrl,
  ogImage,
  noindex = false,
  structuredData,
}: SEOHelmetProps) {
  const { i18n } = useTranslation();
  const robotsContent = noindex ? "noindex, nofollow" : "index, follow";
  const htmlLang = useMemo(() => {
    const base = (i18n.language || "en").toLowerCase().split("-")[0];
    if (base === "cz") return "cs";
    if (base === "cs") return "cs";
    if (base === "de") return "de";
    return "en";
  }, [i18n.language]);
  const alternateUrls = useMemo(
    () => getAlternateLanguageUrls(canonicalUrl),
    [canonicalUrl],
  );
  const structuredDataNodes = structuredData
    ? (Array.isArray(structuredData) ? structuredData : [structuredData])
    : [];

  useEffect(() => {
    // Keep a single authoritative robots meta tag in document.head.
    let robotsMeta = document.head.querySelector('meta[name="robots"]');
    if (!robotsMeta) {
      robotsMeta = document.createElement("meta");
      robotsMeta.setAttribute("name", "robots");
      document.head.appendChild(robotsMeta);
    }
    robotsMeta.setAttribute("content", robotsContent);
  }, [robotsContent]);

  return (
    <Helmet prioritizeSeoTags>
      <html lang={htmlLang} />
      <title>{title}</title>
      <meta name="description" content={description} />
      <meta name="robots" content={robotsContent} />
      <link rel="canonical" href={canonicalUrl} />
      {alternateUrls.map(({ lang, url }) => (
        <link key={`hreflang-${lang}`} rel="alternate" hrefLang={lang} href={url} />
      ))}

      <meta property="og:type" content="website" />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={ogImage} />

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:url" content={canonicalUrl} />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={ogImage} />

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

import { Helmet } from "react-helmet-async";

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
  const robotsContent = noindex ? "noindex, nofollow" : "index, follow";
  const structuredDataNodes = structuredData
    ? (Array.isArray(structuredData) ? structuredData : [structuredData])
    : [];

  return (
    <Helmet prioritizeSeoTags>
      <title>{title}</title>
      <meta name="description" content={description} />
      <meta name="robots" content={robotsContent} />
      <link rel="canonical" href={canonicalUrl} />

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

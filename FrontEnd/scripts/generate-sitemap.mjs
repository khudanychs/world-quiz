import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const BASE_URL = "https://world-quiz.com";

const LOCALE_CONFIG = [
  { code: "en", prefix: "" },
  { code: "cs", prefix: "/cs" },
  { code: "de", prefix: "/de" },
];

const SPECIAL_PLAYABLE_TERRITORIES = new Set([
  "TW",
  "EH",
  "XK",
  "AQ",
  "GL",
  "PS",
]);

const REGION_ROUTE_KEYS = {
  Europe: "europe",
  Asia: "asia",
  Africa: "africa",
  Americas: "americas",
  Oceania: "oceania",
};

const thisFilePath = fileURLToPath(import.meta.url);
const rootDir = path.resolve(path.dirname(thisFilePath), "..");
const publicDir = path.join(rootDir, "public");
const countriesJsonPath = path.join(publicDir, "countries-full.json");
const sitemapPath = path.join(publicDir, "sitemap.xml");

function toIsoDate(value) {
  return value.toISOString().slice(0, 10);
}

async function safeStat(filePath) {
  try {
    return await fs.stat(filePath);
  } catch {
    return null;
  }
}

async function resolveLastmodFromFiles(filePaths) {
  const stats = await Promise.all(filePaths.map((filePath) => safeStat(filePath)));
  const mtimes = stats
    .filter((stat) => stat !== null)
    .map((stat) => stat.mtimeMs)
    .filter((mtimeMs) => Number.isFinite(mtimeMs));

  const latestMtimeMs = mtimes.length > 0 ? Math.max(...mtimes) : Date.now();
  return toIsoDate(new Date(latestMtimeMs));
}

function escapeXml(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

function joinUrl(routePath) {
  return new URL(routePath, BASE_URL).toString();
}

function localizeRoutePath(routePath, localePrefix) {
  if (!localePrefix) {
    return routePath;
  }

  if (routePath === "/") {
    return `${localePrefix}/`;
  }

  return `${localePrefix}${routePath}`;
}

function createUrlNode({ path: routePath, lastmod, changefreq, priority, alternates }) {
  const alternateNodes = alternates
    .map(
      (alternate) =>
        `    <xhtml:link rel="alternate" hreflang="${escapeXml(alternate.hreflang)}" href="${escapeXml(alternate.href)}" />`,
    )
    .join("\n");

  return [
    "  <url>",
    `    <loc>${escapeXml(joinUrl(routePath))}</loc>`,
    alternateNodes,
    `    <lastmod>${lastmod}</lastmod>`,
    `    <changefreq>${changefreq}</changefreq>`,
    `    <priority>${priority.toFixed(1)}</priority>`,
    "  </url>",
  ].join("\n");
}

async function getFlagGameRegionRoutes(countries) {
  const regionSet = new Set();

  for (const country of countries) {
    const region = country?.region;
    if (region && region in REGION_ROUTE_KEYS) {
      regionSet.add(region);
    }
  }

  const dynamicRoutes = Array.from(regionSet)
    .sort((a, b) => a.localeCompare(b))
    .map((region) => `/game/flags/${REGION_ROUTE_KEYS[region]}`);

  return ["/game/flags/world", ...dynamicRoutes];
}

async function getPhysicalGeoModeRoutes() {
  const modeSources = {
    mountains: [
      path.join(publicDir, "region_polys", "Mountain ranges.json"),
      path.join(publicDir, "region_polys", "Mountain ranges.geojson"),
      path.join(publicDir, "region_polys", "elev_points.json"),
      path.join(publicDir, "region_polys", "elev_points.geojson"),
    ],
    deserts: [
      path.join(publicDir, "region_polys", "deserts.json"),
      path.join(publicDir, "region_polys", "deserts.geojson"),
    ],
    rivers: [
      path.join(publicDir, "fixed_rivers.json"),
      path.join(publicDir, "fixed_rivers.geojson"),
      path.join(publicDir, "rivers.json"),
    ],
    waters: [
      path.join(publicDir, "world-marine.json"),
      path.join(publicDir, "FinalMarines10m.json"),
      path.join(publicDir, "lakes.json"),
    ],
  };

  const routes = [];
  for (const [modeKey, files] of Object.entries(modeSources)) {
    const stats = await Promise.all(files.map((filePath) => safeStat(filePath)));
    const hasAnySource = stats.some((stat) => stat !== null);
    if (hasAnySource) {
      routes.push(`/game/physical-geo/${modeKey}`);
    }
  }

  return routes;
}

function getCountryDetailRoutes(countries) {
  const routes = new Set();

  for (const country of countries) {
    const code = typeof country?.cca2 === "string" ? country.cca2.toUpperCase() : "";
    if (!code) {
      continue;
    }

    const independent = country?.independent === true;
    if (!independent && !SPECIAL_PLAYABLE_TERRITORIES.has(code)) {
      continue;
    }

    routes.add(`/countries/${code.toLowerCase()}`);
  }

  return Array.from(routes).sort((a, b) => a.localeCompare(b));
}

async function main() {
  const countriesRaw = await fs.readFile(countriesJsonPath, "utf8");
  const countries = JSON.parse(countriesRaw);

  if (!Array.isArray(countries)) {
    throw new Error("countries-full.json must be an array");
  }

  const [baseLastmod, countriesLastmod, flagsLastmod, physicalGeoLastmod] = await Promise.all([
    resolveLastmodFromFiles([
      path.join(rootDir, "src", "App.tsx"),
      path.join(rootDir, "src", "components", "MainMenu.tsx"),
      path.join(rootDir, "src", "pages", "LeaderboardsPage.tsx"),
      path.join(rootDir, "src", "pages", "CountryIndex.tsx"),
      path.join(rootDir, "src", "pages", "PrivacyPolicy.tsx"),
      path.join(rootDir, "src", "pages", "TermsConditions.tsx"),
      path.join(rootDir, "src", "WorldMap.tsx"),
    ]),
    resolveLastmodFromFiles([countriesJsonPath]),
    resolveLastmodFromFiles([countriesJsonPath]),
    resolveLastmodFromFiles([
      path.join(publicDir, "region_polys", "Mountain ranges.json"),
      path.join(publicDir, "region_polys", "Mountain ranges.geojson"),
      path.join(publicDir, "region_polys", "deserts.json"),
      path.join(publicDir, "region_polys", "deserts.geojson"),
      path.join(publicDir, "fixed_rivers.json"),
      path.join(publicDir, "fixed_rivers.geojson"),
      path.join(publicDir, "world-marine.json"),
      path.join(publicDir, "FinalMarines10m.json"),
      path.join(publicDir, "lakes.json"),
    ]),
  ]);

  const baseRoutes = [
    { path: "/", changefreq: "weekly", priority: 1.0, lastmod: baseLastmod },
    { path: "/leaderboards", changefreq: "daily", priority: 0.8, lastmod: baseLastmod },
    { path: "/countries", changefreq: "weekly", priority: 0.9, lastmod: baseLastmod },
    { path: "/map", changefreq: "weekly", priority: 0.8, lastmod: baseLastmod },
    { path: "/terms", changefreq: "yearly", priority: 0.4, lastmod: baseLastmod },
    { path: "/privacy", changefreq: "yearly", priority: 0.4, lastmod: baseLastmod },
  ];

  const staticGameRoutes = [
    // Note: /game/flags (without region) is an interactive selector, not a prerenderable page
    { path: "/game/shape-match", changefreq: "weekly", priority: 0.7, lastmod: baseLastmod },
    { path: "/game/guess-country", changefreq: "weekly", priority: 0.7, lastmod: baseLastmod },
    { path: "/game/physical-geo", changefreq: "weekly", priority: 0.8, lastmod: physicalGeoLastmod },
  ];

  const [flagRegionRoutes, physicalModeRoutes] = await Promise.all([
    getFlagGameRegionRoutes(countries),
    getPhysicalGeoModeRoutes(),
  ]);

  const dynamicGameRoutes = [
    ...flagRegionRoutes.map((routePath) => ({
      path: routePath,
      changefreq: "weekly",
      priority: 0.7,
      lastmod: flagsLastmod,
    })),
    ...physicalModeRoutes.map((routePath) => ({
      path: routePath,
      changefreq: "weekly",
      priority: 0.7,
      lastmod: physicalGeoLastmod,
    })),
  ];

  const countryDetailRoutes = getCountryDetailRoutes(countries).map((routePath) => ({
    path: routePath,
    changefreq: "monthly",
    priority: 0.6,
    lastmod: countriesLastmod,
  }));

  const allRouteEntries = [
    ...baseRoutes,
    ...staticGameRoutes,
    ...dynamicGameRoutes,
    ...countryDetailRoutes,
  ];

  const dedupedEntries = Array.from(
    new Map(allRouteEntries.map((entry) => [entry.path, entry])).values(),
  ).sort((a, b) => a.path.localeCompare(b.path));

  const localizedEntries = dedupedEntries
    .flatMap((entry) => {
      const alternateVariants = LOCALE_CONFIG.map((locale) => ({
        hreflang: locale.code,
        href: joinUrl(localizeRoutePath(entry.path, locale.prefix)),
      }));

      const xDefaultHref = joinUrl(entry.path);

      return LOCALE_CONFIG.map((locale) => ({
        ...entry,
        path: localizeRoutePath(entry.path, locale.prefix),
        alternates: [
          ...alternateVariants,
          { hreflang: "x-default", href: xDefaultHref },
        ],
      }));
    })
    .sort((a, b) => a.path.localeCompare(b.path));

  const xml = [
    "<?xml version=\"1.0\" encoding=\"UTF-8\"?>",
    "<urlset xmlns=\"http://www.sitemaps.org/schemas/sitemap/0.9\" xmlns:xhtml=\"http://www.w3.org/1999/xhtml\">",
    ...localizedEntries.map(createUrlNode),
    "</urlset>",
    "",
  ].join("\n");

  await fs.writeFile(sitemapPath, xml, "utf8");

  console.log(`Generated sitemap with ${localizedEntries.length} URLs at ${sitemapPath}`);
}

main().catch((error) => {
  console.error("Failed to generate sitemap:", error);
  process.exitCode = 1;
});

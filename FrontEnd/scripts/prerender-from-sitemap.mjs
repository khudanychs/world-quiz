import { promises as fs } from "node:fs";
import path from "node:path";
import { createServer } from "node:http";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright-core";

const thisFilePath = fileURLToPath(import.meta.url);
const rootDir = path.resolve(path.dirname(thisFilePath), "..");
const distDir = path.join(rootDir, "dist");
const sitemapPath = path.join(distDir, "sitemap.xml");
const fallbackIndexPath = path.join(distDir, "index.html");
const chromeExecutablePath = process.env.PRERENDER_CHROME_PATH || "/usr/bin/google-chrome";
const defaultConcurrency = Number.parseInt(process.env.PRERENDER_CONCURRENCY || "12", 10);
const prerenderConcurrency = Number.isFinite(defaultConcurrency) && defaultConcurrency > 0
  ? defaultConcurrency
  : 12;
const LOCALE_PREFIX_PATTERN = /^\/(en|cs|de)(\/|$)/;

const MIME_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".ico": "image/x-icon",
  ".woff2": "font/woff2",
  ".txt": "text/plain; charset=utf-8",
  ".xml": "application/xml; charset=utf-8",
  ".map": "application/json; charset=utf-8",
};

function getMimeType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  return MIME_TYPES[ext] || "application/octet-stream";
}

function toOutputHtmlPath(routePathname) {
  if (routePathname === "/") {
    return path.join(distDir, "index.html");
  }

  const normalized = routePathname.replace(/^\/+/, "").replace(/\/+$/, "");
  return path.join(distDir, normalized, "index.html");
}

async function parseRoutesFromSitemap() {
  const xml = await fs.readFile(sitemapPath, "utf8");
  const locPattern = /<loc>([^<]+)<\/loc>/g;
  const routes = new Set();
  let match = locPattern.exec(xml);

  while (match) {
    const rawLoc = match[1]?.trim();
    if (rawLoc) {
      const parsed = new URL(rawLoc);
      const pathname = parsed.pathname.replace(/\/+$/, "") || "/";
      routes.add(pathname);
    }

    match = locPattern.exec(xml);
  }

  return Array.from(routes).sort((a, b) => a.localeCompare(b));
}

async function safeStat(filePath) {
  try {
    return await fs.stat(filePath);
  } catch {
    return null;
  }
}

async function serveStatic(req, res) {
  if (!req.url) {
    res.statusCode = 400;
    res.end("Bad request");
    return;
  }

  const url = new URL(req.url, "http://localhost");
  let pathname = decodeURIComponent(url.pathname);

  if (pathname === "/") {
    pathname = "/index.html";
  }

  const requestedPath = path.join(distDir, pathname.replace(/^\//, ""));
  const requestedStat = await safeStat(requestedPath);

  let filePath = requestedPath;

  if (requestedStat?.isDirectory()) {
    const nestedIndex = path.join(requestedPath, "index.html");
    const nestedIndexStat = await safeStat(nestedIndex);
    if (nestedIndexStat?.isFile()) {
      filePath = nestedIndex;
    } else {
      filePath = fallbackIndexPath;
    }
  } else if (!requestedStat?.isFile()) {
    filePath = fallbackIndexPath;
  }

  try {
    const content = await fs.readFile(filePath);
    res.setHeader("Content-Type", getMimeType(filePath));
    res.statusCode = 200;
    res.end(content);
  } catch {
    res.statusCode = 404;
    res.end("Not found");
  }
}

async function startStaticServer() {
  const server = createServer((req, res) => {
    serveStatic(req, res);
  });

  await new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", () => resolve());
  });

  const address = server.address();
  if (!address || typeof address === "string") {
    throw new Error("Failed to start local prerender server");
  }

  return {
    server,
    origin: `http://127.0.0.1:${address.port}`,
  };
}

async function main() {
  const startedAt = Date.now();
  const routes = await parseRoutesFromSitemap();
  if (routes.length === 0) {
    throw new Error("No routes found in dist/sitemap.xml for prerendering");
  }

  const { server, origin } = await startStaticServer();
  const browser = await chromium.launch({
    executablePath: chromeExecutablePath,
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  let renderedCount = 0;
  const failedRoutes = [];

  try {
    const context = await browser.newContext();
    await context.route("**/*", (route) => {
      const requestUrl = route.request().url();
      const blockedHosts = [
        "firestore.googleapis.com",
        "identitytoolkit.googleapis.com",
        "securetoken.googleapis.com",
        "firebaseinstallations.googleapis.com",
        "google-analytics.com",
      ];

      if (blockedHosts.some((host) => requestUrl.includes(host))) {
        route.abort();
        return;
      }

      route.continue();
    });

    let routeCursor = 0;
    const workerCount = Math.min(prerenderConcurrency, routes.length);

    const renderRouteWithPage = async (page, routePath) => {
      const routeUrl = `${origin}${routePath}`;
      await page.goto(routeUrl, { waitUntil: "domcontentloaded", timeout: 90000 });

      const isAlreadyLocalizedRoute = LOCALE_PREFIX_PATTERN.test(routePath);

      // Wait for client-side language redirects only on non-localized routes.
      // Localized routes are already final and should not pay redirect wait cost.
      if (!isAlreadyLocalizedRoute) {
        try {
          await Promise.race([
            page.waitForURL(
              (url) => {
                const finalPath = url.pathname;
                return finalPath !== routePath || LOCALE_PREFIX_PATTERN.test(finalPath);
              },
              { timeout: 5000 },
            ),
            new Promise((resolve) => setTimeout(resolve, 5000)),
          ]);
        } catch {
          // Timeout is acceptable - route might not redirect
        }
      }

      await page.waitForFunction(
        () => {
          const root = document.querySelector("#root");
          if (!root) {
            return false;
          }

          const rootText = root.textContent || "";
          const hasLoadingShell = rootText.includes("Loading...");
          const hasBodyContent = root.innerHTML.trim().length > 0;
          const titleReady = document.title.trim().length > 0;
          const hasDescription =
            (document.querySelector('meta[name="description"]')?.getAttribute("content") || "")
              .trim()
              .length > 0;
          const hasCanonical =
            (document.querySelector('link[rel="canonical"]')?.getAttribute("href") || "")
              .trim()
              .length > 0;
          const hreflangCount = document.querySelectorAll('link[rel="alternate"][hreflang]').length;
          const hasJsonLd = document.querySelectorAll('script[type="application/ld+json"]').length > 0;

          return (
            hasBodyContent &&
            !hasLoadingShell &&
            titleReady &&
            hasDescription &&
            hasCanonical &&
            hreflangCount >= 4 &&
            hasJsonLd
          );
        },
        { timeout: 45000 },
      );

      const seoSnapshot = await page.evaluate(() => {
        const canonical =
          document.querySelector('link[rel="canonical"]')?.getAttribute("href")?.trim() || "";
        const hreflangs = document.querySelectorAll('link[rel="alternate"][hreflang]').length;
        const jsonLd = document.querySelectorAll('script[type="application/ld+json"]').length;
        const title = document.title.trim();
        const description =
          document.querySelector('meta[name="description"]')?.getAttribute("content")?.trim() || "";
        return {
          canonical,
          hreflangs,
          jsonLd,
          title,
          description,
          html: `<!doctype html>\n${document.documentElement.outerHTML}`,
        };
      });

      if (!seoSnapshot.title || !seoSnapshot.description || !seoSnapshot.canonical) {
        throw new Error(`SEO tags missing after render for route ${routePath}`);
      }

      if (seoSnapshot.hreflangs < 4) {
        throw new Error(`Expected at least 4 hreflang links for ${routePath}, got ${seoSnapshot.hreflangs}`);
      }

      if (seoSnapshot.jsonLd < 1) {
        throw new Error(`Expected JSON-LD structured data for ${routePath}`);
      }

      const outputPath = toOutputHtmlPath(routePath);
      await fs.mkdir(path.dirname(outputPath), { recursive: true });
      await fs.writeFile(outputPath, `${seoSnapshot.html}\n`, "utf8");
    };

    const workers = Array.from({ length: workerCount }, async () => {
      const page = await context.newPage();
      try {
        while (routeCursor < routes.length) {
          const nextRoute = routes[routeCursor];
          routeCursor += 1;

          if (!nextRoute) {
            continue;
          }

          try {
            await renderRouteWithPage(page, nextRoute);
            renderedCount += 1;
          } catch (error) {
            failedRoutes.push({ routePath: nextRoute, error: String(error) });
          }
        }
      } finally {
        await page.close();
      }
    });

    await Promise.all(workers);

    await context.close();
  } finally {
    await browser.close();
    await new Promise((resolve, reject) => {
      server.close((error) => {
        if (error) reject(error);
        else resolve();
      });
    });
  }

  if (failedRoutes.length > 0) {
    console.error(`Prerender failed for ${failedRoutes.length} routes`);
    for (const failure of failedRoutes.slice(0, 10)) {
      console.error(`- ${failure.routePath}: ${failure.error}`);
    }
    process.exitCode = 1;
    return;
  }

  const durationSeconds = ((Date.now() - startedAt) / 1000).toFixed(2);
  console.log(
    `Prerendered ${renderedCount} route HTML files into dist with concurrency ${Math.min(prerenderConcurrency, routes.length)} in ${durationSeconds}s`,
  );
}

main().catch((error) => {
  console.error("Prerender failed:", error);
  process.exitCode = 1;
});

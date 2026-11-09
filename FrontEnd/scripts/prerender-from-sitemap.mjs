import { promises as fs } from "node:fs";
import path from "node:path";
import { createServer } from "node:http";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright-core";

const strictSeoMode = process.argv.includes("--strict-seo");

const thisFilePath = fileURLToPath(import.meta.url);
const rootDir = path.resolve(path.dirname(thisFilePath), "..");
const distDir = path.join(rootDir, "dist");
const sitemapPath = path.join(distDir, "sitemap.xml");
const fallbackIndexPath = path.join(distDir, "index.html");
const chromeExecutablePath = process.env.PRERENDER_CHROME_PATH || "/usr/bin/google-chrome";
const defaultConcurrency = Number.parseInt(process.env.PRERENDER_CONCURRENCY || "8", 10);
const prerenderConcurrency = Number.isFinite(defaultConcurrency) && defaultConcurrency > 0
  ? defaultConcurrency
  : 8;
const defaultRedirectWaitMs = Number.parseInt(process.env.PRERENDER_REDIRECT_WAIT_MS || "1200", 10);
const prerenderRedirectWaitMs = Number.isFinite(defaultRedirectWaitMs) && defaultRedirectWaitMs >= 0
  ? defaultRedirectWaitMs
  : 1200;
const defaultProgressEvery = Number.parseInt(process.env.PRERENDER_PROGRESS_EVERY || "20", 10);
const prerenderProgressEvery = Number.isFinite(defaultProgressEvery) && defaultProgressEvery > 0
  ? defaultProgressEvery
  : 20;
const defaultHeartbeatMs = Number.parseInt(process.env.PRERENDER_HEARTBEAT_MS || "10000", 10);
const prerenderHeartbeatMs = Number.isFinite(defaultHeartbeatMs) && defaultHeartbeatMs > 0
  ? defaultHeartbeatMs
  : 10000;
const defaultSeoWaitTimeoutMs = Number.parseInt(process.env.PRERENDER_SEO_WAIT_TIMEOUT_MS || "5000", 10);
const prerenderSeoWaitTimeoutMs = Number.isFinite(defaultSeoWaitTimeoutMs) && defaultSeoWaitTimeoutMs > 0
  ? defaultSeoWaitTimeoutMs
  : 5000;
const defaultStrictSeoWaitTimeoutMs = Number.parseInt(process.env.PRERENDER_STRICT_SEO_WAIT_TIMEOUT_MS || "45000", 10);
const prerenderStrictSeoWaitTimeoutMs = Number.isFinite(defaultStrictSeoWaitTimeoutMs) && defaultStrictSeoWaitTimeoutMs > 0
  ? defaultStrictSeoWaitTimeoutMs
  : 45000;
const LOCALE_PREFIX_PATTERN = /^\/(en|cs|de)(\/|$)/;
const BLOCKED_REQUEST_HOSTS = new Set([
  "firestore.googleapis.com",
  "identitytoolkit.googleapis.com",
  "securetoken.googleapis.com",
  "firebaseinstallations.googleapis.com",
  "google-analytics.com",
  "umami.world-quiz.com",
]);
const SINGLETON_SEO_SELECTORS = [
  'title',
  'link[rel="canonical"]',
  'meta[name="description"]',
  'meta[name="keywords"]',
  'meta[name="robots"]',
  ...["type", "site_name", "locale", "url", "title", "description", "image"]
    .map((property) => `meta[property="og:${property}"]`),
  ...["card", "url", "title", "description", "image"]
    .map((name) => `meta[name="twitter:${name}"]`),
];

function normalizePathname(pathname) {
  return pathname.replace(/\/+$/, "") || "/";
}

function isBlockedRequestHost(hostname) {
  for (const host of BLOCKED_REQUEST_HOSTS) {
    if (hostname === host || hostname.endsWith(`.${host}`)) return true;
  }
  return false;
}

function formatDiagnosticUrl(rawUrl) {
  try {
    const url = new URL(rawUrl);
    // Resource paths are useful for debugging; query strings can contain credentials.
    return `${url.origin}${url.pathname}`;
  } catch {
    return rawUrl.split(/[?#]/, 1)[0];
  }
}

function getExpectedFinalPathCandidates(routePath) {
  const normalizedRoute = normalizePathname(routePath);
  if (LOCALE_PREFIX_PATTERN.test(normalizedRoute)) {
    return [normalizedRoute];
  }

  if (normalizedRoute === "/") {
    return ["/", "/en"];
  }

  return [normalizedRoute, normalizePathname(`/en${normalizedRoute}`)];
}

function buildExpectedCanonical(routePath, finalPathname) {
  if (routePath === "/") {
    return "https://world-quiz.com/en";
  }
  return `https://world-quiz.com${normalizePathname(finalPathname)}`;
}

function routeSuffixFromFinalPath(finalPathname) {
  const normalized = normalizePathname(finalPathname);
  const withoutLocale = normalized.replace(/^\/(en|cs|de)(?=\/|$)/, "");
  return withoutLocale || "/";
}

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

function formatDurationMs(ms) {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}m ${seconds}s`;
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

  const totalRoutes = routes.length;
  console.log(
    `[prerender] Starting ${totalRoutes} routes | mode=${strictSeoMode ? "strict-seo" : "fast"} | concurrency=${Math.min(prerenderConcurrency, totalRoutes)} | redirectWait=${prerenderRedirectWaitMs}ms`,
  );

  const { server, origin } = await startStaticServer();
  const browser = await chromium.launch({
    executablePath: chromeExecutablePath,
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  let renderedCount = 0;
  let inFlightCount = 0;
  let progressTimer;
  let seoWarningCount = 0;
  const failedRoutes = [];
  const intentionallyBlockedRequests = new WeakSet();
  const blockedRequestsByHost = new Map();
  const runtimeIssues = new Map();
  let runtimeIssueCount = 0;
  const runtimeIssueLogLimit = 20;

  const reportRuntimeIssue = (kind, detail, routePath) => {
    const key = `${kind}: ${detail}`;
    const previousCount = runtimeIssues.get(key) || 0;
    runtimeIssues.set(key, previousCount + 1);
    runtimeIssueCount += 1;
    if (previousCount === 0 && runtimeIssues.size <= runtimeIssueLogLimit) {
      console.error(`[prerender][${kind}] ${routePath}: ${detail}`);
    }
  };

  const logProgress = (label) => {
    const doneCount = renderedCount + failedRoutes.length;
    const elapsedMs = Date.now() - startedAt;
    const rate = doneCount > 0 ? doneCount / Math.max(1, elapsedMs / 1000) : 0;
    const remaining = Math.max(0, totalRoutes - doneCount);
    const etaMs = rate > 0 ? (remaining / rate) * 1000 : 0;
    const pct = ((doneCount / totalRoutes) * 100).toFixed(1);

    console.log(
      `[prerender] ${label} | ${doneCount}/${totalRoutes} (${pct}%) | ok=${renderedCount} fail=${failedRoutes.length} inflight=${inFlightCount} | ${rate.toFixed(2)} routes/s | elapsed=${formatDurationMs(elapsedMs)}${rate > 0 ? ` | eta=${formatDurationMs(etaMs)}` : ""}`,
    );
  };

  try {
    const context = await browser.newContext();
    await context.addInitScript(() => {
      window.__WORLD_QUIZ_PRERENDER__ = true;
      window.__WORLD_QUIZ_APP_MOUNTED__ = false;
    });
    await context.route("**/*", async (route) => {
      const request = route.request();
      const hostname = new URL(request.url()).hostname;

      if (isBlockedRequestHost(hostname)) {
        intentionallyBlockedRequests.add(request);
        blockedRequestsByHost.set(hostname, (blockedRequestsByHost.get(hostname) || 0) + 1);
        await route.abort("blockedbyclient");
        return;
      }

      await route.continue();
    });

    let routeCursor = 0;
    const workerCount = Math.min(prerenderConcurrency, routes.length);
    progressTimer = setInterval(() => {
      logProgress("heartbeat");
    }, prerenderHeartbeatMs);

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
            new Promise((resolve) => setTimeout(resolve, prerenderRedirectWaitMs)),
          ]);
        } catch {
          // Timeout is acceptable - route might not redirect
        }
      }

      try {
        await page.waitForFunction(
          () => !document.querySelector('[data-app-loading="true"]') && !!document.querySelector('link[rel="canonical"]'),
          undefined,
          { timeout: prerenderSeoWaitTimeoutMs },
        );
      } catch {
        // Keep prerender moving; missing title will be reported as an SEO warning.
      }

      if (strictSeoMode) {
        const expectedFinalPathCandidates = getExpectedFinalPathCandidates(routePath);
        const requiresCountryMetadata = expectedFinalPathCandidates.some((candidatePath) =>
          routeSuffixFromFinalPath(candidatePath).startsWith("/countries/"),
        );

        await page.waitForFunction(
          ({ expectedFinalPathCandidates: expectedFinalPaths, requiresCountryMetadata: needsCountryMeta }) => {
            const normalizePath = (input) => input.replace(/\/+$/, "") || "/";
            const routeSuffixFromPath = (input) => {
              const normalized = normalizePath(input);
              const withoutLocale = normalized.replace(/^\/(en|cs|de)(?=\/|$)/, "");
              return withoutLocale || "/";
            };

            const finalPathname = normalizePath(window.location.pathname || "/");
            if (!expectedFinalPaths.includes(finalPathname)) {
              return false;
            }

            if (document.querySelector('[data-app-loading="true"]')) {
              return false;
            }

            const canonical =
              (document.querySelector('link[rel="canonical"]')?.getAttribute("href") || "")
                .trim();
            const hreflangs = document.querySelectorAll('link[rel="alternate"][hreflang]').length;
            const hasJsonLd = document.querySelectorAll('script[type="application/ld+json"]').length > 0;
            const hasTitle = document.title.trim().length > 0;
            const hasDescription =
              (document.querySelector('meta[name="description"]')?.getAttribute("content") || "")
                .trim()
                .length > 0;

            const expectedCanonical =
              finalPathname === "/" ? "https://world-quiz.com/en" : `https://world-quiz.com${finalPathname}`;
            if (canonical !== expectedCanonical) {
              return false;
            }

            if (needsCountryMeta) {
              const routeSuffix = routeSuffixFromPath(finalPathname);
              if (!routeSuffix.startsWith("/countries/")) {
                return false;
              }

              const alternateLinks = Array.from(
                document.querySelectorAll('link[rel="alternate"][hreflang]'),
              ).map((link) => ({
                hreflang: (link.getAttribute("hreflang") || "").trim().toLowerCase(),
                href: (link.getAttribute("href") || "").trim(),
              }));
              const alternateByLang = new Map(
                alternateLinks
                  .filter((entry) => entry.hreflang && entry.href)
                  .map((entry) => [entry.hreflang, entry.href]),
              );

              const expectedEn = `https://world-quiz.com/en${routeSuffix}`;
              const expectedCs = `https://world-quiz.com/cs${routeSuffix}`;
              const expectedDe = `https://world-quiz.com/de${routeSuffix}`;
              const expectedXDefault = expectedEn;

              if (alternateByLang.get("en") !== expectedEn) return false;
              if (alternateByLang.get("cs") !== expectedCs) return false;
              if (alternateByLang.get("de") !== expectedDe) return false;
              if (alternateByLang.get("x-default") !== expectedXDefault) return false;
            }

            // Wait for SEOHelmet-injected tags plus basic document metadata.
            return hasTitle && hasDescription && canonical && hreflangs >= 4 && hasJsonLd;
          },
          {
            expectedFinalPathCandidates,
            requiresCountryMetadata,
          },
          { timeout: prerenderStrictSeoWaitTimeoutMs },
        );
      }

      // Metadata can precede the game's data and map. Never serialize an intermediate loader.
      try {
        await page.waitForFunction(() => {
          if (!window.__WORLD_QUIZ_APP_MOUNTED__) return false;
          const markers = Array.from(document.querySelectorAll('[data-prerender-state]'));
          return markers.length > 0 && (
            markers.some((node) => node.getAttribute("data-prerender-state") === "error") ||
            markers.every((node) => node.getAttribute("data-prerender-state") === "ready")
          );
        }, undefined, { timeout: prerenderStrictSeoWaitTimeoutMs });
      } catch {
        const pending = await page.evaluate(() => ({
          mounted: !!window.__WORLD_QUIZ_APP_MOUNTED__,
          pending: Array.from(document.querySelectorAll('[data-prerender-state]'))
            .filter((node) => node.getAttribute("data-prerender-state") !== "ready")
            .map((node) => node.getAttribute("data-prerender-scope") || node.className || node.tagName),
        }));
        throw new Error(`Content readiness timed out: ${JSON.stringify(pending)}`);
      }

      const seoSnapshot = await page.evaluate((singletonSelectors) => {
        const canonical =
          document.querySelector('link[rel="canonical"]')?.getAttribute("href")?.trim() || "";
        const hreflangs = document.querySelectorAll('link[rel="alternate"][hreflang]').length;
        const jsonLd = document.querySelectorAll('script[type="application/ld+json"]').length;
        const alternateLinks = Array.from(document.querySelectorAll('link[rel="alternate"][hreflang]')).map((link) => ({
          hreflang: link.getAttribute("hreflang")?.trim().toLowerCase() || "",
          href: link.getAttribute("href")?.trim() || "",
        }));
        const title = document.title.trim();
        const description =
          document.querySelector('meta[name="description"]')?.getAttribute("content")?.trim() || "";
        // Validate the same DOM that is saved, including tags outside Helmet's ownership.
        const metadataCounts = singletonSelectors.map((selector) => ({
          selector,
          count: document.head.querySelectorAll(selector).length,
        }));
        return {
          finalPathname: window.location.pathname || "/",
          canonical,
          hreflangs,
          alternateLinks,
          jsonLd,
          title,
          description,
          metadataCounts,
          contentStates: Array.from(document.querySelectorAll('[data-prerender-state]')).map((node) => ({
            state: node.getAttribute("data-prerender-state"),
            error: node.getAttribute("data-prerender-error"),
          })),
          html: `<!doctype html>\n${document.documentElement.outerHTML}`,
        };
      }, SINGLETON_SEO_SELECTORS);

      if (seoSnapshot.contentStates.some(({ state }) => state !== "ready")) {
        throw new Error(`Content is not ready: ${JSON.stringify(seoSnapshot.contentStates)}`);
      }

      const duplicateMetadata = seoSnapshot.metadataCounts.filter(({ count }) => count > 1);
      if (duplicateMetadata.length > 0) {
        throw new Error(`Duplicate SEO metadata: ${duplicateMetadata
          .map(({ selector, count }) => `${selector} (${count})`)
          .join(", ")}`);
      }

      const missingBits = [];
      for (const { selector, count } of seoSnapshot.metadataCounts) {
        if (count === 0) missingBits.push(selector);
      }
      if (!seoSnapshot.title) missingBits.push("title");
      if (!seoSnapshot.description) missingBits.push("description");
      if (!seoSnapshot.canonical) missingBits.push("canonical");
      if (seoSnapshot.hreflangs < 4) missingBits.push(`hreflang(<4: ${seoSnapshot.hreflangs})`);
      if (seoSnapshot.jsonLd < 1) missingBits.push("jsonld");

      const finalPathname = normalizePathname(seoSnapshot.finalPathname || new URL(page.url()).pathname);
      const expectedFinalPathCandidates = getExpectedFinalPathCandidates(routePath);
      if (!expectedFinalPathCandidates.includes(finalPathname)) {
        missingBits.push(`final-path(expected one of ${expectedFinalPathCandidates.join(", ")}, got ${finalPathname})`);
      }

      if (await page.$('[data-app-loading="true"]')) {
        missingBits.push("app-still-loading");
      }

      const expectedCanonical = buildExpectedCanonical(routePath, finalPathname);
      if (seoSnapshot.canonical !== expectedCanonical) {
        missingBits.push(`canonical(expected ${expectedCanonical}, got ${seoSnapshot.canonical || "<empty>"})`);
      }

      const routeSuffix = routeSuffixFromFinalPath(finalPathname);
      if (routeSuffix.startsWith("/countries/")) {
        const alternateByLang = new Map(
          seoSnapshot.alternateLinks
            .filter((entry) => entry.hreflang && entry.href)
            .map((entry) => [entry.hreflang, entry.href]),
        );

        const expectedEn = `https://world-quiz.com/en${routeSuffix}`;
        const expectedCs = `https://world-quiz.com/cs${routeSuffix}`;
        const expectedDe = `https://world-quiz.com/de${routeSuffix}`;
        const expectedXDefault = expectedEn;

        if (alternateByLang.get("en") !== expectedEn) {
          missingBits.push(`hreflang-en(expected ${expectedEn})`);
        }
        if (alternateByLang.get("cs") !== expectedCs) {
          missingBits.push(`hreflang-cs(expected ${expectedCs})`);
        }
        if (alternateByLang.get("de") !== expectedDe) {
          missingBits.push(`hreflang-de(expected ${expectedDe})`);
        }
        if (alternateByLang.get("x-default") !== expectedXDefault) {
          missingBits.push(`hreflang-x-default(expected ${expectedXDefault})`);
        }
      }

      if (missingBits.length > 0) {
        if (strictSeoMode) {
          throw new Error(`Strict SEO validation failed: ${missingBits.join(", ")}`);
        }
        seoWarningCount += 1;
        if (seoWarningCount <= 20) {
          console.warn(`[prerender][seo-warning] ${routePath} missing: ${missingBits.join(", ")}`);
        }
      }

      const outputPath = toOutputHtmlPath(routePath);
      await fs.mkdir(path.dirname(outputPath), { recursive: true });
      await fs.writeFile(outputPath, `${seoSnapshot.html}\n`, "utf8");
    };

    const workers = Array.from({ length: workerCount }, async () => {
      const page = await context.newPage();
      let currentRoute = "<initializing>";
      const pendingRequests = new Set();
      const navigationCancellations = new WeakSet();
      const requestRoutes = new WeakMap();
      let navigatingAway = false;
      const expectNavigationCancellations = () => {
        for (const request of pendingRequests) navigationCancellations.add(request);
      };

      page.on("request", (request) => {
        pendingRequests.add(request);
        requestRoutes.set(request, currentRoute);
        if (navigatingAway) navigationCancellations.add(request);
      });
      page.on("requestfinished", (request) => pendingRequests.delete(request));
      page.on("requestfailed", (request) => {
        pendingRequests.delete(request);
        if (intentionallyBlockedRequests.has(request)) return;
        const errorText = request.failure()?.errorText || "Unknown network error";
        if (errorText === "net::ERR_ABORTED" && navigationCancellations.has(request)) return;
        reportRuntimeIssue("requestfailed", `${errorText} ${formatDiagnosticUrl(request.url())}`, requestRoutes.get(request) || currentRoute);
      });
      page.on("response", (response) => {
        if (response.status() >= 400) {
          reportRuntimeIssue("http-error", `${response.status()} ${formatDiagnosticUrl(response.url())}`, requestRoutes.get(response.request()) || currentRoute);
        }
      });
      page.on("pageerror", (error) => {
        reportRuntimeIssue("pageerror", error?.message || String(error), currentRoute);
      });
      page.on("console", (message) => {
        if (message.type() !== "error") return;
        const text = message.text();
        const location = message.location();
        // Network/HTTP handlers above report resource failures once, with their URLs.
        if (text.startsWith("Failed to load resource:") && location.url && message.args().length === 0) return;
        const source = location.url ? ` (${formatDiagnosticUrl(location.url)}:${location.lineNumber + 1})` : "";
        reportRuntimeIssue("console.error", `${text}${source}`, currentRoute);
      });
      try {
        while (routeCursor < routes.length) {
          const nextRoute = routes[routeCursor];
          routeCursor += 1;

          if (!nextRoute) {
            continue;
          }

          try {
            inFlightCount += 1;
            // Detach the old document before assigning the next route. Lazy images can
            // start even after a navigation begins; their cancellations belong to it.
            navigatingAway = true;
            expectNavigationCancellations();
            await page.goto("about:blank", { waitUntil: "load" });
            navigatingAway = false;
            currentRoute = nextRoute;
            await renderRouteWithPage(page, nextRoute);
            renderedCount += 1;
          } catch (error) {
            const failure = { routePath: nextRoute, error: String(error) };
            failedRoutes.push(failure);
            if (failedRoutes.length <= 5) {
              console.error(`[prerender] route failed ${nextRoute}: ${failure.error}`);
            }
          } finally {
            inFlightCount = Math.max(0, inFlightCount - 1);

            const doneCount = renderedCount + failedRoutes.length;
            if (
              doneCount > 0 &&
              (doneCount % prerenderProgressEvery === 0 || doneCount === totalRoutes)
            ) {
              logProgress("progress");
            }
          }
        }
      } finally {
        navigatingAway = true;
        expectNavigationCancellations();
        await page.close();
      }
    });

    await Promise.all(workers);

    await context.close();
  } finally {
    if (progressTimer) {
      clearInterval(progressTimer);
    }
    await browser.close();
    await new Promise((resolve, reject) => {
      server.close((error) => {
        if (error) reject(error);
        else resolve();
      });
    });
  }

  if (blockedRequestsByHost.size > 0) {
    console.log(`[prerender] Intentionally blocked requests: ${Array.from(blockedRequestsByHost)
      .sort(([first], [second]) => first.localeCompare(second))
      .map(([host, count]) => `${host}=${count}`)
      .join(", ")}`);
  }
  if (runtimeIssueCount > 0) {
    console.warn(`[prerender] Runtime diagnostics: ${runtimeIssueCount} occurrence(s), ${runtimeIssues.size} unique issue(s); first ${Math.min(runtimeIssues.size, runtimeIssueLogLimit)} shown.`);
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
  logProgress("completed");
  if (!strictSeoMode && seoWarningCount > 0) {
    console.warn(`[prerender] Completed with ${seoWarningCount} SEO warning route(s).`);
  }
  console.log(
    `Prerendered ${renderedCount} route HTML files into dist with concurrency ${Math.min(prerenderConcurrency, routes.length)} in ${durationSeconds}s`,
  );
}

main().catch((error) => {
  console.error("Prerender failed:", error);
  process.exitCode = 1;
});

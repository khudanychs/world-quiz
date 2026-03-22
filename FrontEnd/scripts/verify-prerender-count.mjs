import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const thisFilePath = fileURLToPath(import.meta.url);
const rootDir = path.resolve(path.dirname(thisFilePath), "..");
const distDir = path.join(rootDir, "dist");
const sitemapPath = path.join(distDir, "sitemap.xml");

function toOutputHtmlPath(routePathname) {
  if (routePathname === "/") {
    return path.join(distDir, "index.html");
  }

  const normalized = routePathname.replace(/^\/+/, "").replace(/\/+$/, "");
  return path.join(distDir, normalized, "index.html");
}

async function safeStat(filePath) {
  try {
    return await fs.stat(filePath);
  } catch {
    return null;
  }
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

async function main() {
  const routes = await parseRoutesFromSitemap();

  if (routes.length === 0) {
    throw new Error("No routes found in dist/sitemap.xml");
  }

  const missingFiles = [];
  let foundCount = 0;

  for (const routePath of routes) {
    const expectedHtmlPath = toOutputHtmlPath(routePath);
    const stat = await safeStat(expectedHtmlPath);
    if (!stat?.isFile()) {
      missingFiles.push(expectedHtmlPath);
      continue;
    }
    foundCount += 1;
  }

  const expectedCount = routes.length;

  if (foundCount !== expectedCount) {
    console.error(
      `Prerender verification failed: expected ${expectedCount} HTML files, found ${foundCount}.`,
    );
    if (missingFiles.length > 0) {
      console.error("Missing files (first 20):");
      for (const missingFile of missingFiles.slice(0, 20)) {
        console.error(`- ${missingFile}`);
      }
    }
    process.exitCode = 1;
    return;
  }

  console.log(`Prerender verification passed: ${foundCount}/${expectedCount} HTML files present.`);
}

main().catch((error) => {
  console.error("Prerender verification error:", error);
  process.exitCode = 1;
});

#!/usr/bin/env node
/**
 * Build lakes.json from Natural Earth 10m lakes data.
 *
 * 1. Fetches ne_10m_lakes GeoJSON from Natural Earth GitHub
 * 2. Filters to named lakes we use in the game
 * 3. Merges multi-part lakes (e.g. Aral Sea = North + South)
 * 4. Simplifies polygon geometries using Douglas-Peucker
 * 5. Writes public/lakes.json
 *
 * Usage:  node scripts/build-lakes.mjs
 */

import { writeFileSync } from "fs";

const PUBLIC = new URL("../public/", import.meta.url).pathname;
const NE_URL =
  "https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_10m_lakes.geojson";

// ── Lake names we want (game name → NE name patterns to match) ──
const LAKE_MAP = {
  "Lake Victoria":    ["Lake Victoria"],
  "Lake Baikal":      ["Lake Baikal"],
  "Lake Titicaca":    ["Lago Titicaca"],
  "Lake Superior":    ["Lake Superior"],
  "Dead Sea":         ["Dead Sea"],
  "Great Salt Lake":  ["Great Salt Lake"],
  "Lake Tanganyika":  ["Lake Tanganyika"],
  "Lake Chad":        ["Lake Chad"],
  "Aral Sea":         ["North Aral Sea", "South Aral Sea"],
  "Lake Michigan":    ["Lake Michigan"],
  "Lake Malawi":      ["Lake Malawi"],
  "Lake Turkana":     ["Lake Turkana"],
  "Lake Ladoga":      ["Lake Ladoga"],
  "Lake Huron":       ["Lake Huron"],
  "Lake Erie":        ["Lake Erie"],
  "Lake Ontario":     ["Lake Ontario"],
  "Lake Winnipeg":    ["Lake Winnipeg"],
  "Lake Volta":       ["Lake Volta"],
};

// Douglas-Peucker simplification
function pointLineDist(p, a, b) {
  const dx = b[0] - a[0], dy = b[1] - a[1];
  const lenSq = dx * dx + dy * dy;
  if (lenSq === 0) return Math.hypot(p[0] - a[0], p[1] - a[1]);
  let t = ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / lenSq;
  t = Math.max(0, Math.min(1, t));
  return Math.hypot(p[0] - (a[0] + t * dx), p[1] - (a[1] + t * dy));
}

function simplifyDP(ring, tolerance) {
  if (ring.length <= 4) return ring; // keep tiny polygons as-is
  let maxDist = 0, maxIdx = 0;
  for (let i = 1; i < ring.length - 1; i++) {
    const d = pointLineDist(ring[i], ring[0], ring[ring.length - 1]);
    if (d > maxDist) { maxDist = d; maxIdx = i; }
  }
  if (maxDist > tolerance) {
    const left = simplifyDP(ring.slice(0, maxIdx + 1), tolerance);
    const right = simplifyDP(ring.slice(maxIdx), tolerance);
    return [...left.slice(0, -1), ...right];
  }
  return [ring[0], ring[ring.length - 1]];
}

function simplifyRing(ring, tolerance) {
  const simplified = simplifyDP(ring, tolerance);
  // Ensure ring is closed
  if (simplified.length >= 3) {
    const first = simplified[0];
    const last = simplified[simplified.length - 1];
    if (first[0] !== last[0] || first[1] !== last[1]) {
      simplified.push([...first]);
    }
  }
  return simplified;
}

function simplifyGeometry(geom, tolerance = 0.04) {
  if (geom.type === "Polygon") {
    return {
      type: "Polygon",
      coordinates: geom.coordinates.map(ring => simplifyRing(ring, tolerance)),
    };
  }
  if (geom.type === "MultiPolygon") {
    return {
      type: "MultiPolygon",
      coordinates: geom.coordinates.map(polygon =>
        polygon.map(ring => simplifyRing(ring, tolerance))
      ),
    };
  }
  return geom;
}

function stripZ(coords) {
  if (typeof coords[0] === "number") {
    return [coords[0], coords[1]]; // single point
  }
  return coords.map(c => stripZ(c));
}

// ── Main ─────────────────────────────────────────────────────────────
async function main() {
  console.log("Fetching Natural Earth 10m lakes...");
  const resp = await fetch(NE_URL);
  if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
  const ne = await resp.json();
  console.log(`  Total NE features: ${ne.features.length}`);

  // Index NE features by name
  const neByName = new Map();
  for (const f of ne.features) {
    const name = f.properties?.name;
    if (!name) continue;
    if (!neByName.has(name)) neByName.set(name, []);
    neByName.get(name).push(f);
  }

  // Build output features
  const outputFeatures = [];
  const matched = new Set();

  for (const [gameName, patterns] of Object.entries(LAKE_MAP)) {
    const allPolygons = [];

    for (const pattern of patterns) {
      const feats = neByName.get(pattern);
      if (!feats) continue;

      for (const feat of feats) {
        const geom = feat.geometry;
        const stripped = { ...geom, coordinates: stripZ(geom.coordinates) };

        if (stripped.type === "Polygon") {
          allPolygons.push(stripped.coordinates);
        } else if (stripped.type === "MultiPolygon") {
          for (const poly of stripped.coordinates) {
            allPolygons.push(poly);
          }
        }
      }
    }

    if (allPolygons.length === 0) {
      console.warn(`  ⚠ No NE data for: ${gameName}`);
      continue;
    }

    matched.add(gameName);

    // Merge into single geometry
    const geom = allPolygons.length === 1
      ? { type: "Polygon", coordinates: allPolygons[0] }
      : { type: "MultiPolygon", coordinates: allPolygons };

    const simplified = simplifyGeometry(geom, 0.04);

    outputFeatures.push({
      type: "Feature",
      properties: { name: gameName },
      geometry: simplified,
    });
  }

  console.log(`  Matched lakes: ${matched.size}/${Object.keys(LAKE_MAP).length}`);
  const missing = Object.keys(LAKE_MAP).filter(n => !matched.has(n));
  if (missing.length > 0) {
    console.warn("  ⚠ Missing:", missing.join(", "));
  }

  // Write output
  const output = {
    type: "FeatureCollection",
    features: outputFeatures,
  };

  const json = JSON.stringify(output);
  const outPath = PUBLIC + "lakes.json";
  writeFileSync(outPath, json);
  console.log(`\n✓ Written: ${outPath}`);
  console.log(`  Features: ${outputFeatures.length}`);
  console.log(`  Size: ${(json.length / 1024).toFixed(0)} KB`);
}

main().catch(e => { console.error(e); process.exit(1); });

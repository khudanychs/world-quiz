#!/usr/bin/env node
/**
 * Build rivers.json from Natural Earth 10m river centerline data.
 *
 * 1. Fetches BOTH ne_10m_rivers_lake_centerlines AND the scale_rank variant
 *    (the latter has ~3× more features including many rivers missing from the base file)
 * 2. Matches rivers by name, name_en AND name_alt fields
 * 3. Merges multi-segment rivers into single MultiLineString features
 * 4. Simplifies geometries using Douglas-Peucker (manual impl, no deps)
 * 5. Writes public/rivers.json
 *
 * Usage:  node scripts/build-rivers.mjs
 */

import { writeFileSync } from "fs";

const PUBLIC = new URL("../public/", import.meta.url).pathname;
// Base dataset (~1 455 features)
const NE_URL =
  "https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_10m_rivers_lake_centerlines.geojson";
// Scale-rank dataset (~4 224 features) — contains rivers not in the base file
const NE_SR_URL =
  "https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_10m_rivers_lake_centerlines_scale_rank.geojson";

// ── River names we want (game feature name → Natural Earth name field values) ──
// Patterns are matched against NE "name", "name_en" AND "name_alt" fields.
// Keys = game name, values = array of NE name substrings to match.
const RIVER_MAP = {
  // Already in the game
  "Nile":        ["Nile"],
  "Amazon":      ["Amazon", "Amazonas"],
  "Mississippi": ["Mississippi"],
  "Danube":      ["Danube"],
  "Rhine":       ["Rhine"],
  "Thames":      ["Thames"],
  "Yangtze":     ["Yangtze", "Chang Jiang"],
  "Ganges":      ["Ganges", "Ganga"],
  "Mekong":      ["Mekong", "Mékong"],
  "Congo":       ["Congo"],
  "Volga":       ["Volga"],
  "Zambezi":     ["Zambezi"],
  "Niger":       ["Niger"],
  "Indus":       ["Indus"],

  // NEW — Africa
  "Orange River":   ["Orange"],
  "Limpopo":        ["Limpopo"],
  "Senegal River":  ["Sénégal", "Senegal"],
  "Blue Nile":      ["Blue Nile", "El Bahr el Azraq", "Abay"],
  "White Nile":     ["White Nile", "Bahr el Jebel", "El Bahr el Abyad", "Victoria Nile", "Albert Nile"],
  "Volta":          ["Volta"],
  "Okavango":       ["Okavango", "Cubango"],
  "Ubangi":         ["Ubangi", "Oubangui"],
  "Kasai":          ["Kasai"],
  "Jubba":          ["Jubba", "Juba"],
  "Shabelle":       ["Shabelle", "Shebelle", "Shebele", "Shabeelle"],

  // NEW — Asia
  "Yellow River":   ["Yellow", "Huang He", "Huang"],
  "Ob":             ["Ob"],
  "Yenisei":        ["Yenisei", "Yenisey"],
  "Lena":           ["Lena"],
  "Amur":           ["Amur"],
  "Irrawaddy":      ["Irrawaddy", "Ayeyarwady"],
  "Salween":        ["Salween", "Thanlwin", "Nu"],
  "Brahmaputra":    ["Brahmaputra"],
  "Tigris":         ["Tigris"],
  "Euphrates":      ["Euphrates", "Fırat"],
  "Amu Darya":      ["Amu Darya", "Amu"],
  "Syr Darya":      ["Syr Darya", "Syr"],
  "Jordan River":   ["Jordan"],
  "Helmand":        ["Helmand"],
  "Godavari":       ["Godavari", "Godävari"],
  "Krishna":        ["Krishna"],
  "Narmada":        ["Narmada"],
  "Chao Phraya":    ["Chao Phraya"],
  "Red River (Asia)": ["Red", "Hong"],
  "Pearl River":    ["Pearl", "Zhu"],
  "Xi River":       ["Xi"],
  "Kolyma":         ["Kolyma"],
  "Indigirka":      ["Indigirka"],
  "Ural River":     ["Ural"],

  // NEW — Europe
  "Seine":          ["Seine"],
  "Loire":          ["Loire"],
  "Po":             ["Po"],
  "Elbe":           ["Elbe"],
  "Oder":           ["Oder"],
  "Vistula":        ["Vistula", "Wisła"],
  "Dnieper":        ["Dnieper", "Dnepr", "Dnipro"],
  "Don":            ["Don"],
  "Tagus":          ["Tagus", "Tajo", "Tejo"],
  "Ebro":           ["Ebro"],
  "Garonne":        ["Garonne"],
  "Rhône":          ["Rhône", "Rhone"],
  "Tiber":          ["Tiber", "Tevere"],
  "Shannon":        ["Shannon"],
  "Dniester":       ["Dniester", "Dnestr"],
  "Douro":          ["Douro", "Duero"],
  "Guadalquivir":   ["Guadalquivir"],
  "Dvina":          ["Dvina"],
  "Pechora":        ["Pechora"],
  "Kama":           ["Kama"],

  // NEW — North America
  "Missouri":       ["Missouri"],
  "Colorado River": ["Colorado"],
  "Columbia":       ["Columbia"],
  "Rio Grande":     ["Rio Grande"],
  "Yukon":          ["Yukon"],
  "Mackenzie":      ["Mackenzie"],
  "Ohio":           ["Ohio"],
  "St. Lawrence":   ["St. Lawrence", "Saint Lawrence"],
  "Arkansas River": ["Arkansas"],
  "Red River (NA)": ["Red"],
  "Snake River":    ["Snake"],
  "Saskatchewan":   ["Saskatchewan"],
  "Nelson":         ["Nelson"],
  "Churchill":      ["Churchill"],
  "Fraser":         ["Fraser"],
  "Tennessee":      ["Tennessee"],
  "Platte":         ["Platte"],
  "Peace River":    ["Peace"],
  "Athabasca":      ["Athabasca"],
  "Ottawa River":   ["Ottawa"],

  // NEW — South America
  // NE labels the entire Paraná+Paraguay system as "Paraná" — we split them
  // geographically in post-processing (see SPLIT_RIVERS below)
  "Paraná":         ["Paraná", "Parana"],
  "Paraguay River": ["Paraná", "Parana"],
  "Orinoco":        ["Orinoco"],
  "São Francisco":  ["São Francisco", "São  Francisco", "Sao Francisco"],
  "Magdalena":      ["Magdalena"],
  "Uruguay River":  ["Uruguay"],
  "Tocantins":      ["Tocantins"],
  "Madeira":        ["Madeira"],
  "Negro":          ["Negro"],
  "Putumayo":       ["Putumayo"],
  "Japurá":         ["Japurá", "Caquetá"],
  "Xingu":          ["Xingu"],
  "Tapajós":        ["Tapajós", "Tapajos"],
  "Araguaia":       ["Araguaia"],

  // NEW — Oceania
  "Murray":         ["Murray"],
  "Darling":        ["Darling"],
};

// ── Rivers that need geographic splitting ────────────────────────────
// Some NE rivers are labelled identically but are geographically distinct.
// After collecting all segments for a river, we classify each segment.
const SPLIT_RIVERS = {
  // The confluence of Paraná and Paraguay is near (-58.5, -27.3).
  // Real Paraguay River: runs lon -55..-58 from lat -14 down to -27 (north-south
  // along the western edge of Paraguay/Pantanal)
  // Real Paraná: runs lon -50..-55 from lat -19 down then west to the confluence
  "Paraguay River": {
    keep: (line) => {
      const lons = line.map(c => c[0]);
      const lats = line.map(c => c[1]);
      const avgLon = lons.reduce((a,b) => a+b, 0) / lons.length;
      const maxLat = Math.max(...lats);
      const minLat = Math.min(...lats);
      // Main Paraguay corridor: west of lon -56, north of confluence (-27.5),
      // and doesn't extend far south (minLat > -28 excludes post-confluence sections)
      if (avgLon < -56 && maxLat > -27.5 && minLat > -28) return true;
      // Upper Paraguay headwaters: near lat -14/-15, west of lon -55
      if (maxLat > -15 && avgLon < -55) return true;
      return false;
    }
  },
  "Paraná": {
    keep: (line) => {
      const lons = line.map(c => c[0]);
      const lats = line.map(c => c[1]);
      const avgLon = lons.reduce((a,b) => a+b, 0) / lons.length;
      const maxLat = Math.max(...lats);
      const minLat = Math.min(...lats);
      // Exclude Paraguay corridor segments (inverse of above)
      if (avgLon < -56 && maxLat > -27.5 && minLat > -28) return false;
      if (maxLat > -15 && avgLon < -55) return false;
      return true;
    }
  },

  // ── Negro: 3 rivers share the name (Patagonia, Uruguay, Amazon tributary) ──
  // Game wants only the Amazon tributary Rio Negro (lat -3..+4)
  "Negro": {
    keep: (line) => {
      const lats = line.map(c => c[1]);
      const avgLat = lats.reduce((a,b) => a+b, 0) / lats.length;
      return avgLat > -5; // Patagonia ≈ -40, Uruguay ≈ -32
    }
  },

  // ── Colorado River: USA vs Argentina ──
  // Game wants the US Colorado (lat 32–40)
  "Colorado River": {
    keep: (line) => {
      const lats = line.map(c => c[1]);
      const avgLat = lats.reduce((a,b) => a+b, 0) / lats.length;
      return avgLat > 25; // Argentina ≈ -38
    }
  },

  // ── Red River (Asia): NE "Red" matches many rivers worldwide ──
  // Game wants the Vietnam/China Red River (lon > 90)
  "Red River (Asia)": {
    keep: (line) => {
      const lons = line.map(c => c[0]);
      const avgLon = lons.reduce((a,b) => a+b, 0) / lons.length;
      return avgLon > 90;
    }
  },

  // ── Red River (NA): keep only North American segments ──
  // Two legitimate branches: Red River of the North and Red River (TX/OK)
  "Red River (NA)": {
    keep: (line) => {
      const lons = line.map(c => c[0]);
      const lats = line.map(c => c[1]);
      const avgLon = lons.reduce((a,b) => a+b, 0) / lons.length;
      const avgLat = lats.reduce((a,b) => a+b, 0) / lats.length;
      return avgLon > -110 && avgLon < -80 && avgLat > 25 && avgLat < 55;
    }
  },

  // ── Churchill: Manitoba vs Labrador ──
  // Game wants the Churchill River flowing into Hudson Bay (Manitoba)
  "Churchill": {
    keep: (line) => {
      const lons = line.map(c => c[0]);
      const avgLon = lons.reduce((a,b) => a+b, 0) / lons.length;
      return avgLon < -90; // Manitoba ≈ -103, Labrador ≈ -64
    }
  },

  // ── Fraser: British Columbia vs spurious Labrador match ──
  "Fraser": {
    keep: (line) => {
      const lons = line.map(c => c[0]);
      const avgLon = lons.reduce((a,b) => a+b, 0) / lons.length;
      return avgLon < -115; // BC ≈ -121, Labrador ≈ -63
    }
  },

  // ── Mackenzie: NWT Canada vs spurious Australia match ──
  "Mackenzie": {
    keep: (line) => {
      const lons = line.map(c => c[0]);
      const avgLon = lons.reduce((a,b) => a+b, 0) / lons.length;
      return avgLon < 0; // NWT ≈ -127, Australia ≈ +149
    }
  },

  // ── Dvina: Northern Dvina vs Western Dvina (Daugava) ──
  // Game wants Northern Dvina (lon > 35, lat > 60)
  "Dvina": {
    keep: (line) => {
      const lons = line.map(c => c[0]);
      const avgLon = lons.reduce((a,b) => a+b, 0) / lons.length;
      return avgLon > 35; // Northern ≈ 44, Western ≈ 30
    }
  },
};

// ── Rivers where we only want EXACT name matches (no substring) ──────
// Prevents "Rio Grande" from matching "Río Grande de Matagalpa" etc.
const EXACT_MATCH_ONLY = new Set(["Rio Grande"]);

// Douglas-Peucker simplification
function pointLineDist(p, a, b) {
  const dx = b[0] - a[0], dy = b[1] - a[1];
  const lenSq = dx * dx + dy * dy;
  if (lenSq === 0) return Math.hypot(p[0] - a[0], p[1] - a[1]);
  let t = ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / lenSq;
  t = Math.max(0, Math.min(1, t));
  return Math.hypot(p[0] - (a[0] + t * dx), p[1] - (a[1] + t * dy));
}

function simplifyDP(coords, tolerance) {
  if (coords.length <= 2) return coords;
  let maxDist = 0, maxIdx = 0;
  for (let i = 1; i < coords.length - 1; i++) {
    const d = pointLineDist(coords[i], coords[0], coords[coords.length - 1]);
    if (d > maxDist) { maxDist = d; maxIdx = i; }
  }
  if (maxDist > tolerance) {
    const left = simplifyDP(coords.slice(0, maxIdx + 1), tolerance);
    const right = simplifyDP(coords.slice(maxIdx), tolerance);
    return [...left.slice(0, -1), ...right];
  }
  return [coords[0], coords[coords.length - 1]];
}

function simplifyGeometry(geom, tolerance = 0.035) {
  if (geom.type === "LineString") {
    return { type: "LineString", coordinates: simplifyDP(geom.coordinates, tolerance) };
  }
  if (geom.type === "MultiLineString") {
    return {
      type: "MultiLineString",
      coordinates: geom.coordinates.map(line => simplifyDP(line, tolerance)),
    };
  }
  return geom;
}

// ── Main ─────────────────────────────────────────────────────────────
async function fetchWithRetry(url, label, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      console.log(`  Fetching ${label}... (attempt ${i + 1})`);
      const resp = await fetch(url);
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      return await resp.json();
    } catch (e) {
      if (i < retries - 1) {
        console.log(`  ⚠ Retry after error: ${e.message}`);
        await new Promise(r => setTimeout(r, 2000));
      } else throw e;
    }
  }
}

async function main() {
  console.log("Fetching Natural Earth 10m rivers...");
  const ne1 = await fetchWithRetry(NE_URL, "base");
  console.log(`  Base features: ${ne1.features.length}`);

  const ne2 = await fetchWithRetry(NE_SR_URL, "scale-rank");
  console.log(`  Scale-rank features: ${ne2.features.length}`);

  // Combine both datasets (dedup by geometry identity is done later per-river)
  const allFeatures = [...ne1.features, ...ne2.features];
  console.log(`  Combined features: ${allFeatures.length}`);

  // Index NE features by all name fields: name, name_en, name_alt
  // Each index maps a name string → array of features
  const nameIndex = new Map();
  const nameEnIndex = new Map();
  const nameAltIndex = new Map();

  function addToIndex(index, key, feat) {
    if (!key) return;
    if (!index.has(key)) index.set(key, []);
    index.get(key).push(feat);
  }

  for (const f of allFeatures) {
    addToIndex(nameIndex,    f.properties?.name,     f);
    addToIndex(nameEnIndex,  f.properties?.name_en,  f);
    addToIndex(nameAltIndex, f.properties?.name_alt,  f);
  }

  console.log(`  Unique names: ${nameIndex.size}, name_en: ${nameEnIndex.size}, name_alt: ${nameAltIndex.size}`);

  // Build output features
  const outputFeatures = [];
  const matched = new Set();

  for (const [gameName, patterns] of Object.entries(RIVER_MAP)) {
    // Collect all matching NE features from all three name indexes
    const segmentSet = new Set(); // track by reference to avoid duplicates
    const segments = [];

    function addSegments(feats) {
      for (const f of feats) {
        if (!segmentSet.has(f)) {
          segmentSet.add(f);
          segments.push(f);
        }
      }
    }

    const exactOnly = EXACT_MATCH_ONLY.has(gameName);

    function searchIndex(index, pattern) {
      if (exactOnly) {
        // Only exact name match
        if (index.has(pattern)) {
          addSegments(index.get(pattern));
        }
      } else {
        for (const [indexName, feats] of index) {
          if (
            indexName === pattern ||
            indexName.startsWith(pattern + " ") ||
            indexName.endsWith(" " + pattern)
          ) {
            addSegments(feats);
          }
        }
        // Direct lookup
        if (index.has(pattern)) {
          addSegments(index.get(pattern));
        }
      }
    }

    for (const pattern of patterns) {
      searchIndex(nameIndex, pattern);
      searchIndex(nameEnIndex, pattern);
      searchIndex(nameAltIndex, pattern);
    }

    if (segments.length === 0) {
      // console.warn(`  ⚠ No NE data for: ${gameName}`);
      continue;
    }

    matched.add(gameName);

    // Merge all segments into one MultiLineString
    const allCoords = [];
    for (const seg of segments) {
      if (seg.geometry.type === "LineString") {
        allCoords.push(seg.geometry.coordinates.map(c => [c[0], c[1]])); // strip Z
      } else if (seg.geometry.type === "MultiLineString") {
        for (const line of seg.geometry.coordinates) {
          allCoords.push(line.map(c => [c[0], c[1]]));
        }
      }
    }

    // Deduplicate coordinate arrays (same start+end → same segment)
    const seen = new Set();
    let uniqueCoords = allCoords.filter(line => {
      const key = line[0].join(",") + "|" + line[line.length - 1].join(",");
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    // Apply geographic split filter if configured
    if (SPLIT_RIVERS[gameName]) {
      const { keep } = SPLIT_RIVERS[gameName];
      const filtered = uniqueCoords.filter(keep);
      if (filtered.length > 0) {
        uniqueCoords = filtered;
      } else {
        console.warn(`  ⚠ Split filter for ${gameName} removed all segments — keeping original`);
      }
    }

    const geom = uniqueCoords.length === 1
      ? { type: "LineString", coordinates: uniqueCoords[0] }
      : { type: "MultiLineString", coordinates: uniqueCoords };

    const simplified = simplifyGeometry(geom, 0.035);

    outputFeatures.push({
      type: "Feature",
      properties: { name: gameName },
      geometry: simplified,
    });
  }

  console.log(`  Matched rivers: ${matched.size}`);
  const missing = Object.keys(RIVER_MAP).filter(n => !matched.has(n));
  if (missing.length > 0) {
    console.warn("  ⚠ Missing:", missing.join(", "));
  }

  // Write output
  const output = {
    type: "FeatureCollection",
    features: outputFeatures,
  };

  const json = JSON.stringify(output);
  const outPath = PUBLIC + "rivers.json";
  writeFileSync(outPath, json);
  console.log(`\n✓ Written: ${outPath}`);
  console.log(`  Features: ${outputFeatures.length}`);
  console.log(`  Size: ${(json.length / 1024).toFixed(0)} KB`);
}

main().catch(e => { console.error(e); process.exit(1); });

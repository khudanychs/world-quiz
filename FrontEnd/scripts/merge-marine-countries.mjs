#!/usr/bin/env node
/**
 * Merge countries + marine polygons into a single optimized TopoJSON file.
 *
 * Strategy:
 *   1. Use countries-50m.json for detailed land/coastline shapes
 *   2. Use FinalMarine50m as base marine data (smaller, 115 features)
 *   3. Supplement with FinalMarine10m features that only exist in 10m
 *   4. Filter marine to only features the game actually uses
 *   5. Normalize property names (moje_nazvy → name)
 *   6. Merge into a single compact TopoJSON with shared arcs
 *
 * Output:  public/world-marine.json
 *   - objects.countries  → country boundaries (for borderless land fill)
 *   - objects.land       → single merged land shape
 *   - objects.marine     → marine polygon features (seas, oceans, gulfs, etc.)
 */

import { readFileSync, writeFileSync } from "fs";
import { feature } from "topojson-client";
import { topology } from "topojson-server";

const PUBLIC = new URL("../public/", import.meta.url).pathname;

// ── Game feature names that need marine polygons ──────────────────────
// (extracted from physicalFeatures.ts — excludes straits/canals which use ellipses)
const GAME_WATER_NAMES = new Set([
  // Oceans
  "Pacific Ocean", "Atlantic Ocean", "Indian Ocean", "Arctic Ocean", "Southern Ocean",
  // Seas
  "Mediterranean Sea", "Red Sea", "Black Sea", "Caspian Sea", "Arabian Sea",
  "Caribbean Sea", "South China Sea", "Baltic Sea", "North Sea", "Sea of Japan",
  "Coral Sea", "Tasman Sea", "Adriatic Sea", "Aegean Sea", "Andaman Sea",
  "Barents Sea", "Beaufort Sea", "Bering Sea", "East China Sea", "Greenland Sea",
  "Ionian Sea", "Irish Sea", "Labrador Sea", "Norwegian Sea", "Philippine Sea",
  "Ross Sea", "Sargasso Sea", "Sea of Okhotsk", "Tyrrhenian Sea", "Weddell Sea",
  "Yellow Sea", "Amundsen Sea", "Arafura Sea", "Balearic Sea", "Banda Sea",
  "Bellingshausen Sea", "Bismarck Sea", "Bo Hai", "Celebes Sea", "Ceram Sea",
  "Chukchi Sea", "Great Barrier Reef", "Inner Sea", "Inner Seas", "Java Sea",
  "Kara Sea", "Laccadive Sea", "Laptev Sea", "Molucca Sea", "Scotia Sea",
  "Solomon Sea", "Sulu Sea", "Timor Sea", "White Sea",
  // 10m-only seas
  "Sea of Azov", "Sea of Crete", "Sea of Marmara", "Alboran Sea", "Ligurian Sea",
  "Flores Sea", "Bali Sea", "Savu Sea", "Halmahera Sea", "Samar Sea",
  "Sibuyan Sea", "Visayan Sea", "Bohol Sea", "East Siberian Sea", "Lincoln Sea",
  "Davis Sea", "Salish Sea", "Kattegat", "Skagerrak",
  // Gulfs & Bays
  "Gulf of Mexico", "Bay of Bengal", "Persian Gulf", "Gulf of Aden", "Hudson Bay",
  "Gulf of Alaska", "Gulf of Guinea", "Gulf of Bothnia", "Gulf of Finland",
  "Gulf of Oman", "Gulf of Saint Lawrence", "Gulf of Thailand", "Gulf of Tonkin",
  "Gulf of Carpentaria", "Golfo de California", "Gulf of Honduras", "Gulf of Maine",
  "Gulf of Kutch", "Gulf of Mannar", "Shelikhova Gulf", "Amundsen Gulf",
  "Bahía de Campeche", "Golfe du Lion", "Golfo San Jorge", "Golfo de Panamá",
  // 10m-only gulfs
  "Gulf of Suez", "Gulf of Aqaba", "Gulf of Sidra", "Gulf of Gabès", "Gulf of Riga",
  "Gulf of Papua", "Gulf of Martaban", "Golfo de Tehuantepec", "Golfo San Matías",
  "Joseph Bonaparte Gulf", "Davao Gulf",
  // Bays
  "Bay of Biscay", "Baffin Bay", "Chesapeake Bay", "Great Australian Bight",
  "Bay of Fundy", "Bay of Plenty", "Bristol Bay", "James Bay", "Melville Bay",
  "Ungava Bay", "Cook Inlet", "Río de la Plata",
  // 10m-only bays
  "Delaware Bay", "San Francisco Bay", "Foxe Basin", "Bight of Benin", "Bight of Biafra",
  // Channels
  "Mozambique Channel", "Bristol Channel",
  // Passages
  "Davis Strait", "Drake Passage", "Straits of Florida", "Hudson Strait",
  "Korea Strait", "Luzon Strait", "Makassar Strait", "Strait of Singapore",
  "Taiwan Strait", "The North Western Passages", "Viscount Melville Sound",
]);

// Name normalization map (marine file name → game name)
// Marine files use "INDIAN OCEAN" and "SOUTHERN OCEAN" in caps
const NAME_NORMALIZE = {
  "INDIAN OCEAN": "Indian Ocean",
  "SOUTHERN OCEAN": "Southern Ocean",
};

function normalizeName(name) {
  return NAME_NORMALIZE[name] || name;
}

// ── Load source files ────────────────────────────────────────────────
console.log("Loading source files...");

const countries50m = JSON.parse(readFileSync(PUBLIC + "countries-50m.json", "utf-8"));
const marine10m = JSON.parse(readFileSync(PUBLIC + "FinalMarine10m.json", "utf-8"));
const marine50m = JSON.parse(readFileSync(PUBLIC + "FinalMarine50m.json", "utf-8"));

// ── Convert countries to GeoJSON ─────────────────────────────────────
console.log("Converting countries to GeoJSON...");
const countriesGeo = feature(countries50m, countries50m.objects.countries);
const landGeo = feature(countries50m, countries50m.objects.land);

// ── Extract & merge marine features ──────────────────────────────────
console.log("Extracting marine features...");

const obj10key = Object.keys(marine10m.objects)[0];
const obj50key = Object.keys(marine50m.objects)[0];

// Convert both marine topologies to GeoJSON
const marine10geo = feature(marine10m, marine10m.objects[obj10key]);
const marine50geo = feature(marine50m, marine50m.objects[obj50key]);

// Build a map of 50m features by normalized name
const marine50map = new Map();
for (const feat of marine50geo.features) {
  const name = normalizeName(feat.properties.moje_nazvy || "");
  if (name && GAME_WATER_NAMES.has(name)) {
    marine50map.set(name, feat);
  }
}

// Build final marine feature list:
// - Use 50m version where available (smoother, less data)
// - Fall back to 10m for features only in 10m
const marineFeatures = [];
const usedNames = new Set();

// First add all 50m features we need
for (const [name, feat] of marine50map) {
  marineFeatures.push({
    type: "Feature",
    properties: { name },
    geometry: feat.geometry,
  });
  usedNames.add(name);
}

// Then add 10m-only features
for (const feat of marine10geo.features) {
  const name = normalizeName(feat.properties.moje_nazvy || "");
  if (name && GAME_WATER_NAMES.has(name) && !usedNames.has(name)) {
    marineFeatures.push({
      type: "Feature",
      properties: { name },
      geometry: feat.geometry,
    });
    usedNames.add(name);
  }
}

console.log(`  50m features used: ${marine50map.size}`);
console.log(`  10m-only features added: ${marineFeatures.length - marine50map.size}`);
console.log(`  Total marine features: ${marineFeatures.length}`);

// Check for missing features
const missing = [...GAME_WATER_NAMES].filter(n => !usedNames.has(n));
if (missing.length > 0) {
  console.warn("  ⚠ Missing features:", missing);
}

// ── Build merged GeoJSON collections ─────────────────────────────────
const marineCollection = {
  type: "FeatureCollection",
  features: marineFeatures,
};

// ── Create merged topology ───────────────────────────────────────────
console.log("Building merged topology...");
const merged = topology({
  countries: countriesGeo,
  land: landGeo,
  marine: marineCollection,
}, 1e4); // quantization factor — 10000 keeps good precision while compressing

// ── Write output ─────────────────────────────────────────────────────
const output = JSON.stringify(merged);
const outputPath = PUBLIC + "world-marine.json";
writeFileSync(outputPath, output);

const sizeKB = (output.length / 1024).toFixed(0);
console.log(`\n✓ Written: ${outputPath}`);
console.log(`  Size: ${sizeKB} KB`);
console.log(`  Objects: countries (${merged.objects.countries.geometries.length} geom), land, marine (${merged.objects.marine.geometries.length} geom)`);

// Compare with originals
const origCountries = readFileSync(PUBLIC + "countries-50m.json").length;
const origMarine = readFileSync(PUBLIC + "marine-polys.json").length;
console.log(`\n  Previous: countries-50m.json (${(origCountries/1024).toFixed(0)} KB) + marine-polys.json (${(origMarine/1024).toFixed(0)} KB) = ${((origCountries+origMarine)/1024).toFixed(0)} KB`);
console.log(`  Now:      world-marine.json (${sizeKB} KB) — single request`);

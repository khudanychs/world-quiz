import type { PhysicalFeature } from "./physicalFeaturesTypes";
import { feature as topoFeature } from "topojson-client";
import type { GeometryCollection, Topology } from "topojson-specification";

type Difficulty = PhysicalFeature["difficulty"];

interface GeoJsonGeometry {
  type: string;
  coordinates?: unknown;
}

interface GeoJsonFeature {
  properties?: Record<string, unknown>;
  geometry?: GeoJsonGeometry | null;
}

interface GeoJsonCollection {
  type?: string;
  features?: GeoJsonFeature[];
}

interface GeoJsonSingleFeature {
  type?: string;
  properties?: Record<string, unknown>;
  geometry?: GeoJsonGeometry | null;
}

type TopologyLike = Topology & { objects?: Record<string, unknown> };

interface PolygonFilterConfig {
  minArea: number;
  maxAreaRatio: number;
}

const MOUNTAIN_RANGES_URL = "/region_polys/Mountain ranges.json";
const ELEVATION_POINTS_URL = "/region_polys/elev_points.json";
const DESERTS_URL = "/region_polys/deserts.json";

const RANGE_NAME_KEYS = ["NAME_EN", "NAME", "LABEL", "NAMEALT"] as const;
const DESERT_NAME_KEYS = ["NAME_EN", "NAME", "LABEL", "NAMEALT"] as const;
const ELEVATION_NAME_KEYS = ["name_en", "name", "name_alt", "label"] as const;

// Tunable polygon cleanup: drop tiny detached fragments from MultiPolygon features.
const MOUNTAIN_RANGE_POLYGON_FILTER: PolygonFilterConfig = {
  minArea: 0.05,
  maxAreaRatio: 0.02,
};

const DESERT_POLYGON_FILTER: PolygonFilterConfig = {
  minArea: 0.01,
  maxAreaRatio: 0.02,
};

const mountainsPromiseByLanguage = new Map<string, Promise<PhysicalFeature[]>>();
const desertsPromiseByLanguage = new Map<string, Promise<PhysicalFeature[]>>();

function getBaseLanguage(language: string): "en" | "cs" | "de" {
  const value = (language || "en").toLowerCase().split("-")[0];
  if (value === "cs" || value === "cz") return "cs";
  if (value === "de") return "de";
  return "en";
}

function getLocalizedNameKeys(baseKeys: readonly string[], language: string): string[] {
  const currentLanguage = getBaseLanguage(language);
  if (currentLanguage === "cs") {
    return ["name_cs", "NAME_CS", "name_cz", "NAME_CZ", ...baseKeys];
  }
  if (currentLanguage === "de") {
    return ["name_de", "NAME_DE", ...baseKeys];
  }
  return [...baseKeys];
}

function normalizeFeatureLabel(raw: string): string {
  const trimmed = raw.trim().replace(/\s+/g, " ");
  const hasUpper = /[A-Z]/.test(trimmed);
  const hasLower = /[a-z]/.test(trimmed);

  // Data files occasionally store labels in full uppercase (e.g. BROOKS RANGE).
  // Convert these to readable title case while preserving regular mixed-case names.
  if (hasUpper && !hasLower) {
    return trimmed
      .toLowerCase()
      .replace(/(^|[\s\-\/\(])([a-z])/g, (_m, p1: string, p2: string) => `${p1}${p2.toUpperCase()}`)
      .replace(/'([a-z])/g, (_m, p1: string) => `'${p1.toUpperCase()}`);
  }

  return trimmed;
}

function toDifficulty(raw: unknown): Difficulty {
  const scalerank = Number(raw);
  if (!Number.isFinite(scalerank)) {
    return "medium";
  }
  if (scalerank <= 1) {
    return "easy";
  }
  if (scalerank <= 2) {
    return "medium";
  }
  return "hard";
}

function stringProp(properties: Record<string, unknown> | undefined, keys: readonly string[]): string | null {
  if (!properties) {
    return null;
  }
  for (const key of keys) {
    const value = properties[key];
    if (typeof value === "string" && value.trim()) {
      return normalizeFeatureLabel(value);
    }
  }
  return null;
}

function normalizePoint(raw: unknown): [number, number] | null {
  if (!Array.isArray(raw) || raw.length < 2) {
    return null;
  }
  const lon = Number(raw[0]);
  const lat = Number(raw[1]);
  if (!Number.isFinite(lon) || !Number.isFinite(lat)) {
    return null;
  }
  return [lon, lat];
}

function normalizeRing(rawRing: unknown): [number, number][] | null {
  if (!Array.isArray(rawRing)) {
    return null;
  }

  const points: [number, number][] = [];
  for (const point of rawRing) {
    const normalized = normalizePoint(point);
    if (!normalized) {
      continue;
    }
    points.push(normalized);
  }

  return points.length >= 3 ? points : null;
}

function getPolygonArea(points: [number, number][]): number {
  if (points.length < 3) {
    return 0;
  }

  let area = 0;
  for (let i = 0; i < points.length; i += 1) {
    const [x1, y1] = points[i];
    const [x2, y2] = points[(i + 1) % points.length];
    area += x1 * y2 - x2 * y1;
  }

  return Math.abs(area) / 2;
}

function filterTinyPolygonFragments(
  rings: [number, number][][],
  config: PolygonFilterConfig,
): [number, number][][] {
  if (rings.length <= 1) {
    return rings;
  }

  const withArea = rings.map((ring) => ({
    ring,
    area: getPolygonArea(ring),
  }));

  const maxArea = withArea.reduce((max, entry) => Math.max(max, entry.area), 0);
  if (!Number.isFinite(maxArea) || maxArea <= 0) {
    return rings;
  }

  const filtered = withArea
    .filter((entry) => !(entry.area < config.minArea && entry.area < maxArea * config.maxAreaRatio))
    .map((entry) => entry.ring);

  return filtered.length > 0 ? filtered : [withArea[0].ring];
}

function polygonRingsFromGeometry(geometry: GeoJsonGeometry | null | undefined): [number, number][][] {
  if (!geometry || !geometry.coordinates) {
    return [];
  }

  if (geometry.type === "Polygon" && Array.isArray(geometry.coordinates)) {
    const ring = normalizeRing((geometry.coordinates as unknown[])[0]);
    return ring ? [ring] : [];
  }

  if (geometry.type === "MultiPolygon" && Array.isArray(geometry.coordinates)) {
    const polygons = geometry.coordinates as unknown[];
    const rings: [number, number][][] = [];
    for (const polygon of polygons) {
      if (!Array.isArray(polygon)) {
        continue;
      }
      const ring = normalizeRing(polygon[0]);
      if (ring) {
        rings.push(ring);
      }
    }
    return rings;
  }

  return [];
}

function uniqueName(baseName: string, used: Map<string, number>): string {
  const normalized = baseName.trim();
  const count = used.get(normalized) ?? 0;
  used.set(normalized, count + 1);
  return count === 0 ? normalized : `${normalized} (${count + 1})`;
}

function ensureUniqueFeatureNames(features: PhysicalFeature[]): PhysicalFeature[] {
  const used = new Map<string, number>();
  return features.map((feature) => {
    const nextName = uniqueName(feature.name, used);
    if (nextName === feature.name) {
      return feature;
    }
    return { ...feature, name: nextName };
  });
}

async function fetchGeoJson(
  url: string,
  preferredObjectKeys: readonly string[] = [],
): Promise<GeoJsonCollection> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}`);
  }

  const raw = (await response.json()) as unknown;
  return { features: toGeoJsonFeatures(raw, preferredObjectKeys) };
}

function asFeatureCollection(value: unknown): GeoJsonCollection | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const collection = value as GeoJsonCollection;
  if (collection.type === "FeatureCollection" && Array.isArray(collection.features)) {
    return collection;
  }

  return null;
}

function asSingleFeature(value: unknown): GeoJsonSingleFeature | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const single = value as GeoJsonSingleFeature;
  if (single.type === "Feature") {
    return single;
  }

  return null;
}

function asTopology(value: unknown): TopologyLike | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const topology = value as TopologyLike;
  if (topology.type === "Topology" && topology.objects && typeof topology.objects === "object") {
    return topology;
  }

  return null;
}

function pickObjectKey(objects: Record<string, unknown>, preferredObjectKeys: readonly string[]): string | null {
  for (const key of preferredObjectKeys) {
    if (key in objects) {
      return key;
    }
  }

  const keys = Object.keys(objects);
  return keys.length > 0 ? keys[0] : null;
}

function toGeoJsonFeatures(
  raw: unknown,
  preferredObjectKeys: readonly string[] = [],
): GeoJsonFeature[] {
  const collection = asFeatureCollection(raw);
  if (collection?.features) {
    return collection.features;
  }

  const single = asSingleFeature(raw);
  if (single) {
    return [single];
  }

  const topology = asTopology(raw);
  if (!topology?.objects) {
    return [];
  }

  const objectKey = pickObjectKey(topology.objects, preferredObjectKeys);
  if (!objectKey) {
    return [];
  }

  const converted = topoFeature(topology, topology.objects[objectKey] as GeometryCollection) as unknown;
  const convertedCollection = asFeatureCollection(converted);
  if (convertedCollection?.features) {
    return convertedCollection.features;
  }

  const convertedSingle = asSingleFeature(converted);
  return convertedSingle ? [convertedSingle] : [];
}

function buildRangePolygonFeatures(features: GeoJsonFeature[], language: string = "en"): PhysicalFeature[] {
  const out: PhysicalFeature[] = [];
  const grouped = new Map<string, { difficulty: Difficulty; rings: [number, number][][] }>();

  for (const feature of features) {
    const baseName = stringProp(feature.properties, getLocalizedNameKeys(RANGE_NAME_KEYS, language));
    if (!baseName) {
      continue;
    }

    const rings = filterTinyPolygonFragments(
      polygonRingsFromGeometry(feature.geometry),
      MOUNTAIN_RANGE_POLYGON_FILTER,
    );
    if (rings.length === 0) {
      continue;
    }

    const normalizedName = baseName.trim();
    const difficulty = toDifficulty(feature.properties?.SCALERANK);
    const existing = grouped.get(normalizedName);

    if (!existing) {
      grouped.set(normalizedName, {
        difficulty,
        rings: [...rings],
      });
      continue;
    }

    const mergedDifficulty =
      existing.difficulty === "easy" || difficulty === "easy"
        ? "easy"
        : existing.difficulty === "medium" || difficulty === "medium"
          ? "medium"
          : "hard";

    grouped.set(normalizedName, {
      difficulty: mergedDifficulty,
      rings: [...existing.rings, ...rings],
    });
  }

  for (const [name, value] of grouped) {
    if (value.rings.length === 1) {
      out.push({
        name,
        type: "mountain_range",
        difficulty: value.difficulty,
        shape: { kind: "polygon", points: value.rings[0] },
      });
      continue;
    }

    out.push({
      name,
      type: "mountain_range",
      difficulty: value.difficulty,
      shape: { kind: "polygon_collection", polygons: value.rings },
    });
  }

  return out;
}

function buildElevationPointFeatures(features: GeoJsonFeature[], language: string = "en"): PhysicalFeature[] {
  const out: PhysicalFeature[] = [];
  const usedNames = new Map<string, number>();

  for (const feature of features) {
    const baseName = stringProp(feature.properties, getLocalizedNameKeys(ELEVATION_NAME_KEYS, language));
    const coords = normalizePoint(feature.geometry?.coordinates);
    if (!baseName || !coords) {
      continue;
    }

    out.push({
      name: uniqueName(baseName, usedNames),
      type: "mountain",
      difficulty: toDifficulty(feature.properties?.scalerank),
      shape: { kind: "marker", center: coords },
    });
  }

  return out;
}

function buildDesertPolygonFeatures(features: GeoJsonFeature[], language: string = "en"): PhysicalFeature[] {
  const out: PhysicalFeature[] = [];
  const usedNames = new Map<string, number>();

  for (const feature of features) {
    const baseName = stringProp(feature.properties, getLocalizedNameKeys(DESERT_NAME_KEYS, language));
    if (!baseName) {
      continue;
    }

    const rings = filterTinyPolygonFragments(
      polygonRingsFromGeometry(feature.geometry),
      DESERT_POLYGON_FILTER,
    );
    const difficulty = toDifficulty(feature.properties?.SCALERANK);
    for (const ring of rings) {
      out.push({
        name: uniqueName(baseName, usedNames),
        type: "desert",
        difficulty,
        shape: { kind: "polygon", points: ring },
      });
    }
  }

  return out;
}

export async function loadMountainElevationFeatures(language: string = "en"): Promise<PhysicalFeature[]> {
  const currentLanguage = getBaseLanguage(language);
  if (!mountainsPromiseByLanguage.has(currentLanguage)) {
    mountainsPromiseByLanguage.set(currentLanguage, Promise.all([
      fetchGeoJson(MOUNTAIN_RANGES_URL, ["Mountain ranges", "mountain_ranges", "ranges"]),
      fetchGeoJson(ELEVATION_POINTS_URL, ["elev_points", "elevation_points", "points"]),
    ]).then(([rangesData, pointsData]) => {
      const ranges = buildRangePolygonFeatures(rangesData.features ?? [], currentLanguage);
      const points = buildElevationPointFeatures(pointsData.features ?? [], currentLanguage);
      return ensureUniqueFeatureNames([...points, ...ranges]);
    }));
  }

  return mountainsPromiseByLanguage.get(currentLanguage)!;
}

export async function loadDesertPolygonFeatures(language: string = "en"): Promise<PhysicalFeature[]> {
  const currentLanguage = getBaseLanguage(language);
  if (!desertsPromiseByLanguage.has(currentLanguage)) {
    desertsPromiseByLanguage.set(currentLanguage, fetchGeoJson(DESERTS_URL, ["deserts", "desert_polygons", "desert"]).then((desertData) =>
      buildDesertPolygonFeatures(desertData.features ?? [], currentLanguage),
    ));
  }

  return desertsPromiseByLanguage.get(currentLanguage)!;
}

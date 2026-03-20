import type { PhysicalFeature } from "./physicalFeaturesTypes";

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
  features?: GeoJsonFeature[];
}

interface PolygonFilterConfig {
  minArea: number;
  maxAreaRatio: number;
}

const MOUNTAIN_RANGES_URL = "/region_polys/Mountain ranges.geojson";
const ELEVATION_POINTS_URL = "/region_polys/elev_points.geojson";
const DESERTS_URL = "/region_polys/deserts.geojson";

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

let mountainsPromise: Promise<PhysicalFeature[]> | null = null;
let desertsPromise: Promise<PhysicalFeature[]> | null = null;

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
      return value.trim();
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

async function fetchGeoJson(url: string): Promise<GeoJsonCollection> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}`);
  }
  return response.json() as Promise<GeoJsonCollection>;
}

function buildRangePolygonFeatures(features: GeoJsonFeature[]): PhysicalFeature[] {
  const out: PhysicalFeature[] = [];
  const grouped = new Map<string, { difficulty: Difficulty; rings: [number, number][][] }>();

  for (const feature of features) {
    const baseName = stringProp(feature.properties, RANGE_NAME_KEYS);
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

function buildElevationPointFeatures(features: GeoJsonFeature[]): PhysicalFeature[] {
  const out: PhysicalFeature[] = [];
  const usedNames = new Map<string, number>();

  for (const feature of features) {
    const baseName = stringProp(feature.properties, ELEVATION_NAME_KEYS);
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

function buildDesertPolygonFeatures(features: GeoJsonFeature[]): PhysicalFeature[] {
  const out: PhysicalFeature[] = [];
  const usedNames = new Map<string, number>();

  for (const feature of features) {
    const baseName = stringProp(feature.properties, DESERT_NAME_KEYS);
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

export async function loadMountainElevationFeatures(): Promise<PhysicalFeature[]> {
  if (!mountainsPromise) {
    mountainsPromise = Promise.all([
      fetchGeoJson(MOUNTAIN_RANGES_URL),
      fetchGeoJson(ELEVATION_POINTS_URL),
    ]).then(([rangesData, pointsData]) => {
      const ranges = buildRangePolygonFeatures(rangesData.features ?? []);
      const points = buildElevationPointFeatures(pointsData.features ?? []);
      return ensureUniqueFeatureNames([...points, ...ranges]);
    });
  }

  return mountainsPromise;
}

export async function loadDesertPolygonFeatures(): Promise<PhysicalFeature[]> {
  if (!desertsPromise) {
    desertsPromise = fetchGeoJson(DESERTS_URL).then((desertData) =>
      buildDesertPolygonFeatures(desertData.features ?? []),
    );
  }

  return desertsPromise;
}

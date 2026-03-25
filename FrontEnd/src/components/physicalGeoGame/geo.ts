import { geoArea, geoBounds, geoCentroid, type GeoPermissibleObjects } from "d3-geo";
import { feature as topoFeature } from "topojson-client";
import type { Topology, GeometryCollection } from "topojson-specification";

export type GeoFeatureKind = "marine" | "river" | "lake";

// Unified land base for all physical-geo modes (TopoJSON).
export const GEO_LAND_URL = "/GeoLand.json";
export const MARINE_URL = "/FinalMarines10m.json";
export const MERGED_URL = GEO_LAND_URL;
export const RIVERS_URL = "/fixed_rivers.json";
export const LAKES_URL = "/lakes.json";

export interface GeoFeature {
  type: "Feature";
  properties?: Record<string, unknown>;
  geometry: GeoPermissibleObjects | null;
}

export interface GeoFeatureCollection {
  type: "FeatureCollection";
  features: GeoFeature[];
}

interface GeoFeatureSingle {
  type: "Feature";
  properties?: Record<string, unknown>;
  geometry: GeoPermissibleObjects | null;
}

function asFeatureCollection(value: unknown): GeoFeatureCollection | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const maybeCollection = value as { type?: string; features?: unknown[] };
  if (maybeCollection.type === "FeatureCollection" && Array.isArray(maybeCollection.features)) {
    return maybeCollection as GeoFeatureCollection;
  }

  return null;
}

function asSingleFeature(value: unknown): GeoFeatureSingle | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const maybeFeature = value as { type?: string; geometry?: GeoPermissibleObjects | null };
  if (maybeFeature.type === "Feature" && "geometry" in maybeFeature) {
    return maybeFeature as GeoFeatureSingle;
  }

  return null;
}

function asTopology(value: unknown): (Topology & { objects?: Record<string, unknown> }) | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const maybeTopology = value as Topology & { objects?: Record<string, unknown> };
  if (maybeTopology.type === "Topology" && maybeTopology.objects && typeof maybeTopology.objects === "object") {
    return maybeTopology;
  }

  return null;
}

function toFeatureCollection(value: unknown): GeoFeatureCollection | null {
  const collection = asFeatureCollection(value);
  if (collection) {
    return collection;
  }

  const feature = asSingleFeature(value);
  if (feature) {
    return { type: "FeatureCollection", features: [feature] };
  }

  return null;
}

function pickTopologyObjectKey(
  objects: Record<string, unknown>,
  preferredObjectKeys: string[] = []
): string | null {
  for (const key of preferredObjectKeys) {
    if (key in objects) {
      return key;
    }
  }

  const keys = Object.keys(objects);
  return keys.length > 0 ? keys[0] : null;
}

function mergeCollectionGeometries(collection: GeoFeatureCollection): GeoPermissibleObjects | null {
  const geometries = collection.features
    .map((f) => f.geometry)
    .filter((g): g is GeoPermissibleObjects => g !== null);

  if (geometries.length === 0) {
    return null;
  }

  if (geometries.length === 1) {
    return geometries[0];
  }

  return { type: "GeometryCollection", geometries } as unknown as GeoPermissibleObjects;
}

export function extractGeoFeatureCollection(
  raw: unknown,
  preferredObjectKeys: string[] = []
): GeoFeatureCollection | null {
  const directCollection = asFeatureCollection(raw);
  if (directCollection) {
    return directCollection;
  }

  const topo = asTopology(raw);
  if (!topo || !topo.objects) {
    return toFeatureCollection(raw);
  }

  const objectKey = pickTopologyObjectKey(topo.objects, preferredObjectKeys);
  if (!objectKey) {
    return null;
  }

  const converted = topoFeature(topo, topo.objects[objectKey] as GeometryCollection) as unknown;
  return toFeatureCollection(converted);
}

export function extractLandGeometry(
  raw: unknown,
  preferredObjectKeys: string[] = ["Land10mForMarines", "land", "landmask", "geoland", "countries"]
): GeoPermissibleObjects | null {
  if (!raw || typeof raw !== "object") {
    return null;
  }

  const maybeGeometryCollection = raw as { type?: string; geometries?: GeoPermissibleObjects[] };
  if (maybeGeometryCollection.type === "GeometryCollection" && Array.isArray(maybeGeometryCollection.geometries)) {
    return maybeGeometryCollection.geometries[0] ?? null;
  }

  const maybeFeatureCollection = asFeatureCollection(raw);
  if (maybeFeatureCollection) {
    return mergeCollectionGeometries(maybeFeatureCollection);
  }

  const maybeFeature = asSingleFeature(raw);
  if (maybeFeature) {
    return maybeFeature.geometry;
  }

  const topo = asTopology(raw);
  if (!topo || !topo.objects) {
    return null;
  }

  const objectKey = pickTopologyObjectKey(topo.objects, preferredObjectKeys);
  if (!objectKey) {
    return null;
  }

  const converted = topoFeature(topo, topo.objects[objectKey] as GeometryCollection) as unknown;
  const convertedCollection = toFeatureCollection(converted);
  if (convertedCollection) {
    return mergeCollectionGeometries(convertedCollection);
  }

  const convertedFeature = asSingleFeature(converted);
  return convertedFeature?.geometry ?? null;
}

const FEATURE_NAME_KEYS = new Set([
  "name",
  "displayName",
  "featureName",
  "label",
  "title",
]);

export const GEOJSON_NAME_ALIASES: Record<GeoFeatureKind, Record<string, string[]>> = {
  marine: {},
  river: {
    Nile: ["White Nile", "Blue Nile"],
    Shebelle: ["Shabelle"],
    Shabelle: ["Shebelle"],
  },
  lake: {},
};

function roundCoord(value: number): number {
  return Number(value.toFixed(5));
}

function normalizeLineCoordinate(point: unknown): [number, number] | null {
  if (!Array.isArray(point) || point.length < 2) {
    return null;
  }

  const lon = Number(point[0]);
  const lat = Number(point[1]);
  if (!Number.isFinite(lon) || !Number.isFinite(lat)) {
    return null;
  }

  return [roundCoord(lon), roundCoord(lat)];
}

function cleanLineCoordinates(line: unknown): [number, number][] {
  if (!Array.isArray(line)) {
    return [];
  }

  const cleaned: [number, number][] = [];
  for (const point of line) {
    const normalized = normalizeLineCoordinate(point);
    if (!normalized) {
      continue;
    }

    const previous = cleaned[cleaned.length - 1];
    if (previous && previous[0] === normalized[0] && previous[1] === normalized[1]) {
      continue;
    }

    cleaned.push(normalized);
  }

  return cleaned.length >= 2 ? cleaned : [];
}

function lineKey(line: [number, number][]): string {
  return line.map(([lon, lat]) => `${lon},${lat}`).join(";");
}

function collectRiverLines(geometry: GeoPermissibleObjects | null): [number, number][][] {
  if (!geometry) {
    return [];
  }

  const typedGeometry = geometry as GeoPermissibleObjects & {
    type: string;
    coordinates?: unknown;
    geometries?: GeoPermissibleObjects[];
  };

  if (typedGeometry.type === "LineString") {
    const line = cleanLineCoordinates(typedGeometry.coordinates);
    return line.length >= 2 ? [line] : [];
  }

  if (typedGeometry.type === "MultiLineString" && Array.isArray(typedGeometry.coordinates)) {
    return typedGeometry.coordinates
      .map((line) => cleanLineCoordinates(line))
      .filter((line): line is [number, number][] => line.length >= 2);
  }

  if (typedGeometry.type === "GeometryCollection" && Array.isArray(typedGeometry.geometries)) {
    return typedGeometry.geometries.flatMap((child) => collectRiverLines(child));
  }

  return [];
}

function buildRiverGeometry(lines: [number, number][][]): GeoPermissibleObjects | null {
  if (lines.length === 0) {
    return null;
  }

  const deduped: [number, number][][] = [];
  const seen = new Set<string>();

  for (const line of lines) {
    const forward = lineKey(line);
    const reverse = lineKey([...line].reverse());
    if (seen.has(forward) || seen.has(reverse)) {
      continue;
    }

    seen.add(forward);
    deduped.push(line);
  }

  if (deduped.length === 0) {
    return null;
  }

  if (deduped.length === 1) {
    return { type: "LineString", coordinates: deduped[0] } as GeoPermissibleObjects;
  }

  return { type: "MultiLineString", coordinates: deduped } as GeoPermissibleObjects;
}

function reverseRing(ring: number[][]): number[][] {
  return [...ring].reverse();
}

function rewindGeometry(geometry: GeoPermissibleObjects): GeoPermissibleObjects {
  const typed = geometry as GeoPermissibleObjects & {
    type: string;
    coordinates?: unknown;
    geometries?: GeoPermissibleObjects[];
  };

  if (typed.type === "Polygon" && Array.isArray(typed.coordinates)) {
    const rings = typed.coordinates as number[][][];
    return {
      ...typed,
      coordinates: rings.map((ring) => reverseRing(ring)),
    } as GeoPermissibleObjects;
  }

  if (typed.type === "MultiPolygon" && Array.isArray(typed.coordinates)) {
    const polygons = typed.coordinates as number[][][][];
    return {
      ...typed,
      coordinates: polygons.map((polygon) => polygon.map((ring) => reverseRing(ring))),
    } as GeoPermissibleObjects;
  }

  if (typed.type === "GeometryCollection" && Array.isArray(typed.geometries)) {
    return {
      ...typed,
      geometries: typed.geometries.map((child) => rewindGeometry(child)),
    } as GeoPermissibleObjects;
  }

  return geometry;
}

function normalizeMarineGeometryWinding(geometry: GeoPermissibleObjects, featureName?: string): GeoPermissibleObjects {
  // Mapshaper již správně ošetřil orientaci (winding) polygonů.
  // Pevné pravidlo na přetáčení oceánů je tedy zbytečné a dělalo z nich "zbytek světa".
  
  // Bezpečnostní pojistka d3-geo: Pokud polygon zabírá více než polovinu planety (2 * Pí),
  // znamená to, že je naruby a teprve tehdy ho přetočíme.
  if (geoArea(geometry as unknown as Parameters<typeof geoArea>[0]) > 2 * Math.PI) {
    return rewindGeometry(geometry);
  }
  
  return geometry;
}

function normalizeFeatureGeometry(geometry: GeoPermissibleObjects | null, kind: GeoFeatureKind, featureName?: string): GeoPermissibleObjects | null {
  if (!geometry) {
    return null;
  }

  if (kind === "marine") {
    return normalizeMarineGeometryWinding(geometry, featureName);
  }

  if (kind !== "river") {
    return geometry;
  }

  return buildRiverGeometry(collectRiverLines(geometry));
}

function getStringAtPath(value: unknown, path: string[]): string | null {
  let current = value;
  for (const key of path) {
    if (!current || typeof current !== "object" || !(key in current)) {
      return null;
    }
    current = (current as Record<string, unknown>)[key];
  }
  return typeof current === "string" && current.trim() ? current.trim() : null;
}

function findNestedFeatureName(value: unknown, depth = 0): string | null {
  if (!value || typeof value !== "object" || depth > 4) {
    return null;
  }

  for (const [rawKey, rawChild] of Object.entries(value)) {
    const key = rawKey.trim();
    if (FEATURE_NAME_KEYS.has(key) && typeof rawChild === "string" && rawChild.trim()) {
      return rawChild.trim();
    }
  }

  for (const child of Object.values(value)) {
    const nested = findNestedFeatureName(child, depth + 1);
    if (nested) {
      return nested;
    }
  }

  return null;
}

function getGeoFeatureName(feature: GeoFeature): string | null {
  const candidatePaths = [
    ["name"],
    ["Name"],
    ["NAME"],
    ["moje_nazvy"],
    ["displayName"],
    ["featureName"],
    ["label"],
    ["title"],
    ["fields", "name"],
    ["fields", "Name"],
    ["attributes", "name"],
    ["attributes", "Name"],
    ["meta", "name"],
    ["tags", "name"],
    ["properties", "name"],
  ];

  for (const path of candidatePaths) {
    const match = getStringAtPath(feature.properties, path);
    if (match) {
      return match;
    }
  }

  return findNestedFeatureName(feature.properties);
}

function mergeGeometriesByKind(geometries: GeoPermissibleObjects[], kind: GeoFeatureKind, featureName?: string): GeoPermissibleObjects | null {
  const normalized = geometries
    .map((geometry) => normalizeFeatureGeometry(geometry, kind, featureName))
    .filter((geometry): geometry is GeoPermissibleObjects => geometry !== null);

  if (normalized.length === 0) {
    return null;
  }

  if (kind === "river") {
    return buildRiverGeometry(normalized.flatMap((geometry) => collectRiverLines(geometry)));
  }

  if (normalized.length === 1) {
    return normalized[0];
  }

  return { type: "GeometryCollection", geometries: normalized } as GeoPermissibleObjects;
}

function buildGeoFeatureLookup(data: GeoFeatureCollection | null, kind: GeoFeatureKind): Map<string, GeoFeature> {
  const grouped = new Map<string, GeoPermissibleObjects[]>();

  for (const feature of data?.features ?? []) {
    const name = getGeoFeatureName(feature);
    const geometry = normalizeFeatureGeometry(feature.geometry, kind, name ?? undefined);
    if (!name || !geometry) {
      continue;
    }

    const key = name.toLowerCase();
    const existing = grouped.get(key);
    if (existing) {
      existing.push(geometry);
    } else {
      grouped.set(key, [geometry]);
    }
  }

  const lookup = new Map<string, GeoFeature>();
  for (const [name, geometries] of grouped) {
    const geometry = mergeGeometriesByKind(geometries, kind, name);
    if (!geometry) {
      continue;
    }

    lookup.set(name, {
      type: "Feature",
      properties: { name },
      geometry,
    });
  }

  return lookup;
}

export function buildGeoFeatureGetter(
  marineData: GeoFeatureCollection | null,
  riverData: GeoFeatureCollection | null,
  lakeData: GeoFeatureCollection | null,
): (name: string, kind?: GeoFeatureKind) => GeoFeature | null {
  const marineLookup = buildGeoFeatureLookup(marineData, "marine");
  const riverLookup = buildGeoFeatureLookup(riverData, "river");
  const lakeLookup = buildGeoFeatureLookup(lakeData, "lake");

  return (name: string, kind: GeoFeatureKind = "marine"): GeoFeature | null => {
    const lookup = kind === "river" ? riverLookup : kind === "lake" ? lakeLookup : marineLookup;
    const aliasNames = GEOJSON_NAME_ALIASES[kind][name] ?? [];
    const features = [name, ...aliasNames]
      .map((lookupName) => lookup.get(lookupName.toLowerCase()))
      .filter((feature): feature is GeoFeature => Boolean(feature));
    const geometry = mergeGeometriesByKind(
      features
        .map((feature) => feature.geometry)
        .filter((value): value is GeoPermissibleObjects => value !== null),
      kind,
      name,
    );

    if (!geometry) {
      return null;
    }

    return {
      type: "Feature",
      properties: features[0]?.properties,
      geometry,
    };
  };
}

export function getGeoFeatureFocus(feature: GeoFeature | null): { center: [number, number]; extent: number } | null {
  if (!feature?.geometry) {
    return null;
  }

  const centroid = geoCentroid(feature as never);
  if (!Array.isArray(centroid) || centroid.length < 2 || !Number.isFinite(centroid[0]) || !Number.isFinite(centroid[1])) {
    return null;
  }

  const [[west, south], [east, north]] = geoBounds(feature as never);
  if (![west, south, east, north].every((value) => Number.isFinite(value))) {
    return null;
  }

  let lonSpan = east - west;
  if (lonSpan < 0) {
    lonSpan += 360;
  }

  const latSpan = north - south;
  return {
    center: [centroid[0], centroid[1]],
    extent: Math.max(Math.abs(lonSpan), Math.abs(latSpan), 0.8),
  };
}
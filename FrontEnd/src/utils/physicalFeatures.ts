/**
 * Physical Geography Features – Re-export hub & helpers
 *
 * All feature data now lives in category-specific files:
 *   • mountainFeatures.ts  – mountains, volcanoes, mountain ranges
 *   • riverFeatures.ts     – rivers & lakes
 *   • desertFeatures.ts    – deserts
 *   • waterFeatures.ts     – seas, oceans, gulfs, bays, straits, channels, passages, canals
 *
 * Types & constants live in physicalFeaturesTypes.ts.
 * This file combines them with LAZY LOADING to avoid loading all data upfront.
 */

// Re-export everything from types (so existing imports keep working)
export {
  type FeatureCategory,
  type FeatureShape,
  type PhysicalFeature,
  CATEGORY_INFO,
  FEATURE_COLORS,
  FEATURE_FILL_OPACITY,
  WATER_TYPES,
  isWaterFeature,
  CATEGORY_GROUPS,
} from "./physicalFeaturesTypes";

import type { PhysicalFeature } from "./physicalFeaturesTypes";
import { CATEGORY_GROUPS } from "./physicalFeaturesTypes";

// ============================================================================
// LAZY LOADED FEATURE CACHE
// ============================================================================

let allFeaturesCache: PhysicalFeature[] | null = null;

/**
 * Dynamically import and cache ALL features (only when needed)
 * This is a lazy-loaded version that won't block initial load
 */
async function loadAllFeatures(): Promise<PhysicalFeature[]> {
  if (allFeaturesCache) {
    return allFeaturesCache;
  }

  // Dynamic imports - only loaded when actually needed
  const [
    { MOUNTAIN_FEATURES },
    { RIVER_FEATURES },
    { DESERT_FEATURES },
    { WATER_FEATURES },
  ] = await Promise.all([
    import("./mountainFeatures"),
    import("./riverFeatures"),
    import("./desertFeatures"),
    import("./waterFeatures"),
  ]);

  const ALL_RAW: PhysicalFeature[] = [
    ...MOUNTAIN_FEATURES,
    ...RIVER_FEATURES,
    ...DESERT_FEATURES,
    ...WATER_FEATURES,
  ];

  // Deduplicate
  const seen = new Set<string>();
  allFeaturesCache = ALL_RAW.filter(f => {
    if (seen.has(f.name)) return false;
    seen.add(f.name);
    return true;
  });

  return allFeaturesCache;
}

/**
 * Load features for a specific category (lazy loaded)
 * Only imports the exact feature file needed for that category
 */
async function loadCategoryFeatures(categoryKey: string): Promise<PhysicalFeature[]> {
  if (categoryKey === "mountains") {
    const { MOUNTAIN_FEATURES } = await import("./mountainFeatures");
    return MOUNTAIN_FEATURES;
  }
  if (categoryKey === "rivers" || categoryKey === "waters") {
    // Rivers mode uses both rivers and waters
    const [{ RIVER_FEATURES }, { WATER_FEATURES }] = await Promise.all([
      import("./riverFeatures"),
      import("./waterFeatures"),
    ]);

    const group = CATEGORY_GROUPS.find(g => g.key === categoryKey);
    if (!group) return [];

    return [...RIVER_FEATURES, ...WATER_FEATURES].filter(f => group.types.includes(f.type));
  }
  if (categoryKey === "deserts") {
    const { DESERT_FEATURES } = await import("./desertFeatures");
    return DESERT_FEATURES;
  }

  // Fallback: load all features for unknown categories
  return loadAllFeatures();
}

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Get features filtered by category group key (ASYNC - lazy loaded)
 * This is the new async version that lazy-loads features on demand
 */
export async function getFeaturesByCategoryAsync(categoryKey: string): Promise<PhysicalFeature[]> {
  if (categoryKey === "all") {
    return loadAllFeatures();
  }

  const features = await loadCategoryFeatures(categoryKey);
  const group = CATEGORY_GROUPS.find(g => g.key === categoryKey);

  if (!group) return features;
  return features.filter(f => group.types.includes(f.type));
}

/**
 * @deprecated Use getFeaturesByCategoryAsync() for lazy loading
 */
export function getFeaturesByCategory(categoryKey: string): PhysicalFeature[] {
  if (allFeaturesCache) {
    const group = CATEGORY_GROUPS.find(g => g.key === categoryKey);
    if (!group || categoryKey === "all") return allFeaturesCache;
    return allFeaturesCache.filter(f => group.types.includes(f.type));
  }

  // If cache is empty, return empty array and log warning
  console.error('Features not loaded yet. Use getFeaturesByCategoryAsync() which returns a Promise.');
  return [];
}

/** Fisher-Yates shuffle */
export function shuffleFeatures<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ============================================================================
// SVG RENDERING HELPERS
// ============================================================================
type Proj = (coords: [number, number]) => [number, number] | null;

/** Generate smooth SVG path d from projected screen-space points */
export function smoothPathD(pts: [number, number][]): string {
  if (pts.length < 2) return "";
  if (pts.length === 2)
    return `M${pts[0][0]},${pts[0][1]} L${pts[1][0]},${pts[1][1]}`;

  let d = `M${pts[0][0]},${pts[0][1]}`;

  // Line to midpoint of first segment
  d += ` L${(pts[0][0] + pts[1][0]) / 2},${(pts[0][1] + pts[1][1]) / 2}`;

  // Quadratic Bezier through midpoints (each data point becomes a control point)
  for (let i = 1; i < pts.length - 1; i++) {
    const mx = (pts[i][0] + pts[i + 1][0]) / 2;
    const my = (pts[i][1] + pts[i + 1][1]) / 2;
    d += ` Q${pts[i][0]},${pts[i][1]} ${mx},${my}`;
  }

  // Line to last point
  const last = pts[pts.length - 1];
  d += ` L${last[0]},${last[1]}`;
  return d;
}

/** Project [lon,lat] waypoints -> smooth SVG path d */
export function projectPath(points: [number, number][], projection: Proj): string {
  const projected = points
    .map(p => projection(p))
    .filter((p): p is [number, number] => p !== null);
  return smoothPathD(projected);
}

/** Sample N points around an ellipse in geographic coords */
export function ellipseGeoPoints(
  center: [number, number],
  rx: number,
  ry: number,
  rotation: number = 0,
  n: number = 32,
): [number, number][] {
  const cosR = Math.cos((rotation * Math.PI) / 180);
  const sinR = Math.sin((rotation * Math.PI) / 180);
  const pts: [number, number][] = [];
  for (let i = 0; i < n; i++) {
    const angle = (2 * Math.PI * i) / n;
    const ex = rx * Math.cos(angle);
    const ey = ry * Math.sin(angle);
    pts.push([
      center[0] + ex * cosR - ey * sinR,
      center[1] + ex * sinR + ey * cosR,
    ]);
  }
  return pts;
}

/** Project ellipse -> closed SVG polygon d */
export function projectEllipse(
  center: [number, number],
  rx: number,
  ry: number,
  rotation: number,
  projection: Proj,
  samples: number = 32,
): string {
  const geo = ellipseGeoPoints(center, rx, ry, rotation, samples);
  const projected = geo
    .map(p => projection(p))
    .filter((p): p is [number, number] => p !== null);
  if (projected.length < 3) return "";
  return `M${projected.map(p => `${p[0]},${p[1]}`).join(" L")} Z`;
}

/** Project geo polygon points -> closed SVG polygon d */
export function projectPolygon(
  points: [number, number][],
  projection: Proj,
): string | null {
  const projected = points
    .map(p => projection(p))
    .filter((p): p is [number, number] => p !== null);
  if (projected.length < 3) return null;
  return `M${projected.map(p => `${p[0]},${p[1]}`).join(" L")} Z`;
}

/** Project multiple geo polygons -> single SVG path d (multi-subpath) */
export function projectPolygonCollection(
  polygons: [number, number][][],
  projection: Proj,
): string | null {
  const parts: string[] = [];
  for (const points of polygons) {
    const d = projectPolygon(points, projection);
    if (d) {
      parts.push(d);
    }
  }

  if (parts.length === 0) {
    return null;
  }

  return parts.join(" ");
}


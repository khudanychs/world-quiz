/**
 * Physical Geography – Shared types, constants & category metadata
 */

// ============================================================================
// TYPES
// ============================================================================

export type FeatureCategory =
  | "mountain"
  | "mountain_range"
  | "river"
  | "desert"
  | "sea"
  | "ocean"
  | "lake"
  | "strait"
  | "gulf"
  | "canal"
  | "volcano"
  | "bay"
  | "channel"
  | "passage";

export type FeatureShape =
  | { kind: "marker"; center: [number, number] }
  | { kind: "path"; points: [number, number][] }
  | { kind: "ellipse"; center: [number, number]; rx: number; ry: number; rotation?: number };

export interface PhysicalFeature {
  name: string;
  type: FeatureCategory;
  shape: FeatureShape;
  difficulty: "easy" | "medium" | "hard";
}

// ============================================================================
// CATEGORY DISPLAY INFO
// ============================================================================

export const CATEGORY_INFO: Record<FeatureCategory, { emoji: string; label: string }> = {
  mountain:       { emoji: "⛰️",  label: "Mountain" },
  mountain_range: { emoji: "🏔️", label: "Mountain Range" },
  river:          { emoji: "🏞️", label: "River" },
  desert:         { emoji: "🏜️", label: "Desert" },
  sea:            { emoji: "🌊",  label: "Sea" },
  ocean:          { emoji: "🌏",  label: "Ocean" },
  lake:           { emoji: "💧",  label: "Lake" },
  strait:         { emoji: "⛵",  label: "Strait" },
  gulf:           { emoji: "🌊",  label: "Gulf / Bay" },
  canal:          { emoji: "⛵",  label: "Canal" },
  volcano:        { emoji: "🌋",  label: "Volcano" },
  bay:            { emoji: "🌊",  label: "Bay" },
  channel:        { emoji: "⛵",  label: "Channel" },
  passage:        { emoji: "⛵",  label: "Passage" },
};

/** Visual style for each category */
export const FEATURE_COLORS: Record<FeatureCategory, string> = {
  mountain:       "#ff7043",
  mountain_range: "#ff8a65",
  river:          "#4dd0e1",
  desert:         "#ffc107",
  sea:            "#64b5f6",
  ocean:          "#42a5f5",
  lake:           "#4fc3f7",
  strait:         "#26a69a",
  gulf:           "#81d4fa",
  canal:          "#26a69a",
  volcano:        "#e53935",
  bay:            "#81d4fa",
  channel:        "#26a69a",
  passage:        "#26a69a",
};

/** Fill opacity for area-type features */
export const FEATURE_FILL_OPACITY: Record<FeatureCategory, number> = {
  mountain: 1,
  mountain_range: 0,
  river: 0,
  desert: 0.30,
  sea: 0.35,
  ocean: 0.25,
  lake: 0.50,
  strait: 0.30,
  gulf: 0.30,
  canal: 0.30,
  volcano: 1,
  bay: 0.30,
  channel: 0.30,
  passage: 0.30,
};

/** Categories that are water bodies — rendered UNDER land so land masks them */
export const WATER_TYPES: ReadonlySet<FeatureCategory> = new Set([
  "ocean", "sea", "gulf", "bay", "channel", "passage", "strait",
]);

/** Check if a feature should be rendered as a water underlay (behind land) */
export function isWaterFeature(f: PhysicalFeature): boolean {
  return WATER_TYPES.has(f.type);
}

export const CATEGORY_GROUPS: { key: string; label: string; emoji: string; types: FeatureCategory[] }[] = [
  { key: "mountains", label: "Mountains & Volcanoes",  emoji: "⛰️",  types: ["mountain", "mountain_range", "volcano"] },
  { key: "rivers",    label: "Rivers & Lakes",         emoji: "🏞️", types: ["river", "lake"] },
  { key: "deserts",   label: "Deserts",                emoji: "🏜️", types: ["desert"] },
  { key: "waters",    label: "Seas, Straits & Oceans", emoji: "🌊",  types: ["sea", "ocean", "gulf", "bay", "strait", "canal", "channel", "passage"] },
];

/**
 * Physical Geography Features Database
 *
 * Each feature has an SVG shape definition (marker, path, or ellipse)
 * that is rendered on the map and is directly clickable.
 * Coordinates are [longitude, latitude] to match d3-geo convention.
 * Geographic coordinates are factual data — not copyrightable.
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
  "ocean", "sea", "gulf", "bay", "channel", "passage",
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

// ============================================================================
// FEATURES DATABASE
// ============================================================================

const FEATURES: PhysicalFeature[] = [
  // ─── MOUNTAINS / PEAKS (markers) ────────────────────────────────────
  { name: "Mount Everest",     type: "mountain", shape: { kind: "marker", center: [86.925, 27.988] },   difficulty: "easy" },
  { name: "K2",                type: "mountain", shape: { kind: "marker", center: [76.513, 35.881] },   difficulty: "hard" },
  { name: "Mont Blanc",        type: "mountain", shape: { kind: "marker", center: [6.865, 45.833] },    difficulty: "medium" },
  { name: "Mount Kilimanjaro", type: "mountain", shape: { kind: "marker", center: [37.355, -3.068] },   difficulty: "easy" },
  { name: "Mount Fuji",        type: "mountain", shape: { kind: "marker", center: [138.727, 35.361] },  difficulty: "easy" },
  { name: "Denali",            type: "mountain", shape: { kind: "marker", center: [-151.0, 63.07] },    difficulty: "medium" },
  { name: "Mount Elbrus",      type: "mountain", shape: { kind: "marker", center: [42.439, 43.353] },   difficulty: "hard" },
  { name: "Aconcagua",         type: "mountain", shape: { kind: "marker", center: [-70.011, -32.653] }, difficulty: "medium" },
  { name: "Matterhorn",        type: "mountain", shape: { kind: "marker", center: [7.659, 45.977] },    difficulty: "medium" },
  { name: "Mount Olympus",     type: "mountain", shape: { kind: "marker", center: [22.350, 40.087] },   difficulty: "medium" },
  { name: "Mauna Kea",         type: "mountain", shape: { kind: "marker", center: [-155.468, 19.821] }, difficulty: "hard" },
  { name: "Mount Kosciuszko",  type: "mountain", shape: { kind: "marker", center: [148.263, -36.456] }, difficulty: "hard" },

  // ─── VOLCANOES (markers) ────────────────────────────────────────────
  { name: "Mount Vesuvius",   type: "volcano", shape: { kind: "marker", center: [14.426, 40.821] },   difficulty: "medium" },
  { name: "Mount Etna",       type: "volcano", shape: { kind: "marker", center: [14.999, 37.751] },   difficulty: "medium" },
  { name: "Krakatoa",         type: "volcano", shape: { kind: "marker", center: [105.423, -6.102] },  difficulty: "hard" },
  { name: "Mount St. Helens", type: "volcano", shape: { kind: "marker", center: [-122.18, 46.191] },  difficulty: "hard" },
  { name: "Eyjafjallajökull", type: "volcano", shape: { kind: "marker", center: [-19.613, 63.633] },  difficulty: "hard" },

  // ─── MOUNTAIN RANGES (paths – thick curves) ────────────────────────
  { name: "Himalayas", type: "mountain_range", difficulty: "easy", shape: { kind: "path", points: [
    [73.5, 36.0], [76.5, 34.5], [80.0, 30.5], [84.0, 28.0], [86.5, 28.0], [88.5, 27.5], [92.0, 27.5], [95.0, 28.0], [97.0, 28.5],
  ]}},
  { name: "Alps", type: "mountain_range", difficulty: "easy", shape: { kind: "path", points: [
    [6.0, 44.2], [7.5, 45.5], [9.0, 46.5], [10.5, 47.0], [12.0, 47.0], [13.5, 47.5], [15.0, 46.5], [16.5, 47.2],
  ]}},
  { name: "Andes", type: "mountain_range", difficulty: "easy", shape: { kind: "path", points: [
    [-72.0, 5.0], [-75.5, 0.0], [-78.5, -2.0], [-76.0, -9.0], [-70.5, -16.0], [-67.5, -22.0], [-70.0, -33.0], [-70.5, -40.0], [-72.0, -46.0], [-73.5, -50.0],
  ]}},
  { name: "Rocky Mountains", type: "mountain_range", difficulty: "easy", shape: { kind: "path", points: [
    [-120.0, 55.0], [-117.0, 51.0], [-114.5, 48.0], [-112.0, 45.0], [-110.0, 42.0], [-107.0, 39.0], [-106.0, 36.0], [-105.5, 33.0],
  ]}},
  { name: "Atlas Mountains", type: "mountain_range", difficulty: "medium", shape: { kind: "path", points: [
    [-7.0, 31.0], [-5.0, 33.0], [-2.0, 34.5], [1.0, 35.0], [4.0, 35.5], [7.0, 36.0], [9.5, 34.0],
  ]}},
  { name: "Ural Mountains", type: "mountain_range", difficulty: "medium", shape: { kind: "path", points: [
    [60.0, 50.0], [59.5, 53.0], [59.0, 56.0], [59.5, 59.0], [60.5, 62.0], [62.0, 65.0], [65.0, 67.5],
  ]}},
  { name: "Carpathian Mountains", type: "mountain_range", difficulty: "hard", shape: { kind: "path", points: [
    [18.0, 48.5], [20.0, 49.0], [22.0, 49.0], [24.0, 48.5], [25.0, 47.5], [26.0, 46.5], [25.5, 45.5],
  ]}},
  { name: "Pyrenees", type: "mountain_range", difficulty: "medium", shape: { kind: "path", points: [
    [-1.5, 43.0], [0.0, 42.8], [1.0, 42.7], [2.0, 42.5], [3.0, 42.8],
  ]}},
  { name: "Appalachian Mountains", type: "mountain_range", difficulty: "medium", shape: { kind: "path", points: [
    [-68.5, 47.0], [-72.0, 44.0], [-75.0, 41.0], [-78.0, 38.0], [-80.0, 36.0], [-83.0, 35.0], [-85.0, 34.0],
  ]}},
  { name: "Scandinavian Mountains", type: "mountain_range", difficulty: "hard", shape: { kind: "path", points: [
    [5.5, 60.0], [8.0, 62.0], [13.0, 65.0], [16.0, 67.0], [18.5, 69.0], [20.0, 69.5],
  ]}},
  { name: "Caucasus Mountains", type: "mountain_range", difficulty: "medium", shape: { kind: "path", points: [
    [37.0, 43.5], [40.0, 43.0], [42.5, 42.5], [44.5, 42.0], [47.0, 41.5], [49.5, 41.0],
  ]}},
  { name: "Hindu Kush", type: "mountain_range", difficulty: "hard", shape: { kind: "path", points: [
    [65.0, 36.0], [67.0, 36.5], [69.0, 36.0], [71.0, 35.5], [72.5, 35.0], [74.0, 35.5],
  ]}},
  { name: "Great Dividing Range", type: "mountain_range", difficulty: "hard", shape: { kind: "path", points: [
    [143.0, -38.0], [146.0, -36.0], [148.5, -33.0], [150.5, -28.0], [150.0, -24.0], [148.0, -20.0], [146.0, -18.0],
  ]}},
  { name: "Drakensberg", type: "mountain_range", difficulty: "hard", shape: { kind: "path", points: [
    [27.5, -31.0], [28.0, -30.0], [28.5, -29.0], [29.0, -28.0], [29.5, -27.0], [30.0, -26.0],
  ]}},

  // ─── RIVERS (paths – thinner curves) ────────────────────────────────
  { name: "Nile", type: "river", difficulty: "easy", shape: { kind: "path", points: [
    [29.4, -2.3], [31.5, -1.0], [32.5, 5.0], [31.5, 10.0], [33.0, 15.0], [32.5, 18.0], [32.0, 22.0], [31.0, 26.0], [31.0, 30.0], [31.2, 31.5],
  ]}},
  { name: "Amazon", type: "river", difficulty: "easy", shape: { kind: "path", points: [
    [-73.0, -4.5], [-70.0, -4.0], [-67.0, -3.5], [-63.0, -3.2], [-60.0, -3.0], [-57.0, -2.5], [-54.0, -2.3], [-51.0, -1.5], [-49.0, -1.0],
  ]}},
  { name: "Mississippi", type: "river", difficulty: "easy", shape: { kind: "path", points: [
    [-93.0, 47.0], [-91.5, 44.0], [-91.0, 41.5], [-91.0, 38.5], [-90.0, 35.5], [-91.0, 32.5], [-91.0, 30.0], [-89.5, 29.0],
  ]}},
  { name: "Danube", type: "river", difficulty: "medium", shape: { kind: "path", points: [
    [10.0, 48.5], [13.0, 48.3], [16.5, 48.2], [18.5, 47.8], [19.5, 47.0], [21.0, 46.0], [23.0, 44.5], [25.5, 44.0], [28.0, 44.5], [29.5, 45.3],
  ]}},
  { name: "Rhine", type: "river", difficulty: "medium", shape: { kind: "path", points: [
    [9.5, 46.8], [8.5, 47.5], [7.5, 48.5], [7.0, 49.5], [6.5, 50.5], [6.0, 51.5], [5.0, 52.0], [4.0, 52.0],
  ]}},
  { name: "Thames", type: "river", difficulty: "medium", shape: { kind: "path", points: [
    [-2.0, 51.7], [-1.0, 51.6], [0.0, 51.5], [0.5, 51.5], [1.0, 51.5],
  ]}},
  { name: "Yangtze", type: "river", difficulty: "medium", shape: { kind: "path", points: [
    [96.5, 33.0], [100.0, 29.5], [104.0, 29.0], [107.0, 30.5], [110.0, 30.0], [113.5, 30.5], [117.0, 30.5], [120.0, 31.5], [121.5, 31.5],
  ]}},
  { name: "Ganges", type: "river", difficulty: "medium", shape: { kind: "path", points: [
    [79.0, 30.5], [80.0, 29.0], [82.0, 27.0], [84.0, 26.0], [86.0, 25.5], [88.0, 24.5], [88.5, 22.5], [89.0, 22.0],
  ]}},
  { name: "Mekong", type: "river", difficulty: "medium", shape: { kind: "path", points: [
    [98.5, 29.0], [100.0, 25.0], [100.5, 21.0], [102.0, 18.0], [104.5, 16.0], [105.5, 13.0], [106.0, 11.0], [106.5, 10.0],
  ]}},
  { name: "Congo", type: "river", difficulty: "medium", shape: { kind: "path", points: [
    [29.0, -2.0], [26.0, -1.0], [23.0, 0.0], [20.0, -1.5], [17.5, -3.0], [16.0, -4.5], [13.5, -5.5], [12.5, -6.0],
  ]}},
  { name: "Volga", type: "river", difficulty: "medium", shape: { kind: "path", points: [
    [33.0, 57.0], [36.0, 56.5], [40.0, 56.5], [43.0, 56.0], [46.0, 54.5], [48.0, 52.5], [49.0, 49.0], [47.5, 46.5], [47.0, 45.5],
  ]}},
  { name: "Zambezi", type: "river", difficulty: "hard", shape: { kind: "path", points: [
    [22.5, -13.5], [25.0, -15.0], [26.0, -17.5], [28.5, -16.0], [30.0, -15.5], [32.0, -16.5], [34.0, -17.0], [35.5, -18.5], [36.0, -19.0],
  ]}},
  { name: "Niger", type: "river", difficulty: "hard", shape: { kind: "path", points: [
    [-10.5, 10.0], [-7.0, 12.0], [-4.0, 14.0], [-1.0, 15.0], [2.0, 14.0], [3.5, 12.5], [5.0, 10.5], [6.5, 8.5], [7.0, 6.5],
  ]}},
  { name: "Indus", type: "river", difficulty: "hard", shape: { kind: "path", points: [
    [81.0, 32.5], [77.0, 34.5], [74.0, 35.0], [72.5, 33.0], [71.0, 30.0], [69.0, 27.5], [68.0, 25.5], [67.5, 24.0],
  ]}},

  // ─── DESERTS (ellipses) ─────────────────────────────────────────────
  { name: "Sahara Desert",         type: "desert", difficulty: "easy",   shape: { kind: "ellipse", center: [10, 23],     rx: 18, ry: 7, rotation: 0 }},
  { name: "Gobi Desert",           type: "desert", difficulty: "medium", shape: { kind: "ellipse", center: [105, 43],    rx: 8,  ry: 4, rotation: -10 }},
  { name: "Arabian Desert",        type: "desert", difficulty: "medium", shape: { kind: "ellipse", center: [48, 22],     rx: 7,  ry: 5, rotation: -10 }},
  { name: "Kalahari Desert",       type: "desert", difficulty: "medium", shape: { kind: "ellipse", center: [22, -23],    rx: 5,  ry: 4, rotation: 0 }},
  { name: "Atacama Desert",        type: "desert", difficulty: "medium", shape: { kind: "ellipse", center: [-70, -24],   rx: 2,  ry: 5, rotation: -5 }},
  { name: "Namib Desert",          type: "desert", difficulty: "hard",   shape: { kind: "ellipse", center: [14, -23],    rx: 3,  ry: 5, rotation: -10 }},
  { name: "Sonoran Desert",        type: "desert", difficulty: "hard",   shape: { kind: "ellipse", center: [-112, 32],   rx: 3,  ry: 3, rotation: 0 }},
  { name: "Great Victoria Desert", type: "desert", difficulty: "hard",   shape: { kind: "ellipse", center: [129, -29],   rx: 6,  ry: 3, rotation: 0 }},
  { name: "Thar Desert",           type: "desert", difficulty: "hard",   shape: { kind: "ellipse", center: [71, 26.5],   rx: 3,  ry: 4, rotation: -10 }},
  { name: "Mojave Desert",         type: "desert", difficulty: "hard",   shape: { kind: "ellipse", center: [-116, 35.5], rx: 2,  ry: 2, rotation: 0 }},

  // ─── SEAS (ellipses — rendered under land, only water visible) ──────
  { name: "Mediterranean Sea",  type: "sea", difficulty: "easy",   shape: { kind: "ellipse", center: [18, 36],    rx: 20, ry: 6,  rotation: -3 }},
  { name: "Red Sea",            type: "sea", difficulty: "easy",   shape: { kind: "ellipse", center: [39, 20],    rx: 4,  ry: 12, rotation: -25 }},
  { name: "Black Sea",          type: "sea", difficulty: "medium", shape: { kind: "ellipse", center: [34, 43.5],  rx: 7,  ry: 3,  rotation: 5 }},
  { name: "Caspian Sea",        type: "sea", difficulty: "medium", shape: { kind: "ellipse", center: [51, 41],    rx: 4,  ry: 7,  rotation: 0 }},
  { name: "Arabian Sea",        type: "sea", difficulty: "medium", shape: { kind: "ellipse", center: [63, 14],    rx: 14, ry: 10, rotation: -10 }},
  { name: "Caribbean Sea",      type: "sea", difficulty: "easy",   shape: { kind: "ellipse", center: [-75, 16],   rx: 14, ry: 8,  rotation: -10 }},
  { name: "South China Sea",    type: "sea", difficulty: "medium", shape: { kind: "ellipse", center: [114, 12],   rx: 8,  ry: 12, rotation: -10 }},
  { name: "Baltic Sea",         type: "sea", difficulty: "medium", shape: { kind: "ellipse", center: [20, 58],    rx: 6,  ry: 8,  rotation: 15 }},
  { name: "North Sea",          type: "sea", difficulty: "medium", shape: { kind: "ellipse", center: [3, 57],     rx: 5,  ry: 5,  rotation: 15 }},
  { name: "Sea of Japan",       type: "sea", difficulty: "hard",   shape: { kind: "ellipse", center: [135, 40],   rx: 5,  ry: 8,  rotation: 20 }},
  { name: "Coral Sea",          type: "sea", difficulty: "hard",   shape: { kind: "ellipse", center: [155, -18],  rx: 10, ry: 8,  rotation: 0 }},
  { name: "Tasman Sea",         type: "sea", difficulty: "hard",   shape: { kind: "ellipse", center: [164, -38],  rx: 8,  ry: 8,  rotation: 0 }},

  // ─── OCEANS (large ellipses — rendered under land so only water shows) ──
  { name: "Pacific Ocean",  type: "ocean", difficulty: "easy",   shape: { kind: "ellipse", center: [-160, 0],   rx: 50, ry: 60, rotation: 0 }},
  { name: "Atlantic Ocean", type: "ocean", difficulty: "easy",   shape: { kind: "ellipse", center: [-35, 5],    rx: 25, ry: 55, rotation: 0 }},
  { name: "Indian Ocean",   type: "ocean", difficulty: "easy",   shape: { kind: "ellipse", center: [75, -15],   rx: 28, ry: 35, rotation: 0 }},
  { name: "Arctic Ocean",   type: "ocean", difficulty: "medium", shape: { kind: "ellipse", center: [0, 85],     rx: 60, ry: 10, rotation: 0 }},
  { name: "Southern Ocean", type: "ocean", difficulty: "medium", shape: { kind: "ellipse", center: [0, -68],    rx: 80, ry: 8,  rotation: 0 }},

  // ─── LAKES (small ellipses) ─────────────────────────────────────────
  { name: "Lake Victoria",   type: "lake", difficulty: "medium", shape: { kind: "ellipse", center: [33, -1],      rx: 2,   ry: 1.5, rotation: 0 }},
  { name: "Lake Baikal",     type: "lake", difficulty: "medium", shape: { kind: "ellipse", center: [108, 53.5],   rx: 1.5, ry: 4,   rotation: 30 }},
  { name: "Lake Titicaca",   type: "lake", difficulty: "medium", shape: { kind: "ellipse", center: [-69.5, -15.8],rx: 1,   ry: 0.8, rotation: 0 }},
  { name: "Lake Superior",   type: "lake", difficulty: "medium", shape: { kind: "ellipse", center: [-87, 47.5],   rx: 2.5, ry: 1.5, rotation: -20 }},
  { name: "Great Salt Lake",  type: "lake", difficulty: "hard", shape: { kind: "ellipse", center: [-112.5, 41],  rx: 1,   ry: 0.7, rotation: 0 }},
  { name: "Dead Sea",        type: "lake", difficulty: "medium", shape: { kind: "ellipse", center: [35.5, 31.5], rx: 0.5, ry: 1,   rotation: 0 }},
  { name: "Lake Tanganyika", type: "lake", difficulty: "hard",   shape: { kind: "ellipse", center: [29.5, -6],   rx: 0.5, ry: 3.5, rotation: -5 }},
  { name: "Lake Chad",       type: "lake", difficulty: "hard",   shape: { kind: "ellipse", center: [14, 13],     rx: 1.5, ry: 1.5, rotation: 0 }},
  { name: "Aral Sea",        type: "lake", difficulty: "hard",   shape: { kind: "ellipse", center: [59, 45],     rx: 2,   ry: 2,   rotation: 0 }},
  { name: "Lake Michigan",   type: "lake", difficulty: "hard",   shape: { kind: "ellipse", center: [-87, 44],    rx: 1.5, ry: 3,   rotation: -5 }},

  // ─── GULFS & BAYS (ellipses — rendered under land) ──────────────────
  { name: "Gulf of Mexico", type: "gulf", difficulty: "easy",   shape: { kind: "ellipse", center: [-90, 25],  rx: 10, ry: 8,   rotation: 0 }},
  { name: "Bay of Bengal",  type: "gulf", difficulty: "medium", shape: { kind: "ellipse", center: [88, 14],   rx: 10, ry: 10,  rotation: 0 }},
  { name: "Persian Gulf",   type: "gulf", difficulty: "medium", shape: { kind: "ellipse", center: [51, 27],   rx: 5,  ry: 3,   rotation: -40 }},
  { name: "Gulf of Aden",   type: "gulf", difficulty: "hard",   shape: { kind: "ellipse", center: [48, 12],   rx: 6,  ry: 2.5, rotation: 5 }},
  { name: "Hudson Bay",     type: "gulf", difficulty: "hard",   shape: { kind: "ellipse", center: [-83, 60],  rx: 10, ry: 9,   rotation: 0 }},

  // ─── ADDITIONAL SEAS (from Natural Earth 50m marine data) ───────────
  { name: "Adriatic Sea",        type: "sea", difficulty: "medium", shape: { kind: "ellipse", center: [16.2, 42.9],    rx: 3,  ry: 5,   rotation: -20 }},
  { name: "Aegean Sea",          type: "sea", difficulty: "medium", shape: { kind: "ellipse", center: [25.3, 38.9],    rx: 3,  ry: 4,   rotation: 0 }},
  { name: "Andaman Sea",         type: "sea", difficulty: "medium", shape: { kind: "ellipse", center: [96.9, 12.5],    rx: 4,  ry: 6,   rotation: 0 }},
  { name: "Barents Sea",         type: "sea", difficulty: "medium", shape: { kind: "ellipse", center: [44.8, 74.1],    rx: 10, ry: 6,   rotation: 0 }},
  { name: "Beaufort Sea",        type: "sea", difficulty: "medium", shape: { kind: "ellipse", center: [-136.2, 70.8],  rx: 8,  ry: 4,   rotation: 0 }},
  { name: "Bering Sea",          type: "sea", difficulty: "easy",   shape: { kind: "ellipse", center: [-177, 58],      rx: 10, ry: 6,   rotation: 0 }},
  { name: "East China Sea",      type: "sea", difficulty: "medium", shape: { kind: "ellipse", center: [125.0, 29.0],   rx: 5,  ry: 5,   rotation: 0 }},
  { name: "Greenland Sea",       type: "sea", difficulty: "medium", shape: { kind: "ellipse", center: [-13.0, 74.6],   rx: 6,  ry: 5,   rotation: 0 }},
  { name: "Ionian Sea",          type: "sea", difficulty: "medium", shape: { kind: "ellipse", center: [19.5, 38.4],    rx: 3,  ry: 4,   rotation: 0 }},
  { name: "Irish Sea",           type: "sea", difficulty: "medium", shape: { kind: "ellipse", center: [-4.7, 53.6],    rx: 2,  ry: 3,   rotation: 0 }},
  { name: "Labrador Sea",        type: "sea", difficulty: "medium", shape: { kind: "ellipse", center: [-57.4, 53.5],   rx: 6,  ry: 5,   rotation: 0 }},
  { name: "Norwegian Sea",       type: "sea", difficulty: "medium", shape: { kind: "ellipse", center: [11.6, 66.6],    rx: 6,  ry: 5,   rotation: 0 }},
  { name: "Philippine Sea",      type: "sea", difficulty: "medium", shape: { kind: "ellipse", center: [128.5, 20.7],   rx: 6,  ry: 8,   rotation: 0 }},
  { name: "Ross Sea",            type: "sea", difficulty: "medium", shape: { kind: "ellipse", center: [180, -78],      rx: 8,  ry: 5,   rotation: 0 }},
  { name: "Sargasso Sea",        type: "sea", difficulty: "medium", shape: { kind: "ellipse", center: [-60.0, 27.4],   rx: 8,  ry: 5,   rotation: 0 }},
  { name: "Sea of Okhotsk",      type: "sea", difficulty: "medium", shape: { kind: "ellipse", center: [145.8, 52.7],   rx: 6,  ry: 5,   rotation: 0 }},
  { name: "Tyrrhenian Sea",      type: "sea", difficulty: "medium", shape: { kind: "ellipse", center: [12.2, 40.4],    rx: 3,  ry: 4,   rotation: 0 }},
  { name: "Weddell Sea",         type: "sea", difficulty: "medium", shape: { kind: "ellipse", center: [-45, -74],      rx: 10, ry: 5,   rotation: 0 }},
  { name: "Yellow Sea",          type: "sea", difficulty: "medium", shape: { kind: "ellipse", center: [123.7, 36.8],   rx: 4,  ry: 4,   rotation: 0 }},
  { name: "Amundsen Sea",        type: "sea", difficulty: "hard",   shape: { kind: "ellipse", center: [-105.6, -74.3], rx: 6,  ry: 3,   rotation: 0 }},
  { name: "Arafura Sea",         type: "sea", difficulty: "hard",   shape: { kind: "ellipse", center: [135.9, -7.8],   rx: 6,  ry: 4,   rotation: 0 }},
  { name: "Balearic Sea",        type: "sea", difficulty: "hard",   shape: { kind: "ellipse", center: [1.8, 40.1],     rx: 3,  ry: 2,   rotation: 0 }},
  { name: "Banda Sea",           type: "sea", difficulty: "hard",   shape: { kind: "ellipse", center: [124.9, -4.7],   rx: 5,  ry: 3,   rotation: 0 }},
  { name: "Bellingshausen Sea",   type: "sea", difficulty: "hard",  shape: { kind: "ellipse", center: [-77.8, -72.1],  rx: 6,  ry: 3,   rotation: 0 }},
  { name: "Bismarck Sea",        type: "sea", difficulty: "hard",   shape: { kind: "ellipse", center: [148.5, -3.9],   rx: 4,  ry: 2,   rotation: 0 }},
  { name: "Bo Hai",              type: "sea", difficulty: "hard",   shape: { kind: "ellipse", center: [120.2, 39.1],   rx: 3,  ry: 2,   rotation: 0 }},
  { name: "Celebes Sea",         type: "sea", difficulty: "hard",   shape: { kind: "ellipse", center: [121.3, 4.3],    rx: 4,  ry: 3,   rotation: 0 }},
  { name: "Ceram Sea",           type: "sea", difficulty: "hard",   shape: { kind: "ellipse", center: [130.9, -2.7],   rx: 3,  ry: 2,   rotation: 0 }},
  { name: "Chukchi Sea",         type: "sea", difficulty: "hard",   shape: { kind: "ellipse", center: [-168, 68],      rx: 6,  ry: 4,   rotation: 0 }},
  { name: "Great Barrier Reef",  type: "sea", difficulty: "hard",   shape: { kind: "ellipse", center: [147.4, -17.2],  rx: 4,  ry: 6,   rotation: 0 }},
  { name: "Inner Sea",           type: "sea", difficulty: "hard",   shape: { kind: "ellipse", center: [133.0, 33.9],   rx: 2,  ry: 1.5, rotation: 0 }},
  { name: "Inner Seas",          type: "sea", difficulty: "hard",   shape: { kind: "ellipse", center: [-6.1, 56.4],    rx: 3,  ry: 2,   rotation: 0 }},
  { name: "Java Sea",            type: "sea", difficulty: "hard",   shape: { kind: "ellipse", center: [110.0, -5.0],   rx: 6,  ry: 2,   rotation: 0 }},
  { name: "Kara Sea",            type: "sea", difficulty: "hard",   shape: { kind: "ellipse", center: [80.2, 74.7],    rx: 8,  ry: 5,   rotation: 0 }},
  { name: "Laccadive Sea",       type: "sea", difficulty: "hard",   shape: { kind: "ellipse", center: [75.9, 10.2],    rx: 3,  ry: 5,   rotation: 0 }},
  { name: "Laptev Sea",          type: "sea", difficulty: "hard",   shape: { kind: "ellipse", center: [115.4, 75.7],   rx: 8,  ry: 4,   rotation: 0 }},
  { name: "Molucca Sea",         type: "sea", difficulty: "hard",   shape: { kind: "ellipse", center: [126.1, 0.6],    rx: 2,  ry: 3,   rotation: 0 }},
  { name: "Solomon Sea",         type: "sea", difficulty: "hard",   shape: { kind: "ellipse", center: [154.3, -7.7],   rx: 4,  ry: 3,   rotation: 0 }},
  { name: "Sulu Sea",            type: "sea", difficulty: "hard",   shape: { kind: "ellipse", center: [120.2, 8.8],    rx: 3,  ry: 4,   rotation: 0 }},
  { name: "Timor Sea",           type: "sea", difficulty: "hard",   shape: { kind: "ellipse", center: [128.7, -11.1],  rx: 4,  ry: 3,   rotation: 0 }},
  { name: "White Sea",           type: "sea", difficulty: "hard",   shape: { kind: "ellipse", center: [38.4, 66.1],    rx: 3,  ry: 3,   rotation: 0 }},

  // ─── ADDITIONAL GULFS & BAYS (from Natural Earth 50m) ──────────────
  { name: "Gulf of Alaska",      type: "gulf", difficulty: "easy",   shape: { kind: "ellipse", center: [-151, 58],     rx: 8, ry: 5,  rotation: 0 }},
  { name: "Gulf of Guinea",      type: "gulf", difficulty: "easy",   shape: { kind: "ellipse", center: [3.7, 3.0],     rx: 6, ry: 5,  rotation: 0 }},
  { name: "Gulf of Bothnia",     type: "gulf", difficulty: "medium", shape: { kind: "ellipse", center: [21, 62.8],     rx: 3, ry: 5,  rotation: 0 }},
  { name: "Gulf of Finland",     type: "gulf", difficulty: "medium", shape: { kind: "ellipse", center: [26.7, 60.0],   rx: 3, ry: 1,  rotation: 0 }},
  { name: "Gulf of Oman",        type: "gulf", difficulty: "medium", shape: { kind: "ellipse", center: [58.5, 24.7],   rx: 3, ry: 2,  rotation: 0 }},
  { name: "Gulf of Saint Lawrence", type: "gulf", difficulty: "medium", shape: { kind: "ellipse", center: [-60, 48],   rx: 5, ry: 4,  rotation: 0 }},
  { name: "Gulf of Thailand",    type: "gulf", difficulty: "medium", shape: { kind: "ellipse", center: [101.7, 10.2],  rx: 3, ry: 5,  rotation: 0 }},
  { name: "Gulf of Tonkin",      type: "gulf", difficulty: "medium", shape: { kind: "ellipse", center: [108.3, 20.5],  rx: 3, ry: 3,  rotation: 0 }},
  { name: "Gulf of Carpentaria", type: "gulf", difficulty: "medium", shape: { kind: "ellipse", center: [138.7, -14.9], rx: 4, ry: 4,  rotation: 0 }},
  { name: "Golfo de California", type: "gulf", difficulty: "medium", shape: { kind: "ellipse", center: [-111, 27.4],   rx: 2, ry: 6,  rotation: -10 }},
  { name: "Gulf of Honduras",    type: "gulf", difficulty: "hard",   shape: { kind: "ellipse", center: [-88.2, 16.1],  rx: 2, ry: 2,  rotation: 0 }},
  { name: "Gulf of Maine",       type: "gulf", difficulty: "hard",   shape: { kind: "ellipse", center: [-68.9, 43.8],  rx: 3, ry: 2,  rotation: 0 }},
  { name: "Gulf of Kutch",       type: "gulf", difficulty: "hard",   shape: { kind: "ellipse", center: [69.7, 22.7],   rx: 2, ry: 1,  rotation: 0 }},
  { name: "Gulf of Mannar",      type: "gulf", difficulty: "hard",   shape: { kind: "ellipse", center: [79.3, 8.5],    rx: 2, ry: 2,  rotation: 0 }},
  { name: "Shelikhova Gulf",     type: "gulf", difficulty: "hard",   shape: { kind: "ellipse", center: [160.3, 60.9],  rx: 3, ry: 4,  rotation: 0 }},
  { name: "Amundsen Gulf",       type: "gulf", difficulty: "hard",   shape: { kind: "ellipse", center: [-123.2, 70.5], rx: 4, ry: 2,  rotation: 0 }},
  { name: "Bahía de Campeche",   type: "gulf", difficulty: "hard",   shape: { kind: "ellipse", center: [-93.3, 19.1],  rx: 3, ry: 3,  rotation: 0 }},
  { name: "Golfe du Lion",       type: "gulf", difficulty: "hard",   shape: { kind: "ellipse", center: [4.1, 43.0],    rx: 2, ry: 2,  rotation: 0 }},
  { name: "Golfo San Jorge",     type: "gulf", difficulty: "hard",   shape: { kind: "ellipse", center: [-66.7, -45.9], rx: 2, ry: 2,  rotation: 0 }},
  { name: "Golfo de Panamá",     type: "gulf", difficulty: "hard",   shape: { kind: "ellipse", center: [-78.9, 8.4],   rx: 3, ry: 2,  rotation: 0 }},

  // ─── BAYS (from Natural Earth 50m) ──────────────────────────────────
  { name: "Bay of Biscay",       type: "bay", difficulty: "easy",   shape: { kind: "ellipse", center: [-3.2, 46.0],    rx: 4, ry: 3,  rotation: 0 }},
  { name: "Baffin Bay",          type: "bay", difficulty: "medium", shape: { kind: "ellipse", center: [-70.1, 73.4],   rx: 5, ry: 6,  rotation: 0 }},
  { name: "Chesapeake Bay",      type: "bay", difficulty: "medium", shape: { kind: "ellipse", center: [-76.4, 38.3],   rx: 1, ry: 3,  rotation: 0 }},
  { name: "Great Australian Bight", type: "bay", difficulty: "medium", shape: { kind: "ellipse", center: [136, -36.5], rx: 8, ry: 4,  rotation: 0 }},
  { name: "Bay of Fundy",        type: "bay", difficulty: "hard",   shape: { kind: "ellipse", center: [-65.5, 45.2],   rx: 2, ry: 1,  rotation: 0 }},
  { name: "Bay of Plenty",       type: "bay", difficulty: "hard",   shape: { kind: "ellipse", center: [176.7, -37.5],  rx: 2, ry: 1,  rotation: 0 }},
  { name: "Bristol Bay",         type: "bay", difficulty: "hard",   shape: { kind: "ellipse", center: [-159.2, 57.6],  rx: 3, ry: 2,  rotation: 0 }},
  { name: "James Bay",           type: "bay", difficulty: "hard",   shape: { kind: "ellipse", center: [-80.1, 52.6],   rx: 3, ry: 3,  rotation: 0 }},
  { name: "Melville Bay",        type: "bay", difficulty: "hard",   shape: { kind: "ellipse", center: [-61.3, 75.6],   rx: 3, ry: 2,  rotation: 0 }},
  { name: "Ungava Bay",          type: "bay", difficulty: "hard",   shape: { kind: "ellipse", center: [-67.7, 59.2],   rx: 4, ry: 3,  rotation: 0 }},
  { name: "Cook Inlet",          type: "bay", difficulty: "hard",   shape: { kind: "ellipse", center: [-151.7, 60.3],  rx: 1, ry: 3,  rotation: 0 }},
  { name: "Río de la Plata",     type: "bay", difficulty: "hard",   shape: { kind: "ellipse", center: [-57.5, -34.3],  rx: 2, ry: 1,  rotation: 0 }},

  // ─── CHANNELS & PASSAGES (from Natural Earth 50m) ──────────────────
  { name: "Mozambique Channel",  type: "channel", difficulty: "medium", shape: { kind: "ellipse", center: [41.3, -18.1],  rx: 4, ry: 8,   rotation: 0 }},
  { name: "Bristol Channel",     type: "channel", difficulty: "hard",   shape: { kind: "ellipse", center: [-4.2, 51.2],   rx: 2, ry: 1,   rotation: 0 }},

  // ─── PASSAGES & WIDER STRAITS (from Natural Earth 50m) ─────────────
  { name: "Davis Strait",        type: "passage", difficulty: "medium", shape: { kind: "ellipse", center: [-57.3, 65.7],  rx: 5, ry: 5,  rotation: 0 }},
  { name: "Drake Passage",       type: "passage", difficulty: "medium", shape: { kind: "ellipse", center: [-65, -59],     rx: 8, ry: 4,  rotation: 20 }},
  { name: "Straits of Florida",  type: "passage", difficulty: "medium", shape: { kind: "ellipse", center: [-80.3, 24.5],  rx: 3, ry: 2,  rotation: 0 }},
  { name: "Hudson Strait",       type: "passage", difficulty: "hard",   shape: { kind: "ellipse", center: [-71.6, 62.6],  rx: 5, ry: 2,  rotation: 0 }},
  { name: "Korea Strait",        type: "passage", difficulty: "hard",   shape: { kind: "ellipse", center: [128.7, 34.2],  rx: 3, ry: 1,  rotation: 0 }},
  { name: "Luzon Strait",        type: "passage", difficulty: "hard",   shape: { kind: "ellipse", center: [120.9, 22.1],  rx: 2, ry: 1,  rotation: 0 }},
  { name: "Makassar Strait",     type: "passage", difficulty: "hard",   shape: { kind: "ellipse", center: [118.3, -1.5],  rx: 2, ry: 5,  rotation: 0 }},
  { name: "Strait of Singapore", type: "passage", difficulty: "hard",   shape: { kind: "ellipse", center: [104.0, 1.3],   rx: 2, ry: 1,  rotation: 0 }},
  { name: "Taiwan Strait",       type: "passage", difficulty: "hard",   shape: { kind: "ellipse", center: [118.9, 24.3],  rx: 2, ry: 3,  rotation: 0 }},
  { name: "The North Western Passages", type: "passage", difficulty: "hard", shape: { kind: "ellipse", center: [-98.8, 73.8], rx: 15, ry: 5, rotation: 0 }},
  { name: "Viscount Melville Sound", type: "passage", difficulty: "hard", shape: { kind: "ellipse", center: [-109.6, 73.8], rx: 4, ry: 2, rotation: 0 }},

  // ─── STRAITS (rendered as dot markers on the map) ─────────────────
  { name: "Strait of Gibraltar", type: "strait", difficulty: "easy",   shape: { kind: "marker", center: [-5.6, 35.9] }},
  { name: "Strait of Malacca",  type: "strait", difficulty: "medium", shape: { kind: "marker", center: [100.0, 3.5] }},
  { name: "Strait of Hormuz",   type: "strait", difficulty: "medium", shape: { kind: "marker", center: [56.0, 26.7] }},
  { name: "English Channel",    type: "strait", difficulty: "medium", shape: { kind: "marker", center: [-2.0, 50.2] }},
  { name: "Bosphorus",          type: "strait", difficulty: "medium", shape: { kind: "marker", center: [29.0, 41.1] }},
  { name: "Strait of Magellan", type: "strait", difficulty: "hard",   shape: { kind: "marker", center: [-71.5, -53.0] }},

  // ─── CANALS (rendered as dot markers on the map) ───────────────────
  { name: "Suez Canal",  type: "canal", difficulty: "easy", shape: { kind: "marker", center: [32.4, 30.5] }},
  { name: "Panama Canal", type: "canal", difficulty: "easy", shape: { kind: "marker", center: [-79.7, 9.1] }},

  // ─── NEW SEAS from Natural Earth 10m ───────────────────────────────
  { name: "Sea of Azov",         type: "sea", difficulty: "medium", shape: { kind: "ellipse", center: [37.2, 46.3], rx: 3, ry: 2 }},
  { name: "Sea of Crete",        type: "sea", difficulty: "hard",   shape: { kind: "ellipse", center: [24.9, 36.5], rx: 3, ry: 2 }},
  { name: "Sea of Marmara",      type: "sea", difficulty: "hard",   shape: { kind: "ellipse", center: [28.2, 40.6], rx: 3, ry: 2 }},
  { name: "Alboran Sea",         type: "sea", difficulty: "hard",   shape: { kind: "ellipse", center: [-3.9, 35.9], rx: 3, ry: 2 }},
  { name: "Ligurian Sea",        type: "sea", difficulty: "hard",   shape: { kind: "ellipse", center: [8.9, 44.0], rx: 3, ry: 2 }},
  { name: "Flores Sea",          type: "sea", difficulty: "hard",   shape: { kind: "ellipse", center: [119.9, -7.9], rx: 3, ry: 2 }},
  { name: "Bali Sea",            type: "sea", difficulty: "hard",   shape: { kind: "ellipse", center: [115.8, -8.3], rx: 3, ry: 2 }},
  { name: "Savu Sea",            type: "sea", difficulty: "hard",   shape: { kind: "ellipse", center: [121.8, -9.1], rx: 3, ry: 2 }},
  { name: "Halmahera Sea",       type: "sea", difficulty: "hard",   shape: { kind: "ellipse", center: [129.2, -0.6], rx: 3, ry: 2 }},
  { name: "Samar Sea",           type: "sea", difficulty: "hard",   shape: { kind: "ellipse", center: [124.3, 12.1], rx: 3, ry: 2 }},
  { name: "Sibuyan Sea",         type: "sea", difficulty: "hard",   shape: { kind: "ellipse", center: [122.4, 12.6], rx: 3, ry: 2 }},
  { name: "Visayan Sea",         type: "sea", difficulty: "hard",   shape: { kind: "ellipse", center: [123.5, 11.1], rx: 3, ry: 2 }},
  { name: "Bohol Sea",           type: "sea", difficulty: "hard",   shape: { kind: "ellipse", center: [124.4, 9.5], rx: 3, ry: 2 }},
  { name: "East Siberian Sea",   type: "sea", difficulty: "hard",   shape: { kind: "ellipse", center: [151.9, 72.6], rx: 3, ry: 2 }},
  { name: "Lincoln Sea",         type: "sea", difficulty: "hard",   shape: { kind: "ellipse", center: [-53.1, 82.6], rx: 3, ry: 2 }},
  { name: "Davis Sea",           type: "sea", difficulty: "hard",   shape: { kind: "ellipse", center: [95.6, -66.4], rx: 3, ry: 2 }},
  { name: "Salish Sea",          type: "sea", difficulty: "hard",   shape: { kind: "ellipse", center: [-123.3, 48.7], rx: 3, ry: 2 }},
  { name: "Kattegat",            type: "sea", difficulty: "hard",   shape: { kind: "ellipse", center: [11.7, 56.7], rx: 3, ry: 2 }},
  { name: "Skagerrak",           type: "sea", difficulty: "hard",   shape: { kind: "ellipse", center: [9.9, 58.6], rx: 3, ry: 2 }},

  // ─── NEW GULFS & BAYS from Natural Earth 10m ──────────────────────
  { name: "Gulf of Suez",        type: "gulf", difficulty: "medium", shape: { kind: "ellipse", center: [33.2, 28.6], rx: 3, ry: 2 }},
  { name: "Gulf of Aqaba",       type: "gulf", difficulty: "hard",   shape: { kind: "ellipse", center: [34.7, 28.6], rx: 3, ry: 2 }},
  { name: "Gulf of Sidra",       type: "gulf", difficulty: "hard",   shape: { kind: "ellipse", center: [18.1, 31.2], rx: 3, ry: 2 }},
  { name: "Gulf of Gabès",       type: "gulf", difficulty: "hard",   shape: { kind: "ellipse", center: [10.7, 34.2], rx: 3, ry: 2 }},
  { name: "Gulf of Riga",        type: "gulf", difficulty: "hard",   shape: { kind: "ellipse", center: [23.2, 58.3], rx: 3, ry: 2 }},
  { name: "Gulf of Papua",       type: "gulf", difficulty: "hard",   shape: { kind: "ellipse", center: [144.1, -8.1], rx: 3, ry: 2 }},
  { name: "Gulf of Martaban",    type: "gulf", difficulty: "hard",   shape: { kind: "ellipse", center: [96.8, 16.5], rx: 3, ry: 2 }},
  { name: "Golfo de Tehuantepec", type: "gulf", difficulty: "hard",  shape: { kind: "ellipse", center: [-94.5, 16.1], rx: 3, ry: 2 }},
  { name: "Golfo San Matías",    type: "gulf", difficulty: "hard",   shape: { kind: "ellipse", center: [-64.5, -41.7], rx: 3, ry: 2 }},
  { name: "Delaware Bay",        type: "bay",  difficulty: "hard",   shape: { kind: "ellipse", center: [-75.3, 39.4], rx: 3, ry: 2 }},
  { name: "San Francisco Bay",   type: "bay",  difficulty: "hard",   shape: { kind: "ellipse", center: [-122.2, 37.9], rx: 3, ry: 2 }},
  { name: "Foxe Basin",          type: "bay",  difficulty: "hard",   shape: { kind: "ellipse", center: [-79.6, 67.5], rx: 3, ry: 2 }},
  { name: "Joseph Bonaparte Gulf", type: "gulf", difficulty: "hard", shape: { kind: "ellipse", center: [128.8, -14.7], rx: 3, ry: 2 }},
  { name: "Davao Gulf",          type: "gulf", difficulty: "hard",   shape: { kind: "ellipse", center: [125.8, 6.8], rx: 3, ry: 2 }},
  { name: "Bight of Benin",      type: "bay",  difficulty: "medium", shape: { kind: "ellipse", center: [4.3, 5.7], rx: 3, ry: 2 }},
  { name: "Bight of Biafra",     type: "bay",  difficulty: "hard",   shape: { kind: "ellipse", center: [8.5, 4.2], rx: 3, ry: 2 }},

  // ─── NEW STRAITS & PASSAGES from Natural Earth 10m ────────────────
  { name: "Bass Strait",         type: "strait", difficulty: "hard",   shape: { kind: "marker", center: [146.2, -39.6] }},
  { name: "Cook Strait",         type: "strait", difficulty: "hard",   shape: { kind: "marker", center: [174.5, -41.3] }},
  { name: "Denmark Strait",      type: "strait", difficulty: "medium", shape: { kind: "marker", center: [-24.6, 66.0] }},
  { name: "Torres Strait",       type: "strait", difficulty: "hard",   shape: { kind: "marker", center: [142.3, -9.8] }},
  { name: "Yucatan Channel",     type: "strait", difficulty: "hard",   shape: { kind: "marker", center: [-84.9, 21.9] }},
  { name: "Dardanelles",         type: "strait", difficulty: "hard",   shape: { kind: "marker", center: [26.4, 40.2] }},
  { name: "Bab el Mandeb",       type: "strait", difficulty: "hard",   shape: { kind: "marker", center: [43.9, 12.6] }},
  { name: "Palk Strait",         type: "strait", difficulty: "hard",   shape: { kind: "marker", center: [79.8, 9.6] }},
  { name: "Tsugaru Strait",      type: "strait", difficulty: "hard",   shape: { kind: "marker", center: [140.8, 41.3] }},
  { name: "La Pérouse Strait",   type: "strait", difficulty: "hard",   shape: { kind: "marker", center: [142.1, 45.9] }},
  { name: "Bransfield Strait",   type: "strait", difficulty: "hard",   shape: { kind: "marker", center: [-59.9, -63.4] }},
  { name: "Tatar Strait",        type: "strait", difficulty: "hard",   shape: { kind: "marker", center: [141.4, 52.6] }},
];

// Deduplicate
const seen = new Set<string>();
export const ALL_FEATURES = FEATURES.filter(f => {
  if (seen.has(f.name)) return false;
  seen.add(f.name);
  return true;
});

// ============================================================================
// HELPERS
// ============================================================================

/** Get features filtered by category group key */
export function getFeaturesByCategory(categoryKey: string): PhysicalFeature[] {
  if (categoryKey === "all") return ALL_FEATURES;
  const group = CATEGORY_GROUPS.find(g => g.key === categoryKey);
  if (!group) return ALL_FEATURES;
  return ALL_FEATURES.filter(f => group.types.includes(f.type));
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

/** Generate smooth SVG path `d` from projected screen-space points */
export function smoothPathD(pts: [number, number][]): string {
  if (pts.length < 2) return "";
  if (pts.length === 2)
    return `M${pts[0][0]},${pts[0][1]} L${pts[1][0]},${pts[1][1]}`;

  let d = `M${pts[0][0]},${pts[0][1]}`;

  // Line to midpoint of first segment
  d += ` L${(pts[0][0] + pts[1][0]) / 2},${(pts[0][1] + pts[1][1]) / 2}`;

  // Quadratic Bézier through midpoints (each data point becomes a control point)
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

/** Project [lon,lat] waypoints → smooth SVG path `d` */
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

/** Project ellipse → closed SVG polygon `d` */
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

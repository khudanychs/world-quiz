/**
 * Physical Geography – Mountains, Volcanoes & Mountain Ranges
 */
import type { PhysicalFeature } from "./physicalFeaturesTypes";

// ═══════════════════════════════════════════════════════════════════
//  MOUNTAINS / PEAKS  (markers — ~56 peaks)
// ═══════════════════════════════════════════════════════════════════
// ─── Easy ───
const PEAKS_EASY: PhysicalFeature[] = [
  { name: "Mount Everest",     type: "mountain", shape: { kind: "marker", center: [86.925, 27.988] },   difficulty: "easy" },
  { name: "Mount Kilimanjaro", type: "mountain", shape: { kind: "marker", center: [37.355, -3.068] },   difficulty: "easy" },
  { name: "Mount Fuji",        type: "mountain", shape: { kind: "marker", center: [138.727, 35.361] },  difficulty: "easy" },
  { name: "Denali",            type: "mountain", shape: { kind: "marker", center: [-151.0, 63.07] },    difficulty: "easy" },
  { name: "Mont Blanc",        type: "mountain", shape: { kind: "marker", center: [6.865, 45.833] },    difficulty: "easy" },
  { name: "Aconcagua",         type: "mountain", shape: { kind: "marker", center: [-70.011, -32.653] }, difficulty: "easy" },
];

// ─── Medium ───
const PEAKS_MEDIUM: PhysicalFeature[] = [
  { name: "K2",                type: "mountain", shape: { kind: "marker", center: [76.513, 35.881] },   difficulty: "medium" },
  { name: "Mount Elbrus",      type: "mountain", shape: { kind: "marker", center: [42.439, 43.353] },   difficulty: "medium" },
  { name: "Matterhorn",        type: "mountain", shape: { kind: "marker", center: [7.659, 45.977] },    difficulty: "medium" },
  { name: "Mount Olympus",     type: "mountain", shape: { kind: "marker", center: [22.350, 40.087] },   difficulty: "medium" },
  { name: "Mount Kenya",       type: "mountain", shape: { kind: "marker", center: [37.31, -0.15] },     difficulty: "medium" },
  { name: "Mount Rainier",     type: "mountain", shape: { kind: "marker", center: [-121.76, 46.85] },   difficulty: "medium" },
  { name: "Mount Ararat",      type: "mountain", shape: { kind: "marker", center: [44.30, 39.70] },     difficulty: "medium" },
  { name: "Table Mountain",    type: "mountain", shape: { kind: "marker", center: [18.40, -33.96] },    difficulty: "medium" },
  { name: "Mount Sinai",       type: "mountain", shape: { kind: "marker", center: [33.97, 28.54] },     difficulty: "medium" },
  { name: "Vinson Massif",     type: "mountain", shape: { kind: "marker", center: [-89.25, -78.53] },   difficulty: "medium" },
  { name: "Puncak Jaya",       type: "mountain", shape: { kind: "marker", center: [137.16, -4.08] },    difficulty: "medium" },
];

// ─── Hard ───
const PEAKS_HARD: PhysicalFeature[] = [
  { name: "Mauna Kea",         type: "mountain", shape: { kind: "marker", center: [-155.468, 19.821] }, difficulty: "hard" },
  { name: "Mount Kosciuszko",  type: "mountain", shape: { kind: "marker", center: [148.263, -36.456] }, difficulty: "hard" },
  { name: "Kangchenjunga",     type: "mountain", shape: { kind: "marker", center: [88.15, 27.70] },     difficulty: "hard" },
  { name: "Lhotse",            type: "mountain", shape: { kind: "marker", center: [86.93, 27.96] },     difficulty: "hard" },
  { name: "Makalu",            type: "mountain", shape: { kind: "marker", center: [87.09, 27.89] },     difficulty: "hard" },
  { name: "Dhaulagiri",        type: "mountain", shape: { kind: "marker", center: [83.49, 28.70] },     difficulty: "hard" },
  { name: "Nanga Parbat",      type: "mountain", shape: { kind: "marker", center: [74.59, 35.24] },     difficulty: "hard" },
  { name: "Annapurna",         type: "mountain", shape: { kind: "marker", center: [83.82, 28.60] },     difficulty: "hard" },
  { name: "Mount Logan",       type: "mountain", shape: { kind: "marker", center: [-140.41, 60.57] },   difficulty: "hard" },
  { name: "Aoraki / Mount Cook", type: "mountain", shape: { kind: "marker", center: [170.14, -43.59] }, difficulty: "hard" },
  { name: "Mount Whitney",     type: "mountain", shape: { kind: "marker", center: [-118.29, 36.58] },   difficulty: "hard" },
  { name: "Mount Toubkal",     type: "mountain", shape: { kind: "marker", center: [-7.91, 31.06] },     difficulty: "hard" },
  { name: "Zugspitze",         type: "mountain", shape: { kind: "marker", center: [10.98, 47.42] },     difficulty: "hard" },
  { name: "Ben Nevis",         type: "mountain", shape: { kind: "marker", center: [-5.00, 56.80] },     difficulty: "hard" },
  { name: "Mount Roraima",     type: "mountain", shape: { kind: "marker", center: [-60.76, 5.14] },     difficulty: "hard" },
  { name: "Mount Fitz Roy",    type: "mountain", shape: { kind: "marker", center: [-73.04, -49.27] },   difficulty: "hard" },
  { name: "Chimborazo",        type: "mountain", shape: { kind: "marker", center: [-78.82, -1.47] },    difficulty: "hard" },
  { name: "Pikes Peak",        type: "mountain", shape: { kind: "marker", center: [-105.04, 38.84] },   difficulty: "hard" },
  { name: "Grossglockner",     type: "mountain", shape: { kind: "marker", center: [12.69, 47.07] },     difficulty: "hard" },
  { name: "Mount Damavand",    type: "mountain", shape: { kind: "marker", center: [52.11, 35.95] },     difficulty: "hard" },
  { name: "Mount Kinabalu",    type: "mountain", shape: { kind: "marker", center: [116.56, 6.08] },     difficulty: "hard" },
  { name: "Mount Tyree",       type: "mountain", shape: { kind: "marker", center: [-89.54, -78.39] },   difficulty: "hard" },
  { name: "Ama Dablam",        type: "mountain", shape: { kind: "marker", center: [86.86, 27.86] },     difficulty: "hard" },
  { name: "Mount Ṣafad Kōh",  type: "mountain", shape: { kind: "marker", center: [70.32, 34.33] },     difficulty: "hard" },
  { name: "Mount Wilhelm",     type: "mountain", shape: { kind: "marker", center: [145.03, -5.78] },    difficulty: "hard" },
  { name: "Ojos del Salado",   type: "mountain", shape: { kind: "marker", center: [-68.54, -27.11] },   difficulty: "hard" },
  { name: "Cho Oyu",           type: "mountain", shape: { kind: "marker", center: [86.66, 28.09] },     difficulty: "hard" },
  { name: "Manaslu",           type: "mountain", shape: { kind: "marker", center: [84.56, 28.55] },     difficulty: "hard" },
  { name: "Mount Blanc de Courmayeur", type: "mountain", shape: { kind: "marker", center: [6.87, 45.82] }, difficulty: "hard" },
  { name: "Cerro Torre",       type: "mountain", shape: { kind: "marker", center: [-73.11, -49.29] },   difficulty: "hard" },
  { name: "Huascarán",         type: "mountain", shape: { kind: "marker", center: [-77.60, -9.12] },    difficulty: "hard" },
  { name: "Mount Inyangani",   type: "mountain", shape: { kind: "marker", center: [32.77, -18.30] },    difficulty: "hard" },
  { name: "Mount Stanley",     type: "mountain", shape: { kind: "marker", center: [29.87, 0.39] },      difficulty: "hard" },
  { name: "Grand Teton",       type: "mountain", shape: { kind: "marker", center: [-110.80, 43.74] },   difficulty: "hard" },
  { name: "Mount Ossa",        type: "mountain", shape: { kind: "marker", center: [146.04, -41.88] },   difficulty: "hard" },
  { name: "Jungfrau",          type: "mountain", shape: { kind: "marker", center: [7.96, 46.54] },      difficulty: "hard" },
  { name: "Mount Belukha",     type: "mountain", shape: { kind: "marker", center: [86.59, 49.81] },     difficulty: "hard" },
];

// ═══════════════════════════════════════════════════════════════════
//  VOLCANOES  (markers — ~22 volcanoes)
// ═══════════════════════════════════════════════════════════════════
const VOLCANOES: PhysicalFeature[] = [
  // ─── Easy ───
  { name: "Kilauea",          type: "volcano", shape: { kind: "marker", center: [-155.29, 19.41] },   difficulty: "easy" },
  // ─── Medium ───
  { name: "Mount Vesuvius",   type: "volcano", shape: { kind: "marker", center: [14.426, 40.821] },   difficulty: "medium" },
  { name: "Mount Etna",       type: "volcano", shape: { kind: "marker", center: [14.999, 37.751] },   difficulty: "medium" },
  { name: "Popocatépetl",     type: "volcano", shape: { kind: "marker", center: [-98.62, 19.02] },    difficulty: "medium" },
  { name: "Cotopaxi",         type: "volcano", shape: { kind: "marker", center: [-78.44, -0.68] },    difficulty: "medium" },
  { name: "Mount Pinatubo",   type: "volcano", shape: { kind: "marker", center: [120.35, 15.14] },    difficulty: "medium" },
  { name: "Mount Teide",      type: "volcano", shape: { kind: "marker", center: [-16.64, 28.27] },    difficulty: "medium" },
  // ─── Hard ───
  { name: "Krakatoa",         type: "volcano", shape: { kind: "marker", center: [105.423, -6.102] },  difficulty: "hard" },
  { name: "Mount St. Helens", type: "volcano", shape: { kind: "marker", center: [-122.18, 46.191] },  difficulty: "hard" },
  { name: "Eyjafjallajökull", type: "volcano", shape: { kind: "marker", center: [-19.613, 63.633] },  difficulty: "hard" },
  { name: "Mount Erebus",     type: "volcano", shape: { kind: "marker", center: [167.17, -77.53] },   difficulty: "hard" },
  { name: "Pico de Orizaba",  type: "volcano", shape: { kind: "marker", center: [-97.27, 19.03] },    difficulty: "hard" },
  { name: "Mount Tambora",    type: "volcano", shape: { kind: "marker", center: [118.0, -8.25] },     difficulty: "hard" },
  { name: "Mount Merapi",     type: "volcano", shape: { kind: "marker", center: [110.45, -7.54] },    difficulty: "hard" },
  { name: "Mount Nyiragongo", type: "volcano", shape: { kind: "marker", center: [29.25, -1.52] },     difficulty: "hard" },
  { name: "Hekla",            type: "volcano", shape: { kind: "marker", center: [-19.67, 63.98] },    difficulty: "hard" },
  { name: "Stromboli",        type: "volcano", shape: { kind: "marker", center: [15.21, 38.79] },     difficulty: "hard" },
  { name: "Sakurajima",       type: "volcano", shape: { kind: "marker", center: [130.66, 31.58] },    difficulty: "hard" },
  { name: "Mount Aso",        type: "volcano", shape: { kind: "marker", center: [131.08, 32.88] },    difficulty: "hard" },
  { name: "Piton de la Fournaise", type: "volcano", shape: { kind: "marker", center: [55.71, -21.24] }, difficulty: "hard" },
  { name: "Mount Bromo",      type: "volcano", shape: { kind: "marker", center: [112.95, -7.94] },    difficulty: "hard" },
  { name: "Mount Ruapehu",    type: "volcano", shape: { kind: "marker", center: [175.57, -39.28] },   difficulty: "hard" },
];

// ═══════════════════════════════════════════════════════════════════
//  MOUNTAIN RANGES  (paths — ~27 ranges)
// ═══════════════════════════════════════════════════════════════════
const RANGES: PhysicalFeature[] = [
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
  { name: "Carpathian Mountains", type: "mountain_range", difficulty: "medium", shape: { kind: "path", points: [
    [18.0, 48.5], [20.0, 49.0], [22.0, 49.0], [24.0, 48.5], [25.0, 47.5], [26.0, 46.5], [25.5, 45.5],
  ]}},
  { name: "Pyrenees", type: "mountain_range", difficulty: "medium", shape: { kind: "path", points: [
    [-1.5, 43.0], [0.0, 42.8], [1.0, 42.7], [2.0, 42.5], [3.0, 42.8],
  ]}},
  { name: "Appalachian Mountains", type: "mountain_range", difficulty: "medium", shape: { kind: "path", points: [
    [-68.5, 47.0], [-72.0, 44.0], [-75.0, 41.0], [-78.0, 38.0], [-80.0, 36.0], [-83.0, 35.0], [-85.0, 34.0],
  ]}},
  { name: "Scandinavian Mountains", type: "mountain_range", difficulty: "medium", shape: { kind: "path", points: [
    [5.5, 60.0], [8.0, 62.0], [13.0, 65.0], [16.0, 67.0], [18.5, 69.0], [20.0, 69.5],
  ]}},
  { name: "Caucasus Mountains", type: "mountain_range", difficulty: "medium", shape: { kind: "path", points: [
    [37.0, 43.5], [40.0, 43.0], [42.5, 42.5], [44.5, 42.0], [47.0, 41.5], [49.5, 41.0],
  ]}},
  { name: "Hindu Kush", type: "mountain_range", difficulty: "medium", shape: { kind: "path", points: [
    [65.0, 36.0], [67.0, 36.5], [69.0, 36.0], [71.0, 35.5], [72.5, 35.0], [74.0, 35.5],
  ]}},
  { name: "Great Dividing Range", type: "mountain_range", difficulty: "hard", shape: { kind: "path", points: [
    [143.0, -38.0], [146.0, -36.0], [148.5, -33.0], [150.5, -28.0], [150.0, -24.0], [148.0, -20.0], [146.0, -18.0],
  ]}},
  { name: "Drakensberg", type: "mountain_range", difficulty: "hard", shape: { kind: "path", points: [
    [27.5, -31.0], [28.0, -30.0], [28.5, -29.0], [29.0, -28.0], [29.5, -27.0], [30.0, -26.0],
  ]}},
  { name: "Karakoram", type: "mountain_range", difficulty: "hard", shape: { kind: "path", points: [
    [74.0, 35.5], [75.5, 36.0], [76.5, 36.5], [77.5, 36.0], [78.5, 35.5],
  ]}},
  { name: "Tian Shan", type: "mountain_range", difficulty: "hard", shape: { kind: "path", points: [
    [67.0, 39.5], [70.0, 41.0], [73.0, 42.0], [76.0, 42.5], [79.0, 42.0], [82.0, 43.0], [85.0, 43.5], [88.0, 43.0],
  ]}},
  { name: "Altai Mountains", type: "mountain_range", difficulty: "hard", shape: { kind: "path", points: [
    [82.0, 50.0], [84.0, 49.5], [86.0, 49.0], [88.0, 49.0], [90.0, 48.5], [92.0, 48.0],
  ]}},
  { name: "Zagros Mountains", type: "mountain_range", difficulty: "hard", shape: { kind: "path", points: [
    [44.0, 37.0], [46.0, 35.5], [48.0, 34.0], [50.0, 32.5], [52.0, 31.0], [54.0, 29.5], [56.0, 28.0],
  ]}},
  { name: "Sierra Nevada (US)", type: "mountain_range", difficulty: "hard", shape: { kind: "path", points: [
    [-121.5, 40.0], [-120.5, 39.0], [-119.5, 38.0], [-119.0, 37.0], [-118.5, 36.0], [-118.0, 35.5],
  ]}},
  { name: "Sierra Madre Oriental", type: "mountain_range", difficulty: "hard", shape: { kind: "path", points: [
    [-100.0, 25.0], [-99.5, 23.5], [-98.0, 22.0], [-97.0, 20.5], [-96.5, 19.0],
  ]}},
  { name: "Sierra Madre Occidental", type: "mountain_range", difficulty: "hard", shape: { kind: "path", points: [
    [-108.0, 30.0], [-106.5, 28.0], [-105.5, 26.0], [-105.0, 24.0], [-104.5, 22.0],
  ]}},
  { name: "Brooks Range", type: "mountain_range", difficulty: "hard", shape: { kind: "path", points: [
    [-162.0, 67.5], [-157.0, 68.0], [-152.0, 68.3], [-147.0, 68.0], [-143.0, 67.5],
  ]}},
  { name: "Kunlun Mountains", type: "mountain_range", difficulty: "hard", shape: { kind: "path", points: [
    [74.0, 37.0], [78.0, 36.5], [82.0, 36.0], [86.0, 36.0], [90.0, 36.5], [94.0, 36.0], [97.0, 35.5],
  ]}},
  { name: "Apennine Mountains", type: "mountain_range", difficulty: "hard", shape: { kind: "path", points: [
    [8.5, 44.5], [10.0, 44.0], [11.5, 43.5], [13.0, 42.5], [14.5, 41.5], [15.5, 40.5], [16.0, 39.5],
  ]}},
  { name: "Transantarctic Mountains", type: "mountain_range", difficulty: "hard", shape: { kind: "path", points: [
    [170.0, -72.0], [165.0, -75.0], [160.0, -78.0], [155.0, -80.0], [145.0, -82.0],
  ]}},
  { name: "Ethiopian Highlands", type: "mountain_range", difficulty: "hard", shape: { kind: "path", points: [
    [36.0, 14.0], [37.5, 12.0], [38.5, 10.0], [39.0, 8.0], [39.5, 7.0],
  ]}},
  { name: "Dinaric Alps", type: "mountain_range", difficulty: "hard", shape: { kind: "path", points: [
    [14.5, 45.5], [16.0, 44.5], [17.5, 43.5], [18.5, 43.0], [19.5, 42.5], [20.0, 42.0],
  ]}},
];

/** All mountain-category features (peaks + volcanoes + ranges) */
export const MOUNTAIN_FEATURES: PhysicalFeature[] = [
  ...PEAKS_EASY,
  ...PEAKS_MEDIUM,
  ...PEAKS_HARD,
  ...VOLCANOES,
  ...RANGES,
];

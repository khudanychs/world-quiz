/**
 * Physical Geography – Seas, Oceans, Gulfs, Bays, Straits, Channels, Passages & Canals
 */
import type { PhysicalFeature } from "./physicalFeaturesTypes";

// ═══════════════════════════════════════════════════════════════════
//  OCEANS
// ═══════════════════════════════════════════════════════════════════
const OCEANS: PhysicalFeature[] = [
  { name: "Pacific Ocean",   type: "ocean", difficulty: "easy",   shape: { kind: "ellipse", center: [-160, 0],   rx: 50, ry: 60, rotation: 0 }},
  { name: "Atlantic Ocean",  type: "ocean", difficulty: "easy",   shape: { kind: "ellipse", center: [-35, 5],    rx: 25, ry: 55, rotation: 0 }},
  { name: "Indian Ocean",    type: "ocean", difficulty: "easy",   shape: { kind: "ellipse", center: [75, -15],   rx: 28, ry: 35, rotation: 0 }},
  { name: "Arctic Ocean",    type: "ocean", difficulty: "medium", shape: { kind: "ellipse", center: [0, 85],     rx: 60, ry: 10, rotation: 0 }},
  { name: "Southern Ocean",  type: "ocean", difficulty: "medium", shape: { kind: "ellipse", center: [0, -68],    rx: 80, ry: 8,  rotation: 0 }},
];

// ═══════════════════════════════════════════════════════════════════
//  MAJOR SEAS  (large well-known water bodies)
// ═══════════════════════════════════════════════════════════════════
const MAJOR_SEAS: PhysicalFeature[] = [
  { name: "Mediterranean Sea",  type: "sea", difficulty: "easy",   shape: { kind: "ellipse", center: [18, 36],    rx: 20, ry: 6,  rotation: -3 }},
  { name: "Caribbean Sea",      type: "sea", difficulty: "easy",   shape: { kind: "ellipse", center: [-75, 16],   rx: 14, ry: 8,  rotation: -10 }},
  { name: "South China Sea",    type: "sea", difficulty: "medium", shape: { kind: "ellipse", center: [114, 12],   rx: 8,  ry: 12, rotation: -10 }},
  { name: "Arabian Sea",        type: "sea", difficulty: "medium", shape: { kind: "ellipse", center: [63, 14],    rx: 14, ry: 10, rotation: -10 }},
  { name: "Red Sea",            type: "sea", difficulty: "medium", shape: { kind: "ellipse", center: [39, 20],    rx: 4,  ry: 12, rotation: -25 }},
  { name: "Black Sea",          type: "sea", difficulty: "medium", shape: { kind: "ellipse", center: [34, 43.5],  rx: 7,  ry: 3,  rotation: 5 }},
  { name: "Caspian Sea",        type: "sea", difficulty: "medium", shape: { kind: "ellipse", center: [51, 41],    rx: 4,  ry: 7,  rotation: 0 }},
  { name: "Baltic Sea",         type: "sea", difficulty: "medium", shape: { kind: "ellipse", center: [20, 58],    rx: 6,  ry: 8,  rotation: 15 }},
  { name: "North Sea",          type: "sea", difficulty: "medium", shape: { kind: "ellipse", center: [3, 57],     rx: 5,  ry: 5,  rotation: 15 }},
  { name: "Sea of Japan",       type: "sea", difficulty: "medium", shape: { kind: "ellipse", center: [135, 40],   rx: 5,  ry: 8,  rotation: 20 }},
  { name: "Coral Sea",          type: "sea", difficulty: "hard",   shape: { kind: "ellipse", center: [155, -18],  rx: 10, ry: 8,  rotation: 0 }},
  { name: "Tasman Sea",         type: "sea", difficulty: "hard",   shape: { kind: "ellipse", center: [164, -38],  rx: 8,  ry: 8,  rotation: 0 }},
];

// ═══════════════════════════════════════════════════════════════════
//  GULFS & BAYS  (initial set)
// ═══════════════════════════════════════════════════════════════════
const GULFS_INITIAL: PhysicalFeature[] = [
  { name: "Gulf of Mexico", type: "gulf", difficulty: "easy",   shape: { kind: "ellipse", center: [-90, 25],  rx: 10, ry: 8,   rotation: 0 }},
  { name: "Bay of Bengal",  type: "gulf", difficulty: "medium", shape: { kind: "ellipse", center: [88, 14],   rx: 10, ry: 10,  rotation: 0 }},
  { name: "Persian Gulf",   type: "gulf", difficulty: "medium", shape: { kind: "ellipse", center: [51, 27],   rx: 5,  ry: 3,   rotation: -40 }},
  { name: "Gulf of Aden",   type: "gulf", difficulty: "hard",   shape: { kind: "ellipse", center: [48, 12],   rx: 6,  ry: 2.5, rotation: 5 }},
  { name: "Hudson Bay",     type: "gulf", difficulty: "hard",   shape: { kind: "ellipse", center: [-83, 60],  rx: 10, ry: 9,   rotation: 0 }},
];

// ═══════════════════════════════════════════════════════════════════
//  SEAS (from Natural Earth 50m marine data)
// ═══════════════════════════════════════════════════════════════════
const SEAS_50M: PhysicalFeature[] = [
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
];

// ═══════════════════════════════════════════════════════════════════
//  ADDITIONAL GULFS & BAYS (from Natural Earth 50m)
// ═══════════════════════════════════════════════════════════════════
const GULFS_BAYS_50M: PhysicalFeature[] = [
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
];

// ═══════════════════════════════════════════════════════════════════
//  BAYS (from Natural Earth 50m)
// ═══════════════════════════════════════════════════════════════════
const BAYS_50M: PhysicalFeature[] = [
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
];

// ═══════════════════════════════════════════════════════════════════
//  CHANNELS & PASSAGES (from Natural Earth 50m)
// ═══════════════════════════════════════════════════════════════════
const CHANNELS_PASSAGES_50M: PhysicalFeature[] = [
  { name: "Mozambique Channel",  type: "channel", difficulty: "medium", shape: { kind: "ellipse", center: [41.3, -18.1],  rx: 4, ry: 8,   rotation: 0 }},
  { name: "Bristol Channel",     type: "channel", difficulty: "hard",   shape: { kind: "ellipse", center: [-4.2, 51.2],   rx: 2, ry: 1,   rotation: 0 }},

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
];

// ═══════════════════════════════════════════════════════════════════
//  STRAITS (rendered as dot markers or ellipses on the map)
// ═══════════════════════════════════════════════════════════════════
const STRAITS: PhysicalFeature[] = [
  { name: "Strait of Gibraltar", type: "strait", difficulty: "easy",   shape: { kind: "marker", center: [-5.6, 35.9] }},
  { name: "Strait of Malacca",  type: "strait", difficulty: "medium", shape: { kind: "ellipse", center: [101.5, 3.5], rx: 4.0, ry: 1.2, rotation: -45 }},
  { name: "Strait of Hormuz",   type: "strait", difficulty: "medium", shape: { kind: "marker", center: [56.0, 26.7] }},
  { name: "English Channel",    type: "strait", difficulty: "medium", shape: { kind: "ellipse", center: [-2.0, 50.5], rx: 5.0, ry: 1.0, rotation: 0 }},
  { name: "Bosphorus",          type: "strait", difficulty: "medium", shape: { kind: "marker", center: [29.0, 41.1] }},
  { name: "Strait of Magellan", type: "strait", difficulty: "hard",   shape: { kind: "ellipse", center: [-70.0, -53.8], rx: 4.5, ry: 0.8, rotation: 10 }},
];

// ═══════════════════════════════════════════════════════════════════
//  CANALS (rendered as dot markers on the map)
// ═══════════════════════════════════════════════════════════════════
const CANALS: PhysicalFeature[] = [
  { name: "Suez Canal",  type: "canal", difficulty: "easy", shape: { kind: "marker", center: [32.4, 30.5] }},
  { name: "Panama Canal", type: "canal", difficulty: "easy", shape: { kind: "marker", center: [-79.7, 9.1] }},
];

// ═══════════════════════════════════════════════════════════════════
//  SEAS from Natural Earth 10m
// ═══════════════════════════════════════════════════════════════════
const SEAS_10M: PhysicalFeature[] = [
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
  { name: "Davis Sea",           type: "sea", difficulty: "hard",   shape: { kind: "ellipse", center: [95.0, -65.5], rx: 8, ry: 4 }},
  { name: "Salish Sea",          type: "sea", difficulty: "hard",   shape: { kind: "ellipse", center: [-123.3, 48.7], rx: 3, ry: 2 }},
  { name: "Kattegat",            type: "sea", difficulty: "hard",   shape: { kind: "ellipse", center: [11.7, 56.7], rx: 3, ry: 2 }},
  { name: "Skagerrak",           type: "sea", difficulty: "hard",   shape: { kind: "ellipse", center: [9.9, 58.6], rx: 3, ry: 2 }},
];

// ═══════════════════════════════════════════════════════════════════
//  GULFS & BAYS from Natural Earth 10m
// ═══════════════════════════════════════════════════════════════════
const GULFS_BAYS_10M: PhysicalFeature[] = [
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
];

// ═══════════════════════════════════════════════════════════════════
//  STRAITS & PASSAGES from Natural Earth 10m
// ═══════════════════════════════════════════════════════════════════
const STRAITS_10M: PhysicalFeature[] = [
  { name: "Bass Strait",         type: "strait", difficulty: "hard",   shape: { kind: "ellipse", center: [146.0, -40.0], rx: 4.5, ry: 1.5, rotation: 0 }},
  { name: "Cook Strait",         type: "strait", difficulty: "hard",   shape: { kind: "marker", center: [174.5, -41.3] }},
  { name: "Denmark Strait",      type: "strait", difficulty: "medium", shape: { kind: "ellipse", center: [-27.0, 66.5], rx: 4.0, ry: 3.0, rotation: 0 }},
  { name: "Torres Strait",       type: "strait", difficulty: "hard",   shape: { kind: "marker", center: [142.3, -9.8] }},
  { name: "Yucatan Channel",     type: "strait", difficulty: "hard",   shape: { kind: "marker", center: [-85.5, 22.0] }},
  { name: "Dardanelles",         type: "strait", difficulty: "hard",   shape: { kind: "marker", center: [26.4, 40.2] }},
  { name: "Bab el Mandeb",       type: "strait", difficulty: "hard",   shape: { kind: "marker", center: [43.9, 12.6] }},
  { name: "Palk Strait",         type: "strait", difficulty: "hard",   shape: { kind: "marker", center: [79.8, 9.6] }},
  { name: "Tsugaru Strait",      type: "strait", difficulty: "hard",   shape: { kind: "ellipse", center: [140.8, 41.5], rx: 1.8, ry: 0.6, rotation: -20 }},
  { name: "La Pérouse Strait",   type: "strait", difficulty: "hard",   shape: { kind: "marker", center: [142.1, 45.9] }},
  { name: "Bransfield Strait",   type: "strait", difficulty: "hard",   shape: { kind: "ellipse", center: [-58.0, -63.3], rx: 4.5, ry: 1.5, rotation: -20 }},
  { name: "Tatar Strait",        type: "strait", difficulty: "hard",   shape: { kind: "marker", center: [141.4, 52.6] }},
];

/** All water-category features (seas, gulfs, bays, straits, channels, passages, canals) */
export const WATER_FEATURES: PhysicalFeature[] = [
  ...OCEANS,
  ...MAJOR_SEAS,
  ...GULFS_INITIAL,
  ...SEAS_50M,
  ...GULFS_BAYS_50M,
  ...BAYS_50M,
  ...CHANNELS_PASSAGES_50M,
  ...STRAITS,
  ...CANALS,
  ...SEAS_10M,
  ...GULFS_BAYS_10M,
  ...STRAITS_10M,
];

/**
 * Physical Geography – Deserts
 */
import type { PhysicalFeature } from "./physicalFeaturesTypes";

// ═══════════════════════════════════════════════════════════════════
//  DESERTS  (ellipses — ~26 deserts)
// ═══════════════════════════════════════════════════════════════════

export const DESERT_FEATURES: PhysicalFeature[] = [
  // ─── Easy ───
  { name: "Sahara Desert",         type: "desert", difficulty: "easy",   shape: { kind: "ellipse", center: [10, 23],     rx: 18, ry: 7, rotation: 0 }},
  // ─── Medium ───
  { name: "Gobi Desert",           type: "desert", difficulty: "medium", shape: { kind: "ellipse", center: [105, 43],    rx: 8,  ry: 4, rotation: -10 }},
  { name: "Arabian Desert",        type: "desert", difficulty: "medium", shape: { kind: "ellipse", center: [48, 22],     rx: 7,  ry: 5, rotation: -10 }},
  { name: "Kalahari Desert",       type: "desert", difficulty: "medium", shape: { kind: "ellipse", center: [22, -23],    rx: 5,  ry: 4, rotation: 0 }},
  { name: "Atacama Desert",        type: "desert", difficulty: "medium", shape: { kind: "ellipse", center: [-70, -24],   rx: 2,  ry: 5, rotation: -5 }},
  { name: "Patagonian Desert",     type: "desert", difficulty: "medium", shape: { kind: "ellipse", center: [-68, -46],   rx: 4,  ry: 5, rotation: 0 }},
  { name: "Syrian Desert",         type: "desert", difficulty: "medium", shape: { kind: "ellipse", center: [39, 33],     rx: 4,  ry: 3, rotation: 0 }},
  { name: "Great Basin Desert",    type: "desert", difficulty: "medium", shape: { kind: "ellipse", center: [-116, 40],   rx: 4,  ry: 4, rotation: 0 }},
  { name: "Chihuahuan Desert",     type: "desert", difficulty: "medium", shape: { kind: "ellipse", center: [-105, 30],   rx: 4,  ry: 5, rotation: 0 }},
  { name: "Karakum Desert",        type: "desert", difficulty: "medium", shape: { kind: "ellipse", center: [58, 39],     rx: 5,  ry: 3, rotation: 0 }},
  { name: "Taklamakan Desert",     type: "desert", difficulty: "medium", shape: { kind: "ellipse", center: [82, 39],     rx: 6,  ry: 2.5, rotation: 0 }},
  // ─── Hard ───
  { name: "Namib Desert",          type: "desert", difficulty: "hard",   shape: { kind: "ellipse", center: [14, -23],    rx: 3,  ry: 5, rotation: -10 }},
  { name: "Sonoran Desert",        type: "desert", difficulty: "hard",   shape: { kind: "ellipse", center: [-112, 32],   rx: 3,  ry: 3, rotation: 0 }},
  { name: "Great Victoria Desert", type: "desert", difficulty: "hard",   shape: { kind: "ellipse", center: [129, -29],   rx: 6,  ry: 3, rotation: 0 }},
  { name: "Thar Desert",           type: "desert", difficulty: "hard",   shape: { kind: "ellipse", center: [71, 26.5],   rx: 3,  ry: 4, rotation: -10 }},
  { name: "Mojave Desert",         type: "desert", difficulty: "hard",   shape: { kind: "ellipse", center: [-116, 35.5], rx: 2,  ry: 2, rotation: 0 }},
  { name: "Kyzylkum Desert",       type: "desert", difficulty: "hard",   shape: { kind: "ellipse", center: [63, 42],     rx: 4,  ry: 3, rotation: 0 }},
  { name: "Gibson Desert",         type: "desert", difficulty: "hard",   shape: { kind: "ellipse", center: [125, -24],   rx: 4,  ry: 3, rotation: 0 }},
  { name: "Simpson Desert",        type: "desert", difficulty: "hard",   shape: { kind: "ellipse", center: [137, -25],   rx: 3,  ry: 3, rotation: 0 }},
  { name: "Great Sandy Desert",    type: "desert", difficulty: "hard",   shape: { kind: "ellipse", center: [124, -21],   rx: 4,  ry: 3, rotation: 0 }},
  { name: "Tanami Desert",         type: "desert", difficulty: "hard",   shape: { kind: "ellipse", center: [130, -20],   rx: 3,  ry: 2, rotation: 0 }},
  { name: "Dasht-e Kavir",         type: "desert", difficulty: "hard",   shape: { kind: "ellipse", center: [54, 34.5],   rx: 4,  ry: 2, rotation: -10 }},
  { name: "Dasht-e Lut",           type: "desert", difficulty: "hard",   shape: { kind: "ellipse", center: [58, 32],     rx: 2,  ry: 3, rotation: -10 }},
  { name: "Nubian Desert",         type: "desert", difficulty: "hard",   shape: { kind: "ellipse", center: [33, 20],     rx: 3,  ry: 3, rotation: 0 }},
  { name: "Libyan Desert",         type: "desert", difficulty: "hard",   shape: { kind: "ellipse", center: [25, 24],     rx: 3,  ry: 4, rotation: 0 }},
  { name: "Negev Desert",          type: "desert", difficulty: "hard",   shape: { kind: "ellipse", center: [34.8, 30.8], rx: 1,  ry: 1.5, rotation: 0 }},
];

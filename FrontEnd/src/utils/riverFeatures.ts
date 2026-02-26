/**
 * Physical Geography – Rivers & Lakes
 */
import type { PhysicalFeature } from "./physicalFeaturesTypes";

// ═══════════════════════════════════════════════════════════════════
//  RIVERS  (paths — ~99 rivers, real geometries in rivers.json)
// ═══════════════════════════════════════════════════════════════════

// ─── Easy ───
const RIVERS_EASY: PhysicalFeature[] = [
  { name: "Nile", type: "river", difficulty: "easy", shape: { kind: "path", points: [
    [29.4, -2.3], [31.5, -1.0], [32.5, 5.0], [31.5, 10.0], [33.0, 15.0], [32.5, 18.0], [32.0, 22.0], [31.0, 26.0], [31.0, 30.0], [31.2, 31.5],
  ]}},
  { name: "Amazon", type: "river", difficulty: "easy", shape: { kind: "path", points: [
    [-73.0, -4.5], [-70.0, -4.0], [-67.0, -3.5], [-63.0, -3.2], [-60.0, -3.0], [-57.0, -2.5], [-54.0, -2.3], [-51.0, -1.5], [-49.0, -1.0],
  ]}},
  { name: "Mississippi", type: "river", difficulty: "easy", shape: { kind: "path", points: [
    [-93.0, 47.0], [-91.5, 44.0], [-91.0, 41.5], [-91.0, 38.5], [-90.0, 35.5], [-91.0, 32.5], [-91.0, 30.0], [-89.5, 29.0],
  ]}},
  { name: "Yangtze", type: "river", difficulty: "easy", shape: { kind: "path", points: [
    [96.5, 33.0], [100.0, 29.5], [104.0, 29.0], [107.0, 30.5], [110.0, 30.0], [113.5, 30.5], [117.0, 30.5], [120.0, 31.5], [121.5, 31.5],
  ]}},
  { name: "Congo", type: "river", difficulty: "easy", shape: { kind: "path", points: [
    [29.0, -2.0], [26.0, -1.0], [23.0, 0.0], [20.0, -1.5], [17.5, -3.0], [16.0, -4.5], [13.5, -5.5], [12.5, -6.0],
  ]}},
];

// ─── Medium ───
const RIVERS_MEDIUM: PhysicalFeature[] = [
  { name: "Danube", type: "river", difficulty: "medium", shape: { kind: "path", points: [
    [10.0, 48.5], [13.0, 48.3], [16.5, 48.2], [18.5, 47.8], [19.5, 47.0], [21.0, 46.0], [23.0, 44.5], [25.5, 44.0], [28.0, 44.5], [29.5, 45.3],
  ]}},
  { name: "Rhine", type: "river", difficulty: "medium", shape: { kind: "path", points: [
    [9.5, 46.8], [8.5, 47.5], [7.5, 48.5], [7.0, 49.5], [6.5, 50.5], [6.0, 51.5], [5.0, 52.0], [4.0, 52.0],
  ]}},
  { name: "Thames", type: "river", difficulty: "medium", shape: { kind: "path", points: [
    [-2.0, 51.7], [-1.0, 51.6], [0.0, 51.5], [0.5, 51.5], [1.0, 51.5],
  ]}},
  { name: "Ganges", type: "river", difficulty: "medium", shape: { kind: "path", points: [
    [79.0, 30.5], [80.0, 29.0], [82.0, 27.0], [84.0, 26.0], [86.0, 25.5], [88.0, 24.5], [88.5, 22.5], [89.0, 22.0],
  ]}},
  { name: "Mekong", type: "river", difficulty: "medium", shape: { kind: "path", points: [
    [98.5, 29.0], [100.0, 25.0], [100.5, 21.0], [102.0, 18.0], [104.5, 16.0], [105.5, 13.0], [106.0, 11.0], [106.5, 10.0],
  ]}},
  { name: "Volga", type: "river", difficulty: "medium", shape: { kind: "path", points: [
    [33.0, 57.0], [36.0, 56.5], [40.0, 56.5], [43.0, 56.0], [46.0, 54.5], [48.0, 52.5], [49.0, 49.0], [47.5, 46.5], [47.0, 45.5],
  ]}},
  { name: "Niger", type: "river", difficulty: "medium", shape: { kind: "path", points: [
    [-10.5, 10.0], [-7.0, 12.0], [-4.0, 14.0], [-1.0, 15.0], [2.0, 14.0], [3.5, 12.5], [5.0, 10.5], [6.5, 8.5], [7.0, 6.5],
  ]}},
  { name: "Indus", type: "river", difficulty: "medium", shape: { kind: "path", points: [
    [81.0, 32.5], [77.0, 34.5], [74.0, 35.0], [72.5, 33.0], [71.0, 30.0], [69.0, 27.5], [68.0, 25.5], [67.5, 24.0],
  ]}},
  { name: "Zambezi", type: "river", difficulty: "medium", shape: { kind: "path", points: [
    [22.5, -13.5], [25.0, -15.0], [26.0, -17.5], [28.5, -16.0], [30.0, -15.5], [32.0, -16.5], [34.0, -17.0], [35.5, -18.5], [36.0, -19.0],
  ]}},
  { name: "Yellow River", type: "river", difficulty: "medium", shape: { kind: "path", points: [
    [96.0, 34.5], [100.0, 36.0], [104.0, 36.5], [107.0, 37.0], [110.0, 38.0], [112.0, 37.5], [114.0, 36.5], [116.0, 37.0], [118.0, 37.5], [119.0, 37.8],
  ]}},
  { name: "Ob", type: "river", difficulty: "medium", shape: { kind: "path", points: [
    [82.0, 51.0], [78.0, 53.0], [75.0, 56.0], [73.0, 58.0], [71.0, 60.0], [70.0, 62.0], [68.0, 64.0], [66.5, 66.5],
  ]}},
  { name: "Yenisei", type: "river", difficulty: "medium", shape: { kind: "path", points: [
    [95.0, 51.5], [92.0, 53.5], [88.0, 55.5], [86.5, 58.0], [85.5, 60.0], [85.0, 62.5], [84.0, 66.0], [83.5, 69.5],
  ]}},
  { name: "Lena", type: "river", difficulty: "medium", shape: { kind: "path", points: [
    [108.0, 53.0], [112.0, 56.0], [117.0, 58.0], [120.0, 60.0], [123.0, 62.0], [126.0, 63.5], [128.0, 66.0], [130.0, 69.0], [128.0, 72.0],
  ]}},
  { name: "Brahmaputra", type: "river", difficulty: "medium", shape: { kind: "path", points: [
    [82.0, 30.5], [87.0, 28.0], [90.0, 27.0], [92.0, 26.5], [93.0, 26.0], [95.0, 28.0], [96.0, 28.5],
  ]}},
  { name: "Tigris", type: "river", difficulty: "medium", shape: { kind: "path", points: [
    [40.0, 38.0], [41.0, 37.0], [42.5, 36.5], [43.5, 35.5], [44.0, 34.0], [44.5, 33.0], [45.5, 32.0], [47.0, 31.0],
  ]}},
  { name: "Euphrates", type: "river", difficulty: "medium", shape: { kind: "path", points: [
    [39.0, 38.5], [38.0, 37.5], [38.5, 36.0], [39.5, 35.0], [40.0, 34.0], [41.0, 33.0], [43.0, 32.0], [44.5, 31.5], [47.0, 31.0],
  ]}},
  { name: "Missouri", type: "river", difficulty: "medium", shape: { kind: "path", points: [
    [-112.0, 46.0], [-110.0, 47.0], [-107.0, 47.5], [-104.0, 46.5], [-100.0, 44.0], [-97.0, 42.0], [-96.0, 41.0], [-95.0, 39.5], [-94.0, 39.0],
  ]}},
  { name: "Colorado River", type: "river", difficulty: "medium", shape: { kind: "path", points: [
    [-106.0, 40.0], [-108.0, 39.0], [-109.5, 38.5], [-110.5, 37.0], [-111.5, 36.0], [-113.0, 35.5], [-114.5, 34.0], [-115.0, 32.5],
  ]}},
  { name: "Rio Grande", type: "river", difficulty: "medium", shape: { kind: "path", points: [
    [-107.0, 37.5], [-106.0, 35.5], [-105.0, 34.0], [-104.5, 32.0], [-103.0, 30.0], [-101.0, 29.0], [-99.0, 27.5], [-97.5, 26.0],
  ]}},
  { name: "Paraná", type: "river", difficulty: "medium", shape: { kind: "path", points: [
    [-47.5, -15.5], [-49.0, -18.0], [-51.0, -21.0], [-53.5, -23.5], [-55.0, -25.5], [-57.5, -27.0], [-59.0, -30.0], [-59.5, -33.5],
  ]}},
  { name: "Orinoco", type: "river", difficulty: "medium", shape: { kind: "path", points: [
    [-64.0, 2.5], [-65.5, 4.0], [-67.0, 5.5], [-68.0, 7.0], [-67.0, 8.0], [-66.0, 8.5], [-63.0, 8.5], [-60.5, 8.5],
  ]}},
  { name: "Amur", type: "river", difficulty: "medium", shape: { kind: "path", points: [
    [111.0, 49.0], [115.0, 50.0], [120.0, 50.5], [125.0, 48.5], [128.0, 48.0], [131.0, 48.0], [134.0, 48.5], [137.0, 52.0], [140.0, 53.5],
  ]}},
  { name: "Murray", type: "river", difficulty: "medium", shape: { kind: "path", points: [
    [148.0, -36.0], [145.0, -35.5], [142.0, -35.0], [140.0, -34.5], [139.5, -34.8], [139.0, -35.0],
  ]}},
  { name: "Mackenzie", type: "river", difficulty: "medium", shape: { kind: "path", points: [
    [-115.0, 61.0], [-118.0, 62.0], [-120.0, 63.5], [-123.0, 64.5], [-127.0, 66.0], [-130.0, 67.0], [-134.0, 68.5], [-136.0, 68.5],
  ]}},
  { name: "St. Lawrence", type: "river", difficulty: "medium", shape: { kind: "path", points: [
    [-76.0, 44.0], [-74.5, 45.5], [-73.0, 46.0], [-71.0, 46.8], [-69.5, 47.5], [-67.5, 48.0], [-65.5, 48.5],
  ]}},
  { name: "Columbia", type: "river", difficulty: "medium", shape: { kind: "path", points: [
    [-116.5, 50.5], [-118.0, 49.0], [-119.5, 48.0], [-120.0, 47.0], [-119.0, 46.0], [-121.0, 46.0], [-122.5, 46.0],
  ]}},
  { name: "Yukon", type: "river", difficulty: "medium", shape: { kind: "path", points: [
    [-140.0, 60.5], [-143.0, 62.0], [-148.0, 63.0], [-152.0, 63.5], [-156.0, 63.0], [-160.0, 63.0], [-163.0, 63.0],
  ]}},
  { name: "Irrawaddy", type: "river", difficulty: "medium", shape: { kind: "path", points: [
    [97.5, 26.0], [97.0, 24.0], [96.5, 22.0], [96.0, 20.0], [95.5, 18.0], [95.0, 16.5],
  ]}},
  { name: "Dnieper", type: "river", difficulty: "medium", shape: { kind: "path", points: [
    [33.0, 56.0], [31.0, 53.0], [31.5, 51.5], [33.5, 50.0], [34.0, 49.0], [35.0, 48.5], [34.5, 47.0], [33.5, 46.5],
  ]}},
];

// ─── Hard ───
const RIVERS_HARD: PhysicalFeature[] = [
  { name: "Orange River", type: "river", difficulty: "hard", shape: { kind: "path", points: [
    [28.5, -30.0], [26.0, -29.5], [24.0, -29.0], [22.0, -28.5], [20.0, -28.5], [18.5, -28.5], [17.0, -28.5],
  ]}},
  { name: "Limpopo", type: "river", difficulty: "hard", shape: { kind: "path", points: [
    [27.5, -24.0], [29.0, -23.5], [30.5, -23.0], [31.5, -23.5], [32.5, -24.0], [33.5, -24.5], [34.5, -25.0],
  ]}},
  { name: "Senegal River", type: "river", difficulty: "hard", shape: { kind: "path", points: [
    [-11.5, 12.0], [-13.0, 13.0], [-14.0, 14.5], [-13.5, 15.0], [-12.0, 16.0], [-16.0, 16.0], [-16.5, 16.0],
  ]}},
  { name: "Volta", type: "river", difficulty: "hard", shape: { kind: "path", points: [
    [-1.5, 6.5], [-1.0, 8.0], [-0.5, 9.5], [-1.0, 11.0], [-1.5, 12.0],
  ]}},
  { name: "Okavango", type: "river", difficulty: "hard", shape: { kind: "path", points: [
    [16.5, -12.5], [17.5, -14.0], [19.0, -16.0], [20.5, -18.0], [22.0, -19.0], [22.5, -20.0],
  ]}},
  { name: "Ubangi", type: "river", difficulty: "hard", shape: { kind: "path", points: [
    [29.0, 3.5], [27.0, 3.5], [25.0, 4.0], [22.0, 4.0], [19.5, 3.0], [18.0, 2.5],
  ]}},
  { name: "Kasai", type: "river", difficulty: "hard", shape: { kind: "path", points: [
    [20.0, -10.5], [19.5, -8.5], [19.0, -6.5], [18.5, -5.0], [17.5, -4.0],
  ]}},
  { name: "Jubba", type: "river", difficulty: "hard", shape: { kind: "path", points: [
    [40.0, 4.5], [42.0, 3.0], [43.5, 1.0], [44.5, 0.0],
  ]}},
  { name: "Salween", type: "river", difficulty: "hard", shape: { kind: "path", points: [
    [92.0, 33.0], [96.0, 30.0], [97.5, 27.0], [97.5, 24.0], [97.5, 21.0], [97.0, 18.0], [97.5, 16.5],
  ]}},
  { name: "Amu Darya", type: "river", difficulty: "hard", shape: { kind: "path", points: [
    [71.5, 37.0], [69.0, 37.5], [66.0, 38.0], [63.0, 39.0], [61.0, 40.0], [59.0, 42.0], [58.5, 43.5],
  ]}},
  { name: "Syr Darya", type: "river", difficulty: "hard", shape: { kind: "path", points: [
    [72.0, 41.0], [70.0, 40.5], [68.0, 40.5], [66.0, 41.0], [63.0, 41.5], [61.0, 42.0], [59.5, 43.0],
  ]}},
  { name: "Jordan River", type: "river", difficulty: "hard", shape: { kind: "path", points: [
    [35.6, 33.2], [35.6, 32.5], [35.5, 31.8], [35.5, 31.5],
  ]}},
  { name: "Helmand", type: "river", difficulty: "hard", shape: { kind: "path", points: [
    [68.0, 34.5], [66.0, 33.0], [64.0, 32.0], [63.0, 31.0], [62.0, 30.5],
  ]}},
  { name: "Krishna", type: "river", difficulty: "hard", shape: { kind: "path", points: [
    [73.5, 18.0], [75.0, 17.5], [77.0, 16.5], [78.5, 16.0], [80.0, 16.0], [81.0, 16.3],
  ]}},
  { name: "Narmada", type: "river", difficulty: "hard", shape: { kind: "path", points: [
    [81.5, 23.0], [79.0, 22.5], [77.0, 22.5], [75.0, 22.0], [73.5, 21.5],
  ]}},
  { name: "Chao Phraya", type: "river", difficulty: "hard", shape: { kind: "path", points: [
    [100.0, 17.0], [100.5, 15.5], [100.5, 14.5], [100.5, 13.5],
  ]}},
  { name: "Pearl River", type: "river", difficulty: "hard", shape: { kind: "path", points: [
    [107.0, 24.5], [109.0, 23.5], [111.0, 23.0], [113.0, 22.5], [113.5, 22.3],
  ]}},
  { name: "Kolyma", type: "river", difficulty: "hard", shape: { kind: "path", points: [
    [151.0, 62.0], [153.0, 64.0], [155.0, 66.0], [158.0, 68.0], [162.0, 69.0],
  ]}},
  { name: "Ural River", type: "river", difficulty: "hard", shape: { kind: "path", points: [
    [59.5, 54.0], [57.0, 53.0], [55.0, 52.0], [53.5, 51.0], [51.5, 50.5], [51.0, 47.5],
  ]}},
  { name: "Seine", type: "river", difficulty: "hard", shape: { kind: "path", points: [
    [4.5, 48.0], [3.5, 48.5], [2.5, 48.8], [1.5, 49.2], [0.5, 49.4],
  ]}},
  { name: "Loire", type: "river", difficulty: "hard", shape: { kind: "path", points: [
    [4.0, 44.8], [3.5, 46.0], [2.5, 47.0], [1.0, 47.3], [-0.5, 47.2], [-2.0, 47.3],
  ]}},
  { name: "Po", type: "river", difficulty: "hard", shape: { kind: "path", points: [
    [7.0, 44.7], [8.5, 45.0], [10.0, 45.0], [11.0, 45.0], [12.0, 45.0],
  ]}},
  { name: "Elbe", type: "river", difficulty: "hard", shape: { kind: "path", points: [
    [15.5, 50.8], [14.0, 51.0], [12.5, 51.5], [11.5, 52.0], [10.0, 53.0], [9.0, 53.5],
  ]}},
  { name: "Oder", type: "river", difficulty: "hard", shape: { kind: "path", points: [
    [17.5, 50.0], [17.0, 51.0], [16.5, 52.0], [15.0, 52.5], [14.5, 53.5],
  ]}},
  { name: "Vistula", type: "river", difficulty: "hard", shape: { kind: "path", points: [
    [19.5, 49.5], [20.0, 50.5], [21.0, 51.5], [20.0, 52.0], [19.5, 53.0], [18.5, 54.5],
  ]}},
  { name: "Don", type: "river", difficulty: "hard", shape: { kind: "path", points: [
    [39.0, 54.0], [40.0, 52.5], [41.0, 51.5], [42.0, 50.5], [43.5, 48.5], [42.0, 47.5], [39.5, 47.0],
  ]}},
  { name: "Tagus", type: "river", difficulty: "hard", shape: { kind: "path", points: [
    [-2.5, 40.0], [-4.0, 39.5], [-5.5, 39.5], [-7.0, 39.0], [-8.5, 39.0], [-9.0, 38.7],
  ]}},
  { name: "Ebro", type: "river", difficulty: "hard", shape: { kind: "path", points: [
    [-4.0, 43.0], [-2.5, 42.5], [-1.0, 42.0], [0.0, 41.5], [0.5, 41.0], [0.8, 40.8],
  ]}},
  { name: "Rhône", type: "river", difficulty: "hard", shape: { kind: "path", points: [
    [8.0, 46.5], [7.0, 46.0], [6.5, 45.5], [5.5, 45.0], [4.8, 44.0], [4.5, 43.5],
  ]}},
  { name: "Tiber", type: "river", difficulty: "hard", shape: { kind: "path", points: [
    [12.0, 43.5], [12.5, 43.0], [12.5, 42.5], [12.5, 42.0], [12.5, 41.8],
  ]}},
  { name: "Douro", type: "river", difficulty: "hard", shape: { kind: "path", points: [
    [-2.5, 42.0], [-4.0, 41.5], [-5.5, 41.5], [-7.0, 41.3], [-8.5, 41.2],
  ]}},
  { name: "Kama", type: "river", difficulty: "hard", shape: { kind: "path", points: [
    [54.0, 60.0], [55.0, 58.5], [54.0, 57.0], [53.0, 56.5], [52.0, 56.0], [50.5, 55.5],
  ]}},
  { name: "Pechora", type: "river", difficulty: "hard", shape: { kind: "path", points: [
    [56.0, 62.5], [56.5, 64.0], [55.0, 65.5], [54.0, 67.0], [55.0, 68.0],
  ]}},
  { name: "Ohio", type: "river", difficulty: "hard", shape: { kind: "path", points: [
    [-80.0, 40.5], [-82.0, 39.5], [-84.0, 39.0], [-86.0, 38.0], [-88.0, 37.5], [-89.0, 37.0],
  ]}},
  { name: "Arkansas River", type: "river", difficulty: "hard", shape: { kind: "path", points: [
    [-106.0, 39.0], [-103.0, 38.0], [-100.0, 37.5], [-97.0, 37.0], [-95.0, 36.0], [-92.0, 34.5], [-91.0, 34.0],
  ]}},
  { name: "Snake River", type: "river", difficulty: "hard", shape: { kind: "path", points: [
    [-110.5, 44.0], [-112.0, 43.5], [-114.0, 43.0], [-115.0, 43.5], [-117.0, 47.0],
  ]}},
  { name: "Saskatchewan", type: "river", difficulty: "hard", shape: { kind: "path", points: [
    [-116.0, 52.0], [-113.0, 52.5], [-109.0, 52.0], [-106.0, 52.5], [-103.0, 53.0], [-100.0, 53.5],
  ]}},
  { name: "Fraser", type: "river", difficulty: "hard", shape: { kind: "path", points: [
    [-120.0, 53.0], [-122.0, 52.0], [-121.5, 50.5], [-122.5, 49.0],
  ]}},
  { name: "Tennessee", type: "river", difficulty: "hard", shape: { kind: "path", points: [
    [-83.5, 36.0], [-84.0, 35.5], [-86.0, 35.0], [-88.0, 35.0], [-88.0, 36.0], [-87.5, 37.0],
  ]}},
  { name: "Nelson", type: "river", difficulty: "hard", shape: { kind: "path", points: [
    [-97.0, 50.0], [-96.0, 53.0], [-94.5, 55.0], [-93.5, 57.0],
  ]}},
  { name: "Peace River", type: "river", difficulty: "hard", shape: { kind: "path", points: [
    [-122.5, 56.0], [-120.0, 56.5], [-118.0, 56.5], [-116.0, 56.0], [-114.0, 56.0],
  ]}},
  { name: "Paraguay River", type: "river", difficulty: "hard", shape: { kind: "path", points: [
    [-56.0, -14.5], [-57.0, -17.0], [-58.0, -22.0], [-57.5, -25.0], [-58.5, -27.3],
  ]}},
  { name: "Magdalena", type: "river", difficulty: "hard", shape: { kind: "path", points: [
    [-76.0, 2.0], [-75.0, 5.0], [-75.0, 7.0], [-74.5, 8.5], [-75.0, 10.5],
  ]}},
  { name: "Uruguay River", type: "river", difficulty: "hard", shape: { kind: "path", points: [
    [-49.5, -27.5], [-52.0, -29.0], [-54.0, -30.0], [-56.0, -31.0], [-58.0, -33.0],
  ]}},
  { name: "Tocantins", type: "river", difficulty: "hard", shape: { kind: "path", points: [
    [-47.0, -11.0], [-48.0, -8.0], [-49.0, -5.5], [-49.0, -3.0], [-49.0, -1.5],
  ]}},
  { name: "Madeira", type: "river", difficulty: "hard", shape: { kind: "path", points: [
    [-65.0, -12.0], [-63.0, -9.0], [-61.0, -7.0], [-59.0, -4.5], [-58.5, -3.3],
  ]}},
  { name: "Xingu", type: "river", difficulty: "hard", shape: { kind: "path", points: [
    [-53.0, -11.0], [-52.5, -8.0], [-52.0, -5.0], [-52.0, -3.0],
  ]}},
  { name: "Tapajós", type: "river", difficulty: "hard", shape: { kind: "path", points: [
    [-56.0, -10.0], [-55.5, -7.5], [-55.5, -5.0], [-55.0, -2.5],
  ]}},
  { name: "Araguaia", type: "river", difficulty: "hard", shape: { kind: "path", points: [
    [-49.5, -15.0], [-50.5, -12.0], [-49.5, -9.0], [-49.0, -6.0], [-48.5, -5.5],
  ]}},
  { name: "Darling", type: "river", difficulty: "hard", shape: { kind: "path", points: [
    [152.0, -29.5], [149.0, -30.0], [146.0, -31.0], [143.0, -32.5], [142.0, -34.0],
  ]}},
  { name: "Shannon", type: "river", difficulty: "hard", shape: { kind: "path", points: [
    [-8.0, 54.0], [-8.5, 53.0], [-8.5, 52.5],
  ]}},
  { name: "Guadalquivir", type: "river", difficulty: "hard", shape: { kind: "path", points: [
    [-3.0, 38.0], [-4.0, 37.8], [-5.5, 37.5], [-6.0, 37.0],
  ]}},
  { name: "Garonne", type: "river", difficulty: "hard", shape: { kind: "path", points: [
    [0.5, 42.5], [1.0, 43.5], [0.5, 44.0], [-0.5, 44.5], [-0.5, 45.0],
  ]}},
  { name: "Red River (Asia)", type: "river", difficulty: "hard", shape: { kind: "path", points: [
    [102.0, 23.5], [104.0, 22.5], [105.5, 21.5], [106.5, 21.0],
  ]}},
  { name: "Dniester", type: "river", difficulty: "hard", shape: { kind: "path", points: [
    [24.0, 49.0], [27.0, 48.5], [29.0, 47.5], [30.0, 46.5],
  ]}},
  { name: "Dvina", type: "river", difficulty: "hard", shape: { kind: "path", points: [
    [43.0, 60.5], [42.0, 62.0], [41.0, 63.5], [40.0, 64.5],
  ]}},
  { name: "Platte", type: "river", difficulty: "hard", shape: { kind: "path", points: [
    [-105.0, 41.0], [-103.0, 41.0], [-101.0, 41.0], [-99.0, 41.0], [-97.0, 41.0],
  ]}},
  { name: "Athabasca", type: "river", difficulty: "hard", shape: { kind: "path", points: [
    [-117.5, 52.5], [-115.5, 54.5], [-113.0, 56.5], [-111.5, 58.5],
  ]}},
  { name: "Churchill", type: "river", difficulty: "hard", shape: { kind: "path", points: [
    [-103.0, 56.0], [-98.0, 57.0], [-95.0, 58.5], [-94.0, 58.5],
  ]}},
  { name: "Ottawa River", type: "river", difficulty: "hard", shape: { kind: "path", points: [
    [-79.0, 46.0], [-77.0, 45.5], [-76.0, 45.5], [-75.5, 45.5],
  ]}},
  { name: "Negro", type: "river", difficulty: "hard", shape: { kind: "path", points: [
    [-67.0, 2.0], [-65.0, 0.5], [-63.0, -1.0], [-61.0, -2.5], [-60.0, -3.0],
  ]}},
  { name: "Putumayo", type: "river", difficulty: "hard", shape: { kind: "path", points: [
    [-76.0, 0.5], [-73.0, -1.0], [-71.0, -2.0], [-69.0, -2.5], [-67.5, -3.0],
  ]}},
  { name: "Japurá", type: "river", difficulty: "hard", shape: { kind: "path", points: [
    [-72.0, -1.0], [-69.0, -1.5], [-66.0, -1.5], [-64.0, -2.0],
  ]}},
  { name: "Indigirka", type: "river", difficulty: "hard", shape: { kind: "path", points: [
    [140.0, 62.5], [143.0, 64.0], [147.0, 66.0], [150.0, 68.0], [150.5, 70.0],
  ]}},
  { name: "Xi River", type: "river", difficulty: "hard", shape: { kind: "path", points: [
    [104.5, 24.5], [107.0, 23.5], [109.5, 23.0], [111.0, 23.5], [113.0, 23.0],
  ]}},
];

// ═══════════════════════════════════════════════════════════════════
//  LAKES  (ellipses — ~18 lakes, real geometries in lakes.json)
// ═══════════════════════════════════════════════════════════════════
const LAKES: PhysicalFeature[] = [
  { name: "Lake Victoria",   type: "lake", difficulty: "medium", shape: { kind: "ellipse", center: [33, -1],      rx: 2,   ry: 1.5, rotation: 0 }},
  { name: "Lake Baikal",     type: "lake", difficulty: "medium", shape: { kind: "ellipse", center: [108, 53.5],   rx: 1.5, ry: 4,   rotation: 30 }},
  { name: "Lake Titicaca",   type: "lake", difficulty: "medium", shape: { kind: "ellipse", center: [-69.5, -15.8],rx: 1,   ry: 0.8, rotation: 0 }},
  { name: "Lake Superior",   type: "lake", difficulty: "medium", shape: { kind: "ellipse", center: [-87, 47.5],   rx: 2.5, ry: 1.5, rotation: -20 }},
  { name: "Dead Sea",        type: "lake", difficulty: "medium", shape: { kind: "ellipse", center: [35.5, 31.5], rx: 0.5, ry: 1,   rotation: 0 }},
  { name: "Great Salt Lake", type: "lake", difficulty: "hard",   shape: { kind: "ellipse", center: [-112.5, 41],  rx: 1,   ry: 0.7, rotation: 0 }},
  { name: "Lake Tanganyika", type: "lake", difficulty: "hard",   shape: { kind: "ellipse", center: [29.5, -6],   rx: 0.5, ry: 3.5, rotation: -5 }},
  { name: "Lake Chad",       type: "lake", difficulty: "hard",   shape: { kind: "ellipse", center: [14, 13],     rx: 1.5, ry: 1.5, rotation: 0 }},
  { name: "Aral Sea",        type: "lake", difficulty: "hard",   shape: { kind: "ellipse", center: [59, 45],     rx: 2,   ry: 2,   rotation: 0 }},
  { name: "Lake Michigan",   type: "lake", difficulty: "hard",   shape: { kind: "ellipse", center: [-87, 44],    rx: 1.5, ry: 3,   rotation: -5 }},
  { name: "Lake Malawi",     type: "lake", difficulty: "hard",   shape: { kind: "ellipse", center: [34.5, -12],  rx: 0.5, ry: 3,   rotation: -5 }},
  { name: "Lake Turkana",    type: "lake", difficulty: "hard",   shape: { kind: "ellipse", center: [36.0, 3.5],  rx: 0.5, ry: 1.5, rotation: 0 }},
  { name: "Lake Ladoga",     type: "lake", difficulty: "hard",   shape: { kind: "ellipse", center: [31.5, 61],   rx: 1.5, ry: 1.5, rotation: 0 }},
  { name: "Lake Huron",      type: "lake", difficulty: "hard",   shape: { kind: "ellipse", center: [-82, 45],    rx: 1.5, ry: 2,   rotation: 0 }},
  { name: "Lake Erie",       type: "lake", difficulty: "hard",   shape: { kind: "ellipse", center: [-81.5, 42],  rx: 2,   ry: 0.5, rotation: -10 }},
  { name: "Lake Ontario",    type: "lake", difficulty: "hard",   shape: { kind: "ellipse", center: [-77.5, 43.8],rx: 1.5, ry: 0.5, rotation: -10 }},
  { name: "Lake Winnipeg",   type: "lake", difficulty: "hard",   shape: { kind: "ellipse", center: [-97, 52],    rx: 1,   ry: 2.5, rotation: 0 }},
  { name: "Lake Volta",      type: "lake", difficulty: "hard",   shape: { kind: "ellipse", center: [-1.5, 7.5],  rx: 1,   ry: 2,   rotation: 0 }},
];

/** All river & lake features */
export const RIVER_FEATURES: PhysicalFeature[] = [
  ...RIVERS_EASY,
  ...RIVERS_MEDIUM,
  ...RIVERS_HARD,
  ...LAKES,
];

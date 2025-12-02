/**
 * Merge Northern Cyprus into Cyprus
 * This removes N. Cyprus as a separate entity and merges it with Cyprus
 */

import { readFileSync, writeFileSync } from 'fs';
import { feature } from 'topojson-client';
import { topology } from 'topojson-server';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const inputPath = join(__dirname, '..', 'public', 'countries-110m.json');
const outputPath = join(__dirname, '..', 'public', 'countries-110m.json');

console.log('Reading TopoJSON from:', inputPath);
const fileContent = readFileSync(inputPath, 'utf8');
console.log('File size:', fileContent.length, 'bytes');
console.log('First 50 chars:', fileContent.substring(0, 50));
const topo = JSON.parse(fileContent);

// Convert to GeoJSON
const countries = feature(topo, topo.objects.countries);
const land = feature(topo, topo.objects.land);

// Find Cyprus and N. Cyprus indices
const cyprusIndex = countries.features.findIndex(f => f.properties.name === 'Cyprus');
const nCyprusIndex = countries.features.findIndex(f => f.properties.name === 'N. Cyprus');

console.log('Cyprus index:', cyprusIndex);
console.log('N. Cyprus index:', nCyprusIndex);

if (cyprusIndex === -1) {
  console.error('Could not find Cyprus!');
  process.exit(1);
}

if (nCyprusIndex === -1) {
  console.error('Could not find N. Cyprus!');
  process.exit(1);
}

const cyprus = countries.features[cyprusIndex];
const nCyprus = countries.features[nCyprusIndex];

console.log('Cyprus type:', cyprus.geometry.type);
console.log('N. Cyprus type:', nCyprus.geometry.type);

// Get N. Cyprus polygon(s)
let nCyprusPolygons = [];
if (nCyprus.geometry.type === 'Polygon') {
  nCyprusPolygons = [nCyprus.geometry.coordinates];
} else if (nCyprus.geometry.type === 'MultiPolygon') {
  nCyprusPolygons = nCyprus.geometry.coordinates;
}

console.log('N. Cyprus polygons:', nCyprusPolygons.length);

// Add N. Cyprus polygons to Cyprus
console.log('Merging N. Cyprus into Cyprus...');
if (cyprus.geometry.type === 'Polygon') {
  // Convert Cyprus to MultiPolygon and add N. Cyprus
  cyprus.geometry = {
    type: 'MultiPolygon',
    coordinates: [cyprus.geometry.coordinates, ...nCyprusPolygons]
  };
} else if (cyprus.geometry.type === 'MultiPolygon') {
  cyprus.geometry.coordinates.push(...nCyprusPolygons);
}

console.log('Cyprus polygons after merge:', cyprus.geometry.coordinates.length);

// Update Cyprus in features
countries.features[cyprusIndex] = cyprus;

// Remove N. Cyprus from features
console.log('Removing N. Cyprus as separate entity...');
countries.features.splice(nCyprusIndex, 1);
console.log('Total countries after removal:', countries.features.length);

// Convert back to TopoJSON
console.log('Converting back to TopoJSON...');
const geoCollection = {
  type: 'FeatureCollection',
  features: countries.features
};

const newTopo = topology({ countries: geoCollection, land: land }, 1e5);

// Preserve IDs from original
newTopo.objects.countries.geometries.forEach((geom) => {
  const originalGeom = topo.objects.countries.geometries.find(
    g => g.properties?.name === geom.properties?.name
  );
  if (originalGeom && originalGeom.id) {
    geom.id = originalGeom.id;
  }
});

// Write output
console.log('Writing to', outputPath);
writeFileSync(outputPath, JSON.stringify(newTopo));

console.log('✅ Done! Northern Cyprus is now merged with Cyprus.');

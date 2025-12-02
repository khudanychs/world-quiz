/**
 * Merge Somaliland into Somalia
 * This removes Somaliland as a separate entity and merges it with Somalia
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
const topo = JSON.parse(readFileSync(inputPath, 'utf8'));

// Convert to GeoJSON
const countries = feature(topo, topo.objects.countries);
const land = feature(topo, topo.objects.land);

// Find Somalia and Somaliland indices
const somaliaIndex = countries.features.findIndex(f => f.properties.name === 'Somalia');
const somalilandIndex = countries.features.findIndex(f => f.properties.name === 'Somaliland');

console.log('Somalia index:', somaliaIndex);
console.log('Somaliland index:', somalilandIndex);

if (somaliaIndex === -1) {
  console.error('Could not find Somalia!');
  process.exit(1);
}

if (somalilandIndex === -1) {
  console.error('Could not find Somaliland!');
  process.exit(1);
}

const somalia = countries.features[somaliaIndex];
const somaliland = countries.features[somalilandIndex];

console.log('Somalia type:', somalia.geometry.type);
console.log('Somaliland type:', somaliland.geometry.type);

// Get Somaliland polygon(s)
let somalilandPolygons = [];
if (somaliland.geometry.type === 'Polygon') {
  somalilandPolygons = [somaliland.geometry.coordinates];
} else if (somaliland.geometry.type === 'MultiPolygon') {
  somalilandPolygons = somaliland.geometry.coordinates;
}

console.log('Somaliland polygons:', somalilandPolygons.length);

// Add Somaliland polygons to Somalia
console.log('Merging Somaliland into Somalia...');
if (somalia.geometry.type === 'Polygon') {
  // Convert Somalia to MultiPolygon and add Somaliland
  somalia.geometry = {
    type: 'MultiPolygon',
    coordinates: [somalia.geometry.coordinates, ...somalilandPolygons]
  };
} else if (somalia.geometry.type === 'MultiPolygon') {
  somalia.geometry.coordinates.push(...somalilandPolygons);
}

console.log('Somalia polygons after merge:', somalia.geometry.coordinates.length);

// Update Somalia in features
countries.features[somaliaIndex] = somalia;

// Remove Somaliland from features
console.log('Removing Somaliland as separate entity...');
countries.features.splice(somalilandIndex, 1);
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

console.log('✅ Done! Somaliland is now merged with Somalia.');

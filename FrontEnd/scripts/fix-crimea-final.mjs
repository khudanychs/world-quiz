/**
 * Fix Crimea in TopoJSON - Remove from Russia, Add to Ukraine
 * This creates a new TopoJSON file with Crimea as part of Ukraine
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

console.log('Reading TopoJSON...');
const topo = JSON.parse(readFileSync(inputPath, 'utf8'));

// Convert to GeoJSON
const countries = feature(topo, topo.objects.countries);
const land = feature(topo, topo.objects.land);

// Find Russia and Ukraine indices
const russiaIndex = countries.features.findIndex(f => f.properties.name === 'Russia');
const ukraineIndex = countries.features.findIndex(f => f.properties.name === 'Ukraine');

if (russiaIndex === -1 || ukraineIndex === -1) {
  console.error('Could not find Russia or Ukraine!');
  process.exit(1);
}

const russia = countries.features[russiaIndex];
const ukraine = countries.features[ukraineIndex];

console.log('Russia polygons:', russia.geometry.coordinates.length);
console.log('Ukraine type:', ukraine.geometry.type);

// Find Crimea polygon index in Russia (polygon #11 based on our analysis)
let crimeaPolygonIndex = -1;
let crimeaPolygon = null;

russia.geometry.coordinates.forEach((poly, i) => {
  const coords = poly[0];
  const lons = coords.map(c => c[0]);
  const lats = coords.map(c => c[1]);
  const minLon = Math.min(...lons);
  const maxLon = Math.max(...lons);
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  
  if (minLon > 32 && maxLon < 37 && minLat > 44 && maxLat < 46.5) {
    console.log(`Found Crimea at polygon #${i}`);
    crimeaPolygonIndex = i;
    crimeaPolygon = poly;
  }
});

if (crimeaPolygonIndex === -1) {
  console.error('Could not find Crimea polygon in Russia!');
  process.exit(1);
}

// Remove Crimea from Russia
console.log('Removing Crimea from Russia...');
russia.geometry.coordinates.splice(crimeaPolygonIndex, 1);
console.log('Russia polygons after removal:', russia.geometry.coordinates.length);

// Add Crimea to Ukraine
console.log('Adding Crimea to Ukraine...');
if (ukraine.geometry.type === 'Polygon') {
  // Convert Ukraine to MultiPolygon
  ukraine.geometry = {
    type: 'MultiPolygon',
    coordinates: [ukraine.geometry.coordinates, crimeaPolygon]
  };
} else if (ukraine.geometry.type === 'MultiPolygon') {
  ukraine.geometry.coordinates.push(crimeaPolygon);
}
console.log('Ukraine polygons after addition:', ukraine.geometry.coordinates.length);

// Update features
countries.features[russiaIndex] = russia;
countries.features[ukraineIndex] = ukraine;

// Convert back to TopoJSON
console.log('Converting back to TopoJSON...');
const geoCollection = {
  type: 'FeatureCollection',
  features: countries.features
};

const newTopo = topology({ countries: geoCollection, land: land }, 1e5);

// Preserve IDs from original
newTopo.objects.countries.geometries.forEach((geom, i) => {
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

console.log('✅ Done! Crimea is now part of Ukraine.');

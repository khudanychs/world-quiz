/**
 * Script to modify TopoJSON map - move Crimea from Russia to Ukraine
 * 
 * This is a workaround since Natural Earth data shows Crimea as part of Russia.
 * We overlay Crimea polygon with Ukraine's color.
 * 
 * Run: node scripts/fix-crimea.js
 */

const fs = require('fs');
const path = require('path');

// Crimea approximate bounding box for identification
const CRIMEA_BOUNDS = {
  minLon: 32.5,
  maxLon: 36.7,
  minLat: 44.3,
  maxLat: 46.2
};

// Read the TopoJSON file
const inputPath = path.join(__dirname, '../FrontEnd/public/countries-110m.json');
const outputPath = path.join(__dirname, '../FrontEnd/public/countries-110m.json');

console.log('Reading TopoJSON file...');
const topoData = JSON.parse(fs.readFileSync(inputPath, 'utf8'));

console.log('TopoJSON structure:');
console.log('- Type:', topoData.type);
console.log('- Objects:', Object.keys(topoData.objects));
console.log('- Number of arcs:', topoData.arcs?.length);

// Find Russia and Ukraine
const countries = topoData.objects.countries.geometries;
const russia = countries.find(c => c.properties?.name === 'Russia');
const ukraine = countries.find(c => c.properties?.name === 'Ukraine');

if (russia) {
  console.log('\nRussia found:');
  console.log('- ID:', russia.id);
  console.log('- Type:', russia.type);
  console.log('- Arcs count:', russia.arcs?.length);
}

if (ukraine) {
  console.log('\nUkraine found:');
  console.log('- ID:', ukraine.id);
  console.log('- Type:', ukraine.type);
  console.log('- Arcs count:', ukraine.arcs?.length);
}

console.log('\n⚠️  Note: Modifying TopoJSON arcs directly is complex.');
console.log('Consider using the overlay approach in the React component instead.');
console.log('See InteractiveMap.tsx for Crimea overlay implementation.');

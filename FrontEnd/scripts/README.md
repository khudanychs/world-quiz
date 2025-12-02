# TopoJSON Map Scripts

This folder contains scripts for modifying the TopoJSON map data (`public/countries-110m.json`).

## Scripts

### `fix-crimea-final.mjs`
Merges Crimea into Ukraine by removing the Crimea polygon from Russia and adding it to Ukraine's geometry.

### `merge-cyprus.mjs`
Merges Northern Cyprus with Cyprus into a single unified country polygon.

### `merge-somaliland.mjs`
Merges Somaliland with Somalia into a single unified country polygon.

## Usage

These scripts have already been run and their modifications are baked into the TopoJSON file. Only run them if you need to regenerate the map from a fresh Natural Earth source.

```bash
cd FrontEnd
node scripts/fix-crimea-final.mjs
node scripts/merge-cyprus.mjs
node scripts/merge-somaliland.mjs
```

## Dependencies

- `topojson-client` - For TopoJSON manipulation
- `topojson-server` - For converting between TopoJSON and GeoJSON

## Note

The original Natural Earth dataset shows Crimea as part of Russia, Northern Cyprus as a separate country, and Somaliland as separate from Somalia. These scripts normalize the map to show:
- Crimea as part of Ukraine
- A unified Cyprus
- A unified Somalia

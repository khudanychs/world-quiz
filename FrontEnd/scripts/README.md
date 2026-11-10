# TopoJSON Map Scripts

This folder contains scripts for modifying the TopoJSON map data (`public/countries-110m.json`).

## Authentication navbar regression

Run `pnpm --filter frontend build` followed by `pnpm --filter frontend test:auth-ui`.
Requires Chrome at `/usr/bin/google-chrome` (override with `PRERENDER_CHROME_PATH`).
The Playwright script serves the production build locally and creates the same
prerendered HTML snapshots in memory, without changing `dist` or the sitemap.
It checks the first paint with JavaScript disabled, then delayed JavaScript and
session restoration on initial navigation and an uncached reload, in EN/CZ/DE
at 320, 390, 1119, 1120, 1280 and 1440 px. It checks auth flashes, navigation
movement, wrapping, overflow, logout and the mobile auth menu (including Escape
and keyboard focus after closing).

All external requests are intercepted. A fabricated local Firebase persistence
fixture and mocked account lookup exercise the real SDK without a real account
or backend writes. Firestore and analytics requests never leave the browser.
Failure screenshots are saved under `/tmp/world-quiz-auth-ui-<pid>`; override with
`AUTH_UI_ARTIFACT_DIR`. For a focused run, set `AUTH_UI_TEST_WIDTHS=390,1440` and/or
`AUTH_UI_TEST_LANGUAGES=cs`.

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

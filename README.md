# World Quiz

World Quiz is a production-grade geography platform built with React and TypeScript.

It combines multiple map-based game modes, a country encyclopedia, multilingual UI (EN/CZ/DE), Firebase-backed user accounts and leaderboards, and an SEO pipeline that prerenders route HTML using Playwright.

## Platform Overview

World Quiz includes:

- Interactive geography gameplay on a world map
- Multiple modes with distinct game loops and scoring
- Country encyclopedia with detailed facts and live exchange-rate conversion
- Account system with Firebase Auth and profile customization
- Firestore leaderboards and player stats
- Local geodata + TopoJSON pipelines for high-performance map rendering
- Internationalization via i18next (English, Czech, German)

## Tech Stack

### Frontend

- React 18
- TypeScript 5
- Vite 7
- React Router DOM 7
- react-simple-maps
- d3-geo
- topojson-client
- react-i18next / i18next

### Backend / Infra

- Firebase Authentication
- Cloud Firestore
- Firebase Hosting
- Firebase Functions

### SEO / Build Tooling

- Sitemap generation script
- Playwright prerender pipeline (post-build)
- Prerender verification script

## Core Features

- Auth: email/password + Google sign-in
- User profiles: nickname + selectable flag avatar
- Leaderboards: daily and all-time ranking by mode
- Country encyclopedia:
  - Search/filter countries
  - Country detail modal
  - Population, area, density, borders, languages, timezones
  - Live exchange rates (USD base)
- Internationalization:
  - EN/CZ/DE route and content localization

## Game Modes

- Flag Match
  - Click the matching country for the shown flag
  - Region-filtered practice and world mode
  - Streak-based progression

- Guess Country
  - Deduction game with directional and stat hints
  - Attempt-limited rounds
  - Persistent wins tracking in Firestore

- Card Match
  - Timed card pairing mode (flags/countries/capitals/shapes)
  - Score and streak multipliers
  - Daily + all-time score persistence

- Physical Geography
  - Categories: elevation/ranges, rivers/lakes, deserts, waters
  - Uses local GeoJSON/TopoJSON datasets (including QGIS-generated assets)
  - Overlay-based feature interaction on an interactive world map

## Local Development

### Prerequisites

- Node.js 18+
- npm 8+

### 1. Install dependencies

From project root:

```bash
npm install
npm run install:frontend
```

If you work on Cloud Functions too:

```bash
cd functions
npm install
```

### 2. Run frontend locally

From project root:

```bash
npm run dev
```

Or directly from frontend folder:

```bash
cd FrontEnd
npm run dev
```

Default local URL: http://localhost:5173

## Build and SEO Prerender Pipeline

### Frontend build + prerender pipeline

Run from project root:

```bash
npm run build:frontend:seo
```

This triggers the frontend build flow in FrontEnd/package.json:

1. prebuild: generate sitemap
2. build: Vite production build
3. postbuild: Playwright prerender + prerender verification

Equivalent direct run:

```bash
cd FrontEnd
npm run build
```

### Preview production build

```bash
npm run preview
```

Or:

```bash
cd FrontEnd
npm run preview
```

## Data and Assets

Key local data under FrontEnd/public:

- countries-full.json
- countries-110m.json
- world-marine.json
- fixed_rivers.json
- lakes.json
- Land10mForMarines.json
- FinalMarines10m.json
- region_polys/deserts.json
- region_polys/Mountain ranges.json
- region_polys/elev_points.json
- flags-v2/*.svg

Data prep and patch scripts live in FrontEnd/scripts.

## Firebase Notes

Frontend Firebase initialization is in FrontEnd/src/firebase.ts.

If you deploy your own instance, update Firebase project config, auth providers, Firestore rules/indexes, and hosting settings accordingly.

## Repository Structure (High Level)

- FrontEnd: React + TypeScript app
- functions: Firebase Functions
- firebase.json / firestore.rules / firestore.indexes.json: Firebase config
- FrontEnd/scripts: geodata and SEO pipeline scripts

## License

Copyright (c) 2025-2026 Sergio Gyarab.
All rights reserved.
See LICENSE for full terms.

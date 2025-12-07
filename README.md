# World Quiz 🌍

An interactive geography quiz and educational web application. Test your knowledge of world flags, explore countries, and learn geography through engaging gameplay.

## Features

### 🎮 Game Modes
- **Flag Match** - Identify countries by their flags on an interactive world map
- Streak tracking with personal best records
- 25 countries per game session
- 250+ countries and territories including microstates

### 📚 Country Encyclopedia
- **Searchable Country Index** - Browse 195+ sovereign nations
- **Region Filtering** - Filter by Africa, Americas, Asia, Europe, Oceania
- **Detailed Country Pages** with:
  - Population, area, and population density statistics
  - Official languages 
  - Currency converter with live exchange rates (USD base)
  - Timezones and bordering countries
  - Clickable bordering countries - navigate between neighboring countries
- **Fully Responsive** - Mobile-first design with smooth animations

### 🗺️ Interactive Map
- Explore mode with zoom and pan capabilities
- Responsive design optimized for mobile and desktop
- Visual markers for small countries (Vatican, Monaco, Palestine, etc.)
- Touch-friendly controls
- Capital city information on hover

### 👤 User System
- Email/password authentication with email verification
- Google OAuth sign-in
- Unique username system
- Guest play (scores not saved)
- Account deletion with re-authentication security

### 🏆 Leaderboard
- **Today** - Best daily streaks
- **All Time** - Overall best streaks
- Auto-refresh every 5 minutes
- Manual refresh with 30s cooldown (prevents abuse)
- Cached data to minimize database reads

## Tech Stack

### Frontend
- **React 18** + **TypeScript 5.4**
- **Vite 7.2** - Build tool
- **React Router 7** - Client-side routing
- **react-simple-maps** - Interactive SVG maps
- **d3-geo** - Geographic projections

### Backend (Firebase)
- **Firebase Authentication** - Email/Password + Google OAuth
- **Cloud Firestore** - Database for streaks and usernames
- **Firebase Hosting** - CDN hosting
- **Cloud Functions** - Scheduled cleanup of unverified accounts

### Data Sources & APIs

#### Local Data (No external dependencies for core features)
- **Country Data**: `countries-full.json` (downloaded from [REST Countries API](https://restcountries.com/))
  - 250+ countries with names, capitals, regions, languages, borders
  - Includes ISO2 (cca2) and ISO3 (cca3) codes for mapping
- **Map Topology**: `countries-110m.json` (from [world-atlas](https://github.com/topojson/world-atlas))
- **Flag Images**: `/flags-v2/*.svg` (from [flag-icons](https://github.com/lipis/flag-icons))

#### External APIs (Used for enhanced features)
- **[REST Countries API v3.1](https://restcountries.com/)** - Detailed country statistics (population, area, timezones)
  - Used only for Country Encyclopedia detail views
  - Free, no API key required
- **[Currency API by fawazahmed0](https://github.com/fawazahmed0/exchange-api)** - Live exchange rates
  - CDN: `cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest`
  - Fallback: `latest.currency-api.pages.dev`
  - Updated daily, completely free

## Project Structure

```
world-quiz/
├── FrontEnd/
│   ├── public/
│   │   ├── countries-full.json    # Full country data (250+ countries)
│   │   ├── countries-110m.json    # Map topology
│   │   └── flags-v2/              # SVG flag images (~270 flags)
│   ├── src/
│   │   ├── components/            # Reusable React components
│   │   ├── contexts/              # Auth context
│   │   ├── hooks/                 # Custom hooks (game logic, stats)
│   │   ├── pages/                 # Page components (Index, Details)
│   │   └── utils/                 # Utilities and constants
│   └── package.json
├── functions/                     # Firebase Cloud Functions
├── firestore.rules               # Security rules
├── firestore.indexes.json        # Database indexes
└── firebase.json                 # Firebase configuration
```

## Getting Started

### Prerequisites
- Node.js 18+
- Firebase CLI (`npm install -g firebase-tools`)
- Firebase project

### Installation

```bash
# Clone repository
git clone https://github.com/sergioGyarab/world-quiz.git
cd world-quiz

# Install frontend dependencies
cd FrontEnd
npm install

# Configure Firebase
# Copy your config to FrontEnd/src/firebase.ts
```

### Development

```bash
cd FrontEnd
npm run dev
# Opens at http://localhost:5173
```

### Deployment

```bash
# Build frontend
cd FrontEnd
npm run build

# Deploy everything
firebase deploy

# Or deploy specific parts
firebase deploy --only hosting
firebase deploy --only firestore:rules
firebase deploy --only functions
```

## Firebase Collections

### `streaks` (All-time best)
- Document ID: `{userId}`
- Fields: `userId`, `username`, `streak`, `createdAt`, `gameType`

### `dailyStreaks` (Daily best)
- Document ID: `{date}_{userId}`
- Fields: `date`, `userId`, `username`, `streak`, `createdAt`, `gameType`

### `usernames` (Unique usernames)
- Document ID: `{userId}`
- Fields: `username`, `username_lower`, `userId`, `updatedAt`

## Security Features

- Email verification required for email/password accounts
- Re-authentication required before account deletion
- Firestore security rules prevent unauthorized access
- Rate limiting on leaderboard refresh
- Data caching to prevent abuse

## Performance Optimizations

- ✅ **Local country data** - Core features work offline (no external API dependency)
- ✅ **Local flag images** - No hotlinking, instant load times
- ✅ **Smart API usage** - External APIs only for enhanced features (details, exchange rates)
- ✅ **Border country mapping** - ISO3 to ISO2 conversion using local lookup (no API calls)
- ✅ **Leaderboard caching** - 1 minute cache, prevents excessive database reads
- ✅ **Refresh cooldown** - 30 second cooldown on manual refresh
- ✅ **One-time data fetch** - Instead of real-time listeners for leaderboard

## License

MIT

## Credits & Acknowledgments

- **[REST Countries API](https://restcountries.com/)** by Fayder Florez - Comprehensive country data
- **[Currency API](https://github.com/fawazahmed0/exchange-api)** by Fawaz Ahmed - Free daily exchange rates
- **[flag-icons](https://github.com/lipis/flag-icons)** by Panayiotis Lipiridis - High-quality SVG flags
- **[world-atlas](https://github.com/topojson/world-atlas)** by Mike Bostock - TopoJSON world map data
- **[react-simple-maps](https://www.react-simple-maps.io/)** - SVG mapping library

Built with ❤️ for geography enthusiasts worldwide.

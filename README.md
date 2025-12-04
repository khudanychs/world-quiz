# World Quiz 🌍

An interactive geography quiz web application with multiple game modes. Test your knowledge of world flags with an engaging map-based interface.

## Features

### 🎮 Game Modes
- **Flag Match** - Identify countries by their flags on an interactive world map
- Streak tracking with personal best records
- 25 countries per game session
- 250+ countries and territories including microstates

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
- **react-simple-maps** - Interactive SVG maps
- **d3-geo** - Geographic projections

### Backend (Firebase)
- **Firebase Authentication** - Email/Password + Google OAuth
- **Cloud Firestore** - Database for streaks and usernames
- **Firebase Hosting** - CDN hosting
- **Cloud Functions** - Scheduled cleanup of unverified accounts

### Data Sources (All Local)
- Country data: `/public/countries.json`
- Flag images: `/public/flags-v2/*.svg` (from [flag-icons](https://github.com/lipis/flag-icons))

## Project Structure

```
world-quiz/
├── FrontEnd/
│   ├── public/
│   │   ├── countries.json     # Country data (250+ countries)
│   │   └── flags/             # SVG flag images (~270 flags)
│   ├── src/
│   │   ├── components/        # React components
│   │   ├── contexts/          # Auth context
│   │   ├── hooks/             # Custom hooks (useFlagMatchGame)
│   │   ├── pages/             # Page components
│   │   └── utils/             # Utilities and constants
│   └── package.json
├── functions/                 # Firebase Cloud Functions
├── firestore.rules           # Security rules
├── firestore.indexes.json    # Database indexes
└── firebase.json             # Firebase configuration
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

- ✅ Local country data (no external API dependency)
- ✅ Local flag images (no hotlinking)
- ✅ Leaderboard caching (1 minute)
- ✅ Refresh cooldown (30 seconds)
- ✅ One-time data fetch instead of real-time listeners

## License

MIT

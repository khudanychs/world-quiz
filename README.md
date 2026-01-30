<div align="center">

# 🌍 World Quiz

### *Master World Geography Through Interactive Gameplay*

[![TypeScript](https://img.shields.io/badge/TypeScript-5.4-blue.svg)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18-61dafb.svg)](https://reactjs.org/)
[![Vite](https://img.shields.io/badge/Vite-7.2-646cff.svg)](https://vitejs.dev/)
[![Firebase](https://img.shields.io/badge/Firebase-10-ffca28.svg)](https://firebase.google.com/)
[![License](https://img.shields.io/badge/License-Proprietary-red.svg)](LICENSE)

[🎮 Play Now](https://world-quiz.com) | [📖 Documentation](#getting-started) | [🐛 Report Bug](https://github.com/sergioGyarab/world-quiz/issues)

*An educational geography quiz platform featuring interactive maps, engaging game modes, and a comprehensive country encyclopedia.*

</div>

---

## ✨ Features

### 🎮 Engaging Game Modes

#### **Flag Match Game**
Test your knowledge by identifying countries on an interactive world map
- 🎯 **World Mode**: All 195+ countries - unlimited challenge for geography masters
- 🌍 **Regional Practice**: Focus on Europe, Asia, Africa, Americas, or Oceania
- 🏆 Streak tracking with personal best records
- 🗺️ Interactive zoom and pan controls
- 📍 Visual markers for microstates (Vatican, Monaco, etc.)
- 📊 Real-time score tracking and statistics

#### **Shape Match Game**
Fast-paced card matching challenge combining flags and country shapes
- ⏱️ 60-second timer with red alert at 10 seconds
- 🎪 4×4 grid with 8 pairs for quick gameplay
- 🔥 Progressive streak multipliers (up to 3× at 20+ streak)
- 💯 Base score: 1,000 points per match
- 🎨 Beautiful SVG country shape rendering
- 🏆 Separate leaderboard with daily and all-time high scores
- ⚡ Ultra-responsive gameplay - click instantly without delays

### 📚 Comprehensive Country Encyclopedia

Browse and explore detailed information about 195+ sovereign nations
- 🔍 **Smart Search** - Instant filtering by country name
- 🌐 **Region Filtering** - Africa, Americas, Asia, Europe, Oceania
- 📊 **Rich Data** - Population, area, density, languages
- 💱 **Live Currency Converter** - Real-time exchange rates (USD base)
- 🕐 **Timezone Information** - Complete timezone data
- 🗺️ **Border Navigation** - Click to explore neighboring countries
- 📱 **Fully Responsive** - Mobile-first design with smooth animations

### 🗺️ Interactive World Map

Explore the world with an intuitive, touch-friendly interface
- 🔎 Zoom and pan capabilities
- 🖱️ Hover for country information
- 🎯 Optimized for both mobile and desktop
- ⚡ High-performance rendering

### 👤 Secure User System

Full-featured authentication with Firebase
- 📧 **Email/Password** - Secure registration with email verification
- 🔐 **Google OAuth** - One-click sign-in with Google
- 👥 **Unique Usernames** - Reserved username system
- 🎮 **Guest Mode** - Play without registration (scores not saved)
- 🗑️ **Account Management** - Secure account deletion with re-authentication

### 🎨 Profile Customization

Personalize your gaming identity
- 🏳️ **Flag Profile Picture** - Choose from 370+ circular country flags
- 🔍 **Smart Search** - Filter flags by country code
- 💾 **Instant Sync** - LocalStorage caching for instant display
- 🌐 **Bundled Assets** - Flags load locally (no external CDN)
- 📱 **Responsive Grid** - Beautiful flag picker on all devices

### 🏆 Global Leaderboards

Compete with players worldwide across multiple game modes
- 🗺️ **Flag Match Rankings** - Best streaks (guess as many flags as you can!)
- 🎮 **Shape Match Rankings** - Highest scores (60-second challenges)
- 📅 **Daily Leaderboards** - Today's best performances
- 🌟 **All-Time Rankings** - Overall champions
- 🔄 **Auto-refresh** - Updates every 5 minutes
- 🛡️ **Anti-abuse** - 30-second manual refresh cooldown
- ⚡ **Cached Data** - Optimized to minimize database reads
- 🎯 **Game Mode Toggle** - Switch between Flag Match and Shape Match leaderboards

---

## 🛠️ Tech Stack

### **Frontend**
| Technology | Version | Purpose |
|------------|---------|---------|
| [React](https://reactjs.org/) | 18.2 | UI framework |
| [TypeScript](https://www.typescriptlang.org/) | 5.4 | Type safety |
| [Vite](https://vitejs.dev/) | 7.2 | Build tool & dev server |
| [React Router](https://reactrouter.com/) | 7.9 | Client-side routing |
| [react-simple-maps](https://www.react-simple-maps.io/) | 3.0 | SVG map rendering |
| [d3-geo](https://github.com/d3/d3-geo) | 3.1 | Geographic projections |
| [circle-flags](https://github.com/HatScripts/circle-flags) | 2.8 | Circular SVG country flags (lazy-loaded) |
| [Axios](https://axios-http.com/) | 1.13 | HTTP client |

### **Backend (Firebase)**
| Service | Purpose |
|---------|---------|
| Firebase Authentication | Email/password & Google OAuth |
| Cloud Firestore | NoSQL database for streaks & usernames |
| Firebase Hosting | Global CDN hosting |
| Cloud Functions | Scheduled tasks (cleanup jobs) |

### **Data Sources & APIs**

#### **Local Assets** *(Core features work offline)*
- **Country Data**: `countries-full.json` - [REST Countries API](https://restcountries.com/)
  - 250+ countries with names, capitals, regions, languages, borders
  - ISO2 (cca2) and ISO3 (cca3) codes for mapping
- **Map Topology**: `countries-110m.json` - [world-atlas](https://github.com/topojson/world-atlas)
  - TopoJSON format for efficient map rendering
- **Flag Images**: `/flags-v2/*.svg` - [flag-icons](https://github.com/lipis/flag-icons)
  - High-quality SVG flags (~270 flags)

#### **External APIs** *(Enhanced features only)*
- **[REST Countries API v3.1](https://restcountries.com/)** - Detailed statistics
  - Used only for Country Encyclopedia detail pages
  - Free, no API key required
- **[Currency API](https://github.com/fawazahmed0/exchange-api)** - Live exchange rates
  - Primary: `cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest`
  - Fallback: `latest.currency-api.pages.dev`
  - Updated daily, completely free

---

## 📁 Project Structure

```
world-quiz/
├── FrontEnd/                      # React application
│   ├── public/
│   │   ├── countries-full.json   # Complete country dataset (250+ countries)
│   │   ├── countries-110m.json   # TopoJSON world map topology
│   │   ├── flags-v2/             # SVG flag assets (~270 files)
│   │   ├── newlogo.png           # Application logo
│   │   ├── robots.txt            # Search engine directives
│   │   ├── sitemap.xml           # SEO sitemap
│   │   └── site.webmanifest      # PWA manifest
│   ├── src/
│   │   ├── components/           # React components
│   │   │   ├── Auth.tsx          # Unified auth component
│   │   │   ├── CardMatchGame.tsx # Shape matching game
│   │   │   ├── FlagMatchGame.tsx # Flag identification game
│   │   │   ├── FlagSelector.tsx  # Profile flag picker (370+ flags)
│   │   │   ├── GameHUD.tsx       # Game UI overlay
│   │   │   ├── InteractiveMap.tsx # Map component
│   │   │   ├── Leaderboard.tsx   # Leaderboard display
│   │   │   ├── MainMenu.tsx      # Home screen menu
│   │   │   ├── Navbar.tsx        # Navigation bar
│   │   │   ├── Settings.tsx      # User settings page
│   │   ├── contexts/
│   │   │   └── AuthContext.tsx   # Firebase authentication context
│   │   ├── hooks/                # Custom React hooks
│   │   │   ├── useCardMatchGame.ts    # Card game logic
│   │   │   ├── useFlagMatchGame.ts    # Flag game logic
│   │   │   ├── useMapDimensions.ts    # Responsive layout
│   │   │   └── usePreventWheelScroll.ts # Scroll prevention
│   │   ├── pages/                # Page components
│   │   │   ├── CountryDetails.tsx     # Country detail view
│   │   │   ├── CountryIndex.tsx       # Country browser
│   │   │   ├── LeaderboardsPage.tsx   # Leaderboard page
│   │   │   └── PrivacyPolicy.tsx      # Privacy policy
│   │   ├── utils/                # Utility functions
│   │   │   ├── countries.ts      # Country data helpers
│   │   │   ├── dateUtils.ts      # Date formatting
│   │   │   ├── firebaseErrors.ts # Error message mapping
│   │   │   ├── flagUtils.ts      # Lazy flag loading utilities
│   │   │   ├── leaderboardUtils.ts # Score saving functions
│   │   │   ├── mapConstants.ts   # Map configuration
│   │   │   ├── markerPositions.ts # Small country markers
│   │   │   └── sharedStyles.ts   # Reusable styles
│   │   ├── App.tsx               # Main app component
│   │   ├── firebase.ts           # Firebase configuration
│   │   └── main.tsx              # Application entry point
│   ├── package.json
│   ├── tsconfig.json
│   └── vite.config.ts
├── functions/                     # Firebase Cloud Functions
│   ├── src/
│   │   └── index.ts              # Scheduled cleanup tasks
│   ├── package.json
│   └── tsconfig.json
├── firebase.json                  # Firebase project configuration
├── firestore.rules               # Firestore security rules
├── firestore.indexes.json        # Database indexes
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites

Before you begin, ensure you have the following installed:
- **Node.js** 18 or higher ([Download](https://nodejs.org/))
- **npm** 8+ (included with Node.js)
- **Firebase CLI** - Install globally:
  ```bash
  npm install -g firebase-tools
  ```
- **Firebase Project** - Create one at [Firebase Console](https://console.firebase.google.com/)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/sergioGyarab/world-quiz.git
   cd world-quiz
   ```

2. **Install frontend dependencies**
   ```bash
   cd FrontEnd
   npm install
   ```

3. **Install Cloud Functions dependencies** (optional)
   ```bash
   cd ../functions
   npm install
   ```

4. **Configure Firebase**
   - Create a new Firebase project at [Firebase Console](https://console.firebase.google.com/)
   - Enable **Authentication** (Email/Password and Google)
   - Create a **Firestore database** (start in production mode)
   - Copy your Firebase config from Project Settings
   - Update `FrontEnd/src/firebase.ts` with your configuration:
     ```typescript
     const firebaseConfig = {
       apiKey: "YOUR_API_KEY",
       authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
       projectId: "YOUR_PROJECT_ID",
       storageBucket: "YOUR_PROJECT_ID.appspot.com",
       messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
       appId: "YOUR_APP_ID"
     };
     ```

### Development

Run the development server:
```bash
cd FrontEnd
npm run dev
```

The application will open at `http://localhost:5173`

### Building for Production

```bash
cd FrontEnd
npm run build
```

Built files will be in `FrontEnd/dist/`

### Deployment

1. **Login to Firebase**
   ```bash
   firebase login
   ```

2. **Initialize Firebase** (if not already initialized)
   ```bash
   firebase init
   ```
   Select:
   - Hosting
   - Firestore
   - Functions (if using)

3. **Deploy everything**
   ```bash
   firebase deploy
   ```

4. **Deploy specific services**
   ```bash
   # Hosting only
   firebase deploy --only hosting
   
   # Firestore rules only
   firebase deploy --only firestore:rules
   
   # Cloud Functions only
   firebase deploy --only functions
   ```

---

## 🗄️ Database Schema

### Firestore Collections

#### `streaks` - All-Time Best Streaks (Flag Match)
```typescript
Document ID: {userId}
{
  userId: string;        // Firebase UID
  username: string;      // Display name
  streak: number;        // Best streak count
  createdAt: Timestamp;  // Firebase server timestamp
}
```

#### `dailyStreaks` - Daily Best Streaks (Flag Match)
```typescript
Document ID: {YYYY-MM-DD}_{userId}
{
  date: string;          // YYYY-MM-DD format
  userId: string;        // Firebase UID
  username: string;      // Display name
  streak: number;        // Best streak today
  createdAt: Timestamp;  // Firebase server timestamp
}
```

#### `shapeMatchScores` - All-Time High Scores (Shape Match)
```typescript
Document ID: {userId}
{
  userId: string;        // Firebase UID
  username: string;      // Display name
  score: number;         // Highest score achieved
  createdAt: Timestamp;  // Firebase server timestamp
  updatedAt: Timestamp;  // Last update timestamp
}
```

#### `dailyShapeMatchScores` - Daily High Scores (Shape Match)
```typescript
Document ID: {userId}_{YYYY-MM-DD}
{
  date: string;          // YYYY-MM-DD format
  userId: string;        // Firebase UID
  username: string;      // Display name
  score: number;         // Best score today
  createdAt: Timestamp;  // Firebase server timestamp
  updatedAt: Timestamp;  // Last update timestamp
}
```

#### `usernames` - Username Registry
```typescript
Document ID: {userId}
{
  username: string;      // Display name
  username_lower: string; // Lowercase for uniqueness check
  userId: string;        // Firebase UID
  createdAt: Date;       // Registration timestamp
  updatedAt: Date;       // Last update timestamp (optional)
}
```

### Firestore Indexes

Required composite indexes (configured in `firestore.indexes.json`):
- `dailyStreaks`: `date` (ASC), `streak` (DESC), `createdAt` (ASC)
- `streaks`: `streak` (DESC), `createdAt` (ASC)
- `dailyShapeMatchScores`: `date` (ASC), `score` (DESC), `createdAt` (ASC)
- `shapeMatchScores`: `score` (DESC), `createdAt` (ASC)

Deploy indexes: `firebase deploy --only firestore:indexes`

---

## 🔒 Security Features

- ✅ **Email Verification** - Required for email/password accounts before access
- ✅ **Re-authentication** - Required before sensitive operations (account deletion)
- ✅ **Firestore Security Rules** - Server-side data access validation
- ✅ **Rate Limiting** - 30-second cooldown on manual leaderboard refresh
- ✅ **Input Validation** - Client and server-side validation
- ✅ **XSS Protection** - React's built-in XSS prevention
- ✅ **HTTPS Only** - Firebase Hosting enforces HTTPS

### Firestore Security Rules Highlights

```javascript
// Users can only read/write their own username
match /usernames/{userId} {
  allow read: if true;  // Allow checking username availability
  allow write: if request.auth.uid == userId;
}

// Flag Match streaks: read by all, write by authenticated owner
match /streaks/{userId} {
  allow read: if true;
  allow create, update: if request.auth != null && request.auth.uid == userId;
}

// Shape Match scores: read by all, write by authenticated owner
match /shapeMatchScores/{userId} {
  allow read: if true;
  allow create, update: if request.auth != null && request.auth.uid == userId;
}
```

---

## ⚡ Performance Optimizations

### Bundle Optimization

| Technique | Impact |
|-----------|--------|
| **Dynamic Firebase Imports** | Firebase SDK (670KB) loads asynchronously, not blocking initial render |
| **Lazy Route Loading** | All routes use `React.lazy()` - only loads code when navigating |
| **Lazy Flag Loading** | 400+ flag SVGs load on-demand (77KB initial → individual ~0.5KB chunks) |
| **Code Splitting** | Vite splits maps (129KB), vendor (166KB), and Firebase into separate chunks |
| **Tree Shaking** | Terser minification removes unused code |
| **Optimized Images** | Logo PNGs compressed 78% (366KB → 81KB) |

### Runtime Optimization

| Optimization | Benefit |
|-------------|--------|
| **Local Country Data** | Core features work completely offline |
| **Local Flag SVGs** | No external CDN requests, instant loading |
| **Smart API Usage** | External APIs only for enhanced features (country details, currency) |
| **Leaderboard Caching** | 5-minute cache reduces database reads by ~95% |
| **Streak Data Caching** | 10-minute cache for user stats |
| **60-second Refresh Cooldown** | Prevents API abuse on free Firebase tier |
| **SVG Rendering** | Lightweight vector graphics with `loading="lazy"` |
| **Service Worker Ready** | PWA manifest for offline capabilities |
| **CDN Hosting** | Firebase Hosting with 1-year cache headers |
| **Debounced Search** | Reduces re-renders during user input |

### Build Output

```
Main bundle:     ~77KB (18KB gzipped)  - React, Router, App shell
Vendor chunk:   ~166KB (55KB gzipped)  - Third-party libraries  
Maps chunk:     ~129KB (41KB gzipped)  - react-simple-maps, d3-geo
Firebase Auth:  ~123KB (34KB gzipped)  - Loaded on auth actions
Firestore:      ~343KB (101KB gzipped) - Loaded when saving data
Flags:          ~0.5KB each            - 400+ individual chunks
```

---

## 🧪 Testing & Development

### Available Scripts

```bash
# Development server with hot reload
npm run dev

# Production build with type checking
npm run build

# Preview production build locally
npm run preview

# Type checking only
npx tsc --noEmit
```

---

## 🔒 Privacy & Legal

### Privacy Policy

World Quiz is committed to protecting your privacy and ensuring data security:

- **Data Collection**: We collect minimal user data (email, username, game scores)
- **Authentication**: Secure Firebase Authentication for user accounts
- **Data Storage**: Game scores and usernames stored in Firebase Firestore
- **Third-Party Services**: Uses Firebase (Google), flag icons, and geographic data APIs
- **Cookies**: Essential cookies for authentication and session management only
- **User Rights**: Account deletion available through settings at any time

For complete details, visit our [Privacy Policy](https://world-quiz.com/privacy) page.

### Terms & Conditions

By using World Quiz, you agree to:
- Use the service for educational and entertainment purposes only
- Not attempt to manipulate leaderboards or game systems
- Respect intellectual property rights of all content
- Comply with all applicable laws and regulations

Full terms available at [Terms & Conditions](https://world-quiz.com/terms) page.

---

## 🤝 Contributing

This is a proprietary project. Contributions are accepted only with explicit permission from the copyright holder.

If you'd like to contribute:
1. Contact the project owner via [GitHub](https://github.com/sergioGyarab)
2. Request permission and discuss your proposed changes
3. Upon approval, you may submit a Pull Request
4. All contributions will remain property of the copyright holder

---

## 📄 License

**Copyright © 2025-2026 Sergio Gyarab. All Rights Reserved.**

This software is proprietary and confidential. Unauthorized copying, distribution, modification, 
or use of this software, via any medium, is strictly prohibited without the express written 
permission of the copyright holder.

For licensing inquiries or permission requests, please contact via [GitHub](https://github.com/sergioGyarab).

See the [LICENSE](LICENSE) file for complete terms.

---

## 🙏 Credits & Acknowledgments

This project stands on the shoulders of giants. Special thanks to:

- **[Fayder Florez](https://restcountries.com/)** - REST Countries API for comprehensive country data
- **[Fawaz Ahmed](https://github.com/fawazahmed0/exchange-api)** - Free currency exchange rate API
- **[Panayiotis Lipiridis](https://github.com/lipis/flag-icons)** - Beautiful SVG flag collection
- **[Mike Bostock](https://github.com/topojson/world-atlas)** - World Atlas TopoJSON data
- **[react-simple-maps Team](https://www.react-simple-maps.io/)** - Excellent SVG mapping library

### Open Source Libraries

Built with these amazing open-source projects:
- React, TypeScript, Vite, React Router
- Firebase (Auth, Firestore, Hosting, Functions)
- D3.js (d3-geo), TopoJSON, Bootstrap, Axios

---

<div align="center">

### 🌍 Built with ❤️ for Geography Enthusiasts Worldwide

**[🎮 Start Playing](https://world-quiz.com)** | **[⭐ Star on GitHub](https://github.com/sergioGyarab/world-quiz)**

*Learn. Play. Explore.*

</div>

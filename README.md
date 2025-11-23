# World Quiz

An interactive geography quiz web application with multiple game modes. Test your knowledge of world flags, capitals, and countries with an engaging map-based interface.

## Features

- 🎮 **Multiple Game Modes:**
  - **Flag Match** - Identify countries by their flags
  - **Capital Match** - Match capitals to their countries (coming soon)
  
- 🗺️ **Interactive Map:**
  - Explore mode with zoom and pan capabilities
  - Responsive design optimized for mobile and desktop
  - Adaptive marker sizing based on zoom level
  
- 👤 **User System:**
  - Email/password authentication with email verification
  - Google OAuth sign-in
  - Unique username system
  - Account deletion with re-authentication security
  
- 🏆 **Leaderboard:**
  - Global score tracking
  - Game mode filtering
  - Real-time updates

## Project Structure

```
world-quiz/
├── FrontEnd/          # React + TypeScript + Vite frontend
│   ├── src/
│   │   ├── components/    # React components
│   │   ├── contexts/      # Auth and app contexts
│   │   ├── utils/         # Utilities and constants
│   │   └── types/         # TypeScript type definitions
├── BackEnd/           # Backend (Firebase)
├── firestore.rules    # Firestore security rules
├── firebase.json      # Firebase configuration
└── README.md
```

## Technologies

### Frontend
- **React 18** - UI library
- **TypeScript 5.4** - Type safety
- **Vite 7.2** - Build tool and dev server
- **react-simple-maps** - Interactive SVG map visualization
- **d3-geo** - Geographic projections
- **topojson-client** - TopoJSON data handling

### Backend (Firebase)
- **Firebase Authentication** - User authentication (Email/Password + Google OAuth)
- **Cloud Firestore** - NoSQL database for scores and usernames
- **Firebase Hosting** - Static site hosting
- **Firebase Extensions** - Delete User Data extension for GDPR compliance

## Getting Started

### Prerequisites

- Node.js 16+ and npm
- Firebase CLI (`npm install -g firebase-tools`)
- Firebase project (Blaze plan required for extensions)

### Installation

1. Clone the repository:
```powershell
git clone https://github.com/sergioGyarab/world-quiz.git
cd world-quiz
```

2. Install frontend dependencies:
```powershell
cd FrontEnd
npm install
```

3. Set up Firebase:
   - Create a Firebase project at [console.firebase.google.com](https://console.firebase.google.com)
   - Enable Authentication (Email/Password and Google)
   - Create a Firestore database
   - Copy your Firebase config to `FrontEnd/src/firebase.ts`

### Development

Run the development server:

```powershell
cd FrontEnd
npm run dev
```

The application will be available at `http://localhost:5173`

### Building for Production

Build the frontend:

```powershell
cd FrontEnd
npm run build
```

Deploy to Firebase:

```powershell
firebase deploy
```

Or deploy only hosting:

```powershell
firebase deploy --only hosting
```

## Firebase Configuration

### Firestore Security Rules

The project includes comprehensive security rules:
- Score validation (0-25 range)
- Username uniqueness enforcement
- User data isolation (users can only modify their own data)

Deploy rules:
```powershell
firebase deploy --only firestore:rules
```

### Firebase Extensions

**Delete User Data** - Automatically cleans up user data when accounts are deleted:
- Configuration: Recursive mode
- Paths: `usernames/{UID},scores/{UID}`
- Enable events: Yes (all three: firestore, database, storage)

## Game Mechanics

### Flag Match Game
- 25 random countries per game
- Click on the map to identify the country for each flag
- Score tracking and leaderboard integration
- Mobile-optimized UI with orientation detection

### Responsive Design
- Portrait mode: Optimized spacing and larger UI elements
- Landscape mode: Compact layout to maximize map visibility
- Adaptive markers: Scale inversely with zoom level
- Touch-friendly controls

## Security Features

- Email verification required for email/password accounts
- Re-authentication required before account deletion
- Firestore security rules prevent unauthorized data access
- CORS configured for Firebase services

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT

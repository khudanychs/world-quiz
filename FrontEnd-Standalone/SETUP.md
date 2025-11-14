# Setup Guide - Standalone Frontend

## Installation

```powershell
# Navigate to the standalone folder
cd FrontEnd-Standalone

# Install dependencies
npm install
```

## Running the App

```powershell
# Start development server
npm run dev
```

The app will be available at **http://localhost:5173**

## First Time Usage

1. Open http://localhost:5173 in your browser
2. **That's it!** You're automatically logged in as "Guest Player"
3. Start playing immediately! 🎮

No registration, no login screens - just pure gameplay!

## Features Available

✅ **Working:**
- User registration (stored in localStorage)
- Login/logout
- Main menu
- Flag Match game
- Interactive world map
- User profile display

❌ **Not Working (mocked):**
- Google OAuth (button won't work)
- Backend API calls (everything is local)
- Leaderboards/scores persistence across browsers

## Troubleshooting

### Can't login?
Check browser console for errors. Clear localStorage and try again:
```javascript
localStorage.clear()
```

### Port already in use?
The app runs on port 5173 by default. If you need a different port:
```powershell
npm run dev -- --port 3000
```

### Dependencies not installing?
Make sure you have Node.js 18+ and npm installed:
```powershell
node --version  # Should be v18 or higher
npm --version   # Should be v9 or higher
```

## Development

- Hot Module Replacement (HMR) is enabled - changes will reload automatically
- TypeScript errors will show in the browser
- Check the terminal for build errors

## Building for Production

```powershell
npm run build
npm run preview
```

This creates an optimized build in the `dist` folder.

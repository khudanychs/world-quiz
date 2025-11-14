# FrontEnd vs FrontEnd-Standalone

## Quick Comparison

| Feature | FrontEnd (Original) | FrontEnd-Standalone |
|---------|-------------------|---------------------|
| **Backend Required** | ✅ Yes | ❌ No |
| **Login Screen** | ✅ Yes | ❌ No - Auto guest login |
| **Authentication** | Real API calls | Auto guest mode |
| **Google OAuth** | ✅ Works | ❌ N/A |
| **User Accounts** | ✅ Yes | ❌ Guest only |
| **Data Persistence** | Database | None |
| **Setup Complexity** | Medium (needs .env) | Easy (just npm install) |
| **Use Case** | Production | Testing/Demo/Fun |

## File Differences

### Modified Files

#### `src/contexts/AuthContext.tsx`
**Original:** Checks localStorage for auth token, makes API calls

**Standalone:** Auto-creates guest user on mount
```typescript
const guestUser: User = {
  id: 1,
  username: 'Guest Player',
  email: 'guest@worldquiz.local',
  nickname_set: true,
  created_at: new Date().toISOString(),
};
setUser(guestUser);
```

#### `src/App.tsx`
**Original:** Has protected routes, login/register routes, auth callbacks

**Standalone:** Simple direct routing - no auth checks
```typescript
<Routes>
  <Route path='/' element={<MainMenu />} />
  <Route path='/map' element={<WorldMap />} />
  <Route path='/game/flags' element={<FlagMatchGame />} />
</Routes>
```

#### `src/components/Navbar.tsx`
**Original:** Shows login/logout buttons, conditional rendering

**Standalone:** Only shows username and settings button
- No logout button
- No login/register links
- Always shows "Guest Player"

### Unchanged Files

All these work exactly the same:
- ✅ All React components
- ✅ All game logic
- ✅ All UI/styling
- ✅ Router configuration
- ✅ WorldMap, FlagMatchGame, etc.

## How Guest Mode Works

### Auto-Login on Mount
1. App loads
2. AuthProvider immediately creates a guest user
3. User object: `{ id: 1, username: 'Guest Player', email: 'guest@worldquiz.local' }`
4. No API calls, no localStorage checks, no delays
5. User is instantly "authenticated"

### No Auth Flow
- ❌ No registration
- ❌ No login
- ❌ No logout
- ❌ No password
- ✅ Just play!

### Data Structure
```javascript
// Current user (in React state only)
{
  id: 1,
  username: "Guest Player",
  email: "guest@worldquiz.local",
  nickname_set: true,
  created_at: "2025-11-14T..."
}

// No localStorage
// No API calls
// No persistence
```

## When to Use Which Version?

### Use **FrontEnd** (original) when:
- You need real authentication
- You're deploying to production
- You need Google OAuth
- You need data to sync across devices
- You have the backend running

### Use **FrontEnd-Standalone** when:
- Backend isn't available
- Quick testing/prototyping
- Demonstrating UI/UX
- Working on a different computer
- Don't want to set up environment variables
- Just want to play with the app!

## Switching Between Versions

Both can run simultaneously on different ports:
```powershell
# Terminal 1 - Original (port 5173)
cd FrontEnd
npm run dev

# Terminal 2 - Standalone (port 5174)
cd FrontEnd-Standalone
npm run dev -- --port 5174
```

Just make sure to use different browser profiles or clear localStorage between versions to avoid confusion!

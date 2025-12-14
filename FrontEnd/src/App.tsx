import { useState } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Navbar } from './components/Navbar';
import { Auth } from './components/Auth';
import { SetNickname } from './components/SetNickname';
import WorldMap from './WorldMap';
import FlagMatchGame from './components/FlagMatchGame';
import CardMatchGame from './components/CardMatchGame';
import MainMenu from './components/MainMenu';
import LeaderboardsPage from './pages/LeaderboardsPage';
import CountryIndex from './pages/CountryIndex';
import PrivacyPolicy from './pages/PrivacyPolicy';
import { useAuth } from './contexts/AuthContext';
import './App.css';

// Route that shows verification screen for unverified users, but allows guests
function VerifiedOrGuestRoute({ children }: { children: React.ReactNode }) {
  const { user, loading, logout } = useAuth();
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState('');
  
  if (loading) {
    return (
      <div style={{height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0b1020', color: '#fff'}}>
        <div>Loading...</div>
      </div>
    );
  }
  
  // If user is logged in but email is NOT verified (email/password account only)
  // Google users are auto-verified, so skip the check for them
  const isEmailPasswordUser = user && user.email && !user.photoURL;
  if (user && !user.emailVerified && isEmailPasswordUser) {
    
    const handleCheckVerification = async () => {
      setChecking(true);
      setError('');
      try {
        // Reload the Firebase user to get fresh emailVerified status
        const { auth } = await import('./firebase');
        if (auth.currentUser) {
          await auth.currentUser.reload();
          const freshUser = auth.currentUser;
          
          if (freshUser.emailVerified) {
            // Email is now verified! Reload page to update state
            setError('');
            setChecking(false);
            window.location.reload();
            return;
          } else {
            // Still not verified
            setError('Email not verified yet. Please check your inbox and click the verification link.');
          }
        } else {
          setError('Session expired. Please refresh the page.');
        }
      } catch (e) {
        setError('Failed to check verification status. Please try again.');
      }
      setChecking(false);
    };
    
    return (
      <div style={{
        height: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        padding: '20px'
      }}>
        <div style={{
          background: 'white',
          borderRadius: '16px',
          padding: '40px',
          maxWidth: '500px',
          textAlign: 'center',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)'
        }}>
          <h2 style={{color: '#1a1a1a', marginBottom: '20px'}}>📧 Verify Your Email</h2>
          <p style={{color: '#666', fontSize: '16px', lineHeight: '1.6'}}>
            Please check your email inbox and click the verification link before you can use your account.
          </p>
          <p style={{color: '#666', fontSize: '14px', marginTop: '16px'}}>
            Email sent to: <strong>{user.email}</strong>
          </p>
          {error && (
            <p style={{color: '#e53e3e', fontSize: '14px', marginTop: '16px', padding: '10px', background: '#fff5f5', borderRadius: '8px'}}>
              {error}
            </p>
          )}
          <div style={{ display: 'flex', gap: '12px', marginTop: '24px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button
              onClick={handleCheckVerification}
              disabled={checking}
              style={{
                padding: '12px 24px',
                background: checking ? '#a0aec0' : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '16px',
                fontWeight: '600',
                cursor: checking ? 'not-allowed' : 'pointer'
              }}
            >
              {checking ? 'Checking...' : "I've Verified My Email"}
            </button>
            <button
              onClick={async () => {
                await logout();
                window.location.href = '/';
              }}
              style={{
                padding: '12px 24px',
                background: 'rgba(0, 0, 0, 0.1)',
                color: '#666',
                border: '1px solid #ddd',
                borderRadius: '8px',
                fontSize: '16px',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              Logout & Play as Guest
            </button>
          </div>
        </div>
      </div>
    );
  }
  
  // Otherwise (guest or verified user), allow access
  return <>{children}</>;
}

// Route only for guests (redirects logged-in users)
function GuestRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return <div style={{height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0b1020', color: '#fff'}}><div>Loading...</div></div>;
  return !isAuthenticated ? <>{children}</> : <Navigate to='/' replace />;
}

// Route only for authenticated users (set nickname)
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, loading } = useAuth();
  
  if (loading) {
    return (
      <div style={{height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0b1020', color: '#fff'}}>
        <div>Loading...</div>
      </div>
    );
  }
  
  return isAuthenticated ? <>{children}</> : <Navigate to='/auth' replace />;
}

export default function App() {
  const location = useLocation();
  const { loading, user } = useAuth();
  const isMapRoute = location.pathname.startsWith('/map');
  const isGameRoute = location.pathname.startsWith('/game');
  const isAuthRoute = ['/auth', '/set-nickname'].some(p => location.pathname.startsWith(p));
  const isCountriesRoute = location.pathname.startsWith('/countries');
  const isPrivacyRoute = location.pathname === '/privacy';
  
  // Check if user is unverified email/password user
  const isEmailPasswordUser = user && user.email && !user.photoURL;
  const isUnverified = user && !user.emailVerified && isEmailPasswordUser;
  
  // Hide navbar for map, game, auth routes, and unverified users (but NOT for privacy policy)
  const hideNav = isMapRoute || isGameRoute || isAuthRoute || (isUnverified && !isPrivacyRoute);
  
  // Don't show loading screen for public routes (privacy policy)
  if (loading && !isPrivacyRoute) {
    return (
      <div style={{height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0b1020', color: '#fff'}}>
        <div>Loading...</div>
      </div>
    );
  }
  
  return (
    <>
      {!hideNav && <Navbar />}
      <div className="container-fluid p-0"
        style={{
          marginTop: hideNav ? 0 : 64,
          height: hideNav ? '100dvh' : 'calc(100dvh - 64px)',
          width: '100%',
          overflowX: 'hidden',
          overflowY: isMapRoute ? 'hidden' : 'auto',
        }}
      >
        <Routes>
          <Route path='/auth' element={<GuestRoute><Auth /></GuestRoute>} />
          <Route
            path='/set-nickname'
            element={
              <ProtectedRoute>
                <SetNickname />
              </ProtectedRoute>
            }
          />
          <Route path='/' element={<VerifiedOrGuestRoute><MainMenu /></VerifiedOrGuestRoute>} />
          <Route path='/leaderboards' element={<VerifiedOrGuestRoute><LeaderboardsPage /></VerifiedOrGuestRoute>} />
          <Route path='/countries' element={<VerifiedOrGuestRoute><CountryIndex /></VerifiedOrGuestRoute>} />
          <Route path='/map' element={<VerifiedOrGuestRoute><WorldMap /></VerifiedOrGuestRoute>} />
          <Route path='/game/flags' element={<VerifiedOrGuestRoute><FlagMatchGame /></VerifiedOrGuestRoute>} />
          <Route path='/game/shape-match' element={<VerifiedOrGuestRoute><CardMatchGame /></VerifiedOrGuestRoute>} />
          <Route path='/privacy' element={<PrivacyPolicy />} />
        </Routes>
      </div>
    </>
  );
}

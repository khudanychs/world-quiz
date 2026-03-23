import { useState, lazy, Suspense, useEffect, useRef } from 'react';
import { Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Navbar } from './components/Navbar';
import { useAuth } from './contexts/AuthContext';
import {
  SUPPORTED_LOCALE_PREFIXES,
  stripLocalePrefix,
  getLanguageFromLocalePrefix,
  getBaseLanguage,
  buildLocalizedPath,
} from './utils/localeRouting';
import './App.css';

// Lazy load all route components for code splitting
const Auth = lazy(() => import('./components/Auth').then(m => ({ default: m.Auth })));
const SetNickname = lazy(() => import('./components/SetNickname').then(m => ({ default: m.SetNickname })));
const Settings = lazy(() => import('./components/Settings').then(m => ({ default: m.Settings })));
const WorldMap = lazy(() => import('./WorldMap'));
const FlagMatchGame = lazy(() => import('./components/FlagMatchGame'));
const CardMatchGame = lazy(() => import('./components/CardMatchGame'));
const PhysicalGeoGame = lazy(() => import('./components/PhysicalGeoGame'));
const GuessCountryGame = lazy(() => import('./components/GuessCountryGame'));
const MainMenu = lazy(() => import('./components/MainMenu'));
const LeaderboardsPage = lazy(() => import('./pages/LeaderboardsPage'));
const CountryIndex = lazy(() => import('./pages/CountryIndex'));
const NotFound = lazy(() => import('./pages/NotFound'));
const PrivacyPolicy = lazy(() => import('./pages/PrivacyPolicy'));
const TermsConditions = lazy(() => import('./pages/TermsConditions'));
  
// Loading fallback component
const LoadingFallback = () => (
  <div style={{
    height: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: '#0b1020',
    color: '#fff'
  }}>
    <div>Loading...</div>
  </div>
);

// Route that shows verification screen for unverified users, but allows guests
function VerifiedOrGuestRoute({ children }: { children: React.ReactNode }) {
  const {user, loading, logout } = useAuth();
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
  const { i18n } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const contentRef = useRef<HTMLDivElement | null>(null);

  const prefixSegment = location.pathname.split('/').filter(Boolean)[0] || '';
  const languageFromPath = getLanguageFromLocalePrefix(prefixSegment);
  const plainPathname = stripLocalePrefix(location.pathname);

  const { loading, user } = useAuth();
  const isMapRoute = plainPathname.startsWith('/map');
  const isGameRoute = plainPathname.startsWith('/game');
  const isAuthRoute = ['/auth', '/set-nickname'].some(p => plainPathname.startsWith(p));
  const isPrivacyRoute = plainPathname === '/privacy';
  const isTermsRoute = plainPathname === '/terms';
  const isPublicRoute = isPrivacyRoute || isTermsRoute;

  useEffect(() => {
    if (languageFromPath) return;
    const localizedPath = buildLocalizedPath(location.pathname, i18n.language);
    navigate(`${localizedPath}${location.search}${location.hash}`, { replace: true });
  }, [i18n.language, languageFromPath, location.hash, location.pathname, location.search, navigate]);

  useEffect(() => {
    if (!languageFromPath) return;
    if (getBaseLanguage(i18n.language) !== languageFromPath) {
      i18n.changeLanguage(languageFromPath);
    }
  }, [i18n, i18n.language, languageFromPath]);

  useEffect(() => {
    contentRef.current?.scrollTo({ top: 0, left: 0, behavior: 'auto' });
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  }, [location.pathname]);
  
  // Check if user is unverified email/password user
  const isEmailPasswordUser = user && user.email && !user.photoURL;
  const isUnverified = user && !user.emailVerified && isEmailPasswordUser;
  
  // Hide navbar for map, game, auth routes, and unverified users (but NOT for public routes)
  const hideNav = isMapRoute || isGameRoute || isAuthRoute || (isUnverified && !isPublicRoute);
  
  // Don't show loading screen for public routes (privacy policy, terms)
  if (loading && !isPublicRoute) {
    return (
      <div style={{height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0b1020', color: '#fff'}}>
        <div>Loading...</div>
      </div>
    );
  }
  
  return (
    <>
      {!hideNav && <Navbar />}
      <div
        ref={contentRef}
        className="container-fluid p-0"
        style={{
          marginTop: hideNav ? 0 : 64,
          height: hideNav ? '100dvh' : 'calc(100dvh - 64px)',
          width: '100%',
          overflowX: 'hidden',
          overflowY: isMapRoute ? 'hidden' : 'auto',
        }}
      >
        <Suspense fallback={<LoadingFallback />}>
          <Routes>
            <Route path='/auth' element={<GuestRoute><Auth /></GuestRoute>} />
            <Route path='/en/auth' element={<GuestRoute><Auth /></GuestRoute>} />
            <Route path='/cz/auth' element={<GuestRoute><Auth /></GuestRoute>} />
            <Route path='/de/auth' element={<GuestRoute><Auth /></GuestRoute>} />
            <Route
              path='/set-nickname'
              element={
                <ProtectedRoute>
                  <SetNickname />
                </ProtectedRoute>
              }
            />
            <Route path='/en/set-nickname' element={<ProtectedRoute><SetNickname /></ProtectedRoute>} />
            <Route path='/cz/set-nickname' element={<ProtectedRoute><SetNickname /></ProtectedRoute>} />
            <Route path='/de/set-nickname' element={<ProtectedRoute><SetNickname /></ProtectedRoute>} />

            <Route path='/' element={<VerifiedOrGuestRoute><MainMenu /></VerifiedOrGuestRoute>} />
            <Route path='/en' element={<VerifiedOrGuestRoute><MainMenu /></VerifiedOrGuestRoute>} />
            <Route path='/cz' element={<VerifiedOrGuestRoute><MainMenu /></VerifiedOrGuestRoute>} />
            <Route path='/de' element={<VerifiedOrGuestRoute><MainMenu /></VerifiedOrGuestRoute>} />

            <Route path='/leaderboards' element={<VerifiedOrGuestRoute><LeaderboardsPage /></VerifiedOrGuestRoute>} />
            <Route path='/en/leaderboards' element={<VerifiedOrGuestRoute><LeaderboardsPage /></VerifiedOrGuestRoute>} />
            <Route path='/cz/leaderboards' element={<VerifiedOrGuestRoute><LeaderboardsPage /></VerifiedOrGuestRoute>} />
            <Route path='/de/leaderboards' element={<VerifiedOrGuestRoute><LeaderboardsPage /></VerifiedOrGuestRoute>} />

            <Route path='/countries' element={<VerifiedOrGuestRoute><CountryIndex /></VerifiedOrGuestRoute>} />
            <Route path='/en/countries' element={<VerifiedOrGuestRoute><CountryIndex /></VerifiedOrGuestRoute>} />
            <Route path='/cz/countries' element={<VerifiedOrGuestRoute><CountryIndex /></VerifiedOrGuestRoute>} />
            <Route path='/de/countries' element={<VerifiedOrGuestRoute><CountryIndex /></VerifiedOrGuestRoute>} />

            <Route path='/countries/:countryCode' element={<VerifiedOrGuestRoute><CountryIndex /></VerifiedOrGuestRoute>} />
            <Route path='/en/countries/:countryCode' element={<VerifiedOrGuestRoute><CountryIndex /></VerifiedOrGuestRoute>} />
            <Route path='/cz/countries/:countryCode' element={<VerifiedOrGuestRoute><CountryIndex /></VerifiedOrGuestRoute>} />
            <Route path='/de/countries/:countryCode' element={<VerifiedOrGuestRoute><CountryIndex /></VerifiedOrGuestRoute>} />

            <Route path='/map' element={<VerifiedOrGuestRoute><WorldMap /></VerifiedOrGuestRoute>} />
            <Route path='/en/map' element={<VerifiedOrGuestRoute><WorldMap /></VerifiedOrGuestRoute>} />
            <Route path='/cz/map' element={<VerifiedOrGuestRoute><WorldMap /></VerifiedOrGuestRoute>} />
            <Route path='/de/map' element={<VerifiedOrGuestRoute><WorldMap /></VerifiedOrGuestRoute>} />

            <Route path='/game/flags' element={<VerifiedOrGuestRoute><FlagMatchGame /></VerifiedOrGuestRoute>} />
            <Route path='/en/game/flags' element={<VerifiedOrGuestRoute><FlagMatchGame /></VerifiedOrGuestRoute>} />
            <Route path='/cz/game/flags' element={<VerifiedOrGuestRoute><FlagMatchGame /></VerifiedOrGuestRoute>} />
            <Route path='/de/game/flags' element={<VerifiedOrGuestRoute><FlagMatchGame /></VerifiedOrGuestRoute>} />

            <Route path='/game/flags/:regionKey' element={<VerifiedOrGuestRoute><FlagMatchGame /></VerifiedOrGuestRoute>} />
            <Route path='/en/game/flags/:regionKey' element={<VerifiedOrGuestRoute><FlagMatchGame /></VerifiedOrGuestRoute>} />
            <Route path='/cz/game/flags/:regionKey' element={<VerifiedOrGuestRoute><FlagMatchGame /></VerifiedOrGuestRoute>} />
            <Route path='/de/game/flags/:regionKey' element={<VerifiedOrGuestRoute><FlagMatchGame /></VerifiedOrGuestRoute>} />

            <Route path='/game/guess-country' element={<VerifiedOrGuestRoute><GuessCountryGame /></VerifiedOrGuestRoute>} />
            <Route path='/en/game/guess-country' element={<VerifiedOrGuestRoute><GuessCountryGame /></VerifiedOrGuestRoute>} />
            <Route path='/cz/game/guess-country' element={<VerifiedOrGuestRoute><GuessCountryGame /></VerifiedOrGuestRoute>} />
            <Route path='/de/game/guess-country' element={<VerifiedOrGuestRoute><GuessCountryGame /></VerifiedOrGuestRoute>} />

            <Route path='/game/physical-geo' element={<VerifiedOrGuestRoute><PhysicalGeoGame /></VerifiedOrGuestRoute>} />
            <Route path='/en/game/physical-geo' element={<VerifiedOrGuestRoute><PhysicalGeoGame /></VerifiedOrGuestRoute>} />
            <Route path='/cz/game/physical-geo' element={<VerifiedOrGuestRoute><PhysicalGeoGame /></VerifiedOrGuestRoute>} />
            <Route path='/de/game/physical-geo' element={<VerifiedOrGuestRoute><PhysicalGeoGame /></VerifiedOrGuestRoute>} />

            <Route path='/game/physical-geo/:modeKey' element={<VerifiedOrGuestRoute><PhysicalGeoGame /></VerifiedOrGuestRoute>} />
            <Route path='/en/game/physical-geo/:modeKey' element={<VerifiedOrGuestRoute><PhysicalGeoGame /></VerifiedOrGuestRoute>} />
            <Route path='/cz/game/physical-geo/:modeKey' element={<VerifiedOrGuestRoute><PhysicalGeoGame /></VerifiedOrGuestRoute>} />
            <Route path='/de/game/physical-geo/:modeKey' element={<VerifiedOrGuestRoute><PhysicalGeoGame /></VerifiedOrGuestRoute>} />

            <Route path='/settings' element={<ProtectedRoute><Settings /></ProtectedRoute>} />
            <Route path='/en/settings' element={<ProtectedRoute><Settings /></ProtectedRoute>} />
            <Route path='/cz/settings' element={<ProtectedRoute><Settings /></ProtectedRoute>} />
            <Route path='/de/settings' element={<ProtectedRoute><Settings /></ProtectedRoute>} />

            <Route path='/terms' element={<TermsConditions />} />
            <Route path='/en/terms' element={<TermsConditions />} />
            <Route path='/cz/terms' element={<TermsConditions />} />
            <Route path='/de/terms' element={<TermsConditions />} />

            <Route path='/game/shape-match' element={<VerifiedOrGuestRoute><CardMatchGame /></VerifiedOrGuestRoute>} />
            <Route path='/en/game/shape-match' element={<VerifiedOrGuestRoute><CardMatchGame /></VerifiedOrGuestRoute>} />
            <Route path='/cz/game/shape-match' element={<VerifiedOrGuestRoute><CardMatchGame /></VerifiedOrGuestRoute>} />
            <Route path='/de/game/shape-match' element={<VerifiedOrGuestRoute><CardMatchGame /></VerifiedOrGuestRoute>} />

            <Route path='/privacy' element={<PrivacyPolicy />} />
            <Route path='/en/privacy' element={<PrivacyPolicy />} />
            <Route path='/cz/privacy' element={<PrivacyPolicy />} />
            <Route path='/de/privacy' element={<PrivacyPolicy />} />

            {SUPPORTED_LOCALE_PREFIXES.map((prefix) => (
              <Route key={prefix} path={`/${prefix}/*`} element={<NotFound />} />
            ))}
            <Route path='*' element={<NotFound />} />
          </Routes>
        </Suspense>
      </div>
    </>
  );
}

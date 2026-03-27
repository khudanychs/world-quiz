import React, { useState, lazy, Suspense, useEffect, useRef, useMemo } from 'react';
import { Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Navbar } from './components/Navbar';
import { useAuth } from './contexts/AuthContext';
import { AppInitializer } from './components/AppInitializer';
import {
  SUPPORTED_LOCALE_PREFIXES,
  stripLocalePrefix,
  getLanguageFromLocalePrefix,
  getBaseLanguage,
  buildLocalizedPath,
} from './utils/localeRouting';
import './App.css';

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

function VerifiedOrGuestRoute({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState('');
  
  const isEmailPasswordUser = user && user.email && !user.photoURL;
  if (user && !user.emailVerified && isEmailPasswordUser) {
    const handleCheckVerification = async () => {
      setChecking(true);
      setError('');
      try {
        const { auth } = await import('./firebase');
        if (auth.currentUser) {
          await auth.currentUser.reload();
          if (auth.currentUser.emailVerified) {
            window.location.reload();
            return;
          } else {
            setError('Email not verified yet. Please check your inbox.');
          }
        }
      } catch (e) {
        setError('Failed to check verification status. Please try again.');
      }
      setChecking(false);
    };
    
    return (
      <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', padding: '20px' }}>
        <div style={{ background: 'white', borderRadius: '16px', padding: '40px', maxWidth: '500px', textAlign: 'center' }}>
          <h2 style={{color: '#1a1a1a', marginBottom: '20px'}}>📧 Verify Your Email</h2>
          <p style={{color: '#666', fontSize: '16px', lineHeight: '1.6'}}>Please check your email inbox.</p>
          {error && <p style={{color: '#e53e3e', fontSize: '14px', marginTop: '16px'}}>{error}</p>}
          <div style={{ display: 'flex', gap: '12px', marginTop: '24px', justifyContent: 'center' }}>
            <button onClick={handleCheckVerification} disabled={checking} style={{ padding: '12px 24px', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white', borderRadius: '8px', cursor: 'pointer' }}>
              {checking ? 'Checking...' : "I've Verified My Email"}
            </button>
            <button onClick={async () => { await logout(); window.location.href = '/'; }} style={{ padding: '12px 24px', background: 'rgba(0, 0, 0, 0.1)', border: '1px solid #ddd', borderRadius: '8px', cursor: 'pointer' }}>
              Logout & Play as Guest
            </button>
          </div>
        </div>
      </div>
    );
  }
  return <>{children}</>;
}

function GuestRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  return !isAuthenticated ? <>{children}</> : <Navigate to='/' replace />;
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <>{children}</> : <Navigate to='/auth' replace />;
}

// Konfigurace cest venku z komponenty, aby se předešlo zbytečným re-renderům
const appRoutes = [
  { path: 'auth', element: <GuestRoute><Auth /></GuestRoute> },
  { path: 'set-nickname', element: <ProtectedRoute><SetNickname /></ProtectedRoute> },
  { path: '', element: <VerifiedOrGuestRoute><MainMenu /></VerifiedOrGuestRoute> },
  { path: 'leaderboards', element: <VerifiedOrGuestRoute><LeaderboardsPage /></VerifiedOrGuestRoute> },
  { path: 'countries/:countryCode?', element: <VerifiedOrGuestRoute><CountryIndex /></VerifiedOrGuestRoute> },
  { path: 'map', element: <VerifiedOrGuestRoute><WorldMap /></VerifiedOrGuestRoute> },
  { path: 'game/flags/:regionKey?', element: <VerifiedOrGuestRoute><FlagMatchGame /></VerifiedOrGuestRoute> },
  { path: 'game/guess-country', element: <VerifiedOrGuestRoute><GuessCountryGame /></VerifiedOrGuestRoute> },
  { path: 'game/physical-geo/:modeKey?', element: <VerifiedOrGuestRoute><PhysicalGeoGame /></VerifiedOrGuestRoute> },
  { path: 'settings', element: <ProtectedRoute><Settings /></ProtectedRoute> },
  { path: 'terms', element: <TermsConditions /> },
  { path: 'game/shape-match', element: <VerifiedOrGuestRoute><CardMatchGame /></VerifiedOrGuestRoute> },
  { path: 'privacy', element: <PrivacyPolicy /> },
];

export default function App() {
  const { i18n } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const contentRef = useRef<HTMLDivElement | null>(null);
  const previousPlainPathRef = useRef<string>(stripLocalePrefix(location.pathname));

  const prefixSegment = location.pathname.split('/').filter(Boolean)[0] || '';
  const languageFromPath = getLanguageFromLocalePrefix(prefixSegment);
  const plainPathname = stripLocalePrefix(location.pathname);

  const { user } = useAuth();
  const isMapRoute = plainPathname.startsWith('/map');
  const isGameRoute = plainPathname.startsWith('/game');
  const isAuthRoute = ['/auth', '/set-nickname'].some(p => plainPathname.startsWith(p));
  const isPublicRoute = plainPathname === '/privacy' || plainPathname === '/terms';

  const shouldRedirect = useMemo(() => {
    if (!languageFromPath) {
      return { 
        to: `${buildLocalizedPath(location.pathname, i18n.language)}${location.search}${location.hash}`
      };
    }
    const preferredLanguage = getBaseLanguage(i18n.language);
    if (preferredLanguage !== languageFromPath) {
      return {
        to: `${buildLocalizedPath(location.pathname, preferredLanguage)}${location.search}${location.hash}`
      };
    }
    return null;
  }, [languageFromPath, location, i18n.language]);

  useEffect(() => {
    if (shouldRedirect) {
      navigate(shouldRedirect.to, { replace: true });
    }
  }, [shouldRedirect, navigate]);

  useEffect(() => {
    const previousPath = previousPlainPathRef.current;
    const currentPath = plainPathname;
    const isCountriesPath = (path: string) => path === '/countries' || path.startsWith('/countries/');
    const shouldKeepCountriesScroll = isCountriesPath(previousPath) && isCountriesPath(currentPath);

    if (!shouldKeepCountriesScroll) {
      contentRef.current?.scrollTo({ top: 0, left: 0, behavior: 'auto' });
      window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
    }
    previousPlainPathRef.current = currentPath;
  }, [plainPathname]);
  
  const isUnverified = user && !user.emailVerified && user.email && !user.photoURL;
  const hideNav = isMapRoute || isGameRoute || isAuthRoute || (isUnverified && !isPublicRoute);

  // Záchranná brzda proti problikávání - dokud se neujasní adresa, nic dalšího se nespustí!
  if (shouldRedirect) {
    return (
      <AppInitializer>
        <LoadingFallback />
      </AppInitializer>
    );
  }
  
  return (
    <AppInitializer>
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
            {appRoutes.map(({ path, element }) => (
              <React.Fragment key={path}>
                {SUPPORTED_LOCALE_PREFIXES.map((lang) => (
                  <Route key={`${lang}-${path}`} path={`/${lang}${path ? `/${path}` : ''}`} element={element} />
                ))}
              </React.Fragment>
            ))}
            {SUPPORTED_LOCALE_PREFIXES.map((lang) => (
              <Route key={`404-${lang}`} path={`/${lang}/*`} element={<NotFound />} />
            ))}
            <Route path='*' element={<NotFound />} />
          </Routes>
        </Suspense>
      </div>
    </AppInitializer>
  );
}
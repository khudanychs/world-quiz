import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Navbar } from './components/Navbar';
import { Auth } from './components/Auth';
import { SetNickname } from './components/SetNickname';
import WorldMap from './WorldMap';
import FlagMatchGame from './components/FlagMatchGame';
import MainMenu from './components/MainMenu';
import { useAuth } from './contexts/AuthContext';
import './App.css';

// Route that shows verification screen for unverified users, but allows guests
function VerifiedOrGuestRoute({ children }: { children: React.ReactNode }) {
  const { user, loading, logout } = useAuth();
  
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
    console.log('🚫 BLOCKING unverified user:', user.email, 'emailVerified:', user.emailVerified);
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
          <div style={{ display: 'flex', gap: '12px', marginTop: '24px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button
              onClick={() => window.location.reload()}
              style={{
                padding: '12px 24px',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '16px',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              I've Verified My Email
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
  
  // Check if user is unverified email/password user
  const isEmailPasswordUser = user && user.email && !user.photoURL;
  const isUnverified = user && !user.emailVerified && isEmailPasswordUser;
  
  // Hide navbar for map, game, auth routes, and unverified users
  const hideNav = isMapRoute || isGameRoute || isAuthRoute || isUnverified;
  
  if (loading) {
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
          <Route path='/map' element={<VerifiedOrGuestRoute><WorldMap /></VerifiedOrGuestRoute>} />
          <Route path='/game/flags' element={<VerifiedOrGuestRoute><FlagMatchGame /></VerifiedOrGuestRoute>} />
        </Routes>
      </div>
    </>
  );
}

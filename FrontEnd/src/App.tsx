import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Navbar } from './components/Navbar';
import { Login } from './components/Login';
import { Register } from './components/Register';
import { SetNickname } from './components/SetNickname';
import WorldMap from './WorldMap';
import FlagMatchGame from './components/FlagMatchGame';
import MainMenu from './components/MainMenu';
import { useAuth } from './contexts/AuthContext';
import './App.css';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, loading, user } = useAuth();
  
  if (loading) {
    return (
      <div style={{height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0b1020', color: '#fff'}}>
        <div>Loading...</div>
      </div>
    );
  }
  
  if (!isAuthenticated) {
    return <Navigate to='/login' replace />;
  }
  
  // Check if email is verified (Google users are auto-verified)
  if (user && !user.emailVerified && user.email && !user.photoURL) {
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
            Please check your email inbox and click the verification link to access World Quiz.
          </p>
          <p style={{color: '#666', fontSize: '14px', marginTop: '16px'}}>
            Email sent to: <strong>{user.email}</strong>
          </p>
          <button
            onClick={() => window.location.reload()}
            style={{
              marginTop: '24px',
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
        </div>
      </div>
    );
  }
  
  return <>{children}</>;
}

function GuestRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return <div style={{height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0b1020', color: '#fff'}}><div>Loading...</div></div>;
  return !isAuthenticated ? <>{children}</> : <Navigate to='/' replace />;
}

export default function App() {
  const location = useLocation();
  const { user } = useAuth();
  const isMapRoute = location.pathname.startsWith('/map');
  const isGameRoute = location.pathname.startsWith('/game');
  const isAuthRoute = ['/login', '/register', '/set-nickname'].some(p => location.pathname.startsWith(p));
  
  // Hide navbar for unverified users (email/password only, not Google)
  const isUnverified = user && !user.emailVerified && user.email && !user.photoURL;
  const hideNav = isMapRoute || isGameRoute || isAuthRoute || isUnverified;
  
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
          <Route path='/login' element={<GuestRoute><Login /></GuestRoute>} />
          <Route path='/register' element={<GuestRoute><Register /></GuestRoute>} />
          <Route
            path='/set-nickname'
            element={
              <ProtectedRoute>
                <SetNickname />
              </ProtectedRoute>
            }
          />
          <Route
            path='/'
            element={
              <ProtectedRoute>
                <MainMenu />
              </ProtectedRoute>
            }
          />
          <Route
            path='/map'
            element={
              <ProtectedRoute>
                <WorldMap />
              </ProtectedRoute>
            }
          />
          <Route
            path='/game/flags'
            element={
              <ProtectedRoute>
                <FlagMatchGame />
              </ProtectedRoute>
            }
          />
        </Routes>
      </div>
    </>
  );
}

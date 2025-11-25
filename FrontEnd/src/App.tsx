import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Navbar } from './components/Navbar';
import { Auth } from './components/Auth';
import { SetNickname } from './components/SetNickname';
import WorldMap from './WorldMap';
import FlagMatchGame from './components/FlagMatchGame';
import MainMenu from './components/MainMenu';
import { useAuth } from './contexts/AuthContext';
import './App.css';

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
  const { loading } = useAuth();
  const isMapRoute = location.pathname.startsWith('/map');
  const isGameRoute = location.pathname.startsWith('/game');
  const isAuthRoute = ['/auth', '/set-nickname'].some(p => location.pathname.startsWith(p));
  
  // Hide navbar only for map, game, and auth routes
  const hideNav = isMapRoute || isGameRoute || isAuthRoute;
  
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
          <Route path='/' element={<MainMenu />} />
          <Route path='/map' element={<WorldMap />} />
          <Route path='/game/flags' element={<FlagMatchGame />} />
        </Routes>
      </div>
    </>
  );
}

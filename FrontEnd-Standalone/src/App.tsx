import { Routes, Route, useLocation } from 'react-router-dom';
import { Navbar } from './components/Navbar';
import WorldMap from './WorldMap';
import FlagMatchGame from './components/FlagMatchGame';
import MainMenu from './components/MainMenu';
import { useAuth } from './contexts/AuthContext';
import './App.css';

export default function App() {
  const { loading } = useAuth();
  const location = useLocation();
  const isMapRoute = location.pathname.startsWith('/map');
  const isGameRoute = location.pathname.startsWith('/game');
  const hideNav = isMapRoute || isGameRoute;

  if (loading) {
    return (
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
          <Route path='/' element={<MainMenu />} />
          <Route path='/map' element={<WorldMap />} />
          <Route path='/game/flags' element={<FlagMatchGame />} />
        </Routes>
      </div>
    </>
  );
}

import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { Settings } from './Settings';
import './Navbar.css';

export function Navbar() {
  const { user, isAuthenticated, logout } = useAuth();
  const [showSettings, setShowSettings] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1000);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 1000;
      setIsMobile(mobile);
      if (!mobile) {
        setIsMobileMenuOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Close mobile menu when route changes
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  const isActive = (path: string) => location.pathname === path;

  const handleNavClick = (path: string) => {
    navigate(path);
    setIsMobileMenuOpen(false);
  };

  return (
    <>
      <nav className="navbar navbar-custom">
        <div className="container-fluid">
          {/* Logo / Brand - clickable to home */}
          <div className="navbar-brand" onClick={() => handleNavClick('/')}>
            <img src="/newlogo.png" alt="World Quiz" className="navbar-logo" />
            <h1 className="m-0">World Quiz</h1>
          </div>

          {/* Desktop Navigation Links */}
          {!isMobile && (
            <div className="navbar-nav-links">
              <button 
                className={`nav-link ${isActive('/') ? 'active' : ''}`}
                onClick={() => handleNavClick('/')}
              >
                Home
              </button>
              <button 
                className={`nav-link ${isActive('/countries') ? 'active' : ''}`}
                onClick={() => handleNavClick('/countries')}
              >
                Countries
              </button>
              <button 
                className={`nav-link ${isActive('/leaderboards') ? 'active' : ''}`}
                onClick={() => handleNavClick('/leaderboards')}
              >
                Leaderboards
              </button>
              <button 
                className={`nav-link ${isActive('/privacy') ? 'active' : ''}`}
                onClick={() => handleNavClick('/privacy')}
                style={{ fontSize: '0.85em', opacity: 0.8 }}
              >
                Privacy
              </button>
            </div>
          )}

          {/* Desktop Auth Menu */}
          {!isMobile && (
            <div className="navbar-menu">
              {isAuthenticated ? (
                <>
                  <button 
                    className="navbar-user-button"
                    onClick={() => setShowSettings(true)}
                    title="Settings"
                  >
                    <span className="navbar-user">
                      {user?.photoURL && (
                        <img src={user.photoURL} alt="avatar" className="navbar-avatar" />
                      )}
                      <span className="navbar-username">{user?.displayName}</span>
                    </span>
                  </button>
                  <button onClick={logout} className="navbar-button">
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <a href="/auth?mode=login" className="navbar-button-secondary">
                    Login
                  </a>
                  <a href="/auth?mode=register" className="navbar-button">
                    Join us
                  </a>
                </>
              )}
            </div>
          )}

          {/* Mobile Hamburger Button */}
          {isMobile && (
            <button 
              className={`hamburger-button ${isMobileMenuOpen ? 'open' : ''}`}
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              aria-label="Toggle menu"
            >
              <span className="hamburger-line"></span>
              <span className="hamburger-line"></span>
              <span className="hamburger-line"></span>
            </button>
          )}
        </div>
      </nav>

      {/* Mobile Menu Overlay */}
      {isMobile && isMobileMenuOpen && (
        <div className="mobile-menu-overlay" onClick={() => setIsMobileMenuOpen(false)} />
      )}

      {/* Mobile Menu */}
      {isMobile && (
        <div className={`mobile-menu ${isMobileMenuOpen ? 'open' : ''}`}>
          <div className="mobile-menu-content">
            {/* Navigation Links */}
            <div className="mobile-nav-section">
              <button 
                className={`mobile-nav-link ${isActive('/') ? 'active' : ''}`}
                onClick={() => handleNavClick('/')}
              >
                🏠 Home
              </button>
              <button 
                className={`mobile-nav-link ${isActive('/countries') ? 'active' : ''}`}
                onClick={() => handleNavClick('/countries')}
              >
                🌍 Countries
              </button>
              <button 
                className={`mobile-nav-link ${isActive('/leaderboards') ? 'active' : ''}`}
                onClick={() => handleNavClick('/leaderboards')}
              >
                🏆 Leaderboards
              </button>
            </div>

            {/* Auth Section */}
            <div className="mobile-auth-section">
              {isAuthenticated ? (
                <>
                  <button 
                    className="mobile-user-button"
                    onClick={() => {
                      setShowSettings(true);
                      setIsMobileMenuOpen(false);
                    }}
                  >
                    {user?.photoURL && (
                      <img src={user.photoURL} alt="avatar" className="mobile-avatar" />
                    )}
                    <span>{user?.displayName}</span>
                  </button>
                  <button onClick={() => { logout(); setIsMobileMenuOpen(false); }} className="mobile-logout-button">
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <a href="/auth?mode=login" className="mobile-auth-button secondary">
                    Login
                  </a>
                  <a href="/auth?mode=register" className="mobile-auth-button primary">
                    Join us
                  </a>
                </>
              )}

              {/* Footer Links */}
              <div className="mobile-footer">
                <a href="/privacy" className="footer-link">Privacy & Terms</a>
              </div>
            </div>
          </div>
        </div>
      )}

      <Settings isOpen={showSettings} onClose={() => setShowSettings(false)} />
    </>
  );
}

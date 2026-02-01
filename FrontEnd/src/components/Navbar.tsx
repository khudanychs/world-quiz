import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { getFlagUrlAsync } from '../utils/flagUtils';
import './Navbar.css';

export function Navbar() {
  const { user, isAuthenticated, logout } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1000);
  const [flagUrl, setFlagUrl] = useState<string | null>(null);
  const navigate = useNavigate();
  const location = useLocation();

  // Profile flag comes directly from user context now (cached in localStorage)
  const profileFlag = user?.profileFlag || null;
  
  // Load flag URL lazily
  useEffect(() => {
    if (profileFlag) {
      getFlagUrlAsync(profileFlag).then(url => setFlagUrl(url));
    } else {
      setFlagUrl(null);
    }
  }, [profileFlag]);

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
              <button 
                className={`nav-link ${isActive('/terms') ? 'active' : ''}`}
                onClick={() => handleNavClick('/terms')}
                style={{ fontSize: '0.85em', opacity: 0.8 }}
              >
                Terms
              </button>
            </div>
          )}

          {/* Desktop Auth Menu */}
          {!isMobile && (
            <div className="navbar-menu">
              {isAuthenticated ? (
                <>
                  <button 
                    className={`navbar-user-button ${isActive('/settings') ? 'active' : ''}`}
                    onClick={() => handleNavClick('/settings')}
                    title="Settings"
                  >
                    <span className="navbar-user">
                      {profileFlag && flagUrl ? (
                        <img 
                          src={flagUrl} 
                          alt="profile" 
                          className="navbar-avatar"
                          style={{ borderRadius: '50%' }}
                        />
                      ) : user?.photoURL ? (
                        <img 
                          src={user.photoURL} 
                          alt="avatar" 
                          className="navbar-avatar"
                        />
                      ) : (
                        <div className="navbar-avatar-placeholder">
                          {user?.displayName?.[0]?.toUpperCase() || '?'}
                        </div>
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
                    className={`mobile-user-button ${isActive('/settings') ? 'active' : ''}`}
                    onClick={() => {
                      handleNavClick('/settings');
                    }}
                  >
                    {profileFlag && flagUrl ? (
                      <img 
                        src={flagUrl} 
                        alt="profile" 
                        className="mobile-avatar"
                        style={{ borderRadius: '50%' }}
                      />
                    ) : user?.photoURL ? (
                      <img 
                        src={user.photoURL} 
                        alt="avatar" 
                        className="mobile-avatar"
                      />
                    ) : (
                      <div className="mobile-avatar-placeholder">
                        {user?.displayName?.[0]?.toUpperCase() || '?'}
                      </div>
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
                <a href="/privacy" className="footer-link">Privacy Policy</a>
                <span className="footer-separator">•</span>
                <a href="/terms" className="footer-link">Terms & Conditions</a>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
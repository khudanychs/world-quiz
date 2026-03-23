import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { getFlagUrlAsync } from '../utils/flagUtils';
import { buildLocalizedPath, stripLocalePrefix } from '../utils/localeRouting';
import './Navbar.css';

export function Navbar() {
  const { t, i18n } = useTranslation();
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

  const isActive = (path: string) => stripLocalePrefix(location.pathname) === path;

  const handleNavClick = (path: string) => {
    navigate(buildLocalizedPath(path, i18n.language));
    setIsMobileMenuOpen(false);
  };

  return (
    <>
      <nav className="navbar navbar-custom">
        <div className="container-fluid">
          {/* Logo / Brand - clickable to home */}
          <div className="navbar-brand" onClick={() => handleNavClick('/')}>
            <img src="/newlogo.png" alt={t('nav.appName')} className="navbar-logo" />
            <h1 className="m-0">{t('nav.appName')}</h1>
          </div>

          {/* Desktop Navigation Links */}
          {!isMobile && (
            <div className="navbar-nav-links">
              <button
                className={`nav-link ${isActive('/') ? 'active' : ''}`}
                onClick={() => handleNavClick('/')}
              >
                {t('nav.home')}
              </button>
              <button
                className={`nav-link ${isActive('/countries') ? 'active' : ''}`}
                onClick={() => handleNavClick('/countries')}
              >
                {t('nav.countries')}
              </button>
              <button
                className={`nav-link ${isActive('/leaderboards') ? 'active' : ''}`}
                onClick={() => handleNavClick('/leaderboards')}
              >
                {t('nav.leaderboards')}
              </button>
              <button
                className={`nav-link ${isActive('/privacy') ? 'active' : ''}`}
                onClick={() => handleNavClick('/privacy')}
                style={{ fontSize: '0.85em', opacity: 0.8 }}
              >
                {t('nav.privacy')}
              </button>
              <button
                className={`nav-link ${isActive('/terms') ? 'active' : ''}`}
                onClick={() => handleNavClick('/terms')}
                style={{ fontSize: '0.85em', opacity: 0.8 }}
              >
                {t('nav.terms')}
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
                    title={t('nav.settings')}
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
                    {t('nav.logout')}
                  </button>
                </>
              ) : (
                <>
                  <a href="/auth?mode=login" className="navbar-button-secondary">
                    {t('nav.login')}
                  </a>
                  <a href="/auth?mode=register" className="navbar-button">
                    {t('nav.join')}
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
              aria-label={t('nav.toggleMenu')}
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
                🏠 {t('nav.home')}
              </button>
              <button
                className={`mobile-nav-link ${isActive('/countries') ? 'active' : ''}`}
                onClick={() => handleNavClick('/countries')}
              >
                🌍 {t('nav.countries')}
              </button>
              <button
                className={`mobile-nav-link ${isActive('/leaderboards') ? 'active' : ''}`}
                onClick={() => handleNavClick('/leaderboards')}
              >
                🏆 {t('nav.leaderboards')}
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
                    {t('nav.logout')}
                  </button>
                </>
              ) : (
                <>
                  <a href="/auth?mode=login" className="mobile-auth-button secondary">
                    {t('nav.login')}
                  </a>
                  <a href="/auth?mode=register" className="mobile-auth-button primary">
                    {t('nav.join')}
                  </a>
                </>
              )}

              {/* Footer Links */}
              <div className="mobile-footer">
                <button className="footer-link" onClick={() => handleNavClick('/privacy')}>{t('nav.privacyPolicy')}</button>
                <span className="footer-separator">•</span>
                <button className="footer-link" onClick={() => handleNavClick('/terms')}>{t('nav.termsConditions')}</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
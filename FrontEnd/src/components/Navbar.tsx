import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { getFlagUrlSync } from '../utils/flagUtils';
import { buildLocalizedPath, getBaseLanguage, stripLocalePrefix } from '../utils/localeRouting';
import { startPrefetch } from '../utils/dataPrefetch';
import './Navbar.css';

export function Navbar() {
  const { t, i18n } = useTranslation();
  const { user, isAuthenticated, logout, loading } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1000);
  const navigate = useNavigate();
  const location = useLocation();
  const currentLanguage = getBaseLanguage(i18n.language);
  const prefetchTriggered = useRef(false);
  const languageChangeRequestRef = useRef(0);
  const latestPathRef = useRef(location.pathname);

  // Profile flag comes directly from user context now (cached in localStorage)
  const profileFlag = user?.profileFlag || null;
  const flagUrl = profileFlag ? getFlagUrlSync(profileFlag) : null;

  // Intent-based prefetching: only trigger when user shows interest in leaderboards
  const handleLeaderboardHover = () => {
    if (!prefetchTriggered.current) {
      prefetchTriggered.current = true;
      startPrefetch();
    }
  };

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

  useEffect(() => {
    latestPathRef.current = location.pathname;
  }, [location.pathname]);

  const isActive = (path: string) => stripLocalePrefix(location.pathname) === path;

  const handleNavClick = (path: string) => {
    navigate(buildLocalizedPath(path, i18n.language));
    setIsMobileMenuOpen(false);
  };

  const handleLanguageChange = async (nextLanguage: 'en' | 'cs' | 'de') => {
    const requestId = ++languageChangeRequestRef.current;
    const sourcePath = latestPathRef.current;

    if (nextLanguage !== currentLanguage) {
      await i18n.changeLanguage(nextLanguage);
    }

    // Avoid late async completion sending user back to a stale route.
    if (requestId !== languageChangeRequestRef.current || latestPathRef.current !== sourcePath) {
      return;
    }

    navigate(buildLocalizedPath(sourcePath, nextLanguage), { replace: true });
  };

  const renderGuestLanguageSwitcher = (mobile = false) => (
    <div
      className={`navbar-language-switcher ${mobile ? 'mobile' : ''}`}
      role="group"
      aria-label={t('settings.language.switcherAriaLabel')}
    >
      <button
        type="button"
        className={`navbar-lang-btn ${currentLanguage === 'en' ? 'active' : ''}`}
        onClick={() => handleLanguageChange('en')}
      >
        EN
      </button>
      <button
        type="button"
        className={`navbar-lang-btn ${currentLanguage === 'cs' ? 'active' : ''}`}
        onClick={() => handleLanguageChange('cs')}
      >
        CZ
      </button>
      <button
        type="button"
        className={`navbar-lang-btn ${currentLanguage === 'de' ? 'active' : ''}`}
        onClick={() => handleLanguageChange('de')}
      >
        DE
      </button>
    </div>
  );

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
                onMouseEnter={handleLeaderboardHover}
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
              {loading ? (
                // App Shell: Hide auth UI completely during initial Firebase resolution
                <div style={{ width: '150px', height: '40px' }} aria-hidden="true" />
              ) : isAuthenticated ? (
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
                  {renderGuestLanguageSwitcher()}
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
                onTouchStart={handleLeaderboardHover}
              >
                🏆 {t('nav.leaderboards')}
              </button>
            </div>

            {/* Auth Section */}
            <div className="mobile-auth-section">
              {loading ? (
                // App Shell: Hide auth UI completely during initial Firebase resolution
                <div style={{ height: '60px' }} aria-hidden="true" />
              ) : isAuthenticated ? (
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
                  {renderGuestLanguageSwitcher(true)}
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
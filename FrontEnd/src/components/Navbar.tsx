import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { getFlagUrlSync } from '../utils/flagUtils';
import { buildLocalizedPath, getBaseLanguage, stripLocalePrefix } from '../utils/localeRouting';
import { startPrefetch } from '../utils/dataPrefetch';
import { changeAppLanguage } from '../i18n';
import './Navbar.css';

const MOBILE_BREAKPOINT_PX = 1120;

const isMobileViewport = () => window.innerWidth < MOBILE_BREAKPOINT_PX;

export function Navbar() {
  const { t, i18n } = useTranslation();
  const { user, isAuthenticated, logout, loading } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(isMobileViewport());
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
      const mobile = isMobileViewport();
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
  }, [location.key]);

  useEffect(() => {
    latestPathRef.current = location.pathname;
  }, [location.pathname]);

  const isActive = (path: string) => stripLocalePrefix(location.pathname) === path;

  const handleLanguageChange = async (nextLanguage: 'en' | 'cs' | 'de') => {
    const requestId = ++languageChangeRequestRef.current;
    const sourcePath = latestPathRef.current;

    if (nextLanguage !== currentLanguage) {
      await changeAppLanguage(nextLanguage);
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
          <Link className="navbar-brand" to={buildLocalizedPath('/', currentLanguage)}>
            <img
              src="/newlogo.webp"
              alt={t('nav.appName')}
              className="navbar-logo"
              width={56}
              height={56}
              decoding="async"
            />
            <h1 className="m-0">{t('nav.appName')}</h1>
          </Link>

          {/* Desktop Navigation Links */}
          {!isMobile && (
            <div className="navbar-nav-links">
              <Link
                className={`nav-link ${isActive('/') ? 'active' : ''}`}
                to={buildLocalizedPath('/', currentLanguage)}
              >
                {t('nav.home')}
              </Link>
              <Link
                className={`nav-link ${isActive('/countries') ? 'active' : ''}`}
                to={buildLocalizedPath('/countries', currentLanguage)}
              >
                {t('nav.countries')}
              </Link>
              <Link
                className={`nav-link ${isActive('/leaderboards') ? 'active' : ''}`}
                to={buildLocalizedPath('/leaderboards', currentLanguage)}
                onMouseEnter={handleLeaderboardHover}
              >
                {t('nav.leaderboards')}
              </Link>
              <Link
                className={`nav-link ${isActive('/privacy') ? 'active' : ''}`}
                to={buildLocalizedPath('/privacy', currentLanguage)}
                style={{ fontSize: '0.85em', opacity: 0.8 }}
              >
                {t('nav.privacy')}
              </Link>
              <Link
                className={`nav-link ${isActive('/terms') ? 'active' : ''}`}
                to={buildLocalizedPath('/terms', currentLanguage)}
                style={{ fontSize: '0.85em', opacity: 0.8 }}
              >
                {t('nav.terms')}
              </Link>
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
                  <Link
                    className={`navbar-user-button ${isActive('/settings') ? 'active' : ''}`}
                    to={buildLocalizedPath('/settings', currentLanguage)}
                    title={t('nav.settings')}
                  >
                    <span className="navbar-user">
                      {profileFlag && flagUrl ? (
                        <img 
                          src={flagUrl} 
                          alt={t('navbar.profileAlt')} 
                          className="navbar-avatar"
                          style={{ borderRadius: '50%' }}
                        />
                      ) : user?.photoURL ? (
                        <img 
                          src={user.photoURL} 
                          alt={t('navbar.avatarAlt')} 
                          className="navbar-avatar"
                        />
                      ) : (
                        <div className="navbar-avatar-placeholder">
                          {user?.displayName?.[0]?.toUpperCase() || '?'}
                        </div>
                      )}
                      <span className="navbar-username">{user?.displayName}</span>
                    </span>
                  </Link>
                  <button onClick={logout} className="navbar-button">
                    {t('nav.logout')}
                  </button>
                </>
              ) : (
                <>
                  {renderGuestLanguageSwitcher()}
                  <Link to={`${buildLocalizedPath('/auth', currentLanguage)}?mode=login`} className="navbar-button-secondary">
                    {t('nav.login')}
                  </Link>
                  <Link to={`${buildLocalizedPath('/auth', currentLanguage)}?mode=register`} className="navbar-button">
                    {t('nav.join')}
                  </Link>
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
              <Link
                className={`mobile-nav-link ${isActive('/') ? 'active' : ''}`}
                to={buildLocalizedPath('/', currentLanguage)}
              >
                🏠 {t('nav.home')}
              </Link>
              <Link
                className={`mobile-nav-link ${isActive('/countries') ? 'active' : ''}`}
                to={buildLocalizedPath('/countries', currentLanguage)}
              >
                🌍 {t('nav.countries')}
              </Link>
              <Link
                className={`mobile-nav-link ${isActive('/leaderboards') ? 'active' : ''}`}
                to={buildLocalizedPath('/leaderboards', currentLanguage)}
                onTouchStart={handleLeaderboardHover}
              >
                🏆 {t('nav.leaderboards')}
              </Link>
            </div>

            {/* Auth Section */}
            <div className="mobile-auth-section">
              {loading ? (
                // App Shell: Hide auth UI completely during initial Firebase resolution
                <div style={{ height: '60px' }} aria-hidden="true" />
              ) : isAuthenticated ? (
                <>
                  <Link
                    className={`mobile-user-button ${isActive('/settings') ? 'active' : ''}`}
                    to={buildLocalizedPath('/settings', currentLanguage)}
                  >
                    {profileFlag && flagUrl ? (
                      <img 
                        src={flagUrl} 
                        alt={t('navbar.profileAlt')} 
                        className="mobile-avatar"
                        style={{ borderRadius: '50%' }}
                      />
                    ) : user?.photoURL ? (
                      <img 
                        src={user.photoURL} 
                        alt={t('navbar.avatarAlt')} 
                        className="mobile-avatar"
                      />
                    ) : (
                      <div className="mobile-avatar-placeholder">
                        {user?.displayName?.[0]?.toUpperCase() || '?'}
                      </div>
                    )}
                    <span>{user?.displayName}</span>
                  </Link>
                  <button onClick={() => { logout(); setIsMobileMenuOpen(false); }} className="mobile-logout-button">
                    {t('nav.logout')}
                  </button>
                </>
              ) : (
                <>
                  {renderGuestLanguageSwitcher(true)}
                  <Link to={`${buildLocalizedPath('/auth', currentLanguage)}?mode=login`} className="mobile-auth-button secondary">
                    {t('nav.login')}
                  </Link>
                  <Link to={`${buildLocalizedPath('/auth', currentLanguage)}?mode=register`} className="mobile-auth-button primary">
                    {t('nav.join')}
                  </Link>
                </>
              )}

              {/* Footer Links */}
              <div className="mobile-footer">
                <Link className="footer-link" to={buildLocalizedPath('/privacy', currentLanguage)}>{t('nav.privacyPolicy')}</Link>
                <span className="footer-separator">•</span>
                <Link className="footer-link" to={buildLocalizedPath('/terms', currentLanguage)}>{t('nav.termsConditions')}</Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { getFlagUrlSync } from '../utils/flagUtils';
import { buildLocalizedPath, getBaseLanguage, stripLocalePrefix } from '../utils/localeRouting';
import { startPrefetch } from '../utils/dataPrefetch';
import { changeAppLanguage } from '../i18n';
import './Navbar.css';

export function Navbar() {
  const { t, i18n } = useTranslation();
  const { user, isAuthenticated, logout, loading } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const currentLanguage = getBaseLanguage(i18n.language);
  const prefetchTriggered = useRef(false);
  const languageChangeRequestRef = useRef(0);
  const latestPathRef = useRef(location.pathname);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  // Static HTML is shared by every visitor; only the live Firebase session may
  // decide whether to show account controls or sign-in links.
  const authPending = loading || window.__WORLD_QUIZ_PRERENDER__ === true;
  const authState = authPending ? 'pending' : isAuthenticated ? 'authenticated' : 'guest';
  // React 18 forwards the native boolean attribute as an empty string.
  // Inert blocks focus immediately, including while drawer styles are updating.
  const drawerInert = isMobileMenuOpen ? {} : { inert: '' };

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
    // CSS owns the layout, including the first paint of prerendered HTML.
    // This listener only resets an open drawer when entering desktop layout.
    const desktop = window.matchMedia('(min-width: 1120px)');
    const closeOnDesktop = () => {
      if (desktop.matches) setIsMobileMenuOpen(false);
    };
    desktop.addEventListener('change', closeOnDesktop);
    return () => desktop.removeEventListener('change', closeOnDesktop);
  }, []);

  useEffect(() => {
    if (!isMobileMenuOpen) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsMobileMenuOpen(false);
        menuButtonRef.current?.focus();
      }
    };
    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, [isMobileMenuOpen]);

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

          {/* Desktop Auth Menu */}
          <div className="navbar-menu" data-auth-state={authState} aria-busy={authPending}>
            {authPending ? (
              <div className="navbar-auth-placeholder" aria-hidden="true">
                <span className="navbar-auth-placeholder-avatar" />
                <span className="navbar-auth-placeholder-label" />
              </div>
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

          {/* Mobile Hamburger Button */}
          <button
            ref={menuButtonRef}
            type="button"
            className={`hamburger-button ${isMobileMenuOpen ? 'open' : ''}`}
            onClick={() => setIsMobileMenuOpen(open => !open)}
            aria-label={t('nav.toggleMenu')}
            aria-expanded={isMobileMenuOpen}
            aria-controls="mobile-navigation"
          >
            <span className="hamburger-line"></span>
            <span className="hamburger-line"></span>
            <span className="hamburger-line"></span>
          </button>
        </div>
      </nav>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="mobile-menu-overlay" onClick={() => setIsMobileMenuOpen(false)} />
      )}

      {/* Mobile Menu */}
      <div id="mobile-navigation" className={`mobile-menu ${isMobileMenuOpen ? 'open' : ''}`} {...drawerInert}>
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
          <div className="mobile-auth-section" data-auth-state={authState} aria-busy={authPending}>
            {authPending ? (
              <div className="navbar-auth-placeholder" aria-hidden="true">
                <span className="navbar-auth-placeholder-avatar" />
                <span className="navbar-auth-placeholder-label" />
              </div>
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
                  <span className="mobile-username">{user?.displayName}</span>
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
    </>
  );
}

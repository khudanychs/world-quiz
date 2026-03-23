import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import { BackButton } from './BackButton';
import { FlagSelector, getFlagUrl } from './FlagSelector';
import { SEOHelmet } from './SEOHelmet';
import { SEO_TRANSLATIONS, toCanonicalUrl, getSeoOgImage } from '../seo/seo-translations';
import { buildLocalizedPath, getBaseLanguage } from '../utils/localeRouting';
import './Settings.css';

// Cache for user streak data (survives component remounts)
const streakCache: { [userId: string]: { streak: number; timestamp: number } } = {};
const STREAK_CACHE_DURATION = 10 * 60 * 1000; // 10 minutes - optimized for Firebase free tier

export const Settings = () => {
  const seo = SEO_TRANSLATIONS.routes.settings;
  const { t, i18n } = useTranslation();
  const { user, setNickname, setProfileFlag: saveProfileFlag, deleteAccount, refreshUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const currentLanguage = getBaseLanguage(i18n.language);
  const [username, setUsername] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [selectedFlag, setSelectedFlag] = useState<string | null>(null);
  const [tempSelectedFlag, setTempSelectedFlag] = useState('us');
  const [showFlagModal, setShowFlagModal] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [profileError, setProfileError] = useState('');
  const [profileSuccess, setProfileSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [deletePassword, setDeletePassword] = useState('');
  const [highestStreak, setHighestStreak] = useState<number | null>(null);
  const [streakLoading, setStreakLoading] = useState(false);
  const [cardsMatchHighScore, setCardsMatchHighScore] = useState<number | null>(null);
  const [cardsMatchLoading, setCardsMatchLoading] = useState(false);
  const [countriesGuessed, setCountriesGuessed] = useState<number | null>(null);
  const [guessCountryLoading, setGuessCountryLoading] = useState(false);
  const [nickChangeStatus, setNickChangeStatus] = useState<{
    changesThisMonth: number;
    changesLeft: number;
    cooldownDaysLeft: number | null;
  } | null>(null);

  useEffect(() => {
    if (user) {
      setUsername(user.displayName || '');
      setAvatarUrl(user.photoURL || '');
      // Use profile flag from context (already cached)
      if (user.profileFlag) {
        setSelectedFlag(user.profileFlag);
        setTempSelectedFlag(user.profileFlag);
      } else {
        // Clear flag if user doesn't have one
        setSelectedFlag(null);
      }
    }
  }, [user]);

  // Fetch nick change rate-limit status from Firestore
  useEffect(() => {
    if (!user) return;
    const fetchNickChangeStatus = async () => {
      try {
        const [{ doc, getDoc }, { db }] = await Promise.all([
          import('firebase/firestore'),
          import('../firebase'),
        ]);
        const usernameDoc = await getDoc(doc(db, 'usernames', user.uid));
        const now = new Date();
        const currentMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
        if (!usernameDoc.exists()) {
          setNickChangeStatus({ changesThisMonth: 0, changesLeft: 2, cooldownDaysLeft: null });
          return;
        }
        const data = usernameDoc.data();
        const storedMonthKey: string = data.nickChangesMonthKey ?? '';
        const storedCount: number = typeof data.nickChangesCount === 'number' ? data.nickChangesCount : 0;
        const lastChangedAt: Date | null = data.lastNickChangeAt?.toDate?.() ?? null;
        const changesThisMonth = storedMonthKey === currentMonthKey ? storedCount : 0;
        const changesLeft = Math.max(0, 2 - changesThisMonth);
        let cooldownDaysLeft: number | null = null;
        if (lastChangedAt) {
          const COOLDOWN_MS = 7 * 24 * 60 * 60 * 1000;
          const elapsed = now.getTime() - lastChangedAt.getTime();
          if (elapsed < COOLDOWN_MS) {
            cooldownDaysLeft = Math.ceil((COOLDOWN_MS - elapsed) / (24 * 60 * 60 * 1000));
          }
        }
        setNickChangeStatus({ changesThisMonth, changesLeft, cooldownDaysLeft });
      } catch (err) {
        console.error('Error fetching nick change status:', err);
      }
    };
    fetchNickChangeStatus();
  }, [user]);

  // Fetch user's highest streak when component mounts (with caching)
  useEffect(() => {
    if (user) {
      const fetchHighestStreak = async () => {
        // Check cache first
        const cached = streakCache[user.uid];
        const now = Date.now();
        
        if (cached && (now - cached.timestamp) < STREAK_CACHE_DURATION) {
          setHighestStreak(cached.streak);
          return;
        }
        
        setStreakLoading(true);
        try {
          // Dynamically import Firebase to avoid blocking initial load
          const [{ doc, getDoc }, { db }] = await Promise.all([
            import('firebase/firestore'),
            import('../firebase')
          ]);
          
          // Document ID is user.uid (one record per user)
          const streakDocRef = doc(db, 'streaks', user.uid);
          const streakDoc = await getDoc(streakDocRef);
          if (streakDoc.exists()) {
            const data = streakDoc.data();
            setHighestStreak(data.streak);
            // Update cache
            streakCache[user.uid] = { streak: data.streak, timestamp: now };
          } else {
            setHighestStreak(0);
            streakCache[user.uid] = { streak: 0, timestamp: now };
          }
        } catch (err) {
          console.error('Error fetching highest streak:', err);
          // Use cached value if available, even if expired
          if (cached) {
            setHighestStreak(cached.streak);
          } else {
            setHighestStreak(null);
          }
        } finally {
          setStreakLoading(false);
        }
      };
      fetchHighestStreak();
    }
  }, [user]);

  // Fetch user's highest Cards Match score
  useEffect(() => {
    if (user) {
      const fetchCardsMatchScore = async () => {
        setCardsMatchLoading(true);
        try {
          const [{ doc, getDoc }, { db }] = await Promise.all([
            import('firebase/firestore'),
            import('../firebase')
          ]);

          const scoreDocRef = doc(db, 'cardsMatchScores', user.uid);
          const scoreDoc = await getDoc(scoreDocRef);
          if (scoreDoc.exists()) {
            const data = scoreDoc.data();
            setCardsMatchHighScore(data.score || 0);
          } else {
            setCardsMatchHighScore(0);
          }
        } catch (err) {
          console.error('Error fetching Cards Match high score:', err);
          setCardsMatchHighScore(null);
        } finally {
          setCardsMatchLoading(false);
        }
      };
      fetchCardsMatchScore();
    }
  }, [user]);

  // Fetch user's Guess Country stats
  useEffect(() => {
    if (user) {
      const fetchGuessCountryStats = async () => {
        setGuessCountryLoading(true);
        try {
          const [{ doc, getDoc }, { db }] = await Promise.all([
            import('firebase/firestore'),
            import('../firebase')
          ]);

          const statsDocRef = doc(db, 'guessCountryStats', user.uid);
          const statsDoc = await getDoc(statsDocRef);
          if (statsDoc.exists()) {
            const data = statsDoc.data();
            setCountriesGuessed(data.countriesGuessed || 0);
          } else {
            setCountriesGuessed(0);
          }
        } catch (err) {
          console.error('Error fetching Guess Country stats:', err);
          setCountriesGuessed(null);
        } finally {
          setGuessCountryLoading(false);
        }
      };
      fetchGuessCountryStats();
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    // Check if username is the same as current
    if (username === user?.displayName) {
      setError(t('settings.messages.nicknameSame'));
      setLoading(false);
      return;
    }

    try {
      await setNickname(username);
      setSuccess(t('settings.messages.nicknameUpdated'));
      // Refresh user data to show new nickname immediately
      await refreshUser();
    } catch (err: any) {
      setError(err.message || t('settings.messages.nicknameUpdateFailed'));
    } finally {
      setLoading(false);
    }
  };

  const handleSaveFlag = async () => {
    if (!user) return;
    
    setProfileError('');
    setProfileSuccess('');
    setLoading(true);

    try {
      await saveProfileFlag(tempSelectedFlag);
      setSelectedFlag(tempSelectedFlag);
      setShowFlagModal(false);
      // Show success message after modal closes
      setTimeout(() => {
        setProfileSuccess(t('settings.messages.profileFlagUpdated'));
      }, 300);
    } catch (err: any) {
      setProfileError(err.message || t('settings.messages.profileFlagUpdateFailed'));
    } finally {
      setLoading(false);
    }
  };

  const handleOpenFlagModal = () => {
    setTempSelectedFlag(selectedFlag || 'us');
    setShowFlagModal(true);
  };

  const handleUseGooglePhoto = async () => {
    if (!user?.photoURL) {
      setProfileError(t('settings.messages.noGooglePhoto'));
      return;
    }

    setProfileError('');
    setProfileSuccess('');
    setLoading(true);

    try {
      // Update local state immediately for instant UI update
      setSelectedFlag(null);
      setTempSelectedFlag('us');
      setAvatarUrl(user.photoURL);
      
      // Then save to database
      await saveProfileFlag(null);
      
      // Refresh user context to update navbar and other components
      await refreshUser();
      
      setProfileSuccess(t('settings.messages.usingGooglePhoto'));
    } catch (err: any) {
      setProfileError(err.message || t('settings.messages.profilePictureUpdateFailed'));
      // Revert on error
      if (user?.profileFlag) {
        setSelectedFlag(user.profileFlag);
        setTempSelectedFlag(user.profileFlag);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== 'DELETE') {
      setError(t('settings.messages.typeDeleteToConfirm'));
      return;
    }

    // Check if user is Google user (photoURL present) or email/password user
    const isGoogleUser = user?.photoURL !== null;
    
    if (!isGoogleUser && !deletePassword) {
      setError(t('settings.messages.passwordRequiredForDelete'));
      return;
    }

    setLoading(true);
    setError('');

    try {
      await deleteAccount(deletePassword || undefined);
      // User will be logged out automatically and redirected by protected route
    } catch (err: any) {
      setError(err.message || t('settings.messages.deleteAccountFailed'));
      setLoading(false);
    }
  };

  const handleLanguageChange = async (nextLanguage: 'en' | 'cs' | 'de') => {
    if (nextLanguage !== currentLanguage) {
      await i18n.changeLanguage(nextLanguage);
    }
    navigate(buildLocalizedPath(location.pathname, nextLanguage));
  };

  return (
    <>
      <SEOHelmet
        title={seo.title}
        description={seo.description}
        canonicalUrl={toCanonicalUrl(seo.path)}
        ogImage={getSeoOgImage(seo)}
        noindex={seo.noindex}
      />
      <div className="settings-page-wrapper">
        <div className="settings-page-card">
        <div className="settings-header">
          <BackButton
            onClick={() => navigate(-1)}
            style={{
              position: 'relative',
              top: 'auto',
              left: 'auto',
              marginRight: '24px',
            }}
          />
          <h2>{t('settings.title')}</h2>
        </div>

        <div className="settings-content">
          <div className="settings-section">
            <h3>{t('settings.language.title')}</h3>
            <p className="settings-language-note">{t('settings.language.note')}</p>
            <div className="settings-language-switcher" role="group" aria-label={t('settings.language.switcherAriaLabel')}>
              <button
                type="button"
                className={`settings-lang-btn ${currentLanguage === 'en' ? 'active' : ''}`}
                onClick={() => handleLanguageChange('en')}
              >
                EN
              </button>
              <button
                type="button"
                className={`settings-lang-btn ${currentLanguage === 'cs' ? 'active' : ''}`}
                onClick={() => handleLanguageChange('cs')}
              >
                CZ
              </button>
              <button
                type="button"
                className={`settings-lang-btn ${currentLanguage === 'de' ? 'active' : ''}`}
                onClick={() => handleLanguageChange('de')}
              >
                DE
              </button>
            </div>
          </div>

          {/* Profile Picture Section */}
          <div className="settings-section">
            <h3>{t('settings.profile.title')}</h3>
            {profileError && <div className="settings-error">{profileError}</div>}
            {profileSuccess && <div className="settings-success">{profileSuccess}</div>}
            
            <div className="profile-picture-container">
              {avatarUrl && !selectedFlag ? (
                <img src={avatarUrl} alt="Profile" className="profile-picture-preview" />
              ) : selectedFlag && getFlagUrl(selectedFlag) ? (
                <div className="profile-flag-wrapper">
                  <img 
                    src={getFlagUrl(selectedFlag)!}
                    alt={selectedFlag.toUpperCase()}
                    style={{ width: '100%', height: '100%', borderRadius: '50%' }}
                  />
                </div>
              ) : (
                <div className="profile-picture-placeholder">
                  {user?.displayName?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || '?'}
                </div>
              )}
              <div className="profile-picture-info">
                <p className="profile-picture-note">
                  {selectedFlag 
                    ? t('settings.profile.selectedFlag')
                    : avatarUrl 
                    ? t('settings.profile.googlePhoto')
                    : t('settings.profile.none')}
                </p>
                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                  <button 
                    onClick={handleOpenFlagModal}
                    className="change-flag-button"
                  >
                    {t('settings.profile.changeFlag')}
                  </button>
                  {user?.photoURL && selectedFlag && (
                    <button 
                      onClick={handleUseGooglePhoto}
                      className="change-flag-button"
                      style={{ 
                        background: 'linear-gradient(135deg, #4285f4, #34a853)',
                        border: 'none'
                      }}
                      disabled={loading}
                    >
                      {t('settings.profile.useGooglePhoto')}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Nickname Section */}
          <div className="settings-section">
            <h3>{t('settings.nickname.title')}</h3>
            <div className="nick-change-limit-info">
              {nickChangeStatus !== null ? (
                nickChangeStatus.cooldownDaysLeft !== null ? (
                  <p className="nick-change-warning">
                    {t('settings.nickname.cooldownActive', { count: nickChangeStatus.cooldownDaysLeft })}
                  </p>
                ) : nickChangeStatus.changesLeft === 0 ? (
                  <p className="nick-change-warning">
                    {t('settings.nickname.monthlyLimitReached')}
                  </p>
                ) : (
                  <p className="nick-change-ok">
                    {t('settings.nickname.changesRemaining', { count: nickChangeStatus.changesLeft })}
                  </p>
                )
              ) : null}
              <small>{t('settings.nickname.limitInfo')}</small>
            </div>
            <form onSubmit={handleSubmit}>
              {error && <div className="settings-error">{error}</div>}
              {success && <div className="settings-success">{success}</div>}
              
              <div className="form-group">
                <label htmlFor="settings-username">{t('settings.nickname.usernameLabel')}</label>
                <input
                  type="text"
                  id="settings-username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder={t('settings.nickname.usernamePlaceholder')}
                  required
                  minLength={3}
                  maxLength={50}
                  pattern="[a-zA-Z0-9_\-]+"
                  title={t('settings.nickname.usernameTitle')}
                  autoComplete="off"
                />
                <small>{t('settings.nickname.usernameHelp')}</small>
              </div>

              <button 
                type="submit" 
                className="settings-save-button"
                disabled={loading || username.length < 3}
              >
                {loading ? t('settings.saving') : t('settings.saveChanges')}
              </button>
            </form>
          </div>

          {/* Account Info */}
          <div className="settings-section">
            <h3>{t('settings.account.title')}</h3>
            <div className="account-info">
              <div className="info-row">
                <span className="info-label">{t('settings.account.emailLabel')}</span>
                <span className="info-value">{user?.email}</span>
              </div>
              <div className="info-row">
                <span className="info-label">{t('settings.account.accountTypeLabel')}</span>
                <span className="info-value">
                  {user?.photoURL ? t('settings.account.googleAccount') : t('settings.account.localAccount')}
                </span>
              </div>
              <div className="info-row">
                <span className="info-label">{t('settings.account.memberSinceLabel')}</span>
                <span className="info-value">
                  {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : t('settings.account.notAvailable')}
                </span>
              </div>
            </div>
          </div>

          {/* Stats Section */}
          <div className="settings-section">
            <h3>{t('settings.stats.title')}</h3>
            <div className="stats-container">
              <div className="stat-card">
                <span className="stat-icon">🔥</span>
                <div className="stat-content">
                  <p><span style={{ fontWeight: 'bold', color: '#fff', fontSize: '22px' }}>{t('settings.stats.bestStreak')}:&ensp; </span><span className="stat-value">{streakLoading ? '...' : (highestStreak ?? '—')}</span></p>
                </div>
              </div>
              <div className="stat-card">
                <span className="stat-icon">🎴</span>
                <div className="stat-content">
                  <p><span style={{ fontWeight: 'bold', color: '#fff', fontSize: '22px' }}>{t('settings.stats.cardsMatchHighScore')}:&ensp; </span><span className="stat-value">{cardsMatchLoading ? '...' : (cardsMatchHighScore !== null ? cardsMatchHighScore.toLocaleString() : '—')}</span></p>
                </div>
              </div>
              <div className="stat-card">
                <span className="stat-icon">🎯</span>
                <div className="stat-content">
                  <p><span style={{ fontWeight: 'bold', color: '#fff', fontSize: '22px' }}>{t('settings.stats.countriesGuessed')}:&ensp; </span><span className="stat-value">{guessCountryLoading ? '...' : (countriesGuessed ?? '—')}</span></p>
                </div>
              </div>
            </div>
          </div>

          {/* Danger Zone - Delete Account */}
          <div className="settings-section danger-zone" id="delete-section">
            <h3>{t('settings.dangerZone.title')}</h3>
            {!showDeleteConfirm ? (
              <button 
                className="delete-account-button"
                onClick={() => {
                  setShowDeleteConfirm(true);
                  // Scroll to delete section after state update
                  setTimeout(() => {
                    document.getElementById('delete-section')?.scrollIntoView({ 
                      behavior: 'smooth', 
                      block: 'end' 
                    });
                  }, 100);
                }}
              >
                {t('settings.dangerZone.deleteMyAccount')}
              </button>
            ) : (
              <div className="delete-confirm">
                <p className="delete-warning">
                  {t('settings.dangerZone.warning')}
                </p>
                <div className="form-group">
                  <label htmlFor="delete-confirm">
                    {t('settings.dangerZone.typeDelete')}
                  </label>
                  <input
                    type="text"
                    id="delete-confirm"
                    value={deleteConfirmText}
                    onChange={(e) => setDeleteConfirmText(e.target.value)}
                    placeholder={t('settings.dangerZone.deleteWord')}
                    autoComplete="off"
                  />
                </div>
                
                {/* Password field for email/password users */}
                {user?.photoURL === null && (
                  <div className="form-group">
                    <label htmlFor="delete-password">
                      {t('settings.dangerZone.passwordLabel')}
                    </label>
                    <input
                      type="password"
                      id="delete-password"
                      value={deletePassword}
                      onChange={(e) => setDeletePassword(e.target.value)}
                      placeholder={t('settings.dangerZone.passwordPlaceholder')}
                      autoComplete="current-password"
                    />
                  </div>
                )}
                
                <div className="delete-actions">
                  <button 
                    className="cancel-delete-button"
                    onClick={() => {
                      setShowDeleteConfirm(false);
                      setDeleteConfirmText('');
                      setDeletePassword('');
                      setError('');
                    }}
                    disabled={loading}
                  >
                    {t('settings.cancel')}
                  </button>
                  <button 
                    className="confirm-delete-button"
                    onClick={handleDeleteAccount}
                    disabled={loading || deleteConfirmText !== 'DELETE'}
                  >
                    {loading ? t('settings.deleting') : t('settings.dangerZone.deleteAccount')}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
        </div>

        {/* Flag Selection Modal */}
        {showFlagModal && (
          <div className="flag-modal-overlay" onClick={() => setShowFlagModal(false)}>
            <div className="flag-modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="flag-modal-header">
                <h2>{t('settings.profile.selectFlag')}</h2>
                <button 
                  className="flag-modal-close"
                  onClick={() => setShowFlagModal(false)}
                  aria-label={t('settings.close')}
                >
                  ×
                </button>
              </div>
              
              <div className="flag-modal-body">
                <FlagSelector 
                  selectedFlag={tempSelectedFlag}
                  onFlagSelect={setTempSelectedFlag}
                />
              </div>
              
              <div className="flag-modal-footer">
                <button 
                  onClick={() => setShowFlagModal(false)}
                  className="flag-modal-cancel"
                >
                  {t('settings.cancel')}
                </button>
                <button 
                  onClick={handleSaveFlag}
                  className="flag-modal-save"
                  disabled={loading}
                >
                  {loading ? t('settings.saving') : t('settings.profile.saveFlag')}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};
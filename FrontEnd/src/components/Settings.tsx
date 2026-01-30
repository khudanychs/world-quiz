import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { BackButton } from './BackButton';
import { FlagSelector, getFlagUrl } from './FlagSelector';
import './Settings.css';

// Cache for user streak data (survives component remounts)
const streakCache: { [userId: string]: { streak: number; timestamp: number } } = {};
const STREAK_CACHE_DURATION = 10 * 60 * 1000; // 10 minutes - optimized for Firebase free tier

export const Settings = () => {
  const { user, setNickname, setProfileFlag: saveProfileFlag, deleteAccount, refreshUser } = useAuth();
  const navigate = useNavigate();
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

  useEffect(() => {
    if (user) {
      setUsername(user.displayName || '');
      setAvatarUrl(user.photoURL || '');
      // Use profile flag from context (already cached)
      if (user.profileFlag) {
        setSelectedFlag(user.profileFlag);
        setTempSelectedFlag(user.profileFlag);
      }
    }
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    // Check if username is the same as current
    if (username === user?.displayName) {
      setError('Nickname is the same as your current one');
      setLoading(false);
      return;
    }

    try {
      await setNickname(username);
      setSuccess('Nickname updated successfully!');
      // Refresh user data to show new nickname immediately
      await refreshUser();
    } catch (err: any) {
      setError(err.message || 'Failed to update nickname');
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
        setProfileSuccess('Profile flag updated successfully!');
      }, 300);
    } catch (err: any) {
      setProfileError(err.message || 'Failed to update profile flag');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenFlagModal = () => {
    setTempSelectedFlag(selectedFlag || 'us');
    setShowFlagModal(true);
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== 'DELETE') {
      setError('Please type DELETE to confirm');
      return;
    }

    // Check if user is Google user (photoURL present) or email/password user
    const isGoogleUser = user?.photoURL !== null;
    
    if (!isGoogleUser && !deletePassword) {
      setError('Please enter your password to confirm account deletion.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await deleteAccount(deletePassword || undefined);
      // User will be logged out automatically and redirected by protected route
    } catch (err: any) {
      setError(err.message || 'Failed to delete account');
      setLoading(false);
    }
  };

  return (
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
          <h2>Settings</h2>
        </div>

        <div className="settings-content">
          {/* Profile Picture Section */}
          <div className="settings-section">
            <h3>Profile Picture</h3>
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
                    ? 'You have selected a flag as your profile picture'
                    : avatarUrl 
                    ? 'Your profile picture is from Google'
                    : 'No profile picture set'}
                </p>
                <button 
                  onClick={handleOpenFlagModal}
                  className="change-flag-button"
                >
                  Change Flag
                </button>
              </div>
            </div>
          </div>

          {/* Nickname Section */}
          <div className="settings-section">
            <h3>Nickname</h3>
            <form onSubmit={handleSubmit}>
              {error && <div className="settings-error">{error}</div>}
              {success && <div className="settings-success">{success}</div>}
              
              <div className="form-group">
                <label htmlFor="settings-username">Username</label>
                <input
                  type="text"
                  id="settings-username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter your username"
                  required
                  minLength={3}
                  maxLength={50}
                  pattern="[a-zA-Z0-9_\-]+"
                  title="Username can only contain letters, numbers, underscores, and hyphens"
                  autoComplete="off"
                />
                <small>3-50 characters, letters, numbers, underscores, and hyphens only</small>
              </div>

              <button 
                type="submit" 
                className="settings-save-button"
                disabled={loading || username.length < 3}
              >
                {loading ? 'Saving...' : 'Save Changes'}
              </button>
            </form>
          </div>

          {/* Account Info */}
          <div className="settings-section">
            <h3>Account Information</h3>
            <div className="account-info">
              <div className="info-row">
                <span className="info-label">Email:</span>
                <span className="info-value">{user?.email}</span>
              </div>
              <div className="info-row">
                <span className="info-label">Account Type:</span>
                <span className="info-value">
                  {user?.photoURL ? 'Google Account' : 'Local Account'}
                </span>
              </div>
              <div className="info-row">
                <span className="info-label">Member Since:</span>
                <span className="info-value">
                  {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
                </span>
              </div>
            </div>
          </div>

          {/* Stats Section */}
          <div className="settings-section">
            <h3>Your Stats</h3>
            <div className="stats-container">
              <div className="stat-card">
                <span className="stat-icon">🔥</span>
                <div className="stat-content">
                  <p><span style={{ fontWeight: 'bold', color: '#fff', fontSize: '22px' }}>Best Streak:&ensp; </span><span className="stat-value">{streakLoading ? '...' : (highestStreak ?? '—')}</span></p>
                </div>
              </div>
            </div>
          </div>

          {/* Danger Zone - Delete Account */}
          <div className="settings-section danger-zone" id="delete-section">
            <h3>Danger Zone</h3>
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
                Delete My Account
              </button>
            ) : (
              <div className="delete-confirm">
                <p className="delete-warning">
                  ⚠️ This action cannot be undone. All your data including scores and progress will be permanently deleted.
                </p>
                <div className="form-group">
                  <label htmlFor="delete-confirm">
                    Type <strong>DELETE</strong> to confirm:
                  </label>
                  <input
                    type="text"
                    id="delete-confirm"
                    value={deleteConfirmText}
                    onChange={(e) => setDeleteConfirmText(e.target.value)}
                    placeholder="DELETE"
                    autoComplete="off"
                  />
                </div>
                
                {/* Password field for email/password users */}
                {user?.photoURL === null && (
                  <div className="form-group">
                    <label htmlFor="delete-password">
                      Enter your password:
                    </label>
                    <input
                      type="password"
                      id="delete-password"
                      value={deletePassword}
                      onChange={(e) => setDeletePassword(e.target.value)}
                      placeholder="Password"
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
                    Cancel
                  </button>
                  <button 
                    className="confirm-delete-button"
                    onClick={handleDeleteAccount}
                    disabled={loading || deleteConfirmText !== 'DELETE'}
                  >
                    {loading ? 'Deleting...' : 'Delete Account'}
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
              <h2>Select Your Flag</h2>
              <button 
                className="flag-modal-close"
                onClick={() => setShowFlagModal(false)}
                aria-label="Close"
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
                Cancel
              </button>
              <button 
                onClick={handleSaveFlag}
                className="flag-modal-save"
                disabled={loading}
              >
                {loading ? 'Saving...' : 'Save Flag'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import './Settings.css';

interface SettingsProps {
  isOpen: boolean;
  onClose: () => void;
}

export const Settings = ({ isOpen, onClose }: SettingsProps) => {
  const { user, setNickname, deleteAccount, refreshUser } = useAuth();
  const [username, setUsername] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [deletePassword, setDeletePassword] = useState('');

  useEffect(() => {
    if (user) {
      setUsername(user.displayName || '');
      setAvatarUrl(user.photoURL || '');
    }
  }, [user]);

  useEffect(() => {
    // Clear messages when modal opens or closes
    if (!isOpen) {
      setError('');
      setSuccess('');
    }
  }, [isOpen]);

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
      // User will be logged out automatically, close modal
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to delete account');
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="settings-overlay" onClick={onClose} />
      <div className="settings-modal">
        <div className="settings-header">
          <h2>Settings</h2>
          <button className="settings-close" onClick={onClose}>×</button>
        </div>

        <div className="settings-content">
          {/* Profile Picture Section */}
          <div className="settings-section">
            <h3>Profile Picture</h3>
            <div className="profile-picture-container">
              {avatarUrl ? (
                <img src={avatarUrl} alt="Profile" className="profile-picture-preview" />
              ) : (
                <div className="profile-picture-placeholder">
                  {user?.displayName?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || '?'}
                </div>
              )}
              <div className="profile-picture-info">
                <p className="profile-picture-note">
                  {user?.photoURL 
                    ? 'Your profile picture is managed by Google'
                    : 'Profile pictures coming soon!'}
                </p>
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
    </>
  );
};

import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import './Settings.css';

interface SettingsProps {
  isOpen: boolean;
  onClose: () => void;
}

export const Settings = ({ isOpen, onClose }: SettingsProps) => {
  const { user, setNickname } = useAuth();
  const [username, setUsername] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      setUsername(user.username || '');
      setAvatarUrl(user.avatar_url || '');
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
    if (username === user?.username) {
      setError('Nickname is the same as your current one');
      setLoading(false);
      return;
    }

    try {
      await setNickname(username);
      setSuccess('Nickname updated successfully!');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to update nickname');
    } finally {
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
                  {user?.username?.[0]?.toUpperCase() || '?'}
                </div>
              )}
              <div className="profile-picture-info">
                <p className="profile-picture-note">
                  {user?.google_id 
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
                  pattern="[a-zA-Z0-9_-]+"
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
                  {user?.google_id ? 'Google Account' : 'Local Account'}
                </span>
              </div>
              <div className="info-row">
                <span className="info-label">Member Since:</span>
                <span className="info-value">
                  {user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

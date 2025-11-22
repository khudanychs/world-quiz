import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import './Auth.css';

export const SetNickname = () => {
  const { user, setNickname } = useAuth();
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Pre-fill with Google display name or username
    if (user) {
      setUsername(user.displayName || '');
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await setNickname(username);
      navigate('/', { replace: true }); // Replace history to avoid back to nickname
    } catch (err: any) {
      setError(err.message || 'Failed to set nickname');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2>Choose Your Nickname</h2>
        <p className="auth-subtitle">You can keep your Google name or choose a new one!</p>
        
        {error && <div className="auth-error">{error}</div>}
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="username">Username</label>
            <input
              type="text"
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter your username"
              required
              minLength={3}
              maxLength={50}
              pattern="[a-zA-Z0-9_-]+"
              title="Username can only contain letters, numbers, underscores, and hyphens"
            />
            <small>3-50 characters, letters, numbers, underscores, and hyphens only</small>
          </div>

          <button 
            type="submit" 
            className="auth-button"
            disabled={loading || username.length < 3}
          >
            {loading ? 'Setting...' : 'Continue to Game'}
          </button>
        </form>
      </div>
    </div>
  );
};

import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Settings } from './Settings';
import './Navbar.css';

export function Navbar() {
  const { user, isAuthenticated, logout } = useAuth();
  const [showSettings, setShowSettings] = useState(false);

  return (
    <>
      <nav className="navbar navbar-custom">
        <div className="container-fluid">
          <div className="navbar-brand">
            <h1 className="m-0">🌍 World Quiz</h1>
          </div>

          <div className="navbar-menu">
            {isAuthenticated ? (
              <>
                <button 
                  className="navbar-user-button"
                  onClick={() => setShowSettings(true)}
                  title="Settings"
                >
                  <span className="navbar-user">
                    {user?.photoURL && (
                      <img src={user.photoURL} alt="avatar" className="navbar-avatar" />
                    )}
                    <span className="navbar-username">{user?.displayName}</span>
                  </span>
                </button>
                <button onClick={logout} className="navbar-button">
                  Logout
                </button>
              </>
            ) : (
              <a href="/auth" className="navbar-button">
                Join us
              </a>
            )}
          </div>
        </div>
      </nav>

      <Settings isOpen={showSettings} onClose={() => setShowSettings(false)} />
    </>
  );
}

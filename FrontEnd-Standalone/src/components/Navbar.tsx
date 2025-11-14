import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Settings } from './Settings';
import './Navbar.css';

export function Navbar() {
  const { user } = useAuth();
  const [showSettings, setShowSettings] = useState(false);

  return (
    <>
      <nav className="navbar navbar-custom">
        <div className="container-fluid">
          <div className="navbar-brand">
            <h1 className="m-0">🌍 World Quiz</h1>
          </div>

          <div className="navbar-menu">
            <button 
              className="navbar-user-button"
              onClick={() => setShowSettings(true)}
              title="Settings"
            >
              <span className="navbar-user">
                {user?.avatar_url && (
                  <img src={user.avatar_url} alt="avatar" className="navbar-avatar" />
                )}
                <span className="navbar-username">{user?.username}</span>
              </span>
            </button>
          </div>
        </div>
      </nav>

      <Settings isOpen={showSettings} onClose={() => setShowSettings(false)} />
    </>
  );
}

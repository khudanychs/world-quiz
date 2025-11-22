import { useNavigate } from 'react-router-dom';
import { Leaderboard } from './Leaderboard';
import './MainMenu.css';

export default function MainMenu() {
  const navigate = useNavigate();
  return (
    <div className="menu-wrap">
      <header className="menu-header">
        <h2>Choose a Game Mode</h2>
        <p>Pick a mode below, or explore the interactive world map.</p>
      </header>

      <section className="menu-grid">
        <div className="menu-card disabled">
          <div className="menu-card-body">
            <h3>Capital Quiz</h3>
            <p>Guess the capital city for each country.</p>
            <span className="menu-tag">Coming soon</span>
          </div>
        </div>
        <button className="menu-card" onClick={() => navigate('/game/flags')}>
          <div className="menu-card-body">
            <h3>Flag Match</h3>
            <p>Match countries to their flags.</p>
            <span className="menu-tag" style={{background:'#22c55e'}}>New</span>
          </div>
        </button>
        <div className="menu-card disabled">
          <div className="menu-card-body">
            <h3>Regions Challenge</h3>
            <p>Identify countries by region on a timer.</p>
            <span className="menu-tag">Coming soon</span>
          </div>
        </div>
        <div className="menu-card disabled">
          <div className="menu-card-body">
            <h3>Boundaries Blitz</h3>
            <p>Outline borders accurately for bonus points.</p>
            <span className="menu-tag">Coming soon</span>
          </div>
        </div>
      </section>

      <Leaderboard />

      <footer className="menu-footer">
        <button className="menu-primary" onClick={() => navigate('/map')}>
          🗺️ Explore Map
        </button>
      </footer>
    </div>
  );
}

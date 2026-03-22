import { useNavigate } from 'react-router-dom';
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
        <button className="menu-card" onClick={() => navigate('/game/physical-geo')}>
          <div className="menu-card-body">
            <h3>Physical Geography</h3>
            <p>Locate mountains, rivers, deserts, seas and more!</p>
            <span className="menu-tag" style={{background:'#f59e0b'}}>New</span>
          </div>
        </button>
        <button className="menu-card" onClick={() => navigate('/game/flags')}>
          <div className="menu-card-body">
            <h3>Flag Match</h3>
            <p>Match countries to their flags.</p>
          </div>
        </button>
        <button className="menu-card" onClick={() => navigate('/game/shape-match')}>
          <div className="menu-card-body">
            <h3>Cards Match</h3>
            <p>Match Flags, Countries, Capitals, or Shapes on a timer!</p>
          </div>
        </button>
        <button className="menu-card" onClick={() => navigate('/game/guess-country')}>
          <div className="menu-card-body">
            <h3>Guess the Country</h3>
            <p>Guess the hidden country using distance and direction hints.</p>
            <span className="menu-tag" style={{background:'#0ea5e9'}}>New</span>
          </div>
        </button>
      </section>

      <footer className="menu-footer">
        <button className="menu-primary" onClick={() => navigate('/map')}>
          🗺️ Explore Map
        </button>
      </footer>
    </div>
  );
}

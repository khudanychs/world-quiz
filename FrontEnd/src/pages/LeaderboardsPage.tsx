import { Leaderboard } from '../components/Leaderboard';
import './LeaderboardsPage.css';

export default function LeaderboardsPage() {
  return (
    <div className="leaderboards-page">
      <div className="leaderboards-container">
        <h1 className="leaderboards-title">🏆 Leaderboards</h1>
        <p className="leaderboards-subtitle">
          See how you stack up against other players!
        </p>
        
        <div className="leaderboards-grid">
          <Leaderboard />
        </div>
      </div>
    </div>
  );
}

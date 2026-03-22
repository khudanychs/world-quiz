import { useState } from 'react';
import { Leaderboard } from '../components/Leaderboard';
import { SEOHelmet } from '../components/SEOHelmet';
import { SEO_TRANSLATIONS, toCanonicalUrl, getSeoOgImage } from '../seo/seo-translations';
import './LeaderboardsPage.css';

type GameMode = 'flag-match' | 'cards-match';

export default function LeaderboardsPage() {
  const seo = SEO_TRANSLATIONS.routes.leaderboards;
  const [gameMode, setGameMode] = useState<GameMode>('flag-match');

  return (
    <>
      <SEOHelmet
        title={seo.title}
        description={seo.description}
        canonicalUrl={toCanonicalUrl(seo.path)}
        ogImage={getSeoOgImage(seo)}
      />
      <div className="leaderboards-page">
        <div className="leaderboards-container">
          <h1 className="leaderboards-title">🏆 Leaderboards</h1>
          <p className="leaderboards-subtitle">
            See how you stack up against other players!
          </p>
        
        {/* Game Mode Selector */}
        <div className="game-mode-selector">
          <button
            className={`mode-btn ${gameMode === 'flag-match' ? 'active' : ''}`}
            onClick={() => setGameMode('flag-match')}
          >
            🗺️ Flag Match
          </button>
          <button
            className={`mode-btn ${gameMode === 'cards-match' ? 'active' : ''}`}
            onClick={() => setGameMode('cards-match')}
          >
            🎴 Cards Match
          </button>
        </div>
        
          <div className="leaderboards-grid">
            <Leaderboard gameMode={gameMode} />
          </div>
        </div>
      </div>
    </>
  );
}

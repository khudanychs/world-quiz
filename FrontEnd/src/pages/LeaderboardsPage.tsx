import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Leaderboard } from '../components/Leaderboard';
import { SEOHelmet } from '../components/SEOHelmet';
import { SEO_TRANSLATIONS, toCanonicalUrl, getSeoOgImage } from '../seo/seo-translations';
import './LeaderboardsPage.css';

type GameMode = 'flag-match' | 'cards-match' | 'guess-country';

export default function LeaderboardsPage() {
  const { t } = useTranslation();
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
          <h1 className="leaderboards-title">🏆 {t('leaderboardsPage.title')}</h1>
          <p className="leaderboards-subtitle">
            {t('leaderboardsPage.subtitle')}
          </p>

        {/* Game Mode Selector */}
        <div className="game-mode-selector">
          <button
            className={`mode-btn ${gameMode === 'flag-match' ? 'active' : ''}`}
            onClick={() => setGameMode('flag-match')}
          >
            🗺️ {t('leaderboardsPage.mode.flagMatch')}
          </button>
          <button
            className={`mode-btn ${gameMode === 'cards-match' ? 'active' : ''}`}
            onClick={() => setGameMode('cards-match')}
          >
            🎴 {t('leaderboardsPage.mode.cardsMatch')}
          </button>
          <button
            className={`mode-btn ${gameMode === 'guess-country' ? 'active' : ''}`}
            onClick={() => setGameMode('guess-country')}
          >
            🎯 {t('leaderboardsPage.mode.guessCountry')}
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

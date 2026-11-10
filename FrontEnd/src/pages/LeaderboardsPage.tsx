import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate } from 'react-router-dom';
import { Leaderboard, type GameMode, type TimeFilter } from '../components/Leaderboard';
import { SEOHelmet } from '../components/SEOHelmet';
import { SEO_TRANSLATIONS, toCanonicalUrlWithLanguage, getSeoOgImage } from '../seo/seo-translations';
import { getBaseLanguage } from '../utils/localeRouting';
import './LeaderboardsPage.css';

export default function LeaderboardsPage() {
  const { t, i18n } = useTranslation();
  const currentLanguage = getBaseLanguage(i18n.language);
  const seo = SEO_TRANSLATIONS.routes.leaderboards;
  const location = useLocation();
  const navigate = useNavigate();
  // The URL owns the selection; reload and Back/Forward need no state syncing.
  const searchParams = new URLSearchParams(location.search);
  const requestedGame = searchParams.get('game');
  const gameMode: GameMode = requestedGame === 'cards-match' || requestedGame === 'guess-country'
    ? requestedGame : 'flag-match';
  const timeFilter: TimeFilter = searchParams.get('period') === 'all-time' ? 'allTime' : 'today';

  const updateSelection = (key: 'game' | 'period', value: string | null) => {
    const next = new URLSearchParams(searchParams);
    if (value === null) next.delete(key);
    else next.set(key, value);
    if (next.toString() !== searchParams.toString()) {
      navigate({ search: next.toString(), hash: location.hash });
    }
  };

  return (
    <>
      <SEOHelmet
        title={seo.title}
        description={seo.description}
        canonicalUrl={toCanonicalUrlWithLanguage(seo.path, currentLanguage)}
        ogImage={getSeoOgImage(seo)}
      />
      <div className="leaderboards-page">
        <div className="leaderboards-container">
          <h1 className="leaderboards-title">🏆 {t('leaderboardsPage.title')}</h1>
          <p className="leaderboards-subtitle">
            {t('leaderboardsPage.subtitle')}
          </p>

          {/* Static HTML is shared by all query variants; reveal the live selection after mount. */}
          <div style={{ visibility: window.__WORLD_QUIZ_PRERENDER__ ? 'hidden' : undefined }}>
            <div className="game-mode-selector">
              <button
                type="button"
                className={`mode-btn ${gameMode === 'flag-match' ? 'active' : ''}`}
                aria-pressed={gameMode === 'flag-match'}
                onClick={() => updateSelection('game', null)}
              >
                🗺️ {t('leaderboardsPage.mode.flagMatch')}
              </button>
              <button
                type="button"
                className={`mode-btn ${gameMode === 'cards-match' ? 'active' : ''}`}
                aria-pressed={gameMode === 'cards-match'}
                onClick={() => updateSelection('game', 'cards-match')}
              >
                🎴 {t('leaderboardsPage.mode.cardsMatch')}
              </button>
              <button
                type="button"
                className={`mode-btn ${gameMode === 'guess-country' ? 'active' : ''}`}
                aria-pressed={gameMode === 'guess-country'}
                onClick={() => updateSelection('game', 'guess-country')}
              >
                🎯 {t('leaderboardsPage.mode.guessCountry')}
              </button>
            </div>

            <div className="leaderboards-grid">
              <Leaderboard
                gameMode={gameMode}
                timeFilter={gameMode === 'guess-country' ? 'allTime' : timeFilter}
                onTimeFilterChange={filter => updateSelection('period', filter === 'allTime' ? 'all-time' : null)}
              />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

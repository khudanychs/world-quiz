import { db } from '../firebase';
import { useState, useEffect, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from "../contexts/AuthContext";
import { Link } from "react-router-dom";
import './Leaderboard.css';
import { getTodayDateString } from "../utils/dateUtils";
import { buildLocalizedPath } from '../utils/localeRouting';
import { prefetchCache, type LeaderboardEntry } from '../utils/dataPrefetch';

export type GameMode = 'flag-match' | 'cards-match' | 'guess-country';
export type TimeFilter = 'today' | 'allTime';

const CACHE_DURATION = 5 * 60 * 1000; // 5 minute cache to reduce Firebase reads

// Hook for leaderboard data - fetches top 10 with caching and prefetch support
function useLeaderboard(gameMode: GameMode, timeFilter: TimeFilter) {
  const [result, setResult] = useState({ gameMode, timeFilter, entries: [] as LeaderboardEntry[], loading: true });
  const requestVersion = useRef(0);

  const fetchLeaderboard = useCallback(async (forceRefresh = false) => {
    const version = ++requestVersion.current;
    const selection = { gameMode, timeFilter };
    // Prefetch and manual refresh share one cache, including its expiration.
    const cached = prefetchCache[gameMode][timeFilter];

    if (!forceRefresh && cached && (Date.now() - cached.timestamp) < CACHE_DURATION) {
      setResult({ ...selection, entries: cached.data, loading: false });
      return;
    }

    setResult({ ...selection, entries: [], loading: true });

    try {
      const { collection, query, orderBy, limit, getDocs, where } = await import('firebase/firestore');
      if (version !== requestVersion.current) return;

      let q;

      if (gameMode === 'flag-match') {
        // Flag Match: Query by streak
        if (timeFilter === 'today') {
          const todayDate = getTodayDateString();
          q = query(
            collection(db, "dailyStreaks"),
            where("date", "==", todayDate),
            orderBy("streak", "desc"),
            orderBy("createdAt", "asc"),
            limit(10)
          );
        } else {
          q = query(
            collection(db, "streaks"),
            orderBy("streak", "desc"),
            orderBy("createdAt", "asc"),
            limit(10)
          );
        }
      } else if (gameMode === 'cards-match') {
        // Cards Match: Query by score
        if (timeFilter === 'today') {
          const todayDate = getTodayDateString();
          q = query(
            collection(db, "dailyCardsMatchScores"),
            where("date", "==", todayDate),
            orderBy("score", "desc"),
            orderBy("createdAt", "asc"),
            limit(10)
          );
        } else {
          q = query(
            collection(db, "cardsMatchScores"),
            orderBy("score", "desc"),
            orderBy("createdAt", "asc"),
            limit(10)
          );
        }
      } else {
        // Guess Country: Query by countries guessed (all-time only)
        q = query(
          collection(db, "guessCountryStats"),
          orderBy("countriesGuessed", "desc"),
          orderBy("createdAt", "asc"),
          limit(10)
        );
      }

      const snapshot = await getDocs(q);
      if (version !== requestVersion.current) return;
      const topEntries = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as LeaderboardEntry[];

      prefetchCache[gameMode][timeFilter] = { data: topEntries, timestamp: Date.now() };
      setResult({ ...selection, entries: topEntries, loading: false });
    } catch (error) {
      if (version !== requestVersion.current) return;
      console.error("Error fetching leaderboard: ", error);
      // On quota exceeded or network error, use cached data if available (even if expired)
      setResult({ ...selection, entries: prefetchCache[gameMode][timeFilter]?.data ?? [], loading: false });
    }
  }, [gameMode, timeFilter]);

  useEffect(() => {
    fetchLeaderboard();

    // Auto-refresh every 10 minutes (force refresh to bypass cache) - optimized for Firebase free tier
    const interval = setInterval(() => fetchLeaderboard(true), 10 * 60 * 1000);
    return () => {
      requestVersion.current++;
      clearInterval(interval);
    };
  }, [fetchLeaderboard]);

  // Effects run after paint; never render the previous selection's rows in that gap.
  const isCurrentSelection = result.gameMode === gameMode && result.timeFilter === timeFilter;
  return {
    entries: isCurrentSelection ? result.entries : [],
    loading: !isCurrentSelection || result.loading,
    refetch: () => fetchLeaderboard(true),
  };
}

// Refresh cooldown in milliseconds (60 seconds) - optimized for Firebase free tier
const REFRESH_COOLDOWN = 60 * 1000;

interface LeaderboardProps {
  gameMode: GameMode;
  timeFilter: TimeFilter;
  onTimeFilterChange: (filter: TimeFilter) => void;
}

export function Leaderboard({ gameMode, timeFilter, onTimeFilterChange }: LeaderboardProps) {
  const { t, i18n } = useTranslation();
  const { entries, loading, refetch } = useLeaderboard(gameMode, timeFilter);
  const { user, loading: authLoading } = useAuth();
  
  // Refresh button cooldown state
  const [lastRefresh, setLastRefresh] = useState(0);
  const [cooldownRemaining, setCooldownRemaining] = useState(0);

  // Update cooldown timer
  useEffect(() => {
    if (cooldownRemaining <= 0) return;
    
    const timer = setInterval(() => {
      const remaining = Math.max(0, REFRESH_COOLDOWN - (Date.now() - lastRefresh));
      setCooldownRemaining(remaining);
    }, 1000);
    
    return () => clearInterval(timer);
  }, [lastRefresh, cooldownRemaining]);

  const handleRefresh = () => {
    const now = Date.now();
    if (now - lastRefresh < REFRESH_COOLDOWN) return;
    
    setLastRefresh(now);
    setCooldownRemaining(REFRESH_COOLDOWN);
    refetch();
  };

  // Static HTML cannot know the visitor's session; keep its auth UI neutral.
  const isGuest = !authLoading && !window.__WORLD_QUIZ_PRERENDER__ && !user;
  const isOnCooldown = cooldownRemaining > 0;

  const title = gameMode === 'flag-match'
    ? t('leaderboard.titles.flagMatch')
    : gameMode === 'cards-match'
    ? t('leaderboard.titles.cardsMatch')
    : t('leaderboard.titles.guessCountry');

  // Hide time filter for guess-country (all-time only)
  const showTimeFilter = gameMode !== 'guess-country';

  return (
    <div className="leaderboard-card">
      <div className="leaderboard-header">
        <h3 className="leaderboard-title">{title}</h3>
        <button
          className={`refresh-btn ${isOnCooldown ? 'on-cooldown' : ''} ${loading ? 'loading' : ''}`}
          onClick={handleRefresh}
          disabled={isOnCooldown || loading}
          title={isOnCooldown ? t('leaderboard.waitSeconds', { count: Math.ceil(cooldownRemaining / 1000) }) : t('leaderboard.refresh')}
        >
          {isOnCooldown ? (
            `${Math.ceil(cooldownRemaining / 1000)}s`
          ) : (
            <svg
              className="refresh-icon"
              width="18"
              height="18"
              viewBox="0 0 32 32"
              fill="currentColor"
            >
              <path d="M26.631,4H31.5C31.776,4,32,3.776,32,3.5S31.776,3,31.5,3h-6C25.224,3,25,3.224,25,3.5v6c0,0.276,0.224,0.5,0.5,0.5S26,9.776,26,9.5V4.783l0.611,0.611c2.833,2.833,4.394,6.6,4.394,10.606s-1.561,7.773-4.394,10.606c-4.205,4.206-10.504,5.532-16.051,3.375c-0.257-0.102-0.547,0.027-0.647,0.284c-0.1,0.258,0.027,0.548,0.285,0.647c1.884,0.732,3.848,1.088,5.797,1.088c4.17,0,8.266-1.63,11.323-4.688c3.022-3.021,4.687-7.04,4.687-11.313S30.34,7.708,27.318,4.687L26.631,4z"/>
              <path d="M6.5,22C6.224,22,6,22.224,6,22.5v4.84l-0.713-0.713c-2.833-2.833-4.394-6.6-4.394-10.606S2.454,8.247,5.287,5.414c4.135-4.136,10.351-5.495,15.836-3.456c0.256,0.096,0.546-0.035,0.643-0.295c0.096-0.259-0.036-0.547-0.295-0.643C15.622-1.152,8.991,0.295,4.58,4.707c-3.022,3.021-4.687,7.04-4.687,11.313s1.665,8.292,4.687,11.313L5.246,28H0.5C0.224,28,0,28.224,0,28.5S0.224,29,0.5,29h5.856c0.04,0.01,0.376-0.025,0.474-0.123c0.004-0.004,0.005-0.009,0.009-0.013C6.937,28.772,7,28.645,7,28.5v-6C7,22.224,6.776,22,6.5,22z"/>
            </svg>
          )}
        </button>
      </div>

      {/* Time filter toggle - only show for flag-match and cards-match */}
      {showTimeFilter && (
        <div className="leaderboard-toggle">
          <button
            type="button"
            className={`toggle-btn ${timeFilter === 'today' ? 'active' : ''}`}
            aria-pressed={timeFilter === 'today'}
            onClick={() => onTimeFilterChange('today')}
          >
            {t('leaderboard.today')}
          </button>
          <button
            type="button"
            className={`toggle-btn ${timeFilter === 'allTime' ? 'active' : ''}`}
            aria-pressed={timeFilter === 'allTime'}
            onClick={() => onTimeFilterChange('allTime')}
          >
            {t('leaderboard.allTime')}
          </button>
        </div>
      )}

      {loading ? (
        <div className="loader">{t('leaderboard.loading')}</div>
      ) : entries.length === 0 ? (
        <p className="no-scores">{t(gameMode === 'guess-country' ? 'leaderboard.empty.guessCountry' : gameMode === 'flag-match' ? 'leaderboard.empty.flagMatch' : 'leaderboard.empty.cardsMatch')}</p>
      ) : (
        <ol className="leaderboard-list">
          {entries.map((entry, index) => (
            <li
              key={entry.id}
              className={`leaderboard-item ${user?.uid === entry.userId ? 'current-user' : ''}`}
            >
              <span className={`leaderboard-rank ${index < 3 ? `rank-${index + 1}` : ''}`}>
                {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}.`}
              </span>
              <span className="leaderboard-name">{entry.username || t('leaderboard.anonymous')}</span>
              {gameMode === 'flag-match' ? (
                <span className="leaderboard-streak">
                  <span className="streak-fire">🔥</span>
                  {entry.streak || 0}
                </span>
              ) : gameMode === 'cards-match' ? (
                <span className="leaderboard-score">
                  <span className="score-icon">💎</span>
                  {(entry.score || 0).toLocaleString()}
                </span>
              ) : (
                <span className="leaderboard-score">
                  <span className="score-icon">🌍</span>
                  {entry.countriesGuessed || 0}
                </span>
              )}
            </li>
          ))}
        </ol>
      )}

      {/* Guest CTA */}
      {isGuest && (
        <div className="guest-cta">
          <p>{t('leaderboard.guestCta')}</p>
          <Link
            className="cta-button"
            to={`${buildLocalizedPath('/auth', i18n.language)}?mode=register`}
          >
            {t('leaderboard.joinNow')}
          </Link>
        </div>
      )}
    </div>
  );
}

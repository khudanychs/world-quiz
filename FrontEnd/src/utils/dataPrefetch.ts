/**
 * Data Prefetching Module
 *
 * This module initiates public Firestore queries immediately when the JS bundle loads,
 * in parallel with Firebase Auth initialization. This eliminates the execution waterfall
 * where data fetching only starts after Auth resolves and components mount.
 *
 * The prefetched data is stored in a shared cache that the Leaderboard component
 * can access, so by the time the UI renders, the data is already available.
 */

import { getTodayDateString } from './dateUtils';

// Shared cache structure that matches Leaderboard component's cache
export interface LeaderboardEntry {
  id: string;
  userId: string;
  username: string;
  streak?: number;
  score?: number;
  countriesGuessed?: number;
}

interface CacheEntry {
  data: LeaderboardEntry[];
  timestamp: number;
}

type GameMode = 'flag-match' | 'cards-match' | 'guess-country';
type TimeFilter = 'today' | 'allTime';

// Global cache that will be shared with the Leaderboard component
export const prefetchCache: {
  [gameMode: string]: {
    [timeFilter: string]: CacheEntry | null;
  };
} = {
  'flag-match': { today: null, allTime: null },
  'cards-match': { today: null, allTime: null },
  'guess-country': { today: null, allTime: null },
};

// Track prefetch status
const prefetchStatus: {
  [key: string]: 'pending' | 'success' | 'error';
} = {};

/**
 * Prefetch a single leaderboard query
 */
async function prefetchLeaderboard(gameMode: GameMode, timeFilter: TimeFilter): Promise<void> {
  const cacheKey = `${gameMode}-${timeFilter}`;
  prefetchStatus[cacheKey] = 'pending';

  try {
    // Dynamically import Firebase modules (same pattern as Leaderboard component)
    const [{ collection, query, orderBy, limit, getDocs, where }, { db }] = await Promise.all([
      import('firebase/firestore'),
      import('../firebase'),
    ]);

    let q;

    if (gameMode === 'flag-match') {
      // Flag Match: Query by streak
      if (timeFilter === 'today') {
        const todayDate = getTodayDateString();
        q = query(
          collection(db, 'dailyStreaks'),
          where('date', '==', todayDate),
          orderBy('streak', 'desc'),
          orderBy('createdAt', 'asc'),
          limit(10)
        );
      } else {
        q = query(
          collection(db, 'streaks'),
          orderBy('streak', 'desc'),
          orderBy('createdAt', 'asc'),
          limit(10)
        );
      }
    } else if (gameMode === 'cards-match') {
      // Cards Match: Query by score
      if (timeFilter === 'today') {
        const todayDate = getTodayDateString();
        q = query(
          collection(db, 'dailyCardsMatchScores'),
          where('date', '==', todayDate),
          orderBy('score', 'desc'),
          orderBy('createdAt', 'asc'),
          limit(10)
        );
      } else {
        q = query(
          collection(db, 'cardsMatchScores'),
          orderBy('score', 'desc'),
          orderBy('createdAt', 'asc'),
          limit(10)
        );
      }
    } else {
      // Guess Country: Query by countries guessed (all-time only)
      q = query(
        collection(db, 'guessCountryStats'),
        orderBy('countriesGuessed', 'desc'),
        orderBy('createdAt', 'asc'),
        limit(10)
      );
    }

    const snapshot = await getDocs(q);
    const entries = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as LeaderboardEntry[];

    // Store in cache
    prefetchCache[gameMode][timeFilter] = {
      data: entries,
      timestamp: Date.now(),
    };

    prefetchStatus[cacheKey] = 'success';
  } catch (error) {
    console.error(`Prefetch error for ${cacheKey}:`, error);
    prefetchStatus[cacheKey] = 'error';
  }
}

/**
 * Start prefetching all public leaderboard data
 * This runs immediately when the module is imported
 */
export function startPrefetch(): void {
  // Prefetch all leaderboard combinations in parallel
  // These are the most commonly accessed queries on the leaderboards page
  Promise.all([
    // Flag Match (most popular game)
    prefetchLeaderboard('flag-match', 'today'),
    prefetchLeaderboard('flag-match', 'allTime'),
    // Cards Match
    prefetchLeaderboard('cards-match', 'today'),
    prefetchLeaderboard('cards-match', 'allTime'),
    // Guess Country (all-time only)
    prefetchLeaderboard('guess-country', 'allTime'),
  ]).catch(err => {
    // Silent fail - components will fetch again if prefetch failed
    console.warn('Some prefetch queries failed:', err);
  });
}

/**
 * Get prefetched data from cache if available
 * Returns null if data hasn't been prefetched yet
 */
export function getPrefetchedData(
  gameMode: GameMode,
  timeFilter: TimeFilter
): CacheEntry | null {
  return prefetchCache[gameMode][timeFilter];
}

/**
 * Check if a specific query has been prefetched
 */
export function isPrefetched(gameMode: GameMode, timeFilter: TimeFilter): boolean {
  const cacheKey = `${gameMode}-${timeFilter}`;
  return prefetchStatus[cacheKey] === 'success';
}

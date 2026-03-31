/**
 * Intent-Based Data Prefetching
 *
 * Initiates public Firestore leaderboard queries in parallel with Firebase Auth initialization,
 * eliminating the typical auth → mount → fetch waterfall. By the time users navigate to
 * the leaderboards page, the data is already cached and ready to display.
 * 
 * Architecture: Shared cache accessible by Leaderboard components, populated on bundle load.
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

export const prefetchCache: {
  [gameMode: string]: {
    [timeFilter: string]: CacheEntry | null;
  };
} = {
  'flag-match': { today: null, allTime: null },
  'cards-match': { today: null, allTime: null },
  'guess-country': { today: null, allTime: null },
};

const prefetchStatus: {
  [key: string]: 'pending' | 'success' | 'error';
} = {};
async function prefetchLeaderboard(gameMode: GameMode, timeFilter: TimeFilter): Promise<void> {
  const cacheKey = `${gameMode}-${timeFilter}`;
  prefetchStatus[cacheKey] = 'pending';

  try {
    const [{ collection, query, orderBy, limit, getDocs, where }, { db }] = await Promise.all([
      import('firebase/firestore'),
      import('../firebase'),
    ]);

    let q;

    if (gameMode === 'flag-match') {
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

    prefetchCache[gameMode][timeFilter] = {
      data: entries,
      timestamp: Date.now(),
    };

    prefetchStatus[cacheKey] = 'success';
  } catch (error) {
     prefetchStatus[cacheKey] = 'error';
  }
}

export function startPrefetch(): void {
  Promise.all([
    prefetchLeaderboard('flag-match', 'today'),
    prefetchLeaderboard('flag-match', 'allTime'),
    prefetchLeaderboard('cards-match', 'today'),
    prefetchLeaderboard('cards-match', 'allTime'),
    prefetchLeaderboard('guess-country', 'allTime'),
  ]).catch(err => {
    // Prefetch failed, data will be loaded on demand
  });
}
export function getPrefetchedData(gameMode: GameMode, timeFilter: TimeFilter): CacheEntry | null {
  return prefetchCache[gameMode][timeFilter];
}

export function isPrefetched(gameMode: GameMode, timeFilter: TimeFilter): boolean {
  const cacheKey = `${gameMode}-${timeFilter}`;
  return prefetchStatus[cacheKey] === 'success';
}

import { useState, useEffect, useCallback } from 'react';
import { collection, query, orderBy, limit, getDocs, where } from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import './Leaderboard.css';

// Get today's date string in UTC (YYYY-MM-DD format)
function getTodayDateString(): string {
  const now = new Date();
  const year = now.getUTCFullYear();
  const month = String(now.getUTCMonth() + 1).padStart(2, '0');
  const day = String(now.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Define the structure of a streak document
interface StreakEntry {
  id: string;
  userId: string;
  username: string;
  streak: number;
}

// Cache for streaks data (prevents excessive reads on filter switching)
const streaksCache: {
  today: { data: StreakEntry[]; timestamp: number } | null;
  allTime: { data: StreakEntry[]; timestamp: number } | null;
} = {
  today: null,
  allTime: null
};

const CACHE_DURATION = 60 * 1000; // 1 minute cache

// Hook for streaks - fetches top 10 best streaks with caching
function useStreaks(timeFilter: 'today' | 'allTime') {
  const [streaks, setStreaks] = useState<StreakEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchStreaks = useCallback(async (forceRefresh = false) => {
    // Check cache first (unless force refresh)
    const cached = streaksCache[timeFilter];
    const now = Date.now();
    
    if (!forceRefresh && cached && (now - cached.timestamp) < CACHE_DURATION) {
      setStreaks(cached.data);
      setLoading(false);
      return;
    }
    
    setLoading(true);
    
    try {
      // Build query based on time filter
      let q;
      if (timeFilter === 'today') {
        // Query dailyStreaks collection filtered by today's date
        const todayDate = getTodayDateString();
        q = query(
          collection(db, "dailyStreaks"),
          where("date", "==", todayDate),
          orderBy("streak", "desc"),
          limit(10)
        );
      } else {
        // All time - query streaks collection sorted by streak
        q = query(
          collection(db, "streaks"),
          orderBy("streak", "desc"),
          limit(10)
        );
      }

      const snapshot = await getDocs(q);
      const topStreaks = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as StreakEntry));

      // Update cache
      streaksCache[timeFilter] = { data: topStreaks, timestamp: now };
      
      setStreaks(topStreaks);
    } catch (error) {
      console.error("Error fetching streaks: ", error);
    } finally {
      setLoading(false);
    }
  }, [timeFilter]);

  useEffect(() => {
    fetchStreaks();
    
    // Auto-refresh every 5 minutes (force refresh to bypass cache)
    const interval = setInterval(() => fetchStreaks(true), 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchStreaks]);

  return { streaks, loading, refetch: () => fetchStreaks(true) };
}

// Refresh cooldown in milliseconds (30 seconds)
const REFRESH_COOLDOWN = 30 * 1000;

export function Leaderboard() {
  const [timeFilter, setTimeFilter] = useState<'today' | 'allTime'>('today');
  const { streaks, loading, refetch } = useStreaks(timeFilter);
  const { user } = useAuth();
  const navigate = useNavigate();
  
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

  // Check if user is a guest (not logged in)
  const isGuest = !user;
  const isOnCooldown = cooldownRemaining > 0;

  return (
    <div className="leaderboard-card">
      <div className="leaderboard-header">
        <h3 className="leaderboard-title">🔥 Top Streaks</h3>
        <button 
          className={`refresh-btn ${isOnCooldown ? 'on-cooldown' : ''} ${loading ? 'loading' : ''}`}
          onClick={handleRefresh}
          disabled={isOnCooldown || loading}
          title={isOnCooldown ? `Wait ${Math.ceil(cooldownRemaining / 1000)}s` : 'Refresh'}
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
      
      {/* Time filter toggle */}
      <div className="leaderboard-toggle">
        <button 
          className={`toggle-btn ${timeFilter === 'today' ? 'active' : ''}`}
          onClick={() => setTimeFilter('today')}
        >
          Today
        </button>
        <button 
          className={`toggle-btn ${timeFilter === 'allTime' ? 'active' : ''}`}
          onClick={() => setTimeFilter('allTime')}
        >
          All Time
        </button>
      </div>

      {loading ? (
        <div className="loader">Loading...</div>
      ) : streaks.length === 0 ? (
        <p className="no-scores">No streaks yet. Be the first!</p>
      ) : (
        <ol className="leaderboard-list">
          {streaks.map((entry, index) => (
            <li 
              key={entry.id} 
              className={`leaderboard-item ${user?.uid === entry.userId ? 'current-user' : ''}`}
            >
              <span className={`leaderboard-rank ${index < 3 ? `rank-${index + 1}` : ''}`}>
                {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}.`}
              </span>
              <span className="leaderboard-name">{entry.username || 'Anonymous'}</span>
              <span className="leaderboard-streak">
                <span className="streak-fire">🔥</span>
                {entry.streak}
              </span>
            </li>
          ))}
        </ol>
      )}

      {/* Guest CTA */}
      {isGuest && (
        <div className="guest-cta">
          <p>Create an account to appear on the leaderboard!</p>
          <button 
            className="cta-button"
            onClick={() => navigate('/auth?mode=register')}
          >
            Join Now
          </button>
        </div>
      )}
    </div>
  );
}

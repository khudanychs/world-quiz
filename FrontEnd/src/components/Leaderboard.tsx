import { useState, useEffect } from 'react';
import { collection, query, orderBy, limit, onSnapshot, where } from "firebase/firestore";
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

// Hook for live streaks - returns top 10 best streaks
function useLiveStreaks(timeFilter: 'today' | 'allTime') {
  const [streaks, setStreaks] = useState<StreakEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    
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

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const topStreaks = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as StreakEntry));

      setStreaks(topStreaks);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching live streaks: ", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [timeFilter]);

  return { streaks, loading };
}

export function Leaderboard() {
  const [timeFilter, setTimeFilter] = useState<'today' | 'allTime'>('today');
  const { streaks, loading } = useLiveStreaks(timeFilter);
  const { user } = useAuth();
  const navigate = useNavigate();

  // Check if user is a guest (not logged in)
  const isGuest = !user;

  return (
    <div className="leaderboard-card">
      <h3 className="leaderboard-title">🔥 Top Streaks</h3>
      
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

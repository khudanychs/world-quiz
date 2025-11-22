import { useState, useEffect } from 'react';
import { collection, query, orderBy, limit, onSnapshot } from "firebase/firestore";
import { db } from "../firebase";
import './Leaderboard.css';

// Define the structure of a score document
interface Score {
  username: string;
  score: number;
  bestStreak: number;
  createdAt: {
    toDate: () => Date;
  };
}

// Hook for live scores
function useLiveScores() {
  const [scores, setScores] = useState<Score[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, "scores"), orderBy("score", "desc"), limit(10));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const newScores = snapshot.docs.map(doc => doc.data() as Score);
      setScores(newScores);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching live scores: ", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return { scores, loading };
}

export function Leaderboard() {
  const { scores, loading } = useLiveScores();

  return (
    <div className="leaderboard-card">
      <h3 className="leaderboard-title">🏆 Top 10 Scores</h3>
      {loading ? (
        <div className="loader">Loading...</div>
      ) : scores.length === 0 ? (
        <p className="no-scores">No scores yet. Be the first!</p>
      ) : (
        <ol className="leaderboard-list">
          {scores.map((score, index) => (
            <li key={index} className="leaderboard-item">
              <span className="leaderboard-rank">{index + 1}.</span>
              <span className="leaderboard-name">{score.username || 'Anonymous'}</span>
              <span className="leaderboard-score">{score.score} pts</span>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}

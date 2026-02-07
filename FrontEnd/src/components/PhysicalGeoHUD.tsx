import { CATEGORY_INFO, type PhysicalFeature } from "../utils/physicalFeatures";
import { GREEN_BUTTON_STYLE, GREEN_BUTTON_HOVER } from "../utils/sharedStyles";

interface PhysicalGeoHUDProps {
  loading: boolean;
  gameOver: boolean;
  hasWon: boolean;
  score: number;
  bestStreak: number;
  skippedCount: number;
  currentFeature: PhysicalFeature | undefined;
  currentIdx: number;
  featuresLength: number;
  currentStreak: number;
  showingResult: boolean;
  lastResult: { clickedName: string; correct: boolean } | null;
  onStartNewGame: () => void;
  onSkip: () => void;
  isPortrait: boolean;
}

export default function PhysicalGeoHUD({
  loading,
  gameOver,
  hasWon,
  score,
  bestStreak,
  skippedCount,
  currentFeature,
  currentIdx,
  featuresLength,
  currentStreak,
  showingResult,
  lastResult,
  onStartNewGame,
  onSkip,
}: PhysicalGeoHUDProps) {
  if (loading) {
    return <span style={{ fontSize: "clamp(12px, 2.8vw, 16px)" }}>Loading…</span>;
  }

  if (gameOver) {
    const isPerfectStreak = bestStreak === featuresLength;
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12, padding: "8px 0" }}>
        {hasWon && isPerfectStreak ? (
          <>
            <strong style={{ fontSize: "clamp(16px, 3.5vw, 24px)", color: "#fbbf24" }}>🏆 LEGENDARY! 🏆</strong>
            <span style={{ opacity: 0.9, fontSize: "clamp(14px, 3vw, 18px)" }}>
              {featuresLength} features, perfect streak! Geography master! 🌍👑
            </span>
          </>
        ) : hasWon ? (
          <>
            <strong style={{ fontSize: "clamp(16px, 3.5vw, 24px)", color: "#10b981" }}>🎉 Well Done! 🎉</strong>
            <span style={{ opacity: 0.9, fontSize: "clamp(14px, 3vw, 18px)" }}>
              Located {score}/{featuresLength} features!
            </span>
            {bestStreak > 0 && (
              <span style={{ opacity: 0.8, fontSize: "clamp(12px, 2.8vw, 16px)" }}>Best streak: {bestStreak} 🔥</span>
            )}
          </>
        ) : (
          <>
            <strong style={{ fontSize: "clamp(14px, 3.2vw, 20px)" }}>Round finished</strong>
            <span style={{ opacity: 0.8, fontSize: "clamp(12px, 2.8vw, 16px)" }}>
              Located: {score}/{featuresLength} {skippedCount > 0 && `(${skippedCount} skipped)`}
            </span>
            {bestStreak > 0 && (
              <span style={{ opacity: 0.8, fontSize: "clamp(11px, 2.6vw, 14px)" }}>Best streak: {bestStreak} 🔥</span>
            )}
          </>
        )}
        <button onClick={onStartNewGame} style={{ ...GREEN_BUTTON_STYLE, marginTop: 4 }} {...GREEN_BUTTON_HOVER}>
          🎮 New Game
        </button>
      </div>
    );
  }

  if (!currentFeature) {
    return <span style={{ fontSize: "clamp(12px, 2.8vw, 16px)" }}>Loading…</span>;
  }

  const catInfo = CATEGORY_INFO[currentFeature.type];

  // Result feedback
  if (showingResult && lastResult) {
    return (
      <>
        <strong
          style={{
            fontSize: "clamp(14px, 3vw, 20px)",
            color: lastResult.correct ? "#10b981" : "#ef4444",
            minWidth: "clamp(90px, 22vw, 140px)",
            textAlign: "center",
          }}
        >
          {lastResult.correct ? "✓ Correct!" : "✗ Wrong!"}
        </strong>
        {!lastResult.correct && (
          <span style={{ fontSize: "clamp(10px, 2.2vw, 13px)", opacity: 0.7 }}>
            You clicked: {lastResult.clickedName}
          </span>
        )}
        <span style={{ opacity: 0.8, fontSize: "clamp(10px, 2.4vw, 14px)", whiteSpace: "nowrap" }}>
          {currentIdx + 1}/{featuresLength}
        </span>
        <span
          style={{
            marginLeft: 4, padding: "4px 8px", borderRadius: 6,
            background: "rgba(59,130,246,0.18)", border: "1px solid rgba(59,130,246,0.35)",
            fontSize: "clamp(12px, 2.8vw, 17px)", fontWeight: 600, color: "#60a5fa", whiteSpace: "nowrap",
          }}
        >
          Score: {score}/{featuresLength}
        </span>
      </>
    );
  }

  // Normal: show feature name to find
  return (
    <>
      <div style={{ display: "flex", alignItems: "center", gap: "clamp(6px, 1.5vw, 10px)", flexShrink: 0 }}>
        <span style={{ fontSize: "clamp(24px, 5vw, 40px)" }}>{catInfo.emoji}</span>
        <div style={{ display: "flex", flexDirection: "column", minWidth: "clamp(100px, 24vw, 180px)" }}>
          <strong style={{ fontSize: "clamp(13px, 2.8vw, 18px)", lineHeight: 1.2 }}>
            {currentFeature.name}
          </strong>
          <span style={{ opacity: 0.6, fontSize: "clamp(9px, 2vw, 12px)" }}>
            {catInfo.label} — click it on the map
          </span>
        </div>
      </div>
      <span style={{ marginLeft: 4, opacity: 0.8, fontSize: "clamp(10px, 2.4vw, 14px)", whiteSpace: "nowrap" }}>
        {currentIdx + 1}/{featuresLength}
      </span>
      {currentStreak >= 3 && (
        <span
          style={{
            marginLeft: 4, padding: "4px 8px", borderRadius: 6,
            background: "rgba(251,146,60,0.2)", border: "1px solid rgba(251,146,60,0.4)",
            color: "#fb923c", fontSize: "clamp(10px, 2.4vw, 13px)", fontWeight: 600, whiteSpace: "nowrap",
          }}
        >
          🔥 {currentStreak}
        </span>
      )}
      <button
        onClick={onSkip}
        title="Skip this feature"
        style={{
          marginLeft: 4,
          padding: "clamp(4px, 1.5vw, 6px) clamp(8px, 2vw, 10px)",
          minWidth: "clamp(50px, 14vw, 60px)",
          borderRadius: "clamp(6px, 1.8vw, 8px)",
          border: "1px solid rgba(234,179,8,0.4)",
          background: "rgba(234,179,8,0.15)",
          color: "#eab308",
          fontSize: "clamp(10px, 2.4vw, 13px)",
          cursor: "pointer",
          fontWeight: 500,
        }}
      >
        Skip
      </button>
      <span
        style={{
          marginLeft: 4, padding: "clamp(4px, 1.5vw, 6px) clamp(10px, 2.4vw, 14px)",
          borderRadius: "clamp(6px, 1.8vw, 8px)",
          background: "rgba(59,130,246,0.18)", border: "1px solid rgba(59,130,246,0.35)",
          fontSize: "clamp(12px, 2.8vw, 17px)", fontWeight: 600, color: "#60a5fa", whiteSpace: "nowrap",
        }}
      >
        Score: {score}/{featuresLength}
      </span>
    </>
  );
}

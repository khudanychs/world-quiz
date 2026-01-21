import { GREEN_BUTTON_STYLE, GREEN_BUTTON_HOVER } from "../utils/sharedStyles";

interface GameHUDProps {
  loading: boolean;
  loadError: string;
  gameOver: boolean;
  hasWon: boolean;
  score: number;
  bestStreak: number;
  skippedCount: number;
  currentTarget: { name: string; cca2: string; flag: string } | undefined;
  currentIdx: number;
  targetsLength: number;
  currentStreak: number;
  showNamePanel: boolean;
  onStartNewGame: () => void;
  onToggleNamePanel: () => void;
  onSkip: () => void;
  isPortrait: boolean;
}

export default function GameHUD({
  loading,
  loadError,
  gameOver,
  hasWon,
  score,
  bestStreak,
  skippedCount,
  currentTarget,
  currentIdx,
  targetsLength,
  currentStreak,
  showNamePanel,
  onStartNewGame,
  onToggleNamePanel,
  onSkip,
  isPortrait,
}: GameHUDProps) {
  if (loading) {
    return (
      <span style={{ fontSize: "clamp(12px, 2.8vw, 16px)" }}>Loading flags…</span>
    );
  }

  if (loadError) {
    return (
      <span style={{ fontSize: "clamp(12px, 2.8vw, 16px)" }}>Error: {loadError}</span>
    );
  }

  if (gameOver) {
    const isPerfectStreak = bestStreak === targetsLength;
    
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12, padding: "8px 0" }}>
        {hasWon && isPerfectStreak ? (
          <>
            <strong style={{ fontSize: "clamp(16px, 3.5vw, 24px)", color: "#fbbf24" }}>🏆 LEGENDARY! 🏆</strong>
            <span style={{ opacity: 0.9, fontSize: "clamp(14px, 3vw, 18px)" }}>
              {targetsLength} flags, perfect streak! You're a geography god! 🌍👑
            </span>
          </>
        ) : hasWon ? (
          <>
            <strong style={{ fontSize: "clamp(16px, 3.5vw, 24px)", color: "#10b981" }}>🎉 Perfect Score! 🎉</strong>
            <span style={{ opacity: 0.9, fontSize: "clamp(14px, 3vw, 18px)" }}>
              All {score} flags matched!
            </span>
            <span style={{ opacity: 0.8, fontSize: "clamp(12px, 2.8vw, 16px)" }}>
              Best streak: {bestStreak} 🔥
            </span>
          </>
        ) : (
          <>
            <strong style={{ fontSize: "clamp(14px, 3.2vw, 20px)" }}>Round finished</strong>
            <span style={{ opacity: 0.8, fontSize: "clamp(12px, 2.8vw, 16px)" }}>
              Matched: {score}/{targetsLength} {skippedCount > 0 && `(${skippedCount} skipped)`}
            </span>
            {bestStreak > 0 && (
              <span style={{ opacity: 0.8, fontSize: "clamp(11px, 2.6vw, 14px)" }}>
                Best streak: {bestStreak} 🔥
              </span>
            )}
          </>
        )}
        <button
          onClick={onStartNewGame}
          style={{ ...GREEN_BUTTON_STYLE, marginTop: 4 }}
          {...GREEN_BUTTON_HOVER}
        >
          🎮 New Game
        </button>
      </div>
    );
  }

  if (!currentTarget) {
    return (
      <button
        onClick={onStartNewGame}
        style={{
          padding: "clamp(8px, 2vw, 12px) clamp(16px, 4vw, 20px)",
          borderRadius: "clamp(8px, 2vw, 10px)",
          border: "1px solid rgba(255,255,255,0.3)",
          background: "rgba(255,255,255,0.08)",
          color: "#fff",
          fontSize: "clamp(13px, 3vw, 16px)",
          cursor: "pointer",
        }}
      >
        Start round
      </button>
    );
  }
  
  return (
    <>
      {/* Flag - SVG has correct aspect ratio built-in */}
      <img
        src={currentTarget.flag}
        alt="Flag to match"
        style={{
          height: "clamp(44px, 10vw, 70px)",
          borderRadius: 2,
          boxShadow: "0 2px 6px rgba(0,0,0,0.4)",
          flexShrink: 0,
          objectFit: "contain",
        }}
      />
      <div style={{ display: "flex", flexDirection: "column", minWidth: "clamp(100px, 24vw, 150px)" }}>
        <strong style={{ fontSize: "clamp(12px, 2.6vw, 18px)" }}>Find this flag</strong>
        <span style={{ opacity: 0.7, fontSize: "clamp(9px, 2.2vw, 13px)" }}>Tap country</span>
      </div>
      <span style={{ marginLeft: 4, opacity: 0.8, fontSize: "clamp(10px, 2.4vw, 14px)", whiteSpace: "nowrap" }}>
        {currentIdx + 1}/{targetsLength}
      </span>
      {currentStreak >= 3 && (
        <span
          style={{
            marginLeft: 4,
            padding: "4px 8px",
            borderRadius: 6,
            background: "rgba(251, 146, 60, 0.2)",
            border: "1px solid rgba(251, 146, 60, 0.4)",
            color: "#fb923c",
            fontSize: "clamp(10px, 2.4vw, 13px)",
            fontWeight: 600,
            whiteSpace: "nowrap",
          }}
        >
          🔥 {currentStreak}
        </span>
      )}
      <button
        onClick={onToggleNamePanel}
        title="Show current flag's name"
        style={{
          marginLeft: 4,
          padding: "clamp(4px, 1.5vw, 6px) clamp(8px, 2vw, 10px)",
          minWidth: "clamp(70px, 18vw, 84px)",
          borderRadius: "clamp(6px, 1.8vw, 8px)",
          border: "1px solid rgba(255,255,255,0.3)",
          background: "rgba(255,255,255,0.08)",
          color: "#fff",
          fontSize: "clamp(10px, 2.4vw, 13px)",
          cursor: "pointer",
        }}
      >
        {showNamePanel ? "Hide name" : "Show name"}
      </button>
      <button
        onClick={onSkip}
        title="Skip this flag"
        style={{
          marginLeft: 4,
          padding: "clamp(4px, 1.5vw, 6px) clamp(8px, 2vw, 10px)",
          minWidth: "clamp(50px, 14vw, 60px)",
          borderRadius: "clamp(6px, 1.8vw, 8px)",
          border: "1px solid rgba(234, 179, 8, 0.4)",
          background: "rgba(234, 179, 8, 0.15)",
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
          marginLeft: 4,
          padding: "clamp(4px, 1.5vw, 6px) clamp(10px, 2.4vw, 14px)",
          borderRadius: "clamp(6px, 1.8vw, 8px)",
          background: "rgba(59, 130, 246, 0.18)",
          border: "1px solid rgba(59, 130, 246, 0.35)",
          fontSize: "clamp(12px, 2.8vw, 17px)",
          fontWeight: 600,
          color: "#60a5fa",
          whiteSpace: "nowrap",
        }}
      >
        Score: {score}/{targetsLength}
      </span>
    </>
  );
}

import React from "react";
import { GREEN_BUTTON_STYLE, GREEN_BUTTON_HOVER } from "../../utils/sharedStyles";

export interface HUDGameOverProps {
  hasWon: boolean;
  score: number;
  total: number;
  bestStreak: number;
  skippedCount: number;
  onStartNewGame: () => void;
  legendaryTitle: string;
  legendaryMessage: string;
  perfectTitle: string;
  perfectMessage: string;
  roundFinishedTitle: string;
  summaryMessage: string;
  skippedLabel?: string;
  bestStreakLabel?: (streak: number) => string;
  newGameLabel?: string;
}

/**
 * Shared game-over victory and summary screen inside the HUD.
 */
export const HUDGameOver: React.FC<HUDGameOverProps> = ({
  hasWon,
  score: _score,
  total,
  bestStreak,
  skippedCount,
  onStartNewGame,
  legendaryTitle,
  legendaryMessage,
  perfectTitle,
  perfectMessage,
  roundFinishedTitle,
  summaryMessage,
  skippedLabel = "skipped",
  bestStreakLabel,
  newGameLabel = "🎮 New Game",
}) => {
  const isPerfectStreak = bestStreak === total;

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 12,
        padding: "8px 0",
        width: "100%",
        boxSizing: "border-box",
      }}
    >
      {hasWon && isPerfectStreak ? (
        <>
          <strong
            style={{
              fontSize: "clamp(18px, 4.5vw, 24px)",
              color: "#fbbf24",
              textAlign: "center",
              lineHeight: 1.25,
            }}
          >
            {legendaryTitle}
          </strong>
          <span
            style={{
              opacity: 0.9,
              fontSize: "clamp(14px, 3.2vw, 18px)",
              textAlign: "center",
              lineHeight: 1.3,
            }}
          >
            {legendaryMessage}
          </span>
        </>
      ) : hasWon ? (
        <>
          <strong
            style={{
              fontSize: "clamp(18px, 4.5vw, 24px)",
              color: "#10b981",
              textAlign: "center",
              lineHeight: 1.25,
            }}
          >
            {perfectTitle}
          </strong>
          <span
            style={{
              opacity: 0.9,
              fontSize: "clamp(14px, 3.2vw, 18px)",
              textAlign: "center",
              lineHeight: 1.3,
            }}
          >
            {perfectMessage}
          </span>
          {bestStreak > 0 && (
            <span
              style={{
                opacity: 0.85,
                fontSize: "clamp(13px, 3vw, 16px)",
                textAlign: "center",
              }}
            >
              {bestStreakLabel ? bestStreakLabel(bestStreak) : `Best Streak: ${bestStreak} 🔥`}
            </span>
          )}
        </>
      ) : (
        <>
          <strong
            style={{
              fontSize: "clamp(16px, 3.8vw, 20px)",
              textAlign: "center",
              lineHeight: 1.25,
            }}
          >
            {roundFinishedTitle}
          </strong>
          <span
            style={{
              opacity: 0.85,
              fontSize: "clamp(13px, 3vw, 16px)",
              textAlign: "center",
              lineHeight: 1.3,
            }}
          >
            {summaryMessage} {skippedCount > 0 && `(${skippedCount} ${skippedLabel})`}
          </span>
          {bestStreak > 0 && (
            <span
              style={{
                opacity: 0.85,
                fontSize: "clamp(12px, 2.8vw, 14px)",
                textAlign: "center",
              }}
            >
              {bestStreakLabel ? bestStreakLabel(bestStreak) : `Best Streak: ${bestStreak} 🔥`}
            </span>
          )}
        </>
      )}

      <button
        type="button"
        onClick={onStartNewGame}
        style={{ ...GREEN_BUTTON_STYLE, marginTop: 4 }}
        {...GREEN_BUTTON_HOVER}
      >
        {newGameLabel}
      </button>
    </div>
  );
};

export default HUDGameOver;

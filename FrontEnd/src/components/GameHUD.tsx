import { GREEN_BUTTON_STYLE, GREEN_BUTTON_HOVER } from "../utils/sharedStyles";
import { useTranslation } from 'react-i18next';

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
  const { t } = useTranslation();
  if (loading) {
    return (
      <span style={{ fontSize: "clamp(12px, 2.8vw, 16px)" }}>{t('gameHUD.loadingFlags')}</span>
    );
  }

  if (loadError) {
    return (
      <span style={{ fontSize: "clamp(12px, 2.8vw, 16px)" }}>{t('gameHUD.errorPrefix')} {loadError}</span>
    );
  }

  if (gameOver) {
    const isPerfectStreak = bestStreak === targetsLength;
    
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12, padding: "8px 0" }}>
        {hasWon && isPerfectStreak ? (
          <>
            <strong style={{ fontSize: "clamp(16px, 3.5vw, 24px)", color: "#fbbf24" }}>🏆 {t('gameHUD.legendaryTitle')} 🏆</strong>
            <span style={{ opacity: 0.9, fontSize: "clamp(14px, 3vw, 18px)" }}>
              {t('gameHUD.legendaryMessage', { count: targetsLength })}
            </span>
          </>
        ) : hasWon ? (
          <>
            <strong style={{ fontSize: "clamp(16px, 3.5vw, 24px)", color: "#10b981" }}>🎉 {t('gameHUD.perfectTitle')} 🎉</strong>
            <span style={{ opacity: 0.9, fontSize: "clamp(14px, 3vw, 18px)" }}>
              {t('gameHUD.perfectMessage', { count: score })}
            </span>
            <span style={{ opacity: 0.8, fontSize: "clamp(12px, 2.8vw, 16px)" }}>
              {t('gameHUD.bestStreak', { count: bestStreak })} 🔥
            </span>
          </>
        ) : (
          <>
            <strong style={{ fontSize: "clamp(14px, 3.2vw, 20px)" }}>{t('gameHUD.roundFinished')}</strong>
            <span style={{ opacity: 0.8, fontSize: "clamp(12px, 2.8vw, 16px)" }}>
              {t('gameHUD.matchedSummary', { score, total: targetsLength })} {skippedCount > 0 && `(${skippedCount} ${t('gameHUD.skipped')})`}
            </span>
            {bestStreak > 0 && (
              <span style={{ opacity: 0.8, fontSize: "clamp(11px, 2.6vw, 14px)" }}>
                {t('gameHUD.bestStreak', { count: bestStreak })} 🔥
              </span>
            )}
          </>
        )}
        <button
          onClick={onStartNewGame}
          style={{ ...GREEN_BUTTON_STYLE, marginTop: 4 }}
          {...GREEN_BUTTON_HOVER}
        >
          🎮 {t('gameHUD.newGame')}
        </button>
      </div>
    );
  }

  if (!currentTarget) {
    return (
      <span style={{ fontSize: "clamp(12px, 2.8vw, 16px)" }}>{t('gameHUD.loading')}</span>
    );
  }
  
  return (
    <>
      {/* Flag - SVG has correct aspect ratio built-in */}
      <img
        src={currentTarget.flag}
        alt={t('gameHUD.flagToMatchAlt')}
        style={{
          height: "clamp(44px, 10vw, 70px)",
          borderRadius: 2,
          boxShadow: "0 2px 6px rgba(0,0,0,0.4)",
          flexShrink: 0,
          objectFit: "contain",
        }}
      />
      <div style={{ display: "flex", flexDirection: "column", minWidth: "clamp(100px, 24vw, 150px)" }}>
        <strong style={{ fontSize: "clamp(12px, 2.6vw, 18px)" }}>{t('gameHUD.findThisFlag')}</strong>
        <span style={{ opacity: 0.7, fontSize: "clamp(9px, 2.2vw, 13px)" }}>{t('gameHUD.tapCountry')}</span>
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
        title={t('gameHUD.showCurrentFlagName')}
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
        {showNamePanel ? t('gameHUD.hideName') : t('gameHUD.showName')}
      </button>
      <button
        onClick={onSkip}
        title={t('gameHUD.skipThisFlag')}
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
        {t('gameHUD.skip')}
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
        {t('gameHUD.score', { score, total: targetsLength })}
      </span>
    </>
  );
}

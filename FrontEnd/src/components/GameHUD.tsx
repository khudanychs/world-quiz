import { useTranslation } from 'react-i18next';
import {
  HUDCounterBadge,
  HUDStreakBadge,
  HUDScoreBadge,
  HUDSkipButton,
  HUDSecondaryButton,
  HUDGameOver,
} from "./hud";

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
  isPracticeMode?: boolean;
  onDismissPracticeMode?: () => void;
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
  isPracticeMode,
  onDismissPracticeMode,
}: GameHUDProps) {
  const { t } = useTranslation();

  const practiceBadgeStyle: React.CSSProperties = {
    height: isPortrait ? "32px" : "clamp(30px, 3.4vw, 38px)",
    minHeight: isPortrait ? "32px" : "clamp(30px, 3.4vw, 38px)",
    boxSizing: "border-box",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "clamp(4px, 1vw, 6px)",
    padding: "0 clamp(7px, 1vw, 11px)",
    borderRadius: "6px",
    background: "rgba(245, 158, 11, 0.15)",
    border: "1px solid rgba(245, 158, 11, 0.3)",
    color: "#fbbf24",
    fontSize: isPortrait ? "clamp(10px, 2.4vw, 12px)" : "clamp(9.5px, 0.9vw, 12.5px)",
    fontWeight: 600,
    lineHeight: 1,
    whiteSpace: "nowrap",
    flexShrink: 0,
  };

  if (loading) {
    return (
      <span style={{ fontSize: isPortrait ? "clamp(14px, 3.5vw, 16px)" : "clamp(12px, 2.8vw, 16px)" }}>
        {t('gameHUD.loadingFlags')}
      </span>
    );
  }

  if (loadError) {
    return (
      <span style={{ fontSize: isPortrait ? "clamp(14px, 3.5vw, 16px)" : "clamp(12px, 2.8vw, 16px)" }}>
        {t('gameHUD.errorPrefix')} {loadError}
      </span>
    );
  }

  if (gameOver) {
    return (
      <HUDGameOver
        hasWon={hasWon}
        score={score}
        total={targetsLength}
        bestStreak={bestStreak}
        skippedCount={skippedCount}
        onStartNewGame={onStartNewGame}
        legendaryTitle={`🏆 ${t('gameHUD.legendaryTitle')} 🏆`}
        legendaryMessage={t('gameHUD.legendaryMessage', { count: targetsLength })}
        perfectTitle={`🎉 ${t('gameHUD.perfectTitle')} 🎉`}
        perfectMessage={t('gameHUD.perfectMessage', { count: score })}
        roundFinishedTitle={t('gameHUD.roundFinished')}
        summaryMessage={t('gameHUD.matchedSummary', { score, total: targetsLength })}
        skippedLabel={t('gameHUD.skipped')}
        bestStreakLabel={(streak) => `${t('gameHUD.bestStreak', { count: streak })} 🔥`}
        newGameLabel={`🎮 ${t('gameHUD.newGame')}`}
      />
    );
  }

  if (!currentTarget) {
    return (
      <span style={{ fontSize: isPortrait ? "clamp(14px, 3.5vw, 16px)" : "clamp(12px, 2.8vw, 16px)" }}>
        {t('gameHUD.loading')}
      </span>
    );
  }

  if (isPortrait) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 10, width: "100%", boxSizing: "border-box" }}>
        {/* Top section: Flag Safe Zone + Title/Counter block */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            width: "100%",
            gap: "clamp(10px, 2.8vw, 16px)",
          }}
        >
          {/* Dedicated Flag Safe Zone: Accommodates all ratios (from 1:1.2 Nepal to 1:1 Vatican to 11:28 Qatar) */}
          <div
            className="flag-safe-zone"
            style={{
              width: "clamp(116px, 33vw, 156px)",
              height: "clamp(72px, 21vw, 96px)",
              borderRadius: "10px",
              border: "1px solid rgba(255, 255, 255, 0.22)",
              background: "rgba(0, 0, 0, 0.5)",
              boxShadow: "inset 0 1px 4px rgba(0, 0, 0, 0.5), 0 3px 10px rgba(0, 0, 0, 0.4)",
              padding: "5px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              overflow: "hidden",
              flexShrink: 0,
              boxSizing: "border-box",
            }}
          >
            <img
              src={currentTarget.flag}
              alt={t('gameHUD.flagToMatchAlt')}
              style={{
                maxWidth: "100%",
                maxHeight: "100%",
                width: "auto",
                height: "auto",
                objectFit: "contain",
                display: "block",
                borderRadius: "4px",
                filter: "drop-shadow(0 1px 3px rgba(0, 0, 0, 0.45))",
              }}
            />
          </div>

          {/* Right info block: Badges on top, Title & Subtitle below - never collides */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              minWidth: 0,
              flex: 1,
              gap: 4,
            }}
          >
            {/* Status pills: Counter and Streak */}
            <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "nowrap" }}>
              <HUDCounterBadge
                current={currentIdx + 1}
                total={targetsLength}
                isPortrait={isPortrait}
              />
              <HUDStreakBadge
                streak={currentStreak}
                isPortrait={isPortrait}
              />
            </div>

            {/* Instruction text with balanced wrap */}
            <div style={{ display: "flex", flexDirection: "column", minWidth: 0, flex: 1 }}>
              <strong
                style={{
                  fontSize: "clamp(12px, 3.2vw, 16px)",
                  fontWeight: 700,
                  lineHeight: 1.25,
                  color: "#ffffff",
                  overflowWrap: "break-word",
                  wordBreak: "normal",
                  textWrap: "balance",
                }}
              >
                {t('gameHUD.findThisFlag')}
              </strong>
              <span
                style={{
                  opacity: 0.75,
                  fontSize: "clamp(9.5px, 2.4vw, 12px)",
                  lineHeight: 1.25,
                  marginTop: 2,
                  overflowWrap: "break-word",
                  wordBreak: "normal",
                  textWrap: "balance",
                }}
              >
                {t('gameHUD.tapCountry')}
              </span>
            </div>
          </div>
        </div>

        {/* Action row: Show name button + Skip button + Score badge */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "clamp(6px, 1.8vw, 10px)",
            width: "100%",
          }}
        >
          <HUDSecondaryButton
            onClick={onToggleNamePanel}
            title={t('gameHUD.showCurrentFlagName')}
            label={showNamePanel ? t('gameHUD.hideName') : t('gameHUD.showName')}
            isPortrait={isPortrait}
          />
          <HUDSkipButton
            onClick={onSkip}
            title={t('gameHUD.skipThisFlag')}
            label={t('gameHUD.skip')}
            isPortrait={isPortrait}
          />
          <HUDScoreBadge
            scoreText={t('gameHUD.score', { score, total: targetsLength })}
            isPortrait={isPortrait}
          />
        </div>

        {/* Dedicated Practice Mode indicator row if active */}
        {isPracticeMode && (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
            <div style={practiceBadgeStyle}>
              <span>{t('flagMatch.practiceMode')}</span>
              {onDismissPracticeMode && (
                <button
                  onClick={onDismissPracticeMode}
                  style={{
                    background: "none",
                    border: "none",
                    color: "#fbbf24",
                    cursor: "pointer",
                    padding: "0 2px",
                    fontSize: "clamp(11px, 2.2vw, 13px)",
                    lineHeight: 1,
                    opacity: 0.7,
                    flexShrink: 0,
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.opacity = "1")}
                  onMouseLeave={(e) => (e.currentTarget.style.opacity = "0.7")}
                  aria-label="Dismiss"
                >
                  ✕
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    );
  }

  // Desktop / Landscape (>= 900px in landscape)
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexWrap: "nowrap",
        gap: "clamp(6px, 1vw, 14px)",
        width: "100%",
      }}
    >
      {/* Desktop / Landscape Dedicated Flag Safe Zone */}
      <div
        className="flag-safe-zone"
        style={{
          width: "clamp(84px, 9vw, 130px)",
          height: "clamp(50px, 5.2vw, 76px)",
          borderRadius: "8px",
          border: "1px solid rgba(255, 255, 255, 0.22)",
          background: "rgba(0, 0, 0, 0.5)",
          boxShadow: "inset 0 1px 3px rgba(0, 0, 0, 0.4), 0 2px 8px rgba(0, 0, 0, 0.35)",
          padding: "4px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          overflow: "hidden",
          flexShrink: 0,
          boxSizing: "border-box",
        }}
      >
        <img
          src={currentTarget.flag}
          alt={t('gameHUD.flagToMatchAlt')}
          style={{
            maxWidth: "100%",
            maxHeight: "100%",
            width: "auto",
            height: "auto",
            objectFit: "contain",
            display: "block",
            borderRadius: "3px",
            filter: "drop-shadow(0 1px 3px rgba(0, 0, 0, 0.45))",
          }}
        />
      </div>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          minWidth: "max-content",
          flexShrink: 0,
        }}
      >
        <strong
          style={{
            fontSize: "clamp(13px, 1.3vw, 17px)",
            lineHeight: 1.25,
            color: "#ffffff",
            whiteSpace: "nowrap",
          }}
        >
          {t('gameHUD.findThisFlag')}
        </strong>
        <span
          style={{
            opacity: 0.75,
            fontSize: "clamp(10px, 0.9vw, 12px)",
            lineHeight: 1.25,
            whiteSpace: "nowrap",
            marginTop: 2,
          }}
        >
          {t('gameHUD.tapCountry')}
        </span>
      </div>

      <HUDCounterBadge
        current={currentIdx + 1}
        total={targetsLength}
        isPortrait={isPortrait}
      />

      <HUDStreakBadge
        streak={currentStreak}
        isPortrait={isPortrait}
      />

      <HUDSecondaryButton
        onClick={onToggleNamePanel}
        title={t('gameHUD.showCurrentFlagName')}
        label={showNamePanel ? t('gameHUD.hideName') : t('gameHUD.showName')}
        isPortrait={isPortrait}
      />

      <HUDSkipButton
        onClick={onSkip}
        title={t('gameHUD.skipThisFlag')}
        label={t('gameHUD.skip')}
        isPortrait={isPortrait}
      />

      <HUDScoreBadge
        scoreText={t('gameHUD.score', { score, total: targetsLength })}
        isPortrait={isPortrait}
      />

      {isPracticeMode && (
        <div style={practiceBadgeStyle}>
          <span>{t('flagMatch.practiceMode')}</span>
          {onDismissPracticeMode && (
            <button
              onClick={onDismissPracticeMode}
              style={{
                background: "none",
                border: "none",
                color: "#fbbf24",
                cursor: "pointer",
                padding: "0 2px",
                fontSize: "12px",
                lineHeight: 1,
                opacity: 0.7,
                flexShrink: 0,
              }}
              onMouseEnter={(e) => (e.currentTarget.style.opacity = "1")}
              onMouseLeave={(e) => (e.currentTarget.style.opacity = "0.7")}
              aria-label="Dismiss"
            >
              ✕
            </button>
          )}
        </div>
      )}
    </div>
  );
}

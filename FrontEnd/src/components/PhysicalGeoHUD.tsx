import { CATEGORY_INFO, type PhysicalFeature } from "../utils/physicalFeatures";
import { toPhysicalFeatureDisplayName } from "../utils/physicalFeatureNames";
import { useTranslation } from 'react-i18next';
import {
  HUDCounterBadge,
  HUDStreakBadge,
  HUDScoreBadge,
  HUDSkipButton,
  HUDGameOver,
} from "./hud";

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
  featureDisplayNameByName: Record<string, string>;
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
  featureDisplayNameByName,
  showingResult,
  lastResult,
  onStartNewGame,
  onSkip,
  isPortrait,
}: PhysicalGeoHUDProps) {
  const { t } = useTranslation();

  if (loading) {
    return (
      <span style={{ fontSize: isPortrait ? "clamp(14px, 3.5vw, 16px)" : "clamp(12px, 2.8vw, 16px)" }}>
        {t('physicalGeoHUD.loading')}
      </span>
    );
  }

  if (gameOver) {
    return (
      <HUDGameOver
        hasWon={hasWon}
        score={score}
        total={featuresLength}
        bestStreak={bestStreak}
        skippedCount={skippedCount}
        onStartNewGame={onStartNewGame}
        legendaryTitle={`🏆 ${t('physicalGeoHUD.legendaryTitle')} 🏆`}
        legendaryMessage={t('physicalGeoHUD.legendaryMessage', { count: featuresLength })}
        perfectTitle={`🎉 ${t('physicalGeoHUD.wellDoneTitle')} 🎉`}
        perfectMessage={t('physicalGeoHUD.locatedSummary', { score, total: featuresLength })}
        roundFinishedTitle={t('physicalGeoHUD.roundFinished')}
        summaryMessage={t('physicalGeoHUD.locatedLabel', { score, total: featuresLength })}
        skippedLabel={t('physicalGeoHUD.skipped')}
        bestStreakLabel={(streak) => `${t('physicalGeoHUD.bestStreak', { count: streak })} 🔥`}
        newGameLabel={`🎮 ${t('physicalGeoHUD.newGame')}`}
      />
    );
  }

  if (!currentFeature) {
    return (
      <span style={{ fontSize: isPortrait ? "clamp(14px, 3.5vw, 16px)" : "clamp(12px, 2.8vw, 16px)" }}>
        {t('physicalGeoHUD.loading')}
      </span>
    );
  }

  const catInfo = CATEGORY_INFO[currentFeature.type];
  const localizedFeatureTypeLabel = t(`physicalGeoHUD.featureTypes.${currentFeature.type}`, {
    defaultValue: catInfo.label,
  });
  const currentFeatureDisplayName = toPhysicalFeatureDisplayName(currentFeature.displayName || currentFeature.name);
  const getLocalizedFeatureName = (rawName: string): string => {
    const localized = featureDisplayNameByName[rawName];
    return toPhysicalFeatureDisplayName(localized || rawName);
  };

  // Result feedback (skip silently shows highlighted answer without banner)
  if (showingResult && lastResult && lastResult.clickedName !== "") {
    if (isPortrait) {
      return (
        <div style={{ display: "flex", flexDirection: "column", gap: 12, width: "100%", boxSizing: "border-box" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              width: "100%",
              gap: "clamp(8px, 2.5vw, 14px)",
            }}
          >
            <div style={{ display: "flex", flexDirection: "column", minWidth: 0, flex: 1 }}>
              <strong
                style={{
                  fontSize: "clamp(16px, 4.2vw, 22px)",
                  fontWeight: 700,
                  color: lastResult.correct ? "#10b981" : "#ef4444",
                  lineHeight: 1.25,
                }}
              >
                {lastResult.correct ? t('physicalGeoHUD.correct') : t('physicalGeoHUD.wrong')}
              </strong>
              {!lastResult.correct && (
                <span
                  style={{
                    fontSize: "clamp(11px, 2.8vw, 13px)",
                    opacity: 0.8,
                    marginTop: 2,
                    overflowWrap: "break-word",
                    wordBreak: "normal",
                  }}
                >
                  {t('physicalGeoHUD.youClicked', { name: getLocalizedFeatureName(lastResult.clickedName) })}
                </span>
              )}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
              <HUDCounterBadge
                current={currentIdx + 1}
                total={featuresLength}
                isPortrait={isPortrait}
              />
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: "100%" }}>
            <HUDScoreBadge
              scoreText={t('physicalGeoHUD.score', { score, total: featuresLength })}
              isPortrait={isPortrait}
              style={{ width: "100%" }}
            />
          </div>
        </div>
      );
    }

    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "clamp(8px, 1.4vw, 16px)", flexWrap: "nowrap", width: "100%" }}>
        <strong
          style={{
            fontSize: "clamp(14px, 1.6vw, 20px)",
            color: lastResult.correct ? "#10b981" : "#ef4444",
            whiteSpace: "nowrap",
            flexShrink: 0,
            textAlign: "center",
          }}
        >
          {lastResult.correct ? t('physicalGeoHUD.correct') : t('physicalGeoHUD.wrong')}
        </strong>
        {!lastResult.correct && (
          <span style={{ fontSize: "clamp(11px, 1vw, 14px)", opacity: 0.8, whiteSpace: "nowrap", flexShrink: 0 }}>
            {t('physicalGeoHUD.youClicked', { name: getLocalizedFeatureName(lastResult.clickedName) })}
          </span>
        )}
        <HUDCounterBadge
          current={currentIdx + 1}
          total={featuresLength}
          isPortrait={isPortrait}
        />
        <HUDScoreBadge
          scoreText={t('physicalGeoHUD.score', { score, total: featuresLength })}
          isPortrait={isPortrait}
        />
      </div>
    );
  }

  // Normal: show feature name to find
  if (isPortrait) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 12, width: "100%", boxSizing: "border-box" }}>
        {/* Top row: Feature info + Counter + Streak */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            width: "100%",
            gap: "clamp(8px, 2.5vw, 14px)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "clamp(10px, 2.8vw, 14px)", minWidth: 0, flex: 1 }}>
            <span
              style={{
                fontSize: "clamp(34px, 8.5vw, 42px)",
                lineHeight: 1,
                flexShrink: 0,
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
              }}
              role="img"
              aria-label={catInfo.label}
            >
              {catInfo.emoji}
            </span>
            <div style={{ display: "flex", flexDirection: "column", minWidth: 0, flex: 1 }}>
              <strong
                style={{
                  fontSize: "clamp(15px, 4vw, 20px)",
                  fontWeight: 700,
                  lineHeight: 1.25,
                  color: "#ffffff",
                  overflowWrap: "break-word",
                  wordBreak: "normal",
                }}
              >
                {currentFeatureDisplayName}
              </strong>
              <span
                style={{
                  opacity: 0.75,
                  fontSize: "clamp(10px, 2.6vw, 13px)",
                  lineHeight: 1.25,
                  marginTop: 2,
                  overflowWrap: "break-word",
                  wordBreak: "normal",
                }}
              >
                {t('physicalGeoHUD.clickOnMap', { label: localizedFeatureTypeLabel })}
              </span>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
            <HUDCounterBadge
              current={currentIdx + 1}
              total={featuresLength}
              isPortrait={isPortrait}
            />
            <HUDStreakBadge
              streak={currentStreak}
              isPortrait={isPortrait}
            />
          </div>
        </div>

        {/* Bottom row: Skip button + Score badge side-by-side with identical height */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "clamp(8px, 2.5vw, 12px)",
            width: "100%",
          }}
        >
          <HUDSkipButton
            onClick={onSkip}
            title={t('physicalGeoHUD.skipThisFeature')}
            label={t('physicalGeoHUD.skip')}
            isPortrait={isPortrait}
          />
          <HUDScoreBadge
            scoreText={t('physicalGeoHUD.score', { score, total: featuresLength })}
            isPortrait={isPortrait}
          />
        </div>
      </div>
    );
  }

  // Desktop / Landscape
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "clamp(6px, 1vw, 14px)", flexWrap: "nowrap", width: "100%" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "clamp(6px, 1vw, 10px)", flexShrink: 0 }}>
        <span style={{ fontSize: "clamp(26px, 3.2vw, 40px)", lineHeight: 1, flexShrink: 0 }}>{catInfo.emoji}</span>
        <div style={{ display: "flex", flexDirection: "column", minWidth: "max-content", flexShrink: 0 }}>
          <strong style={{ fontSize: "clamp(14px, 1.4vw, 19px)", lineHeight: 1.25, whiteSpace: "nowrap" }}>
            {currentFeatureDisplayName}
          </strong>
          <span style={{ opacity: 0.7, fontSize: "clamp(10px, 0.9vw, 12.5px)", whiteSpace: "nowrap", marginTop: 2 }}>
            {t('physicalGeoHUD.clickOnMap', { label: localizedFeatureTypeLabel })}
          </span>
        </div>
      </div>
      <HUDCounterBadge
        current={currentIdx + 1}
        total={featuresLength}
        isPortrait={isPortrait}
      />
      <HUDStreakBadge
        streak={currentStreak}
        isPortrait={isPortrait}
      />
      <HUDSkipButton
        onClick={onSkip}
        title={t('physicalGeoHUD.skipThisFeature')}
        label={t('physicalGeoHUD.skip')}
        isPortrait={isPortrait}
      />
      <HUDScoreBadge
        scoreText={t('physicalGeoHUD.score', { score, total: featuresLength })}
        isPortrait={isPortrait}
      />
    </div>
  );
}

import { CATEGORY_INFO, type PhysicalFeature } from "../utils/physicalFeatures";
import { toPhysicalFeatureDisplayName } from "../utils/physicalFeatureNames";
import { FeatureTypeIcon } from "./physicalGeoGame/FeatureTypeIcon";
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
      <span style={{ fontSize: isPortrait ? "clamp(14px, 3.5vw, 16px)" : "var(--hud-control-font-size, clamp(12px, 2.8vw, 16px))" }}>
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
      <span style={{ fontSize: isPortrait ? "clamp(14px, 3.5vw, 16px)" : "var(--hud-control-font-size, clamp(12px, 2.8vw, 16px))" }}>
        {t('physicalGeoHUD.loading')}
      </span>
    );
  }

  const catInfo = CATEGORY_INFO[currentFeature.type];
  const localizedFeatureTypeLabel = t(`physicalGeoHUD.featureTypes.${currentFeature.type}`, {
    defaultValue: catInfo.label,
  });
  const featureHint = currentFeature.hintKey ? t(currentFeature.hintKey, { defaultValue: "" }) : "";
  const instructionText = featureHint
    ? `${t('physicalGeoHUD.clickOnMap', { label: localizedFeatureTypeLabel })} · ${featureHint}`
    : t('physicalGeoHUD.clickOnMap', { label: localizedFeatureTypeLabel });
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
                className="phys-hud-result-title"
                style={{
                  fontSize: "clamp(16px, 4.2vw, 22px)",
                  fontWeight: 700,
                  color: lastResult.correct ? "#10b981" : "#ef4444",
                  lineHeight: 1.25,
                  overflowWrap: "anywhere",
                  wordBreak: "break-word",
                }}
              >
                {lastResult.correct ? t('physicalGeoHUD.correct') : t('physicalGeoHUD.wrong')}
              </strong>
              {!lastResult.correct && (
                <span
                  className="phys-hud-result-detail"
                  style={{
                    fontSize: "clamp(11px, 2.8vw, 13px)",
                    opacity: 0.8,
                    marginTop: 2,
                    overflowWrap: "anywhere",
                    wordBreak: "break-word",
                    lineHeight: 1.25,
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
      <div
        className="phys-hud-content"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "clamp(8px, 1.4vw, 16px)",
          flexWrap: "nowrap",
          width: "100%",
          minWidth: 0,
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-start",
            minWidth: 0,
            flexShrink: 1,
          }}
        >
          <strong
            className="phys-hud-result-title"
            style={{
              fontSize: "var(--phys-hud-title-font-size, clamp(14px, 1.6vw, 20px))",
              fontWeight: 700,
              color: lastResult.correct ? "#10b981" : "#ef4444",
              overflowWrap: "break-word",
              wordBreak: "normal",
              lineHeight: 1.25,
              flexShrink: 0,
            }}
          >
            {lastResult.correct ? t('physicalGeoHUD.correct') : t('physicalGeoHUD.wrong')}
          </strong>
          {!lastResult.correct && (
            <span
              className="phys-hud-result-detail"
              style={{
                fontSize: "var(--phys-hud-instruction-font-size, clamp(11px, 1vw, 14px))",
                opacity: 0.8,
                marginTop: 2,
                overflowWrap: "break-word",
                wordBreak: "normal",
                lineHeight: 1.25,
                minWidth: 0,
                flexShrink: 1,
              }}
            >
              {t('physicalGeoHUD.youClicked', { name: getLocalizedFeatureName(lastResult.clickedName) })}
            </span>
          )}
        </div>
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
              className="phys-hud-icon"
              style={{
                fontSize: "clamp(34px, 8.5vw, 42px)",
                lineHeight: 1,
                flexShrink: 0,
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
              }}
              role="img"
              aria-label={localizedFeatureTypeLabel}
            >
              <FeatureTypeIcon type={currentFeature.type} />
            </span>
            <div style={{ display: "flex", flexDirection: "column", minWidth: 0, flex: 1 }}>
              <strong
                className="phys-hud-title"
                style={{
                  fontSize: "clamp(15px, 4vw, 20px)",
                  fontWeight: 700,
                  lineHeight: 1.25,
                  color: "#ffffff",
                  overflowWrap: "anywhere",
                  wordBreak: "break-word",
                }}
              >
                {currentFeatureDisplayName}
              </strong>
              <span
                className="phys-hud-instruction"
                style={{
                  opacity: 0.75,
                  fontSize: "clamp(10px, 2.6vw, 13px)",
                  lineHeight: 1.25,
                  marginTop: 2,
                  overflowWrap: "anywhere",
                  wordBreak: "break-word",
                }}
              >
                {instructionText}
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
            alignItems: "stretch",
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
    <div
      className="phys-hud-content"
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "clamp(6px, 1vw, 14px)",
        flexWrap: "nowrap",
        width: "100%",
        minWidth: 0,
      }}
    >
      <div
        className="phys-hud-feature-group"
        style={{
          display: "flex",
          alignItems: "center",
          gap: "clamp(6px, 1vw, 10px)",
          minWidth: 0,
          flexShrink: 1,
        }}
      >
        <span
          className="phys-hud-icon"
          style={{
            fontSize: "var(--phys-hud-icon-size, clamp(26px, 3.2vw, 40px))",
            lineHeight: 1,
            flexShrink: 0,
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
          }}
          role="img"
          aria-label={localizedFeatureTypeLabel}
        >
          <FeatureTypeIcon type={currentFeature.type} />
        </span>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            minWidth: 0,
            flexShrink: 1,
          }}
        >
          <strong
            className="phys-hud-title"
            style={{
              fontSize: "var(--phys-hud-title-font-size, clamp(14px, 1.4vw, 19px))",
              lineHeight: 1.25,
              overflowWrap: "break-word",
              wordBreak: "normal",
              color: "#ffffff",
            }}
          >
            {currentFeatureDisplayName}
          </strong>
          <span
            className="phys-hud-instruction"
            style={{
              opacity: 0.7,
              fontSize: "var(--phys-hud-instruction-font-size, clamp(10px, 0.9vw, 12.5px))",
              lineHeight: 1.25,
              marginTop: 2,
              overflowWrap: "break-word",
              wordBreak: "normal",
            }}
          >
            {instructionText}
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

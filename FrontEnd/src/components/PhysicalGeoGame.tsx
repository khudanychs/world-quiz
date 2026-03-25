import { useState, useRef, useMemo, useEffect, useCallback, lazy, Suspense } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { BackButton } from "./BackButton";
import { SEOHelmet } from "./SEOHelmet";
import PhysicalGeoHUD from "./PhysicalGeoHUD";
import { MERGED_URL, buildGeoFeatureGetter } from "./physicalGeoGame/geo";
import { getPhysicalGeoMode } from "./physicalGeoGame/modes";
import {
  renderLandOverlay as renderLandOverlaySvg,
  renderWaterUnderlay as renderWaterUnderlaySvg,
  type Proj,
} from "./physicalGeoGame/renderers";
import { MemoizedOverlay } from "./physicalGeoGame/MemoizedOverlay";
import { useGeoData } from "./physicalGeoGame/useGeoData";
import { usePathCache } from "./physicalGeoGame/usePathCache";
import { useBackgroundMarineNames } from "./physicalGeoGame/useBackgroundMarineNames";
import { panToFeature as calculatePanToFeature } from "./physicalGeoGame/zoomUtils";
import { usePhysicalGeoGame } from "../hooks/usePhysicalGeoGame";
import { useMapDimensions } from "../hooks/useMapDimensions";
import { usePreventWheelScroll } from "../hooks/usePreventWheelScroll";
import { FRAME } from "../utils/mapConstants";
import {
  PAGE_CONTAINER_STYLE,
  getMapWrapperStyle,
  GREEN_BUTTON_STYLE,
  GREEN_BUTTON_HOVER,
} from "../utils/sharedStyles";
import { CATEGORY_GROUPS, type PhysicalFeature } from "../utils/physicalFeatures";
import { buildLocalizedPath, getBaseLanguage } from "../utils/localeRouting";
import { SEO_TRANSLATIONS, toCanonicalUrlWithLanguage, getSeoOgImage } from "../seo/seo-translations";
import "./PhysicalGeoGame.css";

const InteractiveMap = lazy(() => import("./InteractiveMap"));

export default function PhysicalGeoGame() {
  const { t, i18n } = useTranslation();
  const currentLanguage = getBaseLanguage(i18n.language);
  const navigate = useNavigate();
  const { modeKey } = useParams<{ modeKey?: string }>();
  const categoryKey = useMemo(() => {
    if (!modeKey) {
      return null;
    }
    return CATEGORY_GROUPS.some((group) => group.key === modeKey) ? modeKey : null;
  }, [modeKey]);
  const showSelector = categoryKey === null;
  const canonicalPhysicalGeoPath = categoryKey
    ? `/game/physical-geo/${categoryKey}`
    : "/game/physical-geo";
  const game = usePhysicalGeoGame(categoryKey ?? "mountains");
  const activeMode = useMemo(() => getPhysicalGeoMode(categoryKey ?? "mountains"), [categoryKey]);
  const { dimensions, isPortrait, isDesktop } = useMapDimensions();
  const OUTER_W = dimensions.width;
  const OUTER_H = dimensions.height;
  const INNER_W = OUTER_W - FRAME * 2;
  const INNER_H = OUTER_H - FRAME * 2;
  const FIT_SCALE = Math.max(1, Math.round(INNER_W * 0.32));
  const [pos, setPos] = useState<{ coordinates: [number, number]; zoom: number }>({
    coordinates: [0, 0],
    zoom: 1,
  });

  const {
    marineData,
    riverData,
    lakeData,
    landPathD,
    baseMapReady,
    setGeographiesReady,
    requiredDataLoaded,
    needsDetailedLandMask,
    hasActiveMode,
  } = useGeoData(categoryKey, activeMode, FIT_SCALE, INNER_W, INNER_H);

  const handleMapMoveEnd = useCallback(({ zoom, coordinates }: { zoom: number; coordinates: [number, number] }) => {
    setPos((prev) => {
      if (
        prev.zoom === zoom &&
        prev.coordinates[0] === coordinates[0] &&
        prev.coordinates[1] === coordinates[1]
      ) {
        return prev;
      }
      return { zoom, coordinates };
    });
  }, []);

  const handleBaseGeographiesLoaded = useCallback(() => {
    setGeographiesReady(true);
  }, [setGeographiesReady]);

  const getGeoFeature = useMemo(
    () => buildGeoFeatureGetter(marineData, riverData, lakeData),
    [marineData, riverData, lakeData],
  );

  const getPrecomputedPath = usePathCache(
    getGeoFeature,
    FIT_SCALE,
    INNER_W,
    INNER_H,
    marineData,
    riverData,
    lakeData
  );

  const panToFeature = useCallback((feature: PhysicalFeature) => {
    const result = calculatePanToFeature(feature, activeMode, getGeoFeature);
    if (result) {
      setPos(result);
    }
  }, [activeMode, getGeoFeature]);

  const canRenderFeatureOverlay = hasActiveMode && baseMapReady && requiredDataLoaded;

  const [streakMilestone, setStreakMilestone] = useState<number | null>(null);
  const prevStreakRef = useRef(0);
  useEffect(() => {
    const cur = game.currentStreak;
    const prev = prevStreakRef.current;
    prevStreakRef.current = cur;
    if (cur >= 5 && cur > prev && cur % 5 === 0) {
      setStreakMilestone(cur);
      const timer = setTimeout(() => setStreakMilestone(null), 1200);
      return () => clearTimeout(timer);
    }
  }, [game.currentStreak]);
  const wrapperRef = useRef<HTMLDivElement>(null);
  usePreventWheelScroll(wrapperRef);
  const correctSetRef = useRef(game.correctSet);
  correctSetRef.current = game.correctSet;
  const skippedSetRef = useRef(game.skippedSet);
  skippedSetRef.current = game.skippedSet;

  // Refs for render-time values to avoid callback recreation
  const showingResultRef = useRef(game.showingResult);
  showingResultRef.current = game.showingResult;
  const lastResultRef = useRef(game.lastResult);
  lastResultRef.current = game.lastResult;
  const currentFeatureRef = useRef(game.currentFeature);
  currentFeatureRef.current = game.currentFeature;
  const gameOverRef = useRef(game.gameOver);
  gameOverRef.current = game.gameOver;
  const handleFeatureClickRef = useRef(game.handleFeatureClick);
  handleFeatureClickRef.current = game.handleFeatureClick;
  const panToFeatureRef = useRef(panToFeature);
  panToFeatureRef.current = panToFeature;

  const handleFeatureClickWithZoom = useCallback(
    (featureName: string) => {
      const currentFeature = currentFeatureRef.current;
      if (!currentFeature) return;
      const isCorrect = featureName === currentFeature.name;
      handleFeatureClickRef.current(featureName);
      if (!isCorrect) {
        panToFeatureRef.current(currentFeature);
      }
    },
    []
  );

  const handleBack = useCallback(() => navigate(buildLocalizedPath("/", i18n.language)), [navigate, i18n.language]);
  const selectCategory = useCallback((key: string) => {
    navigate(`/game/physical-geo/${key}`);
  }, [navigate]);

  useEffect(() => {
    if (!categoryKey) {
      return;
    }
    game.startNewGame(categoryKey);
  }, [categoryKey, i18n.language]);

  const { waterFeatures, landFeatures } = useMemo(
    () => activeMode.splitFeatures(game.features),
    [activeMode, game.features],
  );

  const allMarineFeatureNames = useBackgroundMarineNames(
    activeMode.includeMarineBackground,
    marineData
  );

  const featureDisplayNameByName = useMemo(() => {
    const lookup: Record<string, string> = {};
    for (const feature of game.features) {
      lookup[feature.name] = feature.displayName || feature.name;
    }
    return lookup;
  }, [game.features]);

  const canClick = useCallback((feature: PhysicalFeature) => (
    !correctSetRef.current.has(feature.name) &&
    !skippedSetRef.current.has(feature.name) &&
    !showingResultRef.current &&
    !gameOverRef.current
  ), []);

  const visualStateKey = useMemo(() =>
    `${game.showingResult}|${game.lastResult?.correct ?? ''}|${game.lastResult?.clickedName ?? ''}|${game.currentFeature?.name ?? ''}|${game.correctSet.size}|${game.skippedSet.size}`,
    [game.showingResult, game.lastResult, game.currentFeature?.name, game.correctSet.size, game.skippedSet.size]
  );

  const renderWaterUnderlay = useCallback((projection: Proj, zoom: number, isDesktop: boolean) => {
    return renderWaterUnderlaySvg({
      projection,
      zoom,
      isDesktop,
      modeStyleOverrides: activeMode.styleOverrides,
      waterFeatures,
      backgroundMarineNames: allMarineFeatureNames,
      getPrecomputedPath,
      canClick,
      onFeatureClick: handleFeatureClickWithZoom,
      showingResult: showingResultRef.current,
      lastResult: lastResultRef.current,
      currentFeatureName: currentFeatureRef.current?.name,
      correctSet: correctSetRef.current,
      skippedSet: skippedSetRef.current,
    });
  }, [
    activeMode.styleOverrides,
    waterFeatures,
    allMarineFeatureNames,
    getPrecomputedPath,
    canClick,
    handleFeatureClickWithZoom,
  ]);

  const renderLandOnlyOverlay = useCallback((projection: Proj, zoom: number, isDesktop: boolean) => {
    return renderLandOverlaySvg({
      projection,
      zoom,
      isDesktop,
      modeStyleOverrides: activeMode.styleOverrides,
      landFeatures,
      getPrecomputedPath,
      canClick,
      onFeatureClick: handleFeatureClickWithZoom,
      showingResult: showingResultRef.current,
      lastResult: lastResultRef.current,
      currentFeatureName: currentFeatureRef.current?.name,
      correctSet: correctSetRef.current,
      skippedSet: skippedSetRef.current,
    });
  }, [
    activeMode.styleOverrides,
    landFeatures,
    getPrecomputedPath,
    canClick,
    handleFeatureClickWithZoom,
  ]);

  const renderOverlay = useCallback((projection: Proj, zoom: number, isDesktop: boolean) => {
    return (
      <MemoizedOverlay
        projection={projection}
        zoom={zoom}
        isDesktop={isDesktop}
        modeStyleOverrides={activeMode.styleOverrides}
        waterFeatures={waterFeatures}
        backgroundMarineNames={allMarineFeatureNames}
        landFeatures={landFeatures}
        getPrecomputedPath={getPrecomputedPath}
        canClick={canClick}
        onFeatureClick={handleFeatureClickWithZoom}
        showingResult={showingResultRef.current}
        lastResult={lastResultRef.current}
        currentFeatureName={currentFeatureRef.current?.name}
        correctSet={correctSetRef.current}
        skippedSet={skippedSetRef.current}
        visualStateKey={visualStateKey}
      />
    );
  }, [
    activeMode.styleOverrides,
    waterFeatures,
    allMarineFeatureNames,
    landFeatures,
    getPrecomputedPath,
    canClick,
    handleFeatureClickWithZoom,
    visualStateKey,
  ]);


  return (
    <>
      <SEOHelmet
        title="Physical Geography Game - World Quiz"
        description="Locate mountains, rivers, lakes, deserts, and marine features in the Physical Geography mode."
        canonicalUrl={toCanonicalUrlWithLanguage(canonicalPhysicalGeoPath, currentLanguage)}
        ogImage={getSeoOgImage(SEO_TRANSLATIONS.routes.home)}
      />
      {showSelector && (
        <div className="phys-category-overlay">
          <div className="phys-category-content">
            <h1 className="phys-category-title">🌍 {t("physicalGeoGame.title")}</h1>
            <p className="phys-category-subtitle">{t("physicalGeoGame.chooseCategory")}</p>

            <div className={`phys-category-grid ${isPortrait ? "portrait" : "landscape"}`}>
              {CATEGORY_GROUPS.map((group) => (
                <button
                  key={group.key}
                  onClick={() => selectCategory(group.key)}
                  className={`phys-cat-btn phys-cat-btn-${group.key}`}
                >
                  {group.emoji} {t(`physicalGeoGame.categories.${group.key}`)}
                </button>
              ))}
            </div>

            <button onClick={() => navigate(buildLocalizedPath("/", i18n.language))} className="phys-category-back-btn">
              ← {t("physicalGeoGame.backToMenu")}
            </button>
          </div>
        </div>
      )}

      <div
        style={{
          ...PAGE_CONTAINER_STYLE,
          gap: isPortrait ? "clamp(16px, 3vh, 32px)" : "0",
        }}
      >
        <BackButton onClick={handleBack} label={t("physicalGeoGame.menu")} />
        <div
          style={{
            position: isPortrait ? "relative" : "absolute",
            top: isPortrait ? "auto" : "clamp(8px, 4vh, 40px)",
            left: isPortrait ? "auto" : "50%",
            transform: isPortrait ? "none" : "translateX(-50%)",
            zIndex: 4,
            display: "flex",
            alignItems: "center",
            flexWrap: isPortrait ? "wrap" : "nowrap",
            justifyContent: "center",
            gap: isPortrait ? "clamp(8px, 2vw, 14px)" : "clamp(6px, 1.4vw, 12px)",
            padding: isPortrait
              ? "clamp(10px, 2.4vw, 18px) clamp(14px, 3vw, 22px)"
              : "clamp(6px, 1.2vw, 14px) clamp(10px, 2vw, 18px)",
            borderRadius: "clamp(8px, 2vw, 12px)",
            border: "1px solid rgba(255,255,255,0.25)",
            background: "rgba(0,0,0,0.65)",
            backdropFilter: "blur(8px)",
            boxShadow: "0 4px 12px rgba(0,0,0,0.4)",
            maxWidth: isPortrait ? "94vw" : "96vw",
            overflow: "hidden",
          }}
        >
          <PhysicalGeoHUD
            loading={game.loading}
            gameOver={game.gameOver}
            hasWon={game.hasWon}
            score={game.score}
            bestStreak={game.bestStreak}
            skippedCount={game.skippedCount}
            currentFeature={game.currentFeature}
            currentIdx={game.currentIdx}
            featuresLength={game.features.length}
            currentStreak={game.currentStreak}
            featureDisplayNameByName={featureDisplayNameByName}
            showingResult={game.showingResult}
            lastResult={game.lastResult}
            onStartNewGame={() => {
              navigate(buildLocalizedPath("/game/physical-geo", i18n.language));
            }}
            onSkip={() => {
              if (game.currentFeature) panToFeature(game.currentFeature);
              game.skipCurrent();
            }}
            isPortrait={isPortrait}
          />
        </div>

        {/* ── Win Animation ─────────────────────────── */}
        {game.showWinAnimation && (
          <div className="phys-win-overlay">
            <div className="phys-win-content">
              <div className="phys-win-emoji">
                {game.bestStreak === game.features.length ? "🏆" : "🎉"}
              </div>
              <h1
                className={`phys-win-title ${
                  game.bestStreak === game.features.length
                    ? "legendary"
                    : game.score === game.features.length
                    ? "great"
                    : ""
                }`}
              >
                {game.bestStreak === game.features.length
                  ? t("physicalGeoGame.legendary")
                  : game.score === game.features.length
                  ? t("physicalGeoGame.perfect")
                  : t("physicalGeoGame.wellDone")}
              </h1>
              <p className="phys-win-message">
                {game.bestStreak === game.features.length
                  ? t("physicalGeoGame.legendaryMessage", { count: game.features.length })
                  : t("physicalGeoGame.locatedMessage", { score: game.score, total: game.features.length })}
              </p>
              {game.bestStreak > 0 && game.bestStreak < game.features.length && (
                <p className="phys-win-streak">{t("physicalGeoGame.bestStreak", { count: game.bestStreak })} 🔥</p>
              )}
              <div className="phys-win-buttons">
                <button onClick={() => navigate(buildLocalizedPath("/", i18n.language))} className="phys-win-home-btn">
                  🏠 {t("physicalGeoGame.home")}
                </button>
                <button
                  onClick={() => navigate(buildLocalizedPath("/game/physical-geo", i18n.language))}
                  style={GREEN_BUTTON_STYLE}
                  {...GREEN_BUTTON_HOVER}
                >
                  🎮 {t("physicalGeoGame.newGame")}
                </button>
              </div>
            </div>
          </div>
        )}
        {streakMilestone !== null && (
          <div key={streakMilestone} className="phys-streak-animation">{streakMilestone} 🔥</div>
        )}
        {game.showingResult && game.lastResult && game.lastResult.clickedName !== "" && (!game.lastResult.correct || streakMilestone === null) && (
          <div className={`phys-result-flash ${game.lastResult.correct ? "flash-correct" : ""}`}>
            <div className={`phys-result-badge ${game.lastResult.correct ? "correct" : "wrong"}`}>
              {game.lastResult.correct ? t("physicalGeoGame.correct") : t("physicalGeoGame.wrong")}
            </div>
          </div>
        )}
        <div
          ref={wrapperRef}
          style={{
            ...getMapWrapperStyle(OUTER_W, OUTER_H, FRAME, "#5b8cff"),
            position: "relative",
            ...(activeMode.key === "waters" ? { background: "#0f2a4a" } : {}),
          }}
          aria-label={t("physicalGeoGame.mapAria")}
        >
          <Suspense
            fallback={
              <div
                style={{
                  width: INNER_W,
                  height: INNER_H,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  background: "#0f2a4a",
                }}
              >
                <div className="phys-map-loading-spinner" />
              </div>
            }
          >
            <InteractiveMap
              width={INNER_W}
              height={INNER_H}
              scale={FIT_SCALE}
              center={[0, 15]}
              zoom={pos.zoom}
              coordinates={pos.coordinates}
              isDesktop={isDesktop}
              borderless
              renderGeographies={hasActiveMode && !needsDetailedLandMask}
              geoLandPath={needsDetailedLandMask ? landPathD : null}
              geoUrl={needsDetailedLandMask ? undefined : MERGED_URL}
              onGeographiesLoaded={handleBaseGeographiesLoaded}
              onMoveEnd={handleMapMoveEnd}
              underlayInteractive={activeMode.key === "waters"}
              renderUnderlay={canRenderFeatureOverlay && activeMode.key === "waters" ? renderWaterUnderlay : undefined}
              overlayInteractive={true}
              renderOverlay={canRenderFeatureOverlay ? (activeMode.key === "waters" ? renderLandOnlyOverlay : renderOverlay) : undefined}
            />
          </Suspense>
          {hasActiveMode && !baseMapReady && (
            <div className="phys-base-loading-veil" aria-live="polite" aria-label={t("physicalGeoGame.loadingMapBase")}
            >
              <div className="phys-map-loading-spinner" />
            </div>
          )}
        </div>
      </div>
    </>
  );
}

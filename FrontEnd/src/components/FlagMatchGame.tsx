import { useEffect, useRef, useState, useCallback, useMemo, lazy, Suspense } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from 'react-i18next';
import { BackButton } from "./BackButton";
import { SEOHelmet } from "./SEOHelmet";
import GameHUD from "./GameHUD";
import {
  HUDCard,
  isLayoutConstrained,
  getGameContainerStyle,
  CONSTRAINED_BACK_BUTTON_STYLE,
} from "./hud";
import { useAuth } from "../contexts/AuthContext";
import { normalizeCountryName } from "../utils/countries";
import { FRAME } from "../utils/mapConstants";
import { useFlagMatchGame } from "../hooks/useFlagMatchGame";
import { useMapDimensions } from "../hooks/useMapDimensions";
import { usePreventWheelScroll } from "../hooks/usePreventWheelScroll";
import {
  getMapWrapperStyle,
  GREEN_BUTTON_STYLE,
  GREEN_BUTTON_HOVER,
} from "../utils/sharedStyles";
import { getTodayDateString } from "../utils/dateUtils";
import { buildLocalizedPath } from '../utils/localeRouting';
import { getBaseLanguage } from '../utils/localeRouting';
import { SEO_TRANSLATIONS, toCanonicalUrlWithLanguage, getSeoOgImage } from "../seo/seo-translations";
import "./FlagMatchGame.css";

// Lazy load the heavy InteractiveMap component
const InteractiveMap = lazy(() => import("./InteractiveMap"));

const FLAG_REGION_ROUTES: Record<string, string | null> = {
  world: null,
  europe: "Europe",
  asia: "Asia",
  africa: "Africa",
  americas: "Americas",
  oceania: "Oceania",
};

export default function FlagMatchGame() {
  const { t, i18n } = useTranslation();
  const seoH1 = t("seo.h1.flagMatch");
  const currentLanguage = getBaseLanguage(i18n.language);
  const { user } = useAuth();
  const navigate = useNavigate();
  const { regionKey } = useParams<{ regionKey?: string }>();

  const routeRegionKey = regionKey?.toLowerCase();
  const hasValidRegionRoute = !!routeRegionKey && routeRegionKey in FLAG_REGION_ROUTES;
  const selectedRegion = useMemo<string | null>(() => {
    if (!hasValidRegionRoute || !routeRegionKey) {
      return null;
    }
    return FLAG_REGION_ROUTES[routeRegionKey];
  }, [hasValidRegionRoute, routeRegionKey]);
  const showRegionSelector = !regionKey || !hasValidRegionRoute;
  const hasUserSelected = !showRegionSelector;
  const canonicalFlagPath = hasValidRegionRoute && routeRegionKey
    ? `/game/flags/${routeRegionKey}`
    : "/game/flags/world";

  const [showRegionalIndicator, setShowRegionalIndicator] = useState(true);

  // Use custom hook for game logic (only initialize if a region has been selected)
  const game = useFlagMatchGame(showRegionSelector ? null : selectedRegion, hasUserSelected, getBaseLanguage(i18n.language));

  // Track if streak has been saved to avoid duplicates
  const streakSavedRef = useRef(false);

  // Function to save streak to both all-time and daily collections
  const saveStreak = useCallback(async (streak: number) => {
    // Only save to leaderboard for World mode (no region filter)
    if (streakSavedRef.current || streak <= 0 || !user || selectedRegion !== null) {
      return;
    }
    
    try {
      streakSavedRef.current = true;
      
      // Dynamically import Firebase to avoid blocking initial load
      const [{ doc, getDoc, setDoc, serverTimestamp }, { db }] = await Promise.all([
        import('firebase/firestore'),
        import('../firebase')
      ]);
      
      // 1. Save to ALL-TIME streaks (streaks/{userId})
      const allTimeDocRef = doc(db, "streaks", user.uid);
      const allTimeDoc = await getDoc(allTimeDocRef);
      
      const allTimeBest = allTimeDoc.exists() ? (allTimeDoc.data().streak || 0) : 0;
      
      if (streak > allTimeBest) {
        await setDoc(allTimeDocRef, {
          userId: user.uid,
          username: user.displayName,
          streak: streak,
          createdAt: serverTimestamp(),
          gameType: "FlagMatch",
        });
      }
      
      // 2. Save to DAILY streaks (dailyStreaks/{date}_{userId})
      const todayDate = getTodayDateString();
      const dailyDocId = `${todayDate}_${user.uid}`;
      const dailyDocRef = doc(db, "dailyStreaks", dailyDocId);
      const dailyDoc = await getDoc(dailyDocRef);
      
      const todayBest = dailyDoc.exists() ? (dailyDoc.data().streak || 0) : 0;
      
      if (streak > todayBest) {
        await setDoc(dailyDocRef, {
          date: todayDate,
          userId: user.uid,
          username: user.displayName,
          streak: streak,
          createdAt: serverTimestamp(),
          gameType: "FlagMatch",
        });
      }
    } catch (error) {
      streakSavedRef.current = false;
    }
  }, [user, selectedRegion]);

  // Handle back navigation with streak save
  const handleBack = useCallback(() => {
    if (game.bestStreak > 0 && user && !streakSavedRef.current) {
      saveStreak(game.bestStreak);
    }
    navigate(buildLocalizedPath('/', i18n.language));
  }, [game.bestStreak, user, saveStreak, navigate, i18n.language]);

  // Layout sizing using shared hook
  const { dimensions, isPortrait, isDesktop } = useMapDimensions();

  // Track viewport dimensions to handle non-standard / constrained aspect ratios
  const [viewport, setViewport] = useState(() => ({
    width: typeof window !== "undefined" ? window.innerWidth : 1200,
    height: typeof window !== "undefined" ? window.innerHeight : 800,
  }));

  useEffect(() => {
    const handleResize = () => {
      setViewport({
        width: window.innerWidth,
        height: window.visualViewport ? window.visualViewport.height : window.innerHeight,
      });
    };
    window.addEventListener("resize", handleResize);
    if (window.visualViewport) {
      window.visualViewport.addEventListener("resize", handleResize);
    }
    return () => {
      window.removeEventListener("resize", handleResize);
      if (window.visualViewport) {
        window.visualViewport.removeEventListener("resize", handleResize);
      }
    };
  }, []);

  const OUTER_W = dimensions.width;
  const OUTER_H = dimensions.height;
  const INNER_W = OUTER_W - FRAME * 2;
  const INNER_H = OUTER_H - FRAME * 2;

  // Determine compact (mobile/portrait or narrow screens under 900px, or under 1024px if regional practice badge is active)
  const isPracticeActive = Boolean(selectedRegion && showRegionalIndicator && !game.gameOver);
  const isConstrained = isLayoutConstrained(viewport.width, viewport.height, isPortrait, OUTER_H);
  const isHudPortrait = isPortrait || isConstrained;
  const isCompact = isPortrait || viewport.width < (isPracticeActive ? 1024 : 900);
  const useConstrainedBackButton = isConstrained || (!isPortrait && viewport.height <= 500) || viewport.width < 768;
  const mapTop = isConstrained ? 0 : Math.max(0, Math.round((viewport.height - OUTER_H) / 2));

  // Region zoom configurations - coordinates are [longitude, latitude]
  const REGION_ZOOMS: Record<string, { coordinates: [number, number]; zoom: number }> = {
    Europe: { coordinates: [15, 54], zoom: 3.5 },
    Asia: { coordinates: [90, 30], zoom: 2 },
    Africa: { coordinates: [20, 0], zoom: 2.5 },
    Oceania: { coordinates: [135, -25], zoom: 2.5 },
    Americas: { coordinates: [-60, -10], zoom: 1.8 }, // All Americas combined
  };

  const [pos, setPos] = useState<{ coordinates: [number, number]; zoom: number }>(
    { coordinates: [0, 0], zoom: 1 }
  );
  
  // Key for forcing InteractiveMap remount when dimensions change (for regional mode)
  // This solves the issue where react-simple-maps internal state gets corrupted on resize
  const [mapKey, setMapKey] = useState(0);
  const lastDimensionsRef = useRef({ width: dimensions.width, height: dimensions.height });

  // Update zoom when region is selected
  useEffect(() => {
    if (selectedRegion && REGION_ZOOMS[selectedRegion]) {
      const regionZoom = REGION_ZOOMS[selectedRegion];
      setPos(regionZoom);
      setShowRegionalIndicator(true);
    } else if (!selectedRegion) {
      setPos({ coordinates: [0, 0], zoom: 1 });
      setShowRegionalIndicator(false);
    }
  }, [selectedRegion]);
  
  // When dimensions change in regional mode, force remount the map to reset internal state
  useEffect(() => {
    const lastDims = lastDimensionsRef.current;
    const dimsChanged = lastDims.width !== dimensions.width || lastDims.height !== dimensions.height;
    
    if (dimsChanged) {
      lastDimensionsRef.current = { width: dimensions.width, height: dimensions.height };
      
      // In regional mode, force remount the map to prevent coordinate drift
      if (selectedRegion) {
        setMapKey(k => k + 1);
      }
    }
  }, [dimensions.width, dimensions.height, selectedRegion]);

  // prevent page scroll on wheel over map
  const wrapperRef = useRef<HTMLDivElement>(null);
  usePreventWheelScroll(wrapperRef);

  const [streakMilestone, setStreakMilestone] = useState<number | null>(null);
  const prevStreakRef = useRef(0);
  useEffect(() => {
    const cur = game.currentStreak;
    const prev = prevStreakRef.current;
    prevStreakRef.current = cur;
    if (cur >= 5 && cur > prev && cur % 5 === 0) {
      setStreakMilestone(cur);
      const timer = window.setTimeout(() => setStreakMilestone(null), 1200);
      return () => window.clearTimeout(timer);
    }
  }, [game.currentStreak]);

  const FIT_SCALE = Math.max(1, Math.round(INNER_W * 0.32));

  const handleMoveEnd = useCallback(({ zoom, coordinates }: { zoom: number; coordinates: [number, number] }) => {
    // Only allow manual position changes in World mode
    // For regional mode, map is remounted on resize so position stays correct
    if (!selectedRegion) {
      setPos({ zoom, coordinates });
    }
  }, [selectedRegion]);

  const handleCountryClick = useCallback((nameRaw: string) => {
    game.onCountryClick(nameRaw);
  }, [game.onCountryClick]);

  const handleGeographiesLoaded = useCallback((geographies: any[]) => {
    game.handleGeographiesLoaded(geographies);
  }, [game.handleGeographiesLoaded]);

  const handleGetCountryFill = useCallback((nameRaw: string) => {
    const norm = normalizeCountryName(nameRaw);
    
    const isCorrect = game.correctSet.has(norm);
    const isSkipped = game.skippedSet.has(norm);
    const defaultFill = "#e0d8c2";
    const isLastWrong = game.lastClicked?.name === norm && game.lastClicked?.status === "wrong";
    
    return isCorrect
      ? "#10b981"
      : isSkipped
      ? "#ff8c00"
      : isLastWrong
      ? "#ef4444"
      : defaultFill;
  }, [game.correctSet, game.skippedSet, game.lastClicked]);

  return (
    <>
      <SEOHelmet
        title="Flag Match Game - World Quiz"
        description="Match country flags in world or regional mode and build your streak in World Quiz."
        canonicalUrl={toCanonicalUrlWithLanguage(canonicalFlagPath, currentLanguage)}
        ogImage={getSeoOgImage(SEO_TRANSLATIONS.routes.home)}
      />
      <h1 className="sr-only">{seoH1}</h1>
      {/* Region Selector Modal */}
      {showRegionSelector && (
        <div className="region-selector-overlay">
          <div className="region-selector-content">
            <h2 className="region-selector-title">
              🌍 {t('flagMatch.regionSelectorTitle')}
            </h2>
            <p className="region-selector-subtitle">
              {t('flagMatch.regionSelectorSubtitle')}
            </p>

            <div className={`region-button-grid ${isPortrait ? 'portrait' : 'landscape'}`}>
              {/* World (no filter) */}
              <button
                onClick={() => {
                  navigate(buildLocalizedPath('/game/flags/world', i18n.language));
                }}
                className="region-btn-world"
                style={{
                  ...GREEN_BUTTON_STYLE,
                }}
                {...GREEN_BUTTON_HOVER}
              >
                🌎 {t('flagMatch.regionWorld')}
              </button>

              {/* Europe */}
              <button
                onClick={() => {
                  navigate(buildLocalizedPath('/game/flags/europe', i18n.language));
                }}
                className="region-btn region-btn-europe"
              >
                🇪🇺 {t('flagMatch.regionEurope')}
              </button>

              {/* Asia */}
              <button
                onClick={() => {
                  navigate(buildLocalizedPath('/game/flags/asia', i18n.language));
                }}
                className="region-btn region-btn-asia"
              >
                🌏 {t('flagMatch.regionAsia')}
              </button>

              {/* Africa */}
              <button
                onClick={() => {
                  navigate(buildLocalizedPath('/game/flags/africa', i18n.language));
                }}
                className="region-btn region-btn-africa"
              >
                🌍 {t('flagMatch.regionAfrica')}
              </button>

              {/* Americas */}
              <button
                onClick={() => {
                  navigate(buildLocalizedPath('/game/flags/americas', i18n.language));
                }}
                className="region-btn region-btn-americas"
              >
                🌎 {t('flagMatch.regionAmericas')}
              </button>

              {/* Oceania */}
              <button
                onClick={() => {
                  navigate(buildLocalizedPath('/game/flags/oceania', i18n.language));
                }}
                className="region-btn region-btn-oceania"
              >
                🌏 {t('flagMatch.regionOceania')}
              </button>
            </div>

            <button
              onClick={() => navigate(buildLocalizedPath('/', i18n.language))}
              className="region-selector-back-btn"
            >
              ← {t('flagMatch.backToMenu')}
            </button>
          </div>
        </div>
      )}

      <div
        style={getGameContainerStyle(isPortrait, isConstrained)}
        lang={currentLanguage}
      >
        <BackButton
          onClick={handleBack}
          label={t('flagMatch.menu')}
          style={useConstrainedBackButton ? CONSTRAINED_BACK_BUTTON_STYLE : undefined}
        />

      {/* Top center panel */}
      <HUDCard
        isPortrait={isPortrait}
        isConstrained={isConstrained}
        isCompact={isCompact}
        viewportWidth={viewport.width}
        mapTop={mapTop}
        maxCompactWidth={460}
      >
        <GameHUD
          loading={game.loading}
          loadError={game.loadError}
          gameOver={game.gameOver}
          hasWon={game.hasWon}
          score={game.score}
          bestStreak={game.bestStreak}
          skippedCount={game.skippedSet.size}
          currentTarget={game.currentTarget}
          currentIdx={game.currentIdx}
          targetsLength={game.targets.length}
          currentStreak={game.currentStreak}
          showNamePanel={game.showNamePanel}
          onStartNewGame={() => {
            game.startNewGame();
          }}
          onToggleNamePanel={() => game.setShowNamePanel((v) => !v)}
          onSkip={game.skipCurrentFlag}
          isPortrait={isHudPortrait}
          isPracticeMode={Boolean(selectedRegion && showRegionalIndicator && !game.gameOver)}
          onDismissPracticeMode={() => setShowRegionalIndicator(false)}
        />
      </HUDCard>

      {/* Win Animation */}
      {game.showWinAnimation && (
        <div className="win-animation-overlay">
          <div className="win-animation-content">
            <div className="win-emoji">
              {game.bestStreak === game.targets.length ? "🏆" : "🎉"}
            </div>
            <h2 className={`win-title ${game.bestStreak === game.targets.length ? 'legendary' : 'perfect'}`}>
              {game.bestStreak === game.targets.length ? t('flagMatch.legendary') : t('flagMatch.perfect')}
            </h2>
            <p className="win-message">
              {game.bestStreak === game.targets.length 
                ? t('flagMatch.legendaryMessage', { count: game.targets.length }) 
                : t('flagMatch.allFlagsMatched', { count: game.targets.length })}
            </p>
            {game.bestStreak < game.targets.length && (
              <p className="win-streak">
                {t('flagMatch.bestStreak', { count: game.bestStreak })} 🔥
              </p>
            )}
            {game.bestStreak === game.targets.length && (
              <p className="win-quote">
                {t('flagMatch.legendaryQuote')}
              </p>
            )}
            <div className="win-buttons">
              <button
                onClick={() => navigate(buildLocalizedPath('/', i18n.language))}
                className="win-home-btn"
              >
                🏠 {t('flagMatch.home')}
              </button>
              <button
                onClick={() => {
                  navigate(buildLocalizedPath('/game/flags', i18n.language));
                }}
                className="win-new-game-btn"
                style={{
                  ...GREEN_BUTTON_STYLE,
                }}
                {...GREEN_BUTTON_HOVER}
              >
                🎮 {t('flagMatch.newGame')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Streak milestone animation - matches physical geo 5*n pop */}
      {streakMilestone !== null && (
        <div key={streakMilestone} className="flag-streak-animation">
          {streakMilestone} 🔥
        </div>
      )}

      {game.showNamePanel && game.currentTarget && (
        <div className="name-panel">
          {normalizeCountryName(game.currentTarget.name)}
        </div>
      )}

      <div
        ref={wrapperRef}
        style={{
          ...getMapWrapperStyle(OUTER_W, OUTER_H, FRAME, "#5b8cff"),
          position: "relative",
          flexShrink: 0,
          margin: isConstrained ? "0 auto" : "auto 0",
        }}
        aria-label={t('flagMatch.mapAriaLabel')}
      >
        <Suspense fallback={
          <div style={{
            width: INNER_W,
            height: INNER_H,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "#e0d8c2"
          }}>
            <div className="map-loading-spinner" />
          </div>
        }>
          <InteractiveMap
            key={selectedRegion ? `region-${selectedRegion}-${mapKey}` : 'world'}
            width={INNER_W}
            height={INNER_H}
            scale={Math.max(1, Math.round(INNER_W * 0.32))}
            center={[0, 15]}
            zoom={pos.zoom}
            coordinates={pos.coordinates}
            isDesktop={isDesktop}
            gameMode={true}
            isCountryInteractive={selectedRegion ? game.isCountryInSelectedRegion : undefined}
            onMoveEnd={handleMoveEnd}
            onCountryClick={handleCountryClick}
            onGeographiesLoaded={handleGeographiesLoaded}
            getCountryFill={handleGetCountryFill}
          />
        </Suspense>
      </div>
    </div>
    </>
  );
}

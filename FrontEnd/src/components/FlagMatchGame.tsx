import { useEffect, useRef, useState, useCallback, useMemo, lazy, Suspense } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from 'react-i18next';
import { BackButton } from "./BackButton";
import { SEOHelmet } from "./SEOHelmet";
import GameHUD from "./GameHUD";
import { useAuth } from "../contexts/AuthContext";
import { normalizeCountryName } from "../utils/countries";
import { FRAME } from "../utils/mapConstants";
import { useFlagMatchGame } from "../hooks/useFlagMatchGame";
import { useMapDimensions } from "../hooks/useMapDimensions";
import { usePreventWheelScroll } from "../hooks/usePreventWheelScroll";
import {
  PAGE_CONTAINER_STYLE,
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
  const { dimensions, isPortrait } = useMapDimensions();

  const OUTER_W = dimensions.width;
  const OUTER_H = dimensions.height;
  const INNER_W = OUTER_W - FRAME * 2;
  const INNER_H = OUTER_H - FRAME * 2;

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

  // Effect to save streak when game is over
  useEffect(() => {
    if (game.gameOver && game.bestStreak > 0) {
      saveStreak(game.bestStreak);
    }
  }, [game.gameOver, game.bestStreak, saveStreak]);

  // Reset streakSavedRef when starting a new game
  useEffect(() => {
    if (game.currentIdx === 0 && game.targets.length > 0 && !game.gameOver) {
      streakSavedRef.current = false;
    }
  }, [game.currentIdx, game.targets.length, game.gameOver]);

  return (
    <>
      <SEOHelmet
        title="Flag Match Game - World Quiz"
        description="Match country flags in world or regional mode and build your streak in World Quiz."
        canonicalUrl={toCanonicalUrlWithLanguage(canonicalFlagPath, currentLanguage)}
        ogImage={getSeoOgImage(SEO_TRANSLATIONS.routes.home)}
      />
      {/* Region Selector Modal */}
      {showRegionSelector && (
        <div className="region-selector-overlay">
          <div className="region-selector-content">
            <h1 className="region-selector-title">
              🌍 {t('flagMatch.regionSelectorTitle')}
            </h1>
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
        style={{
          ...PAGE_CONTAINER_STYLE,
          gap: isPortrait ? "clamp(16px, 3vh, 32px)" : "0",
        }}
      >
      <BackButton onClick={handleBack} label={t('flagMatch.menu')} />

      {/* Top center panel */}
      <div
        style={{
          position: isPortrait ? "relative" : "absolute",
          top: isPortrait ? "auto" : "clamp(8px, 4vh, 40px)",
          left: isPortrait ? "auto" : "50%",
          transform: isPortrait ? "none" : "translateX(-50%)",
          // In portrait mode, parent gap handles automatic centering
          marginBottom: isPortrait ? "0" : "0",
          marginTop: isPortrait ? "0" : "0",
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
          isPortrait={isPortrait}
        />
        
        {/* Regional Mode Indicator */}
        {selectedRegion && showRegionalIndicator && !game.gameOver && (
          <div 
            style={{
              fontSize: "clamp(10px, 2vw, 13px)",
              padding: "clamp(4px, 1vw, 6px) clamp(8px, 2vw, 12px)",
              background: "rgba(245, 158, 11, 0.15)",
              border: "1px solid rgba(245, 158, 11, 0.3)",
              borderRadius: "6px",
              color: "#fbbf24",
              fontWeight: 600,
              display: "flex",
              alignItems: "center",
              gap: "clamp(4px, 1vw, 8px)",
              flexShrink: 1,
              minWidth: 0,
              marginLeft: "clamp(4px, 1vw, 8px)",
              marginRight: "clamp(4px, 1vw, 8px)",
            }}
          >
            <span style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{t('flagMatch.practiceMode')}</span>
            <button
              onClick={() => setShowRegionalIndicator(false)}
              style={{
                background: "none",
                border: "none",
                color: "#fbbf24",
                cursor: "pointer",
                padding: "0 2px",
                fontSize: "clamp(12px, 2.5vw, 16px)",
                lineHeight: 1,
                opacity: 0.7,
              }}
              onMouseEnter={(e) => e.currentTarget.style.opacity = "1"}
              onMouseLeave={(e) => e.currentTarget.style.opacity = "0.7"}
            >
              ✕
            </button>
          </div>
        )}
      </div>

      {/* Win Animation */}
      {game.showWinAnimation && (
        <div className="win-animation-overlay">
          <div className="win-animation-content">
            <div className="win-emoji">
              {game.bestStreak === game.targets.length ? "🏆" : "🎉"}
            </div>
            <h1 className={`win-title ${game.bestStreak === game.targets.length ? 'legendary' : 'perfect'}`}>
              {game.bestStreak === game.targets.length ? t('flagMatch.legendary') : t('flagMatch.perfect')}
            </h1>
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
            isDesktop={!isPortrait && window.innerWidth >= 768}
            gameMode={true}
            isCountryInteractive={selectedRegion ? game.isCountryInSelectedRegion : undefined}
            onMoveEnd={({ zoom, coordinates }: { zoom: number; coordinates: [number, number] }) => {
              // Only allow manual position changes in World mode
              // For regional mode, map is remounted on resize so position stays correct
              if (!selectedRegion) {
                setPos({ zoom, coordinates });
              }
            }}
            onCountryClick={(nameRaw: string) => {
              game.onCountryClick(nameRaw);
            }}
            onGeographiesLoaded={(geographies) => {
              game.handleGeographiesLoaded(geographies);
            }}
            getCountryFill={(nameRaw: string) => {
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
            }}
          />
        </Suspense>
      </div>
    </div>
    </>
  );
}

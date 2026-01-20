import { useEffect, useRef, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { BackButton } from "./BackButton";
import InteractiveMap from "./InteractiveMap";
import GameHUD from "./GameHUD";
import { useAuth } from "../contexts/AuthContext";
import { db } from "../firebase";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
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
import "./FlagMatchGame.css";

export default function FlagMatchGame() {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Region selection state
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null);
  const [showRegionSelector, setShowRegionSelector] = useState(true);
  const [showRegionalIndicator, setShowRegionalIndicator] = useState(true);
  const [hasUserSelected, setHasUserSelected] = useState(false);

  // Use custom hook for game logic
  const game = useFlagMatchGame(selectedRegion, hasUserSelected);

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
      console.error("Error saving streak:", error);
      streakSavedRef.current = false; // Allow retry on error
    }
  }, [user, selectedRegion]);

  // Handle back navigation with streak save
  const handleBack = useCallback(() => {
    if (game.bestStreak > 0 && user && !streakSavedRef.current) {
      saveStreak(game.bestStreak);
    }
    navigate("/");
  }, [game.bestStreak, user, saveStreak, navigate]);

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

  // Update zoom when region is selected
  useEffect(() => {
    if (selectedRegion && REGION_ZOOMS[selectedRegion]) {
      const regionZoom = REGION_ZOOMS[selectedRegion];
      console.log(`[FlagMatchGame] Setting zoom for ${selectedRegion}:`, regionZoom);
      setPos(regionZoom);
      setShowRegionalIndicator(true); // Show indicator when region changes
    } else if (!selectedRegion) {
      // Reset to world view
      console.log('[FlagMatchGame] Resetting to world view');
      setPos({ coordinates: [0, 0], zoom: 1 });
      setShowRegionalIndicator(false);
    }
  }, [selectedRegion]);

  // prevent page scroll on wheel over map
  const wrapperRef = useRef<HTMLDivElement>(null);
  usePreventWheelScroll(wrapperRef);

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
      {/* Region Selector Modal */}
      {showRegionSelector && (
        <div className="region-selector-overlay">
          <div className="region-selector-content">
            <h1 className="region-selector-title">
              🌍 Flag Match Game
            </h1>
            <p className="region-selector-subtitle">
              Choose your region or play worldwide
            </p>

            <div className={`region-button-grid ${isPortrait ? 'portrait' : 'landscape'}`}>
              {/* World (no filter) */}
              <button
                onClick={() => {
                  setSelectedRegion(null);
                  setHasUserSelected(true);
                  setShowRegionSelector(false);
                }}
                className="region-btn-world"
                style={{
                  ...GREEN_BUTTON_STYLE,
                }}
                {...GREEN_BUTTON_HOVER}
              >
                🌎 World (All Countries)
              </button>

              {/* Europe */}
              <button
                onClick={() => {
                  setSelectedRegion("Europe");
                  setHasUserSelected(true);
                  setShowRegionSelector(false);
                }}
                className="region-btn region-btn-europe"
              >
                🇪🇺 Europe
              </button>

              {/* Asia */}
              <button
                onClick={() => {
                  setSelectedRegion("Asia");
                  setHasUserSelected(true);
                  setShowRegionSelector(false);
                }}
                className="region-btn region-btn-asia"
              >
                🌏 Asia
              </button>

              {/* Africa */}
              <button
                onClick={() => {
                  setSelectedRegion("Africa");
                  setHasUserSelected(true);
                  setShowRegionSelector(false);
                }}
                className="region-btn region-btn-africa"
              >
                🌍 Africa
              </button>

              {/* Americas */}
              <button
                onClick={() => {
                  setSelectedRegion("Americas");
                  setHasUserSelected(true);
                  setShowRegionSelector(false);
                }}
                className="region-btn region-btn-americas"
              >
                🌎 Americas
              </button>

              {/* Oceania */}
              <button
                onClick={() => {
                  setSelectedRegion("Oceania");
                  setHasUserSelected(true);
                  setShowRegionSelector(false);
                }}
                className="region-btn region-btn-oceania"
              >
                🌏 Oceania
              </button>
            </div>

            <button
              onClick={() => navigate("/")}
              className="region-selector-back-btn"
            >
              ← Back to Menu
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
      <BackButton onClick={handleBack} />

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
            <span style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>Practice Mode</span>
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
              {game.bestStreak === 25 ? "🏆" : "🎉"}
            </div>
            <h1 className={`win-title ${game.bestStreak === 25 ? 'legendary' : 'perfect'}`}>
              {game.bestStreak === 25 ? "LEGENDARY!" : "Perfect!"}
            </h1>
            <p className="win-message">
              {game.bestStreak === 25 
                ? "25 flags, 25 streak! Flawless victory! 🔥" 
                : "All 25 flags matched! 🌍"}
            </p>
            {game.bestStreak < 25 && (
              <p className="win-streak">
                Best streak: {game.bestStreak} 🔥
              </p>
            )}
            {game.bestStreak === 25 && (
              <p className="win-quote">
                "Is it possible to learn this power?" — Everyone else
              </p>
            )}
            <div className="win-buttons">
              <button
                onClick={() => navigate("/")}
                className="win-home-btn"
              >
                🏠 Home
              </button>
              <button
                onClick={() => {
                  setShowRegionSelector(true);
                  setSelectedRegion(null);
                }}
                className="win-new-game-btn"
                style={{
                  ...GREEN_BUTTON_STYLE,
                }}
                {...GREEN_BUTTON_HOVER}
              >
                🎮 New Game
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Streak Animation - displayed in the center of the map */}
      {game.showStreakAnimation && game.currentStreak >= 5 && wrapperRef.current && (
        <div className="streak-animation">
          {game.currentStreak} 🔥
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
        aria-label="Flag match game map"
      >
        <InteractiveMap
          width={INNER_W}
          height={INNER_H}
          scale={Math.max(1, Math.round(INNER_W * 0.32))}
          center={[0, 15]}
          zoom={pos.zoom}
          coordinates={pos.coordinates}
          isDesktop={!isPortrait && window.innerWidth >= 768}
          onMoveEnd={({ zoom, coordinates }: { zoom: number; coordinates: [number, number] }) => {
            // Lock map position when region is selected
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
      </div>
    </div>
    </>
  );
}

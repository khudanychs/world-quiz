import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import InteractiveMap from "./InteractiveMap";
import GameHUD from "./GameHUD";
import { useAuth } from "../contexts/AuthContext";
import { db } from "../firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { normalizeCountryName } from "../utils/countries";
import { BASE_W, BASE_H, FRAME, calculateMapDimensions } from "../utils/mapConstants";
import { useFlagMatchGame } from "../hooks/useFlagMatchGame";

export default function FlagMatchGame() {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Use custom hook for game logic
  const game = useFlagMatchGame();

  // Layout sizing
  const [dimensions, setDimensions] = useState({ width: BASE_W, height: BASE_H });
  const [isPortrait, setIsPortrait] = useState(window.innerHeight > window.innerWidth);
  useEffect(() => {
    const update = () => {
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      setIsPortrait(vh > vw);
      setDimensions(calculateMapDimensions(vw, vh));
    };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  const OUTER_W = dimensions.width;
  const OUTER_H = dimensions.height;
  const INNER_W = OUTER_W - FRAME * 2;
  const INNER_H = OUTER_H - FRAME * 2;

  const [pos, setPos] = useState<{ coordinates: [number, number]; zoom: number }>(
    { coordinates: [0, 0], zoom: 1 }
  );

  // prevent page scroll on wheel over map
  const wrapperRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = wrapperRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => e.preventDefault();
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel as any);
  }, []);

  const FIT_SCALE = Math.max(1, Math.round(INNER_W * 0.32));

  // Effect to save score when game is over
  useEffect(() => {
    if (game.gameOver && user && game.score > 0) {
      const saveScore = async () => {
        try {
          await addDoc(collection(db, "scores"), {
            userId: user.uid,
            username: user.displayName,
            score: game.score,
            bestStreak: game.bestStreak,
            createdAt: serverTimestamp(),
            gameType: "FlagMatch",
          });
          console.log("Score saved successfully!");
        } catch (error) {
          console.error("Error saving score: ", error);
        }
      };

      saveScore();
    }
  }, [game.gameOver, user, game.score, game.bestStreak]);

  return (
    <>
      <style>
        {`
          @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
          }
          @keyframes scaleIn {
            from { transform: scale(0.5); opacity: 0; }
            to { transform: scale(1); opacity: 1; }
          }
          @keyframes streakPop {
            0% { transform: translate(-50%, -50%) scale(0.8); opacity: 0; }
            40% { transform: translate(-50%, -50%) scale(1.15); opacity: 1; }
            60% { transform: translate(-50%, -50%) scale(1.05); opacity: 1; }
            100% { transform: translate(-50%, -50%) scale(0.95); opacity: 0; }
          }
        `}
      </style>
      <div
        style={{
          height: "100%",
          width: "100%",
          background: "#0b1020",
          color: "#fff",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          overflow: "hidden",
          position: "relative",
          overscrollBehavior: "none",
          gap: isPortrait ? "clamp(16px, 3vh, 32px)" : "0", // Mezera mezi HUD a mapou
        }}
      >
      <button
        onClick={() => navigate("/")}
        aria-label="Back to main menu"
        style={{
          position: "absolute",
          top: 12,
          left: 12,
          zIndex: 4,
          display: "inline-flex",
          alignItems: "center",
          gap: 8,
          padding: "8px 12px",
          borderRadius: 10,
          border: "1px solid rgba(255,255,255,0.25)",
          background: "rgba(0,0,0,0.45)",
          color: "#fff",
          cursor: "pointer",
          backdropFilter: "blur(6px)",
          boxShadow: "0 4px 12px rgba(0,0,0,0.35)",
        }}
      >
        <span style={{ fontSize: 18, lineHeight: 1 }}>←</span>
        <span style={{ fontWeight: 600 }}>Back</span>
      </button>

      {/* Top center panel */}
      <div
        style={{
          position: isPortrait ? "relative" : "absolute",
          top: isPortrait ? "auto" : "clamp(8px, 4vh, 40px)",
          left: isPortrait ? "auto" : "50%",
          transform: isPortrait ? "none" : "translateX(-50%)",
          // V portrait módu gap z rodiče zajišťuje automatické centrování
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
        }}
      >
        <GameHUD
          loading={game.loading}
          loadError={game.loadError}
          gameOver={game.gameOver}
          hasWon={game.hasWon}
          score={game.score}
          bestStreak={game.bestStreak}
          currentTarget={game.currentTarget}
          currentIdx={game.currentIdx}
          targetsLength={game.targets.length}
          currentStreak={game.currentStreak}
          showNamePanel={game.showNamePanel}
          onStartNewGame={game.startNewGame}
          onToggleNamePanel={() => game.setShowNamePanel((v) => !v)}
          onSkip={game.skipCurrentFlag}
          isPortrait={isPortrait}
        />
      </div>

      {/* Win Animation */}
      {game.showWinAnimation && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "rgba(0, 0, 0, 0.85)",
            animation: "fadeIn 0.3s ease-out",
          }}
        >
          <div
            style={{
              textAlign: "center",
              animation: "scaleIn 0.5s ease-out",
              position: "relative",
            }}
          >
            <div style={{ fontSize: "clamp(60px, 15vw, 120px)", marginBottom: 20 }}>🎉</div>
            <h1 style={{ fontSize: "clamp(32px, 8vw, 64px)", margin: "0 0 20px", color: "#10b981" }}>
              Perfect!
            </h1>
            <p style={{ fontSize: "clamp(18px, 4.5vw, 32px)", margin: "0 0 40px", opacity: 0.9 }}>
              All 25 flags matched! 🌍
            </p>
            <div
              style={{
                display: "flex",
                gap: "clamp(12px, 3vw, 20px)",
                justifyContent: "center",
                flexWrap: "wrap",
              }}
            >
              <button
                onClick={() => {
                  // Close by navigating home
                  navigate("/");
                }}
                style={{
                  padding: "clamp(10px, 2.5vw, 14px) clamp(20px, 5vw, 32px)",
                  borderRadius: "clamp(8px, 2vw, 12px)",
                  border: "2px solid rgba(255, 255, 255, 0.3)",
                  background: "rgba(255, 255, 255, 0.1)",
                  color: "#fff",
                  fontSize: "clamp(14px, 3.5vw, 18px)",
                  fontWeight: 600,
                  cursor: "pointer",
                  transition: "all 0.2s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "rgba(255, 255, 255, 0.2)";
                  e.currentTarget.style.transform = "scale(1.05)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "rgba(255, 255, 255, 0.1)";
                  e.currentTarget.style.transform = "scale(1)";
                }}
              >
                🏠 Home
              </button>
              <button
                onClick={() => {
                  game.startNewGame();
                }}
                style={{
                  padding: "clamp(10px, 2.5vw, 14px) clamp(20px, 5vw, 32px)",
                  borderRadius: "clamp(8px, 2vw, 12px)",
                  border: "2px solid rgba(16, 185, 129, 0.5)",
                  background: "rgba(16, 185, 129, 0.2)",
                  color: "#10b981",
                  fontSize: "clamp(14px, 3.5vw, 18px)",
                  fontWeight: 600,
                  cursor: "pointer",
                  transition: "all 0.2s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "rgba(16, 185, 129, 0.3)";
                  e.currentTarget.style.transform = "scale(1.05)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "rgba(16, 185, 129, 0.2)";
                  e.currentTarget.style.transform = "scale(1)";
                }}
              >
                🎮 New Game
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Streak Animation - zobrazí se uprostřed mapy */}
      {game.showStreakAnimation && game.currentStreak >= 5 && wrapperRef.current && (
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            zIndex: 10,
            fontSize: "clamp(32px, 8vw, 64px)",
            fontWeight: "bold",
            color: "#fb923c",
            textShadow: "0 0 20px rgba(251, 146, 60, 0.8), 0 0 40px rgba(251, 146, 60, 0.4)",
            animation: "streakPop 1.2s ease-in-out",
            pointerEvents: "none",
          }}
        >
          {game.currentStreak} 🔥
        </div>
      )}

      {game.showNamePanel && game.lastClicked && (
        <div
          style={{
            position: "absolute",
            bottom: 16,
            left: "50%",
            transform: "translateX(-50%)",
            padding: "8px 12px",
            background: "rgba(0,0,0,0.5)",
            borderRadius: 10,
            border: "1px solid rgba(255,255,255,0.25)",
            zIndex: 4,
            maxWidth: "92vw",
            fontSize: "clamp(12px, 3vw, 16px)",
            textAlign: "center",
          }}
        >
          {normalizeCountryName(game.lastClicked.name)}
        </div>
      )}

      <div
        ref={wrapperRef}
        style={{
          width: OUTER_W,
          height: OUTER_H,
          border: `${FRAME}px solid #5b8cff`,
          borderRadius: 24,
          overflow: "hidden",
          boxShadow: "0 10px 30px rgba(0,0,0,0.35)",
          background: "linear-gradient(180deg, #0f2a4a 0%, #0b1c34 60%, #081226 100%)",
          display: "grid",
          placeItems: "center",
          touchAction: "none",
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
          onMoveEnd={({ zoom, coordinates }: { zoom: number; coordinates: [number, number] }) =>
            setPos({ zoom, coordinates })
          }
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

import { geoNaturalEarth1, geoPath, geoCentroid } from "d3-geo";
import { useEffect, useState, useLayoutEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { BackButton } from "./BackButton";
import { CountryCard, useCardMatchGame, CardKind } from "../hooks/useCardMatchGame";
import { saveCardsMatchScore } from "../utils/leaderboardUtils";
import {
    GREEN_BUTTON_HOVER,
    GREEN_BUTTON_STYLE,
    PAGE_CONTAINER_STYLE,
} from "../utils/sharedStyles";

// SVG dimensions for rendering country shapes
const SVG_WIDTH = 100;
const SVG_HEIGHT = 100;

function CountryShapeSVG({ card }: { card: CountryCard }) {
  if (!card.geometry) {
    // Fallback: show a placeholder shape
    return (
      <svg
        viewBox="0 0 100 100"
        style={{
          width: "100%",
          height: "100%",
          display: "block",
        }}
      >
        <rect x="20" y="20" width="60" height="60" fill="#3b82f6" stroke="#1e40af" strokeWidth="2" rx="8" />
      </svg>
    );
  }

  // Convert geometry to GeoJSON Feature for pathGenerator
  const feature: GeoJSON.Feature = {
    type: 'Feature',
    properties: {},
    geometry: card.geometry as unknown as GeoJSON.Geometry
  };

  // 1. Calculate the centroid to center the projection on the country
  // This is crucial for countries that cross the date line (Russia, Fiji)
  // or are far from the center (NZ, etc.)
  const centroid = geoCentroid(feature);

  // 2. Configure projection with rotation
  // geoNaturalEarth1 is a good compromise between shape accuracy and familiarity
  const projection = geoNaturalEarth1()
    .rotate([-centroid[0], -centroid[1]]) // Rotate globe to center on the country
    .scale(100) // Arbitrary scale, will be fitted by bounds logic
    .translate([0, 0]); // Center at 0,0 for now

  const pathGenerator = geoPath(projection);

  // Get the path for the geometry
  const path = pathGenerator(feature);
  if (!path) {
    // Fallback if path generation fails
    return (
      <svg
        viewBox="0 0 100 100"
        style={{
          width: "100%",
          height: "100%",
          display: "block",
        }}
      >
        <circle cx="50" cy="50" r="30" fill="#3b82f6" stroke="#1e40af" strokeWidth="2" />
      </svg>
    );
  }

  // Calculate bounds to fit the shape in the viewBox
  const bounds = pathGenerator.bounds(feature);
  const [[x0, y0], [x1, y1]] = bounds;
  const width = x1 - x0;
  const height = y1 - y0;

  // Add padding
  const padding = Math.max(width, height) * 0.15;
  const viewBox = `${x0 - padding} ${y0 - padding} ${width + padding * 2} ${height + padding * 2}`;

  // Standardize stroke width relative to the view size
  // This ensures a consistent visual thickness regardless of country size
  const strokeWidth = Math.max(width, height) * 0.02;

  return (
    <svg
      viewBox={viewBox}
      style={{
        width: "100%",
        height: "100%",
        display: "block",
      }}
    >
      <path d={path} fill="#3b82f6" stroke="#1e40af" strokeWidth={strokeWidth} strokeLinejoin="round" />
    </svg>
  );
}

function GameCard({
  card,
  isSelected,
  isMatched,
  isFeedback,
  onClick,
  showColorLegend,
}: {
  card: CountryCard;
  isSelected: boolean;
  isMatched: boolean;
  isFeedback: boolean;
  onClick: () => void;
  showColorLegend: boolean;
}) {
  const isCorrectFeedback = isFeedback && isMatched;
  const isWrongFeedback = isFeedback && !isMatched;
  
  // Determine text color based on card type when legend is shown
  const getTextColor = () => {
    if (!showColorLegend) return "#fff";
    if (card.type === "country") return "#3b82f6"; // Blue for countries
    if (card.type === "capital") return "#ef4444"; // Red for capitals
    return "#fff";
  };

  return (
    <button
      onClick={onClick}
      disabled={isMatched}
      style={{
        position: "relative",
        aspectRatio: "1",
        border: isSelected
          ? "3px solid #3b82f6"
          : isMatched
          ? "3px solid #22c55e"
          : "2px solid rgba(255, 255, 255, 0.2)",
        borderRadius: "12px",
        background: isMatched
          ? "rgba(34, 197, 94, 0.2)"
          : isSelected
          ? "rgba(59, 130, 246, 0.2)"
          : "rgba(255, 255, 255, 0.05)",
        cursor: isMatched ? "default" : "pointer",
        transition: "all 0.12s ease",
        padding: "8px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
        transform: isSelected ? "scale(0.95)" : "scale(1)",
        opacity: isMatched ? 0.6 : 1,
        zIndex: isSelected || isFeedback ? 10 : 1,
        isolation: "isolate",
        animation: isCorrectFeedback
          ? "correct-pulse 0.4s ease"
          : isWrongFeedback
          ? "wrong-shake 0.3s ease"
          : "none",
      }}
    >
      {card.type === "flag" ? (
        <img
          src={card.flag}
          alt={card.name}
          draggable={false}
          onDragStart={(e) => e.preventDefault()}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "contain",
            borderRadius: "4px",
            userSelect: "none",
          }}
        />
      ) : card.type === "shape" ? (
        <CountryShapeSVG card={card} />
      ) : (
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "8px",
          }}
        >
          <span
            title={card.text || card.name}
            style={{
              color: getTextColor(),
              fontWeight: 700,
              textAlign: "center",
              lineHeight: 1.15,
              wordBreak: "break-word",
              hyphens: "auto",
              textShadow: showColorLegend ? "0 0 8px rgba(0,0,0,0.5)" : "none",
              // Base responsive size with adjustment for length
              fontSize: `clamp(12px, ${Math.max(2, 3 - ((card.text || card.name).length / 20))}vw, 22px)`,
            }}
          >
            {card.type === "country" ? (card.text || card.name) : (card.text || "")}
          </span>
        </div>
      )}

      {/* Overlay for matched state */}
      {isMatched && (
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            fontSize: "2rem",
            pointerEvents: "none",
          }}
        >
          ✓
        </div>
      )}

      <style>{`
        @keyframes correct-pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.1); box-shadow: 0 0 20px rgba(34, 197, 94, 0.6); }
        }
        @keyframes wrong-shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-10px); }
          75% { transform: translateX(10px); }
        }
      `}</style>
    </button>
  );
}

// Hook to detect orientation
function useOrientation() {
  const [isLandscape, setIsLandscape] = useState(window.innerWidth > window.innerHeight);

  useLayoutEffect(() => {
    const handleResize = () => {
      setIsLandscape(window.innerWidth > window.innerHeight);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return isLandscape;
}

export default function CardMatchGame() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [firstType, setFirstType] = useState<CardKind>("flag");
  const [secondType, setSecondType] = useState<CardKind>("shape");
  const game = useCardMatchGame({ first: firstType, second: secondType });
  const [showResults, setShowResults] = useState(false);
  const [savedToLeaderboard, setSavedToLeaderboard] = useState(false);
  const isLandscape = useOrientation();

  // Save score to Firebase when game ends
  useEffect(() => {
    if (!game.gameOver || savedToLeaderboard || !user) return;

    (async () => {
      try {
        const score = game.score;
        if (score === 0) return;

        await saveCardsMatchScore(user, score);
        setSavedToLeaderboard(true);
      } catch (err) {
        console.error("Failed to save score:", err);
      }
    })();
  }, [game.gameOver, game.score, user, savedToLeaderboard]);

  // Show results screen when game ends
  useEffect(() => {
    if (game.gameOver && game.gameStarted) {
      setTimeout(() => setShowResults(true), 500);
    }
  }, [game.gameOver, game.gameStarted]);

  const handleNewGame = () => {
    setShowResults(false);
    setSavedToLeaderboard(false);
    game.startNewGame();
  };

  const handleBack = async () => {
    // Save score if abandoning game with points
    if (game.gameStarted && !game.gameOver && game.score > 0 && !savedToLeaderboard) {
      try {
        await saveCardsMatchScore(user, game.score);
      } catch (e) {
        console.error("Failed to save on exit:", e);
      }
    }
    navigate("/");
  };

  if (game.loading) {
    return (
      <div style={{ ...PAGE_CONTAINER_STYLE, alignItems: "center", justifyContent: "center" }}>
        <div style={{ color: "#fff", fontSize: "18px" }}>Loading game...</div>
      </div>
    );
  }

  if (game.loadError) {
    return (
      <div style={{ ...PAGE_CONTAINER_STYLE, alignItems: "center", justifyContent: "center" }}>
        <div style={{ color: "#ef4444", fontSize: "18px" }}>Error: {game.loadError}</div>
        <BackButton
          onClick={handleBack}
          style={{ 
            position: "relative",
            top: "auto",
            left: "auto",
            marginTop: "20px" 
          }}
          label="Back to Menu"
        />
      </div>
    );
  }

  // Results screen
  if (showResults) {
    const totalMatches = game.totalMatches;

    return (
      <div
        style={{
          ...PAGE_CONTAINER_STYLE,
          alignItems: "center",
          justifyContent: "center",
          padding: "20px",
        }}
      >
        <div
          style={{
            background: "rgba(255, 255, 255, 0.05)",
            borderRadius: "16px",
            padding: "clamp(20px, 5vw, 40px)",
            maxWidth: "500px",
            width: "100%",
            textAlign: "center",
            border: "2px solid rgba(255, 255, 255, 0.1)",
          }}
        >
          <h2 style={{ color: "#fff", fontSize: "clamp(24px, 5vw, 32px)", marginBottom: "20px" }}>
            🎮 Game Over!
          </h2>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "12px",
              marginBottom: "30px",
              color: "#fff",
            }}
          >
            <div
              style={{
                fontSize: "clamp(48px, 10vw, 72px)",
                fontWeight: "bold",
                color: "#3b82f6",
              }}
            >
              {game.score.toLocaleString()}
            </div>
            <div style={{ fontSize: "clamp(14px, 3vw, 18px)", opacity: 0.8 }}>Points</div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "16px",
                marginTop: "20px",
              }}
            >
              <div
                style={{
                  background: "rgba(255, 255, 255, 0.05)",
                  padding: "16px",
                  borderRadius: "12px",
                }}
              >
                <div style={{ fontSize: "clamp(24px, 5vw, 32px)", fontWeight: "bold" }}>
                  {totalMatches}
                </div>
                <div style={{ fontSize: "14px", opacity: 0.7 }}>Total Matched</div>
              </div>

              <div
                style={{
                  background: "rgba(255, 255, 255, 0.05)",
                  padding: "16px",
                  borderRadius: "12px",
                }}
              >
                <div style={{ fontSize: "clamp(24px, 5vw, 32px)", fontWeight: "bold" }}>
                  {game.maxStreak}
                </div>
                <div style={{ fontSize: "14px", opacity: 0.7 }}>Max Streak</div>
              </div>
            </div>
          </div>

          <div style={{ display: "flex", gap: "12px", justifyContent: "center", flexWrap: "wrap" }}>
            <BackButton
              onClick={handleBack}
              style={{
                position: "relative",
                top: "auto",
                left: "auto",
                padding: "12px 24px",
                fontSize: "16px",
              }}
              label="Home"
              icon={<span>🏠</span>}
            />
            <button
              onClick={handleNewGame}
              style={{
                ...GREEN_BUTTON_STYLE,
                padding: "12px 24px",
                fontSize: "16px",
              }}
              {...GREEN_BUTTON_HOVER}
            >
              🎮 Play Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Pre-game screen
  if (!game.gameStarted) {
    return (
      <div
        style={{
          ...PAGE_CONTAINER_STYLE,
          alignItems: "center",
          justifyContent: "center",
          padding: "20px",
        }}
      >
        <div
          style={{
            background: "rgba(255, 255, 255, 0.05)",
            borderRadius: "16px",
            padding: "clamp(20px, 5vw, 40px)",
            maxWidth: "600px",
            width: "100%",
            textAlign: "center",
            border: "2px solid rgba(255, 255, 255, 0.1)",
          }}
        >
          <h1 style={{ color: "#fff", fontSize: "clamp(28px, 6vw, 40px)", marginBottom: "16px" }}>
            🎴 Cards Match
          </h1>
          <p
            style={{
              color: "rgba(255, 255, 255, 0.7)",
              fontSize: "clamp(14px, 3vw, 18px)",
              marginBottom: "20px",
              lineHeight: 1.6,
            }}
          >
            Choose what to match — Flags, Countries, Capitals, or Shapes — then match the pairs fast to build streaks and score big!
          </p>

          <div
            style={{
              background: "rgba(255, 255, 255, 0.05)",
              borderRadius: "12px",
              padding: "20px",
              marginBottom: "20px",
              textAlign: "left",
            }}
          >
            <h3 style={{ color: "#3b82f6", marginBottom: "12px", fontSize: "18px" }}>
              🎯 How to Play
            </h3>
            <ul
              style={{
                color: "rgba(255, 255, 255, 0.8)",
                fontSize: "14px",
                lineHeight: 1.8,
                paddingLeft: "20px",
              }}
            >
              <li>Match all pairs before time runs out (60 seconds)</li>
              <li>Base score: 1,000 points per match</li>
              <li>5 streak: 1.5x multiplier (1,500 pts)</li>
              <li>10 streak: 2x multiplier (2,000 pts)</li>
              <li>15 streak: 2.5x multiplier (2,500 pts)</li>
              <li>20+ streak: 3x multiplier (3,000 pts)</li>
            </ul>
          </div>

          {/* Mode Selector */}
          <div
            style={{
              display: "flex",
              gap: "clamp(12px, 3vw, 20px)",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: "24px",
              flexWrap: "wrap",
            }}
          >
            <div style={{ display: "flex", flexDirection: "column", gap: "8px", minWidth: "clamp(160px, 40%, 200px)", flex: "1" }}>
              <label style={{ color: "rgba(255,255,255,0.7)", fontSize: "clamp(11px, 2.5vw, 13px)", fontWeight: "500", letterSpacing: "0.5px", textTransform: "uppercase" }}>Match from</label>
              <div style={{ position: "relative" }}>
                <select
                  value={firstType}
                  onChange={(e) => {
                    const val = e.target.value as CardKind;
                    setFirstType(val);
                    if (val === secondType) {
                      // auto-switch second to a different default
                      const options = (["flag", "country", "capital", "shape"] as CardKind[]).filter((o) => o !== val);
                      setSecondType(options[0]);
                    }
                  }}
                  style={{
                    appearance: "none",
                    background: "linear-gradient(135deg, rgba(59, 130, 246, 0.15), rgba(147, 51, 234, 0.15))",
                    backdropFilter: "blur(10px)",
                    border: "2px solid rgba(59, 130, 246, 0.3)",
                    color: "#fff",
                    borderRadius: "12px",
                    padding: "12px 40px 12px 16px",
                    fontSize: "clamp(13px, 3vw, 15px)",
                    fontWeight: "600",
                    outline: "none",
                    cursor: "pointer",
                    transition: "all 0.3s ease",
                    width: "100%",
                    boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.border = "2px solid rgba(59, 130, 246, 0.6)";
                    e.currentTarget.style.transform = "translateY(-2px)";
                    e.currentTarget.style.boxShadow = "0 6px 20px rgba(59, 130, 246, 0.3)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.border = "2px solid rgba(59, 130, 246, 0.3)";
                    e.currentTarget.style.transform = "translateY(0)";
                    e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.15)";
                  }}
                >
                  {(["flag", "country", "capital", "shape"] as CardKind[]).map((opt) => (
                    <option key={opt} value={opt} style={{ background: "#1a1a2e", color: "#fff", padding: "10px" }}>
                      {opt.charAt(0).toUpperCase() + opt.slice(1)}
                    </option>
                  ))}
                </select>
                <div style={{
                  position: "absolute",
                  right: "14px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  pointerEvents: "none",
                  color: "rgba(255,255,255,0.7)",
                  fontSize: "12px",
                }}>▼</div>
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "8px", minWidth: "clamp(160px, 40%, 200px)", flex: "1" }}>
              <label style={{ color: "rgba(255,255,255,0.7)", fontSize: "clamp(11px, 2.5vw, 13px)", fontWeight: "500", letterSpacing: "0.5px", textTransform: "uppercase" }}>Match to</label>
              <div style={{ position: "relative" }}>
                <select
                  value={secondType}
                  onChange={(e) => setSecondType(e.target.value as CardKind)}
                  style={{
                    appearance: "none",
                    background: "linear-gradient(135deg, rgba(236, 72, 153, 0.15), rgba(251, 146, 60, 0.15))",
                    backdropFilter: "blur(10px)",
                    border: "2px solid rgba(236, 72, 153, 0.3)",
                    color: "#fff",
                    borderRadius: "12px",
                    padding: "12px 40px 12px 16px",
                    fontSize: "clamp(13px, 3vw, 15px)",
                    fontWeight: "600",
                    outline: "none",
                    cursor: "pointer",
                    transition: "all 0.3s ease",
                    width: "100%",
                    boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.border = "2px solid rgba(236, 72, 153, 0.6)";
                    e.currentTarget.style.transform = "translateY(-2px)";
                    e.currentTarget.style.boxShadow = "0 6px 20px rgba(236, 72, 153, 0.3)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.border = "2px solid rgba(236, 72, 153, 0.3)";
                    e.currentTarget.style.transform = "translateY(0)";
                    e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.15)";
                  }}
                >
                  {(["flag", "country", "capital", "shape"] as CardKind[])
                    .filter((opt) => opt !== firstType)
                    .map((opt) => (
                      <option key={opt} value={opt} style={{ background: "#1a1a2e", color: "#fff", padding: "10px" }}>
                        {opt.charAt(0).toUpperCase() + opt.slice(1)}
                      </option>
                    ))}
                </select>
                <div style={{
                  position: "absolute",
                  right: "14px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  pointerEvents: "none",
                  color: "rgba(255,255,255,0.7)",
                  fontSize: "12px",
                }}>▼</div>
              </div>
            </div>
          </div>

          <div style={{ display: "flex", gap: "12px", justifyContent: "center", flexWrap: "wrap" }}>
            <BackButton
              onClick={handleBack}
              style={{
                position: "relative",
                top: "auto",
                left: "auto",
                padding: "14px 28px",
                fontSize: "16px",
              }}
            />
            <button
              onClick={game.startNewGame}
              style={{
                ...GREEN_BUTTON_STYLE,
                padding: "14px 28px",
                fontSize: "18px",
                fontWeight: "600",
              }}
              {...GREEN_BUTTON_HOVER}
            >
              ▶ Start Game
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Game screen
  const timeWarning = game.timeLeft <= 10;
  const gridSize = Math.sqrt(game.cards.length);
  const showColorLegend = (firstType === "country" && secondType === "capital") || (firstType === "capital" && secondType === "country");

  // Landscape Layout (Side-by-side)
  if (isLandscape) {
    return (
      <div style={{ 
        ...PAGE_CONTAINER_STYLE,
        flexDirection: "row", // Side-by-side layout
        justifyContent: "center",
        alignItems: "center",
        padding: "max(12px, env(safe-area-inset-top)) max(16px, env(safe-area-inset-right)) max(12px, env(safe-area-inset-bottom)) max(16px, env(safe-area-inset-left))",
        gap: "24px",
      }}>
        {/* Sidebar for Stats */}
        <div style={{
          display: "flex",
          flexDirection: "column",
          gap: "12px",
          minWidth: "140px",
          maxWidth: "200px",
          background: "rgba(0,0,0,0.3)",
          padding: "16px",
          borderRadius: "16px",
          border: "1px solid rgba(255,255,255,0.1)",
          backdropFilter: "blur(10px)",
          height: "auto",
          maxHeight: "90vh",
          overflowY: "auto",
        }}>
          <BackButton 
            onClick={handleBack} 
            style={{
              position: "static", 
              width: "100%", 
              justifyContent: "center",
              marginBottom: "8px",
              padding: "8px 12px",
            }}
            label="Menu"
          />
  
          {/* Timer */}
          <div style={{
            padding: "10px",
            borderRadius: "8px",
            background: timeWarning ? "rgba(239, 68, 68, 0.2)" : "rgba(59, 130, 246, 0.2)",
            border: timeWarning ? "2px solid rgba(239, 68, 68, 0.5)" : "2px solid rgba(59, 130, 246, 0.3)",
            color: timeWarning ? "#ef4444" : "#3b82f6",
            textAlign: "center",
          }}>
            <div style={{fontSize: "12px", opacity: 0.8, marginBottom: "4px"}}>Time Left</div>
            <div style={{fontSize: "20px", fontWeight: "bold"}}>{game.timeLeft}s</div>
          </div>
  
          {/* Score */}
          <div style={{
            padding: "10px",
            borderRadius: "8px",
            background: "rgba(34, 197, 94, 0.2)",
            border: "2px solid rgba(34, 197, 94, 0.3)",
            color: "#22c55e",
            textAlign: "center",
          }}>
            <div style={{fontSize: "12px", opacity: 0.8, marginBottom: "4px"}}>Score</div>
            <div style={{fontSize: "18px", fontWeight: "bold"}}>{game.score.toLocaleString()}</div>
          </div>
  
          {/* Streak */}
          {game.streak > 0 && (
            <div style={{
              padding: "10px",
              borderRadius: "8px",
              background: "rgba(251, 146, 60, 0.2)",
              border: "2px solid rgba(251, 146, 60, 0.4)",
              color: "#fb923c",
              textAlign: "center",
            }}>
               <div style={{fontSize: "12px", opacity: 0.8, marginBottom: "4px"}}>Streak</div>
               <div style={{fontSize: "18px", fontWeight: "bold"}}>🔥 {game.streak}</div>
               <div style={{fontSize: "12px", opacity: 0.9}}>({game.getStreakMultiplier(game.streak)}x)</div>
            </div>
          )}
          
          <div style={{
            marginTop: "auto", 
            paddingTop: "12px", 
            textAlign: "center", 
            fontSize: "12px", 
            color: "rgba(255,255,255,0.6)"
          }}>
            Matches: {game.totalMatches}
          </div>
        </div>
  
        {/* Game Grid Container - Maximized Height */}
        <div style={{
          flex: 1,
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          maxWidth: "80vh",
          gap: "12px",
        }}>
          {/* Color Legend */}
          {showColorLegend && (
            <div style={{
              display: "flex",
              gap: "16px",
              padding: "8px 16px",
              background: "rgba(0,0,0,0.4)",
              borderRadius: "8px",
              border: "1px solid rgba(255,255,255,0.1)",
              fontSize: "12px",
              flexWrap: "wrap",
              justifyContent: "center",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <div style={{ width: "12px", height: "12px", borderRadius: "3px", background: "#3b82f6" }} />
                <span style={{ color: "rgba(255,255,255,0.9)" }}>Countries</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <div style={{ width: "12px", height: "12px", borderRadius: "3px", background: "#ef4444" }} />
                <span style={{ color: "rgba(255,255,255,0.9)" }}>Capitals</span>
              </div>
            </div>
          )}
          
          <div style={{
            display: "grid",
            gridTemplateColumns: `repeat(${gridSize}, 1fr)`,
            gap: "clamp(4px, 1vh, 12px)",
            width: "100%",
            height: "auto",
            maxHeight: "100%",
            aspectRatio: "1/1",
            isolation: "isolate",
          }}>
            {game.cards.map((card) => {
              const isSelected = game.selectedCards.includes(card.id);
              const isMatched = game.matchedPairs.has(card.cca2);
              const isFeedback = game.feedbackCard === card.id;
  
              return (
                <GameCard
                  key={card.id}
                  card={card}
                  isSelected={isSelected}
                  isMatched={isMatched}
                  isFeedback={isFeedback}
                  onClick={() => game.handleCardClick(card.id)}
                  showColorLegend={showColorLegend}
                />
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // Portrait Layout (Original Stacked)
  return (
    <div style={{ 
      ...PAGE_CONTAINER_STYLE, 
      minHeight: "100dvh", 
      padding: "clamp(12px, 3vw, 20px)",
      paddingTop: "max(clamp(16px, 4vw, 24px), env(safe-area-inset-top))", 
      paddingLeft: "max(clamp(12px, 3vw, 20px), env(safe-area-inset-left))",
      paddingRight: "max(clamp(12px, 3vw, 20px), env(safe-area-inset-right))",
      WebkitOverflowScrolling: "touch"
    }}>
      {/* Header with stats */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "clamp(8px, 2vw, 16px)", 
          gap: "clamp(4px, 1vw, 8px)",
        }}
      >
        <BackButton 
          onClick={handleBack} 
          style={{
            position: "relative",
            top: "auto",
            left: "auto",
            padding: "8px 16px", 
            fontSize: "clamp(12px, 2.5vw, 15px)", 
            whiteSpace: "nowrap",
            flexShrink: 0,
          }}
          label="Menu"
        />

        <div
          style={{
            display: "flex",
            gap: "clamp(4px, 1.5vw, 12px)", 
            alignItems: "center",
            flexWrap: "nowrap", 
            overflowX: "auto",   
            paddingBottom: "2px", 
            scrollbarWidth: "none", 
            msOverflowStyle: "none",
          }}
        >
          {/* Timer */}
          <div
            style={{
              padding: "clamp(4px, 1vw, 8px) clamp(8px, 2vw, 12px)",
              borderRadius: "6px",
              background: timeWarning ? "rgba(239, 68, 68, 0.2)" : "rgba(59, 130, 246, 0.2)",
              border: timeWarning
                ? "2px solid rgba(239, 68, 68, 0.5)"
                : "2px solid rgba(59, 130, 246, 0.3)",
              color: timeWarning ? "#ef4444" : "#3b82f6",
              fontSize: "clamp(12px, 3vw, 18px)", 
              fontWeight: "bold",
              textAlign: "center",
              whiteSpace: "nowrap",
              flexShrink: 0,
            }}
          >
            ⏱️ {game.timeLeft}s
          </div>

          {/* Score */}
          <div
            style={{
              padding: "clamp(4px, 1vw, 8px) clamp(8px, 2vw, 12px)",
              borderRadius: "6px",
              background: "rgba(34, 197, 94, 0.2)",
              border: "2px solid rgba(34, 197, 94, 0.3)",
              color: "#22c55e",
              fontSize: "clamp(12px, 3vw, 18px)",
              fontWeight: "bold",
              whiteSpace: "nowrap",
              flexShrink: 0,
            }}
          >
            💰 {game.score.toLocaleString()}
          </div>

          {/* Streak */}
          {game.streak > 0 && (
            <div
              style={{
                padding: "clamp(4px, 1vw, 8px) clamp(8px, 2vw, 12px)",
                borderRadius: "6px",
                background: "rgba(251, 146, 60, 0.2)",
                border: "2px solid rgba(251, 146, 60, 0.4)",
                color: "#fb923c",
                fontSize: "clamp(12px, 3vw, 18px)",
                fontWeight: "bold",
                whiteSpace: "nowrap",
                flexShrink: 0,
              }}
            >
              🔥 {game.streak} <span style={{fontSize: "0.85em", opacity: 0.9}}>({game.getStreakMultiplier(game.streak)}x)</span>
            </div>
          )}
        </div>
      </div>

      {/* Color Legend */}
      {showColorLegend && (
        <div style={{
          display: "flex",
          gap: "clamp(12px, 3vw, 20px)",
          padding: "clamp(8px, 2vw, 12px) clamp(12px, 3vw, 16px)",
          background: "rgba(0,0,0,0.4)",
          borderRadius: "8px",
          border: "1px solid rgba(255,255,255,0.1)",
          fontSize: "clamp(11px, 2.5vw, 13px)",
          justifyContent: "center",
          marginBottom: "clamp(8px, 2vw, 12px)",
          flexWrap: "wrap",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <div style={{ width: "clamp(10px, 2.5vw, 14px)", height: "clamp(10px, 2.5vw, 14px)", borderRadius: "3px", background: "#3b82f6", flexShrink: 0 }} />
            <span style={{ color: "rgba(255,255,255,0.9)", whiteSpace: "nowrap" }}>Countries</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <div style={{ width: "clamp(10px, 2.5vw, 14px)", height: "clamp(10px, 2.5vw, 14px)", borderRadius: "3px", background: "#ef4444", flexShrink: 0 }} />
            <span style={{ color: "rgba(255,255,255,0.9)", whiteSpace: "nowrap" }}>Capitals</span>
          </div>
        </div>
      )}

      {/* Game grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: `repeat(${gridSize}, 1fr)`,
          gap: "clamp(4px, 1vw, 8px)",
          width: "100%",
          isolation: "isolate",
        }}
      >
        {game.cards.map((card) => {
          const isSelected = game.selectedCards.includes(card.id);
          const isMatched = game.matchedPairs.has(card.cca2);
          const isFeedback = game.feedbackCard === card.id;

          return (
            <GameCard
              key={card.id}
              card={card}
              isSelected={isSelected}
              isMatched={isMatched}
              isFeedback={isFeedback}
              onClick={() => game.handleCardClick(card.id)}
              showColorLegend={showColorLegend}
            />
          );
        })}
      </div>

      {/* Progress indicator */}
      <div
        style={{
          marginTop: "clamp(12px, 3vw, 20px)",
          textAlign: "center",
          color: "rgba(255, 255, 255, 0.7)",
          fontSize: "clamp(12px, 3vw, 14px)",
        }}
      >
        Total Matched: {game.totalMatches}
      </div>
    </div>
  );
}
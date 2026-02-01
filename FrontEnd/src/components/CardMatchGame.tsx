import { geoNaturalEarth1, geoPath, geoCentroid } from "d3-geo";
import { useEffect, useState, useLayoutEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { BackButton } from "./BackButton";
import { CountryCard, useCardMatchGame, CardKind } from "../hooks/useCardMatchGame";
import { saveCardsMatchScore } from "../utils/leaderboardUtils";
import { TimeBar } from "./TimeBar";
import "./CardMatchGame.css";
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
  
  const cardClasses = [
    'game-card',
    isSelected && 'selected',
    isMatched && 'matched',
    isFeedback && 'feedback',
    isCorrectFeedback && 'correct-feedback',
    isWrongFeedback && 'wrong-feedback',
    !isSelected && !isMatched && 'default'
  ].filter(Boolean).join(' ');

  const getTextClasses = () => {
    if (!showColorLegend) return 'game-card-text no-legend';
    if (card.type === "country") return 'game-card-text country';
    if (card.type === "capital") return 'game-card-text capital';
    return 'game-card-text no-legend';
  };

  const textFontSize = `clamp(12px, ${Math.max(2, 3 - ((card.text || card.name).length / 20))}vw, 22px)`;

  return (
    <button
      onClick={onClick}
      disabled={isMatched}
      className={cardClasses}
    >
      {card.type === "flag" ? (
        <img
          src={card.flag}
          alt={card.name}
          draggable={false}
          onDragStart={(e) => e.preventDefault()}
          className="game-card-flag"
        />
      ) : card.type === "shape" ? (
        <CountryShapeSVG card={card} />
      ) : (
        <div className="game-card-text-wrapper">
          <span
            title={card.text || card.name}
            className={getTextClasses()}
            style={{ fontSize: textFontSize }}
          >
            {card.type === "country" ? (card.text || card.name) : (card.text || "")}
          </span>
        </div>
      )}

      {/* Overlay for matched state */}
      {isMatched && (
        <div className="game-card-checkmark">
          ✓
        </div>
      )}
    </button>
  );
}

// Hook to detect orientation
function useOrientation() {
  const [isLandscape, setIsLandscape] = useState(() => {
    const width = window.innerWidth;
    const height = window.innerHeight;
    
    // Use visualViewport if available (accounts for browser chrome)
    const viewportHeight = window.visualViewport?.height || height;
    
    // Calculate minimum vertical space needed for portrait layout (absolute pixels):
    // TimeBar (100px) + Header (80px) + Grid (needs significant space) + Margins (60px)
    const minSpaceNeeded = 650;
    
    // Use landscape layout if: wider than tall, OR insufficient vertical space available
    return width > height || viewportHeight < minSpaceNeeded;
  });

  useLayoutEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      
      // Use visualViewport if available for accurate measurement
      const viewportHeight = window.visualViewport?.height || height;
      const minSpaceNeeded = 650;
      
      setIsLandscape(width > height || viewportHeight < minSpaceNeeded);
    };
    
    window.addEventListener("resize", handleResize);
    
    // Also listen to visualViewport changes (keyboard, browser chrome)
    if (window.visualViewport) {
      window.visualViewport.addEventListener("resize", handleResize);
      window.visualViewport.addEventListener("scroll", handleResize);
    }
    
    return () => {
      window.removeEventListener("resize", handleResize);
      if (window.visualViewport) {
        window.visualViewport.removeEventListener("resize", handleResize);
        window.visualViewport.removeEventListener("scroll", handleResize);
      }
    };
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
      <div className="card-match-results-container" style={PAGE_CONTAINER_STYLE}>
        <div className="card-match-results-card">
          <h2 className="card-match-results-title">
            🎮 Game Over!
          </h2>

          <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginBottom: "30px", color: "#fff" }}>
            <div className="card-match-results-score">
              {game.score.toLocaleString()}
            </div>
            <div className="card-match-results-label">Points</div>

            <div className="card-match-results-stats">
              <div className="card-match-results-stat">
                <div className="card-match-results-stat-value">
                  {totalMatches}
                </div>
                <div className="card-match-results-stat-label">Total Matched</div>
              </div>

              <div className="card-match-results-stat">
                <div className="card-match-results-stat-value">
                  {game.maxStreak}
                </div>
                <div className="card-match-results-stat-label">Max Streak</div>
              </div>
            </div>
          </div>

          <div className="card-match-results-actions">
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
      <div className="card-match-pregame-container" style={PAGE_CONTAINER_STYLE}>
        <div className="card-match-pregame-card">
          <h1 className="card-match-pregame-title">
            🎴 Cards Match
          </h1>
          <p className="card-match-pregame-description">
            Choose what to match — Flags, Countries, Capitals, or Shapes — then match the pairs fast to build streaks and score big!
          </p>

          <div className="card-match-instructions">
            <h3 className="card-match-instructions-title">
              🎯 How to Play
            </h3>
            <ul className="card-match-instructions-list">
              <li>Match all pairs before time runs out (60 seconds)</li>
              <li>Base score: 1,000 points per match</li>
              <li>5 streak: 1.5x multiplier (1,500 pts)</li>
              <li>10 streak: 2x multiplier (2,000 pts)</li>
              <li>15 streak: 2.5x multiplier (2,500 pts)</li>
              <li>20+ streak: 3x multiplier (3,000 pts)</li>
            </ul>
          </div>

          {/* Mode Selector */}
          <div className="card-match-mode-selector">
            <div className="card-match-select-group">
              <label className="card-match-select-label">Match from</label>
              <div className="card-match-select-wrapper">
                <select
                  value={firstType}
                  onChange={(e) => {
                    const val = e.target.value as CardKind;
                    setFirstType(val);
                    if (val === secondType) {
                      const options = (["flag", "country", "capital", "shape"] as CardKind[]).filter((o) => o !== val);
                      setSecondType(options[0]);
                    }
                  }}
                  className="card-match-select first-type"
                >
                  {(["flag", "country", "capital", "shape"] as CardKind[]).map((opt) => (
                    <option key={opt} value={opt} style={{ background: "#1a1a2e", color: "#fff", padding: "10px" }}>
                      {opt.charAt(0).toUpperCase() + opt.slice(1)}
                    </option>
                  ))}
                </select>
                <div className="card-match-select-arrow">▼</div>
              </div>
            </div>

            <div className="card-match-select-group">
              <label className="card-match-select-label">Match to</label>
              <div className="card-match-select-wrapper">
                <select
                  value={secondType}
                  onChange={(e) => setSecondType(e.target.value as CardKind)}
                  className="card-match-select second-type"
                >
                  {(["flag", "country", "capital", "shape"] as CardKind[])
                    .filter((opt) => opt !== firstType)
                    .map((opt) => (
                      <option key={opt} value={opt} style={{ background: "#1a1a2e", color: "#fff", padding: "10px" }}>
                        {opt.charAt(0).toUpperCase() + opt.slice(1)}
                      </option>
                    ))}
                </select>
                <div className="card-match-select-arrow">▼</div>
              </div>
            </div>
          </div>

          <div className="card-match-pregame-actions">
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
      <div className="card-match-landscape-container">
        {/* Sidebar for Stats */}
        <div className="card-match-sidebar">
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

          {/* TimeBar */}
          <div style={{ width: "100%" }}>
            <TimeBar
              key={game.matchCount}
              durationSeconds={11}
              maxPoints={1500}
              isRunning={game.gameStarted && !game.gameOver}
              graceTimeMs={0}
              onPointsChange={(points) => game.setCurrentMatchPoints(points)}
            />
          </div>
  
          {/* Timer */}
          <div className={`card-match-stat-box ${timeWarning ? 'timer-warning' : 'timer'}`}>
            <div className="card-match-stat-label">Time Left</div>
            <div className="card-match-stat-value">{game.timeLeft}s</div>
          </div>
  
          {/* Score */}
          <div className="card-match-stat-box score">
            <div className="card-match-stat-label">Score</div>
            <div className="card-match-stat-value large">{game.score.toLocaleString()}</div>
          </div>
  
          {/* Streak */}
          {game.streak > 0 && (
            <div className="card-match-stat-box streak">
               <div className="card-match-stat-label">Streak</div>
               <div className="card-match-stat-value large">🔥 {game.streak}</div>
               <div className="card-match-stat-label">({game.getStreakMultiplier(game.streak)}x)</div>
            </div>
          )}
          
          <div className="card-match-matches-footer">
            Matches: {game.totalMatches}
          </div>
        </div>
  
        {/* Game Grid Container - Maximized Height */}
        <div className="card-match-grid-container">
          {/* Color Legend */}
          {showColorLegend && (
            <div className="card-match-color-legend">
              <div className="card-match-legend-item">
                <div className="card-match-legend-color countries" />
                <span className="card-match-legend-text">Countries</span>
              </div>
              <div className="card-match-legend-item">
                <div className="card-match-legend-color capitals" />
                <span className="card-match-legend-text">Capitals</span>
              </div>
            </div>
          )}
          
          <div className="card-match-grid" style={{ gridTemplateColumns: `repeat(${gridSize}, 1fr)` }}>
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
    <div className="card-match-game-container">
      {/* TimeBar */}
      <div style={{ marginBottom: "clamp(8px, 2vw, 12px)" }}>
        <TimeBar
          key={game.matchCount}
          durationSeconds={11}
          maxPoints={1500}
          isRunning={game.gameStarted && !game.gameOver}
          graceTimeMs={0}
          onPointsChange={(points) => game.setCurrentMatchPoints(points)}
        />
      </div>

      {/* Header with stats */}
      <div className="card-match-header">
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

        <div className="card-match-stats-row">
          {/* Timer */}
          <div className={`card-match-stat-badge ${timeWarning ? 'timer-warning' : 'timer'}`}>
            ⏱️ {game.timeLeft}s
          </div>

          {/* Score */}
          <div className="card-match-stat-badge score">
            💰 {game.score.toLocaleString()}
          </div>

          {/* Streak */}
          {game.streak > 0 && (
            <div className="card-match-stat-badge streak">
              🔥 {game.streak} <span style={{fontSize: "0.85em", opacity: 0.9}}>({game.getStreakMultiplier(game.streak)}x)</span>
            </div>
          )}
        </div>
      </div>

      {/* Color Legend */}
      {showColorLegend && (
        <div className="card-match-color-legend" style={{ marginBottom: "clamp(8px, 2vw, 12px)" }}>
          <div className="card-match-legend-item">
            <div className="card-match-legend-color countries" style={{ width: "clamp(10px, 2.5vw, 14px)", height: "clamp(10px, 2.5vw, 14px)" }} />
            <span className="card-match-legend-text" style={{ whiteSpace: "nowrap" }}>Countries</span>
          </div>
          <div className="card-match-legend-item">
            <div className="card-match-legend-color capitals" style={{ width: "clamp(10px, 2.5vw, 14px)", height: "clamp(10px, 2.5vw, 14px)" }} />
            <span className="card-match-legend-text" style={{ whiteSpace: "nowrap" }}>Capitals</span>
          </div>
        </div>
      )}

      {/* Game grid */}
      <div className="card-match-grid" style={{ gridTemplateColumns: `repeat(${gridSize}, 1fr)`, gap: "clamp(4px, 1vw, 8px)" }}>
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
      <div className="card-match-progress">
        Total Matched: {game.totalMatches}
      </div>
    </div>
  );
}
import { useState, useRef, useMemo, useEffect, useCallback, lazy, Suspense } from "react";
import { useNavigate } from "react-router-dom";
import { geoPath as d3GeoPath, geoNaturalEarth1, geoArea, type GeoPermissibleObjects } from "d3-geo";
import { BackButton } from "./BackButton";
import PhysicalGeoHUD from "./PhysicalGeoHUD";
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
import {
  CATEGORY_GROUPS,
  FEATURE_COLORS,
  FEATURE_FILL_OPACITY,
  projectPath,
  projectEllipse,
  isWaterFeature,
  type PhysicalFeature,
} from "../utils/physicalFeatures";
import "./PhysicalGeoGame.css";

// Lazy-load the heavy map component
const InteractiveMap = lazy(() => import("./InteractiveMap"));

type Proj = (coords: [number, number]) => [number, number] | null;

// Lighter land map for performance (water shapes use 10m/50m marine polygons)
const GEO_URL = "/countries-110m.json";
const MARINE_URL = "/marine-polys.json";
const RIVERS_URL = "/rivers.json";

// GeoJSON types for marine polygon data and river line data
interface GeoFeature {
  type: "Feature";
  properties: { name: string };
  geometry: GeoPermissibleObjects;
}
interface GeoFeatureCollection {
  type: "FeatureCollection";
  features: GeoFeature[];
}

export default function PhysicalGeoGame() {
  const navigate = useNavigate();

  // ── Category selector ────────────────────────────────────
  const [categoryKey, setCategoryKey] = useState<string | null>(null);
  const [showSelector, setShowSelector] = useState(true);

  // ── Game hook ────────────────────────────────────────────
  const game = usePhysicalGeoGame(categoryKey ?? "all");

  // ── Layout ───────────────────────────────────────────────
  const { dimensions, isPortrait } = useMapDimensions();
  const OUTER_W = dimensions.width;
  const OUTER_H = dimensions.height;
  const INNER_W = OUTER_W - FRAME * 2;
  const INNER_H = OUTER_H - FRAME * 2;
  const FIT_SCALE = Math.max(1, Math.round(INNER_W * 0.32));

  // ── Map position ─────────────────────────────────────────
  const [pos, setPos] = useState<{ coordinates: [number, number]; zoom: number }>({
    coordinates: [0, 0],
    zoom: 1,
  });

  // ── Marine polygon data (real ocean/sea shapes) ──────────
  // Only load when the selected category includes water types
  const [marineData, setMarineData] = useState<GeoFeatureCollection | null>(null);
  const needsMarine = !showSelector && (categoryKey === "all" || categoryKey === "waters");
  useEffect(() => {
    if (!needsMarine) { setMarineData(null); return; }
    fetch(MARINE_URL)
      .then(r => r.json())
      .then((data: GeoFeatureCollection) => {
        // Fix inverted polygons using d3-geo's spherical area calculation.
        // If geoArea > 2π steradians, the polygon covers more than half the
        // globe — meaning its winding is inverted. Reverse all outer rings.
        const TWO_PI = 2 * Math.PI;
        for (const feat of data.features) {
          const area = geoArea(feat as Parameters<typeof geoArea>[0]);
          if (area > TWO_PI) {
            const geom = feat.geometry as { type: string; coordinates: number[][][] | number[][][][] };
            if (geom.type === "Polygon") {
              (geom.coordinates as number[][][])[0].reverse();
            } else if (geom.type === "MultiPolygon") {
              for (const poly of geom.coordinates as number[][][][]) {
                poly[0].reverse();
              }
            }
          }
        }
        setMarineData(data);
      })
      .catch(() => {/* fallback to ellipses if fetch fails */});
  }, [needsMarine]);

  // ── River line data (real river geometries) ──────────────
  // Only load when the selected category includes rivers
  const [riverData, setRiverData] = useState<GeoFeatureCollection | null>(null);
  const needsRivers = !showSelector && (categoryKey === "all" || categoryKey === "rivers");
  useEffect(() => {
    if (!needsRivers) { setRiverData(null); return; }
    fetch(RIVERS_URL)
      .then(r => r.json())
      .then((data: GeoFeatureCollection) => setRiverData(data))
      .catch(() => {/* fallback to hand-drawn paths */});
  }, [needsRivers]);

  // ── Pre-compute SVG path strings (expensive — only recompute on resize) ──
  // Create same projection as InteractiveMap to pre-compute d3GeoPath strings.
  // Zoom/pan is handled by SVG transform, so the projection is stable.
  // Build a set of feature names we actually need marine polygons for
  // (excludes straits/canals which always use ellipse rendering)
  const neededNames = useMemo(() => {
    const s = new Set<string>();
    for (const f of game.features) {
      if (f.type !== "strait" && f.type !== "canal") s.add(f.name);
    }
    return s;
  }, [game.features]);

  const precomputedPaths = useMemo(() => {
    const proj = geoNaturalEarth1()
      .scale(FIT_SCALE)
      .translate([INNER_W / 2, INNER_H / 2])
      .center([0, 15]);
    const pathGen = d3GeoPath(proj);
    const paths = new Map<string, string>();
    if (marineData) {
      // Only precompute paths for features in the current game
      for (const feat of marineData.features) {
        if (!neededNames.has(feat.properties.name)) continue;
        const d = pathGen(feat.geometry);
        if (d) paths.set(feat.properties.name, d);
      }
    }
    if (riverData) {
      for (const feat of riverData.features) {
        if (!neededNames.has(feat.properties.name)) continue;
        const d = pathGen(feat.geometry);
        if (d) paths.set("river:" + feat.properties.name, d);
      }
    }
    return paths;
  }, [marineData, riverData, neededNames, FIT_SCALE, INNER_W, INNER_H]);

  // ── Streak milestone animation (shows at 5, 10, 15, …) ───
  const [streakMilestone, setStreakMilestone] = useState<number | null>(null);
  const prevStreakRef = useRef(0);
  useEffect(() => {
    const cur = game.currentStreak;
    const prev = prevStreakRef.current;
    prevStreakRef.current = cur;
    // Trigger animation only when crossing a new multiple-of-5 milestone
    if (cur >= 5 && cur > prev && cur % 5 === 0) {
      setStreakMilestone(cur);
      const timer = setTimeout(() => setStreakMilestone(null), 1200);
      return () => clearTimeout(timer);
    }
  }, [game.currentStreak]);
  const wrapperRef = useRef<HTMLDivElement>(null);
  usePreventWheelScroll(wrapperRef);

  const handleBack = () => navigate("/");

  // ── Select category & start ──────────────────────────────
  const selectCategory = (key: string) => {
    setCategoryKey(key);
    setShowSelector(false);
    game.startNewGame(key);
  };

  // ── Split features into water (underlay) and land (overlay) ───
  // Small straits/canals also get a marker in the overlay for visibility
  const { waterFeatures, landFeatures, markerWaterFeatures } = useMemo(() => {
    const water: PhysicalFeature[] = [];
    const land: PhysicalFeature[] = [];
    const markerWater: PhysicalFeature[] = [];
    for (const f of game.features) {
      if (isWaterFeature(f)) {
        water.push(f);
        // Small straits/canals need a visible marker on top of land
        if (
          (f.type === "strait" || f.type === "canal") &&
          f.shape.kind === "ellipse" &&
          f.shape.rx * f.shape.ry < 5
        ) {
          markerWater.push(f);
        }
      } else {
        land.push(f);
      }
    }
    return { waterFeatures: water, landFeatures: land, markerWaterFeatures: markerWater };
  }, [game.features]);

  // ── Visual state for a feature ───────────────────────────
  const getFeatureVisual = (
    feature: PhysicalFeature,
  ): { color: string; opacity: number; fillOpacity: number; glow: boolean } => {
    const baseColor = FEATURE_COLORS[feature.type];
    const baseFillOpacity = FEATURE_FILL_OPACITY[feature.type];

    const isCorrect = game.correctSet.has(feature.name);
    const isCurrentTarget = feature.name === game.currentFeature?.name;

    // During result display
    if (game.showingResult && game.lastResult) {
      if (game.lastResult.correct && isCurrentTarget) {
        return { color: "#4caf50", opacity: 1, fillOpacity: 0.55, glow: true };
      }
      if (!game.lastResult.correct) {
        if (feature.name === game.lastResult.clickedName) {
          return { color: "#ef4444", opacity: 1, fillOpacity: 0.5, glow: false };
        }
        if (isCurrentTarget) {
          return { color: "#ffc107", opacity: 1, fillOpacity: 0.55, glow: true };
        }
      }
    }

    if (isCorrect) {
      return { color: "#4caf50", opacity: 0.5, fillOpacity: baseFillOpacity * 0.4, glow: false };
    }

    return { color: baseColor, opacity: 1, fillOpacity: baseFillOpacity, glow: false };
  };

  // ── Shared click guard ───────────────────────────────────
  const canClick = (feature: PhysicalFeature) =>
    !game.correctSet.has(feature.name) && !game.showingResult && !game.gameOver;

  // ═════════════════════════════════════════════════════════
  //  WATER UNDERLAY — rendered BEFORE land geographies
  //  Uses real GeoJSON polygons from Natural Earth marine data
  //  Land covers overlapping areas → only real water shows
  //  Normal state: outline only (no fill) so ocean stays dark
  //  State colors appear on correct/wrong/highlight
  // ═════════════════════════════════════════════════════════
  const renderWaterUnderlay = useCallback((projection: Proj, zoom: number, _isDesktop: boolean) => {
    if (waterFeatures.length === 0) return null;

    const sw = Math.max(0.5, 1.2 / Math.pow(zoom, 0.5));

    return (
      <g>
        {waterFeatures.map((feature) => {
          // For straits/canals, always use ellipse
          let d: string | null = null;
          if (feature.type !== "strait" && feature.type !== "canal") {
            d = precomputedPaths.get(feature.name) ?? null;
          }

          if (!d && feature.shape.kind === "ellipse") {
            const { center, rx, ry, rotation = 0 } = feature.shape;
            d = projectEllipse(center, rx, ry, rotation, projection, 48);
          }
          if (!d) return null;

          const clickable = canClick(feature);
          const handleClick = clickable
            ? () => game.handleFeatureClick(feature.name)
            : undefined;

          // Default: transparent fill, subtle outline
          let fillColor = "transparent";
          let strokeColor = "rgba(140,200,255,0.35)";
          let strokeW = sw;
          let showGlow = false;

          if (game.showingResult && game.lastResult) {
            if (game.lastResult.correct && feature.name === game.currentFeature?.name) {
              fillColor = "rgba(76,175,80,0.30)";
              strokeColor = "#4caf50";
              strokeW = sw * 2;
              showGlow = true;
            } else if (!game.lastResult.correct && feature.name === game.lastResult.clickedName) {
              fillColor = "rgba(239,68,68,0.25)";
              strokeColor = "#ef4444";
              strokeW = sw * 2;
            } else if (!game.lastResult.correct && feature.name === game.currentFeature?.name) {
              fillColor = "rgba(255,193,7,0.30)";
              strokeColor = "#ffc107";
              strokeW = sw * 2;
              showGlow = true;
            }
          } else if (game.correctSet.has(feature.name)) {
            fillColor = "rgba(76,175,80,0.12)";
            strokeColor = "rgba(76,175,80,0.4)";
          }

          return (
            <path
              key={feature.name}
              d={d}
              fill={fillColor}
              stroke={strokeColor}
              strokeWidth={strokeW}
              vectorEffect="non-scaling-stroke"
              style={{
                cursor: clickable ? "pointer" : "default",
                pointerEvents: clickable ? "all" : "none",
              }}
              onClick={handleClick}
            />
          );
        })}
      </g>
    );
  }, [waterFeatures, precomputedPaths, game.showingResult, game.lastResult, game.currentFeature, game.correctSet, game.gameOver]);

  // ═════════════════════════════════════════════════════════
  //  LAND OVERLAY — rendered AFTER land geographies
  //  Mountains, rivers, deserts, lakes, straits, canals, etc.
  // ═════════════════════════════════════════════════════════
  const renderLandOverlay = useCallback((projection: Proj, zoom: number, _isDesktop: boolean) => {
    if (landFeatures.length === 0 && markerWaterFeatures.length === 0) return null;

    return (
      <g>
        {/* Markers for small straits/canals that are too small to see as water polygons */}
        {markerWaterFeatures.map((feature) => {
          if (feature.shape.kind !== "ellipse") return null;
          const pt = projection(feature.shape.center);
          if (!pt) return null;
          const vis = getFeatureVisual(feature);
          const clickable = canClick(feature);
          const handleClick = clickable
            ? () => game.handleFeatureClick(feature.name)
            : undefined;
          const r = Math.max(3, 6 / Math.pow(zoom, 0.4));
          return (
            <g key={`marker-${feature.name}`}>
              <circle
                cx={pt[0]} cy={pt[1]} r={r * 2.5}
                fill="transparent"
                style={{ cursor: clickable ? "pointer" : "default", pointerEvents: clickable ? "all" : "none" }}
                onClick={handleClick}
              />
              <circle
                cx={pt[0]} cy={pt[1]} r={r}
                fill={vis.color} stroke="#fff"
                strokeWidth={Math.max(0.5, 1 / Math.pow(zoom, 0.4))}
                opacity={vis.opacity}
                style={{ pointerEvents: "none" }}
              />
              {vis.glow && (
                <circle
                  cx={pt[0]} cy={pt[1]} r={r * 1.8}
                  fill="none" stroke={vis.color} strokeWidth={2} opacity={0.5}
                  style={{ pointerEvents: "none" }}
                >
                  <animate attributeName="r" from={r * 1.3} to={r * 2.5} dur="0.8s" repeatCount="indefinite" />
                  <animate attributeName="opacity" from="0.6" to="0" dur="0.8s" repeatCount="indefinite" />
                </circle>
              )}
            </g>
          );
        })}

        {landFeatures.map((feature) => {
          const vis = getFeatureVisual(feature);
          const clickable = canClick(feature);
          const handleClick = clickable
            ? () => game.handleFeatureClick(feature.name)
            : undefined;
          const cursor = clickable ? "pointer" : "default";

          switch (feature.shape.kind) {
            case "marker": {
              const pt = projection(feature.shape.center);
              if (!pt) return null;
              const r = Math.max(3, 6 / Math.pow(zoom, 0.4));
              return (
                <g key={feature.name}>
                  <circle
                    cx={pt[0]}
                    cy={pt[1]}
                    r={r * 2.5}
                    fill="transparent"
                    style={{ cursor, pointerEvents: clickable ? "all" : "none" }}
                    onClick={handleClick}
                  />
                  <circle
                    cx={pt[0]}
                    cy={pt[1]}
                    r={r}
                    fill={vis.color}
                    stroke="#fff"
                    strokeWidth={Math.max(0.5, 1 / Math.pow(zoom, 0.4))}
                    opacity={vis.opacity}
                    style={{ pointerEvents: "none" }}
                  />
                  {vis.glow && (
                    <circle
                      cx={pt[0]}
                      cy={pt[1]}
                      r={r * 1.8}
                      fill="none"
                      stroke={vis.color}
                      strokeWidth={2}
                      opacity={0.5}
                      style={{ pointerEvents: "none" }}
                    >
                      <animate attributeName="r" from={r * 1.3} to={r * 2.5} dur="0.8s" repeatCount="indefinite" />
                      <animate attributeName="opacity" from="0.6" to="0" dur="0.8s" repeatCount="indefinite" />
                    </circle>
                  )}
                </g>
              );
            }

            case "path": {
              // Try precomputed river geometry first, fall back to hand-drawn path
              let d: string | null = null;

              if (feature.type === "river") {
                d = precomputedPaths.get("river:" + feature.name) ?? null;
              }
              if (!d) {
                d = projectPath(feature.shape.points, projection);
              }
              if (!d) return null;
              const sw =
                feature.type === "river" ? 2.5
                : 3.5;
              return (
                <g key={feature.name}>
                  <path
                    d={d}
                    fill="none"
                    stroke="transparent"
                    strokeWidth={14}
                    vectorEffect="non-scaling-stroke"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    style={{ cursor, pointerEvents: clickable ? "stroke" : "none" }}
                    onClick={handleClick}
                  />
                  <path
                    d={d}
                    fill="none"
                    stroke={vis.color}
                    strokeWidth={sw}
                    vectorEffect="non-scaling-stroke"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    opacity={vis.opacity}
                    style={{ pointerEvents: "none" }}
                  />
                  {vis.glow && (
                    <path
                      d={d}
                      fill="none"
                      stroke={vis.color}
                      strokeWidth={sw + 6}
                      vectorEffect="non-scaling-stroke"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      opacity={0.3}
                      style={{ pointerEvents: "none" }}
                    >
                      <animate attributeName="opacity" values="0.3;0.1;0.3" dur="1s" repeatCount="indefinite" />
                    </path>
                  )}
                </g>
              );
            }

            case "ellipse": {
              // Non-water ellipses (deserts, lakes) — rendered on top of land
              const { center, rx, ry, rotation = 0 } = feature.shape;
              const d = projectEllipse(center, rx, ry, rotation, projection, 48);
              if (!d) return null;
              return (
                <g key={feature.name}>
                  <path
                    d={d}
                    fill={vis.color}
                    fillOpacity={vis.fillOpacity}
                    stroke={vis.color}
                    strokeWidth={1.5}
                    strokeOpacity={vis.opacity * 0.6}
                    vectorEffect="non-scaling-stroke"
                    style={{ cursor, pointerEvents: clickable ? "all" : "none" }}
                    onClick={handleClick}
                  />
                  {vis.glow && (
                    <path
                      d={d}
                      fill="none"
                      stroke={vis.color}
                      strokeWidth={3}
                      vectorEffect="non-scaling-stroke"
                      opacity={0.5}
                      style={{ pointerEvents: "none" }}
                    >
                      <animate attributeName="opacity" values="0.6;0.2;0.6" dur="1s" repeatCount="indefinite" />
                    </path>
                  )}
                </g>
              );
            }

            default:
              return null;
          }
        })}
      </g>
    );
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [landFeatures, markerWaterFeatures, precomputedPaths, game.showingResult, game.lastResult, game.currentFeature, game.correctSet, game.gameOver]);

  // ═══════════════════════════════════════════════════════════
  //  RENDER
  // ═══════════════════════════════════════════════════════════

  return (
    <>
      {/* ── Category Selector Modal ─────────────────── */}
      {showSelector && (
        <div className="phys-category-overlay">
          <div className="phys-category-content">
            <h1 className="phys-category-title">🌍 Physical Geography</h1>
            <p className="phys-category-subtitle">Choose a category to start</p>

            <div className={`phys-category-grid ${isPortrait ? "portrait" : "landscape"}`}>
              {CATEGORY_GROUPS.map((group) => {
                const isAll = group.key === "all";
                return (
                  <button
                    key={group.key}
                    onClick={() => selectCategory(group.key)}
                    className={`phys-cat-btn phys-cat-btn-${group.key} ${isAll ? "phys-btn-all" : ""}`}
                    style={isAll ? { ...GREEN_BUTTON_STYLE } : undefined}
                    {...(isAll ? GREEN_BUTTON_HOVER : {})}
                  >
                    {group.emoji} {group.label}
                  </button>
                );
              })}
            </div>

            <button onClick={() => navigate("/")} className="phys-category-back-btn">
              ← Back to Menu
            </button>
          </div>
        </div>
      )}

      {/* ── Main game layout ────────────────────────── */}
      <div
        style={{
          ...PAGE_CONTAINER_STYLE,
          gap: isPortrait ? "clamp(16px, 3vh, 32px)" : "0",
        }}
      >
        <BackButton onClick={handleBack} />

        {/* ── HUD panel ─────────────────────────────── */}
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
            showingResult={game.showingResult}
            lastResult={game.lastResult}
            onStartNewGame={() => {
              setShowSelector(true);
            }}
            onSkip={game.skipCurrent}
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
                  ? "LEGENDARY!"
                  : game.score === game.features.length
                  ? "Perfect!"
                  : "Well Done!"}
              </h1>
              <p className="phys-win-message">
                {game.bestStreak === game.features.length
                  ? `${game.features.length} features, perfect streak! 🔥`
                  : `Located ${game.score}/${game.features.length} features! 🌍`}
              </p>
              {game.bestStreak > 0 && game.bestStreak < game.features.length && (
                <p className="phys-win-streak">Best streak: {game.bestStreak} 🔥</p>
              )}
              <div className="phys-win-buttons">
                <button onClick={() => navigate("/")} className="phys-win-home-btn">
                  🏠 Home
                </button>
                <button
                  onClick={() => setShowSelector(true)}
                  style={GREEN_BUTTON_STYLE}
                  {...GREEN_BUTTON_HOVER}
                >
                  🎮 New Game
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── Streak animation on map (milestones: 5, 10, 15…) ── */}
        {streakMilestone !== null && (
          <div key={streakMilestone} className="phys-streak-animation">{streakMilestone} 🔥</div>
        )}

        {/* ── Result flash badge ────────────────────── */}
        {game.showingResult && game.lastResult && (
          <div className="phys-result-flash">
            <div className={`phys-result-badge ${game.lastResult.correct ? "correct" : "wrong"}`}>
              {game.lastResult.correct ? "✓ Correct!" : "✗ Wrong"}
            </div>
          </div>
        )}

        {/* ── Map ───────────────────────────────────── */}
        <div
          ref={wrapperRef}
          style={{
            ...getMapWrapperStyle(OUTER_W, OUTER_H, FRAME, "#5b8cff"),
            position: "relative",
          }}
          aria-label="Physical geography game map"
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
              isDesktop={!isPortrait && window.innerWidth >= 768}
              borderless
              geoUrl={GEO_URL}
              onMoveEnd={({ zoom, coordinates }: { zoom: number; coordinates: [number, number] }) => {
                setPos({ zoom, coordinates });
              }}
              renderUnderlay={renderWaterUnderlay}
              renderOverlay={renderLandOverlay}
            />
          </Suspense>
        </div>
      </div>
    </>
  );
}

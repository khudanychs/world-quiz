import { useState, useRef, useMemo, useEffect, useCallback, lazy, Suspense } from "react";
import { useNavigate } from "react-router-dom";
import { geoPath as d3GeoPath, geoNaturalEarth1, geoArea, type GeoPermissibleObjects } from "d3-geo";
import { feature as topoFeature } from "topojson-client";
import type { Topology, GeometryCollection } from "topojson-specification";
import { BackButton } from "./BackButton";
import PhysicalGeoHUD from "./PhysicalGeoHUD";
import {
  GEO_LAND_URL,
  LAKES_URL,
  MARINE_URL,
  MERGED_URL,
  RIVERS_URL,
  buildGeoFeatureGetter,
  getGeoFeatureFocus,
  type GeoFeatureCollection,
} from "./physicalGeoGame/geo";
import { getPhysicalGeoMode } from "./physicalGeoGame/modes";
import {
  renderLandOverlay as renderLandOverlaySvg,
  renderWaterUnderlay as renderWaterUnderlaySvg,
  type Proj,
} from "./physicalGeoGame/renderers";
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
  type PhysicalFeature,
} from "../utils/physicalFeatures";
import "./PhysicalGeoGame.css";

const InteractiveMap = lazy(() => import("./InteractiveMap"));

export default function PhysicalGeoGame() {
  const navigate = useNavigate();
  const [categoryKey, setCategoryKey] = useState<string | null>(null);
  const [showSelector, setShowSelector] = useState(true);
  const game = usePhysicalGeoGame(categoryKey ?? "mountains");
  const activeMode = useMemo(() => getPhysicalGeoMode(categoryKey ?? "mountains"), [categoryKey]);
  const { dimensions, isPortrait } = useMapDimensions();
  const OUTER_W = dimensions.width;
  const OUTER_H = dimensions.height;
  const INNER_W = OUTER_W - FRAME * 2;
  const INNER_H = OUTER_H - FRAME * 2;
  const FIT_SCALE = Math.max(1, Math.round(INNER_W * 0.32));
  const [pos, setPos] = useState<{ coordinates: [number, number]; zoom: number }>({
    coordinates: [0, 0],
    zoom: 1,
  });
  const topoCache = useRef<Topology | null>(null);
  const [topology, setTopology] = useState<Topology | null>(topoCache.current);
  const [marineData, setMarineData] = useState<GeoFeatureCollection | null>(null);
  const needsMarine = !showSelector && activeMode.dataNeeds.marine;
  const needsLandMask = !showSelector && activeMode.dataNeeds.landMask;
  const marineTopoCache = useRef<GeoFeatureCollection | null>(null);
  const landGeoCache = useRef<GeoPermissibleObjects | null>(null);
  const [landGeoRaw, setLandGeoRaw] = useState<GeoPermissibleObjects | null>(null);

  useEffect(() => {
    if (showSelector) return;
    if (topoCache.current) { setTopology(topoCache.current); return; }
    fetch(MERGED_URL)
      .then(r => r.json())
      .then((topo: Topology) => {
        topoCache.current = topo;
        setTopology(topo);
      })
      .catch(() => {});
  }, [showSelector]);

  useEffect(() => {
    if (!needsMarine) { setMarineData(null); return; }
    const extract = (raw: unknown): GeoFeatureCollection | null => {
      if (!raw || typeof raw !== "object") {
        return null;
      }

      const maybeCollection = raw as { type?: string; features?: unknown[] };
      if (maybeCollection.type === "FeatureCollection" && Array.isArray(maybeCollection.features)) {
        return maybeCollection as GeoFeatureCollection;
      }

      const maybeTopo = raw as Topology & { objects?: Record<string, unknown> };
      if (maybeTopo.type === "Topology" && maybeTopo.objects?.marine) {
        return topoFeature(maybeTopo, maybeTopo.objects.marine as GeometryCollection) as unknown as GeoFeatureCollection;
      }

      return null;
    };

    if (marineTopoCache.current) {
      setMarineData(marineTopoCache.current);
      return;
    }
    fetch(MARINE_URL)
      .then((r) => r.json())
      .then((raw: unknown) => {
        const extracted = extract(raw);
        if (!extracted) {
          setMarineData(null);
          return;
        }
        marineTopoCache.current = extracted;
        setMarineData(extracted);
      })
      .catch(() => {});
  }, [needsMarine]);

  useEffect(() => {
    if (!needsLandMask) { setLandGeoRaw(null); return; }
    if (landGeoCache.current) { setLandGeoRaw(landGeoCache.current); return; }
    fetch(GEO_LAND_URL)
      .then((r) => r.json())
      .then((raw: unknown) => {
        const asGeometryCollection = raw as { type?: string; geometries?: GeoPermissibleObjects[] };
        const asFeatureCollection = raw as { type?: string; features?: Array<{ geometry?: GeoPermissibleObjects | null }> };

        let geom: GeoPermissibleObjects | null = null;
        if (asGeometryCollection.type === "GeometryCollection" && Array.isArray(asGeometryCollection.geometries)) {
          geom = asGeometryCollection.geometries[0] ?? null;
        } else if (asFeatureCollection.type === "FeatureCollection" && Array.isArray(asFeatureCollection.features)) {
          const geometries = asFeatureCollection.features
            .map((f) => f.geometry ?? null)
            .filter((g): g is GeoPermissibleObjects => g !== null);
          if (geometries.length === 1) {
            geom = geometries[0];
          } else if (geometries.length > 1) {
            geom = { type: "GeometryCollection", geometries } as unknown as GeoPermissibleObjects;
          }
        }

        if (!geom) return;
        type MultiPoly = { type: "MultiPolygon"; coordinates: number[][][][] };
        if (geoArea(geom as unknown as Parameters<typeof geoArea>[0]) > 2 * Math.PI) {
          geom = {
            type: "MultiPolygon",
            coordinates: (geom as unknown as MultiPoly).coordinates
              .map((poly) => poly.map((ring) => [...ring].reverse())),
          } as unknown as GeoPermissibleObjects;
        }
        landGeoCache.current = geom;
        setLandGeoRaw(geom);
      })
      .catch(() => {});
  }, [needsLandMask]);

  const landPathD = useMemo<string | null>(() => {
    if (!landGeoRaw) return null;
    const proj = geoNaturalEarth1().scale(FIT_SCALE).translate([INNER_W / 2, INNER_H / 2]).center([0, 15]);
    return d3GeoPath(proj)(landGeoRaw) || null;
  }, [landGeoRaw, FIT_SCALE, INNER_W, INNER_H]);

  const [riverData, setRiverData] = useState<GeoFeatureCollection | null>(null);
  const needsRivers = !showSelector && activeMode.dataNeeds.rivers;
  useEffect(() => {
    if (!needsRivers) { setRiverData(null); return; }
    fetch(RIVERS_URL)
      .then(r => r.json())
      .then((data: GeoFeatureCollection) => setRiverData(data))
        .catch(() => {});
  }, [needsRivers]);

  const [lakeData, setLakeData] = useState<GeoFeatureCollection | null>(null);
  const needsLakes = !showSelector && activeMode.dataNeeds.lakes;
  useEffect(() => {
    if (!needsLakes) { setLakeData(null); return; }
    fetch(LAKES_URL)
      .then(r => r.json())
      .then((data: GeoFeatureCollection) => setLakeData(data))
      .catch(() => {});
  }, [needsLakes]);

  const getGeoFeature = useMemo(
    () => buildGeoFeatureGetter(marineData, riverData, lakeData),
    [marineData, riverData, lakeData],
  );

  const panToFeature = useCallback((feature: PhysicalFeature) => {
    const geometryKind = activeMode.getGeoFeatureKind(feature);

    if (geometryKind) {
      const geoFocus = getGeoFeatureFocus(getGeoFeature(feature.name, geometryKind));
      if (geoFocus) {
        let zoom: number;
        if (geoFocus.extent >= 40) zoom = 1.2;
        else if (geoFocus.extent >= 25) zoom = 1.6;
        else if (geoFocus.extent >= 15) zoom = 2.0;
        else if (geoFocus.extent >= 10) zoom = 2.5;
        else if (geoFocus.extent >= 6) zoom = 3.0;
        else if (geoFocus.extent >= 3) zoom = 4.0;
        else if (geoFocus.extent >= 1.5) zoom = 5.5;
        else zoom = 7.0;

        setPos({ coordinates: geoFocus.center, zoom });
        return;
      }
    }

    let center: [number, number];
    let extent = 5;

    if (feature.shape.kind === "marker") {
      center = feature.shape.center;
      extent = 1;
    } else if (feature.shape.kind === "ellipse") {
      center = feature.shape.center;
      extent = Math.max(feature.shape.rx, feature.shape.ry);
    } else if (feature.shape.kind === "polygon") {
      const points = feature.shape.points;
      const lons = points.map(p => p[0]);
      const lats = points.map(p => p[1]);
      center = [
        (Math.min(...lons) + Math.max(...lons)) / 2,
        (Math.min(...lats) + Math.max(...lats)) / 2,
      ];
      extent = Math.max(
        Math.max(...lons) - Math.min(...lons),
        Math.max(...lats) - Math.min(...lats),
      );
    } else if (feature.shape.kind === "polygon_collection") {
      const allPoints = feature.shape.polygons.flat();
      const lons = allPoints.map((p) => p[0]);
      const lats = allPoints.map((p) => p[1]);
      center = [
        (Math.min(...lons) + Math.max(...lons)) / 2,
        (Math.min(...lats) + Math.max(...lats)) / 2,
      ];
      extent = Math.max(
        Math.max(...lons) - Math.min(...lons),
        Math.max(...lats) - Math.min(...lats),
      );
    } else if (feature.shape.kind === "path") {
      const points = feature.shape.points;
      const midIdx = Math.floor(points.length / 2);
      center = points[midIdx];
      const lons = points.map(p => p[0]);
      const lats = points.map(p => p[1]);
      extent = Math.max(
        Math.max(...lons) - Math.min(...lons),
        Math.max(...lats) - Math.min(...lats),
      );
    } else {
      return;
    }

    let zoom: number;
    if (extent >= 40)      zoom = 1.2;
    else if (extent >= 25) zoom = 1.6;
    else if (extent >= 15) zoom = 2.0;
    else if (extent >= 10) zoom = 2.5;
    else if (extent >= 6)  zoom = 3.0;
    else if (extent >= 3)  zoom = 4.0;
    else if (extent >= 1.5) zoom = 5.5;
    else                   zoom = 7.0;

    setPos({ coordinates: center, zoom });
  }, [activeMode, getGeoFeature]);

  const pathCacheRef = useRef<{ key: string; cache: Map<string, string | null> }>({ key: "", cache: new Map() });

  const getPrecomputedPath = useMemo(() => {
    const cacheKey = `${FIT_SCALE}-${INNER_W}-${INNER_H}-${marineData ? 'm' : ''}-${riverData ? 'r' : ''}-${lakeData ? 'l' : ''}`;
    if (pathCacheRef.current.key !== cacheKey) {
      pathCacheRef.current = { key: cacheKey, cache: new Map() };
    }
    const cache = pathCacheRef.current.cache;

    const proj = geoNaturalEarth1()
      .scale(FIT_SCALE)
      .translate([INNER_W / 2, INNER_H / 2])
      .center([0, 15]);
    const pathGen = d3GeoPath(proj);

    return (name: string, kind: "marine" | "river" | "lake" = "marine"): string | null => {
      const key = kind === "marine" ? name : `${kind}:${name}`;
      if (cache.has(key)) return cache.get(key)!;
      const feat = getGeoFeature(name, kind);
      if (!feat || !feat.geometry) { cache.set(key, null); return null; }
      const d = pathGen(feat.geometry) || null;
      cache.set(key, d);
      return d;
    };
  }, [getGeoFeature, FIT_SCALE, INNER_W, INNER_H, marineData, riverData, lakeData]);

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
  const handleFeatureClickWithZoom = useCallback(
    (featureName: string) => {
      if (!game.currentFeature) return;
      const isCorrect = featureName === game.currentFeature.name;
      game.handleFeatureClick(featureName);
      if (!isCorrect) {
        panToFeature(game.currentFeature);
      }
    },
    [game.currentFeature, game.handleFeatureClick, panToFeature]
  );

  const handleBack = () => navigate("/");
  const selectCategory = (key: string) => {
    setCategoryKey(key);
    setShowSelector(false);
    game.startNewGame(key);
  };

  const { waterFeatures, landFeatures } = useMemo(
    () => activeMode.splitFeatures(game.features),
    [activeMode, game.features],
  );

  const allMarineFeatureNames = useMemo(() => {
    if (!activeMode.includeMarineBackground || !marineData) {
      return [] as string[];
    }

    const names = new Set<string>();
    for (const feature of marineData.features ?? []) {
      const props = feature.properties as Record<string, unknown> | undefined;
      const candidate = [
        props?.name,
        props?.Name,
        props?.NAME,
        props?.moje_nazvy,
      ].find((value) => typeof value === "string" && value.trim().length > 0) as string | undefined;
      if (candidate) {
        names.add(candidate.trim());
      }
    }
    return [...names];
  }, [activeMode.includeMarineBackground, marineData]);

  const canClick = (feature: PhysicalFeature) =>
    !correctSetRef.current.has(feature.name) && !skippedSetRef.current.has(feature.name) && !game.showingResult && !game.gameOver;

  // Marine water bodies are rendered in the overlay (on top of land) so they aren't
  // covered by land polygons — this fixes bodies like the Gulf of St. Lawrence that
  // would otherwise be hidden beneath Canada's land geometry.
  const renderOverlay = useCallback((projection: Proj, zoom: number, isDesktop: boolean) => (
    <>
      {renderWaterUnderlaySvg({
        projection,
        zoom,
        isDesktop,
        modeStyleOverrides: activeMode.styleOverrides,
        waterFeatures,
        backgroundMarineNames: allMarineFeatureNames,
        getPrecomputedPath,
        canClick,
        onFeatureClick: handleFeatureClickWithZoom,
        showingResult: game.showingResult,
        lastResult: game.lastResult,
        currentFeatureName: game.currentFeature?.name,
        correctSet: correctSetRef.current,
        skippedSet: skippedSetRef.current,
      })}
      {renderLandOverlaySvg({
        projection,
        zoom,
        isDesktop,
        modeStyleOverrides: activeMode.styleOverrides,
        landFeatures,
        getPrecomputedPath,
        canClick,
        onFeatureClick: handleFeatureClickWithZoom,
        showingResult: game.showingResult,
        lastResult: game.lastResult,
        currentFeatureName: game.currentFeature?.name,
        correctSet: correctSetRef.current,
        skippedSet: skippedSetRef.current,
      })}
    </>
  ), [activeMode.styleOverrides, waterFeatures, allMarineFeatureNames, landFeatures, getPrecomputedPath, game.showingResult, game.lastResult, game.currentFeature, handleFeatureClickWithZoom]);

  return (
    <>
      {showSelector && (
        <div className="phys-category-overlay">
          <div className="phys-category-content">
            <h1 className="phys-category-title">🌍 Physical Geography</h1>
            <p className="phys-category-subtitle">Choose a category to start</p>

            <div className={`phys-category-grid ${isPortrait ? "portrait" : "landscape"}`}>
              {CATEGORY_GROUPS.map((group) => (
                <button
                  key={group.key}
                  onClick={() => selectCategory(group.key)}
                  className={`phys-cat-btn phys-cat-btn-${group.key}`}
                >
                  {group.emoji} {group.label}
                </button>
              ))}
            </div>

            <button onClick={() => navigate("/")} className="phys-category-back-btn">
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
        {streakMilestone !== null && (
          <div key={streakMilestone} className="phys-streak-animation">{streakMilestone} 🔥</div>
        )}
        {game.showingResult && game.lastResult && game.lastResult.clickedName !== "" && (!game.lastResult.correct || streakMilestone === null) && (
          <div className={`phys-result-flash ${game.lastResult.correct ? "flash-correct" : ""}`}>
            <div className={`phys-result-badge ${game.lastResult.correct ? "correct" : "wrong"}`}>
              {game.lastResult.correct ? "✓ Correct!" : "✗ Wrong"}
            </div>
          </div>
        )}
        <div
          ref={wrapperRef}
          style={{
            ...getMapWrapperStyle(OUTER_W, OUTER_H, FRAME, "#5b8cff"),
            position: "relative",
            ...(activeMode.key === "waters" ? { background: "#2a1520" } : {}),
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
              geoLandPath={needsMarine ? landPathD : null}
              geoUrl={needsLandMask ? undefined : (topology ?? MERGED_URL)}
              onMoveEnd={({ zoom, coordinates }: { zoom: number; coordinates: [number, number] }) => {
                setPos({ zoom, coordinates });
              }}
              renderOverlay={renderOverlay}
            />
          </Suspense>
        </div>
      </div>
    </>
  );
}

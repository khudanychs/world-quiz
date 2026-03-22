import { useState, useRef, useMemo, useEffect, useCallback, lazy, Suspense, memo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { geoPath as d3GeoPath, geoNaturalEarth1, geoArea, type GeoPermissibleObjects } from "d3-geo";
import { BackButton } from "./BackButton";
import PhysicalGeoHUD from "./PhysicalGeoHUD";
import {
  GEO_LAND_URL,
  LAKES_URL,
  MARINE_URL,
  MERGED_URL,
  RIVERS_URL,
  buildGeoFeatureGetter,
  extractGeoFeatureCollection,
  extractLandGeometry,
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
import type { ModeStyleOverrides } from "./physicalGeoGame/modes/types";

const InteractiveMap = lazy(() => import("./InteractiveMap"));

// =============================================================================
// MEMOIZED OVERLAY COMPONENT
// This prevents re-rendering the overlay SVG on every zoom/pan frame.
// Only re-renders when actual game state or features change.
// =============================================================================
interface MemoizedOverlayProps {
  projection: Proj;
  zoom: number;
  isDesktop: boolean;
  lowDetailMode: boolean;
  modeStyleOverrides: ModeStyleOverrides;
  waterFeatures: PhysicalFeature[];
  backgroundMarineNames: string[];
  landFeatures: PhysicalFeature[];
  getPrecomputedPath: (name: string, kind?: "marine" | "river" | "lake") => string | null;
  canClick: (feature: PhysicalFeature) => boolean;
  onFeatureClick: (featureName: string) => void;
  showingResult: boolean;
  lastResult: { correct: boolean; clickedName: string } | null;
  currentFeatureName: string | undefined;
  correctSet: Set<string>;
  skippedSet: Set<string>;
  // Key to force re-render when visual state changes
  visualStateKey: string;
}

const MemoizedOverlay = memo(function MemoizedOverlay({
  projection,
  zoom,
  isDesktop,
  lowDetailMode,
  modeStyleOverrides,
  waterFeatures,
  backgroundMarineNames,
  landFeatures,
  getPrecomputedPath,
  canClick,
  onFeatureClick,
  showingResult,
  lastResult,
  currentFeatureName,
  correctSet,
  skippedSet,
}: MemoizedOverlayProps) {
  return (
    <>
      {renderWaterUnderlaySvg({
        projection,
        zoom,
        isDesktop,
        lowDetailMode,
        modeStyleOverrides,
        waterFeatures,
        backgroundMarineNames,
        getPrecomputedPath,
        canClick,
        onFeatureClick,
        showingResult,
        lastResult,
        currentFeatureName,
        correctSet,
        skippedSet,
      })}
      {renderLandOverlaySvg({
        projection,
        zoom,
        isDesktop,
        lowDetailMode,
        modeStyleOverrides,
        landFeatures,
        getPrecomputedPath,
        canClick,
        onFeatureClick,
        showingResult,
        lastResult,
        currentFeatureName,
        correctSet,
        skippedSet,
      })}
    </>
  );
}, (prevProps, nextProps) => {
  // 1. Změnil se viditelný stav hry? PŘEKRESLIT!
  if (prevProps.visualStateKey !== nextProps.visualStateKey) return false;
  
  // 2. Skokový ZOOM (uživatel posunul kolečko nebo prsty zastavil). 
  // Změna o víc než 0.1 je náš bezpečný práh, kdy víme, že se musí přepočítat scaleStroke.
  if (Math.abs(prevProps.zoom - nextProps.zoom) > 0.1) return false;

  // 3. Změnil se počet objektů na obrazovce (nová úroveň, nebo loading hotov)? PŘEKRESLIT!
  if (prevProps.waterFeatures.length !== nextProps.waterFeatures.length) return false;
  if (prevProps.landFeatures.length !== nextProps.landFeatures.length) return false;

  // 4. Je tohle jiný prohlížeč (změnilo se isDesktop)? PŘEKRESLIT!
  if (prevProps.isDesktop !== nextProps.isDesktop) return false;

  // VE VŠECH OSTATNÍCH PŘÍPADECH (a to včetně mikro-posunů myší během PANNINGU na CPU)
  // SE NEPŘEKRESLUJE ANI JEDNA JEDINÁ ČÁRA!
  return true;
});

export default function PhysicalGeoGame() {
  const navigate = useNavigate();
  const { modeKey } = useParams<{ modeKey?: string }>();
  const categoryKey = useMemo(() => {
    if (!modeKey) {
      return null;
    }
    return CATEGORY_GROUPS.some((group) => group.key === modeKey) ? modeKey : null;
  }, [modeKey]);
  const showSelector = categoryKey === null;
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
  const [marineData, setMarineData] = useState<GeoFeatureCollection | null>(null);
  const needsMarine = !!categoryKey && activeMode.dataNeeds.marine;
  const hasActiveMode = !!categoryKey;
  const needsDetailedLandMask = hasActiveMode && activeMode.dataNeeds.landMask;
  const usesTopoLandBase = hasActiveMode && !needsDetailedLandMask;
  const marineTopoCache = useRef<GeoFeatureCollection | null>(null);
  const landGeoCache = useRef<GeoPermissibleObjects | null>(null);
  const riverGeoCache = useRef<GeoFeatureCollection | null>(null);
  const lakeGeoCache = useRef<GeoFeatureCollection | null>(null);
  const [landGeoRaw, setLandGeoRaw] = useState<GeoPermissibleObjects | null>(null);
  const [geographiesReady, setGeographiesReady] = useState(false);

  useEffect(() => {
    if (!usesTopoLandBase) {
      setGeographiesReady(false);
      return;
    }
    // Reset readiness when switching to a mode that uses TopoJSON land geographies.
    setGeographiesReady(false);
  }, [categoryKey, usesTopoLandBase]);

  useEffect(() => {
    if (!needsMarine) { setMarineData(null); return; }
    if (marineTopoCache.current) {
      setMarineData(marineTopoCache.current);
      return;
    }
    fetch(MARINE_URL)
      .then((r) => r.json())
      .then((raw: unknown) => {
        const extracted = extractGeoFeatureCollection(raw, ["marine", "water", "ocean"]);
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
    if (!needsDetailedLandMask) { setLandGeoRaw(null); return; }
    if (landGeoCache.current) { setLandGeoRaw(landGeoCache.current); return; }
    fetch(GEO_LAND_URL)
      .then((r) => r.json())
      .then((raw: unknown) => {
        let geom: GeoPermissibleObjects | null = extractLandGeometry(raw, ["land", "geoland", "countries", "landmask"]);

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
  }, [needsDetailedLandMask]);

  const landPathD = useMemo<string | null>(() => {
    if (!landGeoRaw) return null;
    const proj = geoNaturalEarth1().scale(FIT_SCALE).translate([INNER_W / 2, INNER_H / 2]).center([0, 15]);
    return d3GeoPath(proj)(landGeoRaw) || null;
  }, [landGeoRaw, FIT_SCALE, INNER_W, INNER_H]);

  // Base map is ready when either:
  // - detailed land mask path exists, or
  // - TopoJSON geographies have loaded.
  const baseMapReady = needsDetailedLandMask ? !!landPathD : geographiesReady;

  // Only draw clickable overlays once the land base is visible.
  const canRenderFeatureOverlay = hasActiveMode && baseMapReady;

  const perfDebugEnabled = useMemo(() => {
    if (typeof window === "undefined") {
      return false;
    }
    const globalFlag = (window as Window & { __PHYS_GEO_DEBUG__?: boolean }).__PHYS_GEO_DEBUG__;
    const queryFlag = window.location.search.includes("physDebug=1");
    const storageFlag = window.localStorage.getItem("physGeoDebug") === "1";
    return !!globalFlag || queryFlag || storageFlag;
  }, []);

  const preferLowDetailTopography = useMemo(() => {
    if (typeof window === "undefined") {
      return false;
    }
    return window.location.search.includes("physLowDetail=1") || window.localStorage.getItem("physGeoLowDetail") === "1";
  }, []);

  const debugSnapshotRef = useRef({
    mode: categoryKey,
    lowDetail: preferLowDetailTopography,
    width: INNER_W,
    height: INNER_H,
    zoom: pos.zoom,
    coordinates: pos.coordinates,
    features: game.features.length,
    canRenderFeatureOverlay,
  });

  useEffect(() => {
    debugSnapshotRef.current = {
      mode: categoryKey,
      lowDetail: preferLowDetailTopography,
      width: INNER_W,
      height: INNER_H,
      zoom: pos.zoom,
      coordinates: pos.coordinates,
      features: game.features.length,
      canRenderFeatureOverlay,
    };
  }, [categoryKey, preferLowDetailTopography, INNER_W, INNER_H, pos.zoom, pos.coordinates, game.features.length, canRenderFeatureOverlay]);

  useEffect(() => {
    if (!perfDebugEnabled || typeof window === "undefined") {
      return;
    }

    console.info("[phys-geo:debug] enabled", {
      mode: debugSnapshotRef.current.mode,
      lowDetail: debugSnapshotRef.current.lowDetail,
      width: debugSnapshotRef.current.width,
      height: debugSnapshotRef.current.height,
      zoom: debugSnapshotRef.current.zoom,
      features: debugSnapshotRef.current.features,
      canRenderFeatureOverlay: debugSnapshotRef.current.canRenderFeatureOverlay,
    });
  }, [perfDebugEnabled]);

  useEffect(() => {
    if (!perfDebugEnabled || typeof window === "undefined") {
      return;
    }

    let frames = 0;
    let rafId = 0;
    let last = performance.now();

    const tick = (now: number) => {
      frames += 1;
      if (now - last >= 1000) {
        const fps = (frames * 1000) / (now - last);
        const mem = (performance as Performance & { memory?: { usedJSHeapSize?: number } }).memory;
        const s = debugSnapshotRef.current;
        console.info("[phys-geo:fps]", {
          fps: Number(fps.toFixed(1)),
          zoom: Number(s.zoom.toFixed(2)),
          coordinates: s.coordinates,
          mode: s.mode,
          features: s.features,
          heapMB: mem?.usedJSHeapSize ? Number((mem.usedJSHeapSize / (1024 * 1024)).toFixed(1)) : undefined,
        });
        frames = 0;
        last = now;
      }
      rafId = window.requestAnimationFrame(tick);
    };

    rafId = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(rafId);
  }, [perfDebugEnabled]);

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
  }, []);

  const [riverData, setRiverData] = useState<GeoFeatureCollection | null>(null);
  const needsRivers = !!categoryKey && activeMode.dataNeeds.rivers;
  useEffect(() => {
    if (!needsRivers) { setRiverData(null); return; }
    if (riverGeoCache.current) { setRiverData(riverGeoCache.current); return; }
    fetch(RIVERS_URL)
      .then(r => r.json())
      .then((raw: unknown) => {
        const extracted = extractGeoFeatureCollection(raw, ["rivers", "river", "waterways"]);
        if (!extracted) {
          setRiverData(null);
          return;
        }
        riverGeoCache.current = extracted;
        setRiverData(extracted);
      })
        .catch(() => {});
  }, [needsRivers]);

  const [lakeData, setLakeData] = useState<GeoFeatureCollection | null>(null);
  const needsLakes = !!categoryKey && activeMode.dataNeeds.lakes;
  useEffect(() => {
    if (!needsLakes) { setLakeData(null); return; }
    if (lakeGeoCache.current) { setLakeData(lakeGeoCache.current); return; }
    fetch(LAKES_URL)
      .then(r => r.json())
      .then((raw: unknown) => {
        const extracted = extractGeoFeatureCollection(raw, ["lakes", "lake", "water"]);
        if (!extracted) {
          setLakeData(null);
          return;
        }
        lakeGeoCache.current = extracted;
        setLakeData(extracted);
      })
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

  const handleBack = useCallback(() => navigate("/"), [navigate]);
  const selectCategory = useCallback((key: string) => {
    navigate(`/game/physical-geo/${key}`);
  }, [navigate]);

  useEffect(() => {
    if (!categoryKey) {
      return;
    }
    game.startNewGame(categoryKey);
  }, [categoryKey]);

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

  const canClick = useCallback((feature: PhysicalFeature) => (
    !correctSetRef.current.has(feature.name) &&
    !skippedSetRef.current.has(feature.name) &&
    !showingResultRef.current &&
    !gameOverRef.current
  ), []);

  // Key that changes when visual state changes (triggers overlay re-render)
  const visualStateKey = useMemo(() =>
    `${game.showingResult}|${game.lastResult?.correct ?? ''}|${game.lastResult?.clickedName ?? ''}|${game.currentFeature?.name ?? ''}|${game.correctSet.size}|${game.skippedSet.size}`,
    [game.showingResult, game.lastResult, game.currentFeature?.name, game.correctSet.size, game.skippedSet.size]
  );

  // Marine water bodies are rendered in the overlay (on top of land) so they aren't
  // covered by land polygons — this fixes bodies like the Gulf of St. Lawrence that
  // would otherwise be hidden beneath Canada's land geometry.
  const renderOverlay = useCallback((projection: Proj, zoom: number, isDesktop: boolean) => {
    return (
      <MemoizedOverlay
        projection={projection}
        zoom={zoom}
        isDesktop={isDesktop}
        lowDetailMode={preferLowDetailTopography}
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
    preferLowDetailTopography,
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
        <BackButton onClick={handleBack} label="Menu" />
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
              navigate("/game/physical-geo");
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
                  onClick={() => navigate("/game/physical-geo")}
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
            ...(activeMode.key === "waters" ? { background: "#0f2a4a" } : {}),
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
              isDesktop={isDesktop}
              borderless
              renderGeographies={hasActiveMode && !needsDetailedLandMask}
              geoLandPath={needsDetailedLandMask ? landPathD : null}
              geoUrl={needsDetailedLandMask ? undefined : MERGED_URL}
              onGeographiesLoaded={handleBaseGeographiesLoaded}
              onMoveEnd={handleMapMoveEnd}
              overlayInteractive={true}
              renderOverlay={canRenderFeatureOverlay ? renderOverlay : undefined}
            />
          </Suspense>
          {hasActiveMode && !baseMapReady && (
            <div className="phys-base-loading-veil" aria-live="polite" aria-label="Loading map base">
              <div className="phys-map-loading-spinner" />
            </div>
          )}
        </div>
      </div>
    </>
  );
}

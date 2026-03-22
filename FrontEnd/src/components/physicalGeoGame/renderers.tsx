import {
  FEATURE_COLORS,
  FEATURE_FILL_OPACITY,
  projectEllipse,
  projectPath,
  projectPolygon,
  projectPolygonCollection,
  type PhysicalFeature,
} from "../../utils/physicalFeatures";
import { resolveModeStyle } from "./modes/styleDefaults";
import type { ModeStyleConfig, ModeStyleOverrides } from "./modes/types";

export type Proj = (coords: [number, number]) => [number, number] | null;

interface GameResult {
  correct: boolean;
  clickedName: string;
}

interface FeatureVisual {
  color: string;
  opacity: number;
  fillOpacity: number;
  glow: boolean;
}

interface SharedRenderArgs {
  projection: Proj;
  zoom: number;
  isDesktop: boolean;
  lowDetailMode?: boolean;
  modeStyleOverrides: ModeStyleOverrides;
  getPrecomputedPath: (name: string, kind?: "marine" | "river" | "lake") => string | null;
  canClick: (feature: PhysicalFeature) => boolean;
  onFeatureClick: (featureName: string) => void;
}

interface WaterUnderlayArgs extends SharedRenderArgs {
  waterFeatures: PhysicalFeature[];
  backgroundMarineNames?: string[];
  showingResult: boolean;
  lastResult: GameResult | null;
  currentFeatureName?: string;
  correctSet: Set<string>;
  skippedSet: Set<string>;
}

interface LandOverlayArgs extends SharedRenderArgs {
  landFeatures: PhysicalFeature[];
  showingResult: boolean;
  lastResult: GameResult | null;
  currentFeatureName?: string;
  correctSet: Set<string>;
  skippedSet: Set<string>;
}

const LITE_DESERT_PATTERN_ID = "phys-lite-desert-pattern";
const LITE_MOUNTAIN_PATTERN_ID = "phys-lite-mountain-pattern";
const featureAreaCache = new WeakMap<PhysicalFeature, number>();
const featureOrderCache = new WeakMap<PhysicalFeature[], PhysicalFeature[]>();
const polygonCollectionSortCache = new WeakMap<object, [number, number][][]>();

const LITE_TOPOGRAPHY_DEFS = (
  <defs>
    <pattern id={LITE_DESERT_PATTERN_ID} patternUnits="userSpaceOnUse" width="12" height="12" patternTransform="rotate(18)">
      <line x1="0" y1="0" x2="0" y2="12" stroke="rgba(122, 81, 39, 0.22)" strokeWidth="1" />
    </pattern>
    <pattern id={LITE_MOUNTAIN_PATTERN_ID} patternUnits="userSpaceOnUse" width="10" height="10">
      <path d="M0,10 L5,2 L10,10" fill="none" stroke="rgba(70, 44, 28, 0.24)" strokeWidth="0.9" />
    </pattern>
  </defs>
);

function isPhysGeoDebugEnabled(): boolean {
  if (typeof window === "undefined") {
    return false;
  }
  const globalFlag = (window as Window & { __PHYS_GEO_DEBUG__?: boolean }).__PHYS_GEO_DEBUG__;
  const queryFlag = window.location.search.includes("physDebug=1");
  const storageFlag = window.localStorage.getItem("physGeoDebug") === "1";
  return !!globalFlag || queryFlag || storageFlag;
}

let renderMetricCounter = 0;
function logRenderMetric(scope: "land" | "water", ms: number, details: Record<string, unknown>): void {
  if (!isPhysGeoDebugEnabled()) {
    return;
  }
  renderMetricCounter += 1;
  if (ms >= 3 || renderMetricCounter % 20 === 0) {
    console.debug(`[phys-geo:${scope}] ${ms.toFixed(2)}ms`, details);
  }
}

function getTopographyOverlayOpacity(featureType: PhysicalFeature["type"], style: ModeStyleConfig): number {
  if (featureType === "desert") {
    return style.desert.textureOpacity;
  }
  if (featureType === "mountain_range") {
    return style.mountainRange.textureOpacity;
  }
  return 0;
}

function getLakeFillOpacity(fillOpacity: number, style: ModeStyleConfig): number {
  return Math.min(0.82, fillOpacity + style.lake.fillBoost);
}

function getFeatureVisual(
  feature: PhysicalFeature,
  currentFeatureName: string | undefined,
  showingResult: boolean,
  lastResult: GameResult | null,
  correctSet: Set<string>,
  skippedSet: Set<string>,
): FeatureVisual {
  const baseColor = FEATURE_COLORS[feature.type];
  const baseFillOpacity = FEATURE_FILL_OPACITY[feature.type];
  const isCurrentTarget = feature.name === currentFeatureName;
  const isDesert = feature.type === "desert";

  if (showingResult && lastResult) {
    if (lastResult.correct && isCurrentTarget) {
      return { color: "#4caf50", opacity: 1, fillOpacity: 0.55, glow: true };
    }
    if (!lastResult.correct) {
      if (feature.name === lastResult.clickedName) {
        return { color: "#ef4444", opacity: 1, fillOpacity: 0.5, glow: false };
      }
      if (isCurrentTarget) {
        return {
          color: isDesert ? "#22d3ee" : "#ffc107",
          opacity: 1,
          fillOpacity: isDesert ? 0.62 : 0.55,
          glow: true,
        };
      }
    }
  }

  if (correctSet.has(feature.name)) {
    return { color: "#4caf50", opacity: 0.7, fillOpacity: baseFillOpacity * 0.5, glow: false };
  }

  if (skippedSet.has(feature.name)) {
    return {
      color: isDesert ? "#60a5fa" : "#f59e0b",
      opacity: 0.78,
      fillOpacity: isDesert ? Math.max(baseFillOpacity * 0.65, 0.35) : baseFillOpacity * 0.5,
      glow: false,
    };
  }

  return { color: baseColor, opacity: 1, fillOpacity: baseFillOpacity, glow: false };
}

function renderLakeLayerStack(
  feature: PhysicalFeature,
  d: string,
  vis: FeatureVisual,
  style: ModeStyleConfig,
  lowDetail: boolean,
  enableAnimation: boolean,
  pointerEvents: "all" | "none",
  onClick?: () => void,
): JSX.Element {
  const fillOpacity = feature.type === "lake" ? getLakeFillOpacity(vis.fillOpacity, style) : vis.fillOpacity;
  const strokeWidth = feature.type === "lake" ? style.lake.coreStrokeWidth : 1.5;
  const strokeOpacity = feature.type === "lake" ? Math.min(1, vis.opacity * 0.95) : vis.opacity * 0.6;

  if (lowDetail) {
    return (
      <path
        key={feature.name}
        d={d}
        fill={vis.color}
        fillOpacity={fillOpacity}
        stroke={style.lake.outlineColor}
        strokeWidth={Math.max(0.08, strokeWidth * 0.75)}
        strokeOpacity={strokeOpacity}
        style={{ cursor: pointerEvents === "all" ? "pointer" : "default", pointerEvents }}
        onClick={onClick}
      />
    );
  }

  return (
    <g key={feature.name}>
      {feature.type === "lake" && (
        <path
          d={d}
          fill={vis.color}
          fillOpacity={fillOpacity}
          stroke={style.lake.outlineColor}
          strokeWidth={style.lake.outlineStrokeWidth}
          strokeOpacity={0.9}
          style={{ pointerEvents: "none" }}
        />
      )}
      <path
        d={d}
        fill={vis.color}
        fillOpacity={fillOpacity}
        stroke={vis.color}
        strokeWidth={strokeWidth}
        strokeOpacity={strokeOpacity}
        style={{ cursor: pointerEvents === "all" ? "pointer" : "default", pointerEvents }}
        onClick={onClick}
      />
      {vis.glow && enableAnimation && (
        <path
          d={d}
          fill="none"
          stroke={vis.color}
          strokeWidth={feature.type === "lake" ? style.lake.glowStrokeWidth : 3}
          opacity={0.5}
          style={{ pointerEvents: "none" }}
        >
          <animate attributeName="opacity" values="0.6;0.2;0.6" dur="1s" repeatCount="indefinite" />
        </path>
      )}
    </g>
  );
}

function renderTopographyAreaStack(
  feature: PhysicalFeature,
  d: string,
  vis: FeatureVisual,
  style: ModeStyleConfig,
  withTexture: boolean,
  lowDetail: boolean,
  enableAnimation: boolean,
  pointerEvents: "all" | "none",
  onClick?: () => void,
  keySuffix: string = "",
): JSX.Element {
  const overlayOpacity = withTexture ? getTopographyOverlayOpacity(feature.type, style) : 0;
  const texturePatternId = feature.type === "desert" ? LITE_DESERT_PATTERN_ID : LITE_MOUNTAIN_PATTERN_ID;
  const borderStrokeWidth =
    feature.type === "desert"
      ? style.desert.borderStrokeWidth
      : feature.type === "mountain_range"
        ? Math.max(1.25, style.mountainRange.outlineWidth * 0.14)
        : 1.1;
  const fillBoost = feature.type === "desert" ? style.desert.fillBoost : 0.12;
  const borderColor = feature.type === "desert" ? "rgba(64, 45, 24, 0.8)" : "rgba(56, 37, 27, 0.72)";

  if (lowDetail) {
    const litePatternId = feature.type === "desert" ? LITE_DESERT_PATTERN_ID : LITE_MOUNTAIN_PATTERN_ID;
    return (
      <g key={`${feature.name}${keySuffix}`}>
        <path
          d={d}
          fill={vis.color}
          fillOpacity={Math.min(0.66, vis.fillOpacity + Math.max(0.04, fillBoost * 0.45))}
          stroke={borderColor}
          strokeWidth={Math.max(0.8, borderStrokeWidth * 0.55)}
          strokeOpacity={Math.min(0.85, vis.opacity * 0.85)}
          style={{ cursor: pointerEvents === "all" ? "pointer" : "default", pointerEvents }}
          onClick={onClick}
        />
        {withTexture && (
          <path
            d={d}
            fill={`url(#${litePatternId})`}
            fillOpacity={feature.type === "desert" ? 0.26 : 0.2}
            stroke="none"
            style={{ pointerEvents: "none" }}
          />
        )}
      </g>
    );
  }

  return (
    <g key={`${feature.name}${keySuffix}`}>
      <path
        d={d}
        fill={vis.color}
        fillOpacity={Math.min(0.72, vis.fillOpacity + fillBoost)}
        stroke={vis.color}
        strokeWidth={borderStrokeWidth}
        strokeOpacity={Math.min(1, vis.opacity * 0.9)}
        style={{ cursor: pointerEvents === "all" ? "pointer" : "default", pointerEvents }}
        onClick={onClick}
      />
      {withTexture && (
        <path
          d={d}
          fill={`url(#${texturePatternId})`}
          fillOpacity={overlayOpacity}
          stroke="none"
          style={{ pointerEvents: "none" }}
        />
      )}
      <path
        d={d}
        fill="none"
        stroke={borderColor}
        strokeWidth={borderStrokeWidth + 0.55}
        strokeOpacity={0.95}
        style={{ pointerEvents: "none" }}
      />
      {vis.glow && enableAnimation && (
        <path
          d={d}
          fill="none"
          stroke={vis.color}
          strokeWidth={2.1}
          opacity={0.35}
          style={{ pointerEvents: "none" }}
        >
          <animate attributeName="opacity" values="0.45;0.16;0.45" dur="1s" repeatCount="indefinite" />
        </path>
      )}
    </g>
  );
}

function getRingArea(points: [number, number][]): number {
  if (points.length < 3) {
    return 0;
  }

  let area = 0;
  for (let i = 0; i < points.length; i += 1) {
    const [x1, y1] = points[i];
    const [x2, y2] = points[(i + 1) % points.length];
    area += x1 * y2 - x2 * y1;
  }

  return Math.abs(area) / 2;
}

function getFeatureArea(feature: PhysicalFeature): number {
  const cached = featureAreaCache.get(feature);
  if (cached !== undefined) {
    return cached;
  }

  let area = 0;
  if (feature.shape.kind === "polygon") {
    area = getRingArea(feature.shape.points);
    featureAreaCache.set(feature, area);
    return area;
  }

  if (feature.shape.kind === "polygon_collection") {
    area = feature.shape.polygons.reduce((sum, polygon) => sum + getRingArea(polygon), 0);
    featureAreaCache.set(feature, area);
    return area;
  }

  if (feature.shape.kind === "ellipse") {
    area = Math.PI * feature.shape.rx * feature.shape.ry;
    featureAreaCache.set(feature, area);
    return area;
  }

  featureAreaCache.set(feature, 0);
  return 0;
}

function sortFeaturesForRender(features: PhysicalFeature[]): PhysicalFeature[] {
  const cached = featureOrderCache.get(features);
  if (cached) {
    return cached;
  }

  const sorted = [...features].sort((a, b) => {
    const aIsMarker = a.shape.kind === "marker" ? 1 : 0;
    const bIsMarker = b.shape.kind === "marker" ? 1 : 0;
    if (aIsMarker !== bIsMarker) {
      return aIsMarker - bIsMarker;
    }

    const aArea = getFeatureArea(a);
    const bArea = getFeatureArea(b);
    if (aArea !== bArea) {
      // Render larger areas first so smaller shapes sit on top.
      return bArea - aArea;
    }

    return a.name.localeCompare(b.name);
  });

  featureOrderCache.set(features, sorted);
  return sorted;
}

function getSortedPolygonCollection(polygons: [number, number][][]): [number, number][][] {
  const keyObj = polygons as unknown as object;
  const cached = polygonCollectionSortCache.get(keyObj);
  if (cached) {
    return cached;
  }

  const sorted = [...polygons].sort((a, b) => getRingArea(b) - getRingArea(a));
  polygonCollectionSortCache.set(keyObj, sorted);
  return sorted;
}

function getResultOverlayColor(
  featureName: string,
  showingResult: boolean,
  lastResult: GameResult | null,
  currentFeatureName?: string,
): string | null {
  if (!showingResult || !lastResult) {
    return null;
  }

  if (!lastResult.correct && featureName === lastResult.clickedName) {
    return "#ef4444";
  }

  if (featureName === currentFeatureName) {
    return lastResult.correct ? "#4caf50" : "#ffc107";
  }

  return null;
}

function renderResultOverlay(
  feature: PhysicalFeature,
  color: string,
  projection: Proj,
  zoom: number,
  isDesktop: boolean,
  getPrecomputedPath: (name: string, kind?: "marine" | "river" | "lake") => string | null,
  style: ModeStyleConfig,
): JSX.Element | null {
  const enableAnimation = isDesktop;
  if (feature.shape.kind === "marker") {
    const pt = projection(feature.shape.center);
    if (!pt) {
      return null;
    }

    const r = Math.max(isDesktop ? 4 : 1.5, (isDesktop ? 8 : 3) / Math.pow(zoom, 0.4));
    return (
      <g key={`overlay-${feature.name}`} style={{ pointerEvents: "none" }}>
        <circle cx={pt[0]} cy={pt[1]} r={r * 1.35} fill="none" stroke={color} strokeWidth={2.4} opacity={0.95} />
        {enableAnimation ? (
          <circle cx={pt[0]} cy={pt[1]} r={r * 2.15} fill="none" stroke={color} strokeWidth={2} opacity={0.55}>
            <animate attributeName="opacity" values="0.65;0.18;0.65" dur="1s" repeatCount="indefinite" />
          </circle>
        ) : null}
      </g>
    );
  }

  let d: string | null = null;
  if (feature.shape.kind === "path") {
    d = feature.type === "river" ? getPrecomputedPath(feature.name, "river") : null;
    if (!d) {
      d = projectPath(feature.shape.points, projection);
    }
  } else if (feature.shape.kind === "polygon") {
    d = feature.type === "lake" ? getPrecomputedPath(feature.name, "lake") : null;
    if (!d) {
      d = projectPolygon(feature.shape.points, projection);
    }
  } else if (feature.shape.kind === "polygon_collection") {
    d = projectPolygonCollection(feature.shape.polygons, projection);
  } else if (feature.shape.kind === "ellipse") {
    d = feature.type === "lake" ? getPrecomputedPath(feature.name, "lake") : null;
    if (!d) {
      const { center, rx, ry, rotation = 0 } = feature.shape;
      d = projectEllipse(center, rx, ry, rotation, projection, 48);
    }
  }

  if (!d) {
    return null;
  }

  const strokeWidth =
    feature.type === "river"
      ? style.river.strokeWidth + 3
      : feature.type === "mountain_range"
        ? Math.max(3, style.mountainRange.outlineWidth * 0.35)
        : 2.8;

  return (
    <path
      key={`overlay-${feature.name}`}
      d={d}
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeOpacity={0.95}
      vectorEffect="non-scaling-stroke"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ pointerEvents: "none" }}
    >
      {enableAnimation ? (
        <animate attributeName="stroke-opacity" values="1;0.4;1" dur="1s" repeatCount="indefinite" />
      ) : null}
    </path>
  );
}

export function renderWaterUnderlay({
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
}: WaterUnderlayArgs): JSX.Element | null {
  const startedAt = typeof performance !== "undefined" ? performance.now() : 0;
  if (waterFeatures.length === 0) {
    return null;
  }

  const modeStyle = resolveModeStyle(modeStyleOverrides);
  const lowDetailWater = !isDesktop || !!lowDetailMode;
  const adaptiveLowDetailWater = lowDetailWater || (waterFeatures.length >= 90 && zoom <= 2.8);
  const sw = Math.max(0.5, 1.2 / Math.pow(zoom, 0.5));
  const markerR = Math.max(isDesktop ? 5 : 2, (isDesktop ? 9 : 4) / Math.pow(zoom, 0.4));
  const interactiveNames = new Set(waterFeatures.map((feature) => feature.name.toLowerCase()));
  const backgroundNames = (backgroundMarineNames ?? []).filter((name) => !interactiveNames.has(name.toLowerCase()));
  const hasOnlyRiverLakeTargets = waterFeatures.every((feature) => feature.type === "river" || feature.type === "lake");
  const showBackgroundMarine = !adaptiveLowDetailWater && !hasOnlyRiverLakeTargets;

  const output = (
    <g shapeRendering="optimizeSpeed">
      {showBackgroundMarine && backgroundNames.map((featureName) => {
        const d = getPrecomputedPath(featureName, "marine");
        if (!d) {
          return null;
        }

        return (
          <path
            key={`bg-${featureName}`}
            d={d}
            fill={modeStyle.marine.fillColor}
            stroke={modeStyle.marine.strokeColor}
            strokeWidth={sw * 0.8}
            vectorEffect="non-scaling-stroke"
            style={{ pointerEvents: "none" }}
          />
        );
      })}

      {waterFeatures.map((feature) => {
        const rawD = getPrecomputedPath(feature.name, "marine");
        const d = rawD || null;
        const clickable = canClick(feature);
        const handleClick = clickable ? () => onFeatureClick(feature.name) : undefined;

        let fillColor = modeStyle.marine.fillColor;
        let strokeColor = modeStyle.marine.strokeColor;
        let strokeW = sw;

        if (showingResult && lastResult) {
          if (lastResult.correct && feature.name === currentFeatureName) {
            fillColor = "#2e7d32";
            strokeColor = "#4caf50";
            strokeW = sw * 2;
          } else if (!lastResult.correct && feature.name === lastResult.clickedName) {
            fillColor = "#7f1d1d";
            strokeColor = "#ef4444";
            strokeW = sw * 2;
          } else if (!lastResult.correct && feature.name === currentFeatureName) {
            fillColor = "#7c6300";
            strokeColor = "#ffc107";
            strokeW = sw * 2;
          }
        } else if (correctSet.has(feature.name)) {
          fillColor = "#1b5e20";
          strokeColor = "#4caf50";
        } else if (skippedSet.has(feature.name)) {
          fillColor = "#5c4800";
          strokeColor = "#f59e0b";
        }

        if (!d) {
          if (feature.shape.kind === "ellipse") {
            const { center, rx, ry, rotation: rot = 0 } = feature.shape;
            const ellipseD = projectEllipse(center, rx, ry, rot, projection, 48);
            if (!ellipseD) {
              return null;
            }

            return (
              <path
                key={feature.name}
                d={ellipseD}
                fill={fillColor}
                stroke={strokeColor}
                strokeWidth={sw}
                vectorEffect="non-scaling-stroke"
                style={{
                  cursor: clickable ? "pointer" : "default",
                  pointerEvents: clickable ? "all" : "none",
                }}
                onClick={handleClick}
              />
            );
          }

          if (feature.shape.kind !== "marker") {
            return null;
          }

          const pt = projection(feature.shape.center);
          if (!pt) {
            return null;
          }

          return (
            <circle
              key={feature.name}
              cx={pt[0]}
              cy={pt[1]}
              r={markerR}
              fill={fillColor}
              stroke={strokeColor}
              strokeWidth={Math.max(0.5, 1 / Math.pow(zoom, 0.4))}
              style={{
                cursor: clickable ? "pointer" : "default",
                pointerEvents: clickable ? "all" : "none",
              }}
              onClick={handleClick}
            />
          );
        }

        if (adaptiveLowDetailWater) {
          return (
            <path
              key={feature.name}
              d={d}
              fill={fillColor}
              stroke={strokeColor}
              strokeWidth={Math.max(0.6, strokeW * 0.8)}
              vectorEffect="non-scaling-stroke"
              style={{
                cursor: clickable ? "pointer" : "default",
                pointerEvents: clickable ? "visiblePainted" : "none",
              }}
              onClick={handleClick}
            />
          );
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

  if (startedAt > 0) {
    logRenderMetric("water", performance.now() - startedAt, {
      features: waterFeatures.length,
      backgroundPaths: showBackgroundMarine ? backgroundNames.length : 0,
      lowDetailWater: adaptiveLowDetailWater,
      zoom: Number(zoom.toFixed(2)),
    });
  }

  return output;
}

export function renderLandOverlay({
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
}: LandOverlayArgs): JSX.Element | null {
  const startedAt = typeof performance !== "undefined" ? performance.now() : 0;
  if (landFeatures.length === 0) {
    return null;
  }

  const modeStyle = resolveModeStyle(modeStyleOverrides);
  const mountainOnlyMode =
    landFeatures.length > 0 &&
    landFeatures.every(
      (feature) =>
        feature.type === "mountain" ||
        feature.type === "mountain_range" ||
        feature.type === "volcano"
    );
  const lowDetailTopography = !!lowDetailMode;
  const lowDetailWater = !!lowDetailMode;
  const adaptiveLowDetailTopography =
    lowDetailTopography ||
    (mountainOnlyMode && zoom <= 6.5) ||
    (landFeatures.length >= 70 && zoom <= 2.2);
  const adaptiveLowDetailWater = lowDetailWater || (landFeatures.length >= 90 && zoom <= 2.4);
  const enableAnimation = isDesktop && !mountainOnlyMode;
  const orderedLandFeatures = sortFeaturesForRender(landFeatures);
  const hasTexturedFeatures = orderedLandFeatures.some(
    (feature) => feature.type === "desert" || feature.type === "mountain_range",
  );
  const shouldTextureFeature = hasTexturedFeatures;

  const topResultOverlays = orderedLandFeatures
    .map((feature) => {
      const color = getResultOverlayColor(feature.name, showingResult, lastResult, currentFeatureName);
      if (!color) {
        return null;
      }

      return renderResultOverlay(feature, color, projection, zoom, isDesktop, getPrecomputedPath, modeStyle);
    })
    .filter((overlay): overlay is JSX.Element => overlay !== null);

  const output = (
    <g>
      {hasTexturedFeatures ? LITE_TOPOGRAPHY_DEFS : null}
      {orderedLandFeatures.map((feature) => {
        const vis = getFeatureVisual(feature, currentFeatureName, showingResult, lastResult, correctSet, skippedSet);
        const clickable = canClick(feature);
        const handleClick = clickable ? () => onFeatureClick(feature.name) : undefined;
        const cursor = clickable ? "pointer" : "default";

        switch (feature.shape.kind) {
          case "marker": {
            const pt = projection(feature.shape.center);
            if (!pt) {
              return null;
            }

            const r = Math.max(isDesktop ? 4 : 1.5, (isDesktop ? 8 : 3) / Math.pow(zoom, 0.4));
            return (
              <g key={feature.name}>
                <circle
                  cx={pt[0]}
                  cy={pt[1]}
                  r={r}
                  fill={vis.color}
                  stroke="#fff"
                  strokeWidth={Math.max(0.5, 1 / Math.pow(zoom, 0.4))}
                  opacity={vis.opacity}
                  style={{ cursor, pointerEvents: clickable ? "visiblePainted" : "none" }}
                  onClick={handleClick}
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
            let d = feature.type === "river" ? getPrecomputedPath(feature.name, "river") : null;
            if (!d) {
              d = projectPath(feature.shape.points, projection);
            }
            if (!d) {
              return null;
            }

            if (feature.type === "mountain_range") {
              const withTexture = shouldTextureFeature && !mountainOnlyMode;
              const mountainPatternId = LITE_MOUNTAIN_PATTERN_ID;
              const useWideHitTarget = !mountainOnlyMode && !adaptiveLowDetailTopography;
              return (
                <g key={feature.name}>
                  {useWideHitTarget && (
                    <path
                      d={d}
                      fill="none"
                      stroke="transparent"
                      strokeWidth={Math.max(modeStyle.river.hitStrokeWidth, modeStyle.mountainRange.outlineWidth + 4)}
                      vectorEffect="non-scaling-stroke"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      style={{ cursor, pointerEvents: clickable ? "stroke" : "none" }}
                      onClick={handleClick}
                    />
                  )}
                  <path
                    d={d}
                    fill="none"
                    stroke={vis.color}
                    strokeWidth={adaptiveLowDetailTopography ? Math.max(2.4, modeStyle.mountainRange.bandWidth * 0.55) : modeStyle.mountainRange.bandWidth}
                    strokeOpacity={Math.min(0.85, vis.opacity)}
                    vectorEffect="non-scaling-stroke"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    style={{
                      pointerEvents: clickable ? (useWideHitTarget ? "none" : "visibleStroke") : "none",
                      cursor,
                    }}
                    onClick={useWideHitTarget ? undefined : handleClick}
                  />
                  {withTexture && (
                    <path
                      d={d}
                      fill="none"
                      stroke={`url(#${mountainPatternId})`}
                      strokeWidth={modeStyle.mountainRange.bandWidth - 1.2}
                      strokeOpacity={getTopographyOverlayOpacity("mountain_range", modeStyle)}
                      vectorEffect="non-scaling-stroke"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      style={{ pointerEvents: "none" }}
                    />
                  )}
                  {!adaptiveLowDetailTopography && (
                    <path
                      d={d}
                      fill="none"
                      stroke="rgba(56, 37, 27, 0.55)"
                      strokeWidth={modeStyle.mountainRange.outlineWidth}
                      vectorEffect="non-scaling-stroke"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      style={{ pointerEvents: "none" }}
                    />
                  )}
                  {vis.glow && enableAnimation && !adaptiveLowDetailTopography && (
                    <path
                      d={d}
                      fill="none"
                      stroke={vis.color}
                      strokeWidth={modeStyle.mountainRange.outlineWidth + 2}
                      vectorEffect="non-scaling-stroke"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      opacity={0.24}
                      style={{ pointerEvents: "none" }}
                    >
                      <animate attributeName="opacity" values="0.24;0.08;0.24" dur="1s" repeatCount="indefinite" />
                    </path>
                  )}
                </g>
              );
            }

            const strokeWidth = feature.type === "river" ? modeStyle.river.strokeWidth : 3.5;
            return (
              <g key={feature.name}>
                {!adaptiveLowDetailWater && (
                  <path
                    d={d}
                    fill="none"
                    stroke="transparent"
                    strokeWidth={modeStyle.river.hitStrokeWidth}
                    vectorEffect="non-scaling-stroke"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    style={{ cursor, pointerEvents: clickable ? "stroke" : "none" }}
                    onClick={handleClick}
                  />
                )}
                {feature.type === "river" && (
                  !adaptiveLowDetailWater && (
                  <path
                    d={d}
                    fill="none"
                    stroke="rgba(6, 23, 37, 0.45)"
                    strokeWidth={strokeWidth + modeStyle.river.outlineExtra}
                    vectorEffect="non-scaling-stroke"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    style={{ pointerEvents: "none" }}
                  />
                  )
                )}
                <path
                  d={d}
                  fill="none"
                  stroke={vis.color}
                  strokeWidth={strokeWidth}
                  vectorEffect="non-scaling-stroke"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  opacity={vis.opacity}
                  style={{
                    pointerEvents: clickable
                      ? (adaptiveLowDetailWater ? "visibleStroke" : "none")
                      : "none",
                    cursor: clickable ? "pointer" : "default",
                  }}
                  onClick={adaptiveLowDetailWater ? handleClick : undefined}
                />
                {vis.glow && enableAnimation && !adaptiveLowDetailWater && (
                  <path
                    d={d}
                    fill="none"
                    stroke={vis.color}
                    strokeWidth={strokeWidth + modeStyle.river.glowExtra}
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
            let d = feature.type === "lake" ? getPrecomputedPath(feature.name, "lake") : null;
            if (!d) {
              const { center, rx, ry, rotation = 0 } = feature.shape;
              d = projectEllipse(center, rx, ry, rotation, projection, 48);
            }
            if (!d) {
              return null;
            }

            if (feature.type === "desert") {
              const pointerEvents = clickable ? "all" : "none";
              return renderTopographyAreaStack(
                feature,
                d,
                vis,
                modeStyle,
                shouldTextureFeature,
                adaptiveLowDetailTopography,
                enableAnimation,
                pointerEvents,
                handleClick,
              );
            }

            const pointerEvents = feature.type === "lake" ? "all" : clickable ? "all" : "none";
            return renderLakeLayerStack(feature, d, vis, modeStyle, adaptiveLowDetailWater, enableAnimation, pointerEvents, handleClick);
          }

          case "polygon": {
            let d = feature.type === "lake" ? getPrecomputedPath(feature.name, "lake") : null;
            const ghostD = feature.name === "Aral Sea" && d ? projectPolygon(feature.shape.points, projection) : null;
            if (!d) {
              d = projectPolygon(feature.shape.points, projection);
            }
            if (!d) {
              return null;
            }

            if (feature.type === "desert" || feature.type === "mountain_range") {
              return renderTopographyAreaStack(
                feature,
                d,
                vis,
                modeStyle,
                shouldTextureFeature,
                adaptiveLowDetailTopography,
                enableAnimation,
                clickable ? "all" : "none",
                handleClick,
              );
            }

            return (
              <g key={feature.name}>
                {ghostD && (
                  <path
                    d={ghostD}
                    fill="none"
                    stroke={vis.color}
                    strokeWidth={1}
                    strokeDasharray="5,4"
                    strokeOpacity={0.5}
                    vectorEffect="non-scaling-stroke"
                    style={{ pointerEvents: "none" }}
                  />
                )}
                {renderLakeLayerStack(feature, d, vis, modeStyle, adaptiveLowDetailWater, enableAnimation, "all", handleClick)}
              </g>
            );
          }

          case "polygon_collection": {
            const sortedPolygons = getSortedPolygonCollection(feature.shape.polygons);

            if (feature.type === "desert" || feature.type === "mountain_range") {
              if (adaptiveLowDetailTopography) {
                const d = projectPolygonCollection(sortedPolygons, projection);
                if (!d) {
                  return null;
                }

                return renderTopographyAreaStack(
                  feature,
                  d,
                  vis,
                  modeStyle,
                  true,
                  true,
                  enableAnimation,
                  clickable ? "all" : "none",
                  handleClick,
                );
              }

              return (
                <g key={feature.name}>
                  {sortedPolygons.map((polygon, polygonIdx) => {
                    const d = projectPolygon(polygon, projection);
                    if (!d) {
                      return null;
                    }

                    return renderTopographyAreaStack(
                      feature,
                      d,
                      vis,
                      modeStyle,
                      shouldTextureFeature,
                      lowDetailTopography,
                      enableAnimation,
                      clickable ? "all" : "none",
                      handleClick,
                      `#${polygonIdx}`,
                    );
                  })}
                </g>
              );
            }

            const d = projectPolygonCollection(sortedPolygons, projection);
            if (!d) {
              return null;
            }

            return (
              <g key={feature.name}>
                {renderLakeLayerStack(feature, d, vis, modeStyle, adaptiveLowDetailWater, enableAnimation, "all", handleClick)}
              </g>
            );
          }

          default:
            return null;
        }
      })}
      {topResultOverlays.length > 0 && <g style={{ pointerEvents: "none" }}>{topResultOverlays}</g>}
    </g>
  );

  if (startedAt > 0) {
    logRenderMetric("land", performance.now() - startedAt, {
      features: landFeatures.length,
      textured: hasTexturedFeatures,
      mountainOnlyMode,
      lowDetailTopography: adaptiveLowDetailTopography,
      lowDetailWater: adaptiveLowDetailWater,
      zoom: Number(zoom.toFixed(2)),
    });
  }

  return output;
}
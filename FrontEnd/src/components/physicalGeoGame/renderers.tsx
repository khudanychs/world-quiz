import { memo } from "react";
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

const SHARED_OUTLINE_COLOR = "rgba(6, 23, 37, 0.45)";

function scaleStroke(baseWidth: number, zoom: number, min = 0.45): number {
  return Math.max(min, baseWidth / Math.max(zoom, 0.75));
}

type MemoFeatureProps = {
  d?: string;
  cx?: number;
  cy?: number;
  r?: number;
  fill: string;
  fillOpacity?: number;
  stroke?: string;
  strokeWidth?: number;
  strokeOpacity?: number;
  cursor: "pointer" | "default";
  pointerEvents: "all" | "none" | "stroke" | "visiblePainted" | "visibleStroke";
  onFeatureClick?: (featureName: string) => void;
  featureName: string;
  strokeLinecap?: "round" | "butt" | "square";
  strokeLinejoin?: "round" | "miter" | "bevel";
  className?: string;
};

const MemoizedFeatureShape = memo(function MemoizedFeatureShape({
  d,
  cx,
  cy,
  r,
  fill,
  fillOpacity,
  stroke,
  strokeWidth,
  strokeOpacity,
  cursor,
  pointerEvents,
  onFeatureClick,
  featureName,
  strokeLinecap,
  strokeLinejoin,
  className,
}: MemoFeatureProps): JSX.Element {
  const handleClick = onFeatureClick ? () => onFeatureClick(featureName) : undefined;
  if (typeof cx === "number" && typeof cy === "number" && typeof r === "number") {
    return (
      <circle
        cx={cx}
        cy={cy}
        r={r}
        fill={fill}
        fillOpacity={fillOpacity}
        stroke={stroke}
        strokeWidth={strokeWidth}
        strokeOpacity={strokeOpacity}
        className={className}
        style={{ cursor, pointerEvents }}
        onClick={handleClick}
      />
    );
  }

  return (
    <path
      d={d}
      fill={fill}
      fillOpacity={fillOpacity}
      stroke={stroke}
      strokeWidth={strokeWidth}
      strokeOpacity={strokeOpacity}
      strokeLinecap={strokeLinecap}
      strokeLinejoin={strokeLinejoin}
      className={className}
      style={{ cursor, pointerEvents }}
      onClick={handleClick}
    />
  );
});

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
  zoom: number,
  lowDetail: boolean,
  enableAnimation: boolean,
  pointerEvents: "all" | "none",
  onFeatureClick: ((featureName: string) => void) | undefined,
): JSX.Element {
  const fillOpacity = feature.type === "lake" ? getLakeFillOpacity(vis.fillOpacity, style) : vis.fillOpacity;
  const strokeWidth = feature.type === "lake" ? Math.max(1.2, style.lake.coreStrokeWidth) : 1.5;
  const strokeOpacity = feature.type === "lake" ? Math.min(1, vis.opacity * 0.95) : vis.opacity * 0.6;
  const outlineWidth = feature.type === "lake" ? Math.max(1.8, style.lake.outlineStrokeWidth) : Math.max(1.4, strokeWidth + 0.5);

  if (lowDetail) {
    return (
      <g key={feature.name}>
        <path
          d={d}
          fill={vis.color}
          fillOpacity={fillOpacity}
          stroke={SHARED_OUTLINE_COLOR}
          strokeWidth={scaleStroke(outlineWidth, zoom)}
          strokeOpacity={0.9}
          style={{ pointerEvents: "none" }}
        />
        <MemoizedFeatureShape
          d={d}
          fill={vis.color}
          fillOpacity={fillOpacity}
          stroke={vis.color}
          strokeWidth={scaleStroke(Math.max(1, strokeWidth * 0.78), zoom)}
          strokeOpacity={strokeOpacity}
          cursor={pointerEvents === "all" ? "pointer" : "default"}
          pointerEvents={pointerEvents}
          onFeatureClick={onFeatureClick}
          featureName={feature.name}
        />
      </g>
    );
  }

  return (
    <g key={feature.name}>
      {feature.type === "lake" && (
        <path
          d={d}
          fill={vis.color}
          fillOpacity={fillOpacity}
          stroke={SHARED_OUTLINE_COLOR}
          strokeWidth={scaleStroke(outlineWidth, zoom)}
          strokeOpacity={0.9}
          style={{ pointerEvents: "none" }}
        />
      )}
      <MemoizedFeatureShape
        d={d}
        fill={vis.color}
        fillOpacity={fillOpacity}
        stroke={vis.color}
        strokeWidth={scaleStroke(strokeWidth, zoom)}
        strokeOpacity={strokeOpacity}
        cursor={pointerEvents === "all" ? "pointer" : "default"}
        pointerEvents={pointerEvents}
        onFeatureClick={onFeatureClick}
        featureName={feature.name}
      />
      {vis.glow && enableAnimation && (
        <path
          d={d}
          fill="none"
          stroke={vis.color}
          strokeWidth={scaleStroke(feature.type === "lake" ? style.lake.glowStrokeWidth : 3, zoom)}
          opacity={0.5}
          className="phys-pulse-opacity"
          style={{ pointerEvents: "none" }}
        />
      )}
    </g>
  );
}

function renderTopographyAreaStack(
  feature: PhysicalFeature,
  d: string,
  vis: FeatureVisual,
  style: ModeStyleConfig,
  zoom: number,
  withTexture: boolean,
  lowDetail: boolean,
  enableAnimation: boolean,
  pointerEvents: "all" | "none",
  onFeatureClick: ((featureName: string) => void) | undefined,
  keySuffix: string = "",
): JSX.Element {
  const overlayOpacity = withTexture ? getTopographyOverlayOpacity(feature.type, style) : 0;
  const texturePatternId = feature.type === "desert" ? LITE_DESERT_PATTERN_ID : LITE_MOUNTAIN_PATTERN_ID;
  const baseBorderStrokeWidth =
    feature.type === "desert"
      ? style.desert.borderStrokeWidth
      : feature.type === "mountain_range"
        ? Math.max(1.25, style.mountainRange.outlineWidth * 0.14)
        : 1.1;
  const borderStrokeWidth = Math.max(1, baseBorderStrokeWidth * 0.7);
  const borderOutlineWidth = borderStrokeWidth + 0.55;
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
          strokeWidth={scaleStroke(borderStrokeWidth, zoom)}
          strokeOpacity={Math.min(0.85, vis.opacity * 0.85)}
          style={{ cursor: pointerEvents === "all" ? "pointer" : "default", pointerEvents }}
          onClick={onFeatureClick ? () => onFeatureClick(feature.name) : undefined}
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
        strokeWidth={scaleStroke(borderStrokeWidth, zoom)}
        strokeOpacity={Math.min(1, vis.opacity * 0.9)}
        style={{ cursor: pointerEvents === "all" ? "pointer" : "default", pointerEvents }}
        onClick={onFeatureClick ? () => onFeatureClick(feature.name) : undefined}
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
        strokeWidth={scaleStroke(borderOutlineWidth, zoom)}
        strokeOpacity={0.95}
        style={{ pointerEvents: "none" }}
      />
      {vis.glow && enableAnimation && (
        <path
          d={d}
          fill="none"
          stroke={vis.color}
          strokeWidth={scaleStroke(2.1, zoom)}
          opacity={0.35}
          className="phys-pulse-opacity"
          style={{ pointerEvents: "none" }}
        />
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

    const r = Math.max(2.5, 7 / Math.pow(zoom, 0.4));
    return (
      <g key={`overlay-${feature.name}`} style={{ pointerEvents: "none" }}>
        <circle cx={pt[0]} cy={pt[1]} r={scaleStroke(r * 1.35, zoom)} fill="none" stroke={color} strokeWidth={scaleStroke(2.4, zoom)} opacity={0.95} />
        {enableAnimation ? (
          <circle
            cx={pt[0]}
            cy={pt[1]}
            r={scaleStroke(r * 2.15, zoom)}
            fill="none"
            stroke={color}
            strokeWidth={scaleStroke(2, zoom)}
            opacity={0.55}
            className="phys-pulse-opacity"
          />
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
      strokeWidth={scaleStroke(strokeWidth, zoom)}
      strokeOpacity={0.95}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={enableAnimation ? "phys-pulse-stroke" : undefined}
      style={{ pointerEvents: "none" }}
    />
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
  const lowDetailWater = !!lowDetailMode;
  const adaptiveLowDetailWater = lowDetailWater || (waterFeatures.length >= 90 && zoom <= 2.8);
  const sw = Math.max(0.5, 1.2 / Math.pow(zoom, 0.5));
  const hasOnlyRiverLakeTargets = waterFeatures.every((feature) => feature.type === "river" || feature.type === "lake");
  const showBackgroundMarine = !adaptiveLowDetailWater && !hasOnlyRiverLakeTargets;
  let backgroundNames: string[] = [];
  if (showBackgroundMarine && (backgroundMarineNames?.length ?? 0) > 0) {
    const interactiveNames = new Set(waterFeatures.map((feature) => feature.name.toLowerCase()));
    backgroundNames = backgroundMarineNames!.filter((name) => !interactiveNames.has(name.toLowerCase()));
  }

  const backgroundNodes: JSX.Element[] = [];
  if (showBackgroundMarine) {
    for (const featureName of backgroundNames) {
      const d = getPrecomputedPath(featureName, "marine");
      if (!d) continue;
      backgroundNodes.push(
        <MemoizedFeatureShape
          key={`bg-${featureName}`}
          d={d}
          fill={modeStyle.marine.fillColor}
          stroke={modeStyle.marine.strokeColor}
          strokeWidth={scaleStroke(sw * 0.8, zoom)}
          cursor="default"
          pointerEvents="none"
          featureName={featureName}
        />,
      );
    }
  }

  const waterNodes: JSX.Element[] = [];
  for (const feature of waterFeatures) {
    const clickable = canClick(feature);
    const d = getPrecomputedPath(feature.name, "marine");

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

    if (d) {
      waterNodes.push(
        <MemoizedFeatureShape
          key={feature.name}
          d={d}
          fill={fillColor}
          stroke={strokeColor}
          strokeWidth={scaleStroke(adaptiveLowDetailWater ? Math.max(0.6, strokeW * 0.8) : strokeW, zoom)}
          cursor={clickable ? "pointer" : "default"}
          pointerEvents={clickable ? (adaptiveLowDetailWater ? "visiblePainted" : "all") : "none"}
          onFeatureClick={clickable ? onFeatureClick : undefined}
          featureName={feature.name}
        />,
      );
      continue;
    }

    if (feature.shape.kind === "ellipse") {
      const { center, rx, ry, rotation: rot = 0 } = feature.shape;
      const ellipseD = projectEllipse(center, rx, ry, rot, projection, 48);
      if (!ellipseD) continue;
      waterNodes.push(
        <MemoizedFeatureShape
          key={feature.name}
          d={ellipseD}
          fill={fillColor}
          stroke={strokeColor}
          strokeWidth={scaleStroke(sw, zoom)}
          cursor={clickable ? "pointer" : "default"}
          pointerEvents={clickable ? "all" : "none"}
          onFeatureClick={clickable ? onFeatureClick : undefined}
          featureName={feature.name}
        />,
      );
      continue;
    }

    if (feature.shape.kind === "marker") {
      const pt = projection(feature.shape.center);
      if (!pt) continue;
      const isMarineMarker = feature.type !== "river" && feature.type !== "lake";
      const markerRadius = isMarineMarker
        ? Math.max(isDesktop ? 4.8 : 2.1, (isDesktop ? 10.5 : 5.2) / Math.pow(zoom, 0.42))
        : Math.max(isDesktop ? 4.1 : 1.8, (isDesktop ? 8.6 : 4.4) / Math.pow(zoom, 0.42));
      const markerStrokeWidth = isDesktop ? 0.9 : 0.45;
      waterNodes.push(
        <MemoizedFeatureShape
          key={feature.name}
          cx={pt[0]}
          cy={pt[1]}
          r={markerRadius}
          fill={fillColor}
          stroke={strokeColor}
          strokeWidth={markerStrokeWidth}
          cursor={clickable ? "pointer" : "default"}
          pointerEvents={clickable ? "all" : "none"}
          onFeatureClick={clickable ? onFeatureClick : undefined}
          featureName={feature.name}
        />,
      );
    }
  }

  const output = <g shapeRendering="optimizeSpeed">{backgroundNodes}{waterNodes}</g>;

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

  const topResultOverlays =
    showingResult && lastResult
      ? orderedLandFeatures
          .map((feature) => {
            const color = getResultOverlayColor(feature.name, showingResult, lastResult, currentFeatureName);
            if (!color) {
              return null;
            }

            return renderResultOverlay(feature, color, projection, zoom, isDesktop, getPrecomputedPath, modeStyle);
          })
          .filter((overlay): overlay is JSX.Element => overlay !== null)
      : [];

  const renderLandFeatureNode = (feature: PhysicalFeature): JSX.Element | null => {
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

            const isMountainMarker =
              feature.type === "mountain_range";
            const r = isMountainMarker
              ? Math.max(isDesktop ? 5.1 : 2.1, (isDesktop ? 11.2 : 3.6) / Math.pow(zoom, 0.42))
              : Math.max(isDesktop ? 4.3 : 0.9, (isDesktop ? 9.1 : 3.7) / Math.pow(zoom, 0.42));
            const markerStrokeWidth = isDesktop ? 0.9 : 0.25;
            return (
              <g key={feature.name}>
                <circle
                  cx={pt[0]}
                  cy={pt[1]}
                  r={r}
                  fill={vis.color}
                  stroke="#fff"
                  strokeWidth={markerStrokeWidth}
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
                    strokeWidth={Math.max(1.2, scaleStroke(2.2, zoom))}
                    opacity={0.5}
                    className="phys-pulse-ring"
                    style={{ pointerEvents: "none" }}
                  />
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
              const mountainCoreStroke = Math.max(2.4, modeStyle.mountainRange.bandWidth * 0.62);
              const mountainOutlineStroke = Math.max(1.8, modeStyle.mountainRange.outlineWidth * 0.8);
              return (
                <g key={feature.name}>
                  {useWideHitTarget && (
                    <path
                      d={d}
                      fill="none"
                      stroke="transparent"
                      strokeWidth={scaleStroke(Math.max(modeStyle.river.hitStrokeWidth, modeStyle.mountainRange.outlineWidth + 4), zoom)}
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
                    strokeWidth={scaleStroke(mountainCoreStroke, zoom)}
                    strokeOpacity={Math.min(0.85, vis.opacity)}
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
                      strokeWidth={scaleStroke(Math.max(1.1, mountainCoreStroke - 1.2), zoom)}
                      strokeOpacity={getTopographyOverlayOpacity("mountain_range", modeStyle)}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      style={{ pointerEvents: "none" }}
                    />
                  )}
                  {!adaptiveLowDetailTopography && (
                    <path
                      d={d}
                      fill="none"
                      stroke={SHARED_OUTLINE_COLOR}
                      strokeWidth={scaleStroke(mountainOutlineStroke, zoom)}
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
                      strokeWidth={scaleStroke(mountainOutlineStroke + 2, zoom)}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      opacity={0.24}
                      className="phys-pulse-opacity"
                      style={{ pointerEvents: "none" }}
                    />
                  )}
                </g>
              );
            }

            const strokeWidth = feature.type === "river" ? modeStyle.river.strokeWidth : 3.5;
            return (
              <g key={feature.name}>
                <path
                  d={d}
                  fill="none"
                  stroke="transparent"
                  strokeWidth={scaleStroke(modeStyle.river.hitStrokeWidth, zoom)}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  style={{ cursor, pointerEvents: clickable ? "stroke" : "none" }}
                  onClick={handleClick}
                />
                {feature.type === "river" && (
                  <path
                    d={d}
                    fill="none"
                    stroke={SHARED_OUTLINE_COLOR}
                    strokeWidth={scaleStroke(Math.max(1.8, strokeWidth + modeStyle.river.outlineExtra), zoom)}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    style={{ pointerEvents: "none" }}
                  />
                )}
                <path
                  d={d}
                  fill="none"
                  stroke={vis.color}
                  strokeWidth={scaleStroke(strokeWidth, zoom)}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  opacity={vis.opacity}
                  style={{
                    pointerEvents: "none",
                    cursor: clickable ? "pointer" : "default",
                  }}
                />
                {vis.glow && enableAnimation && !adaptiveLowDetailWater && (
                  <path
                    d={d}
                    fill="none"
                    stroke={vis.color}
                    strokeWidth={scaleStroke(strokeWidth + modeStyle.river.glowExtra, zoom)}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    opacity={0.3}
                    className="phys-pulse-opacity"
                    style={{ pointerEvents: "none" }}
                  />
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
                zoom,
                shouldTextureFeature,
                adaptiveLowDetailTopography,
                enableAnimation,
                pointerEvents,
                clickable ? onFeatureClick : undefined,
              );
            }

            const pointerEvents = feature.type === "lake" ? "all" : clickable ? "all" : "none";
            return renderLakeLayerStack(feature, d, vis, modeStyle, zoom, adaptiveLowDetailWater, enableAnimation, pointerEvents, clickable ? onFeatureClick : undefined);
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
                zoom,
                shouldTextureFeature,
                adaptiveLowDetailTopography,
                enableAnimation,
                clickable ? "all" : "none",
                clickable ? onFeatureClick : undefined,
              );
            }

            return (
              <g key={feature.name}>
                {ghostD && (
                  <path
                    d={ghostD}
                    fill="none"
                    stroke={vis.color}
                    strokeWidth={scaleStroke(1, zoom)}
                    strokeDasharray="5,4"
                    strokeOpacity={0.5}
                    style={{ pointerEvents: "none" }}
                  />
                )}
                {renderLakeLayerStack(feature, d, vis, modeStyle, zoom, adaptiveLowDetailWater, enableAnimation, "all", clickable ? onFeatureClick : undefined)}
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
                  zoom,
                  true,
                  true,
                  enableAnimation,
                  clickable ? "all" : "none",
                  clickable ? onFeatureClick : undefined,
                );
              }

              return (
                <g key={feature.name}>
                  {(() => {
                    const polygonNodes: JSX.Element[] = [];
                    for (let polygonIdx = 0; polygonIdx < sortedPolygons.length; polygonIdx += 1) {
                      const polygon = sortedPolygons[polygonIdx];
                      const projected = projectPolygon(polygon, projection);
                      if (!projected) continue;
                      polygonNodes.push(
                        renderTopographyAreaStack(
                          feature,
                          projected,
                          vis,
                          modeStyle,
                          zoom,
                          shouldTextureFeature,
                          lowDetailTopography,
                          enableAnimation,
                          clickable ? "all" : "none",
                          clickable ? onFeatureClick : undefined,
                          `#${polygonIdx}`,
                        ),
                      );
                    }
                    return polygonNodes;
                  })()}
                </g>
              );
            }

            const d = projectPolygonCollection(sortedPolygons, projection);
            if (!d) {
              return null;
            }

            return (
              <g key={feature.name}>
                {renderLakeLayerStack(feature, d, vis, modeStyle, zoom, adaptiveLowDetailWater, enableAnimation, "all", clickable ? onFeatureClick : undefined)}
              </g>
            );
          }

          default:
            return null;
      }
  };

  const landFeatureNodes = orderedLandFeatures
    .map(renderLandFeatureNode)
    .filter((node): node is JSX.Element => node !== null);

  const output = (
    <g shapeRendering="optimizeSpeed">
      {hasTexturedFeatures ? LITE_TOPOGRAPHY_DEFS : null}
      {landFeatureNodes}
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
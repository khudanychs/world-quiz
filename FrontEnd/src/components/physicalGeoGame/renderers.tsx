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

function scaleStroke(baseWidth: number, zoom: number, min = 0.2): number {
  return Math.max(min, baseWidth / Math.max(zoom, 0.75));
}

function scaleHitArea(baseWidth: number, zoom: number): number {
  // Hit area scales down with zoom but maintains minimum for touch targets
  // At low zoom (1x): min 10px for mobile, at high zoom (7x): min ~3px for precision
  const scaledWidth = baseWidth / Math.max(zoom, 0.75);
  const minHitArea = Math.max(2, 10 / Math.sqrt(zoom));
  return Math.max(minHitArea, scaledWidth);
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
  className?: string;
  strokeLinecap?: "round" | "butt" | "square";
  strokeLinejoin?: "round" | "miter" | "bevel";
};

const MemoizedFeatureShape = memo(function MemoizedFeatureShape({
  d, cx, cy, r, fill, fillOpacity, stroke, strokeWidth, strokeOpacity, cursor, pointerEvents, onFeatureClick, featureName, className, strokeLinecap, strokeLinejoin
}: MemoFeatureProps): JSX.Element {
  const handleClick = onFeatureClick ? () => onFeatureClick(featureName) : undefined;
  if (typeof cx === "number" && typeof cy === "number" && typeof r === "number") {
    return (
      <circle
        cx={cx} cy={cy} r={r} fill={fill} fillOpacity={fillOpacity} stroke={stroke} strokeWidth={strokeWidth} strokeOpacity={strokeOpacity}
        className={className} style={{ cursor, pointerEvents }} onClick={handleClick}
      />
    );
  }
  return (
    <path
      d={d} fill={fill} fillOpacity={fillOpacity} stroke={stroke} strokeWidth={strokeWidth} strokeOpacity={strokeOpacity}
      className={className} style={{ cursor, pointerEvents }} onClick={handleClick}
      strokeLinecap={strokeLinecap} strokeLinejoin={strokeLinejoin}
    />
  );
});

function getFeatureVisual(feature: PhysicalFeature, currentFeatureName: string | undefined, showingResult: boolean, lastResult: GameResult | null, correctSet: Set<string>, skippedSet: Set<string>): FeatureVisual {
  const baseColor = FEATURE_COLORS[feature.type];
  const baseFillOpacity = FEATURE_FILL_OPACITY[feature.type];
  const isCurrentTarget = feature.name === currentFeatureName;
  const isDesert = feature.type === "desert";

  if (showingResult && lastResult) {
    if (lastResult.correct && isCurrentTarget) return { color: "#4caf50", opacity: 1, fillOpacity: 0.55, glow: true };
    if (!lastResult.correct) {
      if (feature.name === lastResult.clickedName) return { color: "#ef4444", opacity: 1, fillOpacity: 0.5, glow: false };
      if (isCurrentTarget) return { color: isDesert ? "#22d3ee" : "#ffc107", opacity: 1, fillOpacity: isDesert ? 0.62 : 0.55, glow: true };
    }
  }
  if (correctSet.has(feature.name)) return { color: "#4caf50", opacity: 0.7, fillOpacity: baseFillOpacity * 0.5, glow: false };
  if (skippedSet.has(feature.name)) return { color: isDesert ? "#60a5fa" : "#f59e0b", opacity: 0.78, fillOpacity: isDesert ? Math.max(baseFillOpacity * 0.65, 0.35) : baseFillOpacity * 0.5, glow: false };

  return { color: baseColor, opacity: 1, fillOpacity: baseFillOpacity, glow: false };
}

function getRingArea(points: [number, number][]): number {
  if (points.length < 3) return 0;
  let area = 0;
  for (let i = 0; i < points.length; i++) {
    const [x1, y1] = points[i];
    const [x2, y2] = points[(i + 1) % points.length];
    area += x1 * y2 - x2 * y1;
  }
  return Math.abs(area) / 2;
}

function getFeatureArea(feature: PhysicalFeature): number {
  if (feature.shape.kind === "polygon") return getRingArea(feature.shape.points);
  if (feature.shape.kind === "polygon_collection") return feature.shape.polygons.reduce((sum, poly) => sum + getRingArea(poly), 0);
  if (feature.shape.kind === "ellipse") return Math.PI * feature.shape.rx * feature.shape.ry;
  return 0;
}

export function renderWaterUnderlay({ projection, zoom, isDesktop, lowDetailMode, modeStyleOverrides, waterFeatures, backgroundMarineNames, getPrecomputedPath, canClick, onFeatureClick, showingResult, lastResult, currentFeatureName, correctSet, skippedSet }: WaterUnderlayArgs): JSX.Element | null {
  if (waterFeatures.length === 0) return null;
  const modeStyle = resolveModeStyle(modeStyleOverrides);
  const sw = Math.max(0.5, 1.2 / Math.pow(zoom, 0.5));
  
  return (
    <g>
      {waterFeatures.map(feature => {
        const clickable = canClick(feature);
        const d = getPrecomputedPath(feature.name, "marine") || (feature.shape.kind === "ellipse" ? projectEllipse(feature.shape.center, feature.shape.rx, feature.shape.ry, feature.shape.rotation || 0, projection, 48) : null);
        
        let fillColor = modeStyle.marine.fillColor;
        let strokeColor = modeStyle.marine.strokeColor;
        let strokeW = sw;

        if (showingResult && lastResult) {
          if (lastResult.correct && feature.name === currentFeatureName) { fillColor = "#2e7d32"; strokeColor = "#4caf50"; strokeW = sw * 2; }
          else if (!lastResult.correct && feature.name === lastResult.clickedName) { fillColor = "#7f1d1d"; strokeColor = "#ef4444"; strokeW = sw * 2; }
          else if (!lastResult.correct && feature.name === currentFeatureName) { fillColor = "#7c6300"; strokeColor = "#ffc107"; strokeW = sw * 2; }
        } else if (correctSet.has(feature.name)) { fillColor = "#1b5e20"; strokeColor = "#4caf50"; }
        else if (skippedSet.has(feature.name)) { fillColor = "#5c4800"; strokeColor = "#f59e0b"; }

        if (d) {
          return (
            <MemoizedFeatureShape key={feature.name} featureName={feature.name} d={d} fill={fillColor} stroke={strokeColor} strokeWidth={strokeW}
              cursor={clickable ? "pointer" : "default"} pointerEvents={clickable ? "all" : "none"} onFeatureClick={clickable ? onFeatureClick : undefined} strokeLinecap="round" strokeLinejoin="round"
            />
          );
        }
        if (feature.shape.kind === "marker") {
          const pt = projection(feature.shape.center);
          if (!pt) return null;
          return (
            <MemoizedFeatureShape key={feature.name} featureName={feature.name} cx={pt[0]} cy={pt[1]} r={Math.max(0.5, 6.5 / Math.pow(zoom, 0.4))} fill={fillColor} stroke={strokeColor} strokeWidth={0.5}
              cursor={clickable ? "pointer" : "default"} pointerEvents={clickable ? "all" : "none"} onFeatureClick={clickable ? onFeatureClick : undefined}
            />
          );
        }
        return null;
      })}
    </g>
  );
}

export function renderLandOverlay({ projection, zoom, isDesktop, lowDetailMode, modeStyleOverrides, landFeatures, getPrecomputedPath, canClick, onFeatureClick, showingResult, lastResult, currentFeatureName, correctSet, skippedSet }: LandOverlayArgs): JSX.Element | null {
  if (landFeatures.length === 0) return null;
  const modeStyle = resolveModeStyle(modeStyleOverrides);
  
  const orderedLandFeatures = [...landFeatures].sort((a, b) => {
    if ((a.shape.kind === "marker") !== (b.shape.kind === "marker")) return (a.shape.kind === "marker" ? 1 : 0) - (b.shape.kind === "marker" ? 1 : 0);
    return getFeatureArea(b) - getFeatureArea(a);
  });

  return (
    <g>
      {LITE_TOPOGRAPHY_DEFS}
      {orderedLandFeatures.map(feature => {
        const vis = getFeatureVisual(feature, currentFeatureName, showingResult, lastResult, correctSet, skippedSet);
        const clickable = canClick(feature);
        const handleClick = clickable ? onFeatureClick : undefined;
        const cursor = clickable ? "pointer" : "default";

        let d: string | null = null;
        if (feature.shape.kind === "path") d = getPrecomputedPath(feature.name, "river") || projectPath(feature.shape.points, projection);
        else if (feature.shape.kind === "polygon") d = getPrecomputedPath(feature.name, "lake") || projectPolygon(feature.shape.points, projection);
        else if (feature.shape.kind === "polygon_collection") d = projectPolygonCollection(feature.shape.polygons, projection);
        else if (feature.shape.kind === "ellipse") d = getPrecomputedPath(feature.name, "lake") || projectEllipse(feature.shape.center, feature.shape.rx, feature.shape.ry, feature.shape.rotation || 0, projection, 48);

        if (feature.shape.kind === "marker") {
          const pt = projection(feature.shape.center);
          if (!pt) return null;
          return <MemoizedFeatureShape key={feature.name} featureName={feature.name} cx={pt[0]} cy={pt[1]} r={Math.max(0.5, 5 / Math.pow(zoom, 0.4))} fill={vis.color} stroke="#fff" strokeWidth={0.5} cursor={cursor} pointerEvents={clickable ? "all" : "none"} onFeatureClick={handleClick} />;
        }

        if (!d) return null;

        if (feature.type === "river") {
          return (
            <g key={feature.name}>
              <MemoizedFeatureShape featureName={feature.name} d={d} fill="none" stroke="transparent" strokeWidth={scaleHitArea(modeStyle.river.hitStrokeWidth, zoom)} cursor={cursor} pointerEvents={clickable ? "stroke" : "none"} onFeatureClick={handleClick} strokeLinecap="round" strokeLinejoin="round" />
              <MemoizedFeatureShape featureName={feature.name} d={d} fill="none" stroke={SHARED_OUTLINE_COLOR} strokeWidth={scaleStroke(modeStyle.river.strokeWidth + 2, zoom)} cursor="default" pointerEvents="none" strokeLinecap="round" strokeLinejoin="round" />
              <MemoizedFeatureShape featureName={feature.name} d={d} fill="none" stroke={vis.color} strokeWidth={scaleStroke(modeStyle.river.strokeWidth, zoom)} cursor="default" pointerEvents="none" strokeOpacity={vis.opacity} strokeLinecap="round" strokeLinejoin="round" />
            </g>
          );
        }

        if (feature.type === "desert" || feature.type === "mountain_range") {
          const borderColor = feature.type === "desert" ? "rgba(64, 45, 24, 0.8)" : "rgba(56, 37, 27, 0.72)";
          const patternId = feature.type === "desert" ? LITE_DESERT_PATTERN_ID : LITE_MOUNTAIN_PATTERN_ID;
          return (
            <g key={feature.name}>
              <MemoizedFeatureShape featureName={feature.name} d={d} fill={vis.color} fillOpacity={Math.min(0.72, vis.fillOpacity + 0.12)} stroke={vis.color} strokeWidth={scaleStroke(1, zoom)} cursor={cursor} pointerEvents={clickable ? "all" : "none"} onFeatureClick={handleClick} strokeLinecap="round" strokeLinejoin="round" />
              {isDesktop && <path d={d} fill={`url(#${patternId})`} fillOpacity={0.2} style={{ pointerEvents: "none" }} />}
              <MemoizedFeatureShape featureName={feature.name} d={d} fill="none" stroke={borderColor} strokeWidth={scaleStroke(1.5, zoom)} cursor="default" pointerEvents="none" strokeOpacity={0.95} strokeLinecap="round" strokeLinejoin="round" />
            </g>
          );
        }

        return (
          <g key={feature.name}>
            <MemoizedFeatureShape featureName={feature.name} d={d} fill={vis.color} fillOpacity={vis.fillOpacity} stroke={SHARED_OUTLINE_COLOR} strokeWidth={scaleStroke(2.5, zoom)} cursor="default" pointerEvents="none" strokeLinecap="round" strokeLinejoin="round" />
            <MemoizedFeatureShape featureName={feature.name} d={d} fill={vis.color} fillOpacity={vis.fillOpacity} stroke={vis.color} strokeWidth={scaleStroke(1.5, zoom)} cursor={cursor} pointerEvents={clickable ? "all" : "none"} onFeatureClick={handleClick} strokeLinecap="round" strokeLinejoin="round" />
          </g>
        );
      })}
    </g>
  );
}
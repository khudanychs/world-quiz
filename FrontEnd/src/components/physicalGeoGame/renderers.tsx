import {
  FEATURE_COLORS,
  FEATURE_FILL_OPACITY,
  projectEllipse,
  projectPath,
  projectPolygon,
  type PhysicalFeature,
} from "../../utils/physicalFeatures";

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

const RIVER_STROKE_WIDTH = 2.45;
const RIVER_HIT_STROKE_WIDTH = 12;
const RIVER_OUTLINE_EXTRA = 1.35;
const RIVER_GLOW_EXTRA = 5;
const LAKE_FILL_BOOST = 0.12;
const LAKE_CORE_STROKE_WIDTH = 0.13;
const LAKE_OUTLINE_STROKE_WIDTH = 0.15;
const LAKE_GLOW_STROKE_WIDTH = 1.2;
const LAKE_OUTLINE_COLOR = "rgba(9, 43, 79, 0.6)";
const MARINE_FILL_COLOR = "#0f2a4a";
const MARINE_STROKE_COLOR = "rgba(148, 167, 190, 0.2)";
const MOUNTAIN_RANGE_BAND_WIDTH = 10;
const MOUNTAIN_RANGE_OUTLINE_WIDTH = 12;

const TOPO_PATTERN_ID = "phys-topography-pattern";
const TOPO_PATTERN_SIZE = 180;

function getTopographyOverlayOpacity(featureType: PhysicalFeature["type"]): number {
  if (featureType === "desert") {
    return 0.5;
  }
  if (featureType === "mountain_range") {
    return 0.5;
  }
  return 0;
}

function getLakeFillOpacity(fillOpacity: number): number {
  return Math.min(0.82, fillOpacity + LAKE_FILL_BOOST);
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
  pointerEvents: "all" | "none",
  onClick?: () => void,
): JSX.Element {
  const fillOpacity = feature.type === "lake" ? getLakeFillOpacity(vis.fillOpacity) : vis.fillOpacity;
  const strokeWidth = feature.type === "lake" ? LAKE_CORE_STROKE_WIDTH : 1.5;
  const strokeOpacity = feature.type === "lake" ? Math.min(1, vis.opacity * 0.95) : vis.opacity * 0.6;

  return (
    <g key={feature.name}>
      {feature.type === "lake" && (
        <path
          d={d}
          fill={vis.color}
          fillOpacity={fillOpacity}
          stroke={LAKE_OUTLINE_COLOR}
            strokeWidth={LAKE_OUTLINE_STROKE_WIDTH}
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
      {vis.glow && (
        <path
          d={d}
          fill="none"
          stroke={vis.color}
            strokeWidth={feature.type === "lake" ? LAKE_GLOW_STROKE_WIDTH : 3}
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
  withTexture: boolean,
  pointerEvents: "all" | "none",
  onClick?: () => void,
): JSX.Element {
  const overlayOpacity = withTexture ? getTopographyOverlayOpacity(feature.type) : 0;

  return (
    <g key={feature.name}>
      <path
        d={d}
        fill={vis.color}
        fillOpacity={Math.min(0.72, vis.fillOpacity + 0.12)}
        stroke={vis.color}
        strokeWidth={1.1}
        strokeOpacity={Math.min(1, vis.opacity * 0.9)}
        style={{ cursor: pointerEvents === "all" ? "pointer" : "default", pointerEvents }}
        onClick={onClick}
      />
      {withTexture && (
        <path
          d={d}
          fill={`url(#${TOPO_PATTERN_ID})`}
          fillOpacity={overlayOpacity}
          stroke="none"
          style={{ pointerEvents: "none" }}
        />
      )}
      {vis.glow && (
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

export function renderWaterUnderlay({
  projection,
  zoom,
  isDesktop,
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
  if (waterFeatures.length === 0) {
    return null;
  }

  const sw = Math.max(0.5, 1.2 / Math.pow(zoom, 0.5));
  const markerR = Math.max(isDesktop ? 5 : 2, (isDesktop ? 9 : 4) / Math.pow(zoom, 0.4));
  const interactiveNames = new Set(waterFeatures.map((feature) => feature.name.toLowerCase()));
  const backgroundNames = (backgroundMarineNames ?? []).filter((name) => !interactiveNames.has(name.toLowerCase()));

  return (
    <g shapeRendering="optimizeSpeed">
      {backgroundNames.map((featureName) => {
        const d = getPrecomputedPath(featureName, "marine");
        if (!d) {
          return null;
        }

        return (
          <path
            key={`bg-${featureName}`}
            d={d}
            fill={MARINE_FILL_COLOR}
            stroke={MARINE_STROKE_COLOR}
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

        let fillColor = MARINE_FILL_COLOR;
        let strokeColor = MARINE_STROKE_COLOR;
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
}

export function renderLandOverlay({
  projection,
  zoom,
  isDesktop,
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
  if (landFeatures.length === 0) {
    return null;
  }

  const usesTopography = landFeatures.some(
    (feature) => feature.type === "desert" || feature.type === "mountain_range",
  );
  
  const shouldTextureFeature = true;

  return (
    <g>
      {usesTopography && (
        <defs>
          <pattern id={TOPO_PATTERN_ID} patternUnits="userSpaceOnUse" width={TOPO_PATTERN_SIZE} height={TOPO_PATTERN_SIZE}>
            <image
              href="/topography.svg"
              x={0}
              y={0}
              width={TOPO_PATTERN_SIZE}
              height={TOPO_PATTERN_SIZE}
              preserveAspectRatio="xMidYMid slice"
            />
          </pattern>
        </defs>
      )}
      {landFeatures.map((feature) => {
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
                  r={r * 2}
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
            let d = feature.type === "river" ? getPrecomputedPath(feature.name, "river") : null;
            if (!d) {
              d = projectPath(feature.shape.points, projection);
            }
            if (!d) {
              return null;
            }

            if (feature.type === "mountain_range") {
              const withTexture = shouldTextureFeature;
              return (
                <g key={feature.name}>
                  <path
                    d={d}
                    fill="none"
                    stroke="transparent"
                    strokeWidth={Math.max(RIVER_HIT_STROKE_WIDTH, MOUNTAIN_RANGE_OUTLINE_WIDTH + 4)}
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
                    strokeWidth={MOUNTAIN_RANGE_BAND_WIDTH}
                    strokeOpacity={Math.min(0.85, vis.opacity)}
                    vectorEffect="non-scaling-stroke"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    style={{ pointerEvents: "none" }}
                  />
                  {withTexture && (
                    <path
                      d={d}
                      fill="none"
                      stroke={`url(#${TOPO_PATTERN_ID})`}
                      strokeWidth={MOUNTAIN_RANGE_BAND_WIDTH - 1.2}
                      strokeOpacity={getTopographyOverlayOpacity("mountain_range")}
                      vectorEffect="non-scaling-stroke"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      style={{ pointerEvents: "none" }}
                    />
                  )}
                  <path
                    d={d}
                    fill="none"
                    stroke="rgba(56, 37, 27, 0.55)"
                    strokeWidth={MOUNTAIN_RANGE_OUTLINE_WIDTH}
                    vectorEffect="non-scaling-stroke"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    style={{ pointerEvents: "none" }}
                  />
                  {vis.glow && (
                    <path
                      d={d}
                      fill="none"
                      stroke={vis.color}
                      strokeWidth={MOUNTAIN_RANGE_OUTLINE_WIDTH + 2}
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

            const strokeWidth = feature.type === "river" ? RIVER_STROKE_WIDTH : 3.5;
            return (
              <g key={feature.name}>
                <path
                  d={d}
                  fill="none"
                  stroke="transparent"
                  strokeWidth={RIVER_HIT_STROKE_WIDTH}
                  vectorEffect="non-scaling-stroke"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  style={{ cursor, pointerEvents: clickable ? "stroke" : "none" }}
                  onClick={handleClick}
                />
                {feature.type === "river" && (
                  <path
                    d={d}
                    fill="none"
                    stroke="rgba(6, 23, 37, 0.45)"
                    strokeWidth={strokeWidth + RIVER_OUTLINE_EXTRA}
                    vectorEffect="non-scaling-stroke"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    style={{ pointerEvents: "none" }}
                  />
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
                  style={{ pointerEvents: "none" }}
                />
                {vis.glow && (
                  <path
                    d={d}
                    fill="none"
                    stroke={vis.color}
                    strokeWidth={strokeWidth + RIVER_GLOW_EXTRA}
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
                shouldTextureFeature,
                pointerEvents,
                handleClick,
              );
            }

            const pointerEvents = feature.type === "lake" ? "all" : clickable ? "all" : "none";
            return renderLakeLayerStack(feature, d, vis, pointerEvents, handleClick);
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

            if (feature.type === "desert") {
              return renderTopographyAreaStack(
                feature,
                d,
                vis,
                shouldTextureFeature,
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
                {renderLakeLayerStack(feature, d, vis, "all", handleClick)}
              </g>
            );
          }

          default:
            return null;
        }
      })}
    </g>
  );
}
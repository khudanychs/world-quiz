// Shared interactive map component used by both WorldMap and FlagMatchGame
import { memo, useRef, useEffect, useCallback, useMemo } from "react";
import { ComposableMap, Geographies, Geography, ZoomableGroup } from "react-simple-maps";
import { geoNaturalEarth1 } from "d3-geo";
import { useTranslation } from 'react-i18next';
import { normalizeCountryName, isClickableInGameMode, isHiddenTerritory } from "../utils/countries";
import { getLocalizedName } from "../utils/i18nUtils";
import { SMALL_ISLAND_MARKERS } from "../utils/markerPositions";

const PROJECTION = "geoNaturalEarth1" as const;
const DEFAULT_GEO_URL = "/countries-110m.json";
const HOVER_THROTTLE_MS = 33;

/* ============================================================================
   MARKER CONFIGURATION - Edit these values to customize marker appearance
   ============================================================================ */

// Desktop marker settings (screens >= 900px)
const DESKTOP_MARKER = {
  baseRadius: 8,      // Starting size at zoom=1 (fully zoomed out)
  minRadius: 4,       // Smallest allowed size
  zoomExponent: 0.4,  // How fast markers shrink when zooming (lower = slower)
  strokeColor: "#2d3748",
  baseStrokeWidth: 1.1,
  minStrokeWidth: 0.6,
  strokeZoomExponent: 0.6,
};

// Mobile marker settings (screens < 900px)
const MOBILE_MARKER = {
  baseRadius: 3.5,  // Starting size at zoom=1
  minRadius: 1.5,   // Smallest allowed size (smaller for easier selection of tiny islands)
  zoomExponent: 0.5,  // Shrinks faster than desktop
  strokeColor: "#2d3748",
  baseStrokeWidth: 0.8,
  minStrokeWidth: 0.3,
  strokeZoomExponent: 0.5,
};

// Zoom limits
const ZOOM_CONFIG = {
  minZoom: 0.9,
  maxZoom: 50,
};

/* ============================================================================ */

/** Check if a country has a custom marker */
const SMALL_ISLAND_MARKER_NAME_SET = new Set(
  Object.keys(SMALL_ISLAND_MARKERS).map((markerName) => normalizeCountryName(markerName))
);

function hasCustomMarker(countryName: string): boolean {
  return SMALL_ISLAND_MARKER_NAME_SET.has(normalizeCountryName(countryName));
}

/**
 * Calculate adaptive marker radius based on zoom level and screen size
 * Formula: max(minRadius, baseRadius / zoom^exponent)
 */
function getMarkerRadius(zoom: number, isDesktop: boolean, sizeMultiplier: number): number {
  const config = isDesktop ? DESKTOP_MARKER : MOBILE_MARKER;
  return Math.max(
    config.minRadius * sizeMultiplier,
    (config.baseRadius / Math.pow(zoom, config.zoomExponent)) * sizeMultiplier
  );
}

/**
 * Calculate adaptive stroke width based on zoom level and screen size
 * Formula: max(minStrokeWidth, baseStrokeWidth / zoom^exponent)
 */
function getMarkerStrokeWidth(zoom: number, isDesktop: boolean, sizeMultiplier: number): number {
  const config = isDesktop ? DESKTOP_MARKER : MOBILE_MARKER;
  return Math.max(
    config.minStrokeWidth * sizeMultiplier,
    (config.baseStrokeWidth / Math.pow(zoom, config.strokeZoomExponent)) * sizeMultiplier
  );
}

/** Get stroke color based on device type */
function getMarkerStrokeColor(isDesktop: boolean): string {
  const config = isDesktop ? DESKTOP_MARKER : MOBILE_MARKER;
  return config.strokeColor;
}

type RSMGeography = {
  rsmKey: string;
  properties?: { name?: string; [k: string]: unknown };
  [k: string]: unknown;
};

type GeographiesArgs = { geographies: RSMGeography[] };

interface InteractiveMapProps {
  width: number;
  height: number;
  scale: number;
  center?: [number, number];
  zoom: number;
  coordinates: [number, number];
  onMoveEnd?: (position: { zoom: number; coordinates: [number, number] }) => void;
  onCountryClick?: (countryName: string) => void;
  onCountryHover?: (countryName: string | null) => void;
  getCountryFill?: (countryName: string) => string;
  selectedCountry?: string | null;
  onGeographiesLoaded?: (geographies: RSMGeography[]) => void;
  isDesktop?: boolean;
  /** When true, unclickable game territories will have visual cues (no pointer cursor) */
  gameMode?: boolean;
  /** Optional additional interactivity gate for countries (e.g. region practice mode). */
  isCountryInteractive?: (countryName: string) => boolean;
  /** When true, render map with no country borders and uniform land fill */
  borderless?: boolean;
  /** Pre-projected SVG path string for unified land background (D3 geoPath output). */
  geoLandPath?: string | null;
  /** Custom TopoJSON URL or pre-fetched topology object */
  geoUrl?: string | object;
  /** Render SVG BEFORE land geographies (water features that should be masked by land) */
  renderUnderlay?: (projection: (coords: [number, number]) => [number, number] | null, zoom: number, isDesktop: boolean) => React.ReactNode;
  /** If false, underlay is always non-interactive and excluded from pointer hit-testing. */
  underlayInteractive?: boolean;
  /** Render SVG AFTER land geographies (mountains, rivers, etc. drawn on top) */
  renderOverlay?: (projection: (coords: [number, number]) => [number, number] | null, zoom: number, isDesktop: boolean) => React.ReactNode;
  /** If false, overlay is always non-interactive and excluded from pointer hit-testing. */
  overlayInteractive?: boolean;
  /** Disable built-in geography rendering and loading when custom overlays are sufficient */
  renderGeographies?: boolean;
  /** Optional marker size multiplier for tiny-island dots. */
  markerSizeMultiplier?: number;
}

export default memo(function InteractiveMap({
  width,
  height,
  scale,
  center = [0, 15],
  zoom,
  coordinates,
  onMoveEnd,
  onCountryClick,
  onCountryHover,
  getCountryFill,
  selectedCountry,
  onGeographiesLoaded,
  isDesktop = true,
  gameMode = false,
  isCountryInteractive,
  borderless = false,
  geoLandPath,
  geoUrl: customGeoUrl,
  renderUnderlay,
  underlayInteractive = false,
  renderOverlay,
  overlayInteractive = false,
  renderGeographies = true,
  markerSizeMultiplier = 1,
}: InteractiveMapProps) {
  const { i18n } = useTranslation();
  const currentLanguage = i18n.language.split('-')[0];
  const geoUrl = customGeoUrl ?? DEFAULT_GEO_URL;
  
  // Track if we've already notified parent about geographies
  const hasNotifiedRef = useRef(false);
  const hoverTimerRef = useRef<number | null>(null);
  const pendingHoverRef = useRef<string | null>(null);
  const lastHoverEmittedRef = useRef<string | null>(null);
  
  // Create projection function for coordinate transformation
  const projection = useMemo(
    () =>
      geoNaturalEarth1()
        .scale(scale)
        .translate([width / 2, height / 2])
        .center(center),
    [scale, width, height, center]
  );

  useEffect(() => {
    return () => {
      if (hoverTimerRef.current !== null) {
        window.clearTimeout(hoverTimerRef.current);
      }
    };
  }, []);

  const emitHover = useCallback(
    (nameRaw: string | null) => {
      if (!onCountryHover) return;
      if (lastHoverEmittedRef.current === nameRaw) return;
      lastHoverEmittedRef.current = nameRaw;
      onCountryHover(nameRaw);
    },
    [onCountryHover]
  );

  const handleCountryClick = useCallback((nameRaw: string) => {
    // Clear pending hover first to avoid stale hover labels on click.
    pendingHoverRef.current = null;
    if (hoverTimerRef.current !== null) {
      window.clearTimeout(hoverTimerRef.current);
      hoverTimerRef.current = null;
    }
    emitHover(null);

    if (onCountryClick) {
      onCountryClick(nameRaw);
    }
  }, [emitHover, onCountryClick]);

  const handleCountryHover = useCallback((nameRaw: string | null) => {
    if (!onCountryHover) return;

    if (nameRaw === null) {
      pendingHoverRef.current = null;
      if (hoverTimerRef.current !== null) {
        window.clearTimeout(hoverTimerRef.current);
        hoverTimerRef.current = null;
      }
      emitHover(null);
      return;
    }

    pendingHoverRef.current = nameRaw;
    if (hoverTimerRef.current !== null) {
      return;
    }

    hoverTimerRef.current = window.setTimeout(() => {
      hoverTimerRef.current = null;
      emitHover(pendingHoverRef.current);
    }, HOVER_THROTTLE_MS);
  }, [emitHover, onCountryHover]);



  return (
    <ComposableMap
      projection={PROJECTION}
      projectionConfig={{ scale, center }}
      width={width}
      height={height}
      style={{ width, height, display: "block", willChange: "transform", transform: "translateZ(0)" }}
    >
      <ZoomableGroup
        center={coordinates}
        zoom={zoom}
        minZoom={ZOOM_CONFIG.minZoom}
        maxZoom={ZOOM_CONFIG.maxZoom}
        onMoveEnd={onMoveEnd}
      >
        {/* Water feature underlays — rendered BEFORE land so land masks them */}
        {renderUnderlay && (
          <g style={{ pointerEvents: underlayInteractive ? "all" : "none" }}>
            {renderUnderlay(projection, zoom, isDesktop)}
          </g>
        )}

        {geoLandPath && (
          <path
            d={geoLandPath}
            fill="#d4cab0"
            stroke="#d4cab0"
            strokeWidth={0.5}
            strokeLinejoin="round"
            paintOrder="stroke"
            pointerEvents="visibleFill"
            shapeRendering="optimizeSpeed"
          />
        )}

        {renderGeographies && (
        <Geographies geography={geoUrl}>
          {({ geographies }: GeographiesArgs) => {
            // Notify parent about loaded geographies (only once)
            if (onGeographiesLoaded && geographies.length > 0 && !hasNotifiedRef.current) {
              hasNotifiedRef.current = true;
              // Use setTimeout to avoid calling during render
              setTimeout(() => onGeographiesLoaded(geographies as RSMGeography[]), 0);
            }

            return geographies.map((geo: RSMGeography) => {
                const canonicalNameRaw = getLocalizedName(
                  geo.properties || {},
                  'en',
                  'name'
                );

                // Display localized name if available (e.g. name_cs, name_de), fall back to name
                const displayNameRaw = getLocalizedName(
                  geo.properties || {},
                  currentLanguage,
                  'name'
                );
                const canonicalName = normalizeCountryName(canonicalNameRaw);
                const displayName = normalizeCountryName(displayNameRaw);

                // Completely hide certain territories
                if (isHiddenTerritory(canonicalNameRaw)) {
                  return null;
                }

                const isSelected = selectedCountry === canonicalName;

                // Hide marker-backed tiny countries only when marker circles are rendered.
                // In borderless mode markers are disabled, so keep these countries visible.
                const hideForMarker = !borderless && hasCustomMarker(canonicalNameRaw);

                // In game mode, check if territory should be unclickable
                const isUnclickableInGame = gameMode && !isClickableInGameMode(canonicalNameRaw);

                const blockedByRegion = !!isCountryInteractive && !isCountryInteractive(canonicalNameRaw);

                // Determine if this geography should not be interactive
                const notInteractive = hideForMarker || isUnclickableInGame || blockedByRegion;
                const disabledCursor = blockedByRegion ? "not-allowed" : "default";

                const strokeColor = "#2d3748";
                const strokeW = 0.65;

                // Get fill color
                const fill = getCountryFill
                    ? getCountryFill(canonicalName)
                    : isSelected
                      ? "#3b82f6"
                      : "#d4cab0";

                const displayFill = hideForMarker ? "transparent" : fill;

                // Borderless style: completely inert land shapes with no visible
                // borders and no hover/pressed changes at all.  A fill-colored
                // stroke painted BEHIND the fill (paintOrder) seals the
                // anti-aliasing gaps between adjacent country polygons.
                if (borderless) {
                  const bStyle = {
                    fill: displayFill,
                    stroke: displayFill,
                    strokeWidth: 1,
                    strokeLinejoin: "round" as const,
                    strokeLinecap: "round" as const,
                    paintOrder: "stroke",
                    outline: "none",
                    cursor: "crosshair",
                    // visibleFill (not "none") so the land blocks expensive SVG
                    // hit-testing on the complex marine polygon paths underneath.
                    pointerEvents: "visibleFill" as const,
                  };
                  return (
                    <Geography
                      key={geo.rsmKey}
                      geography={geo}
                      vectorEffect="non-scaling-stroke"
                      fillRule="evenodd"
                      clipRule="evenodd"
                      shapeRendering="geometricPrecision"
                      style={{ default: bStyle, hover: bStyle, pressed: bStyle }}
                    />
                  );
                }

                return (
                  <Geography
                    key={geo.rsmKey}
                    geography={geo}
                    vectorEffect="non-scaling-stroke"
                    fillRule="evenodd"
                    clipRule="evenodd"
                    shapeRendering="geometricPrecision"
                    style={{
                      default: {
                        fill: displayFill,
                        stroke: hideForMarker ? "transparent" : strokeColor,
                        strokeWidth: strokeW,
                        strokeLinejoin: "round",
                        strokeLinecap: "round",
                        outline: "none",
                        transition: "fill 0.15s ease-out",
                        cursor: notInteractive ? disabledCursor : "pointer",
                        pointerEvents: hideForMarker ? "none" : "visibleFill",
                      },
                      hover: !notInteractive
                        ? {
                            fill: displayFill,
                            stroke: strokeColor,
                            strokeWidth: strokeW,
                            outline: "none",
                            cursor: "pointer",
                            pointerEvents: "visibleFill",
                            transition: "fill 0.15s ease-out",
                            filter: "brightness(1.1)",
                          }
                        : {
                            fill: displayFill,
                            cursor: disabledCursor,
                            outline: "none",
                            pointerEvents: "visibleFill",
                          },
                      pressed: !notInteractive
                        ? {
                            fill: fill,
                            stroke: strokeColor,
                            strokeWidth: strokeW,
                            outline: "none",
                            cursor: "pointer",
                            pointerEvents: "visibleFill",
                            transition: "fill 0.05s ease-out",
                          }
                        : {
                            fill: displayFill,
                            cursor: disabledCursor,
                            outline: "none",
                            pointerEvents: "visibleFill",
                          },
                    }}
                    onMouseEnter={!hideForMarker ? () => handleCountryHover(displayName) : undefined}
                    onMouseLeave={!hideForMarker ? () => handleCountryHover(null) : undefined}
                    onClick={!notInteractive ? () => handleCountryClick(canonicalName) : undefined}
                  />
                );
              });
          }}
        </Geographies>
        )}
        
        {/* Visual markers for very small island nations (hidden in borderless mode) */}
        {!borderless && Object.entries(SMALL_ISLAND_MARKERS).map(([countryName, [lon, lat]]) => {
          const norm = normalizeCountryName(countryName);
          const isSelected = selectedCountry === norm;
          
          const fill = getCountryFill 
            ? getCountryFill(norm)
            : isSelected 
              ? "#3b82f6" 
              : "#e0d8c2";

          const blockedByRegion = !!isCountryInteractive && !isCountryInteractive(countryName);
          const isUnclickableInGame = gameMode && !isClickableInGameMode(countryName);
          const markerInteractive = !blockedByRegion && !isUnclickableInGame;
          
          // Project the coordinates to screen space
          const projected = projection([lon, lat]);
          if (!projected) return null;
          
          const [x, y] = projected;
          
          return (
            <circle
              key={`marker-${countryName}`}
              cx={x}
              cy={y}
              r={getMarkerRadius(zoom, isDesktop, markerSizeMultiplier)}
              fill={fill}
              stroke={getMarkerStrokeColor(isDesktop)}
              strokeWidth={getMarkerStrokeWidth(zoom, isDesktop, markerSizeMultiplier)}
              style={{
                cursor: markerInteractive ? "pointer" : (blockedByRegion ? "not-allowed" : "default"),
                transition: "none",
              }}
              onMouseEnter={() => handleCountryHover(norm)}
              onMouseLeave={() => handleCountryHover(null)}
              onClick={markerInteractive ? () => handleCountryClick(countryName) : undefined}
            />
          );
        })}

        {/* Physical geography feature overlays */}
        {renderOverlay && (
          <g style={{ pointerEvents: overlayInteractive ? "all" : "none" }}>
            {renderOverlay(projection, zoom, isDesktop)}
          </g>
        )}
      </ZoomableGroup>
    </ComposableMap>
  );
});

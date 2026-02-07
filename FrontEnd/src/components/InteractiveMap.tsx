// Shared interactive map component used by both WorldMap and FlagMatchGame
import { memo, useRef, useEffect } from "react";
import { ComposableMap, Geographies, Geography, ZoomableGroup } from "react-simple-maps";
import { geoNaturalEarth1 } from "d3-geo";
import { normalizeCountryName, isClickableInGameMode, isHiddenTerritory } from "../utils/countries";
import { SMALL_ISLAND_MARKERS } from "../utils/markerPositions";

const PROJECTION = "geoNaturalEarth1" as const;
const DEFAULT_GEO_URL = "/countries-110m.json";

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
  baseRadius: 4,    // Starting size at zoom=1
  minRadius: 2.5,     // Smallest allowed size  
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
function hasCustomMarker(countryName: string): boolean {
  const normalized = normalizeCountryName(countryName);
  return Object.keys(SMALL_ISLAND_MARKERS).some(
    markerName => normalizeCountryName(markerName) === normalized
  );
}

/**
 * Calculate adaptive marker radius based on zoom level and screen size
 * Formula: max(minRadius, baseRadius / zoom^exponent)
 */
function getMarkerRadius(zoom: number, isDesktop: boolean): number {
  const config = isDesktop ? DESKTOP_MARKER : MOBILE_MARKER;
  return Math.max(
    config.minRadius,
    config.baseRadius / Math.pow(zoom, config.zoomExponent)
  );
}

/**
 * Calculate adaptive stroke width based on zoom level and screen size
 * Formula: max(minStrokeWidth, baseStrokeWidth / zoom^exponent)
 */
function getMarkerStrokeWidth(zoom: number, isDesktop: boolean): number {
  const config = isDesktop ? DESKTOP_MARKER : MOBILE_MARKER;
  return Math.max(
    config.minStrokeWidth,
    config.baseStrokeWidth / Math.pow(zoom, config.strokeZoomExponent)
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
  /** When true, render map with no country borders and uniform land fill */
  borderless?: boolean;
  /** Custom TopoJSON URL (e.g. higher-res map) */
  geoUrl?: string;
  /** Render SVG BEFORE land geographies (water features that should be masked by land) */
  renderUnderlay?: (projection: (coords: [number, number]) => [number, number] | null, zoom: number, isDesktop: boolean) => React.ReactNode;
  /** Render SVG AFTER land geographies (mountains, rivers, etc. drawn on top) */
  renderOverlay?: (projection: (coords: [number, number]) => [number, number] | null, zoom: number, isDesktop: boolean) => React.ReactNode;
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
  borderless = false,
  geoUrl: customGeoUrl,
  renderUnderlay,
  renderOverlay,
}: InteractiveMapProps) {
  const geoUrl = customGeoUrl ?? DEFAULT_GEO_URL;
  
  // Track if we've already notified parent about geographies
  const hasNotifiedRef = useRef(false);
  
  // Create projection function for coordinate transformation
  const projection = geoNaturalEarth1()
    .scale(scale)
    .translate([width / 2, height / 2])
    .center(center);

  const handleCountryClick = (nameRaw: string) => {
    if (onCountryClick) {
      onCountryClick(nameRaw);
    }
  };

  const handleCountryHover = (nameRaw: string | null) => {
    if (onCountryHover) {
      onCountryHover(nameRaw);
    }
  };



  return (
    <ComposableMap
      projection={PROJECTION}
      projectionConfig={{ scale, center }}
      width={width}
      height={height}
      style={{ width, height, display: "block" }}
    >
      <ZoomableGroup
        center={coordinates}
        zoom={zoom}
        minZoom={ZOOM_CONFIG.minZoom}
        maxZoom={ZOOM_CONFIG.maxZoom}
        onMoveEnd={onMoveEnd}
      >
        {/* Water feature underlays — rendered BEFORE land so land masks them */}
        {renderUnderlay && renderUnderlay(projection, zoom, isDesktop)}

        <Geographies geography={geoUrl}>
          {({ geographies }: GeographiesArgs) => {
            // Notify parent about loaded geographies (only once)
            if (onGeographiesLoaded && geographies.length > 0 && !hasNotifiedRef.current) {
              hasNotifiedRef.current = true;
              // Use setTimeout to avoid calling during render
              setTimeout(() => onGeographiesLoaded(geographies as RSMGeography[]), 0);
            }

            return geographies.map((geo: RSMGeography) => {
              const nameRaw = (geo.properties?.name as string) ?? "Unknown";
              const name = normalizeCountryName(nameRaw);
              
              // Completely hide certain territories
              if (isHiddenTerritory(nameRaw)) {
                return null;
              }
              
              const isSelected = selectedCountry === name;

              // Hide countries that have custom markers
              const hideForMarker = hasCustomMarker(nameRaw);
              
              // In game mode, check if territory should be unclickable
              const isUnclickableInGame = gameMode && !isClickableInGameMode(nameRaw);
              
              // Determine if this geography should not be interactive
              const notInteractive = hideForMarker || isUnclickableInGame || borderless;

              // Borderless mode: uniform land color, fully invisible borders
              const landFill = borderless ? "#c4b99a" : undefined;
              const strokeColor = borderless ? "transparent" : "#2d3748";
              const strokeW = borderless ? 0 : 0.65;

              // Get fill color
              const fill = borderless
                ? (landFill!)
                : getCountryFill 
                  ? getCountryFill(name)
                  : isSelected 
                    ? "#3b82f6" 
                    : "#e0d8c2";
              
              const displayFill = hideForMarker ? "transparent" : fill;

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
                      cursor: borderless ? "crosshair" : (notInteractive ? "default" : "pointer"),
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
                          cursor: borderless ? "crosshair" : "default",
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
                          cursor: borderless ? "crosshair" : "default",
                          outline: "none",
                          pointerEvents: "visibleFill",
                        },
                  }}
                  onMouseEnter={(!hideForMarker && !borderless) ? () => handleCountryHover(name) : undefined}
                  onMouseLeave={(!hideForMarker && !borderless) ? () => handleCountryHover(null) : undefined}
                  onClick={(!hideForMarker && !borderless) ? () => handleCountryClick(name) : undefined}
                />
              );
            });
          }}
        </Geographies>
        
        {/* Visual markers for very small island nations (hidden in borderless mode) */}
        {!borderless && Object.entries(SMALL_ISLAND_MARKERS).map(([countryName, [lon, lat]]) => {
          const norm = normalizeCountryName(countryName);
          const isSelected = selectedCountry === norm;
          
          const fill = getCountryFill 
            ? getCountryFill(norm)
            : isSelected 
              ? "#3b82f6" 
              : "#e0d8c2";
          
          // Project the coordinates to screen space
          const projected = projection([lon, lat]);
          if (!projected) return null;
          
          const [x, y] = projected;
          
          return (
            <circle
              key={`marker-${countryName}`}
              cx={x}
              cy={y}
              r={getMarkerRadius(zoom, isDesktop)}
              fill={fill}
              stroke={getMarkerStrokeColor(isDesktop)}
              strokeWidth={getMarkerStrokeWidth(zoom, isDesktop)}
              style={{
                cursor: "pointer",
                transition: "none",
              }}
              onMouseEnter={() => handleCountryHover(norm)}
              onMouseLeave={() => handleCountryHover(null)}
              onClick={() => handleCountryClick(countryName)}
            />
          );
        })}

        {/* Physical geography feature overlays */}
        {renderOverlay && renderOverlay(projection, zoom, isDesktop)}
      </ZoomableGroup>
    </ComposableMap>
  );
});

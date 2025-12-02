// Shared interactive map component used by both WorldMap and FlagMatchGame
import { ComposableMap, Geographies, Geography, ZoomableGroup } from "react-simple-maps";
import { geoNaturalEarth1 } from "d3-geo";
import { normalizeCountryName } from "../utils/countries";
import { SMALL_ISLAND_MARKERS } from "../utils/markerPositions";

const PROJECTION = "geoNaturalEarth1" as const;
const geoUrl = "/countries-110m.json";

/* ============================================================================
   MARKER CONFIGURATION - Edit these values to customize marker appearance
   ============================================================================ */

// Desktop marker settings (screens >= 768px)
const DESKTOP_MARKER = {
  baseRadius: 8,      // Starting size at zoom=1 (fully zoomed out)
  minRadius: 4,       // Smallest allowed size
  zoomExponent: 0.4,  // How fast markers shrink when zooming (lower = slower)
  strokeColor: "#2d3748",
  baseStrokeWidth: 1.2,
  minStrokeWidth: 0.5,
  strokeZoomExponent: 0.6,
};

// Mobile marker settings (screens < 768px)
const MOBILE_MARKER = {
  baseRadius: 2.5,    // Starting size at zoom=1
  minRadius: 1.2,     // Smallest allowed size  
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

/** Territories to completely hide from the map */
const HIDDEN_TERRITORIES = new Set([
  "Fr. S. Antarctic Lands",
  "French Southern Territories",
]);

/** Check if a territory should be completely hidden */
function isHiddenTerritory(nameRaw: string): boolean {
  return HIDDEN_TERRITORIES.has(nameRaw) || HIDDEN_TERRITORIES.has(normalizeCountryName(nameRaw));
}

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
}

export default function InteractiveMap({
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
}: InteractiveMapProps) {
  
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
        <Geographies geography={geoUrl}>
          {({ geographies }: GeographiesArgs) => {
            // Notify parent about loaded geographies
            if (onGeographiesLoaded && geographies.length > 0) {
              onGeographiesLoaded(geographies as any);
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

              // Get fill color
              const fill = getCountryFill 
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
                      stroke: hideForMarker ? "transparent" : "#2d3748",
                      strokeWidth: 0.65,
                      strokeLinejoin: "round",
                      strokeLinecap: "round",
                      outline: "none",
                      transition: "fill 0.15s ease-out",
                      cursor: hideForMarker ? "default" : "pointer",
                      pointerEvents: hideForMarker ? "none" : "visibleFill",
                    },
                    hover: !hideForMarker
                      ? {
                          fill: displayFill,
                          stroke: "#2d3748",
                          strokeWidth: 0.65,
                          outline: "none",
                          cursor: "pointer",
                          pointerEvents: "visibleFill",
                          transition: "fill 0.15s ease-out",
                          filter: "brightness(1.1)",
                        }
                      : {
                          fill: displayFill,
                          cursor: "default",
                          outline: "none",
                        },
                    pressed: !hideForMarker
                      ? {
                          fill: fill,
                          stroke: "#2d3748",
                          strokeWidth: 0.65,
                          outline: "none",
                          cursor: "pointer",
                          pointerEvents: "visibleFill",
                          transition: "fill 0.05s ease-out",
                        }
                      : {
                          fill: displayFill,
                          cursor: "default",
                          outline: "none",
                        },
                  }}
                  onMouseEnter={!hideForMarker ? () => handleCountryHover(name) : undefined}
                  onMouseLeave={!hideForMarker ? () => handleCountryHover(null) : undefined}
                  onClick={!hideForMarker ? () => handleCountryClick(name) : undefined}
                />
              );
            });
          }}
        </Geographies>
        
        {/* Visual markers for very small island nations */}
        {Object.entries(SMALL_ISLAND_MARKERS).map(([countryName, [lon, lat]]) => {
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
      </ZoomableGroup>
    </ComposableMap>
  );
}

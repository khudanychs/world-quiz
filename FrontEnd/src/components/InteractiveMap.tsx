// Shared interactive map component used by both WorldMap and FlagMatchGame
import { ComposableMap, Geographies, Geography, ZoomableGroup } from "react-simple-maps";
import { geoNaturalEarth1 } from "d3-geo";
import { normalizeCountryName } from "../utils/countries";
import { SMALL_ISLAND_MARKERS, TERRITORY_MARKERS } from "../utils/markerPositions";

const PROJECTION = "geoNaturalEarth1" as const;
const geoUrl = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

/** Check if a country has a custom marker */
function hasCustomMarker(countryName: string): boolean {
  const normalized = normalizeCountryName(countryName);
  const inSmallIslands = Object.keys(SMALL_ISLAND_MARKERS).some(
    markerName => normalizeCountryName(markerName) === normalized
  );
  const inTerritories = Object.keys(TERRITORY_MARKERS).some(
    markerName => normalizeCountryName(markerName) === normalized
  );
  return inSmallIslands || inTerritories;
}

/** Calculate adaptive marker radius based on zoom level and screen size */
function getMarkerRadius(zoom: number, isDesktop: boolean = true): number {
  // Desktop: larger markers (base 5), Mobile: smaller markers (base 3)
  const baseRadius = isDesktop ? 5 : 3;
  return Math.max(isDesktop ? 2.5 : 1.5, baseRadius / Math.sqrt(zoom));
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
        minZoom={0.9}
        maxZoom={12}
        zoomSensitivity={0.2}
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
                  onClick={!hideForMarker ? () => handleCountryClick(nameRaw) : undefined}
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
              stroke="#8B8A85"
              strokeWidth={0.8 / Math.sqrt(zoom)}
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
        
        {/* Territory markers */}
        {Object.entries(TERRITORY_MARKERS).map(([countryName, [lon, lat]]) => {
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
              key={`territory-marker-${countryName}`}
              cx={x}
              cy={y}
              r={getMarkerRadius(zoom, isDesktop)}
              fill={fill}
              stroke="#8B8A85"
              strokeWidth={0.8 / Math.sqrt(zoom)}
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

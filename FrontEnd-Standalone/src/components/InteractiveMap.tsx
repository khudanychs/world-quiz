// Shared interactive map component used by both WorldMap and FlagMatchGame
import { ComposableMap, Geographies, Geography, ZoomableGroup } from "react-simple-maps";
import { geoNaturalEarth1 } from "d3-geo";
import { normalizeCountryName } from "../utils/countries";

const PROJECTION = "geoNaturalEarth1" as const;
  const geoUrl = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";/** Coordinates for small island nations that need visual markers (lon, lat) */
const SMALL_ISLAND_MARKERS: Record<string, [number, number]> = {
  // Europe - UN Members + Vatican
  "Vatican City": [12.45, 41.9],
  "Monaco": [7.42, 43.73],
  "San Marino": [12.45, 43.94],
  "Liechtenstein": [9.55, 47.14],
  
  // Caribbean - UN Members only
  "Saint Lucia": [-60.98, 13.9],
  "Grenada": [-61.68, 12.1],
  "Saint Vincent and the Grenadines": [-61.2, 13.25],
  "Antigua and Barbuda": [-61.8, 17.1],
  "Dominica": [-61.37, 15.4],
  "Saint Kitts and Nevis": [-62.7, 17.3],
  "Barbados": [-59.5, 13.2],
  
  // Pacific Islands - UN Members only
  "Tonga": [-175.2, -21.2],
  "Samoa": [-172.1, -13.8],
  "Tuvalu": [179.2, -8.5],
  "Nauru": [166.9, -0.5],
  "Palau": [134.5, 7.5],
  "Marshall Islands": [171.2, 7.1],
  "Kiribati": [-157.4, 1.9],
  "Micronesia": [158.2, 6.9],
  
  // Indian Ocean - UN Members only
  "Maldives": [73.5, 3.2],
  "Seychelles": [55.5, -4.7],
  "Comoros": [43.9, -11.9],
  "Mauritius": [57.5, -20.3],
  
  // Africa - UN Members only
  "São Tomé and Príncipe": [6.6, 0.2],
  
  // Middle East - UN Members only
  "Bahrain": [50.6, 26.1],
  "Palestine": [35.2, 31.9],
};

/** 
 * Territories (non-UN members) that can appear with markers
 */
const TERRITORY_MARKERS: Record<string, [number, number]> = {
  // New Zealand territories
  "Cook Islands": [-159.8, -21.2],
  "Niue": [-169.9, -19.1],
};

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
                      stroke: hideForMarker ? "transparent" : "#d0cfc8",
                      strokeWidth: 0.3,
                      strokeLinejoin: "round",
                      strokeLinecap: "round",
                      outline: "none",
                      transition: "none",
                      cursor: hideForMarker ? "default" : "pointer",
                      pointerEvents: hideForMarker ? "none" : "visibleFill",
                    },
                    hover: !hideForMarker
                      ? {
                          fill: isSelected ? fill : "#c9bfa8",
                          outline: "none",
                          cursor: "pointer",
                          pointerEvents: "visibleFill",
                        }
                      : {
                          fill: displayFill,
                          cursor: "default",
                          outline: "none",
                        },
                    pressed: !hideForMarker
                      ? {
                          fill: isSelected ? fill : "#b8ad96",
                          outline: "none",
                          cursor: "pointer",
                          pointerEvents: "visibleFill",
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
              r={5}
              fill={fill}
              stroke="#d0cfc8"
              strokeWidth={0.8}
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
              r={5}
              fill={fill}
              stroke="#d0cfc8"
              strokeWidth={0.8}
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

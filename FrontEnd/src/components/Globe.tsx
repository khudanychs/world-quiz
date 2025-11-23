// src/components/Globe.tsx
import { ComposableMap, Geographies, Geography, ZoomableGroup } from "react-simple-maps";
import { useState } from "react";

// Stable data source (TopoJSON) – world-atlas
const geoUrl = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

// Position for zoom/pan in ZoomableGroup
type Position = {
  coordinates: [number, number];
  zoom: number;
};

// Minimal type for items returned from <Geographies>
type RSMGeography = {
  rsmKey: string;
  // other properties are not needed, leave them flexible
  [key: string]: unknown;
};

// Type for render-props argument in <Geographies>
type GeographiesChildrenArgs = {
  geographies: RSMGeography[];
};

export default function Globe() {
  const [position, setPosition] = useState<Position>({
    coordinates: [0, 0],
    zoom: 1,
  });

  return (
    <div
      style={{
        width: 420,
        height: 420,
        borderRadius: "50%",
        overflow: "hidden", // round "frame" like a globe
        boxShadow: "0 0 20px rgba(0,0,0,0.3)",
        background: "radial-gradient(circle at 30% 30%, #f0f4ff, #e6ecff 60%, #dde6ff)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
      aria-label="Interactive globe"
    >
      <ComposableMap
        // no need to import projection from d3-geo, just the name
        projection="geoOrthographic"
        projectionConfig={{
          scale: 190,          // globe size
          rotate: [0, -20, 0], // slight tilt
        }}
        width={400}
        height={400}
        style={{ borderRadius: "50%" }}
      >
        <ZoomableGroup
          center={position.coordinates}
          zoom={position.zoom}
          onMoveEnd={(pos: Position) => setPosition(pos)}
          zoomDuration={300}   // smooth zoom in/out
          minZoom={0.8}
          maxZoom={8}
        >
          <Geographies geography={geoUrl}>
            {({ geographies }: GeographiesChildrenArgs) =>
              geographies.map((geo: RSMGeography) => (
                <Geography
                  key={geo.rsmKey}
                  geography={geo}
                  style={{
                    default: { fill: "#4B9CD3", stroke: "#FFFFFF", strokeWidth: 0.5, outline: "none" },
                    hover:   { fill: "#357ABD", stroke: "#FFFFFF", strokeWidth: 0.6, outline: "none" },
                    pressed: { fill: "#2C5A91", stroke: "#FFFFFF", strokeWidth: 0.6, outline: "none" },
                  }}
                />
              ))
            }
          </Geographies>
        </ZoomableGroup>
      </ComposableMap>
    </div>
  );
}

// src/components/Globe.tsx
import { ComposableMap, Geographies, Geography, ZoomableGroup } from "react-simple-maps";
import { useState } from "react";

// Stabilní zdroj dat (TopoJSON) – world-atlas
const geoUrl = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

// Pozice zoom/pan pro ZoomableGroup
type Position = {
  coordinates: [number, number];
  zoom: number;
};

// Minimální typ pro položky vracené z <Geographies>
type RSMGeography = {
  rsmKey: string;
  // další vlastnosti nás teď nezajímají, necháme je volné
  [key: string]: unknown;
};

// Typ pro render-props argument v <Geographies>
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
        overflow: "hidden", // kulatý „rámeček“ jako zeměkoule
        boxShadow: "0 0 20px rgba(0,0,0,0.3)",
        background: "radial-gradient(circle at 30% 30%, #f0f4ff, #e6ecff 60%, #dde6ff)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
      aria-label="Interaktivní glóbus"
    >
      <ComposableMap
        // není třeba importovat projekci z d3-geo, stačí název
        projection="geoOrthographic"
        projectionConfig={{
          scale: 190,          // velikost glóbu
          rotate: [0, -20, 0], // lehký sklon
        }}
        width={400}
        height={400}
        style={{ borderRadius: "50%" }}
      >
        <ZoomableGroup
          center={position.coordinates}
          zoom={position.zoom}
          onMoveEnd={(pos: Position) => setPosition(pos)}
          zoomDuration={300}   // plynulé přiblížení/oddálení
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

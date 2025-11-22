// src/WorldMap.tsx - Renamed from App.tsx
import { useMemo, useRef, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import InteractiveMap from "./components/InteractiveMap";
import {
  normalizeCountryName,
  restAliases,
  normalizeApos,
  stripDiacritics,
} from "./utils/countries";
import { BASE_W, BASE_H, FRAME, FRAME_COLOR, calculateMapDimensions } from "./utils/mapConstants";

export default function WorldMap() {
  const navigate = useNavigate();
  /** --- Dynamické rozměry podle okna --- */
  const [dimensions, setDimensions] = useState({ width: BASE_W, height: BASE_H });

  useEffect(() => {
    const updateDimensions = () => {
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      setDimensions(calculateMapDimensions(vw, vh));
    };

    updateDimensions();
    window.addEventListener("resize", updateDimensions);
    return () => window.removeEventListener("resize", updateDimensions);
  }, []);

  const OUTER_W = dimensions.width;
  const OUTER_H = dimensions.height;
  const INNER_W = OUTER_W - FRAME * 2;
  const INNER_H = OUTER_H - FRAME * 2;

  /** --- Řízený pan & zoom --- */
  const [pos, setPos] = useState<{ coordinates: [number, number]; zoom: number }>({
    coordinates: [0, 0],
    zoom: 1,
  });

  /** Hover/Select pro HUD */
  const [hovered, setHovered] = useState<string | null>(null);
  const [selected, setSelected] = useState<string | null>(null);

  /** Capitals: název → [hlavní města] */
  const [capitals, setCapitals] = useState<Record<string, string[]>>({});
  const [loadingCaps, setLoadingCaps] = useState<boolean>(true);

  /** Zabrání scrollu stránky při kolečku nad mapou */
  const wrapperRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = wrapperRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel as any);
  }, []);

  /** Načtení hlavních měst 1× po startu */
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setLoadingCaps(true);
        const res = await fetch("https://restcountries.com/v3.1/all?fields=name,capital");
        const data = (await res.json()) as Array<{ name: { common: string }; capital?: string[] }>;
        const m: Record<string, string[]> = {};
        for (const c of data) {
          const key = normalizeApos(c.name.common);
          m[key] = c.capital && c.capital.length > 0 ? c.capital : [];
        }
        m["Northern Cyprus"] = ["Nicosia (North)"];
        if (alive) setCapitals(m);
      } catch (e) {
        console.error("Failed to load capitals", e);
      } finally {
        if (alive) setLoadingCaps(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  function getCapitalsFor(countryNameRaw: string): string[] | null {
    const name = normalizeCountryName(countryNameRaw);
    const nameStd = normalizeApos(name);

    if (capitals[nameStd]?.length) return capitals[nameStd];

    const alias = restAliases[nameStd];
    if (alias && capitals[alias]?.length) return capitals[alias];

    const target = stripDiacritics(nameStd);
    for (const k of Object.keys(capitals)) {
      if (stripDiacritics(k) === target && capitals[k].length) return capitals[k];
    }
    return null;
  }

  /** HUD – ukazuje název + hlavní město(a) */
  const hudText = useMemo(() => {
    const name = selected ?? hovered;
    if (name) {
      const displayName = normalizeCountryName(name);
      const caps = getCapitalsFor(name);
      if (caps && caps.length > 0) {
        const label = caps.length > 1 ? "Capitals" : "Capital";
        return `${displayName} — ${label}: ${caps.join(", ")}`;
      }
      if (loadingCaps) return `${displayName} — Loading capital…`;
      return `${displayName} — Capital: unknown`;
    }
    return "Drag = posun mapy, Wheel = plynulý zoom";
  }, [hovered, selected, loadingCaps, capitals]);

  /** Fit scale pro NaturalEarth1 */
  const FIT_SCALE = Math.max(1, Math.round(INNER_W * 0.32));

  return (
    <div
      style={{
        height: "100%",
        width: "100%",
        background: "#0b1020",
        color: "#fff",
        display: "grid",
        placeItems: "center",
        overflow: "hidden",
        position: "relative",
        overscrollBehavior: "none",
      }}
    >
      {/* Back button to main menu */}
      <button
        onClick={() => navigate("/")}
        aria-label="Back to main menu"
        style={{
          position: "absolute",
          top: 12,
          left: 12,
          zIndex: 4,
          display: "inline-flex",
          alignItems: "center",
          gap: 8,
          padding: "8px 12px",
          borderRadius: 10,
          border: "1px solid rgba(255,255,255,0.25)",
          background: "rgba(0,0,0,0.45)",
          color: "#fff",
          cursor: "pointer",
          backdropFilter: "blur(6px)",
          boxShadow: "0 4px 12px rgba(0,0,0,0.35)",
        }}
      >
        <span style={{ fontSize: 18, lineHeight: 1 }}>←</span>
        <span style={{ fontWeight: 600 }}>Back</span>
      </button>
      {/* HUD vlevo nahoře */}
      <div
        style={{
          position: "absolute",
          top: 60,
          left: 12,
          padding: "8px 12px",
          background: "rgba(0,0,0,0.45)",
          borderRadius: 8,
          fontSize: Math.min(14, OUTER_W / 50),
          pointerEvents: "none",
          zIndex: 3,
          minWidth: Math.min(260, OUTER_W * 0.4),
          maxWidth: "90vw",
          wordBreak: "break-word",
        }}
      >
        {hudText}
      </div>

      {/* --- Rounded rectangle frame + clip --- */}
      <div
        ref={wrapperRef}
        style={{
          width: OUTER_W,
          height: OUTER_H,
          border: `${FRAME}px solid ${FRAME_COLOR}`,
          borderRadius: 24,
          overflow: "hidden",
          boxShadow: "0 10px 30px rgba(0,0,0,0.35)",
          background: "linear-gradient(180deg, #0f2a4a 0%, #0b1c34 60%, #081226 100%)",
          display: "grid",
          placeItems: "center",
          touchAction: "none",
        }}
        aria-label="World map in rounded rectangle (pan & zoom)"
      >
        <InteractiveMap
          width={INNER_W}
          height={INNER_H}
          scale={FIT_SCALE}
          center={[0, 15]}
          zoom={pos.zoom}
          coordinates={pos.coordinates}
          onMoveEnd={({ zoom, coordinates }) => setPos({ zoom, coordinates })}
          onCountryClick={(name) => setSelected(name)}
          onCountryHover={setHovered}
          selectedCountry={selected}
        />
      </div>
    </div>
  );
}

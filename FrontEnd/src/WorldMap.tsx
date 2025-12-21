// src/WorldMap.tsx - Explore Map mode with country info panel
import { useEffect, useRef, useState } from "react";
import { useNavigate } from 'react-router-dom';
import { BackButton } from './components/BackButton';
import InteractiveMap from './components/InteractiveMap';
import { useAuth } from './contexts/AuthContext';
import {
  PAGE_CONTAINER_STYLE,
  getMapWrapperStyle,
} from './utils/sharedStyles';
import { getTodayDateString } from './utils/dateUtils';
import { useMapDimensions } from './hooks/useMapDimensions';
import { usePreventWheelScroll } from './hooks/usePreventWheelScroll';
import { 
  normalizeCountryName, 
  normalizeApos, 
  stripDiacritics, 
  buildCountryLookupWithCapitals,
  type CountryInfoWithCapitals 
} from './utils/countries';
import { FRAME, FRAME_COLOR } from './utils/mapConstants';

export default function WorldMap() {
  const navigate = useNavigate();
  
  /** --- Dynamic dimensions based on window --- */
  const { dimensions, isPortrait, isDesktop } = useMapDimensions();

  const OUTER_W = dimensions.width;
  const OUTER_H = dimensions.height;
  const INNER_W = OUTER_W - FRAME * 2;
  const INNER_H = OUTER_H - FRAME * 2;

  /** --- Controlled pan & zoom --- */
  const [pos, setPos] = useState<{ coordinates: [number, number]; zoom: number }>({
    coordinates: [0, 0],
    zoom: 1,
  });

  /** Selected country for info panel */
  const [selected, setSelected] = useState<string | null>(null);
  const [hovered, setHovered] = useState<string | null>(null);

  /** Country data: lookup by name */
  const [countryLookup, setCountryLookup] = useState<Record<string, CountryInfoWithCapitals>>({});
  const [loading, setLoading] = useState<boolean>(true);

  /** Prevent page scroll when wheeling over map */
  const wrapperRef = useRef<HTMLDivElement>(null);
  usePreventWheelScroll(wrapperRef);

  /** Load country data once on startup from local file */
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setLoading(true);
        const res = await fetch("/countries-full.json");
        const data = (await res.json()) as Array<{
          name: { common: string };
          cca2: string;
          flags: { svg?: string; png?: string };
          capital?: string[];
          independent?: boolean;
          unMember?: boolean;
        }>;
        
        // Use shared function to build lookup with all variations
        const lookup = buildCountryLookupWithCapitals(data);
        
        if (alive) setCountryLookup(lookup);
      } catch (e) {
        console.error("Failed to load country data", e);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  /** Get country info for display */
  function getCountryInfo(countryNameRaw: string): CountryInfoWithCapitals | null {
    const name = normalizeCountryName(countryNameRaw);
    const nameStd = normalizeApos(name);
    
    if (countryLookup[nameStd]) return countryLookup[nameStd];
    
    // Try without diacritics
    const target = stripDiacritics(nameStd);
    for (const k of Object.keys(countryLookup)) {
      if (stripDiacritics(k) === target) return countryLookup[k];
    }
    
    // Return basic info if not found
    return {
      name: name,
      cca2: "",
      flag: "",
      capitals: [],
    };
  }

  /** Selected country info */
  const selectedInfo = selected ? getCountryInfo(selected) : null;
  const displayName = selectedInfo?.name || (selected ? normalizeCountryName(selected) : null);

  /** Fit scale pro NaturalEarth1 */
  const FIT_SCALE = Math.max(1, Math.round(INNER_W * 0.32));

  return (
    <div
      style={{
        ...PAGE_CONTAINER_STYLE,
        gap: isPortrait ? "clamp(12px, 2vh, 24px)" : "0",
      }}
    >
      {/* Back button to main menu */}
      <BackButton onClick={() => navigate('/')} />

      {/* Country Info Panel - Top Center */}
      <div
        style={{
          position: isPortrait ? "relative" : "absolute",
          top: isPortrait ? "auto" : "clamp(8px, 3vh, 30px)",
          left: isPortrait ? "auto" : "50%",
          transform: isPortrait ? "none" : "translateX(-50%)",
          zIndex: 4,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: isPortrait ? "clamp(12px, 3vw, 20px)" : "clamp(10px, 2vw, 18px)",
          padding: isPortrait
            ? "clamp(12px, 3vw, 20px) clamp(16px, 4vw, 28px)"
            : "clamp(8px, 1.5vw, 16px) clamp(14px, 2.5vw, 24px)",
          borderRadius: "clamp(10px, 2vw, 16px)",
          border: "1px solid rgba(255,255,255,0.25)",
          background: "rgba(0,0,0,0.65)",
          backdropFilter: "blur(8px)",
          boxShadow: "0 4px 16px rgba(0,0,0,0.4)",
          minWidth: isPortrait ? "clamp(200px, 70vw, 360px)" : "clamp(280px, 35vw, 420px)",
          minHeight: isPortrait ? "clamp(80px, 18vw, 120px)" : "clamp(60px, 8vh, 100px)",
          transition: "all 0.2s ease-out",
        }}
      >
        {loading ? (
          <div style={{ 
            fontSize: isPortrait ? "clamp(14px, 4vw, 18px)" : "clamp(12px, 1.4vw, 16px)",
            opacity: 0.7 
          }}>
            Loading...
          </div>
        ) : selectedInfo && selectedInfo.flag ? (
          <>
            {/* Flag - SVG has correct aspect ratio built-in */}
            <img
              src={selectedInfo.flag}
              alt={`${displayName} flag`}
              style={{
                height: isPortrait ? "clamp(50px, 14vw, 80px)" : "clamp(55px, 7vw, 90px)",
                width: "auto",
                borderRadius: "clamp(2px, 0.5vw, 4px)",
                boxShadow: "0 2px 6px rgba(0,0,0,0.4)",
                flexShrink: 0,
              }}
            />
            
            {/* Country Name & Capital */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: isPortrait ? "clamp(4px, 1vw, 8px)" : "clamp(2px, 0.5vw, 6px)",
                textAlign: "left",
              }}
            >
              <div
                style={{
                  fontSize: isPortrait ? "clamp(18px, 5vw, 28px)" : "clamp(16px, 2vw, 26px)",
                  fontWeight: 700,
                  lineHeight: 1.2,
                }}
              >
                {displayName}
              </div>
              {selectedInfo.capitals.length > 0 ? (
                <div
                  style={{
                    fontSize: isPortrait ? "clamp(12px, 3.5vw, 18px)" : "clamp(11px, 1.3vw, 16px)",
                    opacity: 0.8,
                    lineHeight: 1.3,
                  }}
                >
                  <span style={{ opacity: 0.6 }}>
                    {selectedInfo.capitals.length > 1 ? "Capitals: " : "Capital: "}
                  </span>
                  {selectedInfo.capitals.join(", ")}
                </div>
              ) : displayName === "Antarctica" ? null : (
                <div
                  style={{
                    fontSize: isPortrait ? "clamp(12px, 3.5vw, 18px)" : "clamp(11px, 1.3vw, 16px)",
                    opacity: 0.5,
                    fontStyle: "italic",
                  }}
                >
                  Capital unknown
                </div>
              )}
            </div>
          </>
        ) : selected ? (
          /* Selected but no flag available */
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "clamp(4px, 1vw, 8px)",
            }}
          >
            <div
              style={{
                fontSize: isPortrait ? "clamp(18px, 5vw, 28px)" : "clamp(16px, 2vw, 26px)",
                fontWeight: 700,
              }}
            >
              {displayName}
            </div>
            {selectedInfo?.capitals && selectedInfo.capitals.length > 0 && (
              <div
                style={{
                  fontSize: isPortrait ? "clamp(12px, 3.5vw, 18px)" : "clamp(11px, 1.3vw, 16px)",
                  opacity: 0.8,
                }}
              >
                <span style={{ opacity: 0.6 }}>
                  {selectedInfo.capitals.length > 1 ? "Capitals: " : "Capital: "}
                </span>
                {selectedInfo.capitals.join(", ")}
              </div>
            )}
          </div>
        ) : (
          /* No country selected - show hint */
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "clamp(4px, 1vw, 8px)",
              textAlign: "center",
            }}
          >
            <div
              style={{
                fontSize: isPortrait ? "clamp(14px, 4vw, 20px)" : "clamp(13px, 1.5vw, 18px)",
                fontWeight: 600,
                opacity: 0.9,
              }}
            >
              🌍 Explore the World
            </div>
            <div
              style={{
                fontSize: isPortrait ? "clamp(11px, 3vw, 15px)" : "clamp(10px, 1.2vw, 14px)",
                opacity: 0.6,
              }}
            >
              Click on any country to see its flag and capital
            </div>
          </div>
        )}
      </div>

      {/* Hover indicator - small label */}
      {hovered && hovered !== selected && (
        <div
          style={{
            position: "absolute",
            bottom: isPortrait ? "auto" : 20,
            top: isPortrait ? 60 : "auto",
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 3,
            padding: "6px 14px",
            borderRadius: 8,
            background: "rgba(0,0,0,0.6)",
            backdropFilter: "blur(4px)",
            fontSize: isPortrait ? "clamp(11px, 3vw, 14px)" : "clamp(11px, 1.2vw, 14px)",
            opacity: 0.9,
            pointerEvents: "none",
          }}
        >
          {normalizeCountryName(hovered)}
        </div>
      )}

      {/* --- Rounded rectangle frame + clip --- */}
      <div
        ref={wrapperRef}
        style={getMapWrapperStyle(OUTER_W, OUTER_H, FRAME, FRAME_COLOR)}
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
          isDesktop={isDesktop}
        />
      </div>
    </div>
  );
}

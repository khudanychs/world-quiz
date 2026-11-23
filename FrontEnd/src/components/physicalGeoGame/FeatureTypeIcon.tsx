import { useId, type ReactNode } from "react";
import type { FeatureCategory } from "../../utils/physicalFeaturesTypes";

interface FeatureTypeIconProps {
  type: FeatureCategory;
}

/** Shared cartographic palette aligned with the World Quiz physical geography map. */
const C = {
  sky: "#182438",
  dusk: "#1e293b",
  deepOcean: "#0c2d57",
  oceanMid: "#0f2a4a",
  seaAzure: "#0e4a7b",
  waterDeep: "#0284c7",
  waterMid: "#0ea5e9",
  water: "#38bdf8",
  waterLight: "#60a5fa",
  waterSky: "#7dd3fc",
  waterCyan: "#22d3ee",
  waterGlint: "#bae6fd",
  land: "#dfd5bc",
  landShade: "#c8ba98",
  coast: "#b8aa8a",
  mtnBack: "#c2410c",
  mtnBackDark: "#9a3412",
  mtnLit: "#fb923c",
  mtnShade: "#ea580c",
  snow: "#fff7ed",
  snowWarm: "#ffedd5",
  snowShade: "#fed7aa",
  basalt: "#475569",
  basaltDark: "#334155",
  lava: "#ef4444",
  lavaGlow: "#f97316",
  lavaCore: "#fde047",
  ash: "#e2e8f0",
  ashShade: "#cbd5e1",
  duneBack: "#d97706",
  duneFront: "#fbbf24",
  duneShade: "#f59e0b",
  sun: "#fde68a",
  stoneBank: "#9ca3af",
  lockGate: "#1e3a5f",
} as const;

/**
 * 15 unique 32×32 cartographic map-tile artworks (clipped inside a 30×30 rounded stamp).
 * Elevation/landform types use crisp cross-sections; hydrographic types use literal top-down
 * cartographic geometry matching the World Quiz map palette.
 */
const FEATURE_TILES: Record<FeatureCategory, ReactNode> = {
  // 1. Mountain (Hora)
  mountain: (
    <>
      <rect width="32" height="32" fill={C.sky} />
      <path d="M16 6 1.5 32h29Z" fill={C.mtnLit} />
      <path d="M16 6 17.5 15.2 15.4 21.5 18.8 32h11.7Z" fill={C.mtnShade} />
      <path d="M16 6 10.8 15.3l2.6-1.3 2.3 2 2-1.9 3.5 1.2Z" fill={C.snow} />
      <path d="M16 6 17.7 14.1 21.2 15.3Z" fill={C.snowShade} />
    </>
  ),

  // 2. Mountain range (Pohoří)
  mountain_range: (
    <>
      <rect width="32" height="32" fill={C.sky} />
      <path d="M8.8 9.8-2 32h21.6Z" fill={C.mtnBack} />
      <path d="M8.8 9.8 10.2 19 11.8 32h7.8Z" fill={C.mtnBackDark} />
      <path d="M8.8 9.8 5.4 16.6l2-.9 1.6 1.4 1.5-1.3 1.7.8Z" fill={C.snowWarm} />
      <path d="M23.6 10.6 12.6 32h21.4Z" fill={C.mtnBack} />
      <path d="M23.6 10.6 25 19.5 27 32h7Z" fill={C.mtnBackDark} />
      <path d="M23.6 10.6 20.3 17l1.9-.9 1.5 1.3 1.6-1.2 1.7.8Z" fill={C.snowWarm} />
      <path d="M16 12.8 3.2 32h25.6Z" fill={C.mtnLit} />
      <path d="M16 12.8 17.5 20.4 15.7 25.5 18.6 32h10.2Z" fill={C.mtnShade} />
      <path d="M16 12.8 12.1 18.7l2.1-1 1.8 1.5 1.7-1.4 2.2.9Z" fill={C.snow} />
      <path d="M16 12.8 17.7 17.8 19.9 18.7Z" fill={C.snowShade} />
    </>
  ),

  // 3. Volcano (Sopka)
  volcano: (
    <>
      <rect width="32" height="32" fill={C.sky} />
      <circle cx="15.2" cy="9.9" r="2.1" fill={C.ashShade} />
      <circle cx="18.2" cy="8.1" r="2.7" fill={C.ashShade} />
      <circle cx="21.9" cy="6.8" r="2.2" fill={C.ashShade} />
      <circle cx="14.9" cy="9.2" r="2.1" fill={C.ash} />
      <circle cx="18" cy="7.5" r="2.7" fill={C.ash} />
      <circle cx="21.8" cy="6.3" r="2.2" fill={C.ash} />
      <path d="M11.8 13.5h8.4Q23.8 23 30.8 32H1.2Q8.2 23 11.8 13.5Z" fill={C.basalt} />
      <path d="M16 13.5h4.2Q23.8 23 30.8 32H17.5Q17 22 16 13.5Z" fill={C.basaltDark} />
      <ellipse cx="16" cy="13.7" rx="4.1" ry="1.2" fill={C.lavaGlow} />
      <ellipse cx="16" cy="13.6" rx="2.3" ry="0.65" fill={C.lavaCore} />
      <path d="M13 14.1q.2 3.3-1.4 5.9-.9 1.5.3 2.2 1.1.5 1.8-1.2 1-2.5 1.7-2.2.7.3.5 3.1-.1 2.2 1.2 2.5 1.2.2 1.4-2.1.2-3.6.1-8Z" fill={C.lava} />
      <path d="M14.7 14.2q.2 2.2-.8 4.2-.3.6.3.8.6.2 1.1-1.1.6-1.4 1.2-1.1.5.3.4 2.4-.1 1 .5 1.1.6.1.6-1.5 0-2.5 0-4.8Z" fill={C.lavaGlow} />
    </>
  ),

  // 4. Depression (Proláklina)
  depression: (
    <>
      <rect width="32" height="32" fill={C.sky} />
      <path d="M7.5 19.6h17v8.4h-17Z" fill={C.waterCyan} />
      <path d="M8.5 22.8h15v5.2h-15Z" fill="#06b6d4" />
      <path d="M12 21.3h8" stroke={C.waterGlint} strokeWidth="0.95" strokeLinecap="round" opacity="0.9" />
      <path d="M0 10.6h6.1c2 0 3.1 2 3.8 6.8.6 4.4 1.4 8.8 3.9 8.8h4.4c2.5 0 3.3-4.4 3.9-8.8.7-4.8 1.8-6.8 3.8-6.8H32V32H0Z" fill={C.land} />
      <path d="M0 10.6h6.1c2 0 3.1 2 3.8 6.8.6 4.4 1.4 8.8 3.9 8.8h4.4c2.5 0 3.3-4.4 3.9-8.8.7-4.8 1.8-6.8 3.8-6.8H32" fill="none" stroke={C.coast} strokeWidth="1.15" />
      <rect y="28.6" width="32" height="3.4" fill={C.landShade} opacity="0.6" />
      <line x1="2" y1="10.6" x2="30" y2="10.6" stroke="rgba(255,255,255,0.78)" strokeWidth="1.2" strokeDasharray="2.4 2" />
      <path d="M16 12.8v4.8m-2.3-2.1L16 17.9l2.3-2.4" fill="none" stroke="#ffffff" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    </>
  ),

  // 5. Desert (Poušť)
  desert: (
    <>
      <rect width="32" height="32" fill={C.dusk} />
      <circle cx="22.8" cy="8.4" r="5.3" fill={C.sun} opacity="0.16" />
      <circle cx="22.8" cy="8.4" r="3.2" fill={C.sun} />
      <path d="M-1 18.6Q8.5 12.2 17.5 17.4T33 20.4V32H-1Z" fill={C.duneBack} />
      <path d="M-1 24.4Q9.5 21 18.2 17.2T33 19.6V32H-1Z" fill={C.duneFront} />
      <path d="M20.2 17.2Q24.8 22.5 33 25.5V32H17Q18 22.5 20.2 17.2Z" fill={C.duneShade} opacity="0.78" />
      <path d="M1.2 23.8Q10.5 20.4 19.6 17.2" fill="none" stroke={C.sun} strokeWidth="0.95" strokeLinecap="round" opacity="0.78" />
    </>
  ),

  // 6. Lake (Jezero) — top-down inland lake enclosed by sand
  lake: (
    <>
      <rect width="32" height="32" fill={C.land} />
      <path d="M8.8 12.4c1.6-3.1 6-4.9 9.7-4.1 2.4.5 3.6 2.2 5.3 3.7 1.8 1.6 2.5 4.4 1.1 7.1-1.3 2.5-4.3 4.2-7.5 4.8-3.4.6-6.2-.9-8.3-2.9-2.2-2.1-2-5.6-.3-8.6Z" fill={C.water} stroke={C.coast} strokeWidth="1.5" />
      <path d="M9.6 12.9c1.4-2.6 5.2-4.1 8.4-3.4 2.1.4 3.2 1.9 4.7 3.2 1.5 1.3 2.1 3.7.9 6-1.1 2.1-3.7 3.5-6.5 4-2.9.5-5.3-.8-7.1-2.5-1.8-1.8-1.7-4.7-.4-7.3Z" fill="none" stroke={C.waterDeep} strokeWidth="0.85" opacity="0.5" />
      <path d="M11.6 14.1q2.6-.9 5.2 0M15.4 18.2q2.6-.9 5.2 0" fill="none" stroke={C.waterGlint} strokeWidth="1.1" strokeLinecap="round" opacity="0.9" />
    </>
  ),

  // 7. River (Řeka) — top-down tapering S-curve river
  river: (
    <>
      <rect width="32" height="32" fill={C.land} />
      <path d="M23.2-1C19.6 4.6 9.3 6.2 8.6 11.4c-.7 5.2 10.4 5.8 10.8 10.4.4 4.1-6.5 6.8-11.8 11.2h8.4c4.3-4 9.3-7 8.6-12.1-.7-5.6-11.4-6.2-11-9.8.4-3.2 7.6-4.7 11.1-12.1Z" fill={C.water} stroke={C.waterDeep} strokeWidth="0.85" />
      <path d="M23.8.5C20.5 5.7 11.5 7.4 11.1 11.3c-.4 4 10.7 4.8 10.9 10.2.2 3.8-4.4 6.7-9 10" fill="none" stroke={C.waterGlint} strokeWidth="0.95" strokeLinecap="round" opacity="0.78" />
    </>
  ),

  // 8. Ocean (Oceán) — deep open ocean with three uniform rolling swells
  ocean: (
    <>
      <rect width="32" height="32" fill={C.deepOcean} />
      <path d="M-2 11Q7 7 16 11T34 11V32H-2Z" fill="#0369a1" />
      <path d="M-2 11Q7 7 16 11T34 11" fill="none" stroke={C.waterMid} strokeWidth="1.2" opacity="0.75" />
      <path d="M-2 17.5Q7 13.5 16 17.5T34 17.5V32H-2Z" fill={C.waterDeep} />
      <path d="M-2 17.5Q7 13.5 16 17.5T34 17.5" fill="none" stroke={C.water} strokeWidth="1.3" />
      <path d="M-2 24Q7 20 16 24T34 24V32H-2Z" fill={C.water} />
      <path d="M-2 24Q7 20 16 24T34 24" fill="none" stroke={C.waterGlint} strokeWidth="1.4" />
    </>
  ),

  // 9. Sea (Moře) — coastal azure sea with three clean calm ripples & sandy shoreline
  sea: (
    <>
      <rect width="32" height="32" fill={C.seaAzure} />
      <path d="M15.2-1c.5 7.5 4.2 13.4 11.2 16.2 2.2.9 4.4 1.3 6.6 1.4V-1Z" fill={C.water} opacity="0.32" />
      <path d="M18.6-1c.6 5.8 3.2 10.2 8.2 12.6 1.9.9 4 1.3 6.2 1.4V-1Z" fill={C.land} stroke={C.coast} strokeWidth="1.25" />
      <path d="M4.5 11q2.5-1.3 5 0t5 0M6.5 17.8q2.5-1.3 5 0t5 0t5 0M9.5 24.6q2.5-1.3 5 0t5 0t5 0" fill="none" stroke={C.waterSky} strokeWidth="1.55" strokeLinecap="round" />
    </>
  ),

  // 10. Gulf (Záliv) — top-down 3-sided land wrapping a deep U-shaped gulf
  gulf: (
    <>
      <rect width="32" height="32" fill={C.water} />
      <path d="M-1-1H33V7.8c-3.2 1.8-6.2 3.3-9.5 2.5-2.6-.6-4.8-1.4-7.9-1.2-4.6.3-8.1 3-8.2 7-.1 4.1 3.4 6.9 8.1 7.1 3.1.1 5.6-.8 8.3-1.1 3.2-.3 6.2 1.1 9.2 3.1V33H-1Z" fill="none" stroke={C.waterDeep} strokeWidth="3.4" opacity="0.22" />
      <path d="M-1-1H33V7.8c-3.2 1.8-6.2 3.3-9.5 2.5-2.6-.6-4.8-1.4-7.9-1.2-4.6.3-8.1 3-8.2 7-.1 4.1 3.4 6.9 8.1 7.1 3.1.1 5.6-.8 8.3-1.1 3.2-.3 6.2 1.1 9.2 3.1V33H-1Z" fill={C.land} stroke={C.coast} strokeWidth="1.35" />
      <path d="M12.2 14.6q3.2-.8 6.4 0M15.6 18.4q3.4-.8 6.8 0" fill="none" stroke={C.waterGlint} strokeWidth="1.2" strokeLinecap="round" />
    </>
  ),

  // 11. Bay (Zátoka) — top-down wide, open crescent shoreline
  bay: (
    <>
      <rect width="32" height="32" fill={C.waterLight} />
      <path d="M-1-1H10.6C7.6 6.8 8.2 14.8 13.4 19.9c5 4.9 11.6 5.6 19.6 3.1V33H-1Z" fill="none" stroke={C.water} strokeWidth="4.2" opacity="0.45" />
      <path d="M-1-1H10.6C7.6 6.8 8.2 14.8 13.4 19.9c5 4.9 11.6 5.6 19.6 3.1V33H-1Z" fill={C.land} stroke={C.coast} strokeWidth="1.35" />
      <path d="M15.6 10.6q3-.9 6 0M19.2 15q3.2-.9 6.4 0" fill="none" stroke={C.waterGlint} strokeWidth="1.2" strokeLinecap="round" />
    </>
  ),

  // 12. Strait (Průliv) — top-down opposing peninsulas pinching a narrow strait
  strait: (
    <>
      <rect width="32" height="32" fill={C.water} />
      <path d="M-1 5.6C4.8 6.4 12.2 10.5 12.5 15.8c.3 4.8-6.4 8.8-13.5 10.4Z" fill="none" stroke={C.waterDeep} strokeWidth="3.2" opacity="0.22" />
      <path d="M33 6.4C26.4 7.5 19.8 11.2 19.5 16.2c-.3 5.2 6.8 9.2 13.5 10Z" fill="none" stroke={C.waterDeep} strokeWidth="3.2" opacity="0.22" />
      <path d="M-1 5.6C4.8 6.4 12.2 10.5 12.5 15.8c.3 4.8-6.4 8.8-13.5 10.4Z" fill={C.land} stroke={C.coast} strokeWidth="1.3" />
      <path d="M33 6.4C26.4 7.5 19.8 11.2 19.5 16.2c-.3 5.2 6.8 9.2 13.5 10Z" fill={C.land} stroke={C.coast} strokeWidth="1.3" />
      <path d="M12.5 6.8q3.5-.8 7 0M13 25.4q3-.8 6 0" fill="none" stroke={C.waterGlint} strokeWidth="1.15" strokeLinecap="round" opacity="0.88" />
    </>
  ),

  // 13. Canal (Průplav) — top-down straight artificial waterway with stone banks & lock gates
  canal: (
    <>
      <rect width="32" height="32" fill={C.land} />
      <rect x="9.8" y="0" width="12.4" height="32" fill={C.stoneBank} />
      <rect x="11.5" y="0" width="9" height="32" fill={C.water} />
      <rect x="11.5" y="10.4" width="9" height="11.2" fill={C.waterMid} />
      <path d="M9.8 0v32M22.2 0v32" stroke={C.coast} strokeWidth="0.75" />
      <path d="M11.5 0v32M20.5 0v32" stroke={C.basalt} strokeWidth="0.8" />
      <path d="M11.5 10.6 16 12.5l4.5-1.9M11.5 21.4 16 23.3l4.5-1.9" fill="none" stroke={C.lockGate} strokeWidth="1.55" strokeLinejoin="round" />
      <path d="M11.5 9.9 16 11.8l4.5-1.9M11.5 20.7 16 22.6l4.5-1.9" fill="none" stroke={C.waterGlint} strokeWidth="0.8" strokeLinejoin="round" opacity="0.8" />
    </>
  ),

  // 14. Channel (Průliv / Kanál) — top-down mainland + right island separated by a broad sea channel
  channel: (
    <>
      <rect width="32" height="32" fill={C.water} />
      <path d="M-1-1h13.6C11.4 6.5 9.8 13.5 8.5 20.5 7.6 25 6.8 29 5.2 33H-1Z" fill="none" stroke={C.waterDeep} strokeWidth="3" opacity="0.22" />
      <path d="M21.4 6.6c2.6-1.2 6.2.2 7.3 3.6.9 2.7.2 5.4-.4 8.2-.7 3.2-2.2 6.6-5.2 7.4-3.3.9-6.2-1.8-6.4-5.7-.2-3.4.9-5.6 1.5-8.4.5-2.4 1.1-4.1 3.2-5.1Z" fill="none" stroke={C.waterDeep} strokeWidth="3" opacity="0.22" />
      <path d="M-1-1h13.6C11.4 6.5 9.8 13.5 8.5 20.5 7.6 25 6.8 29 5.2 33H-1Z" fill={C.land} stroke={C.coast} strokeWidth="1.3" />
      <path d="M21.4 6.6c2.6-1.2 6.2.2 7.3 3.6.9 2.7.2 5.4-.4 8.2-.7 3.2-2.2 6.6-5.2 7.4-3.3.9-6.2-1.8-6.4-5.7-.2-3.4.9-5.6 1.5-8.4.5-2.4 1.1-4.1 3.2-5.1Z" fill={C.land} stroke={C.coast} strokeWidth="1.3" />
      <path d="M12.1 12.2q1.8-.6 3.6 0M10.8 24.8q2.2-.6 4.4 0" fill="none" stroke={C.waterGlint} strokeWidth="1.15" strokeLinecap="round" opacity="0.88" />
    </>
  ),

  // 15. Passage (Průjezd) — top-down wide deep ocean between two distant capes with horizontal flow curves
  passage: (
    <>
      <rect width="32" height="32" fill={C.oceanMid} />
      <ellipse cx="16" cy="16" rx="18" ry="10.5" fill={C.waterDeep} opacity="0.38" />
      <path d="M7.5-1 14.7 6.3c.9.9 2.3.9 3.2 0L24.8-1Z" fill={C.land} stroke={C.coast} strokeWidth="1.2" />
      <path d="M7.2 33 14.6 25.7c.9-.9 2.3-.9 3.2 0L25.2 33Z" fill={C.land} stroke={C.coast} strokeWidth="1.2" />
      <path d="M4.8 13.3q5.5-2.2 11 0t10.4 0m-2.3-2.1 2.5 2.1-2.5 2.1" fill="none" stroke={C.water} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M5.2 19.1q5.5-2.2 11 0t10.4 0m-2.3-2.1 2.5 2.1-2.5 2.1" fill="none" stroke={C.waterGlint} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    </>
  ),
};

/**
 * Renders a 32×32 cartographic map-tile SVG icon sized to `0.95em` so it inherits
 * `.phys-hud-icon`'s responsive `fontSize` cleanly across desktop and mobile.
 */
export function FeatureTypeIcon({ type }: FeatureTypeIconProps) {
  // Unique per-instance clipPath ID prevents collisions if multiple icons mount on one page
  const uid = useId().replace(/:/g, "");
  const clipId = `phys-icon-${type}-${uid}`;

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 32 32"
      width="0.95em"
      height="0.95em"
      aria-hidden="true"
      focusable="false"
      style={{ display: "block" }}
    >
      <defs>
        <clipPath id={clipId}>
          <rect x="1" y="1" width="30" height="30" rx="7" />
        </clipPath>
      </defs>
      <g clipPath={`url(#${clipId})`}>{FEATURE_TILES[type]}</g>
      <rect
        x="1.5"
        y="1.5"
        width="29"
        height="29"
        rx="6.5"
        fill="none"
        stroke="rgba(255,255,255,0.16)"
        strokeWidth="1"
      />
    </svg>
  );
}

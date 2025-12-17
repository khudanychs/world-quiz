// Shared UI styles to ensure DRY principle across components

import { CSSProperties } from "react";

/** Common back button style used in FlagMatchGame and WorldMap */
export const BACK_BUTTON_STYLE: CSSProperties = {
  position: "absolute",
  top: 16,
  left: 16,
  zIndex: 10,
  display: "inline-flex",
  alignItems: "center",
  gap: 10,
  padding: "10px 18px",
  borderRadius: "14px",
  border: "1px solid rgba(255, 255, 255, 0.15)",
  background: "rgba(30, 41, 59, 0.7)",
  color: "#fff",
  fontWeight: 600,
  fontSize: "15px",
  cursor: "pointer",
  backdropFilter: "blur(12px)",
  boxShadow: "0 8px 32px rgba(0, 0, 0, 0.3), inset 0 0 0 1px rgba(255, 255, 255, 0.05)",
  transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
  userSelect: "none",
};

/** Back button hover handlers */
export const BACK_BUTTON_HOVER = {
  onMouseEnter: (e: React.MouseEvent<HTMLButtonElement>) => {
    e.currentTarget.style.background = "rgba(51, 65, 85, 0.85)";
    e.currentTarget.style.transform = "translateY(-2px) scale(1.02)";
    e.currentTarget.style.boxShadow = "0 12px 40px rgba(0, 0, 0, 0.4), inset 0 0 0 1px rgba(255, 255, 255, 0.1)";
    e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.3)";
  },
  onMouseLeave: (e: React.MouseEvent<HTMLButtonElement>) => {
    e.currentTarget.style.background = "rgba(30, 41, 59, 0.7)";
    e.currentTarget.style.transform = "translateY(0) scale(1)";
    e.currentTarget.style.boxShadow = "0 8px 32px rgba(0, 0, 0, 0.3), inset 0 0 0 1px rgba(255, 255, 255, 0.05)";
    e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.15)";
  },
};

/** Common page container style with dark gradient background */
export const PAGE_CONTAINER_STYLE: CSSProperties = {
  height: "100%",
  width: "100%",
  background: "#0b1020",
  color: "#fff",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  overflow: "hidden",
  position: "relative",
  overscrollBehavior: "none",
};

/** Get gap style for portrait/landscape modes */
export function getContainerGap(isPortrait: boolean): string {
  return isPortrait ? "clamp(16px, 3vh, 32px)" : "0";
}

/** Common map wrapper style */
export function getMapWrapperStyle(
  outerW: number,
  outerH: number,
  frame: number,
  frameColor: string
): CSSProperties {
  return {
    width: outerW,
    height: outerH,
    border: `${frame}px solid ${frameColor}`,
    borderRadius: 24,
    overflow: "hidden",
    boxShadow: "0 10px 30px rgba(0,0,0,0.35)",
    background: "linear-gradient(180deg, #0f2a4a 0%, #0b1c34 60%, #081226 100%)",
    display: "grid",
    placeItems: "center",
    touchAction: "none",
  };
}

/** Common floating panel style (HUD, info panels) */
export function getFloatingPanelStyle(isPortrait: boolean): CSSProperties {
  return {
    position: isPortrait ? "relative" : "absolute",
    top: isPortrait ? "auto" : "clamp(8px, 4vh, 40px)",
    left: isPortrait ? "auto" : "50%",
    transform: isPortrait ? "none" : "translateX(-50%)",
    zIndex: 4,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: "clamp(8px, 2vw, 12px)",
    border: "1px solid rgba(255,255,255,0.25)",
    background: "rgba(0,0,0,0.65)",
    backdropFilter: "blur(8px)",
    boxShadow: "0 4px 12px rgba(0,0,0,0.4)",
  };
}

/** Common green action button style (New Game, etc.) */
export const GREEN_BUTTON_STYLE: CSSProperties = {
  padding: "clamp(8px, 2vw, 12px) clamp(16px, 4vw, 24px)",
  borderRadius: "clamp(8px, 2vw, 12px)",
  border: "2px solid rgba(16, 185, 129, 0.5)",
  background: "rgba(16, 185, 129, 0.2)",
  color: "#10b981",
  fontSize: "clamp(13px, 3vw, 17px)",
  fontWeight: 600,
  cursor: "pointer",
  transition: "all 0.2s",
};

/** Green button hover handlers */
export const GREEN_BUTTON_HOVER = {
  onMouseEnter: (e: React.MouseEvent<HTMLButtonElement>) => {
    e.currentTarget.style.background = "rgba(16, 185, 129, 0.3)";
    e.currentTarget.style.transform = "scale(1.05)";
  },
  onMouseLeave: (e: React.MouseEvent<HTMLButtonElement>) => {
    e.currentTarget.style.background = "rgba(16, 185, 129, 0.2)";
    e.currentTarget.style.transform = "scale(1)";
  },
};

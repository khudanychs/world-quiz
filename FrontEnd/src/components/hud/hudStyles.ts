import React from "react";
import { PAGE_CONTAINER_STYLE } from "../../utils/sharedStyles";

/**
 * Determines whether the layout is constrained (requiring stacked scrolling layout),
 * specifically for portrait orientation, narrow viewports (< 640px),
 * very short viewports (< 440px), or when HUD would cover > 1/3 (33%) of the map height.
 */
export function isLayoutConstrained(
  viewportWidth: number,
  viewportHeight: number,
  isPortrait: boolean,
  mapHeight?: number
): boolean {
  if (isPortrait) return true;
  if (viewportWidth < 640) return true;
  if (viewportHeight < 440) return true;
  if (mapHeight && mapHeight > 0) {
    // Estimated minimum HUD height is ~72px on desktop/landscape
    const estimatedHudHeight = 72;
    if (estimatedHudHeight > mapHeight / 3) return true;
  }
  return false;
}

/**
 * Common style for the BackButton when the layout is constrained.
 */
export const CONSTRAINED_BACK_BUTTON_STYLE: React.CSSProperties = {
  top: "max(6px, env(safe-area-inset-top))",
  left: "max(8px, env(safe-area-inset-left))",
  padding: "5px 10px",
  minHeight: "32px",
  fontSize: "12px",
  gap: "6px",
};

/**
 * Computes responsive styles for the main game page container (FlagMatchGame, PhysicalGeoGame).
 */
export function getGameContainerStyle(
  isPortrait: boolean,
  isConstrained: boolean
): React.CSSProperties {
  const isStackedLayout = isPortrait || isConstrained;
  return {
    ...PAGE_CONTAINER_STYLE,
    overflowY: isStackedLayout ? "auto" : "hidden",
    height: "100%",
    maxHeight: "100%",
    justifyContent: isStackedLayout ? "flex-start" : "center",
    paddingTop: isStackedLayout
      ? "max(48px, calc(env(safe-area-inset-top) + 38px))"
      : "0",
    paddingBottom: isStackedLayout
      ? "max(16px, env(safe-area-inset-bottom))"
      : "0",
    gap: isPortrait ? "clamp(12px, 2.5vh, 24px)" : isStackedLayout ? "clamp(6px, 1.5vh, 12px)" : "0",
    boxSizing: "border-box",
  };
}

/**
 * Options for computing responsive HUD card container styles.
 */
export interface HUDCardStyleOptions {
  isPortrait: boolean;
  isConstrained: boolean;
  isCompact: boolean;
  viewportWidth: number;
  mapTop?: number;
  maxCompactWidth?: number;
}

/**
 * Computes responsive styles for the floating HUD card container.
 *
 * CRITICAL LAYOUT RESILIENCE:
 * On narrow viewports (< 640px) or portrait mode, the HUD is in normal flow (position: relative)
 * below the BackButton or occupies full safe width without colliding.
 * In landscape with ample width (>= 640px), the HUD floats at top center (position: absolute)
 * with a single-row layout, ensuring the map is large, expansive, and not pushed down into a slit.
 */
export function getHUDCardStyle({
  isPortrait,
  isConstrained,
  isCompact,
  viewportWidth,
  mapTop,
  maxCompactWidth = 440,
}: HUDCardStyleOptions): React.CSSProperties {
  const isStackedLayout = isPortrait || isConstrained;

  let maxWidth: string;
  let width: string;
  if (isStackedLayout) {
    maxWidth = `min(94vw, ${maxCompactWidth}px)`;
    width = `min(94vw, ${maxCompactWidth}px)`;
  } else {
    // Landscape with >= 640px width: clear BackButton (80px + margin) on left & balance on right
    maxWidth = "min(96vw, calc(100vw - 260px))";
    width = "fit-content";
  }

  // When not stacked, HUD floats over top of map:
  // Position top so HUD bottom gracefully overlaps the top ocean of the map by ~35-55px.
  // mapTop is the top edge of the vertically centered map.
  const desktopTop = mapTop !== undefined
    ? Math.max(12, Math.round(mapTop - 20))
    : "clamp(12px, 3.5vh, 40px)";

  return {
    position: isStackedLayout ? "relative" : "absolute",
    top: isStackedLayout ? "auto" : desktopTop,
    left: isStackedLayout ? "auto" : "50%",
    transform: isStackedLayout ? "none" : "translateX(-50%)",
    zIndex: 4,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: isStackedLayout ? "clamp(8px, 2vw, 14px)" : "clamp(6px, 1vw, 14px)",
    padding: isStackedLayout
      ? "clamp(10px, 2.5vw, 16px) clamp(12px, 3vw, 18px)"
      : "clamp(6px, 1vh, 12px) clamp(12px, 1.5vw, 22px)",
    borderRadius: isStackedLayout ? "16px" : "14px",
    border: "1px solid rgba(255, 255, 255, 0.25)",
    background: "rgba(0, 0, 0, 0.72)",
    backdropFilter: "blur(12px)",
    WebkitBackdropFilter: "blur(12px)",
    boxShadow: "0 8px 32px rgba(0, 0, 0, 0.5)",
    width,
    minWidth: isStackedLayout ? "min(280px, 94vw)" : "auto",
    maxWidth,
    boxSizing: "border-box",
    overflow: "visible",
    flexShrink: 0,
  };
}

/**
 * Styling for the counter badge ("current / total").
 */
export function getHUDCounterBadgeStyle(isPortrait: boolean): React.CSSProperties {
  return {
    height: isPortrait ? "clamp(28px, 6vw, 34px)" : "clamp(30px, 3.4vh, 38px)",
    minHeight: isPortrait ? "clamp(28px, 6vw, 34px)" : "clamp(30px, 3.4vh, 38px)",
    boxSizing: "border-box",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    padding: isPortrait ? "0 clamp(6px, 1.8vw, 10px)" : "0 clamp(8px, 0.9vw, 14px)",
    borderRadius: "8px",
    background: isPortrait ? "rgba(255, 255, 255, 0.1)" : "rgba(255, 255, 255, 0.08)",
    border: "1px solid rgba(255, 255, 255, 0.18)",
    color: "rgba(255, 255, 255, 0.95)",
    fontSize: isPortrait ? "clamp(11px, 2.5vw, 13px)" : "clamp(11.5px, 1.1vw, 14.5px)",
    fontWeight: 600,
    lineHeight: 1,
    whiteSpace: "nowrap",
    flexShrink: 0,
  };
}

/**
 * Styling for the streak flame badge ("🔥 X").
 */
export function getHUDStreakBadgeStyle(isPortrait: boolean): React.CSSProperties {
  return {
    height: isPortrait ? "clamp(28px, 6vw, 34px)" : "clamp(30px, 3.4vh, 38px)",
    minHeight: isPortrait ? "clamp(28px, 6vw, 34px)" : "clamp(30px, 3.4vh, 38px)",
    boxSizing: "border-box",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    padding: isPortrait ? "0 clamp(6px, 1.8vw, 10px)" : "0 clamp(8px, 0.9vw, 13px)",
    borderRadius: "8px",
    background: "rgba(251, 146, 60, 0.2)",
    border: "1px solid rgba(251, 146, 60, 0.4)",
    color: "#fb923c",
    fontSize: isPortrait ? "clamp(11px, 2.5vw, 13px)" : "clamp(11.5px, 1.1vw, 14.5px)",
    fontWeight: 600,
    lineHeight: 1,
    whiteSpace: "nowrap",
    flexShrink: 0,
  };
}

/**
 * Styling for the blue score badge ("Score: X/Y").
 */
export function getHUDScoreBadgeStyle(isPortrait: boolean): React.CSSProperties {
  return {
    height: isPortrait ? "clamp(36px, 8vw, 42px)" : "clamp(34px, 3.8vh, 42px)",
    minHeight: isPortrait ? "clamp(36px, 8vw, 42px)" : "clamp(34px, 3.8vh, 42px)",
    boxSizing: "border-box",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    padding: isPortrait ? "0 clamp(4px, 1.2vw, 12px)" : "0 clamp(10px, 1.1vw, 16px)",
    minWidth: isPortrait ? 0 : "max-content",
    borderRadius: "8px",
    background: "rgba(59, 130, 246, 0.18)",
    border: "1px solid rgba(59, 130, 246, 0.35)",
    fontSize: isPortrait ? "clamp(10px, 2.4vw, 13.5px)" : "clamp(12px, 1.1vw, 15px)",
    letterSpacing: isPortrait ? "-0.15px" : "normal",
    fontWeight: 600,
    color: "#60a5fa",
    lineHeight: 1.15,
    textAlign: "center",
    whiteSpace: "nowrap",
    overflow: "hidden",
    flex: isPortrait ? 1 : "initial",
    flexShrink: 0,
  };
}

/**
 * Styling for the amber Skip button.
 */
export function getHUDSkipButtonStyle(isPortrait: boolean): React.CSSProperties {
  return {
    height: isPortrait ? "clamp(36px, 8vw, 42px)" : "clamp(34px, 3.8vh, 42px)",
    minHeight: isPortrait ? "clamp(36px, 8vw, 42px)" : "clamp(34px, 3.8vh, 42px)",
    boxSizing: "border-box",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    padding: isPortrait ? "0 clamp(4px, 1.2vw, 12px)" : "0 clamp(12px, 1.2vw, 18px)",
    minWidth: isPortrait ? 0 : "max-content",
    borderRadius: "8px",
    border: "1px solid rgba(234, 179, 8, 0.45)",
    background: "rgba(234, 179, 8, 0.16)",
    color: "#eab308",
    fontSize: isPortrait ? "clamp(10px, 2.4vw, 13.5px)" : "clamp(12px, 1.1vw, 15px)",
    letterSpacing: isPortrait ? "-0.15px" : "normal",
    cursor: "pointer",
    fontWeight: 600,
    lineHeight: 1.15,
    textAlign: "center",
    whiteSpace: isPortrait ? "normal" : "nowrap",
    textWrap: "balance",
    hyphens: "auto",
    wordBreak: "normal",
    overflow: "hidden",
    flex: isPortrait ? 1 : "initial",
    flexShrink: 0,
    transition: "background 0.15s ease, border-color 0.15s ease",
  };
}

/**
 * Styling for the secondary translucent action button (e.g. Show/Hide Name).
 */
export function getHUDSecondaryButtonStyle(isPortrait: boolean): React.CSSProperties {
  return {
    height: isPortrait ? "clamp(36px, 8vw, 42px)" : "clamp(34px, 3.8vh, 42px)",
    minHeight: isPortrait ? "clamp(36px, 8vw, 42px)" : "clamp(34px, 3.8vh, 42px)",
    boxSizing: "border-box",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    padding: isPortrait ? "0 clamp(4px, 1.2vw, 12px)" : "0 clamp(12px, 1.2vw, 18px)",
    minWidth: isPortrait ? 0 : "max-content",
    borderRadius: "8px",
    border: "1px solid rgba(255, 255, 255, 0.3)",
    background: "rgba(255, 255, 255, 0.08)",
    color: "#fff",
    fontSize: isPortrait ? "clamp(10px, 2.4vw, 13.5px)" : "clamp(12px, 1.1vw, 15px)",
    letterSpacing: isPortrait ? "-0.15px" : "normal",
    fontWeight: 600,
    cursor: "pointer",
    lineHeight: 1.15,
    textAlign: "center",
    whiteSpace: isPortrait ? "normal" : "nowrap",
    textWrap: "balance",
    hyphens: "auto",
    wordBreak: "normal",
    overflow: "hidden",
    flex: isPortrait ? 1 : "initial",
    flexShrink: 0,
    transition: "background 0.15s ease, border-color 0.15s ease",
  };
}

/**
 * Hover handlers for Skip button.
 */
export const HUD_SKIP_BUTTON_HOVER = {
  onMouseEnter: (e: React.MouseEvent<HTMLButtonElement>) => {
    e.currentTarget.style.background = "rgba(234, 179, 8, 0.28)";
    e.currentTarget.style.borderColor = "rgba(234, 179, 8, 0.65)";
  },
  onMouseLeave: (e: React.MouseEvent<HTMLButtonElement>) => {
    e.currentTarget.style.background = "rgba(234, 179, 8, 0.16)";
    e.currentTarget.style.borderColor = "rgba(234, 179, 8, 0.45)";
  },
};

/**
 * Hover handlers for secondary action button.
 */
export const HUD_SECONDARY_BUTTON_HOVER = {
  onMouseEnter: (e: React.MouseEvent<HTMLButtonElement>) => {
    e.currentTarget.style.background = "rgba(255, 255, 255, 0.16)";
    e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.45)";
  },
  onMouseLeave: (e: React.MouseEvent<HTMLButtonElement>) => {
    e.currentTarget.style.background = "rgba(255, 255, 255, 0.08)";
    e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.3)";
  },
};

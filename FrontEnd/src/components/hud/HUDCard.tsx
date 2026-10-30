import React from "react";
import { getHUDCardStyle, type HUDCardStyleOptions } from "./hudStyles";

export interface HUDCardProps extends HUDCardStyleOptions {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * Reusable floating HUD card container.
 * Encapsulates responsive positioning, glassmorphic styling, and resilient
 * width/maxWidth bounds that prevent single-character text column squishing.
 */
export const HUDCard: React.FC<HUDCardProps> = ({
  isPortrait,
  isConstrained,
  isCompact,
  viewportWidth,
  mapTop,
  maxCompactWidth,
  children,
  className,
  style,
}) => {
  const baseStyle = getHUDCardStyle({
    isPortrait,
    isConstrained,
    isCompact,
    viewportWidth,
    mapTop,
    maxCompactWidth,
  });

  return (
    <div
      data-hud-card="true"
      className={className}
      style={{ ...baseStyle, ...style }}
    >
      {children}
    </div>
  );
};

export default HUDCard;

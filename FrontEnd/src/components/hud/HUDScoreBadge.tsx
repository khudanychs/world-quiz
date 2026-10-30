import React from "react";
import { getHUDScoreBadgeStyle } from "./hudStyles";

export interface HUDScoreBadgeProps {
  scoreText: string;
  isPortrait: boolean;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * HUD blue score indicator badge.
 */
export const HUDScoreBadge: React.FC<HUDScoreBadgeProps> = ({
  scoreText,
  isPortrait,
  className,
  style,
}) => {
  return (
    <span
      className={className}
      style={{
        ...getHUDScoreBadgeStyle(isPortrait),
        ...style,
      }}
    >
      {scoreText}
    </span>
  );
};

export default HUDScoreBadge;

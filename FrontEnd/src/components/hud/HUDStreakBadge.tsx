import React from "react";
import { getHUDStreakBadgeStyle } from "./hudStyles";

export interface HUDStreakBadgeProps {
  streak: number;
  threshold?: number;
  isPortrait: boolean;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * HUD streak badge with flame emoji (rendered when streak >= threshold).
 */
export const HUDStreakBadge: React.FC<HUDStreakBadgeProps> = ({
  streak,
  threshold = 3,
  isPortrait,
  className,
  style,
}) => {
  if (streak < threshold) {
    return null;
  }

  return (
    <span
      className={className}
      style={{
        ...getHUDStreakBadgeStyle(isPortrait),
        ...style,
      }}
    >
      🔥 {streak}
    </span>
  );
};

export default HUDStreakBadge;

import React from "react";
import { getHUDCounterBadgeStyle } from "./hudStyles";

export interface HUDCounterBadgeProps {
  current: number;
  total: number;
  isPortrait: boolean;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * HUD badge showing current question progress (e.g. "3/15").
 */
export const HUDCounterBadge: React.FC<HUDCounterBadgeProps> = ({
  current,
  total,
  isPortrait,
  className,
  style,
}) => {
  return (
    <span
      className={className}
      style={{
        ...getHUDCounterBadgeStyle(isPortrait),
        ...style,
      }}
    >
      {current}/{total}
    </span>
  );
};

export default HUDCounterBadge;

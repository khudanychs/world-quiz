import React from "react";
import {
  getHUDSkipButtonStyle,
  getHUDSecondaryButtonStyle,
  HUD_SKIP_BUTTON_HOVER,
  HUD_SECONDARY_BUTTON_HOVER,
} from "./hudStyles";

export interface HUDButtonProps {
  onClick: () => void;
  title: string;
  label: string;
  isPortrait: boolean;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * Amber Skip button used across game HUDs.
 */
export const HUDSkipButton: React.FC<HUDButtonProps> = ({
  onClick,
  title,
  label,
  isPortrait,
  className,
  style,
}) => {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={className}
      style={{
        ...getHUDSkipButtonStyle(isPortrait),
        ...style,
      }}
      {...HUD_SKIP_BUTTON_HOVER}
    >
      {label}
    </button>
  );
};

/**
 * Secondary action button (e.g. Show/Hide Name) used across game HUDs.
 */
export const HUDSecondaryButton: React.FC<HUDButtonProps> = ({
  onClick,
  title,
  label,
  isPortrait,
  className,
  style,
}) => {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={className}
      style={{
        ...getHUDSecondaryButtonStyle(isPortrait),
        ...style,
      }}
      {...HUD_SECONDARY_BUTTON_HOVER}
    >
      {label}
    </button>
  );
};

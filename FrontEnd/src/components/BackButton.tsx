import React from 'react';
import { BACK_BUTTON_STYLE, BACK_BUTTON_HOVER } from '../utils/sharedStyles';

interface BackButtonProps {
  onClick: () => void;
  label?: string;
  icon?: React.ReactNode;
  style?: React.CSSProperties;
  className?: string;
}

/**
 * A consistent, modern Back button used across the application.
 * Follows DRY principle by encapsulating shared styles and hover logic.
 */
export const BackButton: React.FC<BackButtonProps> = ({ 
  onClick, 
  label = "Back", 
  icon,
  style, 
  className 
}) => {
  // Default modern arrow icon if none provided
  const defaultIcon = (
    <svg 
      width="18" 
      height="18" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="3" 
      strokeLinecap="round" 
      strokeLinejoin="round"
      style={{ display: 'block' }}
    >
      <line x1="19" y1="12" x2="5" y2="12"></line>
      <polyline points="12 19 5 12 12 5"></polyline>
    </svg>
  );

  return (
    <button
      onClick={onClick}
      style={{ ...BACK_BUTTON_STYLE, ...style }}
      className={className}
      {...BACK_BUTTON_HOVER}
    >
      {icon || defaultIcon}
      <span>{label}</span>
    </button>
  );
};

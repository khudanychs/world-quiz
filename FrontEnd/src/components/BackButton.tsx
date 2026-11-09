import React, { useCallback, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { BACK_BUTTON_STYLE, BACK_BUTTON_HOVER } from '../utils/sharedStyles';

type BackButtonProps = {
  label?: string;
  icon?: React.ReactNode;
  style?: React.CSSProperties;
  className?: string;
  enableEscapeKey?: boolean;
} & (
  | { to: string; onNavigate?: () => void; onClick?: never }
  | { onClick: () => void; to?: never; onNavigate?: never }
);

/**
 * A consistent, modern Back button used across the application.
 * Follows DRY principle by encapsulating shared styles and hover logic.
 */
export const BackButton: React.FC<BackButtonProps> = ({ 
  onClick,
  to,
  onNavigate,
  label, 
  icon,
  style, 
  className,
  enableEscapeKey = true
}) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const displayLabel = label || t('nav.back');
  const activate = useCallback(() => {
    if (to !== undefined) {
      onNavigate?.();
      navigate(to);
    } else {
      onClick?.();
    }
  }, [navigate, onClick, onNavigate, to]);

  //ESC handler
  useEffect(() => {
    if(!enableEscapeKey) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape'){
        activate();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [activate, enableEscapeKey]);
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

  const content = <>{icon || defaultIcon}<span>{displayLabel}</span></>;
  const buttonStyle = { ...BACK_BUTTON_STYLE, ...style };

  if (to !== undefined) {
    return (
      <Link
        to={to}
        onClick={(event) => {
          // Opening another tab must not run exit actions in the current game.
          if (event.button === 0 && !event.ctrlKey && !event.metaKey && !event.shiftKey && !event.altKey) {
            onNavigate?.();
          }
        }}
        style={buttonStyle}
        className={className}
        {...BACK_BUTTON_HOVER}
      >
        {content}
      </Link>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      style={buttonStyle}
      className={className}
      {...BACK_BUTTON_HOVER}
    >
      {content}
    </button>
  );
};

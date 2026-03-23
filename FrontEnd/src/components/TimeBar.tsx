import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';

interface TimeBarProps {
  durationSeconds: number;
  maxPoints: number;
  isRunning: boolean;
  graceTimeMs?: number;
  onTimeUp?: () => void;
  onPointsChange?: (points: number) => void;
  initialElapsedMs?: number;
  onElapsedChange?: (elapsed: number) => void;
}

export function TimeBar({ 
  durationSeconds, 
  maxPoints, 
  isRunning, 
  graceTimeMs = 0,
  onTimeUp, 
  onPointsChange,
  initialElapsedMs = 0,
  onElapsedChange
}: TimeBarProps) {
  const { t } = useTranslation();
  const totalDurationMs = durationSeconds * 1000;
  const slowZoneThreshold = Math.min(500, maxPoints);
  const slowZoneStepMs = 100; // -1 point every 100ms in slow zone
  const shouldCapElapsed = typeof onTimeUp === 'function';
  const [elapsedMs, setElapsedMs] = useState(initialElapsedMs);
  const intervalRef = useRef<number | null>(null);

  useEffect(() => {
    setElapsedMs(initialElapsedMs);
  }, [initialElapsedMs]);

  useEffect(() => {
    if (!isRunning) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }

    intervalRef.current = window.setInterval(() => {
      setElapsedMs((prev) => {
        const newElapsed = prev + 50;

        if (shouldCapElapsed && newElapsed >= totalDurationMs) {
          if (intervalRef.current) clearInterval(intervalRef.current);
          return totalDurationMs;
        }

        return newElapsed;
      });
    }, 50);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isRunning, totalDurationMs, shouldCapElapsed]);

  // Notify parent about elapsed changes OUTSIDE the state updater
  useEffect(() => {
    if (elapsedMs > 0 && (!shouldCapElapsed || elapsedMs < totalDurationMs)) {
      onElapsedChange?.(elapsedMs);
    }
    if (shouldCapElapsed && elapsedMs >= totalDurationMs) {
      onTimeUp?.();
    }
  }, [elapsedMs, totalDurationMs, shouldCapElapsed, onElapsedChange, onTimeUp]);

  let currentPoints = maxPoints;
  if (elapsedMs > graceTimeMs) {
    const decayDuration = Math.max(1, totalDurationMs - graceTimeMs);
    const normalRatePerMs = maxPoints / decayDuration;
    const normalZonePoints = Math.max(0, maxPoints - slowZoneThreshold);
    const normalZoneDurationMs = normalZonePoints / Math.max(0.0001, normalRatePerMs);
    const decayElapsed = elapsedMs - graceTimeMs;

    if (decayElapsed <= normalZoneDurationMs) {
      currentPoints = Math.ceil(maxPoints - decayElapsed * normalRatePerMs);
    } else {
      const slowElapsed = decayElapsed - normalZoneDurationMs;
      const slowPenalty = Math.floor(slowElapsed / slowZoneStepMs);
      currentPoints = Math.max(0, slowZoneThreshold - slowPenalty);
    }
  }

  if (currentPoints < 0) currentPoints = 0;
  const percentage = (currentPoints / Math.max(1, maxPoints)) * 100;

  // Track previous points to avoid redundant callbacks
  const prevPointsRef = useRef(currentPoints);
  useEffect(() => {
    if (currentPoints !== prevPointsRef.current) {
      prevPointsRef.current = currentPoints;
      onPointsChange?.(currentPoints);
    }
  }, [currentPoints, onPointsChange]);

  // Gradient colors based on percentage
  let gradientStart, gradientEnd, glowColor;
  if (percentage >= 70) {
    gradientStart = '#10b981'; // Emerald
    gradientEnd = '#34d399';
    glowColor = 'rgba(16, 185, 129, 0.4)';
  } else if (percentage >= 40) {
    gradientStart = '#f59e0b'; // Amber
    gradientEnd = '#fbbf24';
    glowColor = 'rgba(245, 158, 11, 0.4)';
  } else {
    gradientStart = '#ef4444'; // Red
    gradientEnd = '#f87171';
    glowColor = 'rgba(239, 68, 68, 0.4)';
  }

  let badgeBg = "linear-gradient(135deg, rgba(16, 185, 129, 0.14), rgba(52, 211, 153, 0.16))";
  let badgeBorder = "1px solid rgba(16, 185, 129, 0.32)";
  let badgeGlow = "0 8px 32px rgba(0, 0, 0, 0.2), 0 0 10px rgba(16, 185, 129, 0.18)";
  let dangerPulse = "none";

  if (percentage < 70 && percentage >= 40) {
    badgeBg = "linear-gradient(135deg, rgba(245, 158, 11, 0.16), rgba(251, 191, 36, 0.18))";
    badgeBorder = "1px solid rgba(245, 158, 11, 0.36)";
    badgeGlow = "0 8px 32px rgba(0, 0, 0, 0.2), 0 0 12px rgba(245, 158, 11, 0.22)";
  } else if (percentage < 40) {
    const redIntensity = Math.min(1, (40 - percentage) / 40);
    badgeBg = `linear-gradient(135deg, rgba(239, 68, 68, ${0.16 + redIntensity * 0.14}), rgba(248, 113, 113, ${0.18 + redIntensity * 0.18}))`;
    badgeBorder = `1px solid rgba(239, 68, 68, ${0.34 + redIntensity * 0.34})`;
    badgeGlow = `0 8px 32px rgba(0, 0, 0, 0.2), 0 0 ${Math.round(12 + redIntensity * 16)}px rgba(239, 68, 68, ${0.2 + redIntensity * 0.2})`;
    dangerPulse = currentPoints <= slowZoneThreshold ? "barDangerPulse 0.9s ease-in-out infinite" : "none";
  }

  return (
    <div style={{ 
      width: '100%', 
      padding: 'clamp(8px, 2vw, 16px)',
      background: badgeBg,
      borderRadius: '12px',
      border: badgeBorder,
      backdropFilter: 'blur(10px)',
      boxShadow: badgeGlow,
      animation: dangerPulse,
      transition: 'background 120ms linear, border-color 120ms linear, box-shadow 120ms linear'
    }}>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: 'clamp(4px, 1.5vw, 8px)',
        gap: 'clamp(16px, 4vw, 32px)'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px'
        }}>
          <span style={{
            fontSize: 'clamp(11px, 2.5vw, 14px)',
            fontWeight: '700',
            background: 'linear-gradient(135deg, #60a5fa, #a78bfa)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            letterSpacing: '0.5px'
          }}>⚡ {t('timeBar.matchPoints')}</span>
        </div>
        <span style={{
          fontSize: 'clamp(16px, 3.5vw, 20px)',
          fontWeight: '800',
          color: '#fff',
          textShadow: `0 0 20px ${glowColor}, 0 2px 4px rgba(0,0,0,0.3)`,
          letterSpacing: '0.5px'
        }}>{currentPoints}</span>
      </div>
      
      <div style={{ 
        position: 'relative',
        height: 'clamp(16px, 3vw, 20px)', 
        background: 'linear-gradient(90deg, rgba(0,0,0,0.3), rgba(0,0,0,0.2))',
        borderRadius: '10px',
        overflow: 'hidden',
        boxShadow: 'inset 0 2px 8px rgba(0,0,0,0.3)',
        border: '1px solid rgba(255, 255, 255, 0.05)'
      }}>
        <div style={{
          position: 'absolute',
          height: '100%',
          width: `${percentage}%`,
          background: `linear-gradient(90deg, ${gradientStart}, ${gradientEnd})`,
          borderRadius: '12px',
          transition: 'width 0.05s linear',
          boxShadow: `0 0 20px ${glowColor}, inset 0 1px 0 rgba(255,255,255,0.3)`,
          overflow: 'hidden'
        }}>
          {/* Animated shine effect */}
          <div style={{
            position: 'absolute',
            top: 0,
            left: '-100%',
            width: '100%',
            height: '100%',
            background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)',
            animation: 'shine 2s infinite',
          }} />
        </div>
        
        {/* Percentage text overlay */}
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          fontSize: '11px',
          fontWeight: '700',
          color: percentage > 50 ? 'rgba(0,0,0,0.6)' : 'rgba(255,255,255,0.9)',
          textShadow: percentage > 50 ? 'none' : '0 1px 2px rgba(0,0,0,0.5)',
          letterSpacing: '0.5px',
          pointerEvents: 'none'
        }}>
          {Math.round(percentage)}%
        </div>
      </div>
      
      <style>{`
        @keyframes shine {
          0% { left: -100%; }
          50%, 100% { left: 200%; }
        }

        @keyframes barDangerPulse {
          0%, 100% {
            filter: saturate(1);
          }
          50% {
            filter: saturate(1.12);
          }
        }
      `}</style>
    </div>
  );
}
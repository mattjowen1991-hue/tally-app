import React, { useRef, useState, useCallback } from 'react';
import haptic from '../utils/haptics';

const PULL_THRESHOLD = 70;
const MAX_PULL = 120;

function isAtTop() {
  return window.scrollY <= 0;
}

export default function PullToRefresh({ onRefresh, children }) {
  const [pullDistance, setPullDistance] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [transitioning, setTransitioning] = useState(false);
  const startY = useRef(0);
  const isActive = useRef(false);
  const containerRef = useRef(null);
  const triggeredHaptic = useRef(false);
  const directionDecided = useRef(false);

  const onTouchStart = useCallback((e) => {
    if (refreshing) return;
    startY.current = e.touches[0].clientY;
    isActive.current = false;
    triggeredHaptic.current = false;
    directionDecided.current = false;
  }, [refreshing]);

  const onTouchMove = useCallback((e) => {
    if (refreshing) return;

    const dy = e.touches[0].clientY - startY.current;

    // Once we decide this isn't a pull-to-refresh, stop checking
    if (directionDecided.current && !isActive.current) return;

    // Scrolling up — never activate
    if (dy < 0) {
      isActive.current = false;
      directionDecided.current = true;
      return;
    }

    if (!isActive.current) {
      // Must be at top of page AND have pulled down > 10px
      if (!isAtTop()) {
        directionDecided.current = true;
        return;
      }
      if (dy > 10) {
        isActive.current = true;
        directionDecided.current = true;
      } else {
        return;
      }
    }

    // Rubber band effect
    const pull = Math.min(MAX_PULL, dy * 0.4);
    setPullDistance(pull);
    setTransitioning(false);

    // Haptic when crossing threshold
    if (pull >= PULL_THRESHOLD && !triggeredHaptic.current) {
      haptic.medium();
      triggeredHaptic.current = true;
    }
    if (pull < PULL_THRESHOLD && triggeredHaptic.current) {
      triggeredHaptic.current = false;
    }
  }, [refreshing]);

  const onTouchEnd = useCallback(() => {
    if (!isActive.current) return;
    isActive.current = false;
    directionDecided.current = false;

    if (pullDistance >= PULL_THRESHOLD) {
      setRefreshing(true);
      setTransitioning(true);
      setPullDistance(PULL_THRESHOLD);
      haptic.success();

      // Simulate refresh
      const doRefresh = onRefresh ? onRefresh() : Promise.resolve();
      Promise.resolve(doRefresh).then(() => {
        setTimeout(() => {
          setRefreshing(false);
          setTransitioning(true);
          setPullDistance(0);
        }, 800);
      });
    } else {
      setTransitioning(true);
      setPullDistance(0);
    }
  }, [pullDistance, onRefresh]);

  const pastThreshold = pullDistance >= PULL_THRESHOLD;
  const progress = Math.min(1, pullDistance / PULL_THRESHOLD);

  return (
    <div
      ref={containerRef}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      style={{ position: 'relative', overflow: 'visible' }}
    >
      {/* Pull indicator */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: '50%',
        transform: `translateX(-50%) translateY(${pullDistance - 50}px)`,
        transition: transitioning ? 'transform 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)' : 'none',
        zIndex: 10,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '36px',
        height: '36px',
        opacity: progress,
        pointerEvents: 'none',
      }}>
        <svg width="28" height="28" viewBox="0 0 28 28" style={{
          animation: refreshing ? 'pullSpin 0.7s linear infinite' : 'none',
        }}>
          {/* Track */}
          <circle cx="14" cy="14" r="11" fill="none"
            stroke="rgba(255,255,255,0.08)" strokeWidth="2.5" />
          {/* Progress arc */}
          <circle cx="14" cy="14" r="11" fill="none"
            stroke={pastThreshold ? 'var(--success)' : 'var(--accent-primary)'}
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeDasharray={`${69.1 * progress} 69.1`}
            style={{
              transform: 'rotate(-90deg)',
              transformOrigin: '50% 50%',
              transition: refreshing ? 'none' : 'stroke 0.2s',
            }}
          />
        </svg>
      </div>

      {/* Content with pull offset */}
      <div style={{
        transform: `translateY(${pullDistance}px)`,
        transition: transitioning ? 'transform 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)' : 'none',
      }}>
        {children}
      </div>
    </div>
  );
}
import React, { useRef, useState, useCallback, useEffect } from 'react';
import haptic from '../utils/haptics';

const LONG_PRESS_MS = 400;

export default function SwipeToDelete({ onDelete, onEdit, children }) {
  const [showActions, setShowActions] = useState(false);
  const timerRef = useRef(null);
  const startPos = useRef({ x: 0, y: 0 });
  const moved = useRef(false);

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const onTouchStart = useCallback((e) => {
    if (e.target.closest('button, input, select, a')) return;
    moved.current = false;
    startPos.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    
    timerRef.current = setTimeout(() => {
      if (!moved.current) {
        setShowActions(true);
        haptic.medium();
      }
    }, LONG_PRESS_MS);
  }, []);

  const onTouchMove = useCallback((e) => {
    const dx = Math.abs(e.touches[0].clientX - startPos.current.x);
    const dy = Math.abs(e.touches[0].clientY - startPos.current.y);
    if (dx > 8 || dy > 8) {
      moved.current = true;
      clearTimer();
    }
  }, [clearTimer]);

  const onTouchEnd = useCallback(() => {
    clearTimer();
  }, [clearTimer]);

  // Close when tapping outside the action buttons
  const actionsRef = useRef(null);
  useEffect(() => {
    if (!showActions) return;
    const handler = (e) => {
      // Don't dismiss if tapping on the action buttons
      if (actionsRef.current && actionsRef.current.contains(e.target)) return;
      setShowActions(false);
    };
    // Use a slight delay so this listener doesn't catch the same touch that opened it
    const tid = setTimeout(() => {
      document.addEventListener('touchstart', handler, { passive: true });
    }, 50);
    return () => {
      clearTimeout(tid);
      document.removeEventListener('touchstart', handler);
    };
  }, [showActions]);

  return (
    <div style={{ position: 'relative' }}>
      <div
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        {children}
      </div>

      {/* Action overlay */}
      {showActions && (
        <div ref={actionsRef} style={{
          position: 'absolute',
          bottom: '12px',
          right: '12px',
          display: 'flex',
          gap: '8px',
          zIndex: 10,
          animation: 'cardActionsIn 0.2s ease forwards',
        }}>
          {onEdit && (
            <button
              onClick={(e) => { e.stopPropagation(); onEdit(); setShowActions(false); }}
              style={{
                padding: '10px 18px',
                border: 'none',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
                color: '#fff',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '13px',
                fontWeight: '600',
                boxShadow: '0 4px 20px rgba(37, 99, 235, 0.4)',
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
              </svg>
              Edit
            </button>
          )}
          <button
            onClick={(e) => { e.stopPropagation(); haptic.error(); onDelete(); setShowActions(false); }}
            style={{
              padding: '10px 18px',
              border: 'none',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, var(--danger), #dc2626)',
              color: '#fff',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '13px',
              fontWeight: '600',
              boxShadow: '0 4px 20px rgba(220, 38, 38, 0.4)',
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="3 6 5 6 21 6" />
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
            </svg>
            Delete
          </button>
        </div>
      )}
    </div>
  );
}

import { useState, useRef, useCallback, useEffect } from 'react';
import haptic from '../utils/haptics';

export default function useSwipe(panelCount) {
  const [activePanel, setActivePanel] = useState(0);
  const activePanelRef = useRef(0);
  const swipeRef = useRef(null);
  const touchStartX = useRef(0);
  const touchStartY = useRef(0);
  const touchDeltaX = useRef(0);
  const isSwiping = useRef(false);
  const directionLocked = useRef(false);
  // Each panel now scrolls independently via CSS overflow-y: auto
  const visitedPanels = useRef(new Set([0])); // Panel 0 is visited on load

  useEffect(() => { activePanelRef.current = activePanel; }, [activePanel]);

  const getPanel = (idx) => swipeRef.current?.children[idx] || null;

  const switchToPanel = useCallback((fromPanel, toPanel) => {
    visitedPanels.current.add(fromPanel);

    setActivePanel(toPanel);
    activePanelRef.current = toPanel;
    if (swipeRef.current) swipeRef.current.style.transform = `translateX(${-toPanel * 100}%)`;

    document.body.setAttribute('data-switching', 'true');
    requestAnimationFrame(() => {
      const panel = getPanel(toPanel);
      const scrollPos = panel ? panel.scrollTop : 0;
      window.__tallySyncScrollDirect?.(scrollPos);
      visitedPanels.current.add(toPanel);
      
      setTimeout(() => {
        document.body.removeAttribute('data-switching');
      }, 200);
    });
  }, []);

  // Expose scroll positions and active panel so header can adjust them
  useEffect(() => {
    window.__tallyActivePanel = activePanelRef;
    window.__tallyVisitedPanels = visitedPanels;
    window.__tallyGetPanel = (idx) => swipeRef.current?.children[idx] || null;
    return () => { 
      delete window.__tallyActivePanel;
      delete window.__tallyVisitedPanels;
      delete window.__tallyGetPanel;
    };
  }, []);

  const finishSwipe = useCallback(() => {
    if (swipeRef.current) swipeRef.current.classList.remove('swiping');

    const threshold = window.innerWidth * 0.2;
    const panel = activePanelRef.current;
    let newPanel = panel;
    // Only consider switching if a real horizontal swipe was in progress
    if (isSwiping.current) {
      if (touchDeltaX.current < -threshold && panel < panelCount - 1) newPanel = panel + 1;
      else if (touchDeltaX.current > threshold && panel > 0) newPanel = panel - 1;
    }

    if (newPanel !== panel) {
      if (document.activeElement && (document.activeElement.tagName === 'INPUT' || document.activeElement.tagName === 'TEXTAREA')) {
        document.activeElement.blur();
      }
      switchToPanel(panel, newPanel);
      haptic.selection();
    } else {
      // Always snap back — even if the swipe didn't reach the lock threshold,
      // the transform may have been partially applied and would otherwise leave
      // the user stuck between panels.
      if (swipeRef.current) swipeRef.current.style.transform = `translateX(${-panel * 100}%)`;
    }

    touchDeltaX.current = 0;
    isSwiping.current = false;
    directionLocked.current = false;
  }, [panelCount, switchToPanel]);

  const onTouchMove = useCallback((e) => {
    const dx = e.touches[0].clientX - touchStartX.current;
    const dy = e.touches[0].clientY - touchStartY.current;

    if (!directionLocked.current && (Math.abs(dx) > 15 || Math.abs(dy) > 15)) {
      directionLocked.current = true;
      isSwiping.current = Math.abs(dx) > Math.abs(dy) * 1.5;
      // Horizontal swipe detected — blur any focused input to dismiss keyboard & paste popup
      if (isSwiping.current && document.activeElement && (document.activeElement.tagName === 'INPUT' || document.activeElement.tagName === 'TEXTAREA')) {
        document.activeElement.blur();
      }
      if (!isSwiping.current) {
        document.removeEventListener('touchmove', onTouchMove);
        document.removeEventListener('touchend', onTouchEnd);
        document.removeEventListener('touchcancel', onTouchEnd);
        return;
      }
    }

    if (!isSwiping.current) return;
    e.preventDefault();
    touchDeltaX.current = dx;

    const panel = activePanelRef.current;
    const atEdge = (panel === 0 && dx > 0) || (panel === panelCount - 1 && dx < 0);
    const effectiveDx = atEdge ? dx * 0.2 : dx;

    if (swipeRef.current) {
      swipeRef.current.classList.add('swiping');
      const base = -panel * 100;
      swipeRef.current.style.transform = `translateX(${base + (effectiveDx / window.innerWidth) * 100}%)`;
    }
  }, [panelCount]);

  const onTouchEnd = useCallback(() => {
    document.removeEventListener('touchmove', onTouchMove);
    document.removeEventListener('touchend', onTouchEnd);
    document.removeEventListener('touchcancel', onTouchEnd);
    finishSwipe();
  }, [onTouchMove, finishSwipe]);

  const handleTouchStart = useCallback((e) => {
    if (e.target.closest('.mobile-category-scroll')) return;
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
    touchDeltaX.current = 0;
    isSwiping.current = false;
    directionLocked.current = false;
    document.addEventListener('touchmove', onTouchMove, { passive: false });
    document.addEventListener('touchend', onTouchEnd, { passive: true });
    document.addEventListener('touchcancel', onTouchEnd, { passive: true });
  }, [onTouchMove, onTouchEnd]);

  useEffect(() => {
    return () => {
      document.removeEventListener('touchmove', onTouchMove);
      document.removeEventListener('touchend', onTouchEnd);
      document.removeEventListener('touchcancel', onTouchEnd);
    };
  }, [onTouchMove, onTouchEnd]);

  const goToPanel = (idx) => {
    const fromPanel = activePanelRef.current;
    if (idx !== fromPanel) {
      switchToPanel(fromPanel, idx);
    }
  };

  return { activePanel, swipeRef, handleTouchStart, goToPanel };
}
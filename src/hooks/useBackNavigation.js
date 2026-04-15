import { useEffect, useRef } from 'react';

// useBackNavigation — handles Android hardware back button + left-edge swipe-back.
export default function useBackNavigation(onBack, enabled = true) {
  const cbRef = useRef(onBack);
  cbRef.current = onBack;
  const lastFiredRef = useRef(0);

  // Coalesce calls within 600ms — Android sometimes fires both the swipe gesture
  // event AND a hardware back event for the same user action.
  const fire = () => {
    const now = Date.now();
    if (now - lastFiredRef.current < 600) return;
    lastFiredRef.current = now;
    cbRef.current?.();
  };

  // Android hardware back button
  useEffect(() => {
    if (!enabled) return;
    let cleanup;
    import('@capacitor/app').then(({ App }) => {
      const listener = App.addListener('backButton', () => fire());
      cleanup = () => listener.then ? listener.then(l => l.remove()) : listener.remove();
    }).catch(() => {});
    return () => { if (cleanup) cleanup(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled]);

  // Left-edge swipe gesture
  useEffect(() => {
    if (!enabled) return;
    let startX = null;
    let startY = null;
    let suppressNextClick = false;

    const onStart = (e) => {
      const x = e.touches[0].clientX;
      if (x < 30 || x > 150) return;
      startX = x;
      startY = e.touches[0].clientY;
    };

    const onEnd = (e) => {
      if (startX === null) return;
      const dx = e.changedTouches[0].clientX - startX;
      const dy = Math.abs(e.changedTouches[0].clientY - startY);
      startX = null;
      startY = null;
      if (dx > 80 && dy < dx * 0.7) {
        // Suppress the synthetic click that follows the touch — otherwise the
        // back-arrow button (which the swipe likely started over) would fire
        // its own onClick → handleClose → second haptic.
        suppressNextClick = true;
        setTimeout(() => { suppressNextClick = false; }, 500);
        fire();
      }
    };

    const onCancel = () => { startX = null; startY = null; };

    const onClick = (e) => {
      if (suppressNextClick) {
        e.preventDefault();
        e.stopPropagation();
        suppressNextClick = false;
      }
    };

    document.addEventListener('touchstart', onStart, { passive: true });
    document.addEventListener('touchend', onEnd, { passive: true });
    document.addEventListener('touchcancel', onCancel, { passive: true });
    document.addEventListener('click', onClick, { capture: true });
    return () => {
      document.removeEventListener('touchstart', onStart);
      document.removeEventListener('touchend', onEnd);
      document.removeEventListener('touchcancel', onCancel);
      document.removeEventListener('click', onClick, { capture: true });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled]);
}

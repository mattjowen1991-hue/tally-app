// Android WebView click fix
// After swipe gestures, WebView sometimes fails to synthesize click events
// from touch sequences. This detects that and dispatches the click manually.

let touchTarget = null;
let touchStartTime = 0;
let touchStartPos = { x: 0, y: 0 };
let clickFired = false;

document.addEventListener('touchstart', (e) => {
  if (e.touches.length !== 1) return;
  touchTarget = e.target;
  touchStartTime = Date.now();
  touchStartPos = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  clickFired = false;
}, { passive: true, capture: true });

document.addEventListener('touchend', (e) => {
  if (!touchTarget) return;
  const elapsed = Date.now() - touchStartTime;
  const touch = e.changedTouches[0];
  const dx = Math.abs(touch.clientX - touchStartPos.x);
  const dy = Math.abs(touch.clientY - touchStartPos.y);

  // Only for quick taps (< 300ms) with minimal movement (< 10px)
  if (elapsed < 300 && dx < 10 && dy < 10) {
    const target = touchTarget;

    // Wait briefly to see if the browser fires its own click
    setTimeout(() => {
      if (!clickFired) {
        // Find the closest clickable element
        const clickable = target.closest('button, a, [onclick], input, select, label');
        if (clickable) {
          clickable.click();
        }
      }
    }, 50);
  }

  touchTarget = null;
}, { passive: true, capture: true });

document.addEventListener('click', () => {
  clickFired = true;
}, { capture: true });

// Disable copy/paste/select context menu on all inputs.
// Tally has no use case for clipboard operations on user-entered fields.
export function initCustomClipboard() {
  // Block the native context menu (paste popup) on all inputs/textareas
  document.addEventListener('contextmenu', (e) => {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
      e.preventDefault();
    }
  }, { passive: false });

  // Detect long-press on inputs and clear any selection it creates so the
  // native action mode (selection handles + copy/paste menu) doesn't start.
  let pressTimer = null;
  let pressTarget = null;
  document.addEventListener('touchstart', (e) => {
    const el = e.target;
    if (el.tagName !== 'INPUT' && el.tagName !== 'TEXTAREA') return;
    pressTarget = el;
    pressTimer = setTimeout(() => {
      // After the long-press threshold, blur and re-focus to clear any
      // selection that was about to be created
      if (pressTarget) {
        const cursorPos = pressTarget.selectionStart;
        pressTarget.setSelectionRange(cursorPos, cursorPos);
      }
    }, 400);
  }, { passive: true });

  const cancelPress = () => {
    if (pressTimer) { clearTimeout(pressTimer); pressTimer = null; }
    pressTarget = null;
  };
  document.addEventListener('touchmove', cancelPress, { passive: true });
  document.addEventListener('touchend', cancelPress, { passive: true });
  document.addEventListener('touchcancel', cancelPress, { passive: true });
}

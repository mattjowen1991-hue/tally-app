// Disable copy/paste/select context menu on all inputs.
// Tally has no use case for clipboard operations on user-entered fields.
export function initCustomClipboard() {
  // Block the native context menu (paste popup) on all inputs/textareas
  document.addEventListener('contextmenu', (e) => {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
      e.preventDefault();
    }
  }, { passive: false });

  // Block selectionchange-driven action mode by clearing selection on touchend
  document.addEventListener('selectstart', (e) => {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
      // Allow selection inside inputs (needed for cursor positioning) but block
      // the long-press selection that triggers the action mode.
    }
  });
}

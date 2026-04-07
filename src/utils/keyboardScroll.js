// Keyboard-aware modal form viewport manager

export function initKeyboardScroll() {
  if (!window.visualViewport) return;

  // Move focus to next text input in the modal, skipping buttons/selects/hidden
  window.moveFocusToNext = (currentEl) => {
    const modal = currentEl.closest('.modal-content');
    if (!modal) return;

    const focusable = Array.from(
      modal.querySelectorAll('input:not([type="hidden"]):not([disabled]), textarea:not([disabled])')
    ).filter(el => {
      if (el.offsetParent === null) return false;
      if (el.type === 'date') return false;
      return true;
    });

    const idx = focusable.indexOf(currentEl);
    if (idx === -1) return;

    if (idx < focusable.length - 1) {
      focusable[idx + 1].focus();
    } else {
      currentEl.blur();
    }
  };

  // Ensure focused field is visible above keyboard
  function ensureFieldVisible(el, modal) {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const vv = window.visualViewport;
        const modalRect = modal.getBoundingClientRect();
        const elRect = el.getBoundingClientRect();

        // Visible bottom in modal coordinates
        const visibleBottomInModal = (vv.height + vv.offsetTop) - modalRect.top;
        const elBottomInModal = elRect.bottom - modalRect.top;

        if (elBottomInModal > visibleBottomInModal - 16) {
          modal.scrollTop += elBottomInModal - visibleBottomInModal + 80;
        }
      });
    });
  }

  // On focus, ensure the field is visible
  document.addEventListener('focusin', (e) => {
    const el = e.target;
    if (el.tagName !== 'INPUT' && el.tagName !== 'TEXTAREA') return;
    const modal = el.closest('.modal-content');
    if (!modal) return;
    ensureFieldVisible(el, modal);
  }, true);
}

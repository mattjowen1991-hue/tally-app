// Keyboard-aware modal form viewport manager
// Per spec: modal-owned scrolling, safe-area-aware, no blur-driven nav

export function initKeyboardScroll() {
  if (!window.visualViewport) return;

  // Move focus to next text input in the modal, skipping buttons/selects/hidden
  window.moveFocusToNext = (currentEl) => {
    const modal = currentEl.closest('.modal-content');
    if (!modal) return;

    const focusable = Array.from(
      modal.querySelectorAll('input:not([type="hidden"]):not([disabled]), textarea:not([disabled])')
    ).filter(el => {
      // Only visible, enabled text-entry fields
      if (el.offsetParent === null) return false;
      if (el.type === 'date') return false; // date pickers use native UI
      return true;
    });

    const idx = focusable.indexOf(currentEl);
    if (idx === -1) return;

    if (idx < focusable.length - 1) {
      // Move to next field
      const next = focusable[idx + 1];
      next.focus();
      ensureFieldVisible(next, modal);
    } else {
      // Last field — dismiss keyboard
      currentEl.blur();
    }
  };

  // Ensure a field is visible above the keyboard
  function ensureFieldVisible(el, modal) {
    // Use rAF x2 to wait for viewport to settle after keyboard opens
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const vv = window.visualViewport;
        const modalRect = modal.getBoundingClientRect();
        const elRect = el.getBoundingClientRect();

        // Visible bottom inside modal coordinate space
        const visibleBottomInModal = (vv.height + vv.offsetTop) - modalRect.top;
        const elBottomInModal = elRect.bottom - modalRect.top;
        const elTopInModal = elRect.top - modalRect.top;

        // Scroll down if field bottom is below visible area
        if (elBottomInModal > visibleBottomInModal - 16) {
          modal.scrollTop += elBottomInModal - visibleBottomInModal + 80;
        }
        // Scroll up if field top is above visible area
        else if (elTopInModal < modal.scrollTop) {
          modal.scrollTop = elTopInModal - 16;
        }
      });
    });
  }

  // On focus, ensure the field is visible above keyboard
  document.addEventListener('focusin', (e) => {
    const el = e.target;
    if (el.tagName !== 'INPUT' && el.tagName !== 'TEXTAREA') return;
    const modal = el.closest('.modal-content');
    if (!modal) return;

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        ensureFieldVisible(el, modal);
      });
    });
  }, true);

  // Resize modal height to match visible area above keyboard
  window.visualViewport.addEventListener('resize', () => {
    const vv = window.visualViewport;
    const safeTop = parseInt(
      getComputedStyle(document.documentElement).getPropertyValue('--sat') || '28'
    );
    const availableHeight = vv.height - safeTop;

    document.querySelectorAll('.modal-content').forEach(modal => {
      modal.style.maxHeight = `${availableHeight}px`;
    });
  });
}

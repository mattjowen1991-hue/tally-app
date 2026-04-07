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
      if (el.offsetParent === null) return false; // not visible
      if (el.type === 'date') return false; // date pickers use native UI
      return true;
    });

    const idx = focusable.indexOf(currentEl);
    if (idx === -1) return;

    if (idx < focusable.length - 1) {
      const next = focusable[idx + 1];
      next.focus();
    } else {
      // Last field — dismiss keyboard
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

        const visibleBottomInModal = (vv.height + vv.offsetTop) - modalRect.top;
        const elBottomInModal = elRect.bottom - modalRect.top;
        const elTopInModal = elRect.top - modalRect.top;

        if (elBottomInModal > visibleBottomInModal - 16) {
          modal.scrollTop += elBottomInModal - visibleBottomInModal + 80;
        } else if (elTopInModal < 0) {
          modal.scrollTop += elTopInModal - 16;
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

  // When keyboard opens/closes, resize modal to fill available space
  window.visualViewport.addEventListener('resize', () => {
    const vv = window.visualViewport;
    // Status bar height — use 28px as safe default
    const safeTop = 28;
    const availableHeight = vv.height - safeTop;

    document.querySelectorAll('.modal-content').forEach(modal => {
      if (availableHeight < window.screen.height * 0.7) {
        // Keyboard is open - constrain height to available space above keyboard
        modal.style.height = `${availableHeight}px`;
        modal.style.maxHeight = `${availableHeight}px`;
      } else {
        // Keyboard closed - restore natural sizing
        modal.style.height = '';
        modal.style.maxHeight = '';
      }
    });

    // After resize, re-ensure active field is visible
    const active = document.activeElement;
    if (active && (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA')) {
      const modal = active.closest('.modal-content');
      if (modal) ensureFieldVisible(active, modal);
    }
  });
}

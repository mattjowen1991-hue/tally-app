// Keyboard-aware modal form viewport manager

export function initKeyboardScroll() {
  if (!window.visualViewport) return;

  // Keep --vvh in sync with the visual viewport height.
  // This drives .form-screen-inner { height: var(--vvh) } so the form content
  // always fills exactly the space above the keyboard.
  function syncViewportHeight() {
    document.documentElement.style.setProperty('--vvh', window.visualViewport.height + 'px');
  }
  window.visualViewport.addEventListener('resize', syncViewportHeight);
  syncViewportHeight();

  // Prevent the main page from scrolling when a form-screen is open.
  // Touches in the gap area (inside form-screen but outside form-screen-body)
  // would otherwise propagate to the main page and cause the fixed form to drift.
  document.addEventListener('touchmove', (e) => {
    if (!document.querySelector('.form-screen.open')) return;
    if (e.target.closest('.form-screen-body')) return; // allow scroll inside body
    e.preventDefault();
  }, { passive: false });

  // Move focus to next text input in the modal, form-screen, or inline panel edit form
  window.moveFocusToNext = (currentEl) => {
    const container = currentEl.closest('.modal-content') || currentEl.closest('.form-screen-body') || currentEl.closest('.swipe-panel');
    if (!container) return;

    const focusable = Array.from(
      container.querySelectorAll('input:not([type="hidden"]):not([disabled]), textarea:not([disabled])')
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
  function ensureFieldVisible(el, container) {
    const vv = window.visualViewport;
    const containerRect = container.getBoundingClientRect();
    const elRect = el.getBoundingClientRect();

    // Keyboard top relative to container top
    const visibleBottom = (vv.height + vv.offsetTop) - containerRect.top;
    const elBottom = elRect.bottom - containerRect.top;

    if (elBottom > visibleBottom - 16) {
      container.scrollTop += elBottom - visibleBottom + 24;
    }
  }

  // On focus, scroll immediately then again once the keyboard has finished resizing
  document.addEventListener('focusin', (e) => {
    const el = e.target;
    if (el.tagName !== 'INPUT' && el.tagName !== 'TEXTAREA') return;
    const container = el.closest('.modal-content') || el.closest('.form-screen-body') || el.closest('.swipe-panel');
    if (!container) return;

    // First pass — keyboard may not be open yet
    requestAnimationFrame(() => ensureFieldVisible(el, container));

    // Second pass — fires once after the keyboard finishes resizing the viewport
    function onViewportResize() {
      window.visualViewport.removeEventListener('resize', onViewportResize);
      requestAnimationFrame(() => ensureFieldVisible(el, container));
    }
    window.visualViewport.addEventListener('resize', onViewportResize);
  }, true);
}

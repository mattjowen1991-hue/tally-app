// Keyboard-aware modal form viewport manager

export function initKeyboardScroll() {
  if (!window.visualViewport) return;

  // Keep --vvh in sync with the visual viewport height.
  // NumericInput temporarily takes over by setting window.__tallyVvhLocked = true
  // when the custom keypad is open — this stops viewport resize events from
  // overwriting the locked value.
  function syncViewportHeight() {
    if (window.__tallyVvhLocked) return;
    document.documentElement.style.setProperty('--vvh', window.visualViewport.height + 'px');
  }
  window.visualViewport.addEventListener('resize', syncViewportHeight);
  syncViewportHeight();

  // Prevent the main page from scrolling when a form-screen is open.
  document.addEventListener('touchmove', (e) => {
    if (!document.querySelector('.form-screen.open')) return;
    if (e.target.closest('.form-screen-body')) return;
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

    const visibleBottom = (vv.height + vv.offsetTop) - containerRect.top;
    const elBottom = elRect.bottom - containerRect.top;

    if (elBottom > visibleBottom - 16) {
      container.scrollTop += elBottom - visibleBottom + 24;
    }
  }

  // Tap outside an input → blur it (dismisses keyboard + native paste popup)
  document.addEventListener('touchstart', (e) => {
    const ae = document.activeElement;
    if (!ae || (ae.tagName !== 'INPUT' && ae.tagName !== 'TEXTAREA')) return;
    // If tapping on another input/button/select, let normal focus handling work
    if (e.target.closest('input, textarea, button, select, a, [role="button"]')) return;
    ae.blur();
  }, { passive: true });


  // On focus, scroll immediately then again once the keyboard has finished resizing
  document.addEventListener('focusin', (e) => {
    const el = e.target;
    if (el.tagName !== 'INPUT' && el.tagName !== 'TEXTAREA') return;
    const container = el.closest('.modal-content') || el.closest('.form-screen-body') || el.closest('.swipe-panel');
    if (!container) return;

    requestAnimationFrame(() => ensureFieldVisible(el, container));

    // Listen for viewport resize (when keyboard appears)
    let fired = false;
    function onViewportResize() {
      if (fired) return;
      fired = true;
      window.visualViewport.removeEventListener('resize', onViewportResize);
      requestAnimationFrame(() => ensureFieldVisible(el, container));
    }
    window.visualViewport.addEventListener('resize', onViewportResize);

    // Fallback timer — Android's numeric keypad doesn't always fire visualviewport
    // resize events reliably, so we run scroll anyway after the keyboard's typical
    // animation duration. Safe because ensureFieldVisible is a no-op if already visible.
    setTimeout(() => {
      if (fired) return;
      fired = true;
      window.visualViewport.removeEventListener('resize', onViewportResize);
      ensureFieldVisible(el, container);
    }, 350);
    setTimeout(() => ensureFieldVisible(el, container), 600);
  }, true);
}

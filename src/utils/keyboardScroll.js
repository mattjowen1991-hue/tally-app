// Smooth keyboard handling for modals
// Only moves modal when a real text keyboard is open (not selects/dropdowns)

export function initKeyboardScroll() {
  const viewport = window.visualViewport;
  if (!viewport) return () => {};

  let currentKeyboardHeight = 0;
  let rafId = null;
  let isTextInputFocused = false;

  const TEXT_INPUTS = ['text', 'number', 'email', 'tel', 'password', 'search', 'url'];

  const isRealKeyboardInput = (el) => {
    if (!el) return false;
    if (el.tagName === 'TEXTAREA') return true;
    if (el.tagName === 'INPUT' && TEXT_INPUTS.includes(el.type || 'text')) return true;
    return false;
  };

  const onFocusIn = (e) => {
    isTextInputFocused = isRealKeyboardInput(e.target);
  };

  const onFocusOut = () => {
    isTextInputFocused = false;
  };

  const applyModalPosition = (keyboardHeight) => {
    const modals = document.querySelectorAll('.modal-content');
    modals.forEach(modal => {
      if (keyboardHeight > 100) {
        modal.style.transform = `translateY(-${keyboardHeight}px)`;
        modal.style.maxHeight = `${viewport.height - 8}px`;
      } else {
        modal.style.transform = 'translateY(0)';
        modal.style.maxHeight = '';
      }
    });
  };

  const onViewportResize = () => {
    // Only respond if a real text input is focused
    if (!isTextInputFocused) return;

    if (rafId) cancelAnimationFrame(rafId);
    rafId = requestAnimationFrame(() => {
      const keyboardHeight = Math.max(0, window.innerHeight - viewport.height - viewport.offsetTop);

      // Ignore tiny fluctuations (less than 50px change) to prevent bouncing
      if (Math.abs(keyboardHeight - currentKeyboardHeight) < 50) return;

      currentKeyboardHeight = keyboardHeight;
      applyModalPosition(keyboardHeight);

      // Scroll focused input into view
      const el = document.activeElement;
      if (el && keyboardHeight > 100) {
        setTimeout(() => {
          const modal = el.closest('.modal-content');
          if (!modal) return;
          const elRect = el.getBoundingClientRect();
          const modalBottom = modal.getBoundingClientRect().bottom;
          if (elRect.bottom > modalBottom - 20) {
            modal.scrollTop += elRect.bottom - modalBottom + 80;
          }
        }, 50);
      }
    });
  };

  // When keyboard closes (focus leaves text input), reset modal position
  const onKeyboardClose = () => {
    if (rafId) cancelAnimationFrame(rafId);
    rafId = requestAnimationFrame(() => {
      currentKeyboardHeight = 0;
      applyModalPosition(0);
    });
  };

  document.addEventListener('focusin', onFocusIn);
  document.addEventListener('focusout', (e) => {
    onFocusOut();
    // Small delay to check if focus moved to another text input
    setTimeout(() => {
      if (!isRealKeyboardInput(document.activeElement)) {
        onKeyboardClose();
      }
    }, 100);
  });

  viewport.addEventListener('resize', onViewportResize);

  return () => {
    document.removeEventListener('focusin', onFocusIn);
    document.removeEventListener('focusout', onFocusOut);
    viewport.removeEventListener('resize', onViewportResize);
    if (rafId) cancelAnimationFrame(rafId);
  };
}

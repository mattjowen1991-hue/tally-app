// Keyboard handling for modals
// Uses resizes-visual so layout never shifts, then manually pushes modal up

export function initKeyboardScroll() {
  const viewport = window.visualViewport;
  if (!viewport) return () => {};

  const TEXT_INPUTS = ['text', 'number', 'email', 'tel', 'password', 'search', 'url'];
  let keyboardTimer = null;
  let lastKeyboardHeight = 0;

  const isTextInput = (el) => {
    if (!el) return false;
    if (el.tagName === 'TEXTAREA') return true;
    if (el.tagName === 'INPUT' && TEXT_INPUTS.includes(el.type || 'text')) return true;
    return false;
  };

  const pushModalUp = () => {
    const modal = document.querySelector('.modal-content');
    if (!modal) return;

    const keyboardHeight = Math.max(0, window.innerHeight - viewport.height);
    if (Math.abs(keyboardHeight - lastKeyboardHeight) < 30) return;
    lastKeyboardHeight = keyboardHeight;

    if (keyboardHeight > 100) {
      modal.style.transform = `translateY(-${keyboardHeight}px)`;
    } else {
      modal.style.transform = 'translateY(0)';
    }
  };

  const onFocusIn = (e) => {
    if (!isTextInput(e.target)) return;
    // Wait for keyboard to fully open before moving modal
    clearTimeout(keyboardTimer);
    keyboardTimer = setTimeout(pushModalUp, 350);
  };

  const onFocusOut = () => {
    clearTimeout(keyboardTimer);
    setTimeout(() => {
      if (isTextInput(document.activeElement)) return;
      lastKeyboardHeight = 0;
      const modal = document.querySelector('.modal-content');
      if (modal) modal.style.transform = 'translateY(0)';
    }, 100);
  };

  document.addEventListener('focusin', onFocusIn);
  document.addEventListener('focusout', onFocusOut);

  return () => {
    document.removeEventListener('focusin', onFocusIn);
    document.removeEventListener('focusout', onFocusOut);
    clearTimeout(keyboardTimer);
  };
}

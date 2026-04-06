// Keyboard handling for modals
// Core principle: slide up ONCE on first text focus, stay locked, reset on modal close

export function initKeyboardScroll() {
  const viewport = window.visualViewport;
  if (!viewport) return () => {};

  const TEXT_INPUTS = ['text', 'number', 'email', 'tel', 'password', 'search', 'url'];

  const isTextInput = (el) => {
    if (!el) return false;
    if (el.tagName === 'TEXTAREA') return true;
    if (el.tagName === 'INPUT' && TEXT_INPUTS.includes(el.type || 'text')) return true;
    return false;
  };

  // Lock the modal at its current position — called once when keyboard opens
  const lockModalUp = () => {
    const modals = document.querySelectorAll('.modal-content');
    if (!modals.length) return;

    const keyboardHeight = Math.max(0, window.innerHeight - viewport.height);
    if (keyboardHeight < 100) return; // keyboard not actually open

    modals.forEach(modal => {
      // Only lock if not already locked
      if (modal.dataset.keyboardLocked) return;
      modal.dataset.keyboardLocked = 'true';
      modal.style.transform = `translateY(-${keyboardHeight}px)`;
      modal.style.maxHeight = `${viewport.height - 8}px`;

      // Scroll focused input into view within the modal
      setTimeout(() => {
        const el = document.activeElement;
        if (!el) return;
        const elRect = el.getBoundingClientRect();
        const modalBottom = modal.getBoundingClientRect().bottom;
        if (elRect.bottom > modalBottom - 20) {
          modal.scrollTop += elRect.bottom - modalBottom + 80;
        }
      }, 100);
    });
  };

  // Release all modals back to natural position
  const unlockModals = () => {
    const modals = document.querySelectorAll('.modal-content');
    modals.forEach(modal => {
      if (!modal.dataset.keyboardLocked) return;
      delete modal.dataset.keyboardLocked;
      modal.style.transform = 'translateY(0)';
      modal.style.maxHeight = '';
    });
  };

  // When a text input is focused — lock modal up
  const onFocusIn = (e) => {
    if (isTextInput(e.target)) {
      // Small delay to let keyboard finish opening
      setTimeout(lockModalUp, 300);
    }
  };

  // When focus leaves — check if we should unlock
  const onFocusOut = () => {
    setTimeout(() => {
      // If focus moved to another text input, stay locked
      if (isTextInput(document.activeElement)) return;
      // If focus moved to a select/button/etc within modal, stay locked too
      const modal = document.activeElement?.closest?.('.modal-content');
      if (modal?.dataset.keyboardLocked) return;
      // Focus left entirely — unlock
      unlockModals();
    }, 150);
  };

  // Mutation observer to detect when modal is removed from DOM (closed)
  // Reset any locked state when that happens
  const observer = new MutationObserver(() => {
    const modals = document.querySelectorAll('.modal-content');
    if (!modals.length) unlockModals();
  });
  observer.observe(document.body, { childList: true, subtree: true });

  document.addEventListener('focusin', onFocusIn);
  document.addEventListener('focusout', onFocusOut);

  return () => {
    document.removeEventListener('focusin', onFocusIn);
    document.removeEventListener('focusout', onFocusOut);
    observer.disconnect();
  };
}

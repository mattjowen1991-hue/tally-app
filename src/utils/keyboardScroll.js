export function initKeyboardScroll() {
  document.addEventListener('focusin', (e) => {
    const el = e.target;
    if (!el.closest('.modal-content')) return;
    if (el.tagName !== 'INPUT' && el.tagName !== 'TEXTAREA') return;

    // Wait for keyboard to fully open then scroll field into view
    setTimeout(() => {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 350);
  }, true);
}

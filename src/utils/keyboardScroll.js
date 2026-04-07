export function initKeyboardScroll() {
  if (!window.visualViewport) return;

  document.addEventListener('focusin', (e) => {
    const el = e.target;
    if (el.tagName !== 'INPUT' && el.tagName !== 'TEXTAREA') return;
    if (!el.closest('.modal-content')) return;

    // Wait for interactive-widget=resizes-content to finish resizing
    // then scroll the field to just visible above keyboard
    setTimeout(() => {
      el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }, 300);
  }, true);
}

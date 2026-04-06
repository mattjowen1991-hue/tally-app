export function initKeyboardScroll() {
  if (!window.visualViewport) return;

  let recentHeight = window.visualViewport.height;
  let keyboardHeight = 0;

  setInterval(() => {
    const h = window.visualViewport.height;
    if (h > recentHeight * 0.85) recentHeight = h;
  }, 100);

  window.visualViewport.addEventListener('resize', () => {
    keyboardHeight = recentHeight - window.visualViewport.height;
    const modals = document.querySelectorAll('.modal-content');
    if (keyboardHeight > 50) {
      // Keyboard open: set padding to keyboard height so content is scrollable past it
      modals.forEach(el => { el.style.paddingBottom = `${keyboardHeight}px`; });
    } else {
      // Keyboard closed: reset padding
      keyboardHeight = 0;
      modals.forEach(el => { el.style.paddingBottom = ''; });
      recentHeight = window.visualViewport.height;
    }
  });

  document.addEventListener('focusin', (e) => {
    const el = e.target;
    if (!el.closest('.modal-content')) return;
    if (el.tagName !== 'INPUT' && el.tagName !== 'TEXTAREA') return;

    setTimeout(() => {
      const modal = el.closest('.modal-content');
      const elRect = el.getBoundingClientRect();
      const visibleBottom = window.visualViewport.height;
      const scrollAmount = elRect.bottom - visibleBottom + 80;
      if (scrollAmount > 0) {
        modal.scrollTop += scrollAmount;
      }
    }, 500);
  }, true);
}

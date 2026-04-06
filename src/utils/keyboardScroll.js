export function initKeyboardScroll() {
  if (!window.visualViewport) return;

  let recentHeight = window.visualViewport.height;

  setInterval(() => {
    const h = window.visualViewport.height;
    if (h > recentHeight * 0.85) recentHeight = h;
  }, 100);

  document.addEventListener('focusin', (e) => {
    const el = e.target;
    if (!el.closest('.modal-content')) return;
    if (el.tagName !== 'INPUT' && el.tagName !== 'TEXTAREA') return;

    setTimeout(() => {
      const modal = el.closest('.modal-content');
      const elRect = el.getBoundingClientRect();
      // Use visualViewport.height directly - this is the actual visible area above keyboard
      const visibleBottom = window.visualViewport.height;
      const scrollAmount = elRect.bottom - visibleBottom + 80;

      console.log('[KB] field:', el.placeholder, 'elBottom:', Math.round(elRect.bottom), 'visibleBottom:', Math.round(visibleBottom), 'scrollBy:', Math.round(scrollAmount));

      if (scrollAmount > 0) {
        modal.scrollTop += scrollAmount;
      }
    }, 500);
  }, true);
}

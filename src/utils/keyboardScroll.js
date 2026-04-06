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
      const keyboardHeight = recentHeight - window.visualViewport.height;
      const modal = el.closest('.modal-content');
      const elRect = el.getBoundingClientRect();
      const visibleBottom = window.innerHeight - Math.max(keyboardHeight, 0);
      
      // If the element is below the visible area (behind keyboard), scroll it up
      if (elRect.bottom > visibleBottom - 20) {
        const scrollAmount = elRect.bottom - visibleBottom + 80;
        modal.scrollTop += scrollAmount;
      }
    }, 350);
  }, true);
}

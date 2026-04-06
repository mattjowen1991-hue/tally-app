export function initKeyboardScroll() {
  if (!window.visualViewport) return;

  let recentHeight = window.visualViewport.height;

  setInterval(() => {
    const h = window.visualViewport.height;
    if (h > recentHeight * 0.85) recentHeight = h;
  }, 100);

  window.visualViewport.addEventListener('resize', () => {
    const keyboardHeight = recentHeight - window.visualViewport.height;
    // Set padding-bottom to exactly keyboard height so no gap is visible
    document.querySelectorAll('.modal-content').forEach(el => {
      el.style.paddingBottom = keyboardHeight > 50 ? `${keyboardHeight}px` : '24px';
    });
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

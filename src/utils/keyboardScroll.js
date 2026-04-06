export function initKeyboardScroll() {
  if (!window.visualViewport) return;

  document.addEventListener('focusin', (e) => {
    const el = e.target;
    if (!el.closest('.modal-content')) return;
    if (el.tagName !== 'INPUT' && el.tagName !== 'TEXTAREA') return;

    setTimeout(() => {
      const modal = el.closest('.modal-content');
      const elRect = el.getBoundingClientRect();
      const visibleBottom = window.visualViewport.height;
      const scrollAmount = elRect.bottom - visibleBottom + 80;
      const scrollBefore = modal.scrollTop;

      if (scrollAmount > 0) {
        modal.scrollTop += scrollAmount;
      }

      console.log('[KB] field:', el.placeholder, 
        'elBottom:', Math.round(elRect.bottom), 
        'visibleBottom:', Math.round(visibleBottom),
        'scrollBy:', Math.round(scrollAmount),
        'scrollBefore:', Math.round(scrollBefore),
        'scrollAfter:', Math.round(modal.scrollTop),
        'modalScrollHeight:', modal.scrollHeight,
        'modalClientHeight:', modal.clientHeight);
    }, 500);
  }, true);
}

export function initKeyboardScroll() {
  if (!window.visualViewport) return;

  let raf1, raf2;

  document.addEventListener('focusin', (e) => {
    const el = e.target;
    if (el.tagName !== 'INPUT' && el.tagName !== 'TEXTAREA') return;
    const modal = el.closest('.modal-content');
    if (!modal) return;

    cancelAnimationFrame(raf1);
    cancelAnimationFrame(raf2);

    raf1 = requestAnimationFrame(() => {
      raf2 = requestAnimationFrame(() => {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      });
    });
  }, true);
}

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

    // Double rAF waits for viewport to fully settle after keyboard opens
    raf1 = requestAnimationFrame(() => {
      raf2 = requestAnimationFrame(() => {
        const vv = window.visualViewport;
        const modalRect = modal.getBoundingClientRect();
        const elRect = el.getBoundingClientRect();

        // Visible bottom INSIDE modal coordinates (ChatGPT fix)
        const visibleBottomInModal = (vv.height + vv.offsetTop) - modalRect.top;
        const elBottomInModal = elRect.bottom - modalRect.top;
        const delta = elBottomInModal - visibleBottomInModal + 24;

        if (delta > 0) {
          modal.scrollTop += delta;
        }
      });
    });
  }, true);
}

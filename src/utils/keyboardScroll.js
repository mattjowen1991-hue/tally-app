export function initKeyboardScroll() {
  if (!window.visualViewport) return;

  function scrollFieldIntoView(el, modal) {
    const vv = window.visualViewport;
    const modalRect = modal.getBoundingClientRect();
    const elRect = el.getBoundingClientRect();

    // Visible bottom INSIDE the modal, accounting for visualViewport offset
    const visibleBottomInModal =
      (vv.height + vv.offsetTop) - modalRect.top;

    // Element bottom in modal coordinates
    const elBottomInModal = elRect.bottom - modalRect.top;

    const delta = elBottomInModal - visibleBottomInModal + 24;
    if (delta > 0) {
      modal.scrollTop += delta;
    }
  }

  function layoutModal(modal) {
    const vv = window.visualViewport;
    if (!vv) return;
    const topOffset = 28;
    modal.style.top = `${topOffset}px`;
    modal.style.height = `${vv.height - topOffset}px`;
    modal.style.bottom = 'auto';
  }

  function resetModal(modal) {
    modal.style.top = '';
    modal.style.height = '';
    modal.style.bottom = '';
  }

  // Resize modal to fit visible viewport when keyboard opens/closes
  window.visualViewport.addEventListener('resize', () => {
    document.querySelectorAll('.modal-content').forEach(modal => {
      const vv = window.visualViewport;
      const keyboardOpen = vv.height < window.screen.height * 0.75;
      if (keyboardOpen) {
        layoutModal(modal);
      } else {
        resetModal(modal);
      }
    });
  });

  // Scroll focused field into view using double rAF to wait for viewport to settle
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
        scrollFieldIntoView(el, modal);
      });
    });
  }, true);
}

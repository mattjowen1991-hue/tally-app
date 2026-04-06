// Push modal up above keyboard when it opens
// Uses visualViewport API which gives the actual visible area

export function initKeyboardScroll() {
  const viewport = window.visualViewport;
  if (!viewport) return () => {};

  const onViewportChange = () => {
    const modals = document.querySelectorAll('.modal-content');
    if (!modals.length) return;

    // How much has the viewport shrunk? That's the keyboard height
    const keyboardHeight = window.innerHeight - viewport.height - viewport.offsetTop;

    modals.forEach(modal => {
      if (keyboardHeight > 100) {
        // Keyboard is open — push modal up
        modal.style.transform = `translateY(-${keyboardHeight}px)`;
        modal.style.transition = 'transform 0.25s ease';
        modal.style.maxHeight = `${viewport.height - 8}px`;
      } else {
        // Keyboard closed — reset
        modal.style.transform = 'translateY(0)';
        modal.style.maxHeight = '';
      }
    });

    // Also scroll focused input into view within the modal
    const el = document.activeElement;
    if (el && ['INPUT', 'TEXTAREA', 'SELECT'].includes(el.tagName) && keyboardHeight > 100) {
      setTimeout(() => {
        const modal = el.closest('.modal-content');
        if (!modal) return;
        const elRect = el.getBoundingClientRect();
        const modalRect = modal.getBoundingClientRect();
        const visibleBottom = modalRect.bottom;
        if (elRect.bottom > visibleBottom - 20) {
          modal.scrollTop += elRect.bottom - visibleBottom + 80;
        }
      }, 50);
    }
  };

  viewport.addEventListener('resize', onViewportChange);
  viewport.addEventListener('scroll', onViewportChange);

  return () => {
    viewport.removeEventListener('resize', onViewportChange);
    viewport.removeEventListener('scroll', onViewportChange);
  };
}

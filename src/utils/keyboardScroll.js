export function initKeyboardScroll() {
  if (!window.visualViewport) return;

  let recentHeight = window.visualViewport.height;

  setInterval(() => {
    const h = window.visualViewport.height;
    if (h > recentHeight * 0.85) recentHeight = h;
  }, 100);

  window.visualViewport.addEventListener('resize', () => {
    const currentHeight = window.visualViewport.height;
    const keyboardHeight = recentHeight - currentHeight;

    if (keyboardHeight > 50) {
      // Keyboard just opened - scroll active field into view above keyboard
      setTimeout(() => {
        const el = document.activeElement;
        if (el && el.closest('.modal-content')) {
          el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
      }, 100);
    } else {
      recentHeight = currentHeight;
    }
  });
}

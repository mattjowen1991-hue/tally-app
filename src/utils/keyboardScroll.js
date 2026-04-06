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
      // Keyboard open - add padding so content scrolls above keyboard
      document.querySelectorAll('.modal-content').forEach(el => {
        el.style.paddingBottom = `${keyboardHeight + 24}px`;
      });
    } else {
      // Keyboard closed - remove all padding
      document.querySelectorAll('.modal-content').forEach(el => {
        el.style.paddingBottom = '24px';
      });
      recentHeight = currentHeight;
    }
  });
}

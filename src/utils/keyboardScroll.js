export function initKeyboardScroll() {
  if (!window.visualViewport) return;

  let recentHeight = window.visualViewport.height;

  setInterval(() => {
    const h = window.visualViewport.height;
    if (h > recentHeight * 0.85) {
      recentHeight = h;
    }
  }, 100);

  window.visualViewport.addEventListener('resize', () => {
    const currentHeight = window.visualViewport.height;
    const keyboardHeight = recentHeight - currentHeight;

    if (keyboardHeight > 50) {
      document.documentElement.style.setProperty('--keyboard-height', `${keyboardHeight}px`);
    } else {
      document.documentElement.style.setProperty('--keyboard-height', '0px');
      recentHeight = currentHeight;
    }
  });
}

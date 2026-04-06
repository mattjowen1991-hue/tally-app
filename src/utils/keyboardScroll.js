export function initKeyboardScroll() {
  if (!window.visualViewport) return;

  // Capture the full screen height once on load, before any keyboard interaction
  const fullHeight = window.screen.height;

  window.visualViewport.addEventListener('resize', () => {
    const keyboardHeight = fullHeight - window.visualViewport.height;
    if (keyboardHeight > 50) {
      document.documentElement.style.setProperty('--keyboard-height', `${keyboardHeight}px`);
    } else {
      document.documentElement.style.setProperty('--keyboard-height', '0px');
    }
  });
}

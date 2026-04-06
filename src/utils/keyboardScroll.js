export function initKeyboardScroll() {
  if (!window.visualViewport) return;

  // Sample the viewport height continuously so we always have a recent "before keyboard" value
  let recentHeight = window.visualViewport.height;
  let samplingInterval = setInterval(() => {
    // Only update when no keyboard is open (height close to full screen)
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

  // Clean up interval if needed
  return () => clearInterval(samplingInterval);
}

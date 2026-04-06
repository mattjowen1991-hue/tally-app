export function initKeyboardScroll() {
  if (!window.visualViewport) return;

  // Store the true full height before any keyboard interaction
  // Use visualViewport.height at init time - this is the real available height
  let baselineHeight = window.visualViewport.height;

  window.visualViewport.addEventListener('resize', () => {
    const currentHeight = window.visualViewport.height;
    const keyboardHeight = baselineHeight - currentHeight;

    if (keyboardHeight > 50) {
      // Keyboard is open - update the padding
      document.documentElement.style.setProperty('--keyboard-height', `${keyboardHeight}px`);
    } else {
      // Keyboard is closed - reset padding AND update baseline
      // (important: only update baseline when keyboard is closed)
      document.documentElement.style.setProperty('--keyboard-height', '0px');
      baselineHeight = currentHeight;
    }
  });
}

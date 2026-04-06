export function initKeyboardScroll() {
  if (!window.visualViewport) return;

  let baselineHeight = window.visualViewport.height;

  window.visualViewport.addEventListener('resize', () => {
    const currentHeight = window.visualViewport.height;
    const diff = baselineHeight - currentHeight;

    if (diff > 50) {
      // Keyboard opened - set the height
      document.documentElement.style.setProperty('--keyboard-height', `${diff}px`);
    } else if (currentHeight > baselineHeight - 50) {
      // Viewport grew (keyboard fully closed) - only reset baseline if no input is focused
      const activeEl = document.activeElement;
      const isTextInput = activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA');
      if (!isTextInput) {
        document.documentElement.style.setProperty('--keyboard-height', '0px');
        baselineHeight = currentHeight;
      }
    }
  });
}

export function initKeyboardScroll() {
  if (!window.visualViewport) return;

  let baselineHeight = window.visualViewport.height;

  // Capture baseline the moment a text input is tapped, before keyboard opens
  document.addEventListener('focusin', (e) => {
    const isTextInput = e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA';
    if (isTextInput) {
      baselineHeight = window.visualViewport.height;
    }
  }, true);

  window.visualViewport.addEventListener('resize', () => {
    const currentHeight = window.visualViewport.height;
    const keyboardHeight = baselineHeight - currentHeight;

    if (keyboardHeight > 50) {
      document.documentElement.style.setProperty('--keyboard-height', `${keyboardHeight}px`);
    } else {
      document.documentElement.style.setProperty('--keyboard-height', '0px');
    }
  });
}

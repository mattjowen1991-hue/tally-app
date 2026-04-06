export function initKeyboardScroll() {
  if (!window.visualViewport) return;

  let baselineHeight = window.visualViewport.height;

  document.addEventListener('focusin', (e) => {
    const isTextInput = e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA';
    if (isTextInput) {
      baselineHeight = window.visualViewport.height;
      console.log('[KB] focusin baseline:', baselineHeight);
    }
  }, true);

  window.visualViewport.addEventListener('resize', () => {
    const currentHeight = window.visualViewport.height;
    const keyboardHeight = baselineHeight - currentHeight;
    console.log('[KB] resize - baseline:', baselineHeight, 'current:', currentHeight, 'keyboardHeight:', keyboardHeight);

    if (keyboardHeight > 50) {
      document.documentElement.style.setProperty('--keyboard-height', `${keyboardHeight}px`);
    } else {
      document.documentElement.style.setProperty('--keyboard-height', '0px');
    }
  });
}

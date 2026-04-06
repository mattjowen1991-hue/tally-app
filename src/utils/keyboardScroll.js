export function initKeyboardScroll() {
  if (!window.visualViewport) return;

  window.visualViewport.addEventListener('resize', () => {
    // The keyboard height is the difference between the full window height
    // and the current visual viewport height (what's visible above the keyboard)
    const keyboardHeight = window.innerHeight - window.visualViewport.height;
    if (keyboardHeight > 50) {
      document.documentElement.style.setProperty('--keyboard-height', `${keyboardHeight}px`);
    } else {
      document.documentElement.style.setProperty('--keyboard-height', '0px');
    }
  });
}

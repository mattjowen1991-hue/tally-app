import { Keyboard } from '@capacitor/keyboard';

export function initKeyboardScroll() {
  // Try both events - didShow fires after keyboard is fully open
  Keyboard.addListener('keyboardDidShow', (info) => {
    document.documentElement.style.setProperty('--keyboard-height', `${info.keyboardHeight}px`);
  });
  Keyboard.addListener('keyboardWillHide', () => {
    document.documentElement.style.setProperty('--keyboard-height', '0px');
  });

  // Also measure via visualViewport as a reliable fallback
  if (window.visualViewport) {
    window.visualViewport.addEventListener('resize', () => {
      const gap = window.innerHeight - window.visualViewport.height - window.visualViewport.offsetTop;
      if (gap > 100) {
        document.documentElement.style.setProperty('--keyboard-height', `${gap}px`);
      } else {
        document.documentElement.style.setProperty('--keyboard-height', '0px');
      }
    });
  }
}

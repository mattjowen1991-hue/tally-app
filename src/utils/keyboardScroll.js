import { Keyboard } from '@capacitor/keyboard';

let keyboardHeight = 0;

export function initKeyboardScroll() {
  window.addEventListener('focusin', (e) => {
    if (!e.target.matches('input, textarea, [contenteditable]')) return;
    setTimeout(() => {
      e.target.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 400);
  }, true);

  Keyboard.addListener('keyboardDidShow', (e) => {
    keyboardHeight = e.keyboardHeight;
  });

  Keyboard.addListener('keyboardDidHide', () => {
    keyboardHeight = 0;
  });
}

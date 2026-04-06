import { Keyboard } from '@capacitor/keyboard';

export function initKeyboardScroll() {
  Keyboard.addListener('keyboardDidShow', (info) => {
    document.documentElement.style.setProperty('--keyboard-height', `${info.keyboardHeight}px`);
  });
  Keyboard.addListener('keyboardDidHide', () => {
    document.documentElement.style.setProperty('--keyboard-height', '0px');
  });
}

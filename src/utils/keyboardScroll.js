// Uses Capacitor Keyboard plugin events to set --keyboard-height CSS variable
// Modal padding-bottom expands by exactly the keyboard height, no JS transforms needed
export function initKeyboardScroll() {
  let cleanup = () => {};

  const setup = async () => {
    try {
      const { Keyboard } = await import('@capacitor/keyboard');

      const showHandler = await Keyboard.addListener('keyboardWillShow', (info) => {
        document.documentElement.style.setProperty('--keyboard-height', `${info.keyboardHeight}px`);
      });

      const hideHandler = await Keyboard.addListener('keyboardWillHide', () => {
        document.documentElement.style.setProperty('--keyboard-height', '0px');
      });

      cleanup = () => {
        showHandler.remove();
        hideHandler.remove();
      };
    } catch {
      // Not in Capacitor environment — no-op
    }
  };

  setup();
  return () => cleanup();
}

// Keyboard handling - scroll focused input into view after keyboard finishes opening

export function initKeyboardScroll() {
  const onFocusIn = (e) => {
    const el = e.target;
    const TEXT_INPUTS = ['text', 'number', 'email', 'tel', 'password', 'search', 'url'];
    const isText = el.tagName === 'TEXTAREA' ||
      (el.tagName === 'INPUT' && TEXT_INPUTS.includes(el.type || 'text'));
    if (!isText) return;

    // Wait for keyboard to fully open before scrolling (avoids jump)
    setTimeout(() => {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 600);
  };

  document.addEventListener('focusin', onFocusIn);
  return () => document.removeEventListener('focusin', onFocusIn);
}

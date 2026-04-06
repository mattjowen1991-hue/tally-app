// Minimal keyboard handling - let the browser do the heavy lifting
// Just scroll the focused input into view within the modal

export function initKeyboardScroll() {
  const onFocusIn = (e) => {
    const el = e.target;
    const TEXT_INPUTS = ['text', 'number', 'email', 'tel', 'password', 'search', 'url'];
    const isText = el.tagName === 'TEXTAREA' ||
      (el.tagName === 'INPUT' && TEXT_INPUTS.includes(el.type || 'text'));
    if (!isText) return;

    // Just scroll the focused input into view - browser handles everything else
    setTimeout(() => {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 350);
  };

  document.addEventListener('focusin', onFocusIn);
  return () => document.removeEventListener('focusin', onFocusIn);
}

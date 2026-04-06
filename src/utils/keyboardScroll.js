export function initKeyboardScroll() {
  document.addEventListener('focusin', (e) => {
    const el = e.target;
    console.log('[KB] focusin:', el.tagName, el.name || el.placeholder || 'no-id', 'inModal:', !!el.closest('.modal-content'));
    if (!el.closest('.modal-content')) return;
    if (el.tagName !== 'INPUT' && el.tagName !== 'TEXTAREA') return;

    setTimeout(() => {
      console.log('[KB] scrollIntoView firing for:', el.tagName, el.placeholder);
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 350);
  }, true);
}

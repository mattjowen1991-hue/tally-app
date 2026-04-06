// Scroll focused input into view when keyboard opens
// Works on both iOS and Android Capacitor WebView

export function initKeyboardScroll() {
  const scrollFocusedIntoView = () => {
    const el = document.activeElement;
    if (!el || !['INPUT', 'TEXTAREA', 'SELECT'].includes(el.tagName)) return;

    // Small delay to let keyboard fully open
    setTimeout(() => {
      const scrollParent = el.closest('.modal-content');
      if (!scrollParent) return;

      const elRect = el.getBoundingClientRect();
      const parentRect = scrollParent.getBoundingClientRect();

      // How far is the element below the visible area?
      const visibleBottom = window.visualViewport
        ? window.visualViewport.height
        : window.innerHeight * 0.6; // fallback estimate

      if (elRect.bottom > visibleBottom - 20) {
        const scrollBy = elRect.bottom - visibleBottom + 80; // 80px breathing room
        scrollParent.scrollTop += scrollBy;
      }
    }, 300);
  };

  document.addEventListener('focusin', scrollFocusedIntoView);
  return () => document.removeEventListener('focusin', scrollFocusedIntoView);
}

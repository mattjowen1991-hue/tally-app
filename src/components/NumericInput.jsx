import React, { useState, useRef, useEffect } from 'react';
import ReactDOM from 'react-dom';
import * as Icons from './Icons';
import haptic from '../utils/haptics';

// NumericInput: a number-entry input backed by a custom on-screen keypad.
// Avoids Android's native numeric keyboard which causes layout/viewport
// problems on small panels. The native keyboard is suppressed via
// inputMode="none", and our keypad is rendered as a fixed bottom sheet.

let activeInputId = null;
const subscribers = new Set();
let keypadOpen = false;
// When the keypad closes, this flag tells the active input whether to commit
// the typed value (true) or revert to the original (false).
let lastCloseCommitted = true;

function notify() {
  for (const fn of subscribers) fn();
}

function setActiveInput(id, committed = true) {
  lastCloseCommitted = committed;
  activeInputId = id;
  keypadOpen = !!id;
  notify();
}

export default function NumericInput({ value, onChange, onDone, placeholder, className, style, allowDecimal = true, autoFocus, min, max, onBlur: onBlurProp, ...rest }) {
  const inputRef = useRef(null);
  const idRef = useRef(`ni-${Math.random().toString(36).slice(2)}`);
  const id = idRef.current;
  const savedScrollRef = useRef(null);
  const panelShiftRef = useRef(null);
  const initialValueRef = useRef(null);

  const handleFocus = (e) => {
    e.preventDefault();
    // Capture original value so we can revert if user closes without pressing Done
    initialValueRef.current = value ?? '';
    setActiveInput(id);
    // Add temporary bottom padding to the scroll container so we can scroll
    // the input above the keypad even when there's no content beneath it.
    requestAnimationFrame(() => {
      const el = inputRef.current;
      if (!el) return;
      const container = el.closest('.modal-content') || el.closest('.form-screen-body') || el.closest('.swipe-panel');
      if (!container) return;
      // Save original scroll position so we can restore it on close
      savedScrollRef.current = { container, scrollTop: container.scrollTop };
      const KEYPAD_HEIGHT = 340;
      const keypadTop = window.innerHeight - KEYPAD_HEIGHT;
      // For form-screen panels, shrink the inner wrapper so it ends above the
      // keypad (mirrors what the native keyboard does via visualViewport).
      // The form-screen-inner uses height: var(--vvh, 100vh) so we override --vvh
      // on the html element while the keypad is open. Lock it so the global
      // viewport resize listener doesn't reset it.
      if (container.classList.contains('form-screen-body')) {
        window.__tallyVvhLocked = true;
        document.documentElement.style.setProperty('--vvh', keypadTop + 'px');
      }
      // Use the parent card if there is one — we want to keep the WHOLE card
      // above the keypad, not just the input itself.
      const card = el.closest('.mobile-bill-card, .glass-card');
      const target = card || el;
      const r = target.getBoundingClientRect();
      // How much we need to lift to get target.bottom 24px above the keypad
      const overshoot = r.bottom - (keypadTop - 24);
      if (overshoot > 0) {
        // First try to scroll inside the container (for cases where the panel
        // has scroll headroom — shorter panels with multiple cards above the focus).
        const currentMaxScroll = Math.max(0, container.scrollHeight - container.clientHeight - container.scrollTop);
        const scrolled = Math.min(overshoot, currentMaxScroll);
        if (scrolled > 0) container.scrollTop += scrolled;
        // Whatever scrolling didn't cover, lift the panel itself via translateY.
        const remainingShift = overshoot - scrolled;
        if (remainingShift > 0) {
          container.style.transition = 'transform 0.18s ease-out';
          container.style.transform = `translateY(-${remainingShift}px)`;
          panelShiftRef.current = { container, shift: remainingShift };
        }
        // Re-check after keypad slide animation in case content reflowed
        setTimeout(() => {
          const rr = target.getBoundingClientRect();
          const stillOver = rr.bottom - (keypadTop - 24);
          if (stillOver > 0) {
            const extra = stillOver;
            const currentShift = panelShiftRef.current?.shift || 0;
            const newShift = currentShift + extra;
            container.style.transform = `translateY(-${newShift}px)`;
            if (panelShiftRef.current) panelShiftRef.current.shift = newShift;
          }
        }, 220);
      }
    });
  };

  const handleBlur = (e) => {
    if (onBlurProp) onBlurProp(e);
    // Don't close keypad on blur — let outside-tap or Done handle it
  };

  // Cleanup padding & restore scroll when keypad closes (this input no longer active)
  useEffect(() => {
    const listener = () => {
      if (activeInputId !== id && savedScrollRef.current) {
        const { container, scrollTop } = savedScrollRef.current;
        // Revert to original value if the user dismissed without pressing Done
        if (!lastCloseCommitted && initialValueRef.current !== null) {
          onChange({ target: { value: initialValueRef.current } });
        }
        initialValueRef.current = null;
        if (container.style.paddingBottom) container.style.paddingBottom = '';
        // Restore scroll position so closing the keypad doesn't visually shift the page
        container.scrollTop = scrollTop;
        // Reverse panel translateY shift if any
        if (panelShiftRef.current) {
          const { container: shiftedContainer } = panelShiftRef.current;
          shiftedContainer.style.transform = '';
          // Clean up transition after it's done so it doesn't affect later interactions
          setTimeout(() => { if (!panelShiftRef.current) shiftedContainer.style.transition = ''; }, 200);
          panelShiftRef.current = null;
        }
        // Release vvh lock and restore to actual viewport height
        window.__tallyVvhLocked = false;
        if (window.visualViewport) {
          document.documentElement.style.setProperty('--vvh', window.visualViewport.height + 'px');
        }
        savedScrollRef.current = null;
      }
    };
    subscribers.add(listener);
    return () => { subscribers.delete(listener); };
  }, [id]);

  // Append/remove characters
  const append = (ch) => {
    let v = String(value ?? '');
    if (ch === '.') {
      if (!allowDecimal || v.includes('.')) return;
      if (v === '') v = '0';
      v += '.';
    } else {
      v += ch;
    }
    // Respect max constraint (used for day-of-month inputs like 1-31)
    if (max !== undefined && v !== '') {
      const num = parseFloat(v);
      const maxNum = parseFloat(max);
      if (!isNaN(num) && !isNaN(maxNum) && num > maxNum) return;
    }
    onChange({ target: { value: v } });
  };

  const backspace = () => {
    let v = String(value ?? '');
    if (v.length === 0) return;
    v = v.slice(0, -1);
    onChange({ target: { value: v } });
  };

  const closeAndRevert = () => setActiveInput(null, false);
  const closeAndCommit = () => {
    setActiveInput(null, true);
    // Trigger parent's "submit" action (e.g. Pay, Add, Take) on Done press
    if (onDone) {
      // Defer slightly so the value commit/state propagates first
      setTimeout(() => onDone(), 0);
    }
  };

  // Auto-focus support
  useEffect(() => {
    if (autoFocus) {
      setTimeout(() => {
        inputRef.current?.focus();
        setActiveInput(id);
      }, 50);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoFocus]);

  return (
    <>
      <input
        ref={inputRef}
        type="text"
        inputMode="none"
        readOnly
        value={value ?? ''}
        placeholder={placeholder}
        className={className}
        style={{ caretColor: 'var(--accent-primary)', ...style }}
        onFocus={handleFocus}
        onBlur={handleBlur}
        onClick={handleFocus}
        {...rest}
      />
      <NumericKeypad
        myId={id}
        onAppend={append}
        onBackspace={backspace}
        onCancel={closeAndRevert}
        onCommit={closeAndCommit}
        allowDecimal={allowDecimal}
      />
    </>
  );
}

function NumericKeypad({ myId, onAppend, onBackspace, onCancel, onCommit, allowDecimal }) {
  const [, forceUpdate] = useState(0);

  useEffect(() => {
    const listener = () => forceUpdate(n => n + 1);
    subscribers.add(listener);
    return () => { subscribers.delete(listener); };
  }, []);

  const isOpen = activeInputId === myId && keypadOpen;

  // Block panel swipe while keypad is open + close on tap-outside
  // Use document-level touch listener so the underlying form stays scrollable.
  useEffect(() => {
    if (!isOpen) return;
    const prev = window.__tallyModalOpen;
    window.__tallyModalOpen = true;

    let touchStartY = null;
    let touchStartX = null;
    const onTouchStart = (e) => {
      touchStartY = e.touches[0].clientY;
      touchStartX = e.touches[0].clientX;
    };
    const onTouchEnd = (e) => {
      if (touchStartY === null) return;
      const dy = Math.abs((e.changedTouches[0]?.clientY || 0) - touchStartY);
      const dx = Math.abs((e.changedTouches[0]?.clientX || 0) - touchStartX);
      // Only treat as a "tap to close" if the touch barely moved (not a scroll/swipe)
      if (dy < 8 && dx < 8) {
        const target = e.target;
        // Don't close if the tap was on the keypad itself or on another input
        if (target.closest('#tally-keypad-sheet, input, textarea')) {
          touchStartY = null;
          return;
        }
        // If tap was on a button/link (e.g. Pay, edit pencil), commit the
        // value so the action receives the typed input. If tap was on empty
        // space, cancel and revert.
        const isAction = target.closest('button, a, [role="button"]');
        haptic.light();
        if (isAction) {
          onCommit();
        } else {
          onCancel();
        }
      }
      touchStartY = null;
    };
    document.addEventListener('touchstart', onTouchStart, { passive: true });
    document.addEventListener('touchend', onTouchEnd, { passive: true });
    return () => {
      window.__tallyModalOpen = prev;
      document.removeEventListener('touchstart', onTouchStart);
      document.removeEventListener('touchend', onTouchEnd);
    };
  }, [isOpen, onCancel, onCommit]);

  if (!isOpen) return null;

  const press = (handler) => (e) => {
    e.preventDefault();
    e.stopPropagation();
    haptic.light();
    handler();
  };

  const KEY_BTN_STYLE = {
    padding: '16px 0',
    border: 'none',
    background: 'var(--bg-secondary)',
    color: 'var(--text-primary)',
    fontSize: '22px',
    fontWeight: '500',
    cursor: 'pointer',
    fontFamily: 'inherit',
    borderRadius: '12px',
    transition: 'background 0.1s',
  };

  return ReactDOM.createPortal(
    <>
      {/* Keypad sheet — no backdrop, so underlying content stays scrollable.
          Tap-outside-to-close is handled by document-level touch listeners. */}
      <div
        id="tally-keypad-sheet"
        onClick={(e) => e.stopPropagation()}
        style={{
          position: 'fixed', left: 0, right: 0, bottom: 0, zIndex: 99999,
          background: 'var(--bg-primary)',
          borderTop: '1px solid var(--border)',
          padding: '8px 8px calc(env(safe-area-inset-bottom, 0px) + 8px) 8px',
          boxShadow: '0 -4px 20px rgba(0,0,0,0.15)',
          animation: 'slideInUp 0.18s ease-out',
        }}
      >
        {/* Top row: Close (left) + Done (right) */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 8px 8px' }}>
          <button
            type="button"
            onClick={press(onCancel)}
            aria-label="Cancel"
            style={{
              width: '36px', height: '36px', border: 'none',
              background: 'transparent', color: 'var(--text-secondary)',
              borderRadius: '8px', cursor: 'pointer', fontFamily: 'inherit',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          ><Icons.X size={20} /></button>
          <button
            type="button"
            onClick={press(onCommit)}
            style={{
              padding: '6px 14px', border: 'none',
              background: 'var(--accent-primary)', color: '#fff',
              borderRadius: '8px', fontSize: '14px', fontWeight: '600',
              cursor: 'pointer', fontFamily: 'inherit',
            }}
          >Done</button>
        </div>
        {/* Number grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px' }}>
          {['1','2','3','4','5','6','7','8','9'].map(n => (
            <button key={n} type="button" onClick={press(() => onAppend(n))} style={KEY_BTN_STYLE}>{n}</button>
          ))}
          {allowDecimal ? (
            <button type="button" onClick={press(() => onAppend('.'))} style={KEY_BTN_STYLE}>.</button>
          ) : <div />}
          <button type="button" onClick={press(() => onAppend('0'))} style={KEY_BTN_STYLE}>0</button>
          <button type="button" onClick={press(onBackspace)} aria-label="Backspace" style={{ ...KEY_BTN_STYLE, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Icons.Backspace size={22} />
          </button>
        </div>
      </div>
    </>,
    document.body
  );
}

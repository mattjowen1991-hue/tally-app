import React, { useState, useRef, useEffect } from 'react';
import ReactDOM from 'react-dom';
import * as Icons from './Icons';

// Custom picker to replace native <select> — native Android WebView select dialogs
// don't respect in-app theme, rendering dark in light mode and vice versa.
export default function Picker({ value, onChange, options, className, style, placeholder }) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef(null);

  // options can be: ['a','b'] or [{value:'a', label:'A'}]
  const normalised = options.map(o =>
    typeof o === 'string' ? { value: o, label: o } : o
  );

  const selected = normalised.find(o => String(o.value) === String(value));

  // Block panel swipe while picker is open
  useEffect(() => {
    if (!open) return;
    const prev = window.__tallyModalOpen;
    window.__tallyModalOpen = true;
    return () => { window.__tallyModalOpen = prev; };
  }, [open]);

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        className={className || 'input'}
        onClick={(e) => { e.stopPropagation(); setOpen(true); }}
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          textAlign: 'left', cursor: 'pointer',
          ...style,
        }}
      >
        <span style={{ color: selected ? 'var(--text-primary)' : 'var(--text-muted)' }}>
          {selected ? selected.label : (placeholder || 'Select...')}
        </span>
        <Icons.ChevronDown size={16} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
      </button>

      {open && ReactDOM.createPortal(
        <div
          onClick={(e) => { e.stopPropagation(); setOpen(false); }}
          style={{
            position: 'fixed', inset: 0, zIndex: 99999,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
            touchAction: 'none',
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '100%',
              maxHeight: '60vh',
              overflowY: 'auto',
              background: 'var(--bg-secondary)',
              borderRadius: '16px 16px 0 0',
              paddingTop: '8px',
              paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 16px)',
              animation: 'slideInUp 0.2s ease-out',
            }}
          >
            {normalised.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onChange({ target: { value: opt.value } });
                  setOpen(false);
                }}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  width: '100%', padding: '14px 20px',
                  background: String(opt.value) === String(value) ? 'var(--info-tint)' : 'transparent',
                  border: 'none', cursor: 'pointer',
                  fontSize: '15px', fontWeight: String(opt.value) === String(value) ? '600' : '400',
                  color: String(opt.value) === String(value) ? 'var(--accent-primary)' : 'var(--text-primary)',
                  borderBottom: '1px solid var(--border)',
                  fontFamily: 'inherit',
                }}
              >
                <span>{opt.label}</span>
                {String(opt.value) === String(value) && (
                  <Icons.Check size={18} style={{ color: 'var(--accent-primary)' }} />
                )}
              </button>
            ))}
          </div>
        </div>,
        document.body
      )}
    </>
  );
}

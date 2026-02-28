import React, { useState, useCallback, useRef, createContext, useContext } from 'react';

const ToastContext = createContext(null);

export function useToast() {
  return useContext(ToastContext);
}

const TOAST_COLORS = {
  success: { bg: 'var(--success-tint-strong)', border: 'var(--success-tint-strong)', color: 'var(--success-text)' },
  error: { bg: 'var(--danger-tint-strong)', border: 'var(--danger-tint-strong)', color: 'var(--danger-text)' },
  info: { bg: 'var(--info-tint-strong)', border: 'var(--info-tint-strong)', color: 'var(--info-text)' },
  warning: { bg: 'var(--warning-tint-strong)', border: 'var(--warning-tint-strong)', color: 'var(--warning-text)' },
};

const ICONS = {
  success: '✓',
  error: '✕',
  info: 'ℹ',
  warning: '⚠',
};

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const idRef = useRef(0);

  const toast = useCallback((message, type = 'success', duration = 2500) => {
    const id = ++idRef.current;
    setToasts((prev) => [...prev, { id, message, type, leaving: false }]);

    setTimeout(() => {
      // Start exit animation
      setToasts((prev) => prev.map((t) => (t.id === id ? { ...t, leaving: true } : t)));
      // Remove after animation
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 300);
    }, duration);
  }, []);

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div style={{
        position: 'fixed',
        bottom: '80px',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column-reverse',
        gap: '8px',
        pointerEvents: 'none',
        width: '90%',
        maxWidth: '400px',
      }}>
        {toasts.map((t) => {
          const colors = TOAST_COLORS[t.type] || TOAST_COLORS.info;
          return (
            <div
              key={t.id}
              style={{
                padding: '12px 16px',
                background: colors.bg,
                backdropFilter: 'blur(12px)',
                WebkitBackdropFilter: 'blur(12px)',
                border: `1px solid ${colors.border}`,
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
                animation: t.leaving ? 'toastOut 0.3s ease forwards' : 'toastIn 0.3s ease forwards',
                pointerEvents: 'auto',
              }}
            >
              <span style={{
                width: '24px',
                height: '24px',
                borderRadius: '50%',
                background: colors.color,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '13px',
                fontWeight: '700',
                color: '#0a0e27',
                flexShrink: 0,
              }}>
                {ICONS[t.type]}
              </span>
              <span style={{
                fontSize: '14px',
                fontWeight: '500',
                color: 'var(--text-primary)',
                lineHeight: '1.3',
              }}>
                {t.message}
              </span>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

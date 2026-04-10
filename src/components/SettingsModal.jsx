import { useCurrency } from './CurrencyContext';
import { tc } from '../utils/themeColors';
import React from 'react';
import haptic from '../utils/haptics';
import { saveNotificationSettings } from '../utils/notifications';
import * as Icons from './Icons';

const CURRENCIES = [
  { code: 'GBP', symbol: '£', name: 'GBP (£)' },
  { code: 'USD', symbol: '$', name: 'USD ($)' },
  { code: 'EUR', symbol: '€', name: 'EUR (€)' },
  { code: 'AUD', symbol: 'A$', name: 'AUD (A$)' },
  { code: 'CAD', symbol: 'C$', name: 'CAD (C$)' },
  { code: 'NZD', symbol: 'NZ$', name: 'NZD (NZ$)' },
  { code: 'SEK', symbol: 'kr', name: 'SEK (kr)' },
  { code: 'NOK', symbol: 'kr', name: 'NOK (kr)' },
  { code: 'DKK', symbol: 'kr', name: 'DKK (kr)' },
  { code: 'CHF', symbol: 'CHF', name: 'CHF' },
  { code: 'JPY', symbol: '¥', name: 'JPY (¥)' },
  { code: 'INR', symbol: '₹', name: 'INR (₹)' },
];

export default function SettingsModal({ show, onClose, theme, onToggleTheme, notificationSettings, onNotificationSettingsChange, currencyCode, onCurrencyChange }) {
  const cs = useCurrency();
  const [showCurrencyPicker, setShowCurrencyPicker] = React.useState(false);
  if (!show) return null;

  const updateSetting = (key, value) => {
    const updated = { ...notificationSettings, [key]: value };
    onNotificationSettingsChange(updated);
    saveNotificationSettings(updated);
    haptic.light();
  };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }} onClick={onClose}>
      <div style={{ position: 'absolute', inset: 0, background: 'var(--modal-overlay)', backdropFilter: 'blur(4px)' }} />
      <div style={{
        position: 'relative', width: '100%', maxWidth: '500px', maxHeight: '85vh', overflowY: 'auto',
        background: 'var(--bg-secondary)', borderRadius: '20px 20px 0 0', padding: '24px 20px',
        animation: 'slideUp 0.3s ease',
      }} onClick={e => e.stopPropagation()}>
        {/* Handle */}
        <div style={{ width: '40px', height: '4px', borderRadius: '2px', background: 'var(--border)', margin: '0 auto 20px' }} />

        <h2 style={{ fontSize: '20px', fontWeight: '700', margin: '0 0 20px', color: 'var(--text-primary)', textAlign: 'center' }}>Settings</h2>

        {/* ── Appearance ── */}
        <div style={{
          padding: '16px', borderRadius: '12px', background: 'var(--glass)',
          border: '1px solid var(--border)', marginBottom: '16px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <span style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-primary)' }}><Icons.Palette size={16} /> Appearance</span>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '4px 0 0' }}>
                {theme === 'dark' ? 'Dark mode' : 'Light mode'}
              </p>
            </div>
            <button
              onClick={() => { onToggleTheme(); }}
              style={{
                width: '44px', height: '24px', borderRadius: '12px', border: 'none', cursor: 'pointer',
                background: theme === 'dark' ? 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))' : 'var(--border)',
                position: 'relative', transition: 'background 0.2s ease',
              }}
            >
              <div style={{
                width: '20px', height: '20px', borderRadius: '50%', background: '#fff',
                position: 'absolute', top: '2px',
                left: theme === 'dark' ? '22px' : '2px',
                transition: 'left 0.2s ease',
                boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '12px',
              }}>
                {theme === 'dark' ? '🌙' : '☀️'}
              </div>
            </button>
          </div>
        </div>

        {/* ── Currency ── */}
        <div style={{
          padding: '16px', borderRadius: '12px', background: 'var(--glass)',
          border: '1px solid var(--border)', marginBottom: '16px',
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-primary)' }}><Icons.Coins size={16} /> Currency</span>
              <button onClick={() => { haptic.light(); setShowCurrencyPicker(v => !v); }}
                style={{
                  padding: '8px 14px', borderRadius: '10px',
                  border: showCurrencyPicker ? '2px solid var(--accent-primary)' : '1px solid var(--border)',
                  background: showCurrencyPicker ? 'color-mix(in srgb, var(--accent-primary) 10%, transparent)' : 'var(--glass)',
                  color: showCurrencyPicker ? 'var(--accent-primary)' : 'var(--text-primary)',
                  fontSize: '14px', fontWeight: '600', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: '6px',
                }}>
                {CURRENCIES.find(c => c.code === (currencyCode || 'GBP'))?.name || 'GBP (£)'}
                <Icons.ChevronDown size={12} style={{ transition: 'transform 0.2s', transform: showCurrencyPicker ? 'rotate(180deg)' : 'none' }} />
              </button>
            </div>
            {showCurrencyPicker && (
              <div style={{ marginTop: '10px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                {CURRENCIES.map(c => (
                  <button key={c.code} onClick={() => { haptic.light(); onCurrencyChange(c.code); setShowCurrencyPicker(false); }}
                    style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: '10px 12px', borderRadius: '10px', cursor: 'pointer',
                      border: 'none', width: '100%', textAlign: 'left',
                      background: currencyCode === c.code ? 'color-mix(in srgb, var(--accent-primary) 10%, transparent)' : 'transparent',
                      color: currencyCode === c.code ? 'var(--accent-primary)' : 'var(--text-primary)',
                      fontSize: '14px', fontWeight: currencyCode === c.code ? '700' : '500',
                      transition: 'all 0.15s',
                    }}>
                    <span>{c.name}</span>
                    {currencyCode === c.code && <Icons.Check size={16} style={{ color: 'var(--accent-primary)' }} />}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── Notifications ── */}
        <div style={{
          padding: '16px', borderRadius: '12px', background: 'var(--glass)',
          border: '1px solid var(--border)', marginBottom: '16px',
        }}>
          {/* Master toggle */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <span style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-primary)' }}><Icons.Bell size={16} /> Notifications</span>
            <button
              onClick={() => updateSetting('enabled', !notificationSettings?.enabled)}
              style={{
                width: '44px', height: '24px', borderRadius: '12px', border: 'none', cursor: 'pointer',
                background: notificationSettings?.enabled ? 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))' : 'var(--border)',
                position: 'relative', transition: 'background 0.2s ease',
              }}
            >
              <div style={{
                width: '20px', height: '20px', borderRadius: '50%', background: '#fff',
                position: 'absolute', top: '2px',
                left: notificationSettings?.enabled ? '22px' : '2px',
                transition: 'left 0.2s ease',
                boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
              }} />
            </button>
          </div>

          <>
              <div style={{ opacity: notificationSettings?.enabled ? 1 : 0.4, pointerEvents: notificationSettings?.enabled ? 'auto' : 'none', transition: 'opacity 0.2s ease' }}>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '0 0 16px' }}>
                Choose which notifications you'd like to receive
              </p>

              {/* Individual notification type toggles */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '16px' }}>
                {/* Daily bill reminder toggle */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <span style={{ fontSize: '13px', fontWeight: '500', color: 'var(--text-primary)' }}>Daily bill reminders</span>
                    <p style={{ fontSize: '11px', color: 'var(--text-muted)', margin: '2px 0 0' }}>Bills due within the next 3 days</p>
                  </div>
                  <button
                    onClick={() => updateSetting('dailyReminder', !(notificationSettings?.dailyReminder ?? true))}
                    style={{
                      width: '38px', height: '22px', borderRadius: '11px', border: 'none', cursor: 'pointer',
                      background: (notificationSettings?.dailyReminder ?? true) ? 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))' : 'var(--border)',
                      position: 'relative', transition: 'background 0.2s ease', flexShrink: 0,
                    }}
                  >
                    <div style={{
                      width: '18px', height: '18px', borderRadius: '50%', background: '#fff',
                      position: 'absolute', top: '2px',
                      left: (notificationSettings?.dailyReminder ?? true) ? '18px' : '2px',
                      transition: 'left 0.2s ease',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                    }} />
                  </button>
                </div>

                {/* Weekly summary toggle */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <span style={{ fontSize: '13px', fontWeight: '500', color: 'var(--text-primary)' }}>Weekly summary</span>
                    <p style={{ fontSize: '11px', color: 'var(--text-muted)', margin: '2px 0 0' }}>Monday overview of unpaid bills</p>
                  </div>
                  <button
                    onClick={() => updateSetting('weeklySummary', !(notificationSettings?.weeklySummary ?? true))}
                    style={{
                      width: '38px', height: '22px', borderRadius: '11px', border: 'none', cursor: 'pointer',
                      background: (notificationSettings?.weeklySummary ?? true) ? 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))' : 'var(--border)',
                      position: 'relative', transition: 'background 0.2s ease', flexShrink: 0,
                    }}
                  >
                    <div style={{
                      width: '18px', height: '18px', borderRadius: '50%', background: '#fff',
                      position: 'absolute', top: '2px',
                      left: (notificationSettings?.weeklySummary ?? true) ? '18px' : '2px',
                      transition: 'left 0.2s ease',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                    }} />
                  </button>
                </div>
              </div>

              {/* Divider */}
              <div style={{ height: '1px', background: 'var(--border)', margin: '0 0 16px' }} />

              {/* Reminder time picker */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '13px', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>Reminder time:</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <select
                    value={notificationSettings?.reminderHour ?? 9}
                    onChange={(e) => updateSetting('reminderHour', parseInt(e.target.value))}
                    style={{
                      padding: '8px 6px', borderRadius: '8px', border: '1px solid var(--border)',
                      background: 'var(--bg-primary)', color: 'var(--text-primary)', fontSize: '14px',
                      fontWeight: '600', cursor: 'pointer', appearance: 'none', textAlign: 'center',
                      width: '52px',
                    }}
                  >
                    {Array.from({ length: 24 }, (_, i) => (
                      <option key={i} value={i}>
                        {i === 0 ? '12' : i > 12 ? i - 12 : i}
                      </option>
                    ))}
                  </select>
                  <span style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-secondary)' }}>:</span>
                  <select
                    value={notificationSettings?.reminderMinute ?? 0}
                    onChange={(e) => updateSetting('reminderMinute', parseInt(e.target.value))}
                    style={{
                      padding: '8px 6px', borderRadius: '8px', border: '1px solid var(--border)',
                      background: 'var(--bg-primary)', color: 'var(--text-primary)', fontSize: '14px',
                      fontWeight: '600', cursor: 'pointer', appearance: 'none', textAlign: 'center',
                      width: '52px',
                    }}
                  >
                    {[0, 15, 30, 45].map(m => (
                      <option key={m} value={m}>{String(m).padStart(2, '0')}</option>
                    ))}
                  </select>
                  <span style={{ fontSize: '13px', color: 'var(--text-muted)', marginLeft: '4px' }}>
                    {(notificationSettings?.reminderHour ?? 9) < 12 ? 'AM' : 'PM'}
                  </span>
                </div>
              </div>
              </div>
            </>
        </div>

        {/* App info */}
        <p style={{ fontSize: '11px', color: 'var(--text-muted)', textAlign: 'center', margin: '8px 0 0' }}>
          Tally v1.0.0
        </p>
      </div>

      <style>{`
        @keyframes slideUp {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}

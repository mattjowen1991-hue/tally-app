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

const GUIDE_SECTIONS = [
  {
    title: 'Overview',
    icon: 'PieChart',
    content: 'Your financial snapshot at a glance. See income, expenses, balance, and variance for the month. Toggle between living expenses, debt payments, and total outflow to understand where your money goes. Cards below surface missed bills, debt-free countdowns, savings progress, and spending trends.',
  },
  {
    title: 'Actions',
    icon: 'Plus',
    content: 'Your control centre. Add new bills, debts, or savings goals. Set your monthly income, run the take-home calculator to work out your pay after tax and deductions, import bank statements, and manage categories across all panels.',
  },
  {
    title: 'Bills',
    icon: 'Calendar',
    content: 'Track every recurring and one-off bill. Each bill shows its status - paid, unpaid, missed, or paused. Filter by status or category, sort by amount or name. Long-press any card to enter bulk select mode. Toggle auto-pay for direct debits so they mark themselves as paid on their due date.',
  },
  {
    title: 'Debt',
    icon: 'TrendingDown',
    content: 'Track all your debts in one place - credit cards, loans, mortgages, BNPL, and more. Choose between Snowball (smallest first) or Avalanche (highest interest first) payoff strategies. The dashboard shows your progress ring, DTI ratio, and a projected payoff chart. Make payments, track milestones, and use the consolidation calculator to see if merging debts would save you money.',
  },
  {
    title: 'Savings',
    icon: 'TrendingUp',
    content: 'Set goals with targets and deadlines, then track progress with milestone markers. Add a monthly auto-save amount and get prompted each month to log it. Pick an emoji to personalise each goal. The "What if I saved more?" calculator shows how much sooner you could reach your goal. Streaks track how many consecutive months you have been saving.',
  },
  {
    title: 'Tips',
    icon: 'Lightbulb',
    content: 'Look for the info icons throughout the app - they explain concepts like Snowball vs Avalanche, DTI ratio, credit utilisation, and savings strategies in plain English. Long-press cards to bulk select. Swipe between panels. Pull down to refresh. Your data syncs to the cloud when signed in.',
  },
];

function HowTallyWorksModal({ show, onClose }) {
  const [expandedSection, setExpandedSection] = React.useState(0);

  if (!show) return null;

  return (
    <div onClick={(e) => e.stopPropagation()} style={{ position: 'fixed', inset: 0, zIndex: 10000, background: 'var(--bg-primary)', overflowY: 'auto', animation: 'fadeIn 0.2s ease-out' }}>
      <div style={{ padding: '20px', paddingTop: 'calc(env(safe-area-inset-top, 28px) + 16px)', maxWidth: '500px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
          <button onClick={() => { haptic.light(); onClose(); }} style={{ background: 'none', border: 'none', color: 'var(--text-primary)', cursor: 'pointer', padding: '4px', display: 'flex', alignItems: 'center' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5M12 5l-7 7 7 7"/>
            </svg>
          </button>
          <h2 className="font-display" style={{ fontSize: '20px' }}>How Tally Works</h2>
        </div>

        <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '20px', lineHeight: 1.5 }}>
          Tally helps you stay on top of your finances across three areas - bills, debts, and savings. Here is how each part works.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {GUIDE_SECTIONS.map((section, i) => {
            const isExpanded = expandedSection === i;
            const IconComponent = Icons[section.icon];
            return (
              <div key={section.title} style={{
                borderRadius: '14px', overflow: 'hidden',
                border: '1px solid var(--border)',
                background: isExpanded ? 'var(--glass)' : 'transparent',
              }}>
                <button onClick={() => { haptic.light(); setExpandedSection(isExpanded ? -1 : i); }}
                  style={{
                    width: '100%', padding: '14px 16px', background: 'none', border: 'none',
                    cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '12px',
                    color: 'var(--text-primary)',
                  }}>
                  <div style={{
                    width: '32px', height: '32px', borderRadius: '10px', flexShrink: 0,
                    background: isExpanded ? 'color-mix(in srgb, var(--accent-primary) 15%, transparent)' : 'var(--glass)',
                    border: `1px solid ${isExpanded ? 'color-mix(in srgb, var(--accent-primary) 30%, transparent)' : 'var(--border)'}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: isExpanded ? 'var(--accent-primary)' : 'var(--text-muted)',
                  }}>
                    {IconComponent && <IconComponent size={16} />}
                  </div>
                  <span style={{ flex: 1, textAlign: 'left', fontSize: '15px', fontWeight: '600' }}>{section.title}</span>
                  <Icons.ChevronDown size={16} style={{ color: 'var(--text-muted)', transition: 'transform 0.2s', transform: isExpanded ? 'rotate(180deg)' : 'none' }} />
                </button>
                {isExpanded && (
                  <div style={{ padding: '0 16px 16px', fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.7 }}>
                    {section.content}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div style={{ marginTop: '24px', padding: '16px', borderRadius: '14px', background: 'color-mix(in srgb, var(--accent-primary) 6%, transparent)', border: '1px solid color-mix(in srgb, var(--accent-primary) 12%, transparent)', textAlign: 'center' }}>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0 }}>
            Need more help? We are always improving Tally based on feedback. If something is not working as expected, let us know.
          </p>
        </div>
      </div>
    </div>
  );
}

function FeedbackModal({ show, onClose, bills, debts, savings, theme, currencyCode }) {
  const [category, setCategory] = React.useState('bug');
  const [description, setDescription] = React.useState('');
  const [sent, setSent] = React.useState(false);

  if (!show) return null;

  const handleSend = () => {
    if (!description.trim()) { haptic.warning(); return; }

    const deviceInfo = [
      `App: Tally v1.0.0`,
      `Platform: ${navigator.userAgent.includes('Android') ? 'Android' : navigator.userAgent.includes('iPhone') ? 'iOS' : 'Web'}`,
      `User Agent: ${navigator.userAgent}`,
      `Screen: ${window.screen.width}x${window.screen.height} (${window.devicePixelRatio}x)`,
      `Viewport: ${window.innerWidth}x${window.innerHeight}`,
      `Theme: ${theme || 'dark'}`,
      `Currency: ${currencyCode || 'GBP'}`,
      `Data: ${bills?.length || 0} bills, ${debts?.length || 0} debts, ${savings?.length || 0} savings`,
      `Time: ${new Date().toISOString()}`,
    ].join('\n');

    const categoryLabels = { bug: 'BUG', feature: 'FEATURE REQUEST', other: 'OTHER' };
    const subject = encodeURIComponent(`[Tally] [${categoryLabels[category]}]`);
    const body = category === 'bug'
      ? encodeURIComponent(
          `${description}\n\n` +
          `--------------------\n` +
          `Device Info (auto-collected)\n` +
          `--------------------\n` +
          `${deviceInfo}`
        )
      : encodeURIComponent(description);

    window.open(`mailto:tallytracking@gmail.com?subject=${subject}&body=${body}`, '_system');
    haptic.success();
    setSent(true);
    setTimeout(() => { setSent(false); setDescription(''); setCategory('bug'); onClose(); }, 1500);
  };

  const handleExport = () => {
    try {
      const data = { bills, debts, savings, exportedAt: new Date().toISOString(), appVersion: '1.0.0' };
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `tally-data-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      haptic.success();
    } catch (err) {
      console.error('Export failed:', err);
    }
  };

  return (
    <div onClick={(e) => e.stopPropagation()} style={{ position: 'fixed', inset: 0, zIndex: 10000, background: 'var(--bg-primary)', overflowY: 'auto', animation: 'fadeIn 0.2s ease-out' }}>
      <div style={{ padding: '20px', paddingTop: 'calc(env(safe-area-inset-top, 28px) + 16px)', maxWidth: '500px', margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
          <button onClick={() => { haptic.light(); setDescription(''); setCategory('bug'); onClose(); }} style={{ background: 'none', border: 'none', color: 'var(--text-primary)', cursor: 'pointer', padding: '4px', display: 'flex', alignItems: 'center' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
          </button>
          <h2 className="font-display" style={{ fontSize: '20px' }}>Send Feedback</h2>
        </div>

        {sent ? (
          <div style={{ textAlign: 'center', padding: '40px 20px' }}>
            <Icons.Check size={40} style={{ color: 'var(--success)', marginBottom: '12px' }} />
            <p style={{ fontSize: '16px', fontWeight: '600', color: 'var(--text-primary)' }}>Thanks for your feedback!</p>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '6px' }}>Your email client should have opened with the details pre-filled.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-secondary)', fontWeight: '500', marginBottom: '8px' }}>What is this about?</label>
              <div style={{ display: 'flex', gap: '6px' }}>
                {[
                  { key: 'bug', label: 'Bug', icon: <Icons.Warning size={13} /> },
                  { key: 'feature', label: 'Feature', icon: <Icons.Lightbulb size={13} /> },
                  { key: 'other', label: 'Other', icon: <Icons.Edit size={13} /> },
                ].map(c => (
                  <button key={c.key} onClick={() => { haptic.light(); setCategory(c.key); }}
                    style={{
                      flex: 1, padding: '10px 8px', borderRadius: '10px', fontSize: '13px', fontWeight: '600',
                      cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                      border: category === c.key ? '2px solid var(--accent-primary)' : '1px solid var(--border)',
                      background: category === c.key ? 'color-mix(in srgb, var(--accent-primary) 10%, transparent)' : 'var(--glass)',
                      color: category === c.key ? 'var(--accent-primary)' : 'var(--text-muted)',
                    }}>{c.icon} {c.label}</button>
                ))}
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-secondary)', fontWeight: '500', marginBottom: '8px' }}>
                {category === 'bug' ? 'What happened? What did you expect?' : category === 'feature' ? 'What would you like to see?' : 'Tell us anything'}
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={category === 'bug' ? 'I was trying to... and then...' : category === 'feature' ? 'It would be great if...' : 'Your thoughts...'}
                style={{
                  width: '100%', minHeight: '120px', padding: '12px', borderRadius: '10px',
                  border: '1px solid var(--border)', background: 'var(--glass)',
                  color: 'var(--text-primary)', fontSize: '14px', lineHeight: 1.5,
                  resize: 'vertical', fontFamily: 'inherit',
                }}
              />
            </div>

            {category === 'bug' && (
              <div style={{ padding: '12px', borderRadius: '10px', background: 'var(--glass)', border: '1px solid var(--border)' }}>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px' }}>Auto-attached info</div>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: 1.5, margin: 0 }}>
                  App version, device, screen size, theme, and data summary will be included automatically to help us debug. No personal financial data is sent.
                </p>
              </div>
            )}

            <button onClick={handleSend} className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '14px' }}>
              {category === 'bug' ? 'Open Email to Send' : 'Send Feedback'}
            </button>

            {category === 'bug' && (
              <>
                <div style={{ height: '1px', background: 'var(--border)' }} />
                <button onClick={handleExport}
                  style={{
                    width: '100%', padding: '12px', borderRadius: '10px', cursor: 'pointer',
                    border: '1px solid var(--border)', background: 'var(--glass)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                    fontSize: '13px', fontWeight: '500', color: 'var(--text-secondary)',
                  }}>
                  <Icons.Upload size={14} /> Export my data (for debugging)
                </button>
                <p style={{ fontSize: '11px', color: 'var(--text-muted)', textAlign: 'center', margin: '-8px 0 0' }}>
                  Downloads a JSON file you can attach to the email if needed
                </p>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function SettingsModal({ show, onClose, theme, onToggleTheme, notificationSettings, onNotificationSettingsChange, currencyCode, onCurrencyChange, bills, debts, savings }) {
  const cs = useCurrency();
  const [showCurrencyPicker, setShowCurrencyPicker] = React.useState(false);
  const [showGuide, setShowGuide] = React.useState(false);
  const [showFeedback, setShowFeedback] = React.useState(false);
  if (!show) return null;

  const updateSetting = (key, value) => {
    const updated = { ...notificationSettings, [key]: value };
    onNotificationSettingsChange(updated);
    saveNotificationSettings(updated);
    haptic.light();
  };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }} onClick={() => { if (!showGuide && !showFeedback) onClose(); }}>
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <Icons.Bell size={16} style={{ color: 'var(--text-primary)' }} />
            <span style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-primary)' }}>Notifications</span>
          </div>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '0 0 16px', lineHeight: 1.5 }}>
            We hate unnecessary notifications too. These only fire when missing them could cost you money.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {[
              { key: 'billReminders', label: 'Bill reminders', desc: 'Heads up 3 days before a bill is due', icon: <Icons.Calendar size={14} /> },
              { key: 'missedAlerts', label: 'Missed bill alerts', desc: 'Next-day alert if a bill goes unpaid', icon: <Icons.X size={14} /> },
              { key: 'debtReminders', label: 'Debt payment reminders', desc: '3 days before a debt payment is due', icon: <Icons.Banknote size={14} /> },
            ].map(n => (
              <div key={n.key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', flex: 1 }}>
                  <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: 'var(--glass)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', flexShrink: 0, marginTop: '1px' }}>
                    {n.icon}
                  </div>
                  <div>
                    <span style={{ fontSize: '13px', fontWeight: '500', color: 'var(--text-primary)' }}>{n.label}</span>
                    <p style={{ fontSize: '11px', color: 'var(--text-muted)', margin: '2px 0 0' }}>{n.desc}</p>
                  </div>
                </div>
                <button
                  onClick={() => { haptic.light(); updateSetting(n.key, !notificationSettings?.[n.key]); }}
                  style={{
                    width: '44px', height: '24px', borderRadius: '12px', border: 'none', cursor: 'pointer',
                    background: notificationSettings?.[n.key] ? 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))' : 'var(--border)',
                    position: 'relative', transition: 'background 0.2s ease', flexShrink: 0,
                  }}
                >
                  <div style={{
                    width: '20px', height: '20px', borderRadius: '50%', background: '#fff',
                    position: 'absolute', top: '2px',
                    left: notificationSettings?.[n.key] ? '22px' : '2px',
                    transition: 'left 0.2s ease',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                  }} />
                </button>
              </div>
            ))}
          </div>

          {/* Reminder time - only show if any notification is enabled */}
          {(notificationSettings?.billReminders || notificationSettings?.missedAlerts || notificationSettings?.debtReminders) && (
            <>
              <div style={{ height: '1px', background: 'var(--border)', margin: '16px 0' }} />
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
            </>
          )}
        </div>

        {/* Send Feedback */}
        <button onClick={() => { haptic.light(); setShowFeedback(true); }}
          style={{
            width: '100%', padding: '14px 16px', borderRadius: '12px',
            background: 'var(--glass)', border: '1px solid var(--border)',
            cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px',
            marginBottom: '12px',
          }}>
          <div style={{ width: '32px', height: '32px', borderRadius: '10px', background: 'color-mix(in srgb, var(--success) 15%, transparent)', border: '1px solid color-mix(in srgb, var(--success) 30%, transparent)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--success)', flexShrink: 0 }}>
            <Icons.Edit size={16} />
          </div>
          <div style={{ flex: 1, textAlign: 'left' }}>
            <div style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-primary)' }}>Send Feedback</div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>Report a bug, request a feature, or say hi</div>
          </div>
          <span style={{ color: 'var(--text-muted)', fontSize: '16px' }}>›</span>
        </button>

        {/* How Tally Works */}
        <button onClick={() => { haptic.light(); setShowGuide(true); }}
          style={{
            width: '100%', padding: '14px 16px', borderRadius: '12px',
            background: 'var(--glass)', border: '1px solid var(--border)',
            cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px',
            marginBottom: '16px',
          }}>
          <div style={{ width: '32px', height: '32px', borderRadius: '10px', background: 'color-mix(in srgb, var(--accent-primary) 15%, transparent)', border: '1px solid color-mix(in srgb, var(--accent-primary) 30%, transparent)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-primary)', flexShrink: 0 }}>
            <Icons.InfoCircle size={16} />
          </div>
          <div style={{ flex: 1, textAlign: 'left' }}>
            <div style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-primary)' }}>How Tally Works</div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>A quick guide to every feature</div>
          </div>
          <span style={{ color: 'var(--text-muted)', fontSize: '16px' }}>›</span>
        </button>

        {/* App info */}
        <p style={{ fontSize: '11px', color: 'var(--text-muted)', textAlign: 'center', margin: '8px 0 0' }}>
          Tally v1.0.0
        </p>
      </div>

      <HowTallyWorksModal show={showGuide} onClose={() => setShowGuide(false)} />
      <FeedbackModal show={showFeedback} onClose={() => setShowFeedback(false)} bills={bills} debts={debts} savings={savings} theme={theme} currencyCode={currencyCode} />

      <style>{`
        @keyframes slideUp {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}

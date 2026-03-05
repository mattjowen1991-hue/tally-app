import React from 'react';
import * as Icons from './Icons';
import haptic from '../utils/haptics';

const CURRENCY_OPTIONS = [
  { code: 'GBP', symbol: '£', flag: '🇬🇧' },
  { code: 'USD', symbol: '$', flag: '🇺🇸' },
  { code: 'EUR', symbol: '€', flag: '🇪🇺' },
  { code: 'AUD', symbol: 'A$', flag: '🇦🇺' },
  { code: 'CAD', symbol: 'C$', flag: '🇨🇦' },
  { code: 'NZD', symbol: 'NZ$', flag: '🇳🇿' },
  { code: 'SEK', symbol: 'kr', flag: '🇸🇪' },
  { code: 'NOK', symbol: 'kr', flag: '🇳🇴' },
  { code: 'DKK', symbol: 'kr', flag: '🇩🇰' },
  { code: 'CHF', symbol: 'CHF', flag: '🇨🇭' },
  { code: 'JPY', symbol: '¥', flag: '🇯🇵' },
  { code: 'INR', symbol: '₹', flag: '🇮🇳' },
];

export default function CurrencyPrompt({ onSelect }) {
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 2000,
      background: 'var(--bg-primary)',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      padding: '24px',
    }}>
      <div style={{ maxWidth: '400px', width: '100%', textAlign: 'center' }}>
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <Icons.TallyWordmark width={140} />
        </div>
        <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginTop: '8px', marginBottom: '40px' }}>
          Finance tracking made easy
        </p>

        <h2 style={{
          fontSize: '22px', fontWeight: '700', color: 'var(--text-primary)',
          marginBottom: '8px',
        }}>
          Choose your currency
        </h2>
        <p style={{ fontSize: '14px', color: 'var(--text-muted)', marginBottom: '28px' }}>
          You can change this anytime in Settings
        </p>

        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px',
          marginBottom: '20px',
        }}>
          {CURRENCY_OPTIONS.map(c => (
            <button
              key={c.code}
              onClick={() => { haptic.medium(); onSelect(c.code); }}
              style={{
                padding: '16px 8px', borderRadius: '14px',
                border: '1px solid var(--border)', background: 'var(--glass)',
                cursor: 'pointer', display: 'flex', flexDirection: 'column',
                alignItems: 'center', gap: '6px', transition: 'all 0.15s',
                WebkitTapHighlightColor: 'transparent',
              }}
            >
              <span style={{ fontSize: '24px' }}>{c.flag}</span>
              <span style={{ fontSize: '16px', fontWeight: '700', color: 'var(--text-primary)' }}>{c.symbol}</span>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '500' }}>{c.code}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

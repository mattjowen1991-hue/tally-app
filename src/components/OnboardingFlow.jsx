import React, { useState } from 'react';
import * as Icons from './Icons';
import haptic from '../utils/haptics';
import { tc } from '../utils/themeColors';

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

const PANELS = [
  { icon: <Icons.PieChart size={18} />, name: 'Overview', desc: 'Your financial snapshot at a glance' },
  { icon: <Icons.Plus size={18} />, name: 'Actions', desc: 'Add bills, debts and savings goals' },
  { icon: <Icons.Calendar size={18} />, name: 'Bills', desc: 'Track and mark bills paid or missed' },
  { icon: <Icons.TrendingDown size={18} />, name: 'Debt', desc: 'Manage debts with payoff timelines' },
  { icon: <Icons.Coins size={18} />, name: 'Savings', desc: 'Set goals and track your progress' },
];

export default function OnboardingFlow({ onComplete, onSelectCurrency }) {
  const [step, setStep] = useState(0);
  const [selectedCurrency, setSelectedCurrency] = useState(null);
  const [income, setIncome] = useState('');

  const totalSteps = 4;

  const goNext = () => {
    haptic.light();
    setStep(s => s + 1);
  };

  const handleCurrencySelect = (code) => {
    haptic.medium();
    setSelectedCurrency(code);
  };

  const handleFinish = () => {
    haptic.success();
    onComplete({ currencyCode: selectedCurrency, income: parseFloat(income) || 0 });
  };

  const canProceedStep2 = selectedCurrency !== null;
  const canProceedStep3 = true; // income is optional

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 3000,
      background: 'var(--bg-primary)',
      display: 'flex', flexDirection: 'column',
      padding: '0',
      overflow: 'hidden',
    }}>
      {/* Progress dots */}
      <div style={{
        display: 'flex', justifyContent: 'center', gap: '6px',
        paddingTop: 'calc(env(safe-area-inset-top) + 16px)',
        paddingBottom: '8px', flexShrink: 0,
      }}>
        {Array.from({ length: totalSteps }).map((_, i) => (
          <div key={i} style={{
            width: i === step ? '24px' : '6px', height: '6px',
            borderRadius: '3px',
            background: i === step ? 'var(--accent-primary)' : 'var(--border)',
            transition: 'all 0.3s ease',
          }} />
        ))}
      </div>

      {/* Step content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '24px 24px 0' }}>

        {/* ── Step 0: Welcome ── */}
        {step === 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', paddingTop: '40px', animation: 'slideInUp 0.3s ease' }}>
            <div style={{ marginBottom: '24px' }}>
              <Icons.TallyWordmark width={160} />
            </div>
            <div style={{
              width: '80px', height: '80px', borderRadius: '22px',
              background: 'linear-gradient(135deg, var(--accent-primary), var(--success))',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              marginBottom: '32px', boxShadow: '0 8px 32px rgba(0,212,255,0.25)',
            }}>
              <span style={{ fontSize: '36px' }}>𝄩</span>
            </div>
            <h1 className="font-display" style={{ fontSize: '32px', marginBottom: '16px', lineHeight: 1.2 }}>
              Finance tracking<br />made easy
            </h1>
            <p style={{ fontSize: '16px', color: 'var(--text-secondary)', lineHeight: 1.6, maxWidth: '300px' }}>
              Tally helps you stay on top of your bills, debts and savings — all in one place.
            </p>
          </div>
        )}

        {/* ── Step 1: What Tally does ── */}
        {step === 1 && (
          <div style={{ animation: 'slideInUp 0.3s ease' }}>
            <h2 className="font-display" style={{ fontSize: '28px', marginBottom: '8px' }}>Everything in one place</h2>
            <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '28px' }}>
              Tally has five panels, each focused on a different part of your finances.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {PANELS.map((panel, i) => (
                <div key={i} style={{
                  display: 'flex', alignItems: 'center', gap: '14px',
                  padding: '14px 16px', borderRadius: '14px',
                  background: 'var(--glass)', border: '1px solid var(--border)',
                  animation: `slideInUp 0.3s ease ${i * 0.06}s both`,
                }}>
                  <div style={{
                    width: '36px', height: '36px', borderRadius: '10px', flexShrink: 0,
                    background: 'var(--info-tint)', border: '1px solid var(--info-tint-strong)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: 'var(--accent-primary)',
                  }}>
                    {panel.icon}
                  </div>
                  <div>
                    <div style={{ fontSize: '15px', fontWeight: '600' }}>{panel.name}</div>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>{panel.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Step 2: Currency ── */}
        {step === 2 && (
          <div style={{ animation: 'slideInUp 0.3s ease' }}>
            <h2 className="font-display" style={{ fontSize: '28px', marginBottom: '8px' }}>Choose your currency</h2>
            <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '24px' }}>
              You can change this anytime in Settings.
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginBottom: '20px' }}>
              {CURRENCY_OPTIONS.map(c => (
                <button
                  key={c.code}
                  onClick={() => handleCurrencySelect(c.code)}
                  style={{
                    padding: '14px 8px', borderRadius: '14px', cursor: 'pointer',
                    border: selectedCurrency === c.code ? '2px solid var(--accent-primary)' : '1px solid var(--border)',
                    background: selectedCurrency === c.code ? 'var(--info-tint)' : 'var(--glass)',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '5px',
                    transition: 'all 0.15s', WebkitTapHighlightColor: 'transparent',
                  }}
                >
                  <span style={{ fontSize: '22px' }}>{c.flag}</span>
                  <span style={{ fontSize: '15px', fontWeight: '700', color: selectedCurrency === c.code ? 'var(--accent-primary)' : 'var(--text-primary)' }}>{c.symbol}</span>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '500' }}>{c.code}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── Step 3: Income ── */}
        {step === 3 && (
          <div style={{ animation: 'slideInUp 0.3s ease' }}>
            <h2 className="font-display" style={{ fontSize: '28px', marginBottom: '8px' }}>What's your monthly income?</h2>
            <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '8px' }}>
              This helps Tally calculate your balance and spending.
            </p>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '28px' }}>
              You can skip this for now and update it later. The take-home calculator in Actions can work this out for you automatically.
            </p>
            <div style={{ position: 'relative', marginBottom: '16px' }}>
              <div style={{
                position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)',
                fontSize: '18px', fontWeight: '700', color: 'var(--text-secondary)',
              }}>
                {selectedCurrency ? CURRENCY_OPTIONS.find(c => c.code === selectedCurrency)?.symbol : '£'}
              </div>
              <input
                type="number"
                className="input"
                placeholder="e.g. 2000"
                value={income}
                onChange={(e) => setIncome(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.target.blur(); handleFinish(); } }}
                style={{ paddingLeft: '36px', fontSize: '24px', fontWeight: '700', height: '60px' }}
                autoFocus
              />
            </div>
            <div style={{ padding: '12px 14px', background: 'var(--glass)', borderRadius: '10px', border: '1px solid var(--border)', marginBottom: '20px' }}>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: 0, lineHeight: 1.5 }}>
                💡 Not sure of your exact take-home? Skip for now — the <strong style={{ color: 'var(--text-secondary)' }}>Take-Home Calculator</strong> in Actions can work it out from your salary after tax, NI and other deductions.
              </p>
            </div>
            {/* Inline buttons for step 3 — visible above keyboard */}
            <button
              className="btn btn-primary"
              onClick={handleFinish}
              style={{ width: '100%', justifyContent: 'center', fontSize: '16px', padding: '16px', marginBottom: '10px' }}
            >
              {income ? "Let's go →" : 'Skip and get started →'}
            </button>
          </div>
        )}

      </div>

      {/* Bottom actions — hidden on step 3 where button is inline above keyboard */}
      {step < 3 && (
        <div style={{
          padding: '20px 24px',
          paddingBottom: 'calc(env(safe-area-inset-bottom) + 20px)',
          flexShrink: 0,
          display: 'flex', flexDirection: 'column', gap: '10px',
        }}>
          {step < 3 ? (
            <>
              <button
                className="btn btn-primary"
                onClick={goNext}
                disabled={step === 2 && !canProceedStep2}
                style={{
                  width: '100%', justifyContent: 'center', fontSize: '16px', padding: '16px',
                  opacity: (step === 2 && !canProceedStep2) ? 0.4 : 1,
                }}
              >
                {step === 0 ? "Let's get started" : step === 2 ? 'Continue' : 'Next'}
              </button>
              {step === 2 && (
                <button
                  onClick={goNext}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: '13px', padding: '4px', textAlign: 'center' }}
                >
                  Skip for now
                </button>
              )}
            </>
          ) : null}
        </div>
      )}
    </div>
  );
}

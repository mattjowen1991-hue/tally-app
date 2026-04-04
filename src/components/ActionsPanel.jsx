import { useCurrency } from './CurrencyContext';
import React, { useState, useEffect } from 'react';
import * as Icons from './Icons';
import { tc } from '../utils/themeColors';

// ── 2024/25 UK Tax constants ──────────────────────────────────────────────────
const UK_PERSONAL_ALLOWANCE = 12570;
const UK_BASIC_RATE_LIMIT = 50270;
const UK_HIGHER_RATE_LIMIT = 125140;
const UK_BASIC_RATE = 0.20;
const UK_HIGHER_RATE = 0.40;
const UK_ADDITIONAL_RATE = 0.45;
const UK_NI_LOWER = 12570;
const UK_NI_UPPER = 50270;
const UK_NI_BASIC = 0.08;
const UK_NI_UPPER_RATE = 0.02;

const STUDENT_PLANS = [
  { key: 'none', label: 'None' },
  { key: 'plan1', label: 'Plan 1', threshold: 24990, rate: 0.09 },
  { key: 'plan2', label: 'Plan 2', threshold: 27295, rate: 0.09 },
  { key: 'plan4', label: 'Plan 4 (Scotland)', threshold: 31395, rate: 0.09 },
  { key: 'plan5', label: 'Plan 5', threshold: 25000, rate: 0.09 },
  { key: 'postgrad', label: 'Postgrad', threshold: 21000, rate: 0.06 },
];

function calcUKTakeHome(grossYearly, settings) {
  const g = parseFloat(grossYearly) || 0;
  if (g <= 0) return 0;

  let taxableIncome = Math.max(0, g - UK_PERSONAL_ALLOWANCE);
  // Taper personal allowance above £100k
  if (g > 100000) {
    const reduction = Math.min(UK_PERSONAL_ALLOWANCE, (g - 100000) / 2);
    taxableIncome = Math.max(0, g - (UK_PERSONAL_ALLOWANCE - reduction));
  }

  // Income tax
  let tax = 0;
  if (settings.incomeTax) {
    const basicTaxable = Math.min(taxableIncome, UK_BASIC_RATE_LIMIT - UK_PERSONAL_ALLOWANCE);
    const higherTaxable = Math.min(Math.max(0, taxableIncome - (UK_BASIC_RATE_LIMIT - UK_PERSONAL_ALLOWANCE)), UK_HIGHER_RATE_LIMIT - UK_BASIC_RATE_LIMIT);
    const additionalTaxable = Math.max(0, taxableIncome - (UK_HIGHER_RATE_LIMIT - UK_PERSONAL_ALLOWANCE));
    tax = (basicTaxable * UK_BASIC_RATE) + (higherTaxable * UK_HIGHER_RATE) + (additionalTaxable * UK_ADDITIONAL_RATE);
  }

  // National Insurance
  let ni = 0;
  if (settings.nationalInsurance) {
    const niBasic = Math.min(Math.max(0, g - UK_NI_LOWER), UK_NI_UPPER - UK_NI_LOWER);
    const niUpper = Math.max(0, g - UK_NI_UPPER);
    ni = (niBasic * UK_NI_BASIC) + (niUpper * UK_NI_UPPER_RATE);
  }

  // Student loan
  let studentLoan = 0;
  if (settings.studentPlan && settings.studentPlan !== 'none') {
    const plan = STUDENT_PLANS.find(p => p.key === settings.studentPlan);
    if (plan) studentLoan = Math.max(0, g - plan.threshold) * plan.rate;
  }

  // Pension (pre-tax reduces taxable income, post-tax just deducted)
  const pensionRate = (parseFloat(settings.pensionPercent) || 0) / 100;
  const pensionAmount = settings.pension ? g * pensionRate : 0;
  // Recalculate tax if pension is pre-tax
  let finalTax = tax;
  if (settings.pension && settings.pensionPreTax && settings.incomeTax) {
    const adjustedGross = Math.max(0, g - pensionAmount);
    const adjTaxable = Math.max(0, adjustedGross - UK_PERSONAL_ALLOWANCE);
    const basicTaxable = Math.min(adjTaxable, UK_BASIC_RATE_LIMIT - UK_PERSONAL_ALLOWANCE);
    const higherTaxable = Math.min(Math.max(0, adjTaxable - (UK_BASIC_RATE_LIMIT - UK_PERSONAL_ALLOWANCE)), UK_HIGHER_RATE_LIMIT - UK_BASIC_RATE_LIMIT);
    const additionalTaxable = Math.max(0, adjTaxable - (UK_HIGHER_RATE_LIMIT - UK_PERSONAL_ALLOWANCE));
    finalTax = (basicTaxable * UK_BASIC_RATE) + (higherTaxable * UK_HIGHER_RATE) + (additionalTaxable * UK_ADDITIONAL_RATE);
  }

  // Custom deductions
  let customTotal = 0;
  if (settings.customDeductions) {
    settings.customDeductions.forEach(d => {
      if (!d.enabled) return;
      if (d.type === 'percent') customTotal += g * ((parseFloat(d.value) || 0) / 100);
      else customTotal += parseFloat(d.value) || 0;
    });
  }

  const netYearly = g - finalTax - ni - studentLoan - pensionAmount - customTotal;
  return Math.max(0, netYearly) / 12;
}

function calcCustomTakeHome(grossMonthly, settings) {
  const g = parseFloat(grossMonthly) || 0;
  if (g <= 0) return 0;
  let deductions = 0;
  if (settings.customDeductions) {
    settings.customDeductions.forEach(d => {
      if (!d.enabled) return;
      if (d.type === 'percent') deductions += g * ((parseFloat(d.value) || 0) / 100);
      else deductions += parseFloat(d.value) || 0;
    });
  }
  return Math.max(0, g - deductions);
}

const DEFAULT_SETTINGS = {
  mode: 'uk',
  grossInput: 'yearly',
  gross: '',
  incomeTax: true,
  nationalInsurance: true,
  studentPlan: 'none',
  pension: false,
  pensionPercent: '5',
  pensionPreTax: true,
  customDeductions: [],
};

const STORAGE_KEY = 'tally-salary-calc';

export default function ActionsPanel({ income, setIncome, categoryTotals, setShowAddModal, setShowDebtModal, setShowSavingsModal, setShowCategoryModal }) {
  const cs = useCurrency();
  const [calcEnabled, setCalcEnabled] = useState(false);
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [showCalc, setShowCalc] = useState(false);
  const [newDeduction, setNewDeduction] = useState({ name: '', value: '', type: 'fixed' });
  const [loaded, setLoaded] = useState(false);

  // Load saved settings
  useEffect(() => {
    window.storage?.get(STORAGE_KEY).then(result => {
      if (result?.value) {
        try {
          const saved = JSON.parse(result.value);
          if (saved.settings) setSettings(saved.settings);
          if (saved.calcEnabled !== undefined) setCalcEnabled(saved.calcEnabled);
        } catch {}
      }
      setLoaded(true);
    }).catch(() => setLoaded(true));
  }, []);

  // Save settings whenever they change
  useEffect(() => {
    if (!loaded) return;
    window.storage?.set(STORAGE_KEY, JSON.stringify({ settings, calcEnabled })).catch(() => {});
  }, [settings, calcEnabled, loaded]);

  // Auto-populate income when calculator is enabled and gross changes
  useEffect(() => {
    if (!calcEnabled || !loaded) return;
    const net = getNetMonthly();
    if (net > 0) setIncome(Math.round(net * 100) / 100);
  }, [calcEnabled, settings, loaded]);

  const updateSettings = (patch) => setSettings(s => ({ ...s, ...patch }));

  const getNetMonthly = () => {
    if (settings.mode === 'uk') {
      const gross = parseFloat(settings.gross) || 0;
      const yearly = settings.grossInput === 'yearly' ? gross : gross * 12;
      return calcUKTakeHome(yearly, settings);
    } else {
      const grossMonthly = settings.grossInput === 'yearly'
        ? (parseFloat(settings.gross) || 0) / 12
        : parseFloat(settings.gross) || 0;
      return calcCustomTakeHome(grossMonthly, settings);
    }
  };

  const netMonthly = getNetMonthly();
  const gross = parseFloat(settings.gross) || 0;
  const grossYearly = settings.grossInput === 'yearly' ? gross : gross * 12;

  const addCustomDeduction = () => {
    if (!newDeduction.name.trim() || !newDeduction.value) return;
    updateSettings({
      customDeductions: [...(settings.customDeductions || []), {
        id: Date.now().toString(),
        name: newDeduction.name.trim(),
        value: newDeduction.value,
        type: newDeduction.type,
        enabled: true,
      }]
    });
    setNewDeduction({ name: '', value: '', type: 'fixed' });
  };

  const removeDeduction = (id) => {
    updateSettings({ customDeductions: settings.customDeductions.filter(d => d.id !== id) });
  };

  const toggleDeduction = (id) => {
    updateSettings({ customDeductions: settings.customDeductions.map(d => d.id === id ? { ...d, enabled: !d.enabled } : d) });
  };

  // Breakdown for display
  const getBreakdown = () => {
    if (!gross) return [];
    const items = [];
    const g = settings.mode === 'uk'
      ? (settings.grossInput === 'yearly' ? gross : gross * 12)
      : (settings.grossInput === 'yearly' ? gross / 12 : gross);

    if (settings.mode === 'uk') {
      const gy = g;
      if (settings.incomeTax) {
        let taxableIncome = Math.max(0, gy - UK_PERSONAL_ALLOWANCE);
        if (gy > 100000) { const r = Math.min(UK_PERSONAL_ALLOWANCE, (gy - 100000) / 2); taxableIncome = Math.max(0, gy - (UK_PERSONAL_ALLOWANCE - r)); }
        const pensionRate = (settings.pension && settings.pensionPreTax) ? (parseFloat(settings.pensionPercent) || 0) / 100 : 0;
        const adjGross = Math.max(0, gy - gy * pensionRate);
        const adjTaxable = Math.max(0, adjGross - UK_PERSONAL_ALLOWANCE);
        const basic = Math.min(adjTaxable, UK_BASIC_RATE_LIMIT - UK_PERSONAL_ALLOWANCE);
        const higher = Math.min(Math.max(0, adjTaxable - (UK_BASIC_RATE_LIMIT - UK_PERSONAL_ALLOWANCE)), UK_HIGHER_RATE_LIMIT - UK_BASIC_RATE_LIMIT);
        const additional = Math.max(0, adjTaxable - (UK_HIGHER_RATE_LIMIT - UK_PERSONAL_ALLOWANCE));
        const tax = (basic * UK_BASIC_RATE) + (higher * UK_HIGHER_RATE) + (additional * UK_ADDITIONAL_RATE);
        if (tax > 0) items.push({ label: 'Income Tax', amount: tax / 12, color: tc.danger });
      }
      if (settings.nationalInsurance) {
        const niBasic = Math.min(Math.max(0, gy - UK_NI_LOWER), UK_NI_UPPER - UK_NI_LOWER);
        const niUpper = Math.max(0, gy - UK_NI_UPPER);
        const ni = (niBasic * UK_NI_BASIC) + (niUpper * UK_NI_UPPER_RATE);
        if (ni > 0) items.push({ label: 'National Insurance', amount: ni / 12, color: tc.warning });
      }
      if (settings.studentPlan && settings.studentPlan !== 'none') {
        const plan = STUDENT_PLANS.find(p => p.key === settings.studentPlan);
        if (plan) { const sl = Math.max(0, gy - plan.threshold) * plan.rate; if (sl > 0) items.push({ label: `Student Loan (${plan.label})`, amount: sl / 12, color: tc.purple }); }
      }
      if (settings.pension) {
        const pa = gy * ((parseFloat(settings.pensionPercent) || 0) / 100);
        if (pa > 0) items.push({ label: `Pension (${settings.pensionPercent}%)`, amount: pa / 12, color: tc.info });
      }
    }

    (settings.customDeductions || []).filter(d => d.enabled).forEach(d => {
      const base = settings.mode === 'uk' ? g / 12 : g;
      const amt = d.type === 'percent' ? base * ((parseFloat(d.value) || 0) / 100) : parseFloat(d.value) || 0;
      if (amt > 0) items.push({ label: d.name, amount: amt, color: tc.muted });
    });

    return items;
  };

  const breakdown = getBreakdown();
  const totalDeductions = breakdown.reduce((s, i) => s + i.amount, 0);

  return (
    <div className="glass-card animate-in" style={{ padding: '20px', animationDelay: '0.6s' }}>
      <h2 className="font-display" style={{ fontSize: '24px', marginBottom: '20px' }}>Quick Actions</h2>

      {/* ── Income Section ── */}
      <div style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
          <label style={{ color: 'var(--text-secondary)', fontSize: '13px', fontWeight: '500' }}>
            Monthly Income
            {calcEnabled && netMonthly > 0 && (
              <span style={{ marginLeft: '8px', fontSize: '11px', color: tc.info, background: tc.infoTint, padding: '2px 7px', borderRadius: '5px', border: '1px solid var(--info-tint-strong)', fontWeight: '600' }}>
                Calculated
              </span>
            )}
          </label>
          <button
            onClick={() => { setCalcEnabled(!calcEnabled); if (calcEnabled) {} }}
            style={{
              fontSize: '11px', fontWeight: '600', padding: '3px 10px', borderRadius: '6px', cursor: 'pointer',
              border: calcEnabled ? '1px solid var(--accent-primary)' : '1px solid var(--border)',
              background: calcEnabled ? 'var(--info-tint)' : 'var(--glass)',
              color: calcEnabled ? 'var(--accent-primary)' : 'var(--text-muted)',
              transition: 'all 0.2s',
            }}
          >
            {calcEnabled ? '✓ Calculator on' : 'Use calculator'}
          </button>
        </div>
        <input
          type="number"
          className="input"
          value={income}
          onChange={(e) => { setIncome(e.target.value === '' ? '' : e.target.value); }}
          onBlur={(e) => setIncome(parseFloat(e.target.value) || 0)}
          onKeyDown={(e) => { if (e.key === 'Enter') e.target.blur(); }}
          style={{ opacity: calcEnabled && netMonthly > 0 ? 0.7 : 1 }}
        />
        {calcEnabled && netMonthly > 0 && (
          <p style={{ fontSize: '11px', color: tc.muted, marginTop: '4px' }}>
            Auto-set from take-home calculator · <button onClick={() => setCalcEnabled(false)} style={{ background: 'none', border: 'none', color: tc.info, cursor: 'pointer', fontSize: '11px', padding: 0 }}>override manually</button>
          </p>
        )}
      </div>

      {/* ── Take-Home Calculator ── */}
      {calcEnabled && (
        <div style={{ marginBottom: '20px', padding: '16px', background: 'var(--glass)', borderRadius: '14px', border: '1px solid var(--border)' }}>
          <button
            onClick={() => setShowCalc(!showCalc)}
            style={{ width: '100%', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 0, marginBottom: showCalc ? '16px' : 0 }}
          >
            <span style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-primary)' }}>Take-Home Calculator</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {netMonthly > 0 && !showCalc && (
                <span className="font-mono" style={{ fontSize: '13px', color: tc.success, fontWeight: '700' }}>{cs}{netMonthly.toFixed(2)}/mo</span>
              )}
              <span style={{ display: 'inline-flex', transform: showCalc ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s', color: 'var(--text-muted)' }}><Icons.ChevronDown size={16} /></span>
            </div>
          </button>

          {showCalc && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>

              {/* Mode toggle */}
              <div style={{ display: 'flex', gap: '6px' }}>
                {['uk', 'custom'].map(m => (
                  <button key={m} onClick={() => updateSettings({ mode: m })} style={{
                    flex: 1, padding: '7px', borderRadius: '8px', fontSize: '12px', fontWeight: '600', cursor: 'pointer',
                    border: settings.mode === m ? '2px solid var(--accent-primary)' : '1px solid var(--border)',
                    background: settings.mode === m ? 'var(--info-tint)' : 'var(--glass)',
                    color: settings.mode === m ? 'var(--accent-primary)' : 'var(--text-muted)',
                  }}>
                    {m === 'uk' ? '🇬🇧 UK' : '🌍 Custom'}
                  </button>
                ))}
              </div>

              {/* Gross input */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <label style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: '500' }}>Gross Salary</label>
                  <div style={{ display: 'flex', gap: '4px' }}>
                    {['yearly', 'monthly'].map(t => (
                      <button key={t} onClick={() => updateSettings({ grossInput: t })} style={{
                        padding: '3px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: '600', cursor: 'pointer',
                        border: settings.grossInput === t ? '1px solid var(--accent-primary)' : '1px solid var(--border)',
                        background: settings.grossInput === t ? 'var(--info-tint)' : 'transparent',
                        color: settings.grossInput === t ? 'var(--accent-primary)' : 'var(--text-muted)',
                      }}>{t}</button>
                    ))}
                  </div>
                </div>
                <input
                  type="number"
                  className="input"
                  placeholder={settings.grossInput === 'yearly' ? 'e.g. 35000' : 'e.g. 2917'}
                  value={settings.gross}
                  onChange={(e) => updateSettings({ gross: e.target.value })}
                />
              </div>

              {/* UK deductions */}
              {settings.mode === 'uk' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>UK Deductions</div>

                  {/* Income Tax toggle */}
                  <DeductionRow
                    label="Income Tax"
                    sublabel={grossYearly > UK_BASIC_RATE_LIMIT ? '40% higher rate applies' : '20% basic rate'}
                    enabled={settings.incomeTax}
                    onToggle={() => updateSettings({ incomeTax: !settings.incomeTax })}
                    color={tc.danger}
                  />

                  {/* NI toggle */}
                  <DeductionRow
                    label="National Insurance"
                    sublabel="Class 1 — 8% / 2%"
                    enabled={settings.nationalInsurance}
                    onToggle={() => updateSettings({ nationalInsurance: !settings.nationalInsurance })}
                    color={tc.warning}
                  />

                  {/* Student loan */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <div style={{ fontSize: '13px', fontWeight: '500' }}>Student Finance</div>
                        <div style={{ fontSize: '11px', color: tc.muted }}>9% above threshold</div>
                      </div>
                      <select
                        className="input"
                        value={settings.studentPlan}
                        onChange={(e) => updateSettings({ studentPlan: e.target.value })}
                        style={{ width: 'auto', fontSize: '12px', padding: '4px 8px', height: 'auto' }}
                      >
                        {STUDENT_PLANS.map(p => <option key={p.key} value={p.key}>{p.label}</option>)}
                      </select>
                    </div>
                  </div>

                  {/* Pension */}
                  <div>
                    <DeductionRow
                      label="Pension"
                      sublabel={settings.pension ? `${settings.pensionPercent}% · ${settings.pensionPreTax ? 'pre-tax' : 'post-tax'}` : 'Auto-enrolment or custom'}
                      enabled={settings.pension}
                      onToggle={() => updateSettings({ pension: !settings.pension })}
                      color={tc.info}
                    />
                    {settings.pension && (
                      <div style={{ marginTop: '8px', paddingLeft: '12px', display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <input
                          type="number"
                          className="input"
                          value={settings.pensionPercent}
                          onChange={(e) => updateSettings({ pensionPercent: e.target.value })}
                          style={{ width: '70px' }}
                          placeholder="%"
                        />
                        <span style={{ fontSize: '12px', color: tc.muted }}>%</span>
                        <div style={{ display: 'flex', gap: '4px', marginLeft: 'auto' }}>
                          {['pre', 'post'].map(t => (
                            <button key={t} onClick={() => updateSettings({ pensionPreTax: t === 'pre' })} style={{
                              padding: '3px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: '600', cursor: 'pointer',
                              border: (settings.pensionPreTax ? 'pre' : 'post') === t ? '1px solid var(--accent-primary)' : '1px solid var(--border)',
                              background: (settings.pensionPreTax ? 'pre' : 'post') === t ? 'var(--info-tint)' : 'transparent',
                              color: (settings.pensionPreTax ? 'pre' : 'post') === t ? 'var(--accent-primary)' : 'var(--text-muted)',
                            }}>{t}-tax</button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Custom deductions */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  {settings.mode === 'uk' ? 'Other Deductions' : 'Deductions'}
                </div>
                {(settings.customDeductions || []).map(d => (
                  <div key={d.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 10px', background: 'var(--bg-card)', borderRadius: '8px', border: '1px solid var(--border)' }}>
                    <button onClick={() => toggleDeduction(d.id)} style={{ width: '18px', height: '18px', borderRadius: '4px', border: d.enabled ? 'none' : '2px solid var(--border)', background: d.enabled ? 'var(--accent-primary)' : 'transparent', flexShrink: 0, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {d.enabled && <Icons.Check size={11} style={{ color: '#fff' }} />}
                    </button>
                    <span style={{ flex: 1, fontSize: '13px', color: d.enabled ? 'var(--text-primary)' : 'var(--text-muted)' }}>{d.name}</span>
                    <span className="font-mono" style={{ fontSize: '12px', color: tc.muted }}>{d.type === 'percent' ? `${d.value}%` : `${cs}${d.value}`}</span>
                    <button onClick={() => removeDeduction(d.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: tc.danger, padding: '0 2px', fontSize: '14px', lineHeight: 1 }}>✕</button>
                  </div>
                ))}
                <div style={{ display: 'flex', gap: '6px' }}>
                  <input className="input" placeholder="Name" value={newDeduction.name} onChange={(e) => setNewDeduction(d => ({ ...d, name: e.target.value }))} style={{ flex: 2 }} />
                  <input type="number" className="input" placeholder="Amount" value={newDeduction.value} onChange={(e) => setNewDeduction(d => ({ ...d, value: e.target.value }))} style={{ flex: 1 }} />
                  <button onClick={() => setNewDeduction(d => ({ ...d, type: d.type === 'fixed' ? 'percent' : 'fixed' }))} style={{ padding: '0 10px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--glass)', cursor: 'pointer', fontSize: '12px', fontWeight: '600', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                    {newDeduction.type === 'fixed' ? cs : '%'}
                  </button>
                  <button onClick={addCustomDeduction} style={{ padding: '0 12px', borderRadius: '8px', border: 'none', background: 'var(--accent-primary)', cursor: 'pointer', color: '#fff', fontSize: '16px', fontWeight: '700' }}>+</button>
                </div>
              </div>

              {/* Results breakdown */}
              {gross > 0 && (
                <div style={{ padding: '12px', background: 'var(--bg-card)', borderRadius: '10px', border: '1px solid var(--border)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: tc.muted, marginBottom: '8px', paddingBottom: '8px', borderBottom: '1px solid var(--border)' }}>
                    <span>Gross ({settings.grossInput === 'yearly' ? 'yearly' : 'monthly'})</span>
                    <span className="font-mono">{settings.grossInput === 'yearly' ? `${cs}${gross.toFixed(0)}` : `${cs}${gross.toFixed(0)}/mo`}</span>
                  </div>
                  {breakdown.map((item, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
                      <span style={{ color: tc.secondary }}>− {item.label}</span>
                      <span className="font-mono" style={{ color: item.color }}>−{cs}{item.amount.toFixed(0)}/mo</span>
                    </div>
                  ))}
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '10px', paddingTop: '10px', borderTop: '1px solid var(--border)' }}>
                    <span style={{ fontSize: '13px', fontWeight: '700' }}>Take-home</span>
                    <span className="font-mono" style={{ fontSize: '15px', fontWeight: '700', color: tc.success }}>{cs}{netMonthly.toFixed(2)}/mo</span>
                  </div>
                  {settings.mode === 'uk' && grossYearly > 0 && (
                    <div style={{ fontSize: '11px', color: tc.muted, marginTop: '4px', textAlign: 'right' }}>
                      Effective rate: {((totalDeductions / (grossYearly / 12)) * 100).toFixed(1)}% · {cs}{(netMonthly * 12).toFixed(0)}/yr
                    </div>
                  )}
                </div>
              )}

            </div>
          )}
        </div>
      )}

      {/* ── Action buttons ── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '16px' }}>
        <button className="btn btn-primary" onClick={() => setShowAddModal(true)} style={{ width: '100%', justifyContent: 'center' }}><Icons.Plus size={20} /> Add New Bill</button>
        <button className="btn btn-primary" onClick={() => setShowDebtModal(true)} style={{ width: '100%', justifyContent: 'center', background: 'linear-gradient(135deg, var(--danger), var(--accent-secondary))' }}><Icons.Plus size={20} /> Add New Debt</button>
        <button className="btn btn-primary" onClick={() => setShowSavingsModal(true)} style={{ width: '100%', justifyContent: 'center', background: 'linear-gradient(135deg, var(--success), var(--accent-primary))' }}><Icons.Plus size={20} /> Add Savings Goal</button>
        <button className="btn btn-secondary" onClick={() => setShowCategoryModal(true)} style={{ width: '100%', justifyContent: 'center' }}>Manage Categories</button>
      </div>

      {/* ── Category Summary ── */}
      {categoryTotals.length > 0 && (
        <div style={{ padding: '16px', background: 'var(--glass)', borderRadius: '12px', border: '1px solid var(--border)' }}>
          <h3 style={{ fontSize: '13px', fontWeight: '600', marginBottom: '10px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Category Summary</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {categoryTotals.map((cat) => (
              <div key={cat.name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0' }}>
                <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{cat.name}</span>
                <span className="font-mono" style={{ fontSize: '13px', fontWeight: '600' }}>{cs}{cat.total.toFixed(2)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function DeductionRow({ label, sublabel, enabled, onToggle, color }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <div>
        <div style={{ fontSize: '13px', fontWeight: '500' }}>{label}</div>
        <div style={{ fontSize: '11px', color: tc.muted }}>{sublabel}</div>
      </div>
      <button
        onClick={onToggle}
        style={{
          width: '42px', height: '24px', borderRadius: '12px', border: 'none', cursor: 'pointer',
          background: enabled ? color : 'var(--border)',
          position: 'relative', transition: 'background 0.2s', flexShrink: 0,
        }}
      >
        <div style={{
          width: '18px', height: '18px', borderRadius: '50%', background: '#fff',
          position: 'absolute', top: '3px',
          left: enabled ? '21px' : '3px',
          transition: 'left 0.2s',
        }} />
      </button>
    </div>
  );
}

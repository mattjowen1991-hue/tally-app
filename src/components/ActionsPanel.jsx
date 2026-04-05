import { useCurrency } from './CurrencyContext';
import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
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
  if (g > 100000) {
    const reduction = Math.min(UK_PERSONAL_ALLOWANCE, (g - 100000) / 2);
    taxableIncome = Math.max(0, g - (UK_PERSONAL_ALLOWANCE - reduction));
  }
  let tax = 0;
  if (settings.incomeTax) {
    const basicTaxable = Math.min(taxableIncome, UK_BASIC_RATE_LIMIT - UK_PERSONAL_ALLOWANCE);
    const higherTaxable = Math.min(Math.max(0, taxableIncome - (UK_BASIC_RATE_LIMIT - UK_PERSONAL_ALLOWANCE)), UK_HIGHER_RATE_LIMIT - UK_BASIC_RATE_LIMIT);
    const additionalTaxable = Math.max(0, taxableIncome - (UK_HIGHER_RATE_LIMIT - UK_PERSONAL_ALLOWANCE));
    tax = (basicTaxable * UK_BASIC_RATE) + (higherTaxable * UK_HIGHER_RATE) + (additionalTaxable * UK_ADDITIONAL_RATE);
  }
  let ni = 0;
  if (settings.nationalInsurance) {
    const niBasic = Math.min(Math.max(0, g - UK_NI_LOWER), UK_NI_UPPER - UK_NI_LOWER);
    const niUpper = Math.max(0, g - UK_NI_UPPER);
    ni = (niBasic * UK_NI_BASIC) + (niUpper * UK_NI_UPPER_RATE);
  }
  let studentLoan = 0;
  if (settings.studentPlan && settings.studentPlan !== 'none') {
    const plan = STUDENT_PLANS.find(p => p.key === settings.studentPlan);
    if (plan) studentLoan = Math.max(0, g - plan.threshold) * plan.rate;
  }
  const pensionRate = (parseFloat(settings.pensionPercent) || 0) / 100;
  const pensionAmount = settings.pension ? g * pensionRate : 0;
  let finalTax = tax;
  if (settings.pension && settings.pensionPreTax && settings.incomeTax) {
    const adjustedGross = Math.max(0, g - pensionAmount);
    const adjTaxable = Math.max(0, adjustedGross - UK_PERSONAL_ALLOWANCE);
    const basicTaxable = Math.min(adjTaxable, UK_BASIC_RATE_LIMIT - UK_PERSONAL_ALLOWANCE);
    const higherTaxable = Math.min(Math.max(0, adjTaxable - (UK_BASIC_RATE_LIMIT - UK_PERSONAL_ALLOWANCE)), UK_HIGHER_RATE_LIMIT - UK_BASIC_RATE_LIMIT);
    const additionalTaxable = Math.max(0, adjTaxable - (UK_HIGHER_RATE_LIMIT - UK_PERSONAL_ALLOWANCE));
    finalTax = (basicTaxable * UK_BASIC_RATE) + (higherTaxable * UK_HIGHER_RATE) + (additionalTaxable * UK_ADDITIONAL_RATE);
  }
  let customTotal = 0;
  if (settings.customDeductions) {
    settings.customDeductions.forEach(d => {
      if (!d.enabled) return;
      if (d.type === 'percent') customTotal += g * ((parseFloat(d.value) || 0) / 100);
      else customTotal += parseFloat(d.value) || 0;
    });
  }
  return Math.max(0, g - finalTax - ni - studentLoan - pensionAmount - customTotal) / 12;
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
  mode: 'uk', grossInput: 'yearly', gross: '',
  incomeTax: true, nationalInsurance: true, studentPlan: 'none',
  pension: false, pensionPercent: '5', pensionPreTax: true, customDeductions: [],
};

function InfoTip({ text, title }) {
  const [open, setOpen] = React.useState(false);
  return (
    <>
      <button
        onClick={(e) => { e.stopPropagation(); setOpen(true); }}
        style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0 2px', color: 'var(--text-muted)', fontSize: '14px', lineHeight: 1, flexShrink: 0, display: 'inline-flex', alignItems: 'center' }}
      >ⓘ</button>
      {open && (
        <div
          onClick={() => setOpen(false)}
          style={{
            position: 'fixed', inset: 0, zIndex: 9999,
            background: 'rgba(0,0,0,0.6)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '24px',
            touchAction: 'none',
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: 'var(--bg-card)', borderRadius: '16px',
              border: '1px solid var(--border)',
              padding: '20px', maxWidth: '320px', width: '100%',
              boxShadow: '0 20px 60px rgba(0,0,0,0.4)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: title ? '12px' : '0' }}>
              {title && <span style={{ fontSize: '15px', fontWeight: '600', color: 'var(--text-primary)' }}>{title}</span>}
              <button
                onClick={() => setOpen(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: '18px', padding: '0', marginLeft: 'auto', lineHeight: 1 }}
              >✕</button>
            </div>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0 }}>{text}</p>
            <button
              onClick={() => setOpen(false)}
              className="btn btn-primary"
              style={{ width: '100%', justifyContent: 'center', marginTop: '16px', padding: '10px' }}
            >Got it</button>
          </div>
        </div>
      )}
    </>
  );
}

function DeductionRow({ label, sublabel, enabled, onToggle, color, tip }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: '14px', fontWeight: '500', display: 'flex', alignItems: 'center', gap: '6px' }}>
          {label}{tip && <InfoTip text={tip} title={label} />}
        </div>
        <div style={{ fontSize: '12px', color: tc.muted, marginTop: '2px' }}>{sublabel}</div>
      </div>
      <button onClick={onToggle} style={{ width: '44px', height: '26px', borderRadius: '13px', border: 'none', cursor: 'pointer', background: enabled ? color : 'var(--border)', position: 'relative', transition: 'background 0.2s', flexShrink: 0, marginLeft: '12px' }}>
        <div style={{ width: '20px', height: '20px', borderRadius: '50%', background: '#fff', position: 'absolute', top: '3px', left: enabled ? '21px' : '3px', transition: 'left 0.2s' }} />
      </button>
    </div>
  );
}

function TakeHomeModal({ show, onClose, settings, updateSettings, cs, netMonthly, breakdown, totalDeductions, grossYearly, newDeduction, setNewDeduction, addCustomDeduction, removeDeduction, toggleDeduction, onApply }) {
  const touchStartX = React.useRef(null);
  const touchStartY = React.useRef(null);
  const modalRef = React.useRef(null);

  React.useEffect(() => {
    if (show) {
      document.body.style.overflow = 'hidden';
      document.body.style.touchAction = 'none';
    } else {
      document.body.style.overflow = '';
      document.body.style.touchAction = '';
    }
    return () => {
      document.body.style.overflow = '';
      document.body.style.touchAction = '';
    };
  }, [show]);

  React.useEffect(() => {
    if (!show || !modalRef.current) return;
    const el = modalRef.current;

    const onStart = (e) => {
      touchStartX.current = e.touches[0].clientX;
      touchStartY.current = e.touches[0].clientY;
    };
    const onEnd = (e) => {
      if (touchStartX.current === null) return;
      const dx = e.changedTouches[0].clientX - touchStartX.current;
      const dy = Math.abs(e.changedTouches[0].clientY - touchStartY.current);
      if (dx < -60 && dy < 80) onClose();
      touchStartX.current = null;
      touchStartY.current = null;
    };

    el.addEventListener('touchstart', onStart, { passive: true });
    el.addEventListener('touchend', onEnd, { passive: true });
    return () => {
      el.removeEventListener('touchstart', onStart);
      el.removeEventListener('touchend', onEnd);
    };
  }, [show, onClose]);

  if (!show) return null;
  const gross = parseFloat(settings.gross) || 0;
  const netYearly = netMonthly * 12;

  return ReactDOM.createPortal(
    <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }} onClick={onClose} />
      <div ref={modalRef} style={{ position: 'relative', zIndex: 1, background: 'var(--bg-secondary)', borderRadius: '24px 24px 0 0', maxHeight: '92vh', display: 'flex', flexDirection: 'column', animation: 'slideInUp 0.25s ease' }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 20px 0', flexShrink: 0 }}>
          <div>
            <h2 className="font-display" style={{ fontSize: '22px', marginBottom: '2px' }}>Take-Home Calculator</h2>
            <p style={{ fontSize: '12px', color: tc.muted }}>Estimate your monthly take-home pay</p>
          </div>
          <button onClick={onClose} style={{ width: '32px', height: '32px', borderRadius: '50%', border: '1px solid var(--border)', background: 'var(--glass)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', flexShrink: 0 }}>
            <Icons.X size={16} />
          </button>
        </div>

        {/* Scrollable content */}
        <div style={{ overflowY: 'auto', flex: 1, padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '20px' }}>

          {/* Mode toggle */}
          <div style={{ display: 'flex', gap: '8px' }}>
            {['uk', 'custom'].map(m => (
              <button key={m} onClick={() => updateSettings({ mode: m })} style={{ flex: 1, padding: '10px', borderRadius: '10px', fontSize: '13px', fontWeight: '600', cursor: 'pointer', border: settings.mode === m ? '2px solid var(--accent-primary)' : '1px solid var(--border)', background: settings.mode === m ? 'var(--info-tint)' : 'var(--glass)', color: settings.mode === m ? 'var(--accent-primary)' : 'var(--text-muted)' }}>
                {m === 'uk' ? '🇬🇧 UK (2024/25)' : '🌍 Custom'}
              </button>
            ))}
          </div>

          {/* Gross salary */}
          <div style={{ padding: '16px', background: 'var(--glass)', borderRadius: '14px', border: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <label style={{ fontSize: '14px', fontWeight: '600' }}>Gross Salary</label>
              <div style={{ display: 'flex', gap: '4px' }}>
                {['yearly', 'monthly'].map(t => (
                  <button key={t} onClick={() => updateSettings({ grossInput: t })} style={{ padding: '4px 12px', borderRadius: '6px', fontSize: '12px', fontWeight: '600', cursor: 'pointer', border: settings.grossInput === t ? '1px solid var(--accent-primary)' : '1px solid var(--border)', background: settings.grossInput === t ? 'var(--info-tint)' : 'transparent', color: settings.grossInput === t ? 'var(--accent-primary)' : 'var(--text-muted)' }}>{t}</button>
                ))}
              </div>
            </div>
            <input type="number" className="input" placeholder={settings.grossInput === 'yearly' ? 'e.g. 35000' : 'e.g. 2917'} value={settings.gross} onChange={(e) => updateSettings({ gross: e.target.value })} style={{ fontSize: '16px' }} />
          </div>

          {/* UK deductions */}
          {settings.mode === 'uk' && (
            <div>
              <div style={{ fontSize: '11px', fontWeight: '700', color: tc.muted, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '10px' }}>UK Deductions</div>
              <div style={{ background: 'var(--glass)', borderRadius: '14px', border: '1px solid var(--border)', overflow: 'hidden' }}>
                <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)' }}>
                  <DeductionRow label="Income Tax" sublabel={grossYearly > UK_BASIC_RATE_LIMIT ? '40% higher rate applies' : '20% basic rate'} enabled={settings.incomeTax} onToggle={() => updateSettings({ incomeTax: !settings.incomeTax })} color={tc.danger} tip="Most employees pay income tax via PAYE. You get a £12,570 tax-free allowance, then pay 20% up to £50,270, 40% up to £125,140, and 45% above that." />
                </div>
                <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)' }}>
                  <DeductionRow label="National Insurance" sublabel="Class 1 — 8% / 2%" enabled={settings.nationalInsurance} onToggle={() => updateSettings({ nationalInsurance: !settings.nationalInsurance })} color={tc.warning} tip="NI contributions fund the NHS, state pension, and benefits. As an employee you pay 8% on earnings between £12,570–£50,270, then 2% above that." />
                </div>
                <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontSize: '14px', fontWeight: '500', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        Student Finance
                        <InfoTip title="Student Finance" text="You repay 9% of earnings above your plan's threshold. Plan 1: started before 2012 (England/Wales) or any year (Scotland/NI). Plan 2: started 2012 or later (England/Wales). Plan 4: Scottish students. Plan 5: new courses from 2023. Postgrad: Master's/PhD loans." />
                      </div>
                      <div style={{ fontSize: '12px', color: tc.muted, marginTop: '2px' }}>9% above threshold</div>
                    </div>
                    <select className="input" value={settings.studentPlan} onChange={(e) => updateSettings({ studentPlan: e.target.value })} style={{ width: 'auto', fontSize: '12px', padding: '6px 10px', height: 'auto' }}>
                      {STUDENT_PLANS.map(p => <option key={p.key} value={p.key}>{p.label}{p.threshold ? ` (£${p.threshold.toLocaleString()})` : ''}</option>)}
                    </select>
                  </div>
                </div>
                <div style={{ padding: '14px 16px' }}>
                  <DeductionRow label="Pension" sublabel={settings.pension ? `${settings.pensionPercent}% · ${settings.pensionPreTax ? 'pre-tax' : 'post-tax'}` : 'Auto-enrolment or custom'} enabled={settings.pension} onToggle={() => updateSettings({ pension: !settings.pension })} color={tc.info} tip="Auto-enrolment minimum is 5% employee + 3% employer. Pre-tax contributions reduce your taxable income (saving you tax). Post-tax contributions don't. Most workplace pensions are pre-tax." />
                  {settings.pension && (
                    <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid var(--border)', display: 'flex', gap: '10px', alignItems: 'center' }}>
                      <input type="number" className="input" value={settings.pensionPercent} onChange={(e) => updateSettings({ pensionPercent: e.target.value })} style={{ width: '80px' }} placeholder="%" />
                      <span style={{ fontSize: '13px', color: tc.muted }}>% contribution</span>
                      <InfoTip title="Pension Contributions" text="Pre-tax: contributions come out before tax is calculated, reducing your tax bill. Post-tax: contributions come out after tax — you may be able to claim relief via Self Assessment." />
                      <div style={{ display: 'flex', gap: '4px', marginLeft: 'auto' }}>
                        {['pre', 'post'].map(t => (
                          <button key={t} onClick={() => updateSettings({ pensionPreTax: t === 'pre' })} style={{ padding: '4px 12px', borderRadius: '6px', fontSize: '12px', fontWeight: '600', cursor: 'pointer', border: (settings.pensionPreTax ? 'pre' : 'post') === t ? '1px solid var(--accent-primary)' : '1px solid var(--border)', background: (settings.pensionPreTax ? 'pre' : 'post') === t ? 'var(--info-tint)' : 'transparent', color: (settings.pensionPreTax ? 'pre' : 'post') === t ? 'var(--accent-primary)' : 'var(--text-muted)' }}>{t}-tax</button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Custom deductions */}
          <div>
            <div style={{ fontSize: '11px', fontWeight: '700', color: tc.muted, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '10px' }}>
              {settings.mode === 'uk' ? 'Other Deductions' : 'Deductions'}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {(settings.customDeductions || []).map(d => (
                <div key={d.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 14px', background: 'var(--glass)', borderRadius: '10px', border: '1px solid var(--border)' }}>
                  <button onClick={() => toggleDeduction(d.id)} style={{ width: '20px', height: '20px', borderRadius: '5px', border: d.enabled ? 'none' : '2px solid var(--border)', background: d.enabled ? 'var(--accent-primary)' : 'transparent', flexShrink: 0, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {d.enabled && <Icons.Check size={12} style={{ color: '#fff' }} />}
                  </button>
                  <span style={{ flex: 1, fontSize: '14px', color: d.enabled ? 'var(--text-primary)' : 'var(--text-muted)' }}>{d.name}</span>
                  <span className="font-mono" style={{ fontSize: '13px', color: tc.muted }}>{d.type === 'percent' ? `${d.value}%` : `${cs}${d.value}`}</span>
                  <button onClick={() => removeDeduction(d.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: tc.danger, padding: '0 2px', fontSize: '16px', lineHeight: 1 }}>✕</button>
                </div>
              ))}
              <div style={{ display: 'flex', gap: '8px' }}>
                <input className="input" placeholder="Name (e.g. Cycle to Work)" value={newDeduction.name} onChange={(e) => setNewDeduction(d => ({ ...d, name: e.target.value }))} style={{ flex: 2 }} />
                <input type="number" className="input" placeholder="Amount" value={newDeduction.value} onChange={(e) => setNewDeduction(d => ({ ...d, value: e.target.value }))} style={{ flex: 1 }} />
                <button onClick={() => setNewDeduction(d => ({ ...d, type: d.type === 'fixed' ? 'percent' : 'fixed' }))} style={{ padding: '0 12px', borderRadius: '10px', border: '1px solid var(--border)', background: 'var(--glass)', cursor: 'pointer', fontSize: '13px', fontWeight: '600', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                  {newDeduction.type === 'fixed' ? cs : '%'}
                </button>
                <button onClick={addCustomDeduction} style={{ padding: '0 14px', borderRadius: '10px', border: 'none', background: 'var(--accent-primary)', cursor: 'pointer', color: '#fff', fontSize: '18px', fontWeight: '700' }}>+</button>
              </div>
            </div>
          </div>

          {/* Results */}
          {gross > 0 && (
            <div style={{ padding: '16px', background: 'var(--glass)', borderRadius: '14px', border: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: tc.muted, marginBottom: '10px', paddingBottom: '10px', borderBottom: '1px solid var(--border)' }}>
                <span>Gross ({settings.grossInput})</span>
                <span className="font-mono">{settings.grossInput === 'yearly' ? `${cs}${gross.toFixed(0)}/yr` : `${cs}${gross.toFixed(0)}/mo`}</span>
              </div>
              {breakdown.map((item, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '6px' }}>
                  <span style={{ color: tc.secondary }}>− {item.label}</span>
                  <span className="font-mono" style={{ color: item.color }}>−{cs}{item.amount.toFixed(0)}/mo</span>
                </div>
              ))}
              <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '4px' }}>
                  <span style={{ fontSize: '15px', fontWeight: '700' }}>Estimated take-home</span>
                  <span className="font-mono" style={{ fontSize: '20px', fontWeight: '700', color: tc.success }}>{cs}{netMonthly.toFixed(2)}/mo</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: tc.muted }}>
                  <span>{settings.mode === 'uk' && grossYearly > 0 ? `Effective deduction rate: ${((totalDeductions / (grossYearly / 12)) * 100).toFixed(1)}%` : ''}</span>
                  <span className="font-mono">{cs}{netYearly.toFixed(0)}/yr</span>
                </div>
              </div>
            </div>
          )}

          {/* Apply button */}
          {netMonthly > 0 && (
            <button onClick={onApply} className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', fontSize: '15px', padding: '14px' }}>
              ✓ Apply — use {cs}{netMonthly.toFixed(2)}/mo as my income
            </button>
          )}

          {/* Disclaimer */}
          <div style={{ padding: '12px 14px', background: 'var(--glass)', borderRadius: '10px', border: '1px solid var(--border)' }}>
            <p style={{ fontSize: '11px', color: tc.muted, lineHeight: 1.6, margin: 0 }}>
              <strong style={{ color: tc.secondary }}>For guidance only.</strong> These calculations are estimates based on standard 2024/25 UK tax rates and may not reflect your exact take-home pay. Individual circumstances vary — including tax codes, employer benefits, salary sacrifice arrangements, and other deductions. Tally is not a financial adviser. For accurate figures, refer to your payslip or consult a qualified accountant or HMRC directly at <span style={{ color: 'var(--accent-primary)' }}>gov.uk/income-tax</span>.
            </p>
          </div>

        </div>
      </div>
    </div>,
    document.body
  );
}

// ── Main panel ────────────────────────────────────────────────────────────────
export default function ActionsPanel({ income, setIncome, categoryTotals, setShowAddModal, setShowDebtModal, setShowSavingsModal, setShowCategoryModal, salaryCalc, setSalaryCalc }) {
  const cs = useCurrency();

  // Derived state from lifted salaryCalc prop
  const calcEnabled = salaryCalc?.calcEnabled || false;
  const calcApplied = salaryCalc?.calcApplied || false;
  const setCalcEnabled = (val) => setSalaryCalc(s => ({ ...s, calcEnabled: val }));
  const setCalcApplied = (val) => setSalaryCalc(s => ({ ...s, calcApplied: val }));

  const [settings, setSettings] = useState(() => salaryCalc?.settings || DEFAULT_SETTINGS);
  const [showCalcModal, setShowCalcModal] = useState(false);
  const [newDeduction, setNewDeduction] = useState({ name: '', value: '', type: 'fixed' });

  // Sync settings into salaryCalc whenever they change
  useEffect(() => {
    setSalaryCalc(s => ({ ...s, settings }));
  }, [settings]);

  // Initialise settings from salaryCalc if it arrives after mount (e.g. from cloud restore)
  useEffect(() => {
    if (salaryCalc?.settings) setSettings(salaryCalc.settings);
  }, [salaryCalc?.calcEnabled]); // re-sync when calc is toggled on after cloud restore

  // Only sync income automatically if calculator has been applied
  useEffect(() => {
    if (!calcEnabled || !calcApplied) return;
    const net = getNetMonthly();
    if (net > 0) setIncome(Math.round(net * 100) / 100);
  }, [calcEnabled, calcApplied, settings]);

  const updateSettings = (patch) => setSettings(s => ({ ...s, ...patch }));

  const getNetMonthly = () => {
    if (settings.mode === 'uk') {
      const gross = parseFloat(settings.gross) || 0;
      const yearly = settings.grossInput === 'yearly' ? gross : gross * 12;
      return calcUKTakeHome(yearly, settings);
    } else {
      const grossMonthly = settings.grossInput === 'yearly' ? (parseFloat(settings.gross) || 0) / 12 : parseFloat(settings.gross) || 0;
      return calcCustomTakeHome(grossMonthly, settings);
    }
  };

  const netMonthly = getNetMonthly();
  const gross = parseFloat(settings.gross) || 0;
  const grossYearly = settings.grossInput === 'yearly' ? gross : gross * 12;

  const addCustomDeduction = () => {
    if (!newDeduction.name.trim() || !newDeduction.value) return;
    updateSettings({ customDeductions: [...(settings.customDeductions || []), { id: Date.now().toString(), name: newDeduction.name.trim(), value: newDeduction.value, type: newDeduction.type, enabled: true }] });
    setNewDeduction({ name: '', value: '', type: 'fixed' });
  };

  const removeDeduction = (id) => updateSettings({ customDeductions: settings.customDeductions.filter(d => d.id !== id) });
  const toggleDeduction = (id) => updateSettings({ customDeductions: settings.customDeductions.map(d => d.id === id ? { ...d, enabled: !d.enabled } : d) });

  const getBreakdown = () => {
    if (!gross) return [];
    const items = [];
    const gy = settings.grossInput === 'yearly' ? gross : gross * 12;
    if (settings.mode === 'uk') {
      if (settings.incomeTax) {
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
      const base = settings.mode === 'uk' ? gy / 12 : (settings.grossInput === 'yearly' ? gross / 12 : gross);
      const amt = d.type === 'percent' ? base * ((parseFloat(d.value) || 0) / 100) : parseFloat(d.value) || 0;
      if (amt > 0) items.push({ label: d.name, amount: amt, color: tc.muted });
    });
    return items;
  };

  const breakdown = getBreakdown();
  const totalDeductions = breakdown.reduce((s, i) => s + i.amount, 0);

  // Toggle the calculator on/off
  const handleCalcToggle = () => {
    if (calcEnabled) {
      // Turning off — clear applied state, unlock the field
      setCalcEnabled(false);
      setCalcApplied(false);
    } else {
      // Turning on — open modal, but NOT applied yet
      setCalcEnabled(true);
      setShowCalcModal(true);
    }
  };

  // Close without applying — if never applied before, turn calculator off entirely
  const handleModalClose = () => {
    setShowCalcModal(false);
    if (!calcApplied) {
      // Never been applied — user just closed without committing, so turn it off
      setCalcEnabled(false);
    }
    // If previously applied, just close — keep the applied income value as-is
  };

  // Apply from modal — commit the calculated value, mark as applied
  const handleApply = () => {
    if (netMonthly > 0) {
      setIncome(Math.round(netMonthly * 100) / 100);
      setCalcApplied(true);
    }
    setShowCalcModal(false);
  };

  return (
    <div className="glass-card animate-in" style={{ padding: '20px', animationDelay: '0.6s' }}>
      <h2 className="font-display" style={{ fontSize: '24px', marginBottom: '20px' }}>Quick Actions</h2>

      {/* ── Income ── */}
      <div style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
          <label style={{ color: 'var(--text-secondary)', fontSize: '13px', fontWeight: '500' }}>Monthly Income</label>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {/* Calculator toggle */}
            <button
              onClick={handleCalcToggle}
              style={{
                display: 'flex', alignItems: 'center', gap: '7px',
                fontSize: '12px', fontWeight: '600', padding: '5px 12px', borderRadius: '20px', cursor: 'pointer',
                border: calcEnabled ? '1.5px solid var(--accent-primary)' : '1.5px solid var(--border)',
                background: calcEnabled ? 'var(--info-tint)' : 'var(--glass)',
                color: calcEnabled ? 'var(--accent-primary)' : 'var(--text-muted)',
                transition: 'all 0.2s',
              }}
            >
              {/* Toggle pill */}
              <div style={{ width: '28px', height: '16px', borderRadius: '8px', background: calcEnabled ? 'var(--accent-primary)' : 'var(--border)', position: 'relative', flexShrink: 0, transition: 'background 0.2s' }}>
                <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#fff', position: 'absolute', top: '2px', left: calcEnabled ? '14px' : '2px', transition: 'left 0.2s' }} />
              </div>
              <Icons.Calculator size={14} />
              {calcEnabled ? 'On' : 'Calculator'}
            </button>
            {calcEnabled && calcApplied && (
              <button
                onClick={() => setShowCalcModal(true)}
                style={{
                  fontSize: '12px', fontWeight: '600', padding: '5px 12px', borderRadius: '20px', cursor: 'pointer',
                  border: '1.5px solid var(--border)',
                  background: 'var(--glass)',
                  color: 'var(--text-secondary)',
                  transition: 'all 0.2s', whiteSpace: 'nowrap',
                }}
              >
                Edit
              </button>
            )}
          </div>
        </div>
        {calcEnabled && calcApplied ? (
          <div style={{
            width: '100%', padding: '12px 16px', borderRadius: '12px',
            border: '1px solid var(--accent-primary)',
            background: 'var(--info-tint)',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            pointerEvents: 'none', userSelect: 'none',
          }}>
            <div>
              <div className="font-mono" style={{ fontSize: '20px', fontWeight: '700', color: 'var(--accent-primary)' }}>
                {cs}{parseFloat(income).toFixed(2)}
              </div>
              <div style={{ fontSize: '11px', color: tc.muted, marginTop: '2px' }}>
                ✓ Applied from take-home calculator
              </div>
            </div>
            <div style={{ fontSize: '11px', color: tc.muted, textAlign: 'right' }}>
              {cs}{(parseFloat(income) * 12).toFixed(0)}/yr
            </div>
          </div>
        ) : (
          <input
            type="number"
            className="input"
            value={income}
            onChange={(e) => setIncome(e.target.value === '' ? '' : e.target.value)}
            onBlur={(e) => setIncome(parseFloat(e.target.value) || 0)}
            onKeyDown={(e) => { if (e.key === 'Enter') e.target.blur(); }}
          />
        )}

        {/* Status hint */}
        {!calcEnabled && (
          <p style={{ fontSize: '11px', color: tc.muted, marginTop: '5px' }}>
            Toggle the calculator to auto-calculate from your salary
          </p>
        )}
      </div>

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

      {/* ── Calculator Modal ── */}
      <TakeHomeModal
        show={showCalcModal}
        onClose={handleModalClose}
        settings={settings}
        updateSettings={updateSettings}
        cs={cs}
        netMonthly={netMonthly}
        breakdown={breakdown}
        totalDeductions={totalDeductions}
        grossYearly={grossYearly}
        newDeduction={newDeduction}
        setNewDeduction={setNewDeduction}
        addCustomDeduction={addCustomDeduction}
        removeDeduction={removeDeduction}
        toggleDeduction={toggleDeduction}
        onApply={handleApply}
      />
    </div>
  );
}

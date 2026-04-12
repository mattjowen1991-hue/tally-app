import { useCurrency } from './CurrencyContext';
import React from 'react';
import ReactDOM from 'react-dom';
import * as Icons from './Icons';
import haptic from '../utils/haptics';
import { tc } from '../utils/themeColors';
import { DEBT_TYPES } from '../data/initialData';
import { calcDynamicMinimum } from '../utils/debtStrategy';

// Reusable bottom sheet for educational info
function InfoSheet({ open, onClose, title, children }) {
  // Block panel swiping and enable swipe-back to close
  React.useEffect(() => {
    if (!open) return;
    window.__tallyModalOpen = true;
    window.history.pushState({ infoSheet: true }, '');
    const handlePopState = () => onClose();
    window.addEventListener('popstate', handlePopState);
    return () => { window.__tallyModalOpen = false; window.removeEventListener('popstate', handlePopState); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  if (!open) return null;

  const close = () => window.history.back();

  return ReactDOM.createPortal(
    <div onClick={close} style={{
      position: 'fixed', inset: 0, zIndex: 10000,
      background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(3px)',
      display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
      animation: 'fadeIn 0.15s ease-out',
    }}>
      <div onClick={(e) => e.stopPropagation()} style={{
        width: '100%', maxWidth: '500px', padding: '24px 20px 32px',
        borderRadius: '20px 20px 0 0',
        background: 'var(--bg-primary, #0f1225)', border: '1px solid var(--border)',
        borderBottom: 'none', animation: 'slideInUp 0.25s cubic-bezier(0.32, 0.72, 0, 1)',
      }}>
        <div style={{ width: '36px', height: '4px', borderRadius: '2px', background: 'var(--border)', margin: '0 auto 16px' }} />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
          <h3 style={{ fontSize: '17px', fontWeight: '700', color: 'var(--text-primary)' }}>{title}</h3>
          <button onClick={close} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '4px' }}>
            <Icons.X size={18} />
          </button>
        </div>
        <div style={{ fontSize: '14px', lineHeight: 1.6, color: 'var(--text-secondary)' }}>
          {children}
        </div>
      </div>
    </div>,
    document.body
  );
}

// Info button that triggers a bottom sheet
function InfoButton({ onClick }) {
  return (
    <button onClick={(e) => { e.stopPropagation(); haptic.light(); onClick(); }}
      style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px', display: 'flex', alignItems: 'center', color: 'var(--text-muted)', opacity: 0.6 }}>
      <Icons.InfoCircle size={15} />
    </button>
  );
}

const PAYMENT_MODES = [
  { key: 'recurring', label: '↻ Recurring', color: tc.info },
  { key: 'one-off', label: '◎ One-off', color: tc.warning },
  { key: 'installment', label: '▤ Installment', color: tc.purple },
  { key: 'bnpl', label: '⏱ Pay Later', color: tc.success },
];

const DEBT_TYPE_ICONS = {
  'Credit Card': Icons.CategoryCreditCard,
  'Personal Loan': Icons.Banknote,
  'Student Loan': Icons.GraduationCap,
  'Car Loan': Icons.CategoryTransport,
  'Store Finance': Icons.ShoppingBag,
  'Buy Now Pay Later': Icons.Clock,
  'Hire Purchase': Icons.Handshake,
  'Mortgage': Icons.CategoryHome,
  'Medical Debt': Icons.CategoryHealth,
  'Payday Loan': Icons.Banknote,
  'Council Tax': Icons.CategoryHome,
  'Utilities': Icons.CategoryUtilities,
  'Court Fine': Icons.Shield,
  'Child Maintenance': Icons.Banknote,
  'HMRC/Tax': Icons.Shield,
  'Other': Icons.CategoryOther,
};

// UK Priority debts — severe consequences for non-payment (eviction, bailiffs, disconnection, prison)
const PRIORITY_DEBTS = {
  'Mortgage': { label: 'Priority', reason: 'Risk of repossession' },
  'Council Tax': { label: 'Priority', reason: 'Bailiff action or prison' },
  'Utilities': { label: 'Priority', reason: 'Risk of disconnection' },
  'Court Fine': { label: 'Priority', reason: 'Bailiff action or prison' },
  'Child Maintenance': { label: 'Priority', reason: 'Court enforcement' },
  'HMRC/Tax': { label: 'Priority', reason: 'Enforcement action' },
};

function getDebtIcon(type, size = 20, color = 'currentColor') {
  const IconComponent = DEBT_TYPE_ICONS[type] || Icons.CategoryOther;
  return <IconComponent size={size} style={{ color }} />;
}

const formatMonths = (m) => {
  if (m === Infinity || !m) return null;
  const years = Math.floor(m / 12);
  const months = m % 12;
  if (years === 0) return `${months} month${months !== 1 ? 's' : ''}`;
  if (months === 0) return `${years} year${years !== 1 ? 's' : ''}`;
  return `${years}y ${months}m`;
};

const getOrdinal = (n) => {
  if (!n || isNaN(n)) return n;
  const s = ['th','st','nd','rd'];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
};

// Calculate months between two dates, accounting for day-of-month
const monthsBetween = (start, end) => {
  const months = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth());
  // If we haven't reached the same day in the current month, subtract 1
  return end.getDate() < start.getDate() ? Math.max(0, months - 1) : Math.max(0, months);
};

// Add months to a date safely (handles month-end edge cases)
const addMonths = (date, months) => {
  const result = new Date(date);
  const day = result.getDate();
  result.setMonth(result.getMonth() + months);
  // If the day changed (e.g., Jan 31 + 1 month = Mar 3), go back to last day of target month
  if (result.getDate() !== day) result.setDate(0);
  return result;
};

const getBnplInfo = (debt) => {
  if (debt.paymentMode !== 'bnpl') return null;
  const promoMonths = debt.bnplPromoMonths || 0;
  const startDate = debt.bnplStartDate ? new Date(debt.bnplStartDate) : null;
  if (!promoMonths || !startDate) return null;
  const now = new Date();
  const endDate = addMonths(startDate, promoMonths);
  const monthsElapsed = monthsBetween(startDate, now);
  const monthsRemaining = Math.max(0, promoMonths - monthsElapsed);
  const isExpired = now >= endDate;
  const monthlyToClear = monthsRemaining > 0 && debt.totalAmount > 0 ? Math.round((debt.totalAmount / monthsRemaining) * 100) / 100 : 0;
  let postPromoInfo = null;
  if (debt.bnplPostInterest > 0 && debt.bnplPostPayment > 0 && debt.totalAmount > 0) {
    const r = debt.bnplPostInterest / 100 / 12;
    let bal = debt.totalAmount, m = 0, ti = 0;
    while (bal > 0 && m < 600) {
      const i = bal * r;
      if (debt.bnplPostPayment <= i) { m = Infinity; break; }
      ti += i; bal = bal + i - debt.bnplPostPayment; m++;
    }
    postPromoInfo = { months: m, totalInterest: Math.round(ti * 100) / 100, monthlyPayment: debt.bnplPostPayment };
  }
  return { promoMonths, monthsRemaining, monthsElapsed, isExpired, endDate, monthlyToClear, postPromoInfo };
};

const getInstallmentInfo = (debt) => {
  if (debt.paymentMode !== 'installment') return null;
  const totalMonths = debt.installmentMonths || 0;
  const startDate = debt.installmentStartDate ? new Date(debt.installmentStartDate) : null;
  if (!totalMonths || totalMonths <= 0) return null;
  const originalAmount = debt.originalAmount || debt.totalAmount;
  const monthlyPayment = totalMonths > 0 ? Math.round((originalAmount / totalMonths) * 100) / 100 : 0;
  let paymentsMade = 0;
  if (startDate) {
    const now = new Date();
    paymentsMade = Math.max(0, Math.min(monthsBetween(startDate, now), totalMonths));
  } else {
    const paidSoFar = Math.max(0, originalAmount - debt.totalAmount);
    paymentsMade = monthlyPayment > 0 ? Math.min(Math.round(paidSoFar / monthlyPayment), totalMonths) : 0;
  }
  const paymentsRemaining = Math.max(0, totalMonths - paymentsMade);
  const endDate = startDate ? addMonths(startDate, totalMonths) : null;
  return { totalMonths, monthlyPayment, paymentsMade, paymentsRemaining, endDate };
};

const getDebtFreeDate = (debt, calculatePayoff) => {
  const payment = debt.recurringPayment || 0;
  if (payment <= 0 || debt.totalAmount <= 0) return null;
  const result = calculatePayoff(debt, payment);
  if (!result || result.months === Infinity) return null;
  const date = addMonths(new Date(), result.months);
  return { date, months: result.months };
};

function getMilestoneLabel(pct) {
  if (pct >= 100) return 'Debt destroyed!';
  if (pct >= 75) return '75% paid off!';
  if (pct >= 50) return 'Halfway there!';
  if (pct >= 25) return 'Quarter done!';
  return '';
}

function getMilestoneIcon(pct) {
  if (pct >= 100) return <Icons.PartyPopper size={28} style={{ color: '#fbbf24' }} />;
  if (pct >= 75) return <Icons.Fire size={28} style={{ color: '#f97316' }} />;
  if (pct >= 50) return <Icons.Trophy size={28} style={{ color: '#a78bfa' }} />;
  return <Icons.Sparkle size={28} style={{ color: 'var(--accent-primary)' }} />;
}

function getMilestoneColor(pct) {
  if (pct >= 100) return { bg: 'linear-gradient(135deg, rgba(251,191,36,0.15), rgba(245,158,11,0.1))', border: 'rgba(251,191,36,0.3)', text: '#fbbf24' };
  if (pct >= 75) return { bg: 'linear-gradient(135deg, rgba(249,115,22,0.12), rgba(234,88,12,0.08))', border: 'rgba(249,115,22,0.25)', text: '#f97316' };
  if (pct >= 50) return { bg: 'linear-gradient(135deg, rgba(167,139,250,0.12), rgba(139,92,246,0.08))', border: 'rgba(167,139,250,0.25)', text: '#a78bfa' };
  return { bg: 'linear-gradient(135deg, color-mix(in srgb, var(--accent-primary) 12%, transparent), color-mix(in srgb, var(--accent-primary) 8%, transparent))', border: 'color-mix(in srgb, var(--accent-primary) 25%, transparent)', text: 'var(--accent-primary)' };
}

// Celebration overlay shown when a milestone is crossed
function MilestoneCelebration({ celebration, onDismiss }) {
  if (!celebration) return null;
  const { milestone, debtName } = celebration;
  const colors = getMilestoneColor(milestone);
  const is100 = milestone >= 100;

  React.useEffect(() => {
    const timer = setTimeout(onDismiss, is100 ? 3500 : 2500);
    return () => clearTimeout(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [celebration]);

  return ReactDOM.createPortal(
    <div onClick={onDismiss} style={{
      position: 'fixed', inset: 0, zIndex: 10000,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)',
      animation: 'fadeIn 0.2s ease-out',
    }}>
      <div style={{
        padding: is100 ? '32px 36px' : '24px 28px', borderRadius: '20px',
        background: colors.bg, border: `1px solid ${colors.border}`,
        textAlign: 'center', maxWidth: '300px',
        animation: 'celebrationIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
        boxShadow: `0 12px 40px rgba(0,0,0,0.3), 0 0 60px ${colors.border}`,
      }}>
        {/* Confetti dots for 100% */}
        {is100 && (
          <div style={{ position: 'relative', height: '0', overflow: 'visible' }}>
            {[...Array(6)].map((_, i) => (
              <div key={i} style={{
                position: 'absolute',
                width: '6px', height: '6px', borderRadius: '50%',
                background: ['#fbbf24', '#f97316', '#a78bfa', '#10b981', '#3b82f6', '#ec4899'][i],
                left: `${15 + i * 14}%`, top: '-10px',
                animation: `confettiFloat ${0.8 + i * 0.15}s ease-out ${i * 0.1}s forwards`,
              }} />
            ))}
          </div>
        )}
        <div style={{ marginBottom: '12px', animation: is100 ? 'celebrationPulse 0.6s ease-in-out 0.3s' : undefined }}>
          {getMilestoneIcon(milestone)}
        </div>
        <div style={{ fontSize: is100 ? '20px' : '17px', fontWeight: '800', color: colors.text, marginBottom: '6px' }}>
          {getMilestoneLabel(milestone)}
        </div>
        <div style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
          {is100 ? (
            <><strong>{debtName}</strong> is completely paid off!</>
          ) : (
            <><strong>{debtName}</strong> is {milestone}% paid off</>
          )}
        </div>
        {is100 && (
          <div style={{ marginTop: '10px', fontSize: '12px', color: 'var(--text-muted)' }}>
            Tap to dismiss
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}

// SVG Progress Ring
function ProgressRing({ progress, size = 100, strokeWidth = 7, color = 'var(--success)' }) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (Math.min(progress, 100) / 100) * circumference;
  return (
    <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
      <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="var(--glass)" strokeWidth={strokeWidth} />
      <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={color} strokeWidth={strokeWidth}
        strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round"
        style={{ transition: 'stroke-dashoffset 0.6s ease-out' }} />
    </svg>
  );
}

// Milestone markers on the progress bar
function MilestoneProgressBar({ progress, cs, originalAmount, totalAmount }) {
  return (
    <div style={{ marginBottom: '10px', marginLeft: '46px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>
        <span>{progress.toFixed(1)}% paid off</span>
        <span>{cs}{(originalAmount - totalAmount).toFixed(2)} paid</span>
      </div>
      <div style={{ position: 'relative' }}>
        <div style={{ height: '5px', background: 'var(--glass)', borderRadius: '3px', overflow: 'hidden', border: '1px solid var(--border)' }}>
          <div style={{ width: `${progress}%`, height: '100%', background: 'linear-gradient(90deg, var(--success), var(--accent-primary))', borderRadius: '3px', transition: 'width 0.5s' }} />
        </div>
        {/* Milestone markers */}
        {[25, 50, 75].map(m => (
          <div key={m} style={{
            position: 'absolute', top: '-2px', left: `${m}%`, transform: 'translateX(-50%)',
            width: '9px', height: '9px', borderRadius: '50%',
            background: progress >= m ? 'var(--success)' : 'var(--bg-secondary, #1a1e3a)',
            border: `1.5px solid ${progress >= m ? 'var(--success)' : 'var(--border)'}`,
            transition: 'all 0.3s',
            boxShadow: progress >= m ? '0 0 6px rgba(16,185,129,0.4)' : 'none',
          }} />
        ))}
      </div>
      {/* Show current milestone badge if at a threshold */}
      {progress >= 25 && progress < 100 && (
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: '4px', marginTop: '6px',
          fontSize: '10px', fontWeight: '700', padding: '2px 8px', borderRadius: '8px',
          color: getMilestoneColor(progress >= 75 ? 75 : progress >= 50 ? 50 : 25).text,
          background: progress >= 75 ? 'rgba(249,115,22,0.1)' : progress >= 50 ? 'rgba(167,139,250,0.1)' : 'color-mix(in srgb, var(--accent-primary) 10%, transparent)',
          border: `1px solid ${getMilestoneColor(progress >= 75 ? 75 : progress >= 50 ? 50 : 25).border}`,
        }}>
          {progress >= 75 ? <Icons.Fire size={10} /> : progress >= 50 ? <Icons.Trophy size={10} /> : <Icons.Sparkle size={10} />}
          {getMilestoneLabel(progress >= 75 ? 75 : progress >= 50 ? 50 : 25)}
        </div>
      )}
    </div>
  );
}

function DebtInfoBanner({ debt, calculatePayoff }) {
  const cs = useCurrency();
  const mode = debt.paymentMode || 'recurring';
  const banners = [];
  const priority = PRIORITY_DEBTS[debt.type];

  // Priority debt warning
  if (priority && debt.totalAmount > 0) {
    banners.push(
      <div key="priority" style={{ fontSize: '12px', padding: '7px 10px', borderRadius: '8px',
        color: tc.danger, background: tc.dangerTintLight, border: `1px solid ${tc.dangerTintStrong}`,
        display: 'flex', alignItems: 'center', gap: '6px' }}>
        <Icons.Shield size={13} style={{ flexShrink: 0 }} />
        <span><strong>Priority debt</strong> · {priority.reason}</span>
      </div>
    );
  }

  // Balance transfer tracking
  if (debt.balanceTransfer && debt.btEndDate && debt.totalAmount > 0) {
    const endDate = new Date(debt.btEndDate);
    const now = new Date();
    const daysLeft = Math.ceil((endDate - now) / (1000 * 60 * 60 * 24));
    const monthsLeft = Math.max(0, Math.ceil(daysLeft / 30.44));
    const isExpired = daysLeft < 0;
    const isUrgent = daysLeft >= 0 && daysLeft <= 60;
    const monthlyToClear = monthsLeft > 0 ? Math.round((debt.totalAmount / monthsLeft) * 100) / 100 : 0;
    banners.push(
      <div key="bt" style={{ fontSize: '12px', padding: '7px 10px', borderRadius: '8px',
        color: isExpired ? tc.danger : isUrgent ? tc.warning : tc.info,
        background: isExpired ? tc.dangerTint : isUrgent ? tc.warningTint : tc.infoTint,
        border: `1px solid ${isExpired ? tc.dangerTintStrong : isUrgent ? tc.warningTintStrong : 'var(--info-tint-strong)'}` }}>
        {isExpired ? (
          <div><Icons.Warning size={13} style={{ verticalAlign: '-2px' }} /> 0% balance transfer expired! · Reverts to {debt.btRevertRate || '?'}% APR</div>
        ) : (
          <>
            <div>Balance transfer · {daysLeft} days left at 0%</div>
            {monthlyToClear > 0 && <div style={{ fontSize: '11px', marginTop: '2px', opacity: 0.8 }}>Pay {cs}{monthlyToClear.toFixed(2)}/mo to clear before {endDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</div>}
            {debt.btRevertRate > 0 && <div style={{ fontSize: '11px', marginTop: '2px', opacity: 0.7 }}>Reverts to {debt.btRevertRate}% APR after</div>}
          </>
        )}
      </div>
    );
  }

  // Mode-specific banners
  if (mode === 'one-off' && debt.dueDate) {
    const due = new Date(debt.dueDate);
    const now = new Date();
    const daysUntil = Math.ceil((due - now) / (1000 * 60 * 60 * 24));
    const isOverdue = daysUntil < 0;
    const isUrgent = daysUntil >= 0 && daysUntil <= 14;
    banners.push(
      <div key="oneoff" style={{ fontSize: '12px', padding: '7px 10px', borderRadius: '8px',
        color: isOverdue ? tc.danger : isUrgent ? tc.warning : tc.secondary,
        background: isOverdue ? tc.dangerTint : isUrgent ? tc.warningTint : 'var(--glass)',
        border: `1px solid ${isOverdue ? tc.dangerTintStrong : isUrgent ? tc.warningTintStrong : 'var(--border)'}` }}>
        {isOverdue ? <><Icons.Warning size={13} style={{ verticalAlign: '-2px' }} /> Overdue by {Math.abs(daysUntil)} days</> : `Due ${due.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })} · ${daysUntil} days`}
      </div>
    );
  }

  if (mode === 'installment') {
    const info = getInstallmentInfo(debt);
    if (info) banners.push(
      <div key="inst" style={{ fontSize: '12px', padding: '7px 10px', borderRadius: '8px', color: tc.purple, background: tc.purpleTint, border: '1px solid rgba(124,58,237,0.15)' }}>
        <div>{cs}{info.monthlyPayment.toFixed(2)}/mo · {info.paymentsMade} of {info.totalMonths} payments</div>
        {info.endDate && <div style={{ fontSize: '11px', marginTop: '2px', opacity: 0.8 }}>Ends {info.endDate.toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })} · {info.paymentsRemaining} left</div>}
      </div>
    );
  }

  if (mode === 'bnpl') {
    const info = getBnplInfo(debt);
    if (info) {
      banners.push(
        <div key="bnpl" style={{ fontSize: '12px', padding: '7px 10px', borderRadius: '8px',
          color: info.isExpired ? tc.danger : info.monthsRemaining <= 3 ? tc.warning : tc.success,
          background: info.isExpired ? tc.dangerTint : info.monthsRemaining <= 3 ? tc.warningTint : tc.successTintLight,
          border: `1px solid ${info.isExpired ? tc.dangerTintStrong : info.monthsRemaining <= 3 ? tc.warningTintStrong : tc.successTintStrong}` }}>
          {info.isExpired ? <><Icons.Warning size={13} style={{ verticalAlign: '-2px' }} /> Interest-free period expired!</> : (
            <><div><Icons.CircleDot size={13} style={{ verticalAlign: '-2px', color: 'currentColor' }} /> Interest-free · {info.monthsRemaining} of {info.promoMonths} months left</div>
            {info.monthlyToClear > 0 && <div style={{ fontSize: '11px', marginTop: '2px', opacity: 0.8 }}>Pay {cs}{info.monthlyToClear.toFixed(2)}/mo to clear in time</div>}</>
          )}
        </div>
      );
      if (info.postPromoInfo && debt.totalAmount > 0) {
        banners.push(
          <div key="bnpl-post" style={{ fontSize: '11px', padding: '7px 10px', borderRadius: '8px', color: 'var(--text-muted)', background: 'var(--glass)', border: '1px solid var(--border)' }}>
            {info.isExpired ? 'Now paying' : 'If not cleared'}: {cs}{info.postPromoInfo.monthlyPayment.toFixed(2)}/mo at {debt.bnplPostInterest}% APR
            {info.postPromoInfo.months !== Infinity && ` · ${formatMonths(info.postPromoInfo.months)} · ${cs}${info.postPromoInfo.totalInterest.toFixed(2)} interest`}
          </div>
        );
      }
    }
  }

  if (mode === 'recurring') {
    const debtFree = getDebtFreeDate(debt, calculatePayoff);
    if (debtFree && debt.totalAmount > 0) {
      banners.push(
        <div key="debtfree" style={{ fontSize: '12px', color: tc.success, padding: '7px 10px', background: tc.successTintLight, borderRadius: '8px', border: '1px solid rgba(16,185,129,0.15)' }}>
          Debt-free by {debtFree.date.toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })} · {formatMonths(debtFree.months)}
        </div>
      );
    }
  }

  if (banners.length === 0) return null;
  return <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '10px' }}>{banners}</div>;
}

function PayMoreNudge({ debt, calculatePayoff }) {
  const cs = useCurrency();
  const mode = debt.paymentMode || 'recurring';
  if (mode !== 'recurring' || !debt.interestRate || debt.interestRate <= 0 || debt.totalAmount <= 0) return null;

  const dynMin = debt.minPaymentMode === 'percentage' && debt.minPaymentPct > 0
    ? calcDynamicMinimum(debt.totalAmount, debt.interestRate, debt.minPaymentPct, debt.minPaymentFloor)
    : (debt.minimumPayment || 0);
  const currentPayment = Math.max(dynMin, debt.recurringPayment || 0);
  if (currentPayment <= 0) return null;

  const currentResult = calculatePayoff(debt, currentPayment);
  if (!currentResult || currentResult.months === Infinity || currentResult.months >= 600) return null;

  // Try a few extra amounts and find the most impactful small nudge
  const nudgeAmounts = [5, 10, 20, 50];
  let bestNudge = null;

  for (const extra of nudgeAmounts) {
    const boosted = calculatePayoff(debt, currentPayment + extra);
    if (!boosted || boosted.months === Infinity) continue;
    const monthsSaved = currentResult.months - boosted.months;
    const interestSaved = Math.round((currentResult.totalInterest - boosted.totalInterest) * 100) / 100;
    if (monthsSaved >= 1 && interestSaved >= 1) {
      bestNudge = { extra, monthsSaved, interestSaved };
      break; // Use the smallest extra that makes a meaningful difference
    }
  }

  if (!bestNudge) return null;

  // Also show cost of only paying minimums if they're paying more than minimum
  let minimumWarning = null;
  if (dynMin > 0 && currentPayment > dynMin) {
    const minResult = calculatePayoff(debt, dynMin);
    if (minResult && minResult.months !== Infinity && minResult.months > currentResult.months) {
      minimumWarning = {
        months: minResult.months,
        interest: Math.round(minResult.totalInterest * 100) / 100,
        extraMonths: minResult.months - currentResult.months,
        extraInterest: Math.round((minResult.totalInterest - currentResult.totalInterest) * 100) / 100,
      };
    }
  }

  return (
    <div style={{ marginBottom: '10px', marginLeft: '46px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
      <div style={{ fontSize: '11px', padding: '8px 10px', borderRadius: '8px',
        background: 'color-mix(in srgb, var(--accent-primary) 6%, transparent)',
        border: '1px solid color-mix(in srgb, var(--accent-primary) 15%, transparent)',
        color: 'var(--accent-primary)' }}>
        <div style={{ fontWeight: '600' }}>
          <Icons.Lightbulb size={13} style={{ verticalAlign: '-2px' }} /> Pay {cs}{bestNudge.extra} more/mo → save {cs}{bestNudge.interestSaved.toFixed(0)} interest
        </div>
        <div style={{ opacity: 0.8, marginTop: '2px' }}>
          Debt-free {bestNudge.monthsSaved} month{bestNudge.monthsSaved !== 1 ? 's' : ''} sooner
        </div>
      </div>
      {minimumWarning && (
        <div style={{ fontSize: '11px', padding: '7px 10px', borderRadius: '8px',
          background: 'color-mix(in srgb, var(--warning) 6%, transparent)',
          border: '1px solid color-mix(in srgb, var(--warning) 15%, transparent)',
          color: 'var(--warning)' }}>
          <Icons.Warning size={13} style={{ verticalAlign: '-2px' }} /> Minimum only: {formatMonths(minimumWarning.months)} · {cs}{minimumWarning.interest.toFixed(0)} total interest
        </div>
      )}
    </div>
  );
}

function MortgageOverpayCalc({ debt, calculatePayoff }) {
  const cs = useCurrency();
  const [overpayAmt, setOverpayAmt] = React.useState('');
  if (debt.type !== 'Mortgage' || (debt.paymentMode || 'recurring') !== 'recurring') return null;
  if (!debt.interestRate || debt.interestRate <= 0 || debt.totalAmount <= 0) return null;
  const minPay = debt.minPaymentMode === 'percentage' && debt.minPaymentPct > 0
    ? calcDynamicMinimum(debt.totalAmount, debt.interestRate, debt.minPaymentPct, debt.minPaymentFloor)
    : (debt.minimumPayment || 0);
  const currentPayment = Math.max(minPay, debt.recurringPayment || 0);
  if (currentPayment <= 0) return null;

  const baseResult = calculatePayoff(debt, currentPayment);
  if (!baseResult || baseResult.months === Infinity) return null;

  const extra = parseFloat(overpayAmt) || 0;
  const boostedResult = extra > 0 ? calculatePayoff(debt, currentPayment + extra) : null;
  const monthsSaved = boostedResult && boostedResult.months !== Infinity ? baseResult.months - boostedResult.months : 0;
  const interestSaved = boostedResult && boostedResult.months !== Infinity ? Math.round((baseResult.totalInterest - boostedResult.totalInterest) * 100) / 100 : 0;

  return (
    <div style={{ marginBottom: '10px', marginLeft: '46px' }}>
      <div style={{ padding: '12px', borderRadius: '10px', background: 'color-mix(in srgb, var(--accent-primary) 5%, transparent)', border: '1px solid color-mix(in srgb, var(--accent-primary) 12%, transparent)' }}>
        <div style={{ fontSize: '12px', fontWeight: '600', color: 'var(--accent-primary)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '5px' }}>
          <Icons.CategoryHome size={14} /> Overpayment Calculator
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '8px' }}>
          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{cs}</span>
          <input type="number" className="input" placeholder="Extra per month" value={overpayAmt}
            onChange={(e) => setOverpayAmt(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') e.target.blur(); }}
            style={{ flex: 1, fontSize: '13px' }} />
          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>/mo</span>
        </div>
        {extra > 0 && boostedResult && boostedResult.months !== Infinity ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {interestSaved > 0 && (
              <div style={{ fontSize: '12px', color: 'var(--success)', fontWeight: '600' }}>
                Save {cs}{interestSaved.toLocaleString()} in interest
              </div>
            )}
            {monthsSaved > 0 && (
              <div style={{ fontSize: '12px', color: 'var(--success)' }}>
                Mortgage-free {formatMonths(monthsSaved)} sooner
              </div>
            )}
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
              {formatMonths(boostedResult.months)} remaining · {cs}{boostedResult.totalInterest.toLocaleString()} total interest
            </div>
          </div>
        ) : extra > 0 && boostedResult && boostedResult.months === Infinity ? (
          <div style={{ fontSize: '12px', color: tc.danger }}><Icons.Warning size={13} style={{ verticalAlign: '-2px' }} /> Payment doesn't cover interest</div>
        ) : (
          <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
            Current: {formatMonths(baseResult.months)} · {cs}{baseResult.totalInterest.toLocaleString()} interest
          </div>
        )}
      </div>
    </div>
  );
}

// Stacked area chart — debt payoff projection over time
const CHART_COLORS = ['#3b82f6', '#a78bfa', '#f97316', '#10b981', '#ec4899', '#fbbf24', '#06b6d4', '#ef4444', '#8b5cf6', '#14b8a6'];

function DebtPayoffChart({ strategyResults, debtStrategy, debts }) {
  const cs = useCurrency();
  const result = strategyResults?.[debtStrategy];
  if (!result || !result.timeline || result.timeline.length < 2) return null;

  // Use debts that appear in the timeline (includes ones paid off during simulation)
  const timelineIds = result.timeline[0]?.perDebt ? Object.keys(result.timeline[0].perDebt) : [];
  const chartDebts = debts.filter(d => timelineIds.includes(d.id));
  if (chartDebts.length === 0) return null;

  const debtIds = chartDebts.map(d => d.id);
  const debtNames = {};
  chartDebts.forEach(d => { debtNames[d.id] = d.name; });

  // Sample timeline (max ~40 points for performance)
  const tl = result.timeline;
  const step = Math.max(1, Math.floor(tl.length / 40));
  const sampled = tl.filter((_, i) => i === 0 || i === tl.length - 1 || i % step === 0);

  const W = 320, H = 160, PL = 40, PR = 10, PT = 10, PB = 28;
  const cw = W - PL - PR, ch = H - PT - PB;
  const maxMonth = sampled[sampled.length - 1].month;
  const maxVal = sampled[0].totalRemaining || 1;

  const xScale = (m) => PL + (m / maxMonth) * cw;
  const yScale = (v) => PT + ch - (v / maxVal) * ch;

  // Build stacked paths per debt
  const paths = [];
  for (let di = 0; di < debtIds.length; di++) {
    const id = debtIds[di];
    const color = CHART_COLORS[di % CHART_COLORS.length];

    // Bottom edge = sum of debts below this one
    const bottomPoints = sampled.map(p => {
      let below = 0;
      for (let j = 0; j < di; j++) below += (p.perDebt?.[debtIds[j]] || 0);
      return { x: xScale(p.month), y: yScale(below) };
    });
    // Top edge = bottom + this debt's balance
    const topPoints = sampled.map(p => {
      let below = 0;
      for (let j = 0; j < di; j++) below += (p.perDebt?.[debtIds[j]] || 0);
      const top = below + (p.perDebt?.[id] || 0);
      return { x: xScale(p.month), y: yScale(top) };
    });

    // Build SVG path: top left-to-right, then bottom right-to-left
    const topPath = topPoints.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
    const bottomPath = [...bottomPoints].reverse().map((p, i) => `L${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');

    paths.push({ id, color, d: `${topPath} ${bottomPath} Z`, name: debtNames[id] });
  }

  // Y-axis labels
  const yLabels = [0, 0.25, 0.5, 0.75, 1].map(f => ({
    val: maxVal * f,
    y: yScale(maxVal * f),
    label: maxVal * f >= 1000 ? `${cs}${(maxVal * f / 1000).toFixed(0)}k` : `${cs}${(maxVal * f).toFixed(0)}`,
  }));

  // X-axis labels (every ~6 months)
  const xStep = Math.max(1, Math.ceil(maxMonth / 5));
  const xLabels = [];
  for (let m = 0; m <= maxMonth; m += xStep) xLabels.push({ month: m, x: xScale(m) });
  if (xLabels[xLabels.length - 1].month !== maxMonth) xLabels.push({ month: maxMonth, x: xScale(maxMonth) });

  return (
    <div style={{ width: '100%', overflow: 'hidden' }}>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: 'auto' }}>
        <defs>
          {paths.map((p, i) => (
            <linearGradient key={p.id} id={`grad-${i}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={p.color} stopOpacity="0.6" />
              <stop offset="100%" stopColor={p.color} stopOpacity="0.15" />
            </linearGradient>
          ))}
        </defs>

        {/* Grid lines */}
        {yLabels.map((yl, i) => (
          <line key={i} x1={PL} y1={yl.y} x2={W - PR} y2={yl.y} stroke="var(--border)" strokeWidth="0.5" strokeDasharray="3,3" />
        ))}

        {/* Stacked areas (render in reverse so first debt is on top) */}
        {[...paths].reverse().map((p, i) => (
          <path key={p.id} d={p.d} fill={`url(#grad-${paths.length - 1 - i})`} stroke={p.color} strokeWidth="1" strokeOpacity="0.7" />
        ))}

        {/* Y-axis labels */}
        {yLabels.map((yl, i) => (
          <text key={i} x={PL - 4} y={yl.y + 3} textAnchor="end" fill="var(--text-muted)" fontSize="8" fontFamily="monospace">{yl.label}</text>
        ))}

        {/* X-axis labels */}
        {xLabels.map((xl, i) => (
          <text key={i} x={xl.x} y={H - 6} textAnchor="middle" fill="var(--text-muted)" fontSize="8" fontFamily="monospace">
            {xl.month >= 12 ? `${Math.floor(xl.month / 12)}y` : `${xl.month}m`}
          </text>
        ))}
      </svg>

      {/* Legend */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px 10px', marginTop: '6px' }}>
        {paths.map((p, i) => (
          <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '10px', color: 'var(--text-muted)' }}>
            <div style={{ width: '8px', height: '8px', borderRadius: '2px', background: p.color, flexShrink: 0 }} />
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '80px' }}>{p.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function ConsolidationCalc({ totalBalance, currentMonthly, stratInterest, cs, setInfoSheet }) {
  const [open, setOpen] = React.useState(false);
  const [consolRate, setConsolRate] = React.useState('');
  const [consolTerm, setConsolTerm] = React.useState('');

  const rate = parseFloat(consolRate) || 0;
  const termMonths = (parseFloat(consolTerm) || 0) * 12;

  // Calculate consolidated loan monthly payment & total interest
  let consolMonthly = 0, consolInterest = 0;
  if (rate > 0 && termMonths > 0 && totalBalance > 0) {
    const r = rate / 100 / 12;
    consolMonthly = totalBalance * (r * Math.pow(1 + r, termMonths)) / (Math.pow(1 + r, termMonths) - 1);
    consolInterest = (consolMonthly * termMonths) - totalBalance;
  } else if (rate === 0 && termMonths > 0) {
    consolMonthly = totalBalance / termMonths;
    consolInterest = 0;
  }

  const interestDiff = Math.round(stratInterest - consolInterest);
  const monthlyDiff = Math.round((currentMonthly - consolMonthly) * 100) / 100;

  return (
    <div className="glass-card animate-in" style={{ marginBottom: '16px', overflow: 'hidden', animationDelay: '0.25s' }}>
      <button onClick={() => { haptic.light(); setOpen(!open); }}
        style={{ width: '100%', padding: '14px 16px', border: 'none', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: 'var(--text-primary)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Icons.Handshake size={16} style={{ color: 'var(--accent-primary)' }} />
          <span style={{ fontSize: '14px', fontWeight: '700' }}>Consolidation Calculator</span>
          <InfoButton onClick={() => setInfoSheet('consolidation')} />
        </div>
        <span style={{ transition: 'transform 0.2s', transform: open ? 'rotate(180deg)' : 'none', display: 'flex' }}><Icons.ChevronDown size={16} /></span>
      </button>
      {open && (
        <div style={{ padding: '0 16px 16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
            See if merging {cs}{totalBalance.toFixed(0)} into one loan saves money.
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>Loan APR %</label>
              <input type="number" className="input" placeholder="e.g. 6.9" value={consolRate}
                onChange={(e) => setConsolRate(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') e.target.blur(); }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>Term (years)</label>
              <input type="number" className="input" placeholder="e.g. 3" value={consolTerm}
                onChange={(e) => setConsolTerm(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') e.target.blur(); }} />
            </div>
          </div>
          {consolMonthly > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <div style={{ padding: '10px', borderRadius: '10px', background: 'var(--glass)', border: '1px solid var(--border)', textAlign: 'center' }}>
                  <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.3px', marginBottom: '3px' }}>Monthly</div>
                  <div className="font-mono" style={{ fontSize: '16px', fontWeight: '700' }}>{cs}{consolMonthly.toFixed(0)}</div>
                </div>
                <div style={{ padding: '10px', borderRadius: '10px', background: 'var(--glass)', border: '1px solid var(--border)', textAlign: 'center' }}>
                  <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.3px', marginBottom: '3px' }}>Total Interest</div>
                  <div className="font-mono" style={{ fontSize: '16px', fontWeight: '700' }}>{cs}{Math.round(consolInterest).toLocaleString()}</div>
                </div>
              </div>
              {/* Comparison */}
              {interestDiff !== 0 && (
                <div style={{ padding: '8px 10px', borderRadius: '8px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px',
                  background: interestDiff > 0 ? tc.successTintLight : tc.warningTint,
                  border: `1px solid ${interestDiff > 0 ? tc.successTintStrong : tc.warningTintStrong}`,
                  color: interestDiff > 0 ? tc.success : tc.warning,
                }}>
                  {interestDiff > 0 ? <Icons.TrendingDown size={13} /> : <Icons.TrendingUp size={13} />}
                  <span>
                    {interestDiff > 0
                      ? <><strong>Saves {cs}{interestDiff.toLocaleString()}</strong> in interest vs current plan</>
                      : <><strong>Costs {cs}{Math.abs(interestDiff).toLocaleString()} more</strong> - current plan is better</>
                    }
                  </span>
                </div>
              )}
              {monthlyDiff > 0 && (
                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                  Frees up {cs}{monthlyDiff.toFixed(0)}/mo ({cs}{currentMonthly.toFixed(0)} → {cs}{consolMonthly.toFixed(0)})
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function ModeBadge({ debt }) {
  const mode = debt.paymentMode || 'recurring';
  const opt = PAYMENT_MODES.find(m => m.key === mode) || PAYMENT_MODES[0];
  return (
    <span style={{ fontSize: '11px', color: opt.color, padding: '2px 7px', background: `${opt.color}15`, borderRadius: '5px', border: `1px solid ${opt.color}30`, fontWeight: '600' }}>
      {opt.label}
    </span>
  );
}

export default function DebtPanel({
  debts, totalDebt, calculatePayoff,
  editingDebtId, editDebtForm, setEditDebtForm, handleDebtEditStart, handleDebtEditSave,
  handleDeleteDebt, handleMakePayment, debtPaymentAmounts, setDebtPaymentAmounts,
  showDebtHistory, setShowDebtHistory, setEditingDebtId, setShowDebtModal,
  handleArchiveDebt, handleUnarchiveDebt,
  debtStrategy, setDebtStrategy, extraDebtPayment, setExtraDebtPayment, strategyResults,
  debtCelebration, setDebtCelebration, incomeNum,
  handleBulkDeleteDebts, handleBulkArchiveDebts,
  debtStatusFilter, setDebtStatusFilter, selectedDebtType, setSelectedDebtType, allDebtTypes,
  openManageTypes,
}) {
  const cs = useCurrency();
  const [showWhatIf, setShowWhatIf] = React.useState({});
  const [showTypeFilter, setShowTypeFilter] = React.useState(false);
  const [whatIfAmounts, setWhatIfAmounts] = React.useState({});
  const [showArchived, setShowArchived] = React.useState(false);
  const [infoSheet, setInfoSheet] = React.useState(null); // 'snowball' | 'avalanche' | 'dti' | 'utilization' | 'consolidation'

  // Selection mode
  const [selectionMode, setSelectionMode] = React.useState(false);
  const [selectedIds, setSelectedIds] = React.useState(new Set());

  // Lock panel swiping during selection mode
  React.useEffect(() => { window.__tallySelectionMode = selectionMode; return () => { window.__tallySelectionMode = false; }; }, [selectionMode]);
  const longPressTimer = React.useRef(null);
  const longPressMoved = React.useRef(false);

  const toggleSelect = (id) => {
    setSelectedIds(prev => { const next = new Set(prev); if (next.has(id)) next.delete(id); else next.add(id); return next; });
  };
  const selectAll = () => {
    const active = debts.filter(d => !d.archived);
    setSelectedIds(prev => prev.size === active.length ? new Set() : new Set(active.map(d => d.id)));
  };
  const exitSelection = () => { setSelectionMode(false); setSelectedIds(new Set()); };
  const justLongPressed = React.useRef(false);
  const onCardTouchStart = (e, id) => {
    if (e.target.closest('button, input, select, a') || selectionMode) return;
    // Ignore touches near the left edge (swipe-back zone)
    const x = e.touches?.[0]?.clientX || 0;
    const y = e.touches?.[0]?.clientY || 0;
    if (x < 40 || y > window.innerHeight - 40) return;
    longPressMoved.current = false;
    justLongPressed.current = false;
    longPressTimer.current = setTimeout(() => {
      if (!longPressMoved.current) { setSelectionMode(true); setSelectedIds(new Set([id])); haptic.medium(); justLongPressed.current = true; setTimeout(() => { justLongPressed.current = false; }, 300); }
    }, 400);
  };
  const onCardTouchMove = () => { longPressMoved.current = true; if (longPressTimer.current) { clearTimeout(longPressTimer.current); longPressTimer.current = null; } };
  const onCardTouchEnd = () => { if (longPressTimer.current) { clearTimeout(longPressTimer.current); longPressTimer.current = null; } };

  const activeDebtsAll = React.useMemo(() => {
    const active = debts.filter(d => !d.archived);
    if (!strategyResults || !debtStrategy) return active;
    const perDebt = strategyResults[debtStrategy]?.perDebt || {};
    return [...active].sort((a, b) => {
      if (a.totalAmount === 0 && b.totalAmount > 0) return 1;
      if (b.totalAmount === 0 && a.totalAmount > 0) return -1;
      const orderA = perDebt[a.id]?.payoffOrder ?? 999;
      const orderB = perDebt[b.id]?.payoffOrder ?? 999;
      return orderA - orderB;
    });
  }, [debts, strategyResults, debtStrategy]);
  const archivedDebts = debts.filter(d => d.archived);

  // Apply filters
  const activeDebts = React.useMemo(() => {
    let filtered = activeDebtsAll;
    if (debtStatusFilter === 'ACTIVE') filtered = filtered.filter(d => d.totalAmount > 0);
    if (debtStatusFilter === 'PAID_OFF') filtered = filtered.filter(d => d.totalAmount === 0);
    if (selectedDebtType !== 'ALL') filtered = filtered.filter(d => d.type === selectedDebtType);
    return filtered;
  }, [activeDebtsAll, debtStatusFilter, selectedDebtType]);

  return (
    <>
      {/* Summary */}
      <div className="glass-card animate-in" style={{ padding: '20px', marginBottom: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h2 className="font-display" style={{ fontSize: '24px' }}>Debt Tracker</h2>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            {selectionMode ? (
              <>
                <button onClick={() => { haptic.light(); selectAll(); }} style={{ padding: '6px 12px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--glass)', cursor: 'pointer', fontSize: '12px', fontWeight: '600', color: 'var(--accent-primary)' }}>{selectedIds.size === activeDebts.length ? 'Deselect All' : 'Select All'}</button>
                <button onClick={() => { haptic.light(); exitSelection(); }} style={{ padding: '6px 12px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--glass)', cursor: 'pointer', fontSize: '12px', fontWeight: '600', color: 'var(--text-muted)' }}>Cancel</button>
              </>
            ) : (
              <>
                <button onClick={() => { haptic.medium(); openManageTypes(); }}
                  style={{ width: '36px', height: '36px', borderRadius: '10px', border: '1px solid var(--border)', background: 'var(--glass)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', flexShrink: 0 }}>
                  <Icons.SlidersH size={16} />
                </button>
                <button className="btn btn-primary" onClick={() => setShowDebtModal(true)}><Icons.Plus size={18} /> Add</button>
              </>
            )}
          </div>
        </div>
        {/* Dashboard overview */}
        {(() => {
          const tracked = debts.filter(d => !d.archived && d.originalAmount > 0);
          const totalOriginal = tracked.reduce((s, d) => s + d.originalAmount, 0);
          const totalCurrent = tracked.reduce((s, d) => s + (d.totalAmount || 0), 0);
          const portfolioProgress = totalOriginal > 0 ? Math.min(((totalOriginal - totalCurrent) / totalOriginal) * 100, 100) : 0;
          const totalPaid = Math.max(0, totalOriginal - totalCurrent);
          const stratInterest = strategyResults?.[debtStrategy]?.totalInterest || 0;
          const activeCount = activeDebts.filter(d => d.totalAmount > 0).length;
          // Monthly payment total
          const monthlyTotal = debts.filter(d => !d.archived && d.totalAmount > 0).reduce((s, d) => {
            const mode = d.paymentMode || 'recurring';
            if (mode === 'one-off') return s;
            if (mode === 'installment') { const m = d.installmentMonths || 1; return s + ((d.originalAmount || d.totalAmount) / m); }
            if (mode === 'bnpl') {
              const info = getBnplInfo(d);
              if (info && !info.isExpired && info.monthsRemaining > 0) return s + (d.totalAmount / info.monthsRemaining);
              if (info?.isExpired && d.bnplPostPayment > 0) return s + d.bnplPostPayment;
              return s;
            }
            const dMin = d.minPaymentMode === 'percentage' && d.minPaymentPct > 0
              ? calcDynamicMinimum(d.totalAmount, d.interestRate, d.minPaymentPct, d.minPaymentFloor)
              : (d.minimumPayment || 0);
            return s + Math.max(dMin, d.recurringPayment || 0);
          }, 0);
          // Debt-to-income ratio
          const dtiRatio = incomeNum > 0 ? (monthlyTotal / incomeNum) * 100 : null;
          const dtiColor = dtiRatio === null ? 'var(--text-muted)' : dtiRatio > 50 ? tc.danger : dtiRatio > 36 ? tc.warning : tc.success;
          const dtiLabel = dtiRatio === null ? null : dtiRatio > 50 ? 'High' : dtiRatio > 36 ? 'Moderate' : 'Healthy';
          // Ring color based on progress
          const ringColor = portfolioProgress >= 75 ? '#f97316' : portfolioProgress >= 50 ? '#a78bfa' : portfolioProgress > 0 ? 'var(--success)' : 'var(--text-muted)';
          const currentMilestone = portfolioProgress >= 75 ? 75 : portfolioProgress >= 50 ? 50 : portfolioProgress >= 25 ? 25 : 0;

          return (
            <>
              {/* Progress ring + total debt */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '14px' }}>
                <div style={{ position: 'relative', flexShrink: 0 }}>
                  <ProgressRing progress={portfolioProgress} size={90} strokeWidth={7} color={ringColor} />
                  <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                    <div className="font-mono" style={{ fontSize: '14px', fontWeight: '800', color: portfolioProgress >= 100 ? 'var(--success)' : 'var(--text-primary)' }}>
                      {portfolioProgress > 0 ? `${Math.round(portfolioProgress)}%` : '-'}
                    </div>
                    <div style={{ fontSize: '9px', color: 'var(--text-muted)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.3px' }}>paid off</div>
                  </div>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '2px' }}>Total Remaining</div>
                  <div className="font-mono" style={{ fontSize: '24px', fontWeight: '700', color: totalDebt > 0 ? tc.danger : tc.success }}>{cs}{totalDebt.toFixed(2)}</div>
                  {totalOriginal > 0 && totalPaid > 0 && (
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                      {cs}{totalPaid.toFixed(0)} of {cs}{totalOriginal.toFixed(0)} paid
                    </div>
                  )}
                </div>
              </div>

              {/* Stats grid */}
              <div style={{ display: 'grid', gridTemplateColumns: dtiRatio !== null ? '1fr 1fr 1fr' : '1fr 1fr', gap: '8px' }}>
                <div style={{ padding: '10px', background: 'var(--glass)', borderRadius: '10px', border: '1px solid var(--border)', textAlign: 'center' }}>
                  <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.3px', marginBottom: '3px' }}>Active</div>
                  <div className="font-mono" style={{ fontSize: '18px', fontWeight: '700' }}>{activeCount}</div>
                </div>
                <div style={{ padding: '10px', background: 'var(--glass)', borderRadius: '10px', border: '1px solid var(--border)', textAlign: 'center' }}>
                  <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.3px', marginBottom: '3px' }}>Monthly</div>
                  <div className="font-mono" style={{ fontSize: '18px', fontWeight: '700', color: tc.info }}>{cs}{monthlyTotal.toFixed(0)}</div>
                </div>
                {dtiRatio !== null && (
                  <div style={{ padding: '10px', background: 'var(--glass)', borderRadius: '10px', border: '1px solid var(--border)', textAlign: 'center', position: 'relative' }}>
                    <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.3px', marginBottom: '3px' }}>DTI Ratio</div>
                    <div className="font-mono" style={{ fontSize: '18px', fontWeight: '700', color: dtiColor }}>{dtiRatio.toFixed(0)}%</div>
                    <div style={{ fontSize: '9px', color: dtiColor, fontWeight: '600', marginTop: '1px' }}>{dtiLabel}</div>
                    <div style={{ position: 'absolute', top: '3px', right: '3px' }}><InfoButton onClick={() => setInfoSheet('dti')} /></div>
                  </div>
                )}
              </div>

              {/* Interest projection */}
              {stratInterest > 0 && (
                <div style={{ marginTop: '10px', padding: '8px 12px', borderRadius: '10px', background: tc.warningTint, border: `1px solid ${tc.warningTintStrong}`, display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px' }}>
                  <Icons.TrendingDown size={14} style={{ color: tc.warning, flexShrink: 0 }} />
                  <span style={{ color: tc.warning }}><strong>{cs}{stratInterest.toFixed(0)}</strong> projected interest ({debtStrategy})</span>
                </div>
              )}

              {/* Interest saved vs minimum-only */}
              {stratInterest > 0 && (() => {
                // Calculate total interest if only paying minimums (no strategy cascade, no extra)
                let minOnlyInterest = 0;
                for (const d of debts.filter(dd => !dd.archived && dd.totalAmount > 0 && (dd.paymentMode || 'recurring') === 'recurring')) {
                  const dynMin = d.minPaymentMode === 'percentage' && d.minPaymentPct > 0
                    ? calcDynamicMinimum(d.totalAmount, d.interestRate, d.minPaymentPct, d.minPaymentFloor)
                    : (d.minimumPayment || 0);
                  if (dynMin <= 0 || !d.interestRate) continue;
                  const result = calculatePayoff(d, dynMin);
                  if (result && result.totalInterest !== Infinity) minOnlyInterest += result.totalInterest;
                }
                const saved = Math.round(minOnlyInterest - stratInterest);
                if (saved <= 0) return null;
                return (
                  <div style={{ marginTop: '6px', padding: '8px 12px', borderRadius: '10px', background: tc.successTintLight, border: `1px solid ${tc.successTintStrong}`, display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px' }}>
                    <Icons.Sparkle size={14} style={{ color: tc.success, flexShrink: 0 }} />
                    <span style={{ color: tc.success }}>Saving <strong>{cs}{saved.toLocaleString()}</strong> in interest vs minimum-only</span>
                  </div>
                );
              })()}

              {/* Portfolio progress bar with milestones */}
              {portfolioProgress > 0 && (
                <div style={{ marginTop: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>
                    <span style={{ fontWeight: '600' }}>Overall progress</span>
                    <span>{portfolioProgress.toFixed(1)}%</span>
                  </div>
                  <div style={{ position: 'relative' }}>
                    <div style={{ height: '6px', background: 'var(--glass)', borderRadius: '3px', overflow: 'hidden', border: '1px solid var(--border)' }}>
                      <div style={{
                        width: `${portfolioProgress}%`, height: '100%', borderRadius: '3px', transition: 'width 0.5s',
                        background: portfolioProgress >= 75 ? 'linear-gradient(90deg, #f97316, #fbbf24)' : portfolioProgress >= 50 ? 'linear-gradient(90deg, #a78bfa, #c084fc)' : 'linear-gradient(90deg, var(--success), var(--accent-primary))',
                      }} />
                    </div>
                    {[25, 50, 75].map(m => (
                      <div key={m} style={{
                        position: 'absolute', top: '-1px', left: `${m}%`, transform: 'translateX(-50%)',
                        width: '8px', height: '8px', borderRadius: '50%',
                        background: portfolioProgress >= m ? (m >= 75 ? '#f97316' : m >= 50 ? '#a78bfa' : 'var(--success)') : 'var(--bg-secondary, #1a1e3a)',
                        border: `1.5px solid ${portfolioProgress >= m ? (m >= 75 ? '#f97316' : m >= 50 ? '#a78bfa' : 'var(--success)') : 'var(--border)'}`,
                        transition: 'all 0.3s',
                      }} />
                    ))}
                  </div>
                  {currentMilestone > 0 && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '6px', fontSize: '11px', color: getMilestoneColor(currentMilestone).text, fontWeight: '600' }}>
                      {currentMilestone >= 75 ? <Icons.Fire size={12} /> : currentMilestone >= 50 ? <Icons.Trophy size={12} /> : <Icons.Sparkle size={12} />}
                      {portfolioProgress >= 75 ? 'Almost there!' : portfolioProgress >= 50 ? 'Halfway through your debt!' : 'Great start - keep going!'}
                    </div>
                  )}
                </div>
              )}
            </>
          );
        })()}

        {/* Debt-free countdown */}
        {totalDebt > 0 && (() => {
          // Use strategy result if available, otherwise calculate from individual debts
          const stratResult = strategyResults?.[debtStrategy];
          let debtFreeDate = stratResult?.debtFreeDate;
          let totalMonths = stratResult?.totalMonths;

          // Fallback: find the longest individual payoff using mode-aware payment
          if (!debtFreeDate) {
            let maxMonths = 0;
            for (const d of activeDebts) {
              if (d.totalAmount <= 0) continue;
              const mode = d.paymentMode || 'recurring';
              // Skip one-off debts (no monthly payment cycle)
              if (mode === 'one-off') continue;
              // For installment debts, use remaining months directly
              if (mode === 'installment' && d.installmentMonths > 0) {
                const start = d.installmentStartDate ? new Date(d.installmentStartDate) : null;
                const elapsed = start ? monthsBetween(start, new Date()) : 0;
                const remaining = Math.max(0, d.installmentMonths - elapsed);
                if (remaining > maxMonths) maxMonths = remaining;
                continue;
              }
              // For recurring and post-promo BNPL, use calculatePayoff
              const dMin = d.minPaymentMode === 'percentage' && d.minPaymentPct > 0
                ? calcDynamicMinimum(d.totalAmount, d.interestRate, d.minPaymentPct, d.minPaymentFloor)
                : (d.minimumPayment || 0);
              const payment = Math.max(dMin, d.recurringPayment || 0);
              if (payment <= 0) continue;
              const result = calculatePayoff(d, payment);
              if (result && result.months !== Infinity && result.months < 600 && result.months > maxMonths) maxMonths = result.months;
            }
            if (maxMonths > 0) {
              totalMonths = maxMonths;
              debtFreeDate = new Date();
              debtFreeDate.setMonth(debtFreeDate.getMonth() + maxMonths);
            }
          }

          if (!debtFreeDate || !totalMonths) return null;

          const now = new Date();
          now.setHours(0, 0, 0, 0); // Normalize to midnight to avoid timezone fractional days
          const target = new Date(debtFreeDate);
          target.setHours(0, 0, 0, 0);
          const daysUntil = Math.ceil((target - now) / (1000 * 60 * 60 * 24));

          // Don't show countdown if date is in the past
          if (daysUntil <= 0) return null;

          const years = Math.floor(totalMonths / 12);
          const months = totalMonths % 12;

          return (
            <div style={{ marginTop: '12px', padding: '16px', borderRadius: '12px',
              background: 'linear-gradient(135deg, color-mix(in srgb, var(--success) 10%, transparent), color-mix(in srgb, var(--accent-primary) 8%, transparent))',
              border: '1px solid color-mix(in srgb, var(--success) 20%, transparent)',
              textAlign: 'center',
            }}>
              <div style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>
                Debt-free countdown
              </div>
              <div className="font-mono" style={{ fontSize: '32px', fontWeight: '800', color: 'var(--success)', lineHeight: 1.1 }}>
                {daysUntil}
              </div>
              <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                days to go
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '6px' }}>
                {years > 0 ? `${years}y ${months}m` : `${months}m`} · Free by {debtFreeDate.toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })}
              </div>
            </div>
          );
        })()}

        {totalDebt === 0 && activeDebts.filter(d => d.totalAmount > 0).length === 0 && debts.length > 0 && (
          <div style={{ marginTop: '12px', padding: '16px', borderRadius: '12px', textAlign: 'center',
            background: 'color-mix(in srgb, var(--success) 10%, transparent)',
            border: '1px solid color-mix(in srgb, var(--success) 20%, transparent)' }}>
            <div style={{ fontSize: '28px', marginBottom: '6px' }}><Icons.PartyPopper size={28} /></div>
            <div style={{ fontSize: '16px', fontWeight: '700', color: 'var(--success)' }}>You're debt-free!</div>
            {archivedDebts.length > 0 && <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>{archivedDebts.length} debt{archivedDebts.length !== 1 ? 's' : ''} paid off</div>}
          </div>
        )}
      </div>

      {/* Strategy Comparison Card */}
      {strategyResults && (
        <div className="glass-card animate-in" style={{ padding: '20px', marginBottom: '16px', animationDelay: '0.1s' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: '700', color: 'var(--text-primary)' }}>Payoff Strategy</h3>
          </div>

          {/* Strategy toggle */}
          <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
            <div style={{ flex: 1, position: 'relative' }}>
              <button onClick={() => { haptic.light(); setDebtStrategy('snowball'); }}
                style={{ width: '100%', padding: '10px', borderRadius: '12px', fontSize: '13px', fontWeight: '600', cursor: 'pointer', textAlign: 'center',
                  border: debtStrategy === 'snowball' ? '2px solid var(--accent-primary)' : '1px solid var(--border)',
                  background: debtStrategy === 'snowball' ? 'color-mix(in srgb, var(--accent-primary) 10%, transparent)' : 'var(--glass)',
                  color: debtStrategy === 'snowball' ? 'var(--accent-primary)' : 'var(--text-muted)',
                }}>
                <Icons.Snowflake size={13} style={{ verticalAlign: '-2px' }} /> Snowball
                <div style={{ fontSize: '10px', fontWeight: '400', marginTop: '2px', opacity: 0.7 }}>Smallest first</div>
              </button>
              <div style={{ position: 'absolute', top: '4px', right: '4px' }}>
                <InfoButton onClick={() => setInfoSheet('snowball')} />
              </div>
            </div>
            <div style={{ flex: 1, position: 'relative' }}>
              <button onClick={() => { haptic.light(); setDebtStrategy('avalanche'); }}
                style={{ width: '100%', padding: '10px', borderRadius: '12px', fontSize: '13px', fontWeight: '600', cursor: 'pointer', textAlign: 'center',
                  border: debtStrategy === 'avalanche' ? '2px solid #a78bfa' : '1px solid var(--border)',
                  background: debtStrategy === 'avalanche' ? 'color-mix(in srgb, #a78bfa 10%, transparent)' : 'var(--glass)',
                  color: debtStrategy === 'avalanche' ? '#a78bfa' : 'var(--text-muted)',
                }}>
                <Icons.Mountain size={13} style={{ verticalAlign: '-2px' }} /> Avalanche
                <div style={{ fontSize: '10px', fontWeight: '400', marginTop: '2px', opacity: 0.7 }}>Highest interest first</div>
              </button>
              <div style={{ position: 'absolute', top: '4px', right: '4px' }}>
                <InfoButton onClick={() => setInfoSheet('avalanche')} />
              </div>
            </div>
          </div>

          {/* Side-by-side comparison */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '14px' }}>
            <div style={{ padding: '12px', borderRadius: '10px',
              background: debtStrategy === 'snowball' ? 'color-mix(in srgb, var(--accent-primary) 8%, transparent)' : 'var(--glass)',
              border: `1px solid ${debtStrategy === 'snowball' ? 'color-mix(in srgb, var(--accent-primary) 20%, transparent)' : 'var(--border)'}`,
            }}>
              <div style={{ fontSize: '10px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px' }}>Snowball</div>
              <div className="font-mono" style={{ fontSize: '18px', fontWeight: '700', color: 'var(--text-primary)' }}>
                {strategyResults.snowball.totalMonths < 600 ? `${Math.floor(strategyResults.snowball.totalMonths / 12)}y ${strategyResults.snowball.totalMonths % 12}m` : '50+ years'}
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
                {cs}{strategyResults.snowball.totalInterest.toFixed(0)} interest
              </div>
              {strategyResults.snowball.debtFreeDate && (
                <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                  Free by {strategyResults.snowball.debtFreeDate.toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })}
                </div>
              )}
            </div>
            <div style={{ padding: '12px', borderRadius: '10px',
              background: debtStrategy === 'avalanche' ? 'color-mix(in srgb, #a78bfa 8%, transparent)' : 'var(--glass)',
              border: `1px solid ${debtStrategy === 'avalanche' ? 'color-mix(in srgb, #a78bfa 20%, transparent)' : 'var(--border)'}`,
            }}>
              <div style={{ fontSize: '10px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px' }}>Avalanche</div>
              <div className="font-mono" style={{ fontSize: '18px', fontWeight: '700', color: 'var(--text-primary)' }}>
                {strategyResults.avalanche.totalMonths < 600 ? `${Math.floor(strategyResults.avalanche.totalMonths / 12)}y ${strategyResults.avalanche.totalMonths % 12}m` : '50+ years'}
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
                {cs}{strategyResults.avalanche.totalInterest.toFixed(0)} interest
              </div>
              {strategyResults.avalanche.debtFreeDate && (
                <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                  Free by {strategyResults.avalanche.debtFreeDate.toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })}
                </div>
              )}
            </div>
          </div>

          {/* Insights */}
          {strategyResults.interestSaved > 1 && (
            <div style={{ padding: '10px 12px', borderRadius: '10px', marginBottom: '8px',
              background: 'color-mix(in srgb, var(--success) 8%, transparent)',
              border: '1px solid color-mix(in srgb, var(--success) 20%, transparent)',
              fontSize: '12px', color: 'var(--success)', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Icons.TrendingDown size={14} />
              <span><strong>{strategyResults.savedByStrategy === 'avalanche' ? 'Avalanche' : 'Snowball'}</strong> saves {cs}{strategyResults.interestSaved.toFixed(0)} in interest</span>
            </div>
          )}
          {strategyResults.firstWinStrategy && strategyResults.snowball.firstWinMonth !== strategyResults.avalanche.firstWinMonth && (
            <div style={{ padding: '10px 12px', borderRadius: '10px', marginBottom: '8px',
              background: 'color-mix(in srgb, var(--accent-primary) 8%, transparent)',
              border: '1px solid color-mix(in srgb, var(--accent-primary) 20%, transparent)',
              fontSize: '12px', color: 'var(--accent-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Icons.Check size={14} />
              <span><strong>{strategyResults.firstWinStrategy === 'snowball' ? 'Snowball' : 'Avalanche'}</strong> pays off your first debt in {strategyResults[strategyResults.firstWinStrategy].firstWinMonth} month{strategyResults[strategyResults.firstWinStrategy].firstWinMonth !== 1 ? 's' : ''}</span>
            </div>
          )}

          {/* Extra monthly payment input */}
          <div style={{ marginTop: '10px' }}>
            <label style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: '500', display: 'block', marginBottom: '6px' }}>
              Extra monthly payment
            </label>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <span style={{ fontSize: '14px', color: 'var(--text-muted)' }}>{cs}</span>
              <input type="number" className="input" placeholder="0" value={extraDebtPayment || ''}
                onChange={(e) => setExtraDebtPayment(Math.max(0, parseFloat(e.target.value) || 0))}
                onKeyDown={(e) => { if (e.key === 'Enter') e.target.blur(); }}
                style={{ flex: 1 }} />
            </div>
            {extraDebtPayment > 0 && (
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
                Adding {cs}{extraDebtPayment.toFixed(0)}/mo extra toward the focus debt
              </div>
            )}
          </div>
        </div>
      )}

      {/* Payoff Projection Chart */}
      {strategyResults && strategyResults[debtStrategy]?.timeline?.length > 2 && (
        <div className="glass-card animate-in" style={{ padding: '16px', marginBottom: '16px', animationDelay: '0.2s' }}>
          <h3 style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '12px' }}>Payoff Projection</h3>
          <DebtPayoffChart strategyResults={strategyResults} debtStrategy={debtStrategy} debts={debts} />
        </div>
      )}

      {/* Debt filters */}
      {debts.length > 0 && (
        <div className="animate-in" style={{ marginBottom: '14px', animationDelay: '0.25s' }}>
          <div style={{ display: 'flex', gap: '5px' }}>
            {[
              { key: 'ALL', label: 'All' },
              { key: 'ACTIVE', label: 'Active' },
              { key: 'PAID_OFF', label: 'Paid Off' },
            ].map((f) => (
              <button key={f.key} onClick={() => { haptic.light(); setDebtStatusFilter(f.key); }}
                style={{ flex: 1, padding: '7px 4px', borderRadius: '20px', fontSize: '11px', fontWeight: '600', minWidth: 0,
                  cursor: 'pointer', whiteSpace: 'nowrap', transition: 'all 0.2s',
                  border: debtStatusFilter === f.key ? '2px solid var(--accent-primary)' : '1px solid var(--border)',
                  background: debtStatusFilter === f.key ? 'color-mix(in srgb, var(--accent-primary) 10%, transparent)' : 'var(--glass)',
                  color: debtStatusFilter === f.key ? 'var(--accent-primary)' : 'var(--text-muted)',
                }}>{f.label}</button>
            ))}
            <button onClick={() => { haptic.light(); setShowTypeFilter(v => !v); }}
              style={{ padding: '7px 4px', borderRadius: '20px', fontSize: '11px', fontWeight: '600',
                cursor: 'pointer', whiteSpace: 'nowrap', transition: 'all 0.2s',
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '3px',
                border: selectedDebtType !== 'ALL' || showTypeFilter ? '2px solid var(--accent-primary)' : '1px solid var(--border)',
                background: selectedDebtType !== 'ALL' || showTypeFilter ? 'color-mix(in srgb, var(--accent-primary) 10%, transparent)' : 'var(--glass)',
                color: selectedDebtType !== 'ALL' || showTypeFilter ? 'var(--accent-primary)' : 'var(--text-muted)',
              }}>
              Type
              <Icons.ChevronDown size={12} style={{ transition: 'transform 0.2s', transform: showTypeFilter ? 'rotate(180deg)' : 'none' }} />
            </button>
          </div>

          {showTypeFilter && (
            <div style={{ marginTop: '10px', padding: '12px', background: 'var(--bg-card, var(--glass))', border: '1px solid var(--border)', borderRadius: '14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <span style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Debt Type</span>
                {selectedDebtType !== 'ALL' && (
                  <button onClick={() => { haptic.light(); setSelectedDebtType('ALL'); }}
                    style={{ fontSize: '11px', fontWeight: '600', color: 'var(--accent-primary)', background: 'none', border: 'none', cursor: 'pointer' }}>Clear</button>
                )}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px' }}>
                {allDebtTypes.map((t) => (
                  <button key={t} onClick={() => { haptic.light(); setSelectedDebtType(t); }}
                    style={{ padding: '8px 6px', borderRadius: '10px', fontSize: '11px', fontWeight: '600',
                      cursor: 'pointer', transition: 'all 0.15s', textAlign: 'center',
                      border: selectedDebtType === t ? '2px solid var(--accent-primary)' : '1px solid var(--border)',
                      background: selectedDebtType === t ? 'color-mix(in srgb, var(--accent-primary) 10%, transparent)' : 'var(--glass)',
                      color: selectedDebtType === t ? 'var(--accent-primary)' : 'var(--text-muted)',
                    }}>{t}</button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Consolidation Calculator */}
      {totalDebt > 0 && activeDebts.filter(d => d.totalAmount > 0 && (d.paymentMode || 'recurring') === 'recurring').length >= 2 && (() => {
        const recurringDebts = activeDebts.filter(d => d.totalAmount > 0 && (d.paymentMode || 'recurring') === 'recurring');
        const totalBalance = recurringDebts.reduce((s, d) => s + d.totalAmount, 0);
        const currentMonthly = recurringDebts.reduce((s, d) => {
          const dMin = d.minPaymentMode === 'percentage' && d.minPaymentPct > 0
            ? calcDynamicMinimum(d.totalAmount, d.interestRate, d.minPaymentPct, d.minPaymentFloor)
            : (d.minimumPayment || 0);
          return s + Math.max(dMin, d.recurringPayment || 0);
        }, 0);
        return (
          <ConsolidationCalc totalBalance={totalBalance} currentMonthly={currentMonthly} stratInterest={strategyResults?.[debtStrategy]?.totalInterest || 0} cs={cs} setInfoSheet={setInfoSheet} />
        );
      })()}

      {/* List */}
      {activeDebts.length === 0 && archivedDebts.length === 0 ? (
        <div className="glass-card" style={{ padding: '40px', textAlign: 'center' }}>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>No debts tracked yet. Tap "Add" to get started.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', paddingBottom: selectionMode && selectedIds.size > 0 ? '100px' : '0', transition: 'padding-bottom 0.2s' }}>
          {activeDebts.length === 0 && (
            <div className="glass-card" style={{ padding: '24px', textAlign: 'center' }}>
              <p style={{ color: tc.success, fontSize: '14px', fontWeight: '600' }}><Icons.PartyPopper size={16} style={{ verticalAlign: '-2px' }} /> All debts paid off!</p>
            </div>
          )}

          {activeDebts.map((debt) => {
            const progress = debt.originalAmount > 0 ? Math.min(((debt.originalAmount - debt.totalAmount) / debt.originalAmount * 100), 100) : 0;
            const mode = debt.paymentMode || 'recurring';
            const isPaidOff = debt.totalAmount === 0;
            const accentColor = isPaidOff ? 'var(--success)' : tc.danger;

            return (
              <div key={debt.id}
                onTouchStart={(e) => onCardTouchStart(e, debt.id)}
                onTouchMove={onCardTouchMove}
                onTouchEnd={onCardTouchEnd}
                onClick={() => { if (justLongPressed.current) { justLongPressed.current = false; return; } if (selectionMode) { haptic.light(); toggleSelect(debt.id); } }}
              >
                <div className="mobile-bill-card" style={{
                  borderLeft: `3px solid ${accentColor}`,
                  background: isPaidOff ? tc.successTintLight : undefined,
                  outline: selectionMode && selectedIds.has(debt.id) ? '2px solid var(--accent-primary)' : 'none',
                }}>
                  {selectionMode && (
                    <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
                      <div style={{
                        width: '22px', height: '22px', borderRadius: '6px', flexShrink: 0,
                        border: `2px solid ${selectedIds.has(debt.id) ? 'var(--accent-primary)' : 'var(--border)'}`,
                        background: selectedIds.has(debt.id) ? 'linear-gradient(135deg, var(--accent-primary), var(--success))' : 'transparent',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', color: '#fff' }}>
                        {selectedIds.has(debt.id) && '✓'}
                      </div>
                      <span style={{ marginLeft: '10px', fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)' }}>
                        {selectedIds.has(debt.id) ? 'Selected' : 'Tap to select'}
                      </span>
                    </div>
                  )}
                  {editingDebtId === debt.id ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      <input className="input" value={editDebtForm.name} onChange={(e) => setEditDebtForm({ ...editDebtForm, name: e.target.value })} placeholder="Debt name" />
                      <select className="input" value={editDebtForm.type} onChange={(e) => setEditDebtForm({ ...editDebtForm, type: e.target.value })}>
                        {(allDebtTypes || DEBT_TYPES).map((t) => (<option key={t} value={t}>{t}</option>))}
                      </select>
                      <div>
                        <label style={{ display: 'block', color: 'var(--text-secondary)', fontSize: '12px', marginBottom: '6px' }}>Payment Structure</label>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px' }}>
                          {PAYMENT_MODES.map((opt) => (
                            <button key={opt.key} type="button" onClick={() => setEditDebtForm({ ...editDebtForm, paymentMode: opt.key })}
                              style={{ padding: '8px 6px', borderRadius: '8px', border: (editDebtForm.paymentMode || 'recurring') === opt.key ? `2px solid ${opt.color}` : '1px solid var(--border)', background: (editDebtForm.paymentMode || 'recurring') === opt.key ? `${opt.color}15` : 'var(--glass)', color: (editDebtForm.paymentMode || 'recurring') === opt.key ? opt.color : 'var(--text-muted)', cursor: 'pointer', fontSize: '12px', fontWeight: '500', textAlign: 'center' }}>
                              {opt.label}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                        <div>
                          <label style={{ display: 'block', color: 'var(--text-secondary)', fontSize: '12px', marginBottom: '4px' }}>Balance</label>
                          <input type="number" className="input" value={editDebtForm.totalAmount} onChange={(e) => setEditDebtForm({ ...editDebtForm, totalAmount: e.target.value })} />
                        </div>
                        <div>
                          <label style={{ display: 'block', color: 'var(--text-secondary)', fontSize: '12px', marginBottom: '4px' }}>Interest %</label>
                          <input type="number" className="input" value={editDebtForm.interestRate} onChange={(e) => setEditDebtForm({ ...editDebtForm, interestRate: e.target.value })} />
                        </div>
                      </div>
                      {editDebtForm.type === 'Credit Card' && (
                        <div>
                          <label style={{ display: 'block', color: 'var(--text-secondary)', fontSize: '12px', marginBottom: '4px' }}>Credit Limit</label>
                          <input type="number" className="input" placeholder="e.g. 5000" value={editDebtForm.creditLimit || ''} onChange={(e) => setEditDebtForm({ ...editDebtForm, creditLimit: e.target.value })} />
                        </div>
                      )}
                      {(editDebtForm.paymentMode || 'recurring') === 'recurring' && (
                        <>
                          <div>
                            <label style={{ display: 'block', color: 'var(--text-secondary)', fontSize: '12px', marginBottom: '4px' }}>Minimum Payment</label>
                            <div style={{ display: 'flex', gap: '4px', marginBottom: '8px' }}>
                              <button type="button" onClick={() => setEditDebtForm({ ...editDebtForm, minPaymentMode: 'fixed' })}
                                style={{ flex: 1, padding: '6px', borderRadius: '6px', fontSize: '11px', fontWeight: '500', cursor: 'pointer', textAlign: 'center',
                                  border: (editDebtForm.minPaymentMode || 'fixed') === 'fixed' ? `2px solid ${tc.info}` : '1px solid var(--border)',
                                  background: (editDebtForm.minPaymentMode || 'fixed') === 'fixed' ? tc.infoTint : 'var(--glass)',
                                  color: (editDebtForm.minPaymentMode || 'fixed') === 'fixed' ? tc.info : 'var(--text-muted)',
                                }}>Fixed</button>
                              <button type="button" onClick={() => setEditDebtForm({ ...editDebtForm, minPaymentMode: 'percentage' })}
                                style={{ flex: 1, padding: '6px', borderRadius: '6px', fontSize: '11px', fontWeight: '500', cursor: 'pointer', textAlign: 'center',
                                  border: editDebtForm.minPaymentMode === 'percentage' ? `2px solid ${tc.purple}` : '1px solid var(--border)',
                                  background: editDebtForm.minPaymentMode === 'percentage' ? tc.purpleTint : 'var(--glass)',
                                  color: editDebtForm.minPaymentMode === 'percentage' ? tc.purple : 'var(--text-muted)',
                                }}>% of Balance</button>
                            </div>
                            {(editDebtForm.minPaymentMode || 'fixed') === 'fixed' ? (
                              <input type="number" className="input" placeholder="e.g. 25" value={editDebtForm.minimumPayment} onChange={(e) => setEditDebtForm({ ...editDebtForm, minimumPayment: e.target.value })} />
                            ) : (
                              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                                <div>
                                  <label style={{ display: 'block', color: 'var(--text-muted)', fontSize: '10px', marginBottom: '3px' }}>% of balance</label>
                                  <input type="number" className="input" placeholder="2.5" value={editDebtForm.minPaymentPct || ''} onChange={(e) => setEditDebtForm({ ...editDebtForm, minPaymentPct: e.target.value })} />
                                </div>
                                <div>
                                  <label style={{ display: 'block', color: 'var(--text-muted)', fontSize: '10px', marginBottom: '3px' }}>Floor ({cs})</label>
                                  <input type="number" className="input" placeholder="25" value={editDebtForm.minPaymentFloor || ''} onChange={(e) => setEditDebtForm({ ...editDebtForm, minPaymentFloor: e.target.value })} />
                                </div>
                              </div>
                            )}
                          </div>
                          <div>
                            <label style={{ display: 'block', color: 'var(--text-secondary)', fontSize: '12px', marginBottom: '4px' }}>Auto Monthly</label>
                            <input type="number" className="input" value={editDebtForm.recurringPayment} onChange={(e) => setEditDebtForm({ ...editDebtForm, recurringPayment: e.target.value })} />
                          </div>
                        </>
                      )}
                      {(editDebtForm.paymentMode || 'recurring') === 'one-off' && (
                        <div>
                          <label style={{ display: 'block', color: 'var(--text-secondary)', fontSize: '12px', marginBottom: '4px' }}>Due Date</label>
                          <input type="date" className={`input ${editDebtForm.dueDate ? 'has-value' : ''}`} value={editDebtForm.dueDate || ''} onChange={(e) => setEditDebtForm({ ...editDebtForm, dueDate: e.target.value })} />
                        </div>
                      )}
                      {(editDebtForm.paymentMode || 'recurring') === 'installment' && (
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                          <div>
                            <label style={{ display: 'block', color: 'var(--text-secondary)', fontSize: '12px', marginBottom: '4px' }}>Total Months</label>
                            <input type="number" className="input" value={editDebtForm.installmentMonths || ''} onChange={(e) => setEditDebtForm({ ...editDebtForm, installmentMonths: e.target.value })} />
                          </div>
                          <div>
                            <label style={{ display: 'block', color: 'var(--text-secondary)', fontSize: '12px', marginBottom: '4px' }}>Start Date</label>
                            <input type="date" className={`input ${editDebtForm.installmentStartDate ? 'has-value' : ''}`} value={editDebtForm.installmentStartDate || ''} onChange={(e) => setEditDebtForm({ ...editDebtForm, installmentStartDate: e.target.value })} />
                          </div>
                        </div>
                      )}
                      {(editDebtForm.paymentMode || 'recurring') === 'bnpl' && (
                        <>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                            <div>
                              <label style={{ display: 'block', color: 'var(--text-secondary)', fontSize: '12px', marginBottom: '4px' }}>Interest-Free Months</label>
                              <input type="number" className="input" value={editDebtForm.bnplPromoMonths || ''} onChange={(e) => setEditDebtForm({ ...editDebtForm, bnplPromoMonths: e.target.value })} />
                            </div>
                            <div>
                              <label style={{ display: 'block', color: 'var(--text-secondary)', fontSize: '12px', marginBottom: '4px' }}>Start Date</label>
                              <input type="date" className={`input ${editDebtForm.bnplStartDate ? 'has-value' : ''}`} value={editDebtForm.bnplStartDate || ''} onChange={(e) => setEditDebtForm({ ...editDebtForm, bnplStartDate: e.target.value })} />
                            </div>
                          </div>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                            <div>
                              <label style={{ display: 'block', color: 'var(--text-secondary)', fontSize: '12px', marginBottom: '4px' }}>APR after end %</label>
                              <input type="number" className="input" value={editDebtForm.bnplPostInterest || ''} onChange={(e) => setEditDebtForm({ ...editDebtForm, bnplPostInterest: e.target.value })} />
                            </div>
                            <div>
                              <label style={{ display: 'block', color: 'var(--text-secondary)', fontSize: '12px', marginBottom: '4px' }}>Payment after end</label>
                              <input type="number" className="input" value={editDebtForm.bnplPostPayment || ''} onChange={(e) => setEditDebtForm({ ...editDebtForm, bnplPostPayment: e.target.value })} />
                            </div>
                          </div>
                        </>
                      )}
                      {(editDebtForm.paymentMode || 'recurring') === 'recurring' && (
                        <div>
                          <label style={{ display: 'block', color: 'var(--text-secondary)', fontSize: '12px', marginBottom: '4px' }}>Payment Day (1-31)</label>
                          <input type="number" className="input" placeholder="1-31" min="1" max="31" value={editDebtForm.paymentDate || ''} onChange={(e) => { const v = e.target.value; if (v === '') { setEditDebtForm({ ...editDebtForm, paymentDate: '' }); return; } const n = parseInt(v); if (!isNaN(n)) setEditDebtForm({ ...editDebtForm, paymentDate: String(Math.min(31, Math.max(1, n))) }); }} />
                        </div>
                      )}
                      {/* Balance Transfer (edit) */}
                      {(editDebtForm.paymentMode || 'recurring') === 'recurring' && (editDebtForm.type === 'Credit Card' || editDebtForm.balanceTransfer) && (
                        <div>
                          <button type="button" onClick={() => setEditDebtForm({ ...editDebtForm, balanceTransfer: !editDebtForm.balanceTransfer })}
                            style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '12px', fontWeight: '500',
                              border: editDebtForm.balanceTransfer ? `2px solid ${tc.info}` : '1px solid var(--border)',
                              background: editDebtForm.balanceTransfer ? tc.infoTint : 'var(--glass)',
                              color: editDebtForm.balanceTransfer ? tc.info : 'var(--text-muted)',
                            }}>
                            <span>0% Balance Transfer</span>
                            <span style={{ fontSize: '10px', fontWeight: '600' }}>{editDebtForm.balanceTransfer ? 'ON' : 'OFF'}</span>
                          </button>
                          {editDebtForm.balanceTransfer && (
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginTop: '8px' }}>
                              <div>
                                <label style={{ display: 'block', color: 'var(--text-secondary)', fontSize: '12px', marginBottom: '4px' }}>0% Ends</label>
                                <input type="date" className={`input ${editDebtForm.btEndDate ? 'has-value' : ''}`} value={editDebtForm.btEndDate || ''} onChange={(e) => setEditDebtForm({ ...editDebtForm, btEndDate: e.target.value })} />
                              </div>
                              <div>
                                <label style={{ display: 'block', color: 'var(--text-secondary)', fontSize: '12px', marginBottom: '4px' }}>Revert APR %</label>
                                <input type="number" className="input" placeholder="e.g. 24.9" value={editDebtForm.btRevertRate || ''} onChange={(e) => setEditDebtForm({ ...editDebtForm, btRevertRate: e.target.value })} />
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button className="btn btn-primary" onClick={handleDebtEditSave} style={{ flex: 1 }}><Icons.Check size={18} /> Save</button>
                        <button className="btn btn-secondary" onClick={() => setEditingDebtId(null)} style={{ flex: 1 }}><Icons.X size={18} /> Cancel</button>
                      </div>
                      <button onClick={async () => { const deleted = await handleDeleteDebt(debt.id); if (deleted !== false) setEditingDebtId(null); }} style={{ width: '100%', marginTop: '8px', padding: '9px', background: tc.dangerTintLight, border: `1px solid ${tc.dangerTintStrong}`, borderRadius: '10px', cursor: 'pointer', fontSize: '13px', fontWeight: '600', color: tc.danger }}>
                        Delete debt
                      </button>
                    </div>
                  ) : (
                    <div>
                      {/* ── Row 1: Icon + Name + Amount ── */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                        <div style={{
                          width: '36px', height: '36px', borderRadius: '10px', flexShrink: 0,
                          background: isPaidOff ? tc.successTint : tc.dangerTintLight,
                          border: `1px solid ${isPaidOff ? tc.successTintStrong : tc.dangerTintStrong}`,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                          {getDebtIcon(debt.type, 20, isPaidOff ? 'var(--success)' : tc.danger)}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span style={{ fontWeight: '600', fontSize: '15px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{debt.name}</span>
                            {strategyResults && strategyResults[debtStrategy]?.firstWinDebtId === debt.id && debt.totalAmount > 0 && (
                              <span style={{ fontSize: '10px', fontWeight: '700', padding: '2px 7px', borderRadius: '10px',
                                background: 'color-mix(in srgb, var(--accent-primary) 12%, transparent)',
                                border: '1px solid color-mix(in srgb, var(--accent-primary) 25%, transparent)',
                                color: 'var(--accent-primary)', flexShrink: 0 }}><Icons.Star size={10} style={{ verticalAlign: '-1px' }} /> Focus</span>
                            )}
                            {!selectionMode && <button onClick={() => handleDebtEditStart(debt)} style={{ width: '22px', height: '22px', borderRadius: '5px', border: '1px solid var(--accent-primary)', background: 'var(--info-tint)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-primary)', flexShrink: 0 }}>
                              <Icons.Edit size={12} />
                            </button>}
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginTop: '1px' }}>
                            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{debt.type}{debt.interestRate > 0 && ` · ${debt.interestRate}% APR`}</span>
                            {PRIORITY_DEBTS[debt.type] && debt.totalAmount > 0 && (
                              <span style={{ fontSize: '9px', fontWeight: '700', padding: '1px 5px', borderRadius: '4px', background: tc.dangerTintLight, border: `1px solid ${tc.dangerTintStrong}`, color: tc.danger, textTransform: 'uppercase', letterSpacing: '0.3px' }}>
                                Priority
                              </span>
                            )}
                            {debt.balanceTransfer && debt.btEndDate && !isPaidOff && (
                              <span style={{ fontSize: '9px', fontWeight: '700', padding: '1px 5px', borderRadius: '4px', background: tc.infoTint, border: '1px solid var(--info-tint-strong)', color: tc.info, textTransform: 'uppercase', letterSpacing: '0.3px' }}>
                                BT
                              </span>
                            )}
                          </div>
                        </div>
                        <div style={{ textAlign: 'right', flexShrink: 0 }}>
                          <div className="font-mono" style={{ fontSize: '17px', fontWeight: '700', color: isPaidOff ? tc.success : tc.danger }}>
                            {cs}{debt.totalAmount.toFixed(2)}
                          </div>
                          {debt.originalAmount > 0 && debt.originalAmount !== debt.totalAmount && (
                            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '1px' }}>of {cs}{debt.originalAmount.toFixed(2)}</div>
                          )}
                        </div>
                      </div>

                      {/* ── Row 2: Mode badge + payment day ── */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px', marginLeft: '46px' }}>
                        <ModeBadge debt={debt} />
                        {debt.paymentDate && mode !== 'one-off' && (
                          <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>· {getOrdinal(parseInt(debt.paymentDate))} of month</span>
                        )}
                        {debt.recurringPayment > 0 && (mode === 'recurring' || mode === 'installment') && (
                          <span style={{ fontSize: '11px', color: tc.info, background: tc.infoTint, padding: '2px 7px', borderRadius: '5px', border: '1px solid var(--info-tint-strong)', fontWeight: '600', marginLeft: 'auto' }}>
                            {cs}{debt.recurringPayment.toFixed(2)}/mo
                          </span>
                        )}
                      </div>

                      {/* Dynamic minimum payment indicator */}
                      {debt.minPaymentMode === 'percentage' && debt.minPaymentPct > 0 && debt.totalAmount > 0 && mode === 'recurring' && (
                        <div style={{ marginBottom: '8px', marginLeft: '46px', fontSize: '11px', padding: '5px 8px', borderRadius: '6px', background: tc.purpleTint, border: '1px solid rgba(124,58,237,0.12)', color: tc.purple, display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <span style={{ fontWeight: '600' }}>Min: {cs}{calcDynamicMinimum(debt.totalAmount, debt.interestRate, debt.minPaymentPct, debt.minPaymentFloor).toFixed(2)}/mo</span>
                          <span style={{ opacity: 0.7 }}>({debt.minPaymentPct}% + interest{debt.minPaymentFloor > 0 ? `, floor ${cs}${debt.minPaymentFloor}` : ''})</span>
                        </div>
                      )}

                      {/* Credit utilization */}
                      {debt.type === 'Credit Card' && debt.creditLimit > 0 && !isPaidOff && (() => {
                        const util = Math.min((debt.totalAmount / debt.creditLimit) * 100, 100);
                        const utilColor = util > 75 ? tc.danger : util > 50 ? tc.warning : util > 30 ? 'var(--accent-primary)' : tc.success;
                        const utilLabel = util > 75 ? 'High' : util > 50 ? 'Watch' : util > 30 ? 'Fair' : 'Good';
                        return (
                          <div style={{ marginBottom: '8px', marginLeft: '46px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11px', marginBottom: '3px' }}>
                              <span style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '3px' }}>Credit utilization <InfoButton onClick={() => setInfoSheet('utilization')} /></span>
                              <span style={{ fontWeight: '600', color: utilColor }}>{util.toFixed(0)}% · {utilLabel}</span>
                            </div>
                            <div style={{ height: '4px', background: 'var(--glass)', borderRadius: '2px', overflow: 'hidden', border: '1px solid var(--border)' }}>
                              <div style={{ width: `${util}%`, height: '100%', borderRadius: '2px', transition: 'width 0.3s', background: utilColor }} />
                            </div>
                            <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '2px' }}>
                              {cs}{debt.totalAmount.toFixed(0)} of {cs}{debt.creditLimit.toFixed(0)} limit
                            </div>
                          </div>
                        );
                      })()}

                      {/* ── Progress bar with milestones (hidden when fully paid off) ── */}
                      {debt.originalAmount > 0 && !isPaidOff && (
                        <MilestoneProgressBar progress={progress} cs={cs} originalAmount={debt.originalAmount} totalAmount={debt.totalAmount} />
                      )}

                      {/* ── Info banner ── */}
                      <div style={{ marginLeft: '46px' }}>
                        <DebtInfoBanner debt={debt} calculatePayoff={calculatePayoff} />
                        <PayMoreNudge debt={debt} calculatePayoff={calculatePayoff} />
                      </div>
                      {!isPaidOff && <MortgageOverpayCalc debt={debt} calculatePayoff={calculatePayoff} />}

                      {/* ── Payment input (hidden in selection mode) ── */}
                      {!isPaidOff && !selectionMode && (
                        <div style={{ marginLeft: '46px' }}>
                          <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                            <input type="number" className="input" placeholder="Payment amount..." value={debtPaymentAmounts[debt.id] || ''} onChange={(e) => setDebtPaymentAmounts({ ...debtPaymentAmounts, [debt.id]: e.target.value })} style={{ flex: 1 }} />
                            <button className="btn btn-primary" onClick={() => handleMakePayment(debt.id)} style={{ whiteSpace: 'nowrap' }}>Pay</button>
                          </div>

                          {/* What if calculator */}
                          {(debt.interestRate > 0 || mode === 'recurring' || (mode === 'bnpl' && debt.bnplPostInterest > 0)) && (
                            <div>
                              <button onClick={() => setShowWhatIf({ ...showWhatIf, [debt.id]: !showWhatIf[debt.id] })} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--accent-primary)', fontSize: '12px', fontWeight: '500', padding: '2px 0', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <span style={{ display: 'inline-flex', transform: showWhatIf[debt.id] ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}><Icons.ChevronDown size={13} /></span>
                                What if I paid more?
                              </button>
                              {showWhatIf[debt.id] && (
                                <div style={{ marginTop: '8px', padding: '12px', background: 'var(--glass)', borderRadius: '10px', border: '1px solid var(--border)' }}>
                                  <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                                    <input type="number" className="input" placeholder="e.g. 200" value={whatIfAmounts[debt.id] || ''} onChange={(e) => setWhatIfAmounts({ ...whatIfAmounts, [debt.id]: e.target.value })} style={{ flex: 1 }} />
                                    <span style={{ display: 'flex', alignItems: 'center', fontSize: '12px', color: 'var(--text-muted)' }}>/mo</span>
                                  </div>
                                  {(() => {
                                    const amt = parseFloat(whatIfAmounts[debt.id]);
                                    if (!amt || amt <= 0) return <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Enter a monthly amount to see payoff timeline</div>;
                                    const bnplInfo = mode === 'bnpl' ? getBnplInfo(debt) : null;
                                    const effectiveRate = (mode === 'bnpl' && bnplInfo?.isExpired && debt.bnplPostInterest > 0) ? debt.bnplPostInterest : debt.interestRate;
                                    const calcDebt = { ...debt, interestRate: effectiveRate };
                                    const result = calculatePayoff(calcDebt, amt);
                                    if (!result) return null;
                                    if (result.months === Infinity) return <div style={{ fontSize: '12px', color: tc.danger }}><Icons.Warning size={13} style={{ verticalAlign: '-2px' }} /> {cs}{amt.toFixed(2)}/mo won't cover {effectiveRate}% APR interest</div>;
                                    const currentPayment = debt.recurringPayment || debt.bnplPostPayment || 0;
                                    const currentResult = currentPayment > 0 ? calculatePayoff(calcDebt, currentPayment) : null;
                                    const savedMonths = currentResult && currentResult.months !== Infinity ? currentResult.months - result.months : null;
                                    const savedInterest = currentResult && currentResult.months !== Infinity ? currentResult.totalInterest - result.totalInterest : null;
                                    const payoffDate = new Date(); payoffDate.setMonth(payoffDate.getMonth() + result.months);
                                    return (
                                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                        <div style={{ fontSize: '13px', fontWeight: '600' }}>Paid off in {formatMonths(result.months)} <span style={{ fontSize: '11px', fontWeight: '400', color: 'var(--text-muted)' }}>({payoffDate.toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })})</span></div>
                                        {result.totalInterest > 0 && <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Total interest: {cs}{result.totalInterest.toFixed(2)}</div>}
                                        {savedMonths > 0 && currentPayment > 0 && currentResult && (
                                          <div style={{ fontSize: '12px', color: tc.success, padding: '6px 8px', background: tc.successTintLight, borderRadius: '8px' }}>
                                            <Icons.Lightbulb size={13} style={{ verticalAlign: '-2px' }} /> Saves {savedMonths > 0 ? `${formatMonths(savedMonths)} ` : ''}{savedInterest > 0 ? `· ${cs}${savedInterest.toFixed(2)} interest` : ''}
                                          </div>
                                        )}
                                      </div>
                                    );
                                  })()}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Paid off state */}
                      {isPaidOff && !selectionMode && (
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginLeft: '46px' }}>
                          <div style={{ flex: 1, padding: '8px 12px', background: tc.successTint, borderRadius: '8px', border: `1px solid ${tc.successTintStrong}`, color: tc.success, fontSize: '13px', fontWeight: '600', textAlign: 'center' }}>✓ Paid off!</div>
                          <button onClick={() => handleArchiveDebt(debt.id)} style={{ padding: '8px 12px', border: '1px solid var(--border)', borderRadius: '8px', background: 'var(--glass)', cursor: 'pointer', fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)' }}>Archive</button>
                        </div>
                      )}

                      {/* Payment history */}
                      {debt.payments && debt.payments.length > 0 && (
                        <div style={{ marginTop: '10px', marginLeft: '46px' }}>
                          <button onClick={() => setShowDebtHistory({ ...showDebtHistory, [debt.id]: !showDebtHistory[debt.id] })} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', fontSize: '12px', fontWeight: '500', padding: '2px 0', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <span style={{ display: 'inline-flex', transform: showDebtHistory[debt.id] ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}><Icons.ChevronDown size={13} /></span>
                            Payment History ({debt.payments.length})
                          </button>
                          {showDebtHistory[debt.id] && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', marginTop: '8px', maxHeight: '180px', overflowY: 'auto' }}>
                              {[...debt.payments].reverse().map((tx, i) => (
                                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '7px 10px', background: 'var(--glass)', borderRadius: '8px', border: '1px solid var(--border)' }}>
                                  <div>
                                    <div style={{ fontSize: '12px', fontWeight: '500', color: tc.success }}>{tx.type === 'recurring' ? '↻ Auto-payment' : '↓ Manual payment'}</div>
                                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{new Date(tx.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</div>
                                  </div>
                                  <div className="font-mono" style={{ fontSize: '13px', fontWeight: '600', color: tc.success }}>-{cs}{Math.abs(tx.amount).toFixed(2)}</div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {/* Archived section */}
          {archivedDebts.length > 0 && (
            <div style={{ marginTop: '8px' }}>
              <button onClick={() => setShowArchived(!showArchived)} style={{ width: '100%', padding: '14px 20px', border: '1px solid var(--border)', borderRadius: '16px', background: 'var(--glass)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: 'var(--text-secondary)', fontSize: '14px', fontWeight: '600' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span>✓ Completed</span>
                  <span style={{ background: tc.successTint, color: tc.success, padding: '2px 8px', borderRadius: '10px', fontSize: '12px', fontWeight: '700' }}>{archivedDebts.length}</span>
                </div>
                <span style={{ transition: 'transform 0.2s', transform: showArchived ? 'rotate(180deg)' : 'rotate(0deg)' }}>▾</span>
              </button>
              {showArchived && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '8px' }}>
                  {archivedDebts.map((debt) => (
                    <div key={debt.id} className="mobile-bill-card" style={{ opacity: 0.75, borderLeft: '3px solid var(--success)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{ width: '36px', height: '36px', borderRadius: '10px', flexShrink: 0, background: tc.successTint, border: `1px solid ${tc.successTintStrong}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          {getDebtIcon(debt.type, 20, 'var(--success)')}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontWeight: '600', fontSize: '14px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{debt.name}</div>
                          <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{debt.type} · Paid off {debt.archivedAt ? new Date(debt.archivedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : ''}</div>
                        </div>
                        {debt.originalAmount > 0 && <div className="font-mono" style={{ fontSize: '13px', color: 'var(--text-muted)', textDecoration: 'line-through', flexShrink: 0 }}>{cs}{debt.originalAmount.toFixed(2)}</div>}
                      </div>
                      <div style={{ display: 'flex', gap: '8px', marginTop: '10px', marginLeft: '46px' }}>
                        <button onClick={() => handleUnarchiveDebt(debt.id)} style={{ flex: 1, padding: '7px', border: '1px solid var(--border)', borderRadius: '8px', background: 'var(--glass)', cursor: 'pointer', fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)' }}>↩ Restore</button>
                        <button onClick={() => handleDeleteDebt(debt.id)} style={{ padding: '7px 12px', border: 'none', borderRadius: '8px', background: tc.dangerTintLight, cursor: 'pointer', fontSize: '12px', fontWeight: '600', color: tc.danger }}>✕</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Bulk Action Bar */}
      {selectionMode && selectedIds.size > 0 && ReactDOM.createPortal(
        <div style={{ position: 'fixed', bottom: '20px', left: '16px', right: '16px', padding: '12px 16px', borderRadius: '16px', background: 'var(--bg-card, #141833)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', border: '1px solid var(--border)', boxShadow: '0 8px 32px rgba(0,0,0,0.6)', zIndex: 9999, animation: 'slideInUp 0.2s', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-primary)' }}>{selectedIds.size} selected</span>
            <button onClick={() => { haptic.light(); exitSelection(); }} style={{ padding: '4px 10px', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--glass)', cursor: 'pointer', fontSize: '12px', fontWeight: '600', color: 'var(--text-muted)' }}>✕ Cancel</button>
          </div>
          <div style={{ display: 'flex', gap: '6px' }}>
            <button onClick={() => { handleBulkArchiveDebts([...selectedIds]); exitSelection(); }} style={{ flex: 1, padding: '10px 8px', borderRadius: '10px', border: 'none', background: 'linear-gradient(135deg, var(--success), #059669)', color: '#fff', cursor: 'pointer', fontSize: '12px', fontWeight: '600' }}>
              <Icons.Check size={14} /> Archive
            </button>
            <button onClick={async () => { await handleBulkDeleteDebts([...selectedIds]); exitSelection(); }} style={{ flex: 1, padding: '10px 8px', borderRadius: '10px', border: '1px solid var(--danger)', background: 'transparent', color: 'var(--danger)', cursor: 'pointer', fontSize: '12px', fontWeight: '600', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px' }}>
              <Icons.Trash size={14} /> Delete
            </button>
          </div>
        </div>,
        document.body
      )}

      {/* Milestone Celebration Overlay */}
      <MilestoneCelebration celebration={debtCelebration} onDismiss={() => setDebtCelebration(null)} />

      {/* Educational Info Sheets */}
      <InfoSheet open={infoSheet === 'snowball'} onClose={() => setInfoSheet(null)} title="Snowball Method">
        <p style={{ marginBottom: '12px' }}>
          Pay the <strong>minimum on all debts</strong>, then throw every extra penny at the <strong>smallest balance first</strong>. Once it's gone, roll that payment into the next smallest.
        </p>
        <p style={{ marginBottom: '12px' }}>
          Quick wins build momentum - each debt you eliminate frees up more money and more motivation to keep going.
        </p>
        <div style={{ padding: '10px 12px', borderRadius: '10px', background: 'color-mix(in srgb, var(--accent-primary) 8%, transparent)', border: '1px solid color-mix(in srgb, var(--accent-primary) 15%, transparent)', fontSize: '13px' }}>
          <strong style={{ color: 'var(--accent-primary)' }}>Best for:</strong> People who need psychological wins to stay motivated. Popularised by Dave Ramsey.
        </div>
      </InfoSheet>

      <InfoSheet open={infoSheet === 'avalanche'} onClose={() => setInfoSheet(null)} title="Avalanche Method">
        <p style={{ marginBottom: '12px' }}>
          Pay the <strong>minimum on all debts</strong>, then throw every extra penny at the debt with the <strong>highest interest rate first</strong>. This saves the most money over time.
        </p>
        <p style={{ marginBottom: '12px' }}>
          You'll pay less interest overall, but the first win may take longer - it requires patience and discipline.
        </p>
        <div style={{ padding: '10px 12px', borderRadius: '10px', background: 'color-mix(in srgb, #a78bfa 8%, transparent)', border: '1px solid color-mix(in srgb, #a78bfa 15%, transparent)', fontSize: '13px' }}>
          <strong style={{ color: '#a78bfa' }}>Best for:</strong> People motivated by saving the most money. Mathematically optimal.
        </div>
        <p style={{ marginTop: '12px', fontSize: '12px', color: 'var(--text-muted)', fontStyle: 'italic' }}>
          Both methods work - the best one is the one you stick with.
        </p>
      </InfoSheet>

      <InfoSheet open={infoSheet === 'dti'} onClose={() => setInfoSheet(null)} title="Debt-to-Income Ratio">
        <p style={{ marginBottom: '12px' }}>
          Your <strong>DTI ratio</strong> is the percentage of your monthly income that goes toward debt payments. Lenders use this to assess affordability.
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px' }}>
            <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: 'var(--success)', flexShrink: 0 }} />
            <span><strong>0-36%</strong> - Healthy. You're in a strong position.</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px' }}>
            <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: 'var(--warning)', flexShrink: 0 }} />
            <span><strong>37-50%</strong> - Moderate. Consider reducing debt before borrowing more.</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px' }}>
            <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: 'var(--danger)', flexShrink: 0 }} />
            <span><strong>50%+</strong> - High. Most of your income goes to debt.</span>
          </div>
        </div>
        <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
          Most UK lenders prefer a DTI below 40% for mortgage applications.
        </p>
      </InfoSheet>

      <InfoSheet open={infoSheet === 'utilization'} onClose={() => setInfoSheet(null)} title="Credit Utilization">
        <p style={{ marginBottom: '12px' }}>
          <strong>Credit utilization</strong> is how much of your credit limit you're using. It's one of the biggest factors in your credit score.
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px' }}>
            <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: 'var(--success)', flexShrink: 0 }} />
            <span><strong>0-30%</strong> - Good. Shows responsible credit use.</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px' }}>
            <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: 'var(--accent-primary)', flexShrink: 0 }} />
            <span><strong>30-50%</strong> - Fair. Could impact your score.</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px' }}>
            <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: 'var(--danger)', flexShrink: 0 }} />
            <span><strong>50%+</strong> - High. Likely hurting your credit score.</span>
          </div>
        </div>
        <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
          Aim to keep each card below 30%. Paying down balances before statement dates helps the most.
        </p>
      </InfoSheet>

      <InfoSheet open={infoSheet === 'consolidation'} onClose={() => setInfoSheet(null)} title="Debt Consolidation">
        <p style={{ marginBottom: '12px' }}>
          <strong>Debt consolidation</strong> means combining multiple debts into a single loan, usually at a lower interest rate. Instead of juggling several payments, you make one.
        </p>
        <p style={{ marginBottom: '12px' }}>
          It can save money if the new rate is lower than your current average, and simplifies your finances. But watch out for longer terms that increase total interest paid.
        </p>
        <div style={{ padding: '10px 12px', borderRadius: '10px', background: 'color-mix(in srgb, var(--warning) 8%, transparent)', border: '1px solid color-mix(in srgb, var(--warning) 15%, transparent)', fontSize: '13px' }}>
          <strong style={{ color: 'var(--warning)' }}>Watch out:</strong> Consolidation only helps if you stop adding new debt. Otherwise you end up with the loan <em>and</em> new balances.
        </div>
      </InfoSheet>
    </>
  );
}

import { useCurrency } from './CurrencyContext';
import React from 'react';
import ReactDOM from 'react-dom';
import * as Icons from './Icons';
import haptic from '../utils/haptics';
import { tc } from '../utils/themeColors';
import { DEBT_TYPES } from '../data/initialData';

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
  'Other': Icons.CategoryOther,
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

const getBnplInfo = (debt) => {
  if (debt.paymentMode !== 'bnpl') return null;
  const promoMonths = debt.bnplPromoMonths || 0;
  const startDate = debt.bnplStartDate ? new Date(debt.bnplStartDate) : null;
  if (!promoMonths || !startDate) return null;
  const now = new Date();
  const endDate = new Date(startDate);
  endDate.setMonth(endDate.getMonth() + promoMonths);
  const monthsElapsed = Math.max(0, (now.getFullYear() - startDate.getFullYear()) * 12 + (now.getMonth() - startDate.getMonth()));
  const monthsRemaining = Math.max(0, promoMonths - monthsElapsed);
  const isExpired = now >= endDate;
  const monthlyToClear = monthsRemaining > 0 && debt.totalAmount > 0 ? Math.ceil((debt.totalAmount / monthsRemaining) * 100) / 100 : 0;
  let postPromoInfo = null;
  if (debt.bnplPostInterest > 0 && debt.bnplPostPayment > 0 && debt.totalAmount > 0) {
    const r = debt.bnplPostInterest / 100 / 12;
    let bal = debt.totalAmount, m = 0, ti = 0;
    while (bal > 0 && m < 600) {
      const i = bal * r; ti += i; bal = bal + i - debt.bnplPostPayment; m++;
      if (debt.bnplPostPayment <= i) { m = Infinity; break; }
    }
    postPromoInfo = { months: m, totalInterest: ti, monthlyPayment: debt.bnplPostPayment };
  }
  return { promoMonths, monthsRemaining, monthsElapsed, isExpired, endDate, monthlyToClear, postPromoInfo };
};

const getInstallmentInfo = (debt) => {
  if (debt.paymentMode !== 'installment') return null;
  const totalMonths = debt.installmentMonths || 0;
  const startDate = debt.installmentStartDate ? new Date(debt.installmentStartDate) : null;
  if (!totalMonths) return null;
  const originalAmount = debt.originalAmount || debt.totalAmount;
  const monthlyPayment = totalMonths > 0 ? Math.ceil((originalAmount / totalMonths) * 100) / 100 : 0;
  let paymentsMade = 0;
  if (startDate) {
    const now = new Date();
    const elapsed = (now.getFullYear() - startDate.getFullYear()) * 12 + (now.getMonth() - startDate.getMonth());
    paymentsMade = Math.max(0, Math.min(elapsed, totalMonths));
  } else {
    const paidSoFar = originalAmount - debt.totalAmount;
    paymentsMade = monthlyPayment > 0 ? Math.round(paidSoFar / monthlyPayment) : 0;
  }
  const paymentsRemaining = Math.max(0, totalMonths - paymentsMade);
  let endDate = null;
  if (startDate) {
    endDate = new Date(startDate);
    endDate.setMonth(endDate.getMonth() + totalMonths);
  }
  return { totalMonths, monthlyPayment, paymentsMade, paymentsRemaining, endDate };
};

const getDebtFreeDate = (debt, calculatePayoff) => {
  const payment = debt.recurringPayment || 0;
  if (payment <= 0 || debt.totalAmount <= 0) return null;
  const result = calculatePayoff(debt, payment);
  if (!result || result.months === Infinity) return null;
  const date = new Date();
  date.setMonth(date.getMonth() + result.months);
  return { date, months: result.months };
};

function DebtInfoBanner({ debt, calculatePayoff }) {
  const cs = useCurrency();
  const mode = debt.paymentMode || 'recurring';

  if (mode === 'one-off' && debt.dueDate) {
    const due = new Date(debt.dueDate);
    const now = new Date();
    const daysUntil = Math.ceil((due - now) / (1000 * 60 * 60 * 24));
    const isOverdue = daysUntil < 0;
    const isUrgent = daysUntil >= 0 && daysUntil <= 14;
    return (
      <div style={{ fontSize: '12px', padding: '7px 10px', borderRadius: '8px', marginBottom: '10px',
        color: isOverdue ? tc.danger : isUrgent ? tc.warning : tc.secondary,
        background: isOverdue ? tc.dangerTint : isUrgent ? tc.warningTint : 'var(--glass)',
        border: `1px solid ${isOverdue ? tc.dangerTintStrong : isUrgent ? tc.warningTintStrong : 'var(--border)'}` }}>
        {isOverdue ? `⚠️ Overdue by ${Math.abs(daysUntil)} days` : `Due ${due.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })} · ${daysUntil} days`}
      </div>
    );
  }

  if (mode === 'installment') {
    const info = getInstallmentInfo(debt);
    if (!info) return null;
    return (
      <div style={{ fontSize: '12px', padding: '7px 10px', borderRadius: '8px', marginBottom: '10px', color: tc.purple, background: tc.purpleTint, border: '1px solid rgba(124,58,237,0.15)' }}>
        <div>{cs}{info.monthlyPayment.toFixed(2)}/mo · {info.paymentsMade} of {info.totalMonths} payments</div>
        {info.endDate && <div style={{ fontSize: '11px', marginTop: '2px', opacity: 0.8 }}>Ends {info.endDate.toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })} · {info.paymentsRemaining} left</div>}
      </div>
    );
  }

  if (mode === 'bnpl') {
    const info = getBnplInfo(debt);
    if (!info) return null;
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '10px' }}>
        <div style={{ fontSize: '12px', padding: '7px 10px', borderRadius: '8px',
          color: info.isExpired ? tc.danger : info.monthsRemaining <= 3 ? tc.warning : tc.success,
          background: info.isExpired ? tc.dangerTint : info.monthsRemaining <= 3 ? tc.warningTint : tc.successTintLight,
          border: `1px solid ${info.isExpired ? tc.dangerTintStrong : info.monthsRemaining <= 3 ? tc.warningTintStrong : tc.successTintStrong}` }}>
          {info.isExpired ? '⚠️ Interest-free period expired!' : (
            <><div>🟢 Interest-free · {info.monthsRemaining} of {info.promoMonths} months left</div>
            {info.monthlyToClear > 0 && <div style={{ fontSize: '11px', marginTop: '2px', opacity: 0.8 }}>Pay {cs}{info.monthlyToClear.toFixed(2)}/mo to clear in time</div>}</>
          )}
        </div>
        {info.postPromoInfo && debt.totalAmount > 0 && (
          <div style={{ fontSize: '11px', padding: '7px 10px', borderRadius: '8px', color: 'var(--text-muted)', background: 'var(--glass)', border: '1px solid var(--border)' }}>
            {info.isExpired ? 'Now paying' : 'If not cleared'}: {cs}{info.postPromoInfo.monthlyPayment.toFixed(2)}/mo at {debt.bnplPostInterest}% APR
            {info.postPromoInfo.months !== Infinity && ` · ${formatMonths(info.postPromoInfo.months)} · ${cs}${info.postPromoInfo.totalInterest.toFixed(2)} interest`}
          </div>
        )}
      </div>
    );
  }

  if (mode === 'recurring') {
    const debtFree = getDebtFreeDate(debt, calculatePayoff);
    if (debtFree && debt.totalAmount > 0) {
      return (
        <div style={{ fontSize: '12px', color: tc.success, marginBottom: '10px', padding: '7px 10px', background: tc.successTintLight, borderRadius: '8px', border: '1px solid rgba(16,185,129,0.15)' }}>
          Debt-free by {debtFree.date.toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })} · {formatMonths(debtFree.months)}
        </div>
      );
    }
  }

  return null;
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
}) {
  const cs = useCurrency();
  const [showWhatIf, setShowWhatIf] = React.useState({});
  const [whatIfAmounts, setWhatIfAmounts] = React.useState({});
  const [showArchived, setShowArchived] = React.useState(false);

  // Selection mode
  const [selectionMode, setSelectionMode] = React.useState(false);
  const [selectedIds, setSelectedIds] = React.useState(new Set());
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
  const onCardTouchStart = (e, id) => {
    if (e.target.closest('button, input, select, a') || selectionMode) return;
    longPressMoved.current = false;
    longPressTimer.current = setTimeout(() => {
      if (!longPressMoved.current) { setSelectionMode(true); setSelectedIds(new Set([id])); haptic.medium(); }
    }, 400);
  };
  const onCardTouchMove = () => { longPressMoved.current = true; if (longPressTimer.current) { clearTimeout(longPressTimer.current); longPressTimer.current = null; } };
  const onCardTouchEnd = () => { if (longPressTimer.current) { clearTimeout(longPressTimer.current); longPressTimer.current = null; } };

  const activeDebts = debts.filter(d => !d.archived);
  const archivedDebts = debts.filter(d => d.archived);

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
                {activeDebts.length > 0 && <button onClick={() => { haptic.medium(); setSelectionMode(true); }} style={{ padding: '6px 12px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--glass)', cursor: 'pointer', fontSize: '12px', fontWeight: '600', color: 'var(--text-muted)' }}>Select</button>}
                <button className="btn btn-primary" onClick={() => setShowDebtModal(true)}><Icons.Plus size={18} /> Add</button>
              </>
            )}
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
          <div style={{ padding: '14px', background: totalDebt > 0 ? tc.dangerTintLight : tc.successTintLight, borderRadius: '12px', border: `1px solid ${totalDebt > 0 ? tc.dangerTintStrong : tc.successTintStrong}` }}>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>Total Debt</div>
            <div className="font-mono" style={{ fontSize: '22px', fontWeight: '700', color: totalDebt > 0 ? tc.danger : tc.success }}>{cs}{totalDebt.toFixed(2)}</div>
          </div>
          <div style={{ padding: '14px', background: 'var(--glass)', borderRadius: '12px', border: '1px solid var(--border)' }}>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>Active</div>
            <div className="font-mono" style={{ fontSize: '22px', fontWeight: '700' }}>{activeDebts.filter(d => d.totalAmount > 0).length}</div>
          </div>
        </div>
      </div>

      {/* List */}
      {activeDebts.length === 0 && archivedDebts.length === 0 ? (
        <div className="glass-card" style={{ padding: '40px', textAlign: 'center' }}>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>No debts tracked yet. Tap "Add" to get started.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {activeDebts.length === 0 && (
            <div className="glass-card" style={{ padding: '24px', textAlign: 'center' }}>
              <p style={{ color: tc.success, fontSize: '14px', fontWeight: '600' }}>🎉 All debts paid off!</p>
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
                onClick={() => selectionMode && (haptic.light(), toggleSelect(debt.id))}
              >
                <div className="mobile-bill-card" style={{
                  borderLeft: `3px solid ${accentColor}`,
                  background: isPaidOff ? tc.successTintLight : undefined,
                  outline: selectionMode && selectedIds.has(debt.id) ? '2px solid var(--accent-primary)' : 'none',
                }}>
                  {selectionMode && (
                    <div style={{ position: 'absolute', left: '8px', top: '50%', transform: 'translateY(-50%)',
                      width: '22px', height: '22px', borderRadius: '6px',
                      border: `2px solid ${selectedIds.has(debt.id) ? 'var(--accent-primary)' : 'var(--border)'}`,
                      background: selectedIds.has(debt.id) ? 'linear-gradient(135deg, var(--accent-primary), var(--success))' : 'transparent',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', color: '#fff' }}>
                      {selectedIds.has(debt.id) && '✓'}
                    </div>
                  )}
                  {editingDebtId === debt.id ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      <input className="input" value={editDebtForm.name} onChange={(e) => setEditDebtForm({ ...editDebtForm, name: e.target.value })} placeholder="Debt name" />
                      <select className="input" value={editDebtForm.type} onChange={(e) => setEditDebtForm({ ...editDebtForm, type: e.target.value })}>
                        {DEBT_TYPES.map((t) => (<option key={t} value={t}>{t}</option>))}
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
                      {(editDebtForm.paymentMode || 'recurring') === 'recurring' && (
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                          <div>
                            <label style={{ display: 'block', color: 'var(--text-secondary)', fontSize: '12px', marginBottom: '4px' }}>Min Payment</label>
                            <input type="number" className="input" value={editDebtForm.minimumPayment} onChange={(e) => setEditDebtForm({ ...editDebtForm, minimumPayment: e.target.value })} />
                          </div>
                          <div>
                            <label style={{ display: 'block', color: 'var(--text-secondary)', fontSize: '12px', marginBottom: '4px' }}>Auto Monthly</label>
                            <input type="number" className="input" value={editDebtForm.recurringPayment} onChange={(e) => setEditDebtForm({ ...editDebtForm, recurringPayment: e.target.value })} />
                          </div>
                        </div>
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
                            <button onClick={() => handleDebtEditStart(debt)} style={{ width: '22px', height: '22px', borderRadius: '5px', border: '1px solid var(--accent-primary)', background: 'var(--info-tint)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-primary)', flexShrink: 0 }}>
                              <Icons.Edit size={12} />
                            </button>
                          </div>
                          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '1px' }}>{debt.type}{debt.interestRate > 0 && ` · ${debt.interestRate}% APR`}</div>
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

                      {/* ── Progress bar ── */}
                      {debt.originalAmount > 0 && (
                        <div style={{ marginBottom: '10px', marginLeft: '46px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>
                            <span>{progress.toFixed(1)}% paid off</span>
                            <span>{cs}{(debt.originalAmount - debt.totalAmount).toFixed(2)} paid</span>
                          </div>
                          <div style={{ height: '5px', background: 'var(--glass)', borderRadius: '3px', overflow: 'hidden', border: '1px solid var(--border)' }}>
                            <div style={{ width: `${progress}%`, height: '100%', background: 'linear-gradient(90deg, var(--success), var(--accent-primary))', borderRadius: '3px', transition: 'width 0.5s' }} />
                          </div>
                        </div>
                      )}

                      {/* ── Info banner ── */}
                      <div style={{ marginLeft: '46px' }}>
                        <DebtInfoBanner debt={debt} calculatePayoff={calculatePayoff} />
                      </div>

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
                                    if (result.months === Infinity) return <div style={{ fontSize: '12px', color: tc.danger }}>⚠️ {cs}{amt.toFixed(2)}/mo won't cover {effectiveRate}% APR interest</div>;
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
                                            💡 Saves {savedMonths > 0 ? `${formatMonths(savedMonths)} ` : ''}{savedInterest > 0 ? `· ${cs}${savedInterest.toFixed(2)} interest` : ''}
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
            <button onClick={exitSelection} style={{ padding: '4px 10px', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--glass)', cursor: 'pointer', fontSize: '12px', fontWeight: '600', color: 'var(--text-muted)' }}>✕ Cancel</button>
          </div>
          <div style={{ display: 'flex', gap: '6px' }}>
            <button onClick={() => { haptic.success(); [...selectedIds].forEach(id => handleArchiveDebt(id)); exitSelection(); }} style={{ flex: 1, padding: '10px 8px', borderRadius: '10px', border: 'none', background: 'linear-gradient(135deg, var(--success), #059669)', color: '#fff', cursor: 'pointer', fontSize: '12px', fontWeight: '600' }}>
              <Icons.Check size={14} /> Archive
            </button>
            <button onClick={() => { haptic.error(); [...selectedIds].forEach(id => handleDeleteDebt(id)); exitSelection(); }} style={{ flex: 1, padding: '10px 8px', borderRadius: '10px', border: '1px solid var(--danger)', background: 'transparent', color: 'var(--danger)', cursor: 'pointer', fontSize: '12px', fontWeight: '600', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px' }}>
              <Icons.Trash size={14} /> Delete
            </button>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}

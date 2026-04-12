import { useCurrency } from './CurrencyContext';
import React, { useState } from 'react';
import * as Icons from './Icons';
import { tc } from '../utils/themeColors';
import haptic from '../utils/haptics';

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function formatMonth(monthStr) {
  if (!monthStr) return '';
  const [year, month] = monthStr.split('-');
  return `${MONTH_NAMES[parseInt(month) - 1]} ${year}`;
}

function formatDueDate(bill) {
  if (bill.paymentDate && bill.paymentDate.includes('-')) {
    const d = new Date(bill.paymentDate);
    return `${d.getDate()} ${MONTH_NAMES[d.getMonth()]}`;
  }
  if (bill.paymentDate) return `${getOrdinal(parseInt(bill.paymentDate))} of month`;
  if (bill.paymentDay) return `Day ${bill.paymentDay}`;
  return '';
}

function getOrdinal(n) {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

function MiniProgress({ current, total, color = 'var(--success-text)', height = 4 }) {
  const pct = total > 0 ? Math.min(100, (current / total) * 100) : 0;
  return (
    <div style={{ width: '100%', height, borderRadius: height, background: tc.progressTrack, overflow: 'hidden' }}>
      <div style={{ width: `${pct}%`, height: '100%', borderRadius: height, background: color, transition: 'width 0.3s ease' }} />
    </div>
  );
}

function ChevronDown({ expanded, color = 'var(--text-muted)' }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
      style={{ transition: 'transform 0.2s ease', transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)', flexShrink: 0 }}>
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}

export default function OverviewPanel({ totals, incomeNum, categoryTotals, isMobile, insights = {}, bills = [], totalDebt = 0, totalSaved = 0, debts = [], savings = [], strategyResults, debtStrategy, calculateSavingsEstimate, expenseScope = 'bills', setExpenseScope, monthlyDebtPayments = 0, monthlySavingsContributions = 0 }) {
  const cs = useCurrency();

  const [expandedCards, setExpandedCards] = useState({});
  const toggleCard = (key) => setExpandedCards(prev => ({ ...prev, [key]: !prev[key] }));

  const { lastSnapshot } = insights;

  // Scoped expense calculations
  const scopedExpenses = totals.actualExpenses
    + (expenseScope === 'bills+debt' || expenseScope === 'all' ? monthlyDebtPayments : 0)
    + (expenseScope === 'all' ? monthlySavingsContributions : 0);
  const scopedBalance = incomeNum - scopedExpenses;
  const scopedLabel = expenseScope === 'all' ? 'Total Outflow' : expenseScope === 'bills+debt' ? 'Expenses + Debt' : 'Expenses';

  const upcomingBills = bills.filter(b => !b.paid && !b.paused && !b.missed);
  const upcomingCount = upcomingBills.length;
  const upcomingTotal = upcomingBills.reduce((s, b) => s + (b.actual || 0), 0);

  const spendingDiff = lastSnapshot ? totals.actualExpenses - lastSnapshot.expenses : null;
  const spendingPct = lastSnapshot && lastSnapshot.expenses > 0
    ? Math.round(((totals.actualExpenses - lastSnapshot.expenses) / lastSnapshot.expenses) * 100)
    : null;

  const lastCatTotals = lastSnapshot?.categories || {};
  const currentCatTotals = {};
  categoryTotals.forEach(c => { currentCatTotals[c.name] = c.total; });
  const allCatKeys = new Set([...Object.keys(lastCatTotals), ...Object.keys(currentCatTotals)]);
  const catChanges = [];
  allCatKeys.forEach(cat => {
    const prev = lastCatTotals[cat] || 0;
    const curr = currentCatTotals[cat] || 0;
    const diff = curr - prev;
    if (Math.abs(diff) > 0.01) catChanges.push({ category: cat, diff, prev, curr });
  });
  catChanges.sort((a, b) => Math.abs(b.diff) - Math.abs(a.diff));
  const topCatChanges = catChanges.slice(0, 5);

  const netWorth = totalSaved - totalDebt;

  const cardClickStyle = { cursor: 'pointer', WebkitTapHighlightColor: 'transparent' };

  return (
    <>
      {/* Expense scope toggle */}
      <div className="animate-in" style={{ display: 'flex', gap: '6px', marginBottom: '12px', animationDelay: '0.05s' }}>
        {[
          { key: 'bills', label: 'Living Expenses' },
          { key: 'bills+debt', label: '+ Debt' },
          { key: 'all', label: '+ Debt & Savings' },
        ].map(s => (
          <button key={s.key} onClick={() => { haptic.light(); setExpenseScope(s.key); }}
            style={{ flex: 1, padding: '8px 4px', borderRadius: '20px', fontSize: '11px', fontWeight: '600',
              cursor: 'pointer', whiteSpace: 'nowrap', transition: 'all 0.2s',
              border: expenseScope === s.key ? '2px solid var(--accent-primary)' : '1px solid var(--border)',
              background: expenseScope === s.key ? 'color-mix(in srgb, var(--accent-primary) 10%, transparent)' : 'var(--glass)',
              color: expenseScope === s.key ? 'var(--accent-primary)' : 'var(--text-muted)',
            }}>{s.label}</button>
        ))}
      </div>

      {/* Stats Grid */}
      <div className="stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: isMobile ? '12px' : '20px', marginBottom: isMobile ? '20px' : '40px' }}>
        <StatCard label="Income" value={`${cs}${incomeNum.toFixed(2)}`} subtitle="Monthly income" icon={<Icons.DollarSign size={16} />} color="var(--success)" delay="0.1s" isMobile={isMobile} />
        <StatCard label={scopedLabel} value={`${cs}${scopedExpenses.toFixed(2)}`} subtitle={expenseScope === 'bills' ? `${totals.paidBills} of ${totals.totalBills} bills paid` : expenseScope === 'bills+debt' ? `Bills + ${cs}${monthlyDebtPayments.toFixed(0)} debt` : `Bills + debt + ${cs}${monthlySavingsContributions.toFixed(0)} savings`} icon={<Icons.TrendingUp size={16} />} color="var(--danger)" delay="0.2s" isMobile={isMobile} progress={totals.totalBills > 0 ? (totals.paidBills / totals.totalBills) * 100 : 0} progressColor="var(--success)" />
        <StatCard label="Balance" value={`${cs}${scopedBalance.toFixed(2)}`} subtitle="Remaining this month" icon={scopedBalance >= 0 ? <Icons.TrendingUp size={16} /> : <Icons.TrendingDown size={16} />} color={scopedBalance >= 0 ? 'var(--accent-primary)' : 'var(--danger)'} valueColor={scopedBalance >= 0 ? tc.success : tc.danger} delay="0.3s" isMobile={isMobile} progress={incomeNum > 0 ? Math.min(100, Math.max(0, (scopedBalance / incomeNum) * 100)) : 0} progressColor="var(--accent-primary)" />
        <StatCard label="Variance" value={`${totals.difference > 0 ? '+' : ''}${cs}${totals.difference.toFixed(2)}`} subtitle="vs projected budget" icon={<Icons.PieChart size={16} />} color={Math.abs(totals.difference) < 10 ? 'var(--warning)' : 'var(--accent-secondary)'} valueColor={totals.difference === 0 ? tc.success : totals.difference > 0 ? tc.danger : tc.info} delay="0.4s" isMobile={isMobile} />
      </div>

      {/* ── Smart Insights ── */}
      <div className="glass-card animate-in" style={{ padding: isMobile ? '20px' : '28px', marginBottom: '20px', animationDelay: '0.45s' }}>
        <h2 className="font-display" style={{ fontSize: '20px', marginBottom: '20px' }}>Insights</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>

          {/* 1. Missed Bills Alert */}
          {(() => {
            const missedBills = bills.filter(b => b.missed);
            if (missedBills.length === 0) return null;
            const missedTotal = missedBills.reduce((s, b) => s + (parseFloat(b.actual) || parseFloat(b.projected) || 0), 0);
            return (
              <div onClick={() => missedBills.length > 0 && (haptic.light(), toggleCard('missed'))} style={{
                padding: '18px 20px', borderRadius: '14px',
                background: `linear-gradient(135deg, ${tc.dangerTint}, ${tc.warningTintLight})`,
                border: `1px solid ${tc.dangerTintStrong}`,
                ...cardClickStyle,
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div style={{ fontSize: '12px', color: tc.danger, fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px' }}>Missed Bills</div>
                    <div className="font-mono" style={{ fontSize: '28px', fontWeight: '700', color: tc.danger, lineHeight: 1.1 }}>
                      {cs}{missedTotal.toFixed(2)}
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <ChevronDown expanded={expandedCards.missed} color={tc.danger} />
                    <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: tc.dangerTintStrong, display: 'flex', alignItems: 'center', justifyContent: 'center', color: tc.danger }}>
                      <Icons.X size={20} />
                    </div>
                  </div>
                </div>
                <div style={{ fontSize: '13px', color: tc.secondary, marginTop: '8px' }}>
                  {missedBills.length} bill{missedBills.length !== 1 ? 's' : ''} missed this month
                </div>
                {expandedCards.missed && (
                  <div style={{ marginTop: '14px', borderTop: `1px solid ${tc.cardDivider}`, paddingTop: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {missedBills.map(bill => (
                      <div key={bill.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 10px', borderRadius: '8px', background: tc.cardDetail }}>
                        <div style={{ fontSize: '13px', fontWeight: '500', color: tc.primary }}>{bill.name}</div>
                        <div className="font-mono" style={{ fontSize: '14px', fontWeight: '600', color: tc.danger }}>{cs}{(parseFloat(bill.actual) || parseFloat(bill.projected) || 0).toFixed(2)}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })()}

          {/* 2. Upcoming Bills */}
          <div onClick={() => upcomingCount > 0 && (haptic.light(), toggleCard('upcoming'))} style={{
            padding: '18px 20px', borderRadius: '14px',
            background: upcomingCount > 0
              ? `linear-gradient(135deg, ${tc.warningTint}, ${tc.dangerTintLight})`
              : `linear-gradient(135deg, ${tc.successTint}, ${tc.infoTintLight})`,
            border: `1px solid ${upcomingCount > 0 ? tc.warningTintStrong : tc.successTintStrong}`,
            ...(upcomingCount > 0 ? cardClickStyle : {}),
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{ fontSize: '12px', color: tc.muted, fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px' }}>Upcoming Bills</div>
                <div className="font-mono" style={{ fontSize: '28px', fontWeight: '700', color: upcomingCount > 0 ? tc.warning : tc.success, lineHeight: 1.1 }}>
                  {upcomingCount > 0 ? `${cs}${upcomingTotal.toFixed(2)}` : bills.length === 0 ? 'No bills' : 'All clear'}
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {upcomingCount > 0 && <ChevronDown expanded={expandedCards.upcoming} color={tc.warning} />}
                <div style={{
                  width: '40px', height: '40px', borderRadius: '12px',
                  background: upcomingCount > 0 ? tc.warningTintStrong : tc.successTintStrong,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: upcomingCount > 0 ? tc.warning : tc.success,
                }}>
                  <Icons.Calendar size={20} />
                </div>
              </div>
            </div>
            <div style={{ fontSize: '13px', color: tc.secondary, marginTop: '8px' }}>
              {upcomingCount > 0
                ? `${upcomingCount} bill${upcomingCount !== 1 ? 's' : ''} still to pay this month`
                : bills.length === 0 ? 'Add bills to get started' : 'All bills paid for this month'
              }
            </div>
            {expandedCards.upcoming && upcomingCount > 0 && (
              <div style={{ marginTop: '14px', borderTop: `1px solid ${tc.cardDivider}`, paddingTop: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {upcomingBills.map(bill => (
                  <div key={bill.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 10px', borderRadius: '8px', background: tc.cardDetail }}>
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: '500', color: tc.primary }}>{bill.name}</div>
                      {formatDueDate(bill) && <div style={{ fontSize: '11px', color: tc.muted, marginTop: '2px' }}>Due: {formatDueDate(bill)}</div>}
                    </div>
                    <div className="font-mono" style={{ fontSize: '14px', fontWeight: '600', color: tc.warning }}>{cs}{(bill.actual || 0).toFixed(2)}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 2. vs Last Month */}
          {lastSnapshot ? (
            <div onClick={() => topCatChanges.length > 0 && (haptic.light(), toggleCard('vsLastMonth'))} style={{
              padding: '18px 20px', borderRadius: '14px',
              background: `linear-gradient(135deg, ${tc.purpleTint}, ${tc.infoTintLight})`,
              border: `1px solid ${tc.purpleTintStrong}`,
              ...(topCatChanges.length > 0 ? cardClickStyle : {}),
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ fontSize: '12px', color: tc.muted, fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px' }}>vs {formatMonth(lastSnapshot.month)}</div>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px' }}>
                    <div className="font-mono" style={{ fontSize: '22px', fontWeight: '700', color: spendingDiff <= 0 ? tc.success : tc.danger }}>
                      {spendingDiff <= 0 ? '↓' : '↑'} {cs}{Math.abs(spendingDiff || 0).toFixed(2)}
                    </div>
                    {spendingPct !== null && (
                      <div style={{
                        fontSize: '13px', fontWeight: '700', padding: '3px 8px', borderRadius: '6px',
                        background: spendingDiff <= 0 ? tc.successTintStrong : tc.dangerTintStrong,
                        color: spendingDiff <= 0 ? tc.success : tc.danger,
                      }}>
                        {spendingPct > 0 ? '+' : ''}{spendingPct}%
                      </div>
                    )}
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {topCatChanges.length > 0 && <ChevronDown expanded={expandedCards.vsLastMonth} color={tc.purple} />}
                  <div style={{
                    width: '40px', height: '40px', borderRadius: '12px',
                    background: tc.purpleTintStrong,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: tc.purple,
                  }}>
                    {spendingDiff <= 0 ? <Icons.TrendingDown size={20} /> : <Icons.TrendingUp size={20} />}
                  </div>
                </div>
              </div>
              <div style={{ fontSize: '13px', color: tc.secondary, marginTop: '8px' }}>
                {spendingDiff <= 0
                  ? `You're spending less than ${formatMonth(lastSnapshot.month)}`
                  : `Spending is up compared to ${formatMonth(lastSnapshot.month)}`
                }
              </div>
              {expandedCards.vsLastMonth && topCatChanges.length > 0 && (
                <div style={{ marginTop: '14px', borderTop: `1px solid ${tc.cardDivider}`, paddingTop: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {topCatChanges.map(change => (
                    <div key={change.category} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 10px', borderRadius: '8px', background: tc.cardDetail }}>
                      <div style={{ fontSize: '13px', fontWeight: '500', color: tc.primary }}>{change.category}</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '11px', color: tc.muted }}>{cs}{(change.prev || 0).toFixed(0)} → {cs}{(change.curr || 0).toFixed(0)}</span>
                        <span className="font-mono" style={{ fontSize: '13px', fontWeight: '600', color: change.diff > 0 ? tc.danger : tc.success }}>
                          {change.diff > 0 ? '+' : ''}{cs}{(change.diff || 0).toFixed(0)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div style={{
              padding: '18px 20px', borderRadius: '14px',
              background: tc.cardEmpty,
              border: `1px dashed ${tc.cardEmptyBorder}`,
            }}>
              <div style={{ fontSize: '12px', color: tc.muted, fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px' }}>vs Last Month</div>
              <div style={{ fontSize: '13px', color: tc.muted }}>Comparison available after your first month</div>
            </div>
          )}

          {/* 3. Debt-Free Countdown */}
          {(() => {
            const strat = strategyResults?.[debtStrategy];
            if (!strat || !strat.debtFreeDate || totalDebt <= 0) return null;
            const now = new Date();
            now.setHours(0, 0, 0, 0);
            const target = new Date(strat.debtFreeDate);
            target.setHours(0, 0, 0, 0);
            const daysUntil = Math.ceil((target - now) / (1000 * 60 * 60 * 24));
            if (daysUntil <= 0) return null;
            const years = Math.floor(strat.totalMonths / 12);
            const months = strat.totalMonths % 12;
            return (
              <div style={{
                padding: '18px 20px', borderRadius: '14px',
                background: `linear-gradient(135deg, color-mix(in srgb, var(--success) 10%, transparent), color-mix(in srgb, var(--accent-primary) 8%, transparent))`,
                border: '1px solid color-mix(in srgb, var(--success) 20%, transparent)',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div style={{ fontSize: '12px', color: tc.muted, fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px' }}>Debt-Free Countdown</div>
                    <div className="font-mono" style={{ fontSize: '28px', fontWeight: '700', color: tc.success, lineHeight: 1.1 }}>
                      {daysUntil} days
                    </div>
                  </div>
                  <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: tc.successTintStrong, display: 'flex', alignItems: 'center', justifyContent: 'center', color: tc.success }}>
                    <Icons.TrendingDown size={20} />
                  </div>
                </div>
                <div style={{ fontSize: '13px', color: tc.secondary, marginTop: '8px' }}>
                  {years > 0 ? `${years}y ${months}m` : `${months}m`} - free by {target.toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })}
                </div>
              </div>
            );
          })()}

          {/* 4. Nearest Savings Goal */}
          {(() => {
            const activeGoals = savings.filter(s => !s.archived && s.targetAmount > 0 && s.currentAmount < s.targetAmount);
            if (activeGoals.length === 0) return null;
            // Find the one closest to completion
            const nearest = activeGoals.reduce((best, g) => {
              const pct = g.currentAmount / g.targetAmount;
              const bestPct = best.currentAmount / best.targetAmount;
              return pct > bestPct ? g : best;
            });
            const progress = Math.min((nearest.currentAmount / nearest.targetAmount) * 100, 100);
            const remaining = nearest.targetAmount - nearest.currentAmount;
            const estimate = calculateSavingsEstimate?.(nearest);
            return (
              <div style={{
                padding: '18px 20px', borderRadius: '14px',
                background: `linear-gradient(135deg, color-mix(in srgb, var(--accent-primary) 10%, transparent), color-mix(in srgb, var(--success) 8%, transparent))`,
                border: '1px solid color-mix(in srgb, var(--accent-primary) 20%, transparent)',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '12px', color: tc.muted, fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px' }}>Nearest Goal</div>
                    <div style={{ fontSize: '16px', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '4px' }}>
                      {nearest.emoji ? `${nearest.emoji} ` : ''}{nearest.name}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                      <span className="font-mono" style={{ fontSize: '18px', fontWeight: '700', color: 'var(--accent-primary)' }}>{progress.toFixed(0)}%</span>
                      <span style={{ fontSize: '12px', color: tc.muted }}>{cs}{remaining.toFixed(0)} to go</span>
                    </div>
                  </div>
                  <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'color-mix(in srgb, var(--accent-primary) 20%, transparent)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-primary)' }}>
                    <Icons.TrendingUp size={20} />
                  </div>
                </div>
                <div style={{ marginTop: '10px' }}>
                  <MiniProgress current={nearest.currentAmount} total={nearest.targetAmount} color="var(--accent-primary)" height={5} />
                </div>
                {estimate && estimate.months > 0 && (
                  <div style={{ fontSize: '13px', color: tc.secondary, marginTop: '8px' }}>
                    ~{estimate.months} month{estimate.months !== 1 ? 's' : ''} to go at {cs}{nearest.monthlyContribution?.toFixed(0) || '0'}/mo
                  </div>
                )}
              </div>
            );
          })()}

          {/* 5. Debt & Savings row */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            {/* Total Debt */}
            <div onClick={() => debts.length > 0 && (haptic.light(), toggleCard('debt'))} style={{
              padding: '16px', borderRadius: '14px',
              background: totalDebt > 0
                ? `linear-gradient(135deg, ${tc.dangerTint}, ${tc.warningTintLight})`
                : `linear-gradient(135deg, ${tc.successTint}, ${tc.infoTintLight})`,
              border: `1px solid ${totalDebt > 0 ? tc.dangerTintStrong : tc.successTintStrong}`,
              ...(debts.length > 0 ? cardClickStyle : {}),
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                <div style={{ fontSize: '12px', color: tc.muted, fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Debt</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  {debts.length > 0 && <ChevronDown expanded={expandedCards.debt} color={totalDebt > 0 ? tc.danger : tc.success} />}
                  <div style={{
                    width: '32px', height: '32px', borderRadius: '10px',
                    background: totalDebt > 0 ? tc.dangerTintStrong : tc.successTintStrong,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: totalDebt > 0 ? tc.danger : tc.success,
                  }}>
                    <Icons.TrendingDown size={16} />
                  </div>
                </div>
              </div>
              <div className="font-mono" style={{ fontSize: '22px', fontWeight: '700', color: totalDebt > 0 ? tc.danger : tc.success, lineHeight: 1.1 }}>
                {totalDebt > 0 ? `${cs}${totalDebt.toFixed(2)}` : 'Debt free'}
              </div>
              <div style={{ fontSize: '12px', color: tc.muted, marginTop: '6px' }}>
                {totalDebt > 0 ? 'Total outstanding' : 'No debts'}
              </div>
            </div>

            {/* Total Saved */}
            <div onClick={() => savings.length > 0 && (haptic.light(), toggleCard('savings'))} style={{
              padding: '16px', borderRadius: '14px',
              background: `linear-gradient(135deg, ${tc.successTint}, ${tc.infoTintLight})`,
              border: `1px solid ${tc.successTintStrong}`,
              ...(savings.length > 0 ? cardClickStyle : {}),
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                <div style={{ fontSize: '12px', color: tc.muted, fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Saved</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  {savings.length > 0 && <ChevronDown expanded={expandedCards.savings} color={tc.success} />}
                  <div style={{
                    width: '32px', height: '32px', borderRadius: '10px',
                    background: tc.successTintStrong,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: tc.success,
                  }}>
                    <Icons.TrendingUp size={16} />
                  </div>
                </div>
              </div>
              <div className="font-mono" style={{ fontSize: '22px', fontWeight: '700', color: tc.success, lineHeight: 1.1 }}>
                {cs}{totalSaved.toFixed(2)}
              </div>
              <div style={{ fontSize: '12px', color: tc.muted, marginTop: '6px' }}>
                Total savings
              </div>
            </div>
          </div>

          {/* Debt detail */}
          {expandedCards.debt && debts.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '-6px' }}>
              {debts.map(debt => {
                const original = debt.originalAmount || debt.totalAmount;
                const paid = original - debt.totalAmount;
                return (
                  <div key={debt.id} style={{ padding: '10px 12px', borderRadius: '10px', background: tc.dangerTintLight, border: `1px solid ${tc.dangerTint}` }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                      <div style={{ fontSize: '13px', fontWeight: '500', color: tc.primary }}>{debt.name}</div>
                      <div className="font-mono" style={{ fontSize: '12px', color: tc.muted }}>
                        {cs}{paid.toFixed(0)} / {cs}{original.toFixed(0)}
                      </div>
                    </div>
                    <MiniProgress current={paid} total={original} color={tc.danger} />
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px' }}>
                      <span style={{ fontSize: '11px', color: tc.muted }}>{cs}{debt.totalAmount.toFixed(2)} remaining</span>
                      <span style={{ fontSize: '11px', color: tc.muted }}>{original > 0 ? Math.round((paid / original) * 100) : 0}% paid</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Savings detail */}
          {expandedCards.savings && savings.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '-6px' }}>
              {savings.map(goal => {
                const current = goal.currentAmount || 0;
                const target = goal.targetAmount || 0;
                return (
                  <div key={goal.id} style={{ padding: '10px 12px', borderRadius: '10px', background: tc.successTintLight, border: `1px solid ${tc.successTint}` }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                      <div style={{ fontSize: '13px', fontWeight: '500', color: tc.primary }}>{goal.name}</div>
                      <div className="font-mono" style={{ fontSize: '12px', color: tc.muted }}>
                        {cs}{current.toFixed(0)}{target > 0 ? ` / ${cs}${target.toFixed(0)}` : ''}
                      </div>
                    </div>
                    {target > 0 && <MiniProgress current={current} total={target} color={tc.success} />}
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px' }}>
                      <span style={{ fontSize: '11px', color: tc.muted }}>
                        {target > 0 ? `${cs}${Math.max(0, target - current).toFixed(2)} to go` : 'No target set'}
                      </span>
                      {target > 0 && <span style={{ fontSize: '11px', color: tc.muted }}>{Math.min(100, Math.round((current / target) * 100))}% saved</span>}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* 5. Net Worth */}
          <div style={{
            padding: '18px 20px', borderRadius: '14px',
            background: netWorth >= 0
              ? `linear-gradient(135deg, ${tc.infoTint}, ${tc.successTintLight})`
              : `linear-gradient(135deg, ${tc.dangerTint}, ${tc.warningTintLight})`,
            border: `1px solid ${netWorth >= 0 ? tc.infoTintStrong : tc.dangerTintStrong}`,
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{ fontSize: '12px', color: tc.muted, fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px' }}>Net Worth</div>
                <div className="font-mono" style={{ fontSize: '28px', fontWeight: '700', color: netWorth >= 0 ? tc.info : tc.danger, lineHeight: 1.1 }}>
                  {netWorth < 0 ? '-' : ''}{cs}{Math.abs(netWorth).toFixed(2)}
                </div>
              </div>
              <div style={{
                width: '40px', height: '40px', borderRadius: '12px',
                background: netWorth >= 0 ? tc.infoTintStrong : tc.dangerTintStrong,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: netWorth >= 0 ? tc.info : tc.danger,
              }}>
                <Icons.DollarSign size={20} />
              </div>
            </div>
            <div style={{ fontSize: '13px', color: tc.secondary, marginTop: '8px' }}>
              {netWorth >= 0
                ? 'Savings exceed debt'
                : `${cs}${Math.abs(netWorth).toFixed(2)} more debt than savings`
              }
            </div>
          </div>

        </div>
      </div>

      {/* Monthly Outgoings Breakdown */}
      {(() => {
        const COLORS = ['rgba(0,212,255,0.8)', 'rgba(124,58,237,0.8)', 'rgba(245,158,11,0.8)', 'rgba(16,185,129,0.8)', 'rgba(239,68,68,0.8)', 'rgba(168,85,247,0.8)', 'rgba(59,130,246,0.8)', 'rgba(236,72,153,0.8)'];
        // Bill categories (always shown)
        const entries = categoryTotals.map(c => ({ name: c.name, total: c.total }));
        // Debt payments (when scope includes debt)
        if ((expenseScope === 'bills+debt' || expenseScope === 'all') && monthlyDebtPayments > 0) {
          entries.push({ name: 'Debt Payments', total: Math.round(monthlyDebtPayments * 100) / 100 });
        }
        // Savings contributions (when scope includes all)
        if (expenseScope === 'all' && monthlySavingsContributions > 0) {
          entries.push({ name: 'Savings', total: Math.round(monthlySavingsContributions * 100) / 100 });
        }
        entries.sort((a, b) => b.total - a.total);
        if (entries.length === 0) return null;
        const grandTotal = entries.reduce((s, e) => s + e.total, 0);

        return (
          <div className="glass-card animate-in" style={{ padding: isMobile ? '20px' : '28px', marginBottom: '20px', animationDelay: '0.5s' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h2 className="font-display" style={{ fontSize: '20px' }}>Monthly Outgoings</h2>
              <span className="font-mono" style={{ fontSize: '14px', color: tc.muted }}>{cs}{grandTotal.toFixed(0)}</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {entries.map((entry, i) => {
                const pct = grandTotal > 0 ? (entry.total / grandTotal) * 100 : 0;
                return (
                  <div key={entry.name}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: COLORS[i % COLORS.length], flexShrink: 0 }} />
                        <span style={{ fontSize: '13px', fontWeight: '500', color: tc.secondary }}>{entry.name}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span className="font-mono" style={{ fontSize: '13px', fontWeight: '600' }}>{cs}{entry.total.toFixed(0)}</span>
                        <span style={{ fontSize: '11px', color: tc.muted, minWidth: '36px', textAlign: 'right' }}>{pct.toFixed(0)}%</span>
                      </div>
                    </div>
                    <div style={{ height: '6px', borderRadius: '3px', background: tc.progressTrack, overflow: 'hidden' }}>
                      <div style={{ width: `${pct}%`, height: '100%', borderRadius: '3px', background: COLORS[i % COLORS.length], transition: 'width 0.5s ease' }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })()}
    </>
  );
}

function StatCard({ label, value, subtitle, icon, color, valueColor, delay, isMobile, progress, progressColor }) {
  return (
    <div className="glass-card stat-card animate-in" style={{ padding: '14px', animationDelay: delay, display: 'flex', flexDirection: 'column', gap: '10px' }}>
      {/* Top row: icon pill + label */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <div style={{
          width: '32px', height: '32px', borderRadius: '9px', flexShrink: 0,
          background: `color-mix(in srgb, ${color} 15%, transparent)`,
          border: `1px solid color-mix(in srgb, ${color} 30%, transparent)`,
          display: 'flex', alignItems: 'center', justifyContent: 'center', color,
        }}>
          {icon}
        </div>
        <span style={{ fontSize: '12px', fontWeight: '600', color: tc.secondary, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</span>
      </div>
      {/* Value */}
      <div className="font-mono" style={{ fontSize: '24px', fontWeight: '700', color: valueColor || color, lineHeight: 1.1, wordBreak: 'break-word' }}>{value}</div>
      {/* Progress bar (optional) */}
      {progress !== undefined && (
        <div style={{ height: '3px', borderRadius: '2px', background: 'var(--glass)', overflow: 'hidden' }}>
          <div style={{ width: `${Math.min(100, progress)}%`, height: '100%', background: progressColor || color, borderRadius: '2px', transition: 'width 0.5s ease' }} />
        </div>
      )}
      {/* Subtitle */}
      <div style={{ fontSize: '12px', color: tc.muted, lineHeight: 1.3 }}>{subtitle}</div>
    </div>
  );
}
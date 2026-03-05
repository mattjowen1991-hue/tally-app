import { useCurrency } from './CurrencyContext';
import React, { useState } from 'react';
import * as Icons from './Icons';
import { tc } from '../utils/themeColors';

const CHART_COLORS = ['rgba(0,212,255,0.8)', 'rgba(124,58,237,0.8)', 'rgba(245,158,11,0.8)', 'rgba(16,185,129,0.8)', 'rgba(239,68,68,0.8)', 'rgba(168,85,247,0.8)'];

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

export default function OverviewPanel({ totals, incomeNum, categoryTotals, isMobile, insights = {}, bills = [], totalDebt = 0, totalSaved = 0, debts = [], savings = [] }) {
  const cs = useCurrency();

  const [expandedCards, setExpandedCards] = useState({});
  const toggleCard = (key) => setExpandedCards(prev => ({ ...prev, [key]: !prev[key] }));

  const { lastSnapshot, biggestChange } = insights;

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
      {/* Stats Grid */}
      <div className="stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: isMobile ? '12px' : '20px', marginBottom: isMobile ? '20px' : '40px' }}>
        <StatCard label="Income" value={`${cs}${incomeNum.toFixed(2)}`} subtitle="Monthly income" icon={<Icons.DollarSign size={20} />} color="var(--success)" delay="0.1s" isMobile={isMobile} />
        <StatCard label="Expenses" value={`${cs}${totals.actualExpenses.toFixed(2)}`} subtitle={`${totals.paidBills} of ${totals.totalBills} bills paid`} icon={<Icons.TrendingUp size={20} />} color="var(--danger)" delay="0.2s" isMobile={isMobile} />
        <StatCard label="Balance" value={`${cs}${totals.actualBalance.toFixed(2)}`} subtitle="Remaining this month" icon={totals.actualBalance >= 0 ? <Icons.TrendingUp size={20} /> : <Icons.TrendingDown size={20} />} color={totals.actualBalance >= 0 ? 'var(--accent-primary)' : 'var(--danger)'} valueColor={totals.actualBalance >= 0 ? tc.success : tc.danger} delay="0.3s" isMobile={isMobile} />
        <StatCard label="Variance" value={`${totals.difference > 0 ? '+' : ''}${cs}${totals.difference.toFixed(2)}`} subtitle="vs projected budget" icon={<Icons.PieChart size={20} />} color={Math.abs(totals.difference) < 10 ? 'var(--warning)' : 'var(--accent-secondary)'} valueColor={totals.difference === 0 ? tc.success : totals.difference > 0 ? tc.danger : tc.info} delay="0.4s" isMobile={isMobile} />
      </div>

      {/* ── Smart Insights ── */}
      <div className="glass-card animate-in" style={{ padding: isMobile ? '20px' : '28px', marginBottom: '20px', animationDelay: '0.45s' }}>
        <h2 className="font-display" style={{ fontSize: '20px', marginBottom: '20px' }}>Insights</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>

          {/* 1. Upcoming Bills */}
          <div onClick={() => upcomingCount > 0 && toggleCard('upcoming')} style={{
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
            <div onClick={() => topCatChanges.length > 0 && toggleCard('vsLastMonth')} style={{
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
                      {spendingDiff <= 0 ? '↓' : '↑'} {cs}{Math.abs(spendingDiff).toFixed(2)}
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
                        <span style={{ fontSize: '11px', color: tc.muted }}>{cs}{change.prev.toFixed(0)} → {cs}{change.curr.toFixed(0)}</span>
                        <span className="font-mono" style={{ fontSize: '13px', fontWeight: '600', color: change.diff > 0 ? tc.danger : tc.success }}>
                          {change.diff > 0 ? '+' : ''}{cs}{change.diff.toFixed(0)}
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

          {/* 3. Biggest Category Change */}
          {biggestChange && lastSnapshot ? (
            <div style={{
              padding: '18px 20px', borderRadius: '14px',
              background: biggestChange.diff > 0
                ? `linear-gradient(135deg, ${tc.warningTint}, ${tc.dangerTintLight})`
                : `linear-gradient(135deg, ${tc.successTint}, ${tc.infoTintLight})`,
              border: `1px solid ${biggestChange.diff > 0 ? tc.warningTintStrong : tc.successTintStrong}`,
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ fontSize: '12px', color: tc.muted, fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px' }}>Biggest change</div>
                  <div style={{ fontSize: '16px', fontWeight: '600', marginBottom: '4px' }}>{biggestChange.category}</div>
                  <div className="font-mono" style={{ fontSize: '18px', fontWeight: '700', color: biggestChange.diff > 0 ? tc.warning : tc.success }}>
                    {biggestChange.diff > 0 ? '+' : '-'}{cs}{Math.abs(biggestChange.diff).toFixed(2)}
                  </div>
                </div>
                <div style={{
                  width: '40px', height: '40px', borderRadius: '12px',
                  background: biggestChange.diff > 0 ? tc.warningTintStrong : tc.successTintStrong,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: biggestChange.diff > 0 ? tc.warning : tc.success,
                }}>
                  <Icons.PieChart size={20} />
                </div>
              </div>
              <div style={{ fontSize: '13px', color: tc.secondary, marginTop: '8px' }}>
                {biggestChange.diff > 0
                  ? `Up from ${cs}${biggestChange.prev.toFixed(2)} last month`
                  : `Down from ${cs}${biggestChange.prev.toFixed(2)} last month`
                }
              </div>
            </div>
          ) : !lastSnapshot ? (
            <div style={{
              padding: '18px 20px', borderRadius: '14px',
              background: tc.cardEmpty,
              border: `1px dashed ${tc.cardEmptyBorder}`,
            }}>
              <div style={{ fontSize: '12px', color: tc.muted, fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px' }}>Biggest Change</div>
              <div style={{ fontSize: '13px', color: tc.muted }}>Category insights available after your first month</div>
            </div>
          ) : null}

          {/* 4. Debt & Savings row */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            {/* Total Debt */}
            <div onClick={() => debts.length > 0 && toggleCard('debt')} style={{
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
            <div onClick={() => savings.length > 0 && toggleCard('savings')} style={{
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

      {/* Expense Breakdown */}
      {categoryTotals.length > 0 && (
      <div className="glass-card animate-in" style={{ padding: isMobile ? '20px' : '32px', marginBottom: '20px', animationDelay: '0.5s' }}>
        <h2 className="font-display" style={{ fontSize: '20px', marginBottom: '20px' }}>Expense Breakdown</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {categoryTotals.map((cat, i) => {
            const pct = totals.actualExpenses > 0 ? (cat.total / totals.actualExpenses) * 100 : 0;
            return (
              <div key={cat.name}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: CHART_COLORS[i % CHART_COLORS.length], flexShrink: 0 }} />
                    <span style={{ fontSize: '13px', fontWeight: '500', color: tc.secondary }}>{cat.name}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span className="font-mono" style={{ fontSize: '14px', fontWeight: '600' }}>{cs}{cat.total.toFixed(2)}</span>
                    <span style={{ fontSize: '12px', color: tc.muted, minWidth: '40px', textAlign: 'right' }}>{pct.toFixed(1)}%</span>
                  </div>
                </div>
                <div style={{ height: '8px', borderRadius: '4px', background: tc.progressTrack, overflow: 'hidden' }}>
                  <div style={{
                    width: `${pct}%`, height: '100%', borderRadius: '4px',
                    background: CHART_COLORS[i % CHART_COLORS.length],
                    transition: 'width 0.5s ease',
                  }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>
      )}
    </>
  );
}

function StatCard({ label, value, subtitle, icon, color, valueColor, delay, isMobile }) {
  return (
    <div className="glass-card stat-card animate-in" style={{ padding: isMobile ? '16px' : '24px', animationDelay: delay }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
        <span style={{ color: tc.secondary, fontSize: '14px', fontWeight: '500', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</span>
        <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: `linear-gradient(135deg, color-mix(in srgb, ${color} 20%, transparent), color-mix(in srgb, ${color} 5%, transparent))`, display: 'flex', alignItems: 'center', justifyContent: 'center', color }}>{icon}</div>
      </div>
      <div className="font-mono" style={{ fontSize: isMobile ? '28px' : '36px', fontWeight: '700', marginBottom: '8px', wordBreak: 'break-word', color: valueColor }}>{value}</div>
      <div style={{ fontSize: '13px', color: tc.muted }}>{subtitle}</div>
    </div>
  );
}
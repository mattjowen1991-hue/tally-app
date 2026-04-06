import { useCurrency } from './CurrencyContext';
import React from 'react';
import * as Icons from './Icons';
import { tc } from '../utils/themeColors';
import { SAVINGS_CATEGORIES } from '../data/initialData';

const SAVINGS_CATEGORY_ICONS = {
  'Emergency': Icons.CategoryInsurance,
  'Holiday': Icons.CategoryFood,
  'Big Purchase': Icons.CategoryEntertainment,
  'Education': Icons.CategoryOther,
  'Home': Icons.CategoryHome,
  'Retirement': Icons.CategorySavings,
  'Investment': Icons.CategorySavings,
  'Other': Icons.CategoryOther,
};

function getSavingsIcon(category, size = 20, color = 'currentColor') {
  const IconComponent = SAVINGS_CATEGORY_ICONS[category] || Icons.CategorySavings;
  return <IconComponent size={size} style={{ color }} />;
}

export default function SavingsPanel({
  savings, totalSaved, editingSavingsId, editSavingsForm, setEditSavingsForm,
  handleSavingsEditStart, handleSavingsEditSave, handleDeleteSavings,
  handleSavingsDeposit, handleSavingsWithdraw, savingsTransactionAmounts,
  setSavingsTransactionAmounts, showSavingsHistory, setShowSavingsHistory,
  calculateSavingsEstimate, setEditingSavingsId, setShowSavingsModal,
  handleArchiveSavings, handleUnarchiveSavings,
}) {
  const cs = useCurrency();
  const [showArchived, setShowArchived] = React.useState(false);

  const activeSavings = savings.filter(s => !s.archived);
  const archivedSavings = savings.filter(s => s.archived);

  return (
    <>
      {/* Summary */}
      <div className="glass-card animate-in" style={{ padding: '20px', marginBottom: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h2 className="font-display" style={{ fontSize: '24px' }}>Savings Goals</h2>
          <button className="btn btn-primary" onClick={() => setShowSavingsModal(true)}><Icons.Plus size={18} /> Add</button>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
          <div style={{ padding: '14px', background: tc.successTintLight, borderRadius: '12px', border: `1px solid ${tc.successTintStrong}` }}>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>Total Saved</div>
            <div className="font-mono" style={{ fontSize: '22px', fontWeight: '700', color: tc.success }}>{cs}{totalSaved.toFixed(2)}</div>
          </div>
          <div style={{ padding: '14px', background: 'var(--glass)', borderRadius: '12px', border: '1px solid var(--border)' }}>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>Active Goals</div>
            <div className="font-mono" style={{ fontSize: '22px', fontWeight: '700' }}>{activeSavings.filter(s => !s.targetAmount || s.currentAmount < s.targetAmount).length}</div>
          </div>
        </div>
      </div>

      {/* List */}
      {activeSavings.length === 0 && archivedSavings.length === 0 ? (
        <div className="glass-card" style={{ padding: '40px', textAlign: 'center' }}>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>No savings goals yet. Tap "Add" to start saving.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {activeSavings.length === 0 && (
            <div className="glass-card" style={{ padding: '24px', textAlign: 'center' }}>
              <p style={{ color: tc.success, fontSize: '14px', fontWeight: '600' }}>🎉 All goals reached!</p>
            </div>
          )}

          {activeSavings.map((goal) => {
            const progress = goal.targetAmount > 0 ? Math.min((goal.currentAmount / goal.targetAmount) * 100, 100) : 0;
            const isComplete = goal.targetAmount > 0 && goal.currentAmount >= goal.targetAmount;
            const estimate = calculateSavingsEstimate(goal);
            const accentColor = isComplete ? 'var(--success)' : 'var(--accent-primary)';

            return (
              <div key={goal.id}>
                <div className="mobile-bill-card" style={{
                  borderLeft: `3px solid ${accentColor}`,
                  background: isComplete ? tc.successTintLight : undefined,
                }}>
                  {editingSavingsId === goal.id ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      <input className="input" value={editSavingsForm.name} onChange={(e) => setEditSavingsForm({ ...editSavingsForm, name: e.target.value })} placeholder="Goal name" />
                      <select className="input" value={editSavingsForm.category} onChange={(e) => setEditSavingsForm({ ...editSavingsForm, category: e.target.value })}>
                        {SAVINGS_CATEGORIES.map((c) => (<option key={c} value={c}>{c}</option>))}
                      </select>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                        <div>
                          <label style={{ display: 'block', color: 'var(--text-secondary)', fontSize: '12px', marginBottom: '4px' }}>Current</label>
                          <input type="number" className="input" value={editSavingsForm.currentAmount} onChange={(e) => setEditSavingsForm({ ...editSavingsForm, currentAmount: e.target.value })} />
                        </div>
                        <div>
                          <label style={{ display: 'block', color: 'var(--text-secondary)', fontSize: '12px', marginBottom: '4px' }}>Target</label>
                          <input type="number" className="input" value={editSavingsForm.targetAmount} onChange={(e) => setEditSavingsForm({ ...editSavingsForm, targetAmount: e.target.value })} />
                        </div>
                      </div>
                      <div>
                        <label style={{ display: 'block', color: 'var(--text-secondary)', fontSize: '12px', marginBottom: '4px' }}>Auto Monthly</label>
                        <input type="number" className="input" value={editSavingsForm.monthlyContribution} onChange={(e) => setEditSavingsForm({ ...editSavingsForm, monthlyContribution: e.target.value })} />
                      </div>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button className="btn btn-primary" onClick={handleSavingsEditSave} style={{ flex: 1 }}><Icons.Check size={18} /> Save</button>
                        <button className="btn btn-secondary" onClick={() => setEditingSavingsId(null)} style={{ flex: 1 }}><Icons.X size={18} /> Cancel</button>
                      </div>
                      <button onClick={() => { setEditingSavingsId(null); handleDeleteSavings(goal.id); }} style={{ width: '100%', marginTop: '8px', padding: '9px', background: tc.dangerTintLight, border: `1px solid ${tc.dangerTintStrong}`, borderRadius: '10px', cursor: 'pointer', fontSize: '13px', fontWeight: '600', color: tc.danger }}>
                        Delete goal
                      </button>
                    </div>
                  ) : (
                    <div>
                      {/* ── Row 1: Icon + Name + Amount ── */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                        <div style={{
                          width: '36px', height: '36px', borderRadius: '10px', flexShrink: 0,
                          background: isComplete ? tc.successTint : 'var(--glass)',
                          border: `1px solid ${isComplete ? tc.successTintStrong : 'var(--border)'}`,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                          {getSavingsIcon(goal.category, 20, isComplete ? 'var(--success)' : 'var(--accent-primary)')}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span style={{ fontWeight: '600', fontSize: '15px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{goal.name}</span>
                            <button onClick={() => handleSavingsEditStart(goal)} style={{ width: '22px', height: '22px', borderRadius: '5px', border: '1px solid var(--accent-primary)', background: 'var(--info-tint)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-primary)', flexShrink: 0 }}>
                              <Icons.Edit size={12} />
                            </button>
                          </div>
                          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '1px' }}>{goal.category || 'Savings'}</div>
                        </div>
                        <div style={{ textAlign: 'right', flexShrink: 0 }}>
                          <div className="font-mono" style={{ fontSize: '17px', fontWeight: '700', color: isComplete ? 'var(--success)' : 'var(--accent-primary)' }}>
                            {cs}{(goal.currentAmount || 0).toFixed(2)}
                          </div>
                          {goal.targetAmount > 0 && (
                            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '1px' }}>of {cs}{goal.targetAmount.toFixed(2)}</div>
                          )}
                        </div>
                      </div>

                      {/* ── Row 2: Meta badges ── */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px', marginLeft: '46px', flexWrap: 'wrap' }}>
                        {goal.monthlyContribution > 0 && (
                          <span style={{ fontSize: '11px', color: tc.info, background: tc.infoTint, padding: '2px 7px', borderRadius: '5px', border: '1px solid var(--info-tint-strong)', fontWeight: '600' }}>
                            ↻ {cs}{goal.monthlyContribution.toFixed(2)}/mo
                          </span>
                        )}
                        {estimate && estimate.months > 0 && (
                          <span style={{ fontSize: '11px', color: 'var(--text-muted)', background: 'var(--glass)', padding: '2px 7px', borderRadius: '5px', border: '1px solid var(--border)' }}>
                            ~{estimate.months}mo to go
                          </span>
                        )}
                        {isComplete && (
                          <span style={{ fontSize: '11px', color: 'var(--success)', background: tc.successTint, padding: '2px 7px', borderRadius: '5px', border: `1px solid ${tc.successTintStrong}`, fontWeight: '600', marginLeft: 'auto' }}>
                            ✓ Goal reached!
                          </span>
                        )}
                      </div>

                      {/* ── Progress bar ── */}
                      {goal.targetAmount > 0 && (
                        <div style={{ marginBottom: '10px', marginLeft: '46px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>
                            <span>{progress.toFixed(1)}%</span>
                            <span>{cs}{Math.max(0, goal.targetAmount - (goal.currentAmount || 0)).toFixed(2)} to go</span>
                          </div>
                          <div style={{ height: '5px', background: 'var(--glass)', borderRadius: '3px', overflow: 'hidden', border: '1px solid var(--border)' }}>
                            <div style={{ width: `${progress}%`, height: '100%', background: isComplete ? 'var(--success)' : 'linear-gradient(90deg, var(--accent-primary), var(--success))', borderRadius: '3px', transition: 'width 0.5s' }} />
                          </div>
                        </div>
                      )}

                      {/* ── Action buttons ── */}
                      {!isComplete ? (
                        <div style={{ display: 'flex', gap: '6px', marginLeft: '46px' }}>
                          <input type="number" className="input" placeholder="Amount..." value={savingsTransactionAmounts[goal.id] || ''} onChange={(e) => setSavingsTransactionAmounts({ ...savingsTransactionAmounts, [goal.id]: e.target.value })} style={{ flex: 1 }} />
                          <button className="btn btn-primary" onClick={() => handleSavingsDeposit(goal.id)} style={{ whiteSpace: 'nowrap', padding: '0 14px' }}>+ Add</button>
                          <button className="btn btn-secondary" onClick={() => handleSavingsWithdraw(goal.id)} style={{ whiteSpace: 'nowrap', padding: '0 12px', color: tc.danger }}>- Take</button>
                        </div>
                      ) : (
                        <div style={{ display: 'flex', gap: '8px', marginLeft: '46px' }}>
                          <button onClick={() => handleArchiveSavings(goal.id)} style={{ flex: 1, padding: '8px', border: '1px solid var(--border)', borderRadius: '8px', background: 'var(--glass)', cursor: 'pointer', fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)' }}>Archive Goal</button>
                        </div>
                      )}

                      {/* ── Transaction history ── */}
                      {goal.transactions && goal.transactions.length > 0 && (
                        <div style={{ marginTop: '10px', marginLeft: '46px' }}>
                          <button onClick={() => setShowSavingsHistory({ ...showSavingsHistory, [goal.id]: !showSavingsHistory[goal.id] })} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', fontSize: '12px', fontWeight: '500', padding: '2px 0', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <span style={{ display: 'inline-flex', transform: showSavingsHistory[goal.id] ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}><Icons.ChevronDown size={13} /></span>
                            History ({goal.transactions.length})
                          </button>
                          {showSavingsHistory[goal.id] && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', marginTop: '8px', maxHeight: '180px', overflowY: 'auto' }}>
                              {[...goal.transactions].reverse().map((tx, i) => (
                                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '7px 10px', background: 'var(--glass)', borderRadius: '8px', border: '1px solid var(--border)' }}>
                                  <div>
                                    <div style={{ fontSize: '12px', fontWeight: '500', color: tx.amount > 0 ? tc.success : tc.danger }}>{tx.type === 'auto' ? '↻ Auto-save' : tx.amount > 0 ? '↑ Deposit' : '↓ Withdrawal'}</div>
                                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{new Date(tx.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</div>
                                  </div>
                                  <div className="font-mono" style={{ fontSize: '13px', fontWeight: '600', color: tx.amount > 0 ? tc.success : tc.danger }}>{tx.amount > 0 ? '+' : ''}{cs}{Math.abs(tx.amount).toFixed(2)}</div>
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
          {archivedSavings.length > 0 && (
            <div style={{ marginTop: '8px' }}>
              <button onClick={() => setShowArchived(!showArchived)} style={{ width: '100%', padding: '14px 20px', border: '1px solid var(--border)', borderRadius: '16px', background: 'var(--glass)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: 'var(--text-secondary)', fontSize: '14px', fontWeight: '600' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span>✓ Completed</span>
                  <span style={{ background: tc.successTint, color: tc.success, padding: '2px 8px', borderRadius: '10px', fontSize: '12px', fontWeight: '700' }}>{archivedSavings.length}</span>
                </div>
                <span style={{ transition: 'transform 0.2s', transform: showArchived ? 'rotate(180deg)' : 'rotate(0deg)' }}>▾</span>
              </button>
              {showArchived && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '8px' }}>
                  {archivedSavings.map((goal) => (
                    <div key={goal.id} className="mobile-bill-card" style={{ opacity: 0.75, borderLeft: '3px solid var(--success)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{ width: '36px', height: '36px', borderRadius: '10px', flexShrink: 0, background: tc.successTint, border: `1px solid ${tc.successTintStrong}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          {getSavingsIcon(goal.category, 20, 'var(--success)')}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontWeight: '600', fontSize: '14px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{goal.name}</div>
                          <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{goal.category || 'Savings'} · Reached {goal.archivedAt ? new Date(goal.archivedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : ''}</div>
                        </div>
                        <div className="font-mono" style={{ fontSize: '13px', color: tc.success, fontWeight: '600', flexShrink: 0 }}>{cs}{(goal.currentAmount || 0).toFixed(2)}</div>
                      </div>
                      <div style={{ display: 'flex', gap: '8px', marginTop: '10px', marginLeft: '46px' }}>
                        <button onClick={() => handleUnarchiveSavings(goal.id)} style={{ flex: 1, padding: '7px', border: '1px solid var(--border)', borderRadius: '8px', background: 'var(--glass)', cursor: 'pointer', fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)' }}>↩ Restore</button>
                        <button onClick={() => handleDeleteSavings(goal.id)} style={{ padding: '7px 12px', border: 'none', borderRadius: '8px', background: tc.dangerTintLight, cursor: 'pointer', fontSize: '12px', fontWeight: '600', color: tc.danger }}>✕</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </>
  );
}

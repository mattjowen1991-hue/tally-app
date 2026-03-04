import { useCurrency } from './CurrencyContext';
import React from 'react';
import * as Icons from './Icons';
import { tc } from '../utils/themeColors';
import { SAVINGS_CATEGORIES } from '../data/initialData';

export default function SavingsPanel({
  savings, totalSaved,
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
      {/* Savings Summary */}
      <div className="glass-card animate-in" style={{ padding: '24px', marginBottom: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h2 className="font-display" style={{ fontSize: '24px' }}>Savings Goals</h2>
          <button className="btn btn-primary" onClick={() => setShowSavingsModal(true)}><Icons.Plus size={18} /> Add</button>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <div style={{ padding: '16px', background: 'var(--glass)', borderRadius: '12px', border: '1px solid var(--border)' }}>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>Total Saved</div>
            <div className="font-mono" style={{ fontSize: '22px', fontWeight: '700', color: tc.success }}>{cs}{totalSaved.toFixed(2)}</div>
          </div>
          <div style={{ padding: '16px', background: 'var(--glass)', borderRadius: '12px', border: '1px solid var(--border)' }}>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>Active Goals</div>
            <div className="font-mono" style={{ fontSize: '22px', fontWeight: '700' }}>{activeSavings.filter((s) => !s.targetAmount || s.currentAmount < s.targetAmount).length}</div>
          </div>
        </div>
      </div>

      {/* Savings List */}
      {activeSavings.length === 0 && archivedSavings.length === 0 ? (
        <div className="glass-card" style={{ padding: '40px', textAlign: 'center' }}>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>No savings goals yet. Tap "Add" to start saving.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {activeSavings.length === 0 && (
            <div className="glass-card" style={{ padding: '24px', textAlign: 'center' }}>
              <p style={{ color: tc.success, fontSize: '14px', fontWeight: '600' }}>🎉 All goals reached!</p>
            </div>
          )}
          {activeSavings.map((goal) => {
            const progress = goal.targetAmount > 0 ? (goal.currentAmount / goal.targetAmount * 100) : 0;
            const isComplete = goal.targetAmount > 0 && goal.currentAmount >= goal.targetAmount;
            const estimate = calculateSavingsEstimate(goal);
            return (
              <div key={goal.id}>
              <div className="glass-card animate-in" style={{ padding: '20px', borderLeft: isComplete ? '3px solid var(--success)' : '3px solid var(--accent-primary)' }}>
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
                  </div>
                ) : (
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <div style={{ fontWeight: '600', fontSize: '16px', marginBottom: '2px' }}>{goal.name}</div>
                          <button onClick={() => handleSavingsEditStart(goal)} style={{ width: '24px', height: '24px', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--glass)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', transition: 'opacity 0.2s' }}><Icons.Edit size={14} /></button>
                        </div>
                        <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{goal.category}</div>
                      </div>
                    </div>
                    <div className="font-mono" style={{ fontSize: '24px', fontWeight: '700', color: tc.success, marginBottom: '4px' }}>{cs}{(goal.currentAmount || 0).toFixed(2)}</div>
                    {goal.targetAmount > 0 && (
                      <div style={{ marginBottom: '12px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>
                          <span>of {cs}{goal.targetAmount.toFixed(2)}</span><span>{Math.min(progress, 100).toFixed(1)}%</span>
                        </div>
                        <div style={{ height: '6px', background: 'var(--glass)', borderRadius: '3px', overflow: 'hidden' }}>
                          <div style={{ width: `${Math.min(progress, 100)}%`, height: '100%', background: 'linear-gradient(90deg, var(--success), var(--accent-primary))', borderRadius: '3px', transition: 'width 0.5s' }} />
                        </div>
                      </div>
                    )}
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '12px' }}>
                      {goal.monthlyContribution > 0 && <div style={{ fontSize: '12px', color: tc.info, padding: '4px 10px', background: tc.infoTint, borderRadius: '8px', border: '1px solid rgba(0,212,255,0.3)' }}>Auto: {cs}{goal.monthlyContribution.toFixed(2)}/mo</div>}
                      {estimate && estimate.months > 0 && <div style={{ fontSize: '12px', color: 'var(--text-secondary)', padding: '4px 10px', background: 'var(--glass)', borderRadius: '8px', border: '1px solid var(--border)' }}>~{estimate.months} month{estimate.months !== 1 ? 's' : ''} to go</div>}
                      {goal.transactions && goal.transactions.length > 0 && <div style={{ fontSize: '12px', color: 'var(--text-muted)', padding: '4px 10px', background: 'var(--glass)', borderRadius: '8px', border: '1px solid var(--border)' }}>{goal.transactions.length} transaction{goal.transactions.length !== 1 ? 's' : ''}</div>}
                    </div>
                    {!isComplete ? (
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <input type="number" className="input" placeholder="Amount..." value={savingsTransactionAmounts[goal.id] || ''} onChange={(e) => setSavingsTransactionAmounts({ ...savingsTransactionAmounts, [goal.id]: e.target.value })} style={{ flex: 1 }} />
                        <button className="btn btn-primary" onClick={() => handleSavingsDeposit(goal.id)} style={{ whiteSpace: 'nowrap' }}>Deposit</button>
                        <button className="btn btn-secondary" onClick={() => handleSavingsWithdraw(goal.id)} style={{ whiteSpace: 'nowrap', color: tc.danger }}>Withdraw</button>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <div style={{ flex: 1, padding: '8px 12px', background: tc.successTint, borderRadius: '8px', border: '1px solid rgba(16,185,129,0.3)', color: tc.success, fontSize: '13px', fontWeight: '600', textAlign: 'center' }}>✓ Goal reached!</div>
                        {goal.archivedAt && (
                          <button onClick={() => handleArchiveSavings(goal.id)} style={{
                            padding: '8px 12px', border: '1px solid var(--border)', borderRadius: '8px',
                            background: 'var(--glass)', cursor: 'pointer', fontSize: '12px', fontWeight: '600',
                            color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px',
                          }}>📦 Archive</button>
                        )}
                      </div>
                    )}
                    {goal.transactions && goal.transactions.length > 0 && (
                      <div style={{ marginTop: '12px' }}>
                        <button onClick={() => setShowSavingsHistory({ ...showSavingsHistory, [goal.id]: !showSavingsHistory[goal.id] })} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', fontSize: '13px', fontWeight: '500', padding: '4px 0', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{ display: 'inline-flex', transform: showSavingsHistory[goal.id] ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}><Icons.ChevronDown size={14} /></span>
                          Transaction History ({goal.transactions.length})
                        </button>
                        {showSavingsHistory[goal.id] && (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '8px', maxHeight: '200px', overflowY: 'auto' }}>
                            {[...goal.transactions].reverse().map((tx, i) => (
                              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', background: 'var(--glass)', borderRadius: '8px', border: '1px solid var(--border)' }}>
                                <div>
                                  <div style={{ fontSize: '13px', fontWeight: '500', color: tx.amount > 0 ? tc.success : tc.danger }}>{tx.type === 'auto' ? '↻ Auto-save' : tx.amount > 0 ? '↑ Deposit' : '↓ Withdrawal'}</div>
                                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{new Date(tx.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</div>
                                </div>
                                <div className="font-mono" style={{ fontSize: '14px', fontWeight: '600', color: tx.amount > 0 ? tc.success : tc.danger }}>{tx.amount > 0 ? '+' : ''}{cs}{Math.abs(tx.amount).toFixed(2)}</div>
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

          {/* Completed Section */}
          {archivedSavings.length > 0 && (
            <div style={{ marginTop: '8px' }}>
              <button onClick={() => setShowArchived(!showArchived)} style={{
                width: '100%', padding: '14px 20px', border: '1px solid var(--border)', borderRadius: '16px',
                background: 'var(--glass)', cursor: 'pointer', display: 'flex', alignItems: 'center',
                justifyContent: 'space-between', color: 'var(--text-secondary)', fontSize: '14px', fontWeight: '600',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span>✓ Completed</span>
                  <span style={{ background: tc.successTint, color: tc.success, padding: '2px 8px', borderRadius: '10px', fontSize: '12px', fontWeight: '700' }}>{archivedSavings.length}</span>
                </div>
                <span style={{ transition: 'transform 0.2s', transform: showArchived ? 'rotate(180deg)' : 'rotate(0deg)' }}>▾</span>
              </button>
              {showArchived && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '10px' }}>
                  {archivedSavings.map((goal) => (
                    <div key={goal.id} className="glass-card" style={{ padding: '16px', opacity: 0.7, borderLeft: '3px solid var(--success)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontWeight: '600', fontSize: '15px', marginBottom: '2px' }}>{goal.name}</div>
                          <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                            {goal.category || 'Savings'} • Reached {goal.archivedAt ? new Date(goal.archivedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : ''}
                          </div>
                        </div>
                        <div className="font-mono" style={{ fontSize: '13px', color: tc.success, fontWeight: '600', flexShrink: 0 }}>{cs}{(goal.currentAmount || 0).toFixed(2)}</div>
                      </div>
                      {goal.transactions && goal.transactions.length > 0 && (
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '6px' }}>
                          {goal.transactions.length} transaction{goal.transactions.length !== 1 ? 's' : ''} • Target: {cs}{(goal.targetAmount || 0).toFixed(2)}
                        </div>
                      )}
                      <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
                        <button onClick={() => handleUnarchiveSavings(goal.id)} style={{
                          flex: 1, padding: '8px', border: '1px solid var(--border)', borderRadius: '10px',
                          background: 'var(--glass)', cursor: 'pointer', fontSize: '12px', fontWeight: '600',
                          color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px',
                        }}>↩ Restore</button>
                        <button onClick={() => handleDeleteSavings(goal.id)} style={{
                          padding: '8px 14px', border: 'none', borderRadius: '10px',
                          background: tc.dangerTintLight, cursor: 'pointer', fontSize: '12px', fontWeight: '600',
                          color: tc.danger, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px',
                        }}>✕</button>
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

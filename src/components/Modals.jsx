import React from 'react';
import * as Icons from './Icons';
import { tc } from '../utils/themeColors';
import { DEFAULT_CATEGORIES, DEBT_TYPES, SAVINGS_CATEGORIES } from '../data/initialData';

const dismissKeyboard = (e) => { if (e.key === 'Enter') e.target.blur(); };

// ══════════════════════════════════════
// Add Bill Modal
// ══════════════════════════════════════
export function AddBillModal({ show, onClose, newBill, setNewBill, handleAddBill, categories, validationErrors, setValidationErrors, emptyBill }) {
  if (!show) return null;
  return (
    <div className="modal-overlay" onClick={() => { onClose(); setValidationErrors({}); setNewBill({ ...emptyBill }); }}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div style={{ padding: '24px' }}>
          <h2 className="font-display" style={{ fontSize: '24px', marginBottom: '24px' }}>Add New Bill</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div>
              <label style={{ display: 'block', color: 'var(--text-secondary)', fontSize: '13px', marginBottom: '8px', fontWeight: '500' }}>Bill Name</label>
              <input className={`input ${validationErrors['bill-name'] ? 'input-error' : ''}`} placeholder="e.g., Electric Bill" value={newBill.name}
                onChange={(e) => { setNewBill({ ...newBill, name: e.target.value }); setValidationErrors((v) => { const n = { ...v }; delete n['bill-name']; return n; }); }}
                onKeyDown={dismissKeyboard} />
            </div>
            <div>
              <label style={{ display: 'block', color: 'var(--text-secondary)', fontSize: '13px', marginBottom: '8px', fontWeight: '500' }}>Category</label>
              <select className="input" value={newBill.category} onChange={(e) => setNewBill({ ...newBill, category: e.target.value })}>
                {categories.map((cat) => (<option key={cat} value={cat}>{cat}</option>))}
              </select>
            </div>
            <div>
              <label style={{ display: 'block', color: 'var(--text-secondary)', fontSize: '13px', marginBottom: '8px', fontWeight: '500' }}>Amount</label>
              <input type="number" className={`input ${validationErrors['bill-amount'] ? 'input-error' : ''}`} placeholder="0.00" value={newBill.amount}
                onChange={(e) => { setNewBill({ ...newBill, amount: e.target.value }); setValidationErrors((v) => { const n = { ...v }; delete n['bill-amount']; return n; }); }}
                onKeyDown={dismissKeyboard} />
            </div>
            <div>
              <label style={{ display: 'block', color: 'var(--text-secondary)', fontSize: '13px', marginBottom: '8px', fontWeight: '500' }}>Bill Type</label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button type="button" onClick={() => setNewBill({ ...newBill, recurring: true, frequency: 'Monthly' })} style={{ flex: 1, padding: '10px', borderRadius: '10px', border: newBill.recurring ? '2px solid var(--accent-primary)' : '1px solid var(--border)', background: newBill.recurring ? tc.infoTint : 'var(--glass)', color: newBill.recurring ? tc.info : 'var(--text-muted)', cursor: 'pointer', fontSize: '14px', fontWeight: '500' }}>↻ Recurring</button>
                <button type="button" onClick={() => setNewBill({ ...newBill, recurring: false, frequency: 'One-off' })} style={{ flex: 1, padding: '10px', borderRadius: '10px', border: !newBill.recurring ? '2px solid var(--warning)' : '1px solid var(--border)', background: !newBill.recurring ? tc.warningTint : 'var(--glass)', color: !newBill.recurring ? tc.warning : 'var(--text-muted)', cursor: 'pointer', fontSize: '14px', fontWeight: '500' }}>One-off</button>
              </div>
            </div>
            {newBill.recurring && (
              <div>
                <label style={{ display: 'block', color: 'var(--text-secondary)', fontSize: '13px', marginBottom: '8px', fontWeight: '500' }}>Frequency</label>
                <select className="input" value={newBill.frequency || 'Monthly'} onChange={(e) => setNewBill({ ...newBill, frequency: e.target.value, paymentDate: '', paymentDay: '', startMonth: '', startDate: '' })}>
                  <option value="Weekly">Weekly</option><option value="Fortnightly">Fortnightly</option><option value="Monthly">Monthly</option><option value="Quarterly">Quarterly</option><option value="Yearly">Yearly</option>
                </select>
              </div>
            )}
            {/* Payment date fields based on frequency */}
            {!newBill.recurring ? (
              <div>
                <label style={{ display: 'block', color: 'var(--text-secondary)', fontSize: '13px', marginBottom: '8px', fontWeight: '500' }}>Due date</label>
                <input type="date" onKeyDown={(e) => e.preventDefault()} className="input" value={newBill.paymentDate} onChange={(e) => setNewBill({ ...newBill, paymentDate: e.target.value })} />
              </div>
            ) : (newBill.frequency === 'Weekly' || newBill.frequency === 'Fortnightly') ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', color: 'var(--text-secondary)', fontSize: '13px', marginBottom: '8px', fontWeight: '500' }}>Day of week</label>
                  <select className="input" value={newBill.paymentDay || ''} onChange={(e) => setNewBill({ ...newBill, paymentDay: e.target.value })}>
                    <option value="">Select day...</option><option value="1">Monday</option><option value="2">Tuesday</option><option value="3">Wednesday</option><option value="4">Thursday</option><option value="5">Friday</option><option value="6">Saturday</option><option value="0">Sunday</option>
                  </select>
                </div>
                {newBill.frequency === 'Fortnightly' && (
                  <div>
                    <label style={{ display: 'block', color: 'var(--text-secondary)', fontSize: '13px', marginBottom: '8px', fontWeight: '500' }}>Starting from</label>
                    <input type="date" onKeyDown={(e) => e.preventDefault()} className="input" value={newBill.startDate || ''} onChange={(e) => setNewBill({ ...newBill, startDate: e.target.value })} />
                  </div>
                )}
              </div>
            ) : newBill.frequency === 'Monthly' ? (
              <div>
                <label style={{ display: 'block', color: 'var(--text-secondary)', fontSize: '13px', marginBottom: '8px', fontWeight: '500' }}>Day of month</label>
                <input type="number" className="input" placeholder="1-31" min="1" max="31" value={newBill.paymentDate} onChange={(e) => { const v = e.target.value; if (v === '') { setNewBill({ ...newBill, paymentDate: '' }); return; } const n = parseInt(v); if (!isNaN(n)) setNewBill({ ...newBill, paymentDate: String(Math.min(31, Math.max(1, n))) }); }} onKeyDown={dismissKeyboard} />
              </div>
            ) : newBill.frequency === 'Quarterly' ? (
              <div style={{ display: 'flex', gap: '12px' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', color: 'var(--text-secondary)', fontSize: '13px', marginBottom: '8px', fontWeight: '500' }}>Day of month</label>
                  <input type="number" className="input" placeholder="1-31" min="1" max="31" value={newBill.paymentDate} onChange={(e) => { const v = e.target.value; if (v === '') { setNewBill({ ...newBill, paymentDate: '' }); return; } const n = parseInt(v); if (!isNaN(n)) setNewBill({ ...newBill, paymentDate: String(Math.min(31, Math.max(1, n))) }); }} onKeyDown={dismissKeyboard} />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', color: 'var(--text-secondary)', fontSize: '13px', marginBottom: '8px', fontWeight: '500' }}>Starting month</label>
                  <select className="input" value={newBill.startMonth || ''} onChange={(e) => setNewBill({ ...newBill, startMonth: e.target.value })}>
                    <option value="">Select...</option><option value="1">January</option><option value="2">February</option><option value="3">March</option><option value="4">April</option><option value="5">May</option><option value="6">June</option><option value="7">July</option><option value="8">August</option><option value="9">September</option><option value="10">October</option><option value="11">November</option><option value="12">December</option>
                  </select>
                </div>
              </div>
            ) : newBill.frequency === 'Yearly' ? (
              <div>
                <label style={{ display: 'block', color: 'var(--text-secondary)', fontSize: '13px', marginBottom: '8px', fontWeight: '500' }}>Annual date</label>
                <input type="date" onKeyDown={(e) => e.preventDefault()} className="input" value={newBill.paymentDate} onChange={(e) => setNewBill({ ...newBill, paymentDate: e.target.value })} />
              </div>
            ) : null}
            <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
              <button className="btn btn-primary" onClick={handleAddBill} style={{ flex: 1, justifyContent: 'center' }}><Icons.Plus size={20} /> Add Bill</button>
              <button className="btn btn-secondary" onClick={() => { onClose(); setValidationErrors({}); setNewBill({ ...emptyBill }); }} style={{ flex: 1, justifyContent: 'center' }}>Cancel</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════
// Manage Categories Modal
// ══════════════════════════════════════
export function ManageCategoriesModal({ show, onClose, bills, customCategories, newCategoryName, setNewCategoryName, handleAddCategory, handleDeleteCategory }) {
  if (!show) return null;
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div style={{ padding: '24px' }}>
          <h2 className="font-display" style={{ fontSize: '24px', marginBottom: '24px' }}>Manage Categories</h2>
          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', color: 'var(--text-secondary)', fontSize: '13px', marginBottom: '8px', fontWeight: '500' }}>Add New Category</label>
            <div style={{ display: 'flex', gap: '8px' }}>
              <input className="input" placeholder="e.g., GROCERIES" value={newCategoryName} onChange={(e) => setNewCategoryName(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { handleAddCategory(); e.target.blur(); } }} style={{ flex: 1 }} />
              <button className="btn btn-primary" onMouseDown={(e) => { e.preventDefault(); if (!newCategoryName.trim()) return; handleAddCategory(); document.activeElement.blur(); }}><Icons.Plus size={18} /></button>
            </div>
          </div>
          <div style={{ marginBottom: '16px' }}>
            <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '12px', fontWeight: '500' }}>DEFAULT CATEGORIES</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {DEFAULT_CATEGORIES.map((cat) => {
                const count = bills.filter((b) => b.category === cat).length;
                return (
                  <div key={cat} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', background: 'var(--glass)', borderRadius: '12px', border: '1px solid var(--border)' }}>
                    <div><span style={{ fontWeight: '500', fontSize: '14px' }}>{cat}</span><span style={{ fontSize: '12px', color: 'var(--text-muted)', marginLeft: '8px' }}>{count} bills</span></div>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)', padding: '3px 8px', background: 'var(--glass)', borderRadius: '6px' }}>Default</span>
                  </div>
                );
              })}
            </div>
          </div>
          {customCategories.length > 0 && (
            <div style={{ marginBottom: '16px' }}>
              <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '12px', fontWeight: '500' }}>CUSTOM CATEGORIES</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {customCategories.map((cat) => {
                  const count = bills.filter((b) => b.category === cat).length;
                  return (
                    <div key={cat} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', background: 'var(--glass)', borderRadius: '12px', border: '1px solid var(--border)' }}>
                      <div><span style={{ fontWeight: '500', fontSize: '14px' }}>{cat}</span><span style={{ fontSize: '12px', color: 'var(--text-muted)', marginLeft: '8px' }}>{count} bills</span></div>
                      <button onClick={() => handleDeleteCategory(cat)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: count > 0 ? 'var(--text-muted)' : tc.danger, padding: '4px', opacity: count > 0 ? 0.5 : 1 }}><Icons.Trash size={16} /></button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
          <button className="btn btn-secondary" onClick={onClose} style={{ width: '100%', justifyContent: 'center', marginTop: '8px' }}>Done</button>
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════
// Add Debt Modal
// ══════════════════════════════════════
export function AddDebtModal({ show, onClose, newDebt, setNewDebt, handleAddDebt, emptyDebt, validationErrors, setValidationErrors }) {
  if (!show) return null;
  const mode = newDebt.paymentMode || 'recurring';
  const total = parseFloat(newDebt.totalAmount) || 0;
  const installMonths = parseInt(newDebt.installmentMonths) || 0;
  const bnplMonths = parseInt(newDebt.bnplPromoMonths) || 0;
  const installmentMonthly = installMonths > 0 && total > 0 ? Math.ceil((total / installMonths) * 100) / 100 : 0;
  const bnplMonthly = bnplMonths > 0 && total > 0 ? Math.ceil((total / bnplMonths) * 100) / 100 : 0;

  return (
    <div className="modal-overlay" onClick={() => { onClose(); setValidationErrors({}); setNewDebt({ ...emptyDebt }); }}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div style={{ padding: '24px' }}>
          <h2 className="font-display" style={{ fontSize: '24px', marginBottom: '24px' }}>Add Debt</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div>
              <label style={{ display: 'block', color: 'var(--text-secondary)', fontSize: '13px', marginBottom: '8px', fontWeight: '500' }}>Name</label>
              <input className={`input ${validationErrors?.['debt-name'] ? 'input-error' : ''}`} placeholder="e.g., Barclaycard" value={newDebt.name} onChange={(e) => { setNewDebt({ ...newDebt, name: e.target.value }); if (validationErrors?.['debt-name']) { const v = { ...validationErrors }; delete v['debt-name']; setValidationErrors(v); } }} onKeyDown={dismissKeyboard} />
            </div>
            <div>
              <label style={{ display: 'block', color: 'var(--text-secondary)', fontSize: '13px', marginBottom: '8px', fontWeight: '500' }}>Type</label>
              <select className="input" value={newDebt.type} onChange={(e) => setNewDebt({ ...newDebt, type: e.target.value })}>
                {DEBT_TYPES.map((t) => (<option key={t} value={t}>{t}</option>))}
              </select>
            </div>
            <div>
              <label style={{ display: 'block', color: 'var(--text-secondary)', fontSize: '13px', marginBottom: '8px', fontWeight: '500' }}>Total Amount Owed</label>
              <input type="number" className={`input ${validationErrors?.['debt-amount'] ? 'input-error' : ''}`} placeholder="0.00" value={newDebt.totalAmount} onChange={(e) => { setNewDebt({ ...newDebt, totalAmount: e.target.value }); if (validationErrors?.['debt-amount']) { const v = { ...validationErrors }; delete v['debt-amount']; setValidationErrors(v); } }} onKeyDown={dismissKeyboard} />
            </div>

            {/* Payment Mode Selector */}
            <div>
              <label style={{ display: 'block', color: 'var(--text-secondary)', fontSize: '13px', marginBottom: '8px', fontWeight: '500' }}>Payment Structure</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                {[
                  { key: 'recurring', label: '↻ Recurring', color: tc.info },
                  { key: 'one-off', label: '◎ One-off', color: tc.warning },
                  { key: 'installment', label: '▤ Installment', color: tc.purple },
                  { key: 'bnpl', label: '⏱ Pay Later', color: tc.success },
                ].map((opt) => (
                  <button key={opt.key} type="button" onClick={() => { setNewDebt({ ...newDebt, paymentMode: opt.key }); setValidationErrors({}); }}
                    style={{ padding: '10px 8px', borderRadius: '10px', border: mode === opt.key ? `2px solid ${opt.color}` : '1px solid var(--border)', background: mode === opt.key ? `${opt.color}15` : 'var(--glass)', color: mode === opt.key ? opt.color : 'var(--text-muted)', cursor: 'pointer', fontSize: '13px', fontWeight: '500', textAlign: 'center' }}>
                    {opt.label}
                  </button>
                ))}
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '6px' }}>
                {mode === 'recurring' && 'Monthly payments until paid off (credit cards, loans)'}
                {mode === 'one-off' && 'Full amount due on a specific date'}
                {mode === 'installment' && 'Fixed number of monthly payments (finance, phone contract)'}
                {mode === 'bnpl' && 'Interest-free period, then monthly payments if not cleared'}
              </div>
            </div>

            {/* RECURRING fields */}
            {mode === 'recurring' && (
              <>
                <div>
                  <label style={{ display: 'block', color: 'var(--text-secondary)', fontSize: '13px', marginBottom: '8px', fontWeight: '500' }}>Interest Rate (% APR)</label>
                  <input type="number" className="input" placeholder="0" value={newDebt.interestRate} onChange={(e) => setNewDebt({ ...newDebt, interestRate: e.target.value })} onKeyDown={dismissKeyboard} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ display: 'block', color: 'var(--text-secondary)', fontSize: '13px', marginBottom: '8px', fontWeight: '500' }}>Minimum Payment</label>
                    <input type="number" className="input" placeholder="0.00" value={newDebt.minimumPayment} onChange={(e) => setNewDebt({ ...newDebt, minimumPayment: e.target.value })} onKeyDown={dismissKeyboard} />
                  </div>
                  <div>
                    <label style={{ display: 'block', color: 'var(--text-secondary)', fontSize: '13px', marginBottom: '8px', fontWeight: '500' }}>Auto Monthly</label>
                    <input type="number" className="input" placeholder="0.00" value={newDebt.recurringPayment} onChange={(e) => setNewDebt({ ...newDebt, recurringPayment: e.target.value })} onKeyDown={dismissKeyboard} />
                  </div>
                </div>
                <div>
                  <label style={{ display: 'block', color: 'var(--text-secondary)', fontSize: '13px', marginBottom: '8px', fontWeight: '500' }}>Payment Day</label>
                  <input type="number" className="input" placeholder="Day of month (1-31)" min="1" max="31" value={newDebt.paymentDate || ''} onKeyDown={dismissKeyboard} onChange={(e) => { const v = e.target.value; if (v === '') { setNewDebt({ ...newDebt, paymentDate: '' }); return; } const n = parseInt(v); if (!isNaN(n)) setNewDebt({ ...newDebt, paymentDate: String(Math.min(31, Math.max(1, n))) }); }} />
                </div>
              </>
            )}

            {/* ONE-OFF fields */}
            {mode === 'one-off' && (
              <>
                <div>
                  <label style={{ display: 'block', color: 'var(--text-secondary)', fontSize: '13px', marginBottom: '8px', fontWeight: '500' }}>Due Date</label>
                  <input type="date" className={`input ${newDebt.dueDate ? 'has-value' : ''} ${validationErrors?.['debt-dueDate'] ? 'input-error' : ''}`} value={newDebt.dueDate || ''} onChange={(e) => { setNewDebt({ ...newDebt, dueDate: e.target.value }); if (validationErrors?.['debt-dueDate']) { const v = { ...validationErrors }; delete v['debt-dueDate']; setValidationErrors(v); } }} />
                </div>
                {newDebt.dueDate && (() => {
                  const due = new Date(newDebt.dueDate);
                  const now = new Date();
                  const daysUntil = Math.ceil((due - now) / (1000 * 60 * 60 * 24));
                  const isOverdue = daysUntil < 0;
                  const isUrgent = daysUntil >= 0 && daysUntil <= 14;
                  return (
                    <div style={{ padding: '10px 14px', borderRadius: '10px', fontSize: '13px',
                      color: isOverdue ? tc.danger : isUrgent ? tc.warning : tc.secondary,
                      background: isOverdue ? 'rgba(239,68,68,0.08)' : isUrgent ? 'rgba(245,158,11,0.08)' : 'var(--glass)',
                      border: `1px solid ${isOverdue ? 'rgba(239,68,68,0.2)' : isUrgent ? 'rgba(245,158,11,0.2)' : 'var(--border)'}` }}>
                      {isOverdue ? `⚠️ This date is ${Math.abs(daysUntil)} days overdue` : `Due in ${daysUntil} days (${due.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })})`}
                    </div>
                  );
                })()}
              </>
            )}

            {/* INSTALLMENT fields */}
            {mode === 'installment' && (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ display: 'block', color: 'var(--text-secondary)', fontSize: '13px', marginBottom: '8px', fontWeight: '500' }}>Number of Months</label>
                    <input type="number" className={`input ${validationErrors?.['debt-installmentMonths'] ? 'input-error' : ''}`} placeholder="e.g., 12" value={newDebt.installmentMonths} onChange={(e) => { setNewDebt({ ...newDebt, installmentMonths: e.target.value }); if (validationErrors?.['debt-installmentMonths']) { const v = { ...validationErrors }; delete v['debt-installmentMonths']; setValidationErrors(v); } }} onKeyDown={dismissKeyboard} />
                  </div>
                  <div>
                    <label style={{ display: 'block', color: 'var(--text-secondary)', fontSize: '13px', marginBottom: '8px', fontWeight: '500' }}>Start Date</label>
                    <input type="date" className={`input ${newDebt.installmentStartDate ? 'has-value' : ''} ${validationErrors?.['debt-installmentStartDate'] ? 'input-error' : ''}`} value={newDebt.installmentStartDate || ''} onChange={(e) => { setNewDebt({ ...newDebt, installmentStartDate: e.target.value }); if (validationErrors?.['debt-installmentStartDate']) { const v = { ...validationErrors }; delete v['debt-installmentStartDate']; setValidationErrors(v); } }} />
                  </div>
                </div>
                <div>
                  <label style={{ display: 'block', color: 'var(--text-secondary)', fontSize: '13px', marginBottom: '8px', fontWeight: '500' }}>Interest Rate (% APR)</label>
                  <input type="number" className="input" placeholder="0 (often 0% for finance)" value={newDebt.interestRate} onChange={(e) => setNewDebt({ ...newDebt, interestRate: e.target.value })} onKeyDown={dismissKeyboard} />
                </div>
                {installmentMonthly > 0 && (
                  <div style={{ padding: '10px 14px', background: tc.purpleTint, borderRadius: '10px', border: '1px solid rgba(167,139,250,0.2)', fontSize: '13px', color: tc.purple }}>
                    Monthly payment: <strong>£{installmentMonthly.toFixed(2)}</strong> × {installMonths} months
                    {newDebt.installmentStartDate && (() => {
                      const start = new Date(newDebt.installmentStartDate);
                      const now = new Date();
                      const elapsed = Math.max(0, Math.min((now.getFullYear() - start.getFullYear()) * 12 + (now.getMonth() - start.getMonth()), installMonths));
                      const remaining = installMonths - elapsed;
                      const end = new Date(start); end.setMonth(end.getMonth() + installMonths);
                      return <div style={{ fontSize: '11px', marginTop: '4px', opacity: 0.8 }}>{elapsed} of {installMonths} payments made · {remaining} left · Ends {end.toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })}</div>;
                    })()}
                  </div>
                )}
              </>
            )}

            {/* BNPL fields */}
            {mode === 'bnpl' && (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ display: 'block', color: 'var(--text-secondary)', fontSize: '13px', marginBottom: '8px', fontWeight: '500' }}>Interest-Free Months</label>
                    <input type="number" className={`input ${validationErrors?.['debt-bnplPromoMonths'] ? 'input-error' : ''}`} placeholder="e.g., 12" value={newDebt.bnplPromoMonths} onChange={(e) => { setNewDebt({ ...newDebt, bnplPromoMonths: e.target.value }); if (validationErrors?.['debt-bnplPromoMonths']) { const v = { ...validationErrors }; delete v['debt-bnplPromoMonths']; setValidationErrors(v); } }} onKeyDown={dismissKeyboard} />
                  </div>
                  <div>
                    <label style={{ display: 'block', color: 'var(--text-secondary)', fontSize: '13px', marginBottom: '8px', fontWeight: '500' }}>Start Date</label>
                    <input type="date" className={`input ${newDebt.bnplStartDate ? 'has-value' : ''} ${validationErrors?.['debt-bnplStartDate'] ? 'input-error' : ''}`} value={newDebt.bnplStartDate || ''} onChange={(e) => { setNewDebt({ ...newDebt, bnplStartDate: e.target.value }); if (validationErrors?.['debt-bnplStartDate']) { const v = { ...validationErrors }; delete v['debt-bnplStartDate']; setValidationErrors(v); } }} />
                  </div>
                </div>
                {bnplMonthly > 0 && (
                  <div style={{ padding: '10px 14px', background: tc.successTint, borderRadius: '10px', border: '1px solid rgba(16,185,129,0.2)', fontSize: '13px', color: tc.success }}>
                    Pay <strong>£{bnplMonthly.toFixed(2)}/mo</strong> to clear within {bnplMonths} months interest-free
                  </div>
                )}
                {bnplMonths > 0 && newDebt.bnplStartDate && (() => {
                  const start = new Date(newDebt.bnplStartDate);
                  const now = new Date();
                  const elapsed = Math.max(0, (now.getFullYear() - start.getFullYear()) * 12 + (now.getMonth() - start.getMonth()));
                  const remaining = Math.max(0, bnplMonths - elapsed);
                  const end = new Date(start); end.setMonth(end.getMonth() + bnplMonths);
                  const isExpired = now >= end;
                  return (
                    <div style={{ padding: '10px 14px', borderRadius: '10px', fontSize: '13px',
                      color: isExpired ? tc.danger : remaining <= 3 ? tc.warning : tc.success,
                      background: isExpired ? 'rgba(239,68,68,0.08)' : remaining <= 3 ? 'rgba(245,158,11,0.08)' : 'rgba(16,185,129,0.06)',
                      border: `1px solid ${isExpired ? 'rgba(239,68,68,0.2)' : remaining <= 3 ? 'rgba(245,158,11,0.2)' : 'rgba(16,185,129,0.15)'}` }}>
                      {isExpired ? '⚠️ Interest-free period already expired!' : `🟢 Interest-free · ${remaining} of ${bnplMonths} months remaining`}
                    </div>
                  );
                })()}
                <div style={{ padding: '12px', background: 'var(--glass)', borderRadius: '10px', border: '1px solid var(--border)' }}>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '8px', fontWeight: '500' }}>IF NOT CLEARED BY END DATE:</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                    <div>
                      <label style={{ display: 'block', color: 'var(--text-secondary)', fontSize: '12px', marginBottom: '4px' }}>Interest Rate (%)</label>
                      <input type="number" className="input" placeholder="e.g., 29.9" value={newDebt.bnplPostInterest} onChange={(e) => setNewDebt({ ...newDebt, bnplPostInterest: e.target.value })} onKeyDown={dismissKeyboard} />
                    </div>
                    <div>
                      <label style={{ display: 'block', color: 'var(--text-secondary)', fontSize: '12px', marginBottom: '4px' }}>Monthly Payment</label>
                      <input type="number" className="input" placeholder="0.00" value={newDebt.bnplPostPayment} onChange={(e) => setNewDebt({ ...newDebt, bnplPostPayment: e.target.value })} onKeyDown={dismissKeyboard} />
                    </div>
                  </div>
                </div>
              </>
            )}

            <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
              <button className="btn btn-primary" onClick={handleAddDebt} style={{ flex: 1, justifyContent: 'center' }}><Icons.Plus size={20} /> Add Debt</button>
              <button className="btn btn-secondary" onClick={() => { onClose(); setValidationErrors({}); setNewDebt({ ...emptyDebt }); }} style={{ flex: 1, justifyContent: 'center' }}>Cancel</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════
// Add Savings Modal
// ══════════════════════════════════════
export function AddSavingsModal({ show, onClose, newSavingsGoal, setNewSavingsGoal, handleAddSavings, emptySavings, validationErrors, setValidationErrors }) {
  if (!show) return null;
  return (
    <div className="modal-overlay" onClick={() => { onClose(); setNewSavingsGoal({ ...emptySavings }); setValidationErrors({}); }}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div style={{ padding: '24px' }}>
          <h2 className="font-display" style={{ fontSize: '24px', marginBottom: '24px' }}>Add Savings Goal</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div>
              <label style={{ display: 'block', color: 'var(--text-secondary)', fontSize: '13px', marginBottom: '8px', fontWeight: '500' }}>Goal Name</label>
              <input className={`input ${validationErrors?.['savings-name'] ? 'input-error' : ''}`} placeholder="e.g., Holiday Fund" value={newSavingsGoal.name} onChange={(e) => { setNewSavingsGoal({ ...newSavingsGoal, name: e.target.value }); if (validationErrors?.['savings-name']) { const v = { ...validationErrors }; delete v['savings-name']; setValidationErrors(v); } }} onKeyDown={dismissKeyboard} />
            </div>
            <div>
              <label style={{ display: 'block', color: 'var(--text-secondary)', fontSize: '13px', marginBottom: '8px', fontWeight: '500' }}>Category</label>
              <select className="input" value={newSavingsGoal.category} onChange={(e) => setNewSavingsGoal({ ...newSavingsGoal, category: e.target.value })}>
                {SAVINGS_CATEGORIES.map((c) => (<option key={c} value={c}>{c}</option>))}
              </select>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', color: 'var(--text-secondary)', fontSize: '13px', marginBottom: '8px', fontWeight: '500' }}>Starting Amount</label>
                <input type="number" className="input" placeholder="0.00 (optional)" value={newSavingsGoal.startingAmount} onChange={(e) => setNewSavingsGoal({ ...newSavingsGoal, startingAmount: e.target.value })} onKeyDown={dismissKeyboard} />
              </div>
              <div>
                <label style={{ display: 'block', color: 'var(--text-secondary)', fontSize: '13px', marginBottom: '8px', fontWeight: '500' }}>Target Amount</label>
                <input type="number" className="input" placeholder="0.00 (optional)" value={newSavingsGoal.targetAmount} onChange={(e) => setNewSavingsGoal({ ...newSavingsGoal, targetAmount: e.target.value })} onKeyDown={dismissKeyboard} />
              </div>
            </div>
            <div>
              <label style={{ display: 'block', color: 'var(--text-secondary)', fontSize: '13px', marginBottom: '8px', fontWeight: '500' }}>Monthly Auto-Save</label>
              <input type="number" className="input" placeholder="0.00 (optional)" value={newSavingsGoal.monthlyContribution} onChange={(e) => setNewSavingsGoal({ ...newSavingsGoal, monthlyContribution: e.target.value })} onKeyDown={dismissKeyboard} />
            </div>
            <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
              <button className="btn btn-primary" onClick={handleAddSavings} style={{ flex: 1, justifyContent: 'center' }}><Icons.Plus size={20} /> Add Goal</button>
              <button className="btn btn-secondary" onClick={() => { onClose(); setNewSavingsGoal({ ...emptySavings }); setValidationErrors({}); }} style={{ flex: 1, justifyContent: 'center' }}>Cancel</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
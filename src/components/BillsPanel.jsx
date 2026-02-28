import React, { useState } from 'react';
import * as Icons from './Icons';
import SwipeToDelete from './SwipeToDelete';
import { tc } from '../utils/themeColors';

const STATUS_FILTERS = [
  { key: 'ALL', label: 'All' }, { key: 'PAID', label: 'Paid' },
  { key: 'UNPAID', label: 'Unpaid' }, { key: 'MISSED', label: 'Missed' },
  { key: 'PAUSED', label: 'Paused' }, { key: 'RECURRING', label: 'Recurring' },
  { key: 'ONE-OFF', label: 'One-off' },
];

const SORT_OPTIONS = [
  { key: 'default', label: 'Default' },
  { key: 'name', label: 'Name A–Z' },
  { key: 'amount-high', label: 'Amount ↓' },
  { key: 'amount-low', label: 'Amount ↑' },
  { key: 'status', label: 'Unpaid first' },
];

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

function formatDueDate(bill) {
  if (!bill.recurring) {
    // One-off: paymentDate is a date string like "2026-03-15"
    if (!bill.paymentDate) return 'Not set';
    const d = new Date(bill.paymentDate);
    return isNaN(d.getTime()) ? bill.paymentDate : d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  }
  const freq = bill.frequency || 'Monthly';
  switch (freq) {
    case 'Weekly':
      return bill.paymentDay !== undefined && bill.paymentDay !== '' ? `Every ${DAY_NAMES[parseInt(bill.paymentDay)]}` : 'Not set';
    case 'Fortnightly':
      return bill.paymentDay !== undefined && bill.paymentDay !== '' ? `Every other ${DAY_NAMES[parseInt(bill.paymentDay)]}` : 'Not set';
    case 'Monthly':
      return bill.paymentDate ? `${getOrdinal(parseInt(bill.paymentDate))} of each month` : 'Not set';
    case 'Quarterly': {
      const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
      const start = parseInt(bill.startMonth) || 1;
      const payMonths = [start, start+3, start+6, start+9].map(m => months[((m-1) % 12)]);
      return bill.paymentDate ? `${getOrdinal(parseInt(bill.paymentDate))} of ${payMonths.join(', ')}` : 'Not set';
    }
    case 'Yearly': {
      if (!bill.paymentDate) return 'Not set';
      const d = new Date(bill.paymentDate);
      if (isNaN(d.getTime())) return bill.paymentDate;
      const now = new Date();
      const thisYear = now.getFullYear();
      const payMonth = d.getMonth();
      const payDay = d.getDate();
      // If this year's date has passed, show next year
      const nextDate = new Date(thisYear, payMonth, payDay);
      if (nextDate < now) nextDate.setFullYear(thisYear + 1);
      return nextDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
    }
    default:
      return bill.paymentDate || 'Not set';
  }
}

function getOrdinal(n) {
  if (!n || isNaN(n)) return '';
  const s = ['th','st','nd','rd'];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

export default function BillsPanel({
  categories, selectedCategory, setSelectedCategory, statusFilter, setStatusFilter,
  filteredBills, editingId, editForm, setEditForm, handleEditStart, handleEditSave,
  handleDelete, handleTogglePaid, handleToggleMissed, handleTogglePaused, setEditingId, categoryScrollRef,
  billSearch, setBillSearch, billSort, setBillSort,
}) {
  const [showSort, setShowSort] = useState(false);

  return (
    <>
      {/* Search Bar */}
      <div className="animate-in" style={{ marginBottom: '12px', animationDelay: '0.6s' }}>
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center', height: '44px', background: 'var(--glass)', borderRadius: '12px', border: '1px solid var(--border)', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none', display: 'flex', alignItems: 'center' }}>
            <Icons.Search size={16} />
          </div>
          <input
            type="text"
            value={billSearch}
            onChange={(e) => setBillSearch(e.target.value)}
            placeholder="Search bills..."
            style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', color: 'var(--text-primary, #fff)', paddingLeft: '40px', paddingRight: billSearch ? '82px' : '44px', fontSize: '14px', height: '100%', fontFamily: 'inherit' }}
          />
          {billSearch && (
            <button
              onClick={() => setBillSearch('')}
              style={{
                position: 'absolute', right: '42px', top: '50%', transform: 'translateY(-50%)',
                width: '24px', height: '24px', borderRadius: '50%',
                border: 'none', background: 'var(--glass)',
                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'var(--text-muted)', transition: 'all 0.2s',
              }}
            >
              <Icons.X size={12} />
            </button>
          )}
          <button
            onClick={() => setShowSort(!showSort)}
            style={{
              position: 'absolute', right: '6px', top: '50%', transform: 'translateY(-50%)',
              width: '32px', height: '32px', borderRadius: '8px',
              border: billSort !== 'default' ? '1px solid var(--accent-primary)' : '1px solid var(--border)',
              background: billSort !== 'default' ? 'var(--info-tint)' : 'transparent',
              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: billSort !== 'default' ? 'var(--accent-primary)' : 'var(--text-muted)',
              transition: 'all 0.2s',
            }}
          >
            <Icons.SortAsc size={16} />
          </button>
        </div>

        {showSort && (
          <div style={{
            marginTop: '8px', padding: '6px', background: 'var(--bg-card, #141833)', borderRadius: '12px',
            border: '1px solid var(--border)', display: 'flex', gap: '6px', flexWrap: 'wrap',
            animation: 'slideInUp 0.2s',
          }}>
            {SORT_OPTIONS.map((opt) => (
              <button
                key={opt.key}
                onClick={() => { setBillSort(opt.key); setShowSort(false); }}
                style={{
                  padding: '6px 12px', borderRadius: '8px', fontSize: '12px', fontWeight: '600',
                  border: billSort === opt.key ? '1px solid var(--accent-primary)' : '1px solid var(--border)',
                  background: billSort === opt.key ? 'var(--info-tint-strong)' : 'var(--glass)',
                  color: billSort === opt.key ? 'var(--accent-primary)' : 'var(--text-muted)',
                  cursor: 'pointer', transition: 'all 0.2s',
                }}
              >
                {opt.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Category + Status Filters */}
      <div className="animate-in" style={{ marginBottom: '16px', animationDelay: '0.7s' }}>
        <div ref={categoryScrollRef} className="mobile-category-scroll" style={{ display: 'flex', gap: '8px', overflowX: 'auto' }}>
          {categories.map((cat) => (
            <button key={cat} className={`btn ${selectedCategory === cat ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setSelectedCategory(cat)} style={{ whiteSpace: 'nowrap', flexShrink: 0 }}>{cat}</button>
          ))}
        </div>
        <div className="mobile-category-scroll" style={{ display: 'flex', gap: '6px', overflowX: 'auto', marginTop: '8px' }}>
          {STATUS_FILTERS.map((f) => (
            <button key={f.key} onClick={() => setStatusFilter(f.key)} style={{
              padding: '6px 14px', borderRadius: '20px',
              border: statusFilter === f.key ? '2px solid var(--accent-primary)' : '1px solid var(--border)',
              background: statusFilter === f.key ? 'var(--accent-primary)20' : 'var(--glass)',
              color: statusFilter === f.key ? 'var(--accent-primary)' : 'var(--text-muted)',
              cursor: 'pointer', fontSize: '12px', fontWeight: '600', whiteSpace: 'nowrap', flexShrink: 0, transition: 'all 0.2s',
            }}>{f.label}</button>
          ))}
        </div>
      </div>

      {/* Bills Header + List */}
      <div className="glass-card animate-in" style={{ padding: '16px', overflow: 'hidden', animationDelay: '0.8s' }}>
        <div style={{ marginBottom: '16px' }}>
          <h2 className="font-display" style={{ fontSize: '24px' }}>{selectedCategory === 'ALL' ? 'All Bills' : selectedCategory}</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginTop: '4px' }}>
            {filteredBills.length} {filteredBills.length === 1 ? 'bill' : 'bills'}
            {statusFilter !== 'ALL' ? ` · ${statusFilter.toLowerCase()}` : ''}
            {billSearch ? ` · "${billSearch}"` : ''}
            {billSort !== 'default' ? ' · sorted' : ''}
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {filteredBills.length === 0 && billSearch ? (
            <div style={{ textAlign: 'center', padding: '32px 20px', color: 'var(--text-muted)' }}>
              <Icons.Search size={32} style={{ marginBottom: '12px', opacity: 0.3 }} />
              <p style={{ fontSize: '14px' }}>No bills matching "{billSearch}"</p>
            </div>
          ) : (
            filteredBills.map((bill) => (
              <SwipeToDelete key={bill.id} onDelete={() => handleDelete(bill.id)} onEdit={() => handleEditStart(bill)}>
              <div className="mobile-bill-card" style={{
                borderLeft: bill.paused ? `3px solid var(--warning)` : bill.paid ? `3px solid var(--success)` : bill.missed ? `3px solid var(--danger)` : undefined,
                borderColor: bill.paused ? 'var(--warning-tint-strong)' : bill.paid ? 'var(--success-tint-strong)' : bill.missed ? 'var(--danger-tint-strong)' : undefined,
                position: 'relative',
              }}>
                {editingId !== bill.id && bill.paid && !bill.missed && (
                  <div style={{ position: 'absolute', top: '12px', right: '12px', fontSize: '11px', color: tc.success, display: 'inline-flex', alignItems: 'center', gap: '4px', background: tc.successTint, padding: '3px 10px', borderRadius: '6px', border: `1px solid var(--success-tint-strong)`, fontWeight: '600' }}>✓ Paid</div>
                )}
                {editingId !== bill.id && bill.missed && (
                  <div style={{ position: 'absolute', top: '12px', right: '12px', fontSize: '11px', color: tc.danger, display: 'inline-flex', alignItems: 'center', gap: '4px', background: tc.dangerTint, padding: '3px 10px', borderRadius: '6px', border: `1px solid var(--danger-tint-strong)`, fontWeight: '600' }}>✗ Missed</div>
                )}
                {editingId !== bill.id && bill.paused && !bill.missed && !bill.paid && (
                  <div style={{ position: 'absolute', top: '12px', right: '12px', fontSize: '11px', color: tc.warning, display: 'inline-flex', alignItems: 'center', gap: '4px', background: tc.warningTint, padding: '3px 10px', borderRadius: '6px', border: `1px solid var(--warning-tint-strong)`, fontWeight: '600' }}>⏸ Paused</div>
                )}

                {editingId === bill.id ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <input className="input" value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} placeholder="Bill name" />
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                      <div>
                        <label style={{ display: 'block', color: 'var(--text-secondary)', fontSize: '13px', marginBottom: '8px', fontWeight: '500' }}>Projected</label>
                        <input type="number" className="input" value={editForm.projected} onChange={(e) => setEditForm({ ...editForm, projected: e.target.value === '' ? '' : e.target.value })} onBlur={(e) => setEditForm({ ...editForm, projected: parseFloat(e.target.value) || 0 })} />
                      </div>
                      <div>
                        <label style={{ display: 'block', color: 'var(--text-secondary)', fontSize: '13px', marginBottom: '8px', fontWeight: '500' }}>Actual</label>
                        <input type="number" className="input" value={editForm.actual} onChange={(e) => setEditForm({ ...editForm, actual: e.target.value === '' ? '' : e.target.value })} onBlur={(e) => setEditForm({ ...editForm, actual: parseFloat(e.target.value) || 0 })} />
                      </div>
                    </div>
                    <select className="input" value={editForm.category} onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}>
                      {categories.map((cat) => (<option key={cat} value={cat}>{cat}</option>))}
                    </select>
                    {/* Due date editing */}
                    {!editForm.recurring || editForm.frequency === 'Monthly' || editForm.frequency === 'Quarterly' ? (
                      <div>
                        <label style={{ display: 'block', color: 'var(--text-secondary)', fontSize: '13px', marginBottom: '8px', fontWeight: '500' }}>{editForm.recurring ? 'Day of month' : 'Due date'}</label>
                        {editForm.recurring ? (
                          <input type="number" className="input" placeholder="1-31" min="1" max="31" value={editForm.paymentDate || ''} onChange={(e) => setEditForm({ ...editForm, paymentDate: e.target.value })} />
                        ) : (
                          <input type="date" className={`input ${editForm.paymentDate ? 'has-value' : ''}`} value={editForm.paymentDate || ''} onChange={(e) => setEditForm({ ...editForm, paymentDate: e.target.value })} />
                        )}
                      </div>
                    ) : (editForm.frequency === 'Weekly' || editForm.frequency === 'Fortnightly') ? (
                      <div>
                        <label style={{ display: 'block', color: 'var(--text-secondary)', fontSize: '13px', marginBottom: '8px', fontWeight: '500' }}>Day of week</label>
                        <select className="input" value={editForm.paymentDay || ''} onChange={(e) => setEditForm({ ...editForm, paymentDay: e.target.value })}>
                          <option value="">Select day...</option><option value="1">Monday</option><option value="2">Tuesday</option><option value="3">Wednesday</option><option value="4">Thursday</option><option value="5">Friday</option><option value="6">Saturday</option><option value="0">Sunday</option>
                        </select>
                      </div>
                    ) : editForm.frequency === 'Yearly' ? (
                      <div>
                        <label style={{ display: 'block', color: 'var(--text-secondary)', fontSize: '13px', marginBottom: '8px', fontWeight: '500' }}>Annual date</label>
                        <input type="date" onKeyDown={(e) => e.preventDefault()} className="input" value={editForm.paymentDate || ''} onChange={(e) => setEditForm({ ...editForm, paymentDate: e.target.value })} />
                      </div>
                    ) : null}
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button className="btn btn-primary" onClick={handleEditSave} style={{ flex: 1 }}><Icons.Check size={18} /> Save</button>
                      <button className="btn btn-secondary" onClick={() => setEditingId(null)} style={{ flex: 1 }}><Icons.X size={18} /> Cancel</button>
                    </div>
                    <button onClick={() => { setEditingId(null); handleDelete(bill.id); }} style={{ width: '100%', padding: '10px', borderRadius: '10px', border: `1px solid var(--danger-tint-strong)`, background: tc.dangerTintLight, color: tc.danger, cursor: 'pointer', fontSize: '14px', fontWeight: '500', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}><Icons.Trash size={16} /> Delete Bill</button>
                  </div>
                ) : (
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            <button onClick={() => handleTogglePaid(bill.id)} style={{ width: '28px', height: '28px', minWidth: '28px', borderRadius: '8px', border: bill.paid ? 'none' : '2px solid var(--border)', background: bill.paid ? 'linear-gradient(135deg, var(--success), #059669)' : 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' }}>
                              {bill.paid && <Icons.Check size={16} style={{ color: '#fff' }} />}
                            </button>
                            <button onClick={() => handleToggleMissed(bill.id)} style={{ width: '28px', height: '28px', minWidth: '28px', borderRadius: '8px', border: bill.missed ? 'none' : '2px solid var(--border)', background: bill.missed ? 'linear-gradient(135deg, var(--danger), #dc2626)' : 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' }}>
                              {bill.missed && <Icons.X size={16} style={{ color: '#fff' }} />}
                            </button>
                            {bill.recurring && (
                              <button onClick={() => handleTogglePaused(bill.id)} style={{ width: '28px', height: '28px', minWidth: '28px', borderRadius: '8px', border: bill.paused ? 'none' : '2px solid var(--border)', background: bill.paused ? 'linear-gradient(135deg, var(--warning), #d97706)' : 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' }}>
                                {bill.paused && <span style={{ color: '#fff', fontSize: '14px', fontWeight: '700' }}>⏸</span>}
                              </button>
                            )}
                          </div>
                          <div style={{ flex: 1 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <div style={{ fontWeight: '600', fontSize: '16px', marginBottom: '2px' }}>{bill.name}</div>
                              <button onClick={() => handleEditStart(bill)} style={{ width: '24px', height: '24px', borderRadius: '6px', border: 'none', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', opacity: 0.5, transition: 'opacity 0.2s' }}><Icons.Edit size={14} /></button>
                            </div>
                            <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{bill.category}</div>
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: '6px', marginLeft: '40px', flexWrap: 'wrap' }}>
                          {bill.recurring ? (
                            <div style={{ fontSize: '11px', color: tc.info, display: 'inline-flex', alignItems: 'center', gap: '4px', background: tc.infoTint, padding: '3px 8px', borderRadius: '6px', border: `1px solid var(--info-tint-strong)` }}>↻ {bill.frequency || 'Monthly'}</div>
                          ) : (
                            <div style={{ fontSize: '11px', color: tc.warning, display: 'inline-flex', alignItems: 'center', gap: '4px', background: tc.warningTint, padding: '3px 8px', borderRadius: '6px', border: `1px solid var(--warning-tint-strong)` }}>One-off</div>
                          )}
                          {bill.missed && bill.recurring && (
                            <div style={{ fontSize: '11px', color: tc.danger, background: tc.dangerTintLight, padding: '3px 8px', borderRadius: '6px', border: `1px solid var(--danger-tint)` }}>⚠️ Paused until paid</div>
                          )}
                        </div>
                      </div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', padding: '12px', background: 'var(--glass)', borderRadius: '12px', border: '1px solid var(--border)' }}>
                      <div>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Projected</div>
                        <div className="font-mono" style={{ fontSize: '16px', fontWeight: '600', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>£{bill.projected.toFixed(2)}</div>
                      </div>
                      <div>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Actual</div>
                        <div className="font-mono" style={{ fontSize: '16px', fontWeight: '600', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>£{bill.actual.toFixed(2)}</div>
                        {bill.actual !== bill.projected && (
                          <div style={{ fontSize: '11px', color: bill.actual > bill.projected ? tc.danger : tc.success, marginTop: '2px' }}>{bill.actual > bill.projected ? '+' : ''}£{(bill.actual - bill.projected).toFixed(2)}</div>
                        )}
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 12px', background: 'var(--glass)', borderRadius: '8px', border: '1px solid var(--border)', marginTop: '12px' }}>
                      <Icons.Calendar size={14} /><span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Due: {formatDueDate(bill)}</span>
                    </div>
                  </div>
                )}
              </div>
              </SwipeToDelete>
            ))
          )}
        </div>
      </div>
    </>
  );
}

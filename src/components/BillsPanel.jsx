import { useCurrency } from './CurrencyContext';
import React, { useState, useRef } from 'react';
import ReactDOM from 'react-dom';
import * as Icons from './Icons';
import haptic from '../utils/haptics';
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

const CATEGORY_ICON_MAP = {
  HOME: Icons.CategoryHome,
  TRANSPORT: Icons.CategoryTransport,
  FOOD: Icons.CategoryFood,
  ENTERTAINMENT: Icons.CategoryEntertainment,
  HEALTH: Icons.CategoryHealth,
  INSURANCE: Icons.CategoryInsurance,
  'CREDIT CARDS': Icons.CategoryCreditCard,
  SUBSCRIPTION: Icons.CategorySubscription,
  SAVINGS: Icons.CategorySavings,
  UTILITIES: Icons.CategoryUtilities,
};

function getCategoryIcon(cat, size = 20, color = 'currentColor') {
  const IconComponent = CATEGORY_ICON_MAP[cat] || Icons.CategoryOther;
  return <IconComponent size={size} style={{ color }} />;
}

function formatDueDate(bill) {
  if (!bill.recurring) {
    if (!bill.paymentDate) return null;
    const d = new Date(bill.paymentDate);
    return isNaN(d.getTime()) ? bill.paymentDate : d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  }
  const freq = bill.frequency || 'Monthly';
  switch (freq) {
    case 'Weekly':
      return bill.paymentDay !== undefined && bill.paymentDay !== '' ? `Every ${DAY_NAMES[parseInt(bill.paymentDay)]}` : null;
    case 'Fortnightly':
      return bill.paymentDay !== undefined && bill.paymentDay !== '' ? `Every other ${DAY_NAMES[parseInt(bill.paymentDay)]}` : null;
    case 'Monthly':
      return bill.paymentDate ? `${getOrdinal(parseInt(bill.paymentDate))} of month` : null;
    case 'Quarterly': {
      const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
      const start = parseInt(bill.startMonth) || 1;
      const payMonths = [start, start+3, start+6, start+9].map(m => months[((m-1) % 12)]);
      return bill.paymentDate ? `${getOrdinal(parseInt(bill.paymentDate))} of ${payMonths.join(', ')}` : null;
    }
    case 'Yearly': {
      if (!bill.paymentDate) return null;
      const d = new Date(bill.paymentDate);
      if (isNaN(d.getTime())) return bill.paymentDate;
      const now = new Date();
      const thisYear = now.getFullYear();
      const payMonth = d.getMonth();
      const payDay = d.getDate();
      const nextDate = new Date(thisYear, payMonth, payDay);
      if (nextDate < now) nextDate.setFullYear(thisYear + 1);
      return nextDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
    }
    default:
      return bill.paymentDate || null;
  }
}

function getOrdinal(n) {
  if (!n || isNaN(n)) return '';
  const s = ['th','st','nd','rd'];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

function BillCard({
  bill, cs, selectionMode, selectedIds, toggleSelect,
  handleEditStart, handleEditSave, handleDelete,
  handleTogglePaid, handleToggleMissed, handleTogglePaused,
  editingId, editForm, setEditForm, setEditingId, categories,
  onCardTouchStart, onCardTouchMove, onCardTouchEnd,
}) {
  const isSelected = selectedIds.has(bill.id);
  const dueDate = formatDueDate(bill);
  const variance = bill.actual - bill.projected;
  const hasVariance = Math.abs(variance) > 0.01;

  // Status colours
  const statusConfig = bill.paid
    ? { color: 'var(--success)', tint: tc.successTint, tintStrong: tc.successTintStrong, label: 'Paid', icon: '✓', borderColor: 'var(--success)' }
    : bill.missed
    ? { color: 'var(--danger)', tint: tc.dangerTint, tintStrong: tc.dangerTintStrong, label: 'Missed', icon: '✗', borderColor: 'var(--danger)' }
    : bill.paused
    ? { color: 'var(--warning)', tint: tc.warningTint, tintStrong: tc.warningTintStrong, label: 'Paused', icon: '⏸', borderColor: 'var(--warning)' }
    : null;

  if (editingId === bill.id) {
    return (
      <div className="mobile-bill-card" style={{ animation: 'slideInUp 0.2s' }}>
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
          {!editForm.recurring || editForm.frequency === 'Monthly' || editForm.frequency === 'Quarterly' ? (
            <div>
              <label style={{ display: 'block', color: 'var(--text-secondary)', fontSize: '13px', marginBottom: '8px', fontWeight: '500' }}>{editForm.recurring ? 'Day of month' : 'Due date'}</label>
              {editForm.recurring ? (
                <input type="number" className="input" placeholder="1-31" min="1" max="31" value={editForm.paymentDate || ''} onChange={(e) => { const v = e.target.value; if (v === '') { setEditForm({ ...editForm, paymentDate: '' }); return; } const n = parseInt(v); if (!isNaN(n)) setEditForm({ ...editForm, paymentDate: String(Math.min(31, Math.max(1, n))) }); }} />
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
      </div>
    );
  }

  return (
    <div
      onTouchStart={(e) => !selectionMode && onCardTouchStart(e, bill.id)}
      onTouchMove={onCardTouchMove}
      onTouchEnd={onCardTouchEnd}
      onClick={() => selectionMode && toggleSelect(bill.id)}
    >
      <div className="mobile-bill-card" style={{
        borderLeft: statusConfig ? `3px solid ${statusConfig.borderColor}` : undefined,
        position: 'relative',
        outline: selectionMode && isSelected ? '2px solid var(--accent-primary)' : 'none',
        outlineOffset: '-2px',
        transition: 'all 0.15s ease',
        background: statusConfig ? statusConfig.tint : undefined,
      }}>

        {/* Selection checkbox */}
        {selectionMode && (
          <div style={{ position: 'absolute', top: '50%', left: '12px', transform: 'translateY(-50%)', width: '22px', height: '22px', borderRadius: '6px', border: isSelected ? 'none' : '2px solid var(--border)', background: isSelected ? 'var(--accent-primary)' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 5, transition: 'all 0.15s' }}>
            {isSelected && <Icons.Check size={13} style={{ color: '#fff' }} />}
          </div>
        )}

        <div style={{ paddingLeft: selectionMode ? '36px' : undefined, transition: 'padding 0.15s ease' }}>

          {/* ── Row 1: Icon + Name + Amount ── */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
            {/* Category emoji icon */}
            <div style={{
              width: '36px', height: '36px', borderRadius: '10px', flexShrink: 0,
              background: statusConfig ? statusConfig.tint : 'var(--glass)',
              border: `1px solid ${statusConfig ? statusConfig.tintStrong : 'var(--border)'}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              {getCategoryIcon(bill.category, 20, statusConfig ? statusConfig.color : 'var(--text-secondary)')}
            </div>

            {/* Name + category */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontWeight: '600', fontSize: '15px', color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {bill.name}
                </span>
                {!selectionMode && (
                  <button onClick={() => handleEditStart(bill)} style={{ width: '22px', height: '22px', borderRadius: '5px', border: '1px solid var(--accent-primary)', background: 'var(--info-tint)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-primary)', flexShrink: 0, transition: 'opacity 0.2s' }}>
                    <Icons.Edit size={12} />
                  </button>
                )}
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '1px' }}>
                {bill.category}
              </div>
            </div>

            {/* Amount — top right */}
            <div style={{ textAlign: 'right', flexShrink: 0 }}>
              <div className="font-mono" style={{ fontSize: '17px', fontWeight: '700', color: statusConfig ? statusConfig.color : 'var(--text-primary)' }}>
                {cs}{bill.actual.toFixed(2)}
              </div>
              {hasVariance && (
                <div style={{ fontSize: '11px', color: variance > 0 ? 'var(--danger)' : 'var(--success)', marginTop: '1px' }}>
                  {variance > 0 ? '+' : ''}{cs}{variance.toFixed(2)}
                </div>
              )}
            </div>
          </div>

          {/* ── Row 2: Due date + frequency + status badge ── */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px', marginLeft: '46px' }}>
            {dueDate && (
              <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '3px' }}>
                <Icons.Calendar size={10} />
                {dueDate}
              </span>
            )}
            {dueDate && (bill.recurring || statusConfig) && (
              <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>·</span>
            )}
            {bill.recurring ? (
              <span style={{ fontSize: '11px', color: tc.info, background: tc.infoTint, padding: '2px 7px', borderRadius: '5px', border: '1px solid var(--info-tint-strong)', fontWeight: '600' }}>
                ↻ {bill.frequency || 'Monthly'}
              </span>
            ) : (
              <span style={{ fontSize: '11px', color: tc.warning, background: tc.warningTint, padding: '2px 7px', borderRadius: '5px', border: '1px solid var(--warning-tint-strong)', fontWeight: '600' }}>
                One-off
              </span>
            )}
            {statusConfig && (
              <span style={{ fontSize: '11px', color: statusConfig.color, background: statusConfig.tint, padding: '2px 7px', borderRadius: '5px', border: `1px solid ${statusConfig.tintStrong}`, fontWeight: '600', marginLeft: 'auto' }}>
                {statusConfig.icon} {statusConfig.label}
              </span>
            )}
          </div>

          {/* ── Row 3: Action buttons ── */}
          {!selectionMode && (
            <div style={{ display: 'flex', gap: '6px', marginLeft: '46px' }}>
              <button
                onClick={() => handleTogglePaid(bill.id)}
                style={{
                  flex: 1, padding: '7px 0', borderRadius: '8px', fontSize: '12px', fontWeight: '600',
                  border: bill.paid ? 'none' : '1.5px solid var(--border)',
                  background: bill.paid ? 'linear-gradient(135deg, var(--success), #059669)' : 'var(--glass)',
                  color: bill.paid ? '#fff' : 'var(--text-muted)',
                  cursor: 'pointer', transition: 'all 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px',
                }}
              >
                <Icons.Check size={13} /> Paid
              </button>
              <button
                onClick={() => handleToggleMissed(bill.id)}
                style={{
                  flex: 1, padding: '7px 0', borderRadius: '8px', fontSize: '12px', fontWeight: '600',
                  border: bill.missed ? 'none' : '1.5px solid var(--border)',
                  background: bill.missed ? 'linear-gradient(135deg, var(--danger), #dc2626)' : 'var(--glass)',
                  color: bill.missed ? '#fff' : 'var(--text-muted)',
                  cursor: 'pointer', transition: 'all 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px',
                }}
              >
                <Icons.X size={13} /> Missed
              </button>
              {bill.recurring && (
                <button
                  onClick={() => handleTogglePaused(bill.id)}
                  style={{
                    flex: 1, padding: '7px 0', borderRadius: '8px', fontSize: '12px', fontWeight: '600',
                    border: bill.paused ? 'none' : '1.5px solid var(--border)',
                    background: bill.paused ? 'linear-gradient(135deg, var(--warning), #d97706)' : 'var(--glass)',
                    color: bill.paused ? '#fff' : 'var(--text-muted)',
                    cursor: 'pointer', transition: 'all 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px',
                  }}
                >
                  ⏸ Pause
                </button>
              )}
            </div>
          )}

          {/* Paused warning */}
          {bill.missed && bill.recurring && (
            <div style={{ marginTop: '8px', marginLeft: '46px', fontSize: '11px', color: tc.danger, background: tc.dangerTintLight, padding: '4px 8px', borderRadius: '6px', border: `1px solid var(--danger-tint)` }}>
              ⚠️ Paused until paid
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function BillsPanel({
  categories, selectedCategory, setSelectedCategory, statusFilter, setStatusFilter,
  filteredBills, editingId, editForm, setEditForm, handleEditStart, handleEditSave,
  handleDelete, handleTogglePaid, handleToggleMissed, handleTogglePaused, setEditingId, categoryScrollRef,
  billSearch, setBillSearch, billSort, setBillSort,
  onBulkDelete, onBulkTogglePaid, onBulkToggleMissed, onBulkTogglePaused, activePanel,
  setShowAddModal, setShowCategoryModal,
}) {
  const cs = useCurrency();
  const [showSort, setShowSort] = useState(false);
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const longPressTimer = useRef(null);
  const longPressMoved = useRef(false);

  React.useEffect(() => {
    setSelectionMode(false);
    setSelectedIds(new Set());
  }, [selectedCategory, statusFilter, billSearch, billSort]);

  const toggleSelect = (id) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const selectAll = () => {
    if (selectedIds.size === filteredBills.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredBills.map(b => b.id)));
    }
  };

  const exitSelection = () => {
    setSelectionMode(false);
    setSelectedIds(new Set());
  };

  const onCardLongPress = (id) => {
    setSelectionMode(true);
    setSelectedIds(new Set([id]));
  };

  const onCardTouchStart = (e, id) => {
    if (e.target.closest('button, input, select, a')) return;
    longPressMoved.current = false;
    longPressTimer.current = setTimeout(() => {
      if (!longPressMoved.current) {
        onCardLongPress(id);
        haptic.medium();
      }
    }, 400);
  };

  const onCardTouchMove = () => {
    longPressMoved.current = true;
    if (longPressTimer.current) { clearTimeout(longPressTimer.current); longPressTimer.current = null; }
  };

  const onCardTouchEnd = () => {
    if (longPressTimer.current) { clearTimeout(longPressTimer.current); longPressTimer.current = null; }
  };

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
            <button onClick={() => setBillSearch('')} style={{ position: 'absolute', right: '42px', top: '50%', transform: 'translateY(-50%)', width: '24px', height: '24px', borderRadius: '50%', border: 'none', background: 'var(--glass)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', transition: 'all 0.2s' }}>
              <Icons.X size={12} />
            </button>
          )}
          <button onClick={() => setShowSort(!showSort)} style={{ position: 'absolute', right: '6px', top: '50%', transform: 'translateY(-50%)', width: '32px', height: '32px', borderRadius: '8px', border: billSort !== 'default' ? '1px solid var(--accent-primary)' : '1px solid var(--border)', background: billSort !== 'default' ? 'var(--info-tint)' : 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: billSort !== 'default' ? 'var(--accent-primary)' : 'var(--text-muted)', transition: 'all 0.2s' }}>
            <Icons.SortAsc size={16} />
          </button>
        </div>
        {showSort && (
          <div style={{ marginTop: '8px', padding: '6px', background: 'var(--bg-card, #141833)', borderRadius: '12px', border: '1px solid var(--border)', display: 'flex', gap: '6px', flexWrap: 'wrap', animation: 'slideInUp 0.2s' }}>
            {SORT_OPTIONS.map((opt) => (
              <button key={opt.key} onClick={() => { setBillSort(opt.key); setShowSort(false); }} style={{ padding: '6px 12px', borderRadius: '8px', fontSize: '12px', fontWeight: '600', border: billSort === opt.key ? '1px solid var(--accent-primary)' : '1px solid var(--border)', background: billSort === opt.key ? 'var(--info-tint-strong)' : 'var(--glass)', color: billSort === opt.key ? 'var(--accent-primary)' : 'var(--text-muted)', cursor: 'pointer', transition: 'all 0.2s' }}>
                {opt.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Quick Add Buttons */}
      <div className="animate-in" style={{ display: 'flex', gap: '8px', marginBottom: '12px', animationDelay: '0.65s' }}>
        <button className="btn btn-primary" onClick={() => setShowAddModal(true)} style={{ flex: 1, justifyContent: 'center' }}>
          <Icons.Plus size={16} /> Add Bill
        </button>
        <button className="btn btn-secondary" onClick={() => setShowCategoryModal(true)} style={{ flex: 1, justifyContent: 'center' }}>
          Manage Categories
        </button>
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
            <button key={f.key} onClick={() => setStatusFilter(f.key)} style={{ padding: '6px 14px', borderRadius: '20px', border: statusFilter === f.key ? '2px solid var(--accent-primary)' : '1px solid var(--border)', background: statusFilter === f.key ? 'var(--accent-primary)20' : 'var(--glass)', color: statusFilter === f.key ? 'var(--accent-primary)' : 'var(--text-muted)', cursor: 'pointer', fontSize: '12px', fontWeight: '600', whiteSpace: 'nowrap', flexShrink: 0, transition: 'all 0.2s' }}>{f.label}</button>
          ))}
        </div>
      </div>

      {/* Bills Header + List */}
      <div className="glass-card animate-in" style={{ padding: '16px', overflow: 'hidden', animationDelay: '0.8s' }}>
        <div style={{ marginBottom: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 className="font-display" style={{ fontSize: '24px' }}>{selectedCategory === 'ALL' ? 'All Bills' : selectedCategory}</h2>
            {filteredBills.length > 0 && !selectionMode && (
              <button onClick={() => setSelectionMode(true)} style={{ padding: '6px 12px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--glass)', cursor: 'pointer', fontSize: '12px', fontWeight: '600', color: 'var(--text-muted)' }}>Select</button>
            )}
            {selectionMode && (
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <button onClick={selectAll} style={{ padding: '6px 12px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--glass)', cursor: 'pointer', fontSize: '12px', fontWeight: '600', color: 'var(--accent-primary)' }}>{selectedIds.size === filteredBills.length ? 'Deselect All' : 'Select All'}</button>
                <button onClick={exitSelection} style={{ padding: '6px 12px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--glass)', cursor: 'pointer', fontSize: '12px', fontWeight: '600', color: 'var(--text-muted)' }}>Cancel</button>
              </div>
            )}
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginTop: '4px' }}>
            {filteredBills.length} {filteredBills.length === 1 ? 'bill' : 'bills'}
            {statusFilter !== 'ALL' ? ` · ${statusFilter.toLowerCase()}` : ''}
            {billSearch ? ` · "${billSearch}"` : ''}
            {billSort !== 'default' ? ' · sorted' : ''}
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {filteredBills.length === 0 && billSearch ? (
            <div style={{ textAlign: 'center', padding: '32px 20px', color: 'var(--text-muted)' }}>
              <Icons.Search size={32} style={{ marginBottom: '12px', opacity: 0.3 }} />
              <p style={{ fontSize: '14px' }}>No bills matching "{billSearch}"</p>
            </div>
          ) : filteredBills.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)' }}>
              <Icons.PieChart size={40} style={{ marginBottom: '16px', opacity: 0.2 }} />
              <p style={{ fontSize: '15px', fontWeight: '500', color: 'var(--text-secondary)', marginBottom: '6px' }}>No bills yet</p>
              <p style={{ fontSize: '13px' }}>Tap "Add Bill" above to get started</p>
            </div>
          ) : (
            filteredBills.map((bill) => (
              <BillCard
                key={bill.id}
                bill={bill}
                cs={cs}
                selectionMode={selectionMode}
                selectedIds={selectedIds}
                toggleSelect={toggleSelect}
                handleEditStart={handleEditStart}
                handleEditSave={handleEditSave}
                handleDelete={handleDelete}
                handleTogglePaid={handleTogglePaid}
                handleToggleMissed={handleToggleMissed}
                handleTogglePaused={handleTogglePaused}
                editingId={editingId}
                editForm={editForm}
                setEditForm={setEditForm}
                setEditingId={setEditingId}
                categories={categories}
                onCardTouchStart={onCardTouchStart}
                onCardTouchMove={onCardTouchMove}
                onCardTouchEnd={onCardTouchEnd}
              />
            ))
          )}
        </div>
      </div>

      {/* Bulk Action Bar */}
      {selectionMode && selectedIds.size > 0 && activePanel === 2 && ReactDOM.createPortal(
        <div style={{ position: 'fixed', bottom: '20px', left: '16px', right: '16px', padding: '12px 16px', borderRadius: '16px', background: 'var(--bg-card, #141833)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', border: '1px solid var(--border)', boxShadow: '0 8px 32px rgba(0,0,0,0.6)', zIndex: 9999, animation: 'slideInUp 0.2s', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-primary)' }}>{selectedIds.size} selected</span>
            <button onClick={exitSelection} style={{ padding: '4px 10px', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--glass)', cursor: 'pointer', fontSize: '12px', fontWeight: '600', color: 'var(--text-muted)' }}>✕ Cancel</button>
          </div>
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            <button onClick={() => { onBulkTogglePaid([...selectedIds]); exitSelection(); }} style={{ flex: 1, padding: '10px 8px', borderRadius: '10px', border: 'none', background: 'linear-gradient(135deg, var(--success), #059669)', color: '#fff', cursor: 'pointer', fontSize: '12px', fontWeight: '600', minWidth: '0' }}>✓ Paid</button>
            <button onClick={() => { onBulkToggleMissed([...selectedIds]); exitSelection(); }} style={{ flex: 1, padding: '10px 8px', borderRadius: '10px', border: 'none', background: 'linear-gradient(135deg, var(--danger), #dc2626)', color: '#fff', cursor: 'pointer', fontSize: '12px', fontWeight: '600', minWidth: '0' }}>✗ Missed</button>
            {filteredBills.some(b => selectedIds.has(b.id) && b.recurring) && (
              <button onClick={() => { onBulkTogglePaused([...selectedIds]); exitSelection(); }} style={{ flex: 1, padding: '10px 8px', borderRadius: '10px', border: 'none', background: 'linear-gradient(135deg, var(--warning), #d97706)', color: '#fff', cursor: 'pointer', fontSize: '12px', fontWeight: '600', minWidth: '0' }}>⏸ Pause</button>
            )}
            <button onClick={() => { if (confirm(`Delete ${selectedIds.size} bill${selectedIds.size > 1 ? 's' : ''}?`)) { onBulkDelete([...selectedIds]); exitSelection(); } }} style={{ flex: 1, padding: '10px 8px', borderRadius: '10px', border: '1px solid var(--danger)', background: 'transparent', color: 'var(--danger)', cursor: 'pointer', fontSize: '12px', fontWeight: '600', minWidth: '0' }}>🗑 Delete</button>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}

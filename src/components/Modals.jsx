import { useCurrency } from './CurrencyContext';
import { useState, useRef, useEffect } from 'react';
import * as Icons from './Icons';
import { tc } from '../utils/themeColors';
import { DEFAULT_CATEGORIES, DEBT_TYPES, SAVINGS_CATEGORIES } from '../data/initialData';
import { EmojiPicker } from './SavingsPanel';
import haptic from '../utils/haptics';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  DragOverlay,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// Move to next text field on Enter/Next, dismiss keyboard only at last field
const handleNext = (e) => {
  if (e.key === 'Enter') {
    e.preventDefault();
    window.moveFocusToNext?.(e.target);
  }
};

// ══════════════════════════════════════
// Add Bill Screen (full-page, keyboard-safe)
// ══════════════════════════════════════
export function AddBillScreen({ show, onClose, newBill, setNewBill, handleAddBill, categories, validationErrors, setValidationErrors, emptyBill }) {
  const handleClose = () => { haptic.light(); onClose(); setValidationErrors({}); setNewBill({ ...emptyBill }); };
  return (
    <div className={`form-screen ${show ? 'open' : ''}`}>
      <div className="form-screen-inner">
      <div className="form-screen-header">
        <button onClick={handleClose} style={{ background: 'none', border: 'none', color: 'var(--text-primary)', cursor: 'pointer', padding: '4px', display: 'flex', alignItems: 'center', flexShrink: 0 }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M12 5l-7 7 7 7"/>
          </svg>
        </button>
        <h2 className="font-display" style={{ fontSize: '20px' }}>Add New Bill</h2>
      </div>
      <div className="form-screen-body">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <label style={{ display: 'block', color: 'var(--text-secondary)', fontSize: '13px', marginBottom: '8px', fontWeight: '500' }}>Bill Name</label>
            <input className={`input ${validationErrors['bill-name'] ? 'input-error' : ''}`} placeholder="e.g., Electric Bill" value={newBill.name}
              onChange={(e) => { setNewBill({ ...newBill, name: e.target.value }); setValidationErrors((v) => { const n = { ...v }; delete n['bill-name']; return n; }); }}
              onKeyDown={handleNext} />
          </div>
          <div>
            <label style={{ display: 'block', color: 'var(--text-secondary)', fontSize: '13px', marginBottom: '8px', fontWeight: '500' }}>Category</label>
            <select className="input" value={newBill.category} onChange={(e) => setNewBill({ ...newBill, category: e.target.value })}>
              {categories.filter(c => c !== 'ALL').map((cat) => (<option key={cat} value={cat}>{cat}</option>))}
            </select>
          </div>
          <div>
            <label style={{ display: 'block', color: 'var(--text-secondary)', fontSize: '13px', marginBottom: '8px', fontWeight: '500' }}>Amount</label>
            <input type="number" className={`input ${validationErrors['bill-amount'] ? 'input-error' : ''}`} placeholder="0.00" value={newBill.amount}
              onChange={(e) => { setNewBill({ ...newBill, amount: e.target.value }); setValidationErrors((v) => { const n = { ...v }; delete n['bill-amount']; return n; }); }}
              onKeyDown={handleNext} />
          </div>
          <div>
            <label style={{ display: 'block', color: 'var(--text-secondary)', fontSize: '13px', marginBottom: '8px', fontWeight: '500' }}>Bill Type</label>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button type="button" onClick={() => { haptic.light(); setNewBill({ ...newBill, recurring: true, frequency: 'Monthly' }); }} style={{ flex: 1, padding: '10px', borderRadius: '10px', border: newBill.recurring ? '2px solid var(--accent-primary)' : '1px solid var(--border)', background: newBill.recurring ? tc.infoTint : 'var(--glass)', color: newBill.recurring ? tc.info : 'var(--text-muted)', cursor: 'pointer', fontSize: '14px', fontWeight: '500' }}>↻ Recurring</button>
              <button type="button" onClick={() => { haptic.light(); setNewBill({ ...newBill, recurring: false, frequency: 'One-off' }); }} style={{ flex: 1, padding: '10px', borderRadius: '10px', border: !newBill.recurring ? '2px solid var(--warning)' : '1px solid var(--border)', background: !newBill.recurring ? tc.warningTint : 'var(--glass)', color: !newBill.recurring ? tc.warning : 'var(--text-muted)', cursor: 'pointer', fontSize: '14px', fontWeight: '500' }}>One-off</button>
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
          {newBill.recurring && (
            <button type="button" onClick={() => { haptic.light(); setNewBill({ ...newBill, autoPay: !newBill.autoPay }); }}
              style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '13px', fontWeight: '500',
                border: newBill.autoPay ? `2px solid ${tc.success}` : '1px solid var(--border)',
                background: newBill.autoPay ? tc.successTintLight : 'var(--glass)',
                color: newBill.autoPay ? tc.success : 'var(--text-secondary)',
              }}>
              <div>
                <div>{newBill.autoPay ? '✓ Direct Debit / Auto-pay' : 'Manual Payment'}</div>
                <div style={{ fontSize: '11px', fontWeight: '400', marginTop: '2px', opacity: 0.7 }}>
                  {newBill.autoPay ? 'Auto-marks as paid on due date' : 'You\'ll confirm payment manually'}
                </div>
              </div>
              <span style={{ fontSize: '11px', fontWeight: '600' }}>{newBill.autoPay ? 'ON' : 'OFF'}</span>
            </button>
          )}
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
              <input type="number" className="input" placeholder="1-31" min="1" max="31" value={newBill.paymentDate} onChange={(e) => { const v = e.target.value; if (v === '') { setNewBill({ ...newBill, paymentDate: '' }); return; } const n = parseInt(v); if (!isNaN(n)) setNewBill({ ...newBill, paymentDate: String(Math.min(31, Math.max(1, n))) }); }} onKeyDown={handleNext} />
            </div>
          ) : newBill.frequency === 'Quarterly' ? (
            <div style={{ display: 'flex', gap: '12px' }}>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', color: 'var(--text-secondary)', fontSize: '13px', marginBottom: '8px', fontWeight: '500' }}>Day of month</label>
                <input type="number" className="input" placeholder="1-31" min="1" max="31" value={newBill.paymentDate} onChange={(e) => { const v = e.target.value; if (v === '') { setNewBill({ ...newBill, paymentDate: '' }); return; } const n = parseInt(v); if (!isNaN(n)) setNewBill({ ...newBill, paymentDate: String(Math.min(31, Math.max(1, n))) }); }} onKeyDown={handleNext} />
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
            <button className="btn btn-secondary" onClick={handleClose} style={{ flex: 1, justifyContent: 'center' }}>Cancel</button>
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
// ── Drag handle icon ─────────────────────────────────────────────────────────
// Visual-only grip dots — no interaction, purely an affordance indicator
function GripDots() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '36px', height: '48px', flexShrink: 0, color: 'var(--text-muted)', opacity: 0.35, pointerEvents: 'none' }}>
      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
        <circle cx="9" cy="5" r="1.5"/><circle cx="15" cy="5" r="1.5"/>
        <circle cx="9" cy="12" r="1.5"/><circle cx="15" cy="12" r="1.5"/>
        <circle cx="9" cy="19" r="1.5"/><circle cx="15" cy="19" r="1.5"/>
      </svg>
    </div>
  );
}

// ── Sortable category row ─────────────────────────────────────────────────────
// Strategy: row has touchAction:none (required for dnd-kit's 500ms hold to work),
// but we add native touchmove listeners that manually scroll the container
// during the pre-activation window. Once isDragging flips true, we stop scrolling
// and let dnd-kit own the touch entirely.
function SortableCategoryRow({ cat, bills, isEditing, editValue, setEditValue, onStartEdit, onCommitEdit, onCancelEdit, onDelete }) {
  const isDefault = DEFAULT_CATEGORIES.includes(cat);
  const count = bills.filter((b) => b.category === cat).length;
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: cat });
  const nodeRef = useRef(null);
  const isDraggingRef = useRef(false);
  isDraggingRef.current = isDragging;

  // Combine dnd-kit's ref with our own
  const setRefs = (el) => { nodeRef.current = el; setNodeRef(el); };

  // Native touch listeners: manually scroll the container until dnd-kit activates.
  // This runs outside React's event system so it doesn't conflict with dnd-kit's listeners.
  useEffect(() => {
    const el = nodeRef.current;
    if (!el) return;
    let startY = null;
    const onTouchStart = (e) => { startY = e.touches[0].clientY; };
    const onTouchMove = (e) => {
      if (isDraggingRef.current || startY === null) return;
      const container = el.closest('.form-screen-body');
      if (!container) return;
      const delta = startY - e.touches[0].clientY;
      container.scrollTop += delta;
      startY = e.touches[0].clientY;
    };
    const onTouchEnd = () => { startY = null; };
    el.addEventListener('touchstart', onTouchStart, { passive: true });
    el.addEventListener('touchmove', onTouchMove, { passive: true });
    el.addEventListener('touchend', onTouchEnd, { passive: true });
    return () => {
      el.removeEventListener('touchstart', onTouchStart);
      el.removeEventListener('touchmove', onTouchMove);
      el.removeEventListener('touchend', onTouchEnd);
    };
  }, []);

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0 : 1,
  };

  return (
    <div ref={setRefs} style={style}>
      <div style={{ background: 'var(--glass)', borderRadius: '12px', border: `1px solid ${isEditing ? 'var(--accent)' : 'var(--border)'}`, overflow: 'hidden' }}>
        {isEditing ? (
          <div style={{ display: 'flex', gap: '8px', padding: '10px 12px', alignItems: 'center' }}>
            <input className="input" value={editValue} onChange={(e) => setEditValue(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); onCommitEdit(); } if (e.key === 'Escape') onCancelEdit(); }}
              autoFocus style={{ flex: 1, padding: '8px 12px', fontSize: '14px' }} />
            <button onClick={onCommitEdit} className="btn btn-primary" style={{ padding: '8px 14px', fontSize: '13px', flexShrink: 0 }}>Save</button>
            <button onClick={onCancelEdit} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px', flexShrink: 0 }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>
        ) : (
          <div {...listeners} {...attributes} style={{ display: 'flex', alignItems: 'center', paddingRight: '8px', touchAction: 'none', userSelect: 'none' }}>
            <GripDots />
            <div style={{ flex: 1, minWidth: 0, padding: '12px 0' }}>
              <span style={{ fontWeight: '500', fontSize: '14px' }}>{cat}</span>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)', marginLeft: '8px' }}>{count} bills</span>
            </div>
            {isDefault ? (
              <span style={{ fontSize: '11px', color: 'var(--text-muted)', padding: '3px 8px', background: 'var(--bg-primary)', borderRadius: '6px', flexShrink: 0 }}>Default</span>
            ) : (
              <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexShrink: 0 }}>
                <span style={{ fontSize: '11px', fontWeight: '600', color: 'var(--accent)', padding: '3px 8px', background: 'color-mix(in srgb, var(--accent) 12%, transparent)', borderRadius: '6px', letterSpacing: '0.02em' }}>Custom</span>
                <button onClick={(e) => { e.stopPropagation(); onStartEdit(); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '4px' }}><Icons.Edit size={16} /></button>
                <button onClick={(e) => { e.stopPropagation(); onDelete(); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: count > 0 ? 'var(--text-muted)' : tc.danger, padding: '4px', opacity: count > 0 ? 0.5 : 1 }}><Icons.Trash size={16} /></button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Ghost card shown under finger while dragging ──────────────────────────────
function DragOverlayCard({ cat, bills }) {
  const count = bills.filter((b) => b.category === cat).length;
  const isDefault = DEFAULT_CATEGORIES.includes(cat);
  return (
    <div style={{ background: 'var(--glass)', borderRadius: '12px', border: '1px solid var(--accent)', boxShadow: '0 8px 24px rgba(0,0,0,0.18)', overflow: 'hidden' }}>
      <div style={{ display: 'flex', alignItems: 'center', paddingRight: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '32px', height: '44px', color: 'var(--accent)' }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <circle cx="9" cy="5" r="1.5"/><circle cx="15" cy="5" r="1.5"/>
            <circle cx="9" cy="12" r="1.5"/><circle cx="15" cy="12" r="1.5"/>
            <circle cx="9" cy="19" r="1.5"/><circle cx="15" cy="19" r="1.5"/>
          </svg>
        </div>
        <div style={{ flex: 1, minWidth: 0, padding: '12px 0' }}>
          <span style={{ fontWeight: '500', fontSize: '14px' }}>{cat}</span>
          <span style={{ fontSize: '12px', color: 'var(--text-muted)', marginLeft: '8px' }}>{count} bills</span>
        </div>
        {isDefault
          ? <span style={{ fontSize: '11px', color: 'var(--text-muted)', padding: '3px 8px', background: 'var(--bg-primary)', borderRadius: '6px', flexShrink: 0, marginRight: '8px' }}>Default</span>
          : <span style={{ fontSize: '11px', fontWeight: '600', color: 'var(--accent)', padding: '3px 8px', background: 'color-mix(in srgb, var(--accent) 12%, transparent)', borderRadius: '6px', flexShrink: 0, marginRight: '8px' }}>Custom</span>
        }
      </div>
    </div>
  );
}

export function ManageCategoriesModal({ show, onClose, bills, customCategories, categoryOrder, newCategoryName, setNewCategoryName, handleAddCategory, handleDeleteCategory, handleRenameCategory, handleMoveCategory, debts, customDebtTypes, setCustomDebtTypes, savings, customSavingsCategories, setCustomSavingsCategories, defaultSection }) {
  const [categoryError, setCategoryError] = useState(false);
  const [newDebtType, setNewDebtType] = useState('');
  const [newSavingsCat, setNewSavingsCat] = useState('');
  const [showBillSection, setShowBillSection] = useState(true);
  const [showDebtSection, setShowDebtSection] = useState(false);
  const [showSavingsSection, setShowSavingsSection] = useState(false);
  const [editingCat, setEditingCat] = useState(null);
  const [editValue, setEditValue] = useState('');
  const [activeDragCat, setActiveDragCat] = useState(null);
  const [pendingDelete, setPendingDelete] = useState(null);

  // When modal opens, expand the requested section
  useEffect(() => {
    if (!show) return;
    setShowBillSection(defaultSection === 'debts' ? false : defaultSection === 'savings' ? false : true);
    setShowDebtSection(defaultSection === 'debts');
    setShowSavingsSection(defaultSection === 'savings');
  }, [show, defaultSection]);

  const handleClose = () => { haptic.light(); onClose(); setCategoryError(false); setEditingCat(null); setPendingDelete(null); };
  const handleAdd = () => {
    if (!newCategoryName.trim()) { haptic.warning(); setCategoryError(true); return; }
    haptic.light(); setCategoryError(false); handleAddCategory(); document.activeElement.blur();
  };
  const startEdit = (cat) => { haptic.light(); setEditingCat(cat); setEditValue(cat); };
  const commitEdit = () => {
    if (!editValue.trim()) { haptic.warning(); return; }
    handleRenameCategory(editingCat, editValue); setEditingCat(null);
  };
  const cancelEdit = () => { haptic.light(); setEditingCat(null); };

  const orderedList = categoryOrder.filter(c => DEFAULT_CATEGORIES.includes(c) || customCategories.includes(c));

  // 500ms hold to activate drag. tolerance:8 means moving ≤8px during the hold
  // keeps the timer alive (handles finger jitter). Moving more cancels it — the
  // native touchmove listener on each row handles scrolling during that window.
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { delay: 500, tolerance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 500, tolerance: 8 } }),
  );

  const handleDragStart = ({ active }) => { haptic.light(); setActiveDragCat(active.id); };
  const handleDragEnd = ({ active, over }) => {
    setActiveDragCat(null);
    if (!over || active.id === over.id) return;
    const oldIndex = orderedList.indexOf(active.id);
    const newIndex = orderedList.indexOf(over.id);
    const reordered = arrayMove(orderedList, oldIndex, newIndex);
    haptic.light();
    // Propagate new order up to App via a full replacement
    handleMoveCategory(reordered);
  };

  return (
    <div className={`form-screen ${show ? 'open' : ''}`}>
      <div className="form-screen-inner">
        <div className="form-screen-header">
          <button onClick={handleClose} style={{ background: 'none', border: 'none', color: 'var(--text-primary)', cursor: 'pointer', padding: '4px', display: 'flex', alignItems: 'center', flexShrink: 0 }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5M12 5l-7 7 7 7"/>
            </svg>
          </button>
          <h2 className="font-display" style={{ fontSize: '20px' }}>Manage Categories</h2>
        </div>
        <div className="form-screen-body">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {/* ── Bill Categories Section ── */}
            <div>
              <button onClick={() => { haptic.light(); setShowBillSection(v => !v); }}
                style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'none', border: 'none', cursor: 'pointer', padding: '0', marginBottom: showBillSection ? '12px' : '0' }}>
                <span style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: '500' }}>BILL CATEGORIES</span>
                <span style={{ color: 'var(--text-muted)', transition: 'transform 0.2s', transform: showBillSection ? 'rotate(180deg)' : 'none', display: 'flex' }}><Icons.ChevronDown size={16} /></span>
              </button>
              {showBillSection && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div>
                    <label style={{ display: 'block', color: categoryError ? tc.danger : 'var(--text-secondary)', fontSize: '13px', marginBottom: '8px', fontWeight: '500' }}>Add New Category</label>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <input className={`input${categoryError ? ' input-error' : ''}`} placeholder="e.g., GROCERIES" value={newCategoryName}
                        onChange={(e) => { setNewCategoryName(e.target.value); if (categoryError) setCategoryError(false); }}
                        onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAdd(); } }} style={{ flex: 1 }} />
                      <button className="btn btn-primary" onMouseDown={(e) => { e.preventDefault(); handleAdd(); }}><Icons.Plus size={18} /></button>
                    </div>
                  </div>
                  <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
                    <SortableContext items={orderedList} strategy={verticalListSortingStrategy}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {orderedList.map((cat) => (
                          <SortableCategoryRow key={cat} cat={cat} bills={bills}
                            isEditing={editingCat === cat} editValue={editValue} setEditValue={setEditValue}
                            onStartEdit={() => startEdit(cat)} onCommitEdit={commitEdit} onCancelEdit={cancelEdit}
                            onDelete={() => { haptic.light(); setPendingDelete(cat); }} />
                        ))}
                      </div>
                    </SortableContext>
                    <DragOverlay dropAnimation={{ duration: 180, easing: 'ease' }}>
                      {activeDragCat ? <DragOverlayCard cat={activeDragCat} bills={bills} /> : null}
                    </DragOverlay>
                  </DndContext>
                </div>
              )}
            </div>

            {/* ── Debt Types Section ── */}
            <div>
              <button onClick={() => { haptic.light(); setShowDebtSection(v => !v); }}
                style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'none', border: 'none', cursor: 'pointer', padding: '0', marginBottom: showDebtSection ? '12px' : '0' }}>
                <span style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: '500' }}>DEBT TYPES</span>
                <span style={{ color: 'var(--text-muted)', transition: 'transform 0.2s', transform: showDebtSection ? 'rotate(180deg)' : 'none', display: 'flex' }}><Icons.ChevronDown size={16} /></span>
              </button>
              {showDebtSection && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <input className="input" placeholder="e.g., Overdraft" value={newDebtType}
                      onChange={(e) => setNewDebtType(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); const name = newDebtType.trim(); if (!name) return; if ([...DEBT_TYPES, ...customDebtTypes].includes(name)) { haptic.warning(); return; } setCustomDebtTypes(prev => [...prev, name]); setNewDebtType(''); haptic.medium(); } }}
                      style={{ flex: 1 }} />
                    <button className="btn btn-primary" onClick={() => { const name = newDebtType.trim(); if (!name) return; if ([...DEBT_TYPES, ...customDebtTypes].includes(name)) { haptic.warning(); return; } setCustomDebtTypes(prev => [...prev, name]); setNewDebtType(''); haptic.medium(); }}><Icons.Plus size={18} /></button>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {DEBT_TYPES.map(t => (
                      <div key={t} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', borderRadius: '10px', background: 'var(--glass)', border: '1px solid var(--border)' }}>
                        <span style={{ fontSize: '14px', fontWeight: '500' }}>{t}</span>
                        <span style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: '600', textTransform: 'uppercase' }}>Default</span>
                      </div>
                    ))}
                    {customDebtTypes.map(t => (
                      <div key={t} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', borderRadius: '10px', background: 'var(--glass)', border: '1px solid var(--border)' }}>
                        <span style={{ fontSize: '14px', fontWeight: '500' }}>{t}</span>
                        <button onClick={() => {
                          const inUse = debts.some(d => d.type === t);
                          if (inUse) { haptic.warning(); return; }
                          haptic.error(); setCustomDebtTypes(prev => prev.filter(x => x !== t));
                        }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: tc.danger, padding: '2px' }}><Icons.Trash size={14} /></button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* ── Savings Categories Section ── */}
            <div>
              <button onClick={() => { haptic.light(); setShowSavingsSection(v => !v); }}
                style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'none', border: 'none', cursor: 'pointer', padding: '0', marginBottom: showSavingsSection ? '12px' : '0' }}>
                <span style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: '500' }}>SAVINGS CATEGORIES</span>
                <span style={{ color: 'var(--text-muted)', transition: 'transform 0.2s', transform: showSavingsSection ? 'rotate(180deg)' : 'none', display: 'flex' }}><Icons.ChevronDown size={16} /></span>
              </button>
              {showSavingsSection && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <input className="input" placeholder="e.g., Wedding" value={newSavingsCat}
                      onChange={(e) => setNewSavingsCat(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); const name = newSavingsCat.trim(); if (!name) return; if ([...SAVINGS_CATEGORIES, ...customSavingsCategories].includes(name)) { haptic.warning(); return; } setCustomSavingsCategories(prev => [...prev, name]); setNewSavingsCat(''); haptic.medium(); } }}
                      style={{ flex: 1 }} />
                    <button className="btn btn-primary" onClick={() => { const name = newSavingsCat.trim(); if (!name) return; if ([...SAVINGS_CATEGORIES, ...customSavingsCategories].includes(name)) { haptic.warning(); return; } setCustomSavingsCategories(prev => [...prev, name]); setNewSavingsCat(''); haptic.medium(); }}><Icons.Plus size={18} /></button>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {SAVINGS_CATEGORIES.map(c => (
                      <div key={c} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', borderRadius: '10px', background: 'var(--glass)', border: '1px solid var(--border)' }}>
                        <span style={{ fontSize: '14px', fontWeight: '500' }}>{c}</span>
                        <span style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: '600', textTransform: 'uppercase' }}>Default</span>
                      </div>
                    ))}
                    {customSavingsCategories.map(c => (
                      <div key={c} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', borderRadius: '10px', background: 'var(--glass)', border: '1px solid var(--border)' }}>
                        <span style={{ fontSize: '14px', fontWeight: '500' }}>{c}</span>
                        <button onClick={() => {
                          const inUse = savings.some(s => s.category === c);
                          if (inUse) { haptic.warning(); return; }
                          haptic.error(); setCustomSavingsCategories(prev => prev.filter(x => x !== c));
                        }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: tc.danger, padding: '2px' }}><Icons.Trash size={14} /></button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* In-app delete confirmation sheet */}
      {pendingDelete && (
        <div style={{ position: 'absolute', inset: 0, zIndex: 10, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', background: 'rgba(0,0,0,0.4)' }}
          onClick={() => { haptic.light(); setPendingDelete(null); }}>
          <div onClick={(e) => e.stopPropagation()}
            style={{ background: 'var(--bg-primary)', borderRadius: '20px 20px 0 0', padding: '24px 20px', paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 24px)', borderTop: '1px solid var(--border)' }}>
            <p style={{ fontWeight: '600', fontSize: '16px', marginBottom: '6px', color: 'var(--text-primary)' }}>Delete "{pendingDelete}"?</p>
            <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '20px' }}>This category will be permanently removed.</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <button className="btn" onClick={() => { handleDeleteCategory(pendingDelete); setPendingDelete(null); }}
                style={{ width: '100%', justifyContent: 'center', background: tc.danger, color: '#fff', border: 'none', fontWeight: '600' }}>
                Delete
              </button>
              <button className="btn btn-secondary" onClick={() => { haptic.light(); setPendingDelete(null); }}
                style={{ width: '100%', justifyContent: 'center' }}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ══════════════════════════════════════
// Add Debt Screen (full-page, keyboard-safe)
// ══════════════════════════════════════
export function AddDebtScreen({ show, onClose, newDebt, setNewDebt, handleAddDebt, emptyDebt, validationErrors, setValidationErrors, allDebtTypes }) {
  const cs = useCurrency();
  const handleClose = () => { haptic.light(); onClose(); setValidationErrors({}); setNewDebt({ ...emptyDebt }); };
  const mode = newDebt.paymentMode || 'recurring';
  const total = parseFloat(newDebt.totalAmount) || 0;
  const installMonths = parseInt(newDebt.installmentMonths) || 0;
  const bnplMonths = parseInt(newDebt.bnplPromoMonths) || 0;
  const installmentMonthly = installMonths > 0 && total > 0 ? Math.ceil((total / installMonths) * 100) / 100 : 0;
  const bnplMonthly = bnplMonths > 0 && total > 0 ? Math.ceil((total / bnplMonths) * 100) / 100 : 0;
  return (
    <div className={`form-screen ${show ? 'open' : ''}`}>
      <div className="form-screen-inner">
      <div className="form-screen-header">
        <button onClick={handleClose} style={{ background: 'none', border: 'none', color: 'var(--text-primary)', cursor: 'pointer', padding: '4px', display: 'flex', alignItems: 'center', flexShrink: 0 }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M12 5l-7 7 7 7"/>
          </svg>
        </button>
        <h2 className="font-display" style={{ fontSize: '20px' }}>Add Debt</h2>
      </div>
      <div className="form-screen-body">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <label style={{ display: 'block', color: 'var(--text-secondary)', fontSize: '13px', marginBottom: '8px', fontWeight: '500' }}>Name</label>
            <input className={`input ${validationErrors?.['debt-name'] ? 'input-error' : ''}`} placeholder="e.g., Barclaycard" value={newDebt.name} onChange={(e) => { setNewDebt({ ...newDebt, name: e.target.value }); if (validationErrors?.['debt-name']) { const v = { ...validationErrors }; delete v['debt-name']; setValidationErrors(v); } }} onKeyDown={handleNext} />
          </div>
          <div>
            <label style={{ display: 'block', color: 'var(--text-secondary)', fontSize: '13px', marginBottom: '8px', fontWeight: '500' }}>Type</label>
            <select className="input" value={newDebt.type} onChange={(e) => setNewDebt({ ...newDebt, type: e.target.value })}>
              {(allDebtTypes || DEBT_TYPES).map((t) => (<option key={t} value={t}>{t}</option>))}
            </select>
          </div>
          <div>
            <label style={{ display: 'block', color: 'var(--text-secondary)', fontSize: '13px', marginBottom: '8px', fontWeight: '500' }}>Total Amount Owed</label>
            <input type="number" className={`input ${validationErrors?.['debt-amount'] ? 'input-error' : ''}`} placeholder="0.00" value={newDebt.totalAmount} onChange={(e) => { setNewDebt({ ...newDebt, totalAmount: e.target.value }); if (validationErrors?.['debt-amount']) { const v = { ...validationErrors }; delete v['debt-amount']; setValidationErrors(v); } }} onKeyDown={handleNext} />
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
                <button key={opt.key} type="button" onClick={() => { haptic.light(); setNewDebt({ ...newDebt, paymentMode: opt.key }); setValidationErrors({}); }}
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
              <div style={{ display: 'grid', gridTemplateColumns: newDebt.type === 'Credit Card' ? '1fr 1fr' : '1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', color: 'var(--text-secondary)', fontSize: '13px', marginBottom: '8px', fontWeight: '500' }}>Interest Rate (% APR)</label>
                  <input type="number" className="input" placeholder="0" value={newDebt.interestRate} onChange={(e) => setNewDebt({ ...newDebt, interestRate: e.target.value })} onKeyDown={handleNext} />
                </div>
                {newDebt.type === 'Credit Card' && (
                  <div>
                    <label style={{ display: 'block', color: 'var(--text-secondary)', fontSize: '13px', marginBottom: '8px', fontWeight: '500' }}>Credit Limit</label>
                    <input type="number" className="input" placeholder="e.g. 5000" value={newDebt.creditLimit || ''} onChange={(e) => setNewDebt({ ...newDebt, creditLimit: e.target.value })} onKeyDown={handleNext} />
                  </div>
                )}
              </div>
              {/* Minimum Payment Mode */}
              <div>
                <label style={{ display: 'block', color: 'var(--text-secondary)', fontSize: '13px', marginBottom: '8px', fontWeight: '500' }}>Minimum Payment</label>
                <div style={{ display: 'flex', gap: '6px', marginBottom: '10px' }}>
                  <button type="button" onClick={() => { haptic.light(); setNewDebt({ ...newDebt, minPaymentMode: 'fixed' }); }}
                    style={{ flex: 1, padding: '8px', borderRadius: '8px', fontSize: '12px', fontWeight: '500', cursor: 'pointer', textAlign: 'center',
                      border: (newDebt.minPaymentMode || 'fixed') === 'fixed' ? `2px solid ${tc.info}` : '1px solid var(--border)',
                      background: (newDebt.minPaymentMode || 'fixed') === 'fixed' ? tc.infoTint : 'var(--glass)',
                      color: (newDebt.minPaymentMode || 'fixed') === 'fixed' ? tc.info : 'var(--text-muted)',
                    }}>Fixed Amount</button>
                  <button type="button" onClick={() => { haptic.light(); setNewDebt({ ...newDebt, minPaymentMode: 'percentage' }); }}
                    style={{ flex: 1, padding: '8px', borderRadius: '8px', fontSize: '12px', fontWeight: '500', cursor: 'pointer', textAlign: 'center',
                      border: newDebt.minPaymentMode === 'percentage' ? `2px solid ${tc.purple}` : '1px solid var(--border)',
                      background: newDebt.minPaymentMode === 'percentage' ? tc.purpleTint : 'var(--glass)',
                      color: newDebt.minPaymentMode === 'percentage' ? tc.purple : 'var(--text-muted)',
                    }}>% of Balance</button>
                </div>
                {(newDebt.minPaymentMode || 'fixed') === 'fixed' ? (
                  <input type="number" className="input" placeholder="e.g. 25.00" value={newDebt.minimumPayment} onChange={(e) => setNewDebt({ ...newDebt, minimumPayment: e.target.value })} onKeyDown={handleNext} />
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                      <div>
                        <label style={{ display: 'block', color: 'var(--text-muted)', fontSize: '11px', marginBottom: '4px' }}>% of balance</label>
                        <input type="number" className="input" placeholder="e.g. 2.5" value={newDebt.minPaymentPct || ''} onChange={(e) => setNewDebt({ ...newDebt, minPaymentPct: e.target.value })} onKeyDown={handleNext} />
                      </div>
                      <div>
                        <label style={{ display: 'block', color: 'var(--text-muted)', fontSize: '11px', marginBottom: '4px' }}>Floor (min {cs})</label>
                        <input type="number" className="input" placeholder="e.g. 25" value={newDebt.minPaymentFloor || ''} onChange={(e) => setNewDebt({ ...newDebt, minPaymentFloor: e.target.value })} onKeyDown={handleNext} />
                      </div>
                    </div>
                    {total > 0 && parseFloat(newDebt.minPaymentPct) > 0 && (
                      <div style={{ fontSize: '12px', color: tc.purple, padding: '8px 10px', borderRadius: '8px', background: tc.purpleTint, border: '1px solid rgba(124,58,237,0.15)' }}>
                        Current minimum: {cs}{Math.max(parseFloat(newDebt.minPaymentFloor) || 0, total * (parseFloat(newDebt.minPaymentPct) || 0) / 100 + total * (parseFloat(newDebt.interestRate) || 0) / 100 / 12).toFixed(2)}/mo
                      </div>
                    )}
                  </div>
                )}
              </div>
              <div>
                <label style={{ display: 'block', color: 'var(--text-secondary)', fontSize: '13px', marginBottom: '8px', fontWeight: '500' }}>Auto Monthly Payment</label>
                <input type="number" className="input" placeholder="0.00" value={newDebt.recurringPayment} onChange={(e) => setNewDebt({ ...newDebt, recurringPayment: e.target.value })} onKeyDown={handleNext} />
              </div>
              <div>
                <label style={{ display: 'block', color: 'var(--text-secondary)', fontSize: '13px', marginBottom: '8px', fontWeight: '500' }}>Payment Day</label>
                <input type="number" className="input" placeholder="Day of month (1-31)" min="1" max="31" value={newDebt.paymentDate || ''} onKeyDown={handleNext} onChange={(e) => { const v = e.target.value; if (v === '') { setNewDebt({ ...newDebt, paymentDate: '' }); return; } const n = parseInt(v); if (!isNaN(n)) setNewDebt({ ...newDebt, paymentDate: String(Math.min(31, Math.max(1, n))) }); }} />
              </div>

              {/* Balance Transfer */}
              {(newDebt.type === 'Credit Card' || newDebt.balanceTransfer) && (
                <div>
                  <button type="button" onClick={() => { haptic.light(); setNewDebt({ ...newDebt, balanceTransfer: !newDebt.balanceTransfer }); }}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '13px', fontWeight: '500',
                      border: newDebt.balanceTransfer ? `2px solid ${tc.info}` : '1px solid var(--border)',
                      background: newDebt.balanceTransfer ? tc.infoTint : 'var(--glass)',
                      color: newDebt.balanceTransfer ? tc.info : 'var(--text-secondary)',
                    }}>
                    <span>0% Balance Transfer</span>
                    <span style={{ fontSize: '11px', fontWeight: '600' }}>{newDebt.balanceTransfer ? 'ON' : 'OFF'}</span>
                  </button>
                  {newDebt.balanceTransfer && (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '12px' }}>
                      <div>
                        <label style={{ display: 'block', color: 'var(--text-secondary)', fontSize: '13px', marginBottom: '8px', fontWeight: '500' }}>0% Ends</label>
                        <input type="date" className={`input ${newDebt.btEndDate ? 'has-value' : ''}`} value={newDebt.btEndDate || ''} onChange={(e) => setNewDebt({ ...newDebt, btEndDate: e.target.value })} />
                      </div>
                      <div>
                        <label style={{ display: 'block', color: 'var(--text-secondary)', fontSize: '13px', marginBottom: '8px', fontWeight: '500' }}>Revert APR %</label>
                        <input type="number" className="input" placeholder="e.g. 24.9" value={newDebt.btRevertRate || ''} onChange={(e) => setNewDebt({ ...newDebt, btRevertRate: e.target.value })} onKeyDown={handleNext} />
                      </div>
                    </div>
                  )}
                </div>
              )}
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
                    {isOverdue ? <><Icons.Warning size={13} style={{ verticalAlign: '-2px' }} /> This date is {Math.abs(daysUntil)} days overdue</> : `Due in ${daysUntil} days (${due.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })})`}
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
                  <input type="number" className={`input ${validationErrors?.['debt-installmentMonths'] ? 'input-error' : ''}`} placeholder="e.g., 12" value={newDebt.installmentMonths} onChange={(e) => { setNewDebt({ ...newDebt, installmentMonths: e.target.value }); if (validationErrors?.['debt-installmentMonths']) { const v = { ...validationErrors }; delete v['debt-installmentMonths']; setValidationErrors(v); } }} onKeyDown={handleNext} />
                </div>
                <div>
                  <label style={{ display: 'block', color: 'var(--text-secondary)', fontSize: '13px', marginBottom: '8px', fontWeight: '500' }}>Start Date</label>
                  <input type="date" className={`input ${newDebt.installmentStartDate ? 'has-value' : ''} ${validationErrors?.['debt-installmentStartDate'] ? 'input-error' : ''}`} value={newDebt.installmentStartDate || ''} onChange={(e) => { setNewDebt({ ...newDebt, installmentStartDate: e.target.value }); if (validationErrors?.['debt-installmentStartDate']) { const v = { ...validationErrors }; delete v['debt-installmentStartDate']; setValidationErrors(v); } }} />
                </div>
              </div>
              <div>
                <label style={{ display: 'block', color: 'var(--text-secondary)', fontSize: '13px', marginBottom: '8px', fontWeight: '500' }}>Interest Rate (% APR)</label>
                <input type="number" className="input" placeholder="0 (often 0% for finance)" value={newDebt.interestRate} onChange={(e) => setNewDebt({ ...newDebt, interestRate: e.target.value })} onKeyDown={handleNext} />
              </div>
              {installmentMonthly > 0 && (
                <div style={{ padding: '10px 14px', background: tc.purpleTint, borderRadius: '10px', border: '1px solid rgba(167,139,250,0.2)', fontSize: '13px', color: tc.purple }}>
                  Monthly payment: <strong>{cs}{installmentMonthly.toFixed(2)}</strong> × {installMonths} months
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
                  <input type="number" className={`input ${validationErrors?.['debt-bnplPromoMonths'] ? 'input-error' : ''}`} placeholder="e.g., 12" value={newDebt.bnplPromoMonths} onChange={(e) => { setNewDebt({ ...newDebt, bnplPromoMonths: e.target.value }); if (validationErrors?.['debt-bnplPromoMonths']) { const v = { ...validationErrors }; delete v['debt-bnplPromoMonths']; setValidationErrors(v); } }} onKeyDown={handleNext} />
                </div>
                <div>
                  <label style={{ display: 'block', color: 'var(--text-secondary)', fontSize: '13px', marginBottom: '8px', fontWeight: '500' }}>Start Date</label>
                  <input type="date" className={`input ${newDebt.bnplStartDate ? 'has-value' : ''} ${validationErrors?.['debt-bnplStartDate'] ? 'input-error' : ''}`} value={newDebt.bnplStartDate || ''} onChange={(e) => { setNewDebt({ ...newDebt, bnplStartDate: e.target.value }); if (validationErrors?.['debt-bnplStartDate']) { const v = { ...validationErrors }; delete v['debt-bnplStartDate']; setValidationErrors(v); } }} />
                </div>
              </div>
              {bnplMonthly > 0 && (
                <div style={{ padding: '10px 14px', background: tc.successTint, borderRadius: '10px', border: '1px solid rgba(16,185,129,0.2)', fontSize: '13px', color: tc.success }}>
                  Pay <strong>{cs}{bnplMonthly.toFixed(2)}/mo</strong> to clear within {bnplMonths} months interest-free
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
                    {isExpired ? <><Icons.Warning size={13} style={{ verticalAlign: '-2px' }} /> Interest-free period already expired!</> : <><Icons.CircleDot size={13} style={{ verticalAlign: '-2px', color: 'currentColor' }} /> Interest-free · {remaining} of {bnplMonths} months remaining</>}
                  </div>
                );
              })()}
              <div style={{ padding: '12px', background: 'var(--glass)', borderRadius: '10px', border: '1px solid var(--border)' }}>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '8px', fontWeight: '500' }}>IF NOT CLEARED BY END DATE:</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  <div>
                    <label style={{ display: 'block', color: 'var(--text-secondary)', fontSize: '12px', marginBottom: '4px' }}>Interest Rate (%)</label>
                    <input type="number" className="input" placeholder="e.g., 29.9" value={newDebt.bnplPostInterest} onChange={(e) => setNewDebt({ ...newDebt, bnplPostInterest: e.target.value })} onKeyDown={handleNext} />
                  </div>
                  <div>
                    <label style={{ display: 'block', color: 'var(--text-secondary)', fontSize: '12px', marginBottom: '4px' }}>Monthly Payment</label>
                    <input type="number" className="input" placeholder="0.00" value={newDebt.bnplPostPayment} onChange={(e) => setNewDebt({ ...newDebt, bnplPostPayment: e.target.value })} onKeyDown={handleNext} />
                  </div>
                </div>
              </div>
            </>
          )}

          <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
            <button className="btn btn-primary" onClick={handleAddDebt} style={{ flex: 1, justifyContent: 'center' }}><Icons.Plus size={20} /> Add Debt</button>
            <button className="btn btn-secondary" onClick={handleClose} style={{ flex: 1, justifyContent: 'center' }}>Cancel</button>
          </div>
        </div>
      </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════
// Add Savings Screen (full-page, keyboard-safe)
// ══════════════════════════════════════
export function AddSavingsScreen({ show, onClose, newSavingsGoal, setNewSavingsGoal, handleAddSavings, emptySavings, validationErrors, setValidationErrors, allSavingsCategories }) {
  const handleClose = () => { haptic.light(); onClose(); setNewSavingsGoal({ ...emptySavings }); setValidationErrors({}); };
  return (
    <div className={`form-screen ${show ? 'open' : ''}`}>
      <div className="form-screen-inner">
      <div className="form-screen-header">
        <button onClick={handleClose} style={{ background: 'none', border: 'none', color: 'var(--text-primary)', cursor: 'pointer', padding: '4px', display: 'flex', alignItems: 'center', flexShrink: 0 }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M12 5l-7 7 7 7"/>
          </svg>
        </button>
        <h2 className="font-display" style={{ fontSize: '20px' }}>Add Savings Goal</h2>
      </div>
      <div className="form-screen-body">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <label style={{ display: 'block', color: 'var(--text-secondary)', fontSize: '13px', marginBottom: '8px', fontWeight: '500' }}>Goal Name</label>
            <input className={`input ${validationErrors?.['savings-name'] ? 'input-error' : ''}`} placeholder="e.g., Holiday Fund" value={newSavingsGoal.name} onChange={(e) => { setNewSavingsGoal({ ...newSavingsGoal, name: e.target.value }); if (validationErrors?.['savings-name']) { const v = { ...validationErrors }; delete v['savings-name']; setValidationErrors(v); } }} onKeyDown={handleNext} />
          </div>
          <div>
            <label style={{ display: 'block', color: 'var(--text-secondary)', fontSize: '13px', marginBottom: '8px', fontWeight: '500' }}>Category</label>
            <select className="input" value={newSavingsGoal.category} onChange={(e) => setNewSavingsGoal({ ...newSavingsGoal, category: e.target.value })}>
              {(allSavingsCategories || SAVINGS_CATEGORIES).map((c) => (<option key={c} value={c}>{c}</option>))}
            </select>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', color: 'var(--text-secondary)', fontSize: '13px', marginBottom: '8px', fontWeight: '500' }}>Starting Amount</label>
              <input type="number" className="input" placeholder="0.00 (optional)" value={newSavingsGoal.startingAmount} onChange={(e) => setNewSavingsGoal({ ...newSavingsGoal, startingAmount: e.target.value })} onKeyDown={handleNext} />
            </div>
            <div>
              <label style={{ display: 'block', color: 'var(--text-secondary)', fontSize: '13px', marginBottom: '8px', fontWeight: '500' }}>Target Amount</label>
              <input type="number" className="input" placeholder="0.00 (optional)" value={newSavingsGoal.targetAmount} onChange={(e) => setNewSavingsGoal({ ...newSavingsGoal, targetAmount: e.target.value })} onKeyDown={handleNext} />
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', color: 'var(--text-secondary)', fontSize: '13px', marginBottom: '8px', fontWeight: '500' }}>Monthly Auto-Save</label>
              <input type="number" className="input" placeholder="0.00 (optional)" value={newSavingsGoal.monthlyContribution} onChange={(e) => setNewSavingsGoal({ ...newSavingsGoal, monthlyContribution: e.target.value })} onKeyDown={handleNext} />
            </div>
            <div>
              <label style={{ display: 'block', color: 'var(--text-secondary)', fontSize: '13px', marginBottom: '8px', fontWeight: '500' }}>Target Date</label>
              <input type="date" className={`input ${newSavingsGoal.targetDate ? 'has-value' : ''}`} value={newSavingsGoal.targetDate || ''} onChange={(e) => setNewSavingsGoal({ ...newSavingsGoal, targetDate: e.target.value })} />
            </div>
          </div>
          <div>
            <label style={{ display: 'block', color: 'var(--text-secondary)', fontSize: '13px', marginBottom: '8px', fontWeight: '500' }}>Goal Emoji (optional)</label>
            <EmojiPicker value={newSavingsGoal.emoji || ''} onChange={(emoji) => setNewSavingsGoal({ ...newSavingsGoal, emoji })} />
          </div>
          <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
            <button className="btn btn-primary" onClick={handleAddSavings} style={{ flex: 1, justifyContent: 'center' }}><Icons.Plus size={20} /> Add Goal</button>
            <button className="btn btn-secondary" onClick={handleClose} style={{ flex: 1, justifyContent: 'center' }}>Cancel</button>
          </div>
        </div>
      </div>
      </div>
    </div>
  );
}
import { useCurrency } from './CurrencyContext';
import React from 'react';
import ReactDOM from 'react-dom';
import * as Icons from './Icons';
import haptic from '../utils/haptics';
import { tc } from '../utils/themeColors';
import { SAVINGS_CATEGORIES } from '../data/initialData';

// ── Reusable InfoSheet (bottom sheet for educational content) ──
function InfoSheet({ open, onClose, title, children }) {
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
    <div onClick={close} style={{ position: 'fixed', inset: 0, zIndex: 10000, background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(3px)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', animation: 'fadeIn 0.15s ease-out' }}>
      <div onClick={(e) => e.stopPropagation()} style={{ width: '100%', maxWidth: '500px', padding: '24px 20px 32px', borderRadius: '20px 20px 0 0', background: 'var(--bg-primary, #0f1225)', border: '1px solid var(--border)', borderBottom: 'none', animation: 'slideInUp 0.25s cubic-bezier(0.32, 0.72, 0, 1)' }}>
        <div style={{ width: '36px', height: '4px', borderRadius: '2px', background: 'var(--border)', margin: '0 auto 16px' }} />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
          <h3 style={{ fontSize: '17px', fontWeight: '700', color: 'var(--text-primary)' }}>{title}</h3>
          <button onClick={close} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '4px' }}><Icons.X size={18} /></button>
        </div>
        <div style={{ fontSize: '14px', lineHeight: 1.6, color: 'var(--text-secondary)' }}>{children}</div>
      </div>
    </div>, document.body
  );
}

function InfoButton({ onClick }) {
  return (
    <button onClick={(e) => { e.stopPropagation(); haptic.light(); onClick(); }}
      style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px', display: 'flex', alignItems: 'center', color: 'var(--text-muted)', opacity: 0.6 }}>
      <Icons.InfoCircle size={15} />
    </button>
  );
}

// ── Milestone celebration overlay ──
function SavingsCelebration({ celebration, onDismiss }) {
  if (!celebration) return null;
  const { milestone, goalName } = celebration;
  const is100 = milestone >= 100;
  React.useEffect(() => {
    const timer = setTimeout(onDismiss, is100 ? 3500 : 2500);
    return () => clearTimeout(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [celebration]);
  const color = is100 ? '#fbbf24' : milestone >= 75 ? '#f97316' : milestone >= 50 ? '#a78bfa' : 'var(--accent-primary)';
  return ReactDOM.createPortal(
    <div onClick={onDismiss} style={{ position: 'fixed', inset: 0, zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', animation: 'fadeIn 0.2s ease-out' }}>
      <div style={{ padding: is100 ? '32px 36px' : '24px 28px', borderRadius: '20px', background: `linear-gradient(135deg, ${color}15, ${color}08)`, border: `1px solid ${color}30`, textAlign: 'center', maxWidth: '300px', animation: 'celebrationIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)', boxShadow: `0 12px 40px rgba(0,0,0,0.3), 0 0 60px ${color}30` }}>
        {is100 && <div style={{ position: 'relative', height: '0', overflow: 'visible' }}>
          {[...Array(6)].map((_, i) => <div key={i} style={{ position: 'absolute', width: '6px', height: '6px', borderRadius: '50%', background: ['#fbbf24', '#f97316', '#a78bfa', '#10b981', '#3b82f6', '#ec4899'][i], left: `${15 + i * 14}%`, top: '-10px', animation: `confettiFloat ${0.8 + i * 0.15}s ease-out ${i * 0.1}s forwards` }} />)}
        </div>}
        <div style={{ marginBottom: '12px', animation: is100 ? 'celebrationPulse 0.6s ease-in-out 0.3s' : undefined }}>
          {is100 ? <Icons.PartyPopper size={28} style={{ color }} /> : milestone >= 75 ? <Icons.Fire size={28} style={{ color }} /> : milestone >= 50 ? <Icons.Trophy size={28} style={{ color }} /> : <Icons.Sparkle size={28} style={{ color }} />}
        </div>
        <div style={{ fontSize: is100 ? '20px' : '17px', fontWeight: '800', color, marginBottom: '6px' }}>
          {is100 ? 'Goal reached!' : milestone >= 75 ? '75% saved!' : milestone >= 50 ? 'Halfway there!' : 'Quarter saved!'}
        </div>
        <div style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
          {is100 ? <><strong>{goalName}</strong> is fully funded!</> : <><strong>{goalName}</strong> is {milestone}% funded</>}
        </div>
        {is100 && <div style={{ marginTop: '10px', fontSize: '12px', color: 'var(--text-muted)' }}>Tap to dismiss</div>}
      </div>
    </div>, document.body
  );
}

// ── Savings streak calculator ──
function getSavingsStreak(transactions) {
  if (!transactions || transactions.length === 0) return 0;
  const deposits = transactions.filter(t => t.amount > 0).map(t => {
    const d = new Date(t.date);
    return `${d.getFullYear()}-${d.getMonth()}`;
  });
  if (deposits.length === 0) return 0;
  const uniqueMonths = [...new Set(deposits)].sort().reverse();
  const now = new Date();
  const currentKey = `${now.getFullYear()}-${now.getMonth()}`;
  const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const lastKey = `${lastMonth.getFullYear()}-${lastMonth.getMonth()}`;
  if (uniqueMonths[0] !== currentKey && uniqueMonths[0] !== lastKey) return 0;
  let streak = 0;
  for (let i = 0; i < uniqueMonths.length; i++) {
    const [y, m] = uniqueMonths[i].split('-').map(Number);
    const expected = new Date(now.getFullYear(), now.getMonth() - i, 1);
    if (y === expected.getFullYear() && m === expected.getMonth()) streak++;
    else break;
  }
  return streak;
}

// ── Emoji Picker ──
const EMOJI_SET = {
  'Travel': ['✈️','🏖️','🌍','🗺️','🏔️','⛱️','🚗','🏕️','🛳️','🌅','🎒','🧳'],
  'Home': ['🏠','🏡','🔑','🛋️','🛏️','🏗️','🧱','🪴','💐','🪟','🚿','🛁'],
  'Money': ['💰','💵','💳','🏦','📈','💎','🪙','🎯','📊','🏆','⭐','🎁'],
  'Food': ['☕','🍕','🍔','🥗','🍷','🎂','🍳','🥐','🍣','🧁','🥂','🍻'],
  'Fun': ['🎮','🎬','🎵','📸','🎨','⚽','🏋️','🎭','🎪','🎤','🎯','🃏'],
  'Life': ['👶','💍','🎓','🐶','🐱','❤️','🏥','💊','🧘','👗','💇','🪥'],
  'Tech': ['💻','📱','🎧','⌚','📷','🖥️','🎮','🔌','💡','🔋','📡','🤖'],
  'Nature': ['🌳','🌺','🦋','🌊','☀️','🌙','⛰️','🏝️','🌸','🍀','🌈','🐚'],
};

export function EmojiPicker({ value, onChange }) {
  const [open, setOpen] = React.useState(false);
  const [activeTab, setActiveTab] = React.useState('Travel');

  return (
    <div>
      <button type="button" onClick={() => { haptic.light(); setOpen(true); }}
        style={{
          width: '100%', padding: '10px', borderRadius: '10px', cursor: 'pointer',
          border: '1px solid var(--border)', background: 'var(--glass)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
          fontSize: '14px', color: value ? 'var(--text-primary)' : 'var(--text-muted)',
        }}>
        {value ? (
          <><span style={{ fontSize: '24px' }}>{value}</span><span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Tap to change</span></>
        ) : (
          <span>Choose an emoji</span>
        )}
        {value && (
          <button type="button" onClick={(e) => { e.stopPropagation(); haptic.light(); onChange(''); }}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: '16px', padding: '0 0 0 4px', lineHeight: 1 }}>
            <Icons.X size={14} />
          </button>
        )}
      </button>

      {open && ReactDOM.createPortal(
        <div onClick={() => setOpen(false)} style={{
          position: 'fixed', inset: 0, zIndex: 10000,
          background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(3px)',
          display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
          animation: 'fadeIn 0.15s ease-out',
        }}>
          <div onClick={(e) => e.stopPropagation()} style={{
            width: '100%', maxWidth: '500px', borderRadius: '20px 20px 0 0',
            background: 'var(--bg-primary, #0f1225)', border: '1px solid var(--border)',
            borderBottom: 'none', animation: 'slideInUp 0.25s cubic-bezier(0.32, 0.72, 0, 1)',
            maxHeight: '50vh', display: 'flex', flexDirection: 'column',
          }}>
            <div style={{ width: '36px', height: '4px', borderRadius: '2px', background: 'var(--border)', margin: '10px auto 8px' }} />
            <div style={{ padding: '0 16px 8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '15px', fontWeight: '700', color: 'var(--text-primary)' }}>Choose Emoji</span>
              <button onClick={() => setOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '4px' }}>
                <Icons.X size={18} />
              </button>
            </div>

            {/* Category tabs */}
            <div style={{ display: 'flex', gap: '4px', padding: '0 12px 10px', overflowX: 'auto', WebkitOverflowScrolling: 'touch', scrollbarWidth: 'none' }}>
              {Object.keys(EMOJI_SET).map(cat => (
                <button key={cat} onClick={() => { haptic.light(); setActiveTab(cat); }}
                  style={{
                    padding: '5px 10px', borderRadius: '16px', fontSize: '11px', fontWeight: '600',
                    cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0,
                    border: activeTab === cat ? '1.5px solid var(--accent-primary)' : '1px solid var(--border)',
                    background: activeTab === cat ? 'color-mix(in srgb, var(--accent-primary) 10%, transparent)' : 'var(--glass)',
                    color: activeTab === cat ? 'var(--accent-primary)' : 'var(--text-muted)',
                  }}>{cat}</button>
              ))}
            </div>

            {/* Emoji grid */}
            <div style={{ padding: '0 16px 20px', overflowY: 'auto' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '4px' }}>
                {EMOJI_SET[activeTab].map(emoji => (
                  <button key={emoji} onClick={() => { haptic.medium(); onChange(emoji); setOpen(false); }}
                    style={{
                      padding: '10px 0', borderRadius: '10px', fontSize: '24px', lineHeight: 1,
                      cursor: 'pointer', border: value === emoji ? '2px solid var(--accent-primary)' : '1px solid transparent',
                      background: value === emoji ? 'color-mix(in srgb, var(--accent-primary) 10%, transparent)' : 'transparent',
                      transition: 'all 0.1s',
                    }}>{emoji}</button>
                ))}
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}

const SAVINGS_CATEGORY_ICONS = {
  'Emergency': Icons.Umbrella,
  'Holiday': Icons.Plane,
  'Big Purchase': Icons.ShoppingBag,
  'Education': Icons.GraduationCap,
  'Home': Icons.CategoryHome,
  'Retirement': Icons.Sunset,
  'Investment': Icons.TrendingChart,
  'Other': Icons.CategoryOther,
};

function getSavingsIcon(category, size = 20, color = 'currentColor') {
  const IconComponent = SAVINGS_CATEGORY_ICONS[category] || Icons.Sparkle;
  return <IconComponent size={size} style={{ color }} />;
}

export default function SavingsPanel({
  savings, totalSaved, editingSavingsId, editSavingsForm, setEditSavingsForm,
  handleSavingsEditStart, handleSavingsEditSave, handleDeleteSavings,
  handleSavingsDeposit, handleSavingsWithdraw, savingsTransactionAmounts,
  setSavingsTransactionAmounts, showSavingsHistory, setShowSavingsHistory,
  calculateSavingsEstimate, setEditingSavingsId, setShowSavingsModal,
  handleArchiveSavings, handleUnarchiveSavings,
  handleBulkDeleteSavings, handleBulkArchiveSavings,
  savingsCelebration, setSavingsCelebration, incomeNum, bills,
  pendingAutoSaves, handleAutoSave, handleSkipAutoSave,
  savingsStatusFilter, setSavingsStatusFilter, selectedSavingsCategory, setSelectedSavingsCategory, allSavingsCategories,
  openManageCategories,
}) {
  const cs = useCurrency();
  const [showArchived, setShowArchived] = React.useState(false);
  const [showCategoryFilter, setShowCategoryFilter] = React.useState(false);
  const [infoSheet, setInfoSheet] = React.useState(null);
  const [showWhatIf, setShowWhatIf] = React.useState({});
  const [whatIfAmounts, setWhatIfAmounts] = React.useState({});
  const [sortMode, setSortMode] = React.useState('default'); // 'default' | 'closest' | 'furthest'

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
    const active = savings.filter(s => !s.archived);
    setSelectedIds(prev => prev.size === active.length ? new Set() : new Set(active.map(s => s.id)));
  };
  const exitSelection = () => { setSelectionMode(false); setSelectedIds(new Set()); };
  const justLongPressed = React.useRef(false);
  const onCardTouchStart = (e, id) => {
    if (e.target.closest('button, input, select, a') || selectionMode) return;
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

  const activeSavingsRaw = savings.filter(s => !s.archived);
  const activeSavings = React.useMemo(() => {
    if (sortMode === 'closest') {
      return [...activeSavingsRaw].sort((a, b) => {
        const pa = a.targetAmount > 0 ? (a.currentAmount / a.targetAmount) : -1;
        const pb = b.targetAmount > 0 ? (b.currentAmount / b.targetAmount) : -1;
        return pb - pa || a.name.localeCompare(b.name);
      });
    }
    if (sortMode === 'furthest') {
      return [...activeSavingsRaw].sort((a, b) => {
        const pa = a.targetAmount > 0 ? (a.currentAmount / a.targetAmount) : 2;
        const pb = b.targetAmount > 0 ? (b.currentAmount / b.targetAmount) : 2;
        return pa - pb || a.name.localeCompare(b.name);
      });
    }
    return activeSavingsRaw;
  }, [activeSavingsRaw, sortMode]);

  // Apply filters
  const filteredSavings = React.useMemo(() => {
    let filtered = activeSavings;
    if (savingsStatusFilter === 'IN_PROGRESS') filtered = filtered.filter(s => !s.targetAmount || s.currentAmount < s.targetAmount);
    if (savingsStatusFilter === 'REACHED') filtered = filtered.filter(s => s.targetAmount > 0 && s.currentAmount >= s.targetAmount);
    if (selectedSavingsCategory !== 'ALL') filtered = filtered.filter(s => s.category === selectedSavingsCategory);
    return filtered;
  }, [activeSavings, savingsStatusFilter, selectedSavingsCategory]);
  const archivedSavings = savings.filter(s => s.archived);

  return (
    <>
      {/* Summary */}
      <div className="glass-card animate-in" style={{ padding: '20px', marginBottom: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h2 className="font-display" style={{ fontSize: '24px' }}>Savings Goals</h2>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            {selectionMode ? (
              <>
                <button onClick={() => { haptic.light(); selectAll(); }} style={{ padding: '6px 12px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--glass)', cursor: 'pointer', fontSize: '12px', fontWeight: '600', color: 'var(--accent-primary)' }}>{selectedIds.size === activeSavings.length ? 'Deselect All' : 'Select All'}</button>
                <button onClick={() => { haptic.light(); exitSelection(); }} style={{ padding: '6px 12px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--glass)', cursor: 'pointer', fontSize: '12px', fontWeight: '600', color: 'var(--text-muted)' }}>Cancel</button>
              </>
            ) : (
              <>
                <button onClick={() => { haptic.medium(); openManageCategories(); }}
                  style={{ width: '36px', height: '36px', borderRadius: '10px', border: '1px solid var(--border)', background: 'var(--glass)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', flexShrink: 0 }}>
                  <Icons.SlidersH size={16} />
                </button>
                <button className="btn btn-primary" onClick={() => setShowSavingsModal(true)}><Icons.Plus size={18} /> Add</button>
              </>
            )}
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
          <div style={{ padding: '12px', background: tc.successTintLight, borderRadius: '12px', border: `1px solid ${tc.successTintStrong}`, textAlign: 'center' }}>
            <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.3px', marginBottom: '3px' }}>Saved</div>
            <div className="font-mono" style={{ fontSize: '18px', fontWeight: '700', color: tc.success }}>{cs}{totalSaved.toFixed(0)}</div>
          </div>
          <div style={{ padding: '12px', background: 'var(--glass)', borderRadius: '12px', border: '1px solid var(--border)', textAlign: 'center' }}>
            <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.3px', marginBottom: '3px' }}>Goals</div>
            <div className="font-mono" style={{ fontSize: '18px', fontWeight: '700' }}>{activeSavings.filter(s => !s.targetAmount || s.currentAmount < s.targetAmount).length}</div>
          </div>
          <div style={{ padding: '12px', background: 'var(--glass)', borderRadius: '12px', border: '1px solid var(--border)', textAlign: 'center' }}>
            <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.3px', marginBottom: '3px' }}>Monthly</div>
            <div className="font-mono" style={{ fontSize: '18px', fontWeight: '700', color: tc.info }}>{cs}{activeSavings.reduce((s, g) => s + (g.monthlyContribution || 0), 0).toFixed(0)}</div>
          </div>
        </div>

        {/* Sort options */}
        {filteredSavings.length > 1 && (
          <div style={{ display: 'flex', gap: '6px', marginTop: '10px' }}>
            {[
              { key: 'default', label: 'Default' },
              { key: 'closest', label: 'Closest' },
              { key: 'furthest', label: 'Furthest' },
            ].map(s => (
              <button key={s.key} onClick={() => { haptic.light(); setSortMode(s.key); }}
                style={{ flex: 1, padding: '5px', borderRadius: '8px', fontSize: '11px', fontWeight: '600', cursor: 'pointer', textAlign: 'center',
                  border: sortMode === s.key ? '1.5px solid var(--accent-primary)' : '1px solid var(--border)',
                  background: sortMode === s.key ? 'color-mix(in srgb, var(--accent-primary) 10%, transparent)' : 'var(--glass)',
                  color: sortMode === s.key ? 'var(--accent-primary)' : 'var(--text-muted)',
                }}>{s.label}</button>
            ))}
          </div>
        )}
      </div>

      {/* Status filters + Category dropdown */}
      {savings.length > 0 && (
        <div className="animate-in" style={{ marginBottom: '14px', animationDelay: '0.1s' }}>
          <div style={{ display: 'flex', gap: '5px' }}>
            {[
              { key: 'ALL', label: 'All' },
              { key: 'IN_PROGRESS', label: 'In Progress' },
              { key: 'REACHED', label: 'Reached' },
            ].map((f) => (
              <button key={f.key} onClick={() => { haptic.light(); setSavingsStatusFilter(f.key); }}
                style={{ flex: 1, padding: '7px 4px', borderRadius: '20px', fontSize: '11px', fontWeight: '600', minWidth: 0,
                  cursor: 'pointer', whiteSpace: 'nowrap', transition: 'all 0.2s',
                  border: savingsStatusFilter === f.key ? '2px solid var(--accent-primary)' : '1px solid var(--border)',
                  background: savingsStatusFilter === f.key ? 'color-mix(in srgb, var(--accent-primary) 10%, transparent)' : 'var(--glass)',
                  color: savingsStatusFilter === f.key ? 'var(--accent-primary)' : 'var(--text-muted)',
                }}>{f.label}</button>
            ))}
            <button onClick={() => { haptic.light(); setShowCategoryFilter(v => !v); }}
              style={{ padding: '7px 4px', borderRadius: '20px', fontSize: '11px', fontWeight: '600',
                cursor: 'pointer', whiteSpace: 'nowrap', transition: 'all 0.2s',
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '3px',
                border: selectedSavingsCategory !== 'ALL' || showCategoryFilter ? '2px solid var(--accent-primary)' : '1px solid var(--border)',
                background: selectedSavingsCategory !== 'ALL' || showCategoryFilter ? 'color-mix(in srgb, var(--accent-primary) 10%, transparent)' : 'var(--glass)',
                color: selectedSavingsCategory !== 'ALL' || showCategoryFilter ? 'var(--accent-primary)' : 'var(--text-muted)',
              }}>
              Category
              <Icons.ChevronDown size={12} style={{ transition: 'transform 0.2s', transform: showCategoryFilter ? 'rotate(180deg)' : 'none' }} />
            </button>
          </div>

          {showCategoryFilter && (
            <div style={{ marginTop: '10px', padding: '12px', background: 'var(--bg-card, var(--glass))', border: '1px solid var(--border)', borderRadius: '14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <span style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Category</span>
                {selectedSavingsCategory !== 'ALL' && (
                  <button onClick={() => { haptic.light(); setSelectedSavingsCategory('ALL'); }}
                    style={{ fontSize: '11px', fontWeight: '600', color: 'var(--accent-primary)', background: 'none', border: 'none', cursor: 'pointer' }}>Clear</button>
                )}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px' }}>
                {allSavingsCategories.map((cat) => (
                  <button key={cat} onClick={() => { haptic.light(); setSelectedSavingsCategory(cat); }}
                    style={{ padding: '8px 6px', borderRadius: '10px', fontSize: '11px', fontWeight: '600',
                      cursor: 'pointer', transition: 'all 0.15s', textAlign: 'center',
                      border: selectedSavingsCategory === cat ? '2px solid var(--accent-primary)' : '1px solid var(--border)',
                      background: selectedSavingsCategory === cat ? 'color-mix(in srgb, var(--accent-primary) 10%, transparent)' : 'var(--glass)',
                      color: selectedSavingsCategory === cat ? 'var(--accent-primary)' : 'var(--text-muted)',
                    }}>{cat}</button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Auto-save prompts */}
      {pendingAutoSaves.length > 0 && (
        <div className="glass-card animate-in" style={{ padding: '14px 16px', marginBottom: '12px', animationDelay: '0.1s' }}>
          <div style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Icons.Sparkle size={14} style={{ color: 'var(--accent-primary)' }} /> Monthly Auto-Save
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {pendingAutoSaves.map(goal => (
              <div key={goal.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 10px', borderRadius: '10px', background: 'var(--glass)', border: '1px solid var(--border)' }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '13px', fontWeight: '600', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{goal.emoji ? `${goal.emoji} ` : ''}{goal.name}</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{cs}{goal.monthlyContribution.toFixed(2)}</div>
                </div>
                <button onClick={() => { haptic.success(); handleAutoSave(goal.id); }} style={{ padding: '6px 12px', borderRadius: '8px', border: 'none', background: 'linear-gradient(135deg, var(--success), #059669)', color: '#fff', cursor: 'pointer', fontSize: '11px', fontWeight: '600' }}>Save</button>
                <button onClick={() => { haptic.light(); handleSkipAutoSave(goal.id); }} style={{ padding: '6px 8px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--glass)', cursor: 'pointer', fontSize: '11px', fontWeight: '600', color: 'var(--text-muted)' }}>Skip</button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* List */}
      {filteredSavings.length === 0 && archivedSavings.length === 0 && savingsStatusFilter === 'ALL' && selectedSavingsCategory === 'ALL' ? (
        <div className="glass-card" style={{ padding: '40px', textAlign: 'center' }}>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>No savings goals yet. Tap "Add" to start saving.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', paddingBottom: selectionMode && selectedIds.size > 0 ? '100px' : '0', transition: 'padding-bottom 0.2s' }}>
          {filteredSavings.length === 0 && (
            <div className="glass-card" style={{ padding: '24px', textAlign: 'center' }}>
              <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>
                {savingsStatusFilter !== 'ALL' || selectedSavingsCategory !== 'ALL' ? 'No goals match this filter' : <><Icons.PartyPopper size={14} style={{ verticalAlign: '-2px' }} /> All goals reached!</>}
              </p>
            </div>
          )}

          {filteredSavings.map((goal) => {
            const progress = goal.targetAmount > 0 ? Math.min((goal.currentAmount / goal.targetAmount) * 100, 100) : 0;
            const isComplete = goal.targetAmount > 0 && goal.currentAmount >= goal.targetAmount;
            const estimate = calculateSavingsEstimate(goal);
            const accentColor = isComplete ? 'var(--success)' : 'var(--accent-primary)';

            return (
              <div key={goal.id}
                onTouchStart={(e) => onCardTouchStart(e, goal.id)}
                onTouchMove={onCardTouchMove}
                onTouchEnd={onCardTouchEnd}
                onClick={() => { if (justLongPressed.current) { justLongPressed.current = false; return; } if (selectionMode) { haptic.light(); toggleSelect(goal.id); } }}
              >
                <div className="mobile-bill-card" style={{
                  borderLeft: `3px solid ${accentColor}`,
                  background: isComplete ? tc.successTintLight : undefined,
                  outline: selectionMode && selectedIds.has(goal.id) ? '2px solid var(--accent-primary)' : 'none',
                }}>
                  {selectionMode && (
                    <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
                      <div style={{
                        width: '22px', height: '22px', borderRadius: '6px', flexShrink: 0,
                        border: `2px solid ${selectedIds.has(goal.id) ? 'var(--accent-primary)' : 'var(--border)'}`,
                        background: selectedIds.has(goal.id) ? 'linear-gradient(135deg, var(--accent-primary), var(--success))' : 'transparent',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', color: '#fff' }}>
                        {selectedIds.has(goal.id) && '✓'}
                      </div>
                      <span style={{ marginLeft: '10px', fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)' }}>
                        {selectedIds.has(goal.id) ? 'Selected' : 'Tap to select'}
                      </span>
                    </div>
                  )}
                  {editingSavingsId === goal.id ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      <input className="input" value={editSavingsForm.name} onChange={(e) => setEditSavingsForm({ ...editSavingsForm, name: e.target.value })} placeholder="Goal name" />
                      <select className="input" value={editSavingsForm.category} onChange={(e) => setEditSavingsForm({ ...editSavingsForm, category: e.target.value })}>
                        {(allSavingsCategories || SAVINGS_CATEGORIES).map((c) => (<option key={c} value={c}>{c}</option>))}
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
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                        <div>
                          <label style={{ display: 'block', color: 'var(--text-secondary)', fontSize: '12px', marginBottom: '4px' }}>Auto Monthly</label>
                          <input type="number" className="input" value={editSavingsForm.monthlyContribution} onChange={(e) => setEditSavingsForm({ ...editSavingsForm, monthlyContribution: e.target.value })} />
                        </div>
                        <div>
                          <label style={{ display: 'block', color: 'var(--text-secondary)', fontSize: '12px', marginBottom: '4px' }}>Target Date</label>
                          <input type="date" className={`input ${editSavingsForm.targetDate ? 'has-value' : ''}`} value={editSavingsForm.targetDate || ''} onChange={(e) => setEditSavingsForm({ ...editSavingsForm, targetDate: e.target.value })} />
                        </div>
                      </div>
                      <div>
                        <label style={{ display: 'block', color: 'var(--text-secondary)', fontSize: '12px', marginBottom: '4px' }}>Goal Emoji (optional)</label>
                        <EmojiPicker value={editSavingsForm.emoji || ''} onChange={(emoji) => setEditSavingsForm({ ...editSavingsForm, emoji })} />
                      </div>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button className="btn btn-primary" onClick={handleSavingsEditSave} style={{ flex: 1 }}><Icons.Check size={18} /> Save</button>
                        <button className="btn btn-secondary" onClick={() => setEditingSavingsId(null)} style={{ flex: 1 }}><Icons.X size={18} /> Cancel</button>
                      </div>
                      <button onClick={async () => { const deleted = await handleDeleteSavings(goal.id); if (deleted !== false) setEditingSavingsId(null); }} style={{ width: '100%', marginTop: '8px', padding: '9px', background: tc.dangerTintLight, border: `1px solid ${tc.dangerTintStrong}`, borderRadius: '10px', cursor: 'pointer', fontSize: '13px', fontWeight: '600', color: tc.danger }}>
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
                          {goal.emoji ? (
                            <span style={{ fontSize: '18px', lineHeight: 1 }}>{goal.emoji}</span>
                          ) : getSavingsIcon(goal.category, 20, isComplete ? 'var(--success)' : 'var(--accent-primary)')}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span style={{ fontWeight: '600', fontSize: '15px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{goal.name}</span>
                            {!selectionMode && <button onClick={() => handleSavingsEditStart(goal)} style={{ width: '22px', height: '22px', borderRadius: '5px', border: '1px solid var(--accent-primary)', background: 'var(--info-tint)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-primary)', flexShrink: 0 }}>
                              <Icons.Edit size={12} />
                            </button>}
                          </div>
                          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '1px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <span>{goal.category || 'Savings'}</span>
                            <InfoButton onClick={() => setInfoSheet(goal.category || 'general')} />
                          </div>
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
                        {(() => {
                          const streak = getSavingsStreak(goal.transactions);
                          if (streak < 2) return null;
                          return (
                            <span style={{ fontSize: '11px', color: '#f97316', background: 'rgba(249,115,22,0.1)', padding: '2px 7px', borderRadius: '5px', border: '1px solid rgba(249,115,22,0.15)', fontWeight: '600' }}>
                              <Icons.Fire size={12} style={{ verticalAlign: '-2px' }} /> {streak}mo streak
                            </span>
                          );
                        })()}
                        {isComplete && (
                          <span style={{ fontSize: '11px', color: 'var(--success)', background: tc.successTint, padding: '2px 7px', borderRadius: '5px', border: `1px solid ${tc.successTintStrong}`, fontWeight: '600', marginLeft: 'auto' }}>
                            ✓ Goal reached!
                          </span>
                        )}
                      </div>

                      {/* ── Target date indicator ── */}
                      {goal.targetDate && goal.targetAmount > 0 && !isComplete && (() => {
                        const target = new Date(goal.targetDate);
                        const now = new Date();
                        const daysLeft = Math.ceil((target - now) / (1000 * 60 * 60 * 24));
                        const monthsLeft = Math.max(1, Math.ceil(daysLeft / 30.44));
                        const remaining = Math.max(0, goal.targetAmount - (goal.currentAmount || 0));
                        const neededPerMonth = remaining / monthsLeft;
                        const currentMonthly = goal.monthlyContribution || 0;
                        const isOnTrack = currentMonthly >= neededPerMonth;
                        const isPast = daysLeft < 0;
                        const color = isPast ? tc.danger : isOnTrack ? tc.success : tc.warning;
                        const tintBg = isPast ? tc.dangerTint : isOnTrack ? tc.successTintLight : tc.warningTint;
                        const tintBorder = isPast ? tc.dangerTintStrong : isOnTrack ? tc.successTintStrong : tc.warningTintStrong;
                        return (
                          <div style={{ marginBottom: '8px', marginLeft: '46px', fontSize: '11px', padding: '6px 8px', borderRadius: '8px', background: tintBg, border: `1px solid ${tintBorder}`, color }}>
                            <div style={{ fontWeight: '600' }}>
                              {isPast ? <><Icons.Warning size={13} style={{ verticalAlign: '-2px' }} /> Target date passed</> : `Target: ${target.toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })} · ${daysLeft} days`}
                            </div>
                            {!isPast && (
                              <div style={{ opacity: 0.8, marginTop: '2px' }}>
                                {isOnTrack ? '✓ On track' : `Need ${cs}${neededPerMonth.toFixed(0)}/mo (currently ${cs}${currentMonthly.toFixed(0)})`}
                              </div>
                            )}
                          </div>
                        );
                      })()}

                      {/* ── Progress bar with milestones ── */}
                      {goal.targetAmount > 0 ? (
                        <div style={{ marginBottom: '10px', marginLeft: '46px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>
                            <span>{progress.toFixed(1)}%</span>
                            <span>{cs}{Math.max(0, goal.targetAmount - (goal.currentAmount || 0)).toFixed(2)} to go</span>
                          </div>
                          <div style={{ position: 'relative' }}>
                            <div style={{ height: '5px', background: 'var(--glass)', borderRadius: '3px', overflow: 'hidden', border: '1px solid var(--border)' }}>
                              <div style={{ width: `${progress}%`, height: '100%', background: isComplete ? 'var(--success)' : 'linear-gradient(90deg, var(--accent-primary), var(--success))', borderRadius: '3px', transition: 'width 0.5s' }} />
                            </div>
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
                          {progress >= 25 && progress < 100 && (
                            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', marginTop: '6px', fontSize: '10px', fontWeight: '700', padding: '2px 8px', borderRadius: '8px',
                              color: progress >= 75 ? '#f97316' : progress >= 50 ? '#a78bfa' : 'var(--accent-primary)',
                              background: progress >= 75 ? 'rgba(249,115,22,0.1)' : progress >= 50 ? 'rgba(167,139,250,0.1)' : 'color-mix(in srgb, var(--accent-primary) 10%, transparent)',
                              border: `1px solid ${progress >= 75 ? 'rgba(249,115,22,0.2)' : progress >= 50 ? 'rgba(167,139,250,0.2)' : 'color-mix(in srgb, var(--accent-primary) 20%, transparent)'}`,
                            }}>
                              {progress >= 75 ? <Icons.Fire size={10} /> : progress >= 50 ? <Icons.Trophy size={10} /> : <Icons.Sparkle size={10} />}
                              {progress >= 75 ? 'Almost there!' : progress >= 50 ? 'Halfway!' : 'Quarter saved!'}
                            </div>
                          )}
                        </div>
                      ) : !isComplete && (
                        <div style={{ marginBottom: '10px', marginLeft: '46px' }}>
                          <button onClick={() => handleSavingsEditStart(goal)}
                            style={{ fontSize: '12px', color: 'var(--accent-primary)', background: 'color-mix(in srgb, var(--accent-primary) 8%, transparent)', border: '1px solid color-mix(in srgb, var(--accent-primary) 15%, transparent)', borderRadius: '8px', padding: '6px 10px', cursor: 'pointer', fontWeight: '500' }}>
                            Set a target to track progress →
                          </button>
                        </div>
                      )}

                      {/* ── What If projections ── */}
                      {goal.targetAmount > 0 && !isComplete && !selectionMode && (
                        <div style={{ marginLeft: '46px', marginBottom: '8px' }}>
                          <button onClick={() => setShowWhatIf({ ...showWhatIf, [goal.id]: !showWhatIf[goal.id] })} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--accent-primary)', fontSize: '12px', fontWeight: '500', padding: '2px 0', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <span style={{ display: 'inline-flex', transform: showWhatIf[goal.id] ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}><Icons.ChevronDown size={13} /></span>
                            What if I saved more?
                          </button>
                          {showWhatIf[goal.id] && (
                            <div style={{ marginTop: '8px', padding: '12px', background: 'var(--glass)', borderRadius: '10px', border: '1px solid var(--border)' }}>
                              <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                                <input type="number" className="input" placeholder="e.g. 200" value={whatIfAmounts[goal.id] || ''} onChange={(e) => setWhatIfAmounts({ ...whatIfAmounts, [goal.id]: e.target.value })} style={{ flex: 1 }} />
                                <span style={{ display: 'flex', alignItems: 'center', fontSize: '12px', color: 'var(--text-muted)' }}>/mo</span>
                              </div>
                              {(() => {
                                const amt = parseFloat(whatIfAmounts[goal.id]);
                                if (!amt || amt <= 0) return <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Enter a monthly amount to see when you'll reach your goal</div>;
                                const remaining = Math.max(0, goal.targetAmount - (goal.currentAmount || 0));
                                const months = Math.ceil(remaining / amt);
                                const date = new Date(); date.setMonth(date.getMonth() + months);
                                const currentMonthly = goal.monthlyContribution || 0;
                                const currentMonths = currentMonthly > 0 ? Math.ceil(remaining / currentMonthly) : null;
                                const savedMonths = currentMonths ? currentMonths - months : null;
                                return (
                                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                    <div style={{ fontSize: '13px', fontWeight: '600' }}>Goal reached in {months} month{months !== 1 ? 's' : ''} <span style={{ fontSize: '11px', fontWeight: '400', color: 'var(--text-muted)' }}>({date.toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })})</span></div>
                                    {savedMonths > 0 && (
                                      <div style={{ fontSize: '12px', color: tc.success, padding: '6px 8px', background: tc.successTintLight, borderRadius: '8px' }}>
                                        <Icons.Lightbulb size={13} style={{ verticalAlign: '-2px' }} /> {savedMonths} month{savedMonths !== 1 ? 's' : ''} sooner than current rate
                                      </div>
                                    )}
                                  </div>
                                );
                              })()}
                            </div>
                          )}
                        </div>
                      )}

                      {/* ── Action buttons (hidden in selection mode) ── */}
                      {!selectionMode && !isComplete ? (
                        <div style={{ display: 'flex', gap: '6px', marginLeft: '46px' }}>
                          <input type="number" className="input" placeholder="Amount..." value={savingsTransactionAmounts[goal.id] || ''} onChange={(e) => setSavingsTransactionAmounts({ ...savingsTransactionAmounts, [goal.id]: e.target.value })} style={{ flex: 1 }} />
                          <button className="btn btn-primary" onClick={() => handleSavingsDeposit(goal.id)} style={{ whiteSpace: 'nowrap', padding: '0 14px' }}>+ Add</button>
                          <button className="btn btn-secondary" onClick={() => handleSavingsWithdraw(goal.id)} style={{ whiteSpace: 'nowrap', padding: '0 12px', color: tc.danger }}>- Take</button>
                        </div>
                      ) : !selectionMode ? (
                        <div style={{ display: 'flex', gap: '8px', marginLeft: '46px' }}>
                          <button onClick={() => handleArchiveSavings(goal.id)} style={{ flex: 1, padding: '8px', border: '1px solid var(--border)', borderRadius: '8px', background: 'var(--glass)', cursor: 'pointer', fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)' }}>Archive Goal</button>
                        </div>
                      ) : null}

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

      {/* Bulk Action Bar */}
      {selectionMode && selectedIds.size > 0 && ReactDOM.createPortal(
        <div style={{ position: 'fixed', bottom: '20px', left: '16px', right: '16px', padding: '12px 16px', borderRadius: '16px', background: 'var(--bg-card, #141833)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', border: '1px solid var(--border)', boxShadow: '0 8px 32px rgba(0,0,0,0.6)', zIndex: 9999, animation: 'slideInUp 0.2s', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-primary)' }}>{selectedIds.size} selected</span>
            <button onClick={() => { haptic.light(); exitSelection(); }} style={{ padding: '4px 10px', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--glass)', cursor: 'pointer', fontSize: '12px', fontWeight: '600', color: 'var(--text-muted)' }}>✕ Cancel</button>
          </div>
          <div style={{ display: 'flex', gap: '6px' }}>
            <button onClick={() => { handleBulkArchiveSavings([...selectedIds]); exitSelection(); }} style={{ flex: 1, padding: '10px 8px', borderRadius: '10px', border: 'none', background: 'linear-gradient(135deg, var(--success), #059669)', color: '#fff', cursor: 'pointer', fontSize: '12px', fontWeight: '600' }}>
              <Icons.Check size={14} /> Archive
            </button>
            <button onClick={async () => { await handleBulkDeleteSavings([...selectedIds]); exitSelection(); }} style={{ flex: 1, padding: '10px 8px', borderRadius: '10px', border: '1px solid var(--danger)', background: 'transparent', color: 'var(--danger)', cursor: 'pointer', fontSize: '12px', fontWeight: '600', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px' }}>
              <Icons.Trash size={14} /> Delete
            </button>
          </div>
        </div>,
        document.body
      )}

      {/* Celebration overlay */}
      <SavingsCelebration celebration={savingsCelebration} onDismiss={() => setSavingsCelebration(null)} />

      {/* Educational Info Sheets */}
      <InfoSheet open={infoSheet === 'Emergency'} onClose={() => setInfoSheet(null)} title="Emergency Fund">
        <p style={{ marginBottom: '12px' }}>An emergency fund covers unexpected costs - job loss, car repairs, medical bills - so you don't go into debt when life happens.</p>
        <div style={{ padding: '10px 12px', borderRadius: '10px', background: tc.successTintLight, border: `1px solid ${tc.successTintStrong}`, fontSize: '13px', color: tc.success, marginBottom: '12px' }}>
          <strong>Rule of thumb:</strong> Save 3-6 months of essential expenses.
          {incomeNum > 0 && <div style={{ marginTop: '4px' }}>Based on your income: {cs}{(incomeNum * 3).toFixed(0)} - {cs}{(incomeNum * 6).toFixed(0)}</div>}
          {bills && bills.length > 0 && <div style={{ marginTop: '4px' }}>Based on your bills: {cs}{(bills.reduce((s, b) => s + (b.projected || 0), 0) * 3).toFixed(0)} - {cs}{(bills.reduce((s, b) => s + (b.projected || 0), 0) * 6).toFixed(0)}</div>}
        </div>
        <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Start with £1,000, then build to 3 months. Keep it in an easy-access savings account, not invested.</p>
      </InfoSheet>

      <InfoSheet open={infoSheet === 'Holiday'} onClose={() => setInfoSheet(null)} title="Holiday Savings">
        <p style={{ marginBottom: '12px' }}>Setting money aside specifically for holidays means you can enjoy your trip guilt-free, without putting it on a credit card.</p>
        <div style={{ padding: '10px 12px', borderRadius: '10px', background: tc.infoTint, border: '1px solid var(--info-tint-strong)', fontSize: '13px', color: tc.info }}>
          <strong>Tip:</strong> Divide the total cost by the months until your trip to get your monthly target. Include flights, accommodation, spending money, and travel insurance.
        </div>
      </InfoSheet>

      <InfoSheet open={infoSheet === 'Big Purchase'} onClose={() => setInfoSheet(null)} title="Saving for a Big Purchase">
        <p style={{ marginBottom: '12px' }}>Whether it's a car, furniture, or tech - saving in advance means you avoid interest charges and buy with confidence.</p>
        <div style={{ padding: '10px 12px', borderRadius: '10px', background: 'color-mix(in srgb, var(--accent-primary) 8%, transparent)', border: '1px solid color-mix(in srgb, var(--accent-primary) 15%, transparent)', fontSize: '13px' }}>
          <strong style={{ color: 'var(--accent-primary)' }}>Strategy:</strong> Research the exact price, set it as your target, and automate a monthly amount. Consider waiting for sales to stretch your savings further.
        </div>
      </InfoSheet>

      <InfoSheet open={infoSheet === 'Home'} onClose={() => setInfoSheet(null)} title="Home Deposit Savings">
        <p style={{ marginBottom: '12px' }}>Most UK lenders need a <strong>5-20% deposit</strong>. The more you save, the better mortgage rate you'll get.</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px' }}>
            <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: 'var(--warning)', flexShrink: 0 }} />
            <span><strong>5%</strong> - Minimum for most lenders, higher rates</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px' }}>
            <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: 'var(--accent-primary)', flexShrink: 0 }} />
            <span><strong>10%</strong> - Better rates, more lender choice</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px' }}>
            <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: 'var(--success)', flexShrink: 0 }} />
            <span><strong>20%+</strong> - Best rates, avoid higher LTV premiums</span>
          </div>
        </div>
        <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Consider a Lifetime ISA - the government adds 25% on top (up to £1,000/year bonus).</p>
      </InfoSheet>

      <InfoSheet open={infoSheet === 'Education'} onClose={() => setInfoSheet(null)} title="Education Savings">
        <p style={{ marginBottom: '12px' }}>Whether it's a course, certification, or tuition - investing in education typically has the highest long-term return.</p>
        <div style={{ padding: '10px 12px', borderRadius: '10px', background: tc.purpleTint, border: '1px solid rgba(124,58,237,0.15)', fontSize: '13px', color: tc.purple }}>
          <strong>Tip:</strong> Check if your employer offers learning budgets or tax-deductible training schemes before self-funding.
        </div>
      </InfoSheet>

      <InfoSheet open={infoSheet === 'Retirement'} onClose={() => setInfoSheet(null)} title="Retirement Savings">
        <p style={{ marginBottom: '12px' }}>Your workplace pension is a start, but extra savings give you more freedom in retirement.</p>
        <div style={{ padding: '10px 12px', borderRadius: '10px', background: tc.successTintLight, border: `1px solid ${tc.successTintStrong}`, fontSize: '13px', color: tc.success, marginBottom: '12px' }}>
          <strong>UK guideline:</strong> Save half your age as a percentage of salary. Started at 30? Aim for 15% of income going toward retirement.
        </div>
        <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Pension contributions get tax relief - every £80 you put in becomes £100 (basic rate). Check your workplace match too.</p>
      </InfoSheet>

      <InfoSheet open={infoSheet === 'Investment'} onClose={() => setInfoSheet(null)} title="Investment Savings">
        <p style={{ marginBottom: '12px' }}>Building a pot for investing gives you the discipline to invest regularly, not impulsively.</p>
        <div style={{ padding: '10px 12px', borderRadius: '10px', background: tc.warningTint, border: `1px solid ${tc.warningTintStrong}`, fontSize: '13px', color: tc.warning }}>
          <strong>Important:</strong> Only invest money you won't need for 5+ years. Build your emergency fund first.
        </div>
        <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '10px' }}>Consider a Stocks & Shares ISA for tax-free growth (up to £20,000/year allowance).</p>
      </InfoSheet>

      <InfoSheet open={infoSheet === 'Other' || infoSheet === 'general'} onClose={() => setInfoSheet(null)} title="Savings Tips">
        <p style={{ marginBottom: '12px' }}>The key to saving is consistency. Even small, regular deposits add up over time thanks to the power of habit.</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ padding: '8px 10px', borderRadius: '8px', background: 'var(--glass)', border: '1px solid var(--border)', fontSize: '13px' }}>
            <strong>Pay yourself first</strong> - set up auto-save on payday before you spend.
          </div>
          <div style={{ padding: '8px 10px', borderRadius: '8px', background: 'var(--glass)', border: '1px solid var(--border)', fontSize: '13px' }}>
            <strong>Set a target</strong> - goals with deadlines are 2x more likely to be reached.
          </div>
          <div style={{ padding: '8px 10px', borderRadius: '8px', background: 'var(--glass)', border: '1px solid var(--border)', fontSize: '13px' }}>
            <strong>Round up</strong> - even rounding purchases up to the nearest pound adds up.
          </div>
        </div>
      </InfoSheet>
    </>
  );
}

import React, { useState, useCallback } from 'react';
import { importCSV, detectRecurring, detectSpreadsheetFormat, importSpreadsheet, parseCSV } from '../utils/csvImport';
import { DEBT_TYPES, SAVINGS_CATEGORIES } from '../data/initialData';
import * as Icons from './Icons';
// PDF import is loaded lazily to keep the main bundle small
const loadPdfImport = () => import('../utils/pdfImport');
import haptic from '../utils/haptics';
import Picker from './Picker';
import NumericInput from './NumericInput';

async function pickFile() {
  const { FilePicker } = await import('@capawesome/capacitor-file-picker');
  return FilePicker.pickFiles({
    types: [
      'text/csv', 'text/comma-separated-values', 'application/csv', 'text/plain',
      'application/pdf',
    ],
    readData: true,
    limit: 1,
  });
}

const FREQ_MAP = {
  weekly: 'Weekly', fortnightly: 'Fortnightly',
  monthly: 'Monthly', quarterly: 'Quarterly', annual: 'Annual',
};

// Ordered so longer/more-specific keys are checked before shorter ones
const CAT_MAP = [
  // TRANSPORTATION
  ['trainline',           'TRANSPORTATION'],
  ['national rail',       'TRANSPORTATION'],
  ['greater anglia',      'TRANSPORTATION'],
  ['southeastern rail',   'TRANSPORTATION'],
  ['transport for london','TRANSPORTATION'],
  ['tfl travel',          'TRANSPORTATION'],
  ['oyster',              'TRANSPORTATION'],
  ['stagecoach',          'TRANSPORTATION'],
  ['arriva',              'TRANSPORTATION'],
  ['national express',    'TRANSPORTATION'],
  ['megabus',             'TRANSPORTATION'],
  ['easyjet',             'TRANSPORTATION'],
  ['ryanair',             'TRANSPORTATION'],
  ['flixbus',             'TRANSPORTATION'],
  ['uber',                'TRANSPORTATION'],
  ['bolt ride',           'TRANSPORTATION'],
  ['addison lee',         'TRANSPORTATION'],
  ['zipcar',              'TRANSPORTATION'],
  ['enterprise rent',     'TRANSPORTATION'],
  ['hertz',               'TRANSPORTATION'],
  ['ncp parking',         'TRANSPORTATION'],
  ['parking meter',       'TRANSPORTATION'],
  ['congestion charge',   'TRANSPORTATION'],
  ['dartford crossing',   'TRANSPORTATION'],
  ['petrol',              'TRANSPORTATION'],
  ['rac breakdown',       'TRANSPORTATION'],
  ['rac renewal',         'TRANSPORTATION'],
  ['aa breakdown',        'TRANSPORTATION'],
  ['aa renewal',          'TRANSPORTATION'],
  ['green flag',          'TRANSPORTATION'],
  // CREDIT CARDS - routed to Debts panel (not bills)
  // ['barclaycard', 'capital one', 'amex', etc. detected by debt classification logic]
  // ENTERTAINMENT
  ['netflix',             'ENTERTAINMENT'],
  ['spotify',             'ENTERTAINMENT'],
  ['amazon prime',        'ENTERTAINMENT'],
  ['prime video',         'ENTERTAINMENT'],
  ['disney',              'ENTERTAINMENT'],
  ['apple one',           'ENTERTAINMENT'],
  ['apple tv',            'ENTERTAINMENT'],
  ['apple music',         'ENTERTAINMENT'],
  ['now tv',              'ENTERTAINMENT'],
  ['now entertainment',   'ENTERTAINMENT'],
  ['sky sports',          'ENTERTAINMENT'],
  ['sky cinema',          'ENTERTAINMENT'],
  ['sky tv',              'ENTERTAINMENT'],
  ['sky subscription',    'ENTERTAINMENT'],
  ['youtube premium',     'ENTERTAINMENT'],
  ['twitch',              'ENTERTAINMENT'],
  ['paramount',           'ENTERTAINMENT'],
  ['discovery plus',      'ENTERTAINMENT'],
  ['peacock',             'ENTERTAINMENT'],
  ['mubi',                'ENTERTAINMENT'],
  ['bfi player',          'ENTERTAINMENT'],
  ['xbox',                'ENTERTAINMENT'],
  ['playstation',         'ENTERTAINMENT'],
  ['nintendo',            'ENTERTAINMENT'],
  ['steam games',         'ENTERTAINMENT'],
  ['ticketmaster',        'ENTERTAINMENT'],
  ['eventbrite',          'ENTERTAINMENT'],
  ['odeon',               'ENTERTAINMENT'],
  ['cineworld',           'ENTERTAINMENT'],
  ['vue cinema',          'ENTERTAINMENT'],
  ['the guardian',        'ENTERTAINMENT'],
  ['financial times',     'ENTERTAINMENT'],
  ['telegraph',           'ENTERTAINMENT'],
  ['the times',           'ENTERTAINMENT'],
  ['audible',             'ENTERTAINMENT'],
  ['kindle unlimited',    'ENTERTAINMENT'],
  ['google one',          'ENTERTAINMENT'],
  ['google play',         'ENTERTAINMENT'],
  ['microsoft 365',       'ENTERTAINMENT'],
  ['office 365',          'ENTERTAINMENT'],
  ['adobe',               'ENTERTAINMENT'],
  ['dropbox',             'ENTERTAINMENT'],
  ['icloud',              'ENTERTAINMENT'],
  ['notion',              'ENTERTAINMENT'],
  ['duolingo',            'ENTERTAINMENT'],
  ['calm',                'ENTERTAINMENT'],
  ['headspace',           'ENTERTAINMENT'],
  ['strava',              'ENTERTAINMENT'],
  ['peloton app',         'ENTERTAINMENT'],
  ['skillshare',          'ENTERTAINMENT'],
  ['masterclass',         'ENTERTAINMENT'],
  ['coursera',            'ENTERTAINMENT'],
  // HEALTH (specific health insurers before generic 'insurance')
  ['pure gym',            'HEALTH'],
  ['the gym',             'HEALTH'],
  ['anytime fitness',     'HEALTH'],
  ['david lloyd',         'HEALTH'],
  ['virgin active',       'HEALTH'],
  ['nuffield health',     'HEALTH'],
  ['fitness first',       'HEALTH'],
  ['better leisure',      'HEALTH'],
  ['snap fitness',        'HEALTH'],
  ['bupa',                'HEALTH'],
  ['vitality health',     'HEALTH'],
  ['axa health',          'HEALTH'],
  ['aviva health',        'HEALTH'],
  ['peloton',             'HEALTH'],
  ['dentist',             'HEALTH'],
  ['optician',            'HEALTH'],
  ['specsavers',          'HEALTH'],
  ['vision express',      'HEALTH'],
  ['lloyds pharmacy',     'HEALTH'],
  ['boots pharmacy',      'HEALTH'],
  ['gym',                 'HEALTH'],
  // PAYMENTS (insurance, loans, BNPL — after specific health insurers)
  ['insurance',           'PAYMENTS'],
  ['loan repayment',      'PAYMENTS'],
  ['personal loan',       'PAYMENTS'],
  ['klarna',              'PAYMENTS'],
  ['clearpay',            'PAYMENTS'],
  ['laybuy',              'PAYMENTS'],
  ['paypal credit',       'PAYMENTS'],
  ['very catalogue',      'PAYMENTS'],
  ['next pay',            'PAYMENTS'],
  ['littlewoods',         'PAYMENTS'],
  ['zopa loan',           'PAYMENTS'],
  ['novuna',              'PAYMENTS'],
  ['hitachi finance',     'PAYMENTS'],
  // HOME (utilities, broadband, housing — short keys last)
  ['council tax',         'HOME'],
  ['tv licence',          'HOME'],
  ['british gas',         'HOME'],
  ['scottish power',      'HOME'],
  ['edf energy',          'HOME'],
  ['octopus energy',      'HOME'],
  ['bulb energy',         'HOME'],
  ['ovo energy',          'HOME'],
  ['so energy',           'HOME'],
  ['e.on next',           'HOME'],
  ['severn trent',        'HOME'],
  ['thames water',        'HOME'],
  ['anglian water',       'HOME'],
  ['southern water',      'HOME'],
  ['yorkshire water',     'HOME'],
  ['united utilities',    'HOME'],
  ['welsh water',         'HOME'],
  ['virgin media',        'HOME'],
  ['sky broadband',       'HOME'],
  ['talktalk',            'HOME'],
  ['plusnet',             'HOME'],
  ['ee mobile',           'HOME'],
  ['ee broadband',        'HOME'],
  ['o2 airtime',          'HOME'],
  ['o2 mobile',           'HOME'],
  ['three mobile',        'HOME'],
  ['three network',       'HOME'],
  ['giffgaff',            'HOME'],
  ['bt group',            'HOME'],
  ['bt broadband',        'HOME'],
  ['vodafone',            'HOME'],
  ['mortgage',            'HOME'],
  ['rent',                'HOME'],
  ['eon',                 'HOME'],
];

const DEFAULT_CATS = ['HOME', 'TRANSPORTATION', 'CREDIT CARDS', 'ENTERTAINMENT', 'HEALTH', 'PAYMENTS'];

function guessCategory(name, categories = DEFAULT_CATS) {
  const lower = name.toLowerCase();
  // Check if any custom category name appears in the bill name
  const customCats = categories.filter(c => !DEFAULT_CATS.includes(c));
  for (const cat of customCats) {
    if (lower.includes(cat.toLowerCase())) return cat;
  }
  // Check merchant map (ordered, most-specific first)
  for (const [key, cat] of CAT_MAP) {
    if (lower.includes(key)) {
      return categories.includes(cat) ? cat : (categories[0] || 'HOME');
    }
  }
  return categories.includes('HOME') ? 'HOME' : (categories[0] || 'HOME');
}

function ConfidenceBadge({ level }) {
  const styles = {
    high:   { bg: 'rgba(16,185,129,0.15)', color: '#10b981', border: 'rgba(16,185,129,0.3)', label: 'High' },
    medium: { bg: 'rgba(245,158,11,0.15)', color: '#f59e0b', border: 'rgba(245,158,11,0.3)', label: 'Medium' },
    low:    { bg: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.4)', border: 'rgba(255,255,255,0.1)', label: 'Low' },
  };
  const s = styles[level] || styles.low;
  return (
    <span style={{ fontSize: '10px', fontWeight: '700', padding: '2px 7px', borderRadius: '10px',
      background: s.bg, color: s.color, border: `1px solid ${s.border}`, textTransform: 'uppercase', letterSpacing: '0.3px' }}>
      {s.label}
    </span>
  );
}

const LABEL_STYLE = { display: 'block', color: 'var(--text-secondary)', fontSize: '12px', marginBottom: '6px', fontWeight: '500' };

const TYPE_OPTIONS = [
  { key: 'bill', label: 'Bill', color: 'var(--accent-primary)' },
  { key: 'debt', label: 'Debt', color: 'var(--danger)' },
  { key: 'savings', label: 'Savings', color: 'var(--success)' },
];

function SectionToolbar({ statusFilter, setStatusFilter, sortOrder, setSortOrder, items, cardStates }) {
  const pend = items.filter(s => cardStates[s.id] !== 'added' && cardStates[s.id] !== 'skipped').length;
  const added = items.filter(s => cardStates[s.id] === 'added').length;
  const skipped = items.filter(s => cardStates[s.id] === 'skipped').length;
  return (
    <div style={{ padding: '10px 4px 6px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
      <div style={{ display: 'flex', gap: '5px', overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
        {[
          { key: 'all', label: 'All', count: items.length },
          { key: 'pending', label: 'Pending', count: pend, color: 'var(--accent-primary)' },
          { key: 'added', label: 'Added', count: added, color: 'var(--success)' },
          { key: 'skipped', label: 'Skipped', count: skipped },
        ].map(tab => {
          const active = statusFilter === tab.key;
          return (
            <button key={tab.key} onClick={() => { haptic.light(); setStatusFilter(tab.key); }}
              style={{
                display: 'flex', alignItems: 'center', gap: '4px',
                padding: '5px 10px', borderRadius: '16px', fontSize: '11px', fontWeight: '600',
                cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0, transition: 'all 0.15s',
                border: active ? `1.5px solid ${tab.color || 'var(--accent-primary)'}` : '1px solid var(--border)',
                background: active ? `color-mix(in srgb, ${tab.color || 'var(--accent-primary)'} 10%, transparent)` : 'var(--glass)',
                color: active ? (tab.color || 'var(--accent-primary)') : 'var(--text-muted)',
              }}>
              {tab.label} <span style={{ fontWeight: '700' }}>{tab.count}</span>
            </button>
          );
        })}
      </div>
      <div style={{ display: 'flex', gap: '5px', overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
        {[
          { key: 'a-z', label: 'A → Z' },
          { key: 'z-a', label: 'Z → A' },
          { key: 'amount-asc', label: 'Amount ↑' },
          { key: 'amount-desc', label: 'Amount ↓' },
        ].map(opt => (
          <button key={opt.key} onClick={() => { haptic.light(); setSortOrder(opt.key); }}
            style={{
              padding: '4px 10px', borderRadius: '8px', fontSize: '11px', fontWeight: '600',
              cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0, transition: 'all 0.15s',
              border: sortOrder === opt.key ? '1.5px solid var(--accent-primary)' : '1px solid var(--border)',
              background: sortOrder === opt.key ? 'color-mix(in srgb, var(--accent-primary) 10%, transparent)' : 'var(--glass)',
              color: sortOrder === opt.key ? 'var(--accent-primary)' : 'var(--text-muted)',
            }}>
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function TypeSwitcher({ value, onChange }) {
  return (
    <div style={{ marginBottom: '10px' }}>
      <label style={LABEL_STYLE}>Import as</label>
      <div style={{ display: 'flex', gap: '6px' }}>
        {TYPE_OPTIONS.map(opt => (
          <button key={opt.key} type="button" onClick={() => { haptic.light(); onChange(opt.key); }}
            style={{
              flex: 1, padding: '8px', borderRadius: '10px', fontSize: '12px', fontWeight: '600',
              cursor: 'pointer', textAlign: 'center', transition: 'all 0.15s',
              border: value === opt.key ? `2px solid ${opt.color}` : '1px solid var(--border)',
              background: value === opt.key ? `color-mix(in srgb, ${opt.color} 10%, transparent)` : 'var(--glass)',
              color: value === opt.key ? opt.color : 'var(--text-muted)',
            }}>
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}

// cardState: 'pending' | 'added' | 'skipped'
function SuggestionCard({ suggestion, checked, cardState = 'pending', categories = DEFAULT_CATS, initialCategory, initialFrequency, onToggle, onEditName, onEditAmount, onEditCategory, onEditFrequency, onAddCategory, onAddOne, onSkipOne, onUndoOne }) {
  const [localType, setLocalType] = useState(suggestion.type || 'bill');
  const [expandedAfterAction, setExpandedAfterAction] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [editingAmount, setEditingAmount] = useState(false);
  const [showNewCatInput, setShowNewCatInput] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [localName, setLocalName] = useState(suggestion.displayName);
  const [localAmount, setLocalAmount] = useState(suggestion.avgAmount.toFixed(2));
  const [localCategory, setLocalCategory] = useState(initialCategory || guessCategory(suggestion.displayName, categories));
  // Bill form state
  const [localRecurring, setLocalRecurring] = useState(true);
  const [localFrequency, setLocalFrequency] = useState(initialFrequency || FREQ_MAP[suggestion.frequency] || 'Monthly');
  const [localPaymentDate, setLocalPaymentDate] = useState(suggestion.paymentDay || '');
  const [localPaymentDay, setLocalPaymentDay] = useState('');
  const [localStartDate, setLocalStartDate] = useState('');
  const [localStartMonth, setLocalStartMonth] = useState('');
  // Debt form state
  const [debtType, setDebtType] = useState('Credit Card');
  const [debtPaymentMode, setDebtPaymentMode] = useState('recurring');
  const [debtInterestRate, setDebtInterestRate] = useState('');
  const [debtMinPayment, setDebtMinPayment] = useState('');
  const [debtRecurringPayment, setDebtRecurringPayment] = useState(suggestion.avgAmount.toFixed(2));
  const [debtPaymentDate, setDebtPaymentDate] = useState('');
  // Savings form state
  const [savingsCategory, setSavingsCategory] = useState('Emergency');
  const [savingsStarting, setSavingsStarting] = useState('');
  const [savingsTarget, setSavingsTarget] = useState('');
  const [savingsMonthly, setSavingsMonthly] = useState(suggestion.avgAmount.toFixed(2));

  const commitName = () => { setEditingName(false); onEditName(suggestion.id, localName); };
  const commitAmount = () => { setEditingAmount(false); onEditAmount(suggestion.id, parseFloat(localAmount) || suggestion.avgAmount); };

  const isAdded   = cardState === 'added';
  const isSkipped = cardState === 'skipped';
  const pending   = !isAdded && !isSkipped;
  const showForm  = pending || expandedAfterAction;

  return (
    <div style={{
      background: isAdded ? 'color-mix(in srgb, var(--success) 6%, transparent)' : isSkipped ? 'var(--glass)' : checked ? 'color-mix(in srgb, var(--accent-primary) 5%, transparent)' : 'var(--glass)',
      border: `1px solid ${isAdded ? 'color-mix(in srgb, var(--success) 25%, transparent)' : isSkipped ? 'var(--border)' : checked ? 'color-mix(in srgb, var(--accent-primary) 20%, transparent)' : 'var(--border)'}`,
      borderLeft: (isAdded && !expandedAfterAction) ? '3px solid var(--success)' : isSkipped ? undefined : `3px solid ${localType === 'debt' ? 'var(--danger)' : localType === 'savings' ? 'var(--success)' : 'var(--accent-primary)'}`,
      borderRadius: '12px', padding: '12px 14px', marginBottom: '8px', transition: 'all 0.2s',
      opacity: isSkipped && !expandedAfterAction ? 0.55 : 1,
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>

        {/* Checkbox when pending, green tick when added */}
        {pending && (
          <div onClick={() => { haptic.light(); onToggle(suggestion.id); }}
            style={{ width: '22px', height: '22px', borderRadius: '6px', flexShrink: 0, marginTop: '1px', cursor: 'pointer',
              border: `2px solid ${checked ? 'var(--accent-primary)' : 'var(--border)'}`,
              background: checked ? 'linear-gradient(135deg, var(--accent-primary), var(--success))' : 'transparent',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', color: '#fff' }}>
            {checked && '\u2713'}
          </div>
        )}
        {isAdded && (
          <div style={{ width: '22px', height: '22px', borderRadius: '6px', flexShrink: 0, marginTop: '1px',
            background: 'rgba(16,185,129,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '12px', color: '#10b981' }}>{'\u2713'}</div>
        )}

        {/* Content */}
        <div style={{ flex: 1, minWidth: 0 }}>

          {/* Name row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px', flexWrap: 'wrap' }}>
            {editingName && pending ? (
              <input autoFocus value={localName} onChange={e => setLocalName(e.target.value)}
                onBlur={commitName} onKeyDown={e => e.key === 'Enter' && commitName()}
                style={{ fontSize: '14px', fontWeight: '600', background: 'var(--glass)',
                  border: '1px solid color-mix(in srgb, var(--accent-primary) 40%, transparent)', borderRadius: '6px', padding: '2px 6px',
                  color: 'var(--text-primary)', outline: 'none', flex: 1 }} />
            ) : (
              <span onClick={() => pending && setEditingName(true)}
                style={{ fontSize: '14px', fontWeight: '600',
                  color: isAdded ? 'var(--success)' : isSkipped ? 'var(--text-muted)' : 'var(--text-primary)',
                  cursor: pending ? 'text' : 'default',
                  borderBottom: pending ? '1px dashed var(--border)' : 'none', paddingBottom: '1px' }}>
                {localName}
              </span>
            )}
            {pending && <ConfidenceBadge level={suggestion.confidenceLevel} />}
            {isAdded && <span style={{ fontSize: '10px', fontWeight: '700', color: '#10b981',
              background: 'rgba(16,185,129,0.15)', padding: '2px 7px', borderRadius: '10px' }}>Added</span>}
            {isSkipped && <span style={{ fontSize: '10px', fontWeight: '700', color: 'var(--text-muted)', background: 'var(--glass)', border: '1px solid var(--border)', padding: '2px 7px', borderRadius: '10px' }}>Skipped</span>}
          </div>

          {/* Type switcher */}
          {showForm && <TypeSwitcher value={localType} onChange={setLocalType} />}

          {/* Amount */}
          <div style={{ marginBottom: showForm ? '10px' : '4px' }}>
            <label style={LABEL_STYLE}>Amount</label>
            {editingAmount && pending ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span style={{ fontSize: '14px', color: 'var(--text-muted)' }}>£</span>
                <NumericInput autoFocus value={localAmount} onChange={e => setLocalAmount(e.target.value)}
                  onBlur={commitAmount}
                  className="input" style={{ flex: 1 }} />
              </div>
            ) : (
              <div onClick={() => pending && setEditingAmount(true)}
                className="input" style={{
                  cursor: pending ? 'text' : 'default',
                  color: isAdded ? 'var(--success)' : isSkipped ? 'var(--text-muted)' : 'var(--text-primary)',
                }}>
                £{parseFloat(localAmount).toFixed(2)}
              </div>
            )}
          </div>

          {/* Form fields — conditional on localType */}
          {showForm && localType === 'bill' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '12px' }}>

              {/* Category */}
              <div>
                <label style={LABEL_STYLE}>Category</label>
                {!showNewCatInput ? (
                  <Picker className="input" value={localCategory} onChange={(e) => {
                    if (e.target.value === '__new__') {
                      setShowNewCatInput(true);
                      return;
                    }
                    haptic.light();
                    setLocalCategory(e.target.value);
                    onEditCategory(suggestion.id, e.target.value);
                  }} options={[...categories.map(c => ({value:c,label:c})), {value:'__new__',label:'+ Create new category...'}]} />
                ) : (
                  <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                    <input autoFocus value={newCatName} onChange={e => setNewCatName(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Enter' && newCatName.trim()) {
                          const name = newCatName.trim().toUpperCase();
                          if (onAddCategory && onAddCategory(name)) {
                            setLocalCategory(name); onEditCategory(suggestion.id, name);
                            setNewCatName(''); setShowNewCatInput(false); haptic.success();
                          }
                        }
                        if (e.key === 'Escape') { setShowNewCatInput(false); setNewCatName(''); }
                      }}
                      placeholder="New category name" className="input" style={{ flex: 1 }} />
                    <button onClick={() => {
                      if (!newCatName.trim()) return;
                      const name = newCatName.trim().toUpperCase();
                      if (onAddCategory && onAddCategory(name)) {
                        setLocalCategory(name); onEditCategory(suggestion.id, name);
                        setNewCatName(''); setShowNewCatInput(false); haptic.success();
                      }
                    }} className="btn btn-primary" style={{ padding: '8px 14px', fontSize: '13px' }}>Add</button>
                    <button onClick={() => { setShowNewCatInput(false); setNewCatName(''); }}
                      style={{ padding: '8px 10px', borderRadius: '10px', border: '1px solid var(--border)',
                        background: 'var(--glass)', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '13px' }}>✕</button>
                  </div>
                )}
              </div>

              {/* Bill Type toggle */}
              <div>
                <label style={LABEL_STYLE}>Bill Type</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button type="button" onClick={() => { haptic.light(); setLocalRecurring(true); if (localFrequency === 'One-off') setLocalFrequency('Monthly'); }}
                    style={{ flex: 1, padding: '10px', borderRadius: '10px', fontSize: '13px', fontWeight: '500', cursor: 'pointer',
                      border: localRecurring ? '2px solid var(--accent-primary)' : '1px solid var(--border)',
                      background: localRecurring ? 'color-mix(in srgb, var(--accent-primary) 8%, transparent)' : 'var(--glass)',
                      color: localRecurring ? 'var(--accent-primary)' : 'var(--text-muted)',
                    }}>↻ Recurring</button>
                  <button type="button" onClick={() => { haptic.light(); setLocalRecurring(false); setLocalFrequency('One-off'); }}
                    style={{ flex: 1, padding: '10px', borderRadius: '10px', fontSize: '13px', fontWeight: '500', cursor: 'pointer',
                      border: !localRecurring ? '2px solid var(--warning)' : '1px solid var(--border)',
                      background: !localRecurring ? 'color-mix(in srgb, var(--warning) 8%, transparent)' : 'var(--glass)',
                      color: !localRecurring ? 'var(--warning)' : 'var(--text-muted)',
                    }}>One-off</button>
                </div>
              </div>

              {/* Frequency (recurring only) */}
              {localRecurring && (
                <div>
                  <label style={LABEL_STYLE}>Frequency</label>
                  <Picker className="input" value={localFrequency} onChange={(e) => {
                    haptic.light();
                    setLocalFrequency(e.target.value);
                    setLocalPaymentDate(''); setLocalPaymentDay(''); setLocalStartDate(''); setLocalStartMonth('');
                    onEditFrequency(suggestion.id, e.target.value);
                  }} options={['Weekly','Fortnightly','Monthly','Quarterly','Yearly']} />
                </div>
              )}

              {/* Payment date — contextual based on frequency (matching Add Bill form) */}
              {!localRecurring ? (
                <div>
                  <label style={LABEL_STYLE}>Due date</label>
                  <input type="date" onKeyDown={e => e.preventDefault()} className="input" value={localPaymentDate} onChange={e => setLocalPaymentDate(e.target.value)} />
                </div>
              ) : (localFrequency === 'Weekly' || localFrequency === 'Fortnightly') ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div>
                    <label style={LABEL_STYLE}>Day of week</label>
                    <Picker className="input" value={localPaymentDay} onChange={e => setLocalPaymentDay(e.target.value)} placeholder="Select day..." options={[{value:'1',label:'Monday'},{value:'2',label:'Tuesday'},{value:'3',label:'Wednesday'},{value:'4',label:'Thursday'},{value:'5',label:'Friday'},{value:'6',label:'Saturday'},{value:'0',label:'Sunday'}]} />
                  </div>
                  {localFrequency === 'Fortnightly' && (
                    <div>
                      <label style={LABEL_STYLE}>Starting from</label>
                      <input type="date" onKeyDown={e => e.preventDefault()} className="input" value={localStartDate} onChange={e => setLocalStartDate(e.target.value)} />
                    </div>
                  )}
                </div>
              ) : localFrequency === 'Monthly' ? (
                <div>
                  <label style={LABEL_STYLE}>Day of month</label>
                  <NumericInput className="input" placeholder="1-31" min="1" max="31" value={localPaymentDate}
                    onChange={e => { const v = e.target.value; if (v === '') { setLocalPaymentDate(''); return; } const n = parseInt(v); if (!isNaN(n)) setLocalPaymentDate(String(Math.min(31, Math.max(1, n)))); }}
                    />
                </div>
              ) : localFrequency === 'Quarterly' ? (
                <div style={{ display: 'flex', gap: '10px' }}>
                  <div style={{ flex: 1 }}>
                    <label style={LABEL_STYLE}>Day of month</label>
                    <NumericInput className="input" placeholder="1-31" min="1" max="31" value={localPaymentDate}
                      onChange={e => { const v = e.target.value; if (v === '') { setLocalPaymentDate(''); return; } const n = parseInt(v); if (!isNaN(n)) setLocalPaymentDate(String(Math.min(31, Math.max(1, n)))); }}
                      />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={LABEL_STYLE}>Starting month</label>
                    <Picker className="input" value={localStartMonth} onChange={e => setLocalStartMonth(e.target.value)} placeholder="Select..." options={[{value:'1',label:'January'},{value:'2',label:'February'},{value:'3',label:'March'},{value:'4',label:'April'},{value:'5',label:'May'},{value:'6',label:'June'},{value:'7',label:'July'},{value:'8',label:'August'},{value:'9',label:'September'},{value:'10',label:'October'},{value:'11',label:'November'},{value:'12',label:'December'}]} />
                  </div>
                </div>
              ) : localFrequency === 'Yearly' ? (
                <div>
                  <label style={LABEL_STYLE}>Annual date</label>
                  <input type="date" onKeyDown={e => e.preventDefault()} className="input" value={localPaymentDate} onChange={e => setLocalPaymentDate(e.target.value)} />
                </div>
              ) : null}
            </div>
          )}

          {/* Debt form */}
          {showForm && localType === 'debt' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '12px' }}>
              <div>
                <label style={LABEL_STYLE}>Total Amount Owed</label>
                <div className="input">{'\u00A3'}{parseFloat(localAmount).toFixed(2)}</div>
              </div>
              <div>
                <label style={LABEL_STYLE}>Debt Type</label>
                <Picker className="input" value={debtType} onChange={e => { haptic.light(); setDebtType(e.target.value); }} options={DEBT_TYPES} />
              </div>
              <div>
                <label style={LABEL_STYLE}>Payment Structure</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                  {[
                    { key: 'recurring', label: '↻ Recurring', color: 'var(--accent-primary)' },
                    { key: 'one-off', label: '◎ One-off', color: 'var(--warning)' },
                    { key: 'installment', label: '▤ Installment', color: '#a78bfa' },
                    { key: 'bnpl', label: '⏱ Pay Later', color: 'var(--success)' },
                  ].map(opt => (
                    <button key={opt.key} type="button" onClick={() => { haptic.light(); setDebtPaymentMode(opt.key); }}
                      style={{ padding: '10px 8px', borderRadius: '10px', fontSize: '13px', fontWeight: '500', cursor: 'pointer', textAlign: 'center',
                        border: debtPaymentMode === opt.key ? `2px solid ${opt.color}` : '1px solid var(--border)',
                        background: debtPaymentMode === opt.key ? `color-mix(in srgb, ${opt.color} 8%, transparent)` : 'var(--glass)',
                        color: debtPaymentMode === opt.key ? opt.color : 'var(--text-muted)',
                      }}>{opt.label}</button>
                  ))}
                </div>
              </div>
              {debtPaymentMode === 'recurring' && (
                <>
                  <div>
                    <label style={LABEL_STYLE}>Interest Rate (% APR)</label>
                    <NumericInput className="input" placeholder="0" value={debtInterestRate} onChange={e => setDebtInterestRate(e.target.value)} />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    <div>
                      <label style={LABEL_STYLE}>Minimum Payment</label>
                      <NumericInput className="input" placeholder="0.00" value={debtMinPayment} onChange={e => setDebtMinPayment(e.target.value)} />
                    </div>
                    <div>
                      <label style={LABEL_STYLE}>Auto Monthly</label>
                      <NumericInput className="input" placeholder="0.00" value={debtRecurringPayment} onChange={e => setDebtRecurringPayment(e.target.value)} />
                    </div>
                  </div>
                  <div>
                    <label style={LABEL_STYLE}>Payment Day</label>
                    <NumericInput className="input" placeholder="Day of month (1-31)" min="1" max="31" value={debtPaymentDate}
                      onChange={e => { const v = e.target.value; if (v === '') { setDebtPaymentDate(''); return; } const n = parseInt(v); if (!isNaN(n)) setDebtPaymentDate(String(Math.min(31, Math.max(1, n)))); }}
                      />
                  </div>
                </>
              )}
            </div>
          )}

          {/* Savings form */}
          {showForm && localType === 'savings' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '12px' }}>
              <div>
                <label style={LABEL_STYLE}>Category</label>
                <Picker className="input" value={savingsCategory} onChange={e => { haptic.light(); setSavingsCategory(e.target.value); }} options={SAVINGS_CATEGORIES} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={LABEL_STYLE}>Starting Amount</label>
                  <NumericInput className="input" placeholder="0.00 (optional)" value={savingsStarting} onChange={e => setSavingsStarting(e.target.value)} />
                </div>
                <div>
                  <label style={LABEL_STYLE}>Target Amount</label>
                  <NumericInput className="input" placeholder="0.00 (optional)" value={savingsTarget} onChange={e => setSavingsTarget(e.target.value)} />
                </div>
              </div>
              <div>
                <label style={LABEL_STYLE}>Monthly Auto-Save</label>
                <NumericInput className="input" placeholder="0.00 (optional)" value={savingsMonthly} onChange={e => setSavingsMonthly(e.target.value)} />
              </div>
            </div>
          )}

          {/* Per-card action buttons */}
          {showForm && (
            <div style={{ display: 'flex', gap: '6px' }}>
              <button onClick={() => {
                haptic.success();
                if (expandedAfterAction) setExpandedAfterAction(false);
                if (localType === 'debt') {
                  onAddOne(suggestion.id, {
                    name: localName, totalAmount: parseFloat(localAmount) || 0, amount: parseFloat(localAmount) || 0,
                    type: debtType, paymentMode: debtPaymentMode,
                    interestRate: parseFloat(debtInterestRate) || 0, minimumPayment: parseFloat(debtMinPayment) || 0,
                    recurringPayment: parseFloat(debtRecurringPayment) || 0, paymentDate: debtPaymentDate,
                    _typeOverride: 'debt',
                  });
                } else if (localType === 'savings') {
                  onAddOne(suggestion.id, {
                    name: localName, amount: parseFloat(savingsMonthly) || suggestion.avgAmount,
                    category: savingsCategory, startingAmount: parseFloat(savingsStarting) || 0,
                    targetAmount: parseFloat(savingsTarget) || 0, monthlyContribution: parseFloat(savingsMonthly) || 0,
                    _typeOverride: 'savings',
                  });
                } else {
                  onAddOne(suggestion.id, { name: localName, amount: parseFloat(localAmount) || suggestion.avgAmount, category: localCategory, recurring: localRecurring, frequency: localRecurring ? localFrequency : '', paymentDate: localPaymentDate, paymentDay: localPaymentDay, startDate: localStartDate, startMonth: localStartMonth, _typeOverride: 'bill' });
                }
              }}
                style={{ flex: 1, padding: '7px 10px', borderRadius: '8px', fontSize: '12px', fontWeight: '600',
                  cursor: 'pointer',
                  background: localType === 'debt' ? 'linear-gradient(135deg, var(--danger), #dc2626)' : localType === 'savings' ? 'linear-gradient(135deg, var(--success), #059669)' : 'color-mix(in srgb, var(--accent-primary) 10%, transparent)',
                  border: localType === 'bill' ? '1px solid color-mix(in srgb, var(--accent-primary) 25%, transparent)' : 'none',
                  color: localType === 'bill' ? 'var(--accent-primary)' : '#fff' }}>
                {expandedAfterAction ? '✓ Update' : `+ Add ${localType === 'debt' ? 'debt' : localType === 'savings' ? 'savings goal' : 'this one'}`}
              </button>
              <button onClick={() => { haptic.light(); onSkipOne(suggestion.id); }}
                style={{ padding: '7px 12px', borderRadius: '8px', fontSize: '12px', fontWeight: '600',
                  cursor: 'pointer', background: 'var(--glass)', border: '1px solid var(--border)',
                  color: 'var(--text-muted)' }}>
                Skip
              </button>
            </div>
          )}

          {/* Added/Skipped action bar */}
          {(isAdded || isSkipped) && !expandedAfterAction && (
            <div style={{ display: 'flex', gap: '6px', marginTop: '6px' }}>
              {isAdded && (
                <button onClick={() => { haptic.light(); setExpandedAfterAction(true); }}
                  style={{ flex: 1, padding: '8px', borderRadius: '8px', fontSize: '12px', fontWeight: '600',
                    cursor: 'pointer', background: 'var(--glass)', border: '1px solid var(--border)',
                    color: 'var(--accent-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                  <Icons.Edit size={13} /> Edit
                </button>
              )}
              <button onClick={() => { haptic.light(); onUndoOne(suggestion.id); setExpandedAfterAction(false); }}
                style={{ flex: 1, padding: '8px', borderRadius: '8px', fontSize: '12px', fontWeight: '600',
                  cursor: 'pointer', background: 'var(--glass)', border: '1px solid var(--border)',
                  color: isAdded ? 'var(--warning)' : 'var(--accent-primary)',
                  ...(isSkipped ? { background: 'color-mix(in srgb, var(--accent-primary) 15%, transparent)', border: '1.5px solid var(--accent-primary)' } : {}) }}>
                {isAdded ? 'Remove' : 'Restore'}
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}

// ── Debt Suggestion Card ──
// Mini Add Debt form per imported debt item — matches the real Add Debt screen fields
function DebtSuggestionCard({ suggestion, checked, cardState = 'pending', onToggle, onAddOne, onSkipOne, onUndoOne }) {
  const [localType, setLocalType] = useState(suggestion.type || 'debt');
  const [expandedAfterAction, setExpandedAfterAction] = useState(false);
  const [localName, setLocalName] = useState(suggestion.displayName);
  const [editingName, setEditingName] = useState(false);
  const [localAmount, setLocalAmount] = useState(suggestion.avgAmount.toFixed(2));
  const [editingAmount, setEditingAmount] = useState(false);
  const [debtType, setDebtType] = useState('Credit Card');
  const [paymentMode, setPaymentMode] = useState('recurring');
  const [interestRate, setInterestRate] = useState('');
  const [minimumPayment, setMinimumPayment] = useState('');
  const [recurringPayment, setRecurringPayment] = useState(suggestion.avgAmount.toFixed(2));
  const [paymentDate, setPaymentDate] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [installmentMonths, setInstallmentMonths] = useState('');
  const [installmentStartDate, setInstallmentStartDate] = useState('');
  const [bnplPromoMonths, setBnplPromoMonths] = useState('');
  const [bnplStartDate, setBnplStartDate] = useState('');
  const [bnplPostInterest, setBnplPostInterest] = useState('');
  const [bnplPostPayment, setBnplPostPayment] = useState('');
  // Bill form state (if user switches type to bill)
  const [billCategory, setBillCategory] = useState('HOME');
  const [billRecurring, setBillRecurring] = useState(true);
  const [billFrequency, setBillFrequency] = useState('Monthly');
  const [billPaymentDate, setBillPaymentDate] = useState('');
  // Savings form state (if user switches type to savings)
  const [savCat, setSavCat] = useState('Emergency');
  const [savStarting, setSavStarting] = useState('');
  const [savTarget, setSavTarget] = useState('');
  const [savMonthly, setSavMonthly] = useState(suggestion.avgAmount.toFixed(2));

  const isAdded = cardState === 'added';
  const isSkipped = cardState === 'skipped';
  const pending = !isAdded && !isSkipped;
  const showForm = pending || expandedAfterAction;
  const totalAmount = parseFloat(localAmount) || 0;
  const installMonths = parseInt(installmentMonths) || 0;
  const installmentMonthly = installMonths > 0 && totalAmount > 0 ? Math.ceil((totalAmount / installMonths) * 100) / 100 : 0;
  const bnplMonthsNum = parseInt(bnplPromoMonths) || 0;
  const bnplMonthly = bnplMonthsNum > 0 && totalAmount > 0 ? Math.ceil((totalAmount / bnplMonthsNum) * 100) / 100 : 0;

  const handleAdd = () => {
    haptic.success();
    onAddOne(suggestion.id, {
      name: localName,
      totalAmount: parseFloat(localAmount) || 0,
      amount: parseFloat(localAmount) || 0,
      type: debtType,
      paymentMode,
      interestRate: parseFloat(interestRate) || 0,
      minimumPayment: parseFloat(minimumPayment) || 0,
      recurringPayment: parseFloat(recurringPayment) || 0,
      paymentDate,
      dueDate,
      installmentMonths: parseInt(installmentMonths) || 0,
      installmentStartDate,
      bnplPromoMonths: parseInt(bnplPromoMonths) || 0,
      bnplStartDate,
      bnplPostInterest: parseFloat(bnplPostInterest) || 0,
      bnplPostPayment: parseFloat(bnplPostPayment) || 0,
      _typeOverride: localType,
    });
  };

  return (
    <div style={{
      background: isAdded ? 'color-mix(in srgb, var(--success) 6%, transparent)' : isSkipped ? 'var(--glass)' : 'var(--bg-card, var(--glass))',
      border: `1px solid ${isAdded ? 'color-mix(in srgb, var(--success) 25%, transparent)' : isSkipped ? 'var(--border)' : 'var(--border)'}`,
      borderLeft: (isAdded && !expandedAfterAction) ? '3px solid var(--success)' : isSkipped ? undefined : `3px solid ${localType === 'bill' ? 'var(--accent-primary)' : localType === 'savings' ? 'var(--success)' : 'var(--danger)'}`,
      borderRadius: '12px', padding: '12px 14px', marginBottom: '8px', transition: 'all 0.2s',
      opacity: isSkipped && !expandedAfterAction ? 0.55 : 1,
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>

        {pending && (
          <div onClick={() => { haptic.light(); onToggle(suggestion.id); }}
            style={{ width: '22px', height: '22px', borderRadius: '6px', flexShrink: 0, marginTop: '1px', cursor: 'pointer',
              border: `2px solid ${checked ? 'var(--danger)' : 'var(--border)'}`,
              background: checked ? 'linear-gradient(135deg, #f43f5e, #e11d48)' : 'transparent',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', color: '#fff' }}>
            {checked && '\u2713'}
          </div>
        )}
        {isAdded && (
          <div style={{ width: '22px', height: '22px', borderRadius: '6px', flexShrink: 0, marginTop: '1px',
            background: 'color-mix(in srgb, var(--success) 20%, transparent)', display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '12px', color: 'var(--success)' }}>{'\u2713'}</div>
        )}

        <div style={{ flex: 1, minWidth: 0 }}>

          {/* Name row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px', flexWrap: 'wrap' }}>
            {editingName && pending ? (
              <input autoFocus value={localName} onChange={e => setLocalName(e.target.value)}
                onBlur={() => setEditingName(false)} onKeyDown={e => e.key === 'Enter' && setEditingName(false)}
                className="input" style={{ flex: 1, fontSize: '14px', fontWeight: '600' }} />
            ) : (
              <span onClick={() => pending && setEditingName(true)}
                style={{ fontSize: '14px', fontWeight: '600',
                  color: isAdded ? 'var(--success)' : isSkipped ? 'var(--text-muted)' : 'var(--text-primary)',
                  cursor: pending ? 'text' : 'default',
                  borderBottom: pending ? '1px dashed var(--border)' : 'none', paddingBottom: '1px' }}>
                {localName}
              </span>
            )}
            {pending && <span style={{ fontSize: '10px', fontWeight: '700', padding: '2px 7px', borderRadius: '10px',
              background: 'color-mix(in srgb, var(--danger) 12%, transparent)', color: 'var(--danger)',
              border: '1px solid color-mix(in srgb, var(--danger) 25%, transparent)' }}>DEBT</span>}
            {isAdded && <span style={{ fontSize: '10px', fontWeight: '700', color: 'var(--success)',
              background: 'color-mix(in srgb, var(--success) 15%, transparent)', padding: '2px 7px', borderRadius: '10px' }}>Added</span>}
            {isSkipped && <span style={{ fontSize: '10px', fontWeight: '700', color: 'var(--text-muted)', background: 'var(--glass)', border: '1px solid var(--border)', padding: '2px 7px', borderRadius: '10px' }}>Skipped</span>}
          </div>

          {showForm && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '10px', marginBottom: '12px' }}>

              {/* Type switcher */}
              <TypeSwitcher value={localType} onChange={setLocalType} />

              {/* Bill form (if user switches from debt to bill) */}
              {localType === 'bill' && (
                <>
                  <div>
                    <label style={LABEL_STYLE}>Amount</label>
                    <div className="input">£{parseFloat(localAmount).toFixed(2)}</div>
                  </div>
                  <div>
                    <label style={LABEL_STYLE}>Category</label>
                    <Picker className="input" value={billCategory} onChange={e => { haptic.light(); setBillCategory(e.target.value); }} options={DEFAULT_CATS} />
                  </div>
                  <div>
                    <label style={LABEL_STYLE}>Frequency</label>
                    <Picker className="input" value={billFrequency} onChange={e => { haptic.light(); setBillFrequency(e.target.value); }} options={['Weekly','Fortnightly','Monthly','Quarterly','Yearly']} />
                  </div>
                  {billFrequency === 'Monthly' && (
                    <div>
                      <label style={LABEL_STYLE}>Day of month</label>
                      <NumericInput className="input" placeholder="1-31" min="1" max="31" value={billPaymentDate}
                        onChange={e => { const v = e.target.value; if (v === '') { setBillPaymentDate(''); return; } const n = parseInt(v); if (!isNaN(n)) setBillPaymentDate(String(Math.min(31, Math.max(1, n)))); }}
                        />
                    </div>
                  )}
                </>
              )}

              {/* Savings form (if user switches from debt to savings) */}
              {localType === 'savings' && (
                <>
                  <div>
                    <label style={LABEL_STYLE}>Category</label>
                    <Picker className="input" value={savCat} onChange={e => { haptic.light(); setSavCat(e.target.value); }} options={SAVINGS_CATEGORIES} />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    <div><label style={LABEL_STYLE}>Starting Amount</label><NumericInput className="input" placeholder="0.00" value={savStarting} onChange={e => setSavStarting(e.target.value)} /></div>
                    <div><label style={LABEL_STYLE}>Target Amount</label><NumericInput className="input" placeholder="0.00" value={savTarget} onChange={e => setSavTarget(e.target.value)} /></div>
                  </div>
                  <div><label style={LABEL_STYLE}>Monthly Auto-Save</label><NumericInput className="input" placeholder="0.00" value={savMonthly} onChange={e => setSavMonthly(e.target.value)} /></div>
                </>
              )}

              {/* Debt form (default for this card) */}
              {localType === 'debt' && (<div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {/* Total Amount Owed */}
              <div>
                <label style={LABEL_STYLE}>Total Amount Owed</label>
                {editingAmount ? (
                  <NumericInput autoFocus value={localAmount} onChange={e => setLocalAmount(e.target.value)}
                    onBlur={() => setEditingAmount(false)}
                    className="input" />
                ) : (
                  <div onClick={() => setEditingAmount(true)} className="input" style={{ cursor: 'text' }}>
                    £{parseFloat(localAmount).toFixed(2)}
                  </div>
                )}
              </div>

              {/* Debt Type */}
              <div>
                <label style={LABEL_STYLE}>Debt Type</label>
                <Picker className="input" value={debtType} onChange={e => { haptic.light(); setDebtType(e.target.value); }} options={DEBT_TYPES} />
              </div>

              {/* Payment Structure */}
              <div>
                <label style={LABEL_STYLE}>Payment Structure</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                  {[
                    { key: 'recurring', label: '↻ Recurring', color: 'var(--accent-primary)' },
                    { key: 'one-off', label: '◎ One-off', color: 'var(--warning)' },
                    { key: 'installment', label: '▤ Installment', color: '#a78bfa' },
                    { key: 'bnpl', label: '⏱ Pay Later', color: 'var(--success)' },
                  ].map(opt => (
                    <button key={opt.key} type="button" onClick={() => { haptic.light(); setPaymentMode(opt.key); }}
                      style={{ padding: '10px 8px', borderRadius: '10px', fontSize: '13px', fontWeight: '500', cursor: 'pointer', textAlign: 'center',
                        border: paymentMode === opt.key ? `2px solid ${opt.color}` : '1px solid var(--border)',
                        background: paymentMode === opt.key ? `color-mix(in srgb, ${opt.color} 8%, transparent)` : 'var(--glass)',
                        color: paymentMode === opt.key ? opt.color : 'var(--text-muted)',
                      }}>
                      {opt.label}
                    </button>
                  ))}
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '6px' }}>
                  {paymentMode === 'recurring' && 'Monthly payments until paid off (credit cards, loans)'}
                  {paymentMode === 'one-off' && 'Full amount due on a specific date'}
                  {paymentMode === 'installment' && 'Fixed number of monthly payments (finance, phone contract)'}
                  {paymentMode === 'bnpl' && 'Interest-free period, then monthly payments if not cleared'}
                </div>
              </div>

              {/* RECURRING fields */}
              {paymentMode === 'recurring' && (
                <>
                  <div>
                    <label style={LABEL_STYLE}>Interest Rate (% APR)</label>
                    <NumericInput className="input" placeholder="0" value={interestRate} onChange={e => setInterestRate(e.target.value)}
                      />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    <div>
                      <label style={LABEL_STYLE}>Minimum Payment</label>
                      <NumericInput className="input" placeholder="0.00" value={minimumPayment} onChange={e => setMinimumPayment(e.target.value)}
                        />
                    </div>
                    <div>
                      <label style={LABEL_STYLE}>Auto Monthly</label>
                      <NumericInput className="input" placeholder="0.00" value={recurringPayment} onChange={e => setRecurringPayment(e.target.value)}
                        />
                    </div>
                  </div>
                  <div>
                    <label style={LABEL_STYLE}>Payment Day</label>
                    <NumericInput className="input" placeholder="Day of month (1-31)" min="1" max="31" value={paymentDate}
                      onChange={e => { const v = e.target.value; if (v === '') { setPaymentDate(''); return; } const n = parseInt(v); if (!isNaN(n)) setPaymentDate(String(Math.min(31, Math.max(1, n)))); }}
                      />
                  </div>
                </>
              )}

              {/* ONE-OFF fields */}
              {paymentMode === 'one-off' && (
                <div>
                  <label style={LABEL_STYLE}>Due Date</label>
                  <input type="date" onKeyDown={e => e.preventDefault()} className="input" value={dueDate} onChange={e => setDueDate(e.target.value)} />
                </div>
              )}

              {/* INSTALLMENT fields */}
              {paymentMode === 'installment' && (
                <>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    <div>
                      <label style={LABEL_STYLE}>Number of Months</label>
                      <NumericInput className="input" placeholder="e.g., 12" value={installmentMonths} onChange={e => setInstallmentMonths(e.target.value)}
                        />
                    </div>
                    <div>
                      <label style={LABEL_STYLE}>Start Date</label>
                      <input type="date" onKeyDown={e => e.preventDefault()} className="input" value={installmentStartDate} onChange={e => setInstallmentStartDate(e.target.value)} />
                    </div>
                  </div>
                  <div>
                    <label style={LABEL_STYLE}>Interest Rate (% APR)</label>
                    <NumericInput className="input" placeholder="0 (often 0% for finance)" value={interestRate} onChange={e => setInterestRate(e.target.value)}
                      />
                  </div>
                  {installmentMonthly > 0 && (
                    <div style={{ padding: '10px 14px', background: 'color-mix(in srgb, #a78bfa 8%, transparent)', borderRadius: '10px',
                      border: '1px solid color-mix(in srgb, #a78bfa 20%, transparent)', fontSize: '13px', color: '#a78bfa' }}>
                      Monthly payment: <strong>£{installmentMonthly.toFixed(2)}</strong> × {installMonths} months
                    </div>
                  )}
                </>
              )}

              {/* BNPL fields */}
              {paymentMode === 'bnpl' && (
                <>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    <div>
                      <label style={LABEL_STYLE}>Interest-Free Months</label>
                      <NumericInput className="input" placeholder="e.g., 12" value={bnplPromoMonths} onChange={e => setBnplPromoMonths(e.target.value)}
                        />
                    </div>
                    <div>
                      <label style={LABEL_STYLE}>Start Date</label>
                      <input type="date" onKeyDown={e => e.preventDefault()} className="input" value={bnplStartDate} onChange={e => setBnplStartDate(e.target.value)} />
                    </div>
                  </div>
                  {bnplMonthly > 0 && (
                    <div style={{ padding: '10px 14px', background: 'color-mix(in srgb, var(--success) 8%, transparent)', borderRadius: '10px',
                      border: '1px solid color-mix(in srgb, var(--success) 20%, transparent)', fontSize: '13px', color: 'var(--success)' }}>
                      Pay <strong>£{bnplMonthly.toFixed(2)}/mo</strong> to clear within {bnplMonthsNum} months interest-free
                    </div>
                  )}
                  <div style={{ padding: '12px', background: 'var(--glass)', borderRadius: '10px', border: '1px solid var(--border)' }}>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '8px', fontWeight: '500' }}>IF NOT CLEARED BY END DATE:</div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                      <div>
                        <label style={{ display: 'block', color: 'var(--text-secondary)', fontSize: '12px', marginBottom: '4px' }}>Interest Rate (%)</label>
                        <NumericInput className="input" placeholder="e.g., 29.9" value={bnplPostInterest} onChange={e => setBnplPostInterest(e.target.value)}
                          />
                      </div>
                      <div>
                        <label style={{ display: 'block', color: 'var(--text-secondary)', fontSize: '12px', marginBottom: '4px' }}>Monthly Payment</label>
                        <NumericInput className="input" placeholder="0.00" value={bnplPostPayment} onChange={e => setBnplPostPayment(e.target.value)}
                          />
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>)}

            </div>
          )}

          {/* Action buttons */}
          {showForm && (
            <div style={{ display: 'flex', gap: '6px' }}>
              <button onClick={() => {
                haptic.success();
                if (expandedAfterAction) setExpandedAfterAction(false);
                if (localType === 'bill') {
                  onAddOne(suggestion.id, { name: localName, amount: parseFloat(localAmount) || 0, category: billCategory, recurring: billRecurring, frequency: billFrequency, paymentDate: billPaymentDate, _typeOverride: 'bill' });
                } else if (localType === 'savings') {
                  onAddOne(suggestion.id, { name: localName, amount: parseFloat(savMonthly) || 0, category: savCat, startingAmount: parseFloat(savStarting) || 0, targetAmount: parseFloat(savTarget) || 0, monthlyContribution: parseFloat(savMonthly) || 0, _typeOverride: 'savings' });
                } else {
                  handleAdd();
                }
              }}
                style={{ flex: 1, padding: '10px 10px', borderRadius: '10px', fontSize: '13px', fontWeight: '600',
                  cursor: 'pointer',
                  background: localType === 'debt' ? 'linear-gradient(135deg, var(--danger), #dc2626)' : localType === 'savings' ? 'linear-gradient(135deg, var(--success), #059669)' : 'color-mix(in srgb, var(--accent-primary) 10%, transparent)',
                  border: localType === 'bill' ? '1px solid color-mix(in srgb, var(--accent-primary) 25%, transparent)' : 'none',
                  color: localType === 'bill' ? 'var(--accent-primary)' : '#fff' }}>
                {expandedAfterAction ? '✓ Update' : `+ Add ${localType === 'debt' ? 'debt' : localType === 'savings' ? 'savings goal' : 'bill'}`}
              </button>
              {!expandedAfterAction && (
                <button onClick={() => { haptic.light(); onSkipOne(suggestion.id); }}
                  style={{ padding: '10px 14px', borderRadius: '10px', fontSize: '13px', fontWeight: '600',
                    cursor: 'pointer', background: 'var(--glass)', border: '1px solid var(--border)',
                    color: 'var(--text-muted)' }}>
                  Skip
                </button>
              )}
            </div>
          )}

          {(isAdded || isSkipped) && !expandedAfterAction && (
            <div style={{ display: 'flex', gap: '6px', marginTop: '6px' }}>
              {isAdded && (
                <button onClick={() => { haptic.light(); setExpandedAfterAction(true); }}
                  style={{ flex: 1, padding: '8px', borderRadius: '8px', fontSize: '12px', fontWeight: '600',
                    cursor: 'pointer', background: 'var(--glass)', border: '1px solid var(--border)',
                    color: 'var(--accent-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                  <Icons.Edit size={13} /> Edit
                </button>
              )}
              <button onClick={() => { haptic.light(); onUndoOne(suggestion.id); setExpandedAfterAction(false); }}
                style={{ flex: 1, padding: '8px', borderRadius: '8px', fontSize: '12px', fontWeight: '600',
                  cursor: 'pointer', background: 'var(--glass)', border: '1px solid var(--border)',
                  color: isAdded ? 'var(--warning)' : 'var(--accent-primary)',
                  ...(isSkipped ? { background: 'color-mix(in srgb, var(--accent-primary) 15%, transparent)', border: '1.5px solid var(--accent-primary)' } : {}) }}>
                {isAdded ? 'Remove' : 'Restore'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Savings Suggestion Card ──
// Mini Add Savings form per imported savings item — matches the real Add Savings screen
function SavingsSuggestionCard({ suggestion, checked, cardState = 'pending', onToggle, onAddOne, onSkipOne, onUndoOne }) {
  const [localType, setLocalType] = useState(suggestion.type || 'savings');
  const [expandedAfterAction, setExpandedAfterAction] = useState(false);
  const [localName, setLocalName] = useState(suggestion.displayName);
  const [editingName, setEditingName] = useState(false);
  const [savingsCategory, setSavingsCategory] = useState('Emergency');
  const [startingAmount, setStartingAmount] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [monthlyContribution, setMonthlyContribution] = useState(suggestion.avgAmount.toFixed(2));
  // Bill/Debt state (if user switches type)
  const [billCategory, setBillCategory] = useState('HOME');
  const [billFrequency, setBillFrequency] = useState('Monthly');
  const [billPaymentDate, setBillPaymentDate] = useState('');
  const [debtType, setDebtType] = useState('Credit Card');

  const isAdded = cardState === 'added';
  const isSkipped = cardState === 'skipped';
  const pending = !isAdded && !isSkipped;
  const showForm = pending || expandedAfterAction;

  const handleAdd = () => {
    haptic.success();
    if (expandedAfterAction) setExpandedAfterAction(false);
    onAddOne(suggestion.id, {
      name: localName,
      amount: parseFloat(monthlyContribution) || suggestion.avgAmount,
      category: savingsCategory,
      startingAmount: parseFloat(startingAmount) || 0,
      targetAmount: parseFloat(targetAmount) || 0,
      monthlyContribution: parseFloat(monthlyContribution) || 0,
      _typeOverride: localType,
    });
  };

  return (
    <div style={{
      background: isAdded ? 'color-mix(in srgb, var(--success) 6%, transparent)' : isSkipped ? 'var(--glass)' : 'var(--bg-card, var(--glass))',
      border: `1px solid ${isAdded ? 'color-mix(in srgb, var(--success) 25%, transparent)' : isSkipped ? 'var(--border)' : 'var(--border)'}`,
      borderLeft: (isAdded && !expandedAfterAction) ? '3px solid var(--success)' : isSkipped ? undefined : `3px solid ${localType === 'bill' ? 'var(--accent-primary)' : localType === 'debt' ? 'var(--danger)' : 'var(--success)'}`,
      borderRadius: '12px', padding: '12px 14px', marginBottom: '8px', transition: 'all 0.2s',
      opacity: isSkipped && !expandedAfterAction ? 0.55 : 1,
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>

        {pending && (
          <div onClick={() => { haptic.light(); onToggle(suggestion.id); }}
            style={{ width: '22px', height: '22px', borderRadius: '6px', flexShrink: 0, marginTop: '1px', cursor: 'pointer',
              border: `2px solid ${checked ? 'var(--success)' : 'var(--border)'}`,
              background: checked ? 'linear-gradient(135deg, #10b981, #059669)' : 'transparent',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', color: '#fff' }}>
            {checked && '\u2713'}
          </div>
        )}
        {isAdded && (
          <div style={{ width: '22px', height: '22px', borderRadius: '6px', flexShrink: 0, marginTop: '1px',
            background: 'color-mix(in srgb, var(--success) 20%, transparent)', display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '12px', color: 'var(--success)' }}>{'\u2713'}</div>
        )}

        <div style={{ flex: 1, minWidth: 0 }}>

          {/* Name row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px', flexWrap: 'wrap' }}>
            {editingName && pending ? (
              <input autoFocus value={localName} onChange={e => setLocalName(e.target.value)}
                onBlur={() => setEditingName(false)} onKeyDown={e => e.key === 'Enter' && setEditingName(false)}
                className="input" style={{ flex: 1, fontSize: '14px', fontWeight: '600' }} />
            ) : (
              <span onClick={() => pending && setEditingName(true)}
                style={{ fontSize: '14px', fontWeight: '600',
                  color: isAdded ? 'var(--success)' : isSkipped ? 'var(--text-muted)' : 'var(--text-primary)',
                  cursor: pending ? 'text' : 'default',
                  borderBottom: pending ? '1px dashed var(--border)' : 'none', paddingBottom: '1px' }}>
                {localName}
              </span>
            )}
            {pending && <span style={{ fontSize: '10px', fontWeight: '700', padding: '2px 7px', borderRadius: '10px',
              background: 'color-mix(in srgb, var(--success) 12%, transparent)', color: 'var(--success)',
              border: '1px solid color-mix(in srgb, var(--success) 25%, transparent)' }}>SAVINGS</span>}
            {isAdded && <span style={{ fontSize: '10px', fontWeight: '700', color: 'var(--success)',
              background: 'color-mix(in srgb, var(--success) 15%, transparent)', padding: '2px 7px', borderRadius: '10px' }}>Added</span>}
            {isSkipped && <span style={{ fontSize: '10px', fontWeight: '700', color: 'var(--text-muted)', background: 'var(--glass)', border: '1px solid var(--border)', padding: '2px 7px', borderRadius: '10px' }}>Skipped</span>}
          </div>

          {showForm && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '10px', marginBottom: '12px' }}>

              {/* Type switcher */}
              <TypeSwitcher value={localType} onChange={setLocalType} />

              {/* Bill form (if user switches from savings to bill) */}
              {localType === 'bill' && (
                <>
                  <div><label style={LABEL_STYLE}>Category</label>
                    <Picker className="input" value={billCategory} onChange={e => { haptic.light(); setBillCategory(e.target.value); }} options={DEFAULT_CATS} /></div>
                  <div><label style={LABEL_STYLE}>Frequency</label>
                    <Picker className="input" value={billFrequency} onChange={e => { haptic.light(); setBillFrequency(e.target.value); }} options={['Weekly','Fortnightly','Monthly','Quarterly','Yearly']} /></div>
                  {billFrequency === 'Monthly' && (<div><label style={LABEL_STYLE}>Day of month</label>
                    <NumericInput className="input" placeholder="1-31" min="1" max="31" value={billPaymentDate}
                      onChange={e => { const v = e.target.value; if (v === '') { setBillPaymentDate(''); return; } const n = parseInt(v); if (!isNaN(n)) setBillPaymentDate(String(Math.min(31, Math.max(1, n)))); }}
                      /></div>)}
                </>
              )}

              {/* Debt form (if user switches from savings to debt) */}
              {localType === 'debt' && (
                <>
                  <div><label style={LABEL_STYLE}>Total Amount Owed</label>
                    <div className="input">£{suggestion.avgAmount.toFixed(2)}</div></div>
                  <div><label style={LABEL_STYLE}>Debt Type</label>
                    <Picker className="input" value={debtType} onChange={e => { haptic.light(); setDebtType(e.target.value); }} options={DEBT_TYPES} /></div>
                </>
              )}

              {/* Savings form (default for this card) */}
              {localType === 'savings' && (<>
              <div>
                <label style={LABEL_STYLE}>Category</label>
                <Picker className="input" value={savingsCategory} onChange={e => { haptic.light(); setSavingsCategory(e.target.value); }} options={SAVINGS_CATEGORIES} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div><label style={LABEL_STYLE}>Starting Amount</label>
                  <NumericInput className="input" placeholder="0.00 (optional)" value={startingAmount}
                    onChange={e => setStartingAmount(e.target.value)} /></div>
                <div><label style={LABEL_STYLE}>Target Amount</label>
                  <NumericInput className="input" placeholder="0.00 (optional)" value={targetAmount}
                    onChange={e => setTargetAmount(e.target.value)} /></div>
              </div>
              <div><label style={LABEL_STYLE}>Monthly Auto-Save</label>
                <NumericInput className="input" placeholder="0.00 (optional)" value={monthlyContribution}
                  onChange={e => setMonthlyContribution(e.target.value)} /></div>
              </>)}
            </div>
          )}

          {/* Action buttons */}
          {showForm && (
            <div style={{ display: 'flex', gap: '6px' }}>
              <button onClick={() => {
                haptic.success();
                if (expandedAfterAction) setExpandedAfterAction(false);
                if (localType === 'bill') {
                  onAddOne(suggestion.id, { name: localName, amount: suggestion.avgAmount, category: billCategory, recurring: true, frequency: billFrequency, paymentDate: billPaymentDate, _typeOverride: 'bill' });
                } else if (localType === 'debt') {
                  onAddOne(suggestion.id, { name: localName, totalAmount: suggestion.avgAmount, amount: suggestion.avgAmount, type: debtType, paymentMode: 'recurring', recurringPayment: suggestion.avgAmount, _typeOverride: 'debt' });
                } else {
                  handleAdd();
                }
              }}
                style={{ flex: 1, padding: '10px 10px', borderRadius: '10px', fontSize: '13px', fontWeight: '600',
                  cursor: 'pointer',
                  background: localType === 'debt' ? 'linear-gradient(135deg, var(--danger), #dc2626)' : localType === 'savings' ? 'linear-gradient(135deg, var(--success), #059669)' : 'color-mix(in srgb, var(--accent-primary) 10%, transparent)',
                  border: localType === 'bill' ? '1px solid color-mix(in srgb, var(--accent-primary) 25%, transparent)' : 'none',
                  color: localType === 'bill' ? 'var(--accent-primary)' : '#fff' }}>
                {expandedAfterAction ? '✓ Update' : `+ Add ${localType === 'debt' ? 'debt' : localType === 'savings' ? 'savings goal' : 'bill'}`}
              </button>
              {!expandedAfterAction && (
                <button onClick={() => { haptic.light(); onSkipOne(suggestion.id); }}
                  style={{ padding: '10px 14px', borderRadius: '10px', fontSize: '13px', fontWeight: '600',
                    cursor: 'pointer', background: 'var(--glass)', border: '1px solid var(--border)',
                    color: 'var(--text-muted)' }}>
                  Skip
                </button>
              )}
            </div>
          )}

          {(isAdded || isSkipped) && !expandedAfterAction && (
            <div style={{ display: 'flex', gap: '6px', marginTop: '6px' }}>
              {isAdded && (
                <button onClick={() => { haptic.light(); setExpandedAfterAction(true); }}
                  style={{ flex: 1, padding: '8px', borderRadius: '8px', fontSize: '12px', fontWeight: '600',
                    cursor: 'pointer', background: 'var(--glass)', border: '1px solid var(--border)',
                    color: 'var(--accent-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                  <Icons.Edit size={13} /> Edit
                </button>
              )}
              <button onClick={() => { haptic.light(); onUndoOne(suggestion.id); setExpandedAfterAction(false); }}
                style={{ flex: 1, padding: '8px', borderRadius: '8px', fontSize: '12px', fontWeight: '600',
                  cursor: 'pointer', background: 'var(--glass)', border: '1px solid var(--border)',
                  color: isAdded ? 'var(--warning)' : 'var(--accent-primary)',
                  ...(isSkipped ? { background: 'color-mix(in srgb, var(--accent-primary) 15%, transparent)', border: '1.5px solid var(--accent-primary)' } : {}) }}>
                {isAdded ? 'Remove' : 'Restore'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function SectionHeader({ title, count, icon, expanded, onToggle }) {
  return (
    <div onClick={() => { haptic.light(); onToggle(); }} style={{ display: 'flex', alignItems: 'center', gap: '10px',
      padding: '12px 0 8px', cursor: 'pointer', userSelect: 'none' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{icon}</div>
      <span style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-primary)', flex: 1 }}>{title}</span>
      <span style={{ fontSize: '12px', color: 'var(--text-muted)', marginRight: '6px' }}>{count}</span>
      <Icons.ChevronDown size={14} style={{ color: 'var(--text-muted)', transition: 'transform 0.2s',
        transform: expanded ? 'rotate(180deg)' : 'none' }} />
    </div>
  );
}

export default function CSVImportFlow({ onComplete, onSkip, currencySymbol = '£', existingBills = [], skipIntro = false, categories: categoriesProp = DEFAULT_CATS, onAddCategory: onAddCategoryProp }) {
  const [stage, setStage] = useState('intro');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [diagnostics, setDiagnostics] = useState(null);
  const [suggestions, setSuggestions] = useState({ bills: [], debts: [], savings: [] });
  const [checked, setChecked] = useState({});
  const [cardStates, setCardStates] = useState({}); // id -> 'pending'|'added'|'skipped'
  const [edits, setEdits] = useState({});
  const [expanded, setExpanded] = useState({ bills: true, debts: true, savings: true });
  const [showLow, setShowLow] = useState(false);
  // Per-section filter and sort state
  const [sectionFilters, setSectionFilters] = useState({ bills: 'all', debts: 'all', savings: 'all' });
  const [sectionSorts, setSectionSorts] = useState({ bills: 'a-z', debts: 'a-z', savings: 'a-z' });
  const setFilterFor = (section) => (val) => setSectionFilters(prev => ({ ...prev, [section]: val }));
  const setSortFor = (section) => (val) => setSectionSorts(prev => ({ ...prev, [section]: val }));
  // Local categories list — grows when user creates new categories during import
  const [localCategories, setLocalCategories] = useState(categoriesProp);
  const categories = localCategories;
  const [addedItems, setAddedItems] = useState([]); // items added one-by-one
  const [summary, setSummary] = useState(null);

  const pickAndParse = async () => {
    setError(null);
    setLoading(true);
    try {
      const result = await pickFile();
      const file = result.files[0];
      if (!file) { setLoading(false); return; }

      const isPDF = file.mimeType === 'application/pdf' || file.name?.toLowerCase().endsWith('.pdf');

      let detected, diag;

      if (isPDF) {
        // PDF path — extract text and parse transactions on-device
        let pdfData;
        if (file.data) {
          const binaryString = atob(file.data);
          pdfData = new Uint8Array(binaryString.length);
          for (let i = 0; i < binaryString.length; i++) {
            pdfData[i] = binaryString.charCodeAt(i);
          }
        } else if (file.blob) {
          pdfData = new Uint8Array(await file.blob.arrayBuffer());
        } else {
          throw new Error('Could not read PDF file contents.');
        }
        const { importPDF } = await loadPdfImport();
        const res = await importPDF(pdfData);
        diag = res.diagnostics;
        // PDF can return either transactions (bank statement) or bills directly (budget spreadsheet)
        if (res.transactions) {
          detected = detectRecurring(res.transactions);
        } else {
          detected = { bills: res.bills || [], debts: res.debts || [], savings: res.savings || [] };
        }
      } else {
        // CSV/spreadsheet path
        let text;
        if (file.data) { text = atob(file.data); }
        else if (file.blob) { text = await file.blob.text(); }
        else { throw new Error('Could not read file contents.'); }

        const { headers, rows } = parseCSV(text);
        const isSpreadsheet = detectSpreadsheetFormat(headers, rows);

        if (isSpreadsheet) {
          const res = importSpreadsheet(text);
          diag = res.diagnostics;
          detected = { bills: res.bills, debts: res.debts, savings: [] };
        } else {
          const res = importCSV(text);
          diag = res.diagnostics;
          detected = detectRecurring(res.transactions);
        }
      }

      setDiagnostics(diag);
      setSuggestions(detected);

      // Adaptive expand: if <10 total items, open all sections; otherwise collapse
      const totalItems = (detected.bills?.length || 0) + (detected.debts?.length || 0) + (detected.savings?.length || 0);
      setExpanded({ bills: totalItems < 10, debts: totalItems < 10, savings: totalItems < 10 });

      // Auto-check high confidence
      const autoChecked = {};
      [...detected.bills, ...detected.debts, ...detected.savings]
        .filter(s => s.confidenceLevel === 'high')
        .forEach(s => { autoChecked[s.id] = true; });
      setChecked(autoChecked);
      setCardStates({});
      setAddedItems([]);

      setStage('suggestions');
      haptic.success();
    } catch (e) {
      setError(e.message || 'Could not read the file. Please check it is a valid CSV export.');
      haptic.error();
    }
    setLoading(false);
  };

  const toggleCheck   = useCallback((id) => { setChecked(c => ({ ...c, [id]: !c[id] })); }, []);
  const editName      = useCallback((id, name) => { setEdits(e => ({ ...e, [id + '_name']: name })); }, []);
  const editAmount    = useCallback((id, amt)  => { setEdits(e => ({ ...e, [id + '_amount']: amt })); }, []);
  const editCategory  = useCallback((id, cat)  => { setEdits(e => ({ ...e, [id + '_category']: cat })); }, []);
  const editFrequency = useCallback((id, freq) => { setEdits(e => ({ ...e, [id + '_frequency']: freq })); }, []);

  const handleAddCategory = useCallback((name) => {
    if (!name || localCategories.includes(name)) return false;
    setLocalCategories(prev => [...prev, name]);
    if (onAddCategoryProp) onAddCategoryProp(name);
    return true;
  }, [localCategories, onAddCategoryProp]);

  const getSuggestion = (s) => ({
    ...s,
    displayName:  edits[s.id + '_name']      ?? s.displayName,
    avgAmount:    edits[s.id + '_amount']    ?? s.avgAmount,
    category:     edits[s.id + '_category']  ?? guessCategory(s.displayName, categories),
    userFrequency: edits[s.id + '_frequency'] ?? FREQ_MAP[s.frequency] ?? 'Monthly',
  });

  // Per-card add
  const handleAddOne = useCallback((id, config) => {
    const allS = [...suggestions.bills, ...suggestions.debts, ...suggestions.savings];
    const s = allS.find(x => x.id === id);
    if (!s) return;
    const item = buildItem(s, config);

    // Move the suggestion to the correct section if the user changed its type
    const newType = config?._typeOverride || s.type || 'bill';
    if (newType !== (s.type || 'bill')) {
      setSuggestions(prev => {
        const remove = (arr) => arr.filter(x => x.id !== id);
        const movedItem = { ...s, type: newType };
        return {
          bills: newType === 'bill' ? [...remove(prev.bills), movedItem] : remove(prev.bills),
          debts: newType === 'debt' ? [...remove(prev.debts), movedItem] : remove(prev.debts),
          savings: newType === 'savings' ? [...remove(prev.savings), movedItem] : remove(prev.savings),
        };
      });
    }

    setAddedItems(prev => [...prev.filter(x => x.id !== id), item]);
    setCardStates(prev => ({ ...prev, [id]: 'added' }));
    onComplete({ bills: [...addedItems.filter(x => x.type === 'bill'), ...(item.type === 'bill' ? [item] : [])],
                 debts: [...addedItems.filter(x => x.type === 'debt'), ...(item.type === 'debt' ? [item] : [])],
                 savings: [...addedItems.filter(x => x.type === 'savings'), ...(item.type === 'savings' ? [item] : [])],
                 partial: true });
  }, [suggestions, addedItems, onComplete]);

  // Per-card skip
  const handleSkipOne = useCallback((id) => {
    setCardStates(prev => ({ ...prev, [id]: 'skipped' }));
    setChecked(prev => ({ ...prev, [id]: false }));
  }, []);

  // Undo add or skip
  const handleUndoOne = useCallback((id) => {
    setCardStates(prev => ({ ...prev, [id]: 'pending' }));
    setAddedItems(prev => prev.filter(x => x.id !== id));
  }, []);

  function buildItem(s, config) {
    const { name, amount, category, recurring = true, frequency = 'Monthly', paymentDate = '', paymentDay = '', startDate = '', startMonth = '', _typeOverride } = config || {};
    const billName = name || s.displayName;
    const billAmount = parseFloat(amount ?? s.avgAmount) || 0;
    const billId = s.id || `import_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    // _typeOverride from the TypeSwitcher takes priority over the suggestion's detected type
    const itemType = _typeOverride || s.type || 'bill';
    if (itemType === 'bill') return {
      id: billId,
      type: 'bill',
      name: billName,
      category: category ?? guessCategory(billName, categories),
      amount: billAmount,
      projected: billAmount,
      actual: billAmount,
      frequency: recurring ? (frequency || 'Monthly') : '',
      paymentDate: paymentDate || '',
      paymentDay: paymentDay || '',
      startDate: startDate || '',
      startMonth: startMonth || '',
      paid: false, missed: false, paused: false,
      recurring: recurring !== false,
    };
    if (itemType === 'debt') {
      // Config from DebtSuggestionCard contains full debt form fields
      const total = parseFloat(config?.totalAmount ?? amount ?? s.avgAmount) || 0;
      const debt = {
        id: billId,
        type: 'debt',
        name: billName,
        totalAmount: total,
        originalAmount: total,
        interestRate: parseFloat(config?.interestRate) || 0,
        minimumPayment: parseFloat(config?.minimumPayment) || 0,
        recurringPayment: parseFloat(config?.recurringPayment) || 0,
        paymentDate: config?.paymentDate || '',
        paymentMode: config?.paymentMode || 'recurring',
        dueDate: config?.dueDate || '',
        installmentMonths: parseInt(config?.installmentMonths) || 0,
        installmentStartDate: config?.installmentStartDate || '',
        bnplPromoMonths: parseInt(config?.bnplPromoMonths) || 0,
        bnplStartDate: config?.bnplStartDate || '',
        bnplPostInterest: parseFloat(config?.bnplPostInterest) || 0,
        bnplPostPayment: parseFloat(config?.bnplPostPayment) || 0,
        payments: [],
      };
      // Auto-calculate installment recurring payment
      if (debt.paymentMode === 'installment' && debt.installmentMonths > 0 && total > 0) {
        debt.recurringPayment = Math.ceil((total / debt.installmentMonths) * 100) / 100;
      }
      return debt;
    }
    // Config from SavingsSuggestionCard contains full savings form fields
    const savingsStarting = parseFloat(config?.startingAmount) || 0;
    const savingsTransactions = savingsStarting > 0
      ? [{ type: 'deposit', amount: savingsStarting, date: new Date().toISOString(), note: 'Starting balance' }]
      : [];
    return {
      id: billId,
      type: 'savings',
      name: billName,
      category: config?.category || 'Emergency',
      currentAmount: savingsStarting,
      targetAmount: parseFloat(config?.targetAmount) || 0,
      monthlyContribution: parseFloat(config?.monthlyContribution) || parseFloat(amount ?? s.avgAmount) || 0,
      transactions: savingsTransactions,
    };
  }

  const acceptAll = () => {
    const allHigh = {};
    [...suggestions.bills, ...suggestions.debts, ...suggestions.savings]
      .filter(s => s.confidenceLevel === 'high' && cardStates[s.id] !== 'added' && cardStates[s.id] !== 'skipped')
      .forEach(s => { allHigh[s.id] = true; });
    setChecked(c => ({ ...c, ...allHigh }));
    haptic.medium();
  };

  const applySelections = () => {
    const allS = [...suggestions.bills, ...suggestions.debts, ...suggestions.savings];
    // Include checked-but-not-yet-added items
    const pending = allS.filter(s => checked[s.id] && cardStates[s.id] !== 'added' && cardStates[s.id] !== 'skipped');
    const newItems = pending.map(s => {
      const sv = getSuggestion(s);
      const itemType = sv.type || 'bill';

      if (itemType === 'debt') {
        // Debts use defaults when batch-added (user can edit in Debt panel later)
        return buildItem(sv, {
          name: sv.displayName, totalAmount: sv.avgAmount,
          type: 'Credit Card', paymentMode: 'recurring',
          recurringPayment: sv.avgAmount, interestRate: 0, minimumPayment: 0,
        });
      }

      if (itemType === 'savings') {
        return buildItem(sv, {
          name: sv.displayName, category: 'Emergency',
          monthlyContribution: sv.avgAmount, startingAmount: 0, targetAmount: 0,
        });
      }

      // Bills — pass full form config
      return buildItem(sv, {
        name: sv.displayName, amount: sv.avgAmount, category: sv.category,
        recurring: edits[s.id + '_recurring'] ?? true,
        frequency: sv.userFrequency || 'Monthly',
        paymentDate: edits[s.id + '_paymentDate'] ?? '',
        paymentDay: edits[s.id + '_paymentDay'] ?? '',
        startDate: edits[s.id + '_startDate'] ?? '',
        startMonth: edits[s.id + '_startMonth'] ?? '',
      });
    });
    const allFinal = [...addedItems, ...newItems];

    setSummary({
      bills: allFinal.filter(x => x.type === 'bill').length,
      debts: allFinal.filter(x => x.type === 'debt').length,
      savings: allFinal.filter(x => x.type === 'savings').length,
      total: allFinal.length,
    });

    // Send bills with partial: true to keep the modal open for the summary screen.
    // The "Done" button on the summary calls onSkip which closes the modal.
    onComplete({
      bills: allFinal.filter(x => x.type === 'bill'),
      debts: allFinal.filter(x => x.type === 'debt'),
      savings: allFinal.filter(x => x.type === 'savings'),
      partial: true,
    });

    setStage('summary');
    haptic.success();
  };

  const allSuggestions = [...suggestions.bills, ...suggestions.debts, ...suggestions.savings];
  const pendingCount  = allSuggestions.filter(s => cardStates[s.id] !== 'added' && cardStates[s.id] !== 'skipped').length;
  const addedCount    = addedItems.length;
  const skippedCount  = allSuggestions.filter(s => cardStates[s.id] === 'skipped').length;
  const checkedPending = allSuggestions.filter(s => checked[s.id] && cardStates[s.id] !== 'added' && cardStates[s.id] !== 'skipped').length;

  // Filter items by status for rendering
  const filterByStatus = (items, section) => {
    const filter = sectionFilters[section] || 'all';
    if (filter === 'all') return items;
    return items.filter(s => {
      const state = cardStates[s.id] || 'pending';
      if (filter === 'pending') return state !== 'added' && state !== 'skipped';
      if (filter === 'added') return state === 'added';
      if (filter === 'skipped') return state === 'skipped';
      return true;
    });
  };

  const sortItems = (items, section) => {
    const order = sectionSorts[section] || 'a-z';
    const arr = [...items];
    switch (order) {
      case 'a-z': return arr.sort((a, b) => a.displayName.localeCompare(b.displayName, undefined, { numeric: true, sensitivity: 'base' }));
      case 'z-a': return arr.sort((a, b) => b.displayName.localeCompare(a.displayName, undefined, { numeric: true, sensitivity: 'base' }));
      case 'amount-asc': return arr.sort((a, b) => a.avgAmount - b.avgAmount);
      case 'amount-desc': return arr.sort((a, b) => b.avgAmount - a.avgAmount);
      default: return arr;
    }
  };

  const highCount     = allSuggestions.filter(s => s.confidenceLevel === 'high' && cardStates[s.id] !== 'added' && cardStates[s.id] !== 'skipped').length;
  const total         = allSuggestions.length;

  const renderSuggestions = (items) => {
    const filtered = filterByStatus(items, 'bills');
    const visible = showLow ? filtered : filtered.filter(s => s.confidenceLevel !== 'low');
    const sorted = sortItems(visible, 'bills');
    return sorted.map(s => (
      <SuggestionCard key={s.id} suggestion={s}
        checked={!!checked[s.id]}
        cardState={cardStates[s.id] || 'pending'}
        categories={categories}
        initialCategory={edits[s.id + '_category'] ?? guessCategory(s.displayName, categories)}
        initialFrequency={edits[s.id + '_frequency'] ?? FREQ_MAP[s.frequency] ?? 'Monthly'}
        onToggle={toggleCheck}
        onEditName={editName}
        onEditAmount={editAmount}
        onEditCategory={editCategory}
        onEditFrequency={editFrequency}
        onAddCategory={handleAddCategory}
        onAddOne={handleAddOne}
        onSkipOne={handleSkipOne}
        onUndoOne={handleUndoOne}
      />
    ));
  };

  const renderDebtSuggestions = (items) => {
    const filtered = filterByStatus(items, 'debts');
    const visible = showLow ? filtered : filtered.filter(s => s.confidenceLevel !== 'low');
    const sorted = sortItems(visible, 'debts');
    return sorted.map(s => (
      <DebtSuggestionCard key={s.id} suggestion={s}
        checked={!!checked[s.id]}
        cardState={cardStates[s.id] || 'pending'}
        onToggle={toggleCheck}
        onAddOne={handleAddOne}
        onSkipOne={handleSkipOne}
        onUndoOne={handleUndoOne}
      />
    ));
  };

  const renderSavingsSuggestions = (items) => {
    const filtered = filterByStatus(items, 'savings');
    const visible = showLow ? filtered : filtered.filter(s => s.confidenceLevel !== 'low');
    const sorted = sortItems(visible, 'savings');
    return sorted.map(s => (
      <SavingsSuggestionCard key={s.id} suggestion={s}
        checked={!!checked[s.id]}
        cardState={cardStates[s.id] || 'pending'}
        onToggle={toggleCheck}
        onAddOne={handleAddOne}
        onSkipOne={handleSkipOne}
        onUndoOne={handleUndoOne}
      />
    ));
  };

  // ── INTRO ──
  if (stage === 'intro') return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: '24px 20px' }}>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', gap: '20px' }}>
        <div style={{ width: '80px', height: '80px', borderRadius: '24px', background: 'linear-gradient(135deg, var(--accent-primary), var(--success))',
          display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icons.Upload size={36} style={{ color: '#fff' }} />
        </div>
        <div>
          <h2 style={{ fontSize: '22px', fontWeight: '700', marginBottom: '8px', color: 'var(--text-primary)' }}>
            Upload your file
          </h2>
          <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.6, maxWidth: '300px', margin: '0 auto' }}>
            Import your bills, debts, and savings from a CSV, spreadsheet, or PDF file.
          </p>
        </div>

        {/* Supported formats */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', justifyContent: 'center', maxWidth: '320px' }}>
          {[
            { label: 'CSV', icon: <Icons.FileCheck size={14} /> },
            { label: 'Spreadsheet', icon: <Icons.PieChart size={14} /> },
            { label: 'PDF', icon: <Icons.FileCheck size={14} /> },
          ].map(f => (
            <div key={f.label} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px',
              borderRadius: '20px', background: 'var(--glass)', border: '1px solid var(--border)',
              fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)' }}>
              {f.icon} {f.label}
            </div>
          ))}
        </div>

        {/* How it works */}
        <div style={{ background: 'var(--glass)', border: '1px solid var(--border)',
          borderRadius: '14px', padding: '16px', maxWidth: '320px', width: '100%', textAlign: 'left' }}>
          <div style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase',
            letterSpacing: '0.5px', marginBottom: '12px' }}>How it works</div>
          {[
            { icon: <Icons.FolderOpen size={16} style={{ color: 'var(--accent-primary)' }} />, text: 'Choose your file from your device' },
            { icon: <Icons.Sparkle size={16} style={{ color: 'var(--accent-primary)' }} />, text: 'We scan it and detect your bills automatically' },
            { icon: <Icons.Check size={16} style={{ color: 'var(--accent-primary)' }} />, text: 'Review, set categories, and import' },
          ].map((step, i) => (
            <div key={i} style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: i < 2 ? '10px' : 0 }}>
              <div style={{ width: '28px', height: '28px', borderRadius: '8px', flexShrink: 0,
                background: 'color-mix(in srgb, var(--accent-primary) 10%, transparent)',
                display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {step.icon}
              </div>
              <span style={{ fontSize: '13px', color: 'var(--text-primary)', lineHeight: 1.4 }}>{step.text}</span>
            </div>
          ))}
        </div>

        {/* Privacy note */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', maxWidth: '300px' }}>
          <Icons.Shield size={16} style={{ color: 'var(--success)', flexShrink: 0 }} />
          <p style={{ fontSize: '11px', color: 'var(--text-muted)', lineHeight: 1.5, margin: 0 }}>
            Processed on this device only. No data is sent to our servers.
          </p>
        </div>

        {error && (
          <div style={{ background: 'color-mix(in srgb, var(--danger) 10%, transparent)',
            border: '1px solid color-mix(in srgb, var(--danger) 20%, transparent)',
            borderRadius: '10px', padding: '12px 14px', fontSize: '13px', color: 'var(--danger)', maxWidth: '320px', width: '100%' }}>
            {error}
          </div>
        )}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', paddingBottom: 'calc(env(safe-area-inset-bottom) + 8px)' }}>
        <button className="btn btn-primary" onClick={() => { haptic.medium(); pickAndParse(); }} disabled={loading}
          style={{ width: '100%', justifyContent: 'center', fontSize: '16px', padding: '16px', opacity: loading ? 0.7 : 1, display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Icons.Upload size={18} /> {loading ? 'Reading file...' : 'Select file'}
        </button>
        <button onClick={() => { haptic.light(); onSkip(); }} style={{ background: 'none', border: 'none', cursor: 'pointer',
          color: 'var(--text-muted)', fontSize: '14px', padding: '10px', textAlign: 'center' }}>
          Skip for now
        </button>
      </div>
    </div>
  );

  // ── DIAGNOSTICS ──
  if (stage === 'diagnostics') return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: '20px 20px 0' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
        <div style={{ width: '44px', height: '44px', borderRadius: '12px',
          background: 'color-mix(in srgb, var(--success) 12%, transparent)',
          display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icons.FileCheck size={22} style={{ color: 'var(--success)' }} />
        </div>
        <div>
          <h2 style={{ fontSize: '20px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '2px' }}>File analysed</h2>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: 0 }}>Here's what we found</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '8px', marginBottom: '16px' }}>
        {[
          [diagnostics?.isSpreadsheet ? 'Items' : 'Transactions', diagnostics?.validTransactions],
          [diagnostics?.isSpreadsheet || diagnostics?.isPDF ? 'Format' : 'Days covered',
           diagnostics?.isSpreadsheet ? 'Sheet' : diagnostics?.isPDF ? 'PDF' : diagnostics?.dayscovered],
          ['Detected', total],
        ].map(([label, val]) => (
          <div key={label} style={{ background: 'var(--glass)', border: '1px solid var(--border)', borderRadius: '12px', padding: '14px 8px', textAlign: 'center' }}>
            <div style={{ fontSize: '22px', fontWeight: '700', color: 'var(--accent-primary)' }}>{val}</div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>{label}</div>
          </div>
        ))}
      </div>

      {diagnostics?.dayscovered < 60 && !diagnostics?.isSpreadsheet && !diagnostics?.isPDF && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px',
          background: 'color-mix(in srgb, var(--warning) 10%, transparent)',
          border: '1px solid color-mix(in srgb, var(--warning) 20%, transparent)',
          borderRadius: '10px', padding: '10px 12px', fontSize: '12px', color: 'var(--warning)', marginBottom: '12px' }}>
          <Icons.Lightbulb size={14} style={{ flexShrink: 0 }} />
          <span>Only {diagnostics.dayscovered} days of data - try a longer file for better results.</span>
        </div>
      )}

      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '16px' }}>
        {[
          ['Bills', suggestions.bills.length, 'var(--accent-primary)', <Icons.PieChart size={12} key="b" />],
          ['Debts', suggestions.debts.length, 'var(--danger)', <Icons.TrendingDown size={12} key="d" />],
          ['Savings', suggestions.savings.length, 'var(--success)', <Icons.CategorySavings size={12} key="s" />],
        ].map(([label, count, color, icon]) => (
          <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '6px',
            background: 'var(--glass)', border: '1px solid var(--border)',
            borderRadius: '20px', padding: '5px 12px', fontSize: '12px' }}>
            <span style={{ color, display: 'flex' }}>{icon}</span>
            <span style={{ color, fontWeight: '700' }}>{count}</span>
            <span style={{ color: 'var(--text-muted)' }}>{label}</span>
          </div>
        ))}
      </div>

      <div style={{ flex: 1 }} />

      <div style={{ display: 'flex', gap: '10px', paddingBottom: 'calc(env(safe-area-inset-bottom) + 16px)' }}>
        <button className="btn btn-primary" onClick={() => { haptic.medium(); setStage('suggestions'); }}
          style={{ flex: 1, justifyContent: 'center', fontSize: '15px', padding: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Icons.Sparkle size={16} /> Review suggestions
        </button>
        <button onClick={() => { haptic.light(); onSkip(); }} style={{ background: 'var(--glass)', border: '1px solid var(--border)',
          borderRadius: '12px', padding: '14px 16px', cursor: 'pointer', color: 'var(--text-muted)', fontSize: '13px' }}>
          Skip
        </button>
      </div>
    </div>
  );

  // ── SUGGESTIONS ──
  if (stage === 'suggestions') return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>

      {/* Scrollable content */}
      <div style={{ flex: 1, overflowY: 'auto' }}>

        {/* Hero summary card */}
        <div style={{ padding: '20px 20px 0' }}>
          <div style={{ background: 'linear-gradient(135deg, color-mix(in srgb, var(--accent-primary) 12%, transparent), color-mix(in srgb, var(--success) 8%, transparent))',
            border: '1px solid color-mix(in srgb, var(--accent-primary) 20%, transparent)',
            borderRadius: '16px', padding: '20px', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '16px' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '14px',
                background: 'linear-gradient(135deg, var(--accent-primary), var(--success))',
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Icons.Sparkle size={24} style={{ color: '#fff' }} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '24px', fontWeight: '800', color: 'var(--text-primary)', lineHeight: 1.1 }}>
                  {total}
                </div>
                <div style={{ fontSize: '14px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                  item{total !== 1 ? 's' : ''} detected in your file
                </div>
              </div>
            </div>

            {/* Category breakdown pills */}
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {suggestions.bills.length > 0 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px',
                  borderRadius: '10px', background: 'color-mix(in srgb, var(--accent-primary) 15%, transparent)',
                  border: '1px solid color-mix(in srgb, var(--accent-primary) 25%, transparent)' }}>
                  <Icons.PieChart size={13} style={{ color: 'var(--accent-primary)' }} />
                  <span style={{ fontSize: '13px', fontWeight: '700', color: 'var(--accent-primary)' }}>{suggestions.bills.length}</span>
                  <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Bills</span>
                </div>
              )}
              {suggestions.debts.length > 0 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px',
                  borderRadius: '10px', background: 'color-mix(in srgb, var(--danger) 15%, transparent)',
                  border: '1px solid color-mix(in srgb, var(--danger) 25%, transparent)' }}>
                  <Icons.CategoryCreditCard size={13} style={{ color: 'var(--danger)' }} />
                  <span style={{ fontSize: '13px', fontWeight: '700', color: 'var(--danger)' }}>{suggestions.debts.length}</span>
                  <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Debts</span>
                </div>
              )}
              {suggestions.savings.length > 0 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px',
                  borderRadius: '10px', background: 'color-mix(in srgb, var(--success) 15%, transparent)',
                  border: '1px solid color-mix(in srgb, var(--success) 25%, transparent)' }}>
                  <Icons.CategorySavings size={13} style={{ color: 'var(--success)' }} />
                  <span style={{ fontSize: '13px', fontWeight: '700', color: 'var(--success)' }}>{suggestions.savings.length}</span>
                  <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Savings</span>
                </div>
              )}
            </div>
          </div>

        </div>

        {/* Section cards */}
        <div style={{ padding: '0 20px' }}>
          {suggestions.bills.length > 0 && (
            <div style={{ marginBottom: '12px' }}>
              {/* Section card header */}
              <div onClick={() => { haptic.light(); setExpanded(e => ({ ...e, bills: !e.bills })); }} style={{
                display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 16px',
                background: expanded.bills ? 'color-mix(in srgb, var(--accent-primary) 6%, transparent)' : 'var(--bg-card, var(--glass))',
                border: `1px solid ${expanded.bills ? 'color-mix(in srgb, var(--accent-primary) 20%, transparent)' : 'var(--border)'}`,
                borderRadius: expanded.bills ? '14px 14px 0 0' : '14px',
                cursor: 'pointer', userSelect: 'none', transition: 'all 0.2s',
              }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '10px',
                  background: 'color-mix(in srgb, var(--accent-primary) 12%, transparent)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Icons.PieChart size={18} style={{ color: 'var(--accent-primary)' }} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '15px', fontWeight: '600', color: 'var(--text-primary)' }}>Bills</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '1px' }}>{suggestions.bills.length} item{suggestions.bills.length !== 1 ? 's' : ''} detected</div>
                </div>
                <Icons.ChevronDown size={16} style={{ color: 'var(--text-muted)', transition: 'transform 0.2s',
                  transform: expanded.bills ? 'rotate(180deg)' : 'none' }} />
              </div>
              {expanded.bills && (
                <div style={{ padding: '10px 0', borderLeft: '1px solid color-mix(in srgb, var(--accent-primary) 20%, transparent)',
                  borderRight: '1px solid color-mix(in srgb, var(--accent-primary) 20%, transparent)',
                  borderBottom: '1px solid color-mix(in srgb, var(--accent-primary) 20%, transparent)',
                  borderRadius: '0 0 14px 14px', paddingLeft: '10px', paddingRight: '10px' }}>
                  <SectionToolbar statusFilter={sectionFilters.bills} setStatusFilter={setFilterFor('bills')} sortOrder={sectionSorts.bills} setSortOrder={setSortFor('bills')} items={suggestions.bills} cardStates={cardStates} />
                  {renderSuggestions(suggestions.bills)}
                </div>
              )}
            </div>
          )}

          {suggestions.debts.length > 0 && (
            <div style={{ marginBottom: '12px' }}>
              <div onClick={() => { haptic.light(); setExpanded(e => ({ ...e, debts: !e.debts })); }} style={{
                display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 16px',
                background: expanded.debts ? 'color-mix(in srgb, var(--danger) 6%, transparent)' : 'var(--bg-card, var(--glass))',
                border: `1px solid ${expanded.debts ? 'color-mix(in srgb, var(--danger) 20%, transparent)' : 'var(--border)'}`,
                borderRadius: expanded.debts ? '14px 14px 0 0' : '14px',
                cursor: 'pointer', userSelect: 'none', transition: 'all 0.2s',
              }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '10px',
                  background: 'color-mix(in srgb, var(--danger) 12%, transparent)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Icons.CategoryCreditCard size={18} style={{ color: 'var(--danger)' }} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '15px', fontWeight: '600', color: 'var(--text-primary)' }}>Debts</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '1px' }}>{suggestions.debts.length} item{suggestions.debts.length !== 1 ? 's' : ''} detected</div>
                </div>
                <Icons.ChevronDown size={16} style={{ color: 'var(--text-muted)', transition: 'transform 0.2s',
                  transform: expanded.debts ? 'rotate(180deg)' : 'none' }} />
              </div>
              {expanded.debts && (
                <div style={{ padding: '10px 0', borderLeft: '1px solid color-mix(in srgb, var(--danger) 20%, transparent)',
                  borderRight: '1px solid color-mix(in srgb, var(--danger) 20%, transparent)',
                  borderBottom: '1px solid color-mix(in srgb, var(--danger) 20%, transparent)',
                  borderRadius: '0 0 14px 14px', paddingLeft: '10px', paddingRight: '10px' }}>
                  <SectionToolbar statusFilter={sectionFilters.debts} setStatusFilter={setFilterFor('debts')} sortOrder={sectionSorts.debts} setSortOrder={setSortFor('debts')} items={suggestions.debts} cardStates={cardStates} />
                  {renderDebtSuggestions(suggestions.debts)}
                </div>
              )}
            </div>
          )}

          {suggestions.savings.length > 0 && (
            <div style={{ marginBottom: '12px' }}>
              <div onClick={() => { haptic.light(); setExpanded(e => ({ ...e, savings: !e.savings })); }} style={{
                display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 16px',
                background: expanded.savings ? 'color-mix(in srgb, var(--success) 6%, transparent)' : 'var(--bg-card, var(--glass))',
                border: `1px solid ${expanded.savings ? 'color-mix(in srgb, var(--success) 20%, transparent)' : 'var(--border)'}`,
                borderRadius: expanded.savings ? '14px 14px 0 0' : '14px',
                cursor: 'pointer', userSelect: 'none', transition: 'all 0.2s',
              }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '10px',
                  background: 'color-mix(in srgb, var(--success) 12%, transparent)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Icons.CategorySavings size={18} style={{ color: 'var(--success)' }} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '15px', fontWeight: '600', color: 'var(--text-primary)' }}>Savings</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '1px' }}>{suggestions.savings.length} item{suggestions.savings.length !== 1 ? 's' : ''} detected</div>
                </div>
                <Icons.ChevronDown size={16} style={{ color: 'var(--text-muted)', transition: 'transform 0.2s',
                  transform: expanded.savings ? 'rotate(180deg)' : 'none' }} />
              </div>
              {expanded.savings && (
                <div style={{ padding: '10px 0', borderLeft: '1px solid color-mix(in srgb, var(--success) 20%, transparent)',
                  borderRight: '1px solid color-mix(in srgb, var(--success) 20%, transparent)',
                  borderBottom: '1px solid color-mix(in srgb, var(--success) 20%, transparent)',
                  borderRadius: '0 0 14px 14px', paddingLeft: '10px', paddingRight: '10px' }}>
                  <SectionToolbar statusFilter={sectionFilters.savings} setStatusFilter={setFilterFor('savings')} sortOrder={sectionSorts.savings} setSortOrder={setSortFor('savings')} items={suggestions.savings} cardStates={cardStates} />
                  {renderSavingsSuggestions(suggestions.savings)}
                </div>
              )}
            </div>
          )}

          {allSuggestions.some(s => s.confidenceLevel === 'low') && (
            <button onClick={() => { haptic.light(); setShowLow(v => !v); }} style={{ width: '100%', background: 'none',
              border: '1px dashed var(--border)', borderRadius: '10px', padding: '10px',
              cursor: 'pointer', color: 'var(--text-muted)', fontSize: '12px', marginTop: '4px' }}>
              {showLow ? 'Hide low confidence' : 'Show low confidence suggestions'}
            </button>
          )}
          <div style={{ height: '110px' }} />
        </div>
      </div>

      {/* Footer — batch add remaining selected */}
      <div style={{ padding: '10px 20px', paddingBottom: 'calc(env(safe-area-inset-bottom) + 10px)',
        borderTop: '1px solid var(--border)', flexShrink: 0, background: 'var(--bg-primary)' }}>
        {checkedPending > 0 ? (
          <button className="btn btn-primary" onClick={() => { applySelections(); }}
            style={{ width: '100%', justifyContent: 'center', fontSize: '15px', padding: '13px' }}>
            Add {checkedPending} selected item{checkedPending !== 1 ? 's' : ''} →
          </button>
        ) : addedCount > 0 ? (
          <button className="btn btn-primary" onClick={() => { haptic.success(); setStage('summary'); }}
            style={{ width: '100%', justifyContent: 'center', fontSize: '15px', padding: '13px',
              background: 'linear-gradient(135deg,#10b981,#059669)', borderColor: '#10b981' }}>
            Done - {addedCount} item{addedCount !== 1 ? 's' : ''} added
          </button>
        ) : (
          <button onClick={() => { haptic.light(); onSkip(); }} style={{ width: '100%', background: 'none', border: '1px solid var(--border)',
            borderRadius: '12px', padding: '13px', cursor: 'pointer', color: 'var(--text-muted)', fontSize: '14px' }}>
            Skip all
          </button>
        )}
      </div>
    </div>
  );

  // ── SUMMARY ──
  if (stage === 'summary') return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      height: '100%', padding: '24px 20px', textAlign: 'center', gap: '20px' }}>
      <div style={{ width: '80px', height: '80px', borderRadius: '24px',
        background: 'linear-gradient(135deg, var(--success), #059669)',
        display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Icons.Check size={40} style={{ color: '#fff' }} />
      </div>
      <div>
        <h2 style={{ fontSize: '22px', fontWeight: '700', marginBottom: '8px', color: 'var(--text-primary)' }}>Import complete</h2>
        <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>Here's what was added to Tally</p>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '8px', width: '100%', maxWidth: '320px' }}>
        {[
          ['Bills', summary?.bills, 'var(--accent-primary)', <Icons.PieChart size={16} key="b" />],
          ['Debts', summary?.debts, 'var(--danger)', <Icons.TrendingDown size={16} key="d" />],
          ['Savings', summary?.savings, 'var(--success)', <Icons.CategorySavings size={16} key="s" />],
        ].map(([label, count, color, icon]) => (
          <div key={label} style={{ background: 'var(--glass)', border: '1px solid var(--border)', borderRadius: '14px', padding: '16px 8px' }}>
            <div style={{ color, marginBottom: '6px', display: 'flex', justifyContent: 'center' }}>{icon}</div>
            <div style={{ fontSize: '28px', fontWeight: '700', color }}>{count}</div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>{label}</div>
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', maxWidth: '300px' }}>
        <Icons.Shield size={16} style={{ color: 'var(--success)', flexShrink: 0 }} />
        <p style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: 1.5, margin: 0 }}>
          Your file was not stored. Only the items above were saved to Tally.
        </p>
      </div>
      <button className="btn btn-primary" onClick={() => { haptic.success(); onSkip(); }}
        style={{ width: '100%', maxWidth: '320px', justifyContent: 'center', fontSize: '15px', padding: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <Icons.Check size={18} /> Done
      </button>
    </div>
  );

  return null;
}

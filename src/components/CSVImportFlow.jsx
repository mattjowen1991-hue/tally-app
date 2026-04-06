import React, { useState, useCallback } from 'react';
import { importCSV, detectRecurring, detectSpreadsheetFormat, importSpreadsheet, parseCSV } from '../utils/csvImport';
import haptic from '../utils/haptics';

async function pickCSVFile() {
  const { FilePicker } = await import('@capawesome/capacitor-file-picker');
  return FilePicker.pickFiles({
    types: ['text/csv', 'text/comma-separated-values', 'application/csv', 'text/plain'],
    readData: true,
    limit: 1,
  });
}

const FREQ_MAP = {
  weekly: 'Weekly', fortnightly: 'Fortnightly',
  monthly: 'Monthly', quarterly: 'Quarterly', annual: 'Annual',
};

const CAT_MAP = {
  netflix: 'ENTERTAINMENT', spotify: 'ENTERTAINMENT', amazon: 'ENTERTAINMENT',
  disney: 'ENTERTAINMENT', sky: 'ENTERTAINMENT', youtube: 'ENTERTAINMENT',
  gym: 'HEALTH', 'pure gym': 'HEALTH', 'david lloyd': 'HEALTH',
  eon: 'HOME', 'british gas': 'HOME', 'severn trent': 'HOME',
  'thames water': 'HOME', 'scottish power': 'HOME',
  vodafone: 'HOME', ee: 'HOME', o2: 'HOME', bt: 'HOME', 'virgin media': 'HOME',
  'tv licence': 'HOME', 'council tax': 'HOME', rent: 'HOME', mortgage: 'HOME',
  insurance: 'HOME',
};

function guessCategory(name) {
  const lower = name.toLowerCase();
  for (const [key, cat] of Object.entries(CAT_MAP)) {
    if (lower.includes(key)) return cat;
  }
  return 'HOME';
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

// cardState: 'pending' | 'added' | 'skipped'
function SuggestionCard({ suggestion, checked, cardState = 'pending', onToggle, onEditName, onEditAmount, onAddOne, onSkipOne, onUndoOne }) {
  const [editingName, setEditingName] = useState(false);
  const [editingAmount, setEditingAmount] = useState(false);
  const [localName, setLocalName] = useState(suggestion.displayName);
  const [localAmount, setLocalAmount] = useState(suggestion.avgAmount.toFixed(2));

  const commitName = () => { setEditingName(false); onEditName(suggestion.id, localName); };
  const commitAmount = () => { setEditingAmount(false); onEditAmount(suggestion.id, parseFloat(localAmount) || suggestion.avgAmount); };

  const isAdded   = cardState === 'added';
  const isSkipped = cardState === 'skipped';
  const pending   = !isAdded && !isSkipped;

  return (
    <div style={{
      background: isAdded ? 'rgba(16,185,129,0.06)' : isSkipped ? 'rgba(255,255,255,0.01)' : checked ? 'rgba(0,212,255,0.05)' : 'rgba(255,255,255,0.02)',
      border: `1px solid ${isAdded ? 'rgba(16,185,129,0.25)' : isSkipped ? 'rgba(255,255,255,0.04)' : checked ? 'rgba(0,212,255,0.2)' : 'rgba(255,255,255,0.06)'}`,
      borderRadius: '12px', padding: '12px 14px', marginBottom: '8px', transition: 'all 0.2s',
      opacity: isSkipped ? 0.4 : 1,
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>

        {/* Checkbox when pending, green tick when added */}
        {pending && (
          <div onClick={() => { haptic.light(); onToggle(suggestion.id); }}
            style={{ width: '22px', height: '22px', borderRadius: '6px', flexShrink: 0, marginTop: '1px', cursor: 'pointer',
              border: `2px solid ${checked ? '#00d4ff' : 'rgba(255,255,255,0.2)'}`,
              background: checked ? 'linear-gradient(135deg,#00d4ff,#10b981)' : 'transparent',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', color: '#fff' }}>
            {checked && '\u2713'}
          </div>
        )}
        {isAdded && (
          <div style={{ width: '22px', height: '22px', borderRadius: '6px', flexShrink: 0, marginTop: '1px',
            background: 'rgba(16,185,129,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '12px', color: '#10b981' }}>\u2713</div>
        )}

        {/* Content */}
        <div style={{ flex: 1, minWidth: 0 }}>

          {/* Name row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px', flexWrap: 'wrap' }}>
            {editingName && pending ? (
              <input autoFocus value={localName} onChange={e => setLocalName(e.target.value)}
                onBlur={commitName} onKeyDown={e => e.key === 'Enter' && commitName()}
                style={{ fontSize: '14px', fontWeight: '600', background: 'rgba(255,255,255,0.08)',
                  border: '1px solid rgba(0,212,255,0.4)', borderRadius: '6px', padding: '2px 6px',
                  color: '#e2e8f0', outline: 'none', flex: 1 }} />
            ) : (
              <span onClick={() => pending && setEditingName(true)}
                style={{ fontSize: '14px', fontWeight: '600',
                  color: isAdded ? '#10b981' : isSkipped ? 'rgba(255,255,255,0.3)' : '#e2e8f0',
                  cursor: pending ? 'text' : 'default',
                  borderBottom: pending ? '1px dashed rgba(255,255,255,0.2)' : 'none', paddingBottom: '1px' }}>
                {localName}
              </span>
            )}
            {pending && <ConfidenceBadge level={suggestion.confidenceLevel} />}
            {isAdded && <span style={{ fontSize: '10px', fontWeight: '700', color: '#10b981',
              background: 'rgba(16,185,129,0.15)', padding: '2px 7px', borderRadius: '10px' }}>Added</span>}
            {isSkipped && <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.3)' }}>Skipped</span>}
          </div>

          {/* Amount + frequency */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: pending ? '6px' : '4px' }}>
            {editingAmount && pending ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.5)' }}>{'£'}</span>
                <input autoFocus value={localAmount} onChange={e => setLocalAmount(e.target.value)} type="number"
                  onBlur={commitAmount} onKeyDown={e => e.key === 'Enter' && commitAmount()}
                  style={{ width: '70px', fontSize: '13px', background: 'rgba(255,255,255,0.08)',
                    border: '1px solid rgba(0,212,255,0.4)', borderRadius: '6px', padding: '2px 6px',
                    color: '#e2e8f0', outline: 'none' }} />
              </div>
            ) : (
              <span onClick={() => pending && setEditingAmount(true)}
                style={{ fontSize: '13px', fontWeight: '600',
                  color: isAdded ? 'rgba(16,185,129,0.7)' : isSkipped ? 'rgba(255,255,255,0.2)' : '#00d4ff',
                  cursor: pending ? 'text' : 'default',
                  borderBottom: pending ? '1px dashed rgba(0,212,255,0.3)' : 'none', paddingBottom: '1px' }}>
                {'£'}{parseFloat(localAmount).toFixed(2)}
              </span>
            )}
            <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)' }}>
              {FREQ_MAP[suggestion.frequency] || suggestion.frequency}
            </span>
          </div>

          {/* Explainer — pending only */}
          {pending && (
            <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)', lineHeight: 1.4, marginBottom: '10px' }}>
              {suggestion.explainer}
            </div>
          )}

          {/* Per-card action buttons */}
          {pending && (
            <div style={{ display: 'flex', gap: '6px' }}>
              <button onClick={() => { haptic.success(); onAddOne(suggestion.id, localName, parseFloat(localAmount) || suggestion.avgAmount); }}
                style={{ flex: 1, padding: '7px 10px', borderRadius: '8px', fontSize: '12px', fontWeight: '600',
                  cursor: 'pointer', background: 'rgba(0,212,255,0.1)', border: '1px solid rgba(0,212,255,0.25)',
                  color: 'var(--accent-primary)' }}>
                + Add this one
              </button>
              <button onClick={() => { haptic.light(); onSkipOne(suggestion.id); }}
                style={{ padding: '7px 12px', borderRadius: '8px', fontSize: '12px', fontWeight: '600',
                  cursor: 'pointer', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
                  color: 'rgba(255,255,255,0.3)' }}>
                Skip
              </button>
            </div>
          )}

          {/* Undo */}
          {(isAdded || isSkipped) && (
            <button onClick={() => { haptic.light(); onUndoOne(suggestion.id); }}
              style={{ marginTop: '4px', padding: '3px 0', background: 'none', border: 'none',
                cursor: 'pointer', color: 'rgba(255,255,255,0.25)', fontSize: '11px', textDecoration: 'underline' }}>
              {isAdded ? 'Undo add' : 'Undo skip'}
            </button>
          )}

        </div>
      </div>
    </div>
  );
}

function SectionHeader({ title, count, icon, expanded, onToggle }) {
  return (
    <div onClick={onToggle} style={{ display: 'flex', alignItems: 'center', gap: '8px',
      padding: '10px 0 8px', cursor: 'pointer', userSelect: 'none' }}>
      <span style={{ fontSize: '16px' }}>{icon}</span>
      <span style={{ fontSize: '14px', fontWeight: '600', color: '#e2e8f0', flex: 1 }}>{title}</span>
      <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', marginRight: '6px' }}>{count}</span>
      <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.3)', transition: 'transform 0.2s',
        display: 'inline-block', transform: expanded ? 'rotate(180deg)' : 'none' }}>▼</span>
    </div>
  );
}

export default function CSVImportFlow({ onComplete, onSkip, currencySymbol = '£', existingBills = [] }) {
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
  const [addedItems, setAddedItems] = useState([]); // items added one-by-one
  const [summary, setSummary] = useState(null);

  const pickAndParse = async () => {
    setError(null);
    setLoading(true);
    try {
      const result = await pickCSVFile();
      const file = result.files[0];
      if (!file) { setLoading(false); return; }

      let text;
      if (file.data) { text = atob(file.data); }
      else if (file.blob) { text = await file.blob.text(); }
      else { throw new Error('Could not read file contents.'); }

      const { headers, rows } = parseCSV(text);
      const isSpreadsheet = detectSpreadsheetFormat(headers, rows);

      let detected, diag;
      if (isSpreadsheet) {
        const res = importSpreadsheet(text);
        diag = res.diagnostics;
        detected = { bills: res.bills, debts: res.debts, savings: [] };
      } else {
        const res = importCSV(text);
        diag = res.diagnostics;
        detected = detectRecurring(res.transactions);
      }

      setDiagnostics(diag);
      setSuggestions(detected);

      // Auto-check high confidence
      const autoChecked = {};
      [...detected.bills, ...detected.debts, ...detected.savings]
        .filter(s => s.confidenceLevel === 'high')
        .forEach(s => { autoChecked[s.id] = true; });
      setChecked(autoChecked);
      setCardStates({});
      setAddedItems([]);

      setStage('diagnostics');
      haptic.success();
    } catch (e) {
      setError(e.message || 'Could not read the file. Please check it is a valid CSV export.');
      haptic.error();
    }
    setLoading(false);
  };

  const toggleCheck = useCallback((id) => { setChecked(c => ({ ...c, [id]: !c[id] })); }, []);
  const editName    = useCallback((id, name) => { setEdits(e => ({ ...e, [id + '_name']: name })); }, []);
  const editAmount  = useCallback((id, amt)  => { setEdits(e => ({ ...e, [id + '_amount']: amt })); }, []);

  const getSuggestion = (s) => ({
    ...s,
    displayName: edits[s.id + '_name'] ?? s.displayName,
    avgAmount: edits[s.id + '_amount'] ?? s.avgAmount,
  });

  // Per-card add
  const handleAddOne = useCallback((id, name, amount) => {
    const allS = [...suggestions.bills, ...suggestions.debts, ...suggestions.savings];
    const s = allS.find(x => x.id === id);
    if (!s) return;
    const item = buildItem(s, name, amount);
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

  function buildItem(s, name, amount) {
    const base = { id: s.id, type: s.type };
    if (s.type === 'bill') return { ...base,
      name, category: guessCategory(name),
      projected: amount, actual: amount,
      frequency: FREQ_MAP[s.frequency] || 'Monthly',
      paymentDate: s.nextDueEstimate ? new Date(s.nextDueEstimate).getDate() + '' : '',
      paid: false, missed: false, paused: false, recurring: true,
    };
    if (s.type === 'debt') return { ...base, name, balance: 0, minimumPayment: amount, interestRate: 0, fromImport: true };
    return { ...base, name, targetAmount: 0, currentAmount: 0, monthlyContrib: amount, fromImport: true };
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
    const newItems = pending.map(s => { const sv = getSuggestion(s); return buildItem(sv, sv.displayName, sv.avgAmount); });
    const allFinal = [...addedItems, ...newItems];

    setSummary({
      bills: allFinal.filter(x => x.type === 'bill').length,
      debts: allFinal.filter(x => x.type === 'debt').length,
      savings: allFinal.filter(x => x.type === 'savings').length,
      total: allFinal.length,
    });
    setStage('summary');
    onComplete({
      bills: allFinal.filter(x => x.type === 'bill'),
      debts: allFinal.filter(x => x.type === 'debt'),
      savings: allFinal.filter(x => x.type === 'savings'),
      partial: false,
    });
    haptic.success();
  };

  const allSuggestions = [...suggestions.bills, ...suggestions.debts, ...suggestions.savings];
  const pendingCount  = allSuggestions.filter(s => cardStates[s.id] !== 'added' && cardStates[s.id] !== 'skipped').length;
  const addedCount    = addedItems.length;
  const checkedPending = allSuggestions.filter(s => checked[s.id] && cardStates[s.id] !== 'added' && cardStates[s.id] !== 'skipped').length;
  const highCount     = allSuggestions.filter(s => s.confidenceLevel === 'high' && cardStates[s.id] !== 'added' && cardStates[s.id] !== 'skipped').length;
  const total         = allSuggestions.length;

  const renderSuggestions = (items) => {
    const visible = showLow ? items : items.filter(s => s.confidenceLevel !== 'low');
    return visible.map(s => (
      <SuggestionCard key={s.id} suggestion={s}
        checked={!!checked[s.id]}
        cardState={cardStates[s.id] || 'pending'}
        onToggle={toggleCheck}
        onEditName={editName}
        onEditAmount={editAmount}
        onAddOne={handleAddOne}
        onSkipOne={handleSkipOne}
        onUndoOne={handleUndoOne}
      />
    ));
  };

  // ── INTRO ──
  if (stage === 'intro') return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: '24px 20px' }}>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', gap: '16px' }}>
        <div style={{ width: '72px', height: '72px', borderRadius: '20px', background: 'linear-gradient(135deg,#00d4ff,#10b981)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '32px' }}>📄</div>
        <div>
          <h2 style={{ fontSize: '22px', fontWeight: '700', marginBottom: '8px' }}>Import bills from your bank</h2>
          <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.55)', lineHeight: 1.6, maxWidth: '300px', margin: '0 auto' }}>
            Export a CSV from your banking app or budget spreadsheet, then upload it here.
          </p>
        </div>
        <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: '12px', padding: '14px 16px', maxWidth: '320px', width: '100%', textAlign: 'left' }}>
          <div style={{ fontSize: '11px', fontWeight: '700', color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase',
            letterSpacing: '0.5px', marginBottom: '10px' }}>How to export from your bank</div>
          {[
            ['Monzo', 'Account → Export transactions → CSV'],
            ['Starling', 'Spaces → Export → CSV'],
            ['Barclays', 'barclays.co.uk browser → Export All → CSV'],
            ['HSBC', 'hsbc.co.uk browser → Download → CSV'],
            ['Lloyds', 'lloydsbank.com browser → Export → CSV'],
          ].map(([bank, steps]) => (
            <div key={bank} style={{ display: 'flex', gap: '8px', marginBottom: '6px' }}>
              <span style={{ fontSize: '12px', fontWeight: '600', color: '#00d4ff', minWidth: '55px' }}>{bank}</span>
              <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', lineHeight: 1.4 }}>{steps}</span>
            </div>
          ))}
        </div>
        <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.25)', maxWidth: '280px', lineHeight: 1.5 }}>
          {'🔒 Your file is processed on this device. No transaction data is sent to our servers.'}
        </p>
        {error && (
          <div style={{ background: 'rgba(244,63,94,0.1)', border: '1px solid rgba(244,63,94,0.2)',
            borderRadius: '10px', padding: '12px 14px', fontSize: '13px', color: '#f43f5e', maxWidth: '320px' }}>
            {error}
          </div>
        )}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', paddingBottom: 'calc(env(safe-area-inset-bottom) + 8px)' }}>
        <button className="btn btn-primary" onClick={pickAndParse} disabled={loading}
          style={{ width: '100%', justifyContent: 'center', fontSize: '16px', padding: '16px', opacity: loading ? 0.7 : 1 }}>
          {loading ? 'Reading file...' : '📂 Select CSV file'}
        </button>
        <button onClick={onSkip} style={{ background: 'none', border: 'none', cursor: 'pointer',
          color: 'rgba(255,255,255,0.35)', fontSize: '14px', padding: '10px', textAlign: 'center' }}>
          Skip for now
        </button>
      </div>
    </div>
  );

  // ── DIAGNOSTICS ──
  if (stage === 'diagnostics') return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: '20px 20px 0' }}>
      <h2 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '4px' }}>File analysed</h2>
      <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.5)', marginBottom: '16px' }}>Here's what we found</p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '8px', marginBottom: '16px' }}>
        {[
          [diagnostics?.isSpreadsheet ? 'Items found' : 'Transactions', diagnostics?.validTransactions],
          [diagnostics?.isSpreadsheet ? 'Format' : 'Days covered', diagnostics?.isSpreadsheet ? '📊 Sheet' : diagnostics?.dayscovered],
          ['Detected', total],
        ].map(([label, val]) => (
          <div key={label} style={{ background: 'rgba(255,255,255,0.05)', borderRadius: '10px', padding: '12px 8px', textAlign: 'center' }}>
            <div style={{ fontSize: '22px', fontWeight: '700', color: '#00d4ff' }}>{val}</div>
            <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', marginTop: '2px' }}>{label}</div>
          </div>
        ))}
      </div>
      {diagnostics?.dayscovered < 60 && !diagnostics?.isSpreadsheet && (
        <div style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.2)',
          borderRadius: '10px', padding: '10px 12px', fontSize: '12px', color: '#f59e0b', marginBottom: '12px' }}>
          {'⚠️'} Only {diagnostics.dayscovered} days of data — try a longer statement for better results.
        </div>
      )}
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '16px' }}>
        {[['Bills', suggestions.bills.length, '#00d4ff'], ['Debts', suggestions.debts.length, '#f43f5e'], ['Savings', suggestions.savings.length, '#10b981']].map(([label, count, color]) => (
          <div key={label} style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: '20px', padding: '4px 12px', fontSize: '12px' }}>
            <span style={{ color, fontWeight: '700' }}>{count}</span>
            <span style={{ color: 'rgba(255,255,255,0.4)', marginLeft: '4px' }}>{label}</span>
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', gap: '10px', paddingBottom: 'calc(env(safe-area-inset-bottom) + 16px)' }}>
        <button className="btn btn-primary" onClick={() => setStage('suggestions')}
          style={{ flex: 1, justifyContent: 'center', fontSize: '15px', padding: '14px' }}>
          Review suggestions →
        </button>
        <button onClick={onSkip} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: '12px', padding: '14px 16px', cursor: 'pointer', color: 'rgba(255,255,255,0.5)', fontSize: '13px' }}>
          Skip
        </button>
      </div>
    </div>
  );

  // ── SUGGESTIONS ──
  if (stage === 'suggestions') return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Header */}
      <div style={{ padding: '14px 20px 10px', flexShrink: 0, borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: '700' }}>Review suggestions</h2>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            {addedCount > 0 && (
              <span style={{ fontSize: '12px', color: '#10b981', fontWeight: '600' }}>
                {addedCount} added
              </span>
            )}
            {checkedPending > 0 && (
              <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)' }}>
                {checkedPending} selected
              </span>
            )}
          </div>
        </div>
        <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', marginBottom: '8px' }}>
          Add one by one, or select and add all at once.
        </p>
        {highCount > 0 && (
          <button onClick={acceptAll} style={{ fontSize: '12px', fontWeight: '600', color: '#00d4ff',
            background: 'rgba(0,212,255,0.08)', border: '1px solid rgba(0,212,255,0.2)',
            borderRadius: '20px', padding: '5px 12px', cursor: 'pointer' }}>
            {'✓'} Select all high confidence ({highCount})
          </button>
        )}
      </div>

      {/* Scrollable list */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '8px 20px' }}>
        {suggestions.bills.length > 0 && (
          <>
            <SectionHeader title="Bills detected" count={suggestions.bills.length} icon="📋"
              expanded={expanded.bills} onToggle={() => setExpanded(e => ({ ...e, bills: !e.bills }))} />
            {expanded.bills && renderSuggestions(suggestions.bills)}
          </>
        )}
        {suggestions.debts.length > 0 && (
          <>
            <SectionHeader title="Debt payments detected" count={suggestions.debts.length} icon="💳"
              expanded={expanded.debts} onToggle={() => setExpanded(e => ({ ...e, debts: !e.debts }))} />
            {expanded.debts && renderSuggestions(suggestions.debts)}
          </>
        )}
        {suggestions.savings.length > 0 && (
          <>
            <SectionHeader title="Savings transfers detected" count={suggestions.savings.length} icon="🏦"
              expanded={expanded.savings} onToggle={() => setExpanded(e => ({ ...e, savings: !e.savings }))} />
            {expanded.savings && renderSuggestions(suggestions.savings)}
          </>
        )}
        {allSuggestions.some(s => s.confidenceLevel === 'low') && (
          <button onClick={() => setShowLow(v => !v)} style={{ width: '100%', background: 'none',
            border: '1px dashed rgba(255,255,255,0.1)', borderRadius: '10px', padding: '10px',
            cursor: 'pointer', color: 'rgba(255,255,255,0.3)', fontSize: '12px', marginTop: '8px' }}>
            {showLow ? 'Hide low confidence' : 'Show low confidence suggestions'}
          </button>
        )}
        <div style={{ height: '110px' }} />
      </div>

      {/* Footer — batch add remaining selected */}
      <div style={{ padding: '10px 20px', paddingBottom: 'calc(env(safe-area-inset-bottom) + 10px)',
        borderTop: '1px solid rgba(255,255,255,0.06)', flexShrink: 0, background: 'var(--bg-primary)' }}>
        {checkedPending > 0 ? (
          <button className="btn btn-primary" onClick={applySelections}
            style={{ width: '100%', justifyContent: 'center', fontSize: '15px', padding: '13px' }}>
            Add {checkedPending} selected item{checkedPending !== 1 ? 's' : ''} →
          </button>
        ) : addedCount > 0 ? (
          <button className="btn btn-primary" onClick={() => setStage('summary')}
            style={{ width: '100%', justifyContent: 'center', fontSize: '15px', padding: '13px',
              background: 'linear-gradient(135deg,#10b981,#059669)', borderColor: '#10b981' }}>
            Done — {addedCount} item{addedCount !== 1 ? 's' : ''} added ✓
          </button>
        ) : (
          <button onClick={onSkip} style={{ width: '100%', background: 'none', border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '12px', padding: '13px', cursor: 'pointer', color: 'rgba(255,255,255,0.3)', fontSize: '14px' }}>
            Skip all
          </button>
        )}
      </div>
    </div>
  );

  // ── SUMMARY ──
  if (stage === 'summary') return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      height: '100%', padding: '24px 20px', textAlign: 'center', gap: '16px' }}>
      <div style={{ fontSize: '48px' }}>🎉</div>
      <div>
        <h2 style={{ fontSize: '22px', fontWeight: '700', marginBottom: '8px' }}>Import complete</h2>
        <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.5)' }}>Here's what was added to Tally</p>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '8px', width: '100%', maxWidth: '320px' }}>
        {[['Bills', summary?.bills, '#00d4ff'], ['Debts', summary?.debts, '#f43f5e'], ['Savings', summary?.savings, '#10b981']].map(([label, count, color]) => (
          <div key={label} style={{ background: 'rgba(255,255,255,0.05)', borderRadius: '12px', padding: '14px 8px' }}>
            <div style={{ fontSize: '28px', fontWeight: '700', color }}>{count}</div>
            <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', marginTop: '2px' }}>{label}</div>
          </div>
        ))}
      </div>
      <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.3)', maxWidth: '280px', lineHeight: 1.5 }}>
        Your transaction file has not been stored. Only the bill details above were saved.
      </p>
      <button className="btn btn-primary" onClick={onSkip}
        style={{ width: '100%', maxWidth: '320px', justifyContent: 'center', fontSize: '15px', padding: '14px' }}>
        Done
      </button>
    </div>
  );

  return null;
}

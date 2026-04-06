import React, { useState, useCallback } from 'react';
import { importCSV, detectRecurring } from '../utils/csvImport';
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

function SuggestionCard({ suggestion, checked, onToggle, onEditName, onEditAmount }) {
  const [editingName, setEditingName] = useState(false);
  const [editingAmount, setEditingAmount] = useState(false);
  const [localName, setLocalName] = useState(suggestion.displayName);
  const [localAmount, setLocalAmount] = useState(suggestion.avgAmount.toFixed(2));

  const commitName = () => { setEditingName(false); onEditName(suggestion.id, localName); };
  const commitAmount = () => { setEditingAmount(false); onEditAmount(suggestion.id, parseFloat(localAmount) || suggestion.avgAmount); };

  return (
    <div style={{ background: checked ? 'rgba(0,212,255,0.05)' : 'rgba(255,255,255,0.02)',
      border: `1px solid ${checked ? 'rgba(0,212,255,0.2)' : 'rgba(255,255,255,0.06)'}`,
      borderRadius: '12px', padding: '12px 14px', marginBottom: '8px', transition: 'all 0.15s' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
        {/* Checkbox */}
        <div onClick={() => { haptic.light(); onToggle(suggestion.id); }}
          style={{ width: '22px', height: '22px', borderRadius: '6px', flexShrink: 0, marginTop: '1px', cursor: 'pointer',
            border: `2px solid ${checked ? '#00d4ff' : 'rgba(255,255,255,0.2)'}`,
            background: checked ? 'linear-gradient(135deg,#00d4ff,#10b981)' : 'transparent',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', color: '#fff' }}>
          {checked && '✓'}
        </div>

        {/* Content */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px', flexWrap: 'wrap' }}>
            {editingName ? (
              <input autoFocus value={localName} onChange={e => setLocalName(e.target.value)}
                onBlur={commitName} onKeyDown={e => e.key === 'Enter' && commitName()}
                style={{ fontSize: '14px', fontWeight: '600', background: 'rgba(255,255,255,0.08)',
                  border: '1px solid rgba(0,212,255,0.4)', borderRadius: '6px', padding: '2px 6px',
                  color: '#e2e8f0', outline: 'none', flex: 1 }} />
            ) : (
              <span onClick={() => setEditingName(true)}
                style={{ fontSize: '14px', fontWeight: '600', color: '#e2e8f0', cursor: 'text',
                  borderBottom: '1px dashed rgba(255,255,255,0.2)', paddingBottom: '1px' }}>
                {localName}
              </span>
            )}
            <ConfidenceBadge level={suggestion.confidenceLevel} />
          </div>

          {/* Amount + frequency */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
            {editingAmount ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.5)' }}>£</span>
                <input autoFocus value={localAmount} onChange={e => setLocalAmount(e.target.value)} type="number"
                  onBlur={commitAmount} onKeyDown={e => e.key === 'Enter' && commitAmount()}
                  style={{ width: '70px', fontSize: '13px', background: 'rgba(255,255,255,0.08)',
                    border: '1px solid rgba(0,212,255,0.4)', borderRadius: '6px', padding: '2px 6px',
                    color: '#e2e8f0', outline: 'none' }} />
              </div>
            ) : (
              <span onClick={() => setEditingAmount(true)}
                style={{ fontSize: '13px', fontWeight: '600', color: '#00d4ff', cursor: 'text',
                  borderBottom: '1px dashed rgba(0,212,255,0.3)', paddingBottom: '1px' }}>
                £{parseFloat(localAmount).toFixed(2)}
              </span>
            )}
            <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)' }}>
              {FREQ_MAP[suggestion.frequency] || suggestion.frequency}
            </span>
          </div>

          {/* Explainer */}
          <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)', lineHeight: 1.4 }}>
            {suggestion.explainer}
          </div>
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
  const [stage, setStage] = useState('intro'); // intro | diagnostics | suggestions | summary
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [diagnostics, setDiagnostics] = useState(null);
  const [suggestions, setSuggestions] = useState({ bills: [], debts: [], savings: [] });
  const [checked, setChecked] = useState({});
  const [edits, setEdits] = useState({});
  const [expanded, setExpanded] = useState({ bills: true, debts: true, savings: true });
  const [showLow, setShowLow] = useState(false);
  const [summary, setSummary] = useState(null);

  const pickAndParse = async () => {
    setError(null);
    setLoading(true);
    try {
      const result = await pickCSVFile();
      const file = result.files[0];
      if (!file) { setLoading(false); return; }

      let text;
      if (file.data) {
        text = atob(file.data);
      } else if (file.blob) {
        text = await file.blob.text();
      } else {
        throw new Error('Could not read file contents.');
      }

      const { transactions, diagnostics: diag } = importCSV(text);
      const detected = detectRecurring(transactions);

      setDiagnostics(diag);
      setSuggestions(detected);

      // Auto-check high confidence items
      const autoChecked = {};
      [...detected.bills, ...detected.debts, ...detected.savings]
        .filter(s => s.confidenceLevel === 'high')
        .forEach(s => { autoChecked[s.id] = true; });
      setChecked(autoChecked);

      setStage('diagnostics');
      haptic.success();
    } catch (e) {
      setError(e.message || 'Could not read the file. Please check it is a valid CSV export from your bank.');
      haptic.error();
    }
    setLoading(false);
  };

  const toggleCheck = useCallback((id) => {
    setChecked(c => ({ ...c, [id]: !c[id] }));
  }, []);

  const editName = useCallback((id, name) => {
    setEdits(e => ({ ...e, [id + '_name']: name }));
  }, []);

  const editAmount = useCallback((id, amount) => {
    setEdits(e => ({ ...e, [id + '_amount']: amount }));
  }, []);

  const getSuggestionValue = (s, field) => edits[s.id + '_' + field] ?? (field === 'name' ? s.displayName : s.avgAmount);

  const acceptAll = () => {
    const allHigh = {};
    [...suggestions.bills, ...suggestions.debts, ...suggestions.savings]
      .filter(s => s.confidenceLevel === 'high')
      .forEach(s => { allHigh[s.id] = true; });
    setChecked(allHigh);
    haptic.medium();
  };

  const applySelections = () => {
    const allSuggestions = [...suggestions.bills, ...suggestions.debts, ...suggestions.savings];
    const selected = allSuggestions.filter(s => checked[s.id]);

    const newBills = selected.filter(s => s.type === 'bill').map(s => ({
      id: Date.now().toString() + Math.random().toString(36).substr(2, 4),
      name: getSuggestionValue(s, 'name'),
      category: guessCategory(getSuggestionValue(s, 'name')),
      projected: getSuggestionValue(s, 'amount'),
      actual: getSuggestionValue(s, 'amount'),
      frequency: FREQ_MAP[s.frequency] || 'Monthly',
      paymentDate: s.nextDueEstimate ? new Date(s.nextDueEstimate).getDate() + '' : '',
      paid: false, missed: false, paused: false, recurring: true,
    }));

    const newDebts = selected.filter(s => s.type === 'debt').map(s => ({
      id: Date.now().toString() + Math.random().toString(36).substr(2, 4),
      name: getSuggestionValue(s, 'name'),
      balance: 0, // user fills this in
      minimumPayment: getSuggestionValue(s, 'amount'),
      interestRate: 0,
      type: 'loan',
      fromImport: true,
    }));

    const newSavings = selected.filter(s => s.type === 'savings').map(s => ({
      id: Date.now().toString() + Math.random().toString(36).substr(2, 4),
      name: getSuggestionValue(s, 'name'),
      targetAmount: 0, // user fills this in
      currentAmount: 0,
      monthlyContrib: getSuggestionValue(s, 'amount'),
      fromImport: true,
    }));

    setSummary({
      bills: newBills.length,
      debts: newDebts.length,
      savings: newSavings.length,
      total: newBills.length + newDebts.length + newSavings.length,
    });
    setStage('summary');
    onComplete({ bills: newBills, debts: newDebts, savings: newSavings });
    haptic.success();
  };

  const allSuggestions = [...suggestions.bills, ...suggestions.debts, ...suggestions.savings];
  const highCount = allSuggestions.filter(s => s.confidenceLevel === 'high').length;
  const selectedCount = Object.values(checked).filter(Boolean).length;

  const renderSuggestions = (items, type) => {
    const visible = showLow ? items : items.filter(s => s.confidenceLevel !== 'low');
    const hidden  = items.filter(s => s.confidenceLevel === 'low');
    if (visible.length === 0 && hidden.length === 0) return null;
    return visible.map(s => (
      <SuggestionCard key={s.id} suggestion={s} checked={!!checked[s.id]}
        onToggle={toggleCheck} onEditName={editName} onEditAmount={editAmount} />
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
            Export a CSV from your banking app, then upload it here. We'll detect your recurring payments automatically.
          </p>
        </div>
        <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: '12px', padding: '14px 16px', maxWidth: '320px', width: '100%', textAlign: 'left' }}>
          <div style={{ fontSize: '11px', fontWeight: '700', color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase',
            letterSpacing: '0.5px', marginBottom: '10px' }}>How to export from your bank</div>
          {[
            ['Monzo', 'Account → Export transactions → CSV'],
            ['Starling', 'Spaces → Export → CSV'],
            ['Barclays', 'Statement → Download → CSV'],
            ['HSBC', 'Accounts → Download statement → CSV'],
            ['Lloyds', 'Statements → Download → CSV'],
          ].map(([bank, steps]) => (
            <div key={bank} style={{ display: 'flex', gap: '8px', marginBottom: '6px' }}>
              <span style={{ fontSize: '12px', fontWeight: '600', color: '#00d4ff', minWidth: '55px' }}>{bank}</span>
              <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', lineHeight: 1.4 }}>{steps}</span>
            </div>
          ))}
        </div>
        <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.25)', maxWidth: '280px', lineHeight: 1.5 }}>
          🔒 Your file is processed on this device. No transaction data is sent to our servers.
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
  if (stage === 'diagnostics') {
    const total = allSuggestions.length;
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: '20px 20px 0' }}>
        <h2 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '4px' }}>File analysed</h2>
        <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.5)', marginBottom: '16px' }}>
          Here's what we found in your statement
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '8px', marginBottom: '16px' }}>
          {[
            ['Transactions', diagnostics?.validTransactions],
            ['Days covered', diagnostics?.dayscovered],
            ['Detected', total],
          ].map(([label, val]) => (
            <div key={label} style={{ background: 'rgba(255,255,255,0.05)', borderRadius: '10px',
              padding: '12px 8px', textAlign: 'center' }}>
              <div style={{ fontSize: '22px', fontWeight: '700', color: '#00d4ff' }}>{val}</div>
              <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', marginTop: '2px' }}>{label}</div>
            </div>
          ))}
        </div>
        {diagnostics?.dayscovered < 60 && (
          <div style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.2)',
            borderRadius: '10px', padding: '10px 12px', fontSize: '12px', color: '#f59e0b', marginBottom: '12px' }}>
            ⚠️ Only {diagnostics.dayscovered} days of data — some recurring payments may not be detected. Try exporting a longer statement for better results.
          </div>
        )}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '16px' }}>
          {[['Bills', suggestions.bills.length, '#00d4ff'],
            ['Debts', suggestions.debts.length, '#f43f5e'],
            ['Savings', suggestions.savings.length, '#10b981']].map(([label, count, color]) => (
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
  }

  // ── SUGGESTIONS ──
  if (stage === 'suggestions') return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Header */}
      <div style={{ padding: '16px 20px 12px', flexShrink: 0, borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: '700' }}>Review suggestions</h2>
          <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)' }}>{selectedCount} selected</span>
        </div>
        <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', marginBottom: '10px' }}>
          Tap to select. Tap name or amount to edit.
        </p>
        {highCount > 0 && (
          <button onClick={acceptAll} style={{ fontSize: '12px', fontWeight: '600', color: '#00d4ff',
            background: 'rgba(0,212,255,0.08)', border: '1px solid rgba(0,212,255,0.2)',
            borderRadius: '20px', padding: '5px 12px', cursor: 'pointer' }}>
            ✓ Select all high confidence ({highCount})
          </button>
        )}
      </div>

      {/* Scrollable list */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '8px 20px' }}>
        {suggestions.bills.length > 0 && (
          <>
            <SectionHeader title="Bills detected" count={suggestions.bills.length} icon="📋"
              expanded={expanded.bills} onToggle={() => setExpanded(e => ({...e, bills: !e.bills}))} />
            {expanded.bills && renderSuggestions(suggestions.bills, 'bill')}
          </>
        )}
        {suggestions.debts.length > 0 && (
          <>
            <SectionHeader title="Debt payments detected" count={suggestions.debts.length} icon="💳"
              expanded={expanded.debts} onToggle={() => setExpanded(e => ({...e, debts: !e.debts}))} />
            {expanded.debts && renderSuggestions(suggestions.debts, 'debt')}
          </>
        )}
        {suggestions.savings.length > 0 && (
          <>
            <SectionHeader title="Savings transfers detected" count={suggestions.savings.length} icon="🏦"
              expanded={expanded.savings} onToggle={() => setExpanded(e => ({...e, savings: !e.savings}))} />
            {expanded.savings && renderSuggestions(suggestions.savings, 'savings')}
          </>
        )}
        {allSuggestions.some(s => s.confidenceLevel === 'low') && (
          <button onClick={() => setShowLow(v => !v)} style={{ width: '100%', background: 'none',
            border: '1px dashed rgba(255,255,255,0.1)', borderRadius: '10px', padding: '10px',
            cursor: 'pointer', color: 'rgba(255,255,255,0.3)', fontSize: '12px', marginTop: '8px' }}>
            {showLow ? 'Hide low confidence suggestions' : 'Show low confidence suggestions'}
          </button>
        )}
        <div style={{ height: '100px' }} />
      </div>

      {/* Footer */}
      <div style={{ padding: '12px 20px', paddingBottom: 'calc(env(safe-area-inset-bottom) + 12px)',
        borderTop: '1px solid rgba(255,255,255,0.06)', flexShrink: 0 }}>
        <button className="btn btn-primary" onClick={applySelections} disabled={selectedCount === 0}
          style={{ width: '100%', justifyContent: 'center', fontSize: '15px', padding: '14px',
            opacity: selectedCount === 0 ? 0.4 : 1 }}>
          Add {selectedCount} item{selectedCount !== 1 ? 's' : ''} to Tally →
        </button>
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

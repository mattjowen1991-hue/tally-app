import React from 'react';
import * as Icons from './Icons';
import { tc } from '../utils/themeColors';

export default function ActionsPanel({ income, setIncome, categoryTotals, setShowAddModal, setShowDebtModal, setShowSavingsModal, setShowCategoryModal, generateTestSnapshot, clearTestSnapshots, snapshotCount }) {
  return (
    <div className="glass-card animate-in" style={{ padding: '32px', animationDelay: '0.6s' }}>
      <h2 className="font-display" style={{ fontSize: '24px', marginBottom: '24px' }}>Quick Actions</h2>
      <div style={{ marginBottom: '24px' }}>
        <label style={{ display: 'block', color: 'var(--text-secondary)', fontSize: '13px', marginBottom: '8px', fontWeight: '500' }}>Monthly Income</label>
        <input type="number" className="input" value={income} onChange={(e) => setIncome(e.target.value === '' ? '' : e.target.value)} onBlur={(e) => setIncome(parseFloat(e.target.value) || 0)} onKeyDown={(e) => { if (e.key === 'Enter') e.target.blur(); }} />
      </div>
      <button className="btn btn-primary" onClick={() => setShowAddModal(true)} style={{ width: '100%', justifyContent: 'center', marginBottom: '12px' }}><Icons.Plus size={20} /> Add New Bill</button>
      <button className="btn btn-primary" onClick={() => setShowDebtModal(true)} style={{ width: '100%', justifyContent: 'center', marginBottom: '12px', background: 'linear-gradient(135deg, var(--danger), var(--accent-secondary))' }}><Icons.Plus size={20} /> Add New Debt</button>
      <button className="btn btn-primary" onClick={() => setShowSavingsModal(true)} style={{ width: '100%', justifyContent: 'center', marginBottom: '12px', background: 'linear-gradient(135deg, var(--success), var(--accent-primary))' }}><Icons.Plus size={20} /> Add Savings Goal</button>
      <button className="btn btn-secondary" onClick={() => setShowCategoryModal(true)} style={{ width: '100%', justifyContent: 'center', marginBottom: '16px' }}>Manage Categories</button>
      <div style={{ padding: '20px', background: 'var(--glass)', borderRadius: '12px', border: '1px solid var(--border)', marginBottom: '16px' }}>
        <h3 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '12px', color: 'var(--text-secondary)' }}>Category Summary</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {categoryTotals.map((cat) => (
            <div key={cat.name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0' }}>
              <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{cat.name}</span>
              <span className="font-mono" style={{ fontSize: '14px', fontWeight: '600' }}>£{cat.total.toFixed(2)}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Dev Tools - Test Snapshots */}
      {generateTestSnapshot && (
        <div style={{ padding: '16px', background: tc.purpleTint, borderRadius: '12px', border: '1px dashed rgba(124,58,237,0.3)' }}>
          <div style={{ fontSize: '12px', color: '#a855f7', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            🧪 Dev Tools
            {snapshotCount > 0 && <span style={{ fontSize: '11px', fontWeight: '500', color: 'var(--text-muted)' }}>({snapshotCount} snapshots)</span>}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <button
              onClick={() => { for (let i = 6; i >= 1; i--) generateTestSnapshot(i); }}
              style={{
                width: '100%', padding: '10px 16px', borderRadius: '10px', fontSize: '13px', fontWeight: '600',
                border: '1px solid rgba(124,58,237,0.3)', background: tc.purpleTintStrong,
                color: '#c084fc', cursor: 'pointer', transition: 'all 0.2s',
              }}
            >
              Generate 6 months of test data
            </button>
            <button
              onClick={() => generateTestSnapshot(1)}
              style={{
                width: '100%', padding: '10px 16px', borderRadius: '10px', fontSize: '13px', fontWeight: '600',
                border: '1px solid rgba(124,58,237,0.2)', background: tc.purpleTint,
                color: tc.purple, cursor: 'pointer', transition: 'all 0.2s',
              }}
            >
              + Add single month snapshot
            </button>
            {snapshotCount > 0 && (
              <button
                onClick={clearTestSnapshots}
                style={{
                  width: '100%', padding: '10px 16px', borderRadius: '10px', fontSize: '13px', fontWeight: '600',
                  border: '1px solid rgba(239,68,68,0.2)', background: tc.dangerTint,
                  color: '#f87171', cursor: 'pointer', transition: 'all 0.2s',
                }}
              >
                Clear all snapshots
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

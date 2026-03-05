import { useCurrency } from './CurrencyContext';
import React from 'react';
import * as Icons from './Icons';
import { tc } from '../utils/themeColors';

export default function ActionsPanel({ income, setIncome, categoryTotals, setShowAddModal, setShowDebtModal, setShowSavingsModal, setShowCategoryModal }) {
  const cs = useCurrency();
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
              <span className="font-mono" style={{ fontSize: '14px', fontWeight: '600' }}>{cs}{cat.total.toFixed(2)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

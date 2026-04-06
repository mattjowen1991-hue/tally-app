import React, { useState } from 'react';
import CSVImportFlow from './CSVImportFlow';

const BANKS = [
  {
    name: 'Monzo',
    color: '#FF3366',
    emoji: '🔴',
    csv: [
      'Open the Monzo app',
      'Tap your account at the top',
      'Tap the download icon (top right)',
      'Select "Export transactions"',
      'Choose CSV format',
      'Select date range (last 6 months)',
      'Save to your Files app',
    ],
    pdf: null,
    notes: 'Monzo CSV export is available directly in the app — easiest option.',
  },
  {
    name: 'Starling',
    color: '#7B61FF',
    emoji: '🟣',
    csv: [
      'Open the Starling app',
      'Tap your account',
      'Tap the three dots menu (top right)',
      'Select "Download statement"',
      'Choose CSV format',
      'Select date range',
      'Save to Files',
    ],
    pdf: [
      'Same steps as above',
      'Choose PDF format instead of CSV',
    ],
    notes: 'Both CSV and PDF available directly in the Starling app.',
  },
  {
    name: 'Barclays',
    color: '#00AEEF',
    emoji: '🔵',
    csv: [
      'Open barclays.co.uk in your browser (not the app)',
      'Log in to Online Banking',
      'Select your account',
      'Scroll down and tap "View all transactions"',
      'Set your date range and tap Search',
      'Scroll to the bottom and tap "Export All"',
      'Select CSV format',
      'File will download to your Downloads folder',
    ],
    pdf: [
      'Open the Barclays app',
      'Go to your account',
      'Tap Statements',
      'Select the statement period',
      'Tap Download — saves as PDF',
    ],
    notes: '⚠️ CSV export is only available via desktop browser or mobile browser (not the app). PDF is easier from the app.',
    warning: true,
  },
  {
    name: 'HSBC',
    color: '#DB0011',
    emoji: '🔴',
    csv: [
      'Open hsbc.co.uk in your browser',
      'Log in to Online Banking',
      'Select your account',
      'Tap "View transactions"',
      'Set your date range',
      'Tap "Export" or "Download"',
      'Select CSV format',
    ],
    pdf: [
      'Open the HSBC UK app',
      'Select your account',
      'Tap Statements',
      'Choose your statement',
      'Tap the download/share icon',
    ],
    notes: '⚠️ CSV export requires online banking via browser. PDF is available in the app.',
    warning: true,
  },
  {
    name: 'Lloyds',
    color: '#006A4E',
    emoji: '🟢',
    csv: [
      'Open lloydsbank.com in your browser',
      'Log in to Internet Banking',
      'Select your account',
      'Tap "Export transactions"',
      'Set date range',
      'Select CSV and download',
    ],
    pdf: [
      'Open the Lloyds Bank app',
      'Tap your account',
      'Tap Statements',
      'Select a statement',
      'Tap the share/download icon',
    ],
    notes: '⚠️ CSV requires browser. PDF available in app.',
    warning: true,
  },
  {
    name: 'NatWest',
    color: '#4B1C82',
    emoji: '🟣',
    csv: [
      'Open natwest.com in your browser',
      'Log in to Online Banking',
      'Select your account',
      'Tap "Download transactions"',
      'Select CSV format',
      'Choose date range and download',
    ],
    pdf: [
      'Open the NatWest app',
      'Tap your account',
      'Tap Statements',
      'Select the period',
      'Tap Download',
    ],
    notes: '⚠️ CSV requires browser. PDF available in app.',
    warning: true,
  },
  {
    name: 'Santander',
    color: '#EC0000',
    emoji: '🔴',
    csv: [
      'Open santander.co.uk in your browser',
      'Log in to Online Banking',
      'Select your account',
      'Tap "View statements"',
      'Select date range',
      'Choose Export and select CSV',
    ],
    pdf: [
      'Open the Santander app',
      'Tap your account',
      'Tap Statements',
      'Select a statement',
      'Tap the download icon',
    ],
    notes: '⚠️ CSV requires browser. PDF available in app.',
    warning: true,
  },
  {
    name: 'Halifax',
    color: '#009BDE',
    emoji: '🔵',
    csv: [
      'Open halifax.co.uk in your browser',
      'Log in to Online Banking',
      'Select your account',
      'Tap "Export transactions"',
      'Choose CSV and date range',
      'Download the file',
    ],
    pdf: [
      'Open the Halifax app',
      'Tap your account',
      'Tap Statements',
      'Select a statement and download',
    ],
    notes: '⚠️ CSV requires browser. PDF available in app.',
    warning: true,
  },
];

function BankGuide({ bank, onBack }) {
  const [tab, setTab] = useState('csv');
  const steps = tab === 'csv' ? bank.csv : bank.pdf;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '16px 20px',
        borderBottom: '1px solid rgba(255,255,255,0.06)', flexShrink: 0 }}>
        <button onClick={onBack} style={{ background: 'none', border: 'none', cursor: 'pointer',
          color: 'rgba(255,255,255,0.5)', fontSize: '20px', padding: '0', lineHeight: 1 }}>←</button>
        <span style={{ fontSize: '20px' }}>{bank.emoji}</span>
        <span style={{ fontSize: '17px', fontWeight: '700' }}>{bank.name}</span>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px' }}>
        {/* Tab selector */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
          <button onClick={() => setTab('csv')} style={{
            flex: 1, padding: '8px', borderRadius: '10px', fontSize: '13px', fontWeight: '600',
            cursor: 'pointer', border: tab === 'csv' ? '2px solid var(--accent-primary)' : '1px solid rgba(255,255,255,0.1)',
            background: tab === 'csv' ? 'rgba(0,212,255,0.1)' : 'rgba(255,255,255,0.03)',
            color: tab === 'csv' ? 'var(--accent-primary)' : 'rgba(255,255,255,0.4)',
          }}>CSV (recommended)</button>
          {bank.pdf && (
            <button onClick={() => setTab('pdf')} style={{
              flex: 1, padding: '8px', borderRadius: '10px', fontSize: '13px', fontWeight: '600',
              cursor: 'pointer', border: tab === 'pdf' ? '2px solid #f59e0b' : '1px solid rgba(255,255,255,0.1)',
              background: tab === 'pdf' ? 'rgba(245,158,11,0.1)' : 'rgba(255,255,255,0.03)',
              color: tab === 'pdf' ? '#f59e0b' : 'rgba(255,255,255,0.4)',
            }}>PDF</button>
          )}
        </div>

        {/* Warning */}
        {bank.warning && tab === 'csv' && (
          <div style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.2)',
            borderRadius: '10px', padding: '10px 12px', fontSize: '12px', color: '#f59e0b', marginBottom: '14px' }}>
            {bank.notes}
          </div>
        )}
        {!bank.warning && (
          <div style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)',
            borderRadius: '10px', padding: '10px 12px', fontSize: '12px', color: '#10b981', marginBottom: '14px' }}>
            {bank.notes}
          </div>
        )}

        {/* Steps */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {steps?.map((step, i) => (
            <div key={i} style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
              <div style={{ width: '24px', height: '24px', borderRadius: '50%', flexShrink: 0,
                background: 'rgba(0,212,255,0.15)', border: '1px solid rgba(0,212,255,0.2)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '11px', fontWeight: '700', color: 'var(--accent-primary)' }}>
                {i + 1}
              </div>
              <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.7)', lineHeight: 1.5, margin: 0, paddingTop: '2px' }}>
                {step}
              </p>
            </div>
          ))}
        </div>

        {tab === 'csv' && (
          <div style={{ marginTop: '20px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)',
            borderRadius: '10px', padding: '12px 14px' }}>
            <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.35)', margin: 0, lineHeight: 1.5 }}>
              Once you have the CSV file, come back to Tally and tap "Select CSV file" to upload it.
            </p>
          </div>
        )}
        {tab === 'pdf' && (
          <div style={{ marginTop: '20px', background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.15)',
            borderRadius: '10px', padding: '12px 14px' }}>
            <p style={{ fontSize: '12px', color: '#f59e0b', margin: 0, lineHeight: 1.5 }}>
              PDF import coming soon. For now, please use the CSV format to import your transactions.
            </p>
          </div>
        )}
        <div style={{ height: '32px' }} />
      </div>
    </div>
  );
}

export default function CSVImportModal({ onClose, onComplete }) {
  const [selectedBank, setSelectedBank] = useState(null);
  const [showImportFlow, setShowImportFlow] = useState(false);

  if (showImportFlow) {
    return (
      <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'var(--bg-primary)',
        display: 'flex', flexDirection: 'column' }}>
        <div style={{ paddingTop: 'env(safe-area-inset-top)', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', padding: '12px 20px',
            borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            <button onClick={() => setShowImportFlow(false)} style={{ background: 'none', border: 'none',
              cursor: 'pointer', color: 'rgba(255,255,255,0.5)', fontSize: '20px', padding: '0', marginRight: '12px' }}>←</button>
            <span style={{ fontSize: '16px', fontWeight: '600' }}>Select CSV file</span>
          </div>
        </div>
        <div style={{ flex: 1, overflow: 'hidden' }}>
          <CSVImportFlow
            onComplete={onComplete}
            onSkip={onClose}
          />
        </div>
      </div>
    );
  }

  if (selectedBank) {
    return (
      <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'var(--bg-primary)',
        display: 'flex', flexDirection: 'column', paddingTop: 'env(safe-area-inset-top)' }}>
        <BankGuide bank={selectedBank} onBack={() => setSelectedBank(null)} />
        {/* Import button fixed at bottom */}
        <div style={{ padding: '12px 20px', paddingBottom: 'calc(env(safe-area-inset-bottom) + 12px)',
          borderTop: '1px solid rgba(255,255,255,0.06)', flexShrink: 0 }}>
          <button className="btn btn-primary" onClick={() => setShowImportFlow(true)}
            style={{ width: '100%', justifyContent: 'center', fontSize: '15px', padding: '14px' }}>
            I have my CSV — Select file →
          </button>
        </div>
      </div>
    );
  }

  // Main screen — bank picker
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'var(--bg-primary)',
      display: 'flex', flexDirection: 'column', paddingTop: 'env(safe-area-inset-top)' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)', flexShrink: 0 }}>
        <div>
          <h2 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '2px' }}>Import bills</h2>
          <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)' }}>Choose how you want to import</p>
        </div>
        <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: '50%', width: '32px', height: '32px', cursor: 'pointer', color: 'rgba(255,255,255,0.5)',
          fontSize: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px' }}>

        {/* Two primary options — equal prominence */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>

          {/* Option 1 — Spreadsheet */}
          <button onClick={() => setShowImportFlow(true)} style={{
            display: 'flex', alignItems: 'center', gap: '14px', padding: '16px',
            background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.25)',
            borderRadius: '14px', cursor: 'pointer', textAlign: 'left', width: '100%',
          }}>
            <div style={{ width: '44px', height: '44px', borderRadius: '12px', flexShrink: 0,
              background: 'rgba(16,185,129,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px' }}>
              📊
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '15px', fontWeight: '700', color: '#10b981', marginBottom: '3px' }}>
                Upload a spreadsheet or CSV
              </div>
              <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)', lineHeight: 1.4 }}>
                Google Sheets, Excel, or any CSV budget file — just export as CSV and upload
              </div>
            </div>
            <span style={{ color: 'rgba(16,185,129,0.5)', fontSize: '16px' }}>›</span>
          </button>

          {/* Option 2 — Bank statement */}
          <div>
            <div style={{ fontSize: '11px', fontWeight: '700', color: 'rgba(255,255,255,0.3)',
              textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px', textAlign: 'center' }}>
              or import from your bank
            </div>
            {/* Bank list */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {BANKS.map(bank => (
                <button key={bank.name} onClick={() => setSelectedBank(bank)} style={{
                  display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px',
                  background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)',
                  borderRadius: '12px', cursor: 'pointer', textAlign: 'left', width: '100%',
                }}>
                  <span style={{ fontSize: '20px' }}>{bank.emoji}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '14px', fontWeight: '600', color: '#e2e8f0', marginBottom: '1px' }}>{bank.name}</div>
                    <div style={{ fontSize: '11px', color: bank.warning ? '#f59e0b' : '#10b981' }}>
                      {bank.warning ? '⚠️ CSV via browser · PDF in app' : '✅ CSV available in app'}
                    </div>
                  </div>
                  <span style={{ color: 'rgba(255,255,255,0.2)', fontSize: '14px' }}>›</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.25)', textAlign: 'center', lineHeight: 1.5, marginBottom: '8px' }}>
          🔒 Your file is processed on this device. No data is sent to our servers.
        </p>
        <div style={{ height: '16px' }} />
      </div>
    </div>
  );
}

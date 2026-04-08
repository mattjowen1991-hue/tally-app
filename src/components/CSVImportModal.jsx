import React, { useState, useRef } from 'react';
import CSVImportFlow from './CSVImportFlow';
import haptic from '../utils/haptics';

// Swipe-back edge zone — renders an invisible 24px strip on the left edge
// that captures touch gestures without interfering with scrollable content
function SwipeBackEdge({ onBack }) {
  const startX = useRef(null);
  const startY = useRef(null);

  const onTouchStart = (e) => {
    startX.current = e.touches[0].clientX;
    startY.current = e.touches[0].clientY;
  };

  const onTouchEnd = (e) => {
    if (startX.current === null) return;
    const dx = e.changedTouches[0].clientX - startX.current;
    const dy = Math.abs(e.changedTouches[0].clientY - startY.current);
    startX.current = null;
    startY.current = null;
    if (dx > 60 && dy < dx * 0.7) {
      haptic.light();
      onBack();
    }
  };

  return (
    <div
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
      style={{
        position: 'fixed', left: 0, top: 0, bottom: 0,
        width: '28px', zIndex: 10000,
      }}
    />
  );
}

const BANKS = [
  {
    name: 'Monzo',
    initials: 'Mo',
    color: '#FF3366',
    appExport: true,
    csvSupport: true,
    badge: 'In-app · Easy',
    tagline: 'Export directly from the Monzo app',
    steps: [
      'Open the Monzo app and go to Home',
      'Tap your account name at the top of the screen',
      'Tap the download icon in the top right corner',
      'Select "Export transactions"',
      'Choose CSV format',
      'Select your date range — last 6 months is ideal',
      'Tap Share and save the file to your Files app',
    ],
    note: 'Monzo makes exporting really simple — you can do the whole thing from the app in under a minute.',
  },
  {
    name: 'Starling',
    initials: 'Sl',
    color: '#6935D3',
    appExport: true,
    csvSupport: true,
    badge: 'In-app · Easy',
    tagline: 'Export directly from the Starling app',
    steps: [
      'Open the Starling app',
      'Tap your account',
      'Tap the three-dot menu ⋮ in the top right',
      'Select "Download statement"',
      'Choose CSV format',
      'Select your date range',
      'Save the file to your Files app',
    ],
    note: 'Starling supports CSV export directly from the app — no browser needed.',
  },
  {
    name: 'Revolut',
    initials: 'Rv',
    color: '#191C1F',
    appExport: true,
    csvSupport: true,
    badge: 'In-app · Easy',
    tagline: 'Export directly from the Revolut app',
    steps: [
      'Open the Revolut app',
      'Tap the Accounts icon (circle) at the top left',
      'Tap "Documents & Statements"',
      'Select "Account Statement"',
      'Choose your date range',
      'Select Excel or CSV format',
      'Tap "Generate" and save the file to your device',
    ],
    note: 'If you have both personal and business accounts, export each separately. Business accounts can export up to 100 days at a time.',
  },
  {
    name: 'Barclays',
    initials: 'Ba',
    color: '#00AEEF',
    appExport: false,
    csvSupport: true,
    badge: 'Browser required',
    tagline: 'Export via barclays.co.uk',
    steps: [
      'On your phone or computer, open barclays.co.uk in a browser',
      'Log in to Online Banking',
      'Select your current account',
      'Tap "View all transactions"',
      'Set your date range and tap Search',
      'Scroll to the bottom and tap "Export All"',
      'Choose CSV format and download the file',
    ],
    note: 'CSV export is only available via the Barclays website — not the mobile app. You can use your phone\'s browser if you don\'t have a computer nearby.',
    warning: true,
  },
  {
    name: 'HSBC',
    initials: 'HS',
    color: '#DB0011',
    appExport: false,
    csvSupport: true,
    badge: 'Browser required',
    tagline: 'Export via hsbc.co.uk',
    steps: [
      'Go to hsbc.co.uk in your browser and log in',
      'Select your current account',
      'Tap "Transactions" to view your history',
      'Set your date range',
      'Tap "Download" and select CSV format',
      'Save the file to your device',
    ],
    note: 'HSBC\'s CSV export is browser-only. You can use your phone\'s browser — just visit hsbc.co.uk and log in with your usual details.',
    warning: true,
  },
  {
    name: 'Lloyds',
    initials: 'Ll',
    color: '#006A4E',
    appExport: false,
    csvSupport: true,
    badge: 'Browser required',
    tagline: 'Export via lloydsbank.com',
    steps: [
      'Go to lloydsbank.com in your browser and log in',
      'Select your account',
      'Tap "Statement options" above your transactions',
      'Select "Export transactions"',
      'Choose CSV format and set your date range',
      'Note: max 3 months and 150 transactions per export',
      'Download the file',
    ],
    note: 'Lloyds limits exports to 3 months at a time with a max of 150 transactions per file. For more history, just repeat the export with an earlier date range.',
    warning: true,
  },
  {
    name: 'NatWest',
    initials: 'NW',
    color: '#4B1C82',
    appExport: false,
    csvSupport: true,
    badge: 'Browser required',
    tagline: 'Export via natwest.com',
    steps: [
      'Go to natwest.com in your browser and log in',
      'Tap "Statements & Transactions", then "View Transactions"',
      'Tap "Show search"',
      'Select a date range (max 3 months) and tap Search',
      'Tap "Export" and select CSV format',
      'Download the file',
    ],
    note: 'NatWest limits exports to 3 months per download. Use your phone\'s browser if you don\'t have a computer nearby.',
    warning: true,
  },
  {
    name: 'Santander',
    initials: 'Sa',
    color: '#EC0000',
    appExport: false,
    csvSupport: true,
    badge: 'Browser required',
    tagline: 'Export via santander.co.uk',
    steps: [
      'Go to santander.co.uk in your browser and log in',
      'Tap "Statements & Documents"',
      'Select your account and date range (max 12 months)',
      'Choose CSV format',
      'Tap "Generate Statement" and download the file',
    ],
    note: 'Santander allows up to 12 months per CSV export, with a max of 600 transactions. Browser required.',
    warning: true,
  },
  {
    name: 'Nationwide',
    initials: 'Na',
    color: '#112B5E',
    appExport: false,
    csvSupport: true,
    badge: 'Browser required',
    tagline: 'Export via nationwide.co.uk',
    steps: [
      'Go to nationwide.co.uk in your browser and log in',
      'Select your current account',
      'Set your date range (maximum 1 year at a time)',
      'Tap "Download Transactions"',
      'Select "Download CSV file"',
      'Save the file to your device',
    ],
    note: 'Nationwide supports CSV export via their website with a maximum range of one year per download.',
    warning: true,
  },
  {
    name: 'First Direct',
    initials: 'FD',
    color: '#000000',
    appExport: false,
    csvSupport: true,
    badge: 'Browser required',
    tagline: 'Export via firstdirect.com',
    steps: [
      'Go to firstdirect.com in your browser and log in',
      'Go to the Transactions section',
      'Select your date range (up to 90 days at a time)',
      'Choose CSV format',
      'Download the file',
    ],
    note: 'First Direct lets you export up to 90 days at a time, or a full year at once — going back up to 6 years. Browser only, not available in the app.',
    warning: true,
  },
  {
    name: 'Halifax',
    initials: 'Hx',
    color: '#0A6EBD',
    appExport: false,
    csvSupport: false,
    badge: 'PDF export',
    tagline: 'Download a PDF statement',
    steps: [
      'Go to halifax.co.uk in your browser and log in',
      'Select your account',
      'Tap "Search transactions" and set your date range',
      'Download your statement as a PDF',
      'Come back to Tally and tap "Select file" below',
      'Choose the PDF you downloaded — we\'ll extract your transactions automatically',
    ],
    note: 'Halifax offers PDF statements (not CSV). No problem — Tally can read PDF bank statements directly and extract your transactions on-device.',
  },
  {
    name: 'Chase UK',
    initials: 'Ch',
    color: '#117ACA',
    appExport: false,
    csvSupport: false,
    badge: 'PDF export',
    tagline: 'Download a PDF statement',
    steps: [
      'Open the Chase app or go to chase.co.uk',
      'Log in to your account',
      'Tap "Statements & documents"',
      'Select the statement period you want',
      'Download the PDF statement',
      'Come back to Tally and tap "Select file" below',
      'Choose the PDF you downloaded — we\'ll extract your transactions automatically',
    ],
    note: 'Chase UK offers PDF statements. Tally can read PDF bank statements directly — just download and upload, we\'ll handle the rest.',
  },
];

const EASY_BANKS = BANKS.filter(b => b.appExport);
const OTHER_BANKS = BANKS.filter(b => !b.appExport);

function BankAvatar({ bank, size = 40 }) {
  return (
    <div style={{
      width: size, height: size,
      borderRadius: Math.round(size * 0.28),
      background: bank.color,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      flexShrink: 0,
      color: '#fff',
      fontSize: Math.round(size * 0.35),
      fontWeight: '800',
      letterSpacing: '-0.5px',
      fontFamily: 'inherit',
    }}>
      {bank.initials}
    </div>
  );
}

function BadgePill({ bank }) {
  const isEasy = bank.appExport;
  return (
    <span style={{
      fontSize: '10px',
      fontWeight: '700',
      padding: '2px 7px',
      borderRadius: '20px',
      letterSpacing: '0.2px',
      background: isEasy
        ? 'color-mix(in srgb, var(--success) 12%, transparent)'
        : 'color-mix(in srgb, var(--text-muted) 12%, transparent)',
      color: isEasy ? 'var(--success)' : 'var(--text-muted)',
      border: isEasy
        ? '1px solid color-mix(in srgb, var(--success) 25%, transparent)'
        : '1px solid var(--border)',
    }}>
      {bank.badge}
    </span>
  );
}

function BankGuide({ bank, onBack, onSelectFile }) {
  const accentColor = bank.color;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>

      {/* Header */}
      <div style={{ flexShrink: 0 }}>
        {/* Color accent bar */}
        <div style={{ height: '4px', background: accentColor }} />
        <div style={{
          display: 'flex', alignItems: 'center', gap: '14px',
          padding: '16px 20px', borderBottom: '1px solid var(--border)',
        }}>
          <button onClick={() => { haptic.light(); onBack(); }} style={{
            background: 'var(--glass)', border: '1px solid var(--border)',
            borderRadius: '10px', width: '36px', height: '36px',
            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'var(--text-muted)', fontSize: '18px', flexShrink: 0,
          }}>←</button>
          <BankAvatar bank={bank} size={40} />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '18px', fontWeight: '700', color: 'var(--text-primary)', lineHeight: 1.2 }}>
              {bank.name}
            </div>
            <BadgePill bank={bank} />
          </div>
        </div>
      </div>

      {/* Scrollable content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>

        {/* How it works explainer */}
        <div style={{
          background: 'var(--glass)', border: '1px solid var(--border)',
          borderRadius: '14px', padding: '14px 16px', marginBottom: '20px',
        }}>
          <div style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px' }}>
            How it works
          </div>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0 }}>
            Export your recent transactions from your bank ({bank.csvSupport ? 'CSV' : 'PDF'} format). Then come back to Tally and upload the file — we'll scan it and suggest any recurring bills we spot automatically.
          </p>
        </div>

        {/* Browser warning */}
        {bank.warning && (
          <div style={{
            background: 'color-mix(in srgb, var(--warning) 10%, transparent)',
            border: '1px solid color-mix(in srgb, var(--warning) 25%, transparent)',
            borderRadius: '12px', padding: '12px 14px', marginBottom: '20px',
            display: 'flex', gap: '10px', alignItems: 'flex-start',
          }}>
            <span style={{ fontSize: '16px', flexShrink: 0 }}>⚠️</span>
            <p style={{ fontSize: '13px', color: 'var(--warning)', margin: 0, lineHeight: 1.5 }}>
              {bank.name} requires you to use a <strong>web browser</strong> (not the app) to export transactions. Open your phone\'s browser and go to {bank.tagline.split('via ')[1] || 'their website'}.
            </p>
          </div>
        )}

        {/* PDF info note — banks that don't support CSV */}
        {!bank.csvSupport && (
          <div style={{
            background: 'color-mix(in srgb, var(--accent-primary) 8%, transparent)',
            border: '1px solid color-mix(in srgb, var(--accent-primary) 20%, transparent)',
            borderRadius: '12px', padding: '12px 14px', marginBottom: '20px',
            display: 'flex', gap: '10px', alignItems: 'flex-start',
          }}>
            <span style={{ fontSize: '16px', flexShrink: 0 }}>📄</span>
            <p style={{ fontSize: '13px', color: 'var(--accent-primary)', margin: 0, lineHeight: 1.5 }}>
              {bank.name} provides PDF statements. Tally can read these directly — just download and upload, no conversion needed.
            </p>
          </div>
        )}

        {/* Steps */}
        <div style={{ marginBottom: '20px' }}>
          <div style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '14px' }}>
            Step-by-step guide
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {bank.steps.map((step, i) => (
              <div key={i} style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                <div style={{
                  width: '28px', height: '28px', borderRadius: '50%', flexShrink: 0,
                  background: accentColor,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '12px', fontWeight: '800', color: '#fff',
                }}>
                  {i + 1}
                </div>
                <div style={{
                  flex: 1, fontSize: '14px', color: 'var(--text-primary)',
                  lineHeight: 1.55, paddingTop: '4px',
                }}>
                  {step}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Note */}
        <div style={{
          background: 'var(--glass)', border: '1px solid var(--border)',
          borderRadius: '12px', padding: '12px 14px',
        }}>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: 0, lineHeight: 1.6 }}>
            💡 {bank.note}
          </p>
        </div>

        <div style={{ height: '20px' }} />
      </div>

      {/* Sticky bottom CTA */}
      <div style={{
        padding: '14px 20px',
        paddingBottom: 'calc(env(safe-area-inset-bottom) + 14px)',
        borderTop: '1px solid var(--border)',
        flexShrink: 0,
        background: 'var(--bg-primary)',
      }}>
        <button
          className="btn btn-primary"
          onClick={() => { haptic.medium(); onSelectFile(); }}
          style={{ width: '100%', justifyContent: 'center', fontSize: '15px', padding: '14px' }}
        >
          I have my file — select {bank.csvSupport ? 'CSV' : 'PDF'} →
        </button>
      </div>
    </div>
  );
}

function BankRow({ bank, onSelect }) {
  return (
    <button onClick={() => { haptic.light(); onSelect(bank); }} style={{
      display: 'flex', alignItems: 'center', gap: '14px',
      padding: '12px 14px',
      background: 'var(--bg-card)',
      border: '1px solid var(--border)',
      borderRadius: '14px',
      cursor: 'pointer', textAlign: 'left', width: '100%',
      transition: 'all 0.15s',
    }}>
      <BankAvatar bank={bank} size={40} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: '15px', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '3px' }}>
          {bank.name}
        </div>
        <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{bank.tagline}</div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px', flexShrink: 0 }}>
        <BadgePill bank={bank} />
        <span style={{ color: 'var(--text-muted)', fontSize: '16px' }}>›</span>
      </div>
    </button>
  );
}

export default function CSVImportModal({ onClose, onComplete, bills = [], categories = [], onAddCategory }) {
  const [selectedBank, setSelectedBank] = useState(null);
  const [showImportFlow, setShowImportFlow] = useState(false);
  const [skipIntro, setSkipIntro] = useState(false);

  const openImportFlow = (fromBankGuide = false) => {
    setSkipIntro(fromBankGuide);
    setShowImportFlow(true);
  };

  // ── Import flow (file pick + analysis) ──
  if (showImportFlow) {
    return (
      <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'var(--bg-primary)', display: 'flex', flexDirection: 'column' }}>
        <SwipeBackEdge onBack={() => { haptic.light(); setShowImportFlow(false); }} />
        <div style={{ paddingTop: 'env(safe-area-inset-top)', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', padding: '12px 20px', borderBottom: '1px solid var(--border)' }}>
            <button onClick={() => { haptic.light(); setShowImportFlow(false); }} style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: 'var(--text-muted)', fontSize: '20px', padding: '0', marginRight: '12px',
            }}>←</button>
            <span style={{ fontSize: '16px', fontWeight: '600', color: 'var(--text-primary)' }}>Select file</span>
          </div>
        </div>
        <div style={{ flex: 1, overflow: 'hidden' }}>
          <CSVImportFlow
            onComplete={onComplete}
            onSkip={onClose}
            skipIntro={skipIntro}
            existingBills={bills}
            categories={categories}
            onAddCategory={onAddCategory}
          />
        </div>
      </div>
    );
  }

  // ── Bank guide ──
  if (selectedBank) {
    return (
      <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'var(--bg-primary)', display: 'flex', flexDirection: 'column', paddingTop: 'env(safe-area-inset-top)' }}>
        <SwipeBackEdge onBack={() => setSelectedBank(null)} />
        <BankGuide
          bank={selectedBank}
          onBack={() => setSelectedBank(null)}
          onSelectFile={() => openImportFlow(true)}
        />
      </div>
    );
  }

  // ── Main hub ──
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'var(--bg-primary)', display: 'flex', flexDirection: 'column', paddingTop: 'env(safe-area-inset-top)' }}>
      <SwipeBackEdge onBack={onClose} />

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
        <div>
          <h2 style={{ fontSize: '20px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '2px' }}>Import Bills</h2>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Add bills automatically from your bank data</p>
        </div>
        <button onClick={() => { haptic.light(); onClose(); }} style={{
          background: 'var(--glass)', border: '1px solid var(--border)',
          borderRadius: '50%', width: '34px', height: '34px',
          cursor: 'pointer', color: 'var(--text-muted)',
          fontSize: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>✕</button>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>

        {/* Upload a file (primary option) */}
        <div style={{ marginBottom: '24px' }}>
          <div style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: '10px' }}>
            Already have a file?
          </div>
          <button onClick={() => { haptic.medium(); openImportFlow(false); }} style={{
            display: 'flex', alignItems: 'center', gap: '16px',
            width: '100%', padding: '16px',
            background: 'color-mix(in srgb, var(--success) 8%, transparent)',
            border: '1px solid color-mix(in srgb, var(--success) 25%, transparent)',
            borderRadius: '16px', cursor: 'pointer', textAlign: 'left',
          }}>
            <div style={{
              width: '48px', height: '48px', borderRadius: '14px', flexShrink: 0,
              background: 'color-mix(in srgb, var(--success) 15%, transparent)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px',
            }}>📄</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '15px', fontWeight: '700', color: 'var(--success)', marginBottom: '4px' }}>
                Upload a file
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                CSV, spreadsheet, or PDF bank statement — we'll handle the rest.
              </div>
            </div>
            <span style={{ color: 'var(--success)', fontSize: '18px', opacity: 0.6, flexShrink: 0 }}>›</span>
          </button>
        </div>

        {/* Divider */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
          <div style={{ flex: 1, height: '1px', background: 'var(--border)' }} />
          <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: '600' }}>or follow a guide</span>
          <div style={{ flex: 1, height: '1px', background: 'var(--border)' }} />
        </div>

        {/* Easy banks — in-app export */}
        <div style={{ marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
            <div style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.6px' }}>
              Easy — export from the app
            </div>
            <div style={{ flex: 1, height: '1px', background: 'var(--border)' }} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {EASY_BANKS.map(bank => (
              <BankRow key={bank.name} bank={bank} onSelect={setSelectedBank} />
            ))}
          </div>
        </div>

        {/* Other banks — browser required */}
        <div style={{ marginBottom: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
            <div style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.6px' }}>
              Browser or website required
            </div>
            <div style={{ flex: 1, height: '1px', background: 'var(--border)' }} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {OTHER_BANKS.map(bank => (
              <BankRow key={bank.name} bank={bank} onSelect={setSelectedBank} />
            ))}
          </div>
        </div>

        {/* Privacy note */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          gap: '6px', padding: '12px',
          background: 'var(--glass)', border: '1px solid var(--border)',
          borderRadius: '12px',
        }}>
          <span style={{ fontSize: '14px' }}>🔒</span>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: 0, lineHeight: 1.5 }}>
            Your file is processed <strong style={{ color: 'var(--text-secondary)' }}>on this device only</strong>. No transaction data is ever sent to our servers.
          </p>
        </div>

        <div style={{ height: '20px' }} />
      </div>
    </div>
  );
}

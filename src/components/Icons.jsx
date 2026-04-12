import React from 'react';

// ─── UI Icons ───────────────────────────────────────────────────────────────

export const DollarSign = ({ size = 24, style = {}, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={style} className={className}>
    <rect x="2" y="2" width="20" height="20" rx="6" fill="currentColor" opacity="0.12"/>
    <path d="M12 5v14M9 8.5c0-1.1.9-2 2-2h2a2 2 0 1 1 0 4h-2a2 2 0 1 0 0 4h2.5a2 2 0 0 0 2-2" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export const TrendingUp = ({ size = 24, style = {}, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={style} className={className}>
    <rect x="2" y="2" width="20" height="20" rx="6" fill="currentColor" opacity="0.12"/>
    <path d="M5 15l4.5-4.5 3 3L17 9M17 9h-3.5M17 9v3.5" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export const TrendingDown = ({ size = 24, style = {}, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={style} className={className}>
    <rect x="2" y="2" width="20" height="20" rx="6" fill="currentColor" opacity="0.12"/>
    <path d="M5 9l4.5 4.5 3-3L17 15M17 15h-3.5M17 15v-3.5" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export const Calendar = ({ size = 24, style = {}, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={style} className={className}>
    <rect x="3" y="5" width="18" height="16" rx="4" fill="currentColor" opacity="0.12"/>
    <rect x="3" y="5" width="18" height="16" rx="4" stroke="currentColor" strokeWidth="1.75"/>
    <path d="M3 10h18" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round"/>
    <path d="M8 3v4M16 3v4" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round"/>
    <circle cx="8" cy="15" r="1" fill="currentColor"/>
    <circle cx="12" cy="15" r="1" fill="currentColor"/>
    <circle cx="16" cy="15" r="1" fill="currentColor"/>
  </svg>
);

export const Edit = ({ size = 24, style = {}, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round" style={style} className={className}>
    <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
  </svg>
);

export const Trash = ({ size = 24, style = {}, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={style} className={className}>
    <path d="M6 7h12l-1.5 13a1 1 0 0 1-1 .9H8.5a1 1 0 0 1-1-.9L6 7z" fill="currentColor" opacity="0.12" stroke="currentColor" strokeWidth="1.75" strokeLinejoin="round"/>
    <path d="M3 7h18M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2M10 12v5M14 12v5" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export const Plus = ({ size = 24, style = {}, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={style} className={className}>
    <rect x="2" y="2" width="20" height="20" rx="6" fill="currentColor" opacity="0.15"/>
    <path d="M12 7v10M7 12h10" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
  </svg>
);

export const Check = ({ size = 24, style = {}, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={style} className={className}>
    <path d="M5 13l4.5 4.5L19 7" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export const X = ({ size = 24, style = {}, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={style} className={className}>
    <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round"/>
  </svg>
);

export const PieChart = ({ size = 24, style = {}, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={style} className={className}>
    <path d="M12 2a10 10 0 1 0 10 10H12V2z" fill="currentColor" opacity="0.15"/>
    <path d="M12 2a10 10 0 1 0 10 10H12V2z" stroke="currentColor" strokeWidth="1.75" strokeLinejoin="round"/>
    <path d="M12 2v10h10" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export const Search = ({ size = 24, style = {}, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={style} className={className}>
    <circle cx="11" cy="11" r="7" fill="currentColor" opacity="0.12" stroke="currentColor" strokeWidth="1.75"/>
    <path d="M16.5 16.5L21 21" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
  </svg>
);

export const SortAsc = ({ size = 24, style = {}, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={style} className={className}>
    <path d="M4 6h16M4 12h10M4 18h6" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round"/>
    <path d="M18 10v9M15 16l3 3 3-3" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export const ChevronDown = ({ size = 16, style = {}, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={style} className={className}>
    <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export const Settings = ({ size = 24, style = {}, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" style={style} className={className}>
    <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/>
    <circle cx="12" cy="12" r="3"/>
  </svg>
);

export const SlidersH = ({ size = 24, style = {}, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" style={style} className={className}>
    <line x1="21" y1="4" x2="14" y2="4"/><line x1="10" y1="4" x2="3" y2="4"/>
    <line x1="21" y1="12" x2="12" y2="12"/><line x1="8" y1="12" x2="3" y2="12"/>
    <line x1="21" y1="20" x2="16" y2="20"/><line x1="12" y1="20" x2="3" y2="20"/>
    <circle cx="12" cy="4" r="2"/><circle cx="10" cy="12" r="2"/><circle cx="14" cy="20" r="2"/>
  </svg>
);

export const Bell = ({ size = 24, style = {}, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={style} className={className}>
    <path d="M6 10a6 6 0 1 1 12 0c0 4 2 6 2 6H4s2-2 2-6z" fill="currentColor" opacity="0.12" stroke="currentColor" strokeWidth="1.75" strokeLinejoin="round"/>
    <path d="M10 20a2 2 0 0 0 4 0" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round"/>
  </svg>
);

export const Palette = ({ size = 24, style = {}, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={style} className={className}>
    <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.9 0 1.5-.7 1.5-1.5 0-.4-.15-.75-.4-1-.25-.3-.4-.65-.4-1.05C12.7 17.6 13.4 17 14.2 17H16c3.3 0 6-2.7 6-6 0-4.95-4.5-9-10-9z" fill="currentColor" opacity="0.12" stroke="currentColor" strokeWidth="1.75"/>
    <circle cx="7.5" cy="12" r="1.25" fill="currentColor"/>
    <circle cx="9.5" cy="7.5" r="1.25" fill="currentColor"/>
    <circle cx="14.5" cy="7.5" r="1.25" fill="currentColor"/>
    <circle cx="16.5" cy="12" r="1.25" fill="currentColor"/>
  </svg>
);

export const Calculator = ({ size = 24, style = {}, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={style} className={className}>
    <rect x="4" y="2" width="16" height="20" rx="3" fill="currentColor" opacity="0.12" stroke="currentColor" strokeWidth="1.75"/>
    <rect x="7" y="5" width="10" height="4" rx="1.5" fill="currentColor" opacity="0.5"/>
    <circle cx="8" cy="13" r="1.2" fill="currentColor"/>
    <circle cx="12" cy="13" r="1.2" fill="currentColor"/>
    <circle cx="16" cy="13" r="1.2" fill="currentColor"/>
    <circle cx="8" cy="17" r="1.2" fill="currentColor"/>
    <circle cx="12" cy="17" r="1.2" fill="currentColor"/>
    <rect x="14.8" y="15.8" width="2.4" height="2.4" rx="0.8" fill="currentColor"/>
  </svg>
);

export const Coins = ({ size = 24, style = {}, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={style} className={className}>
    <ellipse cx="9" cy="8" rx="6" ry="3" fill="currentColor" opacity="0.15" stroke="currentColor" strokeWidth="1.5"/>
    <path d="M3 8v5c0 1.66 2.69 3 6 3s6-1.34 6-3V8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    <path d="M15 9.13c1.77.48 3 1.46 3 2.6v5c0 1.66-2.69 3-6 3-1.98 0-3.74-.5-4.88-1.27" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
);

export const Home = ({ size = 24, style = {}, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={style} className={className}>
    <path d="M3 10.5L12 3l9 7.5V21a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-10.5z" fill="currentColor" opacity="0.15" stroke="currentColor" strokeWidth="1.75" strokeLinejoin="round"/>
    <path d="M9 22V13h6v9" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

// ─── Category Icons ──────────────────────────────────────────────────────────

export const CategoryHome = ({ size = 24, style = {}, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={style} className={className}>
    <path d="M3 10.5L12 3l9 7.5V21a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V10.5z" fill="currentColor" opacity="0.2"/>
    <path d="M3 10.5L12 3l9 7.5V21a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V10.5z" stroke="currentColor" strokeWidth="1.75" strokeLinejoin="round"/>
    <path d="M9 22V13h6v9" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M10 9h4M12 7v4" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" opacity="0.6"/>
  </svg>
);

export const CategoryTransport = ({ size = 24, style = {}, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" style={style} className={className}>
    <path d="M5 17h14a2 2 0 0 0 2-2v-4a2 2 0 0 0-2-2h-1l-1.5-3.5A1 1 0 0 0 15.58 5H8.42a1 1 0 0 0-.92.6L6 9H5a2 2 0 0 0-2 2v4a2 2 0 0 0 2 2z" fill="currentColor" opacity="0.15"/>
    <path d="M5 17h14a2 2 0 0 0 2-2v-4a2 2 0 0 0-2-2h-1l-1.5-3.5A1 1 0 0 0 15.58 5H8.42a1 1 0 0 0-.92.6L6 9H5a2 2 0 0 0-2 2v4a2 2 0 0 0 2 2z"/>
    <circle cx="7.5" cy="17" r="2"/><circle cx="16.5" cy="17" r="2"/>
  </svg>
);

export const CategoryFood = ({ size = 24, style = {}, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" style={style} className={className}>
    <path d="M18 8h1a4 4 0 0 1 0 8h-1" opacity="0.4"/>
    <path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z" fill="currentColor" opacity="0.15"/>
    <path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"/>
    <line x1="6" y1="1" x2="6" y2="4"/><line x1="10" y1="1" x2="10" y2="4"/><line x1="14" y1="1" x2="14" y2="4"/>
  </svg>
);

export const CategoryEntertainment = ({ size = 24, style = {}, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={style} className={className}>
    <rect x="2" y="4" width="20" height="14" rx="3" fill="currentColor" opacity="0.2"/>
    <rect x="2" y="4" width="20" height="14" rx="3" stroke="currentColor" strokeWidth="1.75"/>
    <path d="M8 20h8M12 18v2" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round"/>
    <path d="M10 9.5l5 2.5-5 2.5V9.5z" fill="currentColor" stroke="currentColor" strokeWidth="1.25" strokeLinejoin="round"/>
  </svg>
);

export const CategoryHealth = ({ size = 24, style = {}, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={style} className={className}>
    <path d="M12 21C12 21 3 15.5 3 9a4.5 4.5 0 0 1 9-1 4.5 4.5 0 0 1 9 1c0 6.5-9 12-9 12z" fill="currentColor" opacity="0.2" stroke="currentColor" strokeWidth="1.75" strokeLinejoin="round"/>
    <path d="M9 10h6M12 7v6" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round"/>
  </svg>
);

export const CategoryInsurance = ({ size = 24, style = {}, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={style} className={className}>
    <path d="M12 2L4 6v5c0 5 3.5 9.5 8 11 4.5-1.5 8-6 8-11V6L12 2z" fill="currentColor" opacity="0.2" stroke="currentColor" strokeWidth="1.75" strokeLinejoin="round"/>
    <path d="M8.5 12l2.5 2.5 5-5" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export const CategoryCreditCard = ({ size = 24, style = {}, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={style} className={className}>
    <rect x="2" y="5" width="20" height="14" rx="3" fill="currentColor" opacity="0.2"/>
    <rect x="2" y="5" width="20" height="14" rx="3" stroke="currentColor" strokeWidth="1.75"/>
    <path d="M2 10h20" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
    <rect x="5" y="14" width="5" height="2" rx="1" fill="currentColor" opacity="0.6"/>
    <rect x="12" y="14" width="3" height="2" rx="1" fill="currentColor" opacity="0.4"/>
  </svg>
);

export const CategorySubscription = ({ size = 24, style = {}, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" style={style} className={className}>
    <path d="M17 2.1l4 4-4 4" opacity="0.5"/>
    <path d="M3 12.2v-2a4 4 0 0 1 4-4h12.8" opacity="0.5"/>
    <path d="M7 21.9l-4-4 4-4" opacity="0.5"/>
    <path d="M21 11.8v2a4 4 0 0 1-4 4H4.2" opacity="0.5"/>
    <circle cx="12" cy="12" r="3" fill="currentColor" opacity="0.15"/>
    <circle cx="12" cy="12" r="3"/>
  </svg>
);

export const CategorySavings = ({ size = 24, style = {}, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" style={style} className={className}>
    <path d="M19 5c-1.5 0-2.8 1.4-3 2l-3.5 1H9a3 3 0 0 0 0 6h.5l-1 2.5a2 2 0 0 0 1.8 2.8h.2a2 2 0 0 0 1.9-1.3l.9-2.5H14l2 3.5a2 2 0 0 0 1.7 1h.3a2 2 0 0 0 1.7-3l-1.7-3V8c0-1.7-1.3-3-3-3z" fill="currentColor" opacity="0.15"/>
    <path d="M19 5c-1.5 0-2.8 1.4-3 2l-3.5 1H9a3 3 0 0 0 0 6h.5l-1 2.5a2 2 0 0 0 1.8 2.8h.2a2 2 0 0 0 1.9-1.3l.9-2.5H14l2 3.5a2 2 0 0 0 1.7 1h.3a2 2 0 0 0 1.7-3l-1.7-3V8c0-1.7-1.3-3-3-3z"/>
    <line x1="2" y1="10" x2="5.5" y2="10" opacity="0.5"/>
    <circle cx="16" cy="9" r="0.5" fill="currentColor" stroke="none"/>
  </svg>
);

export const CategoryUtilities = ({ size = 24, style = {}, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={style} className={className}>
    <path d="M13 2L4 14h8l-1 8 9-12h-8l1-8z" fill="currentColor" opacity="0.2" stroke="currentColor" strokeWidth="1.75" strokeLinejoin="round"/>
  </svg>
);

export const CategoryEducation = ({ size = 24, style = {}, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={style} className={className}>
    <path d="M12 3L2 8l10 5 10-5-10-5z" fill="currentColor" opacity="0.2" stroke="currentColor" strokeWidth="1.75" strokeLinejoin="round"/>
    <path d="M6 10.6V16c0 1.66 2.69 3 6 3s6-1.34 6-3v-5.4" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round"/>
    <path d="M22 8v5" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round"/>
  </svg>
);

export const CategoryOther = ({ size = 24, style = {}, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" style={style} className={className}>
    <circle cx="12" cy="12" r="1" fill="currentColor"/>
    <circle cx="19" cy="12" r="1" fill="currentColor"/>
    <circle cx="5" cy="12" r="1" fill="currentColor"/>
  </svg>
);

// ─── Tally Branding ──────────────────────────────────────────────────────────

export const Tally = ({ size = 40 }) => (
  <svg width={size} height={size} viewBox="30 40 200 180" fill="none">
    <defs>
      <linearGradient id="tallyGrad" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#1E63D6" />
        <stop offset="100%" stopColor="#34C759" />
      </linearGradient>
    </defs>
    <g fill="url(#tallyGrad)">
      <rect x="58" y="52" width="22" height="156" rx="14" transform="rotate(-4 69 130)" />
      <rect x="94" y="48" width="26" height="160" rx="14" transform="rotate(2 107 128)" />
      <rect x="132" y="54" width="23" height="150" rx="14" transform="rotate(-2 143.5 129)" />
      <rect x="168" y="50" width="25" height="158" rx="14" transform="rotate(3 180.5 129)" />
    </g>
    <path d="M38 170 Q128 120 220 92" fill="none" stroke="url(#tallyGrad)" strokeWidth="20" strokeLinecap="round" />
  </svg>
);

export const TallyWordmark = ({ width = 190 }) => (
  <svg width={width} viewBox="10 30 400 120" fill="none" style={{ display: 'block' }}>
    <defs>
      <linearGradient id="wordmarkGrad" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#2F6BFF" />
        <stop offset="55%" stopColor="#22C3A6" />
        <stop offset="100%" stopColor="#7AD957" />
      </linearGradient>
    </defs>
    <text x="210" y="118" textAnchor="middle" fill="url(#wordmarkGrad)" fontSize="110" fontWeight="800" letterSpacing="-6" fontFamily="ui-rounded, 'SF Pro Rounded', Nunito, Quicksand, 'Avenir Next Rounded', 'Segoe UI', system-ui, -apple-system, Arial" transform="skewX(-6)">
      <tspan>T</tspan>
      <tspan dx="-16" dy="4">a</tspan>
      <tspan dy="-3">l</tspan>
      <tspan dy="5">l</tspan>
      <tspan dy="-4">y</tspan>
    </text>
  </svg>
);

export const Sun = ({ size = 24, style = {}, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={style} className={className}>
    <rect x="2" y="2" width="20" height="20" rx="6" fill="currentColor" opacity="0.12"/>
    <circle cx="12" cy="12" r="3.5" stroke="currentColor" strokeWidth="1.75"/>
    <path d="M12 5v1.5M12 17.5V19M5 12H6.5M17.5 12H19M7.05 7.05l1.06 1.06M15.89 15.89l1.06 1.06M7.05 16.95l1.06-1.06M15.89 8.11l1.06-1.06" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round"/>
  </svg>
);

export const Moon = ({ size = 24, style = {}, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={style} className={className}>
    <rect x="2" y="2" width="20" height="20" rx="6" fill="currentColor" opacity="0.12"/>
    <path d="M12.5 6.5A6 6 0 0 0 17.5 17 6 6 0 1 1 8 7.5a6 6 0 0 0 4.5-1z" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export const Pause = ({ size = 24, style = {}, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" style={style} className={className}>
    <rect x="6" y="4" width="4" height="16" rx="1"/>
    <rect x="14" y="4" width="4" height="16" rx="1"/>
  </svg>
);

export const Lightbulb = ({ size = 24, style = {}, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" style={style} className={className}>
    <path d="M9 18h6M10 21h4M12 2a7 7 0 0 1 4 12.74V17a1 1 0 0 1-1 1H9a1 1 0 0 1-1-1v-2.26A7 7 0 0 1 12 2z"/>
  </svg>
);

export const Upload = ({ size = 24, style = {}, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" style={style} className={className}>
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
    <polyline points="17 8 12 3 7 8"/>
    <line x1="12" y1="3" x2="12" y2="15"/>
  </svg>
);

export const Shield = ({ size = 24, style = {}, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" style={style} className={className}>
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
    <path d="M9 12l2 2 4-4"/>
  </svg>
);

export const Sparkle = ({ size = 24, style = {}, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" style={style} className={className}>
    <path d="M12 3l1.5 5.5L19 10l-5.5 1.5L12 17l-1.5-5.5L5 10l5.5-1.5L12 3z"/>
    <path d="M19 15l.5 1.5L21 17l-1.5.5L19 19l-.5-1.5L17 17l1.5-.5L19 15z"/>
  </svg>
);

export const FileCheck = ({ size = 24, style = {}, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" style={style} className={className}>
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
    <polyline points="14 2 14 8 20 8"/>
    <path d="M9 15l2 2 4-4"/>
  </svg>
);

export const PartyPopper = ({ size = 24, style = {}, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" style={style} className={className}>
    <path d="M5.8 11.3L2 22l10.7-3.8"/>
    <path d="M4 3h.01M22 8h.01M15 2h.01M22 20h.01M5.8 11.3C7.1 8.4 9.4 6.1 12.3 4.8"/>
    <path d="M12.3 4.8C14.1 3.9 16.1 3.5 18 3.5c.5 0 1 0 1.5.1"/>
    <path d="M13.2 19.7c1-1.8 1.4-3.8 1.4-5.7 0-.5 0-1-.1-1.5"/>
    <circle cx="8" cy="16" r="0.5" fill="currentColor"/>
    <circle cx="17" cy="11" r="0.5" fill="currentColor"/>
    <circle cx="11" cy="7" r="0.5" fill="currentColor"/>
  </svg>
);

export const InfoCircle = ({ size = 24, style = {}, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" style={style} className={className}>
    <circle cx="12" cy="12" r="10"/>
    <path d="M12 16v-4M12 8h.01"/>
  </svg>
);

export const Trophy = ({ size = 24, style = {}, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" style={style} className={className}>
    <path d="M6 9H4.5a2.5 2.5 0 010-5H6"/>
    <path d="M18 9h1.5a2.5 2.5 0 000-5H18"/>
    <path d="M4 22h16"/>
    <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20 7 22"/>
    <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20 17 22"/>
    <path d="M18 2H6v7a6 6 0 1012 0V2z" fill="currentColor" opacity="0.15"/>
    <path d="M18 2H6v7a6 6 0 1012 0V2z"/>
  </svg>
);

export const Fire = ({ size = 24, style = {}, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" style={style} className={className}>
    <path d="M12 12c2-2.96 0-7-1-8 0 3.038-1.773 4.741-3 6-1.226 1.26-2 3.24-2 5a6 6 0 1012 0c0-1.532-1.056-3.94-2-5-1.786 3-2.791 3-4 2z"/>
  </svg>
);

export const Banknote = ({ size = 24, style = {}, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" style={style} className={className}>
    <rect x="2" y="6" width="20" height="12" rx="2" fill="currentColor" opacity="0.15"/>
    <rect x="2" y="6" width="20" height="12" rx="2"/>
    <circle cx="12" cy="12" r="2.5"/>
    <path d="M6 12h.01M18 12h.01"/>
  </svg>
);

export const Plane = ({ size = 24, style = {}, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" style={style} className={className}>
    <path d="M17.8 19.2L16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z" fill="currentColor" opacity="0.15"/>
    <path d="M17.8 19.2L16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z"/>
  </svg>
);

export const ShoppingBag = ({ size = 24, style = {}, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" style={style} className={className}>
    <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" fill="currentColor" opacity="0.15"/>
    <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
    <line x1="3" y1="6" x2="21" y2="6"/>
    <path d="M16 10a4 4 0 0 1-8 0"/>
  </svg>
);

export const GraduationCap = ({ size = 24, style = {}, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" style={style} className={className}>
    <path d="M12 3L2 8l10 5 10-5-10-5z" fill="currentColor" opacity="0.15"/>
    <path d="M12 3L2 8l10 5 10-5-10-5z"/>
    <path d="M6 10.6V16c0 1.66 2.69 3 6 3s6-1.34 6-3v-5.4"/>
    <path d="M22 8v5"/>
  </svg>
);

export const Umbrella = ({ size = 24, style = {}, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" style={style} className={className}>
    <path d="M23 12a11.05 11.05 0 0 0-22 0" fill="currentColor" opacity="0.15"/>
    <path d="M23 12a11.05 11.05 0 0 0-22 0"/>
    <path d="M12 12v8a2 2 0 0 0 4 0"/>
    <line x1="12" y1="2" x2="12" y2="3"/>
  </svg>
);

export const TrendingChart = ({ size = 24, style = {}, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" style={style} className={className}>
    <polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/>
    <polyline points="16 7 22 7 22 13"/>
    <line x1="2" y1="20" x2="22" y2="20" opacity="0.3"/>
  </svg>
);

export const Handshake = ({ size = 24, style = {}, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" style={style} className={className}>
    <path d="M20.42 4.58a5.4 5.4 0 0 0-7.65 0l-.77.78-.77-.78a5.4 5.4 0 0 0-7.65 0A5.4 5.4 0 0 0 3.58 12L12 20.42 20.42 12a5.4 5.4 0 0 0 0-7.42z" fill="currentColor" opacity="0.1"/>
    <path d="M11 17l-1.5 1.5a2.5 2.5 0 0 1-3.5-3.5L7.5 13"/>
    <path d="M13 7l1.5-1.5a2.5 2.5 0 0 1 3.5 3.5L16.5 11"/>
    <line x1="8" y1="16" x2="16" y2="8"/>
  </svg>
);

export const Sunset = ({ size = 24, style = {}, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" style={style} className={className}>
    <path d="M12 10V2"/>
    <path d="M4.93 10.93l1.41 1.41"/>
    <path d="M2 18h2"/>
    <path d="M20 18h2"/>
    <path d="M19.07 10.93l-1.41 1.41"/>
    <path d="M22 22H2"/>
    <path d="M16 18a4 4 0 0 0-8 0"/>
    <path d="M8 6l4 4 4-4" opacity="0.5"/>
  </svg>
);

export const Clock = ({ size = 24, style = {}, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" style={style} className={className}>
    <circle cx="12" cy="12" r="10" fill="currentColor" opacity="0.15"/>
    <circle cx="12" cy="12" r="10"/>
    <polyline points="12 6 12 12 16 14"/>
  </svg>
);

export const FolderOpen = ({ size = 24, style = {}, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" style={style} className={className}>
    <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
    <path d="M2 10h20"/>
  </svg>
);

export const Warning = ({ size = 24, style = {}, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" style={style} className={className}>
    <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" fill="currentColor" opacity="0.15"/>
    <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
    <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
  </svg>
);

export const Snowflake = ({ size = 24, style = {}, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" style={style} className={className}>
    <line x1="12" y1="2" x2="12" y2="22"/><line x1="2" y1="12" x2="22" y2="12"/>
    <line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/><line x1="19.07" y1="4.93" x2="4.93" y2="19.07"/>
    <line x1="12" y1="2" x2="9" y2="5"/><line x1="12" y1="2" x2="15" y2="5"/>
    <line x1="12" y1="22" x2="9" y2="19"/><line x1="12" y1="22" x2="15" y2="19"/>
    <line x1="2" y1="12" x2="5" y2="9"/><line x1="2" y1="12" x2="5" y2="15"/>
    <line x1="22" y1="12" x2="19" y2="9"/><line x1="22" y1="12" x2="19" y2="15"/>
  </svg>
);

export const Mountain = ({ size = 24, style = {}, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" style={style} className={className}>
    <path d="M8 3l4 8 5-5 5 14H2L8 3z" fill="currentColor" opacity="0.15"/>
    <path d="M8 3l4 8 5-5 5 14H2L8 3z"/>
    <path d="M4.14 15.08l2.86-3 2 2.5" opacity="0.7"/>
  </svg>
);

export const Lock = ({ size = 24, style = {}, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" style={style} className={className}>
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" fill="currentColor" opacity="0.15"/>
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
    <path d="M7 11V7a5 5 0 0110 0v4"/>
    <circle cx="12" cy="16" r="1" fill="currentColor"/>
  </svg>
);

export const Document = ({ size = 24, style = {}, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" style={style} className={className}>
    <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" fill="currentColor" opacity="0.15"/>
    <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
    <polyline points="14 2 14 8 20 8"/>
    <line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>
  </svg>
);

export const Target = ({ size = 24, style = {}, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" style={style} className={className}>
    <circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2" fill="currentColor"/>
  </svg>
);

export const Grid = ({ size = 24, style = {}, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" style={style} className={className}>
    <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/>
    <rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>
  </svg>
);

export const Timer = ({ size = 24, style = {}, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" style={style} className={className}>
    <circle cx="12" cy="13" r="8"/><path d="M12 9v4l2 2"/>
    <line x1="9" y1="1" x2="15" y2="1"/><line x1="12" y1="1" x2="12" y2="4"/>
  </svg>
);

export const Repeat = ({ size = 24, style = {}, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" style={style} className={className}>
    <polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 014-4h14"/>
    <polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 01-4 4H3"/>
  </svg>
);

export const Star = ({ size = 24, style = {}, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" style={style} className={className}>
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
  </svg>
);

export const ArrowUp = ({ size = 24, style = {}, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={style} className={className}>
    <line x1="12" y1="19" x2="12" y2="5"/><polyline points="5 12 12 5 19 12"/>
  </svg>
);

export const ArrowDown = ({ size = 24, style = {}, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={style} className={className}>
    <line x1="12" y1="5" x2="12" y2="19"/><polyline points="19 12 12 19 5 12"/>
  </svg>
);

export const Refresh = ({ size = 24, style = {}, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" style={style} className={className}>
    <polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/>
    <path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15"/>
  </svg>
);

export const CircleDot = ({ size = 24, style = {}, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" style={style} className={className}>
    <circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="4" fill="currentColor"/>
  </svg>
);

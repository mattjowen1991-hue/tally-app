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
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={style} className={className}>
    <circle cx="12" cy="12" r="3" fill="currentColor" opacity="0.2"/>
    <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.75"/>
    <path d="M12 2v2M12 20v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M2 12h2M20 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round"/>
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
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={style} className={className}>
    <rect x="2" y="6" width="20" height="12" rx="4" fill="currentColor" opacity="0.2"/>
    <rect x="2" y="6" width="20" height="12" rx="4" stroke="currentColor" strokeWidth="1.75"/>
    <path d="M6 18v2M18 18v2" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round"/>
    <path d="M2 12h20" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.5"/>
    <circle cx="7" cy="15" r="1.25" fill="currentColor"/>
    <circle cx="12" cy="15" r="1.25" fill="currentColor"/>
    <circle cx="17" cy="15" r="1.25" fill="currentColor"/>
    <path d="M7 9h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.6"/>
  </svg>
);

export const CategoryFood = ({ size = 24, style = {}, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={style} className={className}>
    <path d="M12 2C7 2 3 6 3 11h18C21 6 17 2 12 2z" fill="currentColor" opacity="0.2"/>
    <path d="M12 2C7 2 3 6 3 11h18C21 6 17 2 12 2z" stroke="currentColor" strokeWidth="1.75" strokeLinejoin="round"/>
    <rect x="3" y="11" width="18" height="3" rx="1.5" fill="currentColor" opacity="0.3" stroke="currentColor" strokeWidth="1.5"/>
    <path d="M9 14v6M12 14v6M15 14v6" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round"/>
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
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={style} className={className}>
    <circle cx="12" cy="12" r="9" fill="currentColor" opacity="0.15" stroke="currentColor" strokeWidth="1.75"/>
    <path d="M12 7v5l3 3" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M8 3.5A9 9 0 0 1 21 12" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" opacity="0.5"/>
    <path d="M21 3.5v4.5h-4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.5"/>
  </svg>
);

export const CategorySavings = ({ size = 24, style = {}, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={style} className={className}>
    <path d="M20 14c0 3.87-3.58 7-8 7s-8-3.13-8-7c0-2.5 1.38-4.7 3.5-6.02L9 4h6l1.5 3.98C18.62 9.3 20 11.5 20 14z" fill="currentColor" opacity="0.2" stroke="currentColor" strokeWidth="1.75" strokeLinejoin="round"/>
    <path d="M17 14a5 5 0 0 1-5 5" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" opacity="0.5"/>
    <circle cx="16" cy="9" r="1" fill="currentColor"/>
    <path d="M9 4h6" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" opacity="0.4"/>
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
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={style} className={className}>
    <rect x="3" y="3" width="7.5" height="7.5" rx="2.5" fill="currentColor" opacity="0.2" stroke="currentColor" strokeWidth="1.75"/>
    <rect x="13.5" y="3" width="7.5" height="7.5" rx="2.5" fill="currentColor" opacity="0.2" stroke="currentColor" strokeWidth="1.75"/>
    <rect x="3" y="13.5" width="7.5" height="7.5" rx="2.5" fill="currentColor" opacity="0.2" stroke="currentColor" strokeWidth="1.75"/>
    <rect x="13.5" y="13.5" width="7.5" height="7.5" rx="2.5" fill="currentColor" opacity="0.2" stroke="currentColor" strokeWidth="1.75"/>
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

export const Lightbulb = ({ size = 24, style = {}, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" style={style} className={className}>
    <path d="M9 18h6M10 21h4M12 2a7 7 0 0 1 4 12.74V17a1 1 0 0 1-1 1H9a1 1 0 0 1-1-1v-2.26A7 7 0 0 1 12 2z"/>
  </svg>
);

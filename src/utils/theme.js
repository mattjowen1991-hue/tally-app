// Theme management utility
const STORAGE_KEY = 'tally-theme';

export const themes = {
  DARK: 'dark',
  LIGHT: 'light',
};

export function getStoredTheme() {
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

export function getPreferredTheme() {
  const stored = getStoredTheme();
  if (stored) return stored;
  if (window.matchMedia?.('(prefers-color-scheme: light)').matches) return themes.LIGHT;
  return themes.DARK;
}

function applyStatusBar(theme) {
  const color = theme === 'light' ? '#f1f5f9' : '#0a0e27';
  const style = theme === 'light' ? 'LIGHT' : 'DARK';
  try {
    const { StatusBar } = window.Capacitor?.Plugins || {};
    if (StatusBar) {
      StatusBar.setBackgroundColor({ color });
      StatusBar.setStyle({ style });
    }
  } catch {}
}

export async function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  document.body?.setAttribute('data-theme', theme);
  // Set color-scheme on html element so native UI elements (select, confirm, etc.) respect theme
  document.documentElement.style.colorScheme = theme === 'light' ? 'light' : 'dark';
  if (document.body) {
    document.body.style.colorScheme = theme === 'light' ? 'light' : 'dark';
  }
  // Also set/create meta color-scheme tag for Android WebView
  let colorSchemeMeta = document.querySelector('meta[name="color-scheme"]');
  if (!colorSchemeMeta) {
    colorSchemeMeta = document.createElement('meta');
    colorSchemeMeta.name = 'color-scheme';
    document.head.appendChild(colorSchemeMeta);
  }
  colorSchemeMeta.content = theme === 'light' ? 'light' : 'dark';
  try {
    localStorage.setItem(STORAGE_KEY, theme);
  } catch {}
  const color = theme === 'light' ? '#f1f5f9' : '#0a0e27';
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute('content', color);
  applyStatusBar(theme);
  applyKeyboardStyle(theme);
  await mirrorThemeToNative(theme);
}

// Set iOS keyboard appearance to match theme (prevents light->dark flicker on focus)
function applyKeyboardStyle(theme) {
  const setStyle = () => {
    try {
      const Keyboard = window.Capacitor?.Plugins?.Keyboard;
      if (!Keyboard?.setStyle) return;
      Keyboard.setStyle({ style: theme === 'light' ? 'LIGHT' : 'DARK' });
    } catch {}
  };
  setStyle();
  // Retry after a tick in case the plugin hasn't mounted yet on first boot
  setTimeout(setStyle, 300);
}

async function mirrorThemeToNative(theme) {
  try {
    const prefs = window.Capacitor?.Plugins?.Preferences;
    if (prefs) await prefs.set({ key: '_tally_theme_native', value: theme });
  } catch {}
  // Tell native Android to switch night mode immediately. Critical: this
  // controls the Activity's theme context, which is what native popups
  // (date picker, text-selection handle backdrop) inherit. If we miss this
  // call, the whole app shows native UI in the wrong theme.
  // Retry until TallyNative is registered (it's injected on first paint).
  let attempts = 0;
  const tryNotify = () => {
    try {
      if (window.TallyNative?.setTheme) {
        window.TallyNative.setTheme(theme);
        return;
      }
    } catch {}
    if (++attempts < 50) setTimeout(tryNotify, 100);
  };
  tryNotify();
}
export function applyStatusBarWhenReady(theme) {
  if (window.Capacitor?.Plugins?.StatusBar) {
    applyStatusBar(theme);
  } else {
    document.addEventListener('deviceready', () => applyStatusBar(theme), { once: true });
    setTimeout(() => applyStatusBar(theme), 300);
  }
}

export async function toggleTheme() {
  const current = document.documentElement.getAttribute('data-theme') || 'dark';
  const next = current === 'dark' ? 'light' : 'dark';
  await applyTheme(next);
  return next;
}

export function initTheme() {
  const theme = getPreferredTheme();
  applyTheme(theme); // intentionally not awaited — sync parts run immediately
  return theme;
}

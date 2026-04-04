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

export function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  try {
    localStorage.setItem(STORAGE_KEY, theme);
  } catch {}
  const color = theme === 'light' ? '#f1f5f9' : '#0a0e27';
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute('content', color);
  applyStatusBar(theme);
  mirrorThemeToNative(theme);
}

function mirrorThemeToNative(theme) {
  try {
    // Mirror to Android SharedPreferences so MainActivity can read it on cold start
    window.Capacitor?.Plugins?.Preferences?.set({ key: '_tally_theme_native', value: theme });
  } catch {}
}
export function applyStatusBarWhenReady(theme) {
  if (window.Capacitor?.Plugins?.StatusBar) {
    applyStatusBar(theme);
  } else {
    document.addEventListener('deviceready', () => applyStatusBar(theme), { once: true });
    setTimeout(() => applyStatusBar(theme), 300);
  }
}

export function toggleTheme() {
  const current = document.documentElement.getAttribute('data-theme') || 'dark';
  const next = current === 'dark' ? 'light' : 'dark';
  applyTheme(next);
  return next;
}

export function initTheme() {
  const theme = getPreferredTheme();
  applyTheme(theme);
  return theme;
}
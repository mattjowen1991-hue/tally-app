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

export function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  try {
    localStorage.setItem(STORAGE_KEY, theme);
  } catch {}
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) {
    meta.setAttribute('content', theme === 'light' ? '#f1f5f9' : '#0a0e27');
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
/**
 * Storage shim - bridges to Capacitor Preferences on device,
 * falls back to localStorage in browser.
 */
export function initStorage() {
  if (window.Capacitor?.Plugins?.Preferences) {
    const Prefs = window.Capacitor.Plugins.Preferences;
    window.storage = {
      get: async (key) => {
        const result = await Prefs.get({ key });
        return result.value ? { value: result.value } : null;
      },
      set: async (key, value) => {
        await Prefs.set({ key, value });
        return { key, value };
      },
      delete: async (key) => {
        await Prefs.remove({ key });
        return { key, deleted: true };
      },
    };
  } else if (!window.storage) {
    window.storage = {
      get: async (key) => {
        const v = localStorage.getItem(key);
        return v ? { value: v } : null;
      },
      set: async (key, value) => {
        localStorage.setItem(key, value);
        return { key, value };
      },
      delete: async (key) => {
        localStorage.removeItem(key);
        return { key, deleted: true };
      },
    };
  }
}

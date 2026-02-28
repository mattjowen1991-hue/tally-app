import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';

// Safe wrapper — silently fails on web/desktop where haptics aren't available
const safeHaptic = async (fn) => {
  try { await fn(); } catch (e) { /* no haptic engine available */ }
};

const haptic = {
  // Light tap — buttons, nav dots, filter pills
  light: () => safeHaptic(() => Haptics.impact({ style: ImpactStyle.Light })),

  // Medium tap — toggle paid, open modal, add item
  medium: () => safeHaptic(() => Haptics.impact({ style: ImpactStyle.Medium })),

  // Heavy tap — panel swipe snap, delete action
  heavy: () => safeHaptic(() => Haptics.impact({ style: ImpactStyle.Heavy })),

  // Success — bill paid, goal reached, payment made
  success: () => safeHaptic(() => Haptics.notification({ type: NotificationType.Success })),

  // Warning — missed bill, validation error
  warning: () => safeHaptic(() => Haptics.notification({ type: NotificationType.Warning })),

  // Error — delete, failed action
  error: () => safeHaptic(() => Haptics.notification({ type: NotificationType.Error })),

  // Selection feedback — scrolling through items
  selection: () => safeHaptic(() => Haptics.selectionChanged()),
};

export default haptic;

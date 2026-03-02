import { LocalNotifications } from '@capacitor/local-notifications';
import { Capacitor } from '@capacitor/core';

// ── Notification ID ranges (to avoid collisions) ──
const ID_DAILY_REMINDER = 10000;
const ID_WEEKLY_SUMMARY = 20000;
const ID_MISSED_ALERT = 30000;

// ── Helpers ──
const isNative = () => Capacitor.isNativePlatform();

const getPaymentDay = (bill) => {
  // Return the day-of-month (1-31) this bill is due
  if (bill.paymentDate) return parseInt(bill.paymentDate) || null;
  if (bill.paymentDay) return parseInt(bill.paymentDay) || null;
  return null;
};

const formatCurrency = (amount) => `£${(amount || 0).toFixed(2)}`;

// ── Permission handling ──
export const requestNotificationPermission = async () => {
  if (!isNative()) return false;
  try {
    const { display } = await LocalNotifications.checkPermissions();
    if (display === 'granted') return true;
    const result = await LocalNotifications.requestPermissions();
    return result.display === 'granted';
  } catch (err) {
    console.error('Notification permission error:', err);
    return false;
  }
};

export const checkNotificationPermission = async () => {
  if (!isNative()) return false;
  try {
    const { display } = await LocalNotifications.checkPermissions();
    return display === 'granted';
  } catch {
    return false;
  }
};

// ── Cancel all Tally notifications ──
const cancelAllTallyNotifications = async () => {
  try {
    const pending = await LocalNotifications.getPending();
    if (pending.notifications.length > 0) {
      await LocalNotifications.cancel({ notifications: pending.notifications });
    }
  } catch (err) {
    console.error('Error cancelling notifications:', err);
  }
};

// ── Build notification content ──
const buildDailyReminderContent = (bills) => {
  if (bills.length === 0) return null;

  if (bills.length === 1) {
    const bill = bills[0];
    const dueText = bill._daysUntilDue === 0 ? 'is due today' :
                    bill._daysUntilDue === 1 ? 'is due tomorrow' :
                    `is due in ${bill._daysUntilDue} days`;
    return {
      title: `${bill.name} ${dueText}`,
      body: formatCurrency(bill.actual || bill.projected),
    };
  }

  // Group by due timing
  const today = bills.filter(b => b._daysUntilDue === 0);
  const tomorrow = bills.filter(b => b._daysUntilDue === 1);
  const later = bills.filter(b => b._daysUntilDue > 1);

  const total = bills.reduce((s, b) => s + (b.actual || b.projected || 0), 0);
  const title = `${bills.length} bills due soon — ${formatCurrency(total)}`;

  const lines = [];
  if (today.length > 0) {
    lines.push(`Today: ${today.map(b => `${b.name} (${formatCurrency(b.actual || b.projected)})`).join(', ')}`);
  }
  if (tomorrow.length > 0) {
    lines.push(`Tomorrow: ${tomorrow.map(b => `${b.name} (${formatCurrency(b.actual || b.projected)})`).join(', ')}`);
  }
  if (later.length > 0) {
    lines.push(`Coming up: ${later.map(b => `${b.name} (${formatCurrency(b.actual || b.projected)})`).join(', ')}`);
  }

  return { title, body: lines.join('\n') };
};

const buildMissedAlertContent = (bills) => {
  if (bills.length === 0) return null;

  if (bills.length === 1) {
    return {
      title: `Missed: ${bills[0].name}`,
      body: `${formatCurrency(bills[0].actual || bills[0].projected)} was due and hasn't been marked as paid`,
    };
  }

  const total = bills.reduce((s, b) => s + (b.actual || b.projected || 0), 0);
  return {
    title: `${bills.length} missed bills — ${formatCurrency(total)}`,
    body: bills.map(b => `${b.name} (${formatCurrency(b.actual || b.projected)})`).join(', '),
  };
};

// ── Get bills due within N days ──
const getBillsDueWithin = (bills, days) => {
  const now = new Date();
  const currentDay = now.getDate();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

  return bills
    .filter(b => !b.paid && !b.paused && !b.missed)
    .map(b => {
      const payDay = getPaymentDay(b);
      if (!payDay) return null;

      // Calculate days until due (handling month wrap)
      let daysUntilDue;
      if (payDay >= currentDay) {
        daysUntilDue = payDay - currentDay;
      } else {
        // Bill is next month (or already passed this month)
        daysUntilDue = (daysInMonth - currentDay) + payDay;
      }

      if (daysUntilDue <= days) {
        return { ...b, _daysUntilDue: daysUntilDue };
      }
      return null;
    })
    .filter(Boolean)
    .sort((a, b) => a._daysUntilDue - b._daysUntilDue);
};

// ── Get missed bills (past due date, not paid) ──
const getMissedBills = (bills) => {
  const now = new Date();
  const currentDay = now.getDate();

  return bills.filter(b => {
    if (b.paid || b.paused || b.missed) return false;
    const payDay = getPaymentDay(b);
    if (!payDay) return false;
    // Bill is past due if payment day < current day (same month)
    return payDay < currentDay;
  });
};

// ── Schedule all notifications ──
export const scheduleNotifications = async (bills, settings = {}) => {
  if (!isNative()) return;

  const {
    enabled = true,
    reminderHour = 9,
    reminderMinute = 0,
  } = settings;

  // Always cancel existing first
  await cancelAllTallyNotifications();

  if (!enabled) return;

  const hasPermission = await requestNotificationPermission();
  if (!hasPermission) return;

  const notifications = [];
  const now = new Date();

  // ── 1. Daily bill reminder (bills due within 3 days) ──
  const upcomingBills = getBillsDueWithin(bills, 3);
  const dailyContent = buildDailyReminderContent(upcomingBills);

  if (dailyContent) {
    // Schedule for today if before reminder time, otherwise tomorrow
    const reminderDate = new Date();
    reminderDate.setHours(reminderHour, reminderMinute, 0, 0);

    if (reminderDate <= now) {
      // Already past today's reminder time, schedule for tomorrow
      reminderDate.setDate(reminderDate.getDate() + 1);
    }

    notifications.push({
      id: ID_DAILY_REMINDER,
      title: dailyContent.title,
      body: dailyContent.body,
      largeBody: dailyContent.body,
      schedule: { at: reminderDate, allowWhileIdle: true },
      sound: null,
      actionTypeId: '',
      extra: { type: 'daily_reminder' },
    });
  }

  // ── 2. Weekly Monday summary ──
  const unpaidBills = bills.filter(b => !b.paid && !b.paused);
  if (unpaidBills.length > 0) {
    const unpaidTotal = unpaidBills.reduce((s, b) => s + (b.actual || b.projected || 0), 0);

    // Find next Monday
    const nextMonday = new Date();
    const dayOfWeek = nextMonday.getDay(); // 0=Sun, 1=Mon
    const daysUntilMonday = dayOfWeek === 0 ? 1 : dayOfWeek === 1 ? (now.getHours() >= reminderHour ? 7 : 0) : 8 - dayOfWeek;
    nextMonday.setDate(nextMonday.getDate() + daysUntilMonday);
    nextMonday.setHours(reminderHour, reminderMinute, 0, 0);

    notifications.push({
      id: ID_WEEKLY_SUMMARY,
      title: `Weekly Summary — ${unpaidBills.length} unpaid bill${unpaidBills.length > 1 ? 's' : ''}`,
      body: `${formatCurrency(unpaidTotal)} outstanding this month`,
      largeBody: unpaidBills.map(b => `• ${b.name}: ${formatCurrency(b.actual || b.projected)}`).join('\n'),
      schedule: { at: nextMonday, allowWhileIdle: true },
      sound: null,
      actionTypeId: '',
      extra: { type: 'weekly_summary' },
    });
  }

  // ── 3. Missed bill alerts (day after due) ──
  const missedBills = getMissedBills(bills);
  const missedContent = buildMissedAlertContent(missedBills);

  if (missedContent) {
    // Schedule for tomorrow morning if any missed
    const missedDate = new Date();
    missedDate.setDate(missedDate.getDate() + 1);
    missedDate.setHours(reminderHour, reminderMinute, 0, 0);

    notifications.push({
      id: ID_MISSED_ALERT,
      title: missedContent.title,
      body: missedContent.body,
      largeBody: missedContent.body,
      schedule: { at: missedDate, allowWhileIdle: true },
      sound: null,
      actionTypeId: '',
      extra: { type: 'missed_alert' },
    });
  }

  // Schedule all at once
  if (notifications.length > 0) {
    try {
      await LocalNotifications.schedule({ notifications });
      console.log(`📬 Scheduled ${notifications.length} notification(s)`);
    } catch (err) {
      console.error('Error scheduling notifications:', err);
    }
  }
};

// ── Load/save notification settings ──
export const loadNotificationSettings = async () => {
  try {
    const result = await window.storage.get('notification-settings');
    if (result?.value) return JSON.parse(result.value);
  } catch {}
  return { enabled: true, reminderHour: 9, reminderMinute: 0 };
};

export const saveNotificationSettings = async (settings) => {
  try {
    await window.storage.set('notification-settings', JSON.stringify(settings));
  } catch (err) {
    console.error('Error saving notification settings:', err);
  }
};

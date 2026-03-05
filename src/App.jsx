import { scheduleNotifications, loadNotificationSettings, saveNotificationSettings } from './utils/notifications';
import React, { useState, useEffect, useRef } from 'react';
import * as Icons from './components/Icons';
import { shouldAutoPay } from './utils/billHelpers';
import { initialBills, DEFAULT_CATEGORIES } from './data/initialData';
import useSwipe from './hooks/useSwipe';
import haptic from './utils/haptics';
import { ToastProvider, useToast } from './components/Toast';
import { initTheme, toggleTheme } from './utils/theme';
import { auth, cloudData } from './utils/supabase';
import AccountModal from './components/AccountModal';
import SettingsModal from './components/SettingsModal';
import CurrencyPrompt from './components/CurrencyPrompt';
import { CurrencyProvider } from './components/CurrencyContext';
import { getSymbol, loadCurrencyPreference, saveCurrencyPreference, CURRENCIES } from './utils/currency';

// Panel components
import OverviewPanel from './components/OverviewPanel';
import ActionsPanel from './components/ActionsPanel';
import BillsPanel from './components/BillsPanel';
import DebtPanel from './components/DebtPanel';
import SavingsPanel from './components/SavingsPanel';

// Modal components
import { AddBillModal, ManageCategoriesModal, AddDebtModal, AddSavingsModal } from './components/Modals';

const PANEL_NAMES = ['Overview', 'Actions', 'Bills', 'Debt', 'Savings'];

export default function App() {
  return (
    <ToastProvider>
      <AppContent />
    </ToastProvider>
  );
}

function AppContent() {
  const toast = useToast();
  // ── Theme ──
  const [theme, setTheme] = useState(() => initTheme());
  useEffect(() => {
    (async () => {
      try {
        const { StatusBar } = await import('@capacitor/status-bar');
        await StatusBar.setBackgroundColor({ color: theme === 'light' ? '#f1f5f9' : '#0a0e27' });
        await StatusBar.setStyle({ style: theme === 'light' ? 'DARK' : 'LIGHT' });
      } catch (e) {}
    })();
  }, []);
  const handleToggleTheme = async () => {
    const next = toggleTheme();
    setTheme(next);
    haptic.light();
    try {
      const { StatusBar } = await import('@capacitor/status-bar');
      await StatusBar.setBackgroundColor({ color: next === 'light' ? '#f1f5f9' : '#0a0e27' });
      await StatusBar.setStyle({ style: next === 'light' ? 'DARK' : 'LIGHT' });
    } catch (e) {}
  };
  // ── Bills state ──
  const [bills, setBills] = useState([]);
  const [income, setIncome] = useState(1960);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [showAddModal, setShowAddModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [validationErrors, setValidationErrors] = useState({});
  const emptyBill = { name: '', category: 'HOME', amount: '', paymentDate: '', paymentDay: '', startDate: '', startMonth: '', paid: false, recurring: false, missed: false, frequency: 'Monthly' };
  const [newBill, setNewBill] = useState({ ...emptyBill });
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [customCategories, setCustomCategories] = useState([]);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [billSearch, setBillSearch] = useState('');
  const [billSort, setBillSort] = useState('default');
  const [isMobile, setIsMobile] = useState(false);
  const headerRef = useRef(null);
  const headerCollapsedRef = useRef(false);
  const lastScrollY = useRef(0);
  const categoryScrollRef = useRef(null);

  // ── Auth & Sync state ──
  const [user, setUser] = useState(null);
  const [showAccountModal, setShowAccountModal] = useState(false);
const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [syncStatus, setSyncStatus] = useState('idle'); // idle, syncing, synced, error
  const [lastSynced, setLastSynced] = useState(null);
  const syncTimeoutRef = useRef(null);
  const userRef = useRef(null);
  const deletingAccountRef = useRef(false);
  const [notificationSettings, setNotificationSettings] = useState({ enabled: true, reminderHour: 9, reminderMinute: 0 });
  const [currencyCode, setCurrencyCode] = useState('GBP');
  const [showCurrencyPrompt, setShowCurrencyPrompt] = useState(false);

  // ── Debt state ──
  const [debts, setDebts] = useState([]);
  const [showDebtModal, setShowDebtModal] = useState(false);
  const [editingDebtId, setEditingDebtId] = useState(null);
  const [editDebtForm, setEditDebtForm] = useState({});
  const [debtPaymentAmounts, setDebtPaymentAmounts] = useState({});
  const [showDebtHistory, setShowDebtHistory] = useState({});
  const emptyDebt = { name: '', type: 'Credit Card', totalAmount: '', interestRate: '', minimumPayment: '', recurringPayment: '', paymentDate: '', paymentMode: 'recurring', dueDate: '', installmentMonths: '', installmentStartDate: '', bnplPromoMonths: '', bnplStartDate: '', bnplPostInterest: '', bnplPostPayment: '' };
  const [newDebt, setNewDebt] = useState({ ...emptyDebt });

  // ── Savings state ──
  const [savings, setSavings] = useState([]);
  const [showSavingsModal, setShowSavingsModal] = useState(false);
  const [editingSavingsId, setEditingSavingsId] = useState(null);
  const [editSavingsForm, setEditSavingsForm] = useState({});
  const [savingsTransactionAmounts, setSavingsTransactionAmounts] = useState({});
  const [showSavingsHistory, setShowSavingsHistory] = useState({});
  const emptySavings = { name: '', category: 'Emergency', targetAmount: '', monthlyContribution: '', startingAmount: '' };
  const [newSavingsGoal, setNewSavingsGoal] = useState({ ...emptySavings });

  // ── Monthly snapshots ──
  const [monthlySnapshots, setMonthlySnapshots] = useState([]);

  const generateTestSnapshot = (monthsAgo = 1) => {
    const now = new Date();
    const target = new Date(now.getFullYear(), now.getMonth() - monthsAgo, 1);
    const monthKey = target.getFullYear() + '-' + (target.getMonth() + 1);
    if (monthlySnapshots.find(s => s.month === monthKey)) {
      toast(`${monthKey} snapshot already exists`, 'warning');
      return;
    }
    const inc = parseFloat(income) || 0;
    const variance = () => 0.8 + Math.random() * 0.4; // 80-120% of current
    const snapshot = {
      month: monthKey,
      income: inc,
      expenses: bills.reduce((s, b) => s + (b.actual || 0), 0) * variance(),
      balance: 0,
      paidBills: Math.round(bills.filter(b => b.paid).length * variance()),
      missedBills: Math.round(Math.random() * 3),
      totalBills: bills.length,
      debtTotal: debts.reduce((s, d) => s + (d.totalAmount || 0), 0) * (1 + monthsAgo * 0.05),
      savingsTotal: savings.reduce((s, sv) => s + (sv.currentAmount || 0), 0) * Math.max(0.3, 1 - monthsAgo * 0.15),
      categories: {},
      createdAt: new Date().toISOString(),
    };
    snapshot.balance = inc - snapshot.expenses;
    snapshot.paidBills = Math.min(snapshot.paidBills, snapshot.totalBills);
    bills.forEach(b => { if (b.actual) snapshot.categories[b.category] = (snapshot.categories[b.category] || 0) + (b.actual * variance()); });
    // Round category values
    Object.keys(snapshot.categories).forEach(k => { snapshot.categories[k] = Math.round(snapshot.categories[k] * 100) / 100; });
    snapshot.expenses = Math.round(snapshot.expenses * 100) / 100;
    snapshot.balance = Math.round(snapshot.balance * 100) / 100;
    snapshot.debtTotal = Math.round(snapshot.debtTotal * 100) / 100;
    snapshot.savingsTotal = Math.round(snapshot.savingsTotal * 100) / 100;
    const updated = [...monthlySnapshots, snapshot].sort((a, b) => a.month.localeCompare(b.month));
    setMonthlySnapshots(updated);
    haptic.success();
    toast(`Test snapshot for ${monthKey} created`, 'success');
  };

  const clearTestSnapshots = () => {
    setMonthlySnapshots([]);
    haptic.error();
    toast('Snapshots cleared', 'error');
  };

  // ── Swipe navigation ──
  const { activePanel, swipeRef, handleTouchStart, goToPanel } = useSwipe(PANEL_NAMES.length);

  // ── Detect mobile ──
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth <= 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // ── Auth listener ──
  useEffect(() => {
    // Check for existing session
    auth.getSession().then(session => {
      setUser(session?.user || null);
      userRef.current = session?.user || null;
    });

    // Listen for auth changes
    const { data: { subscription } } = auth.onAuthChange((event, session) => {
      setUser(session?.user || null);
      if (event === 'SIGNED_IN' && !userRef.current) {
        loadFromCloud();
      }
      userRef.current = session?.user || null;
    });

    return () => subscription?.unsubscribe();
  }, []);

  // ── Cloud sync functions ──
  const getAppData = () => ({
    bills, income: parseFloat(income) || 0, debts, savings,
    customCategories, monthlySnapshots,
    lastMonth: new Date().getFullYear() + '-' + (new Date().getMonth() + 1),
  });

  const saveToCloud = async () => {
    if (!user) return;
    setSyncStatus('syncing');
    try {
      await cloudData.save(getAppData());
      const now = new Date().toISOString();
      setSyncStatus('synced');
      setLastSynced(now);
      try { await window.storage.set('last-synced', now); } catch (e) {}
    } catch (err) {
      console.error('Cloud save error:', err);
      setSyncStatus('error');
      toast('Sync failed — will retry', 'error');
    }
  };

  const loadFromCloud = async () => {
    setSyncStatus('syncing');
    try {
      const result = await cloudData.load();
      if (result?.data && Object.keys(result.data).length > 0) {
        const cloudBills = result.data.bills || [];
        const localHasData = bills.length > 0 && bills[0]?.id !== undefined;
        const cloudHasData = cloudBills.length > 0;

        if (localHasData && cloudHasData) {
          const cloudDate = new Date(result.updated_at).toLocaleString();
          const useCloud = confirm(`Found cloud data (last synced: ${cloudDate}).\n\nUse cloud data? OK = Use cloud, Cancel = Keep local & overwrite cloud`);
          if (useCloud) {
            applyCloudData(result.data);
            toast('Cloud data loaded', 'success');
          } else {
            setTimeout(() => saveToCloud(), 500);
            toast('Local data kept & synced to cloud', 'info');
          }
        } else if (cloudHasData) {
        applyCloudData(result.data);
        } else {
          setTimeout(() => saveToCloud(), 500);
        }
      } else {
        setTimeout(() => saveToCloud(), 500);
      }
      setSyncStatus('synced');
      setLastSynced(result?.updated_at || new Date().toISOString());
    } catch (err) {
      console.error('Cloud load error:', err);
      setSyncStatus('error');
      toast('Failed to load cloud data', 'error');
    }
  };

  const applyCloudData = (d) => {
    if (d.bills) setBills(d.bills);
    if (d.income !== undefined) setIncome(d.income);
    if (d.debts) setDebts(d.debts);
    if (d.savings) setSavings(d.savings);
    if (d.customCategories) setCustomCategories(d.customCategories);
    if (d.monthlySnapshots) setMonthlySnapshots(d.monthlySnapshots);
  };

  // Auto-save to cloud when data changes (debounced)
  useEffect(() => {
    if (!user || bills.length === 0 || deletingAccountRef.current) return;
    if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);
    syncTimeoutRef.current = setTimeout(() => {
      saveToCloud();
    }, 3000); // 3 second debounce
    return () => { if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current); };
  }, [bills, income, debts, savings, customCategories, user]);

  // Load last sync time on mount
  useEffect(() => {
    window.storage.get('last-synced').then(result => {
      if (result?.value) setLastSynced(result.value);
    }).catch(() => {});
  }, []);

  // ── Schedule notifications when bills change ──
  useEffect(() => {
    if (bills.length === 0) return;
    const timer = setTimeout(() => {
      scheduleNotifications(bills, notificationSettings);
    }, 5000); // 5 second debounce (after auto-save)
    return () => clearTimeout(timer);
  }, [bills, notificationSettings]);

  // Load notification settings on mount
  useEffect(() => {
    loadNotificationSettings().then(setNotificationSettings);
  }, []);

  // Load currency preference on mount
  useEffect(() => {
    loadCurrencyPreference().then(code => {
      if (code) {
        setCurrencyCode(code);
      } else {
        setShowCurrencyPrompt(true);
      }
    });
  }, []);

  // Auth handlers for modal
  const handleSignIn = async (email, password) => {
    await auth.signIn(email, password);
    setShowAccountModal(false);
    toast('Signed in!', 'success');
  };

  const handleSignUp = async (email, password) => {
    await auth.signUp(email, password);
    // Auto sign-in after signup (since confirm email is disabled)
    await auth.signIn(email, password);
    // Save current local data to cloud for new accounts
    setTimeout(() => saveToCloud(), 500);
    setShowAccountModal(false);
    toast('Account created!', 'success');
  };

  const handleSignOut = async () => {
    await auth.signOut();
    setUser(null);
    userRef.current = null;
    setSyncStatus('idle');
    setShowAccountModal(false);
    toast('Signed out', 'info');
  };

  const handleResetPassword = async (email) => {
    await auth.resetPassword(email);
  };

  const handleGoogleSignIn = async () => {
    try {
      await auth.signInWithGoogle();
      setShowAccountModal(false);
      toast('Signed in with Google!', 'success');
    } catch (err) {
      console.error('Google sign-in error:', err);
      toast(err.message || JSON.stringify(err) || 'Google sign in failed', 'error');
    }
  };

  const handleDeleteAccount = async () => {
    deletingAccountRef.current = true;
    if (syncTimeoutRef.current) {
      clearTimeout(syncTimeoutRef.current);
      syncTimeoutRef.current = null;
    }
    await cloudData.delete();
    await auth.signOut();
    setBills([]);
    setDebts([]);
    setSavings([]);
    setCustomCategories([]);
    setMonthlySnapshots([]);
    setIncome(0);
    try { await window.storage.set('bills-data', '{}'); } catch (e) {}
    setUser(null);
    userRef.current = null;
    setSyncStatus('idle');
    setShowAccountModal(false);
    toast('Account & data deleted', 'error');
    deletingAccountRef.current = false;
};

  const handleClearLocalData = async () => {
    if (!confirm('Remove all Tally data from this device?\n\nYour cloud backup is not affected — sign back in to restore.')) return;
    setBills([]);
    setDebts([]);
    setSavings([]);
    setCustomCategories([]);
    setMonthlySnapshots([]);
    setIncome(0);
    try { await window.storage.set('bills-data', '{}'); } catch (e) {}
    haptic.error();
    toast('Local data cleared', 'error');
  };

  // ── Collapsible header on scroll (DOM-direct for performance) ──
    useEffect(() => {
    if (!isMobile) return;
    let ticking = false;

    const collapseHeader = (el) => {
      headerCollapsedRef.current = true;
      el.style.maxHeight = '0px';
      el.style.opacity = '0';
      el.style.padding = '0';
    };

    const expandHeader = (el) => {
      headerCollapsedRef.current = false;
      el.style.maxHeight = '70px';
      el.style.opacity = '1';
      el.style.padding = '10px 0 4px';
    };

    window.__tallyCollapseHeader = () => { const el = headerRef.current; if (el) collapseHeader(el); };
    window.__tallyExpandHeader = () => { const el = headerRef.current; if (el) expandHeader(el); };
    window.__tallySyncScrollDirect = (pos) => { lastScrollY.current = pos; };

    const updateHeader = () => {
      const el = headerRef.current;
      if (!el || document.body.hasAttribute('data-switching')) { ticking = false; return; }
      const activeIdx = window.__tallyActivePanel?.current ?? 0;
      const activePanel = window.__tallyGetPanel?.(activeIdx);
      const currentY = activePanel ? activePanel.scrollTop : 0;
      const delta = currentY - lastScrollY.current;
      
      const dbg = document.getElementById('debug-header');
      if (dbg) dbg.textContent = `Y:${currentY} last:${Math.round(lastScrollY.current)} col:${headerCollapsedRef.current} delta:${Math.round(delta)}`;
      
      if (Math.abs(delta) < 8) { ticking = false; return; }
      
      const scrollingDown = delta > 0;
      
      if (scrollingDown && !headerCollapsedRef.current && currentY > 30) {
        collapseHeader(el);
        lastScrollY.current = currentY;
        document.body.setAttribute('data-switching', 'true');
        setTimeout(() => {
          const ap = window.__tallyGetPanel?.(window.__tallyActivePanel?.current ?? 0);
          lastScrollY.current = ap ? ap.scrollTop : 0;
          document.body.removeAttribute('data-switching');
        }, 300);
      } else if (!scrollingDown && headerCollapsedRef.current && currentY < 30) {
        expandHeader(el);
        lastScrollY.current = currentY;
        document.body.setAttribute('data-switching', 'true');
        setTimeout(() => {
          const ap = window.__tallyGetPanel?.(window.__tallyActivePanel?.current ?? 0);
          lastScrollY.current = ap ? ap.scrollTop : 0;
          document.body.removeAttribute('data-switching');
        }, 300);
      } else {
        lastScrollY.current = currentY;
      }
      ticking = false;
    };

    const handleScroll = () => {
      if (!ticking) {
        requestAnimationFrame(updateHeader);
        ticking = true;
      }
    };

    let touchStartScreenY = 0;
    let touchStartScreenX = 0;
    const onTouchStart = (e) => {
      touchStartScreenY = e.touches[0].clientY;
      touchStartScreenX = e.touches[0].clientX;
    };
    const onTouchEnd = (e) => {
      if (!headerCollapsedRef.current) return;
      const el = headerRef.current;
      if (!el) return;
      const dy = (e.changedTouches[0]?.clientY || 0) - touchStartScreenY;
      const dx = (e.changedTouches[0]?.clientX || 0) - touchStartScreenX;
      const activeIdx = window.__tallyActivePanel?.current ?? 0;
      const ap = window.__tallyGetPanel?.(activeIdx);
      const panelScrollY = ap ? ap.scrollTop : 0;
      if (dy > 30 && Math.abs(dy) > Math.abs(dx) * 2 && panelScrollY <= 5) {
        expandHeader(el);
        lastScrollY.current = 0;
      }
    };

    const panels = swipeRef.current?.children ? Array.from(swipeRef.current.children) : [];
    panels.forEach(p => p.addEventListener('scroll', handleScroll, { passive: true }));
    window.addEventListener('touchstart', onTouchStart, { passive: true });
    window.addEventListener('touchend', onTouchEnd, { passive: true });
    return () => {
      panels.forEach(p => p.removeEventListener('scroll', handleScroll));
      window.removeEventListener('touchstart', onTouchStart);
      window.removeEventListener('touchend', onTouchEnd);
      delete window.__tallyCollapseHeader;
      delete window.__tallyExpandHeader;
      delete window.__tallySyncScrollDirect;
    };
  }, [isMobile]);

  // ── Modal scroll lock + Android back gesture ──
  const anyModalOpen = showAddModal || showCategoryModal || showDebtModal || showSavingsModal || showAccountModal || showSettingsModal;

  useEffect(() => {
    if (anyModalOpen) { document.body.style.overflow = 'hidden'; document.body.style.position = 'fixed'; document.body.style.width = '100%'; }
    else { document.body.style.overflow = ''; document.body.style.position = ''; document.body.style.width = ''; }
  }, [anyModalOpen]);

  useEffect(() => {
    if (!anyModalOpen) return;
    window.history.pushState({ modal: true }, '');
    const handlePopState = () => {
      setShowAddModal(false);
      setShowCategoryModal(false);
      setShowDebtModal(false);
      setShowSavingsModal(false);
      setShowAccountModal(false);
      setShowSettingsModal(false);
      setValidationErrors({});
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [anyModalOpen]);

  // ── Load data ──
  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const stored = await window.storage.get('bills-data');
      if (stored && stored.value) {
        const data = JSON.parse(stored.value);
        let loadedBills = data.bills || initialBills;
        const savedMonth = data.lastMonth || null;
        const now = new Date();
        const currentMonth = now.getFullYear() + '-' + (now.getMonth() + 1);
        const isNewMonth = savedMonth && savedMonth !== currentMonth;

        // ── Snapshot previous month before resetting ──
        if (isNewMonth) {
          const prevIncome = parseFloat(data.income) || 0;
          const prevExpenses = (data.bills || []).reduce((s, b) => s + (b.actual || 0), 0);
          const prevPaid = (data.bills || []).filter(b => b.paid).length;
          const prevMissed = (data.bills || []).filter(b => b.missed).length;
          const prevTotalBills = (data.bills || []).length;
          const prevDebtTotal = (data.debts || []).reduce((s, d) => s + (d.totalAmount || 0), 0);
          const prevSavingsTotal = (data.savings || []).reduce((s, sv) => s + (sv.currentAmount || 0), 0);
          const prevCategories = {};
          (data.bills || []).forEach(b => { if (b.actual) prevCategories[b.category] = (prevCategories[b.category] || 0) + b.actual; });

          const snapshot = {
            month: savedMonth,
            income: prevIncome,
            expenses: prevExpenses,
            balance: prevIncome - prevExpenses,
            paidBills: prevPaid,
            missedBills: prevMissed,
            totalBills: prevTotalBills,
            debtTotal: prevDebtTotal,
            savingsTotal: prevSavingsTotal,
            categories: prevCategories,
            createdAt: new Date().toISOString(),
          };

          const existing = data.monthlySnapshots || [];
          // Don't duplicate if we already have this month
          if (!existing.find(s => s.month === savedMonth)) {
            const updatedSnapshots = [...existing, snapshot].sort((a, b) => a.month.localeCompare(b.month));
            setMonthlySnapshots(updatedSnapshots);
            // Persist immediately so it's not lost
            try { await window.storage.set('bills-data', JSON.stringify({ ...data, monthlySnapshots: updatedSnapshots })); } catch (e) { console.error('Snapshot save error:', e); }
          } else {
            setMonthlySnapshots(existing);
          }
        } else {
          setMonthlySnapshots(data.monthlySnapshots || []);
        }

        loadedBills = loadedBills.map((b) => {
          if (b.missed) return isNewMonth ? { ...b, paid: false } : b;
          if (isNewMonth) b = { ...b, paid: false };
          if (!b.recurring) return b;
          if (b.frequency === 'Weekly' || b.frequency === 'Fortnightly') {
            if (b.paid && b.lastAutoPaid) {
              const lastPaid = new Date(b.lastAutoPaid);
              const daysSince = Math.floor((now - lastPaid) / (1000 * 60 * 60 * 24));
              if (daysSince >= (b.frequency === 'Weekly' ? 6 : 13)) b = { ...b, paid: false };
            }
          }
          if (b.paid) return b;
          if (shouldAutoPay(b)) return { ...b, paid: true, lastAutoPaid: new Date().toISOString() };
          return b;
        });
        setBills(loadedBills);
        setIncome(data.income || 1960);

        let loadedDebts = data.debts || [];
        if (isNewMonth) {
          loadedDebts = loadedDebts.map((d) => {
            if (!d.recurringPayment || d.recurringPayment <= 0 || d.totalAmount <= 0) return d;
            if ((d.lastPaymentMonth || '') === currentMonth) return d;
            const payment = Math.min(d.recurringPayment, d.totalAmount);
            return { ...d, totalAmount: Math.max(0, d.totalAmount - payment), lastPaymentMonth: currentMonth, payments: [...(d.payments || []), { date: new Date().toISOString(), amount: payment, type: 'recurring' }], originalAmount: d.originalAmount || d.totalAmount + payment };
          });
        }
        loadedDebts = loadedDebts.map((d) => ({ ...d, originalAmount: d.originalAmount || d.totalAmount, payments: d.payments || [] }));
        setDebts(loadedDebts);

        let loadedSavings = data.savings || [];
        if (isNewMonth) {
          loadedSavings = loadedSavings.map((s) => {
            if (!s.monthlyContribution || s.monthlyContribution <= 0) return s;
            if ((s.lastSaveMonth || '') === currentMonth) return s;
            const newAmount = (s.currentAmount || 0) + s.monthlyContribution;
            return { ...s, currentAmount: s.targetAmount > 0 ? Math.min(newAmount, s.targetAmount) : newAmount, lastSaveMonth: currentMonth, transactions: [...(s.transactions || []), { date: new Date().toISOString(), amount: s.monthlyContribution, type: 'auto' }] };
          });
        }
        loadedSavings = loadedSavings.map((s) => ({ ...s, transactions: s.transactions || [], currentAmount: s.currentAmount || 0 }));
        setSavings(loadedSavings);
        setCustomCategories(data.customCategories || []);
      } else { setBills(initialBills); setDebts([]); }
    } catch (error) { console.log('No stored data, using initial bills'); setBills(initialBills); setDebts([]); }
  };

  // ── Save data ──
  useEffect(() => { if (bills.length > 0 || debts.length > 0 || savings.length > 0 || customCategories.length > 0) saveData(); }, [bills, income, debts, savings, customCategories]);
  const saveData = async () => { try { await window.storage.set('bills-data', JSON.stringify({ bills, income: parseFloat(income) || 0, debts, savings, customCategories, monthlySnapshots, lastMonth: new Date().getFullYear() + '-' + (new Date().getMonth() + 1) })); } catch (e) { console.error('Error saving:', e); } };

  // ── Calculations ──
  const categories = [...DEFAULT_CATEGORIES, ...customCategories];
  const incomeNum = parseFloat(income) || 0;
  const totals = {
    projectedExpenses: bills.reduce((s, b) => s + (b.projected || 0), 0),
    actualExpenses: bills.reduce((s, b) => s + (b.actual || 0), 0),
    projectedBalance: incomeNum - bills.reduce((s, b) => s + (b.projected || 0), 0),
    actualBalance: incomeNum - bills.reduce((s, b) => s + (b.actual || 0), 0),
    difference: bills.reduce((s, b) => s + (b.actual || 0), 0) - bills.reduce((s, b) => s + (b.projected || 0), 0),
    paidBills: bills.filter((b) => b.paid).length, totalBills: bills.length,
  };
  const categoryTotals = categories.map((cat) => ({ name: cat, total: bills.filter((b) => b.category === cat).reduce((s, b) => s + (b.actual || 0), 0) })).filter((c) => c.total > 0);
  const totalDebt = debts.filter(d => !d.archived).reduce((sum, d) => sum + (d.totalAmount || 0), 0);
  const totalSaved = savings.reduce((sum, s) => sum + (s.currentAmount || 0), 0);

  // ── Smart Insights ──
  const lastSnapshot = monthlySnapshots.length > 0 ? monthlySnapshots[monthlySnapshots.length - 1] : null;
  const lastCatTotals = lastSnapshot?.categories || {};
  const currentCatTotals = {};
  categoryTotals.forEach(c => { currentCatTotals[c.name] = c.total; });
  // Find biggest category change
  let biggestChange = null;
  const allCats = new Set([...Object.keys(lastCatTotals), ...Object.keys(currentCatTotals)]);
  allCats.forEach(cat => {
    const prev = lastCatTotals[cat] || 0;
    const curr = currentCatTotals[cat] || 0;
    const diff = curr - prev;
    if (!biggestChange || Math.abs(diff) > Math.abs(biggestChange.diff)) {
      biggestChange = { category: cat, diff, prev, curr };
    }
  });
  const insights = { lastSnapshot, biggestChange };

  // ── Bill handlers ──
  const handleEditStart = (bill) => { setEditingId(bill.id); setEditForm({ ...bill }); };
  const handleEditSave = () => { setBills(bills.map((b) => (b.id === editingId ? { ...editForm, projected: parseFloat(editForm.projected) || 0, actual: parseFloat(editForm.actual) || 0 } : b))); setEditingId(null); setEditForm({}); haptic.medium(); toast('Bill updated', 'success'); };
  const handleDelete = (id) => { if (confirm('Delete this bill?')) { setBills(bills.filter((b) => b.id !== id)); haptic.error(); toast('Bill deleted', 'error'); } };
  const handleBulkDeleteBills = (ids) => { setBills(bills.filter((b) => !ids.includes(b.id))); haptic.error(); toast(`${ids.length} bill${ids.length > 1 ? 's' : ''} deleted`, 'error'); };
  const handleBulkTogglePaid = (ids) => { setBills(bills.map((b) => ids.includes(b.id) ? { ...b, paid: true, missed: false, paused: false } : b)); haptic.success(); toast(`${ids.length} bill${ids.length > 1 ? 's' : ''} marked paid`, 'success'); };
  const handleBulkToggleMissed = (ids) => { setBills(bills.map((b) => ids.includes(b.id) ? { ...b, missed: true, paid: false, paused: false } : b)); haptic.warning(); toast(`${ids.length} bill${ids.length > 1 ? 's' : ''} marked missed`, 'warning'); };
  const handleBulkTogglePaused = (ids) => { setBills(bills.map((b) => ids.includes(b.id) && b.recurring ? { ...b, paused: true, paid: false, missed: false } : b)); haptic.light(); toast(`${ids.length} bill${ids.length > 1 ? 's' : ''} paused`, 'info'); };
  const handleAddBill = () => {
    const errors = {};
    if (!newBill.name.trim()) errors['bill-name'] = true;
    if (!newBill.amount && newBill.amount !== 0) errors['bill-amount'] = true;
    if (Object.keys(errors).length > 0) { setValidationErrors(errors); haptic.warning(); return; }
    setValidationErrors({});
    const id = Date.now().toString(), amount = parseFloat(newBill.amount) || 0;
    const bill = { ...newBill, id, projected: amount, actual: amount };
    if (shouldAutoPay(bill)) { bill.paid = true; bill.lastAutoPaid = new Date().toISOString(); }
    setBills([...bills, bill]); setShowAddModal(false); setValidationErrors({}); setNewBill({ ...emptyBill }); haptic.success(); toast('Bill added', 'success');
  };
  const handleTogglePaid = (id) => { setBills(bills.map((b) => (b.id !== id ? b : { ...b, paid: !b.paid, missed: false, paused: false }))); haptic.medium(); };
  const handleToggleMissed = (id) => { setBills(bills.map((b) => (b.id !== id ? b : { ...b, missed: !b.missed, paid: false, paused: false }))); haptic.warning(); };
  const handleTogglePaused = (id) => { setBills(bills.map((b) => (b.id !== id ? b : { ...b, paused: !b.paused, paid: false, missed: false }))); haptic.light(); };
  const handleAddCategory = () => { const name = newCategoryName.trim().toUpperCase(); if (!name) return; if (categories.includes(name)) { alert('Category exists!'); return; } setCustomCategories([...customCategories, name]); setNewCategoryName(''); haptic.medium(); toast(`${name} added`, 'success'); };
  const handleDeleteCategory = (cat) => { const associated = bills.filter((b) => b.category === cat); if (associated.length > 0) { const names = associated.map(b => `• ${b.name}`).join('\n'); alert(`Can't delete "${cat}"\n\nBills using this category:\n${names}`); return; } if (confirm(`Delete "${cat}"?`)) { setCustomCategories(customCategories.filter((c) => c !== cat)); if (selectedCategory === cat) { setSelectedCategory('HOME'); if (categoryScrollRef.current) categoryScrollRef.current.scrollTo({ left: 0, behavior: 'smooth' }); } haptic.error(); toast(`${cat} removed`, 'error'); } };
  const filteredBills = bills.filter((b) => { const catMatch = selectedCategory === 'ALL' || b.category === selectedCategory; if (!catMatch) return false; if (billSearch && !b.name.toLowerCase().includes(billSearch.toLowerCase())) return false; switch (statusFilter) { case 'PAID': return b.paid && !b.missed; case 'UNPAID': return !b.paid && !b.missed && !b.paused; case 'MISSED': return b.missed; case 'PAUSED': return b.paused; case 'RECURRING': return b.recurring; case 'ONE-OFF': return !b.recurring; default: return true; } }).sort((a, b) => { switch (billSort) { case 'name': return a.name.localeCompare(b.name); case 'amount-high': return (b.actual || 0) - (a.actual || 0); case 'amount-low': return (a.actual || 0) - (b.actual || 0); case 'status': return (a.paid === b.paid) ? 0 : a.paid ? 1 : -1; default: return 0; } });

  // ── Debt handlers ──
  const handleAddDebt = () => { const errors = {}; if (!newDebt.name.trim()) errors['debt-name'] = true; if (!newDebt.totalAmount) errors['debt-amount'] = true; const mode = newDebt.paymentMode || 'recurring'; if (mode === 'one-off' && !newDebt.dueDate) errors['debt-dueDate'] = true; if (mode === 'installment' && !newDebt.installmentMonths) errors['debt-installmentMonths'] = true; if (mode === 'installment' && !newDebt.installmentStartDate) errors['debt-installmentStartDate'] = true; if (mode === 'bnpl' && !newDebt.bnplPromoMonths) errors['debt-bnplPromoMonths'] = true; if (mode === 'bnpl' && !newDebt.bnplStartDate) errors['debt-bnplStartDate'] = true; if (Object.keys(errors).length > 0) { setValidationErrors(errors); haptic.warning(); return; } setValidationErrors({}); const id = Date.now().toString(), total = parseFloat(newDebt.totalAmount) || 0; const debt = { ...newDebt, id, totalAmount: total, originalAmount: total, interestRate: parseFloat(newDebt.interestRate) || 0, minimumPayment: parseFloat(newDebt.minimumPayment) || 0, recurringPayment: parseFloat(newDebt.recurringPayment) || 0, installmentMonths: parseInt(newDebt.installmentMonths) || 0, bnplPromoMonths: parseInt(newDebt.bnplPromoMonths) || 0, bnplPostInterest: parseFloat(newDebt.bnplPostInterest) || 0, bnplPostPayment: parseFloat(newDebt.bnplPostPayment) || 0, payments: [] }; if (debt.paymentMode === 'installment' && debt.installmentMonths > 0) { debt.recurringPayment = Math.ceil((total / debt.installmentMonths) * 100) / 100; } setDebts([...debts, debt]); setShowDebtModal(false); setValidationErrors({}); setNewDebt({ ...emptyDebt }); haptic.success(); toast('Debt added', 'success'); };
  const handleDeleteDebt = (id) => { if (confirm('Delete this debt?')) { setDebts(debts.filter((d) => d.id !== id)); haptic.error(); toast('Debt deleted', 'error'); } };
  const handleArchiveDebt = (id) => { setDebts(debts.map((d) => d.id !== id ? d : { ...d, archived: true, archivedAt: d.archivedAt || new Date().toISOString() })); haptic.success(); toast('Debt archived', 'success'); };
  const handleUnarchiveDebt = (id) => { setDebts(debts.map((d) => d.id !== id ? d : { ...d, archived: false })); haptic.medium(); toast('Debt restored', 'info'); };
  const handleDebtEditStart = (debt) => { setEditingDebtId(debt.id); setEditDebtForm({ ...debt }); };
  const handleDebtEditSave = () => { setDebts(debts.map((d) => d.id === editingDebtId ? { ...editDebtForm, totalAmount: parseFloat(editDebtForm.totalAmount) || 0, interestRate: parseFloat(editDebtForm.interestRate) || 0, minimumPayment: parseFloat(editDebtForm.minimumPayment) || 0, recurringPayment: parseFloat(editDebtForm.recurringPayment) || 0, installmentMonths: parseInt(editDebtForm.installmentMonths) || 0, bnplPromoMonths: parseInt(editDebtForm.bnplPromoMonths) || 0, bnplPostInterest: parseFloat(editDebtForm.bnplPostInterest) || 0, bnplPostPayment: parseFloat(editDebtForm.bnplPostPayment) || 0, paymentDate: editDebtForm.paymentDate ? String(Math.min(31, Math.max(1, parseInt(editDebtForm.paymentDate) || 0))) : '' } : d)); setEditingDebtId(null); setEditDebtForm({}); haptic.medium(); toast('Debt updated', 'success'); };
  const handleMakePayment = (debtId) => { const amount = parseFloat(debtPaymentAmounts[debtId]); if (!amount || amount <= 0) return; const debt = debts.find(d => d.id === debtId); const newTotal = Math.max(0, (debt?.totalAmount || 0) - amount); setDebts(debts.map((d) => d.id !== debtId ? d : { ...d, totalAmount: newTotal, payments: [...(d.payments || []), { date: new Date().toISOString(), amount, type: 'manual' }] })); setDebtPaymentAmounts({ ...debtPaymentAmounts, [debtId]: '' }); haptic.success(); if (newTotal === 0) { toast('🎉 Debt paid off!', 'success'); setTimeout(() => { setDebts(prev => prev.map(d => d.id !== debtId ? d : { ...d, archived: true, archivedAt: new Date().toISOString() })); }, 1500); } else { toast(`${getSymbol(currencyCode)}${amount.toFixed(2)} payment made`, 'success'); } };
  const calculatePayoff = (debt, monthlyPayment) => { if (!monthlyPayment || monthlyPayment <= 0 || debt.totalAmount <= 0) return null; const r = (debt.interestRate || 0) / 100 / 12; let bal = debt.totalAmount, m = 0, ti = 0; while (bal > 0 && m < 600) { const i = bal * r; ti += i; bal = bal + i - monthlyPayment; m++; if (monthlyPayment <= i) return { months: Infinity, totalInterest: Infinity }; } return { months: m, totalInterest: ti, totalPaid: debt.totalAmount + ti }; };

  // ── Savings handlers ──
  const handleAddSavings = () => { const errors = {}; if (!newSavingsGoal.name.trim()) errors['savings-name'] = true; if (Object.keys(errors).length > 0) { setValidationErrors(errors); haptic.warning(); return; } setValidationErrors({}); const id = Date.now().toString(); const startingAmount = parseFloat(newSavingsGoal.startingAmount) || 0; const transactions = startingAmount > 0 ? [{ type: 'deposit', amount: startingAmount, date: new Date().toISOString(), note: 'Starting balance' }] : []; setSavings([...savings, { ...newSavingsGoal, id, currentAmount: startingAmount, targetAmount: parseFloat(newSavingsGoal.targetAmount) || 0, monthlyContribution: parseFloat(newSavingsGoal.monthlyContribution) || 0, transactions }]); setShowSavingsModal(false); setValidationErrors({}); setNewSavingsGoal({ ...emptySavings }); haptic.success(); toast('Savings goal created', 'success'); };
  const handleDeleteSavings = (id) => { if (confirm('Delete this goal?')) { setSavings(savings.filter((s) => s.id !== id)); haptic.error(); toast('Goal deleted', 'error'); } };
  const handleArchiveSavings = (id) => { setSavings(savings.map((s) => s.id !== id ? s : { ...s, archived: true, archivedAt: s.archivedAt || new Date().toISOString() })); haptic.success(); toast('Goal archived', 'success'); };
  const handleUnarchiveSavings = (id) => { setSavings(savings.map((s) => s.id !== id ? s : { ...s, archived: false })); haptic.medium(); toast('Goal restored', 'info'); };
  const handleSavingsEditStart = (goal) => { setEditingSavingsId(goal.id); setEditSavingsForm({ ...goal }); };
  const handleSavingsEditSave = () => { setSavings(savings.map((s) => s.id === editingSavingsId ? { ...editSavingsForm, targetAmount: parseFloat(editSavingsForm.targetAmount) || 0, monthlyContribution: parseFloat(editSavingsForm.monthlyContribution) || 0, currentAmount: parseFloat(editSavingsForm.currentAmount) || 0 } : s)); setEditingSavingsId(null); setEditSavingsForm({}); haptic.medium(); toast('Goal updated', 'success'); };
  const handleSavingsDeposit = (goalId) => { const a = parseFloat(savingsTransactionAmounts[goalId]); if (!a || a === 0) return; doSavingsTransaction(goalId, Math.abs(a), 'deposit'); };
  const handleSavingsWithdraw = (goalId) => { const a = parseFloat(savingsTransactionAmounts[goalId]); if (!a || a === 0) return; doSavingsTransaction(goalId, -Math.abs(a), 'withdrawal'); };
  const doSavingsTransaction = (goalId, amount, type) => { const goal = savings.find(s => s.id === goalId); const newAmount = Math.max(0, (goal?.currentAmount || 0) + amount); const hitTarget = goal?.targetAmount > 0 && newAmount >= goal.targetAmount && (goal.currentAmount || 0) < goal.targetAmount; setSavings(savings.map((s) => s.id !== goalId ? s : { ...s, currentAmount: newAmount, transactions: [...(s.transactions || []), { date: new Date().toISOString(), amount, type }] })); setSavingsTransactionAmounts({ ...savingsTransactionAmounts, [goalId]: '' }); if (hitTarget) { haptic.success(); toast('🎉 Goal reached!', 'success'); setTimeout(() => { setSavings(prev => prev.map(s => s.id !== goalId ? s : { ...s, archived: true, archivedAt: new Date().toISOString() })); }, 1500); } else { haptic.medium(); toast(type === 'deposit' ? `${getSymbol(currencyCode)}${Math.abs(amount).toFixed(2)} deposited` : `${getSymbol(currencyCode)}${Math.abs(amount).toFixed(2)} withdrawn`, type === 'deposit' ? 'success' : 'warning'); } };
  const calculateSavingsEstimate = (goal) => { if (!goal.monthlyContribution || goal.monthlyContribution <= 0 || !goal.targetAmount || goal.targetAmount <= 0) return null; const rem = goal.targetAmount - (goal.currentAmount || 0); return rem <= 0 ? { months: 0 } : { months: Math.ceil(rem / goal.monthlyContribution) }; };

  // ════════════════════════════════════
  // RENDER
  // ════════════════════════════════════
  return (
    <CurrencyProvider currencySymbol={getSymbol(currencyCode)}>
    {showCurrencyPrompt && (
      <CurrencyPrompt onSelect={(code) => { setCurrencyCode(code); saveCurrencyPreference(code); setShowCurrencyPrompt(false); }} />
    )}
    <div style={{ padding: isMobile ? '12px' : '20px', maxWidth: '1400px', margin: '0 auto', display: isMobile ? 'flex' : undefined, flexDirection: isMobile ? 'column' : undefined, height: isMobile ? '100vh' : undefined, overflow: isMobile ? 'hidden' : undefined }}>
      {/* Sticky Collapsible Header */}
      {isMobile && (
        <div style={{ position: 'sticky', top: 0, zIndex: 100, background: 'var(--bg-primary)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', marginLeft: '-12px', marginRight: '-12px', marginTop: '-12px', paddingTop: '12px', paddingLeft: '12px', paddingRight: '12px' }}>
          <div ref={headerRef} data-header-logo style={{
            overflow: 'hidden',
            transition: 'max-height 0.25s ease, opacity 0.2s ease, padding 0.25s ease',
            maxHeight: '70px',
            opacity: 1,
            padding: '10px 0 4px',
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '2px',
          }}>
            <Icons.TallyWordmark width={120} />
            <p style={{ color: 'var(--text-secondary)', fontSize: '11px', margin: 0 }}>Finance tracking made easy</p>
          </div>
          <div className="nav-dots" style={{ position: 'relative' }}>
            {/* Profile icon - left side */}
            <button onClick={() => { setShowAccountModal(true); haptic.light(); }} style={{
              position: 'absolute', left: '0', top: '50%', transform: 'translateY(-50%)',
              width: '28px', height: '28px', borderRadius: '50%', border: 'none', cursor: 'pointer',
              background: user ? 'linear-gradient(135deg, #06b6d4, #8b5cf6)' : 'rgba(255,255,255,0.1)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '12px', fontWeight: '700', color: user ? '#fff' : 'var(--text-muted)',
              padding: 0,
            }}>
              {user ? user.email[0].toUpperCase() : '👤'}
            </button>
            {/* Sync indicator dot */}
            {user && (
              <div style={{
                position: 'absolute', left: '22px', top: '50%', transform: 'translateY(-50%)',
                width: '8px', height: '8px', borderRadius: '50%',
                background: syncStatus === 'synced' ? '#10b981' : syncStatus === 'syncing' ? '#f59e0b' : syncStatus === 'error' ? '#ef4444' : 'var(--text-muted)',
                border: '1.5px solid var(--bg-primary)',
              }} />
            )}
            {PANEL_NAMES.map((name, i) => (
              <div key={name} className={`nav-dot-item ${activePanel === i ? 'active' : ''}`} onClick={() => { goToPanel(i); haptic.light(); }}>
                <div className="nav-dot" />
                <span className="nav-dot-label">{name}</span>
              </div>
            ))}
            {/* Settings cog - right side */}
            <button onClick={() => { setShowSettingsModal(true); haptic.light(); }} style={{
              position: 'absolute', right: '0', top: '50%', transform: 'translateY(-50%)',
              width: '28px', height: '28px', borderRadius: '50%', border: 'none', cursor: 'pointer',
              background: 'var(--glass)', display: 'flex', alignItems: 'center', justifyContent: 'center',
              padding: 0, color: 'var(--text-muted)',
            }}>
              <Icons.Settings size={16} />
            </button>
          </div>
        </div>
      )}
      {!isMobile && (
        <div style={{ marginBottom: '40px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }} className="animate-in">
          <Icons.TallyWordmark width={190} />
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px', textAlign: 'center' }}>Finance tracking made easy</p>
        </div>
      )}

      {/* Swipe Container */}
      {isMobile ? (
        <div className="swipe-container" onTouchStart={handleTouchStart}>
          <div className="swipe-track" ref={swipeRef} style={{ transform: `translateX(${-activePanel * 100}%)` }}>
            <div className={`swipe-panel ${activePanel === 0 ? 'panel-active' : ''}`}>
              <OverviewPanel totals={totals} incomeNum={incomeNum} categoryTotals={categoryTotals} isMobile={isMobile} monthlySnapshots={monthlySnapshots} totalDebt={totalDebt} totalSaved={totalSaved} insights={insights} bills={bills} debts={debts} savings={savings} />
            </div>
            <div className={`swipe-panel ${activePanel === 1 ? 'panel-active' : ''}`}>
              <ActionsPanel income={income} setIncome={setIncome} categoryTotals={categoryTotals} setShowAddModal={setShowAddModal} setShowDebtModal={setShowDebtModal} setShowSavingsModal={setShowSavingsModal} setShowCategoryModal={setShowCategoryModal} />
            </div>
            <div className={`swipe-panel ${activePanel === 2 ? 'panel-active' : ''}`}>
              <BillsPanel categories={['ALL', ...categories]} selectedCategory={selectedCategory} setSelectedCategory={setSelectedCategory} statusFilter={statusFilter} setStatusFilter={setStatusFilter} filteredBills={filteredBills} editingId={editingId} editForm={editForm} setEditForm={setEditForm} handleEditStart={handleEditStart} handleEditSave={handleEditSave} handleDelete={handleDelete} handleTogglePaid={handleTogglePaid} handleToggleMissed={handleToggleMissed} handleTogglePaused={handleTogglePaused} setEditingId={setEditingId} categoryScrollRef={categoryScrollRef} billSearch={billSearch} setBillSearch={setBillSearch} billSort={billSort} setBillSort={setBillSort} onBulkDelete={handleBulkDeleteBills} onBulkTogglePaid={handleBulkTogglePaid} onBulkToggleMissed={handleBulkToggleMissed} onBulkTogglePaused={handleBulkTogglePaused} activePanel={activePanel} />
            </div>
            <div className={`swipe-panel ${activePanel === 3 ? 'panel-active' : ''}`}>
              <DebtPanel debts={debts} totalDebt={totalDebt} calculatePayoff={calculatePayoff} editingDebtId={editingDebtId} editDebtForm={editDebtForm} setEditDebtForm={setEditDebtForm} handleDebtEditStart={handleDebtEditStart} handleDebtEditSave={handleDebtEditSave} handleDeleteDebt={handleDeleteDebt} handleMakePayment={handleMakePayment} debtPaymentAmounts={debtPaymentAmounts} setDebtPaymentAmounts={setDebtPaymentAmounts} showDebtHistory={showDebtHistory} setShowDebtHistory={setShowDebtHistory} setEditingDebtId={setEditingDebtId} setShowDebtModal={setShowDebtModal} handleArchiveDebt={handleArchiveDebt} handleUnarchiveDebt={handleUnarchiveDebt} />
            </div>
            <div className={`swipe-panel ${activePanel === 4 ? 'panel-active' : ''}`}>
              <SavingsPanel savings={savings} totalSaved={totalSaved} editingSavingsId={editingSavingsId} editSavingsForm={editSavingsForm} setEditSavingsForm={setEditSavingsForm} handleSavingsEditStart={handleSavingsEditStart} handleSavingsEditSave={handleSavingsEditSave} handleDeleteSavings={handleDeleteSavings} handleSavingsDeposit={handleSavingsDeposit} handleSavingsWithdraw={handleSavingsWithdraw} savingsTransactionAmounts={savingsTransactionAmounts} setSavingsTransactionAmounts={setSavingsTransactionAmounts} showSavingsHistory={showSavingsHistory} setShowSavingsHistory={setShowSavingsHistory} calculateSavingsEstimate={calculateSavingsEstimate} setEditingSavingsId={setEditingSavingsId} setShowSavingsModal={setShowSavingsModal} handleArchiveSavings={handleArchiveSavings} handleUnarchiveSavings={handleUnarchiveSavings} />
            </div>
          </div>
        </div>
      ) : null}

      {/* Modals */}
      <AddBillModal show={showAddModal} onClose={() => setShowAddModal(false)} newBill={newBill} setNewBill={setNewBill} handleAddBill={handleAddBill} categories={categories} validationErrors={validationErrors} setValidationErrors={setValidationErrors} emptyBill={emptyBill} />
      <ManageCategoriesModal show={showCategoryModal} onClose={() => setShowCategoryModal(false)} bills={bills} customCategories={customCategories} newCategoryName={newCategoryName} setNewCategoryName={setNewCategoryName} handleAddCategory={handleAddCategory} handleDeleteCategory={handleDeleteCategory} />
      <AddDebtModal show={showDebtModal} onClose={() => setShowDebtModal(false)} newDebt={newDebt} setNewDebt={setNewDebt} handleAddDebt={handleAddDebt} emptyDebt={emptyDebt} validationErrors={validationErrors} setValidationErrors={setValidationErrors} />
      <AddSavingsModal show={showSavingsModal} onClose={() => setShowSavingsModal(false)} newSavingsGoal={newSavingsGoal} setNewSavingsGoal={setNewSavingsGoal} handleAddSavings={handleAddSavings} emptySavings={emptySavings} validationErrors={validationErrors} setValidationErrors={setValidationErrors} />
        <AccountModal show={showAccountModal} onClose={() => setShowAccountModal(false)} user={user} onSignIn={handleSignIn} onSignUp={handleSignUp} onSignOut={handleSignOut} onResetPassword={handleResetPassword} onGoogleSignIn={handleGoogleSignIn} syncStatus={syncStatus} onSyncNow={saveToCloud} onDeleteAccount={handleDeleteAccount} onClearLocalData={handleClearLocalData} lastSynced={lastSynced} />
        <SettingsModal show={showSettingsModal} onClose={() => setShowSettingsModal(false)} theme={theme} onToggleTheme={handleToggleTheme} notificationSettings={notificationSettings} onNotificationSettingsChange={setNotificationSettings} currencyCode={currencyCode} onCurrencyChange={(code) => { setCurrencyCode(code); saveCurrencyPreference(code); }} />

    </div>
    </CurrencyProvider>
  );
}

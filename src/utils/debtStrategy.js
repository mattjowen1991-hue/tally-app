// ── Debt Payoff Strategy Engine ──
// Calculates Snowball (smallest balance first) and Avalanche (highest interest first)
// strategies with payment cascade — when a debt is paid off, its payment flows to the next.

// Calculate dynamic minimum payment (UK credit card style)
// Formula: max(floor, balance × pct% + monthly interest)
export function calcDynamicMinimum(balance, annualRate, pct, floor) {
  if (balance <= 0) return 0;
  const monthlyInterest = balance * ((annualRate || 0) / 100 / 12);
  const pctAmount = balance * ((pct || 0) / 100);
  return Math.round(Math.max(floor || 0, pctAmount + monthlyInterest) * 100) / 100;
}

// Get the minimum payment for a debt at a given balance (supports dynamic mode)
export function getMinPaymentForBalance(debt, balance) {
  if ((debt.minPaymentMode || 'fixed') === 'percentage' && debt.minPaymentPct > 0) {
    return calcDynamicMinimum(balance, debt.interestRate, debt.minPaymentPct, debt.minPaymentFloor);
  }
  return debt.minimumPayment || 0;
}

// Get the effective monthly payment for a debt based on its mode
export function getEffectivePayment(debt) {
  const mode = debt.paymentMode || 'recurring';
  if (mode === 'one-off') return 0;
  if (mode === 'installment') {
    const months = debt.installmentMonths || 1;
    const original = debt.originalAmount || debt.totalAmount;
    return months > 0 ? Math.round((original / months) * 100) / 100 : 0;
  }
  if (mode === 'bnpl') {
    // During promo: divide balance by remaining months
    const promoMonths = debt.bnplPromoMonths || 0;
    const startDate = debt.bnplStartDate ? new Date(debt.bnplStartDate) : null;
    if (promoMonths > 0 && startDate) {
      const now = new Date();
      const elapsed = Math.max(0, (now.getFullYear() - startDate.getFullYear()) * 12 + (now.getMonth() - startDate.getMonth()));
      const remaining = Math.max(1, promoMonths - elapsed);
      return Math.round((debt.totalAmount / remaining) * 100) / 100;
    }
    return debt.bnplPostPayment || 0;
  }
  // Recurring: use the larger of dynamic/fixed minimum or recurringPayment
  const minPay = getMinPaymentForBalance(debt, debt.totalAmount);
  return Math.max(minPay, debt.recurringPayment || 0);
}

// Get effective monthly interest rate
export function getEffectiveRate(debt) {
  const mode = debt.paymentMode || 'recurring';
  if (mode === 'one-off' || mode === 'installment') return 0;
  if (mode === 'bnpl') {
    // Check if promo has expired
    const promoMonths = debt.bnplPromoMonths || 0;
    const startDate = debt.bnplStartDate ? new Date(debt.bnplStartDate) : null;
    if (promoMonths > 0 && startDate) {
      const now = new Date();
      const elapsed = (now.getFullYear() - startDate.getFullYear()) * 12 + (now.getMonth() - startDate.getMonth());
      if (elapsed < promoMonths) return 0; // Still in promo
    }
    return (debt.bnplPostInterest || 0) / 100 / 12;
  }
  return (debt.interestRate || 0) / 100 / 12;
}

// Whether a debt has a fixed schedule that shouldn't receive extra cascade payments
export function isFixedSchedule(debt) {
  const mode = debt.paymentMode || 'recurring';
  if (mode === 'one-off') return true;
  if (mode === 'installment') return true;
  if (mode === 'bnpl') {
    // Fixed during promo period
    const promoMonths = debt.bnplPromoMonths || 0;
    const startDate = debt.bnplStartDate ? new Date(debt.bnplStartDate) : null;
    if (promoMonths > 0 && startDate) {
      const now = new Date();
      const elapsed = (now.getFullYear() - startDate.getFullYear()) * 12 + (now.getMonth() - startDate.getMonth());
      if (elapsed < promoMonths) return true;
    }
  }
  return false;
}

// Sort debts by strategy (only non-fixed debts are reordered)
function sortByStrategy(debts, strategy) {
  return [...debts].sort((a, b) => {
    const aFixed = isFixedSchedule(a);
    const bFixed = isFixedSchedule(b);
    // Fixed-schedule debts go to the end
    if (aFixed && !bFixed) return 1;
    if (!aFixed && bFixed) return -1;
    if (aFixed && bFixed) return 0;
    // Strategy ordering for non-fixed debts
    if (strategy === 'snowball') return a.totalAmount - b.totalAmount; // smallest first
    if (strategy === 'avalanche') return getEffectiveRate(b) - getEffectiveRate(a); // highest rate first
    return 0;
  });
}

// Core strategy simulation — month-by-month with cascade
export function calculateStrategy(allDebts, strategy, extraMonthly = 0) {
  const debts = allDebts
    .filter(d => !d.archived && d.totalAmount > 0 && d.paymentMode !== 'one-off')
    .map(d => ({
      id: d.id,
      balance: d.totalAmount,
      rate: getEffectiveRate(d),
      minPayment: getEffectivePayment(d),
      fixed: isFixedSchedule(d),
      original: d,
    }));

  if (debts.length === 0) return null;

  // Sort by strategy
  const sorted = strategy === 'snowball'
    ? [...debts].sort((a, b) => {
        if (a.fixed && !b.fixed) return 1;
        if (!a.fixed && b.fixed) return -1;
        return a.balance - b.balance;
      })
    : [...debts].sort((a, b) => {
        if (a.fixed && !b.fixed) return 1;
        if (!a.fixed && b.fixed) return -1;
        return b.rate - a.rate;
      });

  const results = {};
  sorted.forEach((d, i) => { results[d.id] = { monthsToPayoff: 0, totalInterest: 0, payoffOrder: 0 }; });

  let totalInterest = 0;
  let month = 0;
  let payoffCount = 0;
  let firstWinMonth = null;
  let firstWinDebtId = null;
  const timeline = [];

  while (month < 600) {
    // Check if all debts are paid
    const allPaid = sorted.every(d => d.balance <= 0);
    if (allPaid) break;

    month++;
    let availablePool = extraMonthly;
    let freedThisMonth = 0;

    // Step 1: Accrue interest on all debts
    for (const d of sorted) {
      if (d.balance <= 0) continue;
      const interest = d.balance * d.rate;
      d.balance += interest;
      totalInterest += interest;
      results[d.id].totalInterest += interest;
    }

    // Step 2: Apply minimum payments (recalculate dynamic minimums each month)
    for (const d of sorted) {
      if (d.balance <= 0) continue;
      // Recalculate dynamic minimum based on current balance
      if (!d.fixed && d.original.minPaymentMode === 'percentage' && d.original.minPaymentPct > 0) {
        d.minPayment = Math.max(
          calcDynamicMinimum(d.balance, (d.original.interestRate || 0), d.original.minPaymentPct, d.original.minPaymentFloor),
          d.original.recurringPayment || 0
        );
      }
      const payment = Math.min(d.minPayment, d.balance);
      d.balance -= payment;
      if (d.balance <= 0.005) { // Rounding tolerance
        d.balance = 0;
        freedThisMonth += d.minPayment - payment; // Leftover from final payment
        availablePool += d.minPayment; // This debt's payment is now free for cascade
        payoffCount++;
        results[d.id].monthsToPayoff = month;
        results[d.id].payoffOrder = payoffCount;
        if (!firstWinMonth) { firstWinMonth = month; firstWinDebtId = d.id; }
      }
    }

    // Step 3: Apply surplus (extra + freed payments) to the first non-fixed unpaid debt
    let surplus = availablePool + freedThisMonth;
    for (const d of sorted) {
      if (d.balance <= 0 || d.fixed) continue;
      if (surplus <= 0) break;
      const payment = Math.min(surplus, d.balance);
      d.balance -= payment;
      surplus -= payment;
      if (d.balance <= 0.005) {
        d.balance = 0;
        availablePool += d.minPayment; // Free up this debt's payment too
        payoffCount++;
        results[d.id].monthsToPayoff = month;
        results[d.id].payoffOrder = payoffCount;
        if (!firstWinMonth) { firstWinMonth = month; firstWinDebtId = d.id; }
      }
    }

    const remaining = sorted.reduce((s, d) => s + Math.max(0, d.balance), 0);
    const perDebtBal = {};
    for (const d of sorted) perDebtBal[d.id] = Math.round(Math.max(0, d.balance) * 100) / 100;
    timeline.push({ month, totalRemaining: Math.round(remaining * 100) / 100, perDebt: perDebtBal });
  }

  // Handle debts that didn't get paid off in 600 months
  for (const d of sorted) {
    if (d.balance > 0) {
      results[d.id].monthsToPayoff = Infinity;
      results[d.id].payoffOrder = 999;
    }
  }

  // Calculate payoff dates
  const now = new Date();
  for (const d of sorted) {
    const months = results[d.id].monthsToPayoff;
    if (months !== Infinity && months > 0) {
      const date = new Date(now);
      date.setMonth(date.getMonth() + months);
      results[d.id].payoffDate = date;
    }
    results[d.id].totalInterest = Math.round(results[d.id].totalInterest * 100) / 100;
  }

  const debtFreeDate = new Date(now);
  debtFreeDate.setMonth(debtFreeDate.getMonth() + month);

  return {
    strategy,
    totalMonths: month,
    totalInterest: Math.round(totalInterest * 100) / 100,
    debtFreeDate: month < 600 ? debtFreeDate : null,
    perDebt: results,
    firstWinMonth,
    firstWinDebtId,
    timeline,
  };
}

// Compare Snowball vs Avalanche
export function compareStrategies(allDebts, extraMonthly = 0) {
  const snowball = calculateStrategy(allDebts, 'snowball', extraMonthly);
  const avalanche = calculateStrategy(allDebts, 'avalanche', extraMonthly);

  if (!snowball || !avalanche) return null;

  const interestDiff = snowball.totalInterest - avalanche.totalInterest;
  const monthsDiff = snowball.totalMonths - avalanche.totalMonths;

  return {
    snowball,
    avalanche,
    interestSaved: Math.abs(interestDiff),
    savedByStrategy: interestDiff > 0 ? 'avalanche' : interestDiff < 0 ? 'snowball' : 'same',
    monthsDifference: Math.abs(monthsDiff),
    fasterStrategy: monthsDiff > 0 ? 'avalanche' : monthsDiff < 0 ? 'snowball' : 'same',
    firstWinStrategy: (snowball.firstWinMonth || 999) <= (avalanche.firstWinMonth || 999) ? 'snowball' : 'avalanche',
  };
}

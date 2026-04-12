/**
 * Determines if a non-autoPay bill is overdue and should be flagged as missed.
 * Grace period: 2 days past the due date.
 */
export function shouldAutoMiss(bill) {
  if (!bill.recurring || bill.autoPay || bill.paid || bill.missed || bill.paused) return false;

  const now = new Date();
  const todayDate = now.getDate();
  const todayDay = now.getDay();
  const grace = 2;
  const freq = bill.frequency || 'Monthly';

  switch (freq) {
    case 'Weekly': {
      const payDay = parseInt(bill.paymentDay);
      if (isNaN(payDay)) return false;
      const daysSince = (todayDay - payDay + 7) % 7;
      return daysSince >= grace;
    }
    case 'Fortnightly': {
      if (!bill.startDate) return false;
      const payDay = parseInt(bill.paymentDay);
      if (isNaN(payDay)) return false;
      const start = new Date(bill.startDate);
      const diffDays = Math.floor((now - start) / (1000 * 60 * 60 * 24));
      const diffWeeks = Math.floor(diffDays / 7);
      const isPaymentWeek = diffWeeks % 2 === 0;
      if (!isPaymentWeek) return false;
      const daysSince = (todayDay - payDay + 7) % 7;
      return daysSince >= grace;
    }
    case 'Monthly':
      return todayDate >= parseInt(bill.paymentDate) + grace;
    case 'Quarterly': {
      const startMonth = parseInt(bill.startMonth) || 1;
      const currentMonth = now.getMonth() + 1;
      const payMonths = [startMonth, startMonth + 3, startMonth + 6, startMonth + 9].map(m => ((m - 1) % 12) + 1);
      return payMonths.includes(currentMonth) && todayDate >= parseInt(bill.paymentDate) + grace;
    }
    default:
      return false;
  }
}

/**
 * Determines if a recurring bill should be automatically marked as paid
 * based on its frequency and the current date. Only applies to autoPay bills.
 */
export function shouldAutoPay(bill) {
  if (!bill.recurring || !bill.autoPay || bill.missed || bill.paused) return false;

  const now = new Date();
  const todayDate = now.getDate();
  const todayDay = now.getDay();
  const currentMonth = now.getMonth() + 1;

  const freq = bill.frequency || 'Monthly';

  switch (freq) {
    case 'Weekly': {
      const payDay = parseInt(bill.paymentDay);
      if (isNaN(payDay)) return false;
      // Has the payment day already passed this week?
      // Calculate days since payment day (wrapping around week)
      const daysSince = (todayDay - payDay + 7) % 7;
      return daysSince >= 0 && daysSince < 7;
    }

    case 'Fortnightly': {
      if (!bill.startDate) return false;
      const payDay = parseInt(bill.paymentDay);
      if (isNaN(payDay)) return false;
      const start = new Date(bill.startDate);
      const diffDays = Math.floor((now - start) / (1000 * 60 * 60 * 24));
      const diffWeeks = Math.floor(diffDays / 7);
      const isPaymentWeek = diffWeeks % 2 === 0;
      if (!isPaymentWeek) return false;
      const daysSince = (todayDay - payDay + 7) % 7;
      return daysSince >= 0 && daysSince < 7;
    }

    case 'Monthly':
      return todayDate >= parseInt(bill.paymentDate);

    case 'Quarterly': {
      const startMonth = parseInt(bill.startMonth) || 1;
      const payMonths = [startMonth, startMonth + 3, startMonth + 6, startMonth + 9].map(
        (m) => ((m - 1) % 12) + 1
      );
      return payMonths.includes(currentMonth) && todayDate >= parseInt(bill.paymentDate);
    }

    case 'Yearly': {
      const yearlyDate = new Date(bill.paymentDate);
      if (isNaN(yearlyDate.getTime())) return false;
      const payMonth = yearlyDate.getMonth() + 1;
      const payDay = yearlyDate.getDate();
      // Has the annual date already passed this year?
      if (currentMonth > payMonth) return true;
      if (currentMonth === payMonth && todayDate >= payDay) return true;
      return false;
    }

    default:
      return false;
  }
}
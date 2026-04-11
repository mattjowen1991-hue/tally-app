/**
 * Default bills data from Matt's original spreadsheet.
 * Used on first load when no stored data exists.
 */
export const initialBills = [
  // HOME
  { id: '1', name: 'Eon', category: 'HOME', projected: 124, actual: 124, paymentDate: '1st', paid: true },
  { id: '2', name: 'Domestic & General', category: 'HOME', projected: 10.50, actual: 10.50, paymentDate: '1st', paid: true },
  { id: '3', name: 'Vodafone Airtime', category: 'HOME', projected: 23.40, actual: 23.40, paymentDate: '1st', paid: true },
  { id: '4', name: 'Vodafone Broadband', category: 'HOME', projected: 22.50, actual: 22.50, paymentDate: '1st', paid: true },
  { id: '5', name: 'TV License', category: 'HOME', projected: 7.50, actual: 7.50, paymentDate: '1st', paid: true },
  { id: '6', name: 'Rent', category: 'HOME', projected: 244.84, actual: 244.84, paymentDate: '1st', paid: true },
  { id: '7', name: 'OneCall', category: 'HOME', projected: 8.50, actual: 8.50, paymentDate: '1st', paid: true },
  { id: '8', name: 'Shopping', category: 'HOME', projected: 200, actual: 200, paymentDate: '1st', paid: true },
  { id: '9', name: 'Council Tax', category: 'HOME', projected: 0, actual: 0, paymentDate: 'TBC', paid: false },
  { id: '10', name: 'SevernTrent', category: 'HOME', projected: 57, actual: 57, paymentDate: '12th', paid: true },
  { id: '11', name: 'Ring', category: 'HOME', projected: 4, actual: 4, paymentDate: '1st', paid: true },
  { id: '12', name: 'Virgin Pure', category: 'HOME', projected: 7.50, actual: 7.50, paymentDate: '4th', paid: true },
  { id: '13', name: 'Tesco Mobile', category: 'HOME', projected: 8, actual: 8, paymentDate: '1st', paid: true },
  { id: '14', name: 'Vodafone Device', category: 'HOME', projected: 23, actual: 23, paymentDate: '1st', paid: true },
  { id: '15', name: 'Lisa', category: 'HOME', projected: 10, actual: 10, paymentDate: '1st', paid: true },

  // TRANSPORTATION
  { id: '16', name: 'Fuel', category: 'TRANSPORTATION', projected: 60, actual: 60, paymentDate: '1st', paid: true },

  // CREDIT CARDS
  { id: '17', name: 'Loan', category: 'CREDIT CARDS', projected: 250, actual: 250, paymentDate: '1st', paid: true },
  { id: '18', name: 'PayPal', category: 'CREDIT CARDS', projected: 0, actual: 0, paymentDate: '1st', paid: false },
  { id: '19', name: 'Barclays', category: 'CREDIT CARDS', projected: 0, actual: 0, paymentDate: 'N/A', paid: false },

  // ENTERTAINMENT
  { id: '20', name: 'Netflix', category: 'ENTERTAINMENT', projected: 6.50, actual: 6.50, paymentDate: '1st', paid: true },
  { id: '21', name: 'Lottery', category: 'ENTERTAINMENT', projected: 12, actual: 12, paymentDate: '1st', paid: true },
  { id: '22', name: 'Disney Plus', category: 'ENTERTAINMENT', projected: 0, actual: 0, paymentDate: '3rd', paid: false },
  { id: '23', name: 'Roblox Premium', category: 'ENTERTAINMENT', projected: 2.50, actual: 2.50, paymentDate: '5th', paid: true },
  { id: '24', name: 'Google Play Stuff', category: 'ENTERTAINMENT', projected: 29, actual: 29, paymentDate: 'Via phone', paid: true },
  { id: '25', name: 'TunnelBear', category: 'ENTERTAINMENT', projected: 0, actual: 0, paymentDate: 'N/A', paid: false },
  { id: '26', name: 'PlayStation Plus', category: 'ENTERTAINMENT', projected: 6.99, actual: 6.99, paymentDate: '1st', paid: true },
  { id: '27', name: 'Amazon Prime', category: 'ENTERTAINMENT', projected: 0, actual: 0, paymentDate: '1st', paid: false },
  { id: '28', name: 'National Trust', category: 'ENTERTAINMENT', projected: 14, actual: 14, paymentDate: '1st', paid: true },
  { id: '29', name: 'Takeaway', category: 'ENTERTAINMENT', projected: 0, actual: 0, paymentDate: '1st', paid: false },

  // HEALTH
  { id: '30', name: 'L&G Life Insurance', category: 'HEALTH', projected: 9.90, actual: 9.90, paymentDate: '1st', paid: true },
  { id: '31', name: 'Pet Insurance', category: 'HEALTH', projected: 15, actual: 15, paymentDate: '1st', paid: true },
  { id: '32', name: 'Pet Healthcare', category: 'HEALTH', projected: 9.50, actual: 9.50, paymentDate: '1st', paid: true },
  { id: '33', name: 'Medicine/Prescriptions', category: 'HEALTH', projected: 12, actual: 12, paymentDate: '1st', paid: true },
  { id: '34', name: 'Therapy', category: 'HEALTH', projected: 50, actual: 50, paymentDate: '1st', paid: true },

  // PAYMENTS
  { id: '35', name: 'FraserPlus', category: 'PAYMENTS', projected: 50, actual: 50, paymentDate: '1st', paid: true },
  { id: '36', name: 'SLC', category: 'PAYMENTS', projected: 5, actual: 5, paymentDate: '1st', paid: true },
  { id: '37', name: 'Sofa', category: 'PAYMENTS', projected: 12.50, actual: 12.50, paymentDate: '1st', paid: true },
  { id: '38', name: 'Klarna Monthly Payments', category: 'PAYMENTS', projected: 70, actual: 70, paymentDate: '1st', paid: true },
  { id: '39', name: 'Vodafone Extra Costs', category: 'PAYMENTS', projected: 0, actual: 0, paymentDate: 'N/A', paid: false },
];

export const DEFAULT_CATEGORIES = ['HOME', 'TRANSPORTATION', 'CREDIT CARDS', 'ENTERTAINMENT', 'HEALTH', 'PAYMENTS'];

export const DEBT_TYPES = [
  'Credit Card', 'Personal Loan', 'Student Loan', 'Car Loan',
  'Store Finance', 'Buy Now Pay Later', 'Hire Purchase',
  'Mortgage', 'Medical Debt', 'Payday Loan',
  'Council Tax', 'Utilities', 'Court Fine', 'Child Maintenance', 'HMRC/Tax',
  'Other',
];

export const SAVINGS_CATEGORIES = [
  'Emergency', 'Holiday', 'Big Purchase', 'Education',
  'Home', 'Retirement', 'Investment', 'Other',
];

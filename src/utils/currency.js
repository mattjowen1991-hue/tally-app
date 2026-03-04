// Currency configuration and formatting utility

export const CURRENCIES = [
  { code: 'GBP', symbol: '£', name: 'British Pound' },
  { code: 'USD', symbol: '$', name: 'US Dollar' },
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'AUD', symbol: 'A$', name: 'Australian Dollar' },
  { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar' },
  { code: 'NZD', symbol: 'NZ$', name: 'New Zealand Dollar' },
  { code: 'SEK', symbol: 'kr', name: 'Swedish Krona' },
  { code: 'NOK', symbol: 'kr', name: 'Norwegian Krone' },
  { code: 'DKK', symbol: 'kr', name: 'Danish Krone' },
  { code: 'CHF', symbol: 'CHF', name: 'Swiss Franc' },
  { code: 'JPY', symbol: '¥', name: 'Japanese Yen' },
  { code: 'INR', symbol: '₹', name: 'Indian Rupee' },
];

export const DEFAULT_CURRENCY = 'GBP';

export function getCurrency(code) {
  return CURRENCIES.find(c => c.code === code) || CURRENCIES[0];
}

export function getSymbol(code) {
  return getCurrency(code).symbol;
}

export function formatAmount(amount, currencyCode) {
  const currency = getCurrency(currencyCode);
  const num = parseFloat(amount) || 0;
  // JPY doesn't use decimals
  const formatted = currency.code === 'JPY' ? Math.round(num).toLocaleString() : num.toFixed(2);
  return `${currency.symbol}${formatted}`;
}

export async function saveCurrencyPreference(code) {
  try {
    await window.storage.set('tally-currency', code);
  } catch (e) {
    console.error('Failed to save currency preference:', e);
  }
}

export async function loadCurrencyPreference() {
  try {
    const result = await window.storage.get('tally-currency');
    if (result?.value && CURRENCIES.find(c => c.code === result.value)) {
      return result.value;
    }
  } catch (e) {}
  return null; // null means no preference set yet (trigger first-time prompt)
}

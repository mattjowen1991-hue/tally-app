// ── Tally CSV Import Utility ──
// Parses bank statement CSVs and detects recurring bills, debts and savings

// ── Known UK bank column formats ──
const BANK_FORMATS = {
  monzo:    { date: ['Date'],           amount: ['Amount'],  description: ['Name', 'Description'] },
  starling: { date: ['Date'],           amount: ['Amount'],  description: ['Counter Party', 'Reference'] },
  barclays: { date: ['Date'],           amount: ['Amount'],  description: ['Memo'] },
  hsbc:     { date: ['Date'],           amount: ['Debit Amount', 'Credit Amount'], description: ['Transaction Description'] },
  lloyds:   { date: ['Transaction Date'], amount: ['Debit Amount', 'Credit Amount'], description: ['Transaction Description'] },
  natwest:  { date: ['Date'],           amount: ['Value'],   description: ['Description'] },
  santander:{ date: ['Date'],           amount: ['Amount'],  description: ['Description'] },
  generic:  { date: ['Date', 'Booking Date', 'Transaction Date', 'Posted Date'],
               amount: ['Amount', 'Debit', 'Credit', 'Debit Amount', 'Credit Amount', 'Value'],
               description: ['Description', 'Narrative', 'Merchant', 'Name', 'Memo', 'Counter Party', 'Transaction Description', 'Reference'] }
};

// ── Merchant exclusion patterns (not bills) ──
const EXCLUSION_PATTERNS = [
  /^(salary|wages|bacs credit|payroll)/i,
  /^(transfer (to|from)|internal transfer|faster payment)/i,
  /^(atm|cash withdrawal|cashpoint)/i,
  /^(direct debit payment|credit card payment|card repayment|payment thank you)/i,
  /^(refund|reversal|chargeback)/i,
  /\b(amex|visa debit refund)\b/i,
];

// ── Known subscription/bill merchants ──
const KNOWN_BILLS = [
  'netflix', 'spotify', 'amazon prime', 'apple', 'disney', 'sky', 'now tv',
  'youtube premium', 'google', 'microsoft', 'adobe', 'dropbox', 'icloud',
  'eon', 'british gas', 'severn trent', 'thames water', 'scottish power',
  'ee', 'vodafone', 'o2', 'three', 'bt', 'virgin media', 'sky broadband',
  'tv licence', 'council tax', 'insurance', 'gym', 'pure gym', 'david lloyd',
  'rent', 'mortgage', 'lease',
];

// ── Known debt merchants ──
const KNOWN_DEBT = [
  'barclayloan', 'barclays loan', 'capital one', 'klarna', 'clearpay', 'laybuy',
  'payl8r', 'paypal credit', 'very', 'next', 'littlewoods', 'creation finance',
  'novuna', 'hitachi', 'zopa', 'funding circle', 'loan repayment', 'finance payment',
];

// ── Known savings merchants ──
const KNOWN_SAVINGS = [
  'marcus', 'chip', 'moneybox', 'plum', 'wealthify', 'nutmeg', 'vanguard',
  'hargreaves', 'isa transfer', 'savings transfer', 'save the change',
  'chase saver', 'first direct', 'premium bonds', 'ns&i',
];

// ── Parse CSV text into rows ──
export function parseCSV(text) {
  const lines = text.trim().split(/\r?\n/);
  if (lines.length < 2) throw new Error('File appears empty or has no data rows.');

  // Detect delimiter
  const firstLine = lines[0];
  const delimiter = firstLine.includes('\t') ? '\t' : firstLine.includes(';') ? ';' : ',';

  const parseRow = (line) => {
    const cols = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') { inQuotes = !inQuotes; continue; }
      if (ch === delimiter && !inQuotes) { cols.push(current.trim()); current = ''; continue; }
      current += ch;
    }
    cols.push(current.trim());
    return cols;
  };

  const headers = parseRow(lines[0]).map(h => h.replace(/^"|"$/g, '').trim());
  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    if (!lines[i].trim()) continue;
    const cols = parseRow(lines[i]);
    const row = {};
    headers.forEach((h, idx) => { row[h] = cols[idx] || ''; });
    rows.push(row);
  }
  return { headers, rows };
}

// ── Auto-detect column mapping ──
function detectColumns(headers) {
  const fmt = BANK_FORMATS.generic;
  const find = (candidates) => candidates.find(c => headers.some(h => h.toLowerCase() === c.toLowerCase()));

  const dateCol   = find(fmt.date);
  const descCol   = find(fmt.description);
  const amountCol = find(fmt.amount);

  // Handle split debit/credit columns
  const debitCol  = headers.find(h => /debit/i.test(h) && !/credit/i.test(h));
  const creditCol = headers.find(h => /credit/i.test(h) && !/debit/i.test(h));

  if (!dateCol || (!amountCol && !debitCol)) {
    throw new Error('Could not detect required columns (Date and Amount). Please check your CSV format.');
  }

  return { dateCol, descCol, amountCol, debitCol, creditCol };
}

// ── Parse a date string into a Date object ──
function parseDate(str) {
  if (!str) return null;
  // Try DD/MM/YYYY
  let m = str.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (m) return new Date(+m[3], +m[2] - 1, +m[1]);
  // Try YYYY-MM-DD
  m = str.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (m) return new Date(+m[1], +m[2] - 1, +m[3]);
  // Try DD-MM-YYYY
  m = str.match(/^(\d{1,2})-(\d{1,2})-(\d{4})$/);
  if (m) return new Date(+m[3], +m[2] - 1, +m[1]);
  // Try DD MMM YYYY
  m = str.match(/^(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})$/);
  if (m) return new Date(Date.parse(str));
  return new Date(str);
}

// ── Normalise merchant name ──
function normaliseMerchant(desc) {
  if (!desc) return '';
  return desc
    .toLowerCase()
    .replace(/\d{4,}/g, '')           // strip long numbers (card/ref numbers)
    .replace(/\s+/g, ' ')
    .replace(/[*#@]/g, '')
    .trim()
    .substring(0, 40);
}

// ── Check if a transaction should be excluded ──
function shouldExclude(desc, amount) {
  if (!desc) return true;
  if (amount > 0) return true; // credits excluded
  if (EXCLUSION_PATTERNS.some(p => p.test(desc))) return true;
  // Round cash amounts likely ATM
  const abs = Math.abs(amount);
  if (abs % 10 === 0 && abs >= 20 && abs <= 500 && /atm|cash|cashpoint/i.test(desc)) return true;
  return false;
}

// ── Main import function ──
export function importCSV(text, maxDays = 180) {
  const { headers, rows } = parseCSV(text);
  const cols = detectColumns(headers);

  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - maxDays);

  const transactions = [];
  let parseFailures = 0;

  for (const row of rows) {
    try {
      const dateStr = row[cols.dateCol] || '';
      const date = parseDate(dateStr);
      if (!date || isNaN(date.getTime())) { parseFailures++; continue; }
      if (date < cutoff) continue;

      let amount;
      if (cols.amountCol) {
        amount = parseFloat((row[cols.amountCol] || '0').replace(/[£,\s]/g, ''));
      } else {
        const debit  = parseFloat((row[cols.debitCol]  || '0').replace(/[£,\s]/g, '')) || 0;
        const credit = parseFloat((row[cols.creditCol] || '0').replace(/[£,\s]/g, '')) || 0;
        amount = credit > 0 ? credit : -debit;
      }
      if (isNaN(amount)) { parseFailures++; continue; }

      const desc = row[cols.descCol] || Object.values(row).join(' ');
      if (shouldExclude(desc, amount)) continue;

      transactions.push({
        date,
        description: desc,
        amount: Math.abs(amount),
        normalised: normaliseMerchant(desc),
      });
    } catch {
      parseFailures++;
    }
  }

  if (transactions.length === 0) {
    throw new Error('No valid transactions found. Please check the file covers the last 6 months and contains outgoing payments.');
  }

  const dates = transactions.map(t => t.date);
  const minDate = new Date(Math.min(...dates));
  const maxDate = new Date(Math.max(...dates));

  return {
    transactions,
    diagnostics: {
      totalRows: rows.length,
      validTransactions: transactions.length,
      parseFailures,
      dateRange: { from: minDate, to: maxDate },
      dayscovered: Math.round((maxDate - minDate) / (1000 * 60 * 60 * 24)),
    }
  };
}

// ── Recurring detection ──
const CADENCES = [
  { name: 'weekly',     min: 6,   max: 8,   label: 'Weekly'     },
  { name: 'fortnightly',min: 13,  max: 15,  label: 'Fortnightly'},
  { name: 'monthly',    min: 27,  max: 35,  label: 'Monthly'    },
  { name: 'quarterly',  min: 85,  max: 98,  label: 'Quarterly'  },
  { name: 'annual',     min: 355, max: 375, label: 'Annual'     },
];

function detectCadence(dates) {
  if (dates.length < 2) return null;
  const sorted = [...dates].sort((a, b) => a - b);
  const gaps = [];
  for (let i = 1; i < sorted.length; i++) {
    gaps.push((sorted[i] - sorted[i - 1]) / (1000 * 60 * 60 * 24));
  }
  const avgGap = gaps.reduce((a, b) => a + b, 0) / gaps.length;
  return CADENCES.find(c => avgGap >= c.min && avgGap <= c.max) || null;
}

function classifyMerchant(normalised) {
  if (KNOWN_DEBT.some(k => normalised.includes(k))) return 'debt';
  if (KNOWN_SAVINGS.some(k => normalised.includes(k))) return 'savings';
  if (KNOWN_BILLS.some(k => normalised.includes(k))) return 'bill';
  return 'bill'; // default
}

function confidenceScore(occurrences, cadence, amounts) {
  let score = 0;
  // Occurrence count (up to 0.4)
  score += Math.min(occurrences / 6, 1) * 0.4;
  // Cadence match quality (0.3)
  if (cadence) score += 0.3;
  // Amount stability (up to 0.3)
  const avg = amounts.reduce((a, b) => a + b, 0) / amounts.length;
  const variance = amounts.reduce((a, b) => a + Math.abs(b - avg), 0) / amounts.length;
  const stability = Math.max(0, 1 - (variance / avg));
  score += stability * 0.3;
  return Math.min(score, 1);
}

export function detectRecurring(transactions) {
  // Group by normalised merchant
  const groups = {};
  for (const t of transactions) {
    const key = t.normalised;
    if (!groups[key]) groups[key] = [];
    groups[key].push(t);
  }

  const suggestions = [];

  for (const [key, txns] of Object.entries(groups)) {
    if (txns.length < 2) continue;

    const dates   = txns.map(t => t.date);
    const amounts = txns.map(t => t.amount);
    const cadence = detectCadence(dates);
    if (!cadence) continue;

    const avgAmount = amounts.reduce((a, b) => a + b, 0) / amounts.length;
    const minAmount = Math.min(...amounts);
    const maxAmount = Math.max(...amounts);
    const confidence = confidenceScore(txns.length, cadence, amounts);
    const type = classifyMerchant(key);

    // Estimate next due date
    const lastDate = new Date(Math.max(...dates));
    const avgGapDays = cadence.min + Math.round((cadence.max - cadence.min) / 2);
    const nextDue = new Date(lastDate);
    nextDue.setDate(nextDue.getDate() + avgGapDays);

    // Build display name from most common description
    const descCount = {};
    txns.forEach(t => { descCount[t.description] = (descCount[t.description] || 0) + 1; });
    const displayName = Object.entries(descCount).sort((a, b) => b[1] - a[1])[0][0];

    suggestions.push({
      id: `suggestion_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      displayName: displayName.substring(0, 50),
      normalisedKey: key,
      type,
      frequency: cadence.name,
      frequencyLabel: cadence.label,
      avgAmount: Math.round(avgAmount * 100) / 100,
      minAmount: Math.round(minAmount * 100) / 100,
      maxAmount: Math.round(maxAmount * 100) / 100,
      occurrences: txns.length,
      lastSeen: lastDate,
      nextDueEstimate: nextDue,
      confidence: Math.round(confidence * 100) / 100,
      confidenceLevel: confidence >= 0.75 ? 'high' : confidence >= 0.45 ? 'medium' : 'low',
      explainer: `Seen ${txns.length} times, every ~${avgGapDays} days, amount range £${minAmount.toFixed(2)}–£${maxAmount.toFixed(2)}`,
    });
  }

  // Sort by confidence descending
  suggestions.sort((a, b) => b.confidence - a.confidence);

  return {
    bills:   suggestions.filter(s => s.type === 'bill'),
    debts:   suggestions.filter(s => s.type === 'debt'),
    savings: suggestions.filter(s => s.type === 'savings'),
  };
}

// ── Universal spreadsheet/budget import ──
// Works on any CSV layout by scanning for amount/name pairs
// regardless of column position — handles Google Sheets, Excel,
// custom templates, and any other structured budget file.

const SHEET_SKIP_NAMES = new Set([
  'total', 'subtotal', 'income', 'expenses', 'savings', 'budget',
  'projected', 'actual', 'difference', 'date', 'amount', 'cost',
  'monthly cost', 'description', 'category', 'notes', 'memo',
  'net', 'balance', 'payment', 'name', 'item', 'bill', 'type',
  'end date', 'amount left', 'summary', 'template', 'grand total',
  'total income', 'total expenses', 'total savings', 'net income',
  'emergency fund', 'transfer to savings', 'credit card payments',
]);

const SHEET_SECTION_MAP = {
  'home': 'HOME', 'housing': 'HOME', 'utilities': 'HOME', 'bills': 'HOME',
  'transport': 'HOME', 'transportation': 'HOME', 'travel': 'HOME',
  'entertainment': 'ENTERTAINMENT', 'leisure': 'ENTERTAINMENT', 'subscriptions': 'ENTERTAINMENT',
  'health': 'HEALTH', 'healthcare': 'HEALTH', 'medical': 'HEALTH',
  'insurance': 'HOME', 'food': 'HOME', 'groceries': 'HOME',
  'personal': 'HOME', 'misc': 'HOME', 'miscellaneous': 'HOME',
  'payments': 'HOME', 'other': 'HOME',
};

const SHEET_DEBT_SIGNALS = [
  'loan', 'overdraft', 'credit card', 'paypal', 'klarna', 'bnpl',
  'finance', 'clearpay', 'laybuy', 'mortgage', 'hire purchase',
  'buy now pay later', 'barclaycard', 'capital one',
];

const SHEET_INCOME_SIGNALS = [
  'salary', 'wages', 'income', 'dividend', 'pension',
  'benefit', 'tax credit', 'refund', 'reimbursement',
];

function sheetLooksLikeAmount(s) {
  if (!s) return false;
  const clean = s.replace(/[£$€,\s]/g, '').trim();
  if (clean === '0' || clean === '0.00' || clean === '') return false;
  try {
    const val = parseFloat(clean);
    return val >= 0.50 && val <= 50000;
  } catch { return false; }
}

function sheetParseAmount(s) {
  if (!s) return 0;
  try { return parseFloat(s.replace(/[£$€,\s]/g, '').trim()) || 0; }
  catch { return 0; }
}

function sheetLooksLikeName(s) {
  if (!s || s.trim().length < 2) return false;
  const t = s.trim();
  if (SHEET_SKIP_NAMES.has(t.toLowerCase())) return false;
  if (sheetLooksLikeAmount(t)) return false;
  if (/^\d+(\.\d+)?$/.test(t)) return false;          // pure number
  if (/^\d{1,2}[/-]\d{1,2}[/-]\d{2,4}$/.test(t)) return false; // date
  if (/^https?:\/\//.test(t)) return false;             // URL
  if (t === t.toUpperCase() && t.length > 15) return false; // long ALL CAPS header
  return true;
}

function sheetParseDay(cells) {
  for (const cell of cells) {
    const m = String(cell).match(/\b(\d{1,2})(st|nd|rd|th)\b/i);
    if (m) {
      const day = parseInt(m[1]);
      if (day >= 1 && day <= 31) return String(day);
    }
  }
  return '';
}

function hasEndDate(cells) {
  // Payment plan indicator — has an end date (DD/MM/YYYY) in the row
  return cells.some(c => /\d{1,2}[/-]\d{1,2}[/-]\d{4}/.test(String(c)));
}

export function detectSpreadsheetFormat(headers, rows) {
  // Key signals of a spreadsheet/budget file vs bank CSV:
  // 1. Many empty header columns
  // 2. No standard bank column names (Date, Amount, Description)
  // 3. Has recognisable section headers in data rows
  const emptyHeaders = headers.filter(h => !h.trim()).length;
  const hasStandardBank = headers.some(h =>
    /^(date|booking date|transaction date|narrative|merchant)$/i.test(h.trim())
  );
  const allRows = rows.map(r => Object.values(r).join(' ').toLowerCase());
  const hasSectionHeaders = allRows.some(r =>
    Object.keys(SHEET_SECTION_MAP).some(k => r.includes(k))
  );
  return (emptyHeaders > 2 || !hasStandardBank) && hasSectionHeaders;
}

export function importSpreadsheet(text) {
  const { rows } = parseCSV(text);
  const bills = [];
  const debts = [];
  const seenNames = new Set();
  let currentCategory = 'HOME';

  for (const row of rows) {
    const cells = Object.values(row).map(c => (c || '').trim());
    const nonEmpty = cells.filter(c => c);

    // Section header — single or small number of cells, no amounts, maps to a category
    if (nonEmpty.length <= 3) {
      for (const c of nonEmpty) {
        const mapped = SHEET_SECTION_MAP[c.toLowerCase()];
        if (mapped) { currentCategory = mapped; break; }
      }
    }

    // Scan each cell for a monetary amount
    for (let i = 0; i < cells.length; i++) {
      if (!sheetLooksLikeAmount(cells[i])) continue;
      const amount = sheetParseAmount(cells[i]);
      if (amount <= 0) continue;

      // Skip payment plan rows (have end dates = finance agreements, not recurring bills)
      if (hasEndDate(cells)) continue;

      // Look left for a name (up to 3 cells)
      let name = null;
      for (let offset = 1; offset <= 3; offset++) {
        const idx = i - offset;
        if (idx >= 0 && sheetLooksLikeName(cells[idx])) {
          name = cells[idx];
          break;
        }
      }

      if (!name) continue;
      const nameLower = name.toLowerCase();
      if (seenNames.has(nameLower)) continue;
      if (SHEET_INCOME_SIGNALS.some(s => nameLower.includes(s))) continue;
      if (nameLower.includes('total') || nameLower.includes('summary')) continue;

      seenNames.add(nameLower);
      const day = sheetParseDay(cells);

      const isDebt = SHEET_DEBT_SIGNALS.some(s => nameLower.includes(s));

      const id = `sheet_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;

      if (isDebt) {
        debts.push({
          id,
          displayName: name,
          normalisedKey: nameLower,
          type: 'debt',
          avgAmount: amount,
          minAmount: amount,
          maxAmount: amount,
          frequency: 'monthly',
          frequencyLabel: 'Monthly',
          confidence: 0.9,
          confidenceLevel: 'high',
          explainer: `From your budget spreadsheet — £${amount.toFixed(2)}`,
          occurrences: 1,
          nextDueEstimate: null,
        });
      } else {
        bills.push({
          id,
          displayName: name,
          normalisedKey: nameLower,
          type: 'bill',
          avgAmount: amount,
          minAmount: amount,
          maxAmount: amount,
          frequency: 'monthly',
          frequencyLabel: 'Monthly',
          paymentDay: day,
          category: currentCategory,
          confidence: 0.9,
          confidenceLevel: 'high',
          explainer: `From your budget spreadsheet — £${amount.toFixed(2)}/month`,
          occurrences: 1,
          nextDueEstimate: null,
        });
      }
    }
  }

  return {
    bills,
    debts,
    savings: [],
    diagnostics: {
      totalRows: rows.length,
      validTransactions: bills.length + debts.length,
      parseFailures: 0,
      format: 'spreadsheet',
      isSpreadsheet: true,
    },
  };
}

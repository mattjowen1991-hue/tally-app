// ── Tally CSV Import Utility ──
// Parses bank statement CSVs and detects recurring bills, debts and savings

// ── Known UK bank column formats ──
const BANK_FORMATS = {
  monzo:    { date: ['Date'],           amount: ['Amount'],  description: ['Name', 'Description'] },
  starling: { date: ['Date'],           amount: ['Amount (GBP)'],  description: ['Counter Party', 'Reference'] },
  barclays: { date: ['Date'],           amount: ['Amount'],  description: ['Memo', 'Description'] },
  hsbc:     { date: ['Date'],           amount: ['Amount', 'Paid Out', 'Paid In'], description: ['Description'] },
  lloyds:   { date: ['Transaction Date'], amount: ['Debit Amount', 'Credit Amount'], description: ['Transaction Description'] },
  natwest:  { date: ['Date'],           amount: ['Value'],   description: ['Description'] },
  santander:{ date: ['Date', 'Transaction date'], amount: ['Amount', 'Debit amount', 'Credit amount'], description: ['Description', 'Transaction description'] },
  nationwide: { date: ['Date'],         amount: ['Paid out', 'Paid in', 'Debits', 'Credits'], description: ['Description', 'Transactions'] },
  chase:    { date: ['Transaction Date'], amount: ['Amount'], description: ['Description'] },
  revolut:  { date: ['Started Date', 'Completed Date'], amount: ['Amount'], description: ['Description'] },
  amex:     { date: ['Date'],           amount: ['Amount'],  description: ['Description', 'Appears On Your Statement As'] },
  generic:  { date: [
      'Date', 'Transaction Date', 'Trans Date', 'TransactionDate', 'Txn Date',
      'Value Date', 'Posting Date', 'Post Date', 'Posted Date', 'Booking Date',
      'Started Date', 'Completed Date', 'Effective Date', 'Booked Date', 'From date',
    ],
    amount: [
      'Amount', 'Value', 'Transaction Amount', 'Sum', 'Amount (GBP)', 'Amount (EUR)', 'Amount (USD)',
      'Debit', 'Credit', 'Debit Amount', 'Credit Amount',
      'Paid out', 'Paid in', 'Paid Out', 'Paid In',
      'Money Out', 'Money In', 'Money out', 'Money in',
      'Debits', 'Credits', 'Outflow', 'Inflow', 'Out', 'In',
      'Withdrawals', 'Deposits', 'DR', 'CR',
    ],
    description: [
      'Description', 'Transaction Description', 'Memo', 'Name', 'Payee',
      'Counter Party', 'Counterparty', 'Narrative', 'Details', 'Transactions',
      'Reference', 'Particulars', 'Merchant', 'Extended Details',
      'Additional Information', 'Appears On Your Statement As',
    ],
  },
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
  // Strip UTF-8 BOM and fix garbled pound signs from Windows-1252/ISO-8859-1
  let cleaned = text.replace(/^\uFEFF/, '').replace(/Â£/g, '£');

  const lines = cleaned.trim().split(/\r?\n/);
  if (lines.length < 2) throw new Error('File appears empty or has no data rows.');

  // Detect delimiter: count occurrences in the first few lines
  const sampleLines = lines.slice(0, Math.min(5, lines.length)).join('');
  const tabCount = (sampleLines.match(/\t/g) || []).length;
  const semiCount = (sampleLines.match(/;/g) || []).length;
  const commaCount = (sampleLines.match(/,/g) || []).length;
  const delimiter = tabCount > commaCount && tabCount > semiCount ? '\t'
    : semiCount > commaCount ? ';' : ',';

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

  let headers = parseRow(lines[0]).map(h => h.replace(/^"|"$/g, '').trim());

  // If the first row is all empty (common in spreadsheet exports), try the second row
  if (headers.every(h => !h) && lines.length > 2) {
    // Use numeric column keys so no data is lost
    headers = headers.map((_, idx) => `_col${idx}`);
  } else {
    // Generate unique keys for empty or duplicate headers
    const seen = {};
    headers = headers.map((h, idx) => {
      const key = h || `_col${idx}`;
      if (seen[key] !== undefined) {
        seen[key]++;
        return `${key}__${seen[key]}`;
      }
      seen[key] = 0;
      return key;
    });
  }

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
// First tries exact matches from known bank formats, then falls back to
// fuzzy keyword matching, then finally tries to sniff column data types.
function detectColumns(headers, rows) {
  const fmt = BANK_FORMATS.generic;
  const findExact = (candidates) => candidates.find(c => headers.some(h => h.toLowerCase() === c.toLowerCase()));

  let dateCol   = findExact(fmt.date);
  let descCol   = findExact(fmt.description);
  let amountCol = findExact(fmt.amount);

  // Handle split debit/credit columns
  let debitCol  = headers.find(h => /debit/i.test(h) && !/credit/i.test(h));
  let creditCol = headers.find(h => /credit/i.test(h) && !/debit/i.test(h));

  // ── Fuzzy fallback: match any header containing key words ──
  if (!dateCol) {
    dateCol = headers.find(h => /date|when|posted|booked|created|effective|started|completed/i.test(h) && !/end\s*date|to\s*date/i.test(h));
  }
  if (!amountCol && !debitCol) {
    amountCol = headers.find(h => /amount|sum|total|cost|price|value|payment|paid|charge|gbp|eur|usd/i.test(h) && !/balance|running|closing|opening/i.test(h));
  }
  if (!descCol) {
    descCol = headers.find(h => /desc|name|payee|merchant|narrat|memo|detail|particular|reference|counterparty|counter.party|vendor|supplier|recipient|who|what|item|bill|transaction(?!\s*date|\s*type)/i.test(h));
  }
  if (!debitCol && !amountCol) {
    debitCol  = headers.find(h => /\b(out|paid\s*out|money\s*out|withdrawal|spend|outflow|debit|dr)\b/i.test(h));
    creditCol = headers.find(h => /\b(in|paid\s*in|money\s*in|deposit|income|received|inflow|credit|cr)\b/i.test(h));
  }

  // ── Data-sniffing fallback: examine actual row data to guess columns ──
  if ((!dateCol || (!amountCol && !debitCol)) && rows && rows.length > 0) {
    const sampleRows = rows.slice(0, Math.min(10, rows.length));

    for (const header of headers) {
      if (dateCol && (amountCol || debitCol) && descCol) break;

      const values = sampleRows.map(r => (r[header] || '').trim()).filter(Boolean);
      if (values.length === 0) continue;

      // Check if column looks like dates
      if (!dateCol) {
        const dateCount = values.filter(v =>
          /^\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}$/.test(v) ||
          /^\d{4}[\/\-]\d{1,2}[\/\-]\d{1,2}$/.test(v) ||
          /^\d{1,2}\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)/i.test(v)
        ).length;
        if (dateCount >= values.length * 0.6) { dateCol = header; continue; }
      }

      // Check if column looks like monetary amounts
      if (!amountCol && !debitCol) {
        const numCount = values.filter(v =>
          /^[-−£$€]?\s*\d{1,3}([,.\s]\d{3})*[.,]\d{2}\s*$/.test(v.replace(/[£$€,\s]/g, '').trim() ? v : '') ||
          /^\d+(\.\d{1,2})?$/.test(v.replace(/[£$€,\s]/g, ''))
        ).length;
        if (numCount >= values.length * 0.6) { amountCol = header; continue; }
      }

      // Check if column looks like descriptions (long text strings)
      if (!descCol) {
        const textCount = values.filter(v => v.length > 3 && /[a-zA-Z]{2,}/.test(v) && !/^\d+(\.\d+)?$/.test(v)).length;
        if (textCount >= values.length * 0.6) { descCol = header; }
      }
    }
  }

  if (!dateCol || (!amountCol && !debitCol)) {
    throw new Error('Could not detect required columns (Date and Amount). Please check your CSV format.');
  }

  return { dateCol, descCol, amountCol, debitCol, creditCol };
}

// ── Parse a date string into a Date object ──
// Month lookup for CSV date parsing
const CSV_MONTHS = {
  jan: 0, january: 0, feb: 1, february: 1, mar: 2, march: 2,
  apr: 3, april: 3, may: 4, jun: 5, june: 5, jul: 6, july: 6,
  aug: 7, august: 7, sep: 8, sept: 8, september: 8, oct: 9, october: 9,
  nov: 10, november: 10, dec: 11, december: 11,
};
const csvMonthIdx = (s) => CSV_MONTHS[s.toLowerCase().replace(/\.$/, '')] ?? CSV_MONTHS[s.toLowerCase().substring(0, 3)] ?? -1;
const csvNormYear = (y) => { const n = parseInt(y); return n < 100 ? 2000 + n : n; };

function parseDate(str) {
  if (!str) return null;
  const s = str.trim().replace(/['"]/g, '');
  let m;

  // ISO: YYYY-MM-DD or YYYY-MM-DDTHH:MM:SS
  m = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (m) return new Date(+m[1], +m[2] - 1, +m[3]);

  // Compact ISO: YYYYMMDD
  m = s.match(/^(\d{4})(\d{2})(\d{2})$/);
  if (m) return new Date(+m[1], +m[2] - 1, +m[3]);

  // DD/MM/YYYY or DD/MM/YY (UK default)
  m = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/);
  if (m) return new Date(csvNormYear(m[3]), +m[2] - 1, +m[1]);

  // DD-MM-YYYY or DD-MM-YY
  m = s.match(/^(\d{1,2})-(\d{1,2})-(\d{2,4})$/);
  if (m) return new Date(csvNormYear(m[3]), +m[2] - 1, +m[1]);

  // DD.MM.YYYY or DD.MM.YY (European)
  m = s.match(/^(\d{1,2})\.(\d{1,2})\.(\d{2,4})$/);
  if (m) return new Date(csvNormYear(m[3]), +m[2] - 1, +m[1]);

  // DD Mon YYYY or DD Mon YY or DD Mon
  m = s.match(/^(\d{1,2})\s+([A-Za-z]+)\s*(\d{2,4})?$/);
  if (m && csvMonthIdx(m[2]) >= 0) return new Date(m[3] ? csvNormYear(m[3]) : new Date().getFullYear(), csvMonthIdx(m[2]), +m[1]);

  // DD Month YYYY (full month: "07 April 2026")
  m = s.match(/^(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})$/);
  if (m && csvMonthIdx(m[2]) >= 0) return new Date(+m[3], csvMonthIdx(m[2]), +m[1]);

  // Mon DD, YYYY or Month DD, YYYY (US: "Apr 07, 2026" or "April 7, 2026")
  m = s.match(/^([A-Za-z]+)\s+(\d{1,2}),?\s+(\d{4})$/);
  if (m && csvMonthIdx(m[1]) >= 0) return new Date(+m[3], csvMonthIdx(m[1]), +m[2]);

  // DDst/DDnd/DDrd/DDth Month YYYY (ordinal: "1st April 2026")
  m = s.match(/^(\d{1,2})(?:st|nd|rd|th)\s+([A-Za-z]+)\s*(\d{2,4})?$/);
  if (m && csvMonthIdx(m[2]) >= 0) return new Date(m[3] ? csvNormYear(m[3]) : new Date().getFullYear(), csvMonthIdx(m[2]), +m[1]);

  // Revolut style: YYYY-MM-DD HH:MM:SS
  m = s.match(/^(\d{4})-(\d{2})-(\d{2})\s+\d{2}:\d{2}/);
  if (m) return new Date(+m[1], +m[2] - 1, +m[3]);

  // Quicken: M/D'YY
  m = s.match(/^(\d{1,2})\/(\d{1,2})'(\d{2})$/);
  if (m) return new Date(csvNormYear(m[3]), +m[1] - 1, +m[2]);

  // Last resort: let JS try
  const d = new Date(s);
  return isNaN(d.getTime()) ? null : d;
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
  const cols = detectColumns(headers, rows);

  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - maxDays);

  const transactions = [];
  let parseFailures = 0;

  // Detect Revolut-style State column to filter out non-completed transactions
  const stateCol = headers.find(h => /^state$/i.test(h.trim()));

  for (const row of rows) {
    try {
      // Skip pending/declined/reverted transactions (Revolut, etc.)
      if (stateCol) {
        const state = (row[stateCol] || '').trim().toUpperCase();
        if (state && state !== 'COMPLETED') continue;
      }

      const dateStr = row[cols.dateCol] || '';
      const date = parseDate(dateStr);
      if (!date || isNaN(date.getTime())) { parseFailures++; continue; }
      if (date < cutoff) continue;

      let amount;
      // Universal amount cleaner: strips currency symbols, commas, spaces, CR/DR, parentheses
      const cleanAmt = (s) => {
        if (!s) return 0;
        const trimmed = s.trim();
        if (!trimmed) return 0;
        const isParens = /^\(.*\)$/.test(trimmed);
        const hasMinus = /^[-−]/.test(trimmed);
        const cleaned = trimmed.replace(/[£$€¥₹,\s()]/g, '').replace(/\s*(CR|DR|D|C)\s*$/i, '').replace(/^[-−]/, '');
        const val = parseFloat(cleaned) || 0;
        // Parentheses or minus = negative (debit), CR = positive (credit)
        if (isParens || hasMinus) return -val;
        return val;
      };
      if (cols.amountCol) {
        amount = cleanAmt(row[cols.amountCol]);
      } else {
        const debit  = cleanAmt(row[cols.debitCol]) || 0;
        const credit = cleanAmt(row[cols.creditCol]) || 0;
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
  if (amounts.length > 0) {
    const avg = amounts.reduce((a, b) => a + b, 0) / amounts.length;
    if (avg > 0) {
      const variance = amounts.reduce((a, b) => a + Math.abs(b - avg), 0) / amounts.length;
      const stability = Math.max(0, 1 - (variance / avg));
      score += stability * 0.3;
    }
  }
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
    const descEntries = Object.entries(descCount).sort((a, b) => b[1] - a[1]);
    const displayName = descEntries.length > 0 ? descEntries[0][0] : key;

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
      explainer: `Seen ${txns.length} times, every ~${avgGapDays} days, amount range £${minAmount.toFixed(2)}-£${maxAmount.toFixed(2)}`,
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
  'food': 'HOME', 'groceries': 'HOME',
  'transport': 'TRANSPORTATION', 'transportation': 'TRANSPORTATION', 'travel': 'TRANSPORTATION',
  'credit card': 'CREDIT CARDS', 'credit card payments': 'CREDIT CARDS', 'credit cards': 'CREDIT CARDS',
  'entertainment': 'ENTERTAINMENT', 'leisure': 'ENTERTAINMENT', 'subscriptions': 'ENTERTAINMENT',
  'health': 'HEALTH', 'healthcare': 'HEALTH', 'medical': 'HEALTH',
  'insurance': 'PAYMENTS', 'payments': 'PAYMENTS', 'payment plans': 'PAYMENTS',
  'personal': 'HOME', 'misc': 'HOME', 'miscellaneous': 'HOME', 'other': 'HOME',
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
          explainer: `From your budget spreadsheet - £${amount.toFixed(2)}`,
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
          explainer: `From your budget spreadsheet - £${amount.toFixed(2)}/month`,
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

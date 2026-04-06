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

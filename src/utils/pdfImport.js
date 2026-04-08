// ── Tally PDF Import Utility ──
// Extracts transactions from UK bank statement PDFs using pdfjs-dist
// Runs entirely on-device — no data sent externally

// pdfjs-dist is loaded lazily to keep the main bundle small
let pdfjsLib = null;
async function getPdfjs() {
  if (!pdfjsLib) {
    pdfjsLib = await import('pdfjs-dist/legacy/build/pdf.mjs');
    // Use Vite's ?url import to get the worker file path for Capacitor WebView
    const workerModule = await import('pdfjs-dist/legacy/build/pdf.worker.mjs?url');
    pdfjsLib.GlobalWorkerOptions.workerSrc = workerModule.default;
  }
  return pdfjsLib;
}

// ── Date parsing ──
// Comprehensive date format support for UK/international bank statements,
// budget spreadsheets, and finance tool exports.

const MONTHS = {
  jan: 0, january: 0, feb: 1, february: 1, mar: 2, march: 2,
  apr: 3, april: 3, may: 4, jun: 5, june: 5, jul: 6, july: 6,
  aug: 7, august: 7, sep: 8, sept: 8, september: 8, oct: 9, october: 9,
  nov: 10, november: 10, dec: 11, december: 11,
};
const monthIndex = (s) => {
  const lower = s.toLowerCase().replace(/\.$/, '');
  return MONTHS[lower] ?? MONTHS[lower.substring(0, 3)] ?? -1;
};
const normYear = (y) => { const n = parseInt(y); return n < 100 ? 2000 + n : n; };

// Month name pattern (abbreviated and full, case-insensitive)
const MON = '(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:t(?:ember)?)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)';

const DATE_PATTERNS = [
  // ISO: YYYY-MM-DD or YYYY-MM-DDTHH:MM:SS
  { regex: /^(\d{4})-(\d{1,2})-(\d{1,2})/,
    parse: (m) => new Date(parseInt(m[1]), parseInt(m[2]) - 1, parseInt(m[3])) },
  // Compact ISO: YYYYMMDD
  { regex: /^(\d{4})(\d{2})(\d{2})(?:\s|$)/,
    parse: (m) => new Date(parseInt(m[1]), parseInt(m[2]) - 1, parseInt(m[3])) },
  // DD/MM/YYYY or DD/MM/YY or D/M/YYYY (UK default)
  { regex: /^(\d{1,2})\/(\d{1,2})\/(\d{2,4})/,
    parse: (m) => new Date(normYear(m[3]), parseInt(m[2]) - 1, parseInt(m[1])) },
  // DD-MM-YYYY or DD-MM-YY
  { regex: /^(\d{1,2})-(\d{1,2})-(\d{2,4})/,
    parse: (m) => new Date(normYear(m[3]), parseInt(m[2]) - 1, parseInt(m[1])) },
  // DD.MM.YYYY or DD.MM.YY (European, German banks)
  { regex: /^(\d{1,2})\.(\d{1,2})\.(\d{2,4})/,
    parse: (m) => new Date(normYear(m[3]), parseInt(m[2]) - 1, parseInt(m[1])) },
  // DD Mon YYYY or DD Mon YY or DD Mon (UK bank PDF statements)
  { regex: new RegExp(`^(\\d{1,2})\\s+(${MON})(?:\\s+(\\d{2,4}))?`, 'i'),
    parse: (m) => { const mi = monthIndex(m[2]); return mi < 0 ? null : new Date(m[3] ? normYear(m[3]) : new Date().getFullYear(), mi, parseInt(m[1])); } },
  // D Mon YYYY (single-digit day, no leading zero)
  { regex: new RegExp(`^(\\d)\\s+(${MON})\\s+(\\d{2,4})`, 'i'),
    parse: (m) => { const mi = monthIndex(m[2]); return mi < 0 ? null : new Date(normYear(m[3]), mi, parseInt(m[1])); } },
  // Mon DD, YYYY or Mon DD YYYY (US format: "Apr 07, 2026")
  { regex: new RegExp(`^(${MON})\\s+(\\d{1,2}),?\\s+(\\d{4})`, 'i'),
    parse: (m) => { const mi = monthIndex(m[1]); return mi < 0 ? null : new Date(parseInt(m[3]), mi, parseInt(m[2])); } },
  // DDst/DDnd/DDrd/DDth Month YYYY (ordinal: "1st April 2026")
  { regex: new RegExp(`^(\\d{1,2})(?:st|nd|rd|th)\\s+(${MON})(?:\\s+(\\d{2,4}))?`, 'i'),
    parse: (m) => { const mi = monthIndex(m[2]); return mi < 0 ? null : new Date(m[3] ? normYear(m[3]) : new Date().getFullYear(), mi, parseInt(m[1])); } },
];

// ── Lines to skip (headers, footers, metadata) ──

const SKIP_PATTERNS = [
  /^page\s+\d/i,
  /^page$/i,
  /^statement\s+(date|period|opening|closing)/i,
  /^(last|next|previous)\s+statement/i,
  /^account\s+(number|name|holder|no)/i,
  /^sort\s+code/i,
  /^(balance\s+)?(brought|carried)\s+forward/i,
  /^(opening|closing|start|end|starting|ending)\s+balance/i,
  /^(balance\s+at\s+(start|end)\s+of)/i,
  /^date\s+(description|details|transaction|type)/i,
  /^(money|paid)\s+(in|out)/i,
  /^(debit|credit)\s*(amount)?$/i,
  /^(payments|receipts|withdrawals|deposits)$/i,
  /^continued/i,
  /^total\s*(debits|credits|payments|receipts|charges)?/i,
  /IBAN|BIC|SWIFT/i,
  /^www\./i,
  /^https?:\/\//i,
  /registered\s+in\s+england/i,
  /authorised\s+(by|and)/i,
  /financial\s+(conduct|services|ombudsman)/i,
  /prudential\s+regulation/i,
  /compensation\s+scheme/i,
  /^barclays\s+bank/i,
  /^hsbc\s+(uk|bank|holdings)/i,
  /^lloyds\s+bank/i,
  /^natwest\s+(group|bank)/i,
  /^santander\s+uk/i,
  /^nationwide\s+building/i,
  /^your\s+(transactions|arranged|deposit|debit\s+card)/i,
  /^at\s+a\s+glance/i,
  /^noticeboard/i,
  /^how\s+it\s+works/i,
  /^get\s+in\s+touch/i,
  /^anything\s+wrong/i,
  /^charges\s+coming\s+up/i,
  /^(here\s+are|credit\s+interest|keeping\s+track|about\s+charges|what.s\s+right)/i,
  /^for\s+a\s+braille/i,
  /^(important\s+information|dispute\s+resolution|using\s+your)/i,
  /^(giro|bank\s+giro|contactless|debit\s+card|direct\s+debit|interest|online)\s*$/i,
  /^\d{4}\s+\d{4}\s+\d{4}\s+\d{4}/, // card numbers
  /^\d{2}-\d{2}-\d{2}\s+•?\s*\d{6,8}/, // sort code + account number
];

// ── Transaction exclusion patterns (not bills — income, transfers, ATM, refunds) ──

const EXCLUDE_PATTERNS = [
  /^(salary|wages|bacs\s+credit|payroll)/i,
  /\b(transfer\s+(to|from)|internal\s+transfer)\b/i,
  /^(atm|cash\s+withdrawal|cashpoint|cash\s+machine|link\s+withdrawal)/i,
  /^(refund|reversal|chargeback)/i,
  /\b(initial\s+deposit|opening\s+balance)\b/i,
  /^(interest\s+charged|overdraft\s+interest|arranged\s+overdraft|unarranged)/i,
  /^(bank\s+fee|account\s+fee|monthly\s+fee|service\s+charge)/i,
  /^(cheque|chq)\b/i,
];

// ── Merchant normalisation ──

function normaliseMerchant(desc) {
  if (!desc) return '';
  return desc
    .toLowerCase()
    .replace(/\d{4,}/g, '')
    .replace(/\s+/g, ' ')
    .replace(/[*#@]/g, '')
    .trim()
    .substring(0, 40);
}

// ── PDF text extraction ──
// Groups text items by Y position to reconstruct rows.
// Detects two-column layouts (common in budget spreadsheets exported to PDF)
// and splits them into separate lines so both columns are parsed.

async function extractTextLines(pdfData) {
  const { getDocument } = await getPdfjs();
  const pdf = await getDocument({ data: pdfData }).promise;
  const allLines = [];

  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    const page = await pdf.getPage(pageNum);
    const textContent = await page.getTextContent();

    // Group text items by Y position (tolerance handles slight vertical offsets)
    const TOLERANCE = 3;
    const lineMap = new Map();

    for (const item of textContent.items) {
      if (!item.str || !item.str.trim()) continue;
      const y = Math.round(item.transform[5] / TOLERANCE) * TOLERANCE;
      if (!lineMap.has(y)) lineMap.set(y, []);
      lineMap.get(y).push({
        x: item.transform[4],
        text: item.str,
        width: item.width || 0,
      });
    }

    // ── Detect two-column layout ──
    // Find large X-gaps that appear consistently across rows — these indicate
    // a left/right column split (e.g. income on left, expenses on right)
    const gapPositions = [];
    for (const items of lineMap.values()) {
      if (items.length < 3) continue;
      const sorted = [...items].sort((a, b) => a.x - b.x);
      for (let i = 1; i < sorted.length; i++) {
        const gap = sorted[i].x - (sorted[i - 1].x + sorted[i - 1].width);
        if (gap > 50) gapPositions.push(sorted[i].x);
      }
    }

    // Find the dominant column split point
    let columnSplitX = null;
    if (gapPositions.length >= 3) {
      const buckets = {};
      for (const x of gapPositions) {
        const bucket = Math.round(x / 15) * 15;
        buckets[bucket] = (buckets[bucket] || 0) + 1;
      }
      const best = Object.entries(buckets).sort((a, b) => b[1] - a[1]);
      if (best[0] && best[0][1] >= 3) {
        columnSplitX = parseInt(best[0][0]);
      }
    }

    // Build a line from a set of sorted text items
    const buildLine = (lineItems) => {
      let line = '';
      for (let i = 0; i < lineItems.length; i++) {
        if (i > 0) {
          const gap = lineItems[i].x - (lineItems[i - 1].x + lineItems[i - 1].width);
          line += gap > 15 ? '  ' : (gap > 3 ? ' ' : '');
        }
        line += lineItems[i].text;
      }
      return line.trim();
    };

    // Sort Y descending (PDF origin is bottom-left)
    const sortedYs = [...lineMap.keys()].sort((a, b) => b - a);

    for (const y of sortedYs) {
      const items = lineMap.get(y).sort((a, b) => a.x - b.x);

      if (columnSplitX) {
        // Two-column: split items by column and emit each as a separate line
        const leftItems = items.filter(it => it.x < columnSplitX - 15);
        const rightItems = items.filter(it => it.x >= columnSplitX - 15);
        const leftLine = buildLine(leftItems);
        const rightLine = buildLine(rightItems);
        if (leftLine) allLines.push(leftLine);
        if (rightLine) allLines.push(rightLine);
      } else {
        const line = buildLine(items);
        if (line) allLines.push(line);
      }
    }
  }

  // ── Post-extraction: split merged two-column lines ──
  // Detects lines like "Salary / Wages 3,174.00 3,174.00 0.00 Eon 25.00 25.00 0.00"
  // Pattern: text + amounts + text + amounts → split into two separate lines
  const splitLines = [];
  const amtPattern = /(\d{1,3}(?:,\d{3})*\.\d{2})/g;

  for (const line of allLines) {
    // Find all amount positions
    const amts = [];
    let am;
    amtPattern.lastIndex = 0;
    while ((am = amtPattern.exec(line)) !== null) {
      amts.push({ index: am.index, end: am.index + am[0].length });
    }

    if (amts.length < 4) {
      // Not enough amounts to be a merged line — keep as-is
      splitLines.push(line);
      continue;
    }

    // Look for a text gap between amount groups:
    // After an amount, if there's alphabetic text before the next amount,
    // it's likely a new item name from a merged second column.
    let splitFound = false;
    for (let i = 0; i < amts.length - 1; i++) {
      const gapStart = amts[i].end;
      const gapEnd = amts[i + 1].index;
      const gapText = line.substring(gapStart, gapEnd).trim()
        .replace(/^[,;.\s]+/, '').replace(/[,;.\s]+$/, ''); // strip leading/trailing punctuation

      // If the gap contains a word (2+ alpha chars), this is where the second column starts
      if (gapText.length >= 2 && /[a-zA-Z]{2,}/.test(gapText)) {
        // Make sure there's meaningful content on both sides
        const leftPart = line.substring(0, gapStart).trim();
        // Reconstruct right part: gap text (the name) + space + remaining amounts
        const rightPart = (gapText + ' ' + line.substring(gapEnd)).replace(/\s+/g, ' ').trim();
        if (leftPart && rightPart.length > 3) {
          splitLines.push(leftPart);
          splitLines.push(rightPart);
          splitFound = true;
          break;
        }
      }
    }

    if (!splitFound) {
      splitLines.push(line);
    }
  }

  return splitLines;
}

// ── Transaction parsing ──
// Stateful multi-line parser for bank statement PDFs.
// Bank statements often split a single transaction across 2-4 lines:
//   "09 Mar Card Payment to Klarna*Argos UK"
//   "On 06 Mar"
//   "9.00"
// This parser accumulates description text across lines until it finds
// an amount, then emits the complete transaction.

const AMOUNT_LINE_REGEX = /^[-−]?\s*£?\s*(\d{1,3}(?:,\d{3})*\.\d{2})\b/;
const AMOUNT_FIND_REGEX = /[-−]?\s*£?\s*(\d{1,3}(?:,\d{3})*\.\d{2})/g;

// Credit/income patterns — these are money IN, not bills
const CREDIT_PATTERNS = [
  /^received\s+from/i,
  /^(bacs|faster\s+payment|giro|bank\s+giro)\s*(credit|receipt|received|in)/i,
  /^(refund|reversal|chargeback|cashback)\b/i,
  /^credit\b/i,
  /^(bgc|fpi|bac)\s/i, // type codes for credits
  /\bsalary\b/i,
  /\bwages\b/i,
  /\bpayroll\b/i,
  /\bdividend\b/i,
  /\bpension\s+payment\b/i,
  /\btax\s+(credit|refund)\b/i,
  /\bchild\s+benefit\b/i,
  /\buniversal\s+credit\b/i,
];

function tryParseDate(line) {
  // Strip leading whitespace before matching, but track offset
  const stripped = line.replace(/^\s+/, '');
  const leadingSpaces = line.length - stripped.length;
  if (leadingSpaces > 10) return null; // too much indent = not a date line
  for (const { regex, parse } of DATE_PATTERNS) {
    const match = stripped.match(regex);
    if (match && match.index === 0) {
      const date = parse(match);
      if (date && !isNaN(date.getTime())) {
        return { date, endIndex: leadingSpaces + match[0].length };
      }
    }
  }
  return null;
}

function extractAmounts(line) {
  const amounts = [];
  let m;
  // Matches: optional negative, optional currency symbol, digits with optional commas, decimal, 2 digits
  // Also handles (1,234.56) parentheses notation and DR/CR suffixes
  const regex = /[-−]?\s*[£$€]?\s*(\d{1,3}(?:,\d{3})*\.\d{2})\s*(?:CR|DR|D|C)?|\(([£$€]?\d{1,3}(?:,\d{3})*\.\d{2})\)/gi;
  while ((m = regex.exec(line)) !== null) {
    const raw = m[1] || m[2];
    if (!raw) continue;
    const value = parseFloat(raw.replace(/[£$€,]/g, ''));
    if (isNaN(value)) continue;
    const isCredit = /CR|C\s*$/i.test(m[0]);
    amounts.push({
      index: m.index,
      value,
      isNegative: /[-−(]/.test(m[0]) || false,
      isCredit,
    });
  }
  return amounts;
}

function cleanDescription(desc) {
  return desc
    .replace(/\s{2,}/g, ' ')
    .replace(/^[\s·\-–—|•►▸]+/, '')
    .replace(/[\s·\-–—|]+$/, '')
    .replace(/\bOn\s+\d{1,2}\s+(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:t(?:ember)?)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\w*/gi, '')
    .replace(/\bRef:\s*\S.*$/i, '') // strip "Ref: ..."
    .replace(/\bMandate\s+No\s*\.?\s*\d+/i, '') // strip "Mandate No 0001"
    .replace(/\bat\s+VISA\s+Exchange\s+Rate.*$/i, '') // strip FX details
    .replace(/\bUSA?\s+USD\s+[\d.,]+/i, '') // strip "USA USD 12.99"
    .replace(/\bThe\s+Final\s+GBP\s+Amount.*$/i, '') // strip "The Final GBP Amount..."
    .replace(/\bIncludes\s+A\s+Non-Sterling.*$/i, '') // strip non-sterling fee text
    .replace(/\b\d{2}-\d{2}-\d{2}\b/g, '') // strip sort codes
    .replace(/\b\d{6,8}\b/g, '') // strip account numbers
    .replace(/\s+/g, ' ')
    .trim();
}

// Strip currency symbols, commas, CR/DR suffixes for amount parsing
function cleanAmountStr(s) {
  return s
    .replace(/[£$€¥₹A-Z]{0,3}\s*/g, '') // currency symbols and codes
    .replace(/,/g, '')
    .replace(/\s*(CR|DR|D|C)\s*$/i, '')
    .trim();
}

function parseTransactions(lines) {
  const transactions = [];

  // State for multi-line accumulation
  let currentDate = null;
  let descParts = [];
  let pendingAmounts = [];

  const flush = () => {
    if (!currentDate || descParts.length === 0 || pendingAmounts.length === 0) {
      // Reset but don't emit
      descParts = [];
      pendingAmounts = [];
      return;
    }

    const description = cleanDescription(descParts.join(' '));
    if (!description || description.length < 2) {
      descParts = [];
      pendingAmounts = [];
      return;
    }

    // Skip metadata, headers, footers
    if (SKIP_PATTERNS.some(p => p.test(description))) {
      descParts = [];
      pendingAmounts = [];
      return;
    }

    // Skip credits/income
    if (CREDIT_PATTERNS.some(p => p.test(description))) {
      descParts = [];
      pendingAmounts = [];
      return;
    }

    // Skip excluded patterns
    if (EXCLUDE_PATTERNS.some(p => p.test(description))) {
      descParts = [];
      pendingAmounts = [];
      return;
    }

    // Determine transaction amount — first amount is usually the transaction
    const txAmount = pendingAmounts[0].value;
    if (txAmount > 0 && txAmount <= 100000) {
      transactions.push({
        date: currentDate,
        description,
        amount: txAmount,
        normalised: normaliseMerchant(description),
      });
    }

    descParts = [];
    pendingAmounts = [];
  };

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.length < 2) continue;

    // Skip obvious metadata
    if (SKIP_PATTERNS.some(p => p.test(trimmed))) continue;

    // Try to parse a date at the start of this line
    const dateResult = tryParseDate(trimmed);

    if (dateResult) {
      // New date line — flush any pending transaction first
      flush();

      currentDate = dateResult.date;
      const rest = trimmed.substring(dateResult.endIndex).trim();

      if (rest) {
        // Line has text after the date — could be "description amount" or just "description"
        const amounts = extractAmounts(rest);
        if (amounts.length > 0) {
          // Date + description + amount(s) all on one line (lucky case)
          const desc = rest.substring(0, amounts[0].index).trim();
          if (desc) descParts.push(desc);
          pendingAmounts = amounts;
          flush();
        } else {
          // Date + description start, amount will come on a later line
          descParts.push(rest);
        }
      }
      // If no rest, it's a date-only line (e.g. "09 Mar") — description follows
      continue;
    }

    // No date on this line — it's either a continuation of description or an amount line
    const amounts = extractAmounts(trimmed);

    if (amounts.length > 0) {
      // Check: is the entire line just amounts (no text before first amount)?
      const textBefore = trimmed.substring(0, amounts[0].index).trim();

      if (!textBefore || textBefore.length < 2) {
        // Pure amount line — attach to current pending transaction
        if (pendingAmounts.length === 0) {
          pendingAmounts = amounts;
        }
        // Flush: we have date + description + amount
        flush();
      } else {
        // Text + amount on same line — could be a new transaction without a date
        // (some statements repeat the last date implicitly)
        // Or it could be description continuation ending with amount
        descParts.push(textBefore);
        pendingAmounts = amounts;
        flush();
      }
    } else {
      // Pure text line — continuation of description
      // Skip known non-description continuation lines
      if (new RegExp(`^On\\s+\\d{1,2}\\s+${MON}`, 'i').test(trimmed)) continue;
      if (/^(Ref:|Overdraft|Sort\s+code|Account\s+(number|no))/i.test(trimmed)) continue;
      if (/^(start|end|opening|closing)\s+balance/i.test(trimmed)) continue;
      if (/^(your\s+(transactions|arranged|deposit)|continued|barclays|hsbc|lloyds|natwest|halifax|santander|nationwide)/i.test(trimmed)) continue;
      if (/^(giro|bank\s+giro|contactless|debit\s+card|direct\s+debit|interest|online)\s*$/i.test(trimmed)) continue;
      if (/^(visa\s+debit|chip\s+and\s+pin|contactless)\s*$/i.test(trimmed)) continue;
      if (/^(date|description|money\s+(out|in)|balance|payments|receipts|debits|credits)\s*$/i.test(trimmed)) continue;
      if (/^page\s*\d/i.test(trimmed)) continue;
      if (/^\d{2}-\d{2}-\d{2}\s*•/.test(trimmed)) continue; // sort code lines

      // Append as description continuation
      if (currentDate) {
        descParts.push(trimmed);
      }
    }
  }

  // Flush any remaining transaction
  flush();

  return transactions;
}

// ── Budget spreadsheet fallback ──
// When no date-based transactions found, scan for "Name Amount Amount" patterns
// (handles budget PDFs like Google Sheets / Excel exports)

const BUDGET_SECTION_MAP = {
  'home': 'HOME', 'housing': 'HOME', 'utilities': 'HOME', 'bills': 'HOME',
  'transport': 'TRANSPORTATION', 'transportation': 'TRANSPORTATION',
  'credit card': 'CREDIT CARDS', 'credit card payments': 'CREDIT CARDS',
  'entertainment': 'ENTERTAINMENT', 'leisure': 'ENTERTAINMENT', 'subscriptions': 'ENTERTAINMENT',
  'health': 'HEALTH', 'healthcare': 'HEALTH', 'medical': 'HEALTH',
  'payments': 'PAYMENTS', 'insurance': 'PAYMENTS',
};

const BUDGET_SKIP = new Set([
  'total', 'subtotal', 'income', 'expenses', 'savings', 'budget',
  'projected', 'actual', 'difference', 'date', 'amount', 'cost',
  'description', 'category', 'notes', 'net', 'balance', 'payment plans',
  'total income', 'total expenses', 'net income', 'budget summary',
  'emergency fund', 'transfer to savings', 'credit cards & overdrafts',
  'salary / wages', 'interest income', 'dividends', 'refunds / reimbursements',
  'business', 'other', 'pension', 'misc.', 'investments', 'education',
  'personal monthly budget template', 'end date', 'monthly cost', 'amount left',
]);

const BUDGET_INCOME = ['salary', 'wages', 'income', 'dividend', 'pension', 'refund', 'reimbursement'];

function parseBudgetLines(lines) {
  const bills = [];
  const seenNames = new Set();
  let currentCategory = 'HOME';
  let pendingName = null; // Name carried from end of previous line

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.length < 3) continue;

    // Look for amounts
    const amountRegex = /(\d{1,3}(?:,\d{3})*\.\d{2})/g;
    const amounts = [];
    let m;
    while ((m = amountRegex.exec(trimmed)) !== null) {
      amounts.push({ index: m.index, value: parseFloat(m[1].replace(/,/g, '')) });
    }

    if (amounts.length === 0) {
      // No amounts — could be a section header or a carried name
      const lower = trimmed.toLowerCase().replace(/\s+/g, ' ');
      let isSection = false;
      for (const [key, cat] of Object.entries(BUDGET_SECTION_MAP)) {
        if (lower === key) { currentCategory = cat; isSection = true; break; }
      }
      // If not a section header, it might be a name waiting for amounts on the next line
      if (!isSection && /[a-zA-Z]{2,}/.test(trimmed) && !BUDGET_SKIP.has(lower) && !BUDGET_INCOME.some(s => lower.includes(s))) {
        pendingName = trimmed;
      }
      continue;
    }

    // Check for text AFTER the last amount — this is a name carried to the next line
    // e.g. "Salary / Wages  3,174.00  3,174.00  0.00 Eon" → "Eon" carries forward
    const lastAmt = amounts[amounts.length - 1];
    const textAfterLastAmount = trimmed.substring(lastAmt.index + lastAmt.value.toFixed(2).length).trim()
      .replace(/^[,;\s.]+/, '').replace(/[,;\s.]+$/, '');
    let trailingName = null;
    if (textAfterLastAmount.length >= 2 && /[a-zA-Z]{2,}/.test(textAfterLastAmount) && !/^\d/.test(textAfterLastAmount)
      && !/(joint\s*account|each\s*month|via\s*phone|paid\s*via)/i.test(textAfterLastAmount)) {
      trailingName = textAfterLastAmount;
    }

    // Determine the item name: either from text before the first amount, or from pending name carried forward
    let name = trimmed.substring(0, amounts[0].index).trim();

    // If no name before amounts but we have a pending name from previous line, use it
    if ((!name || name.length < 2) && pendingName) {
      name = pendingName;
    }
    pendingName = null; // Clear pending regardless

    if (!name || name.length < 2) {
      // Still no name — just set trailing for next iteration and skip
      if (trailingName) pendingName = trailingName;
      continue;
    }

    // Check if this name is actually a section header
    const nameLower = name.toLowerCase().replace(/\s+/g, ' ');
    if (BUDGET_SECTION_MAP[nameLower]) {
      currentCategory = BUDGET_SECTION_MAP[nameLower];
      if (trailingName) pendingName = trailingName;
      continue;
    }

    if (BUDGET_SKIP.has(nameLower)) { if (trailingName) pendingName = trailingName; continue; }
    if (BUDGET_INCOME.some(s => name.toLowerCase().includes(s))) { if (trailingName) pendingName = trailingName; continue; }
    if (/^(total|subtotal|\d)/i.test(name)) { if (trailingName) pendingName = trailingName; continue; }
    if (seenNames.has(name.toLowerCase())) { if (trailingName) pendingName = trailingName; continue; }

    const amount = amounts[0].value;
    if (amount <= 0 || amount > 100000) { if (trailingName) pendingName = trailingName; continue; }

    seenNames.add(name.toLowerCase());

    // Carry trailing name for next line
    if (trailingName) pendingName = trailingName;

    bills.push({
      id: `pdf_budget_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      displayName: name,
      normalisedKey: normaliseMerchant(name),
      type: 'bill',
      avgAmount: amount,
      minAmount: amount,
      maxAmount: amount,
      frequency: 'monthly',
      frequencyLabel: 'Monthly',
      category: currentCategory,
      confidence: 0.85,
      confidenceLevel: 'high',
      explainer: `From your budget — £${amount.toFixed(2)}/month`,
      occurrences: 1,
      nextDueEstimate: null,
    });
  }

  return bills;
}

// ── Main export ──
// Returns the same shape as importCSV() so the rest of the pipeline works unchanged.
// Tries bank statement parsing first, then falls back to budget spreadsheet scanning.

export async function importPDF(pdfData) {
  const lines = await extractTextLines(pdfData);

  if (lines.length === 0) {
    throw new Error(
      'Could not extract any text from this PDF. It may be a scanned image — please try a text-based PDF or export as CSV instead.'
    );
  }

  // Try BOTH parsers and use whichever found more items.
  // A budget PDF might have a few dates in metadata that the bank parser picks up,
  // but the budget parser will find far more items. Vice versa for real bank statements.
  const transactions = parseTransactions(lines);
  const budgetBills = parseBudgetLines(lines);

  const bankCount = transactions.length;
  const budgetCount = budgetBills.length;

  // Use the parser that found more results
  if (bankCount > 0 && bankCount >= budgetCount) {
    const dates = transactions.map(t => t.date);
    const minDate = new Date(Math.min(...dates));
    const maxDate = new Date(Math.max(...dates));

    return {
      transactions,
      diagnostics: {
        totalRows: lines.length,
        validTransactions: bankCount,
        parseFailures: 0,
        dateRange: { from: minDate, to: maxDate },
        dayscovered: Math.round((maxDate - minDate) / (1000 * 60 * 60 * 24)),
        isPDF: true,
      },
    };
  }

  if (budgetCount > 0) {
    return {
      bills: budgetBills,
      debts: [],
      savings: [],
      diagnostics: {
        totalRows: lines.length,
        validTransactions: budgetCount,
        parseFailures: 0,
        isSpreadsheet: true,
        isPDF: true,
      },
    };
  }

  throw new Error(
    'No bills or transactions found in this PDF. Make sure it contains itemised bill names and amounts.'
  );
}

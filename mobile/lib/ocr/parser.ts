// ============================================================
// Pure receipt parser. Takes normalized OcrBlock[] and distills the
// fields PennyWise cares about (merchant, total, date) plus per-item
// rows. No native imports — importable as-is in Jest.
//
// Heuristics, not OCR magic: receipts vary wildly, so each extractor
// is conservative and falls back gracefully to null rather than guess.
// ============================================================

import { OcrBlock, OcrLine, ParseResult, ReceiptLineItem } from './types';

// Money with a currency hint or explicit decimals — e.g. "₦12,500.00",
// "NGN 1,200", "3,499.99". Requiring a thousands separator OR a two-decimal
// tail keeps quantities, dates and phone numbers out of the matches.
const MONEY_RE = /(?:₦|ngn|n)?\s*(\d{1,3}(?:,\d{3})+(?:\.\d{1,2})?|\d+\.\d{2})/gi;

// Naira-first currency detection (this is a NG app).
const CURRENCY_RE = /(₦|\bNGN\b)/i;

// Rows that are never line items.
const NON_ITEM_RE = /\b(sub)?\s*-?\s*total\b|\bchange\b|\bcash\b|\bvat\b|\btax\b|\bbalance\b/i;

const MONTHS: Record<string, number> = {
  jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6,
  jul: 7, aug: 8, sep: 9, oct: 10, nov: 11, dec: 12,
};

function toNumber(raw: string): number {
  return Number(raw.replace(/,/g, ''));
}

/** Every money amount in a string, in reading order. */
function amountsIn(text: string): number[] {
  const out: number[] = [];
  for (const m of text.matchAll(MONEY_RE)) {
    const n = toNumber(m[1]);
    if (Number.isFinite(n)) out.push(n);
  }
  return out;
}

function pad(n: number): string {
  return n < 10 ? `0${n}` : `${n}`;
}

function toIso(year: number, month: number, day: number): string | null {
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;
  const y = year < 100 ? 2000 + year : year;
  return `${y}-${pad(month)}-${pad(day)}`;
}

function findDate(text: string): string | null {
  // yyyy-mm-dd (ISO-ish)
  let m = text.match(/\b(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})\b/);
  if (m) return toIso(Number(m[1]), Number(m[2]), Number(m[3]));

  // dd/mm/yyyy — day-first, the common convention outside the US.
  m = text.match(/\b(\d{1,2})[-/.](\d{1,2})[-/.](\d{2,4})\b/);
  if (m) return toIso(Number(m[3]), Number(m[2]), Number(m[1]));

  // 12 Jun 2026
  m = text.match(/\b(\d{1,2})\s+([A-Za-z]{3,})\.?\s+(\d{2,4})\b/);
  if (m) {
    const mo = MONTHS[m[2].slice(0, 3).toLowerCase()];
    if (mo) return toIso(Number(m[3]), mo, Number(m[1]));
  }

  // Jun 12, 2026
  m = text.match(/\b([A-Za-z]{3,})\.?\s+(\d{1,2}),?\s+(\d{2,4})\b/);
  if (m) {
    const mo = MONTHS[m[1].slice(0, 3).toLowerCase()];
    if (mo) return toIso(Number(m[3]), mo, Number(m[2]));
  }

  return null;
}

/** Merchant ≈ the first non-empty line of the top-most block. */
function findMerchant(blocks: OcrBlock[]): string | null {
  const named = blocks.filter((b) => b.text.trim().length > 0);
  if (named.length === 0) return null;
  const top = named.reduce((a, b) => (b.bounding.top < a.bounding.top ? b : a));
  const firstLine = top.text.split('\n').map((s) => s.trim()).find(Boolean);
  return firstLine ?? top.text.trim() ?? null;
}

/** Total ≈ the amount on an explicit "total" line, else the largest amount. */
function findTotal(lines: OcrLine[], allText: string): number | null {
  const totalLine = lines.find(
    (l) => /\btotal\b/i.test(l.text) && !/sub\s*-?\s*total/i.test(l.text)
  );
  if (totalLine) {
    const amts = amountsIn(totalLine.text);
    if (amts.length) return Math.max(...amts);
  }
  const all = amountsIn(allText);
  return all.length ? Math.max(...all) : null;
}

/** "Description … amount" rows, skipping totals/tax/change lines. */
function extractLineItems(lines: OcrLine[]): ReceiptLineItem[] {
  const items: ReceiptLineItem[] = [];
  for (const line of lines) {
    if (NON_ITEM_RE.test(line.text)) continue;
    const amts = amountsIn(line.text);
    if (amts.length === 0) continue;
    const amount = amts[amts.length - 1]; // trailing amount = the price column
    const description = line.text.replace(MONEY_RE, '').replace(/\s{2,}/g, ' ').trim();
    if (description) items.push({ description, amount });
  }
  return items;
}

export function parseOcrBlocks(blocks: OcrBlock[]): ParseResult {
  // Prefer line-level granularity; fall back to a block's own text as a
  // single synthetic line when the library didn't split it.
  const lines: OcrLine[] = blocks.flatMap((b) =>
    b.lines.length ? b.lines : [{ text: b.text, bounding: b.bounding }]
  );
  const rawText = blocks.map((b) => b.text).filter(Boolean).join('\n');

  return {
    merchant: findMerchant(blocks),
    total: findTotal(lines, rawText),
    currency: CURRENCY_RE.test(rawText) ? 'NGN' : null,
    date: findDate(rawText),
    lineItems: extractLineItems(lines),
    rawText,
  };
}

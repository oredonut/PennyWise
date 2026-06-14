// ============================================================
// Shared parsing helpers used by every app parser.
// Pure functions: regex extraction + UTC date math + spatial
// proximity search over OCR bounding boxes.
// ============================================================

import type { OcrBlock } from './types'

const AMOUNT_CAP = 10_000_000

// Tried in order. The first that matches wins.
const AMOUNT_PATTERNS: ReadonlyArray<RegExp> = [
  /[₦]\s*([\d,]+(?:\.\d{2})?)/,
  /NGN\s*([\d,]+(?:\.\d{2})?)/i,
  /\bN\s*([\d,]+(?:\.\d{2})?)/,
  /\b(\d{1,3}(?:,\d{3})+(?:\.\d{2})?)\b/,
]

/** Extract a positive naira integer, or null if none / out of sane range. */
export function extractAmount(text: string): number | null {
  for (const pattern of AMOUNT_PATTERNS) {
    const match = pattern.exec(text)
    if (!match) continue
    const raw = match[1].replace(/,/g, '')
    const value = Math.floor(parseFloat(raw))
    if (!Number.isFinite(value) || value <= 0 || value > AMOUNT_CAP) return null
    return value
  }
  return null
}

const MONTH_INDEX: Readonly<Record<string, number>> = {
  jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5,
  jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11,
}

function pad2(n: number): string {
  return String(n).padStart(2, '0')
}

/** Build an ISO date, validating the calendar day round-trips (rejects e.g. 31 Feb). */
function isoFromYMD(year: number, monthIndex: number, day: number): string | null {
  if (monthIndex < 0 || monthIndex > 11 || day < 1 || day > 31) return null
  const dt = new Date(Date.UTC(year, monthIndex, day))
  if (dt.getUTCFullYear() !== year || dt.getUTCMonth() !== monthIndex || dt.getUTCDate() !== day) {
    return null
  }
  return `${year}-${pad2(monthIndex + 1)}-${pad2(day)}`
}

function isoFromDate(d: Date): string {
  return `${d.getUTCFullYear()}-${pad2(d.getUTCMonth() + 1)}-${pad2(d.getUTCDate())}`
}

/** Extract the first recognisable date as ISO YYYY-MM-DD, else null. UTC only. */
export function extractDate(text: string, now: Date = new Date()): string | null {
  // 1. DD/MM/YYYY or DD-MM-YYYY
  const numeric = /\b(\d{1,2})[/-](\d{1,2})[/-](\d{4})\b/.exec(text)
  if (numeric) {
    const iso = isoFromYMD(Number(numeric[3]), Number(numeric[2]) - 1, Number(numeric[1]))
    if (iso) return iso
  }

  // 2. DD Mon YYYY  ("12 Jun 2025")
  const dayMonth = /\b(\d{1,2})\s+([A-Za-z]{3,9})\s+(\d{4})\b/.exec(text)
  if (dayMonth) {
    const monthIndex = MONTH_INDEX[dayMonth[2].slice(0, 3).toLowerCase()]
    if (monthIndex !== undefined) {
      const iso = isoFromYMD(Number(dayMonth[3]), monthIndex, Number(dayMonth[1]))
      if (iso) return iso
    }
  }

  // 3. Mon DD, YYYY  ("Jun 12, 2025")
  const monthDay = /\b([A-Za-z]{3,9})\s+(\d{1,2}),?\s+(\d{4})\b/.exec(text)
  if (monthDay) {
    const monthIndex = MONTH_INDEX[monthDay[1].slice(0, 3).toLowerCase()]
    if (monthIndex !== undefined) {
      const iso = isoFromYMD(Number(monthDay[3]), monthIndex, Number(monthDay[2]))
      if (iso) return iso
    }
  }

  // 4 & 5. Relative keywords.
  const lower = text.toLowerCase()
  if (/\btoday\b/.test(lower)) return isoFromDate(now)
  if (/\byesterday\b/.test(lower)) {
    const yest = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - 1))
    return isoFromDate(yest)
  }

  return null
}

const DEBIT_KEYWORDS: ReadonlyArray<string> = [
  'debit', 'dr', 'sent', 'paid', 'payment', 'purchase', 'withdrawal', 'transfer out', 'spent',
]
const CREDIT_KEYWORDS: ReadonlyArray<string> = [
  'credit', 'cr', 'received', 'deposit', 'transfer in', 'fund', 'refund', 'reversal', 'incoming',
]

/** Direction of a transaction. Debits checked first; defaults to debit. */
export function isDebit(text: string): boolean {
  const lower = text.toLowerCase()
  if (DEBIT_KEYWORDS.some((k) => lower.includes(k))) return true
  if (CREDIT_KEYWORDS.some((k) => lower.includes(k))) return false
  return true
}

function verticalMid(block: OcrBlock): number {
  return block.bounding.top + block.bounding.height / 2
}

/**
 * Find the block closest to `target` in the given vertical direction, within
 * `maxDistance` pixels (measured between vertical midpoints). Excludes `target`.
 */
export function findClosestBlock(
  target: OcrBlock,
  blocks: OcrBlock[],
  direction: 'above' | 'below' | 'any',
  maxDistance: number
): OcrBlock | null {
  const targetMid = verticalMid(target)
  let best: OcrBlock | null = null
  let bestDistance = Infinity

  for (const other of blocks) {
    if (other === target) continue
    if (direction === 'above' && !(other.bounding.top < target.bounding.top)) continue
    if (
      direction === 'below' &&
      !(other.bounding.top > target.bounding.top + target.bounding.height)
    ) {
      continue
    }
    const distance = Math.abs(verticalMid(other) - targetMid)
    if (distance <= maxDistance && distance < bestDistance) {
      best = other
      bestDistance = distance
    }
  }

  return best
}

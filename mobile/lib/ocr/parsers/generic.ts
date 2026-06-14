// ============================================================
// Generic parser — the fallback that works on any Nigerian
// payment app. Scans all blocks for naira amounts, then uses
// spatial proximity to attach a merchant and date to each.
// ============================================================

import type { ExtractedTransaction, OcrBlock } from '../types'
import { extractAmount, extractDate, findClosestBlock, isDebit } from '../utils'

const MERCHANT_MAX_ABOVE = 120 // px — how far up to look for a merchant label
const DATE_SEARCH_RADIUS = 200 // px — how far to look for a date / context
const DEDUP_VERTICAL = 20 // px — same-amount blocks this close are one txn

function verticalMid(block: OcrBlock): number {
  return block.bounding.top + block.bounding.height / 2
}

/** Strip "to:" / "from:" labels and collapse whitespace. */
function cleanMerchant(text: string): string {
  return text
    .replace(/^\s*(?:to|from)\s*:?\s*/i, '')
    .replace(/\s+/g, ' ')
    .trim()
}

/** The non-amount, non-empty block closest above `target` within maxDistance. */
function nearestMerchantAbove(target: OcrBlock, blocks: OcrBlock[], maxDistance: number): string | null {
  const candidates = blocks.filter((b) => b.text.trim().length > 0 && extractAmount(b.text) === null)
  const above = findClosestBlock(target, candidates, 'above', maxDistance)
  if (!above) return null
  const cleaned = cleanMerchant(above.text)
  return cleaned.length > 0 ? cleaned : null
}

/** All blocks within `radius` px of `target` (by vertical midpoint), nearest first. */
function blocksWithinRadius(target: OcrBlock, blocks: OcrBlock[], radius: number): OcrBlock[] {
  const targetMid = verticalMid(target)
  return blocks
    .filter((b) => b !== target)
    .map((b) => ({ block: b, distance: Math.abs(verticalMid(b) - targetMid) }))
    .filter((entry) => entry.distance <= radius)
    .sort((a, b) => a.distance - b.distance)
    .map((entry) => entry.block)
}

function computeConfidence(merchant: string | null, date: string | null): ExtractedTransaction['confidence'] {
  if (merchant && date) return 'high'
  if (merchant || date) return 'medium'
  return 'low'
}

export function parseGeneric(blocks: OcrBlock[]): ExtractedTransaction[] {
  const now = new Date()
  const candidates: Array<{ tx: ExtractedTransaction; mid: number }> = []

  for (const block of blocks) {
    const amount = extractAmount(block.text)
    if (amount === null) continue

    const merchant = nearestMerchantAbove(block, blocks, MERCHANT_MAX_ABOVE)

    // Date: prefer the amount block's own text, then nearby blocks (nearest first).
    let date = extractDate(block.text, now)
    if (!date) {
      for (const nearby of blocksWithinRadius(block, blocks, DATE_SEARCH_RADIUS)) {
        const found = extractDate(nearby.text, now)
        if (found) {
          date = found
          break
        }
      }
    }

    // Direction: weigh the amount block plus its surrounding context.
    const context = blocksWithinRadius(block, blocks, DATE_SEARCH_RADIUS)
      .map((b) => b.text)
      .join(' ')
    const type: ExtractedTransaction['type'] = isDebit(`${block.text} ${context}`) ? 'debit' : 'credit'

    candidates.push({
      mid: verticalMid(block),
      tx: {
        amount,
        merchant,
        date,
        type,
        confidence: computeConfidence(merchant, date),
        rawText: block.text,
      },
    })
  }

  // Dedup: same amount within DEDUP_VERTICAL px → keep the first occurrence.
  const kept: Array<{ tx: ExtractedTransaction; mid: number }> = []
  for (const candidate of candidates) {
    const duplicate = kept.some(
      (k) => k.tx.amount === candidate.tx.amount && Math.abs(k.mid - candidate.mid) <= DEDUP_VERTICAL
    )
    if (!duplicate) kept.push(candidate)
  }

  return kept.map((entry) => entry.tx)
}

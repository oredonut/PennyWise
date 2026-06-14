// ============================================================
// OCR parser tests — pure Node, no device/emulator. Fixtures
// mock what ML Kit would return for each Nigerian payment app.
// ============================================================

import { detectApp } from '../detector'
import { extractAmount, extractDate } from '../utils'
import { parseGeneric } from '../parsers/generic'
import type { OcrBlock } from '../types'

// Compact fixture builder. Defaults make single-block detector tests terse.
const blk = (text: string, top = 0, height = 16): OcrBlock => ({
  text,
  bounding: { top, left: 10, width: 160, height },
  lines: [],
})

// A fixed "now" so Today/Yesterday assertions are deterministic (UTC).
const NOW = new Date(Date.UTC(2025, 5, 14)) // 2025-06-14

describe('detectApp', () => {
  it('detects each supported app from its brand signature', () => {
    expect(detectApp([blk('OPay Wallet')])).toBe('opay')
    expect(detectApp([blk('PalmPay Debit Alert')])).toBe('palmpay')
    expect(detectApp([blk('Kuda Bank')])).toBe('kuda')
    expect(detectApp([blk('Moniepoint MFB')])).toBe('moniepoint')
    expect(detectApp([blk('GTBank Mobile')])).toBe('gtbank')
    expect(detectApp([blk('Access Bank')])).toBe('access')
    expect(detectApp([blk('Transfer via UBA app')])).toBe('uba')
    expect(detectApp([blk('United Bank for Africa')])).toBe('uba')
  })

  it('falls back to generic when no brand matches', () => {
    expect(detectApp([blk('Some Random Wallet')])).toBe('generic')
    expect(detectApp([])).toBe('generic')
  })
})

describe('extractAmount', () => {
  it('parses all four Nigerian naira formats', () => {
    expect(extractAmount('₦2,400.00')).toBe(2400)
    expect(extractAmount('NGN 5,000')).toBe(5000)
    expect(extractAmount('N 850')).toBe(850)
    expect(extractAmount('12,500.00')).toBe(12500)
  })

  it('rejects zero and values over the sanity cap', () => {
    expect(extractAmount('₦0')).toBeNull()
    expect(extractAmount('₦15,000,000')).toBeNull()
  })

  it('returns null when there is no amount', () => {
    expect(extractAmount('Chicken Republic')).toBeNull()
    expect(extractAmount('')).toBeNull()
  })
})

describe('extractDate', () => {
  it('parses DD/MM/YYYY and DD-MM-YYYY', () => {
    expect(extractDate('12/06/2025')).toBe('2025-06-12')
    expect(extractDate('12-06-2025')).toBe('2025-06-12')
  })

  it('parses DD Mon YYYY', () => {
    expect(extractDate('12 Jun 2025')).toBe('2025-06-12')
    expect(extractDate('Paid on 12 Jun 2025, 2:34 PM')).toBe('2025-06-12')
  })

  it('parses Mon DD, YYYY', () => {
    expect(extractDate('Jun 12, 2025')).toBe('2025-06-12')
  })

  it('resolves Today and Yesterday in UTC', () => {
    expect(extractDate('Today', NOW)).toBe('2025-06-14')
    expect(extractDate('Yesterday', NOW)).toBe('2025-06-13')
  })

  it('returns null when no date is present', () => {
    expect(extractDate('no date here')).toBeNull()
    expect(extractDate('31/02/2025')).toBeNull() // invalid calendar day
  })
})

// Mock OPay screenshot: two transactions stacked vertically.
const opayBlocks: OcrBlock[] = [
  { text: 'OPay', bounding: { top: 20, left: 10, width: 80, height: 20 }, lines: [] },
  { text: 'Wallet Debit', bounding: { top: 80, left: 10, width: 120, height: 16 }, lines: [] },
  { text: 'Chicken Republic', bounding: { top: 100, left: 10, width: 160, height: 16 }, lines: [] },
  { text: '₦2,400.00', bounding: { top: 120, left: 10, width: 100, height: 24 }, lines: [] },
  { text: '12 Jun 2025, 2:34 PM', bounding: { top: 148, left: 10, width: 180, height: 14 }, lines: [] },
  { text: 'Wallet Debit', bounding: { top: 220, left: 10, width: 120, height: 16 }, lines: [] },
  { text: 'Bolt Technologies', bounding: { top: 240, left: 10, width: 160, height: 16 }, lines: [] },
  { text: '₦850.00', bounding: { top: 260, left: 10, width: 80, height: 24 }, lines: [] },
  { text: '12 Jun 2025, 11:10 AM', bounding: { top: 288, left: 10, width: 180, height: 14 }, lines: [] },
]

describe('parseGeneric — OPay fixture', () => {
  const txns = parseGeneric(opayBlocks)

  it('extracts exactly two transactions', () => {
    expect(txns).toHaveLength(2)
  })

  it('parses both amounts correctly', () => {
    expect(txns.map((t) => t.amount)).toEqual([2400, 850])
  })

  it('classifies both as debit', () => {
    expect(txns.every((t) => t.type === 'debit')).toBe(true)
  })

  it('identifies the merchant above each amount', () => {
    expect(txns[0].merchant).toBe('Chicken Republic')
    expect(txns[1].merchant).toBe('Bolt Technologies')
  })

  it('parses the date near each amount', () => {
    expect(txns[0].date).toBe('2025-06-12')
    expect(txns[1].date).toBe('2025-06-12')
  })

  it('marks fully-resolved transactions as high confidence', () => {
    expect(txns.every((t) => t.confidence === 'high')).toBe(true)
  })
})

describe('parseGeneric — confidence levels', () => {
  it('is medium when merchant is missing but date is found', () => {
    const blocks: OcrBlock[] = [
      { text: '₦1,000.00 Today', bounding: { top: 100, left: 10, width: 140, height: 24 }, lines: [] },
    ]
    const [tx] = parseGeneric(blocks)
    expect(tx.merchant).toBeNull()
    expect(tx.date).not.toBeNull()
    expect(tx.confidence).toBe('medium')
  })

  it('is low when both merchant and date are missing', () => {
    const blocks: OcrBlock[] = [
      { text: '₦500.00', bounding: { top: 100, left: 10, width: 80, height: 24 }, lines: [] },
    ]
    const [tx] = parseGeneric(blocks)
    expect(tx.merchant).toBeNull()
    expect(tx.date).toBeNull()
    expect(tx.confidence).toBe('low')
  })
})

describe('parseGeneric — credit detection & dedup', () => {
  it('classifies a credit when credit keywords dominate', () => {
    const blocks: OcrBlock[] = [
      { text: 'Wallet Credit', bounding: { top: 80, left: 10, width: 120, height: 16 }, lines: [] },
      { text: 'John Doe', bounding: { top: 100, left: 10, width: 120, height: 16 }, lines: [] },
      { text: 'You received ₦3,000.00', bounding: { top: 120, left: 10, width: 180, height: 24 }, lines: [] },
    ]
    const [tx] = parseGeneric(blocks)
    expect(tx.type).toBe('credit')
  })

  it('collapses same-amount blocks within 20px into one', () => {
    const blocks: OcrBlock[] = [
      { text: '₦2,400.00', bounding: { top: 120, left: 10, width: 100, height: 24 }, lines: [] },
      { text: '₦2,400.00', bounding: { top: 128, left: 200, width: 100, height: 24 }, lines: [] },
    ]
    expect(parseGeneric(blocks)).toHaveLength(1)
  })
})

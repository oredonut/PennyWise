import Tesseract from 'tesseract.js'

export type SupportedApp = 'opay' | 'palmpay' | 'unknown'

export type RawTransaction = {
  amount: number
  merchant: string
  date: string
  confidence: 'high' | 'low'
}

export class ExtractError extends Error {
  constructor(message: string, public rawText: string) {
    super(message)
    this.name = 'ExtractError'
  }
}

const NAIRA_AMOUNT = /₦\s*(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/
const BARE_AMOUNT = /\b(\d{1,3}(?:,\d{3})+(?:\.\d{2})?)\b/
const DATE_DMY = /\b(\d{1,2}\s+(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d{4})\b/i
const DATE_ISO = /\b(\d{4}-\d{2}-\d{2})\b/
const DATE_DDMMYYYY = /\b(\d{1,2}\/\d{1,2}\/\d{4})\b/
const DATE_MMMDD = /\b((?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d{1,2})\b/i

function extractAmount(text: string): number | null {
  const naira = text.match(NAIRA_AMOUNT)
  if (naira) {
    const n = parseFloat(naira[1].replace(/,/g, ''))
    return isNaN(n) || n <= 0 ? null : n
  }
  const bare = text.match(BARE_AMOUNT)
  if (bare) {
    const n = parseFloat(bare[1].replace(/,/g, ''))
    return isNaN(n) || n <= 0 ? null : n
  }
  return null
}

function extractDate(text: string): string | null {
  return (
    text.match(DATE_DMY)?.[1] ??
    text.match(DATE_ISO)?.[1] ??
    text.match(DATE_DDMMYYYY)?.[1] ??
    text.match(DATE_MMMDD)?.[1] ??
    null
  )
}

export function detectApp(rawText: string): SupportedApp {
  if (/opay/i.test(rawText)) return 'opay'
  if (/palmpay/i.test(rawText)) return 'palmpay'
  return 'unknown'
}

export function parseOpay(rawText: string): RawTransaction[] {
  const transactions: RawTransaction[] = []
  const lines = rawText.split('\n').map(l => l.trim()).filter(Boolean)
  const seen = new Set<number>()

  for (let i = 0; i < lines.length; i++) {
    if (seen.has(i)) continue

    const winStart = Math.max(0, i - 2)
    const winEnd = Math.min(lines.length - 1, i + 2)
    const block = lines.slice(winStart, winEnd + 1).join('\n')

    if (!/\bdebit\b/i.test(block)) continue
    if (/\bcredit\b|\bfailed\b/i.test(block)) continue

    let amount: number | null = null
    let amountLineAbs = -1
    let date = ''

    for (let j = winStart; j <= winEnd; j++) {
      if (amount === null) {
        const a = extractAmount(lines[j])
        if (a !== null) {
          amount = a
          amountLineAbs = j
        }
      }
      if (!date) {
        const d = extractDate(lines[j])
        if (d) date = d
      }
    }

    if (amount === null || !date) continue

    let merchant = 'Unknown Merchant'
    if (amountLineAbs > 0) {
      const prev = lines[amountLineAbs - 1]
      if (prev && !/\bdebit\b|\bcredit\b|\bfailed\b/i.test(prev) && !/^[₦\d]/.test(prev)) {
        merchant = prev
      }
    }

    transactions.push({
      amount,
      merchant,
      date,
      confidence: merchant !== 'Unknown Merchant' ? 'high' : 'low',
    })

    for (let j = winStart; j <= winEnd; j++) seen.add(j)
  }

  return transactions
}

export function parsePalmPay(rawText: string): RawTransaction[] {
  const transactions: RawTransaction[] = []
  const lines = rawText.split('\n').map(l => l.trim()).filter(Boolean)
  const transferRe = /^(?:Transfer|Payment)\s+to\s+(.+)/i
  const seen = new Set<number>()

  for (let i = 0; i < lines.length; i++) {
    if (seen.has(i)) continue

    const transferMatch = lines[i].match(transferRe)
    if (!transferMatch) continue

    const merchant = transferMatch[1].trim()
    const winEnd = Math.min(lines.length - 1, i + 3)
    const block = lines.slice(i, winEnd + 1).join('\n')

    if (/\breceived\b|\bfailed\b/i.test(block)) continue

    let amount: number | null = null
    let date = ''

    for (let j = i; j <= winEnd; j++) {
      if (amount === null) {
        const a = extractAmount(lines[j])
        if (a !== null) amount = a
      }
      if (!date) {
        const d = extractDate(lines[j])
        if (d) date = d
      }
    }

    if (amount === null || !date) continue

    transactions.push({ amount, merchant, date, confidence: 'high' })

    for (let j = i; j <= winEnd; j++) seen.add(j)
  }

  return transactions
}

export function parseFallback(rawText: string): RawTransaction[] {
  try {
    const transactions: RawTransaction[] = []
    const lines = rawText.split('\n').map(l => l.trim()).filter(Boolean)

    for (let i = 0; i < lines.length; i++) {
      const amount = extractAmount(lines[i])
      if (amount === null) continue

      const merchant = i > 0 ? lines[i - 1] : 'Unknown Merchant'

      let date = extractDate(lines[i]) ?? ''
      if (!date) {
        for (let j = i - 1; j >= Math.max(0, i - 3) && !date; j--) {
          date = extractDate(lines[j]) ?? ''
        }
      }
      if (!date) {
        for (let j = i + 1; j < Math.min(lines.length, i + 3) && !date; j++) {
          date = extractDate(lines[j]) ?? ''
        }
      }

      if (!date) continue

      transactions.push({ amount, merchant, date, confidence: 'low' })
    }

    return transactions
  } catch {
    return []
  }
}

export async function extractTransactionsFromImage(
  imageFile: File | string
): Promise<RawTransaction[]> {
  const result = await Tesseract.recognize(imageFile, 'eng', { logger: () => {} })
  const text = result.data.text

  if (!text || text.trim().length < 20) {
    throw new ExtractError('No text extracted', text ?? '')
  }

  const app = detectApp(text)
  let transactions: RawTransaction[] =
    app === 'opay' ? parseOpay(text) :
    app === 'palmpay' ? parsePalmPay(text) :
    parseFallback(text)

  if (transactions.length === 0) {
    transactions = parseFallback(text)
  }

  return transactions
}
